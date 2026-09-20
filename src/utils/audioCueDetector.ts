import { Song } from' ../types';
import { resolveSongAudioUrl } from' ./transitionAudioEngine';
import { resolveAudioUrl } from' ./audioStorage';

export interface CueDetectionOptions {
 /** Umbral mínimo de energía RMS en decibelios relativos (por defecto -42 dB) */
 minSilenceDb?: number;
 /** Margen de seguridad previo en segundos para no entrar de golpe y captar la entrada musical/anacrusa (por defecto 1.5s) */
 preRollSec?: number;
 /** Margen de seguridad posterior en segundos para permitir el decaimiento natural del acorde final (por defecto 0.5s) */
 postRollSec?: number;
 /** Duración mínima requerida de música sostenida para validar un inicio real (por defecto 0.25s) */
 minSustainDurationSec?: number;
}

export interface AudioCueAnalysis {
 /** Segundo exacto donde comienza la música real (se salta silencio/aplausos de inicio) */
 cueIn: number;
 /** Segundo exacto donde termina la música real (antes de aplausos/silencio final) */
 cueOut: number;
 /** Duración total del archivo en segundos */
 duration: number;
 /** Duración útil de la canción una vez recortados los huecos */
 trimmedDuration: number;
 /** Segundos de silencio/ruido recortados al inicio */
 introSilenceSec: number;
 /** Segundos de silencio/aplausos recortados al final */
 outroSilenceSec: number;
 /** True si se detectó ruido de aplausos o charla de sala al inicio */
 hasApplauseIntro: boolean;
 /** True si se detectó ovación/aplausos del público al final */
 hasApplauseOutro: boolean;
 /** Nivel de confianza del análisis (0.0 a 1.0) */
 confidence: number;
 /** Picos normalizados de la onda de audio (0 a 1) para renderizado rápido en la UI */
 waveformPeaks: number[];
}

/** Caché en memoria para evitar reanalizar buffers ya procesados */
const audioCueCache = new Map<string, AudioCueAnalysis>();

/**
 * Analiza un array de muestras de audio (Float32Array) y calcula los puntos CUE óptimos
 */
