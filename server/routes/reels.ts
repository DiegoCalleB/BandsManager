import express from "express";
import fs from "fs";
import path from "path";
import os from "os";
import ytdl from "@distube/ytdl-core";
import { YoutubeTranscript } from "youtube-transcript";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import { requireAuth, loadState } from "../state.js";
import { getAiClient, GEMINI_MODEL, generateContentWithFallback } from "../ai.js";
import { dbGetRegisteredBandById, dbGetEpkConfig, dbGetReelAnalysis, dbUpsertReelAnalysis, dbUpdateReelAnalysisHighlight, dbAppendBandSpeechPhrases, dbLogReelFeedback } from "../db.js";
import { getTargetBandId } from "../utils/bandAccess.js";
import { iaRateLimiter, renderRateLimiter, renderConcurrencyLimiter } from "../middleware/rateLimiter.js";
import {
  loadBandProfile,
  buildBandContextBlock,
  displayBandName,
  baseHashtags,
  emptyBandProfile,
  type BandProfile
} from "../utils/bandProfile.js";
import {
  metadatosDataApi,
  metadatosYtDlp,
  fusionarMetadatos,
  metadatosVacios,
  descargarConYtDlp,
  urlDeAudioDirecta,
  urlDeVideoDirecta,
  ytDlpDisponible,
  tieneClaveDataApi,
  type CapituloVideo,
  type MetadatosVideo
} from "../utils/youtubeSource.js";
import {
  analizarEnergiaAudio,
  ventanasConMasEnergia,
  resumirEnergiaParaPrompt
} from "../utils/audioEnergy.js";
import { buildEstrategiaBlock, buildReglasDeRedaccion, estrategiaDe } from "../utils/reelStrategy.js";
import { uploadToSupabaseIfAvailable, rutaAlmacenamientoClip } from "../utils/storage.js";
import {
  detectarCambiosDePlano,
  detectarTipoContenido,
  esTipoContenido,
  ventanasMasVirales,
  resumirSenalesParaPrompt,
  type TipoContenido,
  type VentanaViral
} from "../utils/viralSignals.js";
import {
  parseRange,
  formatMMSS,
  extractJsonObject,
  normalizeHighlights,
  buildFallbackHighlights,
  buildSubtitleCues,
  buildVtt,
  buildWordOffsets,
  buildAssSubtitles,
  buildVerticalFilter,
  escapeFilterPath,
  decodeTranscriptText,
  type CropMode,
  type TranscriptItem,
  type NormalizedHighlight
} from "../utils/reelsCore.js";

const router = express.Router();

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

/** Dónde se sirven los clips renderizados (server.ts ya expone /clips como estático). */
const CLIPS_DIR = path.join(process.cwd(), "public", "clips");
/** Cuánto vive un clip en disco antes de que lo barra la limpieza. */
const CLIP_TTL_MS = 6 * 60 * 60 * 1000;
/** Tope de duración de un recorte: por encima el render tarda demasiado y no es un Reel. */
const MAX_CLIP_SECONDS = 180;

