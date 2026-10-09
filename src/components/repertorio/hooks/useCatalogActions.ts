/**
 * Acciones del catálogo: selección múltiple, borrado masivo, álbumes y normalización de títulos.
 * Extraído de RepertorioSetlists.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/set-state-in-effect,
 react-hooks/exhaustive-deps,
 react-hooks/purity,
 react-hooks/immutability
*/
import { guardarOReverter } from "../../../utils/guardarConReversion";
import { saveSongsToLocalStorageSafely } from "../../../utils/audioStorage";
import { normalizeSongTitlesInList } from "../../../utils/formatSongTitle";
import { Song, Setlist } from "../../../types";
import { Dispatch, SetStateAction } from "react";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface CatalogActionsParams {
  setSelectedCatalogIds: Dispatch<SetStateAction<Set<string>>>;
  setConfirmDeleteModal: Dispatch<SetStateAction<{ title: string; description: string; onConfirm: () => void; }>>;
  songs: Song[];
  setlists: Setlist[];
  setSongs: Dispatch<SetStateAction<Song[]>>;
  setSetlists: Dispatch<SetStateAction<Setlist[]>>;
  getHeaders: () => { "x-band-id"?: string; Authorization?: string; "Content-Type": string; };
  activeSetlist: Setlist;
  setStatusBanner: Dispatch<SetStateAction<{ text: string; type: "loading" | "success" | "warning" | "error"; }>>;
  handleAddMultipleSongsToSetlist: (songIds: string[]) => void;
  toggleFavoriteSong: (songId: string) => void;
}

