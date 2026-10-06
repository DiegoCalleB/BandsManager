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

import { fft, ventanaHann, SAMPLE_RATE, extraerPcmMono } from "./audioKey.js";

const VENTANA = 4096; // ~372 ms a 11025 Hz
const HOP = 2048; // ~186 ms
const FREQ_MIN = 80;
const FREQ_MAX = 2200;
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
  /** Tonalidad conocida («Am», «C», «F#m»); favorece acordes diatónicos. */
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

/** Croma por frames, cada uno normalizado en L2. `null` en frames silenciosos. */
export function calcularCromaPorFrames(pcm: Float32Array, sampleRate: number): (number[] | null)[] {
  const frames: (number[] | null)[] = [];
  if (!pcm || pcm.length < VENTANA) return frames;
  const ventana = ventanaHann(VENTANA);
  const binHz = sampleRate / VENTANA;
  const binMin = Math.max(1, Math.floor(FREQ_MIN / binHz));
  const binMax = Math.min(VENTANA / 2 - 1, Math.ceil(FREQ_MAX / binHz));
  // Clase de altura de cada bin, calculada una vez.
  const claseDeBin = new Int8Array(VENTANA / 2);
  for (let b = binMin; b <= binMax; b++) {
    const midi = 69 + 12 * Math.log2((b * binHz) / 440);
    claseDeBin[b] = ((Math.round(midi) % 12) + 12) % 12;
  }

  const total = Math.floor((pcm.length - VENTANA) / HOP) + 1;
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
      frames.push(null);
      continue;
    }
    fft(re, im);
    const croma = new Array(12).fill(0);
    for (let b = binMin; b <= binMax; b++) {
      const mag = Math.sqrt(re[b] * re[b] + im[b] * im[b]);
      croma[claseDeBin[b]] += Math.log1p(mag * 20);
    }
    frames.push(normalizar(croma));
  }
  return frames;
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
  const diatonicos = opciones.tonalidad ? acordesDiatonicos(opciones.tonalidad) : new Set<string>();
  const plantillas = opciones.incluirSeptimas ? PLANTILLAS : PLANTILLAS.filter((p) => p.calidad !== "7");
  const nEst = plantillas.length;

  // Emisión: similitud con cada plantilla (+ pequeño bonus diatónico, - penalización a séptimas).
  const emision: number[][] = frames.map((fr) => {
    if (!fr) return new Array(nEst).fill(0);
    return plantillas.map((p) => {
      let s = similitud(fr, p.vector);
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
