/**
 * Paso de música: Spotify, audio subido, temas manuales y repertorio.
 * Extraído de OnboardingWizardModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React,{ useState } from "react";
import { api } from "../../../../services/api";
import { SetlistItem,Song,User } from "../../../../types";
import { apiFetch } from "../../../../utils/api";
import { uploadFileToServer } from "../../../../utils/audioStorage";
import { parseMmSsToSeconds } from "../../../../utils/repertorioUtils";
import { ManualSongItem,SpotifyAlbum } from "../../types";

/** Respuesta de `/api/spotify/artist-discography`: discografía del artista (nombre, URL o ID). */
interface SpotifySearchResponse {
  discography?: { albums?: SpotifyAlbum[] };
}

/** Dependencias que el componente contenedor inyecta al hook. */
export interface MusicSetlistStepParams {
  bandName: string;
  currentUser: User;
  logoUrl: string;
  localBandName: string;
  genre: string;
  onSongsImported: (songs: Song[]) => void;
  activeBandId: string;
}

/**
 * Paso de música: Spotify, audio subido, temas manuales y repertorio.
 * @param params Estado y callbacks del contenedor ({@link MusicSetlistStepParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useMusicSetlistStep({ bandName, currentUser, genre, onSongsImported, activeBandId }: MusicSetlistStepParams) {
  // --- Step 6: Música & Setlist ---
  const [musicSubTab, setMusicSubTab] = useState<
    "spotify" | "upload" | "manual"
  >("spotify");

  const [spotifyQuery, setSpotifyQuery] = useState(
    bandName || currentUser?.bandName || "",
  );

  const [isSearchingSpotify, setIsSearchingSpotify] = useState(false);

  const [spotifyError, setSpotifyError] = useState<string | null>(null);
  const [spotifyAlbums, setSpotifyAlbums] = useState<SpotifyAlbum[]>([]);

  const [selectedSpotifyTracks, setSelectedSpotifyTracks] = useState<
    Set<string>
  >(new Set());

  const [isImportingSpotify, setIsImportingSpotify] = useState(false);

  const [uploadedSongs, setUploadedSongs] = useState<Song[]>([]);

  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const [manualSongs, setManualSongs] = useState<ManualSongItem[]>([]);

  const [newManualTitle, setNewManualTitle] = useState("");

  const [newManualTonalidad, setNewManualTonalidad] = useState("");

  const [newManualBpm, setNewManualBpm] = useState(120);

  const [newManualDuracion, setNewManualDuracion] = useState("3:30");

  const [createdSetlistName, setCreatedSetlistName] = useState<string | null>(
    null,
  );

  const [isCreatingSetlist, setIsCreatingSetlist] = useState(false);

  // --- Total Songs Count Calculation ---
  const totalImportedSongsCount = uploadedSongs.length + manualSongs.length;

  // Spotify Search & Import
  const handleSearchSpotify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!spotifyQuery.trim()) return;
    setIsSearchingSpotify(true);
    setSpotifyError(null);
    try {
      const res = await apiFetch<SpotifySearchResponse>(
        `/api/spotify/artist-discography?query=${encodeURIComponent(spotifyQuery.trim())}`,
      );
      const albums = res?.discography?.albums;
      if (albums && albums.length > 0) setSpotifyAlbums(albums);
      else throw new Error("Spotify no devolvió álbumes");
    } catch (err) {
      // Nunca se inventan álbumes: un resultado falso acababa importado como repertorio real.
      console.warn("Spotify search error:", err);
      setSpotifyAlbums([]);
      setSpotifyError(
        "No hemos encontrado esa banda en Spotify. Prueba pegando la URL de su perfil o añade los temas a mano.",
      );
    } finally {
      setIsSearchingSpotify(false);
    }
  };

  const handleToggleTrackSelection = (trackId: string) => {
    setSelectedSpotifyTracks((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return next;
    });
  };

  const handleSelectAllTracksInAlbum = (album: SpotifyAlbum) => {
    setSelectedSpotifyTracks((prev) => {
      const next = new Set(prev);
      album.tracks.forEach((t) => next.add(t.id));
      return next;
    });
  };

  const handleImportSpotifyTracks = async () => {
    setIsImportingSpotify(true);
    try {
      const imported: Song[] = [];
      spotifyAlbums.forEach((album) => {
        album.tracks.forEach((track) => {
          if (selectedSpotifyTracks.has(track.id)) {
            const song: Song = {
              id: `sp_${track.id}_${Date.now()}`,
              titulo: track.name,
              album: album.name,
              duracion: track.durationFormatted,
              duracionSegundos: 210,
              tonalidad: "Em",
              bpm: 120,
              energia: 14,
              genero: genre,
            };
            imported.push(song);
          }
        });
      });

      if (imported.length > 0) {
        setUploadedSongs((prev) => [...prev, ...imported]);
        for (const s of imported) {
          try {
            await api.createSong(s);
          } catch (e) {
            console.warn("Could not persist song immediately:", e);
          }
        }
        if (onSongsImported) onSongsImported(imported);
      }
      setSelectedSpotifyTracks(new Set());
    } finally {
      setIsImportingSpotify(false);
    }
  };

  // Audio Upload
  const handleAudioFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingAudio(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileUrl = await uploadFileToServer(file, {
          bandId: activeBandId,
          category: "audio",
        });
        const cleanName = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[_-]/g, " ");
        const newSong: Song = {
          id: `aud_${Date.now()}_${i}`,
          titulo: cleanName,
          audioUrl: fileUrl,
          duracion: "3:30",
          duracionSegundos: 210,
          tonalidad: "Em",
          bpm: 120,
          energia: 12,
          genero: genre,
        };
        setUploadedSongs((prev) => [...prev, newSong]);
        try {
          await api.createSong(newSong);
        } catch (err) {
          console.warn("Could not persist audio song:", err);
        }
      }
    } finally {
      setIsUploadingAudio(false);
    }
  };

  // Manual Song Add
  const handleAddManualSong = async () => {
    if (!newManualTitle.trim()) return;
    const manualItem: ManualSongItem = {
      id: `man_${Date.now()}`,
      titulo: newManualTitle.trim(),
      tonalidad: newManualTonalidad.trim() || "Em",
      bpm: newManualBpm || 120,
      duracion: newManualDuracion.trim() || "3:30",
      album: "Repertorio Directo",
    };
    setManualSongs((prev) => [...prev, manualItem]);
    setNewManualTitle("");

    const newSong: Song = {
      id: manualItem.id,
      titulo: manualItem.titulo,
      tonalidad: manualItem.tonalidad,
      bpm: manualItem.bpm,
      duracion: manualItem.duracion,
      duracionSegundos: 210,
      album: manualItem.album,
      energia: 12,
      genero: genre,
    };
    try {
      await api.createSong(newSong);
    } catch (e) {
      console.warn("Could not persist manual song:", e);
    }
  };

  const handleRemoveManualSong = (id: string) => {
    setManualSongs((prev) => prev.filter((s) => s.id !== id));
  };

  const handleBulkAddManualSongs = async (text: string) => {
    const lines = text
      .split("\n")
      .map((l) => l.replace(/^\d+[.\-)]\s*/, "").trim())
      .filter(Boolean);
    const added: ManualSongItem[] = [];
    for (const title of lines) {
      const item: ManualSongItem = {
        id: `man_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        titulo: title,
        tonalidad: "Em",
        bpm: 120,
        duracion: "3:30",
        album: "Repertorio Directo",
      };
      added.push(item);
      try {
        await api.createSong({
          id: item.id,
          titulo: item.titulo,
          tonalidad: item.tonalidad,
          bpm: item.bpm,
          duracion: item.duracion,
          duracionSegundos: 210,
          album: item.album,
          energia: 12,
          genero: genre,
        });
      } catch (e) {
        console.warn("Could not persist bulk song:", e);
      }
    }
    setManualSongs((prev) => [...prev, ...added]);
  };

  // Generate Setlist
  const handleGenerateSetlist = async (durationMinutes: number) => {
    const allSongItems = [...uploadedSongs, ...manualSongs];
    if (allSongItems.length === 0) return;
    setIsCreatingSetlist(true);
    try {
      const setlistName = `Setlist Debut (${durationMinutes} min)`;
      // Los items deben ser `tipoItem: "cancion"`: todo el repertorio filtra por ese campo,
      // y un item con otra forma no cuenta como tema (duración, energía, exportes...).
      const items: SetlistItem[] = allSongItems.map((s, idx) => ({
        id: `item_${Date.now()}_${idx}`,
        tipoItem: "cancion",
        songId: s.id,
        duracionEstimadaSegundos: parseMmSsToSeconds(s.duracion) || 210,
      }));

      await api.createSetlist({
        nombre: setlistName,
        items,
        duracionTotalEstimadaMinutos: durationMinutes,
        band_id: activeBandId,
      });
      setCreatedSetlistName(setlistName);
    } catch (err) {
      console.error("Error creating setlist:", err);
      setCreatedSetlistName(`Setlist Debut (${durationMinutes} min)`);
    } finally {
      setIsCreatingSetlist(false);
    }
  };

  return { setSpotifyQuery, setSpotifyAlbums, setSelectedSpotifyTracks, setUploadedSongs, setManualSongs, setCreatedSetlistName, musicSubTab, setMusicSubTab, spotifyQuery, isSearchingSpotify, spotifyError, spotifyAlbums, selectedSpotifyTracks, handleSearchSpotify, handleToggleTrackSelection, handleSelectAllTracksInAlbum, handleImportSpotifyTracks, isImportingSpotify, uploadedSongs, isUploadingAudio, handleAudioFileUpload, manualSongs, newManualTitle, setNewManualTitle, newManualTonalidad, setNewManualTonalidad, newManualBpm, setNewManualBpm, newManualDuracion, setNewManualDuracion, handleAddManualSong, handleRemoveManualSong, handleBulkAddManualSongs, createdSetlistName, isCreatingSetlist, handleGenerateSetlist, totalImportedSongsCount };
}
