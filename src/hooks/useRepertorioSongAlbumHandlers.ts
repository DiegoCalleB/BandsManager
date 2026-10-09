import React, { useState } from "react";
import { Song, Setlist } from "../types";
import { withSongFlagsForMember } from "../utils/repertorioUtils";

function formatSecondsToMmSs(secs: number): string {
  if (!secs || isNaN(secs) || secs < 0) return "00:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
import { uploadFileToServer, saveSongsToLocalStorageSafely } from "../utils/audioStorage";
import { normalizeSongTitlesInList } from "../utils/formatSongTitle";
import { analizarAcordesDelAudio } from "../utils/analisisAcordesCliente";

export interface UseRepertorioSongAlbumHandlersProps {
  songs: Song[];
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
  setlists: Setlist[];
  setSetlists: React.Dispatch<React.SetStateAction<Setlist[]>>;
  activeSetlist: Setlist | null;
  bandId?: string;
  getHeaders: () => Record<string, string>;
  editingSong: Song | null;
  setEditingSong: (song: Song | null) => void;
  setShowSongModal: (show: boolean) => void;
  activeStudioSong: Song | null;
  setActiveStudioSong: (song: Song | null) => void;
  activePlayerSong: Song | null;
  setActivePlayerSong: (song: Song | null) => void;
  guardarOReverter: (promesa: Promise<Response>, reverter: () => void) => Promise<boolean>;
  handleAddMultipleSongsToSetlist: (songIds: string[]) => void;
}

export function useRepertorioSongAlbumHandlers({
  songs,
  setSongs,
  setlists,
  setSetlists,
  activeSetlist,
  bandId,
  getHeaders,
  editingSong,
  setEditingSong,
  setShowSongModal,
  activeStudioSong,
  setActiveStudioSong,
  activePlayerSong,
  setActivePlayerSong,
  guardarOReverter,
  handleAddMultipleSongsToSetlist,
}: UseRepertorioSongAlbumHandlersProps) {
  const [statusBanner, setStatusBanner] = useState<{
    text: string;
    type: "loading" | "success" | "warning" | "error";
  } | null>(null);

  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  const [selectedCatalogIds, setSelectedCatalogIds] = useState<Set<string>>(new Set());

  // Detecta en segundo plano los acordes del audio recién subido
  const runAutoChordAnalysis = async (song: Song) => {
    if (!song.audioPrincipalUrl) return;

    if (
      !/^https?:\/\//i.test(song.audioPrincipalUrl) &&
      !song.audioPrincipalUrl.startsWith("/")
    ) {
      setStatusBanner({
        text: `El audio de "${song.titulo}" no llegó a subirse al servidor, así que no se pueden detectar los acordes. Vuelve a subirlo.`,
        type: "error",
      });
      setTimeout(() => setStatusBanner(null), 6000);
      return;
    }

    setStatusBanner({
      text: `🎵 Detectando los acordes de "${song.titulo}" desde el audio…`,
      type: "loading",
    });
    try {
      const analisis = await analizarAcordesDelAudio(song.id);
      setSongs((prev) => {
        const next = prev.map((s) => (s.id === song.id ? { ...s, analisisAcordes: analisis } : s));
        saveSongsToLocalStorageSafely(next, bandId);
        return next;
      });
      setStatusBanner({
        text: `✓ Acordes de "${song.titulo}" detectados del audio. Es automático: revísalos de oído. Abre «Acordes» para ver la línea de tiempo`,
        type: "success",
      });
    } catch (err) {
      console.error("Error detecting chords from audio:", err);
      setStatusBanner({
        text: err instanceof Error && err.message ? err.message : `No se pudieron detectar los acordes de "${song.titulo}"`,
        type: "error",
      });
    } finally {
      setTimeout(() => setStatusBanner(null), 6000);
    }
  };

  const handleSaveSong = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const titulo = formData.get("titulo") as string;
    const duracionMin = parseInt(formData.get("duracionMin") as string, 10) || 0;
    const duracionSeg = parseInt(formData.get("duracionSeg") as string, 10) || 0;
    const duracionSegundos = duracionMin * 60 + duracionSeg;
    const duracion = formatSecondsToMmSs(duracionSegundos);
    const tonalidad = (formData.get("tonalidad") as string) || "Am";
    const bpm = parseInt(formData.get("bpm") as string, 10) || 120;
    const afinacion = formData.get("afinacion") as string;
    const albumDisco = formData.get("albumDisco") as string;
    const genero = (formData.get("genero") as string) || "";
    const tipo = (formData.get("tipo") as string) || "propio";
    const energia = parseInt(formData.get("energia") as string, 10) || 5;
    const cantantePrincipal = (formData.get("cantantePrincipal") as string) || "";
    const estadoTema = (formData.get("estadoTema") as Song["estadoTema"]) || "listo";
    const esVersionCovers = tipo === "cover";
    const enlaceAcordes = (formData.get("enlaceAcordes") as string) || "";
    const notasInternas = formData.get("notasInternas") as string;
    const notasRepertorio = (formData.get("notasRepertorio") as string) || "";
    const notasMiembrosJson = formData.get("notasMiembrosJson") as string;
    let notasMiembros: Record<string, string> = editingSong?.notasMiembros || {};
    if (notasMiembrosJson) {
      try {
        notasMiembros = JSON.parse(notasMiembrosJson);
      } catch {
        // ignore
      }
    }

    const aplicarMarcasTono = (base: Song): Song => {
      const raw = formData.get("mostrarTonoJson") as string;
      if (!raw) return base;
      try {
        const marcas = JSON.parse(raw) as { id?: string; name: string; tono: boolean; bpm: boolean }[];
        return marcas.reduce(
          (acc, m) => withSongFlagsForMember(acc, m.id, m.name, { tono: m.tono === true, bpm: m.bpm === true }),
          base,
        );
      } catch {
        return base;
      }
    };

    let audioPrincipalUrl = (formData.get("audioPrincipalUrl") as string) || editingSong?.audioPrincipalUrl || "";
    let portadaUrl = (formData.get("portadaUrl") as string) || editingSong?.portadaUrl || "";

    const audioFile = formData.get("audioFile") as File;
    const hasNewAudio = Boolean(audioFile && audioFile.size > 0);
    if (hasNewAudio) {
      try {
        audioPrincipalUrl = await uploadFileToServer(audioFile);
      } catch (err) {
        console.error("Error reading uploaded audio file:", err);
      }
    }

    const portadaFile = formData.get("portadaFile") as File;
    if (portadaFile && portadaFile.size > 0) {
      try {
        portadaUrl = await uploadFileToServer(portadaFile);
      } catch (err) {
        console.error("Error reading uploaded portada file:", err);
      }
    }

    if (editingSong) {
      const updatedSong: Song = aplicarMarcasTono({
        ...editingSong,
        titulo,
        duracion,
        duracionSegundos,
        tonalidad,
        bpm,
        afinacion,
        albumDisco,
        genero,
        tipo,
        energia,
        cantantePrincipal,
        estadoTema,
        esVersionCovers,
        enlaceAcordes,
        notasInternas,
        notasRepertorio,
        notasMiembros,
        audioPrincipalUrl,
        portadaUrl,
      });
      setSongs((prev) => {
        const next = prev.map((s) => (s.id === editingSong.id ? updatedSong : s));
        saveSongsToLocalStorageSafely(next, bandId);
        return next;
      });
      if (activePlayerSong?.id === editingSong.id) {
        setActivePlayerSong(updatedSong);
      }
      const cancionAntes = editingSong;
      void guardarOReverter(
        fetch(`/api/songs/${editingSong.id}`, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(updatedSong),
        }),
        () =>
          setSongs((prev) => {
            const next = prev.map((s) => (s.id === cancionAntes.id ? cancionAntes : s));
            saveSongsToLocalStorageSafely(next, bandId);
            return next;
          }),
      );
      if (hasNewAudio) runAutoChordAnalysis(updatedSong);
    } else {
      const newSong: Song = aplicarMarcasTono({
        id: `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        titulo,
        duracion,
        duracionSegundos,
        tonalidad,
        bpm,
        afinacion,
        albumDisco,
        genero,
        tipo,
        energia,
        cantantePrincipal,
        estadoTema,
        esVersionCovers,
        enlaceAcordes,
        notasInternas,
        notasRepertorio,
        notasMiembros,
        audioPrincipalUrl,
        portadaUrl,
      });
      setSongs((prev) => {
        const next = [newSong, ...prev];
        saveSongsToLocalStorageSafely(next, bandId);
        return next;
      });
      void guardarOReverter(
        fetch("/api/songs", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(newSong),
        }),
        () =>
          setSongs((prev) => {
            const next = prev.filter((s) => s.id !== newSong.id);
            saveSongsToLocalStorageSafely(next, bandId);
            return next;
          }),
      );
      if (hasNewAudio) runAutoChordAnalysis(newSong);
    }

    setShowSongModal(false);
    setEditingSong(null);
  };

  const handleDeleteSong = (songId: string) => {
    const song = songs.find((s) => s.id === songId);
    setConfirmDeleteModal({
      title: "Eliminar Canción",
      description: `¿Seguro que deseas eliminar "${song?.titulo || "esta canción"}" del catálogo del grupo?`,
      onConfirm: () => {
        const setlistsAntes = setlists;
        setSongs((prev) => prev.filter((s) => s.id !== songId));
        setSetlists((prev) =>
          prev.map((st) => ({
            ...st,
            items: st.items.filter((it) => it.songId !== songId),
          })),
        );

        void guardarOReverter(
          fetch(`/api/songs/${songId}`, {
            method: "DELETE",
            headers: getHeaders(),
          }),
          () => {
            if (song) {
              setSongs((prev) => (prev.some((s) => s.id === song.id) ? prev : [song, ...prev]));
            }
            setSetlists(setlistsAntes);
          },
        );
      },
    });
  };

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
            items: st.items.filter((it) => !it.songId || !idsSet.has(it.songId)),
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
                setSongs((prev) => (prev.some((s) => s.id === cancion.id) ? prev : [cancion, ...prev]));
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

  const toggleFavoriteSong = (songId: string) => {
    const target = songs.find((s) => s.id === songId);
    if (!target) return;
    const updatedSong = { ...target, favoritoGeneral: !target.favoritoGeneral };
    const aplicar = (favorito: boolean | undefined) =>
      setSongs((prev) => {
        const next = prev.map((s) => (s.id === songId ? { ...s, favoritoGeneral: favorito } : s));
        saveSongsToLocalStorageSafely(next, bandId);
        return next;
      });
    aplicar(updatedSong.favoritoGeneral);
    void guardarOReverter(
      fetch("/api/songs/" + songId, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(updatedSong),
      }),
      () => aplicar(target.favoritoGeneral),
    );
  };

  const handleUnassignAlbumSongs = (albumName: string) => {
    const updatedSongs = songs.map((s) => {
      if ((s.albumDisco || "Singles / Sin Disco") === albumName || s.albumDisco === albumName) {
        return { ...s, albumDisco: "" };
      }
      return s;
    });
    setSongs(updatedSongs);
    saveSongsToLocalStorageSafely(updatedSongs, bandId);

    updatedSongs
      .filter((s) => (s.albumDisco || "Singles / Sin Disco") === albumName || s.albumDisco === albumName)
      .forEach((s) => {
        fetch(`/api/songs/${s.id}`, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(s),
        }).catch((err) => console.error("Error updating song album on server:", err));
      });
  };

  const handleDeleteAlbumAndSongs = (albumName: string) => {
    const songsToDelete = songs.filter(
      (s) => (s.albumDisco || "Singles / Sin Disco") === albumName || s.albumDisco === albumName,
    );
    const idsToDelete = new Set(songsToDelete.map((s) => s.id));

    const updatedSongs = songs.filter((s) => !idsToDelete.has(s.id));
    setSongs(updatedSongs);
    saveSongsToLocalStorageSafely(updatedSongs, bandId);

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
        (s.albumDisco || "Singles / Sin Disco") === albumName || s.albumDisco === albumName;
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
    saveSongsToLocalStorageSafely(updatedSongs, bandId);

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
        }).catch((err) => console.error("Error updating song album on server:", err));
      }
    });

    window.dispatchEvent(new CustomEvent("app-data-updated"));
  };

  const handleReorderAlbumTrack = (albumName: string, songId: string, direction: "up" | "down") => {
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
    saveSongsToLocalStorageSafely(updatedSongs, bandId);

    newAlbumSongs.forEach((s) => {
      const updated = { ...s, ordenAlbum: orderMap.get(s.id) };
      fetch(`/api/songs/${s.id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(updated),
      }).catch((err) => console.error("Error updating song order on server:", err));
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
    saveSongsToLocalStorageSafely(updatedSongs, bandId);
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
      }).catch((err) => console.warn("Error saving normalized song:", songToUpdate.id, err));
    }
  };

  return {
    statusBanner,
    setStatusBanner,
    confirmDeleteModal,
    setConfirmDeleteModal,
    selectedCatalogIds,
    setSelectedCatalogIds,
    toggleCatalogSelect,
    clearCatalogSelection,
    handleSaveSong,
    handleDeleteSong,
    handleBulkDeleteSongs,
    handleBulkAddSelectedToSetlist,
    toggleFavoriteSong,
    handleUnassignAlbumSongs,
    handleDeleteAlbumAndSongs,
    handleSaveAlbumSongs,
    handleReorderAlbumTrack,
    handleNormalizeCatalogTitles,
  };
}
