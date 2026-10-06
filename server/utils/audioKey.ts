// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

/**
 * Detección de tonalidad (tono/clave musical) desde audio.
 *
 * A diferencia de la energía/BPM (que solo necesitan el volumen, algo que ffmpeg mide gratis
 * con `astats`), la tonalidad exige saber QUÉ notas suenan — hace falta un análisis espectral
 * real. El método es el clásico de la literatura (Krumhansl-Schmuckler): se extrae un vector de
 * "croma" (cuánta energía hay en cada una de las 12 notas de la escala, sumando todas las
 * octavas) y se compara por correlación contra los 24 perfiles tonales publicados (12 mayores +
 * 12 menores).
 *
 * Limitación conocida e inevitable de este método (no es un bug, es el propio algoritmo): las
 * tonalidades relativas (p.ej. Do Mayor / La menor) comparten exactamente las mismas notas, así
 * que el croma por sí solo no siempre las distingue. Por eso `detectarTonalidadDesdeCroma`
 * exige una correlación mínima antes de devolver nada, y por eso el llamador debería preferir
 * analizar una pista de bajo/armonía ya separada por Iris en vez de la mezcla completa: menos
 * ruido de voz/batería de por medio, mejor croma.
 */

import { spawn } from "child_process";
import ffmpegStatic from "ffmpeg-static";
import { resolverFuenteAudioLocal } from "./audioEnergy.js";

const SAMPLE_RATE = 11025;
const VENTANA = 8192; // ~743ms a 11025Hz → resolución de ~1.35Hz, suficiente para separar semitonos incluso en graves
const FREQ_MIN = 60;   // por debajo: rumble/subsónico, sin información tonal
const FREQ_MAX = 5000; // por encima: armónicos altos que aportan más ruido que pista tonal
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Perfiles tonales de Krumhansl-Kessler (empezando en Do), los valores publicados originales.
const PERFIL_MAYOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const PERFIL_MENOR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

export interface TonalidadDetectada {
  /** p.ej. "Am", "C", "F#m" */
  tonalidad: string;
  /** Correlación (0-1) del mejor candidato contra el croma observado. */
  confianza: number;
  /** Diferencia de correlación con el segundo mejor candidato. Bajo = ambigüedad tónica/relativa. */
  margen: number;
}

/**
 * Ejecuta ffmpeg y devuelve su stdout como Buffer binario intacto.
 *
 * No se reutiliza `ejecutar` de youtubeSource.ts a propósito: ese helper decodifica stdout como
 * texto UTF-8 (vale para logs de ffmpeg, pero el PCM crudo que necesitamos aquí no es UTF-8
 * válido — decodificarlo lo destruiría, cada byte "inválido" se convierte en el carácter de
 * reemplazo U+FFFD y los datos de audio quedan irrecuperables).
 */
function ejecutarBinario(binario: string, args: string[], opciones: { timeoutMs?: number } = {}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proc = spawn(binario, args);
    const chunks: Buffer[] = [];
    let stderr = "";
    let liquidado = false;
    const timer = opciones.timeoutMs
      ? setTimeout(() => {
          liquidado = true;
          proc.kill("SIGKILL");
          reject(new Error(`ffmpeg no respondió en ${opciones.timeoutMs}ms`));
        }, opciones.timeoutMs)
      : null;

    proc.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8").slice(0, 2000);
    });
    proc.on("error", (err) => {
      if (timer) clearTimeout(timer);
      if (!liquidado) reject(err);
    });
    proc.on("close", (code) => {
      if (timer) clearTimeout(timer);
      if (liquidado) return;
      if (code !== 0 && chunks.length === 0) {
        reject(new Error(`ffmpeg salió con código ${code}: ${stderr.slice(0, 300)}`));
        return;
      }
      resolve(Buffer.concat(chunks));
    });
  });
}

/**
 * Extrae el audio como PCM mono en crudo (float32 little-endian) para poder hacerle FFT.
 *
 * Se trunca a `maxDuracionSeg` (por defecto 6 minutos, de sobra para cualquier tema de banda):
 * no es solo un límite de tiempo de cómputo, también acota cuánto hay que descargar/decodificar
 * de audio remoto largo (una grabación de concierto entero podría ser de 40 minutos).
 */
