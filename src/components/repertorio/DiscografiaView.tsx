import React, { useState } from "react";
import { Song, ThemeColors } from "../../types";
import {
  Disc,
  Disc3,
  Star,
  Play,
  Pause,
  Trash2,
  ArrowUp,
  ArrowDown,
  Edit3,
  Plus,
  Music,
  Clock,
  ChevronDown,
  ChevronUp,
  Layers,
  Scissors,
  Sparkles,
  Users,
  FolderUp,
  FileText,
  Headphones,
  Loader2,
  Search,
  X,
  Download,
} from "lucide-react";
import { AlbumCover } from "../AlbumCover";
import { PublicoSilhouette } from "../ui/PublicoSilhouette";
import {
  uploadFileToServer,
  saveSongsToLocalStorageSafely,
} from "../../utils/audioStorage";
import { apiFetch } from "../../utils/api";
import {
  LiveConcertToAlbumModal,
  TrackCutItem,
} from "./LiveConcertToAlbumModal";
import { SpotifyDiscographyModal } from "./SpotifyDiscographyModal";
import { BulkAlbumAudioUploaderModal } from "./BulkAlbumAudioUploaderModal";
import { ExportAlbumSongsModal } from "./ExportAlbumSongsModal";
import { SongCardRow } from "./SongCardRow";
import { ShowIcon } from "../ui/ShowIcon";
import { ActionMenu, Button, IconButton, Input } from "../ui";

interface DiscografiaViewProps {
  songs: Song[];
  albumsList: string[];
  colors: ThemeColors;
  bandName?: string;
  bandLogoUrl?: string;
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
  setSetlists?: React.Dispatch<React.SetStateAction<any[]>>;
  toggleFavoriteSong: (id: string) => void;
  activePlayerSong?: Song | null;
  isPlayerPlaying?: boolean;
  onSelectSong?: (
    song: Song | null,
    autoPlay?: boolean,
    queue?: Song[] | null,
  ) => void;
  onRequestDeleteAlbum?: (albumName: string, songCount: number) => void;
  onEditAlbum?: (albumName: string) => void;
  onCreateAlbum?: () => void;
  onOpenMemberNotes?: (song: Song) => void;
  onOpenChords?: (song: Song) => void;
  onOpenStudio?: (song: Song) => void;
  onEditSong?: (song: Song) => void;
  onDeleteSong?: (songId: string) => void;
  onShareSong?: (song: Song) => void;
}

