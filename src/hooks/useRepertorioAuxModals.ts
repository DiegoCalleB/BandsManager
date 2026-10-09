import { useState, useCallback } from "react";
import { Song, SetlistItem } from "../types";

export interface UseRepertorioAuxModalsProps {
  songs: Song[];
  setIsPlayerPlaying: (val: boolean) => void;
  activeSetlist: { items?: SetlistItem[] } | null;
}

export function useRepertorioAuxModals({
  songs,
  setIsPlayerPlaying,
  activeSetlist,
}: UseRepertorioAuxModalsProps) {
  // Song Modal State
  const [showSongModal, setShowSongModal] = useState(false);
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  // Studio Ideas Modal State
  const [activeStudioSong, setActiveStudioSong] = useState<Song | null>(null);
  const [activeStudioOpenIris, setActiveStudioOpenIris] = useState<boolean>(false);

  const handleOpenStudioModal = useCallback(
    (song: Song | null, opts?: { openIris?: boolean }) => {
      setIsPlayerPlaying(false);
      setActiveStudioOpenIris(!!opts?.openIris);
      setActiveStudioSong(song);
    },
    [setIsPlayerPlaying],
  );

  // Chords Viewer & Member Notes Modal State
  const [activeChordsSong, setActiveChordsSong] = useState<Song | null>(null);
  const [activeMemberNotesSong, setActiveMemberNotesSong] = useState<Song | null>(null);

  // Transition Preview Modal State
  const [transitionPreviewData, setTransitionPreviewData] = useState<{
    isOpen: boolean;
    songA: Song | null;
    songB: Song | null;
    itemA: SetlistItem | null;
    itemB: SetlistItem | null;
    indexA: number;
    indexB: number;
  } | null>(null);

  const handleOpenTransitionPreview = useCallback(
    (idxA: number, idxB: number) => {
      if (!activeSetlist || !activeSetlist.items) return;
      const items = activeSetlist.items;
      if (idxA < 0 || idxB < 0 || idxA >= items.length || idxB >= items.length) return;

      const itA = items[idxA];
      const itB = items[idxB];
      const sA = itA?.songId ? songs.find((s) => s.id === itA.songId) : null;
      const sB = itB?.songId ? songs.find((s) => s.id === itB.songId) : null;

      if (sA && sB) {
        setTransitionPreviewData({
          isOpen: true,
          songA: sA,
          songB: sB,
          itemA: itA,
          itemB: itB,
          indexA: idxA,
          indexB: idxB,
        });
      }
    },
    [activeSetlist, songs],
  );

  return {
    showSongModal,
    setShowSongModal,
    isSpotifyModalOpen,
    setIsSpotifyModalOpen,
    editingSong,
    setEditingSong,
    activeStudioSong,
    setActiveStudioSong,
    activeStudioOpenIris,
    setActiveStudioOpenIris,
    handleOpenStudioModal,
    activeChordsSong,
    setActiveChordsSong,
    activeMemberNotesSong,
    setActiveMemberNotesSong,
    transitionPreviewData,
    setTransitionPreviewData,
    handleOpenTransitionPreview,
  };
}
