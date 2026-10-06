import type { AnalisisAcordes } from "../../src/types.js";
import { detectarAcordesConDiagnostico, sumarPcm } from "../utils/chordDetection.js";
import { calcularPulso, ajustarAPulso } from "../utils/pulso.js";
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
  const detectado = detectarAcordesConDiagnostico(pcm, SAMPLE_RATE, { tonalidad: tonalidad ?? undefined });
  const { diagnostico } = detectado;
  // Pulso real del audio (con el BPM de la ficha como pista): los cambios de acorde se llevan al pulso
  // más cercano y la rejilla de compases del visor se construye sobre él.
  const pulso = calcularPulso(pcm, SAMPLE_RATE, { bpmFicha: Number(song.bpm) || undefined });
  const pulsoUtil = pulso && pulso.confianza >= 0.35 ? pulso : null;
  const segmentos = pulsoUtil ? ajustarAPulso(detectado.segmentos, pulsoUtil) : detectado.segmentos;
  const duracion = pcm.length / SAMPLE_RATE;
  // Una línea por análisis en los logs: permite saber por qué un audio concreto sale mal (croma
  // plano, afinación rara, un solo acorde dominante…) sin tener el audio delante.
  console.log(
    `[acordes] «${song.titulo}» fuente=${fuente} dur=${duracion.toFixed(0)}s tramos=${segmentos.length} distintos=${diagnostico.acordesDistintos} ` +
      `dominante=${Math.round(diagnostico.cuotaAcordeDominante * 100)}% contraste=${diagnostico.contraste.toFixed(2)} afinacion=${diagnostico.afinacionCents}c tonalidad=${diagnostico.tonalidadUsada ?? "-"} pulso=${pulso ? `${pulso.bpm}bpm/conf${pulso.confianza}` : "-"} ficha=${song.bpm ?? "-"} tonos=${diagnostico.tonalidades.length > 1 ? diagnostico.tonalidades.map((t) => `${t.tonalidad}@${Math.round(t.t0)}s`).join(">") : "-"}`
  );
  const motivo = motivoAnalisisPocoFiable(segmentos, duracion);
  if (motivo) return { ok: false, status: 422, error: motivo };

  return { ok: true, analisis: construirAnalisis({ segmentos, fuente, tonalidad, duracionSegundos: duracion, pulso: pulsoUtil, tonalidades: diagnostico.tonalidades }) };
}