/**
 * Acciones del catálogo: selección múltiple, borrado masivo, álbumes y normalización de títulos.
 * @param params Estado y callbacks del contenedor ({@link CatalogActionsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useCatalogActions({ setSelectedCatalogIds, setConfirmDeleteModal, songs, setlists, setSongs, setSetlists, getHeaders, activeSetlist, setStatusBanner, handleAddMultipleSongsToSetlist, toggleFavoriteSong }: CatalogActionsParams) {
  // Catalog multi-select: lets the user act on several songs at once instead of one by one
  const toggleCatalogSelect = (songId: string) => {
    setSelectedCatalogIds((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) next.delete(songId);
      else next.add(songId);
      return next;
    });
  };

  const clearCatalogSelection = () => setSelectedCatalogIds(new Set());

  const handleBulkDeleteSongs = (songIds: string[]) => {
    if (songIds.length === 0) return;
    setConfirmDeleteModal({
      title: "Eliminar Canciones Seleccionadas",
      description: `¿Seguro que deseas eliminar ${songIds.length} canciones del catálogo del grupo? Se quitarán también de los repertorios donde aparezcan.`,
      onConfirm: () => {
        const idsSet = new Set(songIds);
        const cancionesBorradas = songs.filter((s) => idsSet.has(s.id));
        const setlistsAntes = setlists;
        setSongs((prev) => prev.filter((s) => !idsSet.has(s.id)));
        setSetlists((prev) =>
          prev.map((st) => ({
            ...st,
            items: st.items.filter(
              (it) => !it.songId || !idsSet.has(it.songId),
            ),
          })),
        );
        songIds.forEach((songId) => {
          void guardarOReverter(
            fetch(`/api/songs/${songId}`, {
              method: "DELETE",
              headers: getHeaders(),
            }),
            () => {
              const cancion = cancionesBorradas.find((c) => c.id === songId);
              if (cancion) {
                setSongs((prev) =>
                  prev.some((s) => s.id === cancion.id) ? prev : [cancion, ...prev],
                );
              }
              setSetlists(setlistsAntes);
            },
          );
        });
        clearCatalogSelection();
      },
    });
  };

  const handleBulkAddSelectedToSetlist = (songIds: string[]) => {
    if (songIds.length === 0) return;
    if (!activeSetlist) {
      setStatusBanner({
        text: 'Selecciona o crea primero un repertorio en la pestaña "Setlists & Directos" para añadir estas canciones.',
        type: "error",
      });
      setTimeout(() => setStatusBanner(null), 5000);
      return;
    }
    handleAddMultipleSongsToSetlist(songIds);
    setStatusBanner({
      text: `✓ ${songIds.length} canciones añadidas a "${activeSetlist.nombre}"`,
      type: "success",
    });
    setTimeout(() => setStatusBanner(null), 4000);
    clearCatalogSelection();
  };

  const handleToggleFavorite = (songId: string) => {
    // Misma lógica que toggleFavoriteSong (con marcha atrás si el servidor lo rechaza).
    toggleFavoriteSong(songId);
  };

  const handleUnassignAlbumSongs = (albumName: string) => {
    const updatedSongs = songs.map((s) => {
      if (
        (s.albumDisco || "Singles / Sin Disco") === albumName ||
        s.albumDisco === albumName
      ) {
        return { ...s, albumDisco: "" };
      }
      return s;
    });
    setSongs(updatedSongs);
    saveSongsToLocalStorageSafely(updatedSongs);

    updatedSongs
      .filter(
        (s) =>
          (s.albumDisco || "Singles / Sin Disco") === albumName ||
          s.albumDisco === albumName,
      )
      .forEach((s) => {
        fetch(`/api/songs/${s.id}`, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(s),
        }).catch((err) =>
          console.error("Error updating song album on server:", err),
        );
      });
  };

  const handleDeleteAlbumAndSongs = (albumName: string) => {
    const songsToDelete = songs.filter(
      (s) =>
        (s.albumDisco || "Singles / Sin Disco") === albumName ||
        s.albumDisco === albumName,
    );
    const idsToDelete = new Set(songsToDelete.map((s) => s.id));

    const updatedSongs = songs.filter((s) => !idsToDelete.has(s.id));
    setSongs(updatedSongs);
    saveSongsToLocalStorageSafely(updatedSongs);

    setSetlists((prev) =>
      prev.map((st) => ({
        ...st,
        items: st.items.filter((it) => !idsToDelete.has(it.songId)),
      })),
    );

    songsToDelete.forEach((s) => {
      fetch(`/api/songs/${s.id}`, {
        method: "DELETE",
        headers: getHeaders(),
      }).catch((err) => console.error("Error deleting song on server:", err));
    });
  };

  const handleSaveAlbumSongs = (
    albumName: string,
    selectedSongIds: string[],
    albumExtraInfo?: {
      año?: string;
      portadaUrl?: string;
      tipoTrabajo?: string;
      descripcion?: string;
    },
  ) => {
    const selectedSet = new Set(selectedSongIds);
    const updatedSongs = songs.map((s) => {
      const isCurrentlyInAlbum =
        (s.albumDisco || "Singles / Sin Disco") === albumName ||
        s.albumDisco === albumName;
      if (selectedSet.has(s.id)) {
        const updated = { ...s, albumDisco: albumName };
        if (albumExtraInfo?.portadaUrl !== undefined && albumExtraInfo.portadaUrl !== "") {
          updated.portadaUrl = albumExtraInfo.portadaUrl;
          (updated as any).portada_url = albumExtraInfo.portadaUrl;
        }
        if (albumExtraInfo?.año) {
          (updated as any).albumYear = albumExtraInfo.año;
          (updated as any).album_year = albumExtraInfo.año;
        }
        return updated;
      } else if (isCurrentlyInAlbum) {
        return { ...s, albumDisco: "" };
      }
      return s;
    });

    setSongs(updatedSongs);
    saveSongsToLocalStorageSafely(updatedSongs);

    // Persist all affected songs to the backend
    updatedSongs.forEach((s) => {
      const original = songs.find((o) => o.id === s.id);
      const isModified =
        !original ||
        original.albumDisco !== s.albumDisco ||
        original.portadaUrl !== s.portadaUrl ||
        (original as any).albumYear !== (s as any).albumYear;

      if (isModified || selectedSet.has(s.id)) {
        fetch(`/api/songs/${s.id}`, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(s),
        }).catch((err) =>
          console.error("Error updating song album on server:", err),
        );
      }
    });

    window.dispatchEvent(new CustomEvent("app-data-updated"));
  };

  const handleReorderAlbumTrack = (
    albumName: string,
    songId: string,
    direction: "up" | "down",
  ) => {
    const albumSongs = songs
      .filter((s) => (s.albumDisco || "Singles / Sin Disco") === albumName)
      .sort((a, b) => (a.ordenAlbum ?? 0) - (b.ordenAlbum ?? 0));

    const index = albumSongs.findIndex((s) => s.id === songId);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= albumSongs.length) return;

    const newAlbumSongs = [...albumSongs];
    const temp = newAlbumSongs[index];
    newAlbumSongs[index] = newAlbumSongs[targetIndex];
    newAlbumSongs[targetIndex] = temp;

    const orderMap = new Map<string, number>();
    newAlbumSongs.forEach((song, idx) => {
      orderMap.set(song.id, idx + 1);
    });

    const updatedSongs = songs.map((s) => {
      if (orderMap.has(s.id)) {
        return { ...s, ordenAlbum: orderMap.get(s.id) };
      }
      return s;
    });

    setSongs(updatedSongs);
    saveSongsToLocalStorageSafely(updatedSongs);

    newAlbumSongs.forEach((s) => {
      const updated = { ...s, ordenAlbum: orderMap.get(s.id) };
      fetch(`/api/songs/${s.id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(updated),
      }).catch((err) =>
        console.error("Error updating song order on server:", err),
      );
    });
  };

  const handleNormalizeCatalogTitles = async () => {
    const { updatedSongs, changedCount } = normalizeSongTitlesInList(songs);
    if (changedCount === 0) {
      setStatusBanner({
        text: "Todos los temas del catálogo ya tienen formato con mayúsculas de nombres propios.",
        type: "success",
      });
      setTimeout(() => setStatusBanner(null), 3500);
      return;
    }

    setSongs(updatedSongs);
    saveSongsToLocalStorageSafely(updatedSongs);
    setStatusBanner({
      text: `✨ Se han normalizado ${changedCount} temas con mayúsculas de nombres propios.`,
      type: "success",
    });
    setTimeout(() => setStatusBanner(null), 4000);

    const changed = updatedSongs.filter((s) => {
      const orig = songs.find((o) => o.id === s.id);
      return orig && orig.titulo !== s.titulo;
    });

    for (const songToUpdate of changed) {
      fetch(`/api/songs/${songToUpdate.id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(songToUpdate),
      }).catch((err) =>
        console.warn("Error saving normalized song:", songToUpdate.id, err),
      );
    }
  };

  return { handleToggleFavorite, handleNormalizeCatalogTitles, clearCatalogSelection, toggleCatalogSelect, handleBulkAddSelectedToSetlist, handleBulkDeleteSongs, handleSaveAlbumSongs, handleUnassignAlbumSongs, handleDeleteAlbumAndSongs };
}
