/**
 * Pasos de /cut-video-clip que salieron del render clásico: cierre de loop, rótulo de enganche
 * y registro de procedencia (derechos) del clip. Cada uno es best-effort salvo que se indique.
 */
import fs from "fs";
import { analizarEnergiaAudio } from "../utils/audioEnergy.js";
import { elegirDuracionDeLoop } from "../utils/loopPerfecto.js";
import { loopViable } from "../utils/clipFiltros.js";
import { buildHookAss } from "../utils/hookRotulo.js";
import { derechosDelClip } from "../utils/derechosClip.js";
import { dbRegistrarReelClip } from "../db/reelClips.js";
import { comoErrorCapturado } from "../../src/utils/errorCapturado.js";

/** La descarga de un tramo trae este margen (s) de más por cada lado (`tramoDeDescarga`). */
const MARGEN_DESCARGA_SEG = 2;

/** Duración con la que el final del clip mejor enlaza con su principio (la pedida si no se puede medir). */
export async function duracionDeLoopAjustada(rutaVideo: string, inicioEnFichero: number, duracion: number): Promise<number> {
  if (!loopViable(duracion)) return duracion;
  const curva = await analizarEnergiaAudio(rutaVideo, { timeoutMs: 60_000 });
  return elegirDuracionDeLoop(curva, { inicio: inicioEnFichero, duracion, finDisponible: inicioEnFichero + duracion + MARGEN_DESCARGA_SEG });
}

/** Escribe el rótulo de enganche como ASS. Devuelve la ruta, o undefined si no hay texto que poner. */
export async function escribirRotuloHook(ruta: string, texto: unknown, duracionClip: number): Promise<string | undefined> {
  const ass = buildHookAss(String(texto || ""), { duracion: duracionClip });
  if (!ass) return undefined;
  await fs.promises.writeFile(ruta, ass, "utf-8");
  return ruta;
}

export interface ProcedenciaClip {
  bandId: string;
  clipUrl: string;
  sourceUrl: string;
  canalOrigen: string;
  youtubeDeLaBanda: string;
  nombreDeLaBanda: string;
  declaradoPorLaBanda: boolean;
  loopPerfecto: boolean;
  hookText: string;
}

/**
 * Guarda de dónde sale el clip y si sus derechos son de la banda: es lo que mira el publicador
 * antes de autopublicar. Si falla, el clip sigue siendo válido (solo se podrá publicar a mano).
 */
export async function registrarProcedenciaClip(p: ProcedenciaClip): Promise<string | null> {
  const derechos = derechosDelClip({
    canalOrigen: p.canalOrigen,
    youtubeDeLaBanda: p.youtubeDeLaBanda,
    nombreDeLaBanda: p.nombreDeLaBanda,
    declaradoPorLaBanda: p.declaradoPorLaBanda
  });
  try {
    await dbRegistrarReelClip(
      { clip_url: p.clipUrl, source_url: p.sourceUrl, source_author: p.canalOrigen, source_author_url: "", derechos, loop_perfecto: p.loopPerfecto, hook_text: p.hookText },
      p.bandId
    );
  } catch (e) {
    console.warn("[Reels] No se pudo registrar la procedencia del clip:", comoErrorCapturado(e).message || e);
  }
  return derechos;
}
