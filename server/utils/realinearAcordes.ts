/**
 * Coloca cada cambio de acorde donde la armonía cambia de verdad.
 *
 * El detector decide con ventanas de ~370 ms y salto de ~186 ms: sus fronteras llevan ±0,2 s de error
 * y, según cómo caiga la ventana, a veces se adelantan y a veces se retrasan. El flujo espectral de la
 * mezcla corrige eso con el ataque más fuerte cercano, pero ahí manda la batería, no la guitarra.
 *
 * Aquí se mira solo la armonía: con un croma de salto fino (~46 ms) se prueba cada instante candidato
 * `t` alrededor de la frontera y se elige el que mejor explica «antes suena el acorde anterior y
 * después el siguiente» (correlación del croma con las plantillas de ambos). La correlación (croma
 * menos su media) ignora la energía plana de platillos y cajas.
 */

import { fft, ventanaHann } from "./audioKey.js";
import { PLANTILLAS, type SegmentoAcorde } from "./chordDetection.js";
import { refinarFronterasConAtaques } from "./refinarFronteras.js";

// Perezoso: chordDetection importa este módulo, así que PLANTILLAS aún no existe al cargarlo.
const vectorDeAcorde = (nombre: string) => PLANTILLAS.find((p) => p.nombre === nombre)?.vector;

const VENTANA = 2048; // ~186 ms a 11025 Hz
const HOP = 512; // ~46 ms
const FREQ_MIN = 100;
const FREQ_MAX = 2000;
const RADIO = 0.4; // s a cada lado de la frontera original
const ALCANCE = 1.2; // s de armonía que se mira a cada lado de t
const SEPARACION_MIN = 0.25;
/** Cuánto debe destacar el mejor instante sobre el resto de candidatos (por frame mirado) para darlo por confirmado. */
const CONTRASTE_MIN = 0.0004;

const centrar = (v: ArrayLike<number>): number[] => {
  const media = Array.from(v).reduce((a, b) => a + b, 0) / v.length;
  const c = Array.from(v, (x) => x - media);
  const n = Math.sqrt(c.reduce((a, b) => a + b * b, 0)) || 1;
  return c.map((x) => x / n);
};

const R_TIEMPO = 4; // ±4 frames (~±185 ms): más largo que un golpe de caja; la mediana respeta el escalón de un cambio de acorde

/** Magnitudes (bins de interés) del frame que empieza en la muestra `inicio`, o null si hay silencio. */
function magnitudes(pcm: Float32Array, inicio: number, binMin: number, nBins: number, ventana: Float64Array): Float32Array | null {
  if (inicio < 0 || inicio + VENTANA > pcm.length) return null;
  const re = new Float64Array(VENTANA);
  const im = new Float64Array(VENTANA);
  let energia = 0;
  for (let i = 0; i < VENTANA; i++) {
    const m = pcm[inicio + i] * ventana[i];
    re[i] = m;
    energia += m * m;
  }
  if (energia / VENTANA < 1e-8) return null;
  fft(re, im);
  const m = new Float32Array(nBins);
  for (let b = 0; b < nBins; b++) m[b] = Math.sqrt(re[binMin + b] ** 2 + im[binMin + b] ** 2);
  return m;
}

/**
 * Mueve cada frontera entre dos acordes reales al instante que mejor encaja con la armonía.
 * @returns Los segmentos y los índices de los segmentos cuya frontera inicial quedó confirmada.
 */
