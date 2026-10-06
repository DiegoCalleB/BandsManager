/**
 * Detección de acordes con tiempos a partir de audio (el motor de un «Chordify propio»).
 *
 * Método clásico y explicable, sin modelos ni servicios de pago:
 *  1. Croma por frames (~0,19 s): energía en las 12 clases de altura, con compresión logarítmica
 *     para que un instrumento fuerte no tape al resto.
 *  2. Plantillas de acorde (mayor, menor y séptima de dominante) con los armónicos más
 *     probables, comparadas por similitud coseno con cada frame.
 *  3. Viterbi: una canción no cambia de acorde en cada frame, así que se penaliza cambiar.
 *     Si se conoce la tonalidad, se favorecen ligeramente los acordes diatónicos.
 *  4. Segmentos con confianza: lo que no alcanza el umbral sale como «N» (sin acorde claro)
 *     en vez de inventarse uno.
 *
 * Límites honestos: sobre mezclas completas ronda el 60-75 % de acierto por tiempo en música
 * pop/rock; mejora aislando bajo y armonía con los stems de Iris. Distingue mal inversiones,
 * acordes con extensiones (9, 13, sus) y pasajes con mucha distorsión o sin armonía.
 */

import { fft, ventanaHann, SAMPLE_RATE, extraerPcmMono, calcularCromaDesdePcm, detectarTonalidadDesdeCroma } from "./audioKey.js";

const VENTANA = 4096; // ~372 ms a 11025 Hz
const HOP = 2048; // ~186 ms
const FREQ_MIN = Number(process.env.X_FMIN || 80);
const FREQ_MAX = 2200;
const PESO_BAJO = Number(process.env.X_PB || 0.4);
const MODO_BAJO = process.env.X_MB || 'raiz';
const NOTAS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export type CalidadAcorde = "maj" | "min" | "7";

export interface SegmentoAcorde {
  /** Inicio en segundos. */
  t0: number;
  /** Fin en segundos. */
  t1: number;
  /** Nombre internacional («C», «Am», «G7») o «N» si no hay acorde claro. */
  acorde: string;
  /** 0-1: cuánto se parece el croma al acorde elegido frente al siguiente mejor. */
  confianza: number;
}

export interface OpcionesAcordes {
  /**
   * Tonalidad conocida («Am», «C», «F#m»); favorece acordes diatónicos y desempata mayor/menor
   * cuando el acorde no tiene tercera (power chords). `null` = ninguna; sin indicar (undefined) =
   * se estima del propio audio.
   */
  tonalidad?: string | null;
  /** Segmentos más cortos que esto se funden con el vecino (s). Por defecto 0,4. */
  duracionMinima?: number;
  /** Por debajo de esta confianza el segmento se marca «N». Por defecto 0,15. */
  confianzaMinima?: number;
  /**
   * Incluir séptimas de dominante (G7). Desactivado por defecto: el 7.º armónico de cualquier
   * nota cae casi sobre la séptima menor, y en audio real eso convierte muchos mayores en «7».
   */
  incluirSeptimas?: boolean;
}

interface Plantilla {
  nombre: string;
  raiz: number;
  calidad: CalidadAcorde;
  vector: number[];
}

function normalizar(v: number[]): number[] {
  const n = Math.sqrt(v.reduce((a, b) => a + b * b, 0));
  return n === 0 ? v : v.map((x) => x / n);
}

function construirPlantillas(): Plantilla[] {
  const intervalos: Record<CalidadAcorde, number[]> = { maj: [0, 4, 7], min: [0, 3, 7], "7": [0, 4, 7, 10] };
  const sufijo: Record<CalidadAcorde, string> = { maj: "", min: "m", "7": "7" };
  const salida: Plantilla[] = [];
  for (let raiz = 0; raiz < 12; raiz++) {
    for (const calidad of ["maj", "min", "7"] as CalidadAcorde[]) {
      const v = new Array(12).fill(0);
      intervalos[calidad].forEach((i, idx) => {
        v[(raiz + i) % 12] += idx === 0 ? 1 : 0.85;
      });
      // La raíz suena también como 3.er armónico de la quinta de abajo: refuerza la quinta del acorde.
      v[(raiz + 7) % 12] += 0.1;
      // La séptima es un color, no una certeza: penalizada para no sobrerepresentarse.
      salida.push({ nombre: `${NOTAS[raiz]}${sufijo[calidad]}`, raiz, calidad, vector: normalizar(v) });
    }
  }
  return salida;
}

const PLANTILLAS = construirPlantillas();

