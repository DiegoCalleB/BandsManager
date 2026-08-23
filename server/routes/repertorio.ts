import express from "express";
import { Song, Setlist } from "../../src/types.js";
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
  dbDeleteSetlist
} from "../db.js";

import { getTargetBandId } from "../utils/bandAccess.js";

const router = express.Router();

// GET all songs
router.get("/songs", requireAuth, async (req, res) => {
  try {
    const userBandId = getTargetBandId(req);
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

export default router;
