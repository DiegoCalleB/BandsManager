/**
 * Afina los cambios de acorde con los ataques del audio.
 *
 * El detector de acordes mira ventanas de ~370 ms con salto de ~186 ms, así que sus fronteras
 * llevan un error de ±0,2 s: suficiente para que el aro y la letra «lleguen tarde» o «se adelanten».
 * Aquí se calcula el flujo espectral con salto de ~23 ms (los ataques de la guitarra/batería/piano
 * al cambiar de acorde) y cada frontera se mueve al ataque más fuerte dentro de ±RADIO. Si no hay un
 * ataque claro cerca (un cambio ligado o un pad), la frontera se queda donde estaba.
 */

import { fft, ventanaHann } from "./audioKey.js";
import type { SegmentoAcorde } from "./chordDetection.js";

const VENTANA = 1024;
const HOP = 256; // ~23 ms a 11025 Hz
const FREQ_MIN = 80;
const FREQ_MAX = 3000;
const RADIO = 0.4; // s a cada lado de la frontera original
const SEPARACION_MIN = 0.25; // un segmento no baja de esto tras mover fronteras

const cacheFlujo = new WeakMap<Float32Array, Float32Array>();

/** Igual que `calcularFlujoEspectral` pero memoizado por buffer: lo usan el afinado de fronteras y el pulso. */
export function flujoDe(pcm: Float32Array, sampleRate: number): Float32Array {
  let f = cacheFlujo.get(pcm);
  if (!f) {
    f = calcularFlujoEspectral(pcm, sampleRate);
    cacheFlujo.set(pcm, f);
  }
  return f;
}

/** Flujo espectral positivo (log-comprimido) por frame de ~23 ms. */
export function calcularFlujoEspectral(pcm: Float32Array, sampleRate: number): Float32Array {
  const total = Math.max(0, Math.floor((pcm.length - VENTANA) / HOP) + 1);
  const flujo = new Float32Array(total);
  const ventana = ventanaHann(VENTANA);
  const binHz = sampleRate / VENTANA;
  const b0 = Math.max(1, Math.floor(FREQ_MIN / binHz));
  const b1 = Math.min(VENTANA / 2 - 1, Math.ceil(FREQ_MAX / binHz));
  let previo: Float32Array | null = null;
  for (let f = 0; f < total; f++) {
    const re = new Float64Array(VENTANA);
    const im = new Float64Array(VENTANA);
    for (let i = 0; i < VENTANA; i++) re[i] = pcm[f * HOP + i] * ventana[i];
    fft(re, im);
    const mag = new Float32Array(b1 - b0 + 1);
    for (let b = b0; b <= b1; b++) mag[b - b0] = Math.log1p(100 * Math.sqrt(re[b] ** 2 + im[b] ** 2));
    if (previo) {
      let s = 0;
      for (let k = 0; k < mag.length; k++) {
        const d = mag[k] - previo[k];
        if (d > 0) s += d;
      }
      flujo[f] = s;
    }
    previo = mag;
  }
  return flujo;
}

/** Tiempo (s) del centro del frame de flujo f. */
const tiempoDeFrame = (f: number, sampleRate: number) => (f * HOP + VENTANA / 2) / sampleRate;

export function refinarFronterasConAtaques(
  segmentos: SegmentoAcorde[],
  pcm: Float32Array,
  sampleRate: number
): SegmentoAcorde[] {
  if (segmentos.length < 2) return segmentos;
  const flujo = flujoDe(pcm, sampleRate);
  if (flujo.length < 8) return segmentos;
  const dt = HOP / sampleRate;
  const resultado = segmentos.map((s) => ({ ...s }));

  for (let i = 1; i < resultado.length; i++) {
    const frontera = resultado[i].t0;
    const anterior = resultado[i - 1];
    const actual = resultado[i];
    const lo = Math.max(anterior.t0 + SEPARACION_MIN, frontera - RADIO);
    const hi = Math.min(actual.t1 - SEPARACION_MIN, frontera + RADIO);
    if (hi <= lo) continue;
    const fLo = Math.max(1, Math.ceil((lo * sampleRate - VENTANA / 2) / HOP));
    const fHi = Math.min(flujo.length - 1, Math.floor((hi * sampleRate - VENTANA / 2) / HOP));
    if (fHi <= fLo) continue;

    // Ataque = pico local (suavizado con 3 frames); se exige que destaque sobre el flujo típico.
    let mejor = -1, mejorValor = 0;
    for (let f = fLo; f <= fHi; f++) {
      const v = (flujo[f - 1] + 2 * flujo[f] + (flujo[f + 1] ?? flujo[f])) / 4;
      // Pequeña preferencia por lo cercano a la frontera original: desempata ataques parecidos.
      const cercania = 1 - 0.25 * Math.min(1, Math.abs(tiempoDeFrame(f, sampleRate) - frontera) / RADIO);
      const puntos = v * cercania;
      if (puntos > mejorValor) { mejorValor = puntos; mejor = f; }
    }
    if (mejor < 0) continue;
    const ventanaLocal = Array.from(flujo.slice(Math.max(0, fLo - 40), Math.min(flujo.length, fHi + 40))).sort((a, b) => a - b);
    const mediana = ventanaLocal[Math.floor(ventanaLocal.length / 2)] || 0;
    if (mejorValor < mediana * 1.8 + 1e-6) continue;

    // El flujo de un frame refleja el ataque ocurrido entre f-1 y f: se usa el inicio del salto.
    const t = Math.round((tiempoDeFrame(mejor, sampleRate) - VENTANA / 2 / sampleRate + dt) * 100) / 100;
    if (t <= anterior.t0 + SEPARACION_MIN || t >= actual.t1 - SEPARACION_MIN) continue;
    anterior.t1 = t;
    actual.t0 = t;
  }
  return resultado;
}
