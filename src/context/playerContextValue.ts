/**
 * Contexto del reproductor global y su hook de acceso. Separado de PlayerContext.tsx para que
 * ese fichero exporte solo el componente proveedor (Fast Refresh).
 */
import { createContext, useContext } from 'react';
import { Song } from '../types';

/** Estado y acciones del reproductor global. */
export interface PlayerContextType {
  currentSong: Song | null;
  songs: Song[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  setCurrentSong: (song: Song | null) => void;
  setSongs: (songs: Song[]) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  selectSong: (song: Song, songs: Song[], autoPlay?: boolean) => void;
}

export const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

/** Acceso al reproductor; lanza si se usa fuera de `PlayerProvider`. */
export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return context;
}