/** Mediana de los primeros n valores de v SIN reservar memoria (n pequeño: inserción en tmp). */
function medianaPequena(v: Float32Array, n: number, tmp: Float32Array): number {
  for (let i = 0; i < n; i++) {
    const x = v[i];
    let j = i - 1;
    while (j >= 0 && tmp[j] > x) {
      tmp[j + 1] = tmp[j];
      j--;
    }
    tmp[j + 1] = x;
  }
  return tmp[n >> 1];
}

/**
 * Mediana deslizante en frecuencia con una ventana ordenada que se actualiza con cada paso
 * (quitar el valor que sale, insertar el que entra): O(ventana) por bin en vez de reordenar.
 */
function medianaDeslizante(datos: Float32Array, radio: number): Float32Array {
  const n = datos.length;
  const salida = new Float32Array(n);
  const ventana = new Float32Array(2 * radio + 2);
  let tam = 0;
  const insertar = (x: number) => {
    let j = tam - 1;
    while (j >= 0 && ventana[j] > x) {
      ventana[j + 1] = ventana[j];
      j--;
    }
    ventana[j + 1] = x;
    tam++;
  };
  const quitar = (x: number) => {
    let j = 0;
    while (j < tam && ventana[j] !== x) j++;
    for (; j < tam - 1; j++) ventana[j] = ventana[j + 1];
    tam--;
  };
  for (let k = 0; k <= Math.min(radio, n - 1); k++) insertar(datos[k]);
  for (let b = 0; b < n; b++) {
    salida[b] = ventana[tam >> 1];
    const sale = b - radio;
    const entra = b + radio + 1;
    if (sale >= 0) quitar(datos[sale]);
    if (entra < n) insertar(datos[entra]);
  }
  return salida;
}

/**
 * Espectros de magnitud por frame (solo los bins de interés). `null` en frames silenciosos.
 * Devuelve también la tabla bin → clase de altura, ajustada por la afinación estimada.
 */
function espectrosPorFrames(pcm: Float32Array, sampleRate: number) {
  const ventana = ventanaHann(VENTANA);
  const binHz = sampleRate / VENTANA;
  const binMin = Math.max(1, Math.floor(FREQ_MIN / binHz));
  const binMax = Math.min(VENTANA / 2 - 1, Math.ceil(FREQ_MAX / binHz));
  const nBins = binMax - binMin + 1;
  const total = Math.floor((pcm.length - VENTANA) / HOP) + 1;
  const mags: (Float32Array | null)[] = [];
  for (let f = 0; f < total; f++) {
    const inicio = f * HOP;
    const re = new Float64Array(VENTANA);
    const im = new Float64Array(VENTANA);
    let energia = 0;
    for (let i = 0; i < VENTANA; i++) {
      const m = pcm[inicio + i] * ventana[i];
      re[i] = m;
      energia += m * m;
    }
    if (energia / VENTANA < 1e-8) {
      mags.push(null);
      continue;
    }
    fft(re, im);
    const m = new Float32Array(nBins);
    for (let b = 0; b < nBins; b++) m[b] = Math.sqrt(re[binMin + b] ** 2 + im[binMin + b] ** 2);
    mags.push(m);
  }
  return { mags, binHz, binMin, nBins };
}

/**
 * Quita lo que no es armonía: (1) mediana en el TIEMPO por bin (lo tonal persiste varios frames,
 * un golpe de batería o un platillo no), y (2) resta del suelo de ruido de banda ancha (mediana en
 * FRECUENCIA en torno a cada bin), de modo que solo queden los picos de las notas. Es el
 * «separador armónico/percusivo» clásico en versión ligera.
 */
function limpiarEspectros(mags: (Float32Array | null)[], nBins: number): (Float32Array | null)[] {
  const R_TIEMPO = 3; // ±3 frames (~1,3 s): más largo que un golpe, más corto que un acorde
  const R_FREQ = 20; // ±20 bins
  const salida: (Float32Array | null)[] = new Array(mags.length).fill(null);
  const ventanaT = new Float32Array(2 * R_TIEMPO + 1);
  const tmp = new Float32Array(2 * R_TIEMPO + 1);
  for (let f = 0; f < mags.length; f++) {
    if (!mags[f]) continue;
    const armonico = new Float32Array(nBins);
    for (let b = 0; b < nBins; b++) {
      let n = 0;
      for (let d = -R_TIEMPO; d <= R_TIEMPO; d++) {
        const m = mags[f + d];
        if (m) ventanaT[n++] = m[b];
      }
      armonico[b] = n > 0 ? medianaPequena(ventanaT, n, tmp) : 0;
    }
    const suelo = medianaDeslizante(armonico, R_FREQ);
    const limpio = new Float32Array(nBins);
    for (let b = 0; b < nBins; b++) limpio[b] = Math.max(0, armonico[b] - suelo[b]);
    salida[f] = limpio;
  }
  return salida;
}

