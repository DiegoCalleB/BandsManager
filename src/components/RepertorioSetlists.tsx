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
import SongStudioModal from "./SongStudioModal";
import { Atril } from "./Atril";
import { ShareModal } from "./ShareModal";
import { useShareModal } from "../hooks/useShareModal";
import { useCatalogFilters } from "../hooks/useCatalogFilters";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import { useStagePlayer } from "../hooks/useStagePlayer";
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
import { useRepertorioTabs } from "../hooks/useRepertorioTabs";
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
  const { activeTab, catalogoViewMode, setCatalogoViewMode, handleTabChange } =
    useRepertorioTabs(view, onNavigate);

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
  // nunca sobre el original — este estado vive en el padre, no en el modal, precisamente porque
  // generar el plan cambia qué setlist está activo (duplicado) y el modal no debe reiniciarse
  // (perder el plan a medio aplicar) solo porque activeSetlistId cambió por su propia acción.
  const [perfectSetlistPlan, setPerfectSetlistPlan] =
    useState<PerfectSetlistPlan | null>(null);
  const [perfectSetlistLoading, setPerfectSetlistLoading] = useState(false);
  const [perfectSetlistError, setPerfectSetlistError] = useState<string | null>(
    null,
  );
  // Qué copia de trabajo ya existe para esta ronda de"Setlist Perfecto" — se especificó que
  //"Regenerar" no crease una copia nueva cada vez, así que se recuerda cuál ya se creó (por
  // ambos ids: el original del que salió y el propio id de la copia) y se reutiliza mientras no se
  // pida explícitamente una copia nueva. Solo se recuerda LA MÁS RECIENTE, no un historial por setlist.
  const [perfectSetlistDraft, setPerfectSetlistDraft] = useState<{
    originalSetlistId: string;
    draftSetlistId: string;
  } | null>(null);
  // Resultados del análisis IA guardados (para mostrar en la vista sin abrir modal)
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  // IDs de canciones a resaltar en el gráfico cuando se interactúa con sugerencias
  const [highlightedSongIds, setHighlightedSongIds] = useState<string[]>([]);
  // Snapshot del orden de items justo antes del ÚLTIMO reordenamiento (manual arrastrando, o por
  //"Aplicar" de un aviso/sugerencia) — permite un único"Deshacer" sobre ese cambio concreto.
  // Se sobrescribe con cada nuevo reordenamiento, así que solo cubre el más reciente, no un historial.
  // `sourceKey` identifica QUÉ acción generó este snapshot (p.ej."ai-suggestion-2") — así el botón
  //"Aplicar" de esa sugerencia concreta puede convertirse en"Deshacer" solo mientras siga siendo
  // la acción más reciente (la única que este snapshot de un solo nivel puede revertir de verdad).
  const [undoReorderSnapshot, setUndoReorderSnapshot] = useState<{
    setlistId: string;
    items: Setlist["items"];
    sourceKey: string;
  } | null>(null);
  // Mensaje breve tras"Optimizar orden" (mejora %, o"ya estaba bien") — se autodesvanece solo,
  // sin necesidad de un sistema de toasts global para un mensaje puntual como este.
  const [optimizeSummary, setOptimizeSummary] = useState<string | null>(null);
  // Sugerencia activa de"¿dónde meto una chapa?" — se queda fija (no se autodesvanece como el
  // resumen de arriba) hasta que el usuario la inserta o pide otra, porque trae una acción propia.
  const [chapaSuggestion, setChapaSuggestion] =
    useState<SugerenciaChapa | null>(null);

  // Datos del Mapa de Energía, memoizados por setlist/repertorio real — si se recalculan en
  // cada render (p.ej. cada vez que cambia highlightedSongIds al hacer hover), Recharts ve un
  // array `data` con nueva referencia y remonta la animación entera desde cero (su `animationId`
  // depende de identidad de referencia, no de contenido), cancelando cualquier highlighting a
  // medio camino. Al depender solo de activeSetlist/songs, el gráfico no se re-anima por
  // interacciones de UI que no cambian los datos reales.
  const { energyAnalysis, chartData, yDomain, ZONAS_ENERGIA } = useMemo(() => {
    const analysis = analyzeSetlistEnergy(activeSetlist?.items || [], songs);
    // Curva de energía"ideal" de referencia (arco de pacing clásico, escalado al rango real de
    // este repertorio) — se pinta como segunda línea en el gráfico para ver de un vistazo dónde se
    // aleja más la curva real, sin depender de leer el texto del análisis.
    const idealCurve = calcularCurvaEnergiaIdeal(analysis.points);
    // Posición horizontal de cada punto en el gráfico, DISTINTA de `idx` (que sigue siendo la
    // posición real en el setlist, usada para arrastrar/reordenar). Las canciones ocupan
    // posiciones enteras consecutivas (0, 1, 2...) sin contar los bloques que haya entre medias;
    // los bloques se intercalan entre la canción anterior y la siguiente sin consumir su propio
    // hueco — así un bloque nunca separa visualmente dos canciones más de lo normal.
    const xPositions: number[] = new Array(analysis.points.length);
    {
      let songCounter = 0;
      let pendingBlocks: number[] = [];
      const flushBlocks = (leftPos: number, rightPos: number) => {
        pendingBlocks.forEach((ptIdx, i) => {
          xPositions[ptIdx] =
            leftPos +
            ((i + 1) / (pendingBlocks.length + 1)) * (rightPos - leftPos);
        });
        pendingBlocks = [];
      };
      analysis.points.forEach((pt, i) => {
        if (pt.isSong) {
          if (pendingBlocks.length > 0)
            flushBlocks(songCounter - 1, songCounter);
          xPositions[i] = songCounter;
          songCounter += 1;
        } else {
          pendingBlocks.push(i);
        }
      });
      if (pendingBlocks.length > 0) flushBlocks(songCounter - 1, songCounter);
    }
    const data = analysis.points.map((pt, idx) => {
      // Chapa/presentación/interludio/pausa/bis/etc. — cualquier evento que no sea canción — no
      // representa energía real del show: el"bis" en concreto es solo la marca de"aquí empieza",
      // no una canción en sí (las canciones reales del bis puntúan por su cuenta justo después).
      // Contarlos como un punto más de la curva (con su score de relleno) dibujaba un"bajón" o un
      // pico falso ahí. Se marcan en el gráfico con su propia línea vertical (ver EnergyChart) en
      // vez de ensuciar la curva con un valor inventado.
      const isSpeechEvent = !pt.isSong;
      // Choque de tonalidad con la SIGUIENTE canción real del setlist (círculo de quintas) — se
      // salta cualquier evento de"speech" de por medio para comparar canciones de verdad, no una
      // canción contra una chapa/interludio que no tiene tonalidad.
      let harmonyClash = false;
      if (!isSpeechEvent && pt.song?.tonalidad) {
        const siguienteCancion = analysis.points
          .slice(idx + 1)
          .find((p) => p.isSong);
        const keyA = parseTonalidad(pt.song.tonalidad);
        const keyB = siguienteCancion?.song?.tonalidad
          ? parseTonalidad(siguienteCancion.song.tonalidad)
          : null;
        if (keyA && keyB)
          harmonyClash = evaluarTransicionArmonica(keyA, keyB) === "choque";
      }
      let transitionToNext: EvaluacionUnion | null = null;
      let transitionFromPrev: EvaluacionUnion | null = null;
      if (!isSpeechEvent && pt.song) {
        const siguienteCancion = analysis.points
          .slice(idx + 1)
          .find((p) => p.isSong);
        if (siguienteCancion?.song) {
          transitionToNext = evaluarCalidadUnion(
            pt.song,
            siguienteCancion.song,
          );
        }
        const anteriorCancion = analysis.points
          .slice(0, idx)
          .reverse()
          .find((p) => p.isSong);
        if (anteriorCancion?.song) {
          transitionFromPrev = evaluarCalidadUnion(
            anteriorCancion.song,
            pt.song,
          );
        }
      }

      return {
        idx,
        xPos: xPositions[idx],
        id: pt.item.id,
        songId: isSpeechEvent ? undefined : pt.song?.id,
        name: pt.title,
        score: isSpeechEvent ? null : pt.score,
        idealScore: isSpeechEvent ? null : idealCurve[idx],
        range: [
          Math.max(1, pt.score - pt.variance),
          Math.min(20, pt.score + pt.variance),
        ] as [number, number],
        color: pt.info.hexColor,
        icon: pt.info.icon,
        label: pt.info.label,
        variance: pt.variance,
        isSong: pt.isSong,
        isSpeechEvent,
        bpm: isSpeechEvent
          ? null
          : typeof pt.song?.bpm === "number" && pt.song.bpm > 0
            ? pt.song.bpm
            : null,
        harmonyClash,
        tonalidad: isSpeechEvent ? null : pt.song?.tonalidad?.trim() || null,
        transitionToNext,
        transitionFromPrev,
      };
    });

    // Dominio Y dinámico: se escala al propio setlist (no siempre 1-20) para que las
    // diferencias de energía entre temas se noten de verdad, no se aplasten en un rango fijo.
    // Los eventos de"speech" quedan fuera del cálculo — su rango de relleno (4±0) no debe estrechar
    // ni desplazar la escala pensada para las canciones reales.
    let domain: [number, number] = [1, 20];
    const dataParaDominio = data.filter((d) => !d.isSpeechEvent);
    if (dataParaDominio.length > 0) {
      const allValues = dataParaDominio.flatMap((d) => d.range);
      const minVal = Math.min(...allValues);
      const maxVal = Math.max(...allValues);
      let lo = Math.max(1, minVal - 2);
      let hi = Math.min(20, maxVal + 2);
      if (hi - lo < 6) {
        const mid = (hi + lo) / 2;
        lo = Math.max(1, mid - 3);
        hi = Math.min(20, mid + 3);
      }
      domain = [lo, hi];
    }

    // Bandas de fondo por categoría de energía (mismos umbrales que getEnergyInfo) — es lo
    // que convierte la curva en un"mapa" de verdad: se ve a simple vista en qué zona cae
    // cada canción, no solo por el color del punto sino por el propio fondo del chart.
    const zonas = [
      { min: 1, max: 8, color: "#0284c7" },
      { min: 9, max: 14, color: "#059669" },
      { min: 15, max: 18, color: "#a16207" },
      { min: 19, max: 20, color: "#a21caf" },
    ]
      .map((z) => ({
        ...z,
        y1: Math.max(z.min, domain[0]),
        y2: Math.min(z.max, domain[1]),
      }))
      .filter((z) => z.y1 < z.y2);

    return {
      energyAnalysis: analysis,
      chartData: data,
      yDomain: domain,
      ZONAS_ENERGIA: zonas,
    };
  }, [activeSetlist, songs]);

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
  const [isRecordingShowItem, setIsRecordingShowItem] =
    useState<boolean>(false);
  const [recordingShowItemSecs, setRecordingShowItemSecs] = useState<number>(0);
  const showItemMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const showItemChunksRef = useRef<Blob[]>([]);
  const showItemTimerRef = useRef<any>(null);

  const toggleFavoriteSong = (songId: string) => {
    const target = songs.find((s) => s.id === songId);
    if (!target) return;
    const updatedSong = { ...target, favoritoGeneral: !target.favoritoGeneral };
    const aplicar = (favorito: boolean | undefined) =>
      setSongs((prev) => {
        const next = prev.map((s) =>
          s.id === songId ? { ...s, favoritoGeneral: favorito } : s,
        );
        saveSongsToLocalStorageSafely(next);
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

  // Save changes to localStorage and Backend API
  const getHeaders = () => {
    const token =
      localStorage.getItem("bakandeya_token") || localStorage.getItem("token") || "";
    const effectiveBandId = bandId || cleanBand;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(effectiveBandId ? { "x-band-id": effectiveBandId } : {}),
    };
  };

  useEffect(() => {
    let isCancelled = false;
    // On bandId change, immediately reset and load the clean cache for this band
    const keyS = `band_songs_${cleanBand || "default"}`;
    const keySt = `band_setlists_${cleanBand || "default"}`;
    try {
      const savedS = localStorage.getItem(keyS);
      const parsedS = savedS ? JSON.parse(savedS) : [];
      const sanitizedS = sanitizeBandSongs(parsedS);
      setSongs(
        sanitizedS.length > 0
          ? sanitizedS
          : isBakandeya
            ? DEFAULT_SONGS
            : SAMPLER_SONGS,
      );

      const savedSt = localStorage.getItem(keySt);
      const parsedSt = savedSt ? JSON.parse(savedSt) : [];
      const sanitizedSt = sanitizeBandSetlists(parsedSt);
      setSetlists(
        sanitizedSt.length > 0
          ? sanitizedSt
          : isBakandeya
            ? DEFAULT_SETLISTS
            : SAMPLER_SETLISTS,
      );
      if (sanitizedSt.length > 0) {
        setActiveSetlistId(sanitizedSt[0].id);
      } else {
        setActiveSetlistId(
          isBakandeya ? "setlist-1" : SAMPLER_SETLISTS[0]?.id || "",
        );
      }
    } catch {
      setSongs(isBakandeya ? DEFAULT_SONGS : SAMPLER_SONGS);
      setSetlists(isBakandeya ? DEFAULT_SETLISTS : SAMPLER_SETLISTS);
    }

    const fetchRepertorio = async () => {
      try {
        const [resSongs, resSetlists] = await Promise.all([
          fetch("/api/songs", { headers: getHeaders() }),
          fetch("/api/setlists", { headers: getHeaders() }),
        ]);

        if (isCancelled) return;

        if (resSongs.ok) {
          const dataS = await resSongs.json();
          if (dataS.songs && Array.isArray(dataS.songs)) {
            const sanitized = sanitizeBandSongs(dataS.songs);
            setSongs(
              sanitized.length > 0
                ? sanitized
                : isBakandeya
                  ? DEFAULT_SONGS
                  : SAMPLER_SONGS,
            );
          }
        }

        if (resSetlists.ok) {
          const dataSt = await resSetlists.json();
          if (dataSt.setlists && Array.isArray(dataSt.setlists)) {
            const sanitized = sanitizeBandSetlists(dataSt.setlists);
            const finalSetlists =
              sanitized.length > 0
                ? sanitized
                : isBakandeya
                  ? DEFAULT_SETLISTS
                  : SAMPLER_SETLISTS;
            setSetlists(finalSetlists);
            if (finalSetlists.length > 0) {
              setActiveSetlistId((prev) =>
                finalSetlists.some((s: any) => s.id === prev)
                  ? prev
                  : finalSetlists[0].id,
              );
            } else {
              setActiveSetlistId("");
            }
          }
        }
      } catch (err) {
        console.warn(
          "Unable to load repertorio from server API, using cached state:",
          err,
        );
      }
    };

    // Antes de fiarnos de lo que diga el servidor, reenviamos cualquier edición de setlist que
    // se quedó pendiente sin conexión (p.ej. un cambio de tono en un bolo sin wifi) — si no, el
    // fetch de abajo traería la versión vieja del servidor y la pisaría sin que nadie se entere.
    const flushPendingSetlistSyncs = async () => {
      const pending = getPendingSetlistSyncs(bandId);
      if (pending.length === 0) return;
      await Promise.all(
        pending.map(async (setlist: any) => {
          try {
            const res = await fetch(`/api/setlists/${setlist.id}`, {
              method: "PUT",
              headers: getHeaders(),
              body: JSON.stringify(setlist),
            });
            if (res.ok) clearPendingSetlistSync(bandId, setlist.id);
          } catch {
            // Sigue sin haber conexión — se reintenta en el próximo montaje o al volver'online'.
          }
        }),
      );
    };

    (async () => {
      await flushPendingSetlistSyncs();
      if (!isCancelled) await fetchRepertorio();
    })();

    return () => {
      isCancelled = true;
    };
  }, [bandId, cleanBand, isBakandeya, sanitizeBandSongs, sanitizeBandSetlists]);

  // Reintenta ediciones de setlist pendientes en cuanto el navegador recupera conexión, sin
  // esperar a que el usuario cierre y reabra la pestaña (que es cuando fetchRepertorio corre).
  useEffect(() => {
    const handleOnline = () => {
      getPendingSetlistSyncs(bandId).forEach((setlist: any) => {
        fetch(`/api/setlists/${setlist.id}`, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(setlist),
        })
          .then((res) => {
            if (res.ok) clearPendingSetlistSync(bandId, setlist.id);
          })
          .catch(() => {});
      });
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [bandId]);

  useEffect(() => {
    saveSongsToLocalStorageSafely(songs, bandId);
  }, [songs, bandId]);

  useEffect(() => {
    saveSetlistsToLocalStorageSafely(setlists, bandId);
  }, [setlists, bandId]);

  // Load this band's own custom setlist shortcuts
  useEffect(() => {
    let isCancelled = false;
    setCustomShortcuts([]);
    const fetchShortcuts = async () => {
      try {
        const res = await fetch("/api/setlist-shortcuts", {
          headers: getHeaders(),
        });
        if (isCancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.shortcuts)) {
            setCustomShortcuts(data.shortcuts);
          }
        }
      } catch (err) {
        console.warn(
          "No se pudieron cargar los accesos rápidos de repertorio:",
          err,
        );
      }
    };
    fetchShortcuts();
    return () => {
      isCancelled = true;
    };
  }, [bandId]);

  // Cuando cambia el setlist activo, cargar el análisis IA guardado si existe
  useEffect(() => {
    if (activeSetlist?.ai_analysis_json) {
      setAiAnalysisResult(activeSetlist.ai_analysis_json);
    } else {
      setAiAnalysisResult(null);
    }
    setHighlightedSongIds([]);
  }, [activeSetlist?.id, activeSetlist?.ai_analysis_json]);

  // Microphone recording for Show Items (Presentaciones/Chapas)
  const handleStartRecordingShowItem = async () => {
    try {
      const stream = await getLowLatencyAudioStream();
      const mediaRecorder = new MediaRecorder(stream);
      showItemMediaRecorderRef.current = mediaRecorder;
      showItemChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          showItemChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(showItemChunksRef.current, {
          type: "audio/webm",
        });
        const file = new File(
          [audioBlob],
          `recording-show-${Date.now()}.webm`,
          { type: "audio/webm" },
        );
        try {
          const serverUrl = await uploadFileToServer(file);
          setShowItemAudioUrl(serverUrl);
        } catch (err) {
          console.error(
            "Error uploading show item recording to server disk:",
            err,
          );
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecordingShowItem(true);
      setRecordingShowItemSecs(0);

      showItemTimerRef.current = setInterval(() => {
        setRecordingShowItemSecs((s) => s + 1);
      }, 1000);
    } catch (err: any) {
      console.warn("Microphone access warning:", err?.message || err);
      alert(
        "No se pudo acceder al micrófono (" +
          (err?.message || "permisos denegados") +
          "). Por favor, comprueba los permisos de audio en tu navegador.",
      );
    }
  };

  const handleStopRecordingShowItem = () => {
    if (showItemMediaRecorderRef.current && isRecordingShowItem) {
      showItemMediaRecorderRef.current.stop();
      setIsRecordingShowItem(false);
      if (showItemTimerRef.current) {
        clearInterval(showItemTimerRef.current);
      }
    }
  };

  const handleShowItemAudioFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await uploadFileToServer(file);
      setShowItemAudioUrl(base64);

      const audioObj = new Audio(base64);
      audioObj.onloadedmetadata = () => {
        if (audioObj.duration && !isNaN(audioObj.duration)) {
          setRecordingShowItemSecs(Math.round(audioObj.duration));
        }
      };
    } catch (err) {
      console.error("Error uploading audio file for show item:", err);
    }
  };

  // Si el PUT falla (típicamente sin conexión, en un bolo), el cambio queda en una cola local
  // en vez de perderse: sin esto, un cambio de tono hecho sin wifi durante un concierto podía
  // desaparecer en cuanto la app recuperase conexión y volviera a pedir el setlist al servidor,
  // que devolvería la versión vieja sin enterarse nunca del cambio.
  const syncSetlistToBackend = (updatedSetlist: Setlist) => {
    fetch(`/api/setlists/${updatedSetlist.id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(updatedSetlist),
    })
      .then((res) => {
        if (res.ok) clearPendingSetlistSync(bandId, updatedSetlist.id);
        else queuePendingSetlistSync(bandId, updatedSetlist);
      })
      .catch((err) => {
        console.error("Error updating setlist on server:", err);
        queuePendingSetlistSync(bandId, updatedSetlist);
      });
  };


  // Calculate active setlist metrics (delegated to the shared, unit-tested helper)
  const activeSetlistMetrics = useMemo(() => {
    if (!activeSetlist)
      return {
        totalSeconds: 0,
        formattedTime: "0 min",
        songCount: 0,
        eventCount: 0,
        blockCount: 0,
        avgBpm: 0,
      };

    const songMap = new Map(songs.map((s) => [s.id, s]));
    const stats = calculateSetlistStats(activeSetlist.items, songMap);

    return {
      totalSeconds: stats.totalDurationSeconds,
      formattedTime: formatSecondsToMinutes(stats.totalDurationSeconds),
      songCount: stats.songCount,
      eventCount: stats.eventCount,
      blockCount: stats.blockCount,
      avgBpm: stats.averageBpm,
    };
  }, [activeSetlist, songs]);

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
        if (
          perfectSetlistDraft &&
          (perfectSetlistDraft.draftSetlistId === stId ||
            perfectSetlistDraft.originalSetlistId === stId)
        ) {
          setPerfectSetlistDraft(null);
        }

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

  // Setlist Item Manipulation & Agile Reordering (Drag & Drop) — lógica pura, parametrizada por
  // índices en vez de leer el estado de arrastre de la lista (draggedItemIndex), para poder
  // reutilizarla también desde el drag horizontal sobre el Mapa de Energía (ver EnergyChart).
  //
  // Punto único que de verdad escribe un array de items nuevo — reordenar, quitar una canción,
  // añadir una del catálogo o insertar un bloque son todos casos de"sustituir items por otro
  // array", así que todos pasan por aquí para compartir el snapshot de"Deshacer" (sourceKey
  // identifica qué acción lo generó) y el guardado/sync.
  const applySetlistItemsChange = (
    newItems: SetlistItem[],
    sourceKey: string,
  ) => {
    if (!activeSetlist) return;

    setUndoReorderSnapshot({
      setlistId: activeSetlist.id,
      items: activeSetlist.items,
      sourceKey,
    });

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
  };

  const reorderSetlistItems = (
    fromIndex: number,
    toIndex: number,
    sourceKey: string = "manual",
  ) => {
    if (!activeSetlist || fromIndex === toIndex || fromIndex < 0 || toIndex < 0)
      return;
    const newItems = [...activeSetlist.items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    applySetlistItemsChange(newItems, sourceKey);
  };

  // Busca el mejor hueco del setlist ACTUAL para meter una chapa/interludio — la transición entre
  // dos canciones ya consecutivas que más"chirría" (choque de tonalidad + salto de tempo/energía).
  // No reordena nada: solo sugiere, y el usuario decide si la inserta.
  const suggestChapaSpot = () => {
    if (!activeSetlist) return;
    const sugerencia = sugerirMejorPuntoParaChapa(activeSetlist.items, songs);
    setChapaSuggestion(sugerencia);
    if (!sugerencia) {
      setOptimizeSummary(
        "👍 Las transiciones ya van suaves — no hace falta forzar una chapa en ningún punto concreto.",
      );
      window.setTimeout(() => setOptimizeSummary(null), 7000);
    }
  };

  // Inserta la chapa sugerida justo donde se calculó — reutiliza el mismo flujo que"+ Añadir
  // bloque" del editor manual (handleAddItemToSetlist ya sabe rellenar título/duración por defecto
  // para el subtipo'chapa').
  const insertSuggestedChapa = () => {
    if (!chapaSuggestion) return;
    handleAddItemToSetlist(
      undefined,
      "chapa",
      undefined,
      undefined,
      undefined,
      undefined,
      chapaSuggestion.insertAfterItemId,
    );
    setChapaSuggestion(null);
  };

  // Reordena solo las CANCIONES (nunca los bloques de chapa/presentación/bis, que el usuario
  // colocó a propósito en un punto concreto del show) para minimizar el coste total de transición
  // — choque de tonalidad + salto de tempo + salto de energía entre temas consecutivos. La
  // primera canción del setlist nunca se mueve (ver optimizarOrdenPorTransiciones): es la apertura
  // que ya eligió el usuario, no un dato más a optimizar.
  const optimizeSetlistTransitions = () => {
    if (!activeSetlist) return;
    setChapaSuggestion(null); // el orden va a cambiar: cualquier sugerencia calculada sobre el orden anterior queda obsoleta
    const items = activeSetlist.items;
    const songPositions: number[] = [];
    const slots: HuecoCancion[] = [];
    items.forEach((item, i) => {
      if (item.tipoItem === "cancion" && item.songId) {
        const song = songs.find((s) => s.id === item.songId);
        if (song) {
          songPositions.push(i);
          slots.push({ item, song });
        }
      }
    });
    if (slots.length < 3) return; // con 2 canciones o menos no hay nada que reordenar

    const costeAntes = costeTotalTransiciones(slots);
    const optimizado = optimizarOrdenPorTransiciones(slots);
    const costeDespues = costeTotalTransiciones(optimizado);

    const newItems = [...items];
    songPositions.forEach((pos, idx) => {
      newItems[pos] = optimizado[idx].item;
    });
    applySetlistItemsChange(newItems, "optimize-transitions");

    const mejoraPct =
      costeAntes > 0 ? Math.round((1 - costeDespues / costeAntes) * 100) : 0;
    setOptimizeSummary(
      mejoraPct > 0
        ? `🎯 Orden optimizado: transiciones un ${mejoraPct}% más suaves (tonalidad + tempo + energía).`
        : "El orden actual ya es prácticamente el mejor posible para estas transiciones.",
    );
    window.setTimeout(() => setOptimizeSummary(null), 7000);
  };

  // Quita el item en `index` (usado por el plan de"Setlist Perfecto" para retirar una canción que
  // no encaja — a diferencia de handleRemoveSetlistItem, que borra por id desde la lista visual,
  // esto trabaja por índice porque así es como el plan referencia sus posiciones).
  const removeSetlistItemAtIndex = (index: number, sourceKey: string) => {
    if (!activeSetlist || index < 0 || index >= activeSetlist.items.length)
      return;
    const newItems = activeSetlist.items.filter((_, i) => i !== index);
    applySetlistItemsChange(newItems, sourceKey);
  };

  // Inserta una canción del catálogo en `insertIndex` — variante de handleAddItemToSetlist que
  // inserta en una posición concreta (la que propuso el plan) en vez de tras el item seleccionado.
  const insertSongAtIndex = (
    songId: string,
    insertIndex: number,
    sourceKey: string,
  ) => {
    if (!activeSetlist) return;
    const newItem: SetlistItem = {
      id: `it-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      tipoItem: "cancion",
      songId,
    };
    const newItems = [...activeSetlist.items];
    const clampedIndex = Math.max(0, Math.min(insertIndex, newItems.length));
    newItems.splice(clampedIndex, 0, newItem);
    applySetlistItemsChange(newItems, sourceKey);
  };

  // Inserta un bloque (presentación, pausa, bis...) en `insertIndex` — el plan de"Setlist
  // Perfecto" ya viene con block_type validado contra los tipoItem reales, así que aquí no hace
  // falta repetir los defaults por tipo que sí tiene handleAddItemToSetlist para el editor manual.
  const insertBlockAtIndex = (
    tipoItem: SetlistItem["tipoItem"],
    tituloCustom: string,
    duracionEstimadaMinutos: number | undefined,
    insertIndex: number,
    sourceKey: string,
  ) => {
    if (!activeSetlist) return;
    const newItem: SetlistItem = {
      id: `it-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      tipoItem,
      tituloCustom,
      duracionEstimadaMinutos,
      duracionEstimadaSegundos: duracionEstimadaMinutos
        ? Math.round(duracionEstimadaMinutos * 60)
        : undefined,
    };
    const newItems = [...activeSetlist.items];
    const clampedIndex = Math.max(0, Math.min(insertIndex, newItems.length));
    newItems.splice(clampedIndex, 0, newItem);
    applySetlistItemsChange(newItems, sourceKey);
  };

  // Ejecuta UNA acción concreta del plan de"Setlist Perfecto" — cada acción ya viene validada por
  // el servidor (posiciones dentro de rango, catalog_index resuelto a un song_id real, block_type
  // dentro del enum), así que aquí solo se traduce cada tipo a la función que ya mueve/inserta/quita.
  const applyPerfectSetlistAction = (
    action: PerfectSetlistAction,
    sourceKey: string,
  ) => {
    switch (action.type) {
      case "reorder":
        if (action.from_position != null && action.to_position != null) {
          reorderSetlistItems(
            action.from_position - 1,
            action.to_position - 1,
            sourceKey,
          );
        }
        break;
      case "remove_song":
        if (action.item_position != null) {
          removeSetlistItemAtIndex(action.item_position - 1, sourceKey);
        }
        break;
      case "add_song":
        if (action.song_id && action.insert_at_position != null) {
          insertSongAtIndex(
            action.song_id,
            action.insert_at_position - 1,
            sourceKey,
          );
        }
        break;
      case "add_block":
        if (action.block_type && action.insert_at_position != null) {
          insertBlockAtIndex(
            action.block_type as SetlistItem["tipoItem"],
            action.title || "Nuevo bloque",
            action.duracion_minutos,
            action.insert_at_position - 1,
            sourceKey,
          );
        }
        break;
    }
  };

  // Genera el plan de"Setlist Perfecto" y, la PRIMERA vez, duplica el setlist ANTES de que se
  // pueda aplicar ninguna acción — para no arriesgar el original. Pero"Regenerar" no debe crear
  // una copia nueva cada vez (eso fue justo la queja: demasiadas copias) — mientras el usuario siga
  // trabajando sobre el mismo original (o ya esté sobre la copia), se reutiliza esa misma copia y
  // el plan nuevo se calcula contra SU estado actual (con lo que ya se haya aplicado). Solo se crea
  // una copia nueva si no existe ninguna todavía para este setlist, o si se pide explícitamente
  // (`forceNewCopy`, botón"Nueva copia" del modal).
  const handleGeneratePerfectSetlist = async (
    forceNewCopy: boolean = false,
    feedback?: SetlistFeedbackInput,
  ) => {
    if (!activeSetlist) return;

    const existingDraft =
      !forceNewCopy &&
      perfectSetlistDraft &&
      (perfectSetlistDraft.draftSetlistId === activeSetlist.id ||
        perfectSetlistDraft.originalSetlistId === activeSetlist.id)
        ? perfectSetlistDraft
        : null;

    // Si el usuario volvió al setlist ORIGINAL (no a la copia) pero ya existe una copia de una
    // ronda anterior, se retoma esa copia en vez de generar/duplicar desde el original de nuevo.
    let targetSetlist = activeSetlist;
    if (existingDraft && existingDraft.draftSetlistId !== activeSetlist.id) {
      const draft = setlists.find((s) => s.id === existingDraft.draftSetlistId);
      if (draft) {
        targetSetlist = draft;
        setActiveSetlistId(draft.id);
      }
    }

    setPerfectSetlistLoading(true);
    setPerfectSetlistError(null);
    try {
      const result = await api.generatePerfectSetlist(
        targetSetlist.id,
        feedback,
      );
      if (result.success && result.plan) {
        if (!existingDraft) {
          const copy = handleDuplicateSetlist(
            targetSetlist,
            "(Setlist Perfecto)",
          );
          setPerfectSetlistDraft({
            originalSetlistId: targetSetlist.id,
            draftSetlistId: copy.id,
          });
        }
        setPerfectSetlistPlan(result.plan);
      } else {
        setPerfectSetlistError(result.error || "Error al generar el plan");
      }
    } catch (err: any) {
      setPerfectSetlistError(err.message || "Error desconocido");
    } finally {
      setPerfectSetlistLoading(false);
    }
  };

  const canUndoReorder =
    !!undoReorderSnapshot &&
    undoReorderSnapshot.setlistId === activeSetlist?.id;
  // Qué acción concreta es la que"Deshacer" revertiría ahora mismo — null si no hay nada que
  // deshacer, o si el setlist activo cambió desde entonces. Solo la acción que dejó este snapshot
  // (la más reciente) puede mostrar su propio botón como"Deshacer" en vez de"Aplicar"/"Aplicado".
  const undoSourceKey = canUndoReorder ? undoReorderSnapshot!.sourceKey : null;

  const undoLastReorder = () => {
    if (
      !activeSetlist ||
      !undoReorderSnapshot ||
      undoReorderSnapshot.setlistId !== activeSetlist.id
    )
      return;

    const restoredSetlist: Setlist = {
      ...activeSetlist,
      fechaUltimaEdicion: new Date().toISOString().split("T")[0],
      items: undoReorderSnapshot.items,
    };

    setSetlists((prev) => {
      const next = prev.map((st) =>
        st.id === activeSetlist.id ? restoredSetlist : st,
      );
      saveSetlistsToLocalStorageSafely(next);
      return next;
    });
    syncSetlistToBackend(restoredSetlist);
    setUndoReorderSnapshot(null);
  };

  const handleDropItem = (targetIndex: number) => {
    if (draggedItemIndex !== null)
      reorderSetlistItems(draggedItemIndex, targetIndex);
    setDraggedItemIndex(null);
    setDragOverItemIndex(null);
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

  // Add several catalog songs to the active setlist in a single action/save
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

      {/* VIEW 1: SETLISTS & REPERTORIOS DE DIRECTO */}
      {activeTab === "setlists" && (
        <div className="w-full">
          {/* MAIN EDITOR FOR ACTIVE SETLIST */}
          <div
            className="w-full p-3 sm:p-6 rounded-[var(--r-l)] sm:rounded-[var(--r-l)] space-y-2 sm:space-y-4 bg-[var(--surface)] max-lg:sticky max-lg:top-[-0.75rem] max-lg:z-20"
          >
            <ActiveSetlistHeader
              activeSetlist={activeSetlist}
              onUpdateSetlistName={(val) => {
                if (!activeSetlist) return;
                const updatedSetlist = {
                  ...activeSetlist,
                  nombre: val,
                };
                setSetlists((prev) =>
                  prev.map((st) =>
                    st.id === activeSetlist.id ? updatedSetlist : st,
                  ),
                );
              }}
              onEnterStageMode={() => {
                if (activeSetlist) {
                  cacheActiveStageSetlist(activeSetlist, songs, bandId);
                  setPerformanceInitialMode("directo");
                  setPerformanceSetlistId(activeSetlist.id);
                }
              }}
              onEnterRehearsalMode={() => {
                if (activeSetlist) {
                  cacheActiveStageSetlist(activeSetlist, songs, bandId);
                  setPerformanceInitialMode("ensayo");
                  setPerformanceSetlistId(activeSetlist.id);
                }
              }}
              onOpenAIAnalysis={() => setShowAIAnalysisModal(true)}
              onOpenPerfectSetlist={() => {
                setPerfectSetlistPlan(null);
                setPerfectSetlistError(null);
                setShowPerfectSetlistModal(true);
              }}
              aiAnalysisOverallScore={aiAnalysisResult?.overallScore}
              onPrintSetlist={() => setShowPdfPreview(true)}
              onShareSetlist={() => handleShareSetlist(activeSetlist)}
              onAssignSetlist={() => setAssigningSetlist(activeSetlist)}
              onDuplicateSetlist={() => handleDuplicateSetlist(activeSetlist)}
              onImportSetlist={() => setShowImportSetlistModal(true)}
              onEditSetlistDetails={() =>
                setSetlistModalData({
                  isOpen: true,
                  setlistToEdit: activeSetlist,
                })
              }
              onDeleteSetlist={() => handleDeleteSetlist(activeSetlist.id)}
            />
          </div>

          {/* SETLIST VIEW MODES & SUMMARY BAR */}
          {(() => {
            return (
              <div className="flex flex-col gap-2.5">
                <SetlistStatsSummaryBar
                  metrics={activeSetlistMetrics}
                  profileLabel={energyAnalysis.profileLabel}
                  showStats={showSetlistStats}
                  onToggleShowStats={() => setShowSetlistStats((v) => !v)}
                />

                {/* MAPA Y CURVA DE ENERGÍA DEL SHOW */}
                {energyAnalysis.points.length > 0 && (
                  <EnergyMapCard
                    setlistKey={activeSetlist.id}
                    energyAnalysis={energyAnalysis}
                    chartData={chartData}
                    yDomain={yDomain}
                    zonasEnergia={ZONAS_ENERGIA}
                    canUndoReorder={canUndoReorder}
                    undoLastReorder={undoLastReorder}
                    showEnergyMap={showEnergyMap}
                    setShowEnergyMap={setShowEnergyMap}
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
                    playerCurrentSongId={playerCurrentSong?.id}
                    handleOpenTransitionPreview={handleOpenTransitionPreview}
                    reorderSetlistItems={reorderSetlistItems}
                    handleEnergyChartDrag={handleEnergyChartDrag}
                    showHeuristicWarnings={showHeuristicWarnings}
                    setShowHeuristicWarnings={setShowHeuristicWarnings}
                    aiAnalysisResult={aiAnalysisResult}
                    setShowAIAnalysisModal={setShowAIAnalysisModal}
                    titlesMatch={titlesMatch}
                  />
                )}
              </div>
            );
          })()}

          {/* ADD ITEMS ACTION BAR (Modular) */}
          <SetlistAddBar
            activeSetlist={activeSetlist}
            songs={songs}
            sortedSongsByAlbumAndOrder={sortedSongsByAlbumAndOrder}
            selectedSetlistItemId={selectedSetlistItemId}
            setSelectedSetlistItemId={setSelectedSetlistItemId}
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
          />

          {/* ITEMS LIST WITH DRAG & DROP AND SELECTION */}
          <SetlistItemsList
            activeSetlist={activeSetlist}
            songs={songs}
            selectedSetlistItemId={selectedSetlistItemId}
            setSelectedSetlistItemId={setSelectedSetlistItemId}
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
            handleOpenTransitionPreview={handleOpenTransitionPreview}
            handleRemoveSetlistItem={handleRemoveSetlistItem}
            handleUpdateItemNote={handleUpdateItemNote}
            onEditSong={(song) => {
              setEditingSong(song);
              setShowSongModal(true);
            }}
            onOpenStudio={(song) => handleOpenStudioModal(song)}
            onOpenMemberNotes={(song) => setActiveMemberNotesSong(song)}
            onOpenChords={(song) => setActiveChordsSong(song)}
            currentUser={currentUser}
            handleUpdateSongFromStudio={handleUpdateSongFromStudio}
            onUpdateShowItemTitle={(itemId, val) => {
              setSetlists((prev) =>
                prev.map((s) =>
                  s.id === activeSetlist.id
                    ? {
                        ...s,
                        items: s.items.map((x) =>
                          x.id === itemId ? { ...x, tituloCustom: val } : x,
                        ),
                      }
                    : s,
                ),
              );
            }}
            onEditShowItem={(it) => {
              setEditingShowItem(it);
              setShowShowItemModal(true);
            }}
            transparentDragImage={TRANSPARENT_DRAG_IMAGE}
          />
        </div>
      )}

      {/* VIEW 2: DISCOGRAFÍA & CATÁLOGO GENERAL DE TEMAS (UNIFICADO) */}
      {activeTab === "catalogo" && (
        <div className="space-y-4" data-modulo="discografia">
          {catalogoViewMode === "albumes" ? (
            <DiscografiaView
              songs={songs}
              albumsList={albumsList}
              colors={colors}
              bandName={bName}
              bandLogoUrl={bandLogoUrl}
              setSongs={setSongs}
              setSetlists={setSetlists}
              toggleFavoriteSong={handleToggleFavorite}
              activePlayerSong={activePlayerSong}
              isPlayerPlaying={isPlayerPlaying}
              onSelectSong={(song, autoPlay, queue) =>
                selectPlayerSongWithQueue(song, autoPlay, queue || null)
              }
              onRequestDeleteAlbum={(albumName, songCount) =>
                setDeleteAlbumData({ albumName, songCount })
              }
              onEditAlbum={(albumName) =>
                setAssignSongsModalData({ isOpen: true, albumName })
              }
              onCreateAlbum={() =>
                setAssignSongsModalData({ isOpen: true, albumName: "" })
              }
              onOpenMemberNotes={(song) => setActiveMemberNotesSong(song)}
              onOpenChords={(song) => setActiveChordsSong(song)}
              onOpenStudio={(song) => handleOpenStudioModal(song)}
              onEditSong={(song) => {
                setEditingSong(song);
                setShowSongModal(true);
              }}
              onDeleteSong={(songId) => handleDeleteSong(songId)}
              onShareSong={(song) => handleShareSong(song)}
            />
          ) : (
            <CatalogoGeneralView
              songs={songs}
              filteredSongs={filteredSongs}
              albumsList={albumsList}
              colors={colors}
              bName={bName}
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
              activePlayerSong={activePlayerSong}
              isPlayerPlaying={isPlayerPlaying}
              selectPlayerSongWithQueue={selectPlayerSongWithQueue}
              onOpenNewSongModal={() => {
                setEditingSong(null);
                setShowSongModal(true);
              }}
              onEditSong={(song) => {
                setEditingSong(song);
                setShowSongModal(true);
              }}
              onDeleteSong={(songId) => handleDeleteSong(songId)}
              onShareSong={(song) => handleShareSong(song)}
              onOpenChords={(song) => setActiveChordsSong(song)}
              onOpenMemberNotes={(song) => setActiveMemberNotesSong(song)}
              onOpenStudio={(song, opts) => handleOpenStudioModal(song, opts)}
              onUpdateSongFromStudio={handleUpdateSongFromStudio}
              draggedCatalogSongId={draggedCatalogSongId}
              setDraggedCatalogSongId={setDraggedCatalogSongId}
              dragOverCatalogSongId={dragOverCatalogSongId}
              setDragOverCatalogSongId={setDragOverCatalogSongId}
              handleDropCatalogSong={handleDropCatalogSong}
            />
          )}
        </div>
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
