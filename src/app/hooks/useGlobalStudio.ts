/**
 * Estudio de canciones global (abrir tema o Iris).
 * Extraído de App.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import type { Song } from "../../types";

/**
 * Estudio de canciones global (abrir tema o Iris).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useGlobalStudio() {
  const [globalStudioSong, setGlobalStudioSong] = useState<Song | null>(null);

  const [globalStudioOpenIris, setGlobalStudioOpenIris] =
    useState<boolean>(false);

  const handleOpenStudio = (song: Song) => {
    setGlobalStudioOpenIris(false);
    setGlobalStudioSong(song);
  };

  const handleOpenIris = (song: Song) => {
    setGlobalStudioOpenIris(true);
    setGlobalStudioSong(song);
  };

  return { globalStudioSong, setGlobalStudioSong, setGlobalStudioOpenIris, globalStudioOpenIris, handleOpenStudio, handleOpenIris };
}
