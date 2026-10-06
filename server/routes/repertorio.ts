// Repertorio: canciones, análisis de dinámica/acordes/energía, setlists y utilidades relacionadas.

import express from "express";
import fs from "fs";
import multer from "multer";
import { Song, Setlist, SetlistItem } from "../../src/types.js";
import { loadState, saveState, requireAuth } from "../state.js";
import { getAiClient, generateContentWithFallback, TIMEOUT_IA_LARGO_MS } from "../ai.js";

// Más de ~3 minutos de audio no mejora la transcripción y sí el coste, el tamaño y el timeout.
const MAX_SEGUNDOS_ANALISIS_ACORDES = 180;
import { safeParseJson } from "../utils.js";
import { getAudioSnippetPath, buildAudioOrTextContents } from "./concert_to_album.js";
import { analizarAcordesDeCancion } from "../services/acordesCancion.js";
import { transcribirLetra, limpiarLineas, totalPalabras } from "../services/transcripcionLetra.js";
import { construirCifradoSincronizado } from "../utils/cifradoSincronizado.js";
import { validarSegmentos } from "../../src/utils/lineaTiempoAcordes.js";
import {
  dbGetSongs,
  dbGuardarAnalisisAcordes,
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
    const isAdmin = (req as any).user?.role === "admin";
    (newSong as any).band_id = userBandId;
    if (!newSong.id) {
      newSong.id = `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    }
    
    const saved = await dbUpsertSong(newSong, userBandId, isAdmin);
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
    const isAdmin = (req as any).user?.role === "admin";
    const updatedFields: Partial<Song> = req.body;
    const merged = { ...updatedFields, id, band_id: userBandId };
    const saved = await dbUpsertSong(merged, userBandId, isAdmin);

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

    const { variacion, audioAnalizable, bpmDetectado, tonalidadDetectada } = await analizarYGuardarDinamicaCancion(id, audioUrl, userBandId);
    res.json({ success: true, variacionDetectada: variacion, audioAnalizable, bpmDetectado, tonalidadDetectada });
  } catch (err: any) {
    console.error("Error analizando dinámica interna de la canción:", err);
    res.status(500).json({ error: err?.message || "No se pudo analizar la dinámica del audio." });
  }
});

// POST analizar los acordes del audio de una canción (Chordify propio): detecta acordes con
// tiempos sobre el audio, sin IA generativa ni coste, y guarda el resultado en la canción.
// Es un cálculo local de ~1 s por tema: se responde en la misma petición, sin cola.
const analisisAcordesEnCurso = new Set<string>();
router.post("/songs/:id/analizar-acordes", requireAuth, async (req, res) => {
  const { id } = req.params;
  const userBandId = getTargetBandId(req);
  const clave = `${userBandId}:${id}`;
  if (analisisAcordesEnCurso.has(clave)) {
    return res.status(409).json({ error: "Ya se están analizando los acordes de esta canción." });
  }
  analisisAcordesEnCurso.add(clave);
  try {
    // El audio se lee SIEMPRE de la canción guardada, no del cuerpo: así no se puede analizar
    // un fichero ajeno a la banda ni pasar una ruta arbitraria.
    const songs = await dbGetSongs(userBandId);
    const song = Array.isArray(songs) ? songs.find((s: any) => s.id === id) : null;
    if (!song) return res.status(404).json({ error: "Canción no encontrada." });

    // Reanalizar sustituye todo el análisis: no se pisan correcciones manuales sin confirmación.
    const corregidos = (song.analisisAcordes?.segmentos ?? []).filter((s: any) => s.editado).length;
    if (corregidos > 0 && req.body?.sobrescribir !== true) {
      return res.status(409).json({ error: `Hay ${corregidos} acordes corregidos a mano; reanalizar los perdería.`, correcciones: corregidos });
    }

    const resultado = await analizarAcordesDeCancion(song);
    if (resultado.ok === false) return res.status(resultado.status).json({ error: resultado.error });
    const analisis = resultado.analisis;
    const guardada = await dbGuardarAnalisisAcordes(id, userBandId, analisis);
    res.json({ success: true, analisis, song: guardada });
  } catch (err: any) {
    console.error("Error analizando acordes del audio:", err);
    res.status(500).json({ error: err?.message || "No se pudieron analizar los acordes del audio." });
  } finally {
    analisisAcordesEnCurso.delete(clave);
  }
});

// POST letra y acordes del audio, sincronizados. La letra sale de un modelo de RECONOCIMIENTO DE
// VOZ (Whisper) sobre la pista de voz aislada de Iris (o, si no hay, la mezcla), con marcas de
// tiempo; los acordes, de la detección propia. Se fusionan por tiempo en un cifrado de texto.
// Nunca se genera letra a partir del título ni con un modelo generativo: si no se puede
// transcribir, se devuelve el error y no se escribe nada.
router.post("/songs/:id/letra-sincronizada", requireAuth, async (req, res) => {
  const { id } = req.params;
  const userBandId = getTargetBandId(req);
  const clave = `${userBandId}:${id}`;
  if (analisisAcordesEnCurso.has(clave)) {
    return res.status(409).json({ error: "Ya se está procesando el audio de esta canción." });
  }
  analisisAcordesEnCurso.add(clave);
  try {
    const songs = await dbGetSongs(userBandId);
    const song = Array.isArray(songs) ? songs.find((s: any) => s.id === id) : null;
    if (!song) return res.status(404).json({ error: "Canción no encontrada." });

    // Un cifrado escrito por la banda no se sustituye sin confirmación (y no se gasta transcripción).
    if (song.cifradoTexto && String(song.cifradoTexto).trim() && req.body?.sobrescribir !== true) {
      return res.status(409).json({
        yaTieneCifrado: true,
        error: "Esta canción ya tiene un cifrado guardado. Transcribir desde el audio lo sustituiría.",
      });
    }

    const urlVoz = (song.audioIdeas ?? [])
      .flatMap((i: any) => i.pistas ?? [])
      .find((p: any) => /^(voz|vocals?|voice)\b/i.test(p?.nombre || "") && p?.audioUrl)?.audioUrl;
    const urlMezcla = song.audioPrincipalUrl || song.audioUrl || song.audioIdeas?.find((i: any) => i.audioUrl)?.audioUrl;
    const urlLetra: string | undefined = urlVoz || urlMezcla;
    if (!urlLetra) {
      return res.status(400).json({ error: "Sin audio no se puede transcribir la letra, y no voy a inventarla. Sube el audio de la canción, o escribe/pega el cifrado." });
    }
    const fuenteLetra: "voz" | "mezcla" = urlVoz ? "voz" : "mezcla";

    // Acordes: los ya detectados (con correcciones) o un análisis nuevo. Si fallan, la letra sigue.
    let analisis = song.analisisAcordes as any;
    let avisoAcordes: string | undefined;
    if (!analisis) {
      const r = await analizarAcordesDeCancion(song);
      if (r.ok === true) analisis = r.analisis;
      else avisoAcordes = (r as { error: string }).error;
    }

    let transcripcion;
    try {
      transcripcion = await transcribirLetra(urlLetra, { idioma: typeof req.body?.idioma === "string" ? req.body.idioma : undefined });
    } catch (err: any) {
      console.error("[letra-sincronizada] Transcripción fallida:", err?.message || err);
      return res.status(502).json({ error: `No se pudo transcribir la letra: ${err?.message || "error del servicio de voz"}. No se ha modificado nada.` });
    }

    const lineas = limpiarLineas(transcripcion.lineas);
    if (totalPalabras(lineas) < 8) {
      return res.status(422).json({
        letraConfianza: "sin_letra",
        error: "No se oye una letra inteligible en este audio (¿instrumental, o voz muy tapada?). No se ha escrito ninguna letra.",
      });
    }

    const cifradoTexto = construirCifradoSincronizado(lineas, analisis?.segmentos ?? []);
    const letraConfianza = fuenteLetra === "voz" ? "media" : "baja";
    const analisisFinal = analisis
      ? {
          ...analisis,
          letra: {
            fuente: fuenteLetra,
            modelo: transcripcion.modelo,
            idioma: transcripcion.idioma,
            transcritaEn: new Date().toISOString(),
            lineas: lineas.slice(0, 400).map((l) => ({ t0: l.t0, t1: l.t1, texto: l.texto })),
          },
        }
      : undefined;

    const guardada = await dbUpsertSong(
      {
        ...song,
        cifradoTexto,
        guiaSustituto: { ...(song.guiaSustituto || {}), origenCifrado: "audio_real", cifradoAproximado: true, letraConfianza },
        ...(analisisFinal ? { analisisAcordes: analisisFinal } : {}),
      },
      userBandId
    );

    res.json({
      success: true,
      cifradoTexto,
      letraConfianza,
      fuenteLetra,
      idioma: transcripcion.idioma,
      modelo: transcripcion.modelo,
      lineas: lineas.length,
      conAcordes: Boolean(analisis),
      avisoAcordes,
      analisis: analisisFinal ?? analisis ?? null,
      song: guardada,
    });
  } catch (err: any) {
    console.error("Error en letra-sincronizada:", err);
    res.status(500).json({ error: err?.message || "No se pudo procesar la letra." });
  } finally {
    analisisAcordesEnCurso.delete(clave);
  }
});

// PATCH corrección manual de los acordes detectados. El cliente envía la lista completa de
// tramos; el servidor la valida (tiempos, solapes, acordes reconocibles) y conserva el resto
// del análisis (fuente, versión, tonalidad). Los tramos corregidos llevan editado: true.
router.patch("/songs/:id/acordes", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userBandId = getTargetBandId(req);
    const validacion = validarSegmentos(req.body?.segmentos);
    if ("error" in validacion) return res.status(400).json({ error: validacion.error });

    const songs = await dbGetSongs(userBandId);
    const song = Array.isArray(songs) ? songs.find((s: any) => s.id === id) : null;
    if (!song) return res.status(404).json({ error: "Canción no encontrada." });
    if (!song.analisisAcordes) return res.status(409).json({ error: "Esta canción aún no tiene acordes analizados." });

    const analisis = { ...song.analisisAcordes, segmentos: (validacion as { segmentos: any[] }).segmentos, editadoEn: new Date().toISOString() };
    const guardada = await dbGuardarAnalisisAcordes(id, userBandId, analisis);
    res.json({ success: true, analisis, song: guardada });
  } catch (err: any) {
    console.error("Error guardando la corrección de acordes:", err);
    res.status(500).json({ error: err?.message || "No se pudo guardar la corrección." });
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
    (newSetlist as any).band_id = userBandId;
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
    const { songId, titulo, tonalidad, bpm, afinacion, notasInternas, esVersionCovers, artista, audioUrl, sobrescribir } = req.body;

    if (!titulo) {
      return res.status(400).json({ error: "El título de la canción es requerido." });
    }

    // La canción guardada manda: su cifrado actual, su pista de voz y los acordes ya detectados.
    let cancion: any = null;
    if (songId) {
      try {
        const songs = await dbGetSongs(getTargetBandId(req));
        cancion = Array.isArray(songs) ? songs.find((s: any) => s.id === songId) : null;
      } catch {
        cancion = null;
      }
    }

    // No se pisa un cifrado que ya existe sin que el usuario lo confirme (y así ni se gasta IA).
    if (cancion?.cifradoTexto && String(cancion.cifradoTexto).trim() && sobrescribir !== true) {
      return res.status(409).json({
        success: false,
        yaTieneCifrado: true,
        error: "Esta canción ya tiene un cifrado guardado. Generar otro lo sustituiría."
      });
    }

    const aiClient = getAiClient();
    let generatedChords: string | null = null;
    let generatedGuide: any = null;
    let esAproximado = false;
    let letraConfianza: "alta" | "media" | "baja" | "sin_letra" = "baja";
    // La única fuente válida es el audio real. Sin audio no hay nada que transcribir, y pedirle a
    // una IA «una letra para esta canción» solo produce una letra inventada con aspecto de verdadera.
    const chordsSource = "audio_real" as const;

    // Audio de la mezcla (acordes y estructura) y, si Iris separó la voz, pista de voz aislada
    // (la letra se oye mucho mejor sin guitarras ni batería).
    const urlVoz = (cancion?.audioIdeas ?? [])
      .flatMap((i: any) => i.pistas ?? [])
      .find((p: any) => /^(voz|vocals?|voice)\b/i.test(p?.nombre || "") && p?.audioUrl)?.audioUrl;
    const [snippetMezcla, snippetVoz] = await Promise.all([
      audioUrl ? getAudioSnippetPath({ audioUrl, allowSyntheticFallback: false, maxSeconds: MAX_SEGUNDOS_ANALISIS_ACORDES }) : null,
      urlVoz ? getAudioSnippetPath({ audioUrl: urlVoz, allowSyntheticFallback: false, maxSeconds: MAX_SEGUNDOS_ANALISIS_ACORDES }) : null,
    ]);
    if (!snippetMezcla && !snippetVoz) {
      return res.status(422).json({
        success: false,
        chordsSource: "sin_audio",
        error: "Sin audio no se puede transcribir la letra ni los acordes, y no voy a inventarlos. Sube el audio de la canción (o pega el cifrado, o sube un PDF/imagen) y vuelve a intentarlo."
      });
    }
    if (!aiClient) {
      return res.status(503).json({ success: false, chordsSource: "sin_resultado", error: "La IA no está configurada en el servidor, así que no se puede transcribir." });
    }

    try {
      const acordesDetectados = (cancion?.analisisAcordes?.segmentos ?? [])
        .filter((sg: any) => sg.acorde !== "N")
        .slice(0, 160)
        .map((sg: any) => `${Math.floor(sg.t0 / 60)}:${String(Math.floor(sg.t0 % 60)).padStart(2, "0")} ${sg.acorde}`)
        .join(", ");

      const prompt = `Eres un transcriptor musical. Tu trabajo es TRANSCRIBIR lo que suena en el audio adjunto, no componer ni recordar.
${snippetVoz ? "Recibes DOS audios: el primero contiene SOLO LA VOZ aislada; el segundo es la mezcla completa. Saca la letra del primero y los acordes del segundo." : "Recibes la mezcla completa de la canción."}

Datos de la canción (solo contexto, no son parte de la transcripción):
Título: "${titulo}"
${artista ? `Artista/Banda: "${artista}"` : ""}
${tonalidad ? `Tonalidad: "${tonalidad}"` : ""}
${bpm ? `Tempo: ${bpm} BPM` : ""}
${esVersionCovers ? "Es una versión/cover." : "Es una composición original de la banda."}
${acordesDetectados ? `\nAcordes detectados por análisis de señal (referencia fiable de qué acordes y cuándo; no los contradigas salvo que el audio lo muestre con claridad): ${acordesDetectados}` : ""}

REGLAS ESTRICTAS PARA LA LETRA (lo más importante):
1. Escribe SOLO las palabras que se oyen cantadas, en el idioma en que se cantan. No traduzcas, no corrijas, no completes versos ni rimas, no uses lo que sepas de la canción aunque la reconozcas.
2. Donde no entiendas una palabra o un tramo, escribe [?] en su lugar. Mejor un hueco honesto que una palabra inventada.
3. Si no hay voz inteligible, o es un instrumental, NO escribas letra: deja solo las líneas de acordes por sección.
4. No repitas un estribillo por inercia: escribe cada vez lo que suena en esa parte, y si es igual puedes copiarlo, pero solo si lo has oído.

FORMATO de cifradoTexto (estilo LaCuerda): acordes inline [Am] delante de la sílaba donde cambian, secciones [Intro], [Verso 1], [Estribillo], [Puente], [Solo], [Outro]. Notación española (Do, Re, Mim, Sol, Lam) o internacional, pero coherente.

Responde ÚNICAMENTE con JSON válido:
{
  "cifradoTexto": "...",
  "letraConfianza": "alta" | "media" | "baja" | "sin_letra",
  "idioma": "es" | "gl" | "en" | "...",
  "guiaSustituto": { "estructura": "...", "progresionClave": "...", "cortesYClaves": "...", "capoTraste": "...", "instrumentosClave": "..." }
}
"letraConfianza": "alta" solo si entiendes casi todo; "media" si hay huecos [?]; "baja" si dudas de buena parte; "sin_letra" si no hay voz inteligible.`;

      const partes: any[] = [];
      for (const ruta of [snippetVoz, snippetMezcla]) {
        if (ruta && fs.existsSync(ruta)) {
          partes.push({ inlineData: { mimeType: "audio/mp3", data: fs.readFileSync(ruta).toString("base64") } });
        }
      }
      partes.push({ text: prompt });

      const aiRes = await generateContentWithFallback(aiClient, {
        contents: [{ role: "user", parts: partes }],
        // temperatura 0: transcribir, no crear.
        config: { responseMimeType: "application/json", temperature: 0 },
        bandId: getTargetBandId(req),
        timeoutMs: TIMEOUT_IA_LARGO_MS
      });

      const responseText = aiRes?.text || aiRes?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const parsed = safeParseJson(responseText);
      if (parsed && typeof parsed.cifradoTexto === "string" && parsed.cifradoTexto.trim()) {
        generatedChords = parsed.cifradoTexto;
        generatedGuide = parsed.guiaSustituto;
        letraConfianza = ["alta", "media", "baja", "sin_letra"].includes(parsed.letraConfianza) ? parsed.letraConfianza : "baja";
        esAproximado = letraConfianza !== "alta" && letraConfianza !== "sin_letra";
      }
    } catch (aiErr: any) {
      console.warn("[Gemini API] No se pudo transcribir la canción:", aiErr?.message || aiErr);
    }

    // Sin respuesta útil de la IA NO se inventa nada.
    if (!generatedChords) {
      return res.status(503).json({
        success: false,
        chordsSource: "sin_resultado",
        error: "La IA no pudo transcribir esta canción ahora mismo. No se ha modificado nada: inténtalo de nuevo en unos minutos."
      });
    }

    // El origen viaja DENTRO de guiaSustituto (ya es JSON en BD) para que al reabrir la canción
    // se sepa si el cifrado es transcripción real, propuesta de la IA o aproximado de memoria.
    generatedGuide = { ...(generatedGuide && typeof generatedGuide === "object" ? generatedGuide : {}), origenCifrado: chordsSource, cifradoAproximado: esAproximado, letraConfianza };

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
      // Qué tan seguro está el transcriptor de la letra (alta / media / baja / sin_letra).
      letraConfianza,
      // true si hay huecos [?] o dudas: la letra hay que revisarla de oído.
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
      },
      bandId: getTargetBandId(req)
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

// Optimiza masivamente todos los audios en formato WAV del repertorio a MP3 de alta calidad (256k)
router.post("/optimize-wavs", requireAuth, async (req, res) => {
  try {
    const userBandId = getTargetBandId(req);
    const { optimizeWavSongsForBand } = await import("../utils/optimizeExistingWavs.js");
    const result = await optimizeWavSongsForBand(userBandId);
    res.json({ success: true, result });
  } catch (err: any) {
    console.error("Error in /optimize-wavs:", err);
    res.status(500).json({ success: false, error: err?.message || "Error optimizando audios WAV" });
  }
});

// Enriquece e investiga por internet tonalidades y BPMs de temas sin audio o versiones
router.post("/enrich-missing-audio", requireAuth, async (req, res) => {
  try {
    const userBandId = getTargetBandId(req);
    const { enrichMissingAudioSongsForBand } = await import("../utils/enrichCoversWithoutAudio.js");
    const result = await enrichMissingAudioSongsForBand(userBandId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error("Error in /enrich-missing-audio:", err);
    res.status(500).json({ success: false, error: err?.message || "Error enriqueciendo canciones sin audio" });
  }
});

export default router;
