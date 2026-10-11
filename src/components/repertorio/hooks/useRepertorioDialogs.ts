/**
 * Estado de diálogos del repertorio (borrado, álbum, setlist, asignación, item de show) y sincronización de canciones editadas desde acordes o estudio.
 * Extraído de RepertorioSetlists.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars
*/
import { Dispatch,SetStateAction,useMemo,useState } from "react";
import { Setlist,SetlistItem,Song } from "../../../types";
import { saveSongsToLocalStorageSafely } from "../../../utils/audioStorage";
import { ConfirmDeleteAlbumData } from "../ConfirmDeleteAlbumModal";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface RepertorioDialogsParams {
  songs: Song[];
  setSongs: Dispatch<SetStateAction<Song[]>>;
  setActiveChordsSong: Dispatch<SetStateAction<Song>>;
  activeStudioSong: Song;
  setActiveStudioSong: Dispatch<SetStateAction<Song>>;
  activePlayerSong: Song;
  setActivePlayerSong: Dispatch<SetStateAction<Song>>;
  bandId: string;
  getHeaders: () => { "x-band-id"?: string; Authorization?: string; "Content-Type": string; };
}

/**
 * Estado de diálogos del repertorio (borrado, álbum, setlist, asignación, item de show) y sincronización de canciones editadas desde acordes o estudio.
 * @param params Estado y callbacks del contenedor ({@link RepertorioDialogsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useRepertorioDialogs({ songs, setSongs, setActiveChordsSong, activeStudioSong, setActiveStudioSong, activePlayerSong, setActivePlayerSong, bandId, getHeaders }: RepertorioDialogsParams) {
  // Deletion Confirmation Modal State
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  const [deleteAlbumData, setDeleteAlbumData] =
    useState<ConfirmDeleteAlbumData | null>(null);
  const [assignSongsModalData, setAssignSongsModalData] = useState<{
    isOpen: boolean;
    albumName: string;
  } | null>(null);
  const [setlistModalData, setSetlistModalData] = useState<{
    isOpen: boolean;
    setlistToEdit: Setlist | null;
  } | null>(null);
  const [isAddSongsModalOpen, setIsAddSongsModalOpen] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{
    text: string;
    type: "loading" | "success" | "warning" | "error";
  } | null>(null);
  const [defaultAlbumForNewSong, setDefaultAlbumForNewSong] =
    useState<string>("");
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<Set<string>>(
    new Set(),
  );

  const sortedSongsByAlbumAndOrder = useMemo(() => {
    return [...songs].sort((a, b) => {
      const albumA = a.albumDisco || a.album || "Z_SinDisco";
      const albumB = b.albumDisco || b.album || "Z_SinDisco";
      if (albumA !== albumB) {
        return albumA.localeCompare(albumB);
      }
      const orderA = typeof a.ordenAlbum === "number" ? a.ordenAlbum : 999;
      const orderB = typeof b.ordenAlbum === "number" ? b.ordenAlbum : 999;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.titulo.localeCompare(b.titulo);
    });
  }, [songs]);

  const handleUpdateSongFromChords = (updatedSong: Song) => {
    const updatedList = songs.map((s) =>
      s.id === updatedSong.id ? updatedSong : s,
    );
    setSongs(updatedList);
    saveSongsToLocalStorageSafely(updatedList);
    setActiveChordsSong(updatedSong);
    if (activeStudioSong?.id === updatedSong.id) {
      setActiveStudioSong(updatedSong);
    }
    if (activePlayerSong?.id === updatedSong.id) {
      setActivePlayerSong(updatedSong);
    }
  };

  const handleUpdateSongFromStudio = (updatedSong: Song) => {
    const updatedList = songs.map((s) =>
      s.id === updatedSong.id ? updatedSong : s,
    );
    setSongs(updatedList);
    saveSongsToLocalStorageSafely(updatedList, bandId);
    // Este handler se reutiliza como "guardar canción" genérico (MemberNotesModal, favorito,
    // PdfExportModal, SpotifyPlayerBar), no solo desde el propio Song Studio: sin este guard
    // (mismo patrón que handleUpdateSongFromChords de arriba) forzaba la apertura del Studio en
    // cualquiera de esos sitios aunque estuviera cerrado, p.ej. al guardar notas por miembro.
    if (activeStudioSong?.id === updatedSong.id) {
      setActiveStudioSong(updatedSong);
    }
    if (activePlayerSong?.id === updatedSong.id) {
      setActivePlayerSong(updatedSong);
    }
    fetch("/api/songs/" + updatedSong.id, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(updatedSong),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.song) {
          const savedSong = data.song;
          setSongs((prev) =>
            prev.map((s) =>
              s.id === savedSong.id || s.id === updatedSong.id ? savedSong : s,
            ),
          );
          if (
            activeStudioSong?.id === updatedSong.id ||
            activeStudioSong?.id === savedSong.id
          ) {
            setActiveStudioSong(savedSong);
          }
          if (
            activePlayerSong?.id === updatedSong.id ||
            activePlayerSong?.id === savedSong.id
          ) {
            setActivePlayerSong(savedSong);
          }
        }
      })
      .catch((err) => console.error("Error updating song on server:", err));
  };

  // Setlist Assign Modal State
  const [assigningSetlist, setAssigningSetlist] = useState<Setlist | null>(
    null,
  );
  const [selectedConcertToAssign, setSelectedConcertToAssign] =
    useState<string>("");

  // Show Event / Interludio Modal State & Mic Recorder
  const [showShowItemModal, setShowShowItemModal] = useState(false);
  const [editingShowItem, setEditingShowItem] = useState<SetlistItem | null>(
    null,
  );
  const [showItemAudioUrl, setShowItemAudioUrl] = useState<string>("");

  return { setStatusBanner, setConfirmDeleteModal, editingShowItem, showItemAudioUrl, setShowShowItemModal, setEditingShowItem, setShowItemAudioUrl, assigningSetlist, selectedConcertToAssign, setAssigningSetlist, setSelectedCatalogIds, setSetlistModalData, setAssignSongsModalData, sortedSongsByAlbumAndOrder, setIsAddSongsModalOpen, handleUpdateSongFromStudio, setDeleteAlbumData, selectedCatalogIds, defaultAlbumForNewSong, setSelectedConcertToAssign, showShowItemModal, assignSongsModalData, setlistModalData, isAddSongsModalOpen, handleUpdateSongFromChords, confirmDeleteModal, deleteAlbumData, statusBanner };
}
