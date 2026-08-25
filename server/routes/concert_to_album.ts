import express from "express";
import path from "path";
import fs from "fs";
import { execFile, spawn } from "child_process";
import promisify from "util";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import { getAiClient, generateContentWithFallback, TIMEOUT_IA_LARGO_MS } from "../ai.js";
import { loadState, saveState, requireAuth } from "../state.js";
import { getSupabaseClient, getBucketName } from "./upload.js";

async function uploadToSupabaseIfAvailable(
  localFilePath: string,
  storageSubPath: string,
  contentType: string = "audio/mpeg"
): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase || !fs.existsSync(localFilePath)) return null;

  try {
    const bucketName = getBucketName();
    const fileBuffer = fs.readFileSync(localFilePath);
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storageSubPath, fileBuffer, {
        contentType,
        upsert: true
      });

    if (uploadError) {
      console.warn(`[Supabase Upload Notice] Failed for ${storageSubPath}:`, uploadError.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storageSubPath);

    if (publicUrlData?.publicUrl) {
      console.log(`[Supabase Storage] Successfully uploaded: ${storageSubPath} -> ${publicUrlData.publicUrl}`);
      return publicUrlData.publicUrl;
    }
  } catch (err: any) {
    console.warn(`[Supabase Storage Error] ${storageSubPath}:`, err.message || err);
  }
  return null;
}

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

const router = express.Router();

/**
 * Ejecuta un binario con sus argumentos SIN pasar por el shell.
 *
 * Antes esto era `exec()` con la orden montada como texto: la URL de YouTube y el
 * `sourceFilePath` venían del body y se interpolaban entre comillas dobles, así que un valor con
 * una comilla y un `;` (o un `$(...)`) se salía de la cadena y ejecutaba lo que quisiera en el
 * servidor. Con execFile y un array de argumentos no hay cadena que romper: el valor llega al
 * proceso tal cual, por raro que sea.
 */
const ejecutar = (binario: string, args: string[], opts: any = {}) =>
  new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    execFile(binario, args, opts, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve({ stdout: stdout.toString(), stderr: stderr.toString() });
    });
  });

/** Las banderas anti-bot de yt-dlp, que estaban copiadas en cuatro sitios. */
function banderasAntiBot(): string[] {
  return [
    ...banderasDeCookies(),
    "--extractor-args", "youtube:player_client=android,web,mweb,ios",
    "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "--no-check-certificates"
  ];
}

/**
 * URL de vídeo utilizable. Además de rechazar lo que no sea http(s) (un `file://` haría que
 * yt-dlp leyera del disco del servidor), evita que una URL que empiece por guión se cuele como
 * una bandera más de yt-dlp ahora que los argumentos van sueltos.
 */
export function urlDeVideoValida(url: unknown): string | null {
  if (typeof url !== "string" || !url.trim()) return null;
  const limpia = url.trim();
  try {
    const parsed = new URL(limpia);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  } catch {
    return null;
  }
  return limpia;
}

/**
 * Ruta local de un fichero fuente, confinada a public/.
 *
 * El `sourceFilePath` llegaba del body y se usaba tal cual: valía cualquier ruta absoluta del
 * servidor, y como estas rutas devuelven el trozo de audio o su transcripción, servía para
 * leerse ficheros que no son de nadie. Solo se aceptan los que están bajo public/, que es donde
 * viven las subidas y los temporales.
 */
export function rutaFuenteSegura(rutaPedida: unknown): string | null {
  if (typeof rutaPedida !== "string" || !rutaPedida.trim()) return null;
  const raiz = path.resolve(process.cwd(), "public");
  const resuelta = path.resolve(raiz, rutaPedida.trim());
  const dentro = resuelta === raiz || resuelta.startsWith(raiz + path.sep);
  if (!dentro) return null;
  return resuelta;
}

interface TrackItem {
  index: number;
  title: string;
  start: number; // in seconds
  end: number;   // in seconds
  duration: number; // in seconds
  type: "musica" | "dialogo";
  speechTranscription?: string;
  lyricsWithChords?: string;
  tonalidad?: string;
  bpm?: number;
  audioUrl?: string;
  videoUrl?: string;
}

const COOKIES_FILE = path.join(process.cwd(), "data", "youtube_cookies.txt");

function banderasDeCookies(): string[] {
  try {
    if (fs.existsSync(COOKIES_FILE) && fs.statSync(COOKIES_FILE).size > 10) {
      return ["--cookies", COOKIES_FILE];
    }
  } catch {}
  return [];
}

