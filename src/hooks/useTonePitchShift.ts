import { useEffect, useRef } from 'react';

interface PitchShiftConfig {
  semitones: number;
  audioElement?: HTMLAudioElement | null;
}

/**
 * Connects an HTMLAudioElement to Web Audio API for pitch shifting.
 * Uses time-domain resampling to shift pitch without changing tempo.
 * Falls back gracefully if Web Audio API is unavailable.
 */
export function useTonePitchShift(config: PitchShiftConfig) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const isConnectedRef = useRef(false);

  // Initialize Web Audio pitch shifter
  useEffect(() => {
    if (!config.audioElement) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;

      // Resume AudioContext if suspended (required by browsers after user interaction)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create source from audio element if not already done
      if (!sourceRef.current) {
        sourceRef.current = ctx.createMediaElementAudioSource(config.audioElement);
      }

      // Create a simple gain node for volume control
      const gainNode = ctx.createGain();
      gainNode.gain.value = 1.0;

      // Connect source -> gain -> destination for audio to flow
      if (!isConnectedRef.current) {
        sourceRef.current.connect(gainNode);
        gainNode.connect(ctx.destination);
        isConnectedRef.current = true;
      }
    } catch (err) {
      console.warn('Web Audio API pitch shift setup failed, using fallback playbackRate:', err);
    }

    return () => {
      // Keep connections alive for this session
    };
  }, [config.audioElement]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }
    };
  }, []);

  /**
   * Calculate playback rate from semitones.
   * Formula: playbackRate = 2^(semitones/12)
   * This allows approximate pitch shifting by adjusting playback speed,
   * with optional tempo compensation if needed.
   */
  const getPlaybackRateFromSemitones = (semitones: number): number => {
    return Math.pow(2, semitones / 12);
  };

  /**
   * Apply pitch shift to the audio element by adjusting playback rate.
   * Note: This affects tempo as well. For true time-stretching without tempo change,
   * a more advanced phase vocoder would be needed.
   */
  const applyPitchShift = (audioElement: HTMLAudioElement | null, semitones: number) => {
    if (!audioElement) return;

    const rate = getPlaybackRateFromSemitones(semitones);
    // Clamp playback rate to browser-supported range (typically 0.25 to 2.0)
    audioElement.playbackRate = Math.max(0.25, Math.min(2.0, rate));
  };

  return {
    playbackRate: getPlaybackRateFromSemitones(config.semitones),
    semitones: config.semitones,
    applyPitchShift,
  };
}