/** Croma por frames, cada uno normalizado en L2. `null` en frames silenciosos. */
export function calcularCromaPorFrames(pcm: Float32Array, sampleRate: number): (number[] | null)[] {
  if (!pcm || pcm.length < VENTANA) return [];
  const { mags, binHz, binMin, nBins } = espectrosPorFrames(pcm, sampleRate);
  const limpios = process.env.X_HPSS === '0' ? mags : limpiarEspectros(mags, nBins);
  const claseDeBin = new Int8Array(nBins);
  for (let b = 0; b < nBins; b++) {
    const midi = 69 + 12 * Math.log2(((binMin + b) * binHz) / 440);
    claseDeBin[b] = ((Math.round(midi) % 12) + 12) % 12;
  }
  const compresion = process.env.X_COMP || 'sqrt';
  return limpios.map((m) => {
    if (!m) return null;
    const croma = new Array(12).fill(0);
    for (let b = 0; b < nBins; b++) croma[claseDeBin[b]] += compresion === 'log' ? Math.log1p(m[b] * 20) : Math.sqrt(m[b]);
    const total = croma.reduce((x, y) => x + y, 0);
    return total > 0 ? normalizar(croma) : null;
  });
}

const VENTANA_BAJO = 8192; // ~743 ms: los graves necesitan más resolución en frecuencia
const BAJO_MIN = 50;
const BAJO_MAX = 300;

/**
 * Croma SOLO de graves (50-300 Hz) por frame, normalizado a suma 1 (null si no hay energía).
 * El bajo casi siempre toca la raíz del acorde: en un rock con guitarras distorsionadas la
 * quinta y el tercer armónico de la raíz suenan igual y el croma completo confunde La con Mi;
 * los graves desempatan.
 */
export function calcularCromaBajoPorFrames(pcm: Float32Array, sampleRate: number, nFrames: number): (number[] | null)[] {
  const ventana = ventanaHann(VENTANA_BAJO);
  const binHz = sampleRate / VENTANA_BAJO;
  const binMin = Math.max(1, Math.floor(BAJO_MIN / binHz));
  const binMax = Math.ceil(BAJO_MAX / binHz);
  const claseDeBin = new Int8Array(binMax + 1);
  for (let b = binMin; b <= binMax; b++) {
    const midi = 69 + 12 * Math.log2((b * binHz) / 440);
    claseDeBin[b] = ((Math.round(midi) % 12) + 12) % 12;
  }
  const salida: (number[] | null)[] = [];
  for (let f = 0; f < nFrames; f++) {
    // Misma posición central que el frame del croma completo.
    const inicio = f * HOP + VENTANA / 2 - VENTANA_BAJO / 2;
    const re = new Float64Array(VENTANA_BAJO);
    const im = new Float64Array(VENTANA_BAJO);
    let energia = 0;
    for (let i = 0; i < VENTANA_BAJO; i++) {
      const idx = inicio + i;
      const m = idx >= 0 && idx < pcm.length ? pcm[idx] * ventana[i] : 0;
      re[i] = m;
      energia += m * m;
    }
    if (energia / VENTANA_BAJO < 1e-8) { salida.push(null); continue; }
    fft(re, im);
    const croma = new Array(12).fill(0);
    let total = 0;
    for (let b = binMin; b <= binMax; b++) {
      const mag = Math.sqrt(re[b] * re[b] + im[b] * im[b]);
      const v = Math.pow(mag, 0.8);
      croma[claseDeBin[b]] += v;
      total += v;
    }
    salida.push(total > 0 ? croma.map((v) => v / total) : null);
  }
  return salida;
}

function similitud(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < 12; i++) s += a[i] * b[i];
  return s;
}

