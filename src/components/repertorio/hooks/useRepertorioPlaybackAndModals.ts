/**
 * Cola de reproducción, modales de canción, estudio, acordes y transición, selección de item y arrastre del catálogo al setlist.
 * Extraído de RepertorioSetlists.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars
*/
import { Dispatch,SetStateAction,useCallback,useState } from "react";
import { Setlist,SetlistItem,Song } from "../../../types";
import { saveSongsToLocalStorageSafely } from "../../../utils/audioStorage";
import { guardarOReverter } from "../../../utils/guardarConReversion";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface RepertorioPlaybackAndModalsParams {
  handleSelectPlayerSong: (song: Song, autoPlay?: boolean, transposeSemitones?: number) => void;
  setCurrentSong: (song: Song) => void;
  setPlayerSongs: (songs: Song[]) => void;
  songs: Song[];
  setPlayerIsPlaying: (playing: boolean) => void;
  setIsPlayerPlaying: Dispatch<SetStateAction<boolean>>;
  activeSetlist: Setlist;
  setSongs: Dispatch<SetStateAction<Song[]>>;
  getHeaders: () => { "x-band-id"?: string; Authorization?: string; "Content-Type": string; };
}

/**
 * Cola de reproducción, modales de canción, estudio, acordes y transición, selección de item y arrastre del catálogo al setlist.
 * @param params Estado y callbacks del contenedor ({@link RepertorioPlaybackAndModalsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useRepertorioPlaybackAndModals({ handleSelectPlayerSong, setCurrentSong, setPlayerSongs, songs, setPlayerIsPlaying, setIsPlayerPlaying, activeSetlist, setSongs, getHeaders }: RepertorioPlaybackAndModalsParams) {
  // Cola de canciones que gobierna Siguiente/Anterior (y el fundido) de la barra Spotify
  // persistente de abajo — por defecto el catálogo completo (comportamiento de siempre en
  // Catálogo/Discografía);"Reproducir desde aquí" en una fila de Repertorio la sustituye por las
  // canciones de ESE repertorio, en su orden. Se resetea a null (= catálogo) desde cualquier
  // entrada de reproducción que no venga de un repositorio.
  const [playerQueueOverride, setPlayerQueueOverride] = useState<Song[] | null>(
    null,
  );
  const selectPlayerSongWithQueue = useCallback(
    (
      song: Song | null,
      autoPlay: boolean = false,
      queue: Song[] | null = null,
      transposeSemitones: number = 0,
    ) => {
      setPlayerQueueOverride(queue);
      handleSelectPlayerSong(song, autoPlay, transposeSemitones);
      // Dispatch to global player for persistent playback
      if (song) {
        setCurrentSong(song);
        setPlayerSongs(queue || songs);
        setPlayerIsPlaying(autoPlay);
      } else {
        setCurrentSong(null);
      }
    },
    [
      handleSelectPlayerSong,
      setCurrentSong,
      setPlayerSongs,
      setPlayerIsPlaying,
      songs,
    ],
  );

  // Song Modal State
  const [showSongModal, setShowSongModal] = useState(false);
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  // Studio Ideas Modal State
  const [activeStudioSong, setActiveStudioSong] = useState<Song | null>(null);
  const [activeStudioOpenIris, setActiveStudioOpenIris] =
    useState<boolean>(false);

  const handleOpenStudioModal = useCallback(
    (song: Song | null, opts?: { openIris?: boolean }) => {
      setIsPlayerPlaying(false);
      setActiveStudioOpenIris(!!opts?.openIris);
      setActiveStudioSong(song);
    },
    [setIsPlayerPlaying],
  );

  // Chords Viewer Modal State
  const [activeChordsSong, setActiveChordsSong] = useState<Song | null>(null);
  const [activeMemberNotesSong, setActiveMemberNotesSong] =
    useState<Song | null>(null);

  // Transition Preview Modal State (para comprobar el enlace auditivo/armónico entre temas consecutivos)
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
      if (idxA < 0 || idxB < 0 || idxA >= items.length || idxB >= items.length)
        return;

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

  // Selected item in active setlist (for intelligent insertion beneath selected song)
  const [selectedSetlistItemId, setSelectedSetlistItemId] = useState<
    string | null
  >(null);
  const [draggedCatalogSongId, setDraggedCatalogSongId] = useState<
    string | null
  >(null);
  const [dragOverCatalogSongId, setDragOverCatalogSongId] = useState<
    string | null
  >(null);

  const handleDropCatalogSong = (
    sourceSongId: string,
    targetSongId: string,
  ) => {
    if (sourceSongId === targetSongId) return;
    const sourceIdx = songs.findIndex((s) => s.id === sourceSongId);
    const targetIdx = songs.findIndex((s) => s.id === targetSongId);
    if (sourceIdx < 0 || targetIdx < 0) return;

    const newSongs = [...songs];
    const [movedSong] = newSongs.splice(sourceIdx, 1);
    newSongs.splice(targetIdx, 0, movedSong);

    const updatedSongs = newSongs.map((s, idx) => ({
      ...s,
      ordenAlbum: idx + 1,
    }));
    const songsAntes = songs;
    setSongs(updatedSongs);
    saveSongsToLocalStorageSafely(updatedSongs);

    // Persist song reordering to server. Si alguna escritura falla, se restaura el orden anterior
    // (una sola vez aunque fallen varias) para que la pantalla no enseñe un orden sin guardar.
    let revertido = false;
    updatedSongs.forEach((s) => {
      void guardarOReverter(
        fetch("/api/songs/" + s.id, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(s),
        }),
        () => {
          if (revertido) return;
          revertido = true;
          setSongs(songsAntes);
          saveSongsToLocalStorageSafely(songsAntes);
        },
      );
    });
  };

  return { setActiveChordsSong, activeStudioSong, setActiveStudioSong, editingSong, setShowSongModal, setEditingSong, selectedSetlistItemId, setSelectedSetlistItemId, handleOpenTransitionPreview, selectPlayerSongWithQueue, handleOpenStudioModal, setActiveMemberNotesSong, draggedCatalogSongId, setDraggedCatalogSongId, dragOverCatalogSongId, setDragOverCatalogSongId, handleDropCatalogSong, showSongModal, activeStudioOpenIris, setActiveStudioOpenIris, activeMemberNotesSong, activeChordsSong, isSpotifyModalOpen, setIsSpotifyModalOpen, transitionPreviewData, setTransitionPreviewData };
}
