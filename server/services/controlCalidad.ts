/**
 * Mide un clip renderizado con ffmpeg y lo juzga con `evaluarCalidadClip`. Una sola pasada de
 * decodificación (negro, congelado, silencio y sonoridad a la vez): en un clip de 30 s son 2-4 s.
 */
import { spawn } from "child_process";
import ffmpegStatic from "ffmpeg-static";
import {
  evaluarCalidadClip,
  parsearMedicionFfmpeg,
  UMBRALES,
  type ExpectativasClip,
  type InformeCalidad,
  type MedicionClip
} from "../utils/controlCalidadClip.js";
import { comoErrorCapturado } from "../../src/utils/errorCapturado.js";

const TIEMPO_MAX_MS = 90_000;

/** stderr de ffmpeg, termine como termine: `ffmpeg -i` sin salida acaba con código 1 a propósito. */
function stderrDeFfmpeg(args: string[]): Promise<string> {
  const binario = ffmpegStatic as unknown as string;
  return new Promise((resolve, reject) => {
    const proceso = spawn(binario, ["-hide_banner", "-nostdin", ...args], { stdio: ["ignore", "ignore", "pipe"] });
    let salida = "";
    const temporizador = setTimeout(() => {
      proceso.kill("SIGKILL");
      reject(new Error("La medición de calidad superó el tiempo máximo."));
    }, TIEMPO_MAX_MS);
    proceso.stderr.on("data", (trozo: Buffer) => {
      salida += trozo.toString();
    });
    proceso.on("error", (e) => {
      clearTimeout(temporizador);
      reject(e);
    });
    proceso.on("close", () => {
      clearTimeout(temporizador);
      resolve(salida);
    });
  });
}

export async function medirClip(ruta: string): Promise<MedicionClip> {
  const info = await stderrDeFfmpeg(["-i", ruta]);
  // Sin ficha de vídeo no hay nada que medir: es un fallo de la medición, no un clip suspendido.
  if (!/Duration: /.test(info) || !/: Video: /.test(info)) {
    throw new Error(`ffmpeg no pudo leer el clip: ${info.trim().split("\n").at(-1) || "sin salida"}`);
  }
  const tieneAudio = /Stream #\d+:\d+.*: Audio:/.test(info);
  const u = UMBRALES;
  const video = `blackdetect=d=${u.negroAvisoSeg}:pix_th=0.10,freezedetect=n=-60dB:d=${u.congeladoAvisoSeg}`;
  const args = tieneAudio
    ? ["-i", ruta, "-filter_complex", `[0:v]${video}[v];[0:a]silencedetect=noise=-50dB:d=${u.silencioAvisoSeg},ebur128[a]`, "-map", "[v]", "-map", "[a]", "-f", "null", "-"]
    : ["-i", ruta, "-vf", video, "-f", "null", "-"];
  return parsearMedicionFfmpeg(info, await stderrDeFfmpeg(args));
}

/**
 * Informe de calidad del clip, o null si no se pudo medir. Un null no se trata como "aprobado":
 * el publicador no autopublica lo que no se ha podido comprobar.
 */
export async function controlarCalidadClip(ruta: string, esperado: ExpectativasClip): Promise<InformeCalidad | null> {
  try {
    return evaluarCalidadClip(await medirClip(ruta), esperado);
  } catch (e) {
    console.warn("[Reels] No se pudo medir la calidad del clip:", comoErrorCapturado(e).message || e);
    return null;
  }
}
