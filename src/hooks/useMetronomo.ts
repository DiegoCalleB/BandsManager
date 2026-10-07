import { useCallback, useEffect, useRef, useState } from 'react';
import { programarClic } from '../utils/clicMetronomo';

export interface Metronomo {
  activo: boolean;
  bpm: number;
  /** Pulso del compás que acaba de sonar (0 = acento). */
  pulso: number;
  setBpm: (v: number) => void;
  alternar: () => void;
}

export const BPM_MIN = 40;
export const BPM_MAX = 280;

export function acotarBpm(v: number): number {
  return Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(v) || 120));
}

/** Metrónomo con el clic compartido del producto: el reloj de audio marca el pulso, el timer solo programa con adelanto. */
export function useMetronomo(bpmInicial = 120, pulsosPorCompas = 4): Metronomo {
  const [activo, setActivo] = useState(false);
  const [bpm, setBpmEstado] = useState(() => acotarBpm(bpmInicial));
  const [pulso, setPulso] = useState(0);
  const ctxRef = useRef<AudioContext | null>(null);

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
  return { activo, bpm, pulso, setBpm, alternar };
}
