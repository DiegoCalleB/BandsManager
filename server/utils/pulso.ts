/**
 * Pulso (tempo y posición de los tiempos) deducido del propio audio, sin modelos ni servicios:
 * envolvente de ataques (flujo espectral) → autocorrelación para el tempo → programación dinámica
 * (Ellis, 2007) para colocar los pulsos. Si se conoce el BPM de la ficha se usa como pista para
 * escoger entre tempo, mitad y doble, que son indistinguibles solo con la autocorrelación.
 *
 * Límites: asume tempo casi constante (rock, pop, directos con click o sin él si la banda es
 * firme); un tema con rubato fuerte sale con `confianza` baja y no se aprovecha.
 */

import { flujoDe } from "./refinarFronteras.js";

const HOP = 256; // el del flujo espectral
const BPM_MIN = 55;
const BPM_MAX = 210;

export interface Pulso {
  bpm: number;
  /** Instantes (s) de cada pulso. */
  pulsos: number[];
  /** Fase de la rejilla regular: instante (s) del primer pulso dentro de [0, periodo). */
  fase: number;
  /** 0-1: cuánto destacan los ataques en los pulsos frente al resto. */
  confianza: number;
}

/** Envolvente de ataques: sin la media local, sin negativos y escalada. */
function envolvente(flujo: Float32Array, fps: number): Float32Array {
  const n = flujo.length;
  const radio = Math.max(2, Math.round(fps * 0.5));
  const acum = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) acum[i + 1] = acum[i] + flujo[i];
  const env = new Float32Array(n);
  let suma = 0;
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - radio), b = Math.min(n, i + radio + 1);
    const media = (acum[b] - acum[a]) / (b - a);
    env[i] = Math.sqrt(Math.max(0, flujo[i] - media)); // raíz: un bombo fuerte y una caja suave pesan parecido
    suma += env[i] * env[i];
  }
  const rms = Math.sqrt(suma / Math.max(1, n)) || 1;
  for (let i = 0; i < n; i++) env[i] /= rms;
  return env;
}

function autocorrelacion(env: Float32Array, lagMin: number, lagMax: number): Float64Array {
  const ac = new Float64Array(lagMax + 2);
  for (let lag = lagMin; lag <= lagMax + 1; lag++) {
    let s = 0;
    for (let i = lag; i < env.length; i++) s += env[i] * env[i - lag];
    ac[lag] = s / (env.length - lag);
  }
  return ac;
}

/** Valor interpolado de la autocorrelación en un lag fraccionario. */
const acEn = (ac: Float64Array, lag: number) => {
  const i = Math.floor(lag);
  const f = lag - i;
  return ac[i] * (1 - f) + ac[i + 1] * f;
};