const formatTotalDuration = (songs: Song[]): string => {
  const totalSeconds = songs.reduce((acc, s) => {
    if (typeof s.duracionSegundos === "number" && s.duracionSegundos > 0) {
      return acc + s.duracionSegundos;
    }
    if (s.duracion && s.duracion.includes(":")) {
      const parts = s.duracion.split(":");
      const m = parseInt(parts[0], 10) || 0;
      const sec = parseInt(parts[1], 10) || 0;
      return acc + (m * 60 + sec);
    }
    return acc;
  }, 0);

  if (totalSeconds <= 0) return "0 min";
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs} h ${remMins} min`;
  }
  return `${mins} min ${secs > 0 ? `${secs} s` : ""}`;
};

export const DiscografiaView: React.FC<DiscografiaViewProps> = ({
  songs = [],
  albumsList = [],
  colors,
  bandName,
  bandLogoUrl,
  setSongs,
  setSetlists,
  toggleFavoriteSong,
  activePlayerSong,
  isPlayerPlaying = false,
  onSelectSong,
  onRequestDeleteAlbum,
  onEditAlbum,
  onCreateAlbum,
  onOpenMemberNotes,
  onOpenChords,
  onOpenStudio,
  onEditSong,
  onDeleteSong,
  onShareSong,
}) => {
  const [activeFilterTab, setActiveFilterTab] = useState<
    "todos" | "albumes" | "singles"
  >("todos");
  const [expandedAlbums, setExpandedAlbums] = useState<Record<string, boolean>>(
    {},
  );
  const [isLiveConcertModalOpen, setIsLiveConcertModalOpen] = useState(false);
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
  const [bulkUploadAlbum, setBulkUploadAlbum] = useState<{
    name: string;
    songs: Song[];
  } | null>(null);
  const [dynamicsAnalysis, setDynamicsAnalysis] = useState<{
    running: boolean;
    done: number;
    total: number;
    failedTitles: string[];
  } | null>(null);
  // Las 4 formas de crear un disco (vacío / subir MP3-WAV / Spotify / recortar de un concierto)
  // vivían como 4 botones de texto siempre visibles — se usan una vez por disco, no en cada
  // visita. Un solo punto de entrada"+ Nuevo disco" con las 4 opciones explicadas, mismo patrón
  // que el"🧠 Asistente IA" de RepertorioSetlists.tsx (AGENTS.md §6).
  const [showCreateAlbumMenu, setShowCreateAlbumMenu] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{
    album: string;
    index: number;
  } | null>(null);
  const [dragOverItem, setDragOverItem] = useState<{
    album: string;
    index: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [exportModalData, setExportModalData] = useState<{
    isOpen: boolean;
    albumName?: string;
  }>({ isOpen: false });

  const handleSaveLiveConcertAlbum = (
    albumTitle: string,
    tracks: TrackCutItem[],
  ) => {
    const createdSongs: Song[] = tracks.map((t) => {
      const mins = Math.floor(t.duration / 60);
      const secs = Math.floor(t.duration % 60);
      const durationStr = `${mins}:${String(secs).padStart(2, "0")}`;
      const songAudioUrl = t.audioUrl || "";

      return {
        id: `live_song_${Date.now()}_${t.index}`,
        titulo: t.title,
        artista: "Nuestra Banda",
        album: albumTitle,
        albumDisco: albumTitle,
        duracion: durationStr,
        duracionSegundos: t.duration,
        audioPrincipalUrl: songAudioUrl,
        audioUrl: songAudioUrl,
        audioIdeas: songAudioUrl
          ? [
              {
                id: `idea_live_${Date.now()}_${t.index}`,
                titulo: "Audio Recortado Directo",
                seccion: "general" as const,
                audioUrl: songAudioUrl,
                subidoPor: "Concierto en Directo",
                fecha: new Date().toISOString(),
              },
            ]
          : [],
        tipo: t.type === "musica" ? "cancion" : "interludio",
        ordenAlbum: t.index,
        speechTranscription: t.speechTranscription || "",
        cifradoTexto: t.lyricsWithChords || "",
        tonalidad: t.tonalidad || "Mim",
        bpm: t.bpm || 120,
        favorite: false,
        cueIn: t.cueIn,
        cueOut: t.cueOut,
        trimSilenceDetectedAt:
          t.cueIn || t.cueOut ? new Date().toISOString() : undefined,
        applauseDetected:
          t.hasApplauseIntro || t.hasApplauseOutro
            ? {
                intro: Boolean(t.hasApplauseIntro),
                outro: Boolean(t.hasApplauseOutro),
                introDurationSec: t.cueIn || 0,
                outroDurationSec: t.cueOut
                  ? Math.max(0, t.duration - t.cueOut)
                  : 0,
              }
            : undefined,
      };
    });

    const updatedSongs = [...songs, ...createdSongs];
    setSongs(updatedSongs);
    saveSongsToLocalStorageSafely(updatedSongs);

    // Save each new song to backend API
    createdSongs.forEach((song) => {
      apiFetch("/api/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(song),
      }).catch((err) =>
        console.warn("Could not persist live song to backend:", err),
      );
    });

    // Auto expand new album in UI
    setExpandedAlbums((prev) => ({ ...prev, [albumTitle]: true }));
  };

  const safeSongs = (songs || []).filter((s): s is Song =>
    Boolean(s && typeof s === "object" && s.id),
  );
  const safeAlbumsList = (albumsList || []).filter((a): a is string =>
    Boolean(a && typeof a === "string"),
  );

  const allNonEmptyAlbums = safeAlbumsList.filter((a) => a !== "todos");

  const cleanSearchQuery = searchQuery.trim().toLowerCase();

  const songMatchesSearch = (s: Song, query: string): boolean => {
    if (!query) return true;
    const title = (s.titulo || "").toLowerCase();
    const artist = (s.artista || "").toLowerCase();
    const key = (s.tonalidad || "").toLowerCase();
    const albumName = (s.albumDisco || s.album || "").toLowerCase();
    const speech = (s.speechTranscription || "").toLowerCase();
    return (
      title.includes(query) ||
      artist.includes(query) ||
      key.includes(query) ||
      albumName.includes(query) ||
      speech.includes(query)
    );
  };

  const filteredAlbums = allNonEmptyAlbums.filter((album) => {
    if (activeFilterTab === "albumes" && album === "Singles / Sin Disco") {
      return false;
    }
    if (activeFilterTab === "singles" && album !== "Singles / Sin Disco") {
      return false;
    }

    if (!cleanSearchQuery) return true;

    // Si el nombre del disco coincide con la búsqueda
    if (album.toLowerCase().includes(cleanSearchQuery)) return true;

    // O si alguna de sus canciones coincide con la búsqueda
    const albumSongs = safeSongs.filter((s) => {
      const songAlbum = (s.albumDisco || s.album || "").trim();
      const albumClean = album.trim();
      if (albumClean === "Singles / Sin Disco") {
        return !songAlbum || songAlbum === "Singles / Sin Disco";
      }
      return (
        songAlbum === albumClean ||
        songAlbum.toLowerCase() === albumClean.toLowerCase()
      );
    });

    return albumSongs.some((s) => songMatchesSearch(s, cleanSearchQuery));
  });

  const toggleAlbumExpand = (albumName: string) => {
    setExpandedAlbums((prev) => ({
      ...prev,
      [albumName]: !prev[albumName],
    }));
  };

  const areAllExpanded =
    filteredAlbums.length > 0 &&
    filteredAlbums.every((a) => expandedAlbums[a] === true);

  const toggleAllAlbums = () => {
    const nextState = !areAllExpanded;
    const newMap: Record<string, boolean> = {};
    filteredAlbums.forEach((a) => {
      newMap[a] = nextState;
    });
    setExpandedAlbums(newMap);
  };

  const handleMoveSongInAlbum = (
    albumName: string,
    sortedAlbumSongs: Song[],
    songId: string,
    direction: "up" | "down",
  ) => {
    const index = sortedAlbumSongs.findIndex((s) => s.id === songId);
    if (index < 0) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedAlbumSongs.length) return;

    const newAlbumSongs = [...sortedAlbumSongs];
    const temp = newAlbumSongs[index];
    newAlbumSongs[index] = newAlbumSongs[targetIndex];
    newAlbumSongs[targetIndex] = temp;

    const updatedSongsOrder = new Map<string, number>();
    newAlbumSongs.forEach((s, idx) => {
      updatedSongsOrder.set(s.id, idx + 1);
    });

    const updatedAllSongs = safeSongs.map((s) => {
      if (updatedSongsOrder.has(s.id)) {
        return { ...s, ordenAlbum: updatedSongsOrder.get(s.id) };
      }
      return s;
    });

    setSongs(updatedAllSongs);
    saveSongsToLocalStorageSafely(updatedAllSongs);

    // Persist order updates to backend database
    newAlbumSongs.forEach((s) => {
      const newOrd = updatedSongsOrder.get(s.id);
      const updatedSong = { ...s, ordenAlbum: newOrd };
      apiFetch(`/api/songs/${s.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSong),
      }).catch((err) =>
        console.error("Error updating song order in album on server:", err),
      );
    });
  };

  const handleDropSongInAlbum = (
    albumName: string,
    sortedAlbumSongs: Song[],
    sourceIndex: number,
    targetIndex: number,
  ) => {
    if (
      sourceIndex === targetIndex ||
      sourceIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= sortedAlbumSongs.length
    )
      return;

    const newAlbumSongs = [...sortedAlbumSongs];
    const [movedSong] = newAlbumSongs.splice(sourceIndex, 1);
    newAlbumSongs.splice(targetIndex, 0, movedSong);

    const updatedSongsOrder = new Map<string, number>();
    newAlbumSongs.forEach((s, idx) => {
      updatedSongsOrder.set(s.id, idx + 1);
    });

    const updatedAllSongs = safeSongs.map((s) => {
      if (updatedSongsOrder.has(s.id)) {
        return { ...s, ordenAlbum: updatedSongsOrder.get(s.id) };
      }
      return s;
    });

    setSongs(updatedAllSongs);
    saveSongsToLocalStorageSafely(updatedAllSongs);

    // Persist order updates to backend database
    newAlbumSongs.forEach((s) => {
      const newOrd = updatedSongsOrder.get(s.id);
      const updatedSong = { ...s, ordenAlbum: newOrd };
      apiFetch(`/api/songs/${s.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSong),
      }).catch((err) =>
        console.error("Error updating song order in album on server:", err),
      );
    });
  };

  // Repesca manual: analiza dinámica interna, BPM y tonalidad de las canciones con audio que
  // todavía no se han analizado. Lo normal es que esto ya haya pasado solo al guardar cada tema
  // (ver dbUpsertSong en el servidor); esto es solo para ponerse al día con canciones subidas
  // antes de que existiera cada parte de esta feature — que no es toda a la vez: BPM y tonalidad
  // se añadieron después de la dinámica, así que una canción puede tener dinámica calculada y
  // aun así no tener nunca bpmDetectadoEn/tonalidadDetectadaEn. Sin comprobar los tres por
  // separado, esas canciones nunca volverían a aparecer como pendientes aunque el botón se
  // pulse mil veces.
  const songsPendingDynamicsAnalysis = safeSongs.filter((s) => {
    const audio = s.audioPrincipalUrl || (s as any).audioUrl;
    return (
      Boolean(audio) &&
      (!s.energiaVariacionCalculadaEn ||
        !s.bpmDetectadoEn ||
        !s.tonalidadDetectadaEn)
    );
  });

  const handleAnalyzeAllDynamics = async () => {
    const pending = songsPendingDynamicsAnalysis;
    if (pending.length === 0 || dynamicsAnalysis?.running) return;

    setDynamicsAnalysis({
      running: true,
      done: 0,
      total: pending.length,
      failedTitles: [],
    });

    const CONCURRENCIA = 2;
    let siguiente = 0;
    let completadas = 0;
    const fallidas: string[] = [];

    const trabajador = async () => {
      while (siguiente < pending.length) {
        const song = pending[siguiente++];
        const audio = song.audioPrincipalUrl || (song as any).audioUrl;
        try {
          const result = await apiFetch<{
            variacionDetectada: number;
            audioAnalizable: boolean;
            bpmDetectado: number | null;
            tonalidadDetectada: string | null;
          }>(`/api/songs/${song.id}/analizar-dinamica`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioUrl: audio }),
          });
          // El backend no marca"analizado" cuando el audio no fue analizable (por ejemplo si
          // la descarga falló) — aquí tampoco: si se hiciera, la canción quedaría marcada como
          // analizada para siempre y la próxima repesca nunca la reintentaría.
          if (!result.audioAnalizable) {
            throw new Error(
              "El audio no se pudo analizar (no accesible o formato no soportado)",
            );
          }
          const ahora = new Date().toISOString();
          setSongs((prev) =>
            prev.map((s) =>
              s.id === song.id
                ? {
                    ...s,
                    energiaVariacion: result.variacionDetectada,
                    energiaVariacionCalculadaEn: ahora,
                    ...(result.bpmDetectado !== null
                      ? { bpm: result.bpmDetectado, bpmDetectadoEn: ahora }
                      : {}),
                    ...(result.tonalidadDetectada
                      ? {
                          tonalidad: result.tonalidadDetectada,
                          tonalidadDetectadaEn: ahora,
                        }
                      : {}),
                  }
                : s,
            ),
          );
        } catch (err) {
          console.warn(
            `No se pudo analizar la dinámica interna de "${song.titulo}":`,
            err,
          );
          fallidas.push(song.titulo);
        }
        completadas++;
        setDynamicsAnalysis({
          running: true,
          done: completadas,
          total: pending.length,
          failedTitles: fallidas,
        });
      }
    };

    await Promise.all(
      Array.from(
        { length: Math.min(CONCURRENCIA, pending.length) },
        trabajador,
      ),
    );
    setDynamicsAnalysis({
      running: false,
      done: pending.length,
      total: pending.length,
      failedTitles: fallidas,
    });
  };

  return (
    <div className="w-full flex flex-col gap-4" data-modulo="discografia">
      {/* Action Buttons: Exportar + Nuevo Disco */}
      <div className="flex flex-row flex-wrap items-center gap-2">
        <Button
          variant="neutral"
          size="xs"
          type="button"
          onClick={() => setExportModalData({ isOpen: true, albumName: "all" })}
          className="items-center gap-1.5"
          title="Exportar canciones de la discografía a Excel, M3U playlist, TXT o PDF"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar</span>
        </Button>

        <div className="relative">
          <Button
            variant="neutral"
            size="xs"
            type="button"
            onClick={() => setShowCreateAlbumMenu((v) => !v)}
            className="items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo disco</span>
          </Button>
          {showCreateAlbumMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowCreateAlbumMenu(false)}
              />
              <div
                className={`menu-pop [--menu-origin:top_left] sm:[--menu-origin:top_right] absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 z-40 w-[min(18rem,calc(100vw-2.5rem))] max-h-[70vh] overflow-y-auto rounded-[var(--r-l)] p-1.5 space-y-1 text-xs border border-[var(--line)] ${"bg-[var(--surface)] text-[var(--ink)]"}`}
              >
                {onCreateAlbum && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateAlbumMenu(false);
                      onCreateAlbum();
                    }}
                    className={`w-full text-left p-2.5 rounded-[var(--r-m)] transition-ui cursor-pointer flex items-start gap-2.5 ${"hover:bg-[var(--surface)]"}`}
                  >
                    <Plus className="w-4 h-4 text-[var(--acc)] shrink-0 mt-0.5" />
                    <span>
                      <span className="text-xs font-semibold text-[var(--ink)] block">
                        Disco vacío
                      </span>
                      <span className="block text-xs text-[var(--ink-2)] mt-0.5">
                        Crea el disco y añade canciones después, una a una.
                      </span>
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateAlbumMenu(false);
                    setBulkUploadAlbum({ name: "", songs: [] });
                  }}
                  className={`w-full text-left p-2.5 rounded-[var(--r-m)] transition-ui cursor-pointer flex items-start gap-2.5 ${"hover:bg-[var(--surface)]"}`}
                >
                  <FolderUp className="w-4 h-4 text-[var(--ok)] shrink-0 mt-0.5" />
                  <span>
                    <span className="text-xs font-semibold text-[var(--ok)] block">
                      Subir disco (MP3/WAV)
                    </span>
                    <span className="block text-xs text-[var(--ink-2)] mt-0.5">
                      Arrastra archivos de audio desde tu ordenador.
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateAlbumMenu(false);
                    setIsSpotifyModalOpen(true);
                  }}
                  className={`w-full text-left p-2.5 rounded-[var(--r-m)] transition-ui cursor-pointer flex items-start gap-2.5 ${"hover:bg-[var(--surface)]"}`}
                >
                  <Disc className="w-4 h-4 text-[var(--ok)] shrink-0 mt-0.5" />
                  <span>
                    <span className="text-xs font-semibold text-[var(--ok)] block">
                      <ShowIcon inline emoji="🟢" />
                      Traer de Spotify
                    </span>
                    <span className="block text-xs text-[var(--ink-2)] mt-0.5">
                      Importa la discografía completa de la banda.
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateAlbumMenu(false);
                    setIsLiveConcertModalOpen(true);
                  }}
                  className={`w-full text-left p-2.5 rounded-[var(--r-m)] transition-ui cursor-pointer flex items-start gap-2.5 ${"hover:bg-[var(--surface)]"}`}
                >
                  <Scissors className="w-4 h-4 text-[var(--acc)] shrink-0 mt-0.5" />
                  <span>
                    <span className="text-xs font-semibold text-[var(--acc)] block">
                      <ShowIcon inline emoji="🔴" />
                      Concierto en vivo a disco
                    </span>
                    <span className="block text-xs text-[var(--ink-2)] mt-0.5">
                      Recorta y cataloga a partir del vídeo o audio de un
                      concierto en vivo.
                    </span>
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search + Filters Section */}
      <div className="w-full flex flex-col gap-3">
        <div className="pin-top flex flex-col gap-3">
          {/* Search Input Bar */}
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-2)] pointer-events-none" />
            <Input
              size="sm"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar canción, tono, letra…"
              className="w-full pl-8 pr-7"
            />
            {searchQuery && (
              <IconButton
                label="Limpiar búsqueda"
                size="icon-xs"
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2"
              >
                <X className="w-3 h-3" />
              </IconButton>
            )}
          </div>

          {/* Quick Filter Tabs + Action Icons */}
          <div className="w-full flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div
              className={`p-0.5 rounded-[var(--r-m)] flex items-center gap-0.5 shrink-0 bg-[var(--sunken)]`}
            >
              <Button
                variant={activeFilterTab === "todos" ? "selected" : "ghost"}
                size="xs"
                type="button"
                onClick={() => setActiveFilterTab("todos")}
              >
                Todos
              </Button>
              <Button
                variant={activeFilterTab === "albumes" ? "selected" : "ghost"}
                size="xs"
                type="button"
                onClick={() => setActiveFilterTab("albumes")}
              >
                Álbumes
              </Button>
              <Button
                variant={activeFilterTab === "singles" ? "selected" : "ghost"}
                size="xs"
                type="button"
                onClick={() => setActiveFilterTab("singles")}
              >
                Singles
              </Button>
            </div>

            {/* Action Icons: Fold/Unfold & Dynamics */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              {filteredAlbums.length > 0 && (
                <Button
                  variant="neutral"
                  size="xs"
                  type="button"
                  onClick={toggleAllAlbums}
                  title={
                    areAllExpanded
                      ? "Plegar todos los discos"
                      : "Desplegar todos los discos"
                  }
                >
                  <Layers className="w-3.5 h-3.5" />
                </Button>
              )}

              {/* Analizar Dinámica Button (Compact & Discreet) */}
              {songsPendingDynamicsAnalysis.length > 0 && (
                <div className="relative inline-flex flex-col items-end">
                  <Button
                    variant="neutral"
                    size="xs"
                    type="button"
                    onClick={handleAnalyzeAllDynamics}
                    disabled={dynamicsAnalysis?.running}
                    className="items-center gap-1"
                    title="Analiza el audio con Iris: dinámica interna, BPM y tonalidad de cada canción"
                  >
                    {dynamicsAnalysis?.running ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-[var(--ink-2)]" />
                        <span>
                          {dynamicsAnalysis.done}/{dynamicsAnalysis.total}
                        </span>
                      </>
                    ) : (
                      <>
                        <Headphones className="w-3 h-3 text-[var(--ink-2)]" />
                        <span className="hidden xs:inline">Audio IA</span>
                        <span>({songsPendingDynamicsAnalysis.length})</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Albums Stack */}
        <div className="w-full flex flex-col gap-4">
          {filteredAlbums.map((album) => {
            const rawAlbumSongs = safeSongs.filter((s) => {
              const songAlbum = (s.albumDisco || s.album || "").trim();
              const albumClean = album.trim();
              const belongsToAlbum =
                albumClean === "Singles / Sin Disco"
                  ? !songAlbum || songAlbum === "Singles / Sin Disco"
                  : songAlbum === albumClean ||
                    songAlbum.toLowerCase() === albumClean.toLowerCase();

              if (!belongsToAlbum) return false;

              if (
                cleanSearchQuery &&
                !album.toLowerCase().includes(cleanSearchQuery)
              ) {
                return songMatchesSearch(s, cleanSearchQuery);
              }
              return true;
            });

            const sortedAlbumSongs = [...rawAlbumSongs].sort((a, b) => {
              const oA = typeof a.ordenAlbum === "number" ? a.ordenAlbum : 999;
              const oB = typeof b.ordenAlbum === "number" ? b.ordenAlbum : 999;
              return oA - oB;
            });

            const coverUrl =
              rawAlbumSongs.find((s) => s.portadaUrl)?.portadaUrl ||
              bandLogoUrl;
            const isExpanded = cleanSearchQuery
              ? true
              : expandedAlbums[album] === true;

            const isPlayingAlbum = !!(
              activePlayerSong &&
              isPlayerPlaying &&
              rawAlbumSongs.some((s) => s.id === activePlayerSong.id)
            );

            const handlePlayAlbum = (e?: React.MouseEvent) => {
              if (e) e.stopPropagation();
              if (onSelectSong && sortedAlbumSongs.length > 0) {
                if (isPlayingAlbum) {
                  onSelectSong(sortedAlbumSongs[0], false, sortedAlbumSongs);
                } else {
                  onSelectSong(sortedAlbumSongs[0], true, sortedAlbumSongs);
                }
              }
            };

            return (
              <div
                key={album}
                className={`rounded-[var(--r-l)] overflow-hidden transition-ui duration-200 ${"bg-[var(--surface)]"}`}
              >
                {/* Compact Album Header Bar */}
                <div
                  onClick={() => toggleAlbumExpand(album)}
                  className={`p-3.5 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer select-none transition-colors ${"hover:bg-[var(--sunken)]/80"}`}
                >
                  {/* Left: Cover & Information */}
                  <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1 w-full">
                    <div
                      className="shrink-0 relative group"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEditAlbum && album !== "Singles / Sin Disco") {
                          onEditAlbum(album);
                        }
                      }}
                      title={onEditAlbum && album !== "Singles / Sin Disco" ? "Haz clic para cambiar la portada o editar el disco" : undefined}
                    >
                      <AlbumCover
                        url={coverUrl}
                        onPlay={onSelectSong ? handlePlayAlbum : undefined}
                        isPlaying={isPlayingAlbum}
                        className="w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-[var(--r-m)] sm:rounded-[var(--r-l)] object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded-[var(--r-s)] bg-[var(--acc)]/10 text-[var(--ink)] text-micro font-medium inline-flex items-center gap-1">
                          <Disc3 className="w-3 h-3 text-[var(--acc)]" />
                          {album === "Singles / Sin Disco"
                            ? "SENCILLOS e INÉDITAS"
                            : "ÁLBUM OFICIAL"}
                        </span>
                      </div>

                      <h3
                        className="text-sm sm:text-base md:text-lg font-bold tracking-tight truncate leading-snug text-[var(--ink)]"
                        title={album}
                      >
                        {album}
                      </h3>

                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-[var(--ink-2)] mt-1 flex-wrap">
                        <span className="font-medium text-[var(--ink-2)] truncate max-w-[140px]">
                          {bandName || "Banda"}
                        </span>
                        <span>•</span>
                        <span>
                          {sortedAlbumSongs.length}{" "}
                          {sortedAlbumSongs.length === 1
                            ? "canción"
                            : "canciones"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[var(--ink-2)]" />
                          {formatTotalDuration(sortedAlbumSongs)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Controls & Fold/Unfold Chevron */}
                  <div
                    className="flex items-center gap-2 shrink-0 self-end sm:self-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {sortedAlbumSongs.length > 0 && onSelectSong && (
                      <Button
                        variant="neutral"
                        size="xs"
                        type="button"
                        onClick={handlePlayAlbum}
                        className="items-center gap-1"
                        title={
                          isPlayingAlbum ? "Pausar disco" : "Reproducir disco"
                        }
                      >
                        {isPlayingAlbum ? (
                          <>
                            <Pause className="w-3 h-3 fill-current" />
                            <span className="hidden xs:inline">Pausar</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current ml-0.5" />
                            <span className="hidden xs:inline">Play</span>
                          </>
                        )}
                      </Button>
                    )}

                    <ActionMenu
                      label={`Más acciones de ${album}`}
                      items={[
                        {
                          label: "Editar disco y portada",
                          icon: Edit3,
                          hidden: !onEditAlbum,
                          onSelect: () => onEditAlbum?.(album),
                        },
                        {
                          label: "Exportar disco",
                          icon: Download,
                          hidden: sortedAlbumSongs.length === 0,
                          onSelect: () =>
                            setExportModalData({
                              isOpen: true,
                              albumName: album,
                            }),
                        },
                        {
                          label: "Subir audios",
                          icon: FolderUp,
                          hidden: sortedAlbumSongs.length === 0,
                          onSelect: () =>
                            setBulkUploadAlbum({
                              name: album,
                              songs: sortedAlbumSongs,
                            }),
                        },
                        {
                          label: "Eliminar álbum",
                          icon: Trash2,
                          tone: "danger",
                          hidden:
                            !onRequestDeleteAlbum ||
                            album === "Singles / Sin Disco",
                          onSelect: () =>
                            onRequestDeleteAlbum?.(
                              album,
                              sortedAlbumSongs.length,
                            ),
                        },
                      ]}
                    />

                    {/* Expand / Collapse Toggle Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAlbumExpand(album);
                      }}
                      className={`px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-medium flex items-center gap-1.5 transition-ui cursor-pointer ${
                        isExpanded
                          ? "bg-[var(--sunken)] text-[var(--ink)]"
                          : "bg-[var(--sunken)]/80 text-[var(--ink-2)] hover:bg-[var(--sunken)]"
                      }`}
                    >
                      <span className="hidden xs:inline">
                        {isExpanded
                          ? "Ocultar"
                          : `Temas (${sortedAlbumSongs.length})`}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsible Tracklist Section */}
                {isExpanded && (
                  <div className={`p-3 sm:p-4 space-y-1.5 bg-[var(--bg)]/70`}>
                    {sortedAlbumSongs.map((s, idx) => {
                      const isCurrentTrack = activePlayerSong?.id === s.id;
                      const isDraggingThis =
                        draggedItem?.album === album &&
                        draggedItem?.index === idx;
                      const isDragOverThis =
                        dragOverItem?.album === album &&
                        dragOverItem?.index === idx;

                      return (
                        <SongCardRow
                          key={s.id}
                          song={s}
                          index={idx + 1}
                          isPlayingCurrent={isCurrentTrack}
                          isPlayerPlaying={isPlayerPlaying}
                          onPlay={() =>
                            onSelectSong?.(s, true, sortedAlbumSongs)
                          }
                          onSelect={() =>
                            onSelectSong?.(s, false, sortedAlbumSongs)
                          }
                          onToggleFavorite={() => toggleFavoriteSong(s.id)}
                          onOpenChords={
                            onOpenChords ? () => onOpenChords(s) : undefined
                          }
                          onOpenMemberNotes={
                            onOpenMemberNotes
                              ? () => onOpenMemberNotes(s)
                              : undefined
                          }
                          onOpenStudio={
                            onOpenStudio ? () => onOpenStudio(s) : undefined
                          }
                          onEditSong={
                            onEditSong ? () => onEditSong(s) : undefined
                          }
                          onDeleteSong={
                            onDeleteSong ? () => onDeleteSong(s.id) : undefined
                          }
                          onShareSong={
                            onShareSong ? () => onShareSong(s) : undefined
                          }
                          externalLink={s.enlaceAcordes}
                          showAlbumBadge={false}
                          draggable={sortedAlbumSongs.length > 1}
                          isDragging={isDraggingThis}
                          isDragOver={isDragOverThis}
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = "move";
                            setDraggedItem({ album, index: idx });
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            if (
                              draggedItem?.album === album &&
                              dragOverItem?.index !== idx
                            ) {
                              setDragOverItem({ album, index: idx });
                            }
                          }}
                          onDragLeave={() => {
                            if (
                              dragOverItem?.album === album &&
                              dragOverItem?.index === idx
                            ) {
                              setDragOverItem(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggedItem && draggedItem.album === album) {
                              handleDropSongInAlbum(
                                album,
                                sortedAlbumSongs,
                                draggedItem.index,
                                idx,
                              );
                            }
                            setDraggedItem(null);
                            setDragOverItem(null);
                          }}
                          onDragEnd={() => {
                            setDraggedItem(null);
                            setDragOverItem(null);
                          }}
                          showReorder={sortedAlbumSongs.length > 1}
                          canMoveUp={idx > 0}
                          canMoveDown={idx < sortedAlbumSongs.length - 1}
                          onMoveUp={() =>
                            handleMoveSongInAlbum(
                              album,
                              sortedAlbumSongs,
                              s.id,
                              "up",
                            )
                          }
                          onMoveDown={() =>
                            handleMoveSongInAlbum(
                              album,
                              sortedAlbumSongs,
                              s.id,
                              "down",
                            )
                          }
                          colors={colors}
                        />
                      );
                    })}

                    {sortedAlbumSongs.length === 0 && (
                      <div className="text-center py-6 text-[var(--ink-2)] text-xs italic font-sans bg-[var(--ink)]/5 rounded-[var(--r-l)]">
                        Disco sin canciones asignadas. Haz clic en “Gestionar”
                        para añadir temas a este álbum.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {filteredAlbums.length === 0 && (
            <div className="text-center py-12 space-y-4">
              <PublicoSilhouette
                opacity={0.12}
                size="medium"
                className="mx-auto"
              />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--ink)]">
                  {cleanSearchQuery
                    ? "No encontramos coincidencias"
                    : "La discografía está vacía"}
                </p>
                <p className="text-xs text-[var(--ink-2)] max-w-sm mx-auto">
                  {cleanSearchQuery
                    ? `Ningún disco o tema coincide con"${searchQuery}". Prueba otras palabras clave.`
                    : "Graba tu primer álbum para llevarlo al directo. Cada disco es una historia."}
                </p>
              </div>
              {cleanSearchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-3 px-3 py-1.5 rounded-[var(--r-pill)] bg-[var(--surface)]/20 text-[var(--ok)] text-xs font-sans font-bold hover:bg-[var(--surface)]/30 transition-ui cursor-pointer inline-flex items-center gap-1.5 mx-auto"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Limpiar búsqueda</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Live Concert to Album Modal */}
        <LiveConcertToAlbumModal
          isOpen={isLiveConcertModalOpen}
          onClose={() => setIsLiveConcertModalOpen(false)}
          bandName={bandName || "Nuestra Banda"}
          colors={colors}
          onSaveAlbumToCatalog={handleSaveLiveConcertAlbum}
          onSaveSetlist={(newSetlist) => {
            if (setSetlists) {
              setSetlists((prev: any[]) => [
                newSetlist,
                ...(Array.isArray(prev) ? prev : []),
              ]);
            }
          }}
        />

        {/* Spotify Discography Importer Modal */}
        <SpotifyDiscographyModal
          isOpen={isSpotifyModalOpen}
          onClose={() => setIsSpotifyModalOpen(false)}
          bandName={bandName || "Tu Banda"}
          existingSongs={songs}
          colors={colors}
          onSongsImported={(updatedSongs) => {
            setSongs(updatedSongs);
          }}
        />

        {/* Bulk Album Audio Master Uploader Modal */}
        {bulkUploadAlbum && (
          <BulkAlbumAudioUploaderModal
            isOpen={Boolean(bulkUploadAlbum)}
            onClose={() => setBulkUploadAlbum(null)}
            albumName={bulkUploadAlbum.name}
            albumSongs={bulkUploadAlbum.songs}
            colors={colors}
            bandId={bandName || "Tu Banda"}
            onSaveUpdatedSongs={(updatedAlbumSongs, newAlbumName) => {
              const existingIds = new Set(songs.map((s) => s.id));
              const updatedMap = new Map<string, Song>();
              const newlyCreated: Song[] = [];

              updatedAlbumSongs.forEach((s) => {
                if (existingIds.has(s.id)) {
                  updatedMap.set(s.id, s);
                } else {
                  newlyCreated.push(s);
                }
              });

              const mergedSongs = [
                ...songs.map((s) => updatedMap.get(s.id) || s),
                ...newlyCreated,
              ];

              setSongs(mergedSongs);
              saveSongsToLocalStorageSafely(mergedSongs);

              if (newAlbumName) {
                setExpandedAlbums((prev) => ({
                  ...prev,
                  [newAlbumName]: true,
                }));
              }
            }}
          />
        )}

        {/* Export Album Songs Modal */}
        <ExportAlbumSongsModal
          isOpen={exportModalData.isOpen}
          onClose={() => setExportModalData({ isOpen: false })}
          albumName={exportModalData.albumName}
          songs={songs}
          albumsList={allNonEmptyAlbums}
          bandName={bandName || "Tu Banda"}
          colors={colors}
        />
      </div>
    </div>
  );
};
