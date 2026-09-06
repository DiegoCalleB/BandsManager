import express from "express";
import multer from "multer";
import { Song, Setlist, SetlistItem } from "../../src/types.js";
import { loadState, saveState, requireAuth } from "../state.js";
import { getAiClient, generateContentWithFallback } from "../ai.js";
import { safeParseJson } from "../utils.js";
import { getAudioSnippetPath, buildAudioOrTextContents } from "./concert_to_album.js";
import {
  dbGetSongs,
  dbUpsertSong,
  dbDeleteSong,
  dbGetSetlists,
  dbUpsertSetlist,
  dbDeleteSetlist,
  analizarYGuardarDinamicaCancion,
  dbSetSongEnergiaManual,
  dbGetSetlistShortcuts,
  dbUpsertSetlistShortcut,
  dbDeleteSetlistShortcut,
  dbGetEpkConfig,
  dbGetRegisteredBandById,
  dbLogSetlistFeedback
} from "../db.js";

import { getTargetBandId } from "../utils/bandAccess.js";
import { analyzeSetlistWithAI } from "../utils/setlistAIAnalyzer.js";
import { generatePerfectSetlistPlan } from "../utils/perfectSetlistPlanner.js";
import { BandStyleContext } from "../utils/bandStyleContext.js";
import { formatGlobalSetlistFeedbackForPrompt } from "../utils/setlistFeedback.js";
import { parseSetlistFromFile } from "../utils/setlistImport.js";
import { normalizeSongTitle, titlesMatch } from "../../src/utils/songTitleMatch.js";
import { iaRateLimiter } from "../middleware/rateLimiter.js";

// Solo para /setlists/import-from-image: memoria, no disco — el archivo se manda a la IA y se
// descarta, no hace falta persistirlo (a diferencia de /api/upload, que sí guarda para servir
// luego). Límite bajo a propósito: es una foto o un PDF de una hoja de repertorio, no un vídeo.
const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const permitido = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'].includes(file.mimetype);
    if (!permitido) return cb(new Error('Formato no soportado: sube una foto (jpg/png/webp) o un PDF'));
    cb(null, true);
  }
});

// El género/biografía/dossier de booking ya viven en el EPK de la banda (para el press kit que
// se manda a programadores) — en vez de pedirle a la banda que los repita en un campo nuevo solo
// para la IA, se reutilizan aquí como contexto de estilo real. Si el EPK no existe todavía (banda
// recién creada, nunca abrió el módulo de EPK), se manda sin ese contexto — el prompt ya lo contempla.
// También se incluye la memoria de feedback (valoraciones + comentarios de alcance "global" que
// el usuario ha ido dejando en generaciones anteriores) — mismo patrón que el feedback de Reels.
async function getBandStyleContext(bandId: string): Promise<BandStyleContext | null> {
  let epkContext: Partial<BandStyleContext> = {};
  try {
    const epk = await dbGetEpkConfig(bandId);
    if (epk) epkContext = { genero: epk.genero, biografia: epk.biografia, dossierTextoExtra: epk.dossierTextoExtra };
  } catch (err) {
    console.error("Error fetching EPK config for band style context:", err);
  }

  let feedbackMemoryText = '';
  try {
    const registered = await dbGetRegisteredBandById(bandId);
    feedbackMemoryText = formatGlobalSetlistFeedbackForPrompt(registered?.dna_expresion?.historial_feedback_setlist);
  } catch (err) {
    console.error("Error fetching setlist feedback memory for band style context:", err);
  }

  if (Object.keys(epkContext).length === 0 && !feedbackMemoryText) return null;
  return { ...epkContext, feedbackMemoryText };
}

/** Construye las líneas de feedback de ESTE intento concreto (valoraciones + comentario que el
 * usuario acaba de dejar al pulsar "Regenerar") — a diferencia de `feedbackMemoryText` (memoria
 * acumulada de intentos anteriores con alcance "global"), esto es siempre inmediato: se aplica a
 * la generación actual sin importar el alcance elegido. */
