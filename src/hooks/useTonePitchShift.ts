// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { useEffect, useRef } from 'react';
import * as Tone from 'tone';

interface UseTonePitchShiftProps {
  audioElement: HTMLAudioElement | null;
  semitones: number;
}

export function useTonePitchShift({ audioElement, semitones }: UseTonePitchShiftProps) {
  const pitchShiftRef = useRef<Tone.PitchShift | null>(null);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const isConnectedRef = useRef<boolean>(false);
  const currentAudioElRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioElement) return;

    if (currentAudioElRef.current !== audioElement) {
      currentAudioElRef.current = audioElement;
      isConnectedRef.current = false;
      mediaSourceRef.current = null;
    }

    if (semitones === 0) {
      if (pitchShiftRef.current) {
        pitchShiftRef.current.pitch = 0;
      }
      return;
    }

    const initAudioNode = async () => {
      // createMediaElementSource() desconecta la salida NATIVA del <audio> en cuanto se llama, con
      // éxito o no en lo que venga después — así que en cuanto lo invocamos, un fallo más adelante
      // (Tone.start() que no resuelve, el nodo PitchShift que no llega a construirse, el connect()
      // que lanza) deja la pista completamente muda el resto de la sesión, sin ningún indicio en
      // pantalla. Por eso todo el intento vive en un try/catch con una red de seguridad: si algo
      // falla, reconectamos el source ya capturado directamente al destino real del AudioContext,
      // sin pasar por PitchShift — se pierde la trasposición de esa pista, pero nunca el sonido.
      let rawAudioContext: AudioContext | null = null;
      try {
        if (Tone.getContext().state !== 'running') {
          await Tone.start();
        }
        if (Tone.getContext().state !== 'running') {
          throw new Error(`AudioContext sigue en estado "${Tone.getContext().state}" tras Tone.start() — el navegador puede estar bloqueando el audio hasta un gesto más directo del usuario.`);
        }

        rawAudioContext = Tone.getContext().rawContext as AudioContext;

        if (!pitchShiftRef.current) {
          const limiter = new Tone.Limiter(-1).toDestination();
          pitchShiftRef.current = new Tone.PitchShift({
            pitch: semitones,
            windowSize: 0.08, // Ventana óptima de 80ms para mezclas musicales completas (elimina el comb-filtering metálico)
            delayTime: 0,
            feedback: 0
          }).connect(limiter);
        } else {
          pitchShiftRef.current.pitch = semitones;
        }

        if (!mediaSourceRef.current && audioElement) {
          if (!audioElement.crossOrigin) {
            audioElement.crossOrigin = 'anonymous';
          }
          const createSource = rawAudioContext.createMediaElementSource || (rawAudioContext as any).createMediaElementAudioSource;
          mediaSourceRef.current = createSource.call(rawAudioContext, audioElement);
        }

        if (!mediaSourceRef.current || !pitchShiftRef.current) {
          throw new Error('No se pudo construir el nodo de trasposición o capturar la pista de audio.');
        }

        if (!isConnectedRef.current) {
          Tone.connect(mediaSourceRef.current, pitchShiftRef.current);
          isConnectedRef.current = true;
        }
      } catch (err) {
        console.warn('[useTonePitchShift] AudioContext connect warning — se pierde la trasposición de esta pista, pero se intenta mantener el sonido:', err);
        try {
          if (mediaSourceRef.current && rawAudioContext) {
            mediaSourceRef.current.disconnect();
            mediaSourceRef.current.connect(rawAudioContext.destination);
            isConnectedRef.current = true;
          }
        } catch (fallbackErr) {
          console.warn('[useTonePitchShift] No se pudo reconectar la pista a la salida tras el fallo — puede quedar muda:', fallbackErr);
        }
      }
    };

    initAudioNode();
  }, [audioElement, semitones]);

  useEffect(() => {
    if (pitchShiftRef.current) {
      pitchShiftRef.current.pitch = semitones;
    }
  }, [semitones]);

  useEffect(() => {
    return () => {
      if (pitchShiftRef.current) {
        try {
          pitchShiftRef.current.dispose();
        } catch {
          // ignore
        }
        pitchShiftRef.current = null;
      }
      mediaSourceRef.current = null;
      isConnectedRef.current = false;
    };
  }, []);

  return {
    semitones,
    isToneActive: semitones !== 0 && isConnectedRef.current
  };
}
