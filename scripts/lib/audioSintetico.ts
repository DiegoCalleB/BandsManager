/**
 * Canciones sintéticas con la verdad conocida (tempo, compás, swing, con y sin batería): las usan los bancos
 * de pruebas de pulso y de BPM (`scripts/benchmark-pulso.ts`, `scripts/benchmark-bpm.ts`).
 */
import { SAMPLE_RATE_BEAT_THIS as SR } from "../../server/utils/beatThis/beatThis.js";

export interface Caso {
  nombre: string;
  bpm: [number, number]; // tempo al empezar y al acabar
  tiempos: 3 | 4;
  bateria: boolean;
  swing?: boolean;
  segundos?: number;
}

const PROGRESION = [[220, 277.2, 329.6], [146.8, 185, 220], [164.8, 207.7, 246.9], [185, 220, 277.2]]; // A D E F#m

/** Ruido determinista para que el banco dé siempre lo mismo. */
function aleatorio(semilla: number) {
  let s = semilla >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32) * 2 - 1;
}

export function sintetizar(caso: Caso) {
  const dur = caso.segundos ?? 60;
  const pcm = new Float32Array(dur * SR);
  const ruido = aleatorio(7);
  const pulsos: number[] = [];
  for (let t = 1.0, k = 0; t < dur - 0.5; k++) {
    pulsos.push(t);
    const bpm = caso.bpm[0] + (caso.bpm[1] - caso.bpm[0]) * (t / dur);
    t += 60 / bpm;
  }
  const compases = pulsos.filter((_, k) => k % caso.tiempos === 0);
  const golpe = (t0: number, largo: number, f: (i: number, x: number) => number) => {
    const a = Math.round(t0 * SR);
    for (let i = 0; i < largo * SR && a + i < pcm.length; i++) pcm[a + i] += f(i / SR, Math.exp(-(i / SR) / (largo / 4)));
  };
  pulsos.forEach((t, k) => {
    const enCompas = k % caso.tiempos;
    const T = (pulsos[k + 1] ?? t + 0.5) - t;
    if (caso.bateria) {
      if (enCompas === 0 || (caso.tiempos === 4 && enCompas === 2)) golpe(t, 0.25, (x, e) => 0.9 * e * Math.sin(2 * Math.PI * (55 + 60 * Math.exp(-x * 30)) * x));
      if (enCompas % 2 === 1 || (caso.tiempos === 3 && enCompas > 0)) golpe(t, 0.18, (_, e) => 0.45 * e * ruido());
      for (const o of [0, caso.swing ? 2 / 3 : 0.5]) {
        let prev = 0;
        golpe(t + o * T, 0.05, (_, e) => { const r = ruido(); const h = r - prev; prev = r; return 0.12 * e * h; });
      }
    } else {
      // Rasgueo: un ataque por tiempo, más fuerte en el 1.
      const acorde = PROGRESION[Math.floor(k / caso.tiempos) % PROGRESION.length];
      golpe(t, T * 0.95, (x, e) => (enCompas === 0 ? 0.35 : 0.2) * e * acorde.reduce((s, f) => s + Math.sin(2 * Math.PI * f * 2 * x) + 0.4 * Math.sin(2 * Math.PI * f * 4 * x), 0));
    }
  });
  // Bajo y colchón armónico: cambian al inicio de cada compás.
  compases.forEach((t, c) => {
    const acorde = PROGRESION[c % PROGRESION.length];
    const fin = compases[c + 1] ?? t + 2;
    const a = Math.round(t * SR);
    for (let i = 0; a + i < Math.min(pcm.length, Math.round(fin * SR)); i++) {
      const x = i / SR;
      const ataque = Math.min(1, x / 0.03);
      pcm[a + i] += 0.25 * ataque * Math.exp(-x * 1.5) * Math.sin(2 * Math.PI * (acorde[0] / 2) * x);
      pcm[a + i] += 0.05 * Math.min(1, x / 0.2) * acorde.reduce((s, f) => s + Math.sin(2 * Math.PI * f * x), 0);
    }
  });
  const segmentos = compases.map((t, c) => ({ t0: t, t1: compases[c + 1] ?? dur, acorde: ["A", "D", "E", "F#m"][c % 4], confianza: 1 }));
  return { pcm, pulsos, compases, segmentos, dur };
}

