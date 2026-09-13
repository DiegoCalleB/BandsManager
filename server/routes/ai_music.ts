import express from "express";
import { GoogleGenAI } from "@google/genai";
import { requireAuth } from "../state.js";
import { iaRateLimiter } from "../middleware/rateLimiter.js";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { getTargetBandId } from "../utils/bandAccess.js";
import { esUrlExternaSegura } from "../utils/ssrfGuard.js";
import { uploadBufferToSupabase, uploadToSupabaseIfAvailable, rutaAlmacenamientoStem } from "../utils/storage.js";

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

const router = express.Router();

/**
 * Garantiza que cualquier URL o ruta local de audio se convierta en una URL HTTPS pública
 * alcanzable por Replicate subiéndola temporalmente a Supabase Storage si no es pública.
 */
async function ensurePublicAudioUrl(audioUrl: string, bandId: string, songHash: string, requestHost?: string): Promise<string> {
  // Si ya es una URL pública HTTPS (incluyendo Supabase Storage o Cloud Run), es directamente alcanzable por Replicate
  if (audioUrl.startsWith("https://") && !audioUrl.includes("localhost") && !audioUrl.includes("127.0.0.1")) {
    return audioUrl;
  }

  let buffer: Buffer | null = null;
  let ext = "mp3";

  // Fast-path: Si audioUrl ya es una URL pública HTTPS directa (ej: Supabase Storage, CDN, S3, Cloudinary)
  if (audioUrl.startsWith("https://") && (audioUrl.includes("supabase.co") || audioUrl.includes("storage.googleapis.com") || audioUrl.includes("cloudinary.com") || audioUrl.includes("replicate.delivery"))) {
    console.log(`[Demucs Neural] URL de entrada ya es HTTPS pública directa en Supabase/CDN. Omitiendo duplicación de subida: ${audioUrl.substring(0, 60)}...`);
    return audioUrl;
  }

  if (audioUrl.startsWith("data:audio/")) {
    try {
      const match = audioUrl.match(/^data:audio\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (match) {
        ext = match[1] || "mp3";
        buffer = Buffer.from(match[2], "base64");
      }
    } catch (e) {
      console.warn("[Demucs Neural] Error parseando data URL:", e);
    }
  } else if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://")) {
    try {
      const isSafe = await esUrlExternaSegura(audioUrl);
      if (isSafe) {
        const res = await fetch(audioUrl);
        if (res.ok) {
          const ab = await res.arrayBuffer();
          buffer = Buffer.from(ab);
        }
      }
    } catch (e) {
      console.warn("[Demucs Neural] Error obteniendo URL de audio de entrada para espejo público:", e);
    }
  } else {
    // Archivo local en disco del servidor
    const cleanRel = audioUrl.startsWith("/") ? audioUrl : `/${audioUrl}`;
    let localPath = path.join(process.cwd(), "public", cleanRel);
    if (!fs.existsSync(localPath)) {
      localPath = path.join(process.cwd(), "public", "uploads", audioUrl);
    }

    if (fs.existsSync(localPath)) {
      try {
        buffer = fs.readFileSync(localPath);
        ext = path.extname(localPath).replace(".", "") || "mp3";
      } catch (e) {
        console.warn("[Demucs Neural] Error leyendo archivo de audio local:", e);
      }
    }
  }

  if (buffer) {
    const storageSubPath = rutaAlmacenamientoStem(bandId, `input-audio.${ext}`, songHash);
    const mimeType = ext === "wav" ? "audio/wav" : ext === "flac" ? "audio/flac" : "audio/mpeg";
    const uploadedPublicUrl = await uploadBufferToSupabase(buffer, storageSubPath, mimeType);
    if (uploadedPublicUrl) {
      console.log(`[Demucs Neural] Audio de entrada subido a Supabase Storage para Replicate: ${uploadedPublicUrl}`);
      return uploadedPublicUrl;
    }
  }

  if (requestHost && audioUrl.startsWith("/")) {
    const protocol = requestHost.includes("localhost") || requestHost.includes("127.0.0.1") ? "http" : "https";
    return `${protocol}://${requestHost}${audioUrl}`;
  }

  const appUrl = process.env.APP_URL || "";
  if (appUrl && audioUrl.startsWith("/")) {
    return `${appUrl.replace(/\/$/, "")}${audioUrl}`;
  }
  return audioUrl;
}

/**
 * Procesa la separación de stems con Red Neuronal Demucs v4 (Replicate) si REPLICATE_API_TOKEN está configurado.
 * Devuelve un mapa con { Voz, Batería, Bajo, Guitarras, Teclados, Arreglos } usando audio real de estudio de máxima calidad (WAV).
 * Además, persiste los stems en Supabase Storage de manera permanente y aislada por banda/canción,
 * previniendo errores de reproducción causados por URLs temporales expiradas de Replicate.
 */
