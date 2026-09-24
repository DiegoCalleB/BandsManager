import { useEffect, useRef } from 'react';
import * as Tone from 'tone';

interface UseTonePitchShiftProps {
  audioElement: HTMLAudioElement | null;
  semitones: number;
}

// Map to cache MediaElementAudioSourceNode per HTMLMediaElement to avoid InvalidStateError (can only create once per element)
const mediaElementSourceMap = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();

interface NodeRecord {
  pitchShift: Tone.PitchShift;
  limiter: Tone.Limiter;
}

// Map to cache PitchShift + Limiter chain per HTMLMediaElement
const pitchShiftMap = new WeakMap<HTMLMediaElement, NodeRecord>();

/**
 * Hook to apply real-time pitch shifting (transposition) to an HTMLAudioElement using Tone.js / Web Audio API.
 * Ensures smooth, uninterrupted playback when semitones change dynamically while audio is playing.
 */
export function useTonePitchShift({ audioElement, semitones }: UseTonePitchShiftProps) {
  const currentAudioElRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioElement) return;
    currentAudioElRef.current = audioElement;

    // Ensure crossOrigin is set for Web Audio compatibility
    if (!audioElement.crossOrigin) {
      audioElement.crossOrigin = 'anonymous';
    }

    const syncAudioContextAndPitch = async () => {
      try {
        const rawCtx = Tone.getContext().rawContext as AudioContext;

        // Auto-resume AudioContext on user interaction if suspended
        if (Tone.getContext().state !== 'running') {
          try {
            await Tone.start();
          } catch {
            // may require user gesture
          }
        }

        // Get or create MediaElementAudioSourceNode once for this HTMLAudioElement
        let sourceNode = mediaElementSourceMap.get(audioElement);
        if (!sourceNode) {
          const createSource = rawCtx.createMediaElementSource || (rawCtx as any).createMediaElementAudioSource;
          sourceNode = createSource.call(rawCtx, audioElement);
          mediaElementSourceMap.set(audioElement, sourceNode);
        }

        // Get or create Tone.PitchShift chain once for this HTMLAudioElement
        let nodeRecord = pitchShiftMap.get(audioElement);
        if (!nodeRecord) {
          const limiter = new Tone.Limiter(-1).toDestination();
          const pitchShift = new Tone.PitchShift({
            pitch: semitones,
            windowSize: 0.08, // 80ms window for optimal musical pitch shifting without comb-filtering
            delayTime: 0,
            feedback: 0
          }).connect(limiter);

          Tone.connect(sourceNode, pitchShift);

          nodeRecord = { pitchShift, limiter };
          pitchShiftMap.set(audioElement, nodeRecord);
        }

        // Update pitch shift dynamically in real-time
        if (nodeRecord) {
          if (semitones === 0) {
            nodeRecord.pitchShift.pitch = 0;
            nodeRecord.pitchShift.wet.value = 0; // Pure dry pass-through when at 0 semitones
          } else {
            nodeRecord.pitchShift.wet.value = 1;
            nodeRecord.pitchShift.pitch = semitones;
          }
        }
      } catch (err) {
        console.warn('[useTonePitchShift] Web Audio pitch shift notice:', err);
      }
    };

    // Keep AudioContext active whenever audio plays
    const handlePlay = () => {
      if (Tone.getContext().state !== 'running') {
        Tone.getContext().resume().catch(() => {});
      }
    };

    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('playing', handlePlay);

    syncAudioContextAndPitch();

    return () => {
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('playing', handlePlay);
    };
  }, [audioElement, semitones]);

  return {
    semitones,
    isToneActive: semitones !== 0
  };
}
