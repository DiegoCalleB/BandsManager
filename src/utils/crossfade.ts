/**
 * Fundido cruzado real entre dos pistas de audio (fin de una canción + principio de la
 * siguiente) — usado tanto por la previsualización de "enganche" en el Mapa de Energía
 * (EnergyChart) como por la reproducción continua del Modo Escenario (useStagePlayer).
 *
 * Deliberadamente NO usa AudioContext/GainNode: decodeAudioData y los nodos de análisis
 * requieren CORS, que las URLs de Google Drive (la fuente de audio más común en este proyecto)
 * no dan — ver el fallback de WaveformTrack.tsx. Rampar `.volume` en dos <audio> planos sí
 * funciona sin CORS (solo la LECTURA de muestras está restringida, no la reproducción/volumen).
 */

export const CROSSFADE_SECONDS = 5;

/**
 * Ganancias de las dos pistas en un instante del fundido, con curva de potencia constante
 * (coseno/seno) para que el volumen percibido no caiga a mitad de camino, como pasaría con una
 * simple rampa lineal.
 */
export function computeCrossfadeGains(
  elapsedMs: number,
  fadeDurationMs: number
): { fromGain: number; toGain: number } {
  const t = fadeDurationMs > 0 ? Math.max(0, Math.min(1, elapsedMs / fadeDurationMs)) : 1;
  const angle = (t * Math.PI) / 2;
  return { fromGain: Math.cos(angle), toGain: Math.sin(angle) };
}

/** Segundo en el que hay que arrancar la reproducción de una canción para que sus últimos
 * `fadeSec` segundos coincidan con la ventana de fundido. */
export function getCrossfadeStartTime(durationSec: number, fadeSec: number = CROSSFADE_SECONDS): number {
  return Math.max(0, durationSec - fadeSec);
}

/** Si la canción es más corta que la ventana de fundido (p.ej. un clip de "palabras al
 * público" de pocos segundos), no hay hueco real para fundir — se salta y se usa un corte duro. */
export function shouldCrossfade(durationSec: number, fadeSec: number = CROSSFADE_SECONDS): boolean {
  return durationSec > fadeSec;
}
