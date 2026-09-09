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
      try {
        if (Tone.getContext().state !== 'running') {
          await Tone.start();
        }

        if (!pitchShiftRef.current) {
          pitchShiftRef.current = new Tone.PitchShift({
            pitch: semitones,
            windowSize: 0.08,
            delayTime: 0,
            feedback: 0
          }).toDestination();
        } else {
          pitchShiftRef.current.pitch = semitones;
        }

        if (!mediaSourceRef.current && audioElement) {
          if (!audioElement.crossOrigin) {
            audioElement.crossOrigin = 'anonymous';
          }
          const rawAudioContext = Tone.getContext().rawContext as AudioContext;
          const createSource = rawAudioContext.createMediaElementSource || (rawAudioContext as any).createMediaElementAudioSource;
          mediaSourceRef.current = createSource.call(rawAudioContext, audioElement);
        }

        if (mediaSourceRef.current && pitchShiftRef.current && !isConnectedRef.current) {
          Tone.connect(mediaSourceRef.current, pitchShiftRef.current);
          isConnectedRef.current = true;
        }
      } catch (err) {
        console.warn('[useTonePitchShift] AudioContext connect warning:', err);
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