export async function extraerPcmMono(
  fuente: string,
  opciones: { timeoutMs?: number; maxDuracionSeg?: number } = {}
): Promise<Float32Array | null> {
  const binario = ffmpegStatic as unknown as string;
  if (!binario || !fuente) return null;

  const resuelto = await resolverFuenteAudioLocal(fuente);
  if (!resuelto) return null;
  const { ruta: rutaLocal, limpiar } = resuelto;

  const args: string[] = ["-hide_banner", "-nostdin", "-t", String(Math.floor(opciones.maxDuracionSeg ?? 360))];
  args.push("-i", rutaLocal, "-vn", "-ac", "1", "-ar", String(SAMPLE_RATE), "-f", "f32le", "pipe:1");

  try {
    const buffer = await ejecutarBinario(binario, args, { timeoutMs: opciones.timeoutMs ?? 120_000 });
    if (!buffer || buffer.length < VENTANA * 4) return null;
    // .slice() en vez de leer buffer.buffer directamente: un Buffer puede vivir sobre un
    // ArrayBuffer compartido/más grande (pool interno de Node) con un byteOffset != 0 — leerlo
    // sin ajustar el offset desalinearía todas las muestras. slice() siempre copia con el
    // recorte correcto, sin depender de cómo Node haya reservado memoria por debajo.
    const bytesUtiles = Math.floor(buffer.length / 4) * 4;
    const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + bytesUtiles);
    return new Float32Array(ab);
  } catch (err: any) {
    console.error("[Audio] No se pudo extraer PCM para detectar tonalidad:", String(err?.message || err).substring(0, 200));
    return null;
  } finally {
    limpiar();
  }
}

/** FFT iterativa radix-2 de Cooley-Tukey, in-place. `re`/`im` deben tener longitud potencia de 2. */
function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i]; re[i] = re[j]; re[j] = tr;
      const ti = im[i]; im[i] = im[j]; im[j] = ti;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const mitad = len / 2;
    const ang = (-2 * Math.PI) / len;
    const wRe = Math.cos(ang), wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1, curIm = 0;
      for (let k = 0; k < mitad; k++) {
        const uRe = re[i + k], uIm = im[i + k];
        const vRe = re[i + k + mitad] * curRe - im[i + k + mitad] * curIm;
        const vIm = re[i + k + mitad] * curIm + im[i + k + mitad] * curRe;
        re[i + k] = uRe + vRe;
        im[i + k] = uIm + vIm;
        re[i + k + mitad] = uRe - vRe;
        im[i + k + mitad] = uIm - vIm;
        const nextRe = curRe * wRe - curIm * wIm;
        const nextIm = curRe * wIm + curIm * wRe;
        curRe = nextRe; curIm = nextIm;
      }
    }
  }
}

function ventanaHann(n: number): Float64Array {
  const w = new Float64Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
  return w;
}

/** MIDI = 69 + 12*log2(f/440); Do central (C4) = MIDI 60, y 60 % 12 = 0 → clase 0 = Do. */
function frecuenciaAClaseDeAltura(freq: number): number {
  const midi = 69 + 12 * Math.log2(freq / 440);
  const clase = Math.round(midi) % 12;
  return clase < 0 ? clase + 12 : clase;
}

/**
 * Acumula un vector de croma (12 clases de altura, normalizado a que sume 1) a partir del PCM,
 * con FFT por ventanas sin solape.
 *
 * Los últimos frames del tema pesan el doble: el acorde con el que termina una canción casi
 * siempre es la tónica, la pista más fiable de la tonalidad real que tenemos sin transcribir
 * armonía completa — y es gratis, ya estamos recorriendo el audio de todas formas.
 */
