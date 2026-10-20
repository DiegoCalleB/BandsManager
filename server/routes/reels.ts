// Reels & Social Content Generator: metadatos de YouTube, análisis de momentos virales, corte de
// clips (ffmpeg, con `renderRateLimiter`). El texto del reel (hook doctor, copy) vive en reelsTexto.ts.

import express from "express";
import fs from "fs";
import path from "path";
import os from "os";
import ytdl from "@distube/ytdl-core";
import { YoutubeTranscript } from "youtube-transcript";
import ffmpegStatic from "ffmpeg-static";
import { requireAuth } from "../state.js";
import { getAiClient, GEMINI_MODEL, generateContentWithFallback } from "../ai.js";
import { dbGetReelAnalysis, dbUpsertReelAnalysis, dbUpdateReelAnalysisHighlight, dbAppendBandSpeechPhrases, dbLogReelFeedback } from "../db.js";
import { getTargetBandId } from "../utils/bandAccess.js";
import { iaRateLimiter, renderRateLimiter, renderConcurrencyLimiter } from "../middleware/rateLimiter.js";
import { buildBandContextBlock, displayBandName, baseHashtags } from "../utils/bandProfile.js";
import { descargarConYtDlp } from "../utils/youtubeSource.js";
import { resumirEnergiaParaPrompt } from "../utils/audioEnergy.js";
import { buildEstrategiaBlock, buildReglasDeRedaccion, estrategiaDe } from "../utils/reelStrategy.js";
import { detectarTipoContenido, esTipoContenido, resumirSenalesParaPrompt, type TipoContenido } from "../utils/viralSignals.js";
import { parseRange, formatMMSS, extractJsonObject, normalizeHighlights, buildFallbackHighlights, buildSubtitleCues, buildVtt, buildWordOffsets, buildAssSubtitles, buildKaraokeAssSubtitles, decodeTranscriptText, type CropMode, type TranscriptItem, type NormalizedHighlight } from "../utils/reelsCore.js";
import { ajustarCortes, medirSenalesDelVideo } from "../services/senalesVideo.js";
import { renderizarClip } from "../services/clipRenderer.js";
import { perfilDeLaPeticion } from "../services/perfilDeLaPeticion.js";
import reelsTextoRouter from "./reelsTexto.js";
import { sanearYAuditarHighlights } from "../utils/auditarHighlights.js"; import reelsAprendizajeRouter from "./reelsAprendizaje.js"; import reelsProgramacionRouter from "./reelsProgramacion.js";
import { aprendizajeDeBanda } from "../services/metricasReels.js";
import { bloqueAprendizajeParaPrompt } from "../utils/aprendizajeReels.js";
import { analizarTramo, escribirRotuloHook, guardarClipRenderizado } from "../services/clipNovedades.js";
import { canonicalYouTubeUrl, fetchYoutubeMeta, getYouTubeId, metaVacia, type YoutubeMeta } from "../services/youtubeMeta.js";
import { CLIPS_DIR, MAX_CLIP_SECONDS, asegurarDirectorioClips, borrarSiExiste, explicarErrorYoutube, limpiarClipsAntiguos } from "../services/clipArchivos.js";
import { comoErrorCapturado } from '../../src/utils/errorCapturado.js';
import { responderError } from '../utils/errorHttp.js';

/** Mejor momento para publicar que propone la IA. */
interface MomentoOptimo {
  date?: string;
  time?: string;
  reason?: string;
}

const router = express.Router();

/**
 * Clave estable para guardar/recuperar el análisis de un vídeo. Para YouTube es el propio id
 * del vídeo. Un archivo local nunca llega al servidor, así que ahí solo podemos reconocer "es
 * probablemente el mismo vídeo" a partir de lo que el cliente ya conoce sin subir nada: si el
 * frontend manda una `videoKey` explícita (derivada de nombre+tamaño del archivo), se respeta;
 * si no, no hay nada que cachear y el análisis funciona igual, sin persistencia.
 */
function resolverVideoKey(youtubeUrl?: string, videoKeyExplicita?: unknown): string | null {
  const explicita = typeof videoKeyExplicita === "string" ? videoKeyExplicita.trim() : "";
  if (explicita) return explicita.substring(0, 200);
  return getYouTubeId(youtubeUrl);
}

/* ------------------------------------------------------------ contexto de banda */


/** Transcripción del vídeo completo, probando español y cayendo al idioma por defecto. */
async function fetchTranscript(videoId: string): Promise<TranscriptItem[]> {
  const intentos: Array<() => Promise<Array<{ offset?: number; duration?: number; text?: string }>>> = [
    () => YoutubeTranscript.fetchTranscript(videoId, { lang: "es" }),
    () => YoutubeTranscript.fetchTranscript(videoId),
    () => YoutubeTranscript.fetchTranscript(videoId, { lang: "en" })
  ];

  for (const intento of intentos) {
    try {
      const bruto = await intento();
      if (Array.isArray(bruto) && bruto.length > 0) {
        return bruto
          .map((t) => ({
            offset: Number(t?.offset) || 0,
            duration: Number(t?.duration) || 0,
            text: decodeTranscriptText(t?.text)
          }))
          .filter((t: TranscriptItem) => t.text);
      }
    } catch {
      /* siguiente idioma */
    }
  }
  return [];
}

