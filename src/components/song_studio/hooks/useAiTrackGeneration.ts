/**
 * Generador de pista de instrumento con IA y separación de stems con Iris: formularios, vista previa, generación y alta de la pista en la idea
 * Extraído de SongStudioModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch, SetStateAction, useState } from "react";
import { useSeparacionIris } from "../../../hooks/useSeparacionIris";
import { Song, SongAudioIdea } from "../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface AiTrackGenerationParams {
  song: Song;
  onUpdateSong: (updatedSong: Song) => void;
  selectedStemEngine: "fal" | "mvsep-mdx23" | "demucs" | "dsp-server";
  selectedStemsToExtract: string[];
  setExpandedIdeaIds: Dispatch<SetStateAction<Set<string>>>;
}

/**
 * Generador de pista de instrumento con IA y separación de stems con Iris: formularios, vista previa, generación y alta de la pista en la idea
 * @param params Estado y callbacks del contenedor ({@link AiTrackGenerationParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useAiTrackGeneration({ song, onUpdateSong, selectedStemEngine, selectedStemsToExtract, setExpandedIdeaIds }: AiTrackGenerationParams) {
  // AI Instrument Track Generator State — guarda la idea de destino (no un simple boolean) para
  // saber a qué mezcla añadir la pista generada; antes se asumía siempre audioIdeas[0], ignorando
  // sobre qué idea había pulsado el usuario el botón.
  const [showAiTrackGenModal, setShowAiTrackGenModal] = useState<SongAudioIdea | null>(null);
  const {
    isSeparatingStemsAi,
    stemProgressModal,
    setStemProgressModal,
    handlePerformAiStemSeparation,
  } = useSeparacionIris({
    song,
    onUpdateSong,
    motor: selectedStemEngine,
    pistasElegidas: selectedStemsToExtract,
    alTerminarIdea: (ids) => setExpandedIdeaIds((prev) => new Set([...prev, ...ids])),
  });

  return { setShowAiTrackGenModal, isSeparatingStemsAi, handlePerformAiStemSeparation, showAiTrackGenModal, stemProgressModal, setStemProgressModal };
}
