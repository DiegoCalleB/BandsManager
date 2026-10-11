/**
 * Controlador de la comprobación de transición: compone diagnóstico, fuentes, Auto-CUE y reproducción.
 */
import { useMemo, useState, type ChangeEvent } from "react";
import { getEnergyInfo } from "../../../../utils/energyPacingUtils";
import {
  DEFAULT_TRANSITION_CONFIG,
  STUDIO_SAMPLE_TRACKS,
  computeTransitionTimeline,
  diagnoseTransition,
  getTransitionGains,
  type TransitionConfig,
} from "../../../../utils/transitionAudioEngine";
import type { DiagnosisTab, Pista, PlaybackMode, ResolvedSongTransitionProps } from "../types";
import { useTransitionCues } from "./useTransitionCues";
import { useTransitionPlayback } from "./useTransitionPlayback";
import { useTransitionSources } from "./useTransitionSources";

/**
 * Estado y acciones de la comprobación de transición.
 * @param props Props del modal con los dos temas ya garantizados.
 * @returns Todo lo que consumen las vistas a través del contexto.
 */
export function useSongTransitionController(props: ResolvedSongTransitionProps) {
  const { songA, songB, itemA, itemB, indexA, indexB, totalItemsCount, onClose, onUpdateSong } = props;

  const diagnosis = useMemo(() => diagnoseTransition(songA, songB), [songA, songB]);
  const [config, setConfig] = useState<TransitionConfig>(() => ({
    ...DEFAULT_TRANSITION_CONFIG,
    style: diagnosis.recommendedStyle,
  }));
  const timeline = useMemo(() => computeTransitionTimeline(config), [config]);
  const [activeTab, setActiveTab] = useState<DiagnosisTab>("pros_cons");

  const sources = useTransitionSources(songA, songB);
  const cues = useTransitionCues(
    songA,
    songB,
    sources.effectiveAudioUrl.A,
    sources.effectiveAudioUrl.B,
    onUpdateSong,
  );
  const playback = useTransitionPlayback({
    songA,
    songB,
    itemA,
    itemB,
    config,
    timeline,
    autoCueEnabled: cues.autoCueEnabled,
    cueAnalysis: cues.cueAnalysis,
    effectiveAudioUrl: sources.effectiveAudioUrl,
    isLoadingAudio: sources.isLoadingAudio,
  });
  const { stopPlayback } = playback;

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>, track: Pista) => {
    const file = e.target.files?.[0];
    if (!file) return;
    sources.uploadFile(track, file);
    stopPlayback();
  };

  const selectSampleById = (track: Pista, sampleId: string) => {
    const sample = STUDIO_SAMPLE_TRACKS.find((st) => st.id === sampleId);
    if (!sample) return;
    stopPlayback();
    sources.selectSample(track, sample);
  };

  /** Cambia estilo o segundos de la unión; corta lo que suena para que se vuelva a oír desde cero. */
  const updateConfig = (patch: Partial<TransitionConfig>) => {
    stopPlayback();
    setConfig((c) => ({ ...c, ...patch }));
  };

  const changeMode = (mode: PlaybackMode) => {
    stopPlayback();
    playback.setPlaybackMode(mode);
  };

  const toggleAutoCue = () => {
    stopPlayback();
    cues.setAutoCueEnabled((enabled) => !enabled);
  };

  /** Ejecuta una acción del pie (insertar chapa, invertir) y cierra el modal. */
  const runAndClose = (action: () => void) => {
    stopPlayback();
    action();
    onClose();
  };

  const canGoPrev = indexA > 0;
  const canGoNext = totalItemsCount > 0 ? indexB < totalItemsCount - 1 : false;

  return {
    ...sources,
    ...cues,
    ...playback,
    diagnosis,
    config,
    timeline,
    activeTab,
    setActiveTab,
    energyInfo: { A: getEnergyInfo(songA.energia ?? 10), B: getEnergyInfo(songB.energia ?? 10) },
    currentGains: getTransitionGains(playback.currentTime, timeline, config),
    canGoPrev,
    canGoNext,
    handleFileUpload,
    selectSampleById,
    updateConfig,
    changeMode,
    toggleAutoCue,
    runAndClose,
  };
}