/* ------------------------------------------------------------- gestión de clips */

/** Descarga el vídeo probando primero un formato con vídeo+audio y cayendo al mejor global. */
/**
 * Deja el vídeo en `destino` y devuelve cuántos segundos del original se han saltado, que es
 * distinto de cero cuando se ha podido bajar solo el tramo pedido.
 */
async function descargarVideo(
  url: string,
  destino: string,
  seccion?: { start: number; duration: number }
): Promise<number> {
  // yt-dlp primero: es el que aguanta el antibot de YouTube (y usa las cookies que el usuario
  // ya puede subir desde el gestor de cookies). ytdl-core queda como respaldo para cuando el
  // binario no esté instalado en la máquina.
  const ffmpegDir = ffmpegStatic ? path.dirname(ffmpegStatic as unknown as string) : undefined;
  const resultado = await descargarConYtDlp(url, destino, { seccion, ffmpegDir });
  if (resultado.ok) {
    console.log(`[Reels] Descarga completada con yt-dlp (offset ${resultado.offset}s).`);
    return resultado.offset;
  }
  await borrarSiExiste([destino]);
  console.log("[Reels] yt-dlp no disponible o fallido, probando con ytdl-core...");

  const descargar = (opciones: ytdl.downloadOptions) =>
    new Promise<void>((resolve, reject) => {
      const stream = ytdl(url, opciones);
      const writeStream = fs.createWriteStream(destino);
      let fallado = false;
      const fallar = (err: unknown) => {
        if (fallado) return;
        fallado = true;
        writeStream.destroy();
        reject(err);
      };
      stream.on("error", fallar);
      writeStream.on("error", fallar);
      writeStream.on("finish", () => { if (!fallado) resolve(); });
      stream.pipe(writeStream);
    });

  try {
    await descargar({
      quality: "highest",
      filter: (format) => format.container === "mp4" && Boolean(format.hasVideo) && Boolean(format.hasAudio)
    });
  } catch (primerErrorCapturado) {
    const primerError = comoErrorCapturado(primerErrorCapturado);
    console.warn("[Reels] Formato mp4 con audio+vídeo no disponible, probando 'highest':", primerError?.message || primerError);
    await borrarSiExiste([destino]);
    await descargar({ quality: "highest" });
  }

  if (!fs.existsSync(destino) || fs.statSync(destino).size === 0) {
    throw new Error("La descarga terminó vacía.");
  }
  // ytdl-core siempre baja el vídeo entero: no hay desplazamiento.
  return 0;
}

/* ============================================================================
 * GET /api/youtube-meta - Ficha real del vídeo antes de analizarlo
 * ==========================================================================*/

router.get("/youtube-meta", requireAuth, async (req, res) => {
  const rawUrl = String(req.query.url || req.query.youtubeUrl || "");
  const videoId = getYouTubeId(rawUrl);
  if (!videoId) {
    return res.status(400).json({ success: false, error: "URL de YouTube no válida." });
  }

  try {
    const [meta, transcript] = await Promise.all([
      fetchYoutubeMeta(videoId),
      fetchTranscript(videoId).catch(() => [] as TranscriptItem[])
    ]);

    return res.json({
      success: true,
      meta: {
        videoId: meta.videoId,
        title: meta.title,
        author: meta.author,
        duration: meta.duration,
        thumbnail: meta.thumbnail,
        isLive: meta.isLive,
        hasTranscript: transcript.length > 0,
        transcriptLines: transcript.length,
        // Sin duración no se puede validar ningún rango: el frontend avisa al usuario.
        durationKnown: meta.duration > 0
      }
    });
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error("[Reels youtube-meta]", err);
    return res.status(502).json({ success: false, error: explicarErrorYoutube(err) });
  }
});

/* ============================================================================
 * GET /api/reel-analysis - Recupera un análisis ya guardado, sin llamar a la IA
 * ==========================================================================*/

router.get("/reel-analysis", requireAuth, async (req, res) => {
  try {
    const videoKey = resolverVideoKey(
      typeof req.query.youtubeUrl === "string" ? req.query.youtubeUrl : undefined,
      req.query.videoKey
    );
    if (!videoKey) {
      return res.status(400).json({ success: false, error: "Falta 'youtubeUrl' o 'videoKey'." });
    }

    const bandId = getTargetBandId(req);
    const guardado = await dbGetReelAnalysis(bandId, videoKey);
    if (!guardado) {
      return res.json({ success: false, found: false });
    }

    return res.json({
      success: true,
      found: true,
      savedAt: guardado.updated_at,
      highlights: guardado.highlights || [],
      optimalTime: guardado.optimal_time || null,
      energyWindows: guardado.energy_windows || [],
      generatedByAI: Boolean(guardado.generated_by_ai),
      notice: guardado.notice || undefined,
      videoMeta: guardado.video_meta || {}
    });
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error("[GET /reel-analysis]", err);
    return res.status(500).json({ success: false, error: "No se pudo recuperar el análisis guardado." });
  }
});

