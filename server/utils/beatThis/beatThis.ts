/**
 * Pulsos y compases del audio con Beat This! (Foscarin, Schlüter y Widmer, ISMIR 2024; código y pesos
 * MIT): una red neuronal que marca cada tiempo Y cada inicio de compás, siguiendo los cambios de tempo.
 * Es lo que le falta al detector clásico de `pulso.ts`, que supone tempo fijo y no sabe dónde cae el 1.
 *
 * Preprocesado, ventanas e interpretación de la salida son una adaptación de @jgorset/beat-this
 * (MIT), que reproduce los del original; el modelo es su exportación ONNX del checkpoint `final0`,
 * con los pesos sin tocar. Corre en CPU con onnxruntime-node. Si el modelo no se puede cargar,
 * devuelve null y quien llama sigue con el detector clásico.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { InferenceSession } from "onnxruntime-node";
import { fft } from "../audioKey.js";
import { FILTROS, VENTANA } from "./constantes.js";

export const SAMPLE_RATE_BEAT_THIS = 22050;
const HOP = 441; // 50 tramas por segundo
const FPS = SAMPLE_RATE_BEAT_THIS / HOP;
const N_FFT = 1024;
const BANDAS = 128;
const TRAMAS_VENTANA = 1500; // 30 s por pasada, como en el entrenamiento
const BORDE = 6;

const URL_MODELO = "https://github.com/jgorset/beat-this/releases/download/v1.0.0/beat-this.onnx";
const SHA256_MODELO = "5d8a94ce99fb33a6b26df6f6d8076decd52b8fd9439e3206d9b8bcdb1c2881bd";

export interface PulsoNeuronal {
  /** Instantes (s) de cada tiempo. */
  pulsos: number[];
  /** Instantes (s) de cada inicio de compás (siempre coinciden con un pulso). */
  compases: number[];
  /** Probabilidad (0-1) de pulso en cada trama de 20 ms. */
  probabilidad: Float32Array;
  /** Probabilidad (0-1) de inicio de compás en cada trama de 20 ms. */
  probabilidadCompas: Float32Array;
}

/** Tramas por segundo de las probabilidades. */
export const TRAMAS_POR_SEGUNDO = FPS;

/** Espectrograma log-mel de referencia (128 bandas, 50 tramas/s) de PCM mono a 22 050 Hz. */
export function espectrograma(pcm: Float32Array): Float32Array {
  const n = pcm.length;
  const tramas = Math.floor(n / HOP) + 1;
  const salida = new Float32Array(tramas * BANDAS);
  const re = new Float64Array(N_FFT);
  const im = new Float64Array(N_FFT);
  for (let f = 0; f < tramas; f++) {
    for (let i = 0; i < N_FFT; i++) {
      // Ventana centrada con reflexión en los extremos (como torch.stft con center=True).
      let k = f * HOP - N_FFT / 2 + i;
      if (k < 0) k = -k;
      if (k >= n) k = 2 * n - 2 - k;
      re[i] = (k >= 0 && k < n ? pcm[k] : 0) * VENTANA[i];
      im[i] = 0;
    }
    fft(re, im);
    for (let b = 0; b < BANDAS; b++) {
      let valor = 0;
      for (const [bin, peso] of FILTROS[b]) valor += Math.hypot(re[bin], im[bin]) * peso;
      salida[f * BANDAS + b] = Math.log1p((1000 * valor) / Math.sqrt(N_FFT));
    }
  }
  return salida;
}

/** Máximos locales positivos en ±3 tramas, fundiendo mesetas (el postproceso mínimo del original). */
export function picos(logits: Float32Array): number[] {
  const indices: number[] = [];
  for (let i = 0; i < logits.length; i++) {
    if (logits[i] <= 0) continue;
    let maximo = true;
    for (let j = Math.max(0, i - 3); j <= Math.min(logits.length - 1, i + 3); j++) if (logits[j] > logits[i]) maximo = false;
    if (maximo) indices.push(i);
  }
  const tiempos: number[] = [];
  for (let i = 0; i < indices.length; ) {
    let j = i + 1;
    let media = indices[i];
    while (j < indices.length && indices[j] - media <= 1) {
      media += (indices[j] - media) / (j - i + 1);
      j++;
    }
    tiempos.push(indices.slice(i, j).reduce((a, b) => a + b, 0) / (j - i) / FPS);
    i = j;
  }
  return tiempos;
}

/** Pulsos y compases a partir de las salidas de la red; cada compás se lleva a su pulso más cercano. */
export function postprocesar(beat: Float32Array, downbeat: Float32Array): { pulsos: number[]; compases: number[] } {
  const pulsos = picos(beat);
  if (!pulsos.length) return { pulsos, compases: [] };
  const compases = new Set<number>();
  for (const t of picos(downbeat)) {
    let mejor = pulsos[0];
    for (const p of pulsos) if (Math.abs(p - t) < Math.abs(mejor - t)) mejor = p;
    compases.add(mejor);
  }
  return { pulsos, compases: [...compases] };
}

