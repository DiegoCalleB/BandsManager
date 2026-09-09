import { useEffect, useRef } from 'react';
import * as Tone from 'tone';

interface PitchShiftConfig {
  semitones: number;
  audioElement?: HTMLAudioElement | null;
}

export function useTonePitchShift(config: PitchShiftConfig) {
  const synth = useRef<Tone.PolySynth | null>(null);
  const sourceRef = useRef<Tone.MediaElementAudioSource | null>(null);
  const pitchShiftRef = useRef<Tone.PitchShift | null>(null);
  const volumeRef = useRef<Tone.Volume | null>(null);
  const isConnectedRef = useRef(false);

  useEffect(() => {
    if (!config.audioElement) return;

    const init = async () => {
      try {
        // Start Tone context if needed
        if (Tone.getContext().state === 'suspended') {
          await Tone.start();
        }

        // Create source from audio element
        if (!sourceRef.current) {
          sourceRef.current = new Tone.MediaElementAudioSource(config.audioElement);
        }

        // Create pitch shifter
        if (!pitchShiftRef.current) {
          pitchShiftRef.current = new Tone.PitchShift({
            pitch: config.semitones,
          });
        } else {
          pitchShiftRef.current.pitch = config.semitones;
        }

        // Create volume node
        if (!volumeRef.current) {
          volumeRef.current = new Tone.Volume(0);
        }

        // Connect chain: source -> pitch shifter -> volume -> destination
        if (!isConnectedRef.current) {
          sourceRef.current.connect(pitchShiftRef.current);
          pitchShiftRef.current.connect(volumeRef.current);
          volumeRef.current.toDestination();
          isConnectedRef.current = true;
        }

        console.log('🎵 Tone.js pitch shift initialized:', { semitones: config.semitones });
      } catch (err) {
        console.warn('Tone.js pitch shift setup failed:', err);
      }
    };

    init();

    return () => {
      // Keep connections alive
    };
  }, [config.audioElement]);

  // Update pitch when semitones change
  useEffect(() => {
    if (pitchShiftRef.current) {
      pitchShiftRef.current.pitch = config.semitones;
      console.log('🎵 Pitch updated to:', config.semitones);
    }
  }, [config.semitones]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sourceRef.current) sourceRef.current.dispose();
      if (pitchShiftRef.current) pitchShiftRef.current.dispose();
      if (volumeRef.current) volumeRef.current.dispose();
    };
  }, []);

  return {
    pitch: config.semitones,
    semitones: config.semitones,
  };
}