function getYouTubeId(urlStr?: string): string | null {
  if (!urlStr) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/|live\/)([^#\&\?]*).*/;
  const match = String(urlStr).match(regExp);
  return match && match[2] && match[2].length === 11 ? match[2] : null;
}

/** URL canónica, para no pasarle a ytdl lo que haya escrito el usuario. */
function canonicalYouTubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

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

async function perfilDeLaPeticion(req: express.Request): Promise<BandProfile> {
  try {
    const bandId = getTargetBandId(req);
    return await loadBandProfile(bandId, {
      getBand: (id) => dbGetRegisteredBandById(id),
      getEpk: (id) => dbGetEpkConfig(id),
      getState: () => loadState()
    });
  } catch (err: any) {
    console.warn("[Reels] No se pudo cargar el perfil de la banda:", err?.message || err);
    return emptyBandProfile();
  }
}

/* --------------------------------------------------------------- YouTube I/O */

interface YoutubeMeta {
  videoId: string;
  title: string;
  description: string;
  author: string;
  duration: number;
  thumbnail: string;
  isLive: boolean;
  /** Marcados a mano por quien subió el vídeo: la mejor pista para elegir cortes. */
  chapters: CapituloVideo[];
  /** De dónde salió la ficha, para poder depurar por qué falta la duración. */
  fuente: MetadatosVideo["fuente"];
}

function metaVacia(videoId: string): YoutubeMeta {
  return {
    videoId,
    title: "",
    description: "",
    author: "",
    duration: 0,
    thumbnail: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "",
    isLive: false,
    chapters: [],
    fuente: "ninguna"
  };
}

/**
 * Ficha del vídeo, probando de la fuente más fiable a la menos:
 *   1. Data API oficial: no la bloquea el antibot y da la duración exacta.
 *   2. yt-dlp: aguanta el antibot y es el único que trae los capítulos.
 *   3. oEmbed: público, pero sin duración.
 *   4. ytdl-core: último recurso, el primero que YouTube tumba desde un datacenter.
 * En cuanto tenemos título y duración paramos: lo demás es gastar tiempo de petición.
 */
async function fetchYoutubeMeta(videoId: string): Promise<YoutubeMeta> {
  const meta = metaVacia(videoId);
  const url = canonicalYouTubeUrl(videoId);
  let acumulado = metadatosVacios();

  const completa = () => Boolean(acumulado.title) && acumulado.duration > 0;

  if (tieneClaveDataApi()) {
    acumulado = fusionarMetadatos(acumulado, await metadatosDataApi(videoId));
  }

  // yt-dlp aunque la Data API ya haya respondido, si aún faltan los capítulos y está instalado:
  // saber que el vídeo trae capítulos cambia por completo la calidad de los cortes.
  if (!completa() || (acumulado.chapters.length === 0 && (await ytDlpDisponible()))) {
    acumulado = fusionarMetadatos(acumulado, await metadatosYtDlp(url));
  }

  if (!completa()) {
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
      if (oembedRes.ok) {
        const oembed: any = await oembedRes.json();
        acumulado = fusionarMetadatos(acumulado, {
          ...metadatosVacios(),
          title: oembed?.title || "",
          author: oembed?.author_name || "",
          thumbnail: oembed?.thumbnail_url || "",
          fuente: "oembed"
        });
      }
    } catch (e) {
      /* oEmbed caído o vídeo privado: seguimos con ytdl-core */
    }
  }

  if (!completa()) {
    try {
      const info = await ytdl.getBasicInfo(url);
      const detalles: any = info?.videoDetails;
      if (detalles) {
        const miniaturas = detalles.thumbnails;
        acumulado = fusionarMetadatos(acumulado, {
          ...metadatosVacios(),
          title: detalles.title || "",
          description: detalles.description || "",
          author: detalles.author?.name || "",
          duration: parseInt(detalles.lengthSeconds, 10) || 0,
          thumbnail: Array.isArray(miniaturas) && miniaturas.length ? miniaturas[miniaturas.length - 1]?.url || "" : "",
          fuente: "ytdl-core"
        });
        meta.isLive = Boolean(detalles.isLiveContent && !detalles.lengthSeconds);
      }
    } catch (e: any) {
      // YouTube bloquea getBasicInfo desde IPs de datacenter. No es fatal: con la Data API
      // o yt-dlp por delante, aquí ya casi nunca hace falta llegar.
      console.log(`[Reels] getBasicInfo no disponible para ${videoId}:`, e?.message || e);
    }
  }

  meta.title = acumulado.title;
  meta.description = acumulado.description;
  meta.author = acumulado.author;
  meta.duration = acumulado.duration;
  meta.chapters = acumulado.chapters;
  meta.fuente = acumulado.fuente;
  if (acumulado.thumbnail) meta.thumbnail = acumulado.thumbnail;

  return meta;
}