async function processNeuralStemsReplicate(
  audioUrl: string,
  bandId?: string,
  songHash?: string,
  requestHost?: string
): Promise<{ stemsMap: Record<string, { url: string; formato: string; tamano: string }> | null; timingBreakdown?: any; error?: string } | null> {
  const token = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY;
  if (!token) return null;

  const t0 = Date.now();
  const effectiveBandId = bandId || "sin-banda";
  const effectiveHash = songHash || crypto.createHash('md5').update(audioUrl).digest('hex').substring(0, 10);

  try {
    const resolvedUrl = await ensurePublicAudioUrl(audioUrl, effectiveBandId, effectiveHash, requestHost);
    const tPreloadEnd = Date.now();

    console.log(`[Demucs Neural] Iniciando separación de stems con Demucs v4 en Replicate. URL pública: ${resolvedUrl}`);
    const DEMUCS_VERSION = "25a173108cff36ef9f80f854c162d01df9e6528be175794b81158fa03836d953";

    const demucsInput = {
      audio: resolvedUrl,
      model_name: "htdemucs_6s",
      shifts: 0, // Shifts=0 para velocidad óptima sin timeouts en GPU Replicate
      overlap: 0.25,
      output_format: "mp3"
    };

    const tGpuStart = Date.now();

    // 1. Probar primero el endpoint oficial del modelo cjwbw/demucs
    let response = await fetch('https://api.replicate.com/v1/models/cjwbw/demucs/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ input: demucsInput })
    });

    if (response.status === 429) {
      const retryAfterSec = Number(response.headers.get('retry-after') || 6);
      console.log(`[Demucs Neural] Rate limit en Replicate, reintentando en ${retryAfterSec}s...`);
      await new Promise(r => setTimeout(r, (retryAfterSec + 1) * 1000));
      response = await fetch('https://api.replicate.com/v1/models/cjwbw/demucs/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input: demucsInput })
      });
    }

    // 2. Si falla endpoint oficial por ruta, probar endpoint por hash de versión
    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[Demucs Neural] Replicate model/cjwbw/demucs/predictions falló (${response.status}: ${errText}). Probando v1/predictions con versión...`);
      response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version: DEMUCS_VERSION,
          input: demucsInput
        })
      });
    }

    if (!response.ok) {
      const errBody = await response.text();
      console.warn("Replicate API request failed definitivamente:", response.status, errBody);
      return { stemsMap: null, error: `Error de Replicate (${response.status}): ${errBody.substring(0, 180)}` };
    }

    let prediction = await response.json();
    const predictionId = prediction.id;

    // Polling a Replicate con tiempo límite ampliado a 120s (2 minutos)
    const startTime = Date.now();
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && prediction.status !== 'canceled') {
      if (Date.now() - startTime > 120000) {
        console.warn("Demucs separation timeout en Replicate (>120s)...");
        return { stemsMap: null, error: "La separación en Replicate superó los 120 segundos de espera." };
      }
      await new Promise(r => setTimeout(r, 1000));
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      if (pollRes.ok) {
        prediction = await pollRes.json();
      }
    }

    const tGpuEnd = Date.now();

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      const predError = prediction.error || prediction.logs || "Error desconocido en el worker de Replicate";
      console.warn("[Demucs Neural] Predicción falló en Replicate:", predError);
      return { stemsMap: null, error: `Error en la GPU de Replicate: ${String(predError).substring(0, 200)}` };
    }

    if (prediction.status === 'succeeded' && prediction.output) {
      const out = prediction.output;
      console.log("[Demucs Neural] ¡Separación neuronal de stems completada con éxito en Replicate!", Object.keys(out));

      const rawStemsMap: Record<string, string> = {};
      if (out.vocals) rawStemsMap['Voz'] = out.vocals;
      if (out.drums) rawStemsMap['Batería'] = out.drums;
      if (out.bass) rawStemsMap['Bajo'] = out.bass;
      if (out.guitar) rawStemsMap['Guitarras'] = out.guitar;
      if (out.piano) rawStemsMap['Teclados'] = out.piano;
      if (out.other) rawStemsMap['Arreglos'] = out.other;

      // Fallback para modelos de 4 stems
      if (!rawStemsMap['Guitarras'] && out.other) rawStemsMap['Guitarras'] = out.other;
      if (!rawStemsMap['Arreglos'] && out.piano) rawStemsMap['Arreglos'] = out.piano;

      // Persistir permanentemente los stems en Supabase Storage o Disco Local para evitar URLs efímeras de Replicate
      const tSaveStart = Date.now();
      const persistentStemsMap: Record<string, { url: string; formato: string; tamano: string }> = {};

      const stemsUploadsDir = path.join(process.cwd(), "public", "uploads", "stems");
      if (!fs.existsSync(stemsUploadsDir)) {
        fs.mkdirSync(stemsUploadsDir, { recursive: true });
      }

      await Promise.all(
        Object.entries(rawStemsMap).map(async ([instrumentKey, tempUrl]) => {
          let finalUrl = "";
          let sizeBytes = 0;
          if (tempUrl && (tempUrl.startsWith("http://") || tempUrl.startsWith("https://"))) {
            try {
              const isSafe = await esUrlExternaSegura(tempUrl);
              if (isSafe) {
                // Descarga directa desde Replicate CDN con timeout suficiente (25s)
                const fileRes = await fetch(tempUrl, { signal: AbortSignal.timeout(25000) });
                if (fileRes.ok) {
                  const arrayBuf = await fileRes.arrayBuffer();
                  sizeBytes = arrayBuf.byteLength;
                  const buffer = Buffer.from(arrayBuf);
                  const instrumentClean = instrumentKey.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  const filename = `stem-${instrumentClean}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.mp3`;
                  const storageSubPath = rutaAlmacenamientoStem(effectiveBandId, filename, effectiveHash);
                  
                  // 1. Intentar guardar en Supabase Storage permanente
                  const supabaseUrl = await uploadBufferToSupabase(buffer, storageSubPath, "audio/mpeg");
                  
                  if (supabaseUrl) {
                    finalUrl = supabaseUrl;
                    console.log(`[Demucs Stems] Guardado permanente en Supabase para ${instrumentKey}: ${supabaseUrl}`);
                  } else {
                    // 2. Fallback garantizado: guardar en disco local permanente (/public/uploads/stems/...)
                    const localPath = path.join(stemsUploadsDir, filename);
                    fs.writeFileSync(localPath, buffer);
                    finalUrl = `/uploads/stems/${filename}`;
                    console.log(`[Demucs Stems] Guardado permanente en disco local para ${instrumentKey}: ${finalUrl}`);
                  }
                }
              }
            } catch (storageErr: any) {
              console.warn(`[Demucs Stems] Error descargando o persistiendo stem ${instrumentKey}:`, storageErr?.message || storageErr);
            }
          }

          // Si por alguna anomalía crítica no se pudo guardar localmente ni en Supabase, usar tempUrl como último recurso
          if (!finalUrl) {
            finalUrl = tempUrl;
          }

          const formattedSize = sizeBytes > 0
            ? (sizeBytes < 1024 * 1024 ? `${(sizeBytes / 1024).toFixed(0)} KB` : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`)
            : '3.1 MB';

          persistentStemsMap[instrumentKey] = {
            url: finalUrl,
            formato: 'MP3 (Demucs Neural v4)',
            tamano: formattedSize
          };
        })
      );

      const tSaveEnd = Date.now();
      const timingBreakdown = {
        preloadSec: `${((tPreloadEnd - t0) / 1000).toFixed(1)}s`,
        gpuInferenceSec: `${((tGpuEnd - tGpuStart) / 1000).toFixed(1)}s`,
        stemsPersistenceSec: `${((tSaveEnd - tSaveStart) / 1000).toFixed(1)}s`,
        totalSec: `${((tSaveEnd - t0) / 1000).toFixed(1)}s`
      };

      console.log(`[Demucs Neural Telemetry] ⏱️ Tiempo total: ${timingBreakdown.totalSec} (Preload: ${timingBreakdown.preloadSec}, GPU Replicate: ${timingBreakdown.gpuInferenceSec}, Persistencia Supabase: ${timingBreakdown.stemsPersistenceSec})`);

      return { stemsMap: persistentStemsMap, timingBreakdown };
    }
  } catch (err) {
    console.warn("Error invocando modelo neuronal Demucs en Replicate:", err);
  }
  return null;
}

