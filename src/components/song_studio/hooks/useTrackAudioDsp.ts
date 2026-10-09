/**
 * Procesado de audio por pista (cadena WebAudio: ganancia, paneo, EQ, filtro limpio) y cuenta atrás con metrónomo
 * Extraído de SongStudioModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/set-state-in-effect,
 react-hooks/exhaustive-deps,
 react-hooks/purity,
 react-hooks/immutability
*/
import { useState, useRef, RefObject } from "react";
import { Song } from "../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface TrackAudioDspParams {
  lastPerTrackGainRef: RefObject<Record<string, number>>;
  applyMasterToElementVolume: (perTrackGain: number) => number;
  studioAudioCtxRef: RefObject<AudioContext>;
  getOrCreateMasterGain: (ctx: AudioContext) => GainNode;
  song: Song;
}

/**
 * Procesado de audio por pista (cadena WebAudio: ganancia, paneo, EQ, filtro limpio) y cuenta atrás con metrónomo
 * @param params Estado y callbacks del contenedor ({@link TrackAudioDspParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useTrackAudioDsp({ lastPerTrackGainRef, applyMasterToElementVolume, studioAudioCtxRef, getOrCreateMasterGain, song }: TrackAudioDspParams) {
  // DSP Noise Reduction & Anti-Bleed Studio Settings
  const [useCleanDSPFilter, setUseCleanDSPFilter] = useState<boolean>(true);
  const [useEchoCancellation, setUseEchoCancellation] = useState<boolean>(true);
  const [useNoiseSuppression, setUseNoiseSuppression] = useState<boolean>(true);
  const [autoLatencyTrimMs, setAutoLatencyTrimMs] = useState<number>(110);
  const [useCountInMetronome, setUseCountInMetronome] = useState<boolean>(true);
  const [countInCountdown, setCountInCountdown] = useState<number | null>(null);
  const [cleaningTrackId, setCleaningTrackId] = useState<string | null>(null);
  const cleanPipelineRef = useRef<any>(null);

  // Web Audio API DSP nodes map for live smooth volume, 3-band EQ, Stem Isolators and Stereo Panning per track
  const trackDSPMapRef = useRef<
    Record<
      string,
      {
        element: HTMLAudioElement;
        source?: MediaElementAudioSourceNode;
        stemFilter?: BiquadFilterNode | null;
        eqLow?: BiquadFilterNode;
        eqMid?: BiquadFilterNode;
        eqHigh?: BiquadFilterNode;
        gainNode?: GainNode;
        panNode?: StereoPannerNode | GainNode;
      }
    >
  >({});

  const updateTrackAudioDSP = (
    trackId: string,
    el: HTMLAudioElement | null,
    tr: {
      volumen?: number;
      muted?: boolean;
      solo?: boolean;
      eqLow?: number;
      eqMid?: number;
      eqHigh?: number;
      pan?: number;
      instrumento?: string;
      nombre?: string;
      audioUrl?: string;
    },
    hasSoloInSession: boolean = false
  ) => {
    if (!el) return;

    const isAudible = (hasSoloInSession ? !!tr.solo : true) && !tr.muted;
    const targetGain = isAudible ? Math.max(0, tr.volumen ?? 1) : 0;
    lastPerTrackGainRef.current[trackId] = targetGain;

    // Apply direct HTML5 Audio element volume baseline first to prevent silence on cross-origin stems
    try {
      el.volume = applyMasterToElementVolume(targetGain);
      el.muted = !isAudible;
    } catch (e) {}

    try {
      if (!studioAudioCtxRef.current || studioAudioCtxRef.current.state === 'closed') {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          studioAudioCtxRef.current = new AudioCtxClass();
        }
      }

      const ctx = studioAudioCtxRef.current;
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      let dsp = trackDSPMapRef.current[trackId];

      if (!dsp || dsp.element !== el) {
        let source: MediaElementAudioSourceNode | undefined = (el as any).__mediaElementSource;

        if (!source) {
          const isSameOriginOrBlob =
            !el.src || el.src.startsWith('blob:') || el.src.startsWith('data:') || el.src.includes(window.location.host);
          if (isSameOriginOrBlob) {
            try {
              source = ctx.createMediaElementSource(el);
              (el as any).__mediaElementSource = source;
            } catch (e) {
              source = (el as any).__mediaElementSource;
            }
          }
        }

        if (source) {
          // Only apply simulated frequency isolation filter if track shares the exact original unseparated mix file
          // If it's a dedicated stem file (Demucs v4, FFmpeg isolated stem, or uploaded WAV), let it play in full 20Hz-20kHz studio fidelity!
          let stemFilter: BiquadFilterNode | null = null;
          const inst = (tr.instrumento || tr.nombre || '').toLowerCase();
          const isDedicatedStem =
            (el.src &&
              (el.src.includes('/stems/') ||
                el.src.includes('stem-') ||
                el.src.includes('replicate.delivery') ||
                el.src.startsWith('blob:'))) ||
            (tr.audioUrl &&
              (tr.audioUrl.includes('/stems/') ||
                tr.audioUrl.includes('stem-') ||
                tr.audioUrl.includes('replicate.delivery') ||
                tr.audioUrl.startsWith('blob:')));

          if (!isDedicatedStem) {
            if (inst.includes('voz') || inst.includes('vocal')) {
              // Gentle vocal contour only for unseparated base mix
              stemFilter = ctx.createBiquadFilter();
              stemFilter.type = 'peaking';
              stemFilter.frequency.value = 1500;
              stemFilter.Q.value = 1.2;
              stemFilter.gain.value = 6;
            } else if (inst.includes('batería') || inst.includes('bateria') || inst.includes('drum')) {
              stemFilter = ctx.createBiquadFilter();
              stemFilter.type = 'highpass';
              stemFilter.frequency.value = 1200;
              stemFilter.Q.value = 0.7;
            } else if (inst.includes('bajo') || inst.includes('bass')) {
              stemFilter = ctx.createBiquadFilter();
              stemFilter.type = 'lowpass';
              stemFilter.frequency.value = 240;
              stemFilter.Q.value = 1.0;
            }
          }

          // 1. Low Shelf Filter (Graves < 150Hz)
          const eqLow = ctx.createBiquadFilter();
          eqLow.type = 'lowshelf';
          eqLow.frequency.value = 150;
          eqLow.gain.value = tr.eqLow ?? 0;

          // 2. Peaking Filter (Medios 1000Hz)
          const eqMid = ctx.createBiquadFilter();
          eqMid.type = 'peaking';
          eqMid.frequency.value = 1000;
          eqMid.Q.value = 1.0;
          eqMid.gain.value = tr.eqMid ?? 0;

          // 3. High Shelf Filter (Agudos > 3500Hz)
          const eqHigh = ctx.createBiquadFilter();
          eqHigh.type = 'highshelf';
          eqHigh.frequency.value = 3500;
          eqHigh.gain.value = tr.eqHigh ?? 0;

          // 4. Smooth GainNode (Web Audio volume control)
          const gainNode = ctx.createGain();

          // 5. Stereo Panner Node L / R
          let panNode: StereoPannerNode | GainNode;
          if (ctx.createStereoPanner) {
            panNode = ctx.createStereoPanner();
            (panNode as StereoPannerNode).pan.value = tr.pan ?? 0;
          } else {
            panNode = ctx.createGain();
          }

          // Connect DSP chain in series
          let lastNode: AudioNode = source;
          if (stemFilter) {
            lastNode.connect(stemFilter);
            lastNode = stemFilter;
          }
          lastNode.connect(eqLow);
          eqLow.connect(eqMid);
          eqMid.connect(eqHigh);
          eqHigh.connect(gainNode);
          gainNode.connect(panNode);
          panNode.connect(getOrCreateMasterGain(ctx));

          // Keep HTMLAudioElement volume at 1.0 so GainNode controls volume without HTMLAudioElement stutter
          el.volume = 1.0;

          dsp = {
            element: el,
            source,
            stemFilter,
            eqLow,
            eqMid,
            eqHigh,
            gainNode,
            panNode,
          };
          trackDSPMapRef.current[trackId] = dsp;
        }
      }

      const now = ctx.currentTime;
      const isAudible = (hasSoloInSession ? !!tr.solo : true) && !tr.muted;
      const targetGain = isAudible ? Math.max(0, tr.volumen ?? 1) : 0;

      if (dsp && dsp.gainNode) {
        // Smooth gain transition over 15ms (setTargetAtTime prevents clicking, popping, buffer drops)
        dsp.gainNode.gain.setTargetAtTime(targetGain, now, 0.015);

        if (dsp.eqLow) dsp.eqLow.gain.setTargetAtTime(tr.eqLow ?? 0, now, 0.015);
        if (dsp.eqMid) dsp.eqMid.gain.setTargetAtTime(tr.eqMid ?? 0, now, 0.015);
        if (dsp.eqHigh) dsp.eqHigh.gain.setTargetAtTime(tr.eqHigh ?? 0, now, 0.015);

        if (dsp.panNode && 'pan' in dsp.panNode) {
          (dsp.panNode as StereoPannerNode).pan.setTargetAtTime(tr.pan ?? 0, now, 0.015);
        }
      } else {
        // Fallback to HTMLAudioElement volume if WebAudio source creation was bypassed
        el.volume = applyMasterToElementVolume(targetGain);
      }
    } catch (err) {
      console.warn('Could not setup WebAudio DSP for track:', trackId, err);
      const isAudible = (hasSoloInSession ? !!tr.solo : true) && !tr.muted;
      el.volume = applyMasterToElementVolume(isAudible ? Math.max(0, tr.volumen ?? 1) : 0);
    }
  };

  const triggerCountInBeeps = (bpm: number, onDone: () => void) => {
    try {
      if (!studioAudioCtxRef.current) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) studioAudioCtxRef.current = new AudioCtxClass();
      }
      const ctx = studioAudioCtxRef.current;
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});

      const songBpm = bpm > 40 && bpm < 240 ? bpm : song.bpm || 120;
      const beatIntervalMs = Math.max(300, Math.min(1200, (60 / songBpm) * 1000));

      const playBeep = (freq: number) => {
        try {
          if (!ctx) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
          osc.connect(gain);
          gain.connect(getOrCreateMasterGain(ctx));
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.09);
        } catch (_) {}
      };

      setCountInCountdown(4);
      playBeep(880);

      let current = 4;
      const interval = setInterval(() => {
        current -= 1;
        if (current > 0) {
          setCountInCountdown(current);
          playBeep(current === 1 ? 1760 : 880);
        } else {
          clearInterval(interval);
          setCountInCountdown(null);
          onDone();
        }
      }, beatIntervalMs);
    } catch (err) {
      setCountInCountdown(null);
      onDone();
    }
  };

  return { trackDSPMapRef, updateTrackAudioDSP, useEchoCancellation, useNoiseSuppression, useCleanDSPFilter, useCountInMetronome, triggerCountInBeeps, cleanPipelineRef, autoLatencyTrimMs, setCleaningTrackId, cleaningTrackId, setUseCleanDSPFilter, setUseEchoCancellation, setAutoLatencyTrimMs, countInCountdown };
}
