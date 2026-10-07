import { useCallback, useEffect, useRef, useState } from 'react';
import { programarClic } from '../utils/clicMetronomo';

export interface Metronomo {
  activo: boolean;
  bpm: number;
  /** Pulso del compás que acaba de sonar (0 = acento). */
  pulso: number;
  setBpm: (v: number) => void;
  alternar: () => void;
  /** Tap tempo: cada llamada es un toque; con 2 o más toques seguidos fija el tempo. */
  tocarTempo: () => void;
}

export const BPM_MIN = 40;
export const BPM_MAX = 280;

export function acotarBpm(v: number): number {
  return Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(v) || 120));
}

const TOQUES_MAX = 4;
const PAUSA_TAP_MS = 2000;

/** Tempo medio de los últimos toques (ms); `null` si hay menos de dos o queda fuera de rango. */
export function bpmDeToques(toques: number[]): number | null {
  if (toques.length < 2) return null;
  const media = (toques[toques.length - 1] - toques[0]) / (toques.length - 1);
  const bpm = Math.round(60000 / media);
  return bpm >= BPM_MIN && bpm <= BPM_MAX ? bpm : null;
}

/** Metrónomo con el clic compartido del producto: el reloj de audio marca el pulso, el timer solo programa con adelanto. */
export function useMetronomo(bpmInicial = 120, pulsosPorCompas = 4): Metronomo {
  const [activo, setActivo] = useState(false);
  const [bpm, setBpmEstado] = useState(() => acotarBpm(bpmInicial));
  const [pulso, setPulso] = useState(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const toquesRef = useRef<number[]>([]);

  // Si la canción cambia de tempo, el metrónomo la sigue.
  useEffect(() => { setBpmEstado(acotarBpm(bpmInicial)); }, [bpmInicial]);

  useEffect(() => {
    if (!activo) { setPulso(0); return; }
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    if (!ctxRef.current) ctxRef.current = new Ctx();
    const ctx = ctxRef.current;
    void ctx.resume?.();
    let proximo = ctx.currentTime + 0.05;
    let n = 0;
    const t = setInterval(() => {
      while (proximo < ctx.currentTime + 0.1) {
        programarClic(ctx, proximo, n % pulsosPorCompas === 0, 0.7);
        setPulso(n % pulsosPorCompas);
        proximo += 60 / bpm;
        n++;
      }
    }, 25);
    return () => clearInterval(t);
  }, [activo, bpm, pulsosPorCompas]);

  useEffect(() => () => { void ctxRef.current?.close?.(); ctxRef.current = null; }, []);

  const setBpm = useCallback((v: number) => setBpmEstado(acotarBpm(v)), []);
  const alternar = useCallback(() => setActivo((a) => !a), []);
  const tocarTempo = useCallback(() => {
    const ahora = performance.now();
    const toques = toquesRef.current;
    // Tras una pausa larga se empieza un tap nuevo, no se mezcla con toques viejos.
    if (toques.length && ahora - toques[toques.length - 1] > PAUSA_TAP_MS) toques.length = 0;
    toques.push(ahora);
    if (toques.length > TOQUES_MAX) toques.shift();
    const nuevo = bpmDeToques(toques);
    if (nuevo != null) setBpmEstado(nuevo);
  }, []);
  return { activo, bpm, pulso, setBpm, alternar, tocarTempo };
}