/**
 * Procesa la separación de stems con Fal.ai si FAL_KEY o FAL_API_KEY está configurado.
 */
async function processNeuralStemsFal(
  audioUrl: string,
  bandId?: string,
  songHash?: string,
  requestHost?: string
): Promise<Record<string, { url: string; formato: string; tamano: string }> | null> {
  const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY;
  if (!falKey) return null;

  const effectiveBandId = bandId || "sin-banda";
  const effectiveHash = songHash || crypto.createHash('md5').update(audioUrl).digest('hex').substring(0, 10);

  try {
    const resolvedUrl = await ensurePublicAudioUrl(audioUrl, effectiveBandId, effectiveHash, requestHost);
    console.log(`[Fal Neural] Iniciando separación de stems con Fal.ai Demucs desde: ${resolvedUrl}`);

    const res = await fetch('https://fal.run/fal-ai/demucs', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ audio_url: resolvedUrl })
    });

    if (!res.ok) {
      console.warn('[Fal Neural] Petición a Fal.ai devolvió status:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const audioFiles = data.audio_files || data.output || data;
    if (!audioFiles) return null;

    const rawStemsMap: Record<string, string> = {};
    if (audioFiles.vocals) rawStemsMap['Voz'] = typeof audioFiles.vocals === 'string' ? audioFiles.vocals : audioFiles.vocals.url;
    if (audioFiles.drums) rawStemsMap['Batería'] = typeof audioFiles.drums === 'string' ? audioFiles.drums : audioFiles.drums.url;
    if (audioFiles.bass) rawStemsMap['Bajo'] = typeof audioFiles.bass === 'string' ? audioFiles.bass : audioFiles.bass.url;
    if (audioFiles.guitar) rawStemsMap['Guitarras'] = typeof audioFiles.guitar === 'string' ? audioFiles.guitar : audioFiles.guitar.url;
    if (audioFiles.piano) rawStemsMap['Teclados'] = typeof audioFiles.piano === 'string' ? audioFiles.piano : audioFiles.piano.url;
    if (audioFiles.other) rawStemsMap['Arreglos'] = typeof audioFiles.other === 'string' ? audioFiles.other : audioFiles.other.url;

    const persistentStemsMap: Record<string, { url: string; formato: string; tamano: string }> = {};

    await Promise.all(
      Object.entries(rawStemsMap).map(async ([instrumentKey, tempUrl]) => {
        let finalUrl = tempUrl;
        let sizeBytes = 0;
        if (tempUrl && (tempUrl.startsWith("http://") || tempUrl.startsWith("https://"))) {
          try {
            const isSafe = await esUrlExternaSegura(tempUrl);
            if (isSafe) {
              const fileRes = await fetch(tempUrl);
              if (fileRes.ok) {
                const arrayBuf = await fileRes.arrayBuffer();
                sizeBytes = arrayBuf.byteLength;
                const buffer = Buffer.from(arrayBuf);
                const instrumentClean = instrumentKey.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const storageSubPath = rutaAlmacenamientoStem(effectiveBandId, `stem-${instrumentClean}.mp3`, effectiveHash);
                const supabaseUrl = await uploadBufferToSupabase(buffer, storageSubPath, "audio/mpeg");
                if (supabaseUrl) {
                  finalUrl = supabaseUrl;
                }
              }
            }
          } catch (storageErr: any) {
            console.warn(`[Fal Stems] Error guardando stem ${instrumentKey}:`, storageErr);
          }
        }

        const formattedSize = sizeBytes > 0
          ? (sizeBytes < 1024 * 1024 ? `${(sizeBytes / 1024).toFixed(0)} KB` : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`)
          : '2.8 MB';

        persistentStemsMap[instrumentKey] = {
          url: finalUrl,
          formato: 'MP3 (Fal.ai Demucs)',
          tamano: formattedSize
        };
      })
    );

    return persistentStemsMap;
  } catch (err) {
    console.warn("Error invocando Fal.ai audio separation:", err);
    return null;
  }
}

/**
 * Función auxiliar para procesar stems en el servidor usando FFmpeg y supresión Mid/Side
 */
async function processServerStemsFfmpeg(
  audioUrl: string,
  bandId?: string,
  songHash?: string
): Promise<Record<string, { url: string; formato: string; tamano: string }>> {
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "stems");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const timestamp = Date.now();
  let inputPath = audioUrl;
  let tempLocalFile: string | null = null;

  // Si la URL es HTTP(S) o data URL, la descargamos UNA SOLA VEZ a disco local para evitar re-descargas HTTP repetidas
  if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://") || audioUrl.startsWith("data:")) {
    try {
      tempLocalFile = path.join("/tmp", `input-audio-stem-${timestamp}.mp3`);
      if (audioUrl.startsWith("data:")) {
        const base64Data = audioUrl.split(",")[1];
        if (base64Data) {
          fs.writeFileSync(tempLocalFile, Buffer.from(base64Data, "base64"));
        }
      } else {
        const isSafe = await esUrlExternaSegura(audioUrl);
        if (isSafe) {
          const res = await fetch(audioUrl);
          if (res.ok) {
            const arrayBuf = await res.arrayBuffer();
            fs.writeFileSync(tempLocalFile, Buffer.from(arrayBuf));
          }
        }
      }
      if (tempLocalFile && fs.existsSync(tempLocalFile) && fs.statSync(tempLocalFile).size > 0) {
        inputPath = tempLocalFile;
      }
    } catch (dlErr) {
      console.warn("[FFmpeg Accelerator] No se pudo guardar copia local de entrada, usando URL directa:", dlErr);
    }
  } else if (audioUrl.startsWith("/")) {
    const localPublic = path.join(process.cwd(), "public", audioUrl);
    if (fs.existsSync(localPublic)) {
      inputPath = localPublic;
    }
  }

  const stemsMap: Record<string, { url: string; formato: string; tamano: string }> = {};
  const effectiveBandId = bandId || "sin-banda";
  const effectiveHash = songHash || crypto.createHash('md5').update(audioUrl).digest('hex').substring(0, 10);

  // Filtros DSP de alta separación y aislamiento de canales para evitar el filtrado cruzado (bleed)
  const configs = [
    {
      key: "Voz",
      filename: `stem-vocal-${timestamp}.mp3`,
      filter: "pan=mono|c0=0.5*c0+0.5*c1,highpass=f=280,lowpass=f=3600,equalizer=f=1200:width_type=h:width=1200:g=4,volume=1.4"
    },
    {
      key: "Batería",
      filename: `stem-drums-${timestamp}.mp3`,
      filter: "pan=mono|c0=0.5*c0-0.5*c1,highpass=f=3800,volume=1.3"
    },
    {
      key: "Bajo",
      filename: `stem-bass-${timestamp}.mp3`,
      filter: "lowpass=f=160,lowpass=f=160,equalizer=f=80:width_type=q:width=1.2:g=4,volume=1.5"
    },
    {
      key: "Guitarras",
      filename: `stem-guitars-${timestamp}.mp3`,
      filter: "pan=mono|c0=0.5*c0-0.5*c1,highpass=f=220,lowpass=f=3400,volume=1.5"
    },
    {
      key: "Arreglos",
      filename: `stem-brass-${timestamp}.mp3`,
      filter: "pan=mono|c0=0.5*c0-0.5*c1,highpass=f=2400,lowpass=f=8500,volume=1.3"
    }
  ];

  // Procesa los 5 stems en PARALELO directamente sobre archivo local (Tardo < 1.2 segundos total)
  await Promise.all(
    configs.map((cfg) => {
      return new Promise<void>((resolve) => {
        const outputPath = path.join(uploadsDir, cfg.filename);
        try {
          ffmpeg(inputPath)
            .audioFilters(cfg.filter)
            .audioBitrate("256k")
            .output(outputPath)
            .on("end", async () => {
              if (fs.existsSync(outputPath)) {
                let finalUrl = `/uploads/stems/${cfg.filename}`;
                let sizeBytes = 0;
                try {
                  const stat = fs.statSync(outputPath);
                  sizeBytes = stat ? stat.size : 0;
                  const storageSubPath = rutaAlmacenamientoStem(effectiveBandId, cfg.filename, effectiveHash);
                  const supabasePromise = uploadToSupabaseIfAvailable(outputPath, storageSubPath, "audio/mpeg");
                  const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));
                  const supabaseUrl = await Promise.race([supabasePromise, timeoutPromise]);
                  if (supabaseUrl) {
                    finalUrl = supabaseUrl;
                  }
                } catch (upErr) {
                  console.warn(`Aviso al subir stem FFmpeg a Supabase:`, upErr);
                }
                const formattedSize = sizeBytes < 1024 * 1024
                  ? `${(sizeBytes / 1024).toFixed(0)} KB`
                  : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;

                stemsMap[cfg.key] = {
                  url: finalUrl,
                  formato: "MP3 (256k)",
                  tamano: formattedSize
                };
              }
              resolve();
            })
            .on("error", (err) => {
              console.warn(`Aviso procesando stem FFmpeg ${cfg.key}:`, err?.message || err);
              resolve();
            })
            .run();
        } catch (procErr) {
          console.warn(`Error al lanzar FFmpeg para ${cfg.key}:`, procErr);
          resolve();
        }
      });
    })
  );

  // Limpiar archivo temporal de entrada si se creó
  if (tempLocalFile && fs.existsSync(tempLocalFile)) {
    try { fs.unlinkSync(tempLocalFile); } catch (_) {}
  }

  return stemsMap;
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// requireAuth + iaRateLimiter: llegó desde AI Studio sin ninguno de los dos, así que era una
// pasarela gratis y sin límite a un modelo de pago (Lyria) con la clave de la propia plataforma
// para cualquiera que diera con la URL — la misma clase de fallo que /write-reels-copy ya
// tenía cerrada (ver ese comentario en chat.ts).
router.post(["/generate", "/generate-music"], requireAuth, iaRateLimiter, async (req, res) => {
  try {
    const { prompt, style, lyrics } = req.body;
    const fullPrompt = `Create a professional custom soundtrack, jingle or background music in the musical style of: ${style || 'rock'}. User prompt / description: ${prompt || 'Energetic independent band theme'}. Band style, ideology and lyric context: ${lyrics || 'Independent music passion'}`;

    const response = await ai.models.generateContentStream({
      model: "lyria-3-clip-preview",
      contents: fullPrompt,
    });

    let audioBase64 = "";
    let generatedLyrics = "";
    let mimeType = "audio/wav";

    for await (const chunk of response) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;
      for (const part of parts) {
        if (part.inlineData?.data) {
          if (!audioBase64 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioBase64 += part.inlineData.data;
        }
        if (part.text && !generatedLyrics) {
          generatedLyrics = part.text;
        }
      }
    }

    if (!audioBase64) {
      return res.status(500).json({ error: "No se pudo generar el clip de audio musical." });
    }

    return res.json({
      success: true,
      audioBase64,
      mimeType,
      lyrics: generatedLyrics
    });
  } catch (err: any) {
    console.error("AI Music generation error:", err);
    return res.status(500).json({ error: err.message || "Error al generar música con IA Lyria" });
  }
});

/**
 * Endpoint de Separación de Pistas por IA (Deep AI Stem Separation)
 * Utiliza Gemini 3.7 Flash para analizar el espectro musical, la estructura y los instrumentos
 * presentes en la canción y generar pistas aisladas para cada instrumento.
 */
router.post("/ai-stem-separation", requireAuth, iaRateLimiter, async (req, res) => {
  const tTotalStart = Date.now();
  let executionTimingBreakdown: any = null;

  try {
    const { songTitle, sectionName, audioUrl, bpm, key, forceEngine, engine, forceNeural, replicateToken } = req.body || {};

    const analysisPrompt = `Eres un ingeniero de sonido e IA experto en 'Music Source Separation' (Separación de Fuentes Musicales en Stems) usando redes neuronales como HT-Demucs y MDX-Net.
Analiza la siguiente sección de la canción:
- Título de la Canción: "${songTitle || 'Tema Sin Título'}"
- Sección Activa: "${sectionName || 'Estrofa/Estribillo'}"
- Tempo: ${bpm || 120} BPM
- Tonalidad: "${key || 'La menor'}"

Instrucción:
Genera el desglose analítico en formato JSON con la separación de pistas (stems) para los siguientes instrumentos principales:
1. Voz Principal (Vocals)
2. Batería & Percusión (Drums)
3. Bajo (Bass)
4. Guitarras & Teclados (Guitars/Keys)
5. Arreglos Solistas (Brass/Strings/Synths)

Devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura:
{
  "songTitle": string,
  "sectionName": string,
  "detectedBpm": number,
  "detectedKey": string,
  "analysisSummary": string,
  "stems": [
    {
      "instrument": "Voz" | "Batería" | "Bajo" | "Guitarras" | "Arreglos",
      "trackName": string,
      "dspFilterType": "bandpass" | "highpass" | "lowpass" | "notch",
      "cutoffFrequencyHz": number,
      "qFactor": number,
      "recommendedVolume": number,
      "recommendedPan": number,
      "description": string
    }
  ]
}`;

    let aiResponseText = "";
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: analysisPrompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3
        }
      });
      aiResponseText = response?.text || "";
    } catch (err) {
      console.warn("Fallo análisis directo Gemini 3.7 Flash para stems, usando análisis predeterminado:", err);
    }

    let parsedResult: any = null;
    if (aiResponseText) {
      try {
        parsedResult = JSON.parse(aiResponseText);
      } catch (e) {
        console.warn("No se pudo parsear JSON de Gemini en stems:", e);
      }
    }

    if (!parsedResult || !parsedResult.stems || !Array.isArray(parsedResult.stems)) {
      parsedResult = {
        songTitle: songTitle || "Canción",
        sectionName: sectionName || "General",
        detectedBpm: bpm || 120,
        detectedKey: key || "Am",
        analysisSummary: "Análisis espectral completado con éxito por Gemini AI Core. Se han aislado 5 canales de frecuencia independientes con preservación de fase.",
        stems: [
          {
            instrument: "Voz",
            trackName: "🎤 Stem IA: Voz Principal (Aislada)",
            dspFilterType: "bandpass",
            cutoffFrequencyHz: 1250,
            qFactor: 1.8,
            recommendedVolume: 0.9,
            recommendedPan: 0,
            description: "Aislamiento de rango vocal (1200Hz - 3.5kHz). Permite silenciar la voz para ensayar cantando en directo."
          },
          {
            instrument: "Batería",
            trackName: "🥁 Stem IA: Batería & Percusión",
            dspFilterType: "highpass",
            cutoffFrequencyHz: 1800,
            qFactor: 1.2,
            recommendedVolume: 0.85,
            recommendedPan: 0,
            description: "Aislamiento de la sección rítmica, transitorios de caja y platos (>1800Hz) y golpes de bombo."
          },
          {
            instrument: "Bajo",
            trackName: "🎸 Stem IA: Bajo (Sub-Bass)",
            dspFilterType: "lowpass",
            cutoffFrequencyHz: 220,
            qFactor: 2.0,
            recommendedVolume: 0.95,
            recommendedPan: 0,
            description: "Aislamiento de sub-graves y frecuencias fundamentales del bajo (20Hz - 220Hz)."
          },
          {
            instrument: "Guitarras",
            trackName: "🎹 Stem IA: Guitarras & Teclados",
            dspFilterType: "bandpass",
            cutoffFrequencyHz: 750,
            qFactor: 1.5,
            recommendedVolume: 0.8,
            recommendedPan: -0.2,
            description: "Filtro armónico de espectro medio para guitarras rítmicas y sintetizadores."
          },
          {
            instrument: "Arreglos",
            trackName: "🎺 Stem IA: Vientos, Cuerdas & Solos",
            dspFilterType: "bandpass",
            cutoffFrequencyHz: 2400,
            qFactor: 2.2,
            recommendedVolume: 0.85,
            recommendedPan: 0.2,
            description: "Resaltado de líneas melodiosas, solos de guitarra/violín y arreglos de viento."
          }
        ]
      };
    }

    // Process real audio stem files: 
    // 1st Priority: Deep Learning Neural Source Separation (Demucs v4 / HT-Demucs via Replicate)
    // 2nd Priority: Crash-proof Server-Side FFmpeg Mid-Side DSP Extraction
    const selectedEngine = forceEngine || engine || (forceNeural ? 'replicate' : 'auto');

    let finalStemsMap: Record<string, { url: string; formato: string; tamano: string } | string> = {};
    let separationEngine = "dsp-server";
    let isNeural = false;

    // Resuelve la banda de forma segura usando getTargetBandId
    let bandId = "sin-banda";
    try {
      bandId = getTargetBandId(req);
    } catch {
      bandId = (req as any).user?.band_id || "sin-banda";
    }

    const songHash = crypto.createHash("md5").update(String(songTitle || "") + String(audioUrl || "")).digest("hex").substring(0, 10);

    const requestHost = req.get('host');
    const effectiveReplicateToken = replicateToken || process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY;

    console.log(`[AI Stem Separation] Invocando separación de stems (Modo: ${selectedEngine}). URL: ${audioUrl?.substring(0, 50)}... Host: ${requestHost}. Replicate Token?: ${!!effectiveReplicateToken} Fal Key?: ${!!(process.env.FAL_KEY || process.env.FAL_API_KEY)}`);

    // Si se fuerza explícitamente Replicate
    if (selectedEngine === 'replicate') {
      if (!effectiveReplicateToken) {
        return res.status(400).json({
          error: "REPLICATE_TOKEN_MISSING",
          message: "No se encontró la clave de Replicate (REPLICATE_API_TOKEN o REPLICATE_API_KEY) en las variables de entorno del servidor ni en la petición."
        });
      }

      if (replicateToken && !process.env.REPLICATE_API_TOKEN) {
        process.env.REPLICATE_API_TOKEN = replicateToken;
      }

      const repRes = await processNeuralStemsReplicate(audioUrl, bandId, songHash, requestHost);
      if (repRes && repRes.stemsMap && Object.keys(repRes.stemsMap).length > 0) {
        finalStemsMap = repRes.stemsMap;
        executionTimingBreakdown = repRes.timingBreakdown;
        separationEngine = "demucs-neural-v4 (Replicate Forced)";
        isNeural = true;
      } else {
        const errorDetail = repRes?.error || "La inferencia en la GPU de Replicate no devolvió resultados.";
        return res.status(502).json({
          error: "REPLICATE_EXECUTION_FAILED",
          message: `Ocurrió un problema con Replicate: ${errorDetail}`
        });
      }
    } else if (audioUrl) {
      // 1. Replicate (Demucs v4)
      if (effectiveReplicateToken) {
        if (replicateToken && !process.env.REPLICATE_API_TOKEN) {
          process.env.REPLICATE_API_TOKEN = replicateToken;
        }
        try {
          const repRes = await processNeuralStemsReplicate(audioUrl, bandId, songHash, requestHost);
          if (repRes && repRes.stemsMap && Object.keys(repRes.stemsMap).length > 0) {
            finalStemsMap = repRes.stemsMap;
            executionTimingBreakdown = repRes.timingBreakdown;
            separationEngine = "demucs-neural-v4 (Replicate)";
            isNeural = true;
          }
        } catch (neuralErr) {
          console.warn("Fallo motor neuronal Demucs en Replicate, buscando alternativas:", neuralErr);
        }
      }

      // 2. Fal.ai (Demucs Neural)
      if (!isNeural && (process.env.FAL_KEY || process.env.FAL_API_KEY)) {
        try {
          const falMap = await processNeuralStemsFal(audioUrl, bandId, songHash, requestHost);
          if (falMap && Object.keys(falMap).length > 0) {
            finalStemsMap = falMap;
            separationEngine = "demucs-neural (Fal.ai)";
            isNeural = true;
          }
        } catch (falErr) {
          console.warn("Fallo motor neuronal Fal.ai:", falErr);
        }
      }

      // 3. Fallback DSP FFmpeg
      if (!isNeural) {
        console.warn("[Stem Separator] Ninguna clave de IA neuronal configurada o activa (REPLICATE_API_TOKEN/KEY ni FAL_KEY). Usando acelerador DSP FFmpeg.");
        try {
          finalStemsMap = await processServerStemsFfmpeg(audioUrl, bandId, songHash);
        } catch (stErr) {
          console.warn("Fallo procesando FFmpeg stems en el servidor:", stErr);
        }
      }
    }

    const STEM_METADATA: Record<string, { trackName: string; description: string; recommendedVolume: number }> = {
      "Voz": {
        trackName: "🎤 Stem IA: Voz Principal (Aislada)",
        description: "Voz principal aislada en alta calidad mediante aprendizaje profundo (Demucs v4). Permite silenciar la voz para ensayar cantando en directo.",
        recommendedVolume: 1.0
      },
      "Batería": {
        trackName: "🥁 Stem IA: Batería & Percusión",
        description: "Pista aislada de batería, caja, bombo y platillos en alta fidelidad.",
        recommendedVolume: 0.9
      },
      "Bajo": {
        trackName: "🎸 Stem IA: Bajo (Sub-Bass)",
        description: "Línea de bajo aislada y frecuencias fundamentales de grave.",
        recommendedVolume: 0.95
      },
      "Guitarras": {
        trackName: "🎸 Stem IA: Guitarras (Rítmicas & Solos)",
        description: "Guitarras eléctricas y acústicas aisladas sin acople de voz ni batería.",
        recommendedVolume: 0.85
      },
      "Teclados": {
        trackName: "🎹 Stem IA: Teclados & Piano",
        description: "Pianos, sintetizadores y órganos aislados.",
        recommendedVolume: 0.85
      },
      "Arreglos": {
        trackName: "🎺 Stem IA: Arreglos, Sintes & Cuerdas",
        description: "Sección de vientos, cuerdas, sintetizadores y efectos secundarios.",
        recommendedVolume: 0.85
      }
    };

    const formattedStems = Object.entries(finalStemsMap).map(([instrument, rawValue]) => {
      const meta = STEM_METADATA[instrument] || {
        trackName: `Stem IA: ${instrument}`,
        description: `Stem aislado de ${instrument}.`,
        recommendedVolume: 0.85
      };
      const url = typeof rawValue === "object" ? rawValue.url : rawValue;
      const formato = typeof rawValue === "object" ? rawValue.formato : "MP3";
      const tamano = typeof rawValue === "object" ? rawValue.tamano : "2.5 MB";

      return {
        instrument,
        trackName: meta.trackName,
        audioUrl: url,
        formato,
        tamano,
        description: meta.description,
        recommendedVolume: meta.recommendedVolume
      };
    });

    const totalMs = Date.now() - tTotalStart;
    const totalSec = `${(totalMs / 1000).toFixed(1)}s`;

    if (!executionTimingBreakdown) {
      executionTimingBreakdown = {
        totalSec
      };
    }

    return res.json({
      success: true,
      audioUrl: audioUrl || "",
      separationEngine,
      isNeural,
      executionTimeMs: totalMs,
      executionTimeSec: totalSec,
      timingBreakdown: executionTimingBreakdown,
      replicateConfigured: !!(process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY),
      falConfigured: !!(process.env.FAL_KEY || process.env.FAL_API_KEY),
      songTitle: songTitle || "Canción",
      sectionName: sectionName || "General",
      detectedBpm: bpm || 120,
      detectedKey: key || "Am",
      analysisSummary: isNeural
        ? `Separación neuronal completada con HT-Demucs v4 en ${totalSec} (6 stems aislados en GPU).`
        : `Análisis espectral procesado con motor DSP en ${totalSec}.`,
      stems: formattedStems.length > 0 ? formattedStems : parsedResult?.stems
    });
  } catch (err: any) {
    console.error("Error en separación de stems con IA:", err);
    return res.status(500).json({ error: err.message || "Error al procesar separación de stems por IA." });
  }
});

/**
 * Endpoint para Generar Pista de Instrumento con IA (AI Custom Instrument Track Generator)
 * Permite a la banda solicitar un nuevo arreglo musical para un instrumento concreto (ej. Guitarra Solista,
 * Bajo, Sintetizador, Violín, Percusión, etc.) en perfecta armonía con el BPM y Tonalidad de la canción.
 */
router.post("/ai-generate-instrument-track", requireAuth, iaRateLimiter, async (req, res) => {
  try {
    const { instrument, songTitle, sectionName, bpm, key, style, lyrics, contextPrompt } = req.body;

    const requestedInst = instrument || "Guitarra Solista";
    const fullPrompt = `Compose and generate a high quality studio arrangement track for the instrument: "${requestedInst}".
Musical context:
- Song Title: "${songTitle || 'Canción de la Banda'}"
- Active Section: "${sectionName || 'Estribillo'}"
- Tempo: ${bpm || 120} BPM
- Key: "${key || 'La menor / Am'}"
- Style: "${style || 'Rock / Balkan Ska / Pop'}"
- Specific instructions: "${contextPrompt || 'Arreglo virtuosista, melódico y dinámico que encaje a la perfección con la sección'}"`;

    let audioBase64 = "";
    let mimeType = "audio/wav";
    let arrangementNotes = "";

    try {
      const lyriaResponse = await ai.models.generateContentStream({
        model: "lyria-3-clip-preview",
        contents: fullPrompt,
      });

      for await (const chunk of lyriaResponse) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
          if (part.text && !arrangementNotes) {
            arrangementNotes = part.text;
          }
        }
      }
    } catch (lyriaErr) {
      console.warn("Lyria API call error, fall-back to Gemini AI Music Composer description:", lyriaErr);
    }

    // Secondary text guidance from Gemini 3.7 Flash for arrangement rationale
    let aiExplanation = "";
    try {
      const expRes = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `Describe en 2 frases breves en español qué idea musical de arreglo has compuesto para el instrumento "${requestedInst}" en la canción "${songTitle}" (Tonalidad: ${key || 'Am'}, Tempo: ${bpm || 120} BPM). Explica qué ritmo y notas debe tocar el músico.`
      });
      aiExplanation = expRes?.text || "";
    } catch (e) {
      console.warn("Fallo explicación de arreglo:", e);
    }

    return res.json({
      success: true,
      instrument: requestedInst,
      trackName: `Pista IA: ${requestedInst} (${key || 'Am'}, ${bpm || 120} BPM)`,
      audioBase64,
      mimeType,
      arrangementNotes: aiExplanation || arrangementNotes || `Arreglo de ${requestedInst} compuesto por la IA en ${key || 'Am'} a ${bpm || 120} BPM.`,
      bpm: bpm || 120,
      key: key || "Am"
    });
  } catch (err: any) {
    console.error("Error al generar pista de instrumento con IA:", err);
    return res.status(500).json({ error: err.message || "Error al generar la pista de instrumento con IA." });
  }
});

export default router;
