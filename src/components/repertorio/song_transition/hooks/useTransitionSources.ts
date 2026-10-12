/**
 * Fuentes de audio de las dos pistas: maqueta del tema, audio subido a mano o muestra de estudio.
 */
import { useEffect, useRef, useState } from "react";
import type { Song } from "../../../../types";
import { resolveAudioUrl } from "../../../../utils/audioStorage";
import {
  getSampleTrackForSong,
  resolveSongAudioUrl,
  type StudioSampleTrack,
} from "../../../../utils/transitionAudioEngine";
import type { AudioSourceType, Pista, PorPista } from "../types";

interface CustomAudio {
  url: string;
  fileName: string;
}

const tipoDeFuente = (custom: CustomAudio | null, base: string): AudioSourceType =>
  custom ? "custom" : base ? "maqueta" : "sample";

/**
 * Resuelve el audio de cada pista y permite cambiarlo por una muestra o un archivo local.
 * @param songA Tema que acaba.
 * @param songB Tema que entra.
 * @returns URLs efectivas, tipo de fuente, muestras, inputs de archivo y acciones.
 */
export function useTransitionSources(songA: Song, songB: Song) {
  const [resolvedBase, setResolvedBase] = useState<PorPista<string>>({ A: "", B: "" });
  const [custom, setCustom] = useState<PorPista<CustomAudio | null>>({ A: null, B: null });
  const [samples, setSamples] = useState<PorPista<StudioSampleTrack>>(() => ({
    A: getSampleTrackForSong(songA, 0),
    B: getSampleTrackForSong(songB, 1),
  }));
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const fileInputRefA = useRef<HTMLInputElement | null>(null);
  const fileInputRefB = useRef<HTMLInputElement | null>(null);

  // Al cambiar de tema se resuelven sus URLs (IndexedDB o nube) y se descartan las elecciones previas.
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
        // Sin URL resuelta la pista cae en la muestra de estudio: se puede seguir comprobando.
        console.warn("Error resolving song audio URL:", err);
      }
      if (!isMounted) return;
      setResolvedBase({ A: finalA || "", B: finalB || "" });
      setSamples({ A: getSampleTrackForSong(songA, 0), B: getSampleTrackForSong(songB, 1) });
      setCustom({ A: null, B: null });
      setIsLoadingAudio(false);
    };
    loadAudioSources();
    return () => {
      isMounted = false;
    };
    // Solo al cambiar de tema: una edición del mismo tema no debe tirar el audio que se está probando.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songA?.id, songB?.id]);

  const effectiveAudioUrl: PorPista<string> = {
    A: custom.A?.url || resolvedBase.A || samples.A.url,
    B: custom.B?.url || resolvedBase.B || samples.B.url,
  };

  const audioSourceType: PorPista<AudioSourceType> = {
    A: tipoDeFuente(custom.A, resolvedBase.A),
    B: tipoDeFuente(custom.B, resolvedBase.B),
  };

  /** Cambia la muestra de estudio de una pista. */
  const selectSample = (track: Pista, sample: StudioSampleTrack) =>
    setSamples((s) => ({ ...s, [track]: sample }));

  /** Sustituye el audio de una pista por un archivo local (solo en este navegador). */
  const uploadFile = (track: Pista, file: File) =>
    setCustom((c) => ({ ...c, [track]: { url: URL.createObjectURL(file), fileName: file.name } }));

  return {
    effectiveAudioUrl,
    audioSourceType,
    customFileName: { A: custom.A?.fileName ?? null, B: custom.B?.fileName ?? null },
    selectedSample: samples,
    isLoadingAudio,
    fileInputRefA,
    fileInputRefB,
    selectSample,
    uploadFile,
  };
}