/** Grados diatónicos (raíz y calidad esperadas) de una tonalidad mayor o menor. */
function acordesDiatonicos(tonalidad: string): Set<string> {
  const m = /^([A-G][#b]?)(m|min)?$/.exec(tonalidad.trim());
  if (!m) return new Set();
  const bemol: Record<string, string> = { Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#" };
  const raizNombre = bemol[m[1]] ?? m[1];
  const raiz = NOTAS.indexOf(raizNombre);
  if (raiz < 0) return new Set();
  const menor = Boolean(m[2]);
  // [semitonos desde la tónica, calidad]
  const grados: [number, CalidadAcorde][] = menor
    ? [[0, "min"], [3, "maj"], [5, "min"], [7, "min"], [7, "maj"], [8, "maj"], [10, "maj"], [7, "7"]]
    : [[0, "maj"], [2, "min"], [4, "min"], [5, "maj"], [7, "maj"], [9, "min"], [7, "7"]];
  const suf: Record<CalidadAcorde, string> = { maj: "", min: "m", "7": "7" };
  return new Set(grados.map(([s, q]) => `${NOTAS[(raiz + s) % 12]}${suf[q]}`));
}

/**
 * Convierte audio PCM mono en segmentos de acordes con tiempos.
 * Devuelve [] si no hay audio utilizable.
 */
export function detectarAcordesDesdePcm(
  pcm: Float32Array,
  sampleRate: number = SAMPLE_RATE,
  opciones: OpcionesAcordes = {}
): SegmentoAcorde[] {
  const frames = calcularCromaPorFrames(pcm, sampleRate);
  if (frames.length < 4) return [];

  const duracionMinima = opciones.duracionMinima ?? 0.4;
  const confianzaMinima = opciones.confianzaMinima ?? 0.15;
  let tonalidad = opciones.tonalidad;
  if (tonalidad === undefined) {
    const croma = calcularCromaDesdePcm(pcm, sampleRate);
    tonalidad = croma ? (detectarTonalidadDesdeCroma(croma)?.tonalidad ?? null) : null;
  }
  const diatonicos = tonalidad ? acordesDiatonicos(tonalidad) : new Set<string>();
  const plantillas = opciones.incluirSeptimas ? PLANTILLAS : PLANTILLAS.filter((p) => p.calidad !== "7");
  const nEst = plantillas.length;

  // Emisión: similitud con cada plantilla (+ pequeño bonus diatónico, - penalización a séptimas).
  const bajos = calcularCromaBajoPorFrames(pcm, sampleRate, frames.length);
  const emision: number[][] = frames.map((fr, t) => {
    if (!fr) return new Array(nEst).fill(0);
    const bajo = bajos[t];
    return plantillas.map((p) => {
      let s = similitud(fr, p.vector);
      // El bajo toca la raíz: premio proporcional a la energía de graves que cae en ella.
      if (bajo) {
        if (MODO_BAJO === 'tonos') {
          const tercera = p.calidad === 'min' ? 3 : 4;
          s += PESO_BAJO * (bajo[p.raiz] + 0.5 * bajo[(p.raiz + 7) % 12] + 0.35 * bajo[(p.raiz + tercera) % 12]) / 1.85 * 1.0;
        } else s += PESO_BAJO * bajo[p.raiz];
      }
      if (p.calidad === "7") s -= 0.04;
      if (diatonicos.size > 0 && diatonicos.has(p.nombre)) s += 0.05;
      return s;
    });
  });

  // Viterbi con penalización fija por cambiar de acorde.
  const PENALIZACION_CAMBIO = 0.35;
  const ESCALA = 10;
  const T = frames.length;
  const puntuacion: Float64Array[] = [];
  const previo: Int16Array[] = [];
  puntuacion.push(Float64Array.from(emision[0], (e) => e * ESCALA));
  previo.push(new Int16Array(nEst));
  for (let t = 1; t < T; t++) {
    const prev = puntuacion[t - 1];
    let mejorPrev = 0;
    for (let j = 1; j < nEst; j++) if (prev[j] > prev[mejorPrev]) mejorPrev = j;
    const actual = new Float64Array(nEst);
    const ptr = new Int16Array(nEst);
    for (let i = 0; i < nEst; i++) {
      const quedarse = prev[i];
      const cambiar = prev[mejorPrev] - PENALIZACION_CAMBIO * ESCALA;
      if (quedarse >= cambiar) {
        actual[i] = quedarse + emision[t][i] * ESCALA;
        ptr[i] = i;
      } else {
        actual[i] = cambiar + emision[t][i] * ESCALA;
        ptr[i] = mejorPrev;
      }
    }
    puntuacion.push(actual);
    previo.push(ptr);
  }
  const camino = new Int16Array(T);
  let fin = 0;
  for (let i = 1; i < nEst; i++) if (puntuacion[T - 1][i] > puntuacion[T - 1][fin]) fin = i;
  camino[T - 1] = fin;
  for (let t = T - 1; t > 0; t--) camino[t - 1] = previo[t][camino[t]];

  // Confianza por frame: margen entre el acorde elegido y el mejor candidato distinto.
  const confFrame = (t: number): number => {
    const fr = frames[t];
    if (!fr) return 0;
    const elegido = emision[t][camino[t]];
    let mejorOtro = -1;
    for (let i = 0; i < nEst; i++) if (i !== camino[t] && emision[t][i] > mejorOtro) mejorOtro = emision[t][i];
    return Math.max(0, elegido - mejorOtro);
  };

  const dt = HOP / sampleRate;
  // Frontera entre el frame t-1 y el t: centro de la ventana del frame t menos medio salto. Así los
  // segmentos son contiguos (t1 de uno == t0 del siguiente) en vez de solaparse por la ventana.
  const duracionTotal = pcm.length / sampleRate;
  const frontera = (t: number) =>
    t <= 0 ? 0 : t >= T ? duracionTotal : Math.min(duracionTotal, (t * HOP + VENTANA / 2) / sampleRate - dt / 2);
  let segmentos: SegmentoAcorde[] = [];
  let ini = 0;
  for (let t = 1; t <= T; t++) {
    if (t === T || camino[t] !== camino[ini]) {
      let suma = 0;
      for (let k = ini; k < t; k++) suma += confFrame(k);
      const todoSilencio = frames.slice(ini, t).every((f) => f === null);
      segmentos.push({
        t0: frontera(ini),
        t1: frontera(t),
        acorde: todoSilencio ? "N" : plantillas[camino[ini]].nombre,
        confianza: todoSilencio ? 0 : suma / (t - ini),
      });
      ini = t;
    }
  }

  // Segmentos cortos: se funden con el vecino más largo. Poco fiables: «N».
  let cambiado = true;
  while (cambiado && segmentos.length > 1) {
    cambiado = false;
    for (let i = 0; i < segmentos.length; i++) {
      const s = segmentos[i];
      if (s.t1 - s.t0 >= duracionMinima) continue;
      const izq = segmentos[i - 1];
      const der = segmentos[i + 1];
      const destino = !izq ? der : !der ? izq : izq.t1 - izq.t0 >= der.t1 - der.t0 ? izq : der;
      if (destino === izq) izq.t1 = s.t1;
      else der.t0 = s.t0;
      segmentos.splice(i, 1);
      cambiado = true;
      break;
    }
  }
  // Fusionar vecinos iguales que hayan quedado juntos.
  const fusionados: SegmentoAcorde[] = [];
  for (const s of segmentos) {
    const ult = fusionados[fusionados.length - 1];
    if (ult && ult.acorde === s.acorde) {
      const dUlt = ult.t1 - ult.t0, dS = s.t1 - s.t0;
      ult.confianza = (ult.confianza * dUlt + s.confianza * dS) / (dUlt + dS);
      ult.t1 = s.t1;
    } else fusionados.push({ ...s });
  }
  return fusionados.map((s) => ({
    ...s,
    t0: Math.round(s.t0 * 100) / 100,
    t1: Math.round(s.t1 * 100) / 100,
    confianza: Math.round(Math.min(1, s.confianza * 25) * 100) / 100,
    acorde: s.acorde !== "N" && Math.min(1, s.confianza * 25) < confianzaMinima ? "N" : s.acorde,
  }));
}

/**
 * Atajo: decodifica el audio (ruta local o URL) y detecta sus acordes.
 * Para mejores resultados, pasa el stem de armonía (guitarras/teclados/bajo) en vez de la mezcla.
 */
export async function detectarAcordesDesdeAudio(
  fuente: string,
  opciones: OpcionesAcordes & { timeoutMs?: number; maxDuracionSeg?: number } = {}
): Promise<SegmentoAcorde[] | null> {
  const pcm = await extraerPcmMono(fuente, { timeoutMs: opciones.timeoutMs, maxDuracionSeg: opciones.maxDuracionSeg });
  if (!pcm) return null;
  return detectarAcordesDesdePcm(pcm, SAMPLE_RATE, opciones);
}

/**
 * Suma varias pistas (stems) en una sola. Las más cortas se rellenan con silencio. No se
 * normaliza: el detector trabaja con croma normalizado, y sumar mantiene las proporciones entre
 * instrumentos tal como estaban en la mezcla.
 */
export function sumarPcm(pistas: Float32Array[]): Float32Array {
  const validas = pistas.filter((p) => p && p.length > 0);
  if (validas.length === 0) return new Float32Array(0);
  if (validas.length === 1) return validas[0];
  const largo = Math.max(...validas.map((p) => p.length));
  const suma = new Float32Array(largo);
  for (const p of validas) for (let i = 0; i < p.length; i++) suma[i] += p[i];
  return suma;
}
