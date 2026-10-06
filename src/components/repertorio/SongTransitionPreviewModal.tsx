// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, AlertTriangle, CheckCircle2,
  ChevronLeft, ChevronRight, Sliders, ArrowRight, ArrowLeftRight, MessageSquarePlus,
  Headphones, Music, Zap, Flame, Radio, Clock, ShieldCheck, X, ThumbsUp, ThumbsDown,
  Lightbulb, Compass, ShieldAlert, Info, HelpCircle, Upload, Disc3, Layers, Scissors, Check
} from 'lucide-react';
import { Song, SetlistItem } from '../../types';
import {
  TransitionConfig,
  TransitionStyle,
  DEFAULT_TRANSITION_CONFIG,
  computeTransitionTimeline,
  getTransitionGains,
  diagnoseTransition,
  resolveSongAudioUrl,
  STUDIO_SAMPLE_TRACKS,
  getSampleTrackForSong,
  StudioSampleTrack
} from '../../utils/transitionAudioEngine';
import { resolveAudioUrl } from '../../utils/audioStorage';
import { playSyntheticTransition, SyntheticPlayerController } from '../../utils/transitionSynthesizer';
import { getEnergyInfo } from '../../utils/energyPacingUtils';
import {
  detectAudioCuesFromUrl,
  applyDetectedCuesToSong,
  AudioCueAnalysis
} from '../../utils/audioCueDetector';

interface SongTransitionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  songA: Song | null;
  songB: Song | null;
  itemA?: SetlistItem | null;
  itemB?: SetlistItem | null;
  indexA: number;
  indexB: number;
  totalItemsCount?: number;
  onNavigateTransition?: (newIndexA: number, newIndexB: number) => void;
  onInsertInterludio?: (afterItemId: string) => void;
  onSwapSongs?: (indexA: number, indexB: number) => void;
  onUpdateSong?: (song: Song) => void;
}

