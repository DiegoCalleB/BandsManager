import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { getSupabase } from "../db/core.js";
import { uploadBufferToSupabase, rutaAlmacenamientoStem } from "./storage.js";
import { esUrlExternaSegura } from "./ssrfGuard.js";

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

export interface OptimizationResult {
  totalSongsExamined: number;
  songsOptimized: number;
  totalWavsProcessed: number;
  originalSizeBytes: number;
  optimizedSizeBytes: number;
  savedBytes: number;
  savedPercentage: string;
  details: Array<{
    songId: string;
    songTitle: string;
    wavUrl: string;
    mp3Url: string;
    origMB: string;
    newMB: string;
  }>;
}

/**
 * Convierte un archivo de audio WAV en disco/URL/Supabase a MP3 de alta fidelidad (256kbps)
 * y lo sube a Supabase Storage (o guarda en /uploads si no hay Supabase).
 */
export async function convertWavUrlToMp3(
  wavUrl: string,
  bandId: string,
  filenameHint: string
): Promise<{ mp3Url: string; origSize: number; newSize: number } | null> {
  const tempWav = path.join("/tmp", `wav-opt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.wav`);
  const tempMp3 = path.join("/tmp", `mp3-opt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.mp3`);
  const sb = getSupabase();

  try {
    let wavBuffer: Buffer | null = null;

    // A. Si es una URL de Supabase Storage (/storage/v1/object/public/...)
    if (wavUrl.includes("/storage/v1/object/public/")) {
      const parts = wavUrl.split("/storage/v1/object/public/");
      const pathAndBucket = parts[1]; // e.g. band-media/discografia/Ruta_66_2026/Walking.wav
      const firstSlash = pathAndBucket.indexOf("/");
      if (firstSlash > 0) {
        const bucket = pathAndBucket.substring(0, firstSlash);
        const relativePath = decodeURIComponent(pathAndBucket.substring(firstSlash + 1));
        
        console.log(`[WAV Optimizer] Descargando desde Supabase Storage bucket "${bucket}": ${relativePath}`);
        const { data, error } = await sb.storage.from(bucket).download(relativePath);
        if (!error && data) {
          const ab = await data.arrayBuffer();
          wavBuffer = Buffer.from(ab);
          fs.writeFileSync(tempWav, wavBuffer);
        } else {
          console.warn(`[WAV Optimizer] Error descargando desde SDK Storage:`, error?.message || error);
        }
      }
    }

    // B. Si es una URL HTTP general y no se pudo obtener por el SDK
    if (!wavBuffer && (wavUrl.startsWith("http://") || wavUrl.startsWith("https://"))) {
      const isSafe = await esUrlExternaSegura(wavUrl);
      if (isSafe) {
        const res = await fetch(encodeURI(wavUrl));
        if (res.ok) {
          const ab = await res.arrayBuffer();
          wavBuffer = Buffer.from(ab);
          fs.writeFileSync(tempWav, wavBuffer);
        } else {
          console.warn(`[WAV Optimizer] Fetch HTTP devolvió estatus ${res.status} para ${wavUrl}`);
        }
      }
    }

    // C. Si es una ruta local en /uploads/
    if (!wavBuffer && wavUrl.startsWith("/uploads/")) {
      const localPath = path.join(process.cwd(), "public", wavUrl);
      if (fs.existsSync(localPath)) {
        wavBuffer = fs.readFileSync(localPath);
        fs.writeFileSync(tempWav, wavBuffer);
      }
    }

    if (!wavBuffer || !fs.existsSync(tempWav) || fs.statSync(tempWav).size === 0) {
      console.warn(`[WAV Optimizer] No se pudo obtener el buffer WAV para: ${wavUrl}`);
      return null;
    }

    const origSize = fs.statSync(tempWav).size;

    // Transcodificar a MP3 256k con FFmpeg
    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempWav)
        .audioBitrate("256k")
        .output(tempMp3)
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });

    if (!fs.existsSync(tempMp3) || fs.statSync(tempMp3).size === 0) {
      throw new Error("FFmpeg no generó archivo MP3 válido");
    }

    const mp3Buffer = fs.readFileSync(tempMp3);
    const newSize = mp3Buffer.length;

    // Subir el MP3 optimizado a Supabase Storage
    const cleanFilename = filenameHint
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-");
    const subPath = rutaAlmacenamientoStem(bandId || "band-ruta-66", `${cleanFilename}-opt.mp3`, `${Date.now()}`);
    
    let uploadedUrl = await uploadBufferToSupabase(mp3Buffer, subPath, "audio/mpeg");

    if (!uploadedUrl && wavUrl.startsWith("/uploads/")) {
      // Fallback local
      const localDir = path.join(process.cwd(), "public", "uploads", "stems");
      if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
      const localFilename = `opt-${Date.now()}-${cleanFilename}.mp3`;
      fs.writeFileSync(path.join(localDir, localFilename), mp3Buffer);
      uploadedUrl = `/uploads/stems/${localFilename}`;
    }

    if (!uploadedUrl) {
      throw new Error("No se pudo subir ni guardar el archivo MP3 optimizado");
    }

    return {
      mp3Url: uploadedUrl,
      origSize,
      newSize
    };
  } catch (err: any) {
    console.error(`[WAV Optimizer] Error convirtiendo ${wavUrl}:`, err?.message || err);
    return null;
  } finally {
    if (fs.existsSync(tempWav)) {
      try { fs.unlinkSync(tempWav); } catch (_) {}
    }
    if (fs.existsSync(tempMp3)) {
      try { fs.unlinkSync(tempMp3); } catch (_) {}
    }
  }
}