/* ============================================================================
 * POST /api/analyze-video-highlights - Detección de highlights con IA
 * ==========================================================================*/

router.post("/analyze-video-highlights", requireAuth, iaRateLimiter, async (req, res) => {
  try {
    const { fileName, youtubeUrl, videoDuration = 0, videoTopic, targetDuration, videoKey: videoKeyExplicita, contentType } = req.body || {};

    const perfil = await perfilDeLaPeticion(req);
    const nombreBanda = displayBandName(perfil);
    const hashtagsBase = baseHashtags(perfil);

    let meta: YoutubeMeta = metaVacia("");
    let transcript: TranscriptItem[] = [];
    const videoId = getYouTubeId(youtubeUrl);

    if (videoId) {
      [meta, transcript] = await Promise.all([
        fetchYoutubeMeta(videoId),
        fetchTranscript(videoId).catch(() => [] as TranscriptItem[])
      ]);
    }

    // Duración real del vídeo > la que declare el cliente > un valor de trabajo razonable.
    // OJO: `videoDuration` NO sirve aquí. En el cliente antiguo ese campo llevaba la duración
    // deseada del CLIP (15/30/60), así que usarlo como longitud del vídeo hacía creer al
    // servidor que un directo de 40 minutos duraba 30 segundos y recortaba todo a ese rango.
    const duracionDeclarada = Number(req.body?.knownDuration) || 0;
    const duracionTotal = meta.duration > 0 ? meta.duration : duracionDeclarada > 0 ? duracionDeclarada : 180;

    // `videoDuration` era a la vez "duración del vídeo" y "duración deseada del clip" en el
    // cliente antiguo. Se acepta el nuevo campo explícito y se cae al viejo comportamiento.
    const objetivoClip = Math.max(
      8,
      Math.min(90, Number(targetDuration) || (Number(videoDuration) > 0 && Number(videoDuration) <= 90 ? Number(videoDuration) : 30))
    );

    const tituloReal = meta.title || fileName || videoTopic || `Vídeo de ${nombreBanda}`;
    const tieneTranscripcion = transcript.length > 0;

    const resumenTranscripcion = tieneTranscripcion
      ? transcript
          .slice(0, 220)
          .map((t) => `[${Math.floor(t.offset / 1000)}s] ${t.text}`)
          .join("\n")
          .substring(0, 6000)
      : "";

    // Cómo está grabado el material cambia por completo qué hace viral a un fragmento: en un
    // bolo mandan el subidón y el público, en un videoclip mandan el estribillo y el montaje.
    // El usuario puede fijarlo; si no, se deduce del título y la descripción reales.
    const tipoContenido: TipoContenido = esTipoContenido(contentType)
      ? contentType
      : detectarTipoContenido(meta.title || tituloReal, meta.description);
    const analizarAudio = req.body?.analyzeAudio !== false;
    const ficha = { esMusica: meta.esMusica, heatmap: meta.heatmap, duration: duracionTotal };
    const { ventanasEnergia, ventanasVirales, cambiosDePlano, curva, publico } = await medirSenalesDelVideo({ videoId, objetivoClip, tipoContenido, ficha, activo: analizarAudio });

    // El bloque nuevo trae el desglose (volumen/arranque/ritmo visual); el antiguo, solo el
    // volumen. Se usa el que haya, para no perder la pista de energía si falla la puntuación.
    const bloqueEnergia = ventanasVirales.length
      ? resumirSenalesParaPrompt(ventanasVirales, tipoContenido)
      : resumirEnergiaParaPrompt(ventanasEnergia);

    const bloqueCapitulos = meta.chapters.length
      ? [
          "CAPÍTULOS QUE MARCÓ QUIEN SUBIÓ EL VÍDEO (son highlights ya elegidos a mano, tenlos muy en cuenta):",
          ...meta.chapters.slice(0, 25).map((c) => `- ${formatMMSS(c.start)}-${formatMMSS(c.end)}: ${c.title}`)
        ].join("\n")
      : "";

    const ai = getAiClient();
    let highlights: NormalizedHighlight[] = [];
    let optimalTime: MomentoOptimo | null = null;
    let generadoPorIa = false;
    let avisoIa = "";
    // Frases reales de directo (habla, no letra cantada) extraídas de la transcripción: la fuente
    // de tono más auténtica que hay. Se acumulan en el ADN de la banda más abajo.
    let frasesDirectoExtraidas: string[] = [];

    if (ai) {
      // Lo medido en los Reels ya publicados de la banda orienta el formato. Best-effort.
      const aprendizaje = await aprendizajeDeBanda(getTargetBandId(req)).catch(() => null);
      const prompt = `Eres quien decide qué trozo de un vídeo se convierte en Reel para una banda de música. Trabajas con material REAL y con señales medidas sobre él, no con suposiciones.

${buildBandContextBlock(perfil)}

${buildEstrategiaBlock(tipoContenido)}

${aprendizaje ? bloqueAprendizajeParaPrompt(aprendizaje.resumen, aprendizaje.recomendacion) : ""}

DATOS REALES DEL VÍDEO:
- Título: "${tituloReal}"
${meta.author ? `- Canal: "${meta.author}"` : ""}
${meta.description ? `- Descripción original: "${meta.description.substring(0, 700)}"` : ""}
- Duración total EXACTA: ${duracionTotal} segundos (${formatMMSS(duracionTotal)})
${fileName ? `- Archivo local: ${fileName}` : ""}
${videoTopic ? `- Contexto que aporta el usuario (tiene prioridad sobre tus suposiciones): "${videoTopic}"` : ""}
${resumenTranscripcion ? `- TRANSCRIPCIÓN REAL CON MARCAS DE TIEMPO:\n${resumenTranscripcion}` : "- Este vídeo NO tiene transcripción: es material instrumental o sin subtítulos. NO cites letras ni frases concretas, y no supongas qué se dice ni quién habla."}

${bloqueCapitulos}

${bloqueEnergia}

${buildReglasDeRedaccion(nombreBanda)}

TU TAREA:
Elige entre 3 y 5 fragmentos. Reglas de los rangos:
- Cada fragmento dura unos ${objetivoClip} segundos (se acepta de ${Math.max(8, Math.round(objetivoClip * 0.7))} a ${Math.round(objetivoClip * 1.4)} s; elige un final natural, nunca a mitad de frase).
- startSec y endSec son NÚMEROS en segundos, siempre dentro de 0 y ${duracionTotal}.
- No pueden solaparse entre sí.
- Ordénalos de mayor a menor potencial real.
- Coloca el inicio JUSTO donde empieza lo interesante, no unos segundos antes: los dos
  primeros segundos del corte son los que deciden si alguien sigue mirando.

Campos de cada fragmento:
- "title": qué pasa en ese tramo (ver reglas de redacción).
- "hookText": rótulo sobreimpreso para los 2 primeros segundos, máximo 6 palabras.
- "recommendedCopy": pie de publicación para Instagram Reels, 2-4 líneas, sin hashtags dentro.
- "copyTikTok": versión más corta y directa para TikTok, una o dos frases.
- "copyYouTube": título de YouTube Shorts, máximo 60 caracteres.
- "copyFacebook": pie de publicación para Facebook, algo más explicativo y menos telegráfico que TikTok, 2-3 líneas.
- "hashtags": entre 4 y 8, en español, mezclando los de la banda con los del estilo musical.
- "cta": una llamada a la acción concreta y realista (comentar algo específico, guardar, compartir con alguien, venir al próximo bolo).
- "confidence": 1-100, tu estimación honesta. No pongas 95 a todos: si un corte es flojo, dilo.
- "reason": por qué ESE tramo, citando la señal medida o la letra que lo justifica.

${tieneTranscripcion ? `ADEMÁS DE LOS FRAGMENTOS: repasa la transcripción completa y devuelve en "frasesDirectoExtraidas" las frases donde la banda HABLA de verdad al público entre canciones (presentaciones, bromas, agradecimientos, "qué tal Madrid", etc.), tal cual las dicen. NO metas letras cantadas ni te las inventes: es la fuente de tono más auténtica que hay, así que solo cuenta si es real y distinguible del canto. Si no puedes diferenciar con seguridad habla de letra cantada, deja la lista vacía. Máximo 5 frases, solo las más claras.` : ""}

Responde ÚNICAMENTE con JSON válido, sin markdown ni texto alrededor:
{
  "highlights": [
    {
      "id": "hl-1",
      "title": "...",
      "startSec": 15,
      "endSec": ${15 + objetivoClip},
      "confidence": 92,
      "energyLevel": "Muy Alta",
      "hookText": "...",
      "recommendedCopy": "...",
      "copyTikTok": "...",
      "copyYouTube": "...",
      "copyFacebook": "...",
      "hashtags": ["#Ejemplo"],
      "cta": "...",
      "reason": "..."
    }
  ],
  "optimalTime": { "date": "YYYY-MM-DD", "time": "20:30", "reason": "Por qué ese hueco" },
  "frasesDirectoExtraidas": ["..."]
}`;

      try {
        const aiResponse = await generateContentWithFallback(ai, {
          contents: prompt,
          preferredModel: GEMINI_MODEL,
          bandId: getTargetBandId(req)
        });

        const parsed = extractJsonObject(aiResponse?.text);
        const candidatos = normalizeHighlights(parsed?.highlights, {
          videoDuration: duracionTotal,
          targetDuration: objetivoClip,
          defaultHashtags: hashtagsBase
        });

        if (candidatos.length > 0) {
          highlights = sanearYAuditarHighlights(candidatos);
          optimalTime = parsed?.optimalTime || null;
          generadoPorIa = true;
        } else {
          avisoIa = "La IA respondió pero sin fragmentos utilizables; se muestran cortes automáticos que puedes ajustar a mano.";
        }

        if (Array.isArray(parsed?.frasesDirectoExtraidas)) {
          frasesDirectoExtraidas = parsed.frasesDirectoExtraidas
            .map((f: unknown) => String(f || "").trim())
            .filter(Boolean)
            .slice(0, 5);
        }
      } catch (errCapturado) {
        const err = comoErrorCapturado(errCapturado);
        console.warn("[Highlights AI] Fallo llamando al modelo:", err?.message || err);
        avisoIa = "La IA no respondió a tiempo; se muestran cortes automáticos que puedes ajustar a mano.";
      }
    } else {
      avisoIa = "No hay clave de IA configurada en el servidor: se muestran cortes automáticos repartidos por el vídeo.";
    }

    if (highlights.length === 0) {
      highlights = buildFallbackHighlights({
        videoDuration: duracionTotal,
        targetDuration: objetivoClip,
        bandName: nombreBanda,
        videoTitle: tituloReal,
        hashtags: hashtagsBase,
        energyWindows: ventanasEnergia,
        chapters: meta.chapters
      });
    }

    highlights = ajustarCortes(highlights, curva, cambiosDePlano, { videoDuration: duracionTotal, objetivo: objetivoClip });
    if (!optimalTime || !optimalTime.date) {
      const manana = new Date();
      manana.setDate(manana.getDate() + 1);
      optimalTime = {
        date: manana.toISOString().split("T")[0],
        time: "20:30",
        reason: "Franja de mayor consumo de vídeo musical en Instagram y TikTok (20:00-21:30)."
      };
    }

    // Guardado best-effort: si Supabase falla, el análisis que ya se ha calculado y se le va
    // a devolver al usuario sigue siendo válido igualmente, así que nunca debe tumbar la
    // respuesta ni retrasarla de forma perceptible.
    const videoKey = resolverVideoKey(youtubeUrl, videoKeyExplicita);
    let guardadoEnBd = false;
    if (videoKey) {
      const bandId = getTargetBandId(req);
      const guardado = await dbUpsertReelAnalysis({
        bandId,
        videoKey,
        sourceType: videoId ? "youtube" : "file",
        sourceUrl: youtubeUrl || fileName || "",
        videoTitle: tituloReal,
        videoDuration: duracionTotal,
        targetDuration: objetivoClip,
        highlights,
        optimalTime,
        energyWindows: ventanasEnergia,
        videoMeta: {
          videoId: meta.videoId,
          title: meta.title,
          author: meta.author,
          thumbnail: meta.thumbnail,
          hasTranscript: tieneTranscripcion,
          chapters: meta.chapters,
          contentType: tipoContenido,
          viralWindows: ventanasVirales
        },
        generatedByAI: generadoPorIa,
        notice: avisoIa
      });
      guardadoEnBd = Boolean(guardado);
    }

    if (frasesDirectoExtraidas.length > 0) {
      dbAppendBandSpeechPhrases(getTargetBandId(req), frasesDirectoExtraidas).catch((e: unknown) =>
        console.warn("[Highlights AI] No se pudieron guardar las frases de directo:", comoErrorCapturado(e).message || e)
      );
    }

    return res.json({
      success: true,
      highlights,
      optimalTime,
      generatedByAI: generadoPorIa,
      notice: avisoIa || undefined,
      audioAnalyzed: ventanasEnergia.length > 0,
      energyWindows: ventanasEnergia,
      // Ventanas con el desglose de señales (volumen / arranque / ritmo visual) y el tipo
      // detectado, para que la interfaz pueda enseñar POR QUÉ se ha elegido cada momento.
      viralWindows: ventanasVirales,
      contentType: tipoContenido,
      sceneChanges: cambiosDePlano.length,
      publicSignals: { used: Boolean(publico.curva), note: publico.nota },
      savedToDb: guardadoEnBd,
      band: { name: nombreBanda, instruments: perfil.instruments, hashtags: hashtagsBase },
      videoMeta: {
        videoId: meta.videoId,
        title: meta.title,
        author: meta.author,
        duration: duracionTotal,
        durationKnown: meta.duration > 0,
        thumbnail: meta.thumbnail,
        hasTranscript: tieneTranscripcion,
        transcriptLines: transcript.length
      }
    });
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error("[Highlights AI Route Error]:", err);
    return responderError(res, err, "Error al procesar el vídeo.");
  }
});