export function calcularCromaDesdePcm(pcm: Float32Array, sampleRate: number): number[] | null {
  if (!pcm || pcm.length < VENTANA) return null;

  const ventana = ventanaHann(VENTANA);
  const binHz = sampleRate / VENTANA;
  const binMin = Math.max(1, Math.floor(FREQ_MIN / binHz));
  const binMax = Math.min(VENTANA / 2 - 1, Math.ceil(FREQ_MAX / binHz));

  const totalFrames = Math.floor((pcm.length - VENTANA) / VENTANA) + 1;
  if (totalFrames < 1) return null;
  const frameInicioPeso = Math.floor(totalFrames * 0.85);

  const croma = new Float64Array(12);
  let framesConEnergia = 0;

  for (let f = 0; f < totalFrames; f++) {
    const inicio = f * VENTANA;
    const re = new Float64Array(VENTANA);
    const im = new Float64Array(VENTANA);
    let energiaFrame = 0;
    for (let i = 0; i < VENTANA; i++) {
      const muestra = pcm[inicio + i] * ventana[i];
      re[i] = muestra;
      energiaFrame += muestra * muestra;
    }
    if (energiaFrame / VENTANA < 1e-8) continue; // silencio: solo aportaría ruido al vector
    framesConEnergia++;

    fft(re, im);

    const peso = f >= frameInicioPeso ? 2 : 1;
    for (let bin = binMin; bin <= binMax; bin++) {
      const mag = Math.sqrt(re[bin] * re[bin] + im[bin] * im[bin]);
      if (mag < 1e-6) continue;
      const clase = frecuenciaAClaseDeAltura(bin * binHz);
      croma[clase] += mag * peso;
    }
  }

  if (framesConEnergia < 4) return null; // demasiado poco audio real para fiarse

  const total = croma.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;
  return Array.from(croma, (v) => v / total);
}

function correlacion(a: number[], b: number[]): number {
  const n = a.length;
  const mediaA = a.reduce((x, y) => x + y, 0) / n;
  const mediaB = b.reduce((x, y) => x + y, 0) / n;
  let num = 0, denA = 0, denB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - mediaA, db = b[i] - mediaB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  const den = Math.sqrt(denA * denB);
  return den === 0 ? 0 : num / den;
}

/** Alinea un perfil tonal (publicado empezando en Do) con la tónica `raiz` pasos por encima de Do. */
function rotar(perfil: number[], raiz: number): number[] {
  const n = perfil.length;
  return Array.from({ length: n }, (_, i) => perfil[(i - raiz + n) % n]);
}

/**
 * Compara el croma contra los 24 perfiles tonales (12 mayores + 12 menores) y devuelve el que
 * mejor correlaciona.
 *
 * Umbral de confianza 0.55: no es cautela de más — por debajo de eso, el propio método clásico
 * de Krumhansl-Schmuckler no distingue tonalidades relativas (Do Mayor / La menor comparten
 * notas) mejor que una moneda al aire, así que devolver un resultado igualmente sería mentir
 * con decimales de precisión.
 */
export function detectarTonalidadDesdeCroma(croma: number[]): TonalidadDetectada | null {
  if (!croma || croma.length !== 12) return null;

  const candidatos: { nombre: string; corr: number }[] = [];
  for (let raiz = 0; raiz < 12; raiz++) {
    candidatos.push({ nombre: NOTE_NAMES[raiz], corr: correlacion(croma, rotar(PERFIL_MAYOR, raiz)) });
    candidatos.push({ nombre: `${NOTE_NAMES[raiz]}m`, corr: correlacion(croma, rotar(PERFIL_MENOR, raiz)) });
  }
  candidatos.sort((a, b) => b.corr - a.corr);
  const mejor = candidatos[0];
  const segundo = candidatos[1];
  if (!mejor || mejor.corr < 0.55) return null;

  return {
    tonalidad: mejor.nombre,
    confianza: Math.max(0, Math.min(1, mejor.corr)),
    margen: mejor.corr - segundo.corr
  };
}

/**
 * Detecta la tonalidad de un audio de principio a fin: extrae PCM, calcula el croma y correlaciona.
 * Nunca lanza — si algo falla o el resultado es demasiado ambiguo, devuelve `null` en vez de una
 * tonalidad inventada (igual que `detectarBpmDesdeOnsets` más abajo).
 */
