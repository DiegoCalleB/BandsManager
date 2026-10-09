/**
 * Edición de canciones: análisis automático de acordes, guardado desde el formulario y borrado.
 * Extraído de RepertorioSetlists.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
 
import React,{ Dispatch,SetStateAction } from "react";
import { Setlist,Song } from "../../../types";
import { analizarAcordesDelAudio } from "../../../utils/analisisAcordesCliente";
import { saveSongsToLocalStorageSafely,uploadFileToServer } from "../../../utils/audioStorage";
import { guardarOReverter } from "../../../utils/guardarConReversion";
import { withSongFlagsForMember } from "../../../utils/repertorioUtils";
import { formatSecondsToMmSs } from "../../../utils/stageTimeFormat";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface SongEditingParams {
  setStatusBanner: Dispatch<SetStateAction<{ text: string; type: "loading" | "success" | "warning" | "error"; }>>;
  setSongs: Dispatch<SetStateAction<Song[]>>;
  editingSong: Song;
  activePlayerSong: Song;
  setActivePlayerSong: Dispatch<SetStateAction<Song>>;
  getHeaders: () => { "x-band-id"?: string; Authorization?: string; "Content-Type": string; };
  setShowSongModal: Dispatch<SetStateAction<boolean>>;
  setEditingSong: Dispatch<SetStateAction<Song>>;
  songs: Song[];
  setConfirmDeleteModal: Dispatch<SetStateAction<{ title: string; description: string; onConfirm: () => void; }>>;
  setlists: Setlist[];
  setSetlists: Dispatch<SetStateAction<Setlist[]>>;
}

/**
 * Edición de canciones: análisis automático de acordes, guardado desde el formulario y borrado.
 * @param params Estado y callbacks del contenedor ({@link SongEditingParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useSongEditing({ setStatusBanner, setSongs, editingSong, activePlayerSong, setActivePlayerSong, getHeaders, setShowSongModal, setEditingSong, songs, setConfirmDeleteModal, setlists, setSetlists }: SongEditingParams) {
  // Detecta en segundo plano los acordes del audio recién subido (sin generar ninguna letra).
  const runAutoChordAnalysis = async (song: Song) => {
    if (!song.audioPrincipalUrl) return;

    // Si la subida cayó en uno de los fallbacks locales de audioStorage (IndexedDB o data URL),
    // el servidor no puede descargar ese audio. Mejor decirlo que fingir que se ha analizado.
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
      // Solo se detectan los ACORDES (cálculo propio, sin IA generativa): la letra nunca se genera
      // en segundo plano; se pide a propósito con «Letra del audio» y se transcribe de la voz.
      const analisis = await analizarAcordesDelAudio(song.id);
      setSongs((prev) => {
        const next = prev.map((s) => (s.id === song.id ? { ...s, analisisAcordes: analisis } : s));
        saveSongsToLocalStorageSafely(next);
        return next;
      });
      setStatusBanner({
        text: `✓ Acordes de "${song.titulo}" detectados del audio. Es automático: revísalos de oído. Abre «Acordes» para ver la línea de tiempo`,
        type: "success",
      });
    } catch (err) {
      console.error("Error detecting chords from audio:", err);
      // El servidor explica el motivo (sin audio, audio ilegible, resultado poco fiable…).
      setStatusBanner({
        text: err instanceof Error && err.message ? err.message : `No se pudieron detectar los acordes de "${song.titulo}"`,
        type: "error",
      });
    } finally {
      setTimeout(() => setStatusBanner(null), 6000);
    }
  };

  // Handle Add/Edit Song Form Submit
  const handleSaveSong = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const titulo = formData.get("titulo") as string;
    // La duración se introduce (y se autodetecta del audio) en dos campos separados, min y seg.
    const duracionMin =
      parseInt(formData.get("duracionMin") as string, 10) || 0;
    const duracionSeg =
      parseInt(formData.get("duracionSeg") as string, 10) || 0;
    const duracionSegundos = duracionMin * 60 + duracionSeg;
    const duracion = formatSecondsToMmSs(duracionSegundos);
    const tonalidad = (formData.get("tonalidad") as string) || "Am";
    const bpm = parseInt(formData.get("bpm") as string, 10) || 120;
    const afinacion = formData.get("afinacion") as string;
    const albumDisco = formData.get("albumDisco") as string;
    const genero = (formData.get("genero") as string) || "";
    const tipo = (formData.get("tipo") as string) || "propio";
    const energia = parseInt(formData.get("energia") as string, 10) || 5;
    const cantantePrincipal =
      (formData.get("cantantePrincipal") as string) || "";
    const estadoTema =
      (formData.get("estadoTema") as Song["estadoTema"]) || "listo";
    //"Cover / Versión" en el selector de tipo es la única fuente de este flag: evitamos
    // tener dos controles distintos que signifiquen lo mismo.
    const esVersionCovers = tipo === "cover";
    const enlaceAcordes = (formData.get("enlaceAcordes") as string) || "";
    const notasInternas = formData.get("notasInternas") as string;
    const notasRepertorio = (formData.get("notasRepertorio") as string) || "";
    const notasMiembrosJson = formData.get("notasMiembrosJson") as string;
    let notasMiembros: Record<string, string> =
      editingSong?.notasMiembros || {};
    if (notasMiembrosJson) {
      try {
        notasMiembros = JSON.parse(notasMiembrosJson);
      } catch {
        // ignore
      }
    }
    // Marcas "quiero ver la tonalidad en mi setlist" por músico (notasPorMiembro[].mostrarTono).
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
    let audioPrincipalUrl =
      (formData.get("audioPrincipalUrl") as string) ||
      editingSong?.audioPrincipalUrl ||
      "";
    let portadaUrl =
      (formData.get("portadaUrl") as string) || editingSong?.portadaUrl || "";

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
        const next = prev.map((s) =>
          s.id === editingSong.id ? updatedSong : s,
        );
        saveSongsToLocalStorageSafely(next);
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
            const next = prev.map((s) =>
              s.id === cancionAntes.id ? cancionAntes : s,
            );
            saveSongsToLocalStorageSafely(next);
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
        saveSongsToLocalStorageSafely(next);
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
            saveSongsToLocalStorageSafely(next);
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
              setSongs((prev) =>
                prev.some((s) => s.id === song.id) ? prev : [song, ...prev],
              );
            }
            setSetlists(setlistsAntes);
          },
        );
      },
    });
  };

  return { handleDeleteSong, handleSaveSong };
}