/** Transcripción del vídeo completo, probando español y cayendo al idioma por defecto. */
async function fetchTranscript(videoId: string): Promise<TranscriptItem[]> {
  const intentos: Array<() => Promise<any[]>> = [
    () => YoutubeTranscript.fetchTranscript(videoId, { lang: "es" }) as any,
    () => YoutubeTranscript.fetchTranscript(videoId) as any,
    () => YoutubeTranscript.fetchTranscript(videoId, { lang: "en" }) as any
  ];

  for (const intento of intentos) {
    try {
      const bruto = await intento();
      if (Array.isArray(bruto) && bruto.length > 0) {
        return bruto
          .map((t: any) => ({
            offset: Number(t?.offset) || 0,
            duration: Number(t?.duration) || 0,
            text: decodeTranscriptText(t?.text)
          }))
          .filter((t: TranscriptItem) => t.text);
      }
    } catch (e) {
      /* siguiente idioma */
    }
  }
  return [];
}

/**
 * Traduce el fallo crudo de ytdl a algo que un músico pueda entender y accionar. El error
 * literal ("Sign in to confirm you're not a bot") no le dice nada a nadie.
 */
function explicarErrorYoutube(err: any): string {
  const msg = String(err?.message || err || "");
  if (/confirm you.?re not a bot|Sign in to confirm/i.test(msg)) {
    return "YouTube está pidiendo verificación antibot al servidor para descargar este vídeo. Suele ser temporal: prueba de nuevo en unos minutos, o sube el archivo de vídeo directamente en vez de usar la URL.";
  }
  if (/private video/i.test(msg)) {
    return "El vídeo es privado. Ponlo como público u oculto (no listado) para poder recortarlo.";
  }
  if (/Video unavailable|not available/i.test(msg)) {
    return "El vídeo no está disponible (puede estar borrado, restringido por país o solo para miembros).";
  }
  if (/age.?restricted/i.test(msg)) {
    return "El vídeo tiene restricción de edad y YouTube no permite descargarlo sin iniciar sesión.";
  }
  if (/premiere|live/i.test(msg)) {
    return "Es un directo o un estreno en curso. Espera a que termine y quede publicado para poder recortarlo.";
  }
  if (/ENOSPC/i.test(msg)) {
    return "No queda espacio en disco en el servidor para procesar el vídeo. Inténtalo de nuevo en unos minutos.";
  }
  return `No se pudo procesar el vídeo de YouTube: ${msg || "error desconocido"}`;
}

/* ------------------------------------------------------------- gestión de clips */

function asegurarDirectorioClips() {
  if (!fs.existsSync(CLIPS_DIR)) fs.mkdirSync(CLIPS_DIR, { recursive: true });
}

let ultimaLimpieza = 0;
/** No más de una barrida cada cuarto de hora, aunque lluevan peticiones. */
const INTERVALO_LIMPIEZA_MS = 15 * 60 * 1000;

/**
 * Borra los clips viejos para que public/clips no crezca sin freno en el disco de Railway.
 *
 * Es asíncrona y va limitada por tiempo a propósito: antes recorría el directorio con
 * readdirSync + statSync por fichero EN CADA petición de recorte, bloqueando el bucle de
 * eventos —y por tanto a todos los demás usuarios— justo cuando más ocupado está el servidor.
 */
async function limpiarClipsAntiguos(): Promise<void> {
  const ahora = Date.now();
  if (ahora - ultimaLimpieza < INTERVALO_LIMPIEZA_MS) return;
  ultimaLimpieza = ahora;

  try {
    if (!fs.existsSync(CLIPS_DIR)) return;
    const ficheros = await fs.promises.readdir(CLIPS_DIR);
    for (const fichero of ficheros) {
      if (!/\.(mp4|vtt|ass)$/i.test(fichero)) continue;
      const completo = path.join(CLIPS_DIR, fichero);
      try {
        const info = await fs.promises.stat(completo);
        if (ahora - info.mtimeMs > CLIP_TTL_MS) await fs.promises.unlink(completo);
      } catch (e) {
        /* fichero en uso o ya borrado */
      }
    }
  } catch (e) {
    console.warn("[Reels] No se pudieron limpiar los clips antiguos:", e);
  }
}

