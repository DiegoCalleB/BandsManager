/**
 * Ficheros temporales y salida de los clips renderizados, y mensajes de error de YouTube.
 * Extraído de `routes/reels.ts` sin cambios de comportamiento.
 */
import fs from "fs";
import path from "path";
import { comoErrorCapturado } from "../../src/utils/errorCapturado.js";

/** Dónde se sirven los clips renderizados (server.ts ya expone /clips como estático). */
export const CLIPS_DIR = path.join(process.cwd(), "public", "clips");
/** Cuánto vive un clip en disco antes de que lo barra la limpieza. */
const CLIP_TTL_MS = 6 * 60 * 60 * 1000;
/** Tope de duración de un recorte: por encima el render tarda demasiado y no es un Reel. */
export const MAX_CLIP_SECONDS = 180;

/**
 * Traduce el fallo crudo de ytdl a algo que un músico pueda entender y accionar. El error
 * literal ("Sign in to confirm you're not a bot") no le dice nada a nadie.
 */
export function explicarErrorYoutube(err: unknown): string {
  const msg = String(comoErrorCapturado(err).message || err || "");
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

export function asegurarDirectorioClips() {
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
export async function limpiarClipsAntiguos(): Promise<void> {
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
      } catch {
        /* fichero en uso o ya borrado */
      }
    }
  } catch (e) {
    console.warn("[Reels] No se pudieron limpiar los clips antiguos:", e);
  }
}

export async function borrarSiExiste(rutas: string[]) {
  for (const ruta of rutas) {
    try {
      if (ruta && fs.existsSync(ruta)) await fs.promises.unlink(ruta);
    } catch (e) {
      console.error("[Reels] Error borrando temporal:", ruta, e);
    }
  }
}

