import React, { useState, useCallback } from 'react';
import { Song } from '../types';
import { PlayerContext } from './playerContextValue';

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