export function detectAudioCuesFromFloatChannel(
 channelData: Float32Array,
 sampleRate: number,
 totalDuration: number,
 options: CueDetectionOptions = {}
): AudioCueAnalysis {
 const {
 minSilenceDb = -42,
 preRollSec = 1.5,
 postRollSec = 0.5,
 minSustainDurationSec = 0.25
 } = options;

 const numSamples = channelData.length;
 if (numSamples === 0 || totalDuration <= 0) {
 return {
 cueIn: 0,
 cueOut: 0,
 duration: 0,
 trimmedDuration: 0,
 introSilenceSec: 0,
 outroSilenceSec: 0,
 hasApplauseIntro: false,
 hasApplauseOutro: false,
 confidence: 0,
 waveformPeaks: []
 };
 }

 // Configuración de análisis en ventanas
 const frameSize = Math.max(256, Math.floor(sampleRate * 0.025)); // ~25ms por ventana
 const hopSize = Math.max(128, Math.floor(sampleRate * 0.0125)); // ~12.5ms de salto
 const totalFrames = Math.floor((numSamples - frameSize) / hopSize);

 if (totalFrames <= 0) {
 return {
 cueIn: 0,
 cueOut: totalDuration,
 duration: totalDuration,
 trimmedDuration: totalDuration,
 introSilenceSec: 0,
 outroSilenceSec: 0,
 hasApplauseIntro: false,
 hasApplauseOutro: false,
 confidence: 0.5,
 waveformPeaks: [1]
 };
 }

 // Extraer envolvente RMS, ZCR (Zero Crossing Rate) y picos por ventana
 const frameRms = new Float32Array(totalFrames);
 const frameZcr = new Float32Array(totalFrames);
 const frameTimeSec = new Float32Array(totalFrames);

 let globalMaxRms = 0;
 let globalSumRms = 0;

 for (let f = 0; f < totalFrames; f++) {
 const offset = f * hopSize;
 let sumSquares = 0;
 let zeroCrossings = 0;
 let prevVal = channelData[offset];

 for (let i = 0; i < frameSize; i++) {
 const val = channelData[offset + i];
 sumSquares += val * val;
 if ((val >= 0 && prevVal < 0) || (val < 0 && prevVal >= 0)) {
 zeroCrossings++;
 }
 prevVal = val;
 }

 const rms = Math.sqrt(sumSquares / frameSize);
 frameRms[f] = rms;
 frameZcr[f] = zeroCrossings / frameSize;
 frameTimeSec[f] = (offset + frameSize / 2) / sampleRate;

 if (rms > globalMaxRms) globalMaxRms = rms;
 globalSumRms += rms;
 }

 // Calcular suelo de ruido de fondo (percentil 10 de energía)
 const sortedRms = Array.from(frameRms).sort((a, b) => a - b);
 const noiseFloor = sortedRms[Math.floor(sortedRms.length * 0.1)] || 0.0001;
 const avgRms = globalSumRms / totalFrames;

 // Umbral dinámico para considerar sonido musical
 const minLinearFromDb = Math.pow(10, minSilenceDb / 20);
 const dynamicMusicThreshold = Math.max(minLinearFromDb, noiseFloor * 3.5, globalMaxRms * 0.03);

 const minSustainFrames = Math.max(3, Math.floor((minSustainDurationSec * sampleRate) / hopSize));

 // --- 1. DETECCIÓN DE CUE IN (INICIO DE LA MÚSICA) ---
 let cueInFrame = 0;
 let hasApplauseIntro = false;

 // Revisar los primeros 60s o el primer 40% del tema
 const maxIntroSec = Math.min(60, totalDuration * 0.4);
 const maxIntroFrame = Math.min(totalFrames - 1, Math.floor((maxIntroSec * sampleRate) / hopSize));

 for (let f = 0; f < maxIntroFrame; f++) {
 const rms = frameRms[f];
 const zcr = frameZcr[f];

 // Detectar si hay aplausos iniciales (ZCR alto + energía difusa pero sin ataque musical)
 if (f < maxIntroFrame - minSustainFrames) {
 const isNoiseOrApplause = zcr > 0.22 && rms >= minLinearFromDb * 0.5 && rms < globalMaxRms * 0.7;
 if (isNoiseOrApplause) {
 hasApplauseIntro = true;
 }
 }

 // Comprobar si hay un ataque musical sostenido
 if (rms >= dynamicMusicThreshold) {
 let isSustained = true;
 for (let s = 1; s < minSustainFrames; s++) {
 if (f + s >= totalFrames || frameRms[f + s] < dynamicMusicThreshold * 0.6) {
 isSustained = false;
 break;
 }
 }

 if (isSustained) {
 cueInFrame = f;
 break;
 }
 }
 }

 const rawCueInSec = frameTimeSec[cueInFrame] || 0;
 const cueIn = Math.max(0, Math.round((rawCueInSec - preRollSec) * 100) / 100);

 // --- 2. DETECCIÓN DE CUE OUT (FINAL DE LA MÚSICA) ---
 let cueOutFrame = totalFrames - 1;
 let hasApplauseOutro = false;

 // Revisar desde el final hacia atrás hasta los últimos 60s o 40% del tema
 const minOutroSec = Math.max(0, totalDuration - Math.min(75, totalDuration * 0.45));
 const minOutroFrame = Math.max(0, Math.floor((minOutroSec * sampleRate) / hopSize));

 for (let f = totalFrames - 1; f >= minOutroFrame; f--) {
 const rms = frameRms[f];
 const zcr = frameZcr[f];

 // Detectar aplausos al final (ZCR alto y energía sostenida difusa después de que cese el acorde)
 if (zcr > 0.22 && rms >= minLinearFromDb * 0.5 && rms < globalMaxRms * 0.7) {
 hasApplauseOutro = true;
 }

 // Comprobar si encontramos el decaimiento de la música antes del silencio o aplauso
 if (rms >= dynamicMusicThreshold) {
 let isSustained = true;
 for (let s = 1; s < minSustainFrames; s++) {
 if (f - s < 0 || frameRms[f - s] < dynamicMusicThreshold * 0.6) {
 isSustained = false;
 break;
 }
 }

 if (isSustained) {
 cueOutFrame = f;
 break;
 }
 }
 }

 const rawCueOutSec = frameTimeSec[cueOutFrame] || totalDuration;
 const cueOut = Math.min(totalDuration, Math.round((rawCueOutSec + postRollSec) * 100) / 100);

 // --- 3. EXTRACCIÓN DE PICOS NORMALIZADOS PARA FORMA DE ONDA ---
 const numPeaks = 90;
 const waveformPeaks: number[] = [];
 const samplesPerPeak = Math.floor(numSamples / numPeaks);

 for (let p = 0; p < numPeaks; p++) {
 const startIdx = p * samplesPerPeak;
 const endIdx = Math.min(numSamples, startIdx + samplesPerPeak);
 let peak = 0;
 for (let i = startIdx; i < endIdx; i += 8) {
 const absVal = Math.abs(channelData[i]);
 if (absVal > peak) peak = absVal;
 }
 waveformPeaks.push(Math.min(1, Math.round(peak * 100) / 100));
 }

 const introSilenceSec = Math.max(0, Math.round(cueIn * 10) / 10);
 const outroSilenceSec = Math.max(0, Math.round((totalDuration - cueOut) * 10) / 10);
 const trimmedDuration = Math.max(1, Math.round((cueOut - cueIn) * 10) / 10);

 // Cálculo de confianza del algoritmo
 let confidence = 0.92;
 if (cueIn === 0 && cueOut === totalDuration) {
 confidence = 0.8;
 }
 if (trimmedDuration < totalDuration * 0.3) {
 // Si el recorte es excesivamente agresivo, reducir confianza
 confidence = 0.65;
 }

 return {
 cueIn,
 cueOut,
 duration: Math.round(totalDuration * 100) / 100,
 trimmedDuration,
 introSilenceSec,
 outroSilenceSec,
 hasApplauseIntro,
 hasApplauseOutro,
 confidence,
 waveformPeaks
 };
}