/**
 * Examina y optimiza masivamente todos los archivos de audio .wav del repertorio
 * de una banda (o de todas las bandas si no se especifica bandId), reemplazando los .wav por .mp3
 * comprimidos de alta fidelidad (256kbps) en Supabase.
 */
export async function optimizeWavSongsForBand(targetBandId?: string): Promise<OptimizationResult> {
  const sb = getSupabase();
  const result: OptimizationResult = {
    totalSongsExamined: 0,
    songsOptimized: 0,
    totalWavsProcessed: 0,
    originalSizeBytes: 0,
    optimizedSizeBytes: 0,
    savedBytes: 0,
    savedPercentage: "0%",
    details: []
  };

  const { data: songs, error } = await sb.from("songs").select("*");
  if (error) {
    console.error("[WAV Optimizer] Error consultando canciones en Supabase:", error);
    return result;
  }

  if (!songs || songs.length === 0) {
    return result;
  }

  const rawTargetBandId = (targetBandId || "").trim().toLowerCase();

  for (const song of songs) {
    const songBand = (song.band_id || "").trim().toLowerCase();
    
    // Si se especificó una banda objetivo, filtrar por ella (aceptando prefijos)
    if (rawTargetBandId) {
      const cleanTarget = rawTargetBandId.replace(/^(band|reg)-/, "");
      const cleanSongBand = songBand.replace(/^(band|reg)-/, "");
      if (cleanSongBand !== cleanTarget && !songBand.includes(cleanTarget)) {
        continue;
      }
    }

    result.totalSongsExamined++;
    const jsonStr = JSON.stringify(song);

    if (!jsonStr.toLowerCase().includes(".wav")) {
      continue;
    }

    console.log(`[WAV Optimizer] Procesando canción "${song.titulo}" [ID: ${song.id}]...`);
    let songUpdated = false;
    const songBandId = song.band_id || targetBandId || "band-ruta-66";

    // 1. Verificar audio_principal_url
    if (song.audio_principal_url && song.audio_principal_url.toLowerCase().includes(".wav")) {
      const conv = await convertWavUrlToMp3(
        song.audio_principal_url,
        songBandId,
        `${song.titulo}-principal`
      );
      if (conv) {
        result.totalWavsProcessed++;
        result.originalSizeBytes += conv.origSize;
        result.optimizedSizeBytes += conv.newSize;
        result.details.push({
          songId: song.id,
          songTitle: song.titulo,
          wavUrl: song.audio_principal_url,
          mp3Url: conv.mp3Url,
          origMB: (conv.origSize / 1024 / 1024).toFixed(2),
          newMB: (conv.newSize / 1024 / 1024).toFixed(2)
        });
        song.audio_principal_url = conv.mp3Url;
        if (song.audio_url === song.audio_principal_url) {
          song.audio_url = conv.mp3Url;
        }
        songUpdated = true;
      }
    }

    // 2. Verificar audio_url
    if (song.audio_url && song.audio_url.toLowerCase().includes(".wav") && song.audio_url !== song.audio_principal_url) {
      const conv = await convertWavUrlToMp3(
        song.audio_url,
        songBandId,
        `${song.titulo}-audio`
      );
      if (conv) {
        result.totalWavsProcessed++;
        result.originalSizeBytes += conv.origSize;
        result.optimizedSizeBytes += conv.newSize;
        result.details.push({
          songId: song.id,
          songTitle: song.titulo,
          wavUrl: song.audio_url,
          mp3Url: conv.mp3Url,
          origMB: (conv.origSize / 1024 / 1024).toFixed(2),
          newMB: (conv.newSize / 1024 / 1024).toFixed(2)
        });
        song.audio_url = conv.mp3Url;
        songUpdated = true;
      }
    }

    // 3. Verificar audio_ideas
    if (Array.isArray(song.audio_ideas)) {
      for (const idea of song.audio_ideas) {
        if (idea.audioUrl && idea.audioUrl.toLowerCase().includes(".wav")) {
          const conv = await convertWavUrlToMp3(
            idea.audioUrl,
            songBandId,
            `${song.titulo}-${idea.titulo || 'idea'}`
          );
          if (conv) {
            result.totalWavsProcessed++;
            result.originalSizeBytes += conv.origSize;
            result.optimizedSizeBytes += conv.newSize;
            result.details.push({
              songId: song.id,
              songTitle: `${song.titulo} (${idea.titulo || 'Idea'})`,
              wavUrl: idea.audioUrl,
              mp3Url: conv.mp3Url,
              origMB: (conv.origSize / 1024 / 1024).toFixed(2),
              newMB: (conv.newSize / 1024 / 1024).toFixed(2)
            });
            idea.audioUrl = conv.mp3Url;
            songUpdated = true;
          }
        }

        if (Array.isArray(idea.pistas)) {
          for (const pista of idea.pistas) {
            if (pista.audioUrl && pista.audioUrl.toLowerCase().includes(".wav")) {
              const conv = await convertWavUrlToMp3(
                pista.audioUrl,
                songBandId,
                `${song.titulo}-${pista.nombre || 'pista'}`
              );
              if (conv) {
                result.totalWavsProcessed++;
                result.originalSizeBytes += conv.origSize;
                result.optimizedSizeBytes += conv.newSize;
                result.details.push({
                  songId: song.id,
                  songTitle: `${song.titulo} [Pista: ${pista.nombre || 'Pista'}]`,
                  wavUrl: pista.audioUrl,
                  mp3Url: conv.mp3Url,
                  origMB: (conv.origSize / 1024 / 1024).toFixed(2),
                  newMB: (conv.newSize / 1024 / 1024).toFixed(2)
                });
                pista.audioUrl = conv.mp3Url;
                songUpdated = true;
              }
            }
          }
        }
      }
    }

    // Si la canción fue modificada, actualizarla en Supabase
    if (songUpdated) {
      const updatePayload: any = {
        audio_principal_url: song.audio_principal_url,
        audio_url: song.audio_url,
        audio_ideas: song.audio_ideas
      };

      const { error: updateError } = await sb
        .from("songs")
        .update(updatePayload)
        .eq("id", song.id);

      if (updateError) {
        console.error(`[WAV Optimizer] Error actualizando canción ${song.id} en Supabase:`, updateError);
      } else {
        console.log(`[WAV Optimizer] Canción "${song.titulo}" actualizada con éxito en Supabase.`);
        result.songsOptimized++;
      }
    }
  }

  result.savedBytes = Math.max(0, result.originalSizeBytes - result.optimizedSizeBytes);
  if (result.originalSizeBytes > 0) {
    const pct = ((result.savedBytes / result.originalSizeBytes) * 100).toFixed(1);
    result.savedPercentage = `${pct}%`;
  }

  return result;
}