/** Pasa la red por ventanas de 30 s solapadas `BORDE` tramas, quedándose con la primera predicción de cada trama. */
async function inferir(sesion: InferenceSession, ort: typeof import("onnxruntime-node"), espect: Float32Array, tramas: number) {
  const beat = new Float32Array(tramas).fill(-1000);
  const downbeat = new Float32Array(tramas).fill(-1000);
  const inicios: number[] = [];
  for (let s = -BORDE; s < tramas - BORDE; s += TRAMAS_VENTANA - 2 * BORDE) inicios.push(s);
  if (tramas > TRAMAS_VENTANA - 2 * BORDE) inicios[inicios.length - 1] = tramas - (TRAMAS_VENTANA - BORDE);
  let escritoHasta = 0;
  for (const inicio of inicios) {
    const primero = Math.max(0, inicio);
    const fin = Math.min(inicio + TRAMAS_VENTANA, tramas);
    const izquierda = Math.max(0, -inicio);
    const derecha = Math.max(0, Math.min(BORDE, inicio + TRAMAS_VENTANA - tramas));
    const largo = fin - primero + izquierda + derecha;
    const ventana = new Float32Array(largo * BANDAS);
    ventana.set(espect.subarray(primero * BANDAS, fin * BANDAS), izquierda * BANDAS);
    const resultado = await sesion.run({ spect: new ort.Tensor("float32", ventana, [1, largo, BANDAS]) });
    const b = resultado.beat.data as Float32Array;
    const d = resultado.downbeat.data as Float32Array;
    for (let i = Math.max(BORDE, escritoHasta - inicio); i < largo - BORDE; i++) {
      beat[inicio + i] = b[i];
      downbeat[inicio + i] = d[i];
    }
    escritoHasta = Math.max(escritoHasta, inicio + largo - BORDE);
  }
  return { beat, downbeat };
}

/** Ruta del modelo: la de `BEAT_THIS_MODELO` o la caché, descargándolo (y verificando su huella) la primera vez. */
async function rutaModelo(): Promise<string> {
  if (process.env.BEAT_THIS_MODELO) return process.env.BEAT_THIS_MODELO;
  const dir = process.env.BEAT_THIS_CACHE || path.join(os.tmpdir(), "bandsmanager-modelos");
  const ruta = path.join(dir, "beat-this-final0.onnx");
  if (existsSync(ruta)) return ruta;
  const respuesta = await fetch(URL_MODELO, { signal: AbortSignal.timeout(180_000) });
  if (!respuesta.ok) throw new Error(`descarga del modelo: HTTP ${respuesta.status}`);
  const datos = Buffer.from(await respuesta.arrayBuffer());
  const huella = createHash("sha256").update(datos).digest("hex");
  if (huella !== SHA256_MODELO) throw new Error(`el modelo descargado no es el esperado (sha256 ${huella.slice(0, 12)}…)`);
  mkdirSync(dir, { recursive: true });
  const temporal = `${ruta}.${process.pid}.tmp`;
  writeFileSync(temporal, datos);
  renameSync(temporal, ruta); // atómico: nunca queda un modelo a medias en la caché
  return ruta;
}

let sesionCargando: Promise<{ sesion: InferenceSession; ort: typeof import("onnxruntime-node") }> | null = null;

/** Una sola sesión por proceso; si falla al cargar se reintenta en la siguiente canción. */
function cargarSesion() {
  sesionCargando ??= (async () => {
    const ort = await import("onnxruntime-node");
    // Sin arena de memoria: con ella el proceso se queda con ~1,7 GB tras una canción de 5 min; sin
    // ella vuelve a ~360 MB (pico ~950 MB durante la inferencia) a cambio de ~50 % más de tiempo.
    const sesion = await ort.InferenceSession.create(await rutaModelo(), { graphOptimizationLevel: "all", enableCpuMemArena: false, enableMemPattern: false });
    return { sesion, ort };
  })().catch((err) => {
    sesionCargando = null;
    throw err;
  });
  return sesionCargando;
}

/**
 * Pulsos y compases de PCM mono a 22 050 Hz, o null si Beat This! no está disponible
 * (`BEAT_THIS=off`, sin red para bajar el modelo, binario nativo ausente…).
 */
export async function detectarPulsoNeuronal(pcm: Float32Array): Promise<PulsoNeuronal | null> {
  if (process.env.BEAT_THIS === "off" || pcm.length < SAMPLE_RATE_BEAT_THIS) return null;
  try {
    const { sesion, ort } = await cargarSesion();
    const tramas = Math.floor(pcm.length / HOP) + 1;
    const { beat, downbeat } = await inferir(sesion, ort, espectrograma(pcm), tramas);
    const duracion = pcm.length / SAMPLE_RATE_BEAT_THIS;
    const { pulsos, compases } = postprocesar(beat, downbeat);
    const sigmoide = (l: number) => 1 / (1 + Math.exp(-l));
    return {
      pulsos: pulsos.filter((t) => t < duracion),
      compases: compases.filter((t) => t < duracion),
      probabilidad: beat.map(sigmoide),
      probabilidadCompas: downbeat.map(sigmoide),
    };
  } catch (errCapturado) {
    console.error("[Pulso] Beat This! no disponible, sigo con el detector clásico:", String((errCapturado as Error)?.message || errCapturado).slice(0, 200));
    return null;
  }
}