/**
 * Analiza un AudioBuffer de la Web Audio API
 */
export function detectAudioCuesFromBuffer(
 audioBuffer: AudioBuffer,
 options?: CueDetectionOptions
): AudioCueAnalysis {
 const channelData = audioBuffer.getChannelData(0);
 const sampleRate = audioBuffer.sampleRate;
 const duration = audioBuffer.duration;

 return detectAudioCuesFromFloatChannel(channelData, sampleRate, duration, options);
}

/**
 * Carga y analiza una URL de audio (MP3, WAV, Blob, IndexedDB, etc.)
 */
export async function detectAudioCuesFromUrl(
 audioUrl: string,
 audioCtx?: AudioContext | null,
 options?: CueDetectionOptions
): Promise<AudioCueAnalysis> {
 if (!audioUrl) {
 throw new Error('URL de audio no válida para detección de CUE');
 }

 // Revisar si ya está en caché
 if (audioCueCache.has(audioUrl)) {
 return audioCueCache.get(audioUrl)!;
 }

 // Resolver URLs de IndexedDB / Google Drive / Cloud si aplica
 const resolved = await resolveAudioUrl(audioUrl);
 if (!resolved) {
 throw new Error(`No se pudo resolver la URL de audio: ${audioUrl}`);
 }

 // Descargar buffer de audio
 const response = await fetch(resolved);
 if (!response.ok) {
 throw new Error(`Fallo HTTP al descargar audio (${response.status}): ${resolved}`);
 }

 const arrayBuffer = await response.arrayBuffer();

 // Decodificar con AudioContext
 const ctx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
 const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

 const analysis = detectAudioCuesFromBuffer(audioBuffer, options);

 // Guardar en caché
 audioCueCache.set(audioUrl, analysis);
 if (resolved !== audioUrl) {
 audioCueCache.set(resolved, analysis);
 }

 return analysis;
}

/**
 * Detecta y retorna los puntos de corte inteligente CUE para una canción
 */
export async function detectAudioCuesForSong(
 song: Song,
 audioCtx?: AudioContext | null,
 options?: CueDetectionOptions
): Promise<AudioCueAnalysis | null> {
 const rawUrl = resolveSongAudioUrl(song);
 if (!rawUrl) return null;

 try {
 const analysis = await detectAudioCuesFromUrl(rawUrl, audioCtx, options);
 return analysis;
 } catch (err) {
 console.warn(`[Auto-CUE] Error analizando canción "${song.titulo}":`, err);
 return null;
 }
}

/**
 * Aplica los puntos CUE detectados al objeto Song
 */
export function applyDetectedCuesToSong(song: Song, analysis: AudioCueAnalysis): Song {
 return {
 ...song,
 cueIn: analysis.cueIn,
 cueOut: analysis.cueOut,
 trimSilenceDetectedAt: new Date().toISOString(),
 applauseDetected: {
 intro: analysis.hasApplauseIntro,
 outro: analysis.hasApplauseOutro,
 introDurationSec: analysis.introSilenceSec,
 outroDurationSec: analysis.outroSilenceSec
 }
 };
}

/**
 * Detección de CUE específica para temas extraídos de un concierto en directo.
 * Utiliza un pre-roll ajustado a 350ms para captar el ataque y conteo de baquetas o anacrusa,
 * sin arrastrar el speech o aplausos previos.
 */
export function detectLiveConcertTrackCues(
 channelData: Float32Array,
 sampleRate: number,
 totalDuration: number,
 options?: CueDetectionOptions
): AudioCueAnalysis {
 return detectAudioCuesFromFloatChannel(channelData, sampleRate, totalDuration, {
 minSilenceDb: -38,
 preRollSec: 0.35,
 postRollSec: 0.5,
 minSustainDurationSec: 0.2,
 ...options
 });
}

/**
 * Formatea un offset CUE en segundos a formato legible "+0:03.5s" o "0:00"
 */
export function formatCueOffset(seconds: number): string {
 if (typeof seconds !==' number' || isNaN(seconds) || seconds <= 0) return' 0:00.0';
 const mins = Math.floor(seconds / 60);
 const secs = (seconds % 60).toFixed(1);
 const padSecs = parseFloat(secs) < 10 ? `0${secs}` : secs;
 return `${mins}:${padSecs}`;
}

