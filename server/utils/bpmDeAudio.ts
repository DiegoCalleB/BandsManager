/**
 * BPM de una canción a partir de su audio: los pulsos de Beat This! y un ajuste fino (`bpmDesdePulsos`).
 * Devuelve null si la red no está disponible (BEAT_THIS=off, sin modelo…): quien llama conserva entonces el
 * detector por ataques, que es peor (acierta ~55 % frente a ~95 %) pero no necesita el modelo.
 */
import { extraerPcmMono } from "./audioKey.js";
import { detectarPulsoNeuronal, SAMPLE_RATE_BEAT_THIS } from "./beatThis/beatThis.js";
import { bpmDesdePulsos } from "./medirBpm.js";

export async function medirBpmPreciso(fuente: string, opciones: { timeoutMs?: number; maxDuracionSeg?: number } = {}): Promise<number | null> {
  const pcm = await extraerPcmMono(fuente, { ...opciones, sampleRate: SAMPLE_RATE_BEAT_THIS });
  if (!pcm) return null;
  const red = await detectarPulsoNeuronal(pcm);
  return red ? bpmDesdePulsos(red.pulsos) : null;
}