export function SongTransitionPreviewModal({
  isOpen,
  onClose,
  songA,
  songB,
  itemA,
  itemB,
  indexA,
  indexB,
  totalItemsCount = 0,
  onNavigateTransition,
  onInsertInterludio,
  onSwapSongs,
  onUpdateSong
}: SongTransitionPreviewModalProps) {
  if (!isOpen || !songA || !songB) return null;

  // Diagnosis
  const diagnosis = useMemo(() => diagnoseTransition(songA, songB), [songA, songB]);

  // Transition Config
  const [config, setConfig] = useState<TransitionConfig>({
    ...DEFAULT_TRANSITION_CONFIG,
    style: diagnosis.recommendedStyle
  });

  const timeline = useMemo(() => computeTransitionTimeline(config), [config]);

  // Audio Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackMode, setPlaybackMode] = useState<'real' | 'synth'>('real');

  // Auto-CUE / Salto Inteligente de Silencios y Aplausos
  const [autoCueEnabled, setAutoCueEnabled] = useState<boolean>(true);
  const [cueAnalysisA, setCueAnalysisA] = useState<AudioCueAnalysis | null>(null);
  const [cueAnalysisB, setCueAnalysisB] = useState<AudioCueAnalysis | null>(null);
  const [isDetectingCuesA, setIsDetectingCuesA] = useState<boolean>(false);
  const [isDetectingCuesB, setIsDetectingCuesB] = useState<boolean>(false);
  const [savedCueSuccessA, setSavedCueSuccessA] = useState<boolean>(false);
  const [savedCueSuccessB, setSavedCueSuccessB] = useState<boolean>(false);

  // Custom uploaded audio overrides
  const [customAudioUrlA, setCustomAudioUrlA] = useState<string | null>(null);
  const [customAudioUrlB, setCustomAudioUrlB] = useState<string | null>(null);
  const [customFileNameA, setCustomFileNameA] = useState<string | null>(null);
  const [customFileNameB, setCustomFileNameB] = useState<string | null>(null);

  // Selected sample overrides
  const [selectedSampleA, setSelectedSampleA] = useState<StudioSampleTrack>(() => getSampleTrackForSong(songA, 0));
  const [selectedSampleB, setSelectedSampleB] = useState<StudioSampleTrack>(() => getSampleTrackForSong(songB, 1));

  // Resolved base audio URLs from song objects (handles IndexedDB/Cloud URLs)
  const [resolvedBaseUrlA, setResolvedBaseUrlA] = useState<string>('');
  const [resolvedBaseUrlB, setResolvedBaseUrlB] = useState<string>('');
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  // File input refs for uploading audio on the fly
  const fileInputRefA = useRef<HTMLInputElement | null>(null);
  const fileInputRefB = useRef<HTMLInputElement | null>(null);

  // Dual audio element refs
  const audioRefA = useRef<HTMLAudioElement | null>(null);
  const audioRefB = useRef<HTMLAudioElement | null>(null);
  const syntheticControllerRef = useRef<SyntheticPlayerController | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  // Track durations
  const [durationA, setDurationA] = useState<number>(180);
  const [durationB, setDurationB] = useState<number>(180);

  // Live gain states for visual VU meters
  const [liveGainA, setLiveGainA] = useState(0);
  const [liveGainB, setLiveGainB] = useState(0);

  // Active Tab for vertical space optimization
  const [activeTab, setActiveTab] = useState<'pros_cons' | 'metrics' | 'stagecraft'>('pros_cons');

  // Auto-play state & timers
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Resolve base audio URLs on song change
  useEffect(() => {
    let isMounted = true;
    const loadAudioSources = async () => {
      setIsLoadingAudio(true);
      const rawA = resolveSongAudioUrl(songA);
      const rawB = resolveSongAudioUrl(songB);

      let finalA = rawA;
      let finalB = rawB;

      try {
        if (rawA) finalA = await resolveAudioUrl(rawA);
        if (rawB) finalB = await resolveAudioUrl(rawB);
      } catch (err) {
        console.warn('Error resolving song audio URL:', err);
      }

      if (isMounted) {
        setResolvedBaseUrlA(finalA || '');
        setResolvedBaseUrlB(finalB || '');
        setSelectedSampleA(getSampleTrackForSong(songA, 0));
        setSelectedSampleB(getSampleTrackForSong(songB, 1));
        setCustomAudioUrlA(null);
        setCustomAudioUrlB(null);
        setCustomFileNameA(null);
        setCustomFileNameB(null);
        setIsLoadingAudio(false);

        // Pre-cargar cues existentes si la canción ya los tenía guardados
        if (typeof songA?.cueIn === 'number' || typeof songA?.cueOut === 'number') {
          setCueAnalysisA({
            cueIn: songA.cueIn || 0,
            cueOut: songA.cueOut || (songA.duracionSegundos || 180),
            duration: songA.duracionSegundos || 180,
            trimmedDuration: (songA.cueOut || songA.duracionSegundos || 180) - (songA.cueIn || 0),
            introSilenceSec: songA.cueIn || 0,
            outroSilenceSec: Math.max(0, (songA.duracionSegundos || 180) - (songA.cueOut || songA.duracionSegundos || 180)),
            hasApplauseIntro: songA.applauseDetected?.intro ?? false,
            hasApplauseOutro: songA.applauseDetected?.outro ?? false,
            confidence: 0.95,
            waveformPeaks: []
          });
        } else {
          setCueAnalysisA(null);
        }

        if (typeof songB?.cueIn === 'number' || typeof songB?.cueOut === 'number') {
          setCueAnalysisB({
            cueIn: songB.cueIn || 0,
            cueOut: songB.cueOut || (songB.duracionSegundos || 180),
            duration: songB.duracionSegundos || 180,
            trimmedDuration: (songB.cueOut || songB.duracionSegundos || 180) - (songB.cueIn || 0),
            introSilenceSec: songB.cueIn || 0,
            outroSilenceSec: Math.max(0, (songB.duracionSegundos || 180) - (songB.cueOut || songB.duracionSegundos || 180)),
            hasApplauseIntro: songB.applauseDetected?.intro ?? false,
            hasApplauseOutro: songB.applauseDetected?.outro ?? false,
            confidence: 0.95,
            waveformPeaks: []
          });
        } else {
          setCueAnalysisB(null);
        }
      }
    };

    loadAudioSources();
    return () => {
      isMounted = false;
    };
  }, [songA?.id, songB?.id]);

  // Determine active effective audio URLs
  const effectiveAudioUrlA = customAudioUrlA || resolvedBaseUrlA || selectedSampleA.url;
  const effectiveAudioUrlB = customAudioUrlB || resolvedBaseUrlB || selectedSampleB.url;

  // Detección automática en segundo plano de puntos CUE de inicio/fin
  useEffect(() => {
    let isCancelled = false;

    const detectA = async () => {
      if (!effectiveAudioUrlA) return;
      setIsDetectingCuesA(true);
      try {
        const analysis = await detectAudioCuesFromUrl(effectiveAudioUrlA);
        if (!isCancelled) {
          setCueAnalysisA(analysis);
        }
      } catch (err) {
        console.warn('No se pudieron auto-detectar CUEs de Track A:', err);
      } finally {
        if (!isCancelled) setIsDetectingCuesA(false);
      }
    };

    const detectB = async () => {
      if (!effectiveAudioUrlB) return;
      setIsDetectingCuesB(true);
      try {
        const analysis = await detectAudioCuesFromUrl(effectiveAudioUrlB);
        if (!isCancelled) {
          setCueAnalysisB(analysis);
        }
      } catch (err) {
        console.warn('No se pudieron auto-detectar CUEs de Track B:', err);
      } finally {
        if (!isCancelled) setIsDetectingCuesB(false);
      }
    };

    detectA();
    detectB();

    return () => {
      isCancelled = true;
    };
  }, [effectiveAudioUrlA, effectiveAudioUrlB]);

  const audioSourceTypeA = customAudioUrlA
    ? 'custom'
    : resolvedBaseUrlA
    ? 'maqueta'
    : 'sample';

  const audioSourceTypeB = customAudioUrlB
    ? 'custom'
    : resolvedBaseUrlB
    ? 'maqueta'
    : 'sample';

  const stopPlayback = () => {
    if (autoplayTimerRef.current) {
      clearTimeout(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
    setIsPlaying(false);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (syntheticControllerRef.current) {
      syntheticControllerRef.current.stop();
      syntheticControllerRef.current = null;
    }
    if (audioRefA.current) {
      audioRefA.current.pause();
      audioRefA.current.currentTime = 0;
    }
    if (audioRefB.current) {
      audioRefB.current.pause();
      audioRefB.current.currentTime = 0;
    }
    setLiveGainA(0);
    setLiveGainB(0);
  };

  // Stop playback when unmounting or changing songs
  useEffect(() => {
    stopPlayback();
    setCurrentTime(0);
    pausedAtRef.current = 0;
  }, [songA?.id, songB?.id, config.style, effectiveAudioUrlA, effectiveAudioUrlB]);

  const handleSeek = (targetSec: number) => {
    const clamped = Math.max(0, Math.min(timeline.totalDurationSec, targetSec));
    pausedAtRef.current = clamped;
    setCurrentTime(clamped);

    if (isPlaying) {
      startPlaybackAt(clamped);
    }
  };

  const startPlaybackAt = (startOffsetSec: number) => {
    stopPlayback();

    const effectiveVolume = isMuted ? 0 : volume;

    if (playbackMode === 'synth') {
      // Synthetic playback mode
      setIsPlaying(true);
      startTimeRef.current = performance.now() - startOffsetSec * 1000;

      syntheticControllerRef.current = playSyntheticTransition(
        itemA?.tonalidadDeseada || songA.tonalidad,
        songA.bpm,
        itemB?.tonalidadDeseada || songB.tonalidad,
        songB.bpm,
        timeline,
        config,
        effectiveVolume,
        (progressSec) => {
          setCurrentTime(progressSec);
          const gains = getTransitionGains(progressSec, timeline, config);
          setLiveGainA(gains.gainA * (isMuted ? 0 : volume));
          setLiveGainB(gains.gainB * (isMuted ? 0 : volume));
        },
        () => {
          setIsPlaying(false);
          setCurrentTime(timeline.totalDurationSec);
          pausedAtRef.current = 0;
          setLiveGainA(0);
          setLiveGainB(0);
        }
      );
      return;
    }

    // Real Audio Playback Mode
    const audioA = audioRefA.current;
    const audioB = audioRefB.current;
    if (!audioA || !audioB) return;

    setIsPlaying(true);
    startTimeRef.current = performance.now() - startOffsetSec * 1000;

    // Calcular puntos efectivos de corte CUE inteligente
    const durA = (audioA.duration && !Number.isNaN(audioA.duration) && audioA.duration > 5) ? audioA.duration : durationA;
    const durB = (audioB.duration && !Number.isNaN(audioB.duration) && audioB.duration > 5) ? audioB.duration : durationB;

    const effectiveCueOutA = autoCueEnabled && cueAnalysisA?.cueOut && cueAnalysisA.cueOut > 0
      ? Math.min(durA, cueAnalysisA.cueOut)
      : (autoCueEnabled && songA.cueOut ? Math.min(durA, songA.cueOut) : durA);

    const effectiveCueInB = autoCueEnabled && cueAnalysisB?.cueIn && cueAnalysisB.cueIn >= 0
      ? Math.min(durB - 1, cueAnalysisB.cueIn)
      : (autoCueEnabled && typeof songB.cueIn === 'number' ? Math.min(durB - 1, songB.cueIn) : 0);

    const songAStartInAudio = Math.max(0, effectiveCueOutA - config.tailDurationSec);
    const audioACurrentTime = songAStartInAudio + startOffsetSec;

    const initialGains = getTransitionGains(startOffsetSec, timeline, config);

    if (audioACurrentTime < effectiveCueOutA && initialGains.isPlayingA) {
      audioA.currentTime = audioACurrentTime;
      audioA.volume = Math.max(0, Math.min(1, initialGains.gainA * effectiveVolume));
      audioA.play().catch(() => {});
    } else {
      audioA.pause();
    }

    // Song B starts at effectiveCueInB + offset
    const audioBOffset = startOffsetSec - timeline.songBStartSec;
    if (audioBOffset >= 0 && initialGains.isPlayingB) {
      audioB.currentTime = Math.max(0, effectiveCueInB + audioBOffset);
      audioB.volume = Math.max(0, Math.min(1, initialGains.gainB * effectiveVolume));
      audioB.play().catch(() => {});
    } else {
      audioB.pause();
      audioB.currentTime = effectiveCueInB;
    }

    const tick = () => {
      const now = performance.now();
      const elapsedSec = (now - startTimeRef.current) / 1000;

      if (elapsedSec >= timeline.totalDurationSec) {
        setCurrentTime(timeline.totalDurationSec);
        stopPlayback();
        pausedAtRef.current = 0;
        return;
      }

      setCurrentTime(elapsedSec);

      const gains = getTransitionGains(elapsedSec, timeline, config);
      const computedGainA = gains.gainA * effectiveVolume;
      const computedGainB = gains.gainB * effectiveVolume;

      setLiveGainA(computedGainA);
      setLiveGainB(computedGainB);

      if (audioA) {
        audioA.volume = Math.max(0, Math.min(1, computedGainA));
        const aPos = songAStartInAudio + elapsedSec;
        if ((!gains.isPlayingA || aPos >= effectiveCueOutA) && !audioA.paused) {
          audioA.pause();
        } else if (gains.isPlayingA && audioA.paused && elapsedSec < timeline.songAEndSec && aPos < effectiveCueOutA) {
          audioA.currentTime = Math.max(0, aPos);
          audioA.play().catch(() => {});
        }
      }

      if (audioB) {
        audioB.volume = Math.max(0, Math.min(1, computedGainB));
        if (gains.isPlayingB && audioB.paused) {
          const currentBOffset = elapsedSec - timeline.songBStartSec;
          audioB.currentTime = Math.max(0, effectiveCueInB + currentBOffset);
          audioB.play().catch(() => {});
        } else if (!gains.isPlayingB && !audioB.paused) {
          audioB.pause();
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  // Trigger Automatic Playback on modal open, song switch, audio source resolution, or playback mode change
  useEffect(() => {
    if (!isOpen || isLoadingAudio || !songA || !songB) return;

    if (autoplayTimerRef.current) {
      clearTimeout(autoplayTimerRef.current);
    }

    autoplayTimerRef.current = setTimeout(() => {
      startPlaybackAt(0);
    }, 150);

    return () => {
      if (autoplayTimerRef.current) {
        clearTimeout(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
    };
  }, [isOpen, songA?.id, songB?.id, isLoadingAudio, effectiveAudioUrlA, effectiveAudioUrlB, playbackMode, config.style, config.fadeDurationSec, config.pauseDurationSec, autoCueEnabled]);

  const togglePlay = () => {
    if (isPlaying) {
      pausedAtRef.current = currentTime;
      stopPlayback();
    } else {
      const startAt = currentTime >= timeline.totalDurationSec ? 0 : currentTime;
      startPlaybackAt(startAt);
    }
  };

  const handleRestart = () => {
    stopPlayback();
    setCurrentTime(0);
    pausedAtRef.current = 0;
    startPlaybackAt(0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, track: 'A' | 'B') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    if (track === 'A') {
      setCustomAudioUrlA(blobUrl);
      setCustomFileNameA(file.name);
    } else {
      setCustomAudioUrlB(blobUrl);
      setCustomFileNameB(file.name);
    }
    stopPlayback();
  };

  const handleSaveCuesForSong = (track: 'A' | 'B') => {
    if (!onUpdateSong) return;
    if (track === 'A' && songA && cueAnalysisA) {
      const updated = applyDetectedCuesToSong(songA, cueAnalysisA);
      onUpdateSong(updated);
      setSavedCueSuccessA(true);
      setTimeout(() => setSavedCueSuccessA(false), 2500);
    } else if (track === 'B' && songB && cueAnalysisB) {
      const updated = applyDetectedCuesToSong(songB, cueAnalysisB);
      onUpdateSong(updated);
      setSavedCueSuccessB(true);
      setTimeout(() => setSavedCueSuccessB(false), 2500);
    }
  };

  const formatSec = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  const energyInfoA = getEnergyInfo(songA.energia ?? 10);
  const energyInfoB = getEnergyInfo(songB.energia ?? 10);

  const canGoPrev = indexA > 0;
  const canGoNext = totalItemsCount > 0 ? indexB < totalItemsCount - 1 : false;

  const currentGains = getTransitionGains(currentTime, timeline, config);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-black/80 backdrop-blur-md overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-[#16161a] border border-[#2a2a30] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-200"
        >
          {/* Compact Header */}
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#2a2a30] bg-[#1a1a20] shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#f2ca50] shrink-0">
                <Headphones className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                    Comprobar Unión y Transición
                  </h2>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    #{indexA + 1} ➔ #{indexB + 1}
                  </span>
                  <span className={`hidden sm:inline-flex px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${diagnosis.verdict.badgeClass}`}>
                    {diagnosis.verdict.badgeLabel} ({diagnosis.scorePercent}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Previous / Next navigation */}
              {onNavigateTransition && (
                <div className="flex items-center bg-[#222228] border border-[#33333e] rounded-lg p-0.5">
                  <button
                    type="button"
                    disabled={!canGoPrev}
                    onClick={() => {
                      if (canGoPrev) {
                        stopPlayback();
                        onNavigateTransition(indexA - 1, indexA);
                      }
                    }}
                    className="p-1 rounded hover:bg-[#2e2e38] text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                    title="Transición anterior en el repertorio"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono px-1.5 text-zinc-400">
                    {indexA + 1}/{totalItemsCount || indexB + 1}
                  </span>
                  <button
                    type="button"
                    disabled={!canGoNext}
                    onClick={() => {
                      if (canGoNext) {
                        stopPlayback();
                        onNavigateTransition(indexB, indexB + 1);
                      }
                    }}
                    className="p-1 rounded hover:bg-[#2e2e38] text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                    title="Siguiente transición en el repertorio"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Hidden HTML5 audio elements for real audio tracks */}
          <audio
            ref={audioRefA}
            src={effectiveAudioUrlA}
            preload="auto"
            onLoadedMetadata={(e) => {
              const dur = e.currentTarget.duration;
              if (dur && !Number.isNaN(dur) && dur > 0) setDurationA(dur);
            }}
          />
          <audio
            ref={audioRefB}
            src={effectiveAudioUrlB}
            preload="auto"
            onLoadedMetadata={(e) => {
              const dur = e.currentTarget.duration;
              if (dur && !Number.isNaN(dur) && dur > 0) setDurationB(dur);
            }}
          />

          {/* Hidden File Inputs for quick audio uploads */}
          <input
            ref={fileInputRefA}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e, 'A')}
          />
          <input
            ref={fileInputRefB}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e, 'B')}
          />

          {/* Modal Scrollable Body */}
          <div className="p-2.5 sm:p-3 space-y-2 overflow-y-auto flex-1">
            {/* Song Cards Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-11 gap-2 items-stretch">
              {/* Song A (Previous) */}
              <div
                className="md:col-span-5 p-2 rounded-xl border transition relative overflow-hidden flex flex-col justify-between"
                style={{
                  backgroundColor: currentGains.isPlayingA ? 'rgba(30,30,36,0.95)' : 'rgba(20,20,24,0.6)',
                  borderColor: currentGains.isPlayingA ? '#f2ca50' : '#2a2a30',
                  boxShadow: currentGains.isPlayingA ? '0 0 10px rgba(242,202,80,0.1)' : 'none'
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      #{indexA + 1} Anterior
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-amber-300 font-mono text-[9px] font-semibold">
                        🎼 {itemA?.tonalidadDeseada || songA.tonalidad || 'Sin tono'}
                      </span>
                      {songA.bpm && (
                        <span className="px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-sky-300 font-mono text-[9px] font-semibold">
                          🥁 {songA.bpm} BPM
                        </span>
                      )}
                      <span
                        className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full border"
                        style={{
                          backgroundColor: `${energyInfoA.hexColor}20`,
                          borderColor: `${energyInfoA.hexColor}50`,
                          color: energyInfoA.hexColor
                        }}
                      >
                        {energyInfoA.icon} {songA.energia ?? 10}/20
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-white truncate mb-1">
                    {songA.titulo}
                  </h3>

                  {/* Auto-CUE Out info for Song A */}
                  {autoCueEnabled && cueAnalysisA && (cueAnalysisA.outroSilenceSec > 0.3 || cueAnalysisA.hasApplauseOutro || songA.cueOut) && (
                    <div className="flex items-center justify-between gap-1 mb-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9px]">
                      <span className="text-amber-300 font-mono flex items-center gap-1 truncate">
                        <Scissors className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                        CUE Out: {formatSec(cueAnalysisA.cueOut)}
                        {cueAnalysisA.hasApplauseOutro && <span className="text-amber-200">👏 Aplausos fin</span>}
                        {cueAnalysisA.outroSilenceSec > 0.3 && (
                          <span className="text-zinc-400">(-{cueAnalysisA.outroSilenceSec.toFixed(1)}s)</span>
                        )}
                      </span>
                      {onUpdateSong && (
                        <button
                          type="button"
                          onClick={() => handleSaveCuesForSong('A')}
                          className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-200 transition cursor-pointer flex items-center gap-0.5 shrink-0"
                          title="Guardar punto CUE de recorte permanentemente en el repertorio"
                        >
                          {savedCueSuccessA ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : null}
                          <span>{savedCueSuccessA ? 'Guardado' : 'Guardar CUE'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Audio Source Status & Selector for Song A */}
                <div className="pt-1 border-t border-zinc-800/80 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1">
                      {audioSourceTypeA === 'maqueta' && (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Radio className="w-3 h-3 animate-pulse" />
                          Maqueta
                        </span>
                      )}
                      {audioSourceTypeA === 'custom' && (
                        <span className="text-sky-400 font-semibold flex items-center gap-1 truncate max-w-[130px]">
                          <Upload className="w-3 h-3 shrink-0" />
                          {customFileNameA || 'Local'}
                        </span>
                      )}
                      {audioSourceTypeA === 'sample' && (
                        <select
                          value={selectedSampleA.id}
                          onChange={(e) => {
                            const s = STUDIO_SAMPLE_TRACKS.find((st) => st.id === e.target.value);
                            if (s) {
                              stopPlayback();
                              setSelectedSampleA(s);
                            }
                          }}
                          className="bg-[#111116] border border-zinc-800 text-[10px] rounded p-0.5 text-amber-300 focus:outline-none max-w-[160px] cursor-pointer"
                        >
                          {STUDIO_SAMPLE_TRACKS.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.name} ({st.bpm} BPM)
                            </option>
                          ))}
                        </select>
                      )}
                      {isDetectingCuesA && (
                        <span className="text-[8px] text-zinc-400 animate-pulse">Analizando...</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRefA.current?.click()}
                      className="text-[9px] text-zinc-400 hover:text-white px-1.5 py-0.2 rounded bg-zinc-800 hover:bg-zinc-700 transition cursor-pointer shrink-0"
                      title="Subir archivo .mp3/.wav propio para probar"
                    >
                      📁 Subir
                    </button>
                  </div>

                  {/* VU Meter for Track A */}
                  <div className="w-full bg-black/50 h-1 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-75"
                      style={{ width: `${Math.min(100, liveGainA * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Center Bridge Icon */}
              <div className="md:col-span-1 flex flex-col items-center justify-center py-0.5 md:py-0">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition border ${
                    currentGains.isCrossfading
                      ? 'bg-amber-500 text-black border-amber-300 scale-110 shadow-lg shadow-amber-500/30 animate-pulse'
                      : 'bg-[#222228] text-zinc-400 border-[#33333e]'
                  }`}
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
                <span className="text-[8px] font-mono text-zinc-500 mt-0.5 uppercase font-bold text-center">
                  {config.style === 'crossfade' ? `${config.fadeDurationSec}s` : config.style === 'segue' ? '0s' : 'pausa'}
                </span>
              </div>

              {/* Song B (Next / Selected) */}
              <div
                className="md:col-span-5 p-2 rounded-xl border transition relative overflow-hidden flex flex-col justify-between"
                style={{
                  backgroundColor: currentGains.isPlayingB ? 'rgba(30,30,36,0.95)' : 'rgba(20,20,24,0.6)',
                  borderColor: currentGains.isPlayingB ? '#f2ca50' : '#2a2a30',
                  boxShadow: currentGains.isPlayingB ? '0 0 10px rgba(242,202,80,0.1)' : 'none'
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      #{indexB + 1} Siguiente
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-amber-300 font-mono text-[9px] font-semibold">
                        🎼 {itemB?.tonalidadDeseada || songB.tonalidad || 'Sin tono'}
                      </span>
                      {songB.bpm && (
                        <span className="px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-sky-300 font-mono text-[9px] font-semibold">
                          🥁 {songB.bpm} BPM
                        </span>
                      )}
                      <span
                        className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full border"
                        style={{
                          backgroundColor: `${energyInfoB.hexColor}20`,
                          borderColor: `${energyInfoB.hexColor}50`,
                          color: energyInfoB.hexColor
                        }}
                      >
                        {energyInfoB.icon} {songB.energia ?? 10}/20
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-white truncate mb-1">
                    {songB.titulo}
                  </h3>

                  {/* Auto-CUE In info for Song B */}
                  {autoCueEnabled && cueAnalysisB && (cueAnalysisB.introSilenceSec > 0.3 || cueAnalysisB.hasApplauseIntro || songB.cueIn) && (
                    <div className="flex items-center justify-between gap-1 mb-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px]">
                      <span className="text-emerald-300 font-mono flex items-center gap-1 truncate">
                        <Scissors className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                        CUE In: {formatSec(cueAnalysisB.cueIn)}
                        {cueAnalysisB.hasApplauseIntro && <span className="text-emerald-200">👏 Aplausos inicio</span>}
                        {cueAnalysisB.introSilenceSec > 0.3 && (
                          <span className="text-zinc-400">(+{cueAnalysisB.introSilenceSec.toFixed(1)}s)</span>
                        )}
                      </span>
                      {onUpdateSong && (
                        <button
                          type="button"
                          onClick={() => handleSaveCuesForSong('B')}
                          className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-200 transition cursor-pointer flex items-center gap-0.5 shrink-0"
                          title="Guardar punto CUE de recorte permanentemente en el repertorio"
                        >
                          {savedCueSuccessB ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : null}
                          <span>{savedCueSuccessB ? 'Guardado' : 'Guardar CUE'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Audio Source Status & Selector for Song B */}
                <div className="pt-1 border-t border-zinc-800/80 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1">
                      {audioSourceTypeB === 'maqueta' && (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Radio className="w-3 h-3 animate-pulse" />
                          Maqueta
                        </span>
                      )}
                      {audioSourceTypeB === 'custom' && (
                        <span className="text-sky-400 font-semibold flex items-center gap-1 truncate max-w-[130px]">
                          <Upload className="w-3 h-3 shrink-0" />
                          {customFileNameB || 'Local'}
                        </span>
                      )}
                      {audioSourceTypeB === 'sample' && (
                        <select
                          value={selectedSampleB.id}
                          onChange={(e) => {
                            const s = STUDIO_SAMPLE_TRACKS.find((st) => st.id === e.target.value);
                            if (s) {
                              stopPlayback();
                              setSelectedSampleB(s);
                            }
                          }}
                          className="bg-[#111116] border border-zinc-800 text-[10px] rounded p-0.5 text-emerald-300 focus:outline-none max-w-[160px] cursor-pointer"
                        >
                          {STUDIO_SAMPLE_TRACKS.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.name} ({st.bpm} BPM)
                            </option>
                          ))}
                        </select>
                      )}
                      {isDetectingCuesB && (
                        <span className="text-[8px] text-zinc-400 animate-pulse">Analizando...</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRefB.current?.click()}
                      className="text-[9px] text-zinc-400 hover:text-white px-1.5 py-0.2 rounded bg-zinc-800 hover:bg-zinc-700 transition cursor-pointer shrink-0"
                      title="Subir archivo .mp3/.wav propio para probar"
                    >
                      📁 Subir
                    </button>
                  </div>

                  {/* VU Meter for Track B */}
                  <div className="w-full bg-black/50 h-1 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-75"
                      style={{ width: `${Math.min(100, liveGainB * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Unified Player & Waveform Timeline */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-[#121216] border border-[#222228] space-y-1.5">
              {/* Controls & Mode Ribbon Header */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                {/* Mode Selector & Auto-CUE toggle */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="flex items-center p-0.5 bg-[#1c1c24] rounded-lg border border-[#30303c]">
                    <button
                      type="button"
                      onClick={() => {
                        stopPlayback();
                        setPlaybackMode('real');
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                        playbackMode === 'real'
                          ? 'bg-emerald-500 text-black shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Disc3 className="w-3 h-3" />
                      <span>Audio Real</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        stopPlayback();
                        setPlaybackMode('synth');
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                        playbackMode === 'synth'
                          ? 'bg-amber-400 text-black shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Music className="w-3 h-3" />
                      <span>Sinte</span>
                    </button>
                  </div>

                  {/* Auto-CUE Toggle Button */}
                  <button
                    type="button"
                    onClick={() => {
                      stopPlayback();
                      setAutoCueEnabled(!autoCueEnabled);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition border cursor-pointer ${
                      autoCueEnabled
                        ? 'bg-amber-500/15 text-[#f2ca50] border-amber-500/40 shadow-sm'
                        : 'bg-[#1c1c24] text-zinc-400 border-zinc-700 hover:text-zinc-200'
                    }`}
                    title="Auto-CUE Inteligente: Detecta y salta automáticamente los huecos de silencio y aplausos al principio y final de canciones en directo"
                  >
                    <Scissors className="w-3 h-3" />
                    <span>Auto-CUE: {autoCueEnabled ? 'ON' : 'OFF'}</span>
                  </button>
                </div>

                {/* Transition Style Selector */}
                <div className="flex items-center gap-1 bg-[#1a1a20] p-0.5 rounded-lg border border-[#2e2e38]">
                  <button
                    type="button"
                    onClick={() => {
                      stopPlayback();
                      setConfig((c) => ({ ...c, style: 'crossfade' }));
                    }}
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold transition cursor-pointer ${
                      config.style === 'crossfade'
                        ? 'bg-[#f2ca50] text-black shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Fundido ({config.fadeDurationSec}s)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopPlayback();
                      setConfig((c) => ({ ...c, style: 'segue' }));
                    }}
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold transition cursor-pointer ${
                      config.style === 'segue'
                        ? 'bg-[#f2ca50] text-black shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Corte (0s)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopPlayback();
                      setConfig((c) => ({ ...c, style: 'pause' }));
                    }}
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold transition cursor-pointer ${
                      config.style === 'pause'
                        ? 'bg-[#f2ca50] text-black shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Pausa ({config.pauseDurationSec}s)
                  </button>

                  {/* Seconds selector for crossfade */}
                  {config.style === 'crossfade' && (
                    <div className="flex items-center gap-0.5 pl-1 border-l border-zinc-700">
                      {[2, 3, 5, 8].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => {
                            stopPlayback();
                            setConfig((c) => ({ ...c, fadeDurationSec: sec }));
                          }}
                          className={`px-1 py-0.2 rounded font-mono text-[9px] transition cursor-pointer ${
                            config.fadeDurationSec === sec
                              ? 'bg-amber-500/30 text-[#f2ca50] font-bold'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Visual Multi-Track Waveform Timeline with Scrubbing */}
              <div
                className="relative h-7 bg-black/60 rounded-lg border border-zinc-800 cursor-pointer overflow-hidden p-0.5 select-none"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = (e.clientX - rect.left) / rect.width;
                  handleSeek(ratio * timeline.totalDurationSec);
                }}
              >
                {/* Track A segment */}
                <div
                  className="absolute top-0.5 bottom-0.5 left-0.5 rounded bg-amber-500/20 border border-amber-500/40 flex items-center px-1.5"
                  style={{
                    width: `${(timeline.songAEndSec / timeline.totalDurationSec) * 100}%`
                  }}
                >
                  <span className="text-[8px] font-mono font-bold text-amber-300 truncate flex items-center gap-0.5">
                    {autoCueEnabled && cueAnalysisA?.outroSilenceSec ? <Scissors className="w-2 h-2 text-amber-400 shrink-0" /> : null}
                    Fin #{indexA + 1}
                  </span>
                </div>

                {/* Track B segment */}
                <div
                  className="absolute top-0.5 bottom-0.5 right-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-end px-1.5"
                  style={{
                    left: `${(timeline.songBStartSec / timeline.totalDurationSec) * 100}%`
                  }}
                >
                  <span className="text-[8px] font-mono font-bold text-emerald-300 truncate flex items-center gap-0.5">
                    {autoCueEnabled && cueAnalysisB?.introSilenceSec ? <Scissors className="w-2 h-2 text-emerald-400 shrink-0" /> : null}
                    Inicio #{indexB + 1}
                  </span>
                </div>

                {/* Crossfade overlap highlight */}
                {config.style === 'crossfade' && (
                  <div
                    className="absolute top-0.5 bottom-0.5 bg-gradient-to-r from-amber-500/30 to-emerald-500/30 border-x border-amber-400/80 pointer-events-none flex items-center justify-center text-[8px] font-mono font-bold text-white/90"
                    style={{
                      left: `${(timeline.crossfadeStartSec / timeline.totalDurationSec) * 100}%`,
                      width: `${((timeline.crossfadeEndSec - timeline.crossfadeStartSec) / timeline.totalDurationSec) * 100}%`
                    }}
                  >
                    ⚡ Fade
                  </div>
                )}

                {/* Playhead Indicator */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_#fff] z-20 pointer-events-none transition-all duration-75"
                  style={{
                    left: `${(currentTime / timeline.totalDurationSec) * 100}%`
                  }}
                >
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow" />
                </div>
              </div>

              {/* Player Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-7 h-7 rounded-lg bg-[#f2ca50] hover:bg-[#ffe07a] text-black font-bold flex items-center justify-center shadow transition active:scale-95 cursor-pointer"
                    title={isPlaying ? 'Pausar comprobación' : 'Reproducir unión'}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5 fill-black" /> : <Play className="w-3.5 h-3.5 fill-black ml-0.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleRestart}
                    className="p-1 rounded-lg bg-[#222228] hover:bg-[#2d2d36] text-zinc-300 border border-[#33333e] transition cursor-pointer"
                    title="Rebobinar al inicio del enlace"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>

                  {/* Volume Slider */}
                  <div className="flex items-center gap-1 pl-1">
                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      className="text-zinc-400 hover:text-white transition cursor-pointer"
                    >
                      {isMuted || volume === 0 ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setVolume(val);
                        setIsMuted(false);
                        if (syntheticControllerRef.current) {
                          syntheticControllerRef.current.setVolume(val);
                        }
                      }}
                      className="w-14 accent-[#f2ca50] cursor-pointer h-1"
                    />
                  </div>
                </div>

                {/* Progress Time & Status */}
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-zinc-300 font-bold bg-[#1a1a22] px-1.5 py-0.5 rounded text-[10px] border border-zinc-800">
                    ⏱️ {currentTime.toFixed(1)}s / {timeline.totalDurationSec.toFixed(1)}s
                  </span>
                  {isPlaying && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 animate-pulse">
                      <span className="w-1 h-1 rounded-full bg-emerald-400" />
                      Sonando
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Smart Tabbed Musical Intelligence Panel */}
            <div className="rounded-xl bg-[#1a1a22] border border-[#2a2a34] overflow-hidden">
              {/* Tab Navigation Ribbon & Verdict Summary */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 px-2.5 py-1.5 border-b border-zinc-800 bg-[#16161d]">
                {/* Tabs */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('pros_cons')}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                      activeTab === 'pros_cons'
                        ? 'bg-zinc-800 text-amber-300 border border-amber-500/30'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span>Pros y Contras</span>
                    <span className="text-[9px] font-mono px-1 rounded bg-black/40 text-zinc-300">
                      +{diagnosis.porQueSi.length} / -{diagnosis.porQueNo.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('metrics')}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                      activeTab === 'metrics'
                        ? 'bg-zinc-800 text-amber-300 border border-amber-500/30'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span>Métricas Armónicas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('stagecraft')}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                      activeTab === 'stagecraft'
                        ? 'bg-zinc-800 text-amber-300 border border-amber-500/30'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span>Stagecraft ({diagnosis.stageRecommendations.length})</span>
                  </button>
                </div>

                {/* Right Summary Verdict */}
                <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#f2ca50]" />
                  <span>Recomendado: <strong className="text-white uppercase font-bold">{diagnosis.recommendedStyle}</strong></span>
                </div>
              </div>

              {/* Tab Content Container */}
              <div className="p-2 max-h-32 sm:max-h-28 overflow-y-auto">
                {activeTab === 'pros_cons' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {/* POR QUÉ SÍ */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
                        <ThumbsUp className="w-2.5 h-2.5" />
                        <span>Por qué SÍ funciona ({diagnosis.porQueSi.length})</span>
                      </div>
                      <div className="space-y-1">
                        {diagnosis.porQueSi.map((pro) => (
                          <div
                            key={pro.id}
                            className="p-1.5 rounded-lg bg-emerald-950/15 border border-emerald-500/20 text-[10px] space-y-0.5"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-emerald-300 flex items-center gap-1 truncate">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                                {pro.title}
                              </span>
                              <span className="text-[8px] uppercase px-1 rounded font-mono bg-emerald-500/20 text-emerald-300 shrink-0">
                                {pro.category}
                              </span>
                            </div>
                            <p className="text-zinc-300 leading-tight pl-3.5 text-[9px]">
                              {pro.detail}
                            </p>
                          </div>
                        ))}
                        {diagnosis.porQueSi.length === 0 && (
                          <div className="p-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800 text-[10px] text-zinc-400 text-center">
                            Sin factores musicales especialmente favorables.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* POR QUÉ NO / CRÍTICA */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-rose-400 uppercase tracking-wide">
                        <ThumbsDown className="w-2.5 h-2.5" />
                        <span>Puntos a vigilar ({diagnosis.porQueNo.length})</span>
                      </div>
                      <div className="space-y-1">
                        {diagnosis.porQueNo.map((con) => (
                          <div
                            key={con.id}
                            className={`p-1.5 rounded-lg border text-[10px] space-y-0.5 ${
                              con.severity === 'critico'
                                ? 'bg-rose-950/20 border-rose-500/40'
                                : con.severity === 'aviso'
                                ? 'bg-amber-950/15 border-amber-500/30'
                                : 'bg-zinc-900/60 border-zinc-800'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className={`font-bold flex items-center gap-1 truncate ${
                                con.severity === 'critico' ? 'text-rose-300' : con.severity === 'aviso' ? 'text-amber-300' : 'text-zinc-300'
                              }`}>
                                <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                {con.title}
                              </span>
                              <span className="text-[8px] uppercase px-1 rounded font-mono bg-black/40 text-zinc-300 shrink-0">
                                {con.severity}
                              </span>
                            </div>
                            <p className="text-zinc-300 leading-tight pl-3.5 text-[9px]">
                              {con.detail}
                            </p>
                          </div>
                        ))}
                        {diagnosis.porQueNo.length === 0 && (
                          <div className="p-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-center text-[10px] text-emerald-300 flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Enlace limpio sin objeciones.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'metrics' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
                    <div className="p-2 rounded-lg bg-[#15151b] border border-zinc-800 space-y-0.5">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300">
                        <Music className="w-3 h-3" />
                        <span>Armonía & Tono</span>
                      </div>
                      <p className="text-[10px] text-zinc-300 leading-tight">
                        {diagnosis.harmonyDescription}
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-[#15151b] border border-zinc-800 space-y-0.5">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-sky-300">
                        <Zap className="w-3 h-3" />
                        <span>Salto BPM</span>
                      </div>
                      <p className="text-[10px] text-zinc-300 leading-tight">
                        {diagnosis.bpmDescription}
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-[#15151b] border border-zinc-800 space-y-0.5">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-rose-300">
                        <Flame className="w-3 h-3" />
                        <span>Energía Escénica</span>
                      </div>
                      <p className="text-[10px] text-zinc-300 leading-tight">
                        {diagnosis.energyDescription}
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'stagecraft' && (
                  <div className="space-y-1">
                    {diagnosis.stageRecommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 bg-black/30 p-1.5 rounded-lg border border-amber-500/20 text-[10px]">
                        <Compass className="w-3 h-3 text-[#f2ca50] shrink-0 mt-0.5" />
                        <p className="text-[10px] leading-tight text-zinc-300">
                          {rec}
                        </p>
                      </div>
                    ))}
                    {diagnosis.stageRecommendations.length === 0 && (
                      <div className="text-[10px] text-zinc-400 text-center py-2">
                        Sin sugerencias adicionales de escenario para este enlace.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fixed Smart Actions Footer */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 px-3.5 py-2 border-t border-[#2a2a30] bg-[#16161a] shrink-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {onInsertInterludio && itemA && (
                <button
                  type="button"
                  onClick={() => {
                    stopPlayback();
                    onInsertInterludio(itemA.id);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <MessageSquarePlus className="w-3 h-3" />
                  <span>Insertar Chapa</span>
                </button>
              )}

              {onSwapSongs && (
                <button
                  type="button"
                  onClick={() => {
                    stopPlayback();
                    onSwapSongs(indexA, indexB);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <ArrowLeftRight className="w-3 h-3" />
                  <span>Invertir (A ⇄ B)</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-bold transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