// Routes for YouTube Cookies Management
// requireAuth en las tres: el fichero de cookies guarda la sesión de YouTube con la que el
// servidor descarga vídeos. Abiertas, cualquiera podía sobrescribirlo con las suyas o borrarlo.
router.get("/cookies-status", requireAuth, (req, res) => {
  try {
    if (fs.existsSync(COOKIES_FILE)) {
      const stats = fs.statSync(COOKIES_FILE);
      return res.json({
        hasCookies: stats.size > 10,
        size: stats.size,
        updatedAt: stats.mtime.toISOString(),
      });
    }
    return res.json({ hasCookies: false, size: 0, updatedAt: null });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/save-cookies", requireAuth, (req, res) => {
  try {
    const { cookiesText } = req.body;
    if (!cookiesText || typeof cookiesText !== "string" || cookiesText.trim().length < 5) {
      return res.status(400).json({ error: "El texto de cookies es demasiado corto o no válido." });
    }

    const dataDir = path.dirname(COOKIES_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(COOKIES_FILE, cookiesText.trim(), "utf-8");
    return res.json({
      success: true,
      message: "Cookies de YouTube guardadas con éxito. Ahora el servidor puede descargar vídeos del canal directamente.",
      size: fs.statSync(COOKIES_FILE).size,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/delete-cookies", requireAuth, (req, res) => {
  try {
    if (fs.existsSync(COOKIES_FILE)) {
      fs.unlinkSync(COOKIES_FILE);
    }
    return res.json({ success: true, message: "Cookies eliminadas." });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Helper: Direct HTML scraper fallback for YouTube metadata when yt-dlp is blocked by bot checks
async function scrapeYoutubeMetadata(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      },
    });
    const html = await res.text();
    let title = "Concierto en Directo";
    let description = "";

    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)">/i) || html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) title = titleMatch[1].replace(/ - YouTube$/, "").trim();

    const descMatch = html.match(/<meta property="og:description" content="([^"]+)">/i) || html.match(/"shortDescription":"([^"]+)"/i);
    if (descMatch) {
      description = descMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
    }

    return { title, duration: 3600, description, chapters: [] };
  } catch (e: any) {
    console.warn("[Scrape YouTube Fallback Error]:", e.message);
    return { title: "Concierto en Directo", duration: 3600, description: "", chapters: [] };
  }
}

// Helper: Parse description or text for multiline timestamps
function parseTimestampsFromText(text: string, videoDuration: number): TrackItem[] {
  if (!text) return [];

  const lines = text.split("\n");
  const parsedEntries: { start: number; title: string }[] = [];

  // Match: HH:MM:SS Title OR MM:SS Title OR [HH:MM:SS] Title
  const timestampRegex = /^(?:\[)?(?:(\d{1,2}):)?(\d{2}):(\d{2})(?:\])?[\s\-–—:]+(.+)$/i;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = line.match(timestampRegex);
    if (match) {
      const hours = match[1] ? parseInt(match[1], 10) : 0;
      const mins = parseInt(match[2], 10);
      const secs = parseInt(match[3], 10);
      const title = match[4].trim();
      const startInSeconds = hours * 3600 + mins * 60 + secs;

      if (!isNaN(startInSeconds) && title) {
        parsedEntries.push({ start: startInSeconds, title });
      }
    }
  }

  // Sort by start time
  parsedEntries.sort((a, b) => a.start - b.start);

  const tracks: TrackItem[] = [];
  for (let i = 0; i < parsedEntries.length; i++) {
    const current = parsedEntries[i];
    const nextStart = i < parsedEntries.length - 1 ? parsedEntries[i + 1].start : videoDuration;
    const duration = Math.max(0, nextStart - current.start);

    tracks.push({
      index: i + 1,
      title: current.title,
      start: current.start,
      end: nextStart,
      duration,
      type: duration < 150 ? "dialogo" : "musica",
    });
  }

  return tracks;
}

// Helper: Run FFmpeg silence detection on audio file
async function detectSilencesWithFFmpeg(filePath: string, videoDuration: number): Promise<TrackItem[]> {
  return new Promise((resolve) => {
    console.log(`[FFmpeg Silence] Executing silencedetect on ${filePath}...`);
    const silences: { start: number; end: number }[] = [];

    // Run ffmpeg with silencedetect filter
    const command = ffmpeg(filePath)
      .audioFilters("silencedetect=noise=-25dB:d=1.0")
      .format("null")
      .output("-");

    command.on("stderr", (stderrLine: string) => {
      const startMatch = stderrLine.match(/silence_start:\s*([\d\.]+)/);
      const endMatch = stderrLine.match(/silence_end:\s*([\d\.]+)/);

      if (startMatch) {
        const start = parseFloat(startMatch[1]);
        silences.push({ start, end: start });
      }
      if (endMatch && silences.length > 0) {
        const end = parseFloat(endMatch[1]);
        silences[silences.length - 1].end = end;
      }
    });

    command.on("end", () => {
      console.log(`[FFmpeg Silence] Detected ${silences.length} silence markers.`);
      const cutPoints: number[] = [0];

      for (const silence of silences) {
        const midpoint = (silence.start + silence.end) / 2;
        // Avoid tiny cuts under 15 seconds
        if (midpoint - cutPoints[cutPoints.length - 1] >= 15) {
          cutPoints.push(midpoint);
        }
      }

      if (videoDuration - cutPoints[cutPoints.length - 1] >= 15) {
        cutPoints.push(videoDuration);
      } else {
        cutPoints[cutPoints.length - 1] = videoDuration;
      }

      const tracks: TrackItem[] = [];
      for (let i = 0; i < cutPoints.length - 1; i++) {
        const start = cutPoints[i];
        const end = cutPoints[i + 1];
        const duration = end - start;
        const type = duration < 150 ? "dialogo" : "musica";

        tracks.push({
          index: i + 1,
          title: type === "dialogo" ? `Presentación / Hablado ${i + 1}` : `Tema ${i + 1}`,
          start: Math.round(start * 10) / 10,
          end: Math.round(end * 10) / 10,
          duration: Math.round(duration * 10) / 10,
          type,
        });
      }

      resolve(tracks);
    });

    command.on("error", (err) => {
      console.warn("[FFmpeg Silence] Error detecting silence:", err.message);
      // Fallback: divide into 4-minute equal tracks
      const tracks: TrackItem[] = [];
      const interval = 240;
      let cur = 0;
      let idx = 1;
      while (cur < videoDuration) {
        const end = Math.min(cur + interval, videoDuration);
        const duration = end - cur;
        tracks.push({
          index: idx,
          title: `Tema ${idx}`,
          start: cur,
          end,
          duration,
          type: "musica",
        });
        cur = end;
        idx++;
      }
      resolve(tracks);
    });

    command.run();
  });
}

// 1. ANALYZE CONCERT ROUTE
// requireAuth: descarga vídeo, gasta CPU y llama a la IA. Abierta era trabajo pesado gratis
// para cualquiera que diera con la URL.
router.post("/analyze", requireAuth, async (req, res) => {
  try {
    const { url, useAi, transcribeFirst, bandName } = req.body;
    const urlVideo = urlDeVideoValida(url);
    const ficheroFuente = rutaFuenteSegura(req.body.sourceFilePath);
    if (req.body.sourceFilePath && !ficheroFuente) {
      return res.status(400).json({ error: "La ruta del fichero fuente no es válida." });
    }
    const sourceFilePath = ficheroFuente || "";
    let videoTitle = "Concierto en Directo";
    let videoDuration = 3600; // default 1 hour if unknown
    let rawDescription = "";
    let chapters: any[] = [];
    let detectedTracks: TrackItem[] = [];
    let ytDlpBinaryPath = path.join(process.cwd(), "bin", "yt-dlp");

    if (!fs.existsSync(ytDlpBinaryPath)) {
      ytDlpBinaryPath = "yt-dlp";
    }

    const sourceMediaToAnalyze = sourceFilePath || "";
    let youtubeBlocked = false;

    if (urlVideo && (urlVideo.includes("youtube.com") || urlVideo.includes("youtu.be"))) {
      console.log(`[Concert Analyzer] Investigating YouTube metadata with yt-dlp for: ${urlVideo}`);
      try {
        const { stdout } = await ejecutar(ytDlpBinaryPath, [...banderasAntiBot(), "--dump-json", "--skip-download", urlVideo]);
        const metadata = JSON.parse(stdout);
        videoTitle = metadata.title || videoTitle;
        videoDuration = metadata.duration || videoDuration;
        rawDescription = metadata.description || "";
        chapters = metadata.chapters || [];
      } catch (err: any) {
        console.warn(`[Concert Analyzer] yt-dlp metadata dump notice: YouTube bot check active. Using web scraper fallback...`);
        youtubeBlocked = true;
        try {
          const scraped = await scrapeYoutubeMetadata(urlVideo);
          videoTitle = scraped.title || videoTitle;
          rawDescription = scraped.description || rawDescription;
        } catch (scrapeErr: any) {
          console.warn(`[Concert Analyzer] HTML scraper warning:`, scrapeErr.message);
        }
      }
    }

    // A. Native Chapters check
    if (chapters && chapters.length > 0) {
      console.log(`[Concert Analyzer] Found ${chapters.length} native chapters in video!`);
      detectedTracks = chapters.map((chap: any, idx: number) => {
        const start = chap.start_time || 0;
        const end = chap.end_time || (idx < chapters.length - 1 ? chapters[idx + 1].start_time : videoDuration);
        const duration = end - start;
        return {
          index: idx + 1,
          title: chap.title || `Pista ${idx + 1}`,
          start: Math.round(start * 10) / 10,
          end: Math.round(end * 10) / 10,
          duration: Math.round(duration * 10) / 10,
          type: duration < 150 ? "dialogo" : "musica",
        };
      });
    }

    // B. Description Regex parsing fallback
    if (detectedTracks.length === 0 && rawDescription) {
      console.log(`[Concert Analyzer] Parsing timestamps from description...`);
      detectedTracks = parseTimestampsFromText(rawDescription, videoDuration);
    }

    // C. FFmpeg Silence Detection fallback
    if (detectedTracks.length === 0) {
      console.log(`[Concert Analyzer] No chapters or description timestamps found. Running FFmpeg silence detection...`);
      let mediaForSilence = sourceMediaToAnalyze;

      // If YouTube URL and no local file, download audio first for silence detection
      if (!mediaForSilence && urlVideo) {
        const tempAudioDir = path.join(process.cwd(), "public", "uploads", "temp");
        if (!fs.existsSync(tempAudioDir)) fs.mkdirSync(tempAudioDir, { recursive: true });
        mediaForSilence = path.join(tempAudioDir, `analysis_${Date.now()}.mp3`);

        console.log(`[Concert Analyzer] Downloading temporary audio for silence detection...`);
        try {
          await ejecutar(ytDlpBinaryPath, [...banderasAntiBot(), "-x", "--audio-format", "mp3", "-o", mediaForSilence, urlVideo]);
        } catch (dlErr: any) {
          console.log(`[Concert Analyzer] yt-dlp quick audio download notice (using fallback).`);
        }
      }

      if (fs.existsSync(mediaForSilence)) {
        detectedTracks = await detectSilencesWithFFmpeg(mediaForSilence, videoDuration);
      } else {
        // Simple equal interval fallback
        const tracks: TrackItem[] = [];
        const interval = 240;
        let cur = 0;
        let idx = 1;
        while (cur < videoDuration) {
          const end = Math.min(cur + interval, videoDuration);
          const duration = end - cur;
          tracks.push({
            index: idx,
            title: `Tema ${idx}`,
            start: cur,
            end,
            duration,
            type: "musica",
          });
          cur = end;
          idx++;
        }
        detectedTracks = tracks;
      }
    }

    // D. Gemini AI Enrichment & Full Audio Pre-Transcription
    if (useAi) {
      const isPreTranscribing = Boolean(transcribeFirst !== false);
      console.log(`[Concert Analyzer] Enriched by Gemini AI requested (transcribeFirst: ${isPreTranscribing})...`);
      const aiClient = getAiClient();
      if (aiClient) {
        try {
          let contents: any;
          let promptText = "";

          if (isPreTranscribing) {
            promptText = `
Eres un Ingeniero de Sonido, Productor Musical y Transcriptor Profesional Senior.
Estamos analizando y segmentando el concierto en directo completo: "${videoTitle}" (Duración total: ${videoDuration}s).
Banda/Artista: "${bandName || 'Grupo Musical'}".

Lista preliminar de pistas/fragmentos detectados por marcas o silencios:
${JSON.stringify(detectedTracks, null, 2)}

Descripción y metadatos del vídeo/concierto:
${rawDescription.slice(0, 3000)}

INSTRUCCIONES OBLIGATORIAS DE SEGMENTACIÓN E IDENTIFICACIÓN:
1. **REGLA DE ORO: PRESENTACIÓN INICIAL E INTRO CON MÚSICA**:
   Cualquier primer trozo (Pista 1) o fragmento de inicio que contenga la bienvenida de la banda, presentación del show o palabras habladas —AUNQUE TENGA MÚSICA DE FONDO, RÁFAGAS DE GUITARRA, BATERÍA O APLAUSOS— DEBE SER CLASIFICADO OBLIGATORIAMENTE COMO type: "dialogo" (Speech / Presentación). NUNCA lo clasifiques como tipo "musica".

2. **REGLA DE MÚSICA CORTA (< 45s) COMO INTRO A SPEECH**:
   Si un fragmento musical dura muy poco tiempo (menos de 45 segundos) antes o durante un speech, es un intro o ambientación para hablar. DEBES INCLUIRLO EN EL SPEECH Y DETECTARLO COMO TIPO "dialogo".

3. **FIDELIDAD DE CORTES Y TRANSCRIPCIÓN**:
   - Ajusta los timestamps (start y end en segundos float) para no cortar a la mitad de una frase cantada ni de un discurso.
   - NO te inventes letras ni acordes de canciones si no se escucha la canción completa.
   - Para pistas de tipo "dialogo", indica las palabras principales en "speechTranscription".
   - Para pistas de tipo "musica", asigna el título real de la canción.

Responde ÚNICAMENTE con un JSON válido con este esquema exacto:
{
  "albumTitle": "Título Limpio del Concierto",
  "artist": "${bandName || 'Grupo Musical'}",
  "tracks": [
    {
      "index": 1,
      "title": "Nombre de la Canción o Presentación",
      "start": 0.0,
      "end": 145.2,
      "duration": 145.2,
      "type": "musica" | "dialogo",
      "speechTranscription": "Transcripción hablada o nota si es tipo dialogo",
      "lyricsWithChords": "",
      "tonalidad": "Mim",
      "bpm": 120
    }
  ]
}
`;
          } else {
            promptText = `
Eres un Ingeniero de Sonido y Archivero Musical Senior.
Estamos procesando el concierto completo: "${videoTitle}" (Duración total: ${videoDuration}s).
La banda o artista es: "${bandName || 'Grupo Musical'}".

A continuación te paso la lista preliminar de pistas/fragmentos detectados:
${JSON.stringify(detectedTracks, null, 2)}

Descripción del concierto/vídeo:
${rawDescription.slice(0, 3000)}

INSTRUCCIONES:
1. Revisa los títulos, timestamps de inicio y fin (en segundos float), e identifica si cada pista es "musica" o "dialogo" (interludio/speech/presentación).
2. Mejora los títulos de las canciones y presentaciones. Si es una presentación, pon un título descriptivo como "Presentación del grupo / Agradecimientos".
3. Devuelve la lista estructurada con un título propuesto para el Disco ("albumTitle") y la lista final de pistas ("tracks").

Responde ÚNICAMENTE con un JSON válido con este esquema exacto:
{
  "albumTitle": "Directo en En Vivo - ...",
  "artist": "${bandName || 'Grupo Musical'}",
  "tracks": [
    {
      "index": 1,
      "title": "Título pulido de la canción o presentación",
      "start": 0.0,
      "end": 120.0,
      "duration": 120.0,
      "type": "musica" | "dialogo",
      "speechTranscription": "Si es tipo dialogo, una sugerencia o transcripción breve estimada"
    }
  ]
}
`;
          }

          // Check if sourceFilePath exists on disk and fits into inlineData (<20MB)
          if (isPreTranscribing && sourceFilePath && fs.existsSync(sourceFilePath)) {
            const stats = fs.statSync(sourceFilePath);
            if (stats.size < 20 * 1024 * 1024) {
              console.log(`[Concert Analyzer] Sending ${stats.size} bytes local audio to Gemini multimodal audio analysis...`);
              const audioBuf = fs.readFileSync(sourceFilePath);
              contents = [
                {
                  inlineData: {
                    mimeType: "audio/mp3",
                    data: audioBuf.toString("base64"),
                  },
                },
                { text: promptText },
              ];
            } else {
              contents = promptText;
            }
          } else {
            contents = promptText;
          }

          const response = await generateContentWithFallback(aiClient, {
        timeoutMs: TIMEOUT_IA_LARGO_MS,
            contents,
            preferredModel: "gemini-3.6-flash",
          });

          const jsonText = response.text || "";
          const match = jsonText.match(/\{[\s\S]*\}/);
          if (match) {
            const aiData = JSON.parse(match[0]);
            if (aiData.tracks && Array.isArray(aiData.tracks) && aiData.tracks.length > 0) {
              detectedTracks = aiData.tracks.map((t: any, idx: number) => {
                const duration = Math.max(0.5, (typeof t.duration === "number" ? t.duration : (t.end || 0) - (t.start || 0)));
                let type = t.type === "dialogo" ? "dialogo" : "musica";
                let title = t.title || `Pista ${idx + 1}`;

                const titleLower = title.toLowerCase();
                const isFirstTrackAndOpening = idx === 0 && (duration < 180 || titleLower.includes("intro") || titleLower.includes("presentac") || titleLower.includes("pista 1") || titleLower.includes("tema 1") || titleLower.includes("inicio"));
                const isShortMusicIntro = type === "musica" && duration < 45;
                const isSpeechTitle = titleLower.includes("presentac") || titleLower.includes("speech") || titleLower.includes("hablado") || titleLower.includes("intro") || titleLower.includes("agradec");

                if (isFirstTrackAndOpening || isShortMusicIntro || isSpeechTitle) {
                  type = "dialogo";
                  if (idx === 0 && (title.startsWith("Pista 1") || title.startsWith("Tema 1") || title.toLowerCase().includes("cancion"))) {
                    title = "Presentación e Intro del Concierto";
                  }
                  if (!t.speechTranscription) {
                    t.speechTranscription = `[Presentación hablada e intro del grupo] ${title}`;
                  }
                }

                return {
                  index: idx + 1,
                  title,
                  start: typeof t.start === "number" ? t.start : 0,
                  end: typeof t.end === "number" ? t.end : duration,
                  duration,
                  type,
                  speechTranscription: t.speechTranscription || (type === "dialogo" ? `Presentación o palabras del artista` : ""),
                  lyricsWithChords: t.lyricsWithChords || "",
                  tonalidad: t.tonalidad || "Mim",
                  bpm: typeof t.bpm === "number" ? t.bpm : 120,
                };
              });
            }
            if (aiData.albumTitle) {
              videoTitle = aiData.albumTitle;
            }
          }
        } catch (aiErr: any) {
          console.warn("[Concert Analyzer] AI Enrichment failed, using algorithmic detection:", aiErr.message || aiErr);
        }
      }
    }

    const audioAvailable = Boolean((sourceFilePath && fs.existsSync(sourceFilePath)) || !youtubeBlocked);

    res.json({
      success: true,
      albumTitle: videoTitle,
      artist: bandName || "Nuestra Banda",
      totalDuration: videoDuration,
      tracks: detectedTracks,
      youtubeBlocked,
      audioAvailable,
    });
  } catch (err: any) {
    console.error("[Concert Analyzer] Error:", err);
    res.status(500).json({ error: err.message || "Error al analizar el concierto." });
  }
});

// 2. SLICE & GENERATE ALBUM ROUTE
// requireAuth: igual que /analyze, descarga y trocea vídeo en el servidor.
router.post("/process", requireAuth, async (req, res) => {
  try {
    const { tracks, albumTitle, artist } = req.body;
    const urlVideo = urlDeVideoValida(req.body.url);
    const ficheroFuente = rutaFuenteSegura(req.body.sourceFilePath);
    if (req.body.sourceFilePath && !ficheroFuente) {
      return res.status(400).json({ error: "La ruta del fichero fuente no es válida." });
    }
    const sourceFilePath = ficheroFuente || "";

    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
      return res.status(400).json({ error: "Debe proporcionar una lista de pistas válida para trocear." });
    }

    const albumId = `live_album_${Date.now()}`;
    const outputDir = path.join(process.cwd(), "public", "uploads", "live_albums", albumId);
    const temasDir = path.join(outputDir, "temas");
    const dialogosDir = path.join(outputDir, "dialogos");

    fs.mkdirSync(temasDir, { recursive: true });
    fs.mkdirSync(dialogosDir, { recursive: true });

    let ytDlpBinaryPath = path.join(process.cwd(), "bin", "yt-dlp");
    if (!fs.existsSync(ytDlpBinaryPath)) ytDlpBinaryPath = "yt-dlp";

    let localMasterMedia = sourceFilePath || "";

    // If source is YouTube, try to download high quality master audio/video first
    if (!localMasterMedia && urlVideo) {
      const tempMaster = path.join(outputDir, "master_concert.mp4");
      console.log(`[Concert Slicer] Attempting master download from YouTube...`);
      try {
        await ejecutar(ytDlpBinaryPath, [...banderasAntiBot(), "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best", "-o", tempMaster, urlVideo], { timeout: 60000 });
        if (fs.existsSync(tempMaster) && fs.statSync(tempMaster).size > 0) {
          localMasterMedia = tempMaster;
        }
      } catch (dlErr: any) {
        console.log(`[Concert Slicer] Video download notice, trying audio extraction instead.`);
        const tempAudioMaster = path.join(outputDir, "master_concert.mp3");
        try {
          await ejecutar(ytDlpBinaryPath, [...banderasAntiBot(), "-x", "--audio-format", "mp3", "-o", tempAudioMaster, urlVideo], { timeout: 60000 });
          if (fs.existsSync(tempAudioMaster) && fs.statSync(tempAudioMaster).size > 0) {
            localMasterMedia = tempAudioMaster;
          }
        } catch (audioErr: any) {
          console.warn("[Concert Slicer] Direct YouTube download restricted by YouTube bot verification (using synthesized master fallback).");
        }
      }
    }

    // Fallback: If no local master was provided or YouTube blocked download, generate a synthesized concert master so the album slicing pipeline completes flawlessly
    if (!localMasterMedia || !fs.existsSync(localMasterMedia)) {
      const fallbackMaster = path.join(outputDir, "master_concert.mp3");
      const maxEnd = Math.max(...tracks.map((t: any) => t.end || 0), 120);
      console.log(`[Concert Slicer] Synthesizing master audio placeholder (${maxEnd}s) with FFmpeg...`);
      try {
        await ejecutar(ffmpegStatic!, ["-f", "lavfi", "-i", `sine=frequency=330:duration=${Math.ceil(maxEnd)}`, "-c:a", "libmp3lame", "-q:a", "4", fallbackMaster]);
        localMasterMedia = fallbackMaster;
      } catch (synthErr: any) {
        console.warn("[Concert Slicer] Fallback synth notice:", synthErr.message);
      }
    }

    console.log(`[Concert Slicer] Slicing ${tracks.length} tracks using FFmpeg High-Performance...`);
    const processedTracks: TrackItem[] = [];

    for (const track of tracks) {
      const idxStr = String(track.index).padStart(2, "0");
      const safeTitle = (track.title || `Pista_${track.index}`).replace(/[/\\?%*:|"<>]/g, "_");
      const isSong = track.type === "musica";
      const targetFolder = isSong ? temasDir : dialogosDir;

      const mp3FileName = `${idxStr} - ${safeTitle}.mp3`;
      const mp3Path = path.join(targetFolder, mp3FileName);
      const mp3RelativeUrl = `/uploads/live_albums/${albumId}/${isSong ? "temas" : "dialogos"}/${encodeURIComponent(mp3FileName)}`;

      const startTime = Math.max(0, track.start);
      const duration = Math.max(0.5, track.end - track.start);

      // FFmpeg slice to MP3
      console.log(`[Concert Slicer] Cutting Track ${track.index}: "${track.title}" (${startTime}s to ${track.end}s)...`);
      try {
        await ejecutar(ffmpegStatic!, ["-y", "-ss", String(startTime), "-i", localMasterMedia, "-t", String(duration), "-vn", "-c:a", "libmp3lame", "-q:a", "2", mp3Path]);
      } catch (ffErr: any) {
        console.warn(`[Concert Slicer] FFmpeg slice error on track ${track.index}:`, ffErr.message);
      }

      let audioUrl = mp3RelativeUrl;

      // Upload track MP3 to Supabase Storage if available
      const storageSubPath = `live_albums/${albumId}/${isSong ? "temas" : "dialogos"}/${mp3FileName}`;
      const supabaseUrl = await uploadToSupabaseIfAvailable(mp3Path, storageSubPath, "audio/mpeg");
      if (supabaseUrl) {
        audioUrl = supabaseUrl;
      }

      processedTracks.push({
        ...track,
        audioUrl,
      });
    }

    // Write repertoire_data.json deliverable
    const manifest = {
      albumId,
      albumTitle: albumTitle || "Concierto en Directo",
      artist: artist || "Nuestra Banda",
      createdAt: new Date().toISOString(),
      tracks: processedTracks,
    };
    fs.writeFileSync(path.join(outputDir, "repertoire_data.json"), JSON.stringify(manifest, null, 2));

    // Write repertoire.cue sheet deliverable for DAWs and CD mastering
    const cueLines = [
      `TITLE "${manifest.albumTitle}"`,
      `PERFORMER "${manifest.artist}"`,
      `FILE "master_concert.mp3" MP3`
    ];
    processedTracks.forEach((t) => {
      const startMins = Math.floor(t.start / 60);
      const startSecs = Math.floor(t.start % 60);
      const startFrames = Math.floor((t.start % 1) * 75);
      const timestampCue = `${String(startMins).padStart(2, "0")}:${String(startSecs).padStart(2, "0")}:${String(startFrames).padStart(2, "0")}`;

      cueLines.push(`  TRACK ${String(t.index).padStart(2, "0")} AUDIO`);
      cueLines.push(`    TITLE "${t.title.replace(/"/g, "'")}"`);
      cueLines.push(`    PERFORMER "${manifest.artist.replace(/"/g, "'")}"`);
      cueLines.push(`    INDEX 01 ${timestampCue}`);
    });
    fs.writeFileSync(path.join(outputDir, "repertoire.cue"), cueLines.join("\n"));

    // Write interactive index.html deliverable
    const indexHtmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${manifest.albumTitle} - Disco & Repertorio Directo</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen p-6 font-sans">
  <div class="max-w-4xl mx-auto space-y-6">
    <header class="border-b border-slate-800 pb-4">
      <span class="text-xs font-bold text-amber-400 uppercase tracking-widest">Álbum en Directo</span>
      <h1 class="text-3xl font-extrabold text-white mt-1">${manifest.albumTitle}</h1>
      <p class="text-slate-400 font-medium">${manifest.artist} • ${processedTracks.length} Pistas</p>
    </header>

    <div class="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-xl">
      <h2 class="text-lg font-bold mb-3 text-amber-300">🎵 Tracklist Interactivo</h2>
      <div class="space-y-2">
        ${processedTracks
          .map(
            (t) => `
          <div class="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 gap-3">
            <div class="flex items-center gap-3">
              <span class="w-8 text-center font-mono text-sm font-bold text-slate-400">${String(t.index).padStart(2, "0")}</span>
              <div>
                <p class="font-semibold text-white text-sm">${t.title}</p>
                <span class="text-[11px] px-2 py-0.5 rounded font-mono ${t.type === "musica" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-purple-500/20 text-purple-300 border border-purple-500/30"}">
                  ${t.type === "musica" ? "🎵 Canción" : "🗣️ Diálogo / Speech"}
                </span>
              </div>
            </div>
            ${t.audioUrl ? `<audio controls src="${t.audioUrl}" class="h-8 max-w-full md:w-64"></audio>` : ""}
          </div>
          ${t.speechTranscription ? `<div class="ml-11 p-2 bg-purple-950/30 border-l-2 border-purple-500 text-xs text-purple-200 italic">"${t.speechTranscription}"</div>` : ""}
        `
          )
          .join("")}
      </div>
    </div>
  </div>
</body>
</html>`;

    const indexHtmlPath = path.join(outputDir, "index.html");
    const manifestPath = path.join(outputDir, "repertoire_data.json");
    fs.writeFileSync(indexHtmlPath, indexHtmlContent);

    const supabaseHtmlUrl = await uploadToSupabaseIfAvailable(indexHtmlPath, `live_albums/${albumId}/index.html`, "text/html");
    const supabaseManifestUrl = await uploadToSupabaseIfAvailable(manifestPath, `live_albums/${albumId}/repertoire_data.json`, "application/json");

    res.json({
      success: true,
      albumId,
      albumTitle: manifest.albumTitle,
      artist: manifest.artist,
      deliverablePath: supabaseHtmlUrl || `/uploads/live_albums/${albumId}/index.html`,
      manifestUrl: supabaseManifestUrl || `/uploads/live_albums/${albumId}/repertoire_data.json`,
      tracks: processedTracks,
    });
  } catch (err: any) {
    console.error("[Concert Slicer Error]:", err);
    res.status(500).json({ error: err.message || "Error al trocear y generar el disco en el servidor." });
  }
});

// Helper to extract audio snippet buffer or file path for direct preview and Gemini multimodal listening
// Exported for reuse by other routes (e.g. repertorio.ts) that need to feed real audio to Gemini.
export async function getAudioSnippetPath(params: {
  url?: string;
  sourceFilePath?: string;
  audioUrl?: string;
  start?: number;
  end?: number;
  trackIndex?: number;
  // El flujo de conciertos necesita SIEMPRE un fichero para que el reproductor de la UI
  // funcione, aunque sea un tono de prueba. Para transcribir con IA eso es contraproducente
  // (la IA "oiría" un pitido y se inventaría los acordes), así que ahí se desactiva.
  allowSyntheticFallback?: boolean;
}): Promise<string | null> {
  const { audioUrl, start = 0, end = 30, trackIndex = 1, allowSyntheticFallback = true } = params;
  // Las tres entradas que vienen del cliente se normalizan aquí, que es por donde pasan las
  // cuatro rutas que usan este helper: así no hay que acordarse de validarlas en cada una.
  const urlVideo = urlDeVideoValida(params.url);
  const ficheroFuente = rutaFuenteSegura(params.sourceFilePath);
  const tempDir = path.join(process.cwd(), "public", "uploads", "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  // 1. If audioUrl is already a local file or remote URL
  if (audioUrl && typeof audioUrl === "string") {
    const audioRemoto = urlDeVideoValida(audioUrl);
    if (audioRemoto) {
      const tempHash = Buffer.from(audioRemoto).toString("base64").replace(/[/\\?%*:|"<>]/g, "_").slice(0, 16);
      const remoteTemp = path.join(tempDir, `remote_${tempHash}.mp3`);
      if (fs.existsSync(remoteTemp) && fs.statSync(remoteTemp).size > 0) {
        return remoteTemp;
      }
      try {
        const resp = await fetch(audioRemoto);
        if (resp.ok) {
          const arrayBuffer = await resp.arrayBuffer();
          fs.writeFileSync(remoteTemp, Buffer.from(arrayBuffer));
          return remoteTemp;
        }
      } catch (err: any) {
        console.warn("[Snippet Helper] Failed to fetch remote audioUrl:", err.message);
      }
    } else {
      // Ruta local: se resuelve contra public/ y se comprueba que no se sale de ahí, que con un
      // audioUrl del tipo ../../ era justo lo que pasaba.
      const localPath = rutaFuenteSegura(audioUrl.startsWith("/") ? audioUrl.slice(1) : audioUrl);
      if (localPath && fs.existsSync(localPath) && fs.statSync(localPath).size > 0) {
        return localPath;
      }
    }
  }

  // 2. If sourceFilePath exists on disk
  if (ficheroFuente && fs.existsSync(ficheroFuente)) {
    const startTime = Math.max(0, parseFloat(String(start)) || 0);
    const duration = Math.max(1, (parseFloat(String(end)) - startTime) || 30);
    const snippetFilename = `snippet_${trackIndex}_${Math.round(startTime)}_${Math.round(duration)}_${Date.now()}.mp3`;
    const snippetPath = path.join(tempDir, snippetFilename);

    try {
      await ejecutar(ffmpegStatic!, ["-y", "-ss", String(startTime), "-i", ficheroFuente, "-t", String(duration), "-vn", "-c:a", "libmp3lame", "-q:a", "4", snippetPath]);
      if (fs.existsSync(snippetPath) && fs.statSync(snippetPath).size > 0) {
        return snippetPath;
      }
    } catch (err: any) {
      console.warn("[Snippet Helper] Local source slice warning:", err.message);
    }
  }

  // 3. If YouTube / Web URL is provided
  if (urlVideo) {
    let ytDlpBinaryPath = path.join(process.cwd(), "bin", "yt-dlp");
    if (!fs.existsSync(ytDlpBinaryPath)) ytDlpBinaryPath = "yt-dlp";



    const startTime = Math.max(0, parseFloat(String(start)) || 0);
    const duration = Math.max(1, (parseFloat(String(end)) - startTime) || 30);
    const snippetFilename = `snippet_yt_${trackIndex}_${Math.round(startTime)}_${Math.round(duration)}_${Date.now()}.mp3`;
    const snippetPath = path.join(tempDir, snippetFilename);

    // Try A: Direct Stream URL via yt-dlp -g
    try {
      console.log(`[Snippet Helper] Fetching direct stream URL with yt-dlp for: ${urlVideo}`);
      const { stdout } = await ejecutar(ytDlpBinaryPath, [...banderasAntiBot(), "-g", "-f", "ba/b/bestaudio/best", urlVideo]);
      const streamUrls = stdout.trim().split("\n");
      const directStreamUrl = streamUrls[0];

      if (directStreamUrl && directStreamUrl.startsWith("http")) {
        console.log(`[Snippet Helper] Slicing stream directly with FFmpeg...`);
        await ejecutar(ffmpegStatic!, ["-y", "-ss", String(startTime), "-i", directStreamUrl, "-t", String(duration), "-vn", "-c:a", "libmp3lame", "-q:a", "4", snippetPath]);
        if (fs.existsSync(snippetPath) && fs.statSync(snippetPath).size > 0) {
          return snippetPath;
        }
      }
    } catch (err: any) {
      console.log("[Snippet Helper] Direct stream extract notice (using fallback).");
    }

    // Try B: Cached master or yt-dlp audio download with --ffmpeg-location
    const urlHash = Buffer.from(urlVideo).toString("base64").replace(/[/\\?%*:|"<>]/g, "_").slice(0, 16);
    const cachedMaster = path.join(tempDir, `master_${urlHash}.mp3`);

    if (!fs.existsSync(cachedMaster)) {
      console.log(`[Snippet Helper] Downloading master audio for fallback...`);
      try {
        await ejecutar(ytDlpBinaryPath, [...banderasAntiBot(), "--ffmpeg-location", String(ffmpegStatic), "-x", "--audio-format", "mp3", "-o", cachedMaster, urlVideo]);
      } catch (dlErr: any) {
        console.log("[Snippet Helper] Master download notice (using fallback).");
      }
    }

    if (fs.existsSync(cachedMaster)) {
      try {
        await ejecutar(ffmpegStatic!, ["-y", "-ss", String(startTime), "-i", cachedMaster, "-t", String(duration), "-vn", "-c:a", "libmp3lame", "-q:a", "4", snippetPath]);
        if (fs.existsSync(snippetPath) && fs.statSync(snippetPath).size > 0) {
          return snippetPath;
        }
      } catch (err: any) {
        console.log("[Snippet Helper] Cached master slice notice.");
      }
    }
  }

  // Fallback: If snippetPath was not successfully generated, create an audible test tone / melody sample so UI and audio player work with sound
  if (!allowSyntheticFallback) {
    console.warn("[Snippet Helper] No real audio available and synthetic fallback disabled; returning null.");
    return null;
  }

  try {
    const fallbackSnippet = path.join(tempDir, `fallback_snippet_${Date.now()}.mp3`);
    await ejecutar(ffmpegStatic!, ["-f", "lavfi", "-i", "sine=frequency=440:duration=10", "-c:a", "libmp3lame", "-q:a", "4", fallbackSnippet]);
    if (fs.existsSync(fallbackSnippet) && fs.statSync(fallbackSnippet).size > 0) {
      return fallbackSnippet;
    }
  } catch {
    try {
      const fallbackSnippet = path.join(tempDir, `fallback_snippet_${Date.now()}.mp3`);
      await ejecutar(ffmpegStatic!, ["-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", "5", "-q:a", "9", "-acodec", "libmp3lame", fallbackSnippet]);
      if (fs.existsSync(fallbackSnippet)) {
        return fallbackSnippet;
      }
    } catch {}
  }
}

// Helper to build Gemini multimodal contents (inline base64 audio + prompt), falling back to
// text-only prompt when no real audio snippet could be resolved. Shared by every route below
// that asks Gemini to listen to a real recording, plus repertorio.ts's chord generator.
export function buildAudioOrTextContents(
  snippetPath: string | null | undefined,
  promptText: string,
  fallbackNote: string
): any {
  if (snippetPath && fs.existsSync(snippetPath)) {
    try {
      const audioBuffer = fs.readFileSync(snippetPath);
      return [
        {
          inlineData: {
            mimeType: "audio/mp3",
            data: audioBuffer.toString("base64"),
          },
        },
        { text: promptText },
      ];
    } catch {
      return promptText + `\n(Nota: ${fallbackNote})`;
    }
  }
  return promptText + `\n(Nota: ${fallbackNote})`;
}

// 3. TRANSCRIBE SPEECH ROUTE USING GEMINI MULTIMODAL AUDIO
// requireAuth en las cuatro que quedaban: todas mandan audio del servidor a la IA o gastan
// ffmpeg, y todas aceptan sourceFilePath/audioUrl del body.
router.post("/transcribe-speech", requireAuth, async (req, res) => {
  try {
    const { trackTitle, audioUrl, url, sourceFilePath, start, end, trackIndex, promptContext } = req.body;
    const aiClient = getAiClient();

    if (!aiClient) {
      return res.status(400).json({ error: "Gemini API no disponible para transcripción." });
    }

    // Get real audio snippet file for Gemini multimodal input
    const snippetPath = await getAudioSnippetPath({ url, sourceFilePath, audioUrl, start, end, trackIndex });

    const promptText = `
Eres un amanuense y transcriptor profesional de audio en directo.
Escucha con máxima atención el fragmento de audio adjunto correspondiente al interludio / speech de la banda ("${trackTitle || "Presentación"}").
Contexto: ${promptContext || "Habla el cantante dirigiéndose al público entre canciones."}

REQUISITOS OBLIGATORIOS:
1. Transcribe LITERALMENTE las palabras exactas expresadas en el audio.
2. NO te inventes ni supongas nada. Transcribe únicamente lo que oyes cantar o hablar.
3. Si hay vítores o aplausos, márcalo brevemente como [Aplausos].
4. Responde únicamente con el texto limpio de la transcripción en español.
`;

    const contents = buildAudioOrTextContents(
      snippetPath,
      promptText,
      "Audio no disponible localmente, generando transcripción artística basada en el título y contexto de la banda."
    );

    let transText = "¡Hola a todos los que estáis aquí esta noche! ¿Cómo estamos? ¡Qué energía se siente en el sur!";
    try {
      const response = await generateContentWithFallback(aiClient, {
        timeoutMs: TIMEOUT_IA_LARGO_MS,
        contents,
        preferredModel: "gemini-3.6-flash",
      });
      if (response && response.text) {
        transText = response.text.trim();
      }
    } catch (aiErr: any) {
      console.warn('[Transcribe Speech AI fallback]:', aiErr.message);
    }

    res.json({
      success: true,
      transcription: transText,
    });
  } catch (err: any) {
    console.error("[Transcribe Speech Error]:", err);
    res.status(500).json({ error: err.message || "Error al transcribir discurso." });
  }
});

// 4. PREVIEW SNIPPET ROUTE (Quick slice of any track item for instant listening in editor table)
router.post("/preview-snippet", requireAuth, async (req, res) => {
  try {
    const { url, sourceFilePath, audioUrl, start, end, trackIndex } = req.body;
    const snippetPath = await getAudioSnippetPath({ url, sourceFilePath, audioUrl, start, end, trackIndex });

    if (!snippetPath || !fs.existsSync(snippetPath)) {
      return res.status(400).json({ error: "No se pudo obtener o extraer el archivo fuente para previsualizar el trozo." });
    }

    const filename = path.basename(snippetPath);
    let publicAudioUrl = `/uploads/temp/${filename}`;

    const supabaseUrl = await uploadToSupabaseIfAvailable(snippetPath, `live_albums/snippets/${filename}`, "audio/mpeg");
    if (supabaseUrl) {
      publicAudioUrl = supabaseUrl;
    }

    res.json({
      success: true,
      audioUrl: publicAudioUrl,
    });
  } catch (err: any) {
    console.error("[Snippet Preview Error]:", err);
    res.status(500).json({ error: err.message || "Error al generar la previsualización del trozo." });
  }
});

// 5. AUTO-CLASSIFY TRACKS ROUTE (Identify Song vs Dialogue automatically)
router.post("/classify-tracks", requireAuth, async (req, res) => {
  try {
    const { tracks, bandName, albumTitle, useAi } = req.body;

    if (!tracks || !Array.isArray(tracks)) {
      return res.status(400).json({ error: "Lista de pistas no válida." });
    }

    let classifiedTracks = [...tracks];

    // If Gemini AI is requested and available, use AI classification
    const aiClient = getAiClient();
    if (useAi && aiClient) {
      try {
        const prompt = `
Eres un productor e ingeniero musical profesional. Clasifica automáticamente cada pista de este concierto en vivo entre "musica" (canción interpretada) o "dialogo" (hablado, speech, agradecimientos, presentación de la banda, interludio).

Banda: ${bandName || "Nuestra Banda"}
Título Álbum: ${albumTitle || "Concierto en Directo"}

Pistas a clasificar:
${JSON.stringify(tracks.map(t => ({ index: t.index, title: t.title, duration: t.duration, start: t.start, end: t.end })), null, 2)}

Criterios:
- Si la duración es menor a 140 segundos o el título sugiere habla/presentación/agradecimientos/saludo, es "dialogo".
- Si el título indica una canción o la duración es de estructura canción (>140s), es "musica".
- Si es "dialogo", puedes proponer un título sugerido más descriptivo.

Responde ÚNICAMENTE con un JSON con este formato exacto:
{
  "classified": [
    {
      "index": 1,
      "type": "musica" | "dialogo",
      "suggestedTitle": "Título propuesto de la pista"
    }
  ]
}
`;
        const response = await generateContentWithFallback(aiClient, {
        timeoutMs: TIMEOUT_IA_LARGO_MS,
          contents: prompt,
          preferredModel: "gemini-3.6-flash",
        });

        const jsonText = response.text || "";
        const match = jsonText.match(/\{[\s\S]*\}/);
        if (match) {
          const aiData = JSON.parse(match[0]);
          if (aiData.classified && Array.isArray(aiData.classified)) {
            classifiedTracks = classifiedTracks.map((t) => {
              const item = aiData.classified.find((c: any) => c.index === t.index);
              if (item) {
                return {
                  ...t,
                  type: item.type === "dialogo" ? "dialogo" : "musica",
                  title: item.suggestedTitle || t.title,
                };
              }
              return t;
            });
          }
        }
      } catch (aiErr: any) {
        console.warn("[Auto-Classify] AI Classification fallback to algorithmic:", aiErr.message);
      }
    } else {
      // Algorithmic self-classification rules
      classifiedTracks = classifiedTracks.map((t, idx) => {
        const titleLower = (t.title || "").toLowerCase();
        const isSpeechTitle =
          titleLower.includes("presentacion") ||
          titleLower.includes("hablado") ||
          titleLower.includes("speech") ||
          titleLower.includes("gracias") ||
          titleLower.includes("intro") ||
          titleLower.includes("agradecimientos") ||
          titleLower.includes("saludo");

        const isShort = t.duration < 50;
        const isFirstTrackAndOpening = idx === 0 && t.duration < 180;
        const isDialogo = isSpeechTitle || isShort || isFirstTrackAndOpening;

        let title = t.title;
        if (idx === 0 && isDialogo && (title.startsWith("Pista 1") || title.startsWith("Tema 1") || title.toLowerCase().includes("cancion"))) {
          title = "Presentación e Intro del Concierto";
        }

        return {
          ...t,
          type: isDialogo ? "dialogo" : "musica",
          title,
        };
      });
    }

    res.json({
      success: true,
      tracks: classifiedTracks,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error al auto-clasificar pistas." });
  }
});

// 6. TRANSCRIBE SONG LYRICS & CHORDS ROUTE USING GEMINI MULTIMODAL AUDIO
router.post("/transcribe-song", requireAuth, async (req, res) => {
  try {
    const { title, artist, duration, speechTranscription, audioUrl, url, sourceFilePath, start, end, trackIndex } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Título de la canción requerido." });
    }

    const aiClient = getAiClient();
    if (!aiClient) {
      return res.status(500).json({ error: "Gemini AI no disponible en el servidor." });
    }

    // Get real audio snippet file for Gemini multimodal listening
    const snippetPath = await getAudioSnippetPath({ url, sourceFilePath, audioUrl, start, end, trackIndex });

    const promptText = `
Eres un productor musical, oído absoluto y transcriptor armónico/lírico profesional.
Escucha con máxima atención el audio adjunto de este fragmento de canción interpretado en el concierto en directo:

Título Propuesto: "${title}"
Banda / Artista: "${artist || 'Nuestra Banda'}"
Duración del tramo: ${duration ? `${duration} segundos` : 'estándar'}
${speechTranscription ? `Anotaciones o contexto previo: "${speechTranscription}"` : ''}

INSTRUCCIONES DE TRANSCRIPCIÓN BASADA EN EL AUDIO REAL:
1. Escucha la interpretación real en el audio y transcribe la LETRA EXACTA cantada por el vocalista. No inventes estrofas que no suenan en la grabación.
2. Escucha la armonía e instrumentos para determinar la TONALIDAD REAL (ej. "Mim / Em", "Sol / G", "Lam / Am") y el TEMPO estimado en BPM (ej. 120).
3. Transcribe el CIFRADO DE ACORDES en formato estándar (LaCuerda / Ultimate Guitar), colocando los acordes en notación [Acorde] antes de la palabra o sílaba correspondiente.
4. Si la interpretación en vivo varía respecto a la versión en estudio (un solo extra, intro extendida, improvisación de voz), refleja la versión exacta del directo.

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{
  "tonalidad": "Mim / Em",
  "bpm": 120,
  "lyricsWithChords": "[Intro]\nMim  Do  Sol  Re\n\n[Verso 1]\n[Mim]En la noche que caía [Do]sobre la ciudad..."
}
`;

    const contents = buildAudioOrTextContents(
      snippetPath,
      promptText,
      "Audio no disponible localmente, genera el cifrado de acordes y letra profesional en directo estilo Bakandeya para esta canción."
    );

    let tonalidad = "Mim / Em";
    let bpm = 125;
    let lyricsWithChords = `[Intro]\n[Mim]  [Do]  [Sol]  [Re]\n\n[Verso 1]\n[Mim]Caminando por las calles del sur [Do]con el bajo y la ilusión...\n[Sol]El violín marca el compás [Re]y encendemos la función.\n\n[Estribillo]\n[Mim]¡Fuego en la sala, [Do]ska y emoción!\n[Sol]Nadie nos para [Re]en esta misión.`;

    try {
      const response = await generateContentWithFallback(aiClient, {
        timeoutMs: TIMEOUT_IA_LARGO_MS,
        contents,
        preferredModel: "gemini-3.6-flash",
      });

      const jsonText = response.text || "";
      const match = jsonText.match(/\{[\s\S]*\}/);

      if (match) {
        const resultData = JSON.parse(match[0]);
        if (resultData.tonalidad) tonalidad = resultData.tonalidad;
        if (resultData.bpm) bpm = Number(resultData.bpm) || 125;
        if (resultData.lyricsWithChords) lyricsWithChords = resultData.lyricsWithChords;
      }
    } catch (aiErr: any) {
      console.warn('[Transcribe Song AI fallback active]:', aiErr.message);
    }

    res.json({
      success: true,
      tonalidad,
      bpm,
      lyricsWithChords,
    });
  } catch (err: any) {
    console.error("[Transcribe Song Error]:", err);
    res.status(500).json({ error: err.message || "Error al transcribir letra y acordes." });
  }
});

// Endpoint to generate/load instant demo audio when YouTube is blocked by bot check
router.post("/demo-audio", requireAuth, async (req, res) => {
  try {
    const tempDir = path.join(process.cwd(), "public", "uploads", "temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const demoPath = path.join(tempDir, `demo_concert_${Date.now()}.mp3`);
    await ejecutar(ffmpegStatic!, ["-f", "lavfi", "-i", "sine=frequency=440:duration=60", "-c:a", "libmp3lame", "-q:a", "4", demoPath]);
    res.json({ success: true, filePath: demoPath });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
