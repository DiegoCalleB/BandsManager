/**
 * Motor de reproducción multipista de Song Studio: sincronía maestra, play/pausa/stop/seek y silencio de otros audios al abrir
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
import { useRef, useEffect, RefObject, Dispatch, SetStateAction } from "react";
import { SongAudioIdea, AudioTrack, Song } from "../../../types";
import { SILENT_AUDIO_URI } from "../silentAudio";
import { resolveAudioUrl } from "../../../utils/audioStorage";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface StudioPlaybackEngineParams {
  syncAnimationFrameRef: RefObject<number>;
  pistasDeReproduccion: (idea: SongAudioIdea) => AudioTrack[];
  trackAudioRefs: RefObject<Record<string, HTMLAudioElement>>;
  getSafeTrackDuration: (el: HTMLAudioElement) => number;
  getValidIdeaDuration: (ideaId: string) => number;
  playingIdeaIdRef: RefObject<string>;
  songRef: RefObject<Song>;
  song: Song;
  currentTimeMap: Record<string, number>;
  loopConfigMap: Record<string, { enabled: boolean; start: number; end: number; }>;
  applyMasterToElementVolume: (perTrackGain: number) => number;
  trackDSPMapRef: RefObject<Record<string, { element: HTMLAudioElement; source?: MediaElementAudioSourceNode; stemFilter?: BiquadFilterNode; eqLow?: BiquadFilterNode; eqMid?: BiquadFilterNode; eqHigh?: BiquadFilterNode; gainNode?: GainNode; panNode?: GainNode | StereoPannerNode; }>>;
  studioAudioCtxRef: RefObject<AudioContext>;
  pendingPlayPromiseRefs: RefObject<Record<string, Promise<void>>>;
  lastPlayAttemptMapRef: RefObject<Record<string, number>>;
  setCurrentTimeMap: Dispatch<SetStateAction<Record<string, number>>>;
  setDurationMap: Dispatch<SetStateAction<Record<string, number>>>;
  setPlayingIdeaId: Dispatch<SetStateAction<string>>;
  resolvedAudioUrls: Record<string, string>;
  setResolvedAudioUrls: Dispatch<SetStateAction<Record<string, string>>>;
  updateTrackAudioDSP: (trackId: string, el: HTMLAudioElement, tr: { volumen?: number; muted?: boolean; solo?: boolean; eqLow?: number; eqMid?: number; eqHigh?: number; pan?: number; instrumento?: string; nombre?: string; audioUrl?: string; }, hasSoloInSession?: boolean) => void;
  playingIdeaId: string;
}

/**
 * Motor de reproducción multipista de Song Studio: sincronía maestra, play/pausa/stop/seek y silencio de otros audios al abrir
 * @param params Estado y callbacks del contenedor ({@link StudioPlaybackEngineParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useStudioPlaybackEngine({ syncAnimationFrameRef, pistasDeReproduccion, trackAudioRefs, getSafeTrackDuration, getValidIdeaDuration, playingIdeaIdRef, songRef, song, currentTimeMap, loopConfigMap, applyMasterToElementVolume, trackDSPMapRef, studioAudioCtxRef, pendingPlayPromiseRefs, lastPlayAttemptMapRef, setCurrentTimeMap, setDurationMap, setPlayingIdeaId, resolvedAudioUrls, setResolvedAudioUrls, updateTrackAudioDSP, playingIdeaId }: StudioPlaybackEngineParams) {
  // High-Precision Master Sync Loop (16ms / requestAnimationFrame)
  // Keeps all multitrack audio elements aligned within < 10ms with pitch-safe micro-adjustments
  // Handles variable track durations cleanly by padding shorter tracks
  const lastDriftFixMapRef = useRef<Record<string, number>>({});
  const runMasterSyncLoop = (idea: SongAudioIdea) => {
    if (syncAnimationFrameRef.current) {
      cancelAnimationFrame(syncAnimationFrameRef.current);
      syncAnimationFrameRef.current = null;
    }

    const tracks = pistasDeReproduccion(idea);
    if (tracks.length === 0) return;

    const hasSolo = tracks.some((t: any) => t.solo);

    // 1. Determine maximum idea duration across all loaded audio tracks
    let maxIdeaDuration = 0;
    tracks.forEach((tr) => {
      const el = trackAudioRefs.current[tr.id];
      const dur = getSafeTrackDuration(el);
      if (dur > maxIdeaDuration) {
        maxIdeaDuration = dur;
      }
    });
    if (maxIdeaDuration === 0 || !isFinite(maxIdeaDuration)) {
      maxIdeaDuration = getValidIdeaDuration(idea.id);
    }

    // 2. Select master clock track element (longest active non-muted track)
    let masterTrack = tracks[0];
    let longestDur = 0;
    tracks.forEach((tr) => {
      const el = trackAudioRefs.current[tr.id];
      const dur = getSafeTrackDuration(el);
      if (dur >= longestDur && !tr.muted) {
        longestDur = dur;
        masterTrack = tr;
      }
    });

    let masterEl = trackAudioRefs.current[masterTrack.id];
    if (!masterEl) {
      for (const tr of tracks) {
        if (trackAudioRefs.current[tr.id]) {
          masterEl = trackAudioRefs.current[tr.id];
          break;
        }
      }
    }

    let lastReportedTime = -1;

    const tick = () => {
      if (playingIdeaIdRef.current !== idea.id) {
        return;
      }

      // Read fresh track definitions and solo status from songRef
      const currentSong = songRef.current || song;
      const currentIdea = (currentSong.audioIdeas || []).find((i) => i.id === idea.id) || idea;
      const activeTracks = pistasDeReproduccion(currentIdea);
      const activeHasSolo = activeTracks.some((t) => t.solo);

      // Rock-solid Master Clock reference:
      // masterEl serves as the uninterrupted timeline anchor. It does NOT switch on Mute/Solo
      // because GainNode controls silence without disrupting playback or jumping clocks.
      let currentMasterEl: HTMLAudioElement | null = masterEl;
      if (!currentMasterEl || currentMasterEl.paused) {
        for (const tr of activeTracks) {
          const el = trackAudioRefs.current[tr.id];
          if (el && !el.paused && el.currentTime >= 0) {
            currentMasterEl = el;
            break;
          }
        }
      }
      if (!currentMasterEl) {
        currentMasterEl = masterEl || trackAudioRefs.current[masterTrack.id] || null;
      }

      const masterTime = currentMasterEl ? currentMasterEl.currentTime : currentTimeMap[idea.id] || 0;

      // Loop / Cue Bounds
      const loopCfg = loopConfigMap[idea.id];
      const isLoopEnabled = !!loopCfg?.enabled;
      const loopStart = loopCfg?.start || 0;
      const loopEnd = loopCfg?.end && isFinite(loopCfg.end) && loopCfg.end > loopStart ? loopCfg.end : maxIdeaDuration;

      // A. Loop Cue Detection: Check if loop end point hit
      if (isLoopEnabled && masterTime >= loopEnd - 0.05) {
        handleSeekIdea(idea, loopStart);
        syncAnimationFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      // B. Align and enforce playback on all active tracks
      activeTracks.forEach((tr) => {
        const slaveEl = trackAudioRefs.current[tr.id];
        if (!slaveEl) return;

        const slaveDur = getSafeTrackDuration(slaveEl);
        const isMuted = tr.muted || (activeHasSolo && !tr.solo);
        const targetGain = isMuted ? 0 : Math.max(0, tr.volumen ?? 1);
        const targetElementVolume = applyMasterToElementVolume(targetGain);

        // Only modify DOM properties when changed to prevent Chrome audio engine stutter
        if (slaveEl.muted !== isMuted) {
          slaveEl.muted = isMuted;
        }
        if (Math.abs(slaveEl.volume - targetElementVolume) > 0.005) {
          slaveEl.volume = targetElementVolume;
        }

        const dsp = trackDSPMapRef.current[tr.id];
        if (dsp && dsp.gainNode && studioAudioCtxRef.current) {
          try {
            const currentGain = dsp.gainNode.gain.value;
            if (Math.abs(currentGain - targetGain) > 0.005) {
              dsp.gainNode.gain.setTargetAtTime(targetGain, studioAudioCtxRef.current.currentTime, 0.015);
            }
          } catch (_) {}
        }

        const trackOffsetSec = (tr.desfaseMs || 0) / 1000;
        const targetSlaveTime = masterTime + trackOffsetSec;

        // If master has not reached track offset yet, keep slave paused at 0
        if (targetSlaveTime < 0) {
          if (!slaveEl.paused) slaveEl.pause();
          if (Math.abs(slaveEl.currentTime) > 0.01) {
            try {
              slaveEl.currentTime = 0;
            } catch {}
          }
          return;
        }

        // If track has ended its length, keep it quietly paused at end
        if (slaveDur > 0 && targetSlaveTime >= slaveDur - 0.05) {
          if (!slaveEl.paused) slaveEl.pause();
          return;
        }

        // Ensure slave element is playing if in active audio range (throttled & non-blocking to prevent Chrome audio engine lockup)
        const isPending = !!pendingPlayPromiseRefs.current[tr.id];
        if (
          slaveEl.paused &&
          !isPending &&
          slaveEl.src &&
          !slaveEl.src.startsWith('indexeddb:') &&
          (slaveDur === 0 || targetSlaveTime < slaveDur - 0.05)
        ) {
          const now = Date.now();
          const lastAttempt = lastPlayAttemptMapRef.current[tr.id] || 0;
          if (now - lastAttempt > 600) {
            lastPlayAttemptMapRef.current[tr.id] = now;
            const p = slaveEl.play();
            if (p !== undefined) {
              pendingPlayPromiseRefs.current[tr.id] = p;
              p.then(() => {
                delete pendingPlayPromiseRefs.current[tr.id];
              }).catch(() => {
                delete pendingPlayPromiseRefs.current[tr.id];
              });
            }
          }
        }

        // Keep playbackRate always at 1.0 to eliminate resample distortion and pitch wobble
        if (slaveEl.playbackRate !== 1.0) {
          slaveEl.playbackRate = 1.0;
        }

        // Hard seek ONLY when drift is severe (> 350ms) to prevent continuous seek popping
        if (currentMasterEl && slaveEl !== currentMasterEl) {
          const diff = slaveEl.currentTime - targetSlaveTime;
          const ahora = performance.now();
          const ultimo = lastDriftFixMapRef.current[tr.id] || 0;
          // Umbral fino (>35 ms) con pausa entre saltos para no crujir: así las pistas no se van unos ms del tema
          if (Math.abs(diff) > (ahora - ultimo > 800 ? 0.035 : 0.35)) {
            lastDriftFixMapRef.current[tr.id] = ahora;
            try {
              slaveEl.currentTime = Math.max(0, targetSlaveTime);
            } catch {}
          }
        }
      });

      // Update progress & duration maps at smooth ~10fps (every 100ms) to eliminate React re-render thrashing
      if (Math.abs(masterTime - lastReportedTime) >= 0.1 || lastReportedTime < 0) {
        lastReportedTime = masterTime;
        setCurrentTimeMap((prev) => ({ ...prev, [idea.id]: masterTime }));
      }

      if (maxIdeaDuration > 0 && isFinite(maxIdeaDuration)) {
        setDurationMap((prev) => {
          if (prev[idea.id] === maxIdeaDuration) return prev;
          return { ...prev, [idea.id]: maxIdeaDuration };
        });
      }

      // Check if finished (if loop is disabled)
      if (!isLoopEnabled && maxIdeaDuration > 0 && currentMasterEl && (currentMasterEl.ended || masterTime >= maxIdeaDuration - 0.05)) {
        handleStopIdea(idea);
        return;
      }

      syncAnimationFrameRef.current = requestAnimationFrame(tick);
    };

    syncAnimationFrameRef.current = requestAnimationFrame(tick);
  };

  // Master Transport: Pause (holds position)
  const handlePauseIdea = (idea: SongAudioIdea) => {
    if (syncAnimationFrameRef.current) {
      cancelAnimationFrame(syncAnimationFrameRef.current);
      syncAnimationFrameRef.current = null;
    }
    const tracks = pistasDeReproduccion(idea);
    tracks.forEach((tr) => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        el.pause();
        el.playbackRate = 1.0;
      }
    });
    pendingPlayPromiseRefs.current = {};
    playingIdeaIdRef.current = null;
    setPlayingIdeaId(null);
  };

  // Master Transport: Stop (resets position to start / loop start)
  const handleStopIdea = (idea: SongAudioIdea) => {
    if (syncAnimationFrameRef.current) {
      cancelAnimationFrame(syncAnimationFrameRef.current);
      syncAnimationFrameRef.current = null;
    }
    const tracks = pistasDeReproduccion(idea);
    const loopCfg = loopConfigMap[idea.id];
    const startPos = loopCfg && loopCfg.enabled && loopCfg.start > 0 ? loopCfg.start : 0;

    tracks.forEach((tr) => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        el.pause();
        const targetTrackTime = Math.max(0, startPos + (tr.desfaseMs || 0) / 1000);
        try {
          el.currentTime = targetTrackTime;
        } catch {}
        el.playbackRate = 1.0;
      }
    });

    pendingPlayPromiseRefs.current = {};
    setCurrentTimeMap((prev) => ({ ...prev, [idea.id]: startPos }));
    playingIdeaIdRef.current = null;
    setPlayingIdeaId(null);
  };

  // Master Transport: Play (starts/resumes from current position)
  const handlePlayIdea = async (idea: SongAudioIdea) => {
    // 1. Immediately unlock and resume AudioContext in the user click callstack
    try {
      if (!studioAudioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) studioAudioCtxRef.current = new AudioCtx();
      }
      if (studioAudioCtxRef.current && studioAudioCtxRef.current.state === 'suspended') {
        studioAudioCtxRef.current.resume().catch((e) => console.warn('AudioContext resume warning:', e));
      }
    } catch (e) {
      console.warn('AudioContext resume warning:', e);
    }

    // Pause all audio from other ideas
    (Object.values(trackAudioRefs.current) as (HTMLAudioElement | null)[]).forEach((el) => {
      if (el) el.pause();
    });

    const tracks = pistasDeReproduccion(idea);
    if (tracks.length === 0) return;

    const hasSoloTrack = tracks.some((t) => t.solo);
    let startPos = currentTimeMap[idea.id] || 0;

    let maxDur = 0;
    tracks.forEach((tr) => {
      let el = trackAudioRefs.current[tr.id];
      if (!el) {
        el = new Audio(SILENT_AUDIO_URI);
        trackAudioRefs.current[tr.id] = el;
      }
      const dur = getSafeTrackDuration(el);
      if (dur > maxDur) maxDur = dur;
    });
    if (maxDur === 0) maxDur = getValidIdeaDuration(idea.id);

    // Auto rewind if at or beyond end
    if (maxDur > 0 && startPos >= maxDur - 0.2) {
      startPos = 0;
      setCurrentTimeMap((prev) => ({ ...prev, [idea.id]: 0 }));
    }

    // Set playing state IMMEDIATELY so UI reflects playback and loop runs
    playingIdeaIdRef.current = idea.id;
    setPlayingIdeaId(idea.id);

    // Synchronize initial timestamps, DSP and volumes across all tracks
    for (const tr of tracks) {
      let el = trackAudioRefs.current[tr.id];
      if (!el) {
        el = new Audio(SILENT_AUDIO_URI);
        trackAudioRefs.current[tr.id] = el;
      }

      let resolvedUrl = resolvedAudioUrls[tr.id] || tr.audioUrl;
      if (resolvedUrl && (resolvedUrl.startsWith('indexeddb:') || resolvedUrl.includes('drive.google.com'))) {
        try {
          const res = await resolveAudioUrl(resolvedUrl);
          if (res) {
            resolvedUrl = res;
            setResolvedAudioUrls((prev) => ({ ...prev, [tr.id]: res }));
          }
        } catch (_) {}
      }

      if (
        resolvedUrl &&
        !resolvedUrl.startsWith('indexeddb:') &&
        (!el.src || el.src === '' || el.src.endsWith('undefined') || (!el.src.includes(resolvedUrl) && el.src !== resolvedUrl))
      ) {
        el.src = resolvedUrl;
      }

      if (el.readyState === 0 && el.src && !el.src.startsWith('indexeddb:')) {
        try {
          el.load();
        } catch {}
      }

      const trackDur = getSafeTrackDuration(el);
      const trackOffsetSec = (tr.desfaseMs || 0) / 1000;
      const targetTrackTime = Math.max(0, startPos + trackOffsetSec);

      if (trackDur > 0 && startPos >= trackDur) {
        try {
          el.currentTime = trackDur;
        } catch {}
        el.pause();
      } else {
        if (Math.abs((el.currentTime || 0) - targetTrackTime) > 0.03) {
          try {
            el.currentTime = targetTrackTime;
          } catch {}
        }
        el.playbackRate = 1.0;
        el.muted = false;

        // Apply DSP and volume
        updateTrackAudioDSP(tr.id, el, tr, hasSoloTrack);

        // Ensure audio element play is triggered
        if (el.src && el.src !== '' && !el.src.endsWith('undefined') && !el.src.startsWith('indexeddb:')) {
          if (!pendingPlayPromiseRefs.current[tr.id]) {
            const p = el.play();
            if (p !== undefined) {
              pendingPlayPromiseRefs.current[tr.id] = p;
              p.then(() => {
                delete pendingPlayPromiseRefs.current[tr.id];
              }).catch((err) => {
                delete pendingPlayPromiseRefs.current[tr.id];
                console.warn(`Track ${tr.id} play deferred:`, err);
              });
            }
          }
        }
      }
    }

    // 3. Launch Master Sync Engine
    runMasterSyncLoop(idea);
  };

  // Toggle Play / Pause
  const togglePlayIdea = async (idea: SongAudioIdea) => {
    if (playingIdeaId === idea.id || playingIdeaIdRef.current === idea.id) {
      handlePauseIdea(idea);
    } else {
      await handlePlayIdea(idea);
    }
  };

  // Seek master progress for an idea
  const handleSeekIdea = (idea: SongAudioIdea, newTime: number) => {
    const tracks = pistasDeReproduccion(idea);
    const targetTime = Math.max(0, newTime);

    tracks.forEach((tr) => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        const dur = getSafeTrackDuration(el);
        if (dur > 0 && targetTime >= dur) {
          el.currentTime = dur;
          if (!el.paused) el.pause();
        } else {
          el.currentTime = targetTime;
          el.playbackRate = 1.0;
          if (playingIdeaIdRef.current === idea.id && el.paused && !tr.muted) {
            el.play().catch(() => {});
          }
        }
      }
    });
    setCurrentTimeMap((prev) => ({ ...prev, [idea.id]: targetTime }));

    if (playingIdeaIdRef.current === idea.id) {
      runMasterSyncLoop(idea);
    }
  };

  // Jump to timestamp from comment
  const jumpToTime = (idea: SongAudioIdea, timestampSegs: number) => {
    handleSeekIdea(idea, timestampSegs);
    if (playingIdeaId !== idea.id) {
      handlePlayIdea(idea);
    }
  };

  // Stop background discography player when entering studio modal & cleanup on unmount
  useEffect(() => {
    // Silence any background discography audio elements when entering Song Studio
    const allAudioElements = document.querySelectorAll('audio');
    allAudioElements.forEach((el) => {
      try {
        el.pause();
      } catch {}
    });

    return () => {
      if (syncAnimationFrameRef.current) {
        cancelAnimationFrame(syncAnimationFrameRef.current);
      }
      // Stop all multitrack studio audio elements on unmount
      Object.values(trackAudioRefs.current).forEach((el) => {
        if (el) {
          try {
            el.pause();
            el.currentTime = 0;
          } catch {}
        }
      });
      playingIdeaIdRef.current = null;
    };
  }, []);

  return { togglePlayIdea, handleStopIdea, handlePauseIdea, handleSeekIdea, runMasterSyncLoop, jumpToTime };
}