export async function detectarTonalidadDesdeAudio(
  fuente: string,
  opciones: { timeoutMs?: number; maxDuracionSeg?: number } = {}
): Promise<TonalidadDetectada | null> {
  const pcm = await extraerPcmMono(fuente, opciones);
  if (!pcm) return null;
  const croma = calcularCromaDesdePcm(pcm, SAMPLE_RATE);
  if (!croma) return null;
  return detectarTonalidadDesdeCroma(croma);
}

// Ventana/salto del detector de onsets: 1024 muestras (~93ms) de contexto espectral, pero con
// un salto de solo 256 (~23ms) entre frames — la resolución temporal real del detector es el
// SALTO, no la ventana. El primer detector de BPM de esta app (detectarBpmDesdeAudio en
// audioEnergy.ts) medía onsets sobre la curva de energía de ffmpeg astats, que solo da un punto
// cada 100ms: cualquier intervalo entre golpes quedaba forzosamente redondeado a un múltiplo de
// 0.1s antes de llegar siquiera al histograma, así que sobre audio real (no un pulso sintético
// perfecto) el resultado colapsaba en un puñado de valores "cuantizados" (100/118/154 BPM en 23
// canciones bien distintas, detectado en producción) en vez de reflejar el tempo real de cada
// tema. Con 23ms de resolución el intervalo entre golpes ya no está pegado a esa rejilla.
const ONSET_VENTANA = 1024;
const ONSET_HOP = 256;

/**
 * Detecta instantes de onset (ataques de nota/golpe de batería) por flujo espectral: la suma de
 * subidas de magnitud entre espectros de frames consecutivos — el detector de onsets clásico de
 * la literatura (Bello et al.), mucho más sensible que mirar solo el volumen total porque ve
 * ataques que no necesariamente suben el volumen agregado (un platillo entrando sobre un acorde
 * sostenido, por ejemplo).
 */
export function detectarOnsetsDesdePcm(pcm: Float32Array, sampleRate: number): number[] {
  if (!pcm || pcm.length < ONSET_VENTANA) return [];

  const ventana = ventanaHann(ONSET_VENTANA);
  const totalFrames = Math.floor((pcm.length - ONSET_VENTANA) / ONSET_HOP) + 1;
  if (totalFrames < 8) return [];

  const espectros: Float64Array[] = new Array(totalFrames);
  for (let f = 0; f < totalFrames; f++) {
    const inicio = f * ONSET_HOP;
    const re = new Float64Array(ONSET_VENTANA);
    const im = new Float64Array(ONSET_VENTANA);
    for (let i = 0; i < ONSET_VENTANA; i++) re[i] = pcm[inicio + i] * ventana[i];
    fft(re, im);
    const mag = new Float64Array(ONSET_VENTANA / 2);
    for (let bin = 0; bin < mag.length; bin++) mag[bin] = Math.sqrt(re[bin] * re[bin] + im[bin] * im[bin]);
    espectros[f] = mag;
  }

  const flujo = new Float64Array(totalFrames);
  for (let f = 1; f < totalFrames; f++) {
    const prev = espectros[f - 1], cur = espectros[f];
    let suma = 0;
    for (let bin = 0; bin < cur.length; bin++) {
      const diff = cur[bin] - prev[bin];
      if (diff > 0) suma += diff; // solo subidas: es lo que marca un ataque, no una caída de energía
    }
    flujo[f] = suma;
  }

  const media = flujo.reduce((a, b) => a + b, 0) / flujo.length;
  const varianza = flujo.reduce((a, b) => a + (b - media) ** 2, 0) / flujo.length;
  const umbral = media + Math.sqrt(varianza) * 0.5;
  if (umbral <= 0) return [];

  const hopSeg = ONSET_HOP / sampleRate;
  const SEPARACION_MINIMA = 0.1; // 100ms de separación mínima entre onsets → tope ~600bpm, de sobra
  const onsets: number[] = [];
  let ultimo = -Infinity;
  for (let f = 1; f < flujo.length - 1; f++) {
    const esPicoLocal = flujo[f] >= flujo[f - 1] && flujo[f] >= flujo[f + 1];
    const t = f * hopSeg;
    if (esPicoLocal && flujo[f] > umbral && t - ultimo >= SEPARACION_MINIMA) {
      onsets.push(t);
      ultimo = t;
    }
  }
  return onsets;
}