/* ============================================================================
 * POST /api/cut-video-clip - Recorte físico 9:16 + subtítulos
 * ==========================================================================*/

router.post("/cut-video-clip", requireAuth, renderRateLimiter, renderConcurrencyLimiter, async (req, res) => {
  const {
    youtubeUrl,
    start = 0,
    duration = 30,
    cropVertical = true,
    cropMode: cropModeRaw,
    burnSubtitles = false,
    // Resaltado palabra por palabra (estilo TikTok/CapCut) en vez de la línea estática de
    // siempre: sube la retención y ya teníamos calculados los tiempos por palabra.
    karaokeSubtitles = true,
    punchInZoom = false,
    beatDropFx = false,
    smartPan = false,
    inlineBase64 = false,
    // Novedades de calidad: rótulo de enganche, bucle sin salto, volumen estándar y derechos.
    hookText = "",
    loopPerfecto = false,
    derechosDeclarados = false,
    normalizarVolumen = true
  } = req.body || {};

  if (!youtubeUrl) {
    return res.status(400).json({ success: false, error: "Se requiere 'youtubeUrl'." });
  }

  const videoId = getYouTubeId(youtubeUrl);
  if (!videoId) {
    return res.status(400).json({ success: false, error: "URL de YouTube no válida." });
  }

  const inicio = Math.max(0, Math.floor(Number(start) || 0));
  const duracion = Math.max(1, Math.min(MAX_CLIP_SECONDS, Math.floor(Number(duration) || 30)));

  // `cropVertical` es el flag antiguo (booleano); `cropMode` el nuevo con opciones ampliadas.
  const cropMode: CropMode = ["crop", "blur", "none", "smart_pan"].includes(String(cropModeRaw))
    ? (String(cropModeRaw) as CropMode)
    : cropVertical
      ? "crop"
      : "none";

  const reqId = `clip_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const rutaDescarga = path.join(os.tmpdir(), `${reqId}_raw.mp4`);
  const rutaAss = path.join(os.tmpdir(), `${reqId}_subs.ass`);
  const rutaHookAss = path.join(os.tmpdir(), `${reqId}_hook.ass`);
  asegurarDirectorioClips();
  const nombreSalida = `${reqId}.mp4`;
  const rutaSalida = path.join(CLIPS_DIR, nombreSalida);

  // Sin await: el usuario no tiene por qué esperar a que se barra el directorio.
  void limpiarClipsAntiguos();

  try {
    const urlCanonica = canonicalYouTubeUrl(videoId);

    console.log(`[Reels] Descargando ${videoId} para recortar ${inicio}s +${duracion}s...`);
    // La ficha del vídeo (canal de origen) solo hace falta para acreditar los derechos del clip.
    const [offsetDescarga, metaOrigen] = await Promise.all([
      descargarVideo(urlCanonica, rutaDescarga, { start: inicio, duration: duracion }),
      fetchYoutubeMeta(videoId).catch(() => metaVacia(videoId))
    ]);
    // Si solo se bajó el tramo, dentro del fichero nuestro corte empieza mucho antes.
    const inicioEnFichero = Math.max(0, inicio - offsetDescarga);

    // Loop: el final se ajusta (±1,5 s) al punto que mejor enlaza y cae en un pulso. Beat-drop: compases reales.
    const { duracionClip, golpes } = await analizarTramo(rutaDescarga, inicioEnFichero, duracion, { loop: Boolean(loopPerfecto), beats: Boolean(beatDropFx) });

    // Subtítulos ANTES de codificar: si se van a incrustar, ffmpeg los necesita en disco.
    const transcript = await fetchTranscript(videoId).catch(() => [] as TranscriptItem[]);
    const cues = buildSubtitleCues(transcript, inicio, duracionClip);
    const vttContent = buildVtt(cues);
    const words = buildWordOffsets(cues);
    const sinTranscripcionReal = cues.length === 0;

    const incrustarSubs = Boolean(burnSubtitles) && cues.length > 0;
    if (incrustarSubs) {
      const assContent = karaokeSubtitles ? buildKaraokeAssSubtitles(cues) : buildAssSubtitles(cues);
      await fs.promises.writeFile(rutaAss, assContent, "utf-8");
    }
    const rutaHook = await escribirRotuloHook(rutaHookAss, hookText, duracionClip);

    console.log(`[Reels] ffmpeg: modo ${cropMode}, subtítulos: ${incrustarSubs}, hook: ${Boolean(rutaHook)}, loop: ${Boolean(loopPerfecto)}`);
    const plan = await renderizarClip({
      rutaEntrada: rutaDescarga,
      rutaSalida,
      inicioEnFichero,
      duracion: duracionClip,
      cropMode,
      punchInZoom: Boolean(punchInZoom),
      beatDropFx: Boolean(beatDropFx), golpes,
      smartPan: Boolean(smartPan),
      rutaSubtitulos: incrustarSubs ? rutaAss : undefined,
      rutaHook,
      normalizarVolumen: normalizarVolumen !== false,
      loop: Boolean(loopPerfecto),
      calidad: "alta"
    });

    const tamano = fs.statSync(rutaSalida).size;

    // Control de calidad + subida a Storage + procedencia/derechos (ver guardarClipRenderizado).
    const perfil = await perfilDeLaPeticion(req);
    const { clipUrl, guardadoPermanente, derechos, calidad } = await guardarClipRenderizado({
      bandId: getTargetBandId(req),
      rutaLocal: rutaSalida,
      nombreFichero: nombreSalida,
      esperado: { hookPedido: Boolean(String(hookText || "").trim()), hookQuemado: Boolean(rutaHook), volumenNormalizado: normalizarVolumen !== false },
      procedencia: {
        sourceUrl: canonicalYouTubeUrl(videoId),
        canalOrigen: metaOrigen.author,
        youtubeDeLaBanda: perfil.youtube,
        nombreDeLaBanda: displayBandName(perfil),
        declaradoPorLaBanda: Boolean(derechosDeclarados),
        loopPerfecto: plan.loopAplicado, duracionSeg: plan.duracionFinal,
        hookText: String(hookText || "")
      }
    });

    // El clip se sirve como archivo estático (local o de Supabase Storage). Devolver 20-40 MB
    // en base64 dentro del JSON reventaba el límite del body y multiplicaba por 1,37 lo que
    // viajaba por la red.
    const respuesta: Record<string, unknown> = {
      success: true,
      clipUrl,
      clipFileName: nombreSalida,
      fileSize: tamano,
      storedPermanently: guardadoPermanente,
      start: inicio,
      duration: plan.duracionFinal,
      loopApplied: plan.loopAplicado,
      hookBurned: Boolean(rutaHook),
      rights: derechos,
      quality: calidad,
      cropMode,
      burnedSubtitles: incrustarSubs,
      subtitles: cues,
      words,
      vttContent,
      sinTranscripcionReal
    };

    // Compatibilidad con clientes antiguos que solo entienden base64, y solo si cabe y el
    // fichero local sigue existiendo (si ya se subió a Storage y se borró, no hay de dónde leerlo).
    if (inlineBase64 && tamano < 24 * 1024 * 1024 && fs.existsSync(rutaSalida)) {
      const buffer = await fs.promises.readFile(rutaSalida);
      respuesta.videoBase64 = `data:video/mp4;base64,${buffer.toString("base64")}`;
    }

    return res.json(respuesta);
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error("[Video Cut Error]:", err);
    await borrarSiExiste([rutaSalida]);
    return res.status(502).json({ success: false, error: explicarErrorYoutube(err) });
  } finally {
    await borrarSiExiste([rutaDescarga, rutaAss, rutaHookAss]);
  }
});

/* ============================================================================
 * POST /api/reanalyze-clip - Reanálisis de un corte concreto
 * ==========================================================================*/

router.post("/reanalyze-clip", requireAuth, iaRateLimiter, async (req, res) => {
  try {
    const {
      youtubeUrl,
      fileName,
      videoTitle,
      start = 0,
      duration = 30,
      userNotes = "",
      currentTitle = "",
      currentCopy = "",
      highlightId,
      videoKey: videoKeyExplicita,
      contentType,
      tonoRating,
      contenidoRating,
      alcance
    } = req.body || {};

    const tipoContenido: TipoContenido = esTipoContenido(contentType)
      ? contentType
      : detectarTipoContenido(videoTitle || fileName);

    // Para dejar el highlight reanalizado también actualizado en lo que ya se guardó en BD
    // (si no, la próxima vez que se recuperase el análisis guardado se vería la versión vieja).
    const videoKeyDelCorte = resolverVideoKey(youtubeUrl, videoKeyExplicita);
    const persistirPatch = async (patch: Record<string, unknown>) => {
      if (!videoKeyDelCorte || !highlightId) return;
      const bandId = getTargetBandId(req);
      await dbUpdateReelAnalysisHighlight(bandId, videoKeyDelCorte, highlightId, patch).catch(() => false);
    };

    const perfil = await perfilDeLaPeticion(req);
    const nombreBanda = displayBandName(perfil);
    const hashtagsBase = baseHashtags(perfil);

    const inicio = Math.max(0, Math.floor(Number(start) || 0));
    const duracion = Math.max(1, Math.floor(Number(duration) || 30));
    const fin = inicio + duracion;
    const rangoStr = `${formatMMSS(inicio)} - ${formatMMSS(fin)}`;

    let transcripcionExacta = "";
    const videoId = getYouTubeId(youtubeUrl);
    if (videoId) {
      const transcript = await fetchTranscript(videoId).catch(() => [] as TranscriptItem[]);
      const cues = buildSubtitleCues(transcript, inicio, duracion);
      transcripcionExacta = cues.map((c) => c.text).join(" ").trim();
    }

    const tituloVideo = videoTitle || fileName || `Corte de ${nombreBanda}`;
    const ai = getAiClient();

    if (ai) {
      const prompt = `Eres productor musical y responsable de contenidos. Estás REANALIZANDO un corte concreto de ${duracion} segundos (${rangoStr}) para publicarlo como Reel vertical.

${buildBandContextBlock(perfil)}

DATOS DEL CORTE:
- Tipo de material: ${estrategiaDe(tipoContenido).etiqueta}
- Vídeo de origen: "${tituloVideo}"
- Rango exacto: de ${formatMMSS(inicio)} a ${formatMMSS(fin)} (${duracion} s)
${transcripcionExacta ? `- Transcripción literal de ESTE tramo:\n"${transcripcionExacta.substring(0, 1500)}"` : "- En este tramo no hay letra ni voz transcrita: es un pasaje instrumental o sin subtítulos. NO inventes qué se dice."}
${userNotes ? `- OBSERVACIONES DEL USUARIO SOBRE ESTE TRAMO (mándan sobre cualquier suposición tuya): "${String(userNotes).substring(0, 600)}"` : ""}
${currentTitle ? `- Título que tenía antes: "${currentTitle}"` : ""}
${tonoRating ? `- El usuario valoró el TONO de la versión anterior con ${tonoRating}/5: si es bajo, es justo lo que hay que corregir ahora.` : ""}
${contenidoRating ? `- El usuario valoró el CONTENIDO de la versión anterior con ${contenidoRating}/5: si es bajo, revisa que describa de verdad este tramo.` : ""}

${buildReglasDeRedaccion(nombreBanda)}

REGLAS ESPECÍFICAS DE ESTE REANÁLISIS:
1. Reescribe título, razón y copy para que describan EXACTAMENTE estos ${duracion} segundos.
2. Si el usuario ha dejado observaciones, mándan sobre cualquier suposición: ajústalo todo a lo que dice.
3. Sin notas del usuario y sin transcripción, usa un título estructural en vez de inventar solos concretos.

Responde ÚNICAMENTE con JSON válido:
{
  "title": "Título preciso del corte",
  "reason": "Qué ocurre en estos segundos y por qué funciona en redes",
  "hookText": "Rótulo corto para los 2 primeros segundos",
  "recommendedCopy": "Pie de publicación listo para Instagram Reels",
  "copyTikTok": "Versión corta para TikTok",
  "copyFacebook": "Pie de publicación para Facebook, algo más explicativo",
  "hashtags": ["#Ejemplo"],
  "cta": "Llamada a la acción",
  "energyLevel": "Muy Alta",
  "confidence": 95
}`;

      try {
        const aiResponse = await generateContentWithFallback(ai, {
          contents: prompt,
          preferredModel: GEMINI_MODEL,
          bandId: getTargetBandId(req)
        });

        const parsed = extractJsonObject(aiResponse?.text);
        if (parsed && parsed.title) {
          const analysis = {
            title: String(parsed.title),
            reason: parsed.reason || "Fragmento reanalizado sobre el contenido real del tramo.",
            hookText: parsed.hookText || "",
            recommendedCopy: parsed.recommendedCopy || "",
            copyTikTok: parsed.copyTikTok || "",
            copyFacebook: parsed.copyFacebook || "",
            hashtags: Array.isArray(parsed.hashtags) && parsed.hashtags.length ? parsed.hashtags : hashtagsBase,
            cta: parsed.cta || "",
            energyLevel: parsed.energyLevel || "Alta",
            confidence: Number(parsed.confidence) || 90
          };
          await persistirPatch(analysis);

          // Solo se guarda como aprendizaje si el usuario dio una señal real (nota o valoración):
          // reanalizar un corte sin más (p.ej. tras mover el rango) no es feedback sobre el tono.
          if (String(userNotes || "").trim() || tonoRating || contenidoRating) {
            const feedbackLog = {
              id: `rf-${Date.now()}`,
              fecha: new Date().toISOString(),
              tituloPrevio: currentTitle || "",
              descripcionPrevia: currentCopy || "",
              comentario: String(userNotes || "").trim(),
              tonoRating: tonoRating || undefined,
              contenidoRating: contenidoRating || undefined,
              tituloNuevo: analysis.title,
              descripcionNueva: analysis.recommendedCopy,
              alcance: alcance === "este_reel" ? "este_reel" : "global"
            };
            dbLogReelFeedback(getTargetBandId(req), feedbackLog).catch((e: unknown) =>
              console.warn("[Reanalyze Clip] No se pudo guardar el feedback:", comoErrorCapturado(e).message || e)
            );
          }

          return res.json({ success: true, generatedByAI: true, analysis });
        }
      } catch (errCapturado) {
        const err = comoErrorCapturado(errCapturado);
        console.warn("[Reanalyze Clip AI Error]:", err?.message || err);
      }
    }

    const notas = String(userNotes || "").trim();
    const analysisRespaldo = {
      title: notas ? `${rangoStr}: ${notas.substring(0, 40)}` : `Corte de ${nombreBanda} (${rangoStr})`,
      reason: notas
        ? `Análisis ajustado a tus notas: "${notas.substring(0, 200)}"`
        : `Pasaje de "${tituloVideo}" entre ${formatMMSS(inicio)} y ${formatMMSS(fin)}.`,
      hookText: "",
      recommendedCopy: `${nombreBanda} en directo — fragmento de ${rangoStr}.${notas ? ` ${notas}` : ""}`,
      copyTikTok: "",
      copyFacebook: "",
      hashtags: hashtagsBase,
      cta: "¿Qué te ha parecido? Cuéntanoslo en comentarios.",
      energyLevel: "Alta",
      confidence: 80
    };
    await persistirPatch(analysisRespaldo);
    return res.json({
      success: true,
      generatedByAI: false,
      notice: "La IA no estaba disponible: este análisis es una plantilla basada en tus notas y en el rango del corte.",
      analysis: analysisRespaldo
    });
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error("[Reanalyze Clip Route Error]:", err);
    return responderError(res, err, "Error al reanalizar el fragmento.");
  }
});

// Texto del reel (Hook Doctor, copy perfecto) y aprendizaje con métricas reales.
router.use(reelsTextoRouter, reelsAprendizajeRouter, reelsProgramacionRouter);

export { parseRange };
export default router;
