/**
 * Reproducción de la unión: dos `<audio>` sincronizados por la línea de tiempo, o síntesis.
 */
import { useEffect, useRef, useState } from "react";
import type { Song, SetlistItem } from "../../../../types";
import type { AudioCueAnalysis } from "../../../../utils/audioCueDetector";
import {
  getTransitionGains,
  type TransitionConfig,
  type TransitionTimeline,
} from "../../../../utils/transitionAudioEngine";
import {
  playSyntheticTransition,
  type SyntheticPlayerController,
} from "../../../../utils/transitionSynthesizer";
import type { PlaybackMode, Pista, PorPista } from "../types";

export interface TransitionPlaybackInput {
  songA: Song;
  songB: Song;
  itemA?: SetlistItem | null;
  itemB?: SetlistItem | null;
  config: TransitionConfig;
  timeline: TransitionTimeline;
  autoCueEnabled: boolean;
  cueAnalysis: PorPista<AudioCueAnalysis | null>;
  effectiveAudioUrl: PorPista<string>;
  isLoadingAudio: boolean;
}

// Una duración por debajo de 5 s es un metadato aún sin cargar: se usa la medida al cargar.
const duracionReal = (audio: HTMLAudioElement, fallback: number) =>
  audio.duration && !Number.isNaN(audio.duration) && audio.duration > 5 ? audio.duration : fallback;

/**
 * Reproduce sin propagar el rechazo de `play()`: el navegador lo bloquea sin un gesto del usuario
 * (autoplay al abrir) y la pista se queda en pausa visible hasta que se pulsa play. No se registra
 * porque el bucle de animación lo reintenta en cada fotograma y llenaría la consola.
 */
const reproducir = (audio: HTMLAudioElement) => {
  audio.play().catch(() => undefined);
};

/**
 * Reproduce la unión entre dos temas y expone su estado para las vistas.
 * @param input Temas, configuración, línea de tiempo, CUE y audio de cada pista.
 * @returns Estado de reproducción, refs de audio y acciones (play, pausa, buscar, volumen).
 */