async function borrarSiExiste(rutas: string[]) {
  for (const ruta of rutas) {
    try {
      if (ruta && fs.existsSync(ruta)) await fs.promises.unlink(ruta);
    } catch (e) {
      console.error("[Reels] Error borrando temporal:", ruta, e);
    }
  }
}

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

  const descargar = (opciones: any) =>
    new Promise<void>((resolve, reject) => {
      const stream = ytdl(url, opciones);
      const writeStream = fs.createWriteStream(destino);
      let fallado = false;
      const fallar = (err: any) => {
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
      filter: (format: any) => format.container === "mp4" && Boolean(format.hasVideo) && Boolean(format.hasAudio)
    });
  } catch (primerError: any) {
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
  } catch (err: any) {
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
  } catch (err: any) {
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

    // Señales medidas sobre el vídeo real. Medir solo el volumen encontraba "dónde suena
    // fuerte", que en un concierto entero a todo trapo no distingue nada; ahora se mide
    // también el CONTRASTE al arrancar el corte y el ritmo de montaje.
    // Best-effort y con tope de tiempo: si no se pueden medir, el análisis sigue igual.
    const analizarAudio = req.body?.analyzeAudio !== false;
    let ventanasEnergia: ReturnType<typeof ventanasConMasEnergia> = [];
    let ventanasVirales: VentanaViral[] = [];
    let cambiosDePlano: number[] = [];

    if (analizarAudio && videoId) {
      try {
        const urlAudio = await urlDeAudioDirecta(canonicalYouTubeUrl(videoId));
        if (urlAudio) {
          const curva = await analizarEnergiaAudio(urlAudio, { timeoutMs: 120_000 });

          // La señal visual solo se pide cuando de verdad va a pesar en la puntuación: en un
          // ensayo grabado con el móvil en una silla, contar planos es gastar CPU para nada.
          if (curva.length > 0 && tipoContenido !== "ensayo") {
            // urlDeAudioDirecta/urlDeVideoDirecta, NO canonicalYouTubeUrl: esa es la URL de la
            // página de YouTube, y ffmpeg no puede decodificarla directamente con -i.
            const urlVideo = await urlDeVideoDirecta(canonicalYouTubeUrl(videoId));
            if (urlVideo) {
              cambiosDePlano = await detectarCambiosDePlano(urlVideo, { timeoutMs: 150_000 });
            }
          }

          ventanasVirales = ventanasMasVirales(curva, {
            duracion: objetivoClip,
            tipo: tipoContenido,
            cambiosDePlano,
            maxVentanas: 6
          });
          // Se mantiene la lista por energía pura para los cortes de respaldo sin IA.
          ventanasEnergia = ventanasConMasEnergia(curva, { duracion: objetivoClip, maxVentanas: 6 });
          console.log(
            `[Reels] Señales: ${curva.length} puntos de audio, ${cambiosDePlano.length} cambios de plano, ` +
            `${ventanasVirales.length} tramos candidatos (tipo: ${tipoContenido}).`
          );
        }
      } catch (e: any) {
        console.log("[Reels] Análisis de señales omitido:", e?.message || e);
      }
    }

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
    let optimalTime: any = null;
    let generadoPorIa = false;
    let avisoIa = "";
    // Frases reales de directo (habla, no letra cantada) extraídas de la transcripción: la fuente
    // de tono más auténtica que hay. Se acumulan en el ADN de la banda más abajo.
    let frasesDirectoExtraidas: string[] = [];

    if (ai) {
      const prompt = `Eres quien decide qué trozo de un vídeo se convierte en Reel para una banda de música. Trabajas con material REAL y con señales medidas sobre él, no con suposiciones.

${buildBandContextBlock(perfil)}

${buildEstrategiaBlock(tipoContenido)}

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
- Cada fragmento dura unos ${objetivoClip} segundos (se acepta de ${Math.max(8, Math.round(objetivoClip * 0.7))} a ${Math.round(objetivoClip * 1.3)} s).
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
          preferredModel: GEMINI_MODEL
        });

        const parsed = extractJsonObject(aiResponse?.text);
        const candidatos = normalizeHighlights(parsed?.highlights, {
          videoDuration: duracionTotal,
          targetDuration: objetivoClip,
          defaultHashtags: hashtagsBase
        });

        if (candidatos.length > 0) {
          highlights = candidatos;
          optimalTime = parsed?.optimalTime || null;
          generadoPorIa = true;
        } else {
          avisoIa = "La IA respondió pero sin fragmentos utilizables; se muestran cortes automáticos que puedes ajustar a mano.";
        }

        if (Array.isArray(parsed?.frasesDirectoExtraidas)) {
          frasesDirectoExtraidas = parsed.frasesDirectoExtraidas
            .map((f: any) => String(f || "").trim())
            .filter(Boolean)
            .slice(0, 5);
        }
      } catch (err: any) {
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
      dbAppendBandSpeechPhrases(getTargetBandId(req), frasesDirectoExtraidas).catch((e: any) =>
        console.warn("[Highlights AI] No se pudieron guardar las frases de directo:", e?.message || e)
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
  } catch (err: any) {
    console.error("[Highlights AI Route Error]:", err);
    return res.status(500).json({
      success: false,
      error: `Error al procesar el vídeo: ${err?.message || err}`
    });
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
    inlineBase64 = false
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

  // `cropVertical` es el flag antiguo (booleano); `cropMode` el nuevo con tres opciones.
  const cropMode: CropMode = ["crop", "blur", "none"].includes(String(cropModeRaw))
    ? (String(cropModeRaw) as CropMode)
    : cropVertical
      ? "crop"
      : "none";

  const reqId = `clip_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const rutaDescarga = path.join(os.tmpdir(), `${reqId}_raw.mp4`);
  const rutaAss = path.join(os.tmpdir(), `${reqId}_subs.ass`);
  asegurarDirectorioClips();
  const nombreSalida = `${reqId}.mp4`;
  const rutaSalida = path.join(CLIPS_DIR, nombreSalida);

  // Sin await: el usuario no tiene por qué esperar a que se barra el directorio.
  void limpiarClipsAntiguos();

  try {
    const urlCanonica = canonicalYouTubeUrl(videoId);

    console.log(`[Reels] Descargando ${videoId} para recortar ${inicio}s +${duracion}s...`);
    const offsetDescarga = await descargarVideo(urlCanonica, rutaDescarga, { start: inicio, duration: duracion });
    // Si solo se bajó el tramo, dentro del fichero nuestro corte empieza mucho antes.
    const inicioEnFichero = Math.max(0, inicio - offsetDescarga);

    // Subtítulos ANTES de codificar: si se van a incrustar, ffmpeg los necesita en disco.
    const transcript = await fetchTranscript(videoId).catch(() => [] as TranscriptItem[]);
    const cues = buildSubtitleCues(transcript, inicio, duracion);
    const vttContent = buildVtt(cues);
    const words = buildWordOffsets(cues);
    const sinTranscripcionReal = cues.length === 0;

    const incrustarSubs = Boolean(burnSubtitles) && cues.length > 0;
    if (incrustarSubs) {
      await fs.promises.writeFile(rutaAss, buildAssSubtitles(cues), "utf-8");
    }

    console.log(`[Reels] ffmpeg: modo ${cropMode}, subtítulos incrustados: ${incrustarSubs}`);
    await new Promise<void>((resolve, reject) => {
      // Seek híbrido: un salto rápido de entrada hasta 5 s antes del corte (barato, salta al
      // keyframe) y el resto como seek de salida (exacto al fotograma). Con solo el seek de
      // salida, un corte del minuto 12 obligaba a decodificar 12 minutos de vídeo.
      const saltoEntrada = Math.max(0, inicioEnFichero - 5);
      const ajusteSalida = inicioEnFichero - saltoEntrada;

      const comando = ffmpeg(rutaDescarga);
      if (saltoEntrada > 0) comando.seekInput(saltoEntrada);
      if (ajusteSalida > 0) comando.setStartTime(ajusteSalida);
      comando.setDuration(duracion);

      const filtros = buildVerticalFilter(cropMode);
      if (incrustarSubs) {
        const filtroSubs = `subtitles='${escapeFilterPath(rutaAss)}'`;
        if (filtros.length) {
          // La última etiqueta de salida del encadenado vertical es [v].
          filtros[filtros.length - 1] = `${filtros[filtros.length - 1].replace(/\[v\]$/, "[vpre]")}`;
          filtros.push(`[vpre]${filtroSubs}[v]`);
        } else {
          filtros.push(`[0:v]${filtroSubs}[v]`);
        }
      }

      if (filtros.length) {
        comando.complexFilter(filtros, "v");
        comando.outputOptions(["-map 0:a?"]);
      }

      comando
        .outputOptions([
          "-c:v libx264",
          "-preset veryfast",
          "-crf 23",
          "-pix_fmt yuv420p",
          "-c:a aac",
          "-b:a 128k",
          "-ar 44100",
          "-movflags +faststart"
        ])
        .output(rutaSalida)
        .on("error", (err) => reject(err))
        .on("end", () => resolve())
        .run();
    });

    if (!fs.existsSync(rutaSalida) || fs.statSync(rutaSalida).size === 0) {
      throw new Error("ffmpeg no generó ningún archivo de salida.");
    }

    const tamano = fs.statSync(rutaSalida).size;

    // Se intenta subir a Supabase Storage para que el clip sobreviva al próximo despliegue:
    // public/clips/ vive en el disco EFÍMERO de Railway, y se pierde en cada redeploy.
    // Best-effort: si Supabase no responde, se sigue sirviendo desde el disco local exactamente
    // como antes (mismo comportamiento, solo que ese clip no sobrevivirá a un redeploy).
    let clipUrl = `/clips/${nombreSalida}`;
    let guardadoPermanente = false;
    try {
      const bandId = getTargetBandId(req);
      const urlPermanente = await uploadToSupabaseIfAvailable(
        rutaSalida,
        rutaAlmacenamientoClip(bandId, nombreSalida),
        "video/mp4"
      );
      if (urlPermanente) {
        clipUrl = urlPermanente;
        guardadoPermanente = true;
        // Ya no hace falta servirlo desde el disco local: subido con éxito, se libera el
        // espacio ya mismo en vez de esperar a la barrida periódica.
        await borrarSiExiste([rutaSalida]);
      }
    } catch (err: any) {
      console.warn("[Reels] No se pudo subir el clip a Supabase Storage:", err?.message || err);
    }

    // El clip se sirve como archivo estático (local o de Supabase Storage). Devolver 20-40 MB
    // en base64 dentro del JSON reventaba el límite del body y multiplicaba por 1,37 lo que
    // viajaba por la red.
    const respuesta: any = {
      success: true,
      clipUrl,
      clipFileName: nombreSalida,
      fileSize: tamano,
      storedPermanently: guardadoPermanente,
      start: inicio,
      duration: duracion,
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
  } catch (err: any) {
    console.error("[Video Cut Error]:", err);
    await borrarSiExiste([rutaSalida]);
    return res.status(502).json({ success: false, error: explicarErrorYoutube(err) });
  } finally {
    await borrarSiExiste([rutaDescarga, rutaAss]);
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
    const persistirPatch = async (patch: Record<string, any>) => {
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
          preferredModel: GEMINI_MODEL
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
            dbLogReelFeedback(getTargetBandId(req), feedbackLog).catch((e: any) =>
              console.warn("[Reanalyze Clip] No se pudo guardar el feedback:", e?.message || e)
            );
          }

          return res.json({ success: true, generatedByAI: true, analysis });
        }
      } catch (err: any) {
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
  } catch (err: any) {
    console.error("[Reanalyze Clip Route Error]:", err);
    return res.status(500).json({
      success: false,
      error: `Error al reanalizar el fragmento: ${err?.message || err}`
    });
  }
});

export { parseRange };
export default router;
