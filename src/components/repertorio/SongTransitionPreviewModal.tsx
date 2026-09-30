import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sliders,
  ArrowRight,
  ArrowLeftRight,
  MessageSquarePlus,
  Headphones,
  Music,
  Zap,
  Flame,
  Radio,
  Clock,
  ShieldCheck,
  X,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Compass,
  ShieldAlert,
  Info,
  HelpCircle,
  Upload,
  Disc3,
  Layers,
  Scissors,
  Check,
} from "lucide-react";
import { Song, SetlistItem } from "../../types";
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
  StudioSampleTrack,
} from "../../utils/transitionAudioEngine";
import { resolveAudioUrl } from "../../utils/audioStorage";
import {
  playSyntheticTransition,
  SyntheticPlayerController,
} from "../../utils/transitionSynthesizer";
import { getEnergyInfo } from "../../utils/energyPacingUtils";
import {
  detectAudioCuesFromUrl,
  applyDetectedCuesToSong,
  AudioCueAnalysis,
} from "../../utils/audioCueDetector";
import { PublicoSilhouette } from "../ui/PublicoSilhouette";
import { ShowIcon } from '../ui/ShowIcon';

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
  onUpdateSong,
}: SongTransitionPreviewModalProps) {
  if (!isOpen || !songA || !songB) return null;

  // Diagnosis
  const diagnosis = useMemo(
    () => diagnoseTransition(songA, songB),
    [songA, songB],
  );

  // Transition Config
  const [config, setConfig] = useState<TransitionConfig>({
    ...DEFAULT_TRANSITION_CONFIG,
    style: diagnosis.recommendedStyle,
  });

  const timeline = useMemo(() => computeTransitionTimeline(config), [config]);

  // Audio Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackMode, setPlaybackMode] = useState<"real" | "synth">("real");

  // Auto-CUE / Salto Inteligente de Silencios y Aplausos
  const [autoCueEnabled, setAutoCueEnabled] = useState<boolean>(true);
  const [cueAnalysisA, setCueAnalysisA] = useState<AudioCueAnalysis | null>(
    null,
  );
  const [cueAnalysisB, setCueAnalysisB] = useState<AudioCueAnalysis | null>(
    null,
  );
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
  const [selectedSampleA, setSelectedSampleA] = useState<StudioSampleTrack>(
    () => getSampleTrackForSong(songA, 0),
  );
  const [selectedSampleB, setSelectedSampleB] = useState<StudioSampleTrack>(
    () => getSampleTrackForSong(songB, 1),
  );

  // Resolved base audio URLs from song objects (handles IndexedDB/Cloud URLs)
  const [resolvedBaseUrlA, setResolvedBaseUrlA] = useState<string>("");
  const [resolvedBaseUrlB, setResolvedBaseUrlB] = useState<string>("");
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
  const [activeTab, setActiveTab] = useState<
    "pros_cons" | "metrics" | "stagecraft"
  >("pros_cons");

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
        console.warn("Error resolving song audio URL:", err);
      }

      if (isMounted) {
        setResolvedBaseUrlA(finalA || "");
        setResolvedBaseUrlB(finalB || "");
        setSelectedSampleA(getSampleTrackForSong(songA, 0));
        setSelectedSampleB(getSampleTrackForSong(songB, 1));
        setCustomAudioUrlA(null);
        setCustomAudioUrlB(null);
        setCustomFileNameA(null);
        setCustomFileNameB(null);
        setIsLoadingAudio(false);

        // Pre-cargar cues existentes si la canción ya los tenía guardados
        if (
          typeof songA?.cueIn === "number" ||
          typeof songA?.cueOut === "number"
        ) {
          setCueAnalysisA({
            cueIn: songA.cueIn || 0,
            cueOut: songA.cueOut || songA.duracionSegundos || 180,
            duration: songA.duracionSegundos || 180,
            trimmedDuration:
              (songA.cueOut || songA.duracionSegundos || 180) -
              (songA.cueIn || 0),
            introSilenceSec: songA.cueIn || 0,
            outroSilenceSec: Math.max(
              0,
              (songA.duracionSegundos || 180) -
                (songA.cueOut || songA.duracionSegundos || 180),
            ),
            hasApplauseIntro: songA.applauseDetected?.intro ?? false,
            hasApplauseOutro: songA.applauseDetected?.outro ?? false,
            confidence: 0.95,
            waveformPeaks: [],
          });
        } else {
          setCueAnalysisA(null);
        }

        if (
          typeof songB?.cueIn === "number" ||
          typeof songB?.cueOut === "number"
        ) {
          setCueAnalysisB({
            cueIn: songB.cueIn || 0,
            cueOut: songB.cueOut || songB.duracionSegundos || 180,
            duration: songB.duracionSegundos || 180,
            trimmedDuration:
              (songB.cueOut || songB.duracionSegundos || 180) -
              (songB.cueIn || 0),
            introSilenceSec: songB.cueIn || 0,
            outroSilenceSec: Math.max(
              0,
              (songB.duracionSegundos || 180) -
                (songB.cueOut || songB.duracionSegundos || 180),
            ),
            hasApplauseIntro: songB.applauseDetected?.intro ?? false,
            hasApplauseOutro: songB.applauseDetected?.outro ?? false,
            confidence: 0.95,
            waveformPeaks: [],
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
  const effectiveAudioUrlA =
    customAudioUrlA || resolvedBaseUrlA || selectedSampleA.url;
  const effectiveAudioUrlB =
    customAudioUrlB || resolvedBaseUrlB || selectedSampleB.url;

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
        console.warn("No se pudieron auto-detectar CUEs de Track A:", err);
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
        console.warn("No se pudieron auto-detectar CUEs de Track B:", err);
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
    ? "custom"
    : resolvedBaseUrlA
      ? "maqueta"
      : "sample";

  const audioSourceTypeB = customAudioUrlB
    ? "custom"
    : resolvedBaseUrlB
      ? "maqueta"
      : "sample";

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
  }, [
    songA?.id,
    songB?.id,
    config.style,
    effectiveAudioUrlA,
    effectiveAudioUrlB,
  ]);

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

    if (playbackMode === "synth") {
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
        },
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
    const durA =
      audioA.duration && !Number.isNaN(audioA.duration) && audioA.duration > 5
        ? audioA.duration
        : durationA;
    const durB =
      audioB.duration && !Number.isNaN(audioB.duration) && audioB.duration > 5
        ? audioB.duration
        : durationB;

    const effectiveCueOutA =
      autoCueEnabled && cueAnalysisA?.cueOut && cueAnalysisA.cueOut > 0
        ? Math.min(durA, cueAnalysisA.cueOut)
        : autoCueEnabled && songA.cueOut
          ? Math.min(durA, songA.cueOut)
          : durA;

    const effectiveCueInB =
      autoCueEnabled && cueAnalysisB?.cueIn && cueAnalysisB.cueIn >= 0
        ? Math.min(durB - 1, cueAnalysisB.cueIn)
        : autoCueEnabled && typeof songB.cueIn === "number"
          ? Math.min(durB - 1, songB.cueIn)
          : 0;

    const songAStartInAudio = Math.max(
      0,
      effectiveCueOutA - config.tailDurationSec,
    );
    const audioACurrentTime = songAStartInAudio + startOffsetSec;

    const initialGains = getTransitionGains(startOffsetSec, timeline, config);

    if (audioACurrentTime < effectiveCueOutA && initialGains.isPlayingA) {
      audioA.currentTime = audioACurrentTime;
      audioA.volume = Math.max(
        0,
        Math.min(1, initialGains.gainA * effectiveVolume),
      );
      audioA.play().catch(() => {});
    } else {
      audioA.pause();
    }

    // Song B starts at effectiveCueInB + offset
    const audioBOffset = startOffsetSec - timeline.songBStartSec;
    if (audioBOffset >= 0 && initialGains.isPlayingB) {
      audioB.currentTime = Math.max(0, effectiveCueInB + audioBOffset);
      audioB.volume = Math.max(
        0,
        Math.min(1, initialGains.gainB * effectiveVolume),
      );
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
        } else if (
          gains.isPlayingA &&
          audioA.paused &&
          elapsedSec < timeline.songAEndSec &&
          aPos < effectiveCueOutA
        ) {
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
  }, [
    isOpen,
    songA?.id,
    songB?.id,
    isLoadingAudio,
    effectiveAudioUrlA,
    effectiveAudioUrlB,
    playbackMode,
    config.style,
    config.fadeDurationSec,
    config.pauseDurationSec,
    autoCueEnabled,
  ]);

  const togglePlay = () => {
    if (isPlaying) {
      pausedAtRef.current = currentTime;
      stopPlayback();
    } else {
      const startAt =
        currentTime >= timeline.totalDurationSec ? 0 : currentTime;
      startPlaybackAt(startAt);
    }
  };

  const handleRestart = () => {
    stopPlayback();
    setCurrentTime(0);
    pausedAtRef.current = 0;
    startPlaybackAt(0);
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    track: "A" | "B",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    if (track === "A") {
      setCustomAudioUrlA(blobUrl);
      setCustomFileNameA(file.name);
    } else {
      setCustomAudioUrlB(blobUrl);
      setCustomFileNameB(file.name);
    }
    stopPlayback();
  };

  const handleSaveCuesForSong = (track: "A" | "B") => {
    if (!onUpdateSong) return;
    if (track === "A" && songA && cueAnalysisA) {
      const updated = applyDetectedCuesToSong(songA, cueAnalysisA);
      onUpdateSong(updated);
      setSavedCueSuccessA(true);
      setTimeout(() => setSavedCueSuccessA(false), 2500);
    } else if (track === "B" && songB && cueAnalysisB) {
      const updated = applyDetectedCuesToSong(songB, cueAnalysisB);
      onUpdateSong(updated);
      setSavedCueSuccessB(true);
      setTimeout(() => setSavedCueSuccessB(false), 2500);
    }
  };

  const formatSec = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-3 bg-[var(--scrim)]/80 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--surface)] rounded-[var(--r-l)] overflow-hidden flex flex-col text-[var(--ink)]"
        >
          {/* Compact Header */}
          <div className="flex items-center justify-between px-3.5 py-2 bg-[var(--sunken)] shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[var(--r-s)] bg-[var(--acc)]/10 flex items-center justify-center text-[var(--acc)] shrink-0">
                <Headphones className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xs sm:text-sm font-bold text-[var(--ink)] tracking-tight">
                    Comprobar unión y transición
                  </h2>
                  <span className="px-1.5 py-0.2 rounded-[var(--r-pill)] text-micro font-sans font-bold bg-[var(--acc)]/10 text-[var(--acc)]/70">
                    #{indexA + 1} ➔ #{indexB + 1}
                  </span>
                  <span
                    className={`hidden sm:inline-flex px-1.5 py-0.2 rounded-[var(--r-pill)] text-micro font-bold ${diagnosis.verdict.badgeClass}`}
                  >
                    {diagnosis.verdict.badgeLabel} ({diagnosis.scorePercent}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Previous / Next navigation */}
              {onNavigateTransition && (
                <div className="flex items-center bg-[var(--surface)] rounded-[var(--r-s)] p-0.5">
                  <button
                    type="button"
                    disabled={!canGoPrev}
                    onClick={() => {
                      if (canGoPrev) {
                        stopPlayback();
                        onNavigateTransition(indexA - 1, indexA);
                      }
                    }}
                    className="p-1 rounded hover:bg-[var(--surface)] text-[var(--ink-2)] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                    title="Transición anterior en el repertorio"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-micro font-sans px-1.5 text-[var(--ink-2)]">
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
                    className="p-1 rounded hover:bg-[var(--surface)] text-[var(--ink-2)] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                    title="Siguiente transición en el repertorio"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-[var(--r-pill)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)] transition cursor-pointer"
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
            onChange={(e) => handleFileUpload(e, "A")}
          />
          <input
            ref={fileInputRefB}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e, "B")}
          />

          {/* Modal Scrollable Body */}
          <div className="p-2.5 sm:p-3 space-y-2 overflow-y-auto flex-1">
            {/* Song Cards Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-11 gap-2 items-stretch">
              {/* Song A (Previous) */}
              <div
                className="md:col-span-5 p-2 rounded-[var(--r-m)] transition relative overflow-hidden flex flex-col justify-between"
                style={{
                  backgroundColor: currentGains.isPlayingA
                    ? "var(--bg)"
                    : "var(--bg)",
                  borderColor: currentGains.isPlayingA
                    ? "var(--acc)"
                    : "var(--sunken)",
                  boxShadow: currentGains.isPlayingA
                    ? "0 0 10px var(--acc-glow)"
                    : "none",
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-micro font-bold text-[var(--ink-2)] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-[var(--r-pill)] bg-[var(--acc)]/60" />
                      #{indexA + 1} Anterior
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.2 rounded bg-[var(--sunken)] text-[var(--acc)]/70 font-sans text-micro font-semibold">
                        <ShowIcon inline emoji="🎼" />{" "}
                        {itemA?.tonalidadDeseada ||
                          songA.tonalidad ||
                          "Sin tono"}
                      </span>
                      {songA.bpm && (
                        <span className="px-1.5 py-0.2 rounded bg-[var(--sunken)] text-[var(--ink-2)] font-sans text-micro font-semibold">
                          <ShowIcon inline emoji="🥁" />{songA.bpm} BPM
                        </span>
                      )}
                      <span
                        className="text-micro font-sans font-bold px-1.5 py-0.2 rounded-[var(--r-pill)]"
                        style={{
                          backgroundColor: `${energyInfoA.hexColor}20`,
                          borderColor: `${energyInfoA.hexColor}50`,
                          color: energyInfoA.hexColor,
                        }}
                      >
                        <ShowIcon inline emoji={energyInfoA.icon} />{" "}
                        {Math.round((songA.energia ?? 10) / 2)}/10
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-[var(--ink)] truncate mb-1">
                    {songA.titulo}
                  </h3>

                  {/* Auto-CUE Out info for Song A */}
                  {autoCueEnabled &&
                    cueAnalysisA &&
                    (cueAnalysisA.outroSilenceSec > 0.3 ||
                      cueAnalysisA.hasApplauseOutro ||
                      songA.cueOut) && (
                      <div className="flex items-center justify-between gap-1 mb-1 px-1.5 py-0.5 rounded bg-[var(--acc)]/10 text-micro">
                        <span className="text-[var(--acc)]/70 font-sans flex items-center gap-1 truncate">
                          <Scissors className="w-2.5 h-2.5 text-[var(--acc)] shrink-0" />
                          CUE Out: {formatSec(cueAnalysisA.cueOut)}
                          {cueAnalysisA.hasApplauseOutro && (
                            <span className="text-[var(--ink)]">
                              <ShowIcon inline emoji="👏" />Aplausos fin
                            </span>
                          )}
                          {cueAnalysisA.outroSilenceSec > 0.3 && (
                            <span className="text-[var(--ink-2)]">
                              (-{cueAnalysisA.outroSilenceSec.toFixed(1)}s)
                            </span>
                          )}
                        </span>
                        {onUpdateSong && (
                          <button
                            type="button"
                            onClick={() => handleSaveCuesForSong("A")}
                            className="text-micro font-bold px-1.5 py-0.2 rounded bg-[var(--acc)]/20 hover:bg-[var(--acc)]/40 text-[var(--ink)] transition cursor-pointer flex items-center gap-0.5 shrink-0"
                            title="Guardar punto CUE de recorte permanentemente en el repertorio"
                          >
                            {savedCueSuccessA ? (
                              <Check className="w-2.5 h-2.5 text-[var(--ok)]" />
                            ) : null}
                            <span>
                              {savedCueSuccessA ? "Guardado" : "Guardar CUE"}
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                </div>

                {/* Audio Source Status & Selector for Song A */}
                <div className="pt-1800/80 space-y-1">
                  <div className="flex items-center justify-between text-micro">
                    <div className="flex items-center gap-1">
                      {audioSourceTypeA === "maqueta" && (
                        <span className="text-[var(--ok)] font-semibold flex items-center gap-1">
                          <Radio className="w-3 h-3" />
                          Maqueta
                        </span>
                      )}
                      {audioSourceTypeA === "custom" && (
                        <span className="text-[var(--ink-2)] font-semibold flex items-center gap-1 truncate max-w-[130px]">
                          <Upload className="w-3 h-3 shrink-0" />
                          {customFileNameA || "Local"}
                        </span>
                      )}
                      {audioSourceTypeA === "sample" && (
                        <select
                          value={selectedSampleA.id}
                          onChange={(e) => {
                            const s = STUDIO_SAMPLE_TRACKS.find(
                              (st) => st.id === e.target.value,
                            );
                            if (s) {
                              stopPlayback();
                              setSelectedSampleA(s);
                            }
                          }}
                          className="bg-[var(--sunken)] text-micro rounded p-0.5 text-[var(--acc)]/70 focus:outline-none max-w-[160px] cursor-pointer"
                        >
                          {STUDIO_SAMPLE_TRACKS.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.name} ({st.bpm} BPM)
                            </option>
                          ))}
                        </select>
                      )}
                      {isDetectingCuesA && (
                        <span className="text-micro text-[var(--ink-2)]">
                          Analizando…
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRefA.current?.click()}
                      className="text-micro text-[var(--ink-2)] hover:text-[var(--ink)] px-1.5 py-0.2 rounded bg-[var(--sunken)] hover:bg-[var(--ink-3)]/60 transition cursor-pointer shrink-0"
                      title="Subir archivo .mp3/.wav propio para probar"
                    >
                      <ShowIcon inline emoji="📁" />Subir
                    </button>
                  </div>

                  {/* VU Meter for Track A */}
                  <div className="w-full bg-[var(--sunken)] h-1 rounded-[var(--r-pill)] overflow-hidden800">
                    <div
                      className="h-full bg-[var(--acc)]  transition-ui duration-75"
                      style={{ width: `${Math.min(100, liveGainA * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Center Bridge Icon */}
              <div className="md:col-span-1 flex flex-col items-center justify-center py-0.5 md:py-0">
                <div
                  className={`w-7 h-7 rounded-[var(--r-pill)] flex items-center justify-center transition ${
                    currentGains.isCrossfading
                      ? "bg-[var(--acc)] text-[var(--on-acc)] scale-110"
                      : "bg-[var(--sunken)] text-[var(--ink-2)]"
                  }`}
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
                <span className="text-micro font-sans text-[var(--ink-2)] mt-0.5 font-bold text-center">
                  {config.style === "crossfade"
                    ? `${config.fadeDurationSec}s`
                    : config.style === "segue"
                      ? "0s"
                      : "pausa"}
                </span>
              </div>

              {/* Song B (Next / Selected) */}
              <div
                className="md:col-span-5 p-2 rounded-[var(--r-m)] transition relative overflow-hidden flex flex-col justify-between"
                style={{
                  backgroundColor: currentGains.isPlayingB
                    ? "var(--bg)"
                    : "var(--bg)",
                  borderColor: currentGains.isPlayingB
                    ? "var(--acc)"
                    : "var(--sunken)",
                  boxShadow: currentGains.isPlayingB
                    ? "0 0 10px var(--acc-glow)"
                    : "none",
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-micro font-bold text-[var(--ink-2)] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-[var(--r-pill)] bg-[var(--ok)]" />
                      #{indexB + 1} Siguiente
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.2 rounded bg-[var(--sunken)] text-[var(--acc)]/70 font-sans text-micro font-semibold">
                        <ShowIcon inline emoji="🎼" />{" "}
                        {itemB?.tonalidadDeseada ||
                          songB.tonalidad ||
                          "Sin tono"}
                      </span>
                      {songB.bpm && (
                        <span className="px-1.5 py-0.2 rounded bg-[var(--sunken)] text-[var(--ink-2)] font-sans text-micro font-semibold">
                          <ShowIcon inline emoji="🥁" />{songB.bpm} BPM
                        </span>
                      )}
                      <span
                        className="text-micro font-sans font-bold px-1.5 py-0.2 rounded-[var(--r-pill)]"
                        style={{
                          backgroundColor: `${energyInfoB.hexColor}20`,
                          borderColor: `${energyInfoB.hexColor}50`,
                          color: energyInfoB.hexColor,
                        }}
                      >
                        <ShowIcon inline emoji={energyInfoB.icon} />{" "}
                        {Math.round((songB.energia ?? 10) / 2)}/10
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-[var(--ink)] truncate mb-1">
                    {songB.titulo}
                  </h3>

                  {/* Auto-CUE In info for Song B */}
                  {autoCueEnabled &&
                    cueAnalysisB &&
                    (cueAnalysisB.introSilenceSec > 0.3 ||
                      cueAnalysisB.hasApplauseIntro ||
                      songB.cueIn) && (
                      <div className="flex items-center justify-between gap-1 mb-1 px-1.5 py-0.5 rounded bg-[var(--ok)]/10 text-micro">
                        <span className="text-[var(--ink-2)] font-sans flex items-center gap-1 truncate">
                          <Scissors className="w-2.5 h-2.5 text-[var(--ok)] shrink-0" />
                          CUE In: {formatSec(cueAnalysisB.cueIn)}
                          {cueAnalysisB.hasApplauseIntro && (
                            <span className="text-[var(--ink)]">
                              <ShowIcon inline emoji="👏" />Aplausos inicio
                            </span>
                          )}
                          {cueAnalysisB.introSilenceSec > 0.3 && (
                            <span className="text-[var(--ink-2)]">
                              (+{cueAnalysisB.introSilenceSec.toFixed(1)}s)
                            </span>
                          )}
                        </span>
                        {onUpdateSong && (
                          <button
                            type="button"
                            onClick={() => handleSaveCuesForSong("B")}
                            className="text-micro font-bold px-1.5 py-0.2 rounded bg-[var(--ok)]/20 hover:bg-[var(--ok)]/40 text-[var(--ink)] transition cursor-pointer flex items-center gap-0.5 shrink-0"
                            title="Guardar punto CUE de recorte permanentemente en el repertorio"
                          >
                            {savedCueSuccessB ? (
                              <Check className="w-2.5 h-2.5 text-[var(--ok)]" />
                            ) : null}
                            <span>
                              {savedCueSuccessB ? "Guardado" : "Guardar CUE"}
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                </div>

                {/* Audio Source Status & Selector for Song B */}
                <div className="pt-1800/80 space-y-1">
                  <div className="flex items-center justify-between text-micro">
                    <div className="flex items-center gap-1">
                      {audioSourceTypeB === "maqueta" && (
                        <span className="text-[var(--ok)] font-semibold flex items-center gap-1">
                          <Radio className="w-3 h-3" />
                          Maqueta
                        </span>
                      )}
                      {audioSourceTypeB === "custom" && (
                        <span className="text-[var(--ink-2)] font-semibold flex items-center gap-1 truncate max-w-[130px]">
                          <Upload className="w-3 h-3 shrink-0" />
                          {customFileNameB || "Local"}
                        </span>
                      )}
                      {audioSourceTypeB === "sample" && (
                        <select
                          value={selectedSampleB.id}
                          onChange={(e) => {
                            const s = STUDIO_SAMPLE_TRACKS.find(
                              (st) => st.id === e.target.value,
                            );
                            if (s) {
                              stopPlayback();
                              setSelectedSampleB(s);
                            }
                          }}
                          className="bg-[var(--sunken)] text-micro rounded p-0.5 text-[var(--ink-2)] focus:outline-none max-w-[160px] cursor-pointer"
                        >
                          {STUDIO_SAMPLE_TRACKS.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.name} ({st.bpm} BPM)
                            </option>
                          ))}
                        </select>
                      )}
                      {isDetectingCuesB && (
                        <span className="text-micro text-[var(--ink-2)]">
                          Analizando…
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRefB.current?.click()}
                      className="text-micro text-[var(--ink-2)] hover:text-[var(--ink)] px-1.5 py-0.2 rounded bg-[var(--sunken)] hover:bg-[var(--ink-3)]/60 transition cursor-pointer shrink-0"
                      title="Subir archivo .mp3/.wav propio para probar"
                    >
                      <ShowIcon inline emoji="📁" />Subir
                    </button>
                  </div>

                  {/* VU Meter for Track B */}
                  <div className="w-full bg-[var(--sunken)] h-1 rounded-[var(--r-pill)] overflow-hidden800">
                    <div
                      className="h-full bg-[var(--ok)]  transition-ui duration-75"
                      style={{ width: `${Math.min(100, liveGainB * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Unified Player & Waveform Timeline */}
            <div className="p-2 sm:p-2.5 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-1.5">
              {/* Controls & Mode Ribbon Header */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                {/* Mode Selector & Auto-CUE toggle */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="flex items-center p-0.5 bg-[var(--surface)] rounded-[var(--r-s)]">
                    <button
                      type="button"
                      onClick={() => {
                        stopPlayback();
                        setPlaybackMode("real");
                      }}
                      className={`px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-bold flex items-center gap-1 transition cursor-pointer ${
                        playbackMode === "real"
                          ? "bg-[var(--ok)] text-[var(--on-ok)]"
                          : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                      }`}
                    >
                      <Disc3 className="w-3 h-3" />
                      <span>Audio real</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        stopPlayback();
                        setPlaybackMode("synth");
                      }}
                      className={`px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-bold flex items-center gap-1 transition cursor-pointer ${
                        playbackMode === "synth"
                          ? "bg-[var(--acc)]/60 text-[var(--on-acc)]"
                          : "text-[var(--ink-2)] hover:text-[var(--ink)]"
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
                    className={`px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-bold flex items-center gap-1 transition cursor-pointer ${
                      autoCueEnabled
                        ? "bg-[var(--acc)]/15 text-[var(--acc)] "
                        : "bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)]"
                    }`}
                    title="Auto-CUE Inteligente: Detecta y salta automáticamente los huecos de silencio y aplausos al principio y final de canciones en directo"
                  >
                    <Scissors className="w-3 h-3" />
                    <span>Auto-CUE: {autoCueEnabled ? "ON" : "OFF"}</span>
                  </button>
                </div>

                {/* Transition Style Selector */}
                <div className="flex items-center gap-1 bg-[var(--surface)] p-0.5 rounded-[var(--r-s)]">
                  <button
                    type="button"
                    onClick={() => {
                      stopPlayback();
                      setConfig((c) => ({ ...c, style: "crossfade" }));
                    }}
                    className={`px-1.5 py-0.5 rounded-[var(--r-pill)] text-micro font-semibold transition cursor-pointer ${
                      config.style === "crossfade"
                        ? "bg-[var(--acc)] text-[var(--on-acc)]"
                        : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                    }`}
                  >
                    Fundido ({config.fadeDurationSec}s)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopPlayback();
                      setConfig((c) => ({ ...c, style: "segue" }));
                    }}
                    className={`px-1.5 py-0.5 rounded-[var(--r-pill)] text-micro font-semibold transition cursor-pointer ${
                      config.style === "segue"
                        ? "bg-[var(--acc)] text-[var(--on-acc)]"
                        : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                    }`}
                  >
                    Corte (0s)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopPlayback();
                      setConfig((c) => ({ ...c, style: "pause" }));
                    }}
                    className={`px-1.5 py-0.5 rounded-[var(--r-pill)] text-micro font-semibold transition cursor-pointer ${
                      config.style === "pause"
                        ? "bg-[var(--acc)] text-[var(--on-acc)]"
                        : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                    }`}
                  >
                    Pausa ({config.pauseDurationSec}s)
                  </button>

                  {/* Seconds selector for crossfade */}
                  {config.style === "crossfade" && (
                    <div className="flex items-center gap-0.5 pl-1700">
                      {[2, 3, 5, 8].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => {
                            stopPlayback();
                            setConfig((c) => ({ ...c, fadeDurationSec: sec }));
                          }}
                          className={`px-1 py-0.2 rounded font-sans text-micro transition cursor-pointer ${
                            config.fadeDurationSec === sec
                              ? "bg-[var(--acc)]/30 text-[var(--acc)] font-bold"
                              : "text-[var(--ink-2)] hover:text-[var(--ink)]"
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
                className="relative h-7 bg-[var(--surface)] rounded-[var(--r-s)] cursor-pointer overflow-hidden p-0.5 select-none"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = (e.clientX - rect.left) / rect.width;
                  handleSeek(ratio * timeline.totalDurationSec);
                }}
              >
                {/* Track A segment */}
                <div
                  className="absolute top-0.5 bottom-0.5 left-0.5 rounded bg-[var(--acc)]/20 flex items-center px-1.5"
                  style={{
                    width: `${(timeline.songAEndSec / timeline.totalDurationSec) * 100}%`,
                  }}
                >
                  <span className="text-micro font-sans font-bold text-[var(--acc)]/70 truncate flex items-center gap-0.5">
                    {autoCueEnabled && cueAnalysisA?.outroSilenceSec ? (
                      <Scissors className="w-2 h-2 text-[var(--acc)] shrink-0" />
                    ) : null}
                    Fin #{indexA + 1}
                  </span>
                </div>

                {/* Track B segment */}
                <div
                  className="absolute top-0.5 bottom-0.5 right-0.5 rounded bg-[var(--ok)]/20 flex items-center justify-end px-1.5"
                  style={{
                    left: `${(timeline.songBStartSec / timeline.totalDurationSec) * 100}%`,
                  }}
                >
                  <span className="text-micro font-sans font-bold text-[var(--ink-2)] truncate flex items-center gap-0.5">
                    {autoCueEnabled && cueAnalysisB?.introSilenceSec ? (
                      <Scissors className="w-2 h-2 text-[var(--ok)] shrink-0" />
                    ) : null}
                    Inicio #{indexB + 1}
                  </span>
                </div>

                {/* Crossfade overlap highlight */}
                {config.style === "crossfade" && (
                  <div
                    className="absolute top-0.5 bottom-0.5 bg-[var(--acc)]/30   pointer-events-none flex items-center justify-center text-micro font-sans font-bold text-[var(--ink)]/90"
                    style={{
                      left: `${(timeline.crossfadeStartSec / timeline.totalDurationSec) * 100}%`,
                      width: `${((timeline.crossfadeEndSec - timeline.crossfadeStartSec) / timeline.totalDurationSec) * 100}%`,
                    }}
                  >
                    <ShowIcon inline emoji="⚡" />Fade
                  </div>
                )}

                {/* Playhead Indicator */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-[var(--surface)] z-20 pointer-events-none transition-ui duration-75"
                  style={{
                    left: `${(currentTime / timeline.totalDurationSec) * 100}%`,
                  }}
                >
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[var(--sunken)] rounded-[var(--r-pill)] shadow" />
                </div>
              </div>

              {/* Player Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-7 h-7 rounded-[var(--r-s)] bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-bold flex items-center justify-center shadow transition active:scale-[0.97] cursor-pointer"
                    title={
                      isPlaying ? "Pausar comprobación" : "Reproducir unión"
                    }
                  >
                    {isPlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-[var(--ink)]" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-[var(--ink)] ml-0.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleRestart}
                    className="p-1 rounded-[var(--r-pill)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] transition cursor-pointer"
                    title="Rebobinar al inicio del enlace"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>

                  {/* Volume Slider */}
                  <div className="flex items-center gap-1 pl-1">
                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      className="text-[var(--ink-2)] hover:text-[var(--ink)] transition cursor-pointer"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-3 h-3" />
                      ) : (
                        <Volume2 className="w-3 h-3" />
                      )}
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
                      className="w-14 accent-[var(--acc)] cursor-pointer h-1"
                    />
                  </div>
                </div>

                {/* Progress Time & Status */}
                <div className="flex items-center gap-1.5">
                  <span className="font-sans text-[var(--ink-2)] font-bold bg-[var(--surface)] px-1.5 py-0.5 rounded text-micro">
                    <ShowIcon inline emoji="⏱️" />{currentTime.toFixed(1)}s /{" "}
                    {timeline.totalDurationSec.toFixed(1)}s
                  </span>
                  {isPlaying && (
                    <span className="px-1.5 py-0.5 rounded-[var(--r-pill)] text-micro font-bold bg-[var(--ok)]/20 text-[var(--ink-2)] flex items-center gap-1">
                      <span className="w-1 h-1 rounded-[var(--r-pill)] bg-[var(--ok)]" />
                      Sonando
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Smart Tabbed Musical Intelligence Panel */}
            <div className="rounded-[var(--r-m)] bg-[var(--sunken)] overflow-hidden">
              {/* Tab Navigation Ribbon & Verdict Summary */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 px-2.5 py-1.5800 bg-[var(--surface)]">
                {/* Tabs */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("pros_cons")}
                    className={`px-2 py-0.5 rounded-[var(--r-pill)] text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      activeTab === "pros_cons"
                        ? "bg-[var(--sunken)] text-[var(--acc)]/70"
                        : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                    }`}
                  >
                    <span>Pros y Contras</span>
                    <span className="text-micro font-sans px-1 rounded bg-[var(--surface)] text-[var(--ink-2)]">
                      +{diagnosis.porQueSi.length} / -
                      {diagnosis.porQueNo.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("metrics")}
                    className={`px-2 py-0.5 rounded-[var(--r-pill)] text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      activeTab === "metrics"
                        ? "bg-[var(--sunken)] text-[var(--acc)]/70"
                        : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                    }`}
                  >
                    <span>Métricas Armónicas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("stagecraft")}
                    className={`px-2 py-0.5 rounded-[var(--r-pill)] text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      activeTab === "stagecraft"
                        ? "bg-[var(--sunken)] text-[var(--acc)]/70"
                        : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                    }`}
                  >
                    <span>
                      Stagecraft ({diagnosis.stageRecommendations.length})
                    </span>
                  </button>
                </div>

                {/* Right Summary Verdict */}
                <div className="text-micro text-[var(--ink-2)] flex items-center gap-1">
                  <span>
                    Recomendado:{" "}
                    <strong className="text-[var(--ink)] font-bold">
                      {diagnosis.recommendedStyle}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Tab Content Container */}
              <div className="p-2 max-h-32 sm:max-h-28 overflow-y-auto">
                {activeTab === "pros_cons" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {/* POR QUÉ SÍ */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-micro font-bold text-[var(--ok)] tracking-wide">
                        <ThumbsUp className="w-2.5 h-2.5" />
                        <span>
                          Por qué SÍ funciona ({diagnosis.porQueSi.length})
                        </span>
                      </div>
                      <div className="space-y-1">
                        {diagnosis.porQueSi.map((pro) => (
                          <div
                            key={pro.id}
                            className="p-1.5 rounded-[var(--r-s)] bg-[var(--ok-soft)] text-micro space-y-0.5"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-[var(--ink-2)] flex items-center gap-1 truncate">
                                <CheckCircle2 className="w-2.5 h-2.5 text-[var(--ok)] shrink-0" />
                                {pro.title}
                              </span>
                              <span className="text-micro px-1 rounded font-sans bg-[var(--ok)]/20 text-[var(--ink-2)] shrink-0">
                                {pro.category}
                              </span>
                            </div>
                            <p className="text-[var(--ink-2)] leading-tight pl-3.5 text-micro">
                              {pro.detail}
                            </p>
                          </div>
                        ))}
                        {diagnosis.porQueSi.length === 0 && (
                          <div className="p-1.5 rounded-[var(--r-s)] bg-[var(--bg)]/50 text-micro text-[var(--ink-2)] text-center">
                            Sin factores musicales especialmente favorables.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* POR QUÉ NO / CRÍTICA */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-micro font-bold text-[var(--alert)] tracking-wide">
                        <ThumbsDown className="w-2.5 h-2.5" />
                        <span>
                          Puntos a vigilar ({diagnosis.porQueNo.length})
                        </span>
                      </div>
                      <div className="space-y-1">
                        {diagnosis.porQueNo.map((con) => (
                          <div
                            key={con.id}
                            className={`p-1.5 rounded-[var(--r-s)] text-micro space-y-0.5 ${
                              con.severity === "critico"
                                ? "bg-[var(--alert-soft)]/40"
                                : con.severity === "aviso"
                                  ? "bg-[var(--acc-soft)] "
                                  : "bg-[var(--bg)]/60"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`font-bold flex items-center gap-1 truncate ${
                                  con.severity === "critico"
                                    ? "text-[var(--ink-2)]"
                                    : con.severity === "aviso"
                                      ? "text-[var(--acc)]/70"
                                      : "text-[var(--ink-2)]"
                                }`}
                              >
                                <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                {con.title}
                              </span>
                              <span className="text-micro px-1 rounded font-sans bg-[var(--sunken)] text-[var(--ink-2)] shrink-0">
                                {con.severity}
                              </span>
                            </div>
                            <p className="text-[var(--ink-2)] leading-tight pl-3.5 text-micro">
                              {con.detail}
                            </p>
                          </div>
                        ))}
                        {diagnosis.porQueNo.length === 0 && (
                          <div className="p-1.5 rounded-[var(--r-s)] bg-[var(--ok)]/5 text-center text-micro text-[var(--ink-2)] flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-[var(--ok)]" />
                            <span>Enlace limpio sin objeciones.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "metrics" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
                    <div className="p-2 rounded-[var(--r-s)] bg-[var(--surface)] space-y-0.5">
                      <div className="flex items-center gap-1 text-xs font-bold text-[var(--acc)]/70">
                        <Music className="w-3 h-3" />
                        <span>Armonía y tono</span>
                      </div>
                      <p className="text-micro text-[var(--ink-2)] leading-tight">
                        {diagnosis.harmonyDescription}
                      </p>
                    </div>

                    <div className="p-2 rounded-[var(--r-s)] bg-[var(--surface)] space-y-0.5">
                      <div className="flex items-center gap-1 text-xs font-bold text-[var(--ink-2)]">
                        <Zap className="w-3 h-3" />
                        <span>Salto BPM</span>
                      </div>
                      <p className="text-micro text-[var(--ink-2)] leading-tight">
                        {diagnosis.bpmDescription}
                      </p>
                    </div>

                    <div className="p-2 rounded-[var(--r-s)] bg-[var(--surface)] space-y-0.5">
                      <div className="flex items-center gap-1 text-xs font-bold text-[var(--ink-2)]">
                        <Flame className="w-3 h-3" />
                        <span>Energía Escénica</span>
                      </div>
                      <p className="text-micro text-[var(--ink-2)] leading-tight">
                        {diagnosis.energyDescription}
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "stagecraft" && (
                  <div className="space-y-1">
                    {diagnosis.stageRecommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-1.5 bg-[var(--surface)] p-1.5 rounded-[var(--r-s)] text-micro"
                      >
                        <Compass className="w-3 h-3 text-[var(--acc)] shrink-0 mt-0.5" />
                        <p className="text-micro leading-tight text-[var(--ink-2)]">
                          {rec}
                        </p>
                      </div>
                    ))}
                    {diagnosis.stageRecommendations.length === 0 && (
                      <div className="text-micro text-[var(--ink-2)] text-center py-2">
                        Sin sugerencias adicionales de escenario para este
                        enlace.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fixed Smart Actions Footer */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 px-3.5 py-2 bg-[var(--sunken)] shrink-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {onInsertInterludio && itemA && (
                <button
                  type="button"
                  onClick={() => {
                    stopPlayback();
                    onInsertInterludio(itemA.id);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-[var(--r-pill)] bg-[var(--acc)]/10 hover:bg-[var(--acc)]/20 text-[var(--ink-2)] text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <MessageSquarePlus className="w-3 h-3" />
                  <span>Insertar chapa</span>
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
                  className="px-2.5 py-1 rounded-[var(--r-pill)] bg-[var(--surface)] hover:bg-[var(--ink-3)]/60 text-[var(--ink)] text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <ArrowLeftRight className="w-3 h-3" />
                  <span>Invertir (A ⇄ B)</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1 rounded-[var(--r-pill)] bg-[var(--surface)] hover:bg-[var(--ink-3)]/60 text-[var(--ink)] text-xs font-bold transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
