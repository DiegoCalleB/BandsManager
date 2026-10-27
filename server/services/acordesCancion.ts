import type { AnalisisAcordes, Song } from "../../src/types.js";
import { detectarAcordesConDiagnostico, sumarPcm } from "../utils/chordDetection.js";
import { calcularPulso, ajustarAPulso, type Pulso } from "../utils/pulso.js";
import { detectarPulsoNeuronal, SAMPLE_RATE_BEAT_THIS } from "../utils/beatThis/beatThis.js";
import { ajustarACompases, pulsoDesdeRed } from "../utils/beatThis/compases.js";
import { extraerPcmMono, SAMPLE_RATE } from "../utils/audioKey.js";
import { elegirFuentesAudio, normalizarTonalidad, construirAnalisis, motivoAnalisisPocoFiable, type FuentesAudioAcordes } from "../utils/analisisAcordes.js";

export type ResultadoAnalisis =
  | { ok: true; analisis: AnalisisAcordes }
  | { ok: false; status: number; error: string };

/**
 * Detecta los acordes con tiempos de una canción guardada, sobre el mejor audio disponible
 * (instrumental de Iris → stems armónicos → mezcla) y con la red de seguridad de
 * `motivoAnalisisPocoFiable`. No toca la base de datos: quien llama decide si guarda.
 */
export async function analizarAcordesDeCancion(song: Partial<Song>, alAvanzar?: (etapa: string, detalle: string) => void): Promise<ResultadoAnalisis> {
  const avisa = (etapa: string, detalle: string) => alAvanzar?.(etapa, detalle);
  avisa("audio", "Eligiendo el mejor audio: instrumental, stems o mezcla…");
  const niveles = elegirFuentesAudio(song);
  if (niveles.length === 0) return { ok: false, status: 400, error: "La canción no tiene audio principal para analizar." };

  // Se prueba de mejor a peor fuente; si una no se puede decodificar se baja a la siguiente.
  avisa("audio", "Descargando y decodificando el audio…");
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
  avisa("acordes", "Escuchando las notas y buscando los cambios de acorde…");
  const detectado = detectarAcordesConDiagnostico(pcm, SAMPLE_RATE, { tonalidad: tonalidad ?? undefined });
  const { diagnostico } = detectado;
  // Pulso real del audio: los cambios de acorde se llevan al pulso más cercano y la rejilla de
  // compases del visor se construye sobre él. Primero la red (pulsos Y compases, con tempo que
  // cambia); si no está disponible, el detector clásico (tempo fijo, sin compases).
  avisa("pulso", "Escuchando el pulso y dónde empieza cada compás…");
  const bpmFicha = Number(song.bpm) || undefined;
  const pulso =
    (await pulsoConRed(niveles, { bpmFicha, cambios: cambiosDeAcorde(detectado.segmentos) })) ??
    calcularPulso(pcm, SAMPLE_RATE, { bpmFicha });
  const pulsoUtil = pulso && pulso.confianza >= 0.35 ? pulso : null;
  // Con la red se sabe dónde cae cada «1»: los cambios se cuadran con el compás, no solo con el pulso.
  const segmentos = !pulsoUtil
    ? detectado.segmentos
    : pulsoUtil.fuente === "red"
      ? ajustarACompases(detectado.segmentos, pulsoUtil)
      : ajustarAPulso(detectado.segmentos, pulsoUtil);
  const duracion = pcm.length / SAMPLE_RATE;
  // Una línea por análisis en los logs: permite saber por qué un audio concreto sale mal (croma
  // plano, afinación rara, un solo acorde dominante…) sin tener el audio delante.
  console.log(
    `[acordes] «${song.titulo}» fuente=${fuente} dur=${duracion.toFixed(0)}s tramos=${segmentos.length} distintos=${diagnostico.acordesDistintos} ` +
      `dominante=${Math.round(diagnostico.cuotaAcordeDominante * 100)}% contraste=${diagnostico.contraste.toFixed(2)} afinacion=${diagnostico.afinacionCents}c tonalidad=${diagnostico.tonalidadUsada ?? "-"} pulso=${pulso ? `${pulso.fuente ?? "clasico"}:${pulso.bpm}bpm/${pulso.tiempos ?? "?"}t/conf${pulso.confianza}` : "-"} ficha=${song.bpm ?? "-"} tonos=${diagnostico.tonalidades.length > 1 ? diagnostico.tonalidades.map((t) => `${t.tonalidad}@${Math.round(t.t0)}s`).join(">") : "-"}`
  );
  avisa("revision", "Comprobando que la detección es fiable…");
  const motivo = motivoAnalisisPocoFiable(segmentos, duracion);
  if (motivo) return { ok: false, status: 422, error: motivo };

  return { ok: true, analisis: construirAnalisis({ segmentos, fuente, tonalidad, duracionSegundos: duracion, pulso: pulsoUtil, tonalidades: diagnostico.tonalidades }) };
}

/** Instantes en que cambia el acorde (sin contar los silencios «N»). */
function cambiosDeAcorde(segmentos: Array<{ t0: number; acorde: string }>): number[] {
  const t: number[] = [];
  let previo: string | null = null;
  for (const s of segmentos) {
    if (s.acorde === "N") continue;
    if (previo !== null && s.acorde !== previo) t.push(s.t0);
    previo = s.acorde;
  }
  return t;
}

/**
 * Pulso y compases con Beat This!, o null si no se puede (y se usa el detector clásico). Escucha
 * la mezcla, no los stems armónicos: la batería es justo lo que marca el pulso.
 */
async function pulsoConRed(niveles: FuentesAudioAcordes[], opciones: { bpmFicha?: number; cambios: number[] }): Promise<Pulso | null> {
  const nivel = niveles.find((n) => n.fuente === "mezcla") ?? niveles[0];
  const pistas = (
    await Promise.all(nivel.urls.map((u) => extraerPcmMono(u, { timeoutMs: 90_000, maxDuracionSeg: 360, sampleRate: SAMPLE_RATE_BEAT_THIS })))
  ).filter((p): p is Float32Array => p !== null);
  if (!pistas.length) return null;
  const pcm = sumarPcm(pistas);
  const red = await detectarPulsoNeuronal(pcm);
  return red ? pulsoDesdeRed(red, { ...opciones, duracion: pcm.length / SAMPLE_RATE_BEAT_THIS }) : null;
}