function buildImmediateFeedbackLines(feedback?: { comentario?: string; intensidad_rating?: number; contenido_rating?: number }): string {
  if (!feedback) return '';
  const lineas: string[] = [];
  if (feedback.intensidad_rating) lineas.push(`El usuario valoró la INTENSIDAD/energía del plan anterior con ${feedback.intensidad_rating}/5: si es bajo, es justo lo que hay que corregir ahora.`);
  if (feedback.contenido_rating) lineas.push(`El usuario valoró el CONTENIDO/selección de temas del plan anterior con ${feedback.contenido_rating}/5: si es bajo, revisa qué canciones encajan de verdad.`);
  if (feedback.comentario?.trim()) lineas.push(`Instrucción de este intento: "${feedback.comentario.trim()}"`);
  if (lineas.length === 0) return '';
  return `\nFEEDBACK DEL USUARIO SOBRE EL INTENTO ANTERIOR (aplícalo en este):\n${lineas.join('\n')}\n`;
}

/** Registra el feedback (si hay señal real) como memoria para próximas generaciones — solo si
 * `alcance` es "global"; un ajuste puntual ("este_setlist") no debe resurgir en setlists futuros. */
async function logSetlistFeedbackIfPresent(bandId: string, feedback?: { comentario?: string; intensidad_rating?: number; contenido_rating?: number; alcance?: 'este_setlist' | 'global' }): Promise<void> {
  if (!feedback) return;
  const tieneSenal = !!(feedback.comentario?.trim() || feedback.intensidad_rating || feedback.contenido_rating);
  if (!tieneSenal) return;

  const entry = {
    id: `sf-${Date.now()}`,
    fecha: new Date().toISOString(),
    comentario: feedback.comentario?.trim() || '',
    intensidadRating: feedback.intensidad_rating || undefined,
    contenidoRating: feedback.contenido_rating || undefined,
    alcance: feedback.alcance === 'este_setlist' ? 'este_setlist' : 'global'
  };
  await dbLogSetlistFeedback(bandId, entry).catch((err) =>
    console.warn("Notice dbLogSetlistFeedback:", err?.message || err)
  );
}

const router = express.Router();

// GET all songs
router.get("/songs", requireAuth, async (req, res) => {
  try {
    const userBandId = getTargetBandId(req);
    const user = (req as any).user;
    console.log(`[Repertorio] GET /songs para usuario ${user?.email} band: ${userBandId}`);
    const songs = await dbGetSongs(userBandId);
    res.json({ success: true, songs });
  } catch (err: any) {
    console.error("Error fetching songs:", err);
    res.status(500).json({ error: "Error al obtener canciones", songs: [] });
  }
});

