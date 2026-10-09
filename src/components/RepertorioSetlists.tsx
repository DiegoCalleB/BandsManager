/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/set-state-in-effect,
 react-hooks/exhaustive-deps,
 react-hooks/purity,
 react-hooks/immutability
*/
import { analizarAcordesDelAudio } from "../utils/analisisAcordesCliente";
import { PopoverAncla } from './ui/PopoverAncla';
import { guardarOReverter } from "../utils/guardarConReversion";
import { getLowLatencyAudioStream } from "../utils/audioLatency";
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { ShowItemModal } from "./repertorio/ShowItemModal";
import { api } from "../services/api";
import {
  ThemeColors,
  Song,
  Setlist,
  SetlistItem,
  Concert,
  Rehearsal,
  SetlistShortcut,
} from "../types";
import { useLanguage } from "../context/LanguageContext";
import { usePlayer } from "../context/PlayerContext";
import {
  Disc3,
  Music,
  Plus,
  Search,
  X,
  Edit3,
  Trash2,
  Copy,
  Download,
  Clock,
  Mic,
  FileText,
  Check,
  Layers,
  ExternalLink,
  Printer,
  Sparkles,
  Brain,
  Sliders,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Eye,
  EyeOff,
  Headphones,
  Play,
  Pause,
  Volume2,
  Upload,
  Zap,
  MessageSquare,
  Radio,
  Flag,
  SkipBack,
  SkipForward,
  Repeat,
  Square,
  VolumeX,
  Disc,
  MicOff,
  Heart,
  Camera,
  Image,
  Star,
  ChevronUp,
  ChevronDown,
  ListPlus,
  Users,
  GripVertical,
  ImagePlus,
  MoreHorizontal,
  TrendingUp,
  Timer,
  Lightbulb,
  AlertTriangle,
  Pin,
  Gauge,
  Undo2,
  Wand2,
  MessageCircle,
} from "lucide-react";
import { PublicoSilhouette } from "./ui/PublicoSilhouette";
import { Button, Chip, IconButton, Input, MenuItem, Select, ShowIcon } from './ui';
import { RepertorioNavBar } from "./repertorio/RepertorioNavBar";
import { SetlistAddBar } from "./repertorio/SetlistAddBar";
import { ActiveSetlistHeader } from "./repertorio/ActiveSetlistHeader";
import { SetlistItemsList } from "./repertorio/SetlistItemsList";
import { RepertorioModalsContainer } from "./repertorio/RepertorioModalsContainer";
import { SetlistsTabContentView } from "./repertorio/SetlistsTabContentView";
import { CatalogoTabContentView } from "./repertorio/CatalogoTabContentView";
import SongStudioModal from "./SongStudioModal";
import { Atril } from "./Atril";
import { ShareModal } from "./ShareModal";
import { useShareModal } from "../hooks/useShareModal";
import { useCatalogFilters } from "../hooks/useCatalogFilters";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import { useStagePlayer } from "../hooks/useStagePlayer";
import { useSetlistTransitionsOptimizer } from "../hooks/useSetlistTransitionsOptimizer";
import { useSetlistEnergyAnalysis } from "../hooks/useSetlistEnergyAnalysis";
import { useActiveSetlistMetrics } from "../hooks/useActiveSetlistMetrics";
import { useRepertorioSync } from "../hooks/useRepertorioSync";
import { useRepertorioSongAlbumHandlers } from "../hooks/useRepertorioSongAlbumHandlers";
import { ConfirmDeleteModal } from "./repertorio/ConfirmDeleteModal";
import {
  ConfirmDeleteAlbumModal,
  ConfirmDeleteAlbumData,
} from "./repertorio/ConfirmDeleteAlbumModal";
import { AssignSongsToAlbumModal } from "./repertorio/AssignSongsToAlbumModal";
import { AssignSetlistModal } from "./repertorio/AssignSetlistModal";
import { SongModal } from "./repertorio/SongModal";
import { SetlistModal } from "./repertorio/SetlistModal";
import { AddSongsToSetlistModal } from "./repertorio/AddSongsToSetlistModal";
import { PdfExportModal } from "./repertorio/PdfExportModal";
import { MemberNotesModal } from "./repertorio/MemberNotesModal";
import { SetlistAIAnalysisModal } from "./repertorio/SetlistAIAnalysisModal";
import {
  PerfectSetlistModal,
  PerfectSetlistAction,
  PerfectSetlistPlan,
  SetlistFeedbackInput,
} from "./repertorio/PerfectSetlistModal";
import { useModuleTutorial } from "../hooks/useModuleTutorial";
import { ModuleTutorialModal } from "./common/ModuleTutorialModal";
import { ImportSetlistModal } from "./repertorio/ImportSetlistModal";
import { DiscografiaView } from "./repertorio/DiscografiaView";
import { SongCardRow } from "./repertorio/SongCardRow";
import { SetlistSongRow } from "./repertorio/SetlistSongRow";
import { SetlistShowItemRow } from "./repertorio/SetlistShowItemRow";
import { CatalogoGeneralView } from "./repertorio/CatalogoGeneralView";
import { SetlistStatsSummaryBar } from "./repertorio/SetlistStatsSummaryBar";
import { EnergyMapCard } from "./repertorio/EnergyMapCard";
import { SpotifyDiscographyModal } from "./repertorio/SpotifyDiscographyModal";
import { EscenarioView } from "./repertorio/EscenarioView";
import { SetlistPerformanceView } from "./SetlistPerformanceView";
import { cacheActiveStageSetlist } from "../utils/stageOfflineCache";
import {
  formatSongTitle,
  normalizeSongTitlesInList,
} from "../utils/formatSongTitle";
import { AlbumCover } from "./AlbumCover";
import SpotifyPlayerBar from "./SpotifyPlayerBar";
import {
  uploadFileToServer,
  parseGoogleDriveAudioUrl,
  isGoogleDriveUrl,
  saveSongsToLocalStorageSafely,
  saveSetlistsToLocalStorageSafely,
  resolveAudioUrl,
} from "../utils/audioStorage";
import {
  calculateSetlistStats,
  resolveBandMembers,
  isSongMarkedForMember,
  withSongMarkedForMember,
  withSongFlagsForMember,
  formatSecondsToMinutes,
  formatItemDuration,
  BandMemberOption,
} from "../utils/repertorioUtils";
import {
  queuePendingSetlistSync,
  clearPendingSetlistSync,
  getPendingSetlistSyncs,
} from "../utils/offlineSync";
import {
  analyzeSetlistEnergy,
  getEnergyInfo,
  calcularCurvaEnergiaIdeal,
} from "../utils/energyPacingUtils";
import {
  parseTonalidad,
  evaluarTransicionArmonica,
} from "../utils/harmonicAnalysis";
import {
  optimizarOrdenPorTransiciones,
  costeTotalTransiciones,
  sugerirMejorPuntoParaChapa,
  SugerenciaChapa,
  HuecoCancion,
  evaluarCalidadUnion,
  EvaluacionUnion,
} from "../utils/setlistCompatibility";
import { getSemitoneDifference } from "../utils/chordUtils";
import { sobrescribirModulo } from "../utils/moduloGlobal";
import { EnergyChart, EnergyChartPoint } from "./repertorio/EnergyChart";
import { SongTransitionPreviewModal } from "./repertorio/SongTransitionPreviewModal";
import { titlesMatch } from "../utils/songTitleMatch";
import { SAMPLER_SONGS, SAMPLER_SETLISTS } from "../config/sampleRepertoire";
import { MOP_SONGS, MOP_SETLISTS } from "../db_seed";

interface RepertorioSetlistsProps {
  colors: ThemeColors;
  concerts: Concert[];
  rehearsals: Rehearsal[];
  bandName?: string;
  bandId?: string;
  bandUsers?: any[];
  bandLogoUrl?: string;
  onUpdateConcert?: (id: string, fields: Partial<Concert>) => void;
  onUpdateRehearsal?: (id: string, fields: Partial<Rehearsal>) => void;
  view?: "repertorio" | "catalogo" | "discografia";
  currentUser?: any;
  onNavigate?: (view: "repertorio" | "catalogo" | "discografia") => void;
}