export function realinearFronteras(
  segmentos: SegmentoAcorde[],
  pcm: Float32Array,
  sampleRate: number,
  afinacion = 0
): { segmentos: SegmentoAcorde[]; confirmadas: Set<number> } {
  const confirmadas = new Set<number>();
  if (segmentos.length < 2 || pcm.length < VENTANA) return { segmentos, confirmadas };
  const resultado = segmentos.map((s) => ({ ...s }));
  const ventana = ventanaHann(VENTANA);
  const binHz = sampleRate / VENTANA;
  const binMin = Math.max(1, Math.floor(FREQ_MIN / binHz));
  const binMax = Math.min(VENTANA / 2 - 1, Math.ceil(FREQ_MAX / binHz));
  const claseDeBin = new Int8Array(binMax - binMin + 1);
  for (let b = 0; b < claseDeBin.length; b++) {
    const tono = 69 + 12 * Math.log2(((binMin + b) * binHz) / 440);
    claseDeBin[b] = ((Math.round(tono - afinacion) % 12) + 12) % 12;
  }
  const nBins = claseDeBin.length;
  const cacheMag = new Map<number, Float32Array | null>();
  const mag = (f: number) => {
    if (!cacheMag.has(f)) cacheMag.set(f, magnitudes(pcm, f * HOP, binMin, nBins, ventana));
    return cacheMag.get(f)!;
  };
  // Croma de la parte tonal: mediana en el tiempo por bin (un golpe dura menos que la ventana de la mediana).
  const cache = new Map<number, number[] | null>();
  const croma = (f: number) => {
    const hecho = cache.get(f);
    if (hecho !== undefined) return hecho;
    const vecinos: Float32Array[] = [];
    for (let d = -R_TIEMPO; d <= R_TIEMPO; d++) { const m = mag(f + d); if (m) vecinos.push(m); }
    let salida: number[] | null = null;
    if (vecinos.length > R_TIEMPO) {
      const acc = new Array(12).fill(0);
      const col = new Float32Array(vecinos.length);
      for (let b = 0; b < nBins; b++) {
        for (let k = 0; k < vecinos.length; k++) col[k] = vecinos[k][b];
        col.sort();
        acc[claseDeBin[b]] += Math.sqrt(col[col.length >> 1]);
      }
      salida = centrar(acc);
    }
    cache.set(f, salida);
    return salida;
  };
  const centroDe = (f: number) => (f * HOP + VENTANA / 2) / sampleRate;
  const dt = HOP / sampleRate;
  const correlacion = (c: number[] | null, plantilla: number[]) => (c ? c.reduce((a, x, k) => a + x * plantilla[k], 0) : 0);

  for (let i = 1; i < resultado.length; i++) {
    const anterior = resultado[i - 1];
    const actual = resultado[i];
    const pa = vectorDeAcorde(anterior.acorde);
    const pn = vectorDeAcorde(actual.acorde);
    if (!pa || !pn) continue;
    const va = centrar(pa);
    const vn = centrar(pn);
    const frontera = actual.t0;
    const lo = Math.max(anterior.t0 + SEPARACION_MIN, frontera - RADIO);
    const hi = Math.min(actual.t1 - SEPARACION_MIN, frontera + RADIO);
    if (hi <= lo) continue;
    // Frames que se miran: lo que cabe en el propio tramo, hasta ALCANCE.
    const antes = Math.min(ALCANCE, frontera - anterior.t0 + RADIO);
    const despues = Math.min(ALCANCE, actual.t1 - frontera + RADIO);
    const fIni = Math.max(0, Math.floor(((frontera - antes) * sampleRate - VENTANA / 2) / HOP));
    const fFin = Math.floor(((frontera + despues) * sampleRate - VENTANA / 2) / HOP);
    // d(f) > 0 si el frame se parece más al acorde anterior que al nuevo. Un cambio real es un escalón
    // de d: se ajustan dos niveles constantes (mínimos cuadrados), lo que no depende de que una
    // plantilla puntúe más alto que la otra en general (Am y F comparten dos notas).
    const d: number[] = [];
    for (let f = fIni; f <= fFin; f++) {
      const c = croma(f);
      d.push(c ? correlacion(c, va) - correlacion(c, vn) : 0);
    }
    const n = d.length;
    const s1 = [0];
    const s2 = [0];
    for (let k = 0; k < n; k++) { s1.push(s1[k] + d[k]); s2.push(s2[k] + d[k] * d[k]); }
    const sse = (corte: number) => {
      const izq = s2[corte] - s1[corte] ** 2 / corte;
      const der = s2[n] - s2[corte] - (s1[n] - s1[corte]) ** 2 / (n - corte);
      return izq + der;
    };
    const puntos: Array<{ t: number; v: number; escalon: number }> = [];
    for (let f = Math.ceil((lo * sampleRate - VENTANA / 2) / HOP); f * HOP + VENTANA / 2 <= hi * sampleRate; f++) {
      const corte = f - fIni;
      if (corte < 3 || corte > n - 3) continue;
      const escalon = s1[corte] / corte - (s1[n] - s1[corte]) / (n - corte);
      puntos.push({ t: centroDe(f), v: -sse(corte), escalon });
    }
    if (puntos.length < 3) continue;
    let mejor = puntos[0];
    for (const p of puntos) if (p.v > mejor.v) mejor = p;
    const ordenados = puntos.map((p) => p.v).sort((x, y) => x - y);
    const mediana = ordenados[ordenados.length >> 1];
    // El escalón debe ir en el sentido esperado (antes ≈ anterior, después ≈ nuevo) y destacar sobre el resto de candidatos.
    if (mejor.escalon <= 0 || (mejor.v - mediana) / n < CONTRASTE_MIN) continue;
    // `t` es el centro del primer frame «nuevo»: la frontera está medio salto antes.
    const t = Math.round((mejor.t - dt / 2) * 100) / 100;
    if (t <= anterior.t0 + SEPARACION_MIN || t >= actual.t1 - SEPARACION_MIN) continue;
    anterior.t1 = t;
    actual.t0 = t;
    actual.anclado = true;
    confirmadas.add(i);
  }
  return { segmentos: resultado, confirmadas };
}

/**
 * Instante de cada cambio de acorde: primero el ajuste armónico (no lo engaña la batería); el flujo
 * espectral solo afina las fronteras que la armonía no ha podido confirmar.
 */
export function afinarFronteras(segmentos: SegmentoAcorde[], pcm: Float32Array, sampleRate: number, afinacion = 0): SegmentoAcorde[] {
  const { segmentos: alineados, confirmadas } = realinearFronteras(segmentos, pcm, sampleRate, afinacion);
  return refinarFronterasConAtaques(alineados, pcm, sampleRate, confirmadas);
}