// POST new song
router.post("/songs", requireAuth, async (req, res) => {
  try {
    const newSong: Song = req.body;
    if (!newSong.titulo) {
      return res.status(400).json({ error: "El título del tema es obligatorio." });
    }
    const userBandId = getTargetBandId(req);
    if (!(newSong as any).band_id) {
      (newSong as any).band_id = userBandId;
    }
    if (!newSong.id) {
      newSong.id = `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    }
    
    const saved = await dbUpsertSong(newSong, userBandId);
    res.json({ success: true, song: saved });
  } catch (err: any) {
    console.error("Error creating song:", err);
    res.status(500).json({ error: "Error al guardar la canción." });
  }
});

// PUT update song
router.put("/songs/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userBandId = getTargetBandId(req);
    const updatedFields: Partial<Song> = req.body;
    const merged = { ...updatedFields, id, band_id: userBandId };
    const saved = await dbUpsertSong(merged, userBandId);

    res.json({ success: true, song: saved });
  } catch (err: any) {
    console.error("Error updating song:", err);
    res.status(500).json({ error: "Error al actualizar la canción." });
  }
});

// POST analizar dinámica interna del audio de un tema (partes lentas/rápidas dentro del mismo
// tema). Normalmente esto se dispara solo al guardar la canción con audio nuevo (ver
// dbUpsertSong); esta ruta es la repesca manual para canciones antiguas ya subidas antes de
// que existiera esta feature, usada por el botón "Analizar dinámica de todo el repertorio".
router.post("/songs/:id/analizar-dinamica", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userBandId = getTargetBandId(req);
    const audioUrl = req.body?.audioUrl;
    if (!audioUrl) {
      return res.status(400).json({ error: "La canción no tiene audio principal para analizar." });
    }

    const { variacion, audioAnalizable } = await analizarYGuardarDinamicaCancion(id, audioUrl, userBandId);
    res.json({ success: true, variacionDetectada: variacion, audioAnalizable });
  } catch (err: any) {
    console.error("Error analizando dinámica interna de la canción:", err);
    res.status(500).json({ error: err?.message || "No se pudo analizar la dinámica del audio." });
  }
});

// PATCH fijar a mano la energía (1-20) de una canción. El frontend expone una escala 1-10 (más
// fácil de puntuar), duplicada a 1-20 antes de llegar aquí. Marca energia_manual: true para que
// el recalibrado automático desde audio (recalibrarEnergiasDelRepertorio) deje de tocar esta
// canción en futuros análisis de otros temas del repertorio.
router.patch("/songs/:id/energia", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userBandId = getTargetBandId(req);
    const energia = Number(req.body?.energia);
    if (!Number.isFinite(energia) || energia < 1 || energia > 20) {
      return res.status(400).json({ error: "Energía inválida (debe ser 1-20)." });
    }
    const saved = await dbSetSongEnergiaManual(id, Math.round(energia), userBandId);
    res.json({ success: true, song: saved });
  } catch (err: any) {
    console.error("Error fijando energía manual de la canción:", err);
    res.status(500).json({ error: err?.message || "No se pudo actualizar la energía." });
  }
});

// DELETE song
router.delete("/songs/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userBandId = getTargetBandId(req);
    await dbDeleteSong(id, userBandId);

    res.json({ success: true, id });
  } catch (err: any) {
    console.error("Error deleting song:", err);
    res.status(500).json({ error: "Error al eliminar la canción." });
  }
});

// GET all setlists
router.get("/setlists", requireAuth, async (req, res) => {
  try {
    const userBandId = getTargetBandId(req);
    const setlists = await dbGetSetlists(userBandId);
    res.json({ success: true, setlists });
  } catch (err: any) {
    console.error("Error fetching setlists:", err);
    res.status(500).json({ error: "Error al obtener repertorios", setlists: [] });
  }
});

// POST new setlist
router.post("/setlists", requireAuth, async (req, res) => {
  try {
    const newSetlist: Setlist = req.body;
    if (!newSetlist.nombre) {
      return res.status(400).json({ error: "El nombre del repertorio es obligatorio." });
    }
    const userBandId = getTargetBandId(req);
    if (!(newSetlist as any).band_id) {
      (newSetlist as any).band_id = userBandId;
    }
    if (!newSetlist.id) {
      newSetlist.id = `setlist-${Date.now()}`;
    }

    const today = new Date().toISOString().split('T')[0];
    newSetlist.fechaCreacion = newSetlist.fechaCreacion || today;
    newSetlist.fechaUltimaEdicion = today;

    const saved = await dbUpsertSetlist(newSetlist, userBandId);
    res.json({ success: true, setlist: saved });
  } catch (err: any) {
    console.error("Error creating setlist:", err);
    res.status(500).json({ error: "Error al crear el repertorio." });
  }
});

// PUT update setlist
router.put("/setlists/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userBandId = getTargetBandId(req);
    const updatedFields: Partial<Setlist> = req.body;
    const today = new Date().toISOString().split('T')[0];
    const merged = { ...updatedFields, id, band_id: userBandId, fechaUltimaEdicion: today };

    const saved = await dbUpsertSetlist(merged, userBandId);
    res.json({ success: true, setlist: saved });
  } catch (err: any) {
    console.error("Error updating setlist:", err);
    res.status(500).json({ error: "Error al actualizar el repertorio." });
  }
});

// DELETE setlist
router.delete("/setlists/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userBandId = getTargetBandId(req);
    await dbDeleteSetlist(id, userBandId);

    res.json({ success: true, id });
  } catch (err: any) {
    console.error("Error deleting setlist:", err);
    res.status(500).json({ error: "Error al eliminar el repertorio." });
  }
});

// GET all custom "quick add" shortcuts for the active band
router.get("/setlist-shortcuts", requireAuth, async (req, res) => {
  try {
    const userBandId = getTargetBandId(req);
    const shortcuts = await dbGetSetlistShortcuts(userBandId);
    res.json({ success: true, shortcuts });
  } catch (err: any) {
    console.error("Error fetching setlist shortcuts:", err);
    res.status(500).json({ error: "Error al obtener los accesos rápidos", shortcuts: [] });
  }
});

// POST new custom shortcut
router.post("/setlist-shortcuts", requireAuth, async (req, res) => {
  try {
    const { icono, etiqueta, tituloCustom, duracionEstimadaMinutos, duracionEstimadaSegundos, notaTema } = req.body;
    if (!etiqueta || !String(etiqueta).trim()) {
      return res.status(400).json({ error: "La etiqueta del acceso rápido es obligatoria." });
    }
    const userBandId = getTargetBandId(req);
    const saved = await dbUpsertSetlistShortcut(
      { icono, etiqueta, tituloCustom, duracionEstimadaMinutos, duracionEstimadaSegundos, notaTema },
      userBandId
    );
    res.json({ success: true, shortcut: saved });
  } catch (err: any) {
    console.error("Error creating setlist shortcut:", err);
    res.status(500).json({ error: "Error al guardar el acceso rápido." });
  }
});

// DELETE custom shortcut
router.delete("/setlist-shortcuts/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userBandId = getTargetBandId(req);
    await dbDeleteSetlistShortcut(id, userBandId);
    res.json({ success: true, id });
  } catch (err: any) {
    console.error("Error deleting setlist shortcut:", err);
    res.status(500).json({ error: "Error al eliminar el acceso rápido." });
  }
});

// POST generate AI chord sheet and substitute guide
router.post("/generate-song-chords", requireAuth, async (req, res) => {
  try {
    const { songId, titulo, tonalidad, bpm, afinacion, notasInternas, esVersionCovers, artista, audioUrl } = req.body;

    if (!titulo) {
      return res.status(400).json({ error: "El título de la canción es requerido." });
    }

    const aiClient = getAiClient();
    let generatedChords: string | null = null;
    let generatedGuide: any = null;
    let esAproximado = false;
    // De dónde sale de verdad el cifrado, para que el cliente nunca confunda una transcripción
    // real, una propuesta honesta de la IA y la plantilla de relleno cuando todo lo demás falla.
    let chordsSource: 'audio_real' | 'ia_sin_audio' | 'plantilla_generica' = 'plantilla_generica';

    if (aiClient) {
      try {
        // Resolvemos el audio ANTES de escribir el prompt: solo si hay una pista real
        // podemos pedirle a la IA que transcriba lo que suena. Sin esto el prompt le diría
        // "tienes el audio adjunto" aunque no se le mande nada, invitándole a inventar.
        // allowSyntheticFallback:false evita que nos devuelva un tono de prueba.
        const snippetPath = audioUrl
          ? await getAudioSnippetPath({ audioUrl, allowSyntheticFallback: false })
          : null;
        const tieneAudioReal = Boolean(snippetPath);

        const audioInstructions = tieneAudioReal
          ? `Tienes adjunto el audio REAL de la canción. Escúchalo con máxima atención y transcribe la LETRA EXACTA cantada y los ACORDES REALES que suenan (no los inventes). Si el audio no permite distinguir alguna parte con certeza, indícalo con [?] en vez de inventar.`
          : esVersionCovers
          ? `No se dispone del audio de esta versión/cover: dependes solo de lo que sepas de la canción original. Transcribe acordes como "acordes reales" ÚNICAMENTE si estás genuinamente seguro de ellos. Si no los recuerdas con confianza, NO te los inventes presentándolos como transcripción fiable: pon "esAproximado": true en el JSON de respuesta y antepón a cifradoTexto la línea "[⚠️ Progresión aproximada de memoria, no confirmada — verifica de oído antes de usarla en directo]".`
          : `No se dispone del audio de la canción; es una composición original, así que genera la mejor propuesta posible a partir del contexto (título, tonalidad, tipo).`;

        const prompt = `Eres un músico profesional, transcriptor y arreglista. Genera el cifrado de acordes con letra completo al estilo LaCuerda.net / Ultimate Guitar para la siguiente canción:
Título: "${titulo}"
${artista ? `Artista/Banda: "${artista}"` : ''}
${tonalidad ? `Tonalidad Base: "${tonalidad}"` : ''}
${bpm ? `Tempo (BPM): ${bpm}` : ''}
${afinacion ? `Afinación: "${afinacion}"` : ''}
${notasInternas ? `Notas internas del grupo: "${notasInternas}"` : ''}
${esVersionCovers ? `Tipo: Versión / Cover` : `Tipo: Canción Original`}

${audioInstructions}

Requisitos estrictos del formato cifradoTexto:
1. Utiliza acordes estándar en notación española o internacional (ej. Do, Re, Mim, Sol, Lam, Fa#m o C, D, Em, G, Am, F#m).
2. Pon los acordes usando la notación inline [Acorde] justo delante de las palabras o sílabas donde cambian de armonía, o bien en la línea superior alineados con espacios.
3. Estructura con secciones claras: [Intro], [Verso 1], [Estribillo], [Verso 2], [Puente], [Solo], [Outro].
4. Si la canción es un tema conocido o cover, transcribe sus acordes reales solo cuando estés seguro de ellos (ver instrucción anterior sobre "esAproximado"). Si es un tema original, crea una progresión armónica profesional y letra acorde a la tonalidad ${tonalidad || 'Mim'}.

Genera también la Guia de Sustitución Rápida (guiaSustituto) para un músico de apoyo o sustituto de última hora.

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura:
{
  "cifradoTexto": "[Intro]\\n[Mim]  [Do]  [Re]  [Mim]...",
  "esAproximado": false,
  "guiaSustituto": {
    "estructura": "Intro (4T) -> Verso 1 -> Estribillo -> Verso 2 -> Estribillo -> Solo -> Outro",
    "progresionClave": "Verso: Mim - Do | Estribillo: Sol - Re - Mim - Do",
    "cortesYClaves": "Corte seco en compás 8 del puente. Bajar dinámica en verso 2.",
    "capoTraste": "Sin Capo (o Capo 2 si aplica)",
    "instrumentosClave": "Batería entra en compás 5, guitarra arpegia en verso"
  }
}`;

        let contents: any = [{ role: 'user', parts: [{ text: prompt }] }];

        if (tieneAudioReal) {
          const audioContents = buildAudioOrTextContents(
            snippetPath,
            prompt,
            "Audio no disponible en el servidor, genera la mejor propuesta posible a partir del título y contexto."
          );
          // buildAudioOrTextContents returns either a multimodal array or a plain string fallback;
          // normalize both into the { role, parts } shape generateContentWithFallback expects.
          contents = Array.isArray(audioContents)
            ? [{ role: 'user', parts: audioContents }]
            : [{ role: 'user', parts: [{ text: audioContents }] }];
        }

        const aiRes = await generateContentWithFallback(aiClient, {
          contents,
          config: {
            responseMimeType: "application/json"
          }
        });

        const responseText = aiRes?.text || aiRes?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const parsed = safeParseJson(responseText);
        if (parsed && parsed.cifradoTexto) {
          generatedChords = parsed.cifradoTexto;
          generatedGuide = parsed.guiaSustituto;
          esAproximado = Boolean(parsed.esAproximado);
          chordsSource = tieneAudioReal ? 'audio_real' : 'ia_sin_audio';
        }
      } catch (aiErr: any) {
        console.warn("[Gemini API] Could not generate chords via AI, using harmonic engine fallback:", aiErr?.message || aiErr);
      }
    }

    // High quality harmonic engine fallback if Gemini is offline or not configured
    if (!generatedChords) {
      const key = tonalidad || 'Mim';
      const cleanKey = key.replace(/[^a-zA-Z#b]/g, '').trim() || 'Mim';
      const isMinor = cleanKey.toLowerCase().includes('m') || cleanKey.toLowerCase().includes('min');
      
      const rootChord = cleanKey;
      const subChord = isMinor ? 'Do' : 'Fa';
      const domChord = isMinor ? 'Re' : 'Sol';
      const relChord = isMinor ? 'Sol' : 'Lam';

      generatedChords = `[Intro]
[${rootChord}]   [${subChord}]   [${domChord}]   [${rootChord}]
[${rootChord}]   [${subChord}]   [${domChord}]   [${rootChord}]

[Verso 1]
[${rootChord}] Arrancamos la noche en la [${subChord}] ciudad
[${domChord}] Buscando el sonido de la [${rootChord}] libertad
[${rootChord}] Guitarras encendidas y el [${subChord}] viento a favor
[${domChord}] Marcando el ritmo con el [${rootChord}] corazón.

[Estribillo]
[${relChord}] Siente la fuerza del [${domChord}] directo en las venas
[${rootChord}] Rompiendo juntos todas las [${subChord}] cadenas
[${relChord}] Noche de escenario, [${domChord}] fuego y pasión
[${rootChord}] Cantando juntos la [${subChord}] misma canción.

[Verso 2]
[${rootChord}] El público despierta al [${subChord}] compás
[${domChord}] No miramos el reloj ni [${rootChord}] marcha atrás
[${rootChord}] Cada nota suena con [${subChord}] intensidad
[${domChord}] Esta es nuestra única [${rootChord}] verdad.

[Solo]
[${subChord}]   [${domChord}]   [${rootChord}]   [${rootChord}]
[${subChord}]   [${domChord}]   [${rootChord}]   [${rootChord}]

[Outro]
[${subChord}]   [${domChord}]   [${rootChord}]
Final con parada seca al compás 4 en [${rootChord}].`;

      generatedGuide = {
        estructura: `Intro (4T) -> Verso 1 -> Estribillo -> Verso 2 -> Estribillo -> Solo (${rootChord}) -> Outro`,
        progresionClave: `Verso: ${rootChord} - ${subChord} - ${domChord} - ${rootChord} | Estribillo: ${relChord} - ${domChord} - ${rootChord} - ${subChord}`,
        cortesYClaves: `Corte seco al final del Solo en el compás 8. Bajar dinámica en Verso 2.`,
        capoTraste: afinacion || 'Sin Capo / Afinación Estándar E',
        instrumentosClave: `Batería marca entrada en compás 4 de la Intro. Arreglos de vientos/lead en estribillo.`
      };
    }

    // Persistimos el cifrado en la canción. Las canciones nuevas se crean directamente en
    // Supabase (POST /songs no pasa por loadState), así que buscarlas solo en el estado en
    // fichero dejaba sin guardar justo el caso más común: el análisis automático al subir
    // audio. Leemos la canción de BD y guardamos el registro COMPLETO: dbUpsertSong
    // reconstruye la fila con valores por defecto, así que un upsert parcial borraría
    // título, duración y tonalidad.
    let persisted = false;
    if (songId) {
      const userBandId = getTargetBandId(req);
      try {
        const songs = await dbGetSongs(userBandId);
        const song = Array.isArray(songs) ? songs.find((s: any) => s.id === songId) : null;
        if (song) {
          await dbUpsertSong(
            { ...song, cifradoTexto: generatedChords, guiaSustituto: generatedGuide },
            userBandId
          );
          persisted = true;
        } else {
          console.warn(`[generate-song-chords] Canción ${songId} no encontrada en BD; no se persiste el cifrado.`);
        }
      } catch (dbErr: any) {
        console.error("[generate-song-chords] Error al persistir el cifrado:", dbErr?.message || dbErr);
      }

      // Mantenemos sincronizado el estado en fichero cuando esta banda lo usa.
      try {
        const state = loadState();
        const songIndex = state.songs?.findIndex((s: Song) => s.id === songId) ?? -1;
        if (songIndex !== -1) {
          state.songs[songIndex].cifradoTexto = generatedChords;
          state.songs[songIndex].guiaSustituto = generatedGuide;
          saveState(state);
        }
      } catch (stateErr: any) {
        console.warn("[generate-song-chords] No se pudo actualizar el estado local:", stateErr?.message || stateErr);
      }
    }

    res.json({
      success: true,
      cifradoTexto: generatedChords,
      guiaSustituto: generatedGuide,
      // El cliente necesita saber si esto quedó guardado en servidor o solo vive en su copia local.
      persisted,
      // De dónde sale de verdad el cifrado: transcripción de audio real, propuesta honesta de la
      // IA sin audio, o la plantilla de relleno cuando ninguna IA respondió. El cliente no debe
      // presentar estos tres casos como si fueran el mismo "cifrado propuesto".
      chordsSource,
      // Mantenido por compatibilidad con clientes existentes.
      fromRealAudio: chordsSource === 'audio_real',
      // Si la propia IA ha marcado el cifrado como no confirmado (cover sin audio, de memoria).
      esAproximado
    });
  } catch (err: any) {
    console.error("Error in generate-song-chords:", err);
    res.status(500).json({ error: err?.message || "Error al generar los acordes." });
  }
});

// POST AI Composer & Real Musician Arrangement Idea
router.post("/ai-composer-arrangement", requireAuth, async (req, res) => {
  try {
    const { titulo, tonalidad, bpm, estiloMusico, objetivoIdea, seccionCancion, tiempoMinuto, promptUsuario, cifradoTexto } = req.body;

    if (!titulo) {
      return res.status(400).json({ error: "El título de la canción es requerido." });
    }

    const aiClient = getAiClient();
    if (!aiClient) {
      return res.status(500).json({ error: "El servicio de IA no está configurado." });
    }

    const prompt = `Eres un músico profesional de sesión, productor y co-autor de una banda independiente. Estás colaborando con la banda en el estudio de ensayo.
Canción: "${titulo}"
Tonalidad: "${tonalidad || 'Mim'}"
Tempo: ${bpm || 120} BPM
Parte de la canción seleccionada: ${seccionCancion || 'General'}
Momento / Minuto de aplicación: ${tiempoMinuto || 'Toda la canción / Inicio'}
Rol del Músico IA: ${estiloMusico || 'Productor y Arreglista General'}
Objetivo de la Idea: ${objetivoIdea || 'Crear un nuevo arreglo o gancho instrumental'}
${promptUsuario ? `Instrucción específica del músico/banda: "${promptUsuario}"` : ''}
${cifradoTexto ? `Estructura y acordes actuales:\n${cifradoTexto}` : ''}

Aporta una idea creativa, original y profesional de músico real específicamente diseñada para la parte de la canción "${seccionCancion || 'General'}" (en torno al minuto/compás ${tiempoMinuto || 'indicado'}). 

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
{
  "tituloIdea": "Título corto y molón para la idea (ej: Riff de Intro [01:15] Sincopado)",
  "instrumentoRol": "Guitarra Líder / Bajo / Teclados / Producción",
  "descripcionArreglo": "Explicación detallada de cómo tocar el arreglo, qué intención aporta exactamente en la sección ${seccionCancion || 'General'} (${tiempoMinuto || 'minuto indicado'}), notas de producción y compases.",
  "tablaturaOAcordes": "Ej: [${seccionCancion || 'Sección'}] e|-----------------| B|---7-8-10-8-7----| o progresión armónica sugerida",
  "notasParaBanda": "Consejo directo para grabar esta idea en el estudio"
}`;

    const aiRes = await generateContentWithFallback(aiClient, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = aiRes?.text || aiRes?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const parsed = safeParseJson(responseText);

    if (!parsed || !parsed.tituloIdea) {
      return res.status(500).json({ error: "La IA no pudo generar una idea válida." });
    }

    res.json({
      success: true,
      idea: parsed
    });
  } catch (err: any) {
    console.error("Error in ai-composer-arrangement:", err);
    res.status(500).json({ error: err?.message || "Error al generar arreglo con IA." });
  }
});

// POST analyze setlist with AI (advanced level)
router.post("/setlists/:setlistId/analyze-with-ai", requireAuth, async (req, res) => {
  try {
    const userBandId = getTargetBandId(req);
    const { setlistId } = req.params;

    // Obtener el setlist desde la base de datos
    const allSetlists = await dbGetSetlists(userBandId);
    const setlist = allSetlists.find((s: any) => s.id === setlistId);
    if (!setlist) {
      return res.status(404).json({ error: "Setlist no encontrado" });
    }

    const allSongs = await dbGetSongs(userBandId);
    const setlistSongs = setlist.items
      .map((item: SetlistItem, idx: number) => {
        const song = allSongs.find((s) => s.id === item.songId);
        return song ? { ...song, position: idx + 1 } : null;
      })
      .filter(Boolean);

    if (setlistSongs.length === 0) {
      return res.status(400).json({ error: "El setlist no tiene canciones" });
    }

    // Llamar a análisis IA
    const bandContext = await getBandStyleContext(userBandId);
    const analysis = await analyzeSetlistWithAI(setlistSongs, bandContext);

    // Crear firma del setlist para detectar cambios
    const setlistSignature = setlist.items.map((item: any) => item.id).join('|');
    const analysisWithSignature = { ...analysis, setlist_signature: setlistSignature };

    // Crear objeto actualizado del setlist con análisis guardado
    const updatedSetlist = {
      ...setlist,
      ai_analysis_json: analysisWithSignature,
      ai_analysis_generated_at: new Date().toISOString()
    };

    // Guardar en Supabase
    await dbUpsertSetlist(updatedSetlist, userBandId);

    res.json({
      success: true,
      analysis
    });
  } catch (err: any) {
    console.error("Error in analyze-setlist-with-ai:", err);
    res.status(500).json({ error: err?.message || "Error al analizar setlist con IA" });
  }
});

// Plan de cambios (reordenar, quitar/añadir canciones del catálogo, añadir bloques) para acercar
// el setlist al "perfecto" — a diferencia de /analyze-with-ai, que solo señala problemas de orden,
// esto también mira el resto del repertorio de la banda como candidatas a añadir.
router.post("/setlists/:setlistId/generate-perfect-setlist", requireAuth, iaRateLimiter, async (req, res) => {
  try {
    const userBandId = getTargetBandId(req);
    const { setlistId } = req.params;
    const { feedback } = req.body || {};

    const allSetlists = await dbGetSetlists(userBandId);
    const setlist = allSetlists.find((s: any) => s.id === setlistId);
    if (!setlist) {
      return res.status(404).json({ error: "Setlist no encontrado" });
    }

    const allSongs = await dbGetSongs(userBandId);
    const songsById = new Map(allSongs.map((s: Song) => [s.id, s]));
    const usedSongIds = new Set(
      setlist.items.filter((it: SetlistItem) => !!it.songId).map((it: SetlistItem) => it.songId as string)
    );
    const catalogCandidates = allSongs.filter((s: Song) => !usedSongIds.has(s.id));

    const bandContext = await getBandStyleContext(userBandId);
    const immediateFeedbackBlock = buildImmediateFeedbackLines(feedback);
    const plan = await generatePerfectSetlistPlan(setlist.items, songsById, catalogCandidates, bandContext, immediateFeedbackBlock);

    // Se registra DESPUÉS de generar (no antes): si la generación falla, no queremos guardar un
    // feedback sobre un intento que nunca llegó a completarse.
    logSetlistFeedbackIfPresent(userBandId, feedback).catch(() => {});

    res.json({ success: true, plan });
  } catch (err: any) {
    console.error("Error in generate-perfect-setlist:", err);
    res.status(500).json({ success: false, error: err?.message || "Error al generar el plan de setlist perfecto" });
  }
});

/** Encuentra la canción del catálogo cuyo título case (exacto o parcial, normalizado) con el
 * título detectado por la IA en la foto/PDF — null si no hay ninguna candidata razonable. */
function findMatchingSong(detectedTitle: string, catalog: Song[]): Song | null {
  const normalizedDetected = normalizeSongTitle(detectedTitle);
  if (!normalizedDetected) return null;

  const exact = catalog.find((s) => normalizeSongTitle(s.titulo) === normalizedDetected);
  if (exact) return exact;

  // El match parcial (includes) es más arriesgado con títulos muy cortos (p.ej. "Va" casaría con
  // cualquier título que contenga esas letras) — se exige un mínimo de longitud real.
  if (normalizedDetected.length < 3) return null;
  return catalog.find((s) => titlesMatch(detectedTitle, [s.titulo])) || null;
}

// Analiza una foto o PDF de un repertorio ya impreso y devuelve la lista detectada, cada tema ya
// resuelto (o no) contra el catálogo real de la banda — el frontend hace de aquí una pantalla de
// revisión antes de crear nada; esta ruta NUNCA escribe en setlists ni en songs por su cuenta.
router.post("/setlists/import-from-image", requireAuth, iaRateLimiter, (req, res, next) => {
  importUpload.single("file")(req, res, (err: any) => {
    if (err) return res.status(400).json({ success: false, error: err.message || "Archivo no válido" });
    next();
  });
}, async (req, res) => {
  try {
    const userBandId = getTargetBandId(req);
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No se recibió ningún archivo" });
    }

    const parsed = await parseSetlistFromFile(req.file.buffer, req.file.mimetype);
    const allSongs = await dbGetSongs(userBandId);

    const items = parsed.items.map((item) => {
      if (item.type === 'block') {
        return { type: 'block' as const, titulo: item.titulo, blockType: item.blockType };
      }
      const match = findMatchingSong(item.titulo, allSongs as Song[]);
      return {
        type: 'song' as const,
        detectedTitle: item.titulo,
        matchedSongId: match?.id,
        matchedSongTitle: match?.titulo
      };
    });

    res.json({ success: true, nombreSugerido: parsed.nombreSugerido, items });
  } catch (err: any) {
    console.error("Error in import-from-image:", err);
    res.status(500).json({ success: false, error: err?.message || "Error al leer el repertorio de la imagen/PDF" });
  }
});

export default router;