import {
  BAKANDEYA_DEMO_MEMBERS,
  SHOW_ITEM_TYPES,
  TRANSPARENT_DRAG_IMAGE,
  DEFAULT_SONGS,
  DEFAULT_SETLISTS,
} from "../config/defaultRepertoire";
import {
  buildStageSetlistHtml,
  generatePdfStylesheet,
  getTokenValueForPrint,
} from "../utils/repertorioPdf";

export { SHOW_ITEM_TYPES };

export function formatSecondsToMmSs(secs: number): string {
  if (!secs || isNaN(secs) || secs < 0) return "00:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}


export default function RepertorioSetlists({
  colors,
  concerts,
  rehearsals,
  bandName,
  bandId,
  bandUsers,
  bandLogoUrl,
  onUpdateConcert,
  onUpdateRehearsal,
  view,
  currentUser,
  onNavigate,
}: RepertorioSetlistsProps) {
  const { t } = useLanguage();
  const isLightTheme =
    (typeof document !== "undefined" &&
      document.documentElement.dataset.theme === "light") ||
    colors.name?.toLowerCase().includes("light") ||
    colors.bg.includes("f8fafc") ||
    colors.bg.includes("white") ||
    colors.bg.includes("neutral-50") ||
    false;
  const bName = bandName || "Tu Banda";

  const {
    isOpen: isTutorialOpen,
    openTutorial,
    closeTutorial,
  } = useModuleTutorial("repertorio");

  const cleanBand = (bandId || "").replace(/^(band|reg)-/, "").toLowerCase();
  const isBakandeya = cleanBand === "bakandeya";
  const isMasterOfPrompts = cleanBand === "master-of-prompts";

  // Plantilla de Bakandeya solo para la propia Bakandeya; el resto de bandas ven a sus
  // miembros reales (bandUsers, ya filtrados por banda en el servidor) y nunca el roster
  // de otra banda — este mismo bug (ver MemberNotesModal/PdfExportModal/SongModal más abajo)
  // hacía que cualquier banda viera hardcodeados los músicos de Bakandeya en"Repertorios".
  const bandRosterMembers: BandMemberOption[] = useMemo(() => {
    if (isBakandeya) return BAKANDEYA_DEMO_MEMBERS;
    return resolveBandMembers(bandUsers);
  }, [isBakandeya, bandUsers]);

  // Helper to filter out template songs for non-Bakandeya bands
  const sanitizeBandSongs = React.useCallback(
    (rawList: Song[]): Song[] => {
      if (!Array.isArray(rawList)) return [];
      if (isBakandeya) return rawList;
      return rawList.filter((s) => {
        if (!s || typeof s !== "object") return false;
        const sId = (s.id || "").toLowerCase();
        if (sId.startsWith("mop-song-") && isMasterOfPrompts) return true;
        if (sId.startsWith("sample-track-")) return true;
        if (
          sId.startsWith("song-cm-") ||
          /^song-[1-8]$/.test(sId) ||
          sId.startsWith("live_song_")
        ) {
          return false;
        }
        return true;
      });
    },
    [isBakandeya, isMasterOfPrompts],
  );

  const sanitizeBandSetlists = React.useCallback(
    (rawList: Setlist[]): Setlist[] => {
      if (!Array.isArray(rawList)) return [];
      if (isBakandeya) return rawList;
      return rawList.filter((sl) => {
        if (!sl || typeof sl !== "object") return false;
        const slId = (sl.id || "").toLowerCase();
        if (slId.startsWith("setlist-sample-")) return true;
        if (slId === "setlist-1" || slId === "setlist-2") return false;
        return true;
      });
    },
    [isBakandeya],
  );

  // Navigation tab inside module
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<"catalogo" | "setlists">(
    "setlists",
  );
  const [catalogoViewMode, setCatalogoViewMode] = useState<
    "albumes" | "canciones"
  >("albumes");

  // El acento global (sidebar, modales) sigue a la subpestaña: Discografía tiene su propio verde.
  useEffect(() => {
    sobrescribirModulo(activeTab === "catalogo" ? "discografia" : null);
    return () => sobrescribirModulo(null);
  }, [activeTab]);

  // Sync activeTab with the view prop (when navigating from sidebar)
  useEffect(() => {
    if (view === "catalogo") {
      setActiveTab("catalogo");
      setCatalogoViewMode("canciones");
    } else if (view === "discografia") {
      setActiveTab("catalogo");
      setCatalogoViewMode("albumes");
    } else {
      // repertorio, undefined, o el antiguo'directo' (módulo eliminado) — aterriza en Repertorio
      // en vez de en una vista muerta.
      setActiveTab("setlists");
    }
  }, [view]);

  const handleTabChange = useCallback(
    (newTab: "catalogo" | "setlists") => {
      setActiveTab(newTab);
      if (onNavigate) {
        const targetView = newTab === "setlists" ? "repertorio" : "discografia";
        onNavigate(targetView);
      }
    },
    [onNavigate],
  );

  // Songs Repertoire State
  const [songs, setSongs] = useState<Song[]>(() => {
    try {
      const key = `band_songs_${cleanBand || "default"}`;
      const saved = localStorage.getItem(key);
      const parsed = saved ? JSON.parse(saved) : [];
      const sanitized = isBakandeya
        ? parsed
        : Array.isArray(parsed)
          ? parsed.filter((s: any) => {
              const sId = (s?.id || "").toLowerCase();
              if (sId.startsWith("sample-track-")) return true;
              if (sId.startsWith("live_song_")) return true;
              return !sId.startsWith("song-cm-") && !/^song-[1-8]$/.test(sId);
            })
          : [];
      if (sanitized.length > 0) {
        return sanitized;
      }
      return isBakandeya ? DEFAULT_SONGS : SAMPLER_SONGS;
    } catch {
      return isBakandeya ? DEFAULT_SONGS : SAMPLER_SONGS;
    }
  });

  useEffect(() => {
    let isMounted = true;
    const loadSongs = async () => {
      try {
        const res = await api.getSongs();
        // Solo actualizar si la API devuelve canciones (array no-vacío)
        if (
          isMounted &&
          res?.songs &&
          Array.isArray(res.songs) &&
          res.songs.length > 0
        ) {
          setSongs(res.songs);
        }
      } catch (err) {
        console.error("Failed to load songs:", err);
      }
    };
    loadSongs();
    return () => {
      isMounted = false;
    };
  }, [cleanBand]);

  // Setlists State
  const [setlists, setSetlists] = useState<Setlist[]>(() => {
    try {
      const key = `band_setlists_${cleanBand || "default"}`;
      const saved = localStorage.getItem(key);
      const parsed = saved ? JSON.parse(saved) : [];
      const sanitized = isBakandeya
        ? parsed
        : Array.isArray(parsed)
          ? parsed.filter((sl: any) => {
              const slId = (sl?.id || "").toLowerCase();
              if (slId.startsWith("setlist-sample-")) return true;
              return slId !== "setlist-1" && slId !== "setlist-2";
            })
          : [];
      if (sanitized.length > 0) {
        return sanitized;
      }
      return isBakandeya ? DEFAULT_SETLISTS : SAMPLER_SETLISTS;
    } catch {
      return isBakandeya ? DEFAULT_SETLISTS : SAMPLER_SETLISTS;
    }
  });

  // Selected Active Setlist ID
  // Recuerda el último setlist con el que se trabajó entre sesiones/recargas, para no tener que
  // volver a buscarlo cada vez que se entra al módulo. Si el id guardado ya no existe (se borró
  // el setlist, o `setlists` aún no ha cargado en este render), activeSetlist más abajo ya cae a
  // setlists[0] como fallback — no hace falta validar aquí.
  const ACTIVE_SETLIST_STORAGE_KEY = "bandmanager_active_setlist_id";
  const [activeSetlistId, setActiveSetlistId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_SETLIST_STORAGE_KEY);
      if (saved) return saved;
    } catch {
      // localStorage puede no estar disponible (modo privado estricto, etc.)
    }
    return setlists[0]?.id || "";
  });

  useEffect(() => {
    if (!activeSetlistId) return;
    try {
      localStorage.setItem(ACTIVE_SETLIST_STORAGE_KEY, activeSetlistId);
    } catch {
      // Ignorado a propósito: perder la persistencia no debe romper la navegación.
    }
  }, [activeSetlistId]);

  const activeSetlist = useMemo(
    () => setlists.find((s) => s.id === activeSetlistId) || setlists[0] || null,
    [setlists, activeSetlistId],
  );

  // Performance mode for showing song structures during concert
  const [performanceSetlistId, setPerformanceSetlistId] = useState<
    string | null
  >(null);
  const [performanceInitialMode, setPerformanceInitialMode] = useState<
    "directo" | "ensayo"
  >("directo");

  // Custom"quick add" shortcuts the band created itself for the"Rápidos" row below, on top of
  // the built-in ones (Presentación, Chapa, BIS...). Persisted per band in Supabase via
  // /api/setlist-shortcuts so every member of the band sees the same set.
  const [customShortcuts, setCustomShortcuts] = useState<SetlistShortcut[]>([]);
  const [isAddingShortcut, setIsAddingShortcut] = useState(false);
  const [newShortcutIcon, setNewShortcutIcon] = useState("⭐");
  const [newShortcutLabel, setNewShortcutLabel] = useState("");
  const [newShortcutMinutes, setNewShortcutMinutes] = useState<number>(1);

  const {
    shareModalData,
    setShareModalData,
    handleShareSetlist,
    handleShareSong,
  } = useShareModal(songs, bName);

  // Filter States for Catalog
  const {
    groupByAlbum,
    setGroupByAlbum,
    catalogSearch,
    setCatalogSearch,
    catalogAlbumFilter,
    setCatalogAlbumFilter,
    catalogStatusFilter,
    setCatalogStatusFilter,
    albumsList,
    filteredSongs,
  } = useCatalogFilters(songs);

  // Helper to parse"mm:ss" to seconds
  const parseMmSsToSeconds = (timeStr: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.trim().split(":");
    if (parts.length === 2) {
      const min = parseInt(parts[0], 10) || 0;
      const sec = parseInt(parts[1], 10) || 0;
      return min * 60 + sec;
    }
    const minOnly = parseInt(timeStr, 10) || 0;
    return minOnly * 60;
  };

  const {
    activePlayerSong,
    setActivePlayerSong,
    playerAutoPlay,
    playSignal,
    isPlayerPlaying,
    setIsPlayerPlaying,
    playerTransposeSemitones,
    handleSelectPlayerSong,
  } = useAudioPlayer();

  // Global player context for persistent playback across modules
  const {
    currentSong: playerCurrentSong,
    setCurrentSong,
    setSongs: setPlayerSongs,
    setIsPlaying: setPlayerIsPlaying,
  } = usePlayer();

  // Concert Player (Reproductor de Concierto / Modo Escenario)
  const {
    stageAudioRef,
    stageAudioRefB,
    stagePlayingIndex,
    setStagePlayingIndex,
    stageIsPlaying,
    setStageIsPlaying,
    stageAutoplayNext,
    setStageAutoplayNext,
    stageCurrentTime,
    setStageCurrentTime,
    stageItemDuration,
    stageResolvedUrl,
    stageCrossfadeEnabled,
    setStageCrossfadeEnabled,
    isCrossfading,
    handleStageAudioEnded,
    handleStageTimeUpdate,
    handleStageSeek,
    handleStagePrev,
    handleStageNext,
    toggleStagePlayPause,
  } = useStagePlayer(activeSetlist, songs, parseMmSsToSeconds);

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
  // Mostrar/ocultar el Mapa de Energía del Show (visible por defecto: es la pieza más"wow")
  const [showEnergyMap, setShowEnergyMap] = useState<boolean>(true);
  // Curva"ideal" de referencia superpuesta al Mapa de Energía — visible por defecto, con su
  // propio toggle porque puede distraer una vez que ya conoces bien tu propio repertorio.
  const [showIdealCurve, setShowIdealCurve] = useState<boolean>(true);
  // Apagada por defecto: superpuesta a la curva de energía (ya de por sí con varios colores +
  // curva ideal + avisos de choque), la línea de BPM saturaba demasiado el gráfico en pantallas
  // estrechas de móvil — se deja como opt-in para quien quiera mirarla en un momento concreto.
  const [showBpmLine, setShowBpmLine] = useState<boolean>(false);
  // A diferencia del BPM, la tonalidad se ve por defecto — es la que más pedía Diego. Con muchos
  // temas seguidos las etiquetas se pisan si no hay hueco: para eso está el botón 🎼 de un toque
  // (o el zoom 🔍) para ocultarla o separarla rápido.
  const [showTonalidad, setShowTonalidad] = useState<boolean>(true);
  //"Modo zoom": ensancha el gráfico (más separación horizontal entre puntos) dentro de un
  // contenedor con scroll propio, para poder leer BPM/tonalidad por tramos sin que se amontonen.
  const [chartZoom, setChartZoom] = useState<boolean>(false);
  // Mostrar u ocultar los indicadores de unión (ticks ✓ o aspas ✕) en el mapa de energía
  // Apagado por defecto: con el fix del yAxisId (ver EnergyChart) estas insignias ✓/✕ pasaron
  // de estar rotas en silencio a pintarse SIEMPRE, una por cada transición entre canciones
  // consecutivas — en un setlist normal eso es ruido constante encima de la curva. El toggle
  // de abajo ("✓ / ✕ Calidad de uniones") sigue ahí para quien las quiera activar.
  const [showTransitionBadges, setShowTransitionBadges] =
    useState<boolean>(false);
  // Ajustes secundarios del gráfico (curva ideal, leyenda de colores) agrupados en un solo menú
  //"⚙️" en vez de ir cada uno como botón/fila propia — demasiadas opciones sueltas a la vista era
  // justo la queja:"estamos empezando a crear un monstruo con demasiadas opciones en pantalla".
  const [showChartSettingsMenu, setShowChartSettingsMenu] = useState(false);
  // Punto de entrada único al asistente IA del repertorio — antes había dos botones lado a lado
  // (Análisis IA / Setlist Perfecto) sin que quedara claro cuál usar; ahora un solo botón abre un
  // selector con las dos opciones explicadas, cada una sigue siendo el flujo ya existente.
  const [showAssistantChooser, setShowAssistantChooser] = useState(false);
  // Avisos heurísticos plegados por defecto — antes ocupaban una fila siempre visible en pantalla
  // aunque no hubiera nada urgente que mirar.
  const [showHeuristicWarnings, setShowHeuristicWarnings] = useState(false);
  // Métricas secundarias del setlist (interludios, bloques, perfil de dinámica) plegadas: la fila
  // siempre visible se queda en las 3 que de verdad se miran (temas · duración · BPM). Antes las 5
  // pills + el badge de perfil iban en un flex-wrap que en móvil se convertía en 5-6 líneas
  // apiladas ANTES del gráfico — ver AGENTS.md §6 (simplicidad en pantalla).
  const [showSetlistStats, setShowSetlistStats] = useState(false);
  // Acciones secundarias del setlist (compartir, asignar a bolo, imprimir, editar detalles) en un
  // único menú"⋯" en vez de tres botones de texto permanentes: no se usan en la mayoría de visitas.
  const [showSetlistActionsMenu, setShowSetlistActionsMenu] = useState(false);
  // Acciones secundarias del catálogo (agrupar por álbum, nombres propios) en menú "⋯"
  const [showCatalogActionsMenu, setShowCatalogActionsMenu] = useState(false);
  // Reproducir el concierto dentro de la pestaña Repertorio con la consola del reproductor
  // (antes vivía en la pestaña Directo, ahora está embebida en Repertorio con toggle)
  const [showConcertPlayer, setShowConcertPlayer] = useState(false);
  // Modal de análisis avanzado con IA
  const [showAIAnalysisModal, setShowAIAnalysisModal] = useState(false);
  // Modal del plan de"Setlist Perfecto" (reordenar + añadir/quitar canciones del catálogo + bloques)
  const [showPerfectSetlistModal, setShowPerfectSetlistModal] = useState(false);
  // Modal para importar un repertorio ya impreso desde una foto o PDF, analizado con IA
  const [showImportSetlistModal, setShowImportSetlistModal] = useState(false);
  // El plan se genera y aplica sobre una COPIA del setlist activo (ver handleGeneratePerfectSetlist),
  // Resultados del análisis IA guardados (para mostrar en la vista sin abrir modal)
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  // IDs de canciones a resaltar en el gráfico cuando se interactúa con sugerencias
  const [highlightedSongIds, setHighlightedSongIds] = useState<string[]>([]);

  // Datos del Mapa de Energía, memoizados por setlist/repertorio real — si se recalculan en
  // cada render (p.ej. cada vez que cambia highlightedSongIds al hacer hover), Recharts ve un
  // array `data` con nueva referencia y remonta la animación entera desde cero (su `animationId`
  // depende de identidad de referencia, no de contenido), cancelando cualquier highlighting a
  // medio camino. Al depender solo de activeSetlist/songs, el gráfico no se re-anima por
  // interacciones de UI que no cambian los datos reales.
  const { energyAnalysis, chartData, yDomain, ZONAS_ENERGIA } = useSetlistEnergyAnalysis(activeSetlist, songs);

  // Drag and Drop state for setlist items
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(
    null,
  );
  const [expandedSetlistItemIds, setExpandedSetlistItemIds] = useState<
    Set<string>
  >(new Set());
  // Popover de energía manual (1-10 en UI, se guarda ×2 como energia 1-20): qué item de setlist
  // tiene el selector abierto ahora mismo, y estado de guardado para deshabilitar mientras dura.
  const [editingEnergyItemId, setEditingEnergyItemId] = useState<string | null>(
    null,
  );
  const [savingEnergyItemId, setSavingEnergyItemId] = useState<string | null>(
    null,
  );
  // Posición del popover, calculada al abrirlo a partir del botón real (getBoundingClientRect) y
  // pintada vía portal con position:fixed — antes el popover era position:absolute dentro de la
  // lista con scroll (overflow-y-auto), así que en canciones cerca del final del scroll quedaba
  // recortado/oculto por ese overflow ("hay que bajar" para verlo). openUpward se decide según si
  // queda hueco debajo del botón en el viewport.
  const [energyPopoverPos, setEnergyPopoverPos] = useState<{
    top: number;
    left: number;
    openUpward: boolean;
  } | null>(null);

  useEffect(() => {
    if (!editingEnergyItemId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement)?.closest?.("[data-energy-popover]")) {
        setEditingEnergyItemId(null);
      }
    };
    // Cerrar en scroll (de la lista o de la página): con position:fixed calculado una sola vez al
    // abrir, si el usuario sigue haciendo scroll el popover dejaría de estar junto a su botón.
    const handleScroll = () => setEditingEnergyItemId(null);
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [editingEnergyItemId]);

  // Popover de"tono deseado" (transposición): mismo patrón que el de energía — item de setlist
  // con el selector de las 12 notas abierto, y posición calculada al abrir vía portal fixed.
  const [editingKeyItemId, setEditingKeyItemId] = useState<string | null>(null);
  const [keyPopoverPos, setKeyPopoverPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    if (!editingKeyItemId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement)?.closest?.("[data-key-popover]")) {
        setEditingKeyItemId(null);
      }
    };
    const handleScroll = () => setEditingKeyItemId(null);
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [editingKeyItemId]);

  // Guarda (o quita, con null) el tono en el que se quiere tocar esta canción en ESTE
  // repertorio — vive en el SetlistItem, no en la canción, porque el mismo tema puede tocarse
  // en tonos distintos según el bolo/cantante (ver comentario en types.ts).
  const handleSetTonalidadDeseada = (
    itemId: string,
    tonalidad: string | null,
  ) => {
    if (!activeSetlist) return;
    const updatedSetlist: Setlist = {
      ...activeSetlist,
      items: activeSetlist.items.map((it) =>
        it.id === itemId
          ? { ...it, tonalidadDeseada: tonalidad || undefined }
          : it,
      ),
    };
    setSetlists((prev) =>
      prev.map((st) => (st.id === activeSetlist.id ? updatedSetlist : st)),
    );
    syncSetlistToBackend(updatedSetlist);
    setEditingKeyItemId(null);
  };

  // Núcleo compartido: fija a mano la energía (1-20) de una canción, tanto desde el popover 1-10
  // de la fila (handleSetEnergiaManual) como desde el arrastre vertical en el propio gráfico
  // (handleEnergyChartDrag) — un solo sitio que llama al PATCH y actualiza el estado optimista.
  const handleSetEnergiaManualValue = async (
    song: Song,
    itemId: string,
    nuevaEnergia: number,
  ) => {
    setSavingEnergyItemId(itemId);
    // Optimista: refleja el cambio ya mismo en la UI y en el gráfico, sin esperar al servidor.
    setSongs((prev) =>
      prev.map((s) =>
        s.id === song.id
          ? { ...s, energia: nuevaEnergia, energiaManual: true }
          : s,
      ),
    );
    try {
      await fetch(`/api/songs/${song.id}/energia`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ energia: nuevaEnergia }),
      });
    } catch (err) {
      console.error("Error guardando energía manual:", err);
    } finally {
      setSavingEnergyItemId(null);
      setEditingEnergyItemId(null);
    }
  };

  const handleSetEnergiaManual = (
    song: Song,
    itemId: string,
    valor1a10: number,
  ) => handleSetEnergiaManualValue(song, itemId, valor1a10 * 2);

  // Arrastrar un punto en vertical en el Mapa de Energía cambia su energía (1-20) directamente —
  // mismo resultado que el popover 1-10 de la fila, pero sin salir del gráfico. EnergyChart ya
  // filtra esto a puntos con songId (canciones reales, nunca eventos de"speech"/bis).
  const handleEnergyChartDrag = useCallback(
    (point: EnergyChartPoint, newScore: number) => {
      if (!point.songId) return;
      const song = songs.find((s) => s.id === point.songId);
      if (song) handleSetEnergiaManualValue(song, point.id, newScore);
    },
    [songs],
  );

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
  const [defaultAlbumForNewSong, setDefaultAlbumForNewSong] =
    useState<string>("");

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
    saveSongsToLocalStorageSafely(updatedList, bandId);
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
  const [isRecordingShowItem, setIsRecordingShowItem] =
    useState<boolean>(false);
  const [recordingShowItemSecs, setRecordingShowItemSecs] = useState<number>(0);
  const showItemMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const showItemChunksRef = useRef<Blob[]>([]);
  const showItemTimerRef = useRef<any>(null);

  // Sincronización robusta offline/online y persistencia segura (AGENTS.md §2)
  const { getHeaders, syncSetlistToBackend } = useRepertorioSync({
    bandId,
    cleanBand,
    isBakandeya,
    songs,
    setSongs,
    setlists,
    setSetlists,
    setActiveSetlistId,
    setCustomShortcuts,
    sanitizeBandSongs,
    sanitizeBandSetlists,
  });

  // Métricas agregadas del setlist activo (duración, temas, bloques y BPM)
  const activeSetlistMetrics = useActiveSetlistMetrics(activeSetlist, songs);

  // Forward declaration para desacoplar handlers de canciones y álbumes
  const handleAddMultipleSongsToSetlist = (songIds: string[]) => {
    if (!activeSetlist || songIds.length === 0) return;

    const newSongItems: SetlistItem[] = songIds.map((songId) => ({
      id: `it-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      tipoItem: "cancion",
      songId,
    }));

    const targetRefId = selectedSetlistItemId;
    let newItems: SetlistItem[];
    if (targetRefId) {
      const idx = activeSetlist.items.findIndex((it) => it.id === targetRefId);
      if (idx !== -1) {
        newItems = [...activeSetlist.items];
        newItems.splice(idx + 1, 0, ...newSongItems);
      } else {
        newItems = [...activeSetlist.items, ...newSongItems];
      }
    } else {
      newItems = [...activeSetlist.items, ...newSongItems];
    }

    const updatedSetlist: Setlist = {
      ...activeSetlist,
      fechaUltimaEdicion: new Date().toISOString().split("T")[0],
      items: newItems,
    };

    setSetlists((prev) => {
      const next = prev.map((st) =>
        st.id === activeSetlist.id ? updatedSetlist : st,
      );
      saveSetlistsToLocalStorageSafely(next);
      return next;
    });
    syncSetlistToBackend(updatedSetlist);
    setSelectedSetlistItemId(newSongItems[newSongItems.length - 1].id);
  };

  // Hook que desacopla operaciones de canciones, álbumes, favoritos y multiselección del catálogo
  const {
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
  } = useRepertorioSongAlbumHandlers({
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
  });

  const handleToggleFavorite = (songId: string) => {
    toggleFavoriteSong(songId);
  };

  // Setlist Operations
  const handleCreateSetlist = () => {
    setSetlistModalData({ isOpen: true, setlistToEdit: null });
  };

  // El modal de importación ya hizo el POST tanto de las canciones nuevas como del setlist —
  // aquí solo se actualiza el estado local y se cambia a verlo, igual que tras crear/duplicar
  // un setlist a mano.
  const handleSetlistImported = (setlist: Setlist, newSongs: Song[]) => {
    if (newSongs.length > 0) {
      setSongs((prev) => {
        const next = [...prev, ...newSongs];
        saveSongsToLocalStorageSafely(next);
        return next;
      });
    }
    setSetlists((prev) => {
      const next = [setlist, ...prev];
      saveSetlistsToLocalStorageSafely(next);
      return next;
    });
    setActiveSetlistId(setlist.id);
  };

  const handleSaveSetlistModal = (setlistData: {
    id?: string;
    nombre: string;
    descripcion: string;
    tipoFormato: Setlist["tipoFormato"];
  }) => {
    if (setlistData.id) {
      setSetlists((prev) =>
        prev.map((s) =>
          s.id === setlistData.id
            ? {
                ...s,
                nombre: setlistData.nombre,
                descripcion: setlistData.descripcion,
                tipoFormato: setlistData.tipoFormato,
                fechaUltimaEdicion: new Date().toISOString().split("T")[0],
              }
            : s,
        ),
      );
      const existing = setlists.find((s) => s.id === setlistData.id);
      if (existing) {
        const payload = {
          ...existing,
          nombre: setlistData.nombre,
          descripcion: setlistData.descripcion,
          tipoFormato: setlistData.tipoFormato,
        };
        void guardarOReverter(
          fetch(`/api/setlists/${setlistData.id}`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(payload),
          }),
          () => setSetlists((prev) => prev.map((s) => (s.id === existing.id ? existing : s))),
        );
      }
    } else {
      const newSetlist: Setlist = {
        id: `setlist-${Date.now()}`,
        nombre: setlistData.nombre,
        descripcion: setlistData.descripcion || "Nuevo repertorio para directo",
        tipoFormato: setlistData.tipoFormato || "festival",
        duracionTotalEstimadaMinutos: 45,
        fechaCreacion: new Date().toISOString().split("T")[0],
        fechaUltimaEdicion: new Date().toISOString().split("T")[0],
        items: [],
      };
      setSetlists((prev) => [newSetlist, ...prev]);
      setActiveSetlistId(newSetlist.id);

      void guardarOReverter(
        fetch("/api/setlists", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(newSetlist),
        }),
        () => {
          setSetlists((prev) => prev.filter((s) => s.id !== newSetlist.id));
          setActiveSetlistId((actual) => (actual === newSetlist.id ? "" : actual));
        },
      );
    }
  };

  const handleOldSetlist = () => {
    const name = prompt(
      "Nombre para el nuevo repertorio:",
      "Festival Verano 2026",
    );
    if (!name || !name.trim()) return;

    const newSetlist: Setlist = {
      id: `setlist-${Date.now()}`,
      nombre: name.trim(),
      descripcion: "Nuevo repertorio para directo",
      tipoFormato: "festival",
      duracionTotalEstimadaMinutos: 45,
      fechaCreacion: new Date().toISOString().split("T")[0],
      fechaUltimaEdicion: new Date().toISOString().split("T")[0],
      items: songs
        .filter((s) => s.favoritoGeneral)
        .map((s, idx) => ({
          id: `it-${Date.now()}-${idx}`,
          songId: s.id,
          tipoItem: "cancion",
        })),
    };

    setSetlists((prev) => [newSetlist, ...prev]);
    setActiveSetlistId(newSetlist.id);

    void guardarOReverter(
      fetch("/api/setlists", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(newSetlist),
      }),
      () => {
          setSetlists((prev) => prev.filter((s) => s.id !== newSetlist.id));
          setActiveSetlistId((actual) => (actual === newSetlist.id ? "" : actual));
        },
    );
  };

  const handleDuplicateSetlist = (
    st: Setlist,
    nameSuffix: string = "(Copia)",
  ): Setlist => {
    const duplicated: Setlist = {
      ...st,
      id: `setlist-${Date.now()}`,
      nombre: `${st.nombre} ${nameSuffix}`,
      fechaCreacion: new Date().toISOString().split("T")[0],
      fechaUltimaEdicion: new Date().toISOString().split("T")[0],
      items: st.items.map((it) => ({
        ...it,
        id: `it-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      })),
    };
    setSetlists((prev) => [duplicated, ...prev]);
    setActiveSetlistId(duplicated.id);

    void guardarOReverter(
      fetch("/api/setlists", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(duplicated),
      }),
      () => {
          setSetlists((prev) => prev.filter((s) => s.id !== duplicated.id));
          setActiveSetlistId((actual) => (actual === duplicated.id ? "" : actual));
        },
    );

    return duplicated;
  };

  const handleDeleteSetlist = (stId: string) => {
    const st = setlists.find((s) => s.id === stId);
    setConfirmDeleteModal({
      title: "Eliminar Repertorio",
      description: `¿Seguro que deseas eliminar el repertorio "${st?.nombre || "este repertorio"}"?`,
      onConfirm: () => {
        const remaining = setlists.filter((s) => s.id !== stId);
        setSetlists(remaining);
        if (activeSetlistId === stId) {
          setActiveSetlistId(remaining[0]?.id || "");
        }
        // Si se borra justo la copia de trabajo de"Setlist Perfecto" (o su original), esa referencia
        // ya no vale — la próxima vez que se pida el plan, se creará una copia nueva desde cero.
        clearDraftIfMatches(stId);

        void guardarOReverter(
          fetch(`/api/setlists/${stId}`, {
            method: "DELETE",
            headers: getHeaders(),
          }),
          () => {
            if (st) {
              setSetlists((prev) =>
                prev.some((s) => s.id === st.id) ? prev : [st, ...prev],
              );
            }
          },
        );
      },
    });
  };

  const handleAddItemToSetlist = (
    songId?: string,
    tipoItem: any = "cancion",
    tituloCustom?: string,
    duracionEstimadaMinutos?: number,
    duracionEstimadaSegundos?: number,
    notaTema?: string,
    insertAfterId?: string | null,
  ) => {
    if (!activeSetlist) return;

    // Map old tipoItem values to new (tipoItem, bloqueSubtipo) structure
    let actualTipoItem: "cancion" | "bloque" = "cancion";
    let bloqueSubtipo: SetlistItem["bloqueSubtipo"] = undefined;

    if (tipoItem !== "cancion") {
      actualTipoItem = "bloque";
      bloqueSubtipo = tipoItem; // Map directly:'presentacion','bis','header', etc.
    }

    const newItem: SetlistItem = {
      id: `it-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      tipoItem: actualTipoItem,
      bloqueSubtipo,
      songId,
      tituloCustom,
      duracionEstimadaMinutos,
      duracionEstimadaSegundos,
      notaTema,
    };

    if (!tituloCustom) {
      const subtype = bloqueSubtipo || tipoItem;
      if (subtype === "header" || subtype === "bloque_header") {
        newItem.tituloCustom = "Nuevo bloque del show";
      } else if (subtype === "presentacion") {
        newItem.tituloCustom = "Presentación Banda & Saludo";
        newItem.duracionEstimadaMinutos = 2;
        newItem.duracionEstimadaSegundos = 120;
      } else if (subtype === "beatbox") {
        newItem.tituloCustom = "Solo de Batería / Percusión";
        newItem.duracionEstimadaMinutos = 2;
        newItem.duracionEstimadaSegundos = 120;
      } else if (subtype === "intro_tema") {
        newItem.tituloCustom = "Intro / Historia del Tema";
        newItem.duracionEstimadaMinutos = 1;
        newItem.duracionEstimadaSegundos = 60;
      } else if (subtype === "solo_performance") {
        newItem.tituloCustom = "Solo Instrumental / Jam";
        newItem.duracionEstimadaMinutos = 2;
        newItem.duracionEstimadaSegundos = 120;
      } else if (subtype === "cambio_instrumento") {
        newItem.tituloCustom = "Cambio Instrumento & Afinación";
        newItem.duracionEstimadaMinutos = 1;
        newItem.duracionEstimadaSegundos = 60;
      } else if (subtype === "chapa") {
        newItem.tituloCustom = "Chapa / Discurso con Público";
        newItem.duracionEstimadaMinutos = 2;
        newItem.duracionEstimadaSegundos = 120;
      } else if (subtype === "descanso") {
        newItem.tituloCustom = "Pausa / Intermedio / Agua";
        newItem.duracionEstimadaMinutos = 2;
        newItem.duracionEstimadaSegundos = 120;
      } else if (subtype === "bis") {
        newItem.tituloCustom = "💣 BIS / PARTE FINAL DEL SHOW";
        newItem.duracionEstimadaMinutos = 1;
        newItem.duracionEstimadaSegundos = 60;
      }
    }

    const targetRefId =
      insertAfterId !== undefined ? insertAfterId : selectedSetlistItemId;
    let newItems: SetlistItem[];
    if (targetRefId) {
      const idx = activeSetlist.items.findIndex((it) => it.id === targetRefId);
      if (idx !== -1) {
        newItems = [...activeSetlist.items];
        newItems.splice(idx + 1, 0, newItem);
      } else {
        newItems = [...activeSetlist.items, newItem];
      }
    } else {
      newItems = [...activeSetlist.items, newItem];
    }

    const updatedSetlist: Setlist = {
      ...activeSetlist,
      fechaUltimaEdicion: new Date().toISOString().split("T")[0],
      items: newItems,
    };

    setSetlists((prev) => {
      const next = prev.map((st) =>
        st.id === activeSetlist.id ? updatedSetlist : st,
      );
      saveSetlistsToLocalStorageSafely(next);
      return next;
    });
    syncSetlistToBackend(updatedSetlist);
    setSelectedSetlistItemId(newItem.id);
  };

  // Hook que encapsula optimización acústica de transiciones, sugerencia de chapas y Setlist Perfecto
  const {
    undoReorderSnapshot,
    chapaSuggestion,
    setChapaSuggestion,
    optimizeSummary,
    setOptimizeSummary,
    perfectSetlistLoading,
    perfectSetlistPlan,
    setPerfectSetlistPlan,
    perfectSetlistError,
    setPerfectSetlistError,
    clearDraftIfMatches,
    applySetlistItemsChange,
    reorderSetlistItems,
    suggestChapaSpot,
    insertSuggestedChapa,
    optimizeSetlistTransitions,
    removeSetlistItemAtIndex,
    insertSongAtIndex,
    insertBlockAtIndex,
    applyPerfectSetlistAction,
    handleGeneratePerfectSetlist,
    canUndoReorder,
    undoSourceKey,
    undoLastReorder,
  } = useSetlistTransitionsOptimizer({
    activeSetlist,
    songs,
    setlists,
    setSetlists,
    setActiveSetlistId,
    saveSetlistsToLocalStorageSafely,
    syncSetlistToBackend,
    handleDuplicateSetlist,
    handleAddItemToSetlist,
  });


  const handleDropItem = (targetIndex: number) => {
    if (draggedItemIndex !== null)
      reorderSetlistItems(draggedItemIndex, targetIndex);
    setDraggedItemIndex(null);
    setDragOverItemIndex(null);
  };


  // Inserts a band-created custom shortcut into the active setlist as a generic ('otro') item
  const handleUseCustomShortcut = (sc: SetlistShortcut) => {
    handleAddItemToSetlist(
      undefined,
      "otro",
      sc.tituloCustom,
      sc.duracionEstimadaMinutos,
      sc.duracionEstimadaSegundos,
      sc.notaTema,
    );
  };

  const handleCreateShortcut = async () => {
    const etiqueta = newShortcutLabel.trim();
    if (!etiqueta) return;
    try {
      const res = await fetch("/api/setlist-shortcuts", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          icono: newShortcutIcon.trim() || "⭐",
          etiqueta,
          tituloCustom: etiqueta,
          duracionEstimadaMinutos: newShortcutMinutes,
          duracionEstimadaSegundos: newShortcutMinutes * 60,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.shortcut) {
          setCustomShortcuts((prev) => [...prev, data.shortcut]);
        }
      }
    } catch (err) {
      console.error("Error al crear el acceso rápido:", err);
    } finally {
      setNewShortcutLabel("");
      setNewShortcutIcon("⭐");
      setNewShortcutMinutes(1);
      setIsAddingShortcut(false);
    }
  };

  const handleDeleteShortcut = async (id: string) => {
    setCustomShortcuts((prev) => prev.filter((sc) => sc.id !== id));
    try {
      await fetch(`/api/setlist-shortcuts/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
    } catch (err) {
      console.error("Error al eliminar el acceso rápido:", err);
    }
  };

  const handleSaveShowItem = (itemData: Partial<SetlistItem>) => {
    if (!activeSetlist) return;

    // Map old tipoItem values to new structure if needed
    const mappedData = { ...itemData };
    if (mappedData.tipoItem && mappedData.tipoItem !== "cancion") {
      const subtype = mappedData.tipoItem;
      mappedData.tipoItem = "bloque" as any;
      mappedData.bloqueSubtipo = subtype as any;
    }

    let updatedItems: SetlistItem[];

    if (editingShowItem) {
      updatedItems = activeSetlist.items.map((it) =>
        it.id === editingShowItem.id
          ? { ...it, ...mappedData, audioUrl: showItemAudioUrl }
          : it,
      );
    } else {
      const defaultSubtype = (mappedData.bloqueSubtipo || "otro") as any;
      const newItem: SetlistItem = {
        id: `it-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        tipoItem: mappedData.tipoItem === "cancion" ? "cancion" : "bloque",
        bloqueSubtipo:
          mappedData.tipoItem === "cancion" ? undefined : defaultSubtype,
        tituloCustom: mappedData.tituloCustom || "Evento del Show",
        duracionEstimadaMinutos: mappedData.duracionEstimadaMinutos || 2,
        duracionEstimadaSegundos: mappedData.duracionEstimadaSegundos || 120,
        notaTema: mappedData.notaTema || "",
        audioUrl: showItemAudioUrl,
      };

      if (selectedSetlistItemId) {
        const idx = activeSetlist.items.findIndex(
          (it) => it.id === selectedSetlistItemId,
        );
        if (idx !== -1) {
          updatedItems = [...activeSetlist.items];
          updatedItems.splice(idx + 1, 0, newItem);
        } else {
          updatedItems = [...activeSetlist.items, newItem];
        }
      } else {
        updatedItems = [...activeSetlist.items, newItem];
      }
      setSelectedSetlistItemId(newItem.id);
    }

    const updatedSetlist: Setlist = {
      ...activeSetlist,
      fechaUltimaEdicion: new Date().toISOString().split("T")[0],
      items: updatedItems,
    };

    setSetlists((prev) => {
      const next = prev.map((st) =>
        st.id === activeSetlist.id ? updatedSetlist : st,
      );
      saveSetlistsToLocalStorageSafely(next);
      return next;
    });
    syncSetlistToBackend(updatedSetlist);
    setShowShowItemModal(false);
    setEditingShowItem(null);
    setShowItemAudioUrl("");
  };

  const handleRemoveSetlistItem = (itemId: string) => {
    if (!activeSetlist) return;
    const updatedSetlist: Setlist = {
      ...activeSetlist,
      fechaUltimaEdicion: new Date().toISOString().split("T")[0],
      items: activeSetlist.items.filter((it) => it.id !== itemId),
    };

    setSetlists((prev) =>
      prev.map((st) => (st.id === activeSetlist.id ? updatedSetlist : st)),
    );
    syncSetlistToBackend(updatedSetlist);
  };

  const handleUpdateItemNote = (itemId: string, note: string) => {
    if (!activeSetlist) return;
    const updatedSetlist: Setlist = {
      ...activeSetlist,
      items: activeSetlist.items.map((it) =>
        it.id === itemId ? { ...it, notaTema: note } : it,
      ),
    };

    setSetlists((prev) =>
      prev.map((st) => (st.id === activeSetlist.id ? updatedSetlist : st)),
    );
    syncSetlistToBackend(updatedSetlist);
  };

  // Assign setlist to concert or rehearsal
  const handleAssignSetlistToConcert = () => {
    if (!assigningSetlist || !selectedConcertToAssign) return;

    // Check if it's a concert or rehearsal
    const concertMatch = concerts.find((c) => c.id === selectedConcertToAssign);
    if (concertMatch && onUpdateConcert) {
      onUpdateConcert(concertMatch.id, { setlistId: assigningSetlist.id });
      alert(
        `Repertorio"${assigningSetlist.nombre}" asignado con éxito al concierto en ${concertMatch.sala} (${concertMatch.ciudad}).`,
      );
    } else {
      const rehMatch = rehearsals.find((r) => r.id === selectedConcertToAssign);
      if (rehMatch && onUpdateRehearsal) {
        onUpdateRehearsal(rehMatch.id, { setlistId: assigningSetlist.id });
        alert(
          `Repertorio"${assigningSetlist.nombre}" asignado con éxito al ensayo de ${rehMatch.fecha}.`,
        );
      }
    }
    setAssigningSetlist(null);
  };

  // Print Stage Setlist (el HTML lo construye la función pura buildStageSetlistHtml)
  const handlePrintStageSetlist = () => {
    if (!activeSetlist) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(
      buildStageSetlistHtml({
        setlist: activeSetlist,
        songs,
        metrics: activeSetlistMetrics,
        bandDisplayName: currentUser?.bandName || "BANDMANAGER",
        stylesheet: generatePdfStylesheet(),
        colors: {
          ok: getTokenValueForPrint("--ok"),
          acc: getTokenValueForPrint("--acc"),
          sunken: getTokenValueForPrint("--sunken"),
        },
      }),
    );
    printWindow.document.close();
  };

  return (
    <div
      data-modulo={activeTab === "catalogo" ? "discografia" : "repertorio"}
      className="space-y-3"
    >
      {/* REPERTORIO UNIFIED NAV BAR: Título, tabs segmentadas (Setlists & Directo / Catálogo & Discografía) y acciones rápidas */}
      <RepertorioNavBar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        catalogoViewMode={catalogoViewMode}
        setCatalogoViewMode={setCatalogoViewMode}
        setlists={setlists}
        activeSetlistId={activeSetlistId}
        onSelectSetlist={(id) => {
          setActiveSetlistId(id);
        }}
        onCreateSetlist={handleCreateSetlist}
        onImportSetlist={() => setShowImportSetlistModal(true)}
        onOpenNewSongModal={() => {
          setEditingSong(null);
          setShowSongModal(true);
        }}
        onOpenNewAlbumModal={() =>
          setAssignSongsModalData({ isOpen: true, albumName: "" })
        }
        songCount={songs.length}
        albumCount={albumsList.filter((a) => a !== "todos").length}
        onOpenTutorial={openTutorial}
      />

      {/* VIEW 1: SETLISTS & REPERTORIOS DE DIRECTO (Desacoplado en SetlistsTabContentView) */}
      {activeTab === "setlists" && (
        <SetlistsTabContentView
          activeSetlist={activeSetlist}
          songs={songs}
          sortedSongsByAlbumAndOrder={sortedSongsByAlbumAndOrder}
          bandId={bandId}
          currentUser={currentUser}
          setSetlists={setSetlists}
          activeSetlistMetrics={activeSetlistMetrics}
          energyAnalysis={energyAnalysis}
          chartData={chartData}
          yDomain={yDomain}
          ZONAS_ENERGIA={ZONAS_ENERGIA}
          canUndoReorder={canUndoReorder}
          undoLastReorder={undoLastReorder}
          showEnergyMap={showEnergyMap}
          setShowEnergyMap={setShowEnergyMap}
          showSetlistStats={showSetlistStats}
          setShowSetlistStats={setShowSetlistStats}
          optimizeSetlistTransitions={optimizeSetlistTransitions}
          suggestChapaSpot={suggestChapaSpot}
          showChartSettingsMenu={showChartSettingsMenu}
          setShowChartSettingsMenu={setShowChartSettingsMenu}
          showIdealCurve={showIdealCurve}
          setShowIdealCurve={setShowIdealCurve}
          showBpmLine={showBpmLine}
          setShowBpmLine={setShowBpmLine}
          showTonalidad={showTonalidad}
          setShowTonalidad={setShowTonalidad}
          chartZoom={chartZoom}
          setChartZoom={setChartZoom}
          showTransitionBadges={showTransitionBadges}
          setShowTransitionBadges={setShowTransitionBadges}
          showConcertPlayer={showConcertPlayer}
          setShowConcertPlayer={setShowConcertPlayer}
          optimizeSummary={optimizeSummary}
          chapaSuggestion={chapaSuggestion}
          setChapaSuggestion={setChapaSuggestion}
          insertSuggestedChapa={insertSuggestedChapa}
          highlightedSongIds={highlightedSongIds}
          setHighlightedSongIds={setHighlightedSongIds}
          selectedSetlistItemId={selectedSetlistItemId}
          setSelectedSetlistItemId={setSelectedSetlistItemId}
          playerCurrentSong={playerCurrentSong}
          handleOpenTransitionPreview={handleOpenTransitionPreview}
          reorderSetlistItems={reorderSetlistItems}
          handleEnergyChartDrag={handleEnergyChartDrag}
          showHeuristicWarnings={showHeuristicWarnings}
          setShowHeuristicWarnings={setShowHeuristicWarnings}
          aiAnalysisResult={aiAnalysisResult}
          setShowAIAnalysisModal={setShowAIAnalysisModal}
          titlesMatch={titlesMatch}
          handleAddItemToSetlist={handleAddItemToSetlist}
          setIsAddSongsModalOpen={setIsAddSongsModalOpen}
          setEditingShowItem={setEditingShowItem}
          setShowShowItemModal={setShowShowItemModal}
          customShortcuts={customShortcuts}
          handleUseCustomShortcut={handleUseCustomShortcut}
          handleDeleteShortcut={handleDeleteShortcut}
          isAddingShortcut={isAddingShortcut}
          setIsAddingShortcut={setIsAddingShortcut}
          newShortcutIcon={newShortcutIcon}
          setNewShortcutIcon={setNewShortcutIcon}
          newShortcutLabel={newShortcutLabel}
          setNewShortcutLabel={setNewShortcutLabel}
          newShortcutMinutes={newShortcutMinutes}
          setNewShortcutMinutes={setNewShortcutMinutes}
          handleCreateShortcut={handleCreateShortcut}
          expandedSetlistItemIds={expandedSetlistItemIds}
          setExpandedSetlistItemIds={setExpandedSetlistItemIds}
          draggedItemIndex={draggedItemIndex}
          setDraggedItemIndex={setDraggedItemIndex}
          dragOverItemIndex={dragOverItemIndex}
          setDragOverItemIndex={setDragOverItemIndex}
          handleDropItem={handleDropItem}
          activePlayerSong={activePlayerSong}
          isPlayerPlaying={isPlayerPlaying}
          selectPlayerSongWithQueue={selectPlayerSongWithQueue}
          editingKeyItemId={editingKeyItemId}
          setEditingKeyItemId={setEditingKeyItemId}
          keyPopoverPos={keyPopoverPos}
          setKeyPopoverPos={setKeyPopoverPos}
          handleSetTonalidadDeseada={handleSetTonalidadDeseada}
          editingEnergyItemId={editingEnergyItemId}
          setEditingEnergyItemId={setEditingEnergyItemId}
          energyPopoverPos={energyPopoverPos}
          setEnergyPopoverPos={setEnergyPopoverPos}
          savingEnergyItemId={savingEnergyItemId}
          handleSetEnergiaManual={handleSetEnergiaManual}
          handleRemoveSetlistItem={handleRemoveSetlistItem}
          handleUpdateItemNote={handleUpdateItemNote}
          setEditingSong={setEditingSong}
          setShowSongModal={setShowSongModal}
          handleOpenStudioModal={handleOpenStudioModal}
          setActiveMemberNotesSong={setActiveMemberNotesSong}
          setActiveChordsSong={setActiveChordsSong}
          handleUpdateSongFromStudio={handleUpdateSongFromStudio}
          cacheActiveStageSetlist={cacheActiveStageSetlist}
          setPerformanceInitialMode={setPerformanceInitialMode}
          setPerformanceSetlistId={setPerformanceSetlistId}
          setPerfectSetlistPlan={setPerfectSetlistPlan}
          setPerfectSetlistError={setPerfectSetlistError}
          setShowPerfectSetlistModal={setShowPerfectSetlistModal}
          setShowPdfPreview={setShowPdfPreview}
          handleShareSetlist={handleShareSetlist}
          setAssigningSetlist={setAssigningSetlist}
          handleDuplicateSetlist={handleDuplicateSetlist}
          setShowImportSetlistModal={setShowImportSetlistModal}
          setSetlistModalData={setSetlistModalData}
          handleDeleteSetlist={handleDeleteSetlist}
          transparentDragImage={TRANSPARENT_DRAG_IMAGE}
        />
      )}

      {/* VIEW 2: DISCOGRAFÍA & CATÁLOGO GENERAL DE TEMAS (UNIFICADO - Desacoplado en CatalogoTabContentView) */}
      {activeTab === "catalogo" && (
        <CatalogoTabContentView
          catalogoViewMode={catalogoViewMode}
          songs={songs}
          albumsList={albumsList}
          colors={colors}
          bName={bName}
          bandLogoUrl={bandLogoUrl}
          setSongs={setSongs}
          setSetlists={setSetlists}
          handleToggleFavorite={handleToggleFavorite}
          activePlayerSong={activePlayerSong}
          isPlayerPlaying={isPlayerPlaying}
          selectPlayerSongWithQueue={selectPlayerSongWithQueue}
          setDeleteAlbumData={setDeleteAlbumData}
          setAssignSongsModalData={setAssignSongsModalData}
          setActiveMemberNotesSong={setActiveMemberNotesSong}
          setActiveChordsSong={setActiveChordsSong}
          handleOpenStudioModal={handleOpenStudioModal}
          setEditingSong={setEditingSong}
          setShowSongModal={setShowSongModal}
          handleDeleteSong={handleDeleteSong}
          handleShareSong={handleShareSong}
          filteredSongs={filteredSongs}
          catalogAlbumFilter={catalogAlbumFilter}
          setCatalogAlbumFilter={setCatalogAlbumFilter}
          catalogStatusFilter={catalogStatusFilter}
          setCatalogStatusFilter={setCatalogStatusFilter}
          catalogSearch={catalogSearch}
          groupByAlbum={groupByAlbum}
          setGroupByAlbum={setGroupByAlbum}
          showCatalogActionsMenu={showCatalogActionsMenu}
          setShowCatalogActionsMenu={setShowCatalogActionsMenu}
          handleNormalizeCatalogTitles={handleNormalizeCatalogTitles}
          selectedCatalogIds={selectedCatalogIds}
          setSelectedCatalogIds={setSelectedCatalogIds}
          clearCatalogSelection={clearCatalogSelection}
          toggleCatalogSelect={toggleCatalogSelect}
          handleBulkAddSelectedToSetlist={handleBulkAddSelectedToSetlist}
          handleBulkDeleteSongs={handleBulkDeleteSongs}
          handleUpdateSongFromStudio={handleUpdateSongFromStudio}
          draggedCatalogSongId={draggedCatalogSongId}
          setDraggedCatalogSongId={setDraggedCatalogSongId}
          dragOverCatalogSongId={dragOverCatalogSongId}
          setDragOverCatalogSongId={setDragOverCatalogSongId}
          handleDropCatalogSong={handleDropCatalogSong}
        />
      )}

      <RepertorioModalsContainer
        showSongModal={showSongModal}
        setShowSongModal={setShowSongModal}
        editingSong={editingSong}
        bandRosterMembers={bandRosterMembers}
        defaultAlbumForNewSong={defaultAlbumForNewSong}
        albumsList={albumsList}
        colors={colors}
        handleSaveSong={handleSaveSong}
        assigningSetlist={assigningSetlist}
        setAssigningSetlist={setAssigningSetlist}
        concerts={concerts}
        rehearsals={rehearsals}
        selectedConcertToAssign={selectedConcertToAssign}
        setSelectedConcertToAssign={setSelectedConcertToAssign}
        handleAssignSetlistToConcert={handleAssignSetlistToConcert}
        showShowItemModal={showShowItemModal}
        setShowShowItemModal={setShowShowItemModal}
        editingShowItem={editingShowItem}
        setEditingShowItem={setEditingShowItem}
        handleSaveShowItem={handleSaveShowItem}
        showPdfPreview={showPdfPreview}
        setShowPdfPreview={setShowPdfPreview}
        isBakandeya={isBakandeya}
        bandLogoUrl={bandLogoUrl}
        activeSetlist={activeSetlist}
        activeSetlistMetrics={activeSetlistMetrics}
        songs={songs}
        bName={bName}
        handleUpdateSongFromStudio={handleUpdateSongFromStudio}
        activeStudioSong={activeStudioSong}
        setActiveStudioSong={setActiveStudioSong}
        activeStudioOpenIris={activeStudioOpenIris}
        setActiveStudioOpenIris={setActiveStudioOpenIris}
        currentUser={currentUser}
        assignSongsModalData={assignSongsModalData}
        setAssignSongsModalData={setAssignSongsModalData}
        handleSaveAlbumSongs={handleSaveAlbumSongs}
        setlistModalData={setlistModalData}
        setSetlistModalData={setSetlistModalData}
        handleSaveSetlistModal={handleSaveSetlistModal}
        isAddSongsModalOpen={isAddSongsModalOpen}
        setIsAddSongsModalOpen={setIsAddSongsModalOpen}
        handleAddMultipleSongsToSetlist={handleAddMultipleSongsToSetlist}
        activeMemberNotesSong={activeMemberNotesSong}
        setActiveMemberNotesSong={setActiveMemberNotesSong}
        activeChordsSong={activeChordsSong}
        setActiveChordsSong={setActiveChordsSong}
        handleUpdateSongFromChords={handleUpdateSongFromChords}
        confirmDeleteModal={confirmDeleteModal}
        setConfirmDeleteModal={setConfirmDeleteModal}
        deleteAlbumData={deleteAlbumData}
        setDeleteAlbumData={setDeleteAlbumData}
        handleUnassignAlbumSongs={handleUnassignAlbumSongs}
        handleDeleteAlbumAndSongs={handleDeleteAlbumAndSongs}
        shareModalData={shareModalData}
        setShareModalData={setShareModalData}
        isSpotifyModalOpen={isSpotifyModalOpen}
        setIsSpotifyModalOpen={setIsSpotifyModalOpen}
        setSongs={setSongs}
        statusBanner={statusBanner}
        showAIAnalysisModal={showAIAnalysisModal}
        setShowAIAnalysisModal={setShowAIAnalysisModal}
        setHighlightedSongIds={setHighlightedSongIds}
        highlightedSongIds={highlightedSongIds}
        aiAnalysisResult={aiAnalysisResult}
        setAiAnalysisResult={setAiAnalysisResult}
        setAiAnalysisLoading={setAiAnalysisLoading}
        chartData={chartData}
        yDomain={yDomain}
        zonasEnergia={ZONAS_ENERGIA}
        energyAnalysis={energyAnalysis}
        reorderSetlistItems={reorderSetlistItems}
        handleEnergyChartDrag={handleEnergyChartDrag}
        canUndoReorder={canUndoReorder}
        undoLastReorder={undoLastReorder}
        undoSourceKey={undoSourceKey}
        showPerfectSetlistModal={showPerfectSetlistModal}
        setShowPerfectSetlistModal={setShowPerfectSetlistModal}
        perfectSetlistLoading={perfectSetlistLoading}
        perfectSetlistPlan={perfectSetlistPlan}
        perfectSetlistError={perfectSetlistError}
        handleGeneratePerfectSetlist={handleGeneratePerfectSetlist}
        applyPerfectSetlistAction={applyPerfectSetlistAction}
        showImportSetlistModal={showImportSetlistModal}
        setShowImportSetlistModal={setShowImportSetlistModal}
        handleSetlistImported={handleSetlistImported}
        performanceSetlistId={performanceSetlistId}
        setPerformanceSetlistId={setPerformanceSetlistId}
        setlists={setlists}
        performanceInitialMode={performanceInitialMode}
        handleOpenStudioModal={handleOpenStudioModal}
        transitionPreviewData={transitionPreviewData}
        setTransitionPreviewData={setTransitionPreviewData}
        handleOpenTransitionPreview={handleOpenTransitionPreview}
        handleAddItemToSetlist={handleAddItemToSetlist}
        isTutorialOpen={isTutorialOpen}
        closeTutorial={closeTutorial}
      />
      </div>
  );
}
