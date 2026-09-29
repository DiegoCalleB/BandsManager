/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import SpotifyPlayerBar from './SpotifyPlayerBar';
import { usePlayer } from '../context/PlayerContext';
import { ThemeColors, Song } from '../types';

interface GlobalPlayerProps {
  colors: ThemeColors;
  onOpenStudio: (song: Song) => void;
  onOpenIris?: (song: Song) => void;
}

export function GlobalPlayer({ colors, onOpenStudio, onOpenIris }: GlobalPlayerProps) {
  const { currentSong, songs, setCurrentSong, setSongs, setIsPlaying, isPlaying } = usePlayer();
  const [playSignal, setPlaySignal] = useState(0);

  // Cuando la canción cambia y debe reproducirse, incrementa playSignal
  useEffect(() => {
    if (currentSong && isPlaying) {
      setPlaySignal((prev) => prev + 1);
    }
  }, [currentSong?.id, isPlaying]);

  const handleSelectSong = (song: Song, autoPlay = true) => {
    setCurrentSong(song);
    setIsPlaying(autoPlay);
  };

  const handleUpdateSong = (song: Song) => {
    setSongs(songs.map((s) => (s.id === song.id ? song : s)));
    if (currentSong?.id === song.id) {
      setCurrentSong(song);
    }
  };

  if (!currentSong) return null;

  return (
    <SpotifyPlayerBar
      song={currentSong}
      songs={songs}
      colors={colors}
      onSelectSong={handleSelectSong}
      onOpenStudio={onOpenStudio}
      onOpenIris={onOpenIris}
      onUpdateSong={handleUpdateSong}
      onClosePlayer={() => {
        setCurrentSong(null);
        setIsPlaying(false);
      }}
      autoPlay={isPlaying}
      playSignal={playSignal}
      onIsPlayingChange={(playing) => {
        setIsPlaying(playing);
      }}
    />
  );
}
