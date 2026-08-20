import { useState } from 'react';
import { Song } from '../types';

export function useAudioPlayer() {
 // Spotify Music Player State
 const [activePlayerSong, setActivePlayerSong] = useState<Song | null>(null);
 const [playerAutoPlay, setPlayerAutoPlay] = useState<boolean>(false);
 const [playSignal, setPlaySignal] = useState<number>(0);
 const [isPlayerPlaying, setIsPlayerPlaying] = useState<boolean>(false);

 const handleSelectPlayerSong = (song: Song | null, autoPlay = false) => {
   if (!song) {
     setActivePlayerSong(null);
     setPlayerAutoPlay(false);
     setIsPlayerPlaying(false);
     return;
   }

   if (activePlayerSong?.id === song.id) {
     if (autoPlay) {
       if (isPlayerPlaying) {
         setPlayerAutoPlay(false);
         setIsPlayerPlaying(false);
       } else {
         setPlayerAutoPlay(true);
         setPlaySignal(Date.now());
       }
     } else {
       setPlayerAutoPlay(false);
     }
   } else {
     setActivePlayerSong(song);
     setPlayerAutoPlay(autoPlay);
     if (autoPlay) {
       setPlaySignal(Date.now());
     }
   }
 };

  return {
    activePlayerSong, setActivePlayerSong,
    playerAutoPlay,
    playSignal,
    isPlayerPlaying, setIsPlayerPlaying,
    handleSelectPlayerSong,
  };
}