export function useTransitionPlayback(input: TransitionPlaybackInput) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>("real");
  const [duration, setDurationState] = useState<PorPista<number>>({ A: 180, B: 180 });
  const [liveGain, setLiveGain] = useState<PorPista<number>>({ A: 0, B: 0 });

  const audioRefA = useRef<HTMLAudioElement | null>(null);
  const audioRefB = useRef<HTMLAudioElement | null>(null);
  const syntheticControllerRef = useRef<SyntheticPlayerController | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const pausedAtRef = useRef(0);
  const autoplayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { songA, songB, itemA, itemB, config, timeline, autoCueEnabled, cueAnalysis } = input;

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
    syntheticControllerRef.current?.stop();
    syntheticControllerRef.current = null;
    for (const audio of [audioRefA.current, audioRefB.current]) {
      if (!audio) continue;
      audio.pause();
      audio.currentTime = 0;
    }
    setLiveGain({ A: 0, B: 0 });
  };

  const startPlaybackAt = (startOffsetSec: number) => {
    stopPlayback();
    const effectiveVolume = isMuted ? 0 : volume;

    if (playbackMode === "synth") {
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
          setLiveGain({ A: gains.gainA * effectiveVolume, B: gains.gainB * effectiveVolume });
        },
        () => {
          setIsPlaying(false);
          setCurrentTime(timeline.totalDurationSec);
          pausedAtRef.current = 0;
          setLiveGain({ A: 0, B: 0 });
        },
      );
      return;
    }

    const audioA = audioRefA.current;
    const audioB = audioRefB.current;
    if (!audioA || !audioB) return;

    setIsPlaying(true);
    startTimeRef.current = performance.now() - startOffsetSec * 1000;

    // Puntos de corte efectivos del Auto-CUE: A acaba antes de sus aplausos, B entra tras su silencio.
    const durA = duracionReal(audioA, duration.A);
    const durB = duracionReal(audioB, duration.B);
    const cuesA = cueAnalysis.A;
    const cuesB = cueAnalysis.B;
    const effectiveCueOutA =
      autoCueEnabled && cuesA?.cueOut && cuesA.cueOut > 0
        ? Math.min(durA, cuesA.cueOut)
        : autoCueEnabled && songA.cueOut
          ? Math.min(durA, songA.cueOut)
          : durA;
    const effectiveCueInB =
      autoCueEnabled && cuesB?.cueIn && cuesB.cueIn >= 0
        ? Math.min(durB - 1, cuesB.cueIn)
        : autoCueEnabled && typeof songB.cueIn === "number"
          ? Math.min(durB - 1, songB.cueIn)
          : 0;

    const songAStartInAudio = Math.max(0, effectiveCueOutA - config.tailDurationSec);
    const audioACurrentTime = songAStartInAudio + startOffsetSec;
    const initialGains = getTransitionGains(startOffsetSec, timeline, config);

    if (audioACurrentTime < effectiveCueOutA && initialGains.isPlayingA) {
      audioA.currentTime = audioACurrentTime;
      audioA.volume = Math.max(0, Math.min(1, initialGains.gainA * effectiveVolume));
      reproducir(audioA);
    } else {
      audioA.pause();
    }

    const audioBOffset = startOffsetSec - timeline.songBStartSec;
    if (audioBOffset >= 0 && initialGains.isPlayingB) {
      audioB.currentTime = Math.max(0, effectiveCueInB + audioBOffset);
      audioB.volume = Math.max(0, Math.min(1, initialGains.gainB * effectiveVolume));
      reproducir(audioB);
    } else {
      audioB.pause();
      audioB.currentTime = effectiveCueInB;
    }

    const tick = () => {
      const elapsedSec = (performance.now() - startTimeRef.current) / 1000;
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
      setLiveGain({ A: computedGainA, B: computedGainB });

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
        reproducir(audioA);
      }

      audioB.volume = Math.max(0, Math.min(1, computedGainB));
      if (gains.isPlayingB && audioB.paused) {
        audioB.currentTime = Math.max(0, effectiveCueInB + (elapsedSec - timeline.songBStartSec));
        reproducir(audioB);
      } else if (!gains.isPlayingB && !audioB.paused) {
        audioB.pause();
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const resetPlayback = () => {
    stopPlayback();
    setCurrentTime(0);
    pausedAtRef.current = 0;
  };

  // Los efectos llaman a la versión más reciente de las acciones (que leen el estado vigente)
  // sin tener que declararlas como dependencia: así solo se disparan por lo que listan.
  const latest = useRef({ startPlaybackAt, stopPlayback, resetPlayback });
  useEffect(() => {
    latest.current = { startPlaybackAt, stopPlayback, resetPlayback };
  });

  const urlA = input.effectiveAudioUrl.A;
  const urlB = input.effectiveAudioUrl.B;

  // Cambiar de tema, de estilo o de audio corta lo que suena y vuelve al principio.
  useEffect(() => {
    latest.current.resetPlayback();
  }, [songA.id, songB.id, config.style, urlA, urlB]);

  // Al abrir, cambiar de tema, de audio, de modo o de ajustes, la unión vuelve a sonar sola.
  useEffect(() => {
    if (input.isLoadingAudio) return;
    if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
    autoplayTimerRef.current = setTimeout(() => latest.current.startPlaybackAt(0), 150);
    return () => {
      if (autoplayTimerRef.current) {
        clearTimeout(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
    };
  }, [
    songA.id,
    songB.id,
    input.isLoadingAudio,
    urlA,
    urlB,
    playbackMode,
    config.style,
    config.fadeDurationSec,
    config.pauseDurationSec,
    autoCueEnabled,
  ]);

  // Cerrar el modal nunca deja audio sonando.
  useEffect(() => () => latest.current.stopPlayback(), []);

  const togglePlay = () => {
    if (isPlaying) {
      pausedAtRef.current = currentTime;
      stopPlayback();
    } else {
      startPlaybackAt(currentTime >= timeline.totalDurationSec ? 0 : currentTime);
    }
  };

  const handleRestart = () => {
    resetPlayback();
    startPlaybackAt(0);
  };

  const handleSeek = (targetSec: number) => {
    const clamped = Math.max(0, Math.min(timeline.totalDurationSec, targetSec));
    pausedAtRef.current = clamped;
    setCurrentTime(clamped);
    if (isPlaying) startPlaybackAt(clamped);
  };

  const changeVolume = (value: number) => {
    setVolume(value);
    setIsMuted(false);
    syntheticControllerRef.current?.setVolume(value);
  };

  /** Guarda la duración real de una pista al cargar sus metadatos. */
  const setDuration = (track: Pista, seconds: number) => {
    if (seconds && !Number.isNaN(seconds) && seconds > 0) {
      setDurationState((d) => ({ ...d, [track]: seconds }));
    }
  };

  return {
    isPlaying,
    currentTime,
    volume,
    isMuted,
    setIsMuted,
    playbackMode,
    setPlaybackMode,
    liveGain,
    audioRefA,
    audioRefB,
    stopPlayback,
    togglePlay,
    handleRestart,
    handleSeek,
    changeVolume,
    setDuration,
  };
}
