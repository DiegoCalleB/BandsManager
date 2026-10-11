/**
 * Auto-CUE: puntos de entrada y salida de cada tema, saltando silencios y aplausos de directo.
 */
import { useEffect, useState } from "react";
import type { Song } from "../../../../types";
import {
  applyDetectedCuesToSong,
  detectAudioCuesFromUrl,
  type AudioCueAnalysis,
} from "../../../../utils/audioCueDetector";
import type { Pista } from "../types";

/**
 * Análisis equivalente a los CUE ya guardados en el tema, para no esperar a la detección.
 * @param song Tema.
 * @returns El análisis, o `null` si el tema no tiene CUE guardados.
 */
export function cuesGuardados(song: Song): AudioCueAnalysis | null {
  if (typeof song.cueIn !== "number" && typeof song.cueOut !== "number") return null;
  const duration = song.duracionSegundos || 180;
  const cueIn = song.cueIn || 0;
  const cueOut = song.cueOut || duration;
  return {
    cueIn,
    cueOut,
    duration,
    trimmedDuration: cueOut - cueIn,
    introSilenceSec: cueIn,
    outroSilenceSec: Math.max(0, duration - cueOut),
    hasApplauseIntro: song.applauseDetected?.intro ?? false,
    hasApplauseOutro: song.applauseDetected?.outro ?? false,
    confidence: 0.95,
    waveformPeaks: [],
  };
}

/**
 * CUE de una pista: parte de los guardados en el tema y los afina analizando el audio.
 * @param song Tema de la pista.
 * @param url Audio efectivo de la pista.
 * @param pista Pista, solo para el aviso en consola.
 * @returns Análisis vigente, si se está analizando y marca de «guardado».
 */
export function useCuesDePista(song: Song, url: string, pista: Pista) {
  const [analysis, setAnalysis] = useState<AudioCueAnalysis | null>(() => cuesGuardados(song));
  const [isDetecting, setIsDetecting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [songId, setSongId] = useState(song.id);

  // Ajuste de estado al cambiar de tema (patrón de React para props que cambian, sin efecto).
  if (songId !== song.id) {
    setSongId(song.id);
    setAnalysis(cuesGuardados(song));
  }

  useEffect(() => {
    if (!url) return;
    let isCancelled = false;
    const detect = async () => {
      setIsDetecting(true);
      try {
        const result = await detectAudioCuesFromUrl(url);
        if (!isCancelled) setAnalysis(result);
      } catch (err) {
        // Sin detección se usan los CUE guardados o el audio entero: la comprobación sigue.
        console.warn(`No se pudieron auto-detectar CUEs de Track ${pista}:`, err);
      } finally {
        if (!isCancelled) setIsDetecting(false);
      }
    };
    detect();
    return () => {
      isCancelled = true;
    };
  }, [url, pista]);

  /** Marca la pista como guardada durante 2,5 s. */
  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return { analysis, isDetecting, saved, flashSaved };
}

/**
 * Auto-CUE de las dos pistas.
 * @param songA Tema que acaba.
 * @param songB Tema que entra.
 * @param urlA Audio efectivo de A.
 * @param urlB Audio efectivo de B.
 * @param onUpdateSong Guarda el tema con sus CUE; sin él no se ofrece guardar.
 * @returns Interruptor de Auto-CUE, análisis por pista y guardado.
 */
export function useTransitionCues(
  songA: Song,
  songB: Song,
  urlA: string,
  urlB: string,
  onUpdateSong?: (song: Song) => void,
) {
  const [autoCueEnabled, setAutoCueEnabled] = useState(true);
  const a = useCuesDePista(songA, urlA, "A");
  const b = useCuesDePista(songB, urlB, "B");

  /** Guarda en el repertorio los CUE detectados de una pista. */
  const handleSaveCuesForSong = (track: Pista) => {
    if (!onUpdateSong) return;
    const [song, cues] = track === "A" ? [songA, a] : [songB, b];
    if (!cues.analysis) return;
    onUpdateSong(applyDetectedCuesToSong(song, cues.analysis));
    cues.flashSaved();
  };

  return {
    autoCueEnabled,
    setAutoCueEnabled,
    cueAnalysis: { A: a.analysis, B: b.analysis },
    isDetectingCues: { A: a.isDetecting, B: b.isDetecting },
    savedCueSuccess: { A: a.saved, B: b.saved },
    handleSaveCuesForSong,
  };
}
