import { useEffect, useRef } from 'react';

interface PitchShiftConfig {
  semitones: number;
  audioElement?: HTMLAudioElement | null;
}

export function useTonePitchShift(config: PitchShiftConfig) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const isConnectedRef = useRef(false);

  // Initialize Web Audio and worker
  useEffect(() => {
    if (!config.audioElement) return;

    const init = async () => {
      try {
        // Initialize Audio Context
        if (!audioContextRef.current) {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioCtx();
        }

        const ctx = audioContextRef.current;

        // Resume if suspended
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        // Create source from audio element
        if (!sourceRef.current) {
          sourceRef.current = (ctx as any).createMediaElementAudioSource(config.audioElement);
        }

        // Create ScriptProcessor for real-time audio processing
        if (!processorRef.current) {
          processorRef.current = ctx.createScriptProcessor(4096, 1, 1);
        }

        // Initialize worker
        if (!workerRef.current) {
          workerRef.current = new Worker(
            new URL('../workers/pitchShiftWorker.ts', import.meta.url),
            { type: 'module' }
          );

          workerRef.current.postMessage({
            type: 'init',
            data: { sampleRate: ctx.sampleRate },
          });

          // Handle worker output
          workerRef.current.onmessage = (e) => {
            if (e.data.type === 'samples' && processorRef.current) {
              // Store samples for playback
            }
          };
        }

        // Connect: source -> processor -> destination
        if (!isConnectedRef.current) {
          sourceRef.current.connect(processorRef.current);
          processorRef.current.connect(ctx.destination);
          isConnectedRef.current = true;
        }

        // Process audio in real-time
        if (processorRef.current) {
          processorRef.current.onaudioprocess = (e) => {
            const input = e.inputBuffer.getChannelData(0);
            if (workerRef.current) {
              workerRef.current.postMessage({
                type: 'process',
                data: input,
              });
            }
          };
        }

        console.log('🎵 Pitch shift worker initialized');
      } catch (err) {
        console.warn('Pitch shift setup failed:', err);
      }
    };

    init();

    return () => {
      // Keep connections alive
    };
  }, [config.audioElement]);

  // Update pitch when semitones change
  useEffect(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'setPitch',
        semitones: config.semitones,
      });
    }
  }, [config.semitones]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (processorRef.current) {
        processorRef.current.disconnect();
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  return {
    pitch: config.semitones,
    semitones: config.semitones,
  };
}
