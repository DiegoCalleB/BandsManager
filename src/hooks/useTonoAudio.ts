import { useEffect, type RefObject } from 'react';
import { aplicarTono, tonoConectado } from './useTonePitchShift';

/**
 * Cambio de tono real (Tone.js) del `<audio>` principal del Atril. No conecta el elemento a Web
 * Audio mientras no haga falta: con 0 semitonos y sin cadena previa no hace nada.
 */
export function useTonoAudio(audioRef: RefObject<HTMLAudioElement | null>, audioUrl: string, semitonos: number): void {
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (semitonos !== 0 || tonoConectado(el)) void aplicarTono(el, semitonos);
  }, [audioRef, audioUrl, semitonos]);
}