export function calcularPulso(pcm: Float32Array, sampleRate: number, opciones: { bpmFicha?: number } = {}): Pulso | null {
  const flujo = flujoDe(pcm, sampleRate);
  const fps = sampleRate / HOP;
  if (flujo.length < fps * 8) return null;
  // Sin ataques (tono continuo, silencio, pad): no hay pulso que encontrar. El flujo medio de música
  // con percusión ronda 50-200; un tono puro, <1.
  if (flujo.reduce((a, v) => a + v, 0) / flujo.length < 3) return null;
  const env = envolvente(flujo, fps);

  const lagMin = Math.floor((fps * 60) / BPM_MAX);
  const lagMax = Math.ceil((fps * 60) / BPM_MIN);
  const ac = autocorrelacion(env, lagMin, lagMax * 2);
  // Puntuación de un tempo: su autocorrelación más la de sus múltiplos (un pulso firme se repite).
  const puntuar = (bpm: number) => {
    const lag = (fps * 60) / bpm;
    return acEn(ac, lag) + 0.5 * (lag * 2 <= lagMax * 2 ? acEn(ac, lag * 2) : 0) + 0.25 * (lag / 2 >= lagMin ? acEn(ac, lag / 2) : 0);
  };

  // Candidatos: máximos de la autocorrelación en 55-210 BPM, y la ficha (y su mitad/doble) si la hay.
  const candidatos: { bpm: number; puntos: number }[] = [];
  const barrido = (centro: number, margen: number, penal: number) => {
    let mejor: { bpm: number; puntos: number } | null = null;
    for (let b = centro * (1 - margen); b <= centro * (1 + margen); b += centro * 0.002) {
      if (b < BPM_MIN || b > BPM_MAX) continue;
      const p = puntuar(b) * penal;
      if (!mejor || p > mejor.puntos) mejor = { bpm: b, puntos: p };
    }
    if (mejor) candidatos.push(mejor);
  };
  const ficha = opciones.bpmFicha && opciones.bpmFicha >= 40 && opciones.bpmFicha <= 260 ? opciones.bpmFicha : null;
  if (ficha) {
    barrido(ficha, 0.07, 1);
    barrido(ficha / 2, 0.07, 0.7);
    barrido(ficha * 2, 0.07, 0.7);
  } else {
    // Sin pista: prior suave hacia 60-150 BPM (el rango habitual de la música popular).
    for (let b = BPM_MIN; b <= BPM_MAX; b += 1) {
      const prior = Math.exp(-0.5 * Math.pow(Math.log2(b / 105) / 0.8, 2));
      const p = puntuar(b) * prior;
      if (!candidatos.length || p > candidatos[0].puntos) candidatos[0] = { bpm: b, puntos: p };
    }
  }
  candidatos.sort((a, b) => b.puntos - a.puntos);
  if (!candidatos.length || candidatos[0].puntos <= 0) return null;
  const bpmBase = candidatos[0].bpm;

  // Programación dinámica: puntúa cada frame por su ataque y por lo cerca que está un periodo del anterior.
  const T = (fps * 60) / bpmBase;
  const n = env.length;
  const LAMBDA = 400;
  const acumulado = new Float64Array(n);
  const previo = new Int32Array(n).fill(-1);
  const lo = Math.max(1, Math.round(T * 0.5)), hi = Math.round(T * 2);
  for (let t = 0; t < n; t++) {
    let mejor = 0, mejorP = -1;
    for (let d = lo; d <= hi && t - d >= 0; d++) {
      const c = acumulado[t - d] - LAMBDA * Math.pow(Math.log(d / T), 2);
      if (mejorP < 0 || c > mejor) { mejor = c; mejorP = t - d; }
    }
    acumulado[t] = env[t] + (mejorP >= 0 ? mejor : 0);
    previo[t] = mejorP;
  }
  // Fin: el mejor frame en el último periodo.
  let fin = n - 1;
  for (let t = Math.max(0, n - Math.round(T)); t < n; t++) if (acumulado[t] > acumulado[fin]) fin = t;
  const frames: number[] = [];
  for (let t = fin; t >= 0; t = previo[t]) { frames.push(t); if (previo[t] < 0) break; }
  frames.reverse();
  if (frames.length < 8) return null;

  // Tiempo del pulso: el flujo del frame f refleja el ataque ocurrido hacia su inicio.
  const aTiempo = (f: number) => (f * HOP + 512 + 0.025 * sampleRate) / sampleRate;
  const pulsos = frames.map(aTiempo);
  // Periodo: pendiente de la recta tiempo-vs-índice (los pulsos caen en frames de 23 ms; la mediana
  // de intervalos sale cuantizada y falla 2 BPM a 120).
  const nP = pulsos.length;
  const mediaI = (nP - 1) / 2, mediaT = pulsos.reduce((a, t) => a + t, 0) / nP;
  let num = 0, den = 0;
  pulsos.forEach((t, i) => { num += (i - mediaI) * (t - mediaT); den += (i - mediaI) ** 2; });
  const periodo = num / den;
  const bpm = Math.round((60 / periodo) * 10) / 10;

  // Fase de la rejilla regular: media circular de los pulsos módulo el periodo.
  let sx = 0, sy = 0;
  for (const t of pulsos) { const a = (2 * Math.PI * (t % periodo)) / periodo; sx += Math.cos(a); sy += Math.sin(a); }
  const fase = ((Math.atan2(sy, sx) / (2 * Math.PI)) * periodo + periodo) % periodo;

  // Confianza: ataque medio en los pulsos frente al ataque medio en todo el audio.
  const enPulsos = frames.reduce((a, f) => a + env[f], 0) / frames.length;
  const global = env.reduce((a, v) => a + v, 0) / n || 1;
  // Además de que los ataques caigan en los pulsos, el audio debe ser periódico de verdad: sin esto un tono
  // continuo (envolvente de puro ruido) saldría con «confianza» alta.
  const periodicidad = Math.min(1, candidatos[0].puntos / 1.0);
  const confianza = Math.round(Math.min(1, Math.max(0, (enPulsos / global - 1) / 2.5)) * periodicidad * 100) / 100;

  return { bpm, pulsos: pulsos.map((t) => Math.round(t * 100) / 100), fase: Math.round(fase * 1000) / 1000, confianza };
}

/**
 * Lleva los cambios de acorde al pulso más cercano cuando están a menos de `radio` s: en la música
 * con pulso los acordes cambian EN el pulso, y el detector por ventanas solo acierta ±0,1 s.
 */
export function ajustarAPulso<T extends { t0: number; t1: number }>(segmentos: T[], pulso: Pulso, radio = 0.1): T[] {
  if (pulso.confianza < 0.35 || segmentos.length < 2) return segmentos;
  const salida = segmentos.map((s) => ({ ...s }));
  const cercano = (t: number): number | null => {
    let lo = 0, hi = pulso.pulsos.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (pulso.pulsos[m] <= t) lo = m; else hi = m; }
    const c = Math.abs(pulso.pulsos[lo] - t) <= Math.abs(pulso.pulsos[hi] - t) ? pulso.pulsos[lo] : pulso.pulsos[hi];
    return Math.abs(c - t) <= radio ? c : null;
  };
  for (let i = 1; i < salida.length; i++) {
    const c = cercano(salida[i].t0);
    if (c === null) continue;
    if (c <= salida[i - 1].t0 + 0.2 || c >= salida[i].t1 - 0.2) continue;
    salida[i - 1].t1 = c;
    salida[i].t0 = c;
  }
  return salida;
}
