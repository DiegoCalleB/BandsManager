/**
 * Optimización transparente del audio que sube la banda: lo pesado (WAV, FLAC, AIFF...) se recodifica a
 * MP3 de 256 kbps para ahorrar almacenamiento. Lo que ya es ligero NO se toca: antes cualquier MP3 de más de
 * 2 MB se recodificaba aunque fuera de 128 kbps, con lo que subir un tema tardaba segundos de CPU de más y el
 * resultado pesaba MÁS y sonaba peor (MP3 → MP3 con pérdida).
 */
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { comoErrorCapturado } from "../../src/utils/errorCapturado.js";

const BITRATE_OBJETIVO_KBPS = 256;
/** Un ffmpeg que se atasca no puede dejar la subida colgada: pasado este tiempo se usa el original. */
const LIMITE_RECODIFICAR_MS = 120_000;
const LIMITE_SONDEO_MS = 15_000;

export function detectMimeType(ext: string, fallback?: string): string {
  const cleanExt = (ext || "").toLowerCase().replace(".", "");
  const mimeMap: Record<string, string> = {
    png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", svg: "image/svg+xml",
    mp3: "audio/mpeg", wav: "audio/wav", m4a: "audio/x-m4a", ogg: "audio/ogg", aac: "audio/aac", flac: "audio/flac",
    pdf: "application/pdf", doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm",
  };
  return mimeMap[cleanExt] || (fallback && fallback !== "application/octet-stream" ? fallback : "application/octet-stream");
}

/** Bitrate en kbps de un audio, o null si no se puede leer a tiempo. */
export function sondearBitrateKbps(ruta: string): Promise<number | null> {
  return new Promise((resolve) => {
    const temporizador = setTimeout(() => resolve(null), LIMITE_SONDEO_MS);
    ffmpeg.ffprobe(ruta, (err, datos) => {
      clearTimeout(temporizador);
      const bps = Number(datos?.format?.bit_rate);
      resolve(err || !Number.isFinite(bps) || bps <= 0 ? null : Math.round(bps / 1000));
    });
  });
}

/** ¿Merece la pena recodificar? Lo pesado sí; un MP3 solo si supera el bitrate objetivo. */
export function debeRecodificar(ext: string, bytes: number, bitrateKbps: number | null): boolean {
  if (["wav", "flac", "aiff", "aif", "alac", "wma", "opus"].includes(ext)) return true;
  if (ext === "m4a" || ext === "ogg") return bitrateKbps === null || bitrateKbps > BITRATE_OBJETIVO_KBPS * 1.05;
  if (ext !== "mp3" || bytes < 2 * 1024 * 1024) return false;
  return bitrateKbps !== null && bitrateKbps > BITRATE_OBJETIVO_KBPS * 1.05;
}

export interface ResultadoOptimizacion { finalPath: string; wasCompressed: boolean; newMime: string; newExt: string }

export async function compressAudioFileIfNeeded(inputPath: string, fallbackMime?: string): Promise<ResultadoOptimizacion> {
  const ext = path.extname(inputPath).toLowerCase().replace(".", "");
  const sinCambios: ResultadoOptimizacion = { finalPath: inputPath, wasCompressed: false, newMime: detectMimeType(ext, fallbackMime), newExt: ext };
  if (!fs.existsSync(inputPath)) return sinCambios;

  const bytes = fs.statSync(inputPath).size;
  const esAudioPesado = ["wav", "flac", "aiff", "aif", "alac", "m4a", "wma", "ogg", "opus", "mp3"].includes(ext);
  if (!esAudioPesado) return sinCambios;
  const bitrate = ext === "mp3" || ext === "m4a" || ext === "ogg" ? await sondearBitrateKbps(inputPath) : null;
  if (!debeRecodificar(ext, bytes, bitrate)) return sinCambios;

  const outputPath = inputPath.replace(new RegExp(`\\.${ext}$`, "i"), "-opt.mp3");
  const inicio = Date.now();
  try {
    await new Promise<void>((resolve, reject) => {
      const comando = ffmpeg(inputPath).audioBitrate(`${BITRATE_OBJETIVO_KBPS}k`).output(outputPath)
        .on("end", () => resolve())
        .on("error", (err) => reject(err));
      const temporizador = setTimeout(() => { comando.kill("SIGKILL"); reject(new Error(`ffmpeg superó ${LIMITE_RECODIFICAR_MS / 1000}s`)); }, LIMITE_RECODIFICAR_MS);
      comando.on("end", () => clearTimeout(temporizador)).on("error", () => clearTimeout(temporizador));
      comando.run();
    });

    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
      console.log(`[Audio Upload Optimizer] ${path.basename(inputPath)}: ${(bytes / 1048576).toFixed(2)}MB -> ${(fs.statSync(outputPath).size / 1048576).toFixed(2)}MB en ${((Date.now() - inicio) / 1000).toFixed(1)}s`);
      const finalCompressedPath = inputPath.replace(new RegExp(`\\.${ext}$`, "i"), ".mp3");
      fs.unlinkSync(inputPath);
      fs.renameSync(outputPath, finalCompressedPath);
      return { finalPath: finalCompressedPath, wasCompressed: true, newMime: "audio/mpeg", newExt: "mp3" };
    }
  } catch (errCapturado) {
    console.warn("[Audio Upload Optimizer] No se pudo recodificar, se usa el original:", comoErrorCapturado(errCapturado).message);
    if (fs.existsSync(outputPath)) {
      try { fs.unlinkSync(outputPath); } catch { /* el temporal ya no existe: nada que limpiar */ }
    }
  }
  return { ...sinCambios, newMime: "audio/mpeg" };
}
