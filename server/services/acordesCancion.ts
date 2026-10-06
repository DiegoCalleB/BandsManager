import type { AnalisisAcordes } from "../../src/types.js";
import { detectarAcordesDesdePcm, sumarPcm } from "../utils/chordDetection.js";
import { extraerPcmMono, SAMPLE_RATE } from "../utils/audioKey.js";
import { elegirFuentesAudio, normalizarTonalidad, construirAnalisis, motivoAnalisisPocoFiable } from "../utils/analisisAcordes.js";

export type ResultadoAnalisis =
  | { ok: true; analisis: AnalisisAcordes }
  | { ok: false; status: number; error: string };

/**
 * Detecta los acordes con tiempos de una canción guardada, sobre el mejor audio disponible
 * (instrumental de Iris → stems armónicos → mezcla) y con la red de seguridad de
 * `motivoAnalisisPocoFiable`. No toca la base de datos: quien llama decide si guarda.
 */
export async function analizarAcordesDeCancion(song: any): Promise<ResultadoAnalisis> {
  const niveles = elegirFuentesAudio(song);
  if (niveles.length === 0) return { ok: false, status: 400, error: "La canción no tiene audio principal para analizar." };

  // Se prueba de mejor a peor fuente; si una no se puede decodificar se baja a la siguiente.
  let pcm: Float32Array | null = null;
  let fuente = niveles[0].fuente;
  for (const nivel of niveles) {
    const decodificados = (
      await Promise.all(nivel.urls.map((u) => extraerPcmMono(u, { timeoutMs: 90_000, maxDuracionSeg: 360 })))
    ).filter((p): p is Float32Array => p !== null);
    if (decodificados.length > 0) {
      pcm = sumarPcm(decodificados);
      fuente = nivel.fuente;
      break;
    }
  }
  if (!pcm) {
    return {
      ok: false,
      status: 422,
      error: "No se pudo descargar o decodificar el audio de la canción (la URL puede haber caducado o el formato no es compatible). Prueba a subirlo de nuevo.",
    };
  }

  const tonalidad = normalizarTonalidad(song.tonalidad);
  const segmentos = detectarAcordesDesdePcm(pcm, SAMPLE_RATE, { tonalidad: tonalidad ?? undefined });
  const motivo = motivoAnalisisPocoFiable(segmentos, pcm.length / SAMPLE_RATE);
  if (motivo) return { ok: false, status: 422, error: motivo };

  return { ok: true, analisis: construirAnalisis({ segmentos, fuente, tonalidad, duracionSegundos: pcm.length / SAMPLE_RATE }) };
}
