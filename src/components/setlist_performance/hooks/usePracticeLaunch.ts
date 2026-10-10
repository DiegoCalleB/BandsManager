/**
 * Lanzamiento del modo práctica (stems Iris) y del estudio desde el directo.
 * Extraído de SetlistPerformanceView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useCallback,useState } from "react";
import { Song,SongAudioIdea } from "../../../types";
import { ideaDeStemsDeCancion } from "../../../utils/irisTracks";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface PracticeLaunchParams {
  currentSong: Song;
  onOpenPracticeMode: (song: Song, idea: SongAudioIdea) => void;
  onOpenStudioModal: (song: Song) => void;
}

/**
 * Lanzamiento del modo práctica (stems Iris) y del estudio desde el directo.
 * @param params Estado y callbacks del contenedor ({@link PracticeLaunchParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function usePracticeLaunch({ currentSong, onOpenPracticeMode, onOpenStudioModal }: PracticeLaunchParams) {
  const [internalPracticeIdea, setInternalPracticeIdea] =
    useState<SongAudioIdea | null>(null);

  const [internalPracticeSong, setInternalPracticeSong] = useState<Song | null>(
    null,
  );

  const handleLaunchPractice = useCallback(
    (customSong?: Song, customIdea?: SongAudioIdea) => {
      const targetSong = customSong || currentSong;
      const targetIdea =
        customIdea || (targetSong ? ideaDeStemsDeCancion(targetSong) : null);
      if (!targetSong || !targetIdea) return;
      if (onOpenPracticeMode) {
        onOpenPracticeMode(targetSong, targetIdea);
      } else {
        setInternalPracticeSong(targetSong);
        setInternalPracticeIdea(targetIdea);
      }
    },
    [currentSong, onOpenPracticeMode],
  );

  const handleLaunchStudio = useCallback(
    (customSong?: Song) => {
      const targetSong = customSong || currentSong;
      if (!targetSong) return;
      onOpenStudioModal?.(targetSong);
    },
    [currentSong, onOpenStudioModal],
  );

  return { handleLaunchPractice, handleLaunchStudio, internalPracticeIdea, internalPracticeSong, setInternalPracticeIdea, setInternalPracticeSong };
}