/**
 * Convierte una lista de onsets (segundos) en un BPM: intervalos entre onsets consecutivos →
 * moda del histograma (el pulso real se repite más que cualquier síncopa aislada) → corrección
 * de octava al rango típico de un cover de rock (70-180 BPM, dobla/parte por 2 si hace falta).
 * Misma lógica que la versión anterior sobre la curva de energía, pero aquí los onsets tienen
 * precisión real de ~23ms en vez de estar pegados a una rejilla de 100ms.
 */
export function detectarBpmDesdeOnsets(onsets: number[]): number | null {
  if (!onsets || onsets.length < 6) return null;

  const iois: number[] = [];
  for (let i = 1; i < onsets.length; i++) {
    const ioi = onsets[i] - onsets[i - 1];
    if (ioi >= 0.25 && ioi <= 1.5) iois.push(ioi); // 40-240 BPM
  }
  if (iois.length < 4) return null;

  const BIN = 0.015; // bins de 15ms — la mitad de finos que antes, ahora que los onsets ya no
                      // están cuantizados a 100ms no hace falta un bin tan ancho para agrupar
  const contador = new Map<number, number>();
  for (const ioi of iois) {
    const bin = Math.round(ioi / BIN);
    contador.set(bin, (contador.get(bin) || 0) + 1);
  }
  let mejorBin = 0, mejorCount = 0;
  for (const [bin, count] of contador) {
    if (count > mejorCount) { mejorCount = count; mejorBin = bin; }
  }
  if (mejorBin <= 0) return null;

  let bpm = 60 / (mejorBin * BIN);
  while (bpm < 70) bpm *= 2;
  while (bpm > 180) bpm /= 2;
  bpm = Math.round(bpm);
  if (bpm < 40 || bpm > 220) return null;
  return bpm;
}

/**
 * Analiza BPM, tonalidad y densidad rítmica en una sola pasada: una única extracción de PCM (la
 * parte cara — descargar y decodificar el audio) alimenta el detector de onsets/BPM, el croma/
 * tonalidad Y la densidad de onsets, en vez de descargar el mismo audio varias veces para
 * análisis independientes.
 *
 * `onsetDensity` (onsets por segundo) es gratis aquí: son los mismos onsets que ya calcula el
 * detector de BPM, solo divididos por la duración analizada. Alimenta `calcularEnergiaMultifactor`
 * en audioEnergy.ts como tercera señal de energía, independiente del volumen de la mezcla — un
 * tema con muchos ataques por segundo (batería/percusión densa) suena más "cañero" aunque esté
 * grabado o masterizado más flojo que otro más espaciado.
 */
export async function analizarAudioConIris(
  fuente: string,
  opciones: { timeoutMs?: number; maxDuracionSeg?: number } = {}
): Promise<{ bpm: number | null; tonalidad: TonalidadDetectada | null; onsetDensity: number | null }> {
  const pcm = await extraerPcmMono(fuente, opciones);
  if (!pcm) return { bpm: null, tonalidad: null, onsetDensity: null };

  const onsets = detectarOnsetsDesdePcm(pcm, SAMPLE_RATE);
  const bpm = detectarBpmDesdeOnsets(onsets);

  const duracionSeg = pcm.length / SAMPLE_RATE;
  const onsetDensity = duracionSeg > 1 && onsets.length >= 2 ? onsets.length / duracionSeg : null;

  const croma = calcularCromaDesdePcm(pcm, SAMPLE_RATE);
  const tonalidad = croma ? detectarTonalidadDesdeCroma(croma) : null;

  return { bpm, tonalidad, onsetDensity };
}
