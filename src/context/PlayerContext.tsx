import React, { createContext, useContext, useState, useCallback } from 'react';
import { Song } from '../types';

interface PlayerContextType {
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

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const selectSong = useCallback((song: Song, songsList: Song[], autoPlay = true) => {
    setCurrentSong(song);
    setSongs(songsList);
    setIsPlaying(autoPlay);
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        songs,
        isPlaying,
        currentTime,
        duration,
        setCurrentSong,
        setSongs,
        setIsPlaying,
        setCurrentTime,
        setDuration,
        selectSong,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return context;
}
