/**
 * Paso de música: Spotify, audio subido, temas manuales y repertorio.
 * Extraído de OnboardingWizardModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React,{ useState } from "react";
import { api } from "../../../../services/api";
import { Song,User } from "../../../../types";
import { apiFetch } from "../../../../utils/api";
import { uploadFileToServer } from "../../../../utils/audioStorage";
import { ManualSongItem,SpotifyAlbum } from "../../types";

/** Pista devuelta por la búsqueda de Spotify del servidor (nombres heredados mezclados). */
interface SpotifySearchTrack {
  id: string;
  name?: string;
  titulo?: string;
  trackNumber?: number;
  durationFormatted?: string;
  previewUrl?: string | null;
  spotifyUrl?: string;
  albumCover?: string;
}

/** Respuesta de `/api/spotify/search`: álbumes o, si no hay, pistas sueltas. */
interface SpotifySearchResponse {
  albums?: SpotifyAlbum[];
  tracks?: SpotifySearchTrack[];
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
export function useMusicSetlistStep({ bandName, currentUser, logoUrl, localBandName, genre, onSongsImported, activeBandId }: MusicSetlistStepParams) {
  // --- Step 6: Música & Setlist ---
  const [musicSubTab, setMusicSubTab] = useState<
    "spotify" | "upload" | "manual"
  >("spotify");

  const [spotifyQuery, setSpotifyQuery] = useState(
    bandName || currentUser?.bandName || "",
  );

  const [isSearchingSpotify, setIsSearchingSpotify] = useState(false);

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
    try {
      const res = await apiFetch<SpotifySearchResponse>(
        `/api/spotify/search?query=${encodeURIComponent(spotifyQuery)}`,
      );
      if (res && res.albums) {
        setSpotifyAlbums(res.albums);
      } else if (res && res.tracks) {
        setSpotifyAlbums([
          {
            id: "sp_tracks",
            name: "Canciones encontradas",
            albumType: "album",
            releaseYear: "2025",
            totalTracks: res.tracks.length,
            coverUrl: res.tracks[0]?.albumCover || logoUrl || "",
            spotifyUrl: "",
            tracks: res.tracks.map((t: SpotifySearchTrack) => ({
              id: t.id,
              name: t.name || t.titulo,
              trackNumber: t.trackNumber || 1,
              durationFormatted: t.durationFormatted || "3:30",
              previewUrl: t.previewUrl || null,
              spotifyUrl: t.spotifyUrl || "",
            })),
          },
        ]);
      }
    } catch (err) {
      console.warn("Spotify search fallback:", err);
      // Fallback album mock with realistic structure
      setSpotifyAlbums([
        {
          id: "mock_alb_1",
          name: `${localBandName || "Directo"} - EP Debut`,
          albumType: "album",
          releaseYear: "2025",
          totalTracks: 4,
          coverUrl:
            logoUrl ||
            "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400",
          spotifyUrl: `https://open.spotify.com/artist/search`,
          tracks: [
            {
              id: "tr_1",
              name: "Canción 1 (Single Principal)",
              trackNumber: 1,
              durationFormatted: "3:24",
              previewUrl: null,
              spotifyUrl: "",
            },
            {
              id: "tr_2",
              name: "Noches en la Ciudad",
              trackNumber: 2,
              durationFormatted: "4:02",
              previewUrl: null,
              spotifyUrl: "",
            },
            {
              id: "tr_3",
              name: "Fuego en el Escenario",
              trackNumber: 3,
              durationFormatted: "3:45",
              previewUrl: null,
              spotifyUrl: "",
            },
            {
              id: "tr_4",
              name: "Último Baile",
              trackNumber: 4,
              durationFormatted: "3:12",
              previewUrl: null,
              spotifyUrl: "",
            },
          ],
        },
      ]);
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
              tonalidad: "Mim",
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
          tonalidad: "Mim",
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
      tonalidad: newManualTonalidad.trim() || "Mim",
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
        tonalidad: "Mim",
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
      const items = allSongItems.map((s, idx) => ({
        id: `item_${Date.now()}_${idx}`,
        type: "song",
        songId: s.id,
        duracionSegundos: 210,
        duracion: s.duracion || "3:30",
        tonalidad: s.tonalidad || "Mim",
        bpm: s.bpm || 120,
      }));

      await api.createSetlist({
        nombre: setlistName,
        items,
        duracionEstimadaMinutos: durationMinutes,
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

  return { setSpotifyQuery, setSpotifyAlbums, setSelectedSpotifyTracks, setUploadedSongs, setManualSongs, setCreatedSetlistName, musicSubTab, setMusicSubTab, spotifyQuery, isSearchingSpotify, spotifyAlbums, selectedSpotifyTracks, handleSearchSpotify, handleToggleTrackSelection, handleSelectAllTracksInAlbum, handleImportSpotifyTracks, isImportingSpotify, uploadedSongs, isUploadingAudio, handleAudioFileUpload, manualSongs, newManualTitle, setNewManualTitle, newManualTonalidad, setNewManualTonalidad, newManualBpm, setNewManualBpm, newManualDuracion, setNewManualDuracion, handleAddManualSong, handleRemoveManualSong, handleBulkAddManualSongs, createdSetlistName, isCreatingSetlist, handleGenerateSetlist, totalImportedSongsCount };
}
