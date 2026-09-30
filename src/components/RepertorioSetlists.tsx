/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/set-state-in-effect,
 react-hooks/exhaustive-deps,
 react-hooks/purity,
 react-hooks/immutability
*/
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
import { Button, Chip, Input, Select, ShowIcon } from './ui';
import { RepertorioNavBar } from "./repertorio/RepertorioNavBar";
import { SetlistAddBar } from "./repertorio/SetlistAddBar";
import SongStudioModal from "./SongStudioModal";
import { SongChordsViewerModal } from "./SongChordsViewerModal";
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

// Plantilla de la formación de Bakandeya usada como banda de demostración de la propia
// app: solo debe mostrarse cuando la banda activa es literalmente Bakandeya, nunca como
// fallback para otras bandas (ver bandRosterMembers más abajo).
const BAKANDEYA_DEMO_MEMBERS: BandMemberOption[] = [
  {
    id: "usr-1",
    name: "Voz / Guitarra",
    instrument: "Voz / Guitarra",
    avatarColor: "var(--acc)",
  },
  {
    id: "usr-2",
    name: "Bajo / Coros",
    instrument: "Bajo / Coros",
    avatarColor: "var(--ok)",
  },
  {
    id: "usr-3",
    name: "Batería / Percusión",
    instrument: "Batería / Percusión",
    avatarColor: "var(--accent-2)",
  },
  {
    id: "usr-4",
    name: "Teclados / Sintes",
    instrument: "Teclados / Sintes",
    avatarColor: "var(--ok)",
  },
  {
    id: "usr-5",
    name: "Vientos / Metales",
    instrument: "Vientos / Metales",
    avatarColor: "var(--acc)",
  },
];

export function formatSecondsToMmSs(secs: number): string {
  if (!secs || isNaN(secs) || secs < 0) return "00:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function getTokenValueForPrint(tokenName: string): string {
  const style =
    typeof document !== "undefined"
      ? getComputedStyle(document.documentElement)
      : null;
  return style
    ? style.getPropertyValue(tokenName).trim() || "#666666"
    : "#666666";
}

function generatePdfStylesheet(): string {
  const bgColor = getTokenValueForPrint("--bg");
  const inkColor = getTokenValueForPrint("--ink");
  const ink2Color = getTokenValueForPrint("--ink-2");
  const ink3Color = getTokenValueForPrint("--ink-3");
  const accColor = getTokenValueForPrint("--acc");
  const okColor = getTokenValueForPrint("--ok");
  const alertColor = getTokenValueForPrint("--alert");
  const hairColor = getTokenValueForPrint("--hair");

  return `
 body {
 font-family: system-ui, -apple-system, sans-serif;
 margin: 20px;
 background: ${bgColor};
 color: ${inkColor};
 }
 .header {
 border-bottom: 4px solid ${accColor};
 padding-bottom: 15px;
 margin-bottom: 25px;
 display: flex;
 justify-content: space-between;
 align-items: center;
 }
 h1 { font-size: 32px; margin: 0; color: ${accColor}; letter-spacing: 2px; }
 .meta { font-size: 16px; font-family: monospace; color: ${ink2Color}; }
 .set-table { width: 100%; border-collapse: collapse; }
 .set-table th {
 text-align: left;
 padding: 10px;
 border-bottom: 2px solid ${ink3Color};
 font-size: 14px;
 color: ${ink2Color};
 }
 .set-table td {
 padding: 14px 10px;
 border-bottom: 1px solid ${hairColor};
 font-size: 22px;
 font-weight: bold;
 }
 .num { color: ${accColor}; width: 40px; font-family: monospace; }
 .key-badge {
 display: inline-block;
 background: ${bgColor};
 color: ${okColor};
 padding: 4px 10px;
 border-radius: 6px;
 font-size: 18px;
 font-family: monospace;
 }
 .bpm { color: ${ink2Color}; font-size: 16px; font-family: monospace; }
 .chapa { color: ${accColor}; font-style: italic; font-size: 18px; }
 .bis { color: ${alertColor}; font-size: 20px; text-align: center; }
 .note { display: block; font-size: 13px; color: ${ink3Color}; font-weight: normal; margin-top: 4px; font-style: italic; }
 .footer { margin-top: 30px; font-size: 12px; font-family: monospace; color: ${ink3Color}; text-align: center; }
 .member-note {
 display: inline-block;
 background: ${bgColor};
 color: ${inkColor};
 font-size: 11px;
 padding: 2px 7px;
 border-radius: 999px;
 font-family: monospace;
 margin-right: 6px;
 margin-top: 4px;
 }
 `;
}

export const SHOW_ITEM_TYPES: Record<
  string,
  { label: string; icon: string; bg: string; text: string }
> = {
  header: {
    label: "Encabezado de Bloque / Sección",
    icon: "⚡",
    bg: "bg-[var(--acc)]/20",
    text: "text-[var(--acc)]",
  },
  presentacion: {
    label: "Presentación Banda / Saludo",
    icon: "🎤",
    bg: "bg-[var(--ok)]/15",
    text: "text-[var(--ok)]",
  },
  intro_tema: {
    label: "Intro / Historia del Tema",
    icon: "🗣️",
    bg: "bg-[var(--acc-soft)]/80",
    text: "text-[var(--acc)]",
  },
  beatbox: {
    label: "Performance Beatbox / Ritmo",
    icon: "🥁",
    bg: "bg-[var(--acc)]/15",
    text: "text-[var(--acc)]",
  },
  solo_performance: {
    label: "Solo de Instrumento / Jam",
    icon: "🎸",
    bg: "bg-[var(--acc-soft)]/60",
    text: "text-[var(--acc)]",
  },
  cambio_instrumento: {
    label: "Cambio Instrumento / Afinación",
    icon: "🔧",
    bg: "bg-[var(--ok)]/15",
    text: "text-[var(--ok)]",
  },
  chapa: {
    label: "Chapa / Discurso con el Público",
    icon: "💬",
    bg: "bg-[var(--acc)]/15",
    text: "text-[var(--acc)]",
  },
  descanso: {
    label: "Pausa / Intermedio / Agua",
    icon: "⏸️",
    bg: "bg-[var(--sunken)]",
    text: "text-[var(--ink-2)]",
  },
  bis: {
    label: "BIS / Parón Pre-Bis",
    icon: "💣",
    bg: "bg-[var(--alert)]/15",
    text: "text-[var(--alert)]",
  },
  otro: {
    label: "Otro Evento del Show",
    icon: "📌",
    bg: "bg-[var(--surface)]/80",
    text: "text-[var(--ink-2)]",
  },
};

// GIF 1x1 transparente para anular la"foto" fantasma que el navegador dibuja por defecto al
// arrastrar con drag-and-drop nativo (HTML5 draggable): sin `setDragImage`, cada fila reordenable
// (canciones y bloques por igual) deja ver una captura translúcida de sí misma siguiendo al
// cursor mientras se arrastra. Se crea una sola vez a nivel de módulo para que ya esté decodificada
// cuando el usuario arrastre de verdad — el reordenamiento en sí no cambia, solo desaparece la foto.
// window.Image (no el icono `Image` de lucide-react importado arriba, que shadowea el global).
const TRANSPARENT_DRAG_IMAGE =
  typeof window !== "undefined" ? new window.Image() : null;
if (TRANSPARENT_DRAG_IMAGE) {
  TRANSPARENT_DRAG_IMAGE.src =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7";
}

const DEFAULT_SONGS: Song[] = [
  {
    id: "song-cm-1",
    titulo: "Intro (Live Casa México)",
    duracion: "1:30",
    duracionSegundos: 90,
    tonalidad: "Am",
    bpm: 120,
    afinacion: "E Standard",
    albumDisco: "Directo Casa México",
    estadoTema: "listo",
    esVersionCovers: false,
    audioPrincipalUrl: "/audio/samples/sample_01_groove_apertura.mp3",
    audioUrl: "/audio/samples/sample_01_groove_apertura.mp3",
    notasInternas: "Intro del directo en Casa México",
  },
  {
    id: "song-cm-2",
    titulo: "Tema1 (Live Casa México)",
    duracion: "3:45",
    duracionSegundos: 225,
    tonalidad: "Em",
    bpm: 125,
    afinacion: "E Standard",
    albumDisco: "Directo Casa México",
    estadoTema: "listo",
    esVersionCovers: false,
    audioPrincipalUrl: "/audio/samples/sample_03_fuego_asfalto.mp3",
    audioUrl: "/audio/samples/sample_03_fuego_asfalto.mp3",
  },
  {
    id: "song-cm-3",
    titulo: "Reggae Rock Style",
    duracion: "4:10",
    duracionSegundos: 250,
    tonalidad: "Dm",
    bpm: 110,
    afinacion: "E Standard",
    albumDisco: "Directo Casa México",
    estadoTema: "listo",
    esVersionCovers: false,
    audioPrincipalUrl: "/audio/samples/sample_04_brisa_mediterranea.mp3",
    audioUrl: "/audio/samples/sample_04_brisa_mediterranea.mp3",
  },
  {
    id: "song-cm-4",
    titulo: "Ska",
    duracion: "3:20",
    duracionSegundos: 200,
    tonalidad: "Am",
    bpm: 145,
    afinacion: "E Standard",
    albumDisco: "Directo Casa México",
    estadoTema: "listo",
    esVersionCovers: false,
    audioPrincipalUrl: "/audio/samples/sample_05_cierre_triunfal.mp3",
    audioUrl: "/audio/samples/sample_05_cierre_triunfal.mp3",
  },
  {
    id: "song-cm-5",
    titulo: "Llorona",
    duracion: "4:30",
    duracionSegundos: 270,
    tonalidad: "Am",
    bpm: 100,
    afinacion: "E Standard",
    albumDisco: "Directo Casa México",
    estadoTema: "listo",
    esVersionCovers: false,
    audioPrincipalUrl: "/audio/samples/sample_02_balada_medianoche.mp3",
    audioUrl: "/audio/samples/sample_02_balada_medianoche.mp3",
  },
  {
    id: "song-1",
    titulo: "Brisa y Cacharros",
    duracion: "3:30",
    duracionSegundos: 210,
    tonalidad: "Am",
    bpm: 124,
    afinacion: "E Standard",
    albumDisco: "Álbum Debut (2025)",
    estadoTema: "listo",
    esVersionCovers: false,
    enlaceAcordes: "https://drive.google.com",
    notasInternas:
      "Intro con sección de vientos y solo de trompeta. Gran fuerza en estribillos.",
  },
  {
    id: "song-2",
    titulo: "Fuego en la Sala",
    duracion: "4:12",
    duracionSegundos: 252,
    tonalidad: "Em",
    bpm: 138,
    afinacion: "E Standard",
    albumDisco: "Álbum Debut (2025)",
    estadoTema: "listo",
    esVersionCovers: false,
    notasInternas:
      "Subida progresiva al final. Tema estelar de cierre en festival.",
  },
  {
    id: "song-3",
    titulo: "Noches de Garaje",
    duracion: "3:45",
    duracionSegundos: 225,
    tonalidad: "Dm",
    bpm: 115,
    afinacion: "Drop D",
    albumDisco: "EP Cacharros & Ritmo",
    estadoTema: "listo",
    esVersionCovers: false,
    notasInternas: "Afinación especial en guitarra antes de empezar.",
  },
  {
    id: "song-4",
    titulo: "Ska del Norte",
    duracion: "3:15",
    duracionSegundos: 195,
    tonalidad: "A Major",
    bpm: 152,
    afinacion: "E Standard",
    albumDisco: "Single 2026",
    estadoTema: "listo",
    esVersionCovers: false,
    notasInternas:
      "Ritmo acelerado ska. Ideal para subir la energía a mitad del concierto.",
  },
  {
    id: "song-5",
    titulo: "Canto a la Sombra",
    duracion: "5:10",
    duracionSegundos: 310,
    tonalidad: "Bm",
    bpm: 96,
    afinacion: "E Standard",
    albumDisco: "Álbum Debut (2025)",
    estadoTema: "listo",
    esVersionCovers: false,
    notasInternas:
      "Balada rock progresiva con solo de violín de Raúl en la sección central.",
  },
  {
    id: "song-6",
    titulo: "Gira Sin Fin",
    duracion: "4:05",
    duracionSegundos: 245,
    tonalidad: "G Major",
    bpm: 128,
    afinacion: "E Standard",
    albumDisco: "Álbum Debut (2025)",
    estadoTema: "listo",
    esVersionCovers: false,
  },
  {
    id: "song-7",
    titulo: "Mánager Fantasma",
    duracion: "3:50",
    duracionSegundos: 230,
    tonalidad: "Cm",
    bpm: 120,
    afinacion: "E Standard",
    albumDisco: "Inéditas / En Proceso",
    estadoTema: "ensayando",
    esVersionCovers: false,
    notasInternas:
      "Sátira sobre los bots y mánagers virtuales. Ensayando para el próximo EP.",
  },
  {
    id: "song-8",
    titulo: "Maldita Dulzura (Cover)",
    duracion: "3:40",
    duracionSegundos: 220,
    tonalidad: "C Major",
    bpm: 110,
    afinacion: "E Standard",
    albumDisco: "Covers & Versiones",
    estadoTema: "listo",
    esVersionCovers: true,
    notasInternas: "Versión acelerada adaptada a vientos y ritmo ska-rock.",
  },
];

const DEFAULT_SETLISTS: Setlist[] = [
  {
    id: "setlist-1",
    nombre: "Festival Directo Caña 45 min",
    descripcion:
      "Estructura ágil en 3 bloques (Calentamiento, Nudo y Desenlace) con beatbox y presentación",
    tipoFormato: "festival",
    duracionTotalEstimadaMinutos: 45,
    fechaCreacion: "2026-03-01",
    fechaUltimaEdicion: "2026-08-01",
    items: [
      {
        id: "i-b1",
        tipoItem: "bloque",
        bloqueSubtipo: "header",
        tituloCustom: "Bloque 1: Calentamiento & Arranque",
      },
      {
        id: "i-1",
        songId: "song-1",
        tipoItem: "cancion",
        notaTema: "Arrancar directo sin intro",
      },
      {
        id: "i-2",
        songId: "song-2",
        tipoItem: "cancion",
        notaTema: "Empalmar batería con final de Brisa",
      },
      {
        id: "i-bbx",
        tipoItem: "bloque",
        bloqueSubtipo: "beatbox",
        tituloCustom: "Solo de Percusión / Intro Vocal",
        duracionEstimadaMinutos: 2,
        duracionEstimadaSegundos: 120,
        notaTema:
          "Luz cenital sobre el solista. La base rítmica marca el pulso.",
      },

      {
        id: "i-b2",
        tipoItem: "bloque",
        bloqueSubtipo: "header",
        tituloCustom: "Bloque 2: Nudo & Clímax",
      },
      {
        id: "i-3",
        songId: "song-4",
        tipoItem: "cancion",
        notaTema: "Subidón ska",
      },
      {
        id: "i-4",
        tipoItem: "bloque",
        bloqueSubtipo: "presentacion",
        tituloCustom: "Presentación Banda & Agradecimientos",
        duracionEstimadaMinutos: 2,
        duracionEstimadaSegundos: 120,
        notaTema: "El vocalista habla al público y presenta a los músicos",
      },
      {
        id: "i-5",
        songId: "song-3",
        tipoItem: "cancion",
        notaTema: "Cambio de guitarra a Drop D",
      },

      {
        id: "i-b3",
        tipoItem: "bloque",
        bloqueSubtipo: "header",
        tituloCustom: "Bloque 3: Desenlace & BIS Final",
      },
      {
        id: "i-6",
        songId: "song-6",
        tipoItem: "cancion",
        notaTema: "Estribillo con coros del público",
      },
      {
        id: "i-7",
        tipoItem: "bloque",
        bloqueSubtipo: "bis",
        tituloCustom: "BIS / Cierre de Festival",
        duracionEstimadaMinutos: 1,
        duracionEstimadaSegundos: 60,
        notaTema: "Salida rápida de escenario y vuelta para bis",
      },
      {
        id: "i-8",
        songId: "song-5",
        tipoItem: "cancion",
        notaTema: "Solo final de violín extendido",
      },
    ],
  },
  {
    id: "setlist-2",
    nombre: "Concierto Sala Larga 75 min",
    descripcion:
      "Setlist completo con bloque acústico, solos e intros explicativas",
    tipoFormato: "sala_larga",
    duracionTotalEstimadaMinutos: 75,
    fechaCreacion: "2026-04-10",
    fechaUltimaEdicion: "2026-07-20",
    items: [
      {
        id: "i-20",
        tipoItem: "bloque",
        bloqueSubtipo: "header",
        tituloCustom: "Bloque 1: Bienvenida & Potencia",
      },
      { id: "i-21", songId: "song-1", tipoItem: "cancion" },
      { id: "i-22", songId: "song-6", tipoItem: "cancion" },
      {
        id: "i-intro",
        tipoItem: "bloque",
        bloqueSubtipo: "intro_tema",
        tituloCustom: "Historia / Intro a Noches de Garaje",
        duracionEstimadaMinutos: 1,
        duracionEstimadaSegundos: 60,
        notaTema: "Explicación del origen de la canción",
      },
      { id: "i-23", songId: "song-3", tipoItem: "cancion" },

      {
        id: "i-23b",
        tipoItem: "bloque",
        bloqueSubtipo: "header",
        tituloCustom: "Bloque 2: Acústico & Covers",
      },
      {
        id: "i-24",
        songId: "song-8",
        tipoItem: "cancion",
        notaTema: "Cover festivo",
      },
      {
        id: "i-25",
        tipoItem: "bloque",
        bloqueSubtipo: "chapa",
        tituloCustom: "Chapa Merch & Agradecimientos a la Sala",
        duracionEstimadaMinutos: 3,
        duracionEstimadaSegundos: 180,
      },
      {
        id: "i-26",
        songId: "song-7",
        tipoItem: "cancion",
        notaTema: "Tema nuevo en prueba",
      },

      {
        id: "i-26b",
        tipoItem: "bloque",
        bloqueSubtipo: "header",
        tituloCustom: "Bloque 3: Desenlace & Traca",
      },
      { id: "i-27", songId: "song-5", tipoItem: "cancion" },
      { id: "i-28", songId: "song-4", tipoItem: "cancion" },
      { id: "i-29", songId: "song-2", tipoItem: "cancion" },
    ],
  },
];

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
    setSongs(updatedSongs);
    saveSongsToLocalStorageSafely(updatedSongs);

    // Persist song reordering to server
    updatedSongs.forEach((s) => {
      fetch("/api/songs/" + s.id, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(s),
      }).catch((err) =>
        console.error("Error updating catalog song order on server:", err),
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
    setSongs((prevSongs) => {
      const target = prevSongs.find((s) => s.id === songId);
      const updated = prevSongs.map((s) =>
        s.id === songId ? { ...s, favoritoGeneral: !s.favoritoGeneral } : s,
      );
      saveSongsToLocalStorageSafely(updated);
      if (target) {
        const updatedSong = {
          ...target,
          favoritoGeneral: !target.favoritoGeneral,
        };
        fetch("/api/songs/" + songId, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(updatedSong),
        }).catch((err) =>
          console.error("Error updating favorite on server:", err),
        );
      }
      return updated;
    });
  };

  // Save changes to localStorage and Backend API
  const getHeaders = () => {
    const token = localStorage.getItem("bakandeya_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(bandId ? { "x-band-id": bandId } : {}),
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

  // Helper to format seconds to"X min Y s"
  const formatSecondsToMinutes = (totalSec: number): string => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    if (s === 0) return `${m} min`;
    return `${m}m ${s}s`;
  };

  const formatItemDuration = (item: SetlistItem): string => {
    if (item.duracionEstimadaSegundos) {
      const m = Math.floor(item.duracionEstimadaSegundos / 60);
      const s = item.duracionEstimadaSegundos % 60;
      return s > 0 ? `${m}m ${s}s` : `${m} min`;
    }
    if (item.duracionEstimadaMinutos) {
      return `${item.duracionEstimadaMinutos} min`;
    }
    return "0 min";
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

  // Ask the backend to listen to a song's real audio and auto-fill its lyrics/chords (cifradoTexto).
  // Fires in the background after a song is saved with a new audio file, no extra click needed.
  const runAutoChordAnalysis = async (song: Song) => {
    if (!song.audioPrincipalUrl) return;

    // Si la subida cayó en uno de los fallbacks locales de audioStorage (IndexedDB o data URL),
    // el servidor no puede descargar ese audio, así que analizarlo daría un cifrado inventado
    // a partir del título. Mejor decirlo que fingir que se ha transcrito la grabación.
    if (
      !/^https?:\/\//i.test(song.audioPrincipalUrl) &&
      !song.audioPrincipalUrl.startsWith("/")
    ) {
      setStatusBanner({
        text: `El audio de "${song.titulo}" no llegó a subirse al servidor, así que no se pueden transcribir los acordes. Vuelve a subirlo.`,
        type: "error",
      });
      setTimeout(() => setStatusBanner(null), 6000);
      return;
    }

    setStatusBanner({
      text: `🎵 Analizando letra y acordes de "${song.titulo}" con IA…`,
      type: "loading",
    });
    try {
      const res = await fetch("/api/generate-song-chords", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          songId: song.id,
          titulo: song.titulo,
          tonalidad: song.tonalidad,
          bpm: song.bpm,
          afinacion: song.afinacion,
          esVersionCovers: song.esVersionCovers,
          audioUrl: song.audioPrincipalUrl,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.cifradoTexto) {
        const updatedSong = {
          ...song,
          cifradoTexto: data.cifradoTexto,
          guiaSustituto: data.guiaSustituto,
        };
        setSongs((prev) => {
          const next = prev.map((s) =>
            s.id === song.id
              ? {
                  ...s,
                  cifradoTexto: data.cifradoTexto,
                  guiaSustituto: data.guiaSustituto,
                }
              : s,
          );
          saveSongsToLocalStorageSafely(next);
          return next;
        });

        // Si el servidor no pudo guardarlo, lo persistimos nosotros por la vía normal para que
        // el cifrado no se quede solo en esta pestaña y se pierda al recargar.
        if (!data.persisted) {
          fetch(`/api/songs/${encodeURIComponent(song.id)}`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(updatedSong),
          }).catch((err) =>
            console.error("Error persisting generated chords:", err),
          );
        }

        // El backend distingue tres orígenes reales del cifrado para que este aviso nunca
        // haga pasar una plantilla genérica de relleno (cuando la IA falla del todo) por
        // una transcripción real o una propuesta honesta de la IA.
        if (data.chordsSource === "audio_real") {
          setStatusBanner({
            text: `✓ Letra y acordes de "${song.titulo}" transcritos del audio`,
            type: "success",
          });
        } else if (data.chordsSource === "ia_sin_audio" && !data.esAproximado) {
          setStatusBanner({
            text: `✓ Cifrado propuesto por IA para "${song.titulo}" (no se pudo leer el audio: revísalo)`,
            type: "success",
          });
        } else if (data.chordsSource === "ia_sin_audio" && data.esAproximado) {
          setStatusBanner({
            text: `⚠️ Acordes aproximados de "${song.titulo}" (de memoria, sin audio ni certeza): verifícalos de oído antes de tocarlos`,
            type: "warning",
          });
        } else {
          setStatusBanner({
            text: `⚠️ La IA no respondió: se ha puesto un cifrado de plantilla genérico en "${song.titulo}", revísalo antes de usarlo`,
            type: "warning",
          });
        }
      } else {
        setStatusBanner({
          text: `No se pudieron analizar los acordes de "${song.titulo}"`,
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error auto-generating chords from audio:", err);
      setStatusBanner({
        text: `No se pudieron analizar los acordes de "${song.titulo}"`,
        type: "error",
      });
    } finally {
      setTimeout(() => setStatusBanner(null), 4000);
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
      const updatedSong: Song = {
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
      };
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
      fetch(`/api/songs/${editingSong.id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(updatedSong),
      }).catch((err) => console.error("Error updating song on server:", err));
      if (hasNewAudio) runAutoChordAnalysis(updatedSong);
    } else {
      const newSong: Song = {
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
      };
      setSongs((prev) => {
        const next = [newSong, ...prev];
        saveSongsToLocalStorageSafely(next);
        return next;
      });
      fetch("/api/songs", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(newSong),
      }).catch((err) => console.error("Error creating song on server:", err));
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
        setSongs((prev) => prev.filter((s) => s.id !== songId));
        setSetlists((prev) =>
          prev.map((st) => ({
            ...st,
            items: st.items.filter((it) => it.songId !== songId),
          })),
        );

        fetch(`/api/songs/${songId}`, {
          method: "DELETE",
          headers: getHeaders(),
        }).catch((err) => console.error("Error deleting song on server:", err));
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
          fetch(`/api/songs/${songId}`, {
            method: "DELETE",
            headers: getHeaders(),
          }).catch((err) =>
            console.error("Error deleting song on server:", err),
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
    const updated = songs.map((s) => {
      if (s.id === songId) {
        const isFav = !s.favoritoGeneral;
        const updatedSong = { ...s, favoritoGeneral: isFav };
        fetch(`/api/songs/${s.id}`, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(updatedSong),
        }).catch((err) =>
          console.error("Error toggling favorite on server:", err),
        );
        return updatedSong;
      }
      return s;
    });
    setSongs(updated);
    saveSongsToLocalStorageSafely(updated);
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
    let isFirst = true;
    const updatedSongs = songs.map((s) => {
      const isCurrentlyInAlbum =
        (s.albumDisco || "Singles / Sin Disco") === albumName ||
        s.albumDisco === albumName;
      if (selectedSet.has(s.id)) {
        const updated = { ...s, albumDisco: albumName };
        if (albumExtraInfo?.portadaUrl && isFirst) {
          updated.portadaUrl = albumExtraInfo.portadaUrl;
          isFirst = false;
        }
        return updated;
      } else if (isCurrentlyInAlbum) {
        return { ...s, albumDisco: "" };
      }
      return s;
    });

    setSongs(updatedSongs);
    saveSongsToLocalStorageSafely(updatedSongs);

    updatedSongs.forEach((s) => {
      fetch(`/api/songs/${s.id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(s),
      }).catch((err) =>
        console.error("Error updating song album on server:", err),
      );
    });
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
        fetch(`/api/setlists/${setlistData.id}`, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(payload),
        }).catch((err) => console.error("Error updating setlist:", err));
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

      fetch("/api/setlists", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(newSetlist),
      }).catch((err) =>
        console.error("Error creating setlist on server:", err),
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

    fetch("/api/setlists", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(newSetlist),
    }).catch((err) => console.error("Error creating setlist on server:", err));
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

    fetch("/api/setlists", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(duplicated),
    }).catch((err) =>
      console.error("Error duplicating setlist on server:", err),
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

        fetch(`/api/setlists/${stId}`, {
          method: "DELETE",
          headers: getHeaders(),
        }).catch((err) =>
          console.error("Error deleting setlist on server:", err),
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

  // Print Stage Setlist
  const handlePrintStageSetlist = () => {
    if (!activeSetlist) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const pdfStylesheet = generatePdfStylesheet();
    const okColorForPrint = getTokenValueForPrint("--ok");
    const accColorForPrint = getTokenValueForPrint("--acc");
    const sunkenColorForPrint = getTokenValueForPrint("--sunken");
    const bandDisplayName = currentUser?.bandName || "BANDMANAGER";

    printWindow.document.write(`
 <!DOCTYPE html>
 <html>
 <head>
 <title>SETLIST ${bandDisplayName.toUpperCase()} - ${activeSetlist.nombre}</title>
 <style>
 ${pdfStylesheet}
 </style>
 </head>
 <body>
 <div class="header">
 <div>
 <h1>${bandDisplayName.toUpperCase()} — HOJA DE ESCENARIO</h1>
 <div class="meta">${activeSetlist.nombre} (${activeSetlistMetrics.formattedTime} • ${activeSetlistMetrics.songCount} Temas)</div>
 </div>
 <div style="font-size:20px; font-weight:bold; color:${okColorForPrint}; font-family:monospace;">
 AVG BPM: ${activeSetlistMetrics.avgBpm}
 </div>
 </div>

 <table class="set-table">
 <thead>
 <tr>
 <th style="width:40px;">#</th>
 <th>TÍTULO DEL TEMA y CUES</th>
 <th style="width:90px;">TONO</th>
 <th style="width:80px;">BPM</th>
 <th style="width:80px;">TIEMPO</th>
 </tr>
 </thead>
 <tbody>
 ${activeSetlist.items
   .map((it, idx) => {
     if (it.tipoItem === "cancion" && it.songId) {
       const s = songs.find((x) => x.id === it.songId);
       if (!s) return "";
       const memberNotes = Array.isArray(s.notasPorMiembro)
         ? s.notasPorMiembro
         : [];
       return `
 <tr>
 <td class="num">${idx + 1}</td>
 <td>
 <div style="font-size: 20px; color: #fff;">${s.titulo}</div>
 ${it.notaTema ? `<span class="note">💡 <b>CUE:</b> ${it.notaTema}</span>` : ""}
 ${
   memberNotes.length > 0
     ? `
 <div style="margin-top: 4px;">
 ${memberNotes
   .map(
     (m) => `
 <span class="member-note">
 <b style="color: #f2ca50;">[${m.instrument || m.memberName}]:</b> ${m.nota}
 </span>
 `,
   )
   .join("")}
 </div>
 `
     : ""
 }
 ${s.notasRepertorio ? `<span class="note" style="color: #93c5fd;">📝 ${s.notasRepertorio}</span>` : ""}
 </td>
 <td><span class="key-badge">${it.tonalidadDeseada || s.tonalidad}</span></td>
 <td class="bpm">${s.bpm}</td>
 <td style="font-family:monospace; font-size:16px; color:#aaa;">${s.duracion}</td>
 </tr>
 `;
     } else if (it.tipoItem === "bloque" && it.bloqueSubtipo === "header") {
       return `
 <tr style="background:${sunkenColorForPrint}; border-top: 3px solid ${accColorForPrint}; border-bottom: 2px solid ${accColorForPrint};">
 <td colspan="5" style="color:${accColorForPrint}; font-size:18px; font-weight:900; letter-spacing:1px; padding: 12px 10px;">
 ${it.tituloCustom || "⚡ Bloque del show"}
 </td>
 </tr>
 `;
     } else {
       const typeInfo = SHOW_ITEM_TYPES[it.tipoItem] || {
         label: "Evento",
         icon: "📌",
       };
       const durText = formatItemDuration(it);
       return `
 <tr style="background:#0f172a; border-left: 4px solid #38bdf8;">
 <td class="num" style="color:#38bdf8;">•</td>
 <td colspan="3" style="color:#e0f2fe; font-size:16px; font-weight:bold;">
 <span style="background:rgba(56,189,248,0.2); color:#38bdf8; padding:2px 8px; border-radius:4px; font-size:12px; font-family:monospace; margin-right:8px;">
 ${typeInfo.icon} ${typeInfo.label.toUpperCase()}
 </span>
 ${it.tituloCustom || "Evento del Show"}
 ${it.notaTema ? `<span class="note" style="color:#94a3b8; font-size:12px;">📋 CUE: ${it.notaTema}</span>` : ""}
 </td>
 <td style="font-family:monospace; font-size:16px; color:var(--acc); text-align:right;">${durText}</td>
 </tr>
 `;
     }
   })
   .join("")}
 </tbody>
 </table>

 <div class="footer">
 Hoja de Escenario Impresa • ${bandDisplayName} • Repertoire Manager
 </div>

 <script>
 window.onload = function() { window.print(); }
 </script>
 </body>
 </html>
 `);
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
            className={`w-full p-4 sm:p-6 rounded-[var(--r-l)] sm:rounded-[var(--r-l)] space-y-4 bg-[var(--surface)]`}
          >
            <input
              className={`w-full flex-1 min-w-0 text-base sm:text-lg font-bold tracking-tight rounded-[var(--r-s)] px-2 py-1 bg-transparent hover:bg-[var(--surface)]/80 focus:bg-[var(--surface)]/80 focus:outline-none focus:ring-1 focus:ring-[var(--acc)]/50 text-[var(--ink)]`}
              placeholder="Nombre del repertorio"
              value={activeSetlist?.nombre || ""}
              onChange={(e) => {
                if (!activeSetlist) return;
                const updatedSetlist = {
                  ...activeSetlist,
                  nombre: e.target.value,
                };
                setSetlists((prev) =>
                  prev.map((st) =>
                    st.id === activeSetlist.id ? updatedSetlist : st,
                  ),
                );
              }}
            />

            <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
              {/* MODO ESCENARIO / ATRIL: la acción principal para directo */}
              <Button
                id="btn-stage-mode-header"
                variant="primary"
                size="sm"
                onClick={() => {
                  if (activeSetlist) {
                    cacheActiveStageSetlist(activeSetlist, songs, bandId);
                    setPerformanceInitialMode("directo");
                    setPerformanceSetlistId(activeSetlist.id);
                  }
                }}
                title="Modo Escenario / Atril: teleprompter con partituras, acordes y letras en directo"
              >
                <Mic className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Modo escenario</span>
                <span className="sm:hidden">Atril</span>
              </Button>

              {/* MODO ENSAYO: atril de ensayo con pistas Iris */}
              <Button
                id="btn-rehearsal-mode-header"
                variant="soft"
                size="sm"
                onClick={() => {
                  if (activeSetlist) {
                    cacheActiveStageSetlist(activeSetlist, songs, bandId);
                    setPerformanceInitialMode("ensayo");
                    setPerformanceSetlistId(activeSetlist.id);
                  }
                }}
                title="Modo Ensayo: atril optimizado para ensayo con pistas Iris, silenciamiento de instrumentos y metrónomo"
              >
                <Headphones className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Modo ensayo</span>
                <span className="sm:hidden">Ensayo</span>
              </Button>

              {/* ASISTENTE IA: análisis (Cerebro) y setlist perfecto (Optimizar) en un solo sitio */}
              <div className="relative shrink-0">
                <Button
                  id="btn-ai-analysis-header"
                  variant="neutral"
                  size="sm"
                  onClick={() => setShowAssistantChooser((v) => !v)}
                  aria-expanded={showAssistantChooser}
                  title="Asistente IA del repertorio: análisis de narrativa y energía, y setlist perfecto"
                >
                  <Sparkles className="size-4 text-[var(--acc)]" aria-hidden="true" />
                  <span className="hidden sm:inline">Asistente IA</span>
                  <span className="sm:hidden">IA</span>
                  {aiAnalysisResult?.overallScore && (
                    <Chip tone="acc" className="tabular-nums">{aiAnalysisResult.overallScore}</Chip>
                  )}
                </Button>
                {showAssistantChooser && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowAssistantChooser(false)} />
                    <div className="absolute right-0 top-full mt-1.5 z-40 w-72 max-w-[calc(100vw-2rem)] rounded-[var(--r-l)] border border-[var(--line)] bg-[var(--surface)] p-1.5 space-y-0.5 text-xs text-[var(--ink)]">
                      <button
                        id="btn-ai-perfect-header"
                        type="button"
                        onClick={() => {
                          setShowAssistantChooser(false);
                          setShowAIAnalysisModal(true);
                        }}
                        className="w-full text-left p-2.5 rounded-[var(--r-m)] transition-ui cursor-pointer hover:bg-[var(--sunken)] active:scale-[0.97]"
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                          <Brain className="size-4 text-[var(--acc)]" aria-hidden="true" /> Ver análisis
                        </span>
                        <span className="block mt-0.5 pl-6 text-xs text-[var(--ink-2)]">Arco narrativo, puntuación y sugerencias explicadas.</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAssistantChooser(false);
                          setPerfectSetlistPlan(null);
                          setPerfectSetlistError(null);
                          setShowPerfectSetlistModal(true);
                        }}
                        className="w-full text-left p-2.5 rounded-[var(--r-m)] transition-ui cursor-pointer hover:bg-[var(--sunken)] active:scale-[0.97]"
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                          <Sparkles className="size-4 text-[var(--acc)]" aria-hidden="true" /> Generar plan de cambios
                        </span>
                        <span className="block mt-0.5 pl-6 text-xs text-[var(--ink-2)]">Reordena y optimiza canciones sobre una copia.</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* IMPRIMIR: icono, el detalle vive en el menú ⋯ */}
              <Button
                id="btn-print-setlist-header"
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowPdfPreview(true)}
                title="Imprimir repertorio o exportar a PDF / atril en papel"
                aria-label="Imprimir repertorio"
              >
                <Printer className="size-4" aria-hidden="true" />
              </Button>

              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSetlistActionsMenu((v) => !v)}
                  className={`p-1.5 rounded-[var(--r-pill)] transition-colors cursor-pointer ${"text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--sunken)] hover:"}`}
                  title="Acciones del repertorio: compartir, asignar a bolo, duplicar, editar detalles, eliminar"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {showSetlistActionsMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowSetlistActionsMenu(false)}
                    />
                    <div
                      className={`absolute right-0 top-full mt-1.5 z-40 w-56 rounded-[var(--r-l)] p-1.5 space-y-1 text-xs ${"bg-[var(--sunken)] text-[var(--ink)]"}`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setShowSetlistActionsMenu(false);
                          handleShareSetlist(activeSetlist);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-[var(--r-m)] text-[var(--ok)] transition cursor-pointer flex items-center gap-2 ${"hover:bg-[var(--surface)]"}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 shrink-0" />{" "}
                        Compartir repertorio
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSetlistActionsMenu(false);
                          setAssigningSetlist(activeSetlist);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-[var(--r-m)] text-[var(--ok)] transition cursor-pointer flex items-center gap-2 ${"hover:bg-[var(--surface)]"}`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />{" "}
                        Asignar a bolo/ensayo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSetlistActionsMenu(false);
                          setShowPdfPreview(true);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-[var(--r-m)] transition cursor-pointer flex items-center gap-2 ${"text-[var(--ink)] hover:bg-[var(--sunken)]"}`}
                      >
                        <Printer className="w-3.5 h-3.5 shrink-0" /> Imprimir /
                        PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSetlistActionsMenu(false);
                          handleDuplicateSetlist(activeSetlist);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-[var(--r-m)] transition cursor-pointer flex items-center gap-2 ${"text-[var(--ink-2)] hover:bg-[var(--sunken)]"}`}
                      >
                        <Copy className="w-3.5 h-3.5 shrink-0" /> Duplicar
                        setlist
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSetlistActionsMenu(false);
                          setSetlistModalData({
                            isOpen: true,
                            setlistToEdit: activeSetlist,
                          });
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-[var(--r-m)] transition cursor-pointer flex items-center gap-2 ${"text-[var(--ink-2)] hover:bg-[var(--sunken)]"}`}
                      >
                        <Edit3 className="w-3.5 h-3.5 shrink-0" /> Editar
                        detalles
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSetlistActionsMenu(false);
                          handleDeleteSetlist(activeSetlist.id);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-[var(--r-m)] text-[var(--alert)] transition cursor-pointer flex items-center gap-2 ${"hover:bg-[var(--alert-soft)]"}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" /> Eliminar
                        setlist
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* SETLIST VIEW MODES & SUMMARY BAR */}
          {(() => {
            return (
              <div className="flex flex-col gap-2.5">
                <div
                  className={`flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 p-1.5 rounded-[var(--r-m)] ${"bg-[var(--sunken)]"}`}
                >
                  {/* Resumen en una línea y botón asistente IA */}
                  <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto px-1.5">
                    <button
                      type="button"
                      onClick={() => setShowSetlistStats((v) => !v)}
                      className="flex items-center gap-1.5 text-xs hover:opacity-80 transition cursor-pointer text-[var(--ink-2)]"
                      title={
                        showSetlistStats
                          ? "Ocultar métricas secundarias"
                          : "Ver interludios, bloques y perfil de dinámica"
                      }
                    >
                      <span className="flex items-center gap-1.5 font-semibold text-[var(--ink)] tabular-nums">
                        <Timer className="size-4 text-[var(--ink-2)]" aria-hidden="true" />
                        {activeSetlistMetrics.formattedTime}
                      </span>
                      <span className="text-[var(--ink-2)]" aria-hidden="true">·</span>
                      <span className="flex items-center gap-1.5 font-semibold text-[var(--acc-ink)] tabular-nums">
                        <Gauge className="size-4" aria-hidden="true" />
                        {activeSetlistMetrics.avgBpm} BPM
                      </span>
                      <ChevronDown className={`size-4 text-[var(--ink-2)] transition-transform ${showSetlistStats ? "rotate-180" : ""}`} aria-hidden="true" />
                    </button>

                  </div>
                </div>

                {/* Métricas secundarias, solo si se piden */}
                {showSetlistStats && (
                  <div className="flex flex-wrap items-center gap-1.5 px-1 text-xs">
                    <Chip><MessageCircle className="size-3.5" aria-hidden="true" />{activeSetlistMetrics.eventCount} interludios</Chip>
                    <Chip><Layers className="size-3.5" aria-hidden="true" />{activeSetlistMetrics.blockCount} bloques</Chip>
                    <Chip tone="acc">{energyAnalysis.profileLabel}</Chip>
                  </div>
                )}

                {/* MAPA Y CURVA DE ENERGÍA DEL SHOW */}
                {energyAnalysis.points.length > 0 && (
                  <div
                    className={`p-3 sm:p-4 rounded-[var(--r-l)] space-y-2.5 animate-fadeIn ${"bg-[var(--surface)]"}`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-[var(--ink-2)]">
                      <span
                        className="font-semibold text-[var(--ink-2)] truncate text-xs"
                        title="Arrastra un punto en horizontal para reordenar el setlist, o en vertical para cambiar su energía. También puedes seleccionarlo y usar las flechas."
                      >
                        <TrendingUp className="mr-1.5 inline size-4 align-[-3px]" aria-hidden="true" />
                        Mapa de energía
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        {canUndoReorder && (
                          <Button
                            variant="soft"
                            size="sm"
                            onClick={undoLastReorder}
                            title="Deshacer el último reordenamiento del setlist"
                          >
                            <Undo2 className="size-4" aria-hidden="true" />
                            Deshacer
                          </Button>
                        )}
                        {showEnergyMap && (
                          <Button
                            variant="neutral"
                            size="sm"
                            onClick={optimizeSetlistTransitions}
                            title="Reordena las canciones (nunca las chapas/bloques) para suavizar los saltos de tonalidad, tempo y energía entre temas consecutivos — sin tocar tu canción de apertura"
                          >
                            <Wand2 className="size-4" aria-hidden="true" />
                            Optimizar orden
                          </Button>
                        )}
                        {showEnergyMap && (
                          <Button
                            variant="neutral"
                            size="sm"
                            onClick={suggestChapaSpot}
                            title="Busca la transición entre canciones que más chirría (tonalidad, tempo, energía) — ahí es donde una chapa/interludio hablado se nota menos"
                          >
                            <MessageCircle className="size-4" aria-hidden="true" />
                            ¿Dónde chapa?
                          </Button>
                        )}
                        {showEnergyMap && (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setShowChartSettingsMenu((v) => !v)
                              }
                              className="p-1 rounded-[var(--r-pill)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink)] hover:text-[var(--ink)] transition-ui cursor-pointer"
                              title="Ajustes del gráfico (leyenda de colores, curva ideal)"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </button>
                            {showChartSettingsMenu && (
                              <>
                                <div
                                  className="fixed inset-0 z-30"
                                  onClick={() =>
                                    setShowChartSettingsMenu(false)
                                  }
                                />
                                <div className="absolute right-0 top-full mt-1.5 z-40 w-56 rounded-[var(--r-m)] bg-[var(--sunken)] p-2.5 space-y-2.5">
                                  <button
                                    type="button"
                                    onClick={() => setShowIdealCurve((v) => !v)}
                                    className={`w-full px-2 py-1 rounded-[var(--r-s)] transition-ui cursor-pointer text-micro font-sans font-medium flex items-center justify-between ${
                                      showIdealCurve
                                        ? "bg-[var(--surface)]/70 text-[var(--ink-2)]"
                                        : "bg-[var(--surface)]/80 text-[var(--ink-2)]"
                                    }`}
                                    title="Curva ideal de referencia: un arco de pacing clásico escalado al rango real de energías de tu repertorio"
                                  >
                                    <span><ShowIcon inline emoji="〰️" />Curva ideal</span>
                                    <span>{showIdealCurve ? "ON" : "OFF"}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setShowBpmLine((v) => !v)}
                                    className={`w-full px-2 py-1 rounded-[var(--r-s)] transition-ui cursor-pointer text-micro font-sans font-medium flex items-center justify-between ${
                                      showBpmLine
                                        ? "bg-[var(--surface)]/70 text-[var(--ink-2)]"
                                        : "bg-[var(--surface)]/80 text-[var(--ink-2)]"
                                    }`}
                                    title="Línea de BPM en un eje secundario — apagada por defecto para no saturar el gráfico en pantallas estrechas"
                                  >
                                    <span><ShowIcon inline emoji="🥁" />Línea de BPM</span>
                                    <span>{showBpmLine ? "ON" : "OFF"}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setShowTonalidad((v) => !v)}
                                    className={`w-full px-2 py-1 rounded-[var(--r-s)] transition-ui cursor-pointer text-micro font-sans font-medium flex items-center justify-between ${
                                      showTonalidad
                                        ? "bg-[var(--surface)]/70 text-[var(--ink-2)]"
                                        : "bg-[var(--surface)]/80 text-[var(--ink-2)]"
                                    }`}
                                    title="Tonalidad de cada canción junto a su punto — con muchos temas seguidos, usa el zoom (🔍) para separarlos y leerlos bien"
                                  >
                                    <span><ShowIcon inline emoji="🎼" />Tonalidad</span>
                                    <span>{showTonalidad ? "ON" : "OFF"}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setChartZoom((v) => !v)}
                                    className={`w-full px-2 py-1 rounded-[var(--r-s)] transition-ui cursor-pointer text-micro font-sans font-medium flex items-center justify-between ${
                                      chartZoom
                                        ? "bg-[var(--surface)]/70 text-[var(--ink-2)]"
                                        : "bg-[var(--surface)]/80 text-[var(--ink-2)]"
                                    }`}
                                    title="Ensancha el gráfico y añade scroll horizontal — más espacio entre puntos para leer tonalidad/BPM por tramos"
                                  >
                                    <span><ShowIcon inline emoji="🔍" />Zoom (más espacio)</span>
                                    <span>{chartZoom ? "ON" : "OFF"}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowTransitionBadges((v) => !v)
                                    }
                                    className={`w-full px-2 py-1 rounded-[var(--r-s)] transition-ui cursor-pointer text-micro font-sans font-medium flex items-center justify-between ${
                                      showTransitionBadges
                                        ? "bg-[var(--surface)]/70 text-[var(--ink-2)]"
                                        : "bg-[var(--surface)]/80 text-[var(--ink-2)]"
                                    }`}
                                    title="Muestra u oculta los ticks (✓) y aspas (✕) de calidad de unión entre temas en el gráfico"
                                  >
                                    <span>✓ / ✕ Calidad de uniones</span>
                                    <span>
                                      {showTransitionBadges ? "ON" : "OFF"}
                                    </span>
                                  </button>
                                  <div className="flex flex-col gap-1 text-micro text-[var(--ink)] pt-1">
                                    <span className="flex items-center gap-1.5">
                                      <i
                                        className="w-2 h-2 rounded-[var(--r-pill)] inline-block"
                                        style={{ background: "#0284c7" }}
                                      />
                                      <ShowIcon inline emoji="🌙" />Balada
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                      <i
                                        className="w-2 h-2 rounded-[var(--r-pill)] inline-block"
                                        style={{ background: "#059669" }}
                                      />
                                      <ShowIcon inline emoji="🎵" />Media
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                      <i
                                        className="w-2 h-2 rounded-[var(--r-pill)] inline-block"
                                        style={{ background: "#a16207" }}
                                      />
                                      <ShowIcon inline emoji="🔥" />Alta
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                      <i
                                        className="w-2 h-2 rounded-[var(--r-pill)] inline-block"
                                        style={{ background: "#a21caf" }}
                                      />
                                      <ShowIcon inline emoji="💣" />Explosiva
                                    </span>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                        {showEnergyMap && (
                          <button
                            type="button"
                            onClick={() => setShowTonalidad((v) => !v)}
                            className={`p-1 rounded-[var(--r-pill)] transition-ui cursor-pointer ${
                              showTonalidad
                                ? "bg-[var(--acc)]/20 text-[var(--acc-ink)]"
                                : "bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)]"
                            }`}
                            title={
                              showTonalidad
                                ? "Ocultar tonalidades del gráfico"
                                : "Mostrar tonalidades en el gráfico"
                            }
                          >
                            <ShowIcon inline emoji="🎼" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowEnergyMap((v) => !v)}
                          className="p-1 rounded-[var(--r-pill)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink)] hover:text-[var(--ink)] transition-ui cursor-pointer"
                          title={
                            showEnergyMap
                              ? "Ocultar el mapa de energía"
                              : "Mostrar el mapa de energía"
                          }
                        >
                          {showEnergyMap ? (
                            <Eye className="w-3.5 h-3.5" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowConcertPlayer((v) => !v)}
                          className="p-1 rounded-[var(--r-pill)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink)] hover:text-[var(--ink)] transition-ui cursor-pointer"
                          title={
                            showConcertPlayer
                              ? "Ocultar reproductor de concierto"
                              : "Mostrar reproductor de concierto"
                          }
                        >
                          {showConcertPlayer ? (
                            <Pause className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {showEnergyMap && (
                      <>
                        {/* Nota breve pero deliberada: no va solo en el tooltip del título porque en
 móvil (tap, sin hover) nunca se vería, y el efecto de tocar un punto es lo
 bastante importante —cambia la energía de la canción en TODOS los
 repertorios— como para dejarlo oculto. Una línea, sin dismiss ni estado
 extra (AGENTS.md §6). */}
                        <p className="flex items-start gap-1.5 text-xs text-[var(--ink-2)]">
                          <Lightbulb className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                          <span>
                            Toca un punto para reordenar o cambiar su energía. La energía es de la
                            canción: se aplica en todos tus repertorios.
                          </span>
                        </p>
                        {optimizeSummary && (
                          <p className="text-micro font-sans text-[var(--ink-2)] bg-[var(--ok-soft)] rounded-[var(--r-s)] px-2 py-1">
                            {optimizeSummary}
                          </p>
                        )}
                        {chapaSuggestion &&
                          (() => {
                            const motivos: string[] = [];
                            if (
                              chapaSuggestion.coste.harmonyRelation === "choque"
                            )
                              motivos.push("choque de tonalidad");
                            if (
                              chapaSuggestion.coste.bpmDiff != null &&
                              chapaSuggestion.coste.bpmDiff >= 15
                            )
                              motivos.push(
                                `salto de ${Math.round(chapaSuggestion.coste.bpmDiff)} BPM`,
                              );
                            if (
                              chapaSuggestion.coste.energyDiff != null &&
                              chapaSuggestion.coste.energyDiff >= 6
                            )
                              motivos.push("salto grande de energía");
                            return (
                              <div className="flex flex-wrap items-center gap-2 text-micro font-sans text-[var(--ink-2)] bg-[var(--ok)]/10 rounded-[var(--r-s)] px-2 py-1">
                                <span>
                                  <ShowIcon inline emoji="💬" />Mejor sitio para una chapa: entre{" "}
                                  <b>"{chapaSuggestion.cancionAntes}"</b> y{" "}
                                  <b>"{chapaSuggestion.cancionDespues}"</b>
                                  {motivos.length > 0
                                    ? ` — ${motivos.join(", ")}.`
                                    : "."}
                                </span>
                                <button
                                  type="button"
                                  onClick={insertSuggestedChapa}
                                  className="px-1.5 py-0.5 rounded-[var(--r-pill)] bg-[var(--ok)] hover:bg-[var(--ok)]/80 text-[var(--on-ok)] transition-ui cursor-pointer font-medium shrink-0"
                                >
                                  <ShowIcon inline emoji="➕" />Insertar aquí
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setChapaSuggestion(null)}
                                  className="text-[var(--ink-2)] hover:text-[var(--ok)]/40 transition-ui cursor-pointer shrink-0"
                                  title="Descartar sugerencia"
                                >
                                  ✕
                                </button>
                              </div>
                            );
                          })()}

                        {/* Advanced Energy Chart */}
                        <div
                          className={
                            chartZoom ? "overflow-x-auto -mx-1 px-1" : undefined
                          }
                        >
                          <EnergyChart
                            setlistKey={activeSetlist.id}
                            chartData={chartData}
                            yDomain={yDomain}
                            zonasEnergia={ZONAS_ENERGIA}
                            highlightedSongIds={highlightedSongIds}
                            selectedSetlistItemId={selectedSetlistItemId}
                            showTransitionBadges={showTransitionBadges}
                            currentPlayingSongId={playerCurrentSong?.id}
                            onSelectItem={(id) => {
                              setSelectedSetlistItemId(id);
                            }}
                            onPreviewTransition={(selIdx) => {
                              if (selIdx > 0)
                                handleOpenTransitionPreview(selIdx - 1, selIdx);
                            }}
                            onReorder={reorderSetlistItems}
                            onEnergyChange={handleEnergyChartDrag}
                            height={256}
                            showIdealCurve={showIdealCurve}
                            showBpmLine={showBpmLine}
                            showTonalidad={showTonalidad}
                            expandedWidthPx={
                              chartZoom
                                ? Math.max(700, chartData.length * 60)
                                : undefined
                            }
                            belowChartSlot={
                              selectedSetlistItemId &&
                              (() => {
                                const selectedIndex = chartData.findIndex(
                                  (d) => d.id === selectedSetlistItemId,
                                );
                                if (selectedIndex === -1) return null;
                                const point = chartData[selectedIndex];
                                const canEditEnergy =
                                  point.songId != null &&
                                  typeof point.score === "number";
                                const info = canEditEnergy
                                  ? getEnergyInfo(point.score as number)
                                  : null;
                                const bumpEnergy = (delta: number) => {
                                  if (
                                    !canEditEnergy ||
                                    typeof point.score !== "number"
                                  )
                                    return;
                                  const next = Math.max(
                                    1,
                                    Math.min(20, point.score + delta),
                                  );
                                  if (next !== point.score)
                                    handleEnergyChartDrag(point, next);
                                };
                                const dirBtnClass =
                                  "w-8 h-8 rounded-[var(--r-pill)] flex items-center justify-center transition disabled:opacity-25 disabled:cursor-not-allowed shrink-0";
                                const reorderBtnClass = `${dirBtnClass} bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--acc-ink)] `;
                                // Antes era un rgba(23,23,23,0.8) fijo — negro casi puro sin importar el tema, por eso
                                // en Claro los botones de subir/bajar energía salían tan oscuros. var(--sunken) es la
                                // misma superficie hundida que usa el resto de la UI, y sí cambia con el tema.
                                const energyBtnStyle = info
                                  ? {
                                      color: info.hexColor,
                                      borderColor: `${info.hexColor}55`,
                                      background: "var(--sunken)",
                                    }
                                  : undefined;
                                const prevName =
                                  selectedIndex > 0
                                    ? chartData[selectedIndex - 1]?.name
                                    : null;
                                const nextName =
                                  selectedIndex < chartData.length - 1
                                    ? chartData[selectedIndex + 1]?.name
                                    : null;
                                const hasPrevSong =
                                  selectedIndex > 0 &&
                                  chartData[selectedIndex - 1]?.songId &&
                                  point.songId;
                                const hasNextSong =
                                  selectedIndex < chartData.length - 1 &&
                                  chartData[selectedIndex + 1]?.songId &&
                                  point.songId;

                                return (
                                  <div className="w-full flex flex-col items-center gap-1.5 pt-1.5 pb-0.5">
                                    {canEditEnergy && (
                                      <button
                                        type="button"
                                        disabled={(point.score as number) >= 20}
                                        onClick={() => bumpEnergy(1)}
                                        className={`${dirBtnClass} hover:brightness-125`}
                                        style={energyBtnStyle}
                                        title="Subir energía"
                                      >
                                        <ChevronUp className="w-4 h-4" />
                                      </button>
                                    )}
                                    <div className="w-full flex items-center justify-center gap-2">
                                      {/* Nombre del tema anterior/siguiente junto a la flecha que lleva hasta él —
 así se sabe con qué canción se va a intercambiar posición antes de
 pulsar, sin tener que mirar el gráfico para ubicarla. */}
                                      <span className="w-20 sm:w-28 line-clamp-3 text-micro text-[var(--ink-2)] font-sans text-right leading-tight">
                                        {prevName || ""}
                                      </span>
                                      <button
                                        type="button"
                                        disabled={selectedIndex <= 0}
                                        onClick={() =>
                                          reorderSetlistItems(
                                            selectedIndex,
                                            selectedIndex - 1,
                                            "stepper",
                                          )
                                        }
                                        className={reorderBtnClass}
                                        title={
                                          prevName
                                            ? `Mover antes de "${prevName}"`
                                            : "Mover una posición hacia atrás"
                                        }
                                      >
                                        <ChevronLeft className="w-4 h-4" />
                                      </button>
                                      {/* Hub central: solo el score de energía (sin el nombre del tema, ya se ve
 resaltado en el propio gráfico), con un aro y un del color de su
 categoría para que el joystick tenga vida propia en vez de ser cuatro
 flechas sueltas. */}
                                      <div
                                        className="w-9 h-9 rounded-[var(--r-pill)] flex items-center justify-center text-xs font-bold shrink-0"
                                        style={
                                          info
                                            ? {
                                                background: `radial-gradient(circle at 35% 30%, ${info.hexColor}40, var(--sunken) 75%)`,
                                                boxShadow: `0 0 9px ${info.hexColor}80, inset 0 0 4px ${info.hexColor}30`,
                                                color: info.hexColor,
                                              }
                                            : {
                                                background: "var(--sunken)",
                                                color: "var(--ink-3)",
                                              }
                                        }
                                        title={
                                          info
                                            ? `${info.label} · ${Math.round((point.score as number) / 2)}/10`
                                            : point.name
                                        }
                                      >
                                        {info
                                          ? Math.round(
                                              (point.score as number) / 2,
                                            )
                                          : "•"}
                                      </div>
                                      <button
                                        type="button"
                                        disabled={
                                          selectedIndex >= chartData.length - 1
                                        }
                                        onClick={() =>
                                          reorderSetlistItems(
                                            selectedIndex,
                                            selectedIndex + 1,
                                            "stepper",
                                          )
                                        }
                                        className={reorderBtnClass}
                                        title={
                                          nextName
                                            ? `Mover después de "${nextName}"`
                                            : "Mover una posición hacia adelante"
                                        }
                                      >
                                        <ChevronRight className="w-4 h-4" />
                                      </button>
                                      <span className="w-20 sm:w-28 line-clamp-3 text-micro text-[var(--ink-2)] font-sans text-left leading-tight">
                                        {nextName || ""}
                                      </span>
                                    </div>
                                    {canEditEnergy && (
                                      <button
                                        type="button"
                                        disabled={(point.score as number) <= 1}
                                        onClick={() => bumpEnergy(-1)}
                                        className={`${dirBtnClass} hover:brightness-125`}
                                        style={energyBtnStyle}
                                        title="Bajar energía"
                                      >
                                        <ChevronDown className="w-4 h-4" />
                                      </button>
                                    )}

                                    {/* Botones de acción para probar transiciones de audio con tema anterior o siguiente */}
                                    {(hasPrevSong || hasNextSong) &&
                                      (() => {
                                        const evalPrev =
                                          point.transitionFromPrev;
                                        const evalNext = point.transitionToNext;
                                        return (
                                          <div className="flex flex-wrap items-center justify-center gap-2 mt-1.5">
                                            {hasPrevSong && (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleOpenTransitionPreview(
                                                    selectedIndex - 1,
                                                    selectedIndex,
                                                  )
                                                }
                                                className={`px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-bold flex items-center gap-2 transition-ui cursor-pointer active:scale-[0.97] ${
                                                  evalPrev?.status === "ok"
                                                    ? "bg-[var(--ok)]/15 hover:bg-[var(--ok)]/25 text-[var(--ink)] hover:text-[var(--ink)]/35"
                                                    : "bg-[var(--alert)]/15 hover:bg-[var(--alert)]/25 text-[var(--ink)] hover:text-[var(--ink)]/35"
                                                }`}
                                                title={
                                                  evalPrev
                                                    ? `${evalPrev.title}: ${evalPrev.motivos.join(", ")}`
                                                    : `Comprobar cómo suena la unión de "${prevName}" con "${point.name}"`
                                                }
                                              >
                                                <span
                                                  className={`w-4 h-4 rounded-[var(--r-pill)] flex items-center justify-center text-micro font-bold shrink-0 ${
                                                    evalPrev?.status === "ok"
                                                      ? "bg-[var(--ok)]/30 text-[var(--ink)]"
                                                      : "bg-[var(--alert)]/30 text-[var(--ink)]"
                                                  }`}
                                                >
                                                  {evalPrev
                                                    ? evalPrev.icon
                                                    : "⚡"}
                                                </span>
                                                <div className="flex flex-col text-left leading-none">
                                                  <div className="flex items-center gap-1">
                                                    <span>
                                                      Unión con #{selectedIndex}{" "}
                                                      ({prevName})
                                                    </span>
                                                    {evalPrev && (
                                                      <span className="text-micro font-sans opacity-80">
                                                        ({evalPrev.scorePercent}
                                                        %)
                                                      </span>
                                                    )}
                                                  </div>
                                                  {evalPrev &&
                                                    evalPrev.motivos.length >
                                                      0 && (
                                                      <span className="text-micro font-normal opacity-75 mt-0.5 max-w-[200px] truncate">
                                                        {evalPrev.motivos[0]}
                                                      </span>
                                                    )}
                                                </div>
                                              </button>
                                            )}
                                            {hasNextSong && (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleOpenTransitionPreview(
                                                    selectedIndex,
                                                    selectedIndex + 1,
                                                  )
                                                }
                                                className={`px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-bold flex items-center gap-2 transition-ui cursor-pointer active:scale-[0.97] ${
                                                  evalNext?.status === "ok"
                                                    ? "bg-[var(--ok)]/15 hover:bg-[var(--ok)]/25 text-[var(--ink)] hover:text-[var(--ink)]/35"
                                                    : "bg-[var(--alert)]/15 hover:bg-[var(--alert)]/25 text-[var(--ink)] hover:text-[var(--ink)]/35"
                                                }`}
                                                title={
                                                  evalNext
                                                    ? `${evalNext.title}: ${evalNext.motivos.join(", ")}`
                                                    : `Comprobar cómo suena la unión de "${point.name}" con "${nextName}"`
                                                }
                                              >
                                                <span
                                                  className={`w-4 h-4 rounded-[var(--r-pill)] flex items-center justify-center text-micro font-bold shrink-0 ${
                                                    evalNext?.status === "ok"
                                                      ? "bg-[var(--ok)]/30 text-[var(--ink)]"
                                                      : "bg-[var(--alert)]/30 text-[var(--ink)]"
                                                  }`}
                                                >
                                                  {evalNext
                                                    ? evalNext.icon
                                                    : "⚡"}
                                                </span>
                                                <div className="flex flex-col text-left leading-none">
                                                  <div className="flex items-center gap-1">
                                                    <span>
                                                      Unión con #
                                                      {selectedIndex + 2} (
                                                      {nextName})
                                                    </span>
                                                    {evalNext && (
                                                      <span className="text-micro font-sans opacity-80">
                                                        ({evalNext.scorePercent}
                                                        %)
                                                      </span>
                                                    )}
                                                  </div>
                                                  {evalNext &&
                                                    evalNext.motivos.length >
                                                      0 && (
                                                      <span className="text-micro font-normal opacity-75 mt-0.5 max-w-[200px] truncate">
                                                        {evalNext.motivos[0]}
                                                      </span>
                                                    )}
                                                </div>
                                              </button>
                                            )}
                                          </div>
                                        );
                                      })()}
                                  </div>
                                );
                              })()
                            }
                          />
                        </div>

                        {/* Avisos y sugerencias — plegados por defecto, con un solo toggle que resume
 cuántos hay entre los heurísticos y los del último Análisis IA, en vez de dos
 filas de badges siempre desplegadas ocupando pantalla. */}
                        {(energyAnalysis.warnings.length > 0 ||
                          (aiAnalysisResult?.suggestions?.length ?? 0) > 0) && (
                          <button
                            type="button"
                            onClick={() => setShowHeuristicWarnings((v) => !v)}
                            className="w-full flex items-center justify-between px-2 py-1 rounded-[var(--r-s)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/80 text-[var(--ink)] text-micro font-sans transition-ui cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              <AlertTriangle className="size-3.5 text-[var(--ink-2)]" aria-hidden="true" />
                              Avisos y sugerencias (
                              {energyAnalysis.warnings.length +
                                (aiAnalysisResult?.suggestions?.length ?? 0)}
                              )
                            </span>
                            <ChevronDown className={`size-4 transition-transform ${showHeuristicWarnings ? "rotate-180" : ""}`} aria-hidden="true" />
                          </button>
                        )}

                        {/* Warnings & Suggestions (Heuristic) */}
                        {showHeuristicWarnings &&
                          energyAnalysis.warnings.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              {energyAnalysis.warnings.map((w, i) => {
                                const hasSongs =
                                  !!w.songTitles && w.songTitles.length > 0;
                                const isHighlighted =
                                  hasSongs &&
                                  highlightedSongIds.length > 0 &&
                                  w.songTitles!.some((t) =>
                                    titlesMatch(t, highlightedSongIds),
                                  );
                                return (
                                  <span
                                    key={i}
                                    className={`px-2 py-0.5 rounded text-micro font-sans font-medium flex items-center gap-1 transition ${
                                      w.type === "warning"
                                        ? "bg-[var(--acc)]/10 text-[var(--acc-ink)] "
                                        : w.type === "success"
                                          ? "bg-[var(--ok)]/10 text-[var(--ink-2)]"
                                          : "bg-[var(--acc)]/10 text-[var(--ink-2)]"
                                    } ${isHighlighted ? "ring-2 ring-[var(--ink)]/60" : ""}`}
                                    style={{
                                      cursor: hasSongs ? "pointer" : "default",
                                    }}
                                    onMouseEnter={() => {
                                      if (hasSongs)
                                        setHighlightedSongIds(w.songTitles!);
                                    }}
                                    onMouseLeave={() =>
                                      setHighlightedSongIds([])
                                    }
                                    onClick={() => {
                                      if (hasSongs)
                                        setHighlightedSongIds(
                                          isHighlighted ? [] : w.songTitles!,
                                        );
                                    }}
                                    title={
                                      hasSongs
                                        ? `Resalta: ${w.songTitles!.join(", ")}`
                                        : undefined
                                    }
                                  >
                                    <span><ShowIcon inline emoji={w.icon} /></span>
                                    <span>{w.message}</span>
                                    {w.suggestedReorder && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          reorderSetlistItems(
                                            w.suggestedReorder!.fromIndex,
                                            w.suggestedReorder!.toIndex,
                                            `warning-${i}`,
                                          );
                                        }}
                                        className="ml-1 px-1.5 py-0.5 rounded bg-[var(--ink)]/10 hover:bg-[var(--ink)]/25 text-[var(--ink)] font-bold transition"
                                        title={w.suggestedReorder.description}
                                      >
                                        ✓ Aplicar
                                      </button>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                        {/* AI Analysis Summary (if available) - as badges like warnings */}
                        {showHeuristicWarnings && aiAnalysisResult && (
                          <div className="space-y-2 pt-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[var(--ok)]/80">
                                <ShowIcon inline emoji="🧠" />Análisis IA: {aiAnalysisResult.overallScore}
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowAIAnalysisModal(true)}
                                className="px-2 py-0.5 rounded text-micro bg-[var(--acc)] hover:bg-[var(--acc)] text-[var(--on-acc)] transition font-medium"
                              >
                                Ver análisis completo
                              </button>
                            </div>
                            {aiAnalysisResult.suggestions?.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5">
                                {aiAnalysisResult.suggestions.map(
                                  (s: any, i: number) => {
                                    const songsToHighlight: string[] =
                                      s.songs_involved &&
                                      s.songs_involved.length > 0
                                        ? s.songs_involved
                                        : []; // Si no hay songs_involved, usar array vacío
                                    const hasSongs =
                                      songsToHighlight.length > 0;
                                    const isHighlighted =
                                      hasSongs &&
                                      highlightedSongIds.length > 0 &&
                                      songsToHighlight.some(
                                        (songTitle: string) =>
                                          titlesMatch(
                                            songTitle,
                                            highlightedSongIds,
                                          ),
                                      );
                                    return (
                                      <span
                                        key={i}
                                        className="px-2 py-0.5 rounded text-micro font-sans font-medium flex items-center gap-1 transition"
                                        style={{
                                          backgroundColor: isHighlighted
                                            ? "rgb(168 85 247 / 0.4)"
                                            : "rgb(126 34 206 / 0.3)",
                                          borderColor: isHighlighted
                                            ? "rgb(168 85 247 / 0.8)"
                                            : "rgb(147 51 234 / 0.4)",
                                          color: "rgb(196 181 253)",
                                          cursor: hasSongs
                                            ? "pointer"
                                            : "default",
                                        }}
                                        onMouseEnter={() => {
                                          if (hasSongs)
                                            setHighlightedSongIds(
                                              songsToHighlight,
                                            );
                                        }}
                                        onMouseLeave={() =>
                                          setHighlightedSongIds([])
                                        }
                                        onClick={() => {
                                          if (hasSongs)
                                            setHighlightedSongIds(
                                              isHighlighted
                                                ? []
                                                : songsToHighlight,
                                            );
                                        }}
                                        title={
                                          hasSongs
                                            ? `Resalta: ${songsToHighlight.join(", ")}`
                                            : s.title
                                        }
                                      >
                                        <span>
                                          {s.priority === "high" && "🔴"}
                                          {s.priority === "medium" && "🟠"}
                                          {s.priority === "low" && "🟡"}
                                        </span>
                                        <span>{s.title}</span>
                                      </span>
                                    );
                                  },
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
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
          <div className="space-y-2 max-h-[calc(88vh-200px)] min-h-[480px] overflow-y-auto pr-1">
            {activeSetlist.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <PublicoSilhouette opacity={0.12} size="medium" />
                <p className="mt-6 font-medium text-[var(--ink)] text-sm">
                  Setlist vacío. Añade el primer tema.
                </p>
                <p className="mt-2 text-[var(--ink-2)] text-xs max-w-xs">
                  Usa la barra superior para añadir temas o eventos.
                </p>
              </div>
            ) : (
              activeSetlist.items.map((it, index) => {
                const isSelected = selectedSetlistItemId === it.id;
                const isDragging = draggedItemIndex === index;
                const isDragOver = dragOverItemIndex === index;

                if (it.tipoItem === "cancion" && it.songId) {
                  const song = songs.find((s) => s.id === it.songId);
                  if (!song) return null;

                  // Check if this song has member notes
                  const memberNotesCount = song.notasMiembros
                    ? Object.values(song.notasMiembros).filter(
                        (v) => typeof v === "string" && v.trim().length > 0,
                      ).length
                    : 0;

                  const isExpanded = expandedSetlistItemIds.has(it.id);
                  const toggleExpand = () => {
                    const newSet = new Set(expandedSetlistItemIds);
                    if (newSet.has(it.id)) {
                      newSet.delete(it.id);
                    } else {
                      newSet.add(it.id);
                    }
                    setExpandedSetlistItemIds(newSet);
                  };

                  // Reproducir esta canción sin tener que expandir la fila
                  const isPlayingThisRow =
                    activePlayerSong?.id === song.id && isPlayerPlaying;
                  const playThisSong = () => {
                    const setlistSongs = activeSetlist.items
                      .filter((i) => i.tipoItem === "cancion" && i.songId)
                      .map((i) => songs.find((s) => s.id === i.songId))
                      .filter((s): s is Song => !!s);
                    // Calculate transposition from tonalidadDeseada if set
                    const diffResult =
                      song.tonalidad && it.tonalidadDeseada
                        ? getSemitoneDifference(
                            song.tonalidad,
                            it.tonalidadDeseada,
                          )
                        : null;
                    const transposeSemitones = diffResult ?? 0;
                    selectPlayerSongWithQueue(
                      song,
                      true,
                      setlistSongs,
                      transposeSemitones,
                    );
                  };

                  const songIndex = activeSetlist.items
                    .slice(0, index)
                    .filter((i) => i.tipoItem === "cancion").length;

                  return (
                    <div
                      key={it.id}
                      draggable={true}
                      onDragStart={(e) => {
                        if (TRANSPARENT_DRAG_IMAGE)
                          e.dataTransfer.setDragImage(
                            TRANSPARENT_DRAG_IMAGE,
                            0,
                            0,
                          );
                        setDraggedItemIndex(index);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverItemIndex(index);
                      }}
                      onDragLeave={() => {
                        if (dragOverItemIndex === index)
                          setDragOverItemIndex(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDropItem(index);
                      }}
                      onDragEnd={() => {
                        setDraggedItemIndex(null);
                        setDragOverItemIndex(null);
                      }}
                      onClick={() => {
                        if (!isSelected && !isExpanded) {
                          setExpandedSetlistItemIds(
                            new Set(expandedSetlistItemIds).add(it.id),
                          );
                        }
                        setSelectedSetlistItemId(isSelected ? null : it.id);
                      }}
                      className={`group rounded-[var(--r-m)] transition-ui cursor-pointer ${
                        isDragging ? "opacity-40 scale-[0.98]" : ""
                      } ${isDragOver ? "scale-[1.01] bg-[var(--ok)]/10" : ""} ${
                        isSelected
                          ? "ring-2 ring-[var(--acc)]/20 bg-[var(--ok)]/10"
                          : "bg-[var(--surface)] hover:bg-[var(--surface)]/80"
                      }`}
                    >
                      {/* MAIN ROW - COMPACT */}
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 px-3 py-2.5">
                        {/* Drag Handle */}
                        <div
                          className="cursor-grab active:cursor-grabbing text-[var(--ink-2)] hover:text-[var(--ok)] transition-colors shrink-0"
                          title="Arrastrar y soltar para reordenar"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>

                        {/* Index / Play */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playThisSong();
                          }}
                          className="w-6 h-6 rounded-[var(--r-pill)] flex items-center justify-center shrink-0 transition-ui cursor-pointer bg-[var(--acc-soft)] text-[var(--acc-ink)] sm:bg-transparent sm:group-hover:bg-[var(--ok)] sm:group-hover:text-[var(--ink)]"
                          title={
                            isPlayingThisRow
                              ? "Sonando ahora"
                              : "Reproducir esta canción"
                          }
                        >
                          {isPlayingThisRow ? (
                            <div className="flex items-center gap-0.5">
                              <span className="w-0.5 h-2 bg-[var(--ok)] rounded-[var(--r-pill)]" />
                              <span className="w-0.5 h-2.5 bg-[var(--ok)] rounded-[var(--r-pill)] delay-75" />
                              <span className="w-0.5 h-1.5 bg-[var(--ok)] rounded-[var(--r-pill)] delay-150" />
                            </div>
                          ) : (
                            <>
                              <span className="hidden sm:inline sm:group-hover:hidden text-xs font-semibold text-[var(--ink-2)]">
                                {songIndex + 1}
                              </span>
                              <Play className="w-3 h-3 fill-current sm:hidden sm:group-hover:block ml-0.5 text-[var(--ink)]" />
                            </>
                          )}
                        </button>

                        {/* Title + metadata */}
                        <span
                          className="min-w-0 flex-1 basis-32 truncate text-sm font-semibold text-[var(--ink)] sm:max-w-[240px] sm:flex-none"
                          title={formatSongTitle(song.titulo)}
                        >
                          {formatSongTitle(song.titulo)}
                        </span>

                        {(() => {
                          // Tono en el que se quiere tocar ESTE tema en ESTE repertorio (distinto del tono
                          // original de grabación por registro vocal, cantante sustituto, etc.) — se guarda en
                          // el SetlistItem (it.tonalidadDeseada) y el Modo Concierto lo transporta solo.
                          const desiredKey = it.tonalidadDeseada;
                          const isEditingKey = editingKeyItemId === it.id;
                          const KEY_POPOVER_WIDTH_PX = 200;
                          const KEY_POPOVER_HEIGHT_PX = 110;
                          const rawOrigKey = (song.tonalidad || "").trim();
                          const isEsKey = /^(Do|Re|Mi|Fa|Sol|La|Si)/i.test(
                            rawOrigKey,
                          );
                          const baseRoots = isEsKey
                            ? [
                                "Do",
                                "Do#",
                                "Re",
                                "Re#",
                                "Mi",
                                "Fa",
                                "Fa#",
                                "Sol",
                                "Sol#",
                                "La",
                                "La#",
                                "Si",
                              ]
                            : [
                                "C",
                                "C#",
                                "D",
                                "D#",
                                "E",
                                "F",
                                "F#",
                                "G",
                                "G#",
                                "A",
                                "A#",
                                "B",
                              ];
                          const keyMatch = rawOrigKey.match(
                            /^(Do#|Re#|Fa#|Sol#|La#|Do|Re|Mi|Fa|Sol|La|Si|C#|D#|F#|G#|A#|Db|Eb|Gb|Ab|Bb|C|D|E|F|G|A|B)(.*)$/i,
                          );
                          const keySuffix = keyMatch ? keyMatch[2] : "";
                          const keyNotes = baseRoots.map(
                            (root) => `${root}${keySuffix}`,
                          );
                          return (
                            <div className="relative shrink-0">
                              <button
                                type="button"
                                data-key-popover
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isEditingKey) {
                                    setEditingKeyItemId(null);
                                    return;
                                  }
                                  const rect =
                                    e.currentTarget.getBoundingClientRect();
                                  setKeyPopoverPos({
                                    top: Math.min(
                                      rect.bottom + 4,
                                      window.innerHeight -
                                        KEY_POPOVER_HEIGHT_PX -
                                        8,
                                    ),
                                    left: Math.min(
                                      rect.left,
                                      window.innerWidth -
                                        KEY_POPOVER_WIDTH_PX -
                                        8,
                                    ),
                                  });
                                  setEditingKeyItemId(it.id);
                                }}
                                className={`text-micro font-sans px-1.5 py-0.5 rounded font-bold shrink-0 cursor-pointer transition hover:ring-1 hover:ring-[var(--ink)]/40 ${
                                  desiredKey
                                    ? "bg-[var(--acc-soft)] text-[var(--acc-ink)]"
                                    : "bg-[var(--sunken)] text-[var(--ink)]"
                                }`}
                                title={
                                  desiredKey
                                    ? `Original: ${song.tonalidad || "—"} · Tocar en este repertorio: ${desiredKey}. Clic para cambiar.`
                                    : "Tonalidad original. Clic para definir en qué tono tocarla en este repertorio (transposición automática)."
                                }
                              >
                                {desiredKey
                                  ? `${song.tonalidad || "—"} → ${desiredKey}`
                                  : song.tonalidad || "—"}
                              </button>
                              {isEditingKey &&
                                keyPopoverPos &&
                                createPortal(
                                  <div
                                    data-key-popover
                                    className="fixed z-[100] bg-[var(--sunken)] rounded-[var(--r-s)] p-2 space-y-1.5 w-[200px]"
                                    style={{
                                      top: keyPopoverPos.top,
                                      left: keyPopoverPos.left,
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <p className="text-micro font-sans text-[var(--ink-2)] px-0.5">
                                      Tocar en tono (original:{" "}
                                      {song.tonalidad || "—"}):
                                    </p>
                                    <div className="grid grid-cols-4 gap-1">
                                      {keyNotes.map((note) => (
                                        <button
                                          key={note}
                                          type="button"
                                          onClick={() =>
                                            handleSetTonalidadDeseada(
                                              it.id,
                                              note,
                                            )
                                          }
                                          className={`px-1 py-1 rounded text-micro font-sans font-bold transition cursor-pointer ${
                                            desiredKey === note
                                              ? "bg-[var(--acc)] text-[var(--on-acc)]"
                                              : "bg-[var(--surface)]/80 text-[var(--ink)] hover:bg-[var(--surface)]/70"
                                          }`}
                                        >
                                          {note}
                                        </button>
                                      ))}
                                    </div>
                                    {desiredKey && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleSetTonalidadDeseada(it.id, null)
                                        }
                                        className="w-full text-center text-micro font-sans text-[var(--ink-2)] hover:text-[var(--alert)] pt-1.5 cursor-pointer"
                                      >
                                        Volver al original (
                                        {song.tonalidad || "—"})
                                      </button>
                                    )}
                                  </div>,
                                  document.body,
                                )}
                            </div>
                          );
                        })()}

                        {/* Solo se muestra si hay estructura subida: distingue de un vistazo un cifrado ya
 comprobado por alguien de la banda de uno recién subido en el que nadie ha confiado
 todavía — justo lo que hace falta saber antes de fiarse de él en un concierto. */}
                        {song.estructuraDocumentoUrl && (
                          <span
                            className={`text-micro font-sans px-1 py-0.5 rounded shrink-0 ${
                              song.estructuraVerificada
                                ? "bg-[var(--ok)]/15 text-[var(--ink)]"
                                : "bg-[var(--acc)]/15 text-[var(--acc-ink)]"
                            }`}
                            title={
                              song.estructuraVerificada
                                ? "Acordes verificados"
                                : "Acordes sin verificar — revísalos antes de tocarla en directo"
                            }
                          >
                            {song.estructuraVerificada ? <Check className="size-3" aria-label="Acordes verificados" /> : <AlertTriangle className="size-3" aria-label="Acordes sin verificar" />}
                          </span>
                        )}

                        <span className="shrink-0 text-xs tabular-nums text-[var(--ink-2)]" title="BPM">
                          {song.bpm ? `${song.bpm}` : "—"}
                        </span>

                        <span className="shrink-0 text-xs font-medium tabular-nums text-[var(--ink)]" title="Duración">
                          {song.duracion || "0:00"}
                        </span>

                        {(() => {
                          const energy = getEnergyInfo(song);
                          const currentVal1a10 = Math.max(
                            1,
                            Math.min(10, Math.round((song.energia || 10) / 2)),
                          );
                          const isEditingThis = editingEnergyItemId === it.id;
                          // Alto aproximado del popover (10 botones de 20px + padding) para decidir si hay hueco
                          // debajo en el viewport o si hay que abrirlo hacia arriba.
                          const POPOVER_HEIGHT_PX = 36;
                          const POPOVER_WIDTH_PX = 220;
                          return (
                            <div className="relative shrink-0">
                              <button
                                type="button"
                                data-energy-popover
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isEditingThis) {
                                    setEditingEnergyItemId(null);
                                    return;
                                  }
                                  const rect =
                                    e.currentTarget.getBoundingClientRect();
                                  const openUpward =
                                    window.innerHeight - rect.bottom <
                                    POPOVER_HEIGHT_PX + 8;
                                  setEnergyPopoverPos({
                                    top: openUpward
                                      ? rect.top - POPOVER_HEIGHT_PX - 4
                                      : rect.bottom + 4,
                                    left: Math.min(
                                      rect.left,
                                      window.innerWidth - POPOVER_WIDTH_PX - 8,
                                    ),
                                    openUpward,
                                  });
                                  setEditingEnergyItemId(it.id);
                                }}
                                className={`text-micro font-sans px-1 py-0.5 rounded font-bold shrink-0 cursor-pointer transition hover:ring-1 hover:ring-[var(--ink)]/40 ${energy.bgClass} ${energy.textClass}`}
                                title={`Energía: ${energy.label} (${currentVal1a10}/10)${song.energiaManual ? " — fijada a mano" : ""}. Clic para cambiarla.`}
                              >
                                <span><ShowIcon inline emoji={energy.icon} /></span>
                                {song.energiaManual && (
                                  <span
                                    className="ml-0.5"
                                    title="Energía fijada a mano"
                                  >
                                    <ShowIcon inline emoji="✋" />
                                  </span>
                                )}
                              </button>
                              {/* Portal + position:fixed a propósito: la fila vive dentro de una lista con
 overflow-y-auto (ver contenedor"ITEMS LIST"), así que un popover position:absolute
 quedaba recortado/oculto por ese overflow en canciones cerca del final del scroll —
 de ahí que"hubiera que bajar" para verlo. Con fixed + posición calculada al abrir
 (arriba o abajo según el hueco real en el viewport) escapa a ese clipping. */}
                              {isEditingThis &&
                                energyPopoverPos &&
                                createPortal(
                                  // Selector 1-10 (más fácil de puntuar que 1-20 directamente) — se guarda como
                                  // energia = valor*2 para no tocar el resto del sistema, que ya usa escala 1-20.
                                  <div
                                    data-energy-popover
                                    className="fixed z-[100] bg-[var(--sunken)] rounded-[var(--r-s)] p-1.5 flex items-center gap-0.5"
                                    style={{
                                      top: energyPopoverPos.top,
                                      left: energyPopoverPos.left,
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {Array.from(
                                      { length: 10 },
                                      (_, i) => i + 1,
                                    ).map((val) => (
                                      <button
                                        key={val}
                                        type="button"
                                        disabled={savingEnergyItemId === it.id}
                                        onClick={() =>
                                          handleSetEnergiaManual(
                                            song,
                                            it.id,
                                            val,
                                          )
                                        }
                                        className={`w-5 h-5 rounded text-micro font-sans font-bold flex items-center justify-center transition disabled:opacity-50 ${
                                          currentVal1a10 === val
                                            ? "bg-[var(--acc)] text-[var(--on-acc)]"
                                            : "bg-[var(--surface)]/80 text-[var(--ink)] hover:bg-[var(--surface)]/70"
                                        }`}
                                      >
                                        {val}
                                      </button>
                                    ))}
                                  </div>,
                                  document.body,
                                )}
                            </div>
                          );
                        })()}

                        {isSelected && (
                          <span className="shrink-0 text-[var(--acc-ink)]" title="Seleccionada: lo que añadas irá debajo">
                            <Pin className="size-3.5" aria-hidden="true" />
                          </span>
                        )}

                        {/* Spacer */}
                        <div className="flex-1"></div>

                        {/* Notas de miembros / acordes ya no van en la fila compacta — se han movido al panel
 expandible (ver más abajo): son consultas ocasionales, no algo que se mira en cada fila
 de cada setlist. Reordenar arriba/abajo se ha quitado por completo: ya lo cubren el drag
 handle y el joystick del gráfico (seleccionar el punto + ◀▶) sin duplicar el control.
 AGENTS.md §6. */}
                        {memberNotesCount > 0 && (
                          <span
                            className="text-[var(--acc)]/70 shrink-0"
                            title={`${memberNotesCount} nota(s) de miembros`}
                          >
                            <Users className="w-3 h-3" />
                          </span>
                        )}

                        {/* Studio button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenStudioModal(song);
                          }}
                          className="shrink-0 cursor-pointer rounded-[var(--r-pill)] p-1.5 text-[var(--ink-2)] transition-ui hover:bg-[var(--sunken)] hover:text-[var(--ok)] active:scale-[0.97]"
                          title="Abrir Studio de grabación multipista y pistas"
                        >
                          <Headphones className="w-3.5 h-3.5 text-[var(--ok)]" />
                        </button>

                        {/* Probar unión con tema anterior con indicador de calidad (✓ o ✕) */}
                        {index > 0 &&
                          activeSetlist.items[index - 1]?.songId &&
                          (() => {
                            const prevSong = songs.find(
                              (s) =>
                                s.id === activeSetlist.items[index - 1].songId,
                            );
                            const evalUnion =
                              prevSong && song
                                ? evaluarCalidadUnion(prevSong, song)
                                : null;
                            return (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenTransitionPreview(index - 1, index);
                                }}
                                className={`px-1.5 py-0.5 rounded-[var(--r-pill)] text-micro font-sans font-bold flex items-center gap-1 transition-ui cursor-pointer shrink-0 ${
                                  evalUnion?.status === "ok"
                                    ? "bg-[var(--ok)]/15 hover:bg-[var(--ok)]/25 text-[var(--ink)]"
                                    : "bg-[var(--alert)]/15 hover:bg-[var(--alert)]/25 text-[var(--ink)]"
                                }`}
                                title={
                                  evalUnion
                                    ? `🎧 Probar unión con #${index} (${prevSong?.titulo}): ${evalUnion.title} · ${evalUnion.motivos.join(", ")}`
                                    : "Probar unión y transición con la canción anterior"
                                }
                              >
                                <span>{evalUnion?.icon || "⚡"}</span>
                                <Headphones className="w-3 h-3" />
                              </button>
                            );
                          })()}

                        {/* Edit song button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSong(song);
                            setShowSongModal(true);
                          }}
                          className="shrink-0 cursor-pointer rounded-[var(--r-pill)] p-1.5 text-[var(--ink-2)] transition-ui hover:bg-[var(--sunken)] hover:text-[var(--acc)] active:scale-[0.97]"
                          title="Editar canción"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Expand button for details */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand();
                          }}
                          className="shrink-0 cursor-pointer rounded-[var(--r-pill)] p-1.5 text-[var(--ink-2)] transition-ui hover:bg-[var(--sunken)] hover:text-[var(--acc)] active:scale-[0.97]"
                          title={
                            isExpanded
                              ? "Ocultar detalles"
                              : "Ver afinación, disco, cantante, acordes y notas de miembros"
                          }
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => handleRemoveSetlistItem(it.id)}
                          className="shrink-0 cursor-pointer rounded-[var(--r-pill)] p-1.5 text-[var(--ink-2)] transition-ui hover:bg-[var(--sunken)] hover:text-[var(--alert)] active:scale-[0.97]"
                          title="Quitar del setlist"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* ALWAYS SHOW NOTES IF EXIST - Compact line */}
                      {(() => {
                        // La nota "general para el grupo" que se edita en MemberNotesModal/SongModal se guarda en
                        // notasRepertorio, no en notasInternas (un campo distinto, sin UI de edición expuesta aquí)
                        // — mirar notasInternas hacía que esta línea nunca mostrara la nota general recién guardada.
                        // La clave del músico activo siempre se guarda en minúsculas (ver handleNoteChange en
                        // MemberNotesModal/SongModal), así que hay que normalizar currentUser.name igual al buscarla.
                        const userNote =
                          currentUser?.name &&
                          song.notasMiembros?.[currentUser.name.toLowerCase()];
                        const hasMemberNotes =
                          Array.isArray(song.notasPorMiembro) &&
                          song.notasPorMiembro.length > 0;
                        return song.notasRepertorio ||
                          it.notaTema ||
                          userNote ||
                          hasMemberNotes ? (
                          <div
                            className="px-2.5 py-1.5 text-micro font-sans space-y-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {song.notasRepertorio && (
                              <div
                                className="text-[var(--accent-alt)]/80 truncate"
                                title={song.notasRepertorio}
                              >
                                <ShowIcon inline emoji="📝" />{song.notasRepertorio}
                              </div>
                            )}
                            {userNote && (
                              <div
                                className="text-[var(--ok)]/80 truncate"
                                title={userNote}
                              >
                                <ShowIcon inline emoji="👤" />{currentUser.name}: {userNote}
                              </div>
                            )}
                            {it.notaTema && (
                              <div
                                className="text-[var(--ok)]/80 truncate"
                                title={it.notaTema}
                              >
                                <Lightbulb className="mr-1 inline size-3 align-[-1px]" aria-hidden="true" />{it.notaTema}
                              </div>
                            )}
                            {hasMemberNotes && (
                              <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {song.notasPorMiembro!.map((m, mIdx) => (
                                  <span
                                    key={m.userId || m.memberName || mIdx}
                                    className="inline-flex items-center gap-1 bg-[var(--acc-soft)] text-[var(--acc-ink)] px-1.5 py-0.5 rounded-[var(--r-pill)] text-micro"
                                  >
                                    <b>[{m.instrument || m.memberName}]:</b>{" "}
                                    {m.nota}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : null;
                      })()}

                      {/* EXPANDED DETAILS - Only when isExpanded */}
                      {isExpanded && (
                        <div
                          className={` px-2.5 py-2 text-micro font-sans space-y-1 ${"bg-[var(--bg)]"}`}
                        >
                          {song.cantantePrincipal && (
                            <div className="text-[var(--ink-2)]">
                              <span className="font-bold text-[var(--ink-2)]">
                                Cantante:
                              </span>{" "}
                              {song.cantantePrincipal}
                            </div>
                          )}
                          {song.afinacion && (
                            <div className="text-[var(--ink-2)]">
                              <span className="font-bold text-[var(--ink-2)]">
                                Afinación:
                              </span>{" "}
                              {song.afinacion}
                            </div>
                          )}
                          {song.albumDisco && (
                            <div className="text-[var(--ink-2)]">
                              <span className="font-bold text-[var(--ink-2)]">
                                Disco:
                              </span>{" "}
                              {song.albumDisco}
                            </div>
                          )}

                          <Input
                            size="sm"
                            type="text"
                            placeholder="Nota para este bolo (ej. Cambio a acústica / empalmar solo)…"
                            value={it.notaTema || ""}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              handleUpdateItemNote(it.id, e.target.value)
                            }
                            className="w-full mt-1"
                          />

                          {/* Notas de miembros / acordes / studio */}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMemberNotesSong(song);
                              }}
                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
                                memberNotesCount > 0
                                  ? "text-[var(--acc)]/70 hover:text-[var(--acc)]"
                                  : "text-[var(--ink-2)] hover:text-[var(--acc)]/70"
                              }`}
                            >
                              <Users className="w-3 h-3" /> Notas de miembros
                              {memberNotesCount > 0
                                ? ` (${memberNotesCount})`
                                : ""}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveChordsSong(song);
                              }}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[var(--ink-2)] hover:text-[var(--ok)] transition-colors"
                            >
                              <FileText className="w-3 h-3" /> Acordes
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenStudioModal(song);
                              }}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[var(--ink-2)] hover:text-[var(--ok)] transition-colors"
                            >
                              <Headphones className="w-3 h-3 text-[var(--ok)]" />{" "}
                              Studio multipista
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                } else if (
                  it.tipoItem === "bloque" &&
                  it.bloqueSubtipo === "header"
                ) {
                  return (
                    <div
                      key={it.id}
                      draggable={true}
                      onDragStart={(e) => {
                        if (TRANSPARENT_DRAG_IMAGE)
                          e.dataTransfer.setDragImage(
                            TRANSPARENT_DRAG_IMAGE,
                            0,
                            0,
                          );
                        setDraggedItemIndex(index);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverItemIndex(index);
                      }}
                      onDragLeave={() => {
                        if (dragOverItemIndex === index)
                          setDragOverItemIndex(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDropItem(index);
                      }}
                      onDragEnd={() => {
                        setDraggedItemIndex(null);
                        setDragOverItemIndex(null);
                      }}
                      onClick={() =>
                        setSelectedSetlistItemId(isSelected ? null : it.id)
                      }
                      className={`rounded-[var(--r-s)] transition-ui cursor-pointer ${
                        isDragging ? "opacity-40 scale-[0.98]" : ""
                      } ${isDragOver ? "scale-[1.01] bg-[var(--acc)]/10" : ""} ${
                        isSelected
                          ? "ring-2 ring-[var(--acc)]/40 bg-[var(--sunken)]"
                          : "bg-[var(--sunken)] hover:brightness-95"
                      }`}
                    >
                      <div className="flex items-center gap-2 px-2.5 py-1.5">
                        {/* Drag Handle */}
                        <div
                          className="cursor-grab active:cursor-grabbing text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors shrink-0"
                          title="Arrastrar y soltar para reordenar"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <GripVertical className="size-4" />
                        </div>

                        {/* Icon */}
                        <Layers className="size-4 shrink-0 text-[var(--acc-ink)]" aria-hidden="true" />

                        {/* Title input - inline */}
                        <input
                          type="text"
                          value={it.tituloCustom || ""}
                          placeholder="Ej: Bloque 1 · Calentamiento"
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSetlists((prev) =>
                              prev.map((s) =>
                                s.id === activeSetlist.id
                                  ? {
                                      ...s,
                                      items: s.items.map((x) =>
                                        x.id === it.id
                                          ? { ...x, tituloCustom: val }
                                          : x,
                                      ),
                                    }
                                  : s,
                              ),
                            );
                          }}
                          className="bg-transparent text-sm font-semibold font-sans text-[var(--ink)] placeholder:text-[var(--ink-2)] focus:outline-none min-w-0 flex-1"
                        />

                        {/* Spacer */}
                        <div className="flex-1"></div>

                        {/* Controls */}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingShowItem(it);
                            setShowShowItemModal(true);
                          }}
                          title="Editar bloque"
                          aria-label="Editar bloque"
                          className="hidden sm:inline-flex"
                        >
                          <Edit3 className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSetlistItem(it.id);
                          }}
                          title="Eliminar bloque"
                          aria-label="Eliminar bloque"
                          className="hover:text-[var(--alert)]"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    </div>
                  );
                } else {
                  const typeConfig =
                    SHOW_ITEM_TYPES[it.tipoItem] || SHOW_ITEM_TYPES.otro;
                  const durationText = formatItemDuration(it);

                  return (
                    <div
                      key={it.id}
                      draggable={true}
                      onDragStart={(e) => {
                        if (TRANSPARENT_DRAG_IMAGE)
                          e.dataTransfer.setDragImage(
                            TRANSPARENT_DRAG_IMAGE,
                            0,
                            0,
                          );
                        setDraggedItemIndex(index);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverItemIndex(index);
                      }}
                      onDragLeave={() => {
                        if (dragOverItemIndex === index)
                          setDragOverItemIndex(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDropItem(index);
                      }}
                      onDragEnd={() => {
                        setDraggedItemIndex(null);
                        setDragOverItemIndex(null);
                      }}
                      onClick={() =>
                        setSelectedSetlistItemId(isSelected ? null : it.id)
                      }
                      className={`rounded-[var(--r-s)] transition-ui cursor-pointer ${typeConfig.bg} ${
                        isDragging ? "opacity-40 scale-[0.98]" : ""
                      } ${isDragOver ? "border-2 scale-[1.01]" : ""} ${
                        isSelected ? "ring-2 ring-[var(--acc)]/60" : ""
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-2.5 py-2">
                        {/* Drag Handle */}
                        <div
                          className="cursor-grab active:cursor-grabbing text-[var(--ink-2)] hover:text-[var(--acc)] transition-colors shrink-0"
                          title="Arrastrar y soltar para reordenar"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>

                        {/* Icon */}
                        <span className={`shrink-0 ${typeConfig.text}`}>
                          <ShowIcon emoji={typeConfig.icon} className="size-4" />
                        </span>

                        {/* Type Label */}
                        <span
                          className={`text-micro font-sans font-extrabold px-1.5 py-0.5 rounded-[var(--r-s)] shrink-0 ${typeConfig.text}`}
                        >
                          {typeConfig.label}
                        </span>

                        {/* Duration */}
                        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--ink-2)] tabular-nums">
                          <Timer className="size-3.5" aria-hidden="true" />
                          {durationText}
                        </span>

                        {/* Title - inline */}
                        <input
                          type="text"
                          value={it.tituloCustom || ""}
                          placeholder="Título/descripción…"
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSetlists((prev) =>
                              prev.map((s) =>
                                s.id === activeSetlist.id
                                  ? {
                                      ...s,
                                      items: s.items.map((x) =>
                                        x.id === it.id
                                          ? { ...x, tituloCustom: val }
                                          : x,
                                      ),
                                    }
                                  : s,
                              ),
                            );
                          }}
                          className="bg-transparent text-sm font-semibold font-sans text-[var(--ink)] placeholder:text-[var(--ink-2)] focus:outline-none min-w-[9rem] flex-1 basis-[12rem]"
                        />

                        {isSelected && (
                          <span className="px-1 py-0.5 rounded text-micro font-sans font-bold bg-[var(--acc)] text-[var(--on-acc)] shrink-0">
                            <ShowIcon inline emoji="📌" />
                          </span>
                        )}

                        {/* Controls */}
                        <button
                          onClick={() => {
                            setEditingShowItem(it);
                            setShowShowItemModal(true);
                          }}
                          className="p-0.5 text-[var(--ink-2)] hover:bg-[var(--surface)]/80 rounded transition-colors shrink-0"
                          title="Editar detalles"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveSetlistItem(it.id)}
                          className="shrink-0 cursor-pointer rounded-[var(--r-pill)] p-1.5 text-[var(--ink-2)] transition-ui hover:bg-[var(--sunken)] hover:text-[var(--alert)] active:scale-[0.97]"
                          title="Quitar del setlist"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* SHOW NOTES IF EXIST */}
                      {it.notaTema && (
                        <div
                          className="px-2.5 py-1 text-micro font-sans text-[var(--ink)]/70 truncate"
                          title={it.notaTema}
                        >
                          <Lightbulb className="mr-1 inline size-3 align-[-1px]" aria-hidden="true" />{it.notaTema}
                        </div>
                      )}
                    </div>
                  );
                }
              })
            )}
          </div>
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
            <div className="space-y-4">
              {/* CATALOG HERO BANNER — Estilo Spotify: limpio y minimalista */}
              <div className="flex items-end gap-4 sm:gap-6 pb-6">
                {/* Album cover */}
                <div className="relative shrink-0 w-20 h-20 sm:w-28 sm:h-28 rounded-[var(--r-m)] overflow-hidden flex items-center justify-center group">
                  <AlbumCover
                    title={`Repertorio ${bName}`}
                    artist={bName}
                    coverUrl={filteredSongs[0]?.portadaUrl}
                    size={112}
                    onPlay={() => {
                      const first = filteredSongs[0];
                      if (first) {
                        selectPlayerSongWithQueue(first, true, null);
                      }
                    }}
                    isPlaying={
                      !!(
                        activePlayerSong &&
                        isPlayerPlaying &&
                        filteredSongs.some((s) => s.id === activePlayerSong.id)
                      )
                    }
                  />
                  <div className="absolute inset-0 bg-[var(--scrim)]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-6 h-6 text-[var(--ink)] fill-[var(--surface)]" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pb-1">
                  <div className="text-xs font-semibold text-[var(--ink-2)] mb-2">
                    Repertorio
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-bold leading-tight truncate">
                    {bName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--ink-2)] mt-3">
                    <span className="font-medium text-[var(--ink)]">
                      {songs.length} temas
                    </span>
                    <span className="text-[var(--ink-2)]">•</span>
                    <span>
                      {Math.round(
                        songs.reduce(
                          (acc, s) => acc + (s.duracionSegundos || 210),
                          0,
                        ) / 60,
                      )}{" "}
                      min
                    </span>
                    <span className="text-[var(--ink-2)]">•</span>
                    <span className="font-medium">
                      {songs.filter((s) => s.favoritoGeneral).length} favoritos
                    </span>
                  </div>
                </div>

                {/* Play button */}
                <button
                  onClick={() => {
                    if (filteredSongs.length > 0) {
                      const first = filteredSongs[0];
                      selectPlayerSongWithQueue(first, true, null);
                    }
                  }}
                  className="shrink-0 w-12 h-12 rounded-[var(--r-pill)] bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-bold flex items-center justify-center transition-ui cursor-pointer active:scale-[0.97]"
                  title="Reproducir catálogo"
                >
                  {activePlayerSong &&
                  isPlayerPlaying &&
                  filteredSongs.some((s) => s.id === activePlayerSong.id) ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>
              </div>

              {/* CATALOG FILTERS BAR — Limpio y minimalista */}
              <div className="flex items-center gap-3 py-4">
                {/* Album filter */}
                <Select
                  size="sm"
                  value={catalogAlbumFilter}
                  onChange={(e) => setCatalogAlbumFilter(e.target.value)}
                  
                >
                  <option value="todos">Todos los discos</option>
                  {albumsList
                    .filter((a) => a !== "todos")
                    .map((alb) => (
                      <option key={alb} value={alb}>
                        {alb}
                      </option>
                    ))}
                </Select>

                {/* Status filter toggle */}
                <button
                  onClick={() =>
                    setCatalogStatusFilter(
                      catalogStatusFilter === "todos" ? "listo" : "todos",
                    )
                  }
                  className={`px-3.5 py-2 rounded-[var(--r-pill)] text-sm font-medium transition-colors flex items-center gap-2 ${
                    catalogStatusFilter === "listo"
                      ? "bg-[var(--acc)] text-[var(--on-acc)]"
                      : "bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)]"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Listos</span>
                </button>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Add song button */}
                <Button
                  variant="primary"
                  id="btn-add-song-filter"
                  onClick={() => {
                    setEditingSong(null);
                    setShowSongModal(true);
                  }}
                  className="items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Tema</span>
                </Button>

                {/* More actions menu */}
                <button
                  type="button"
                  title="Más opciones"
                  onClick={() =>
                    setShowCatalogActionsMenu(!showCatalogActionsMenu)
                  }
                  className="relative p-2 rounded-[var(--r-pill)] text-[var(--ink-2)] hover:bg-[var(--surface)] transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>

                {showCatalogActionsMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-[var(--surface)] rounded-[var(--r-m)] py-2 z-50 min-w-[200px]">
                    <button
                      onClick={() => {
                        setGroupByAlbum(!groupByAlbum);
                        setShowCatalogActionsMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--sunken)] transition-colors flex items-center gap-2"
                    >
                      <Layers className="w-4 h-4 text-[var(--ink-2)]" />
                      <span>Agrupar por álbum</span>
                    </button>
                    <button
                      id="btn-normalize-titles"
                      type="button"
                      onClick={() => {
                        handleNormalizeCatalogTitles();
                        setShowCatalogActionsMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--sunken)] transition-colors flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-[var(--acc)]" />
                      <span>Nombres propios</span>
                    </button>
                  </div>
                )}
              </div>

              {/* BULK ACTIONS BAR */}
              {selectedCatalogIds.size > 0 && (
                <div
                  className={`p-3.5 rounded-[var(--r-l)] flex flex-wrap items-center justify-between gap-3 ${"bg-[var(--ok)]/20 text-[var(--ink)]"}`}
                >
                  <span className="text-xs font-medium">
                    {selectedCatalogIds.size} canciones seleccionadas
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() =>
                        handleBulkAddSelectedToSetlist(
                          Array.from(selectedCatalogIds),
                        )
                      }
                      className="px-3.5 py-1.5 rounded-[var(--r-pill)] text-xs font-medium bg-[var(--ok)] hover:brightness-95 text-[var(--on-ok)] cursor-pointer transition-ui flex items-center gap-1.5"
                    >
                      <ListPlus className="w-3.5 h-3.5" />
                      <span>Añadir a repertorio…</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleBulkDeleteSongs(Array.from(selectedCatalogIds))
                      }
                      className="px-3.5 py-1.5 rounded-[var(--r-pill)] text-xs font-medium bg-[var(--alert)]/20 hover:bg-[var(--alert)]/30 text-[var(--ink)] cursor-pointer transition-ui flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar seleccionadas</span>
                    </button>
                    <button
                      type="button"
                      onClick={clearCatalogSelection}
                      className="px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-medium bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] cursor-pointer transition-ui"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* UNIFIED TRACKLIST / CATÁLOGO DE TEMAS */}
              <div className="rounded-[var(--r-l)] sm:rounded-[var(--r-xl)] overflow-hidden bg-[var(--surface)] text-[var(--ink-2)]">
                <div className="p-4 bg-[var(--sunken)]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={
                        filteredSongs.length > 0 &&
                        filteredSongs.every((s) => selectedCatalogIds.has(s.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCatalogIds(
                            new Set(filteredSongs.map((s) => s.id)),
                          );
                        } else {
                          clearCatalogSelection();
                        }
                      }}
                      className="w-3.5 h-3.5 cursor-pointer accent-indigo-600"
                      title="Seleccionar todo lo filtrado"
                    />
                    <span className="font-semibold text-[var(--ink-2)]">
                      {selectedCatalogIds.size > 0
                        ? `${selectedCatalogIds.size} seleccionadas`
                        : `${filteredSongs.length} temas`}
                    </span>
                    <span className="hidden md:inline text-xs opacity-60">
                      • Tono · BPM · duración · estado
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-[var(--ink-2)] mt-3">
                    <span className="hidden lg:inline opacity-70">
                      Acciones rápidas:
                    </span>
                    <span className="px-2 py-0.5 rounded-[var(--r-s)] bg-[var(--ok)]/15 text-[var(--ink)] font-medium">
                      Acordes
                    </span>
                    <span className="px-2 py-0.5 rounded-[var(--r-s)] bg-[var(--ok)]/15 text-[var(--ink)] font-medium">
                      Studio
                    </span>
                    <span className="px-2 py-0.5 rounded-[var(--r-s)] bg-[var(--acc)]/15 text-[var(--acc-ink)] font-medium">
                      Notas
                    </span>
                    <span className="hidden sm:inline px-2 py-0.5 rounded-[var(--r-s)] bg-[var(--surface)] text-[var(--ink-2)] font-medium">
                      Editar
                    </span>
                  </div>
                </div>
              </div>

              {/* Tracklist List */}
              <div className="p-2.5 space-y-1.5">
                {filteredSongs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <PublicoSilhouette opacity={0.12} size="small" />
                    <p className="mt-4 font-medium text-[var(--ink)] text-xs">
                      Sin canciones con esos filtros
                    </p>
                    <p className="mt-1.5 text-[var(--ink-2)] text-xs max-w-xs text-center">
                      Ajusta los filtros o añade nuevas canciones a tu catálogo.
                    </p>
                  </div>
                ) : (
                  filteredSongs.map((s, idx) => {
                    const isPlayingCurrent = activePlayerSong?.id === s.id;
                    const isSelected = selectedCatalogIds.has(s.id);
                    const albumLabel =
                      s.albumDisco || s.album || "Singles / Sin Disco";
                    const prevAlbumLabel =
                      idx > 0
                        ? filteredSongs[idx - 1].albumDisco ||
                          filteredSongs[idx - 1].album ||
                          "Singles / Sin Disco"
                        : null;
                    const showAlbumHeader =
                      groupByAlbum && albumLabel !== prevAlbumLabel;
                    const isDraggableCatalog =
                      filteredSongs.length > 1 &&
                      !catalogSearch.trim() &&
                      catalogAlbumFilter === "todos" &&
                      catalogStatusFilter === "todos";
                    const isDragging = draggedCatalogSongId === s.id;
                    const isDragOver = dragOverCatalogSongId === s.id;

                    return (
                      <React.Fragment key={`${s.id}-${idx}`}>
                        {showAlbumHeader && (
                          <div className="pt-3 pb-1 px-2 flex items-center gap-2 text-micro font-sans font-bold text-[var(--acc)]">
                            <span><ShowIcon inline emoji="💿" />{albumLabel}</span>
                            <div
                              className={`h-px flex-1 ${"bg-[var(--sunken)]"}`}
                            />
                          </div>
                        )}

                        <SongCardRow
                          song={s}
                          index={idx + 1}
                          isPlayingCurrent={isPlayingCurrent}
                          isPlayerPlaying={isPlayerPlaying}
                          onPlay={() =>
                            selectPlayerSongWithQueue(s, true, null)
                          }
                          onSelect={() => {
                            setEditingSong(s);
                            setShowSongModal(true);
                          }}
                          onToggleFavorite={() =>
                            handleUpdateSongFromStudio({
                              ...s,
                              favoritoGeneral: !s.favoritoGeneral,
                            })
                          }
                          showCheckbox={true}
                          isSelected={isSelected}
                          onToggleSelect={() => toggleCatalogSelect(s.id)}
                          onOpenChords={() => setActiveChordsSong(s)}
                          onOpenMemberNotes={() => setActiveMemberNotesSong(s)}
                          onOpenStudio={() => handleOpenStudioModal(s)}
                          onOpenIris={() =>
                            handleOpenStudioModal(s, { openIris: true })
                          }
                          onEditSong={() => {
                            setEditingSong(s);
                            setShowSongModal(true);
                          }}
                          onDeleteSong={() => handleDeleteSong(s.id)}
                          onShareSong={() => handleShareSong(s)}
                          externalLink={s.enlaceAcordes}
                          showAlbumBadge={!groupByAlbum}
                          draggable={isDraggableCatalog}
                          isDragging={isDragging}
                          isDragOver={isDragOver}
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = "move";
                            setDraggedCatalogSongId(s.id);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            if (
                              draggedCatalogSongId &&
                              dragOverCatalogSongId !== s.id
                            ) {
                              setDragOverCatalogSongId(s.id);
                            }
                          }}
                          onDragLeave={() => {
                            if (dragOverCatalogSongId === s.id) {
                              setDragOverCatalogSongId(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggedCatalogSongId) {
                              handleDropCatalogSong(draggedCatalogSongId, s.id);
                            }
                            setDraggedCatalogSongId(null);
                            setDragOverCatalogSongId(null);
                          }}
                          onDragEnd={() => {
                            setDraggedCatalogSongId(null);
                            setDragOverCatalogSongId(null);
                          }}
                          colors={colors}
                        />
                      </React.Fragment>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD / EDIT SONG */}
      {/* key fuerza un remount por canción: SongModal se queda siempre montado (isOpen controla un
 `return null` interno, no un desmontaje), así que sin key su useState de notas por miembro
 (y duración/álbum) solo se inicializa una vez para toda la sesión con el primer editingSong
 que se vio (normalmente null) y nunca se resincroniza al abrir otra canción — ver notas del
 bug en SongModal.tsx: memberNotesState quedaba"congelado" y el guardado de notas por
 miembro sobrescribía siempre con ese valor obsoleto/vacío. */}
      <SongModal
        key={showSongModal ? editingSong?.id || "new-song" : "closed"}
        isOpen={showSongModal}
        bandMembers={bandRosterMembers}
        editingSong={editingSong}
        defaultAlbumForNewSong={defaultAlbumForNewSong}
        albumsList={albumsList}
        colors={colors}
        onClose={() => setShowSongModal(false)}
        onSave={handleSaveSong}
      />

      {/* MODAL: ASSIGN SETLIST TO CONCERT OR REHEARSAL */}
      <AssignSetlistModal
        assigningSetlist={assigningSetlist}
        colors={colors}
        concerts={concerts}
        rehearsals={rehearsals}
        selectedConcertToAssign={selectedConcertToAssign}
        onSelectEvent={(id) => setSelectedConcertToAssign(id)}
        onClose={() => setAssigningSetlist(null)}
        onSave={handleAssignSetlistToConcert}
      />

      {/* MODAL: ADD OR EDIT NON-SONG SHOW ITEM OR BLOCK */}
      <ShowItemModal
        isOpen={showShowItemModal}
        onClose={() => setShowShowItemModal(false)}
        colors={colors}
        editingShowItem={editingShowItem}
        setEditingShowItem={setEditingShowItem}
        handleSaveShowItem={handleSaveShowItem}
      />

      {/* PDF Preview Modal */}
      <PdfExportModal
        bandMembers={bandRosterMembers}
        bandLogoUrl={
          isBakandeya
            ? "/logo_bakandeya_bueno_sin_fondo.png"
            : bandLogoUrl || ""
        }
        isOpen={showPdfPreview}
        activeSetlist={activeSetlist}
        activeSetlistMetrics={activeSetlistMetrics}
        songs={songs}
        onClose={() => setShowPdfPreview(false)}
        bandName={bName}
        onUpdateSong={handleUpdateSongFromStudio}
      />

      {activeStudioSong && (
        <SongStudioModal
          song={activeStudioSong}
          colors={colors}
          onClose={() => {
            setActiveStudioSong(null);
            setActiveStudioOpenIris(false);
          }}
          onUpdateSong={handleUpdateSongFromStudio}
          currentUser={currentUser}
          currentUsername={currentUser?.name || currentUser?.username}
          initialOpenIrisModal={activeStudioOpenIris}
        />
      )}

      {/* Persistent Spotify Music Player is now rendered globally from App.tsx via GlobalPlayer component
 The local player state (activePlayerSong, playerQueueOverride) is still used for local queue management
 but dispatches to global PlayerContext for true persistence across modules. */}

      {assignSongsModalData && assignSongsModalData.isOpen && (
        <AssignSongsToAlbumModal
          isOpen={assignSongsModalData.isOpen}
          albumName={assignSongsModalData.albumName}
          songs={songs}
          colors={colors}
          onClose={() => setAssignSongsModalData(null)}
          onSaveAlbumSongs={handleSaveAlbumSongs}
        />
      )}

      {setlistModalData && setlistModalData.isOpen && (
        <SetlistModal
          isOpen={setlistModalData.isOpen}
          setlistToEdit={setlistModalData.setlistToEdit}
          colors={colors}
          onClose={() => setSetlistModalData(null)}
          onSave={handleSaveSetlistModal}
        />
      )}

      {isAddSongsModalOpen && activeSetlist && (
        <AddSongsToSetlistModal
          isOpen={isAddSongsModalOpen}
          songs={songs}
          existingSongIds={activeSetlist.items
            .map((it) => it.songId)
            .filter((id): id is string => Boolean(id))}
          colors={colors}
          onClose={() => setIsAddSongsModalOpen(false)}
          onAddSongs={handleAddMultipleSongsToSetlist}
        />
      )}
      {/* CHORDS AND SUBSTITUTE GUIDE VIEWER MODAL */}

      {/* MEMBER NOTES MODAL */}
      {activeMemberNotesSong && (
        <MemberNotesModal
          isOpen={Boolean(activeMemberNotesSong)}
          song={activeMemberNotesSong}
          colors={colors}
          bandMembers={bandRosterMembers}
          onClose={() => setActiveMemberNotesSong(null)}
          onSaveSongNotes={handleUpdateSongFromStudio}
        />
      )}
      {activeChordsSong && (
        <SongChordsViewerModal
          song={activeChordsSong}
          onClose={() => setActiveChordsSong(null)}
          onUpdateSong={handleUpdateSongFromChords}
        />
      )}

      {/* CONFIRM DELETE MODAL DIALOG */}
      <ConfirmDeleteModal
        data={confirmDeleteModal}
        onClose={() => setConfirmDeleteModal(null)}
      />

      {/* CONFIRM DELETE ALBUM MODAL DIALOG */}
      <ConfirmDeleteAlbumModal
        data={deleteAlbumData}
        onClose={() => setDeleteAlbumData(null)}
        onUnassignSongs={handleUnassignAlbumSongs}
        onDeleteAlbumAndSongs={handleDeleteAlbumAndSongs}
      />

      {/* SHARE MODAL */}
      <ShareModal
        isOpen={shareModalData.isOpen}
        onClose={() =>
          setShareModalData((prev) => ({ ...prev, isOpen: false }))
        }
        title={shareModalData.title}
        subtitle={shareModalData.subtitle}
        initialText={shareModalData.text}
        itemType={shareModalData.itemType}
      />

      {/* SPOTIFY DISCOGRAPHY IMPORT MODAL */}
      <SpotifyDiscographyModal
        isOpen={isSpotifyModalOpen}
        onClose={() => setIsSpotifyModalOpen(false)}
        bandName={bName}
        existingSongs={songs}
        colors={colors}
        onSongsImported={(updatedSongs) => {
          setSongs(updatedSongs);
        }}
      />

      {/* LIGHTWEIGHT AI CHORDS/LYRICS ANALYSIS STATUS BANNER */}
      {statusBanner && (
        <div
          className={`fixed bottom-5 right-5 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-[var(--r-l)] text-xs font-sans max-w-sm ${
            statusBanner.type === "success"
              ? "bg-[var(--ok-soft)]/60 text-[var(--ok)]"
              : statusBanner.type === "error"
                ? "bg-[var(--alert-soft)]/60 text-[var(--alert)]"
                : statusBanner.type === "warning"
                  ? "bg-[var(--acc-soft)]  text-[var(--acc)]"
                  : "bg-[var(--surface)] text-[var(--ink-2)]"
          }`}
        >
          {statusBanner.type === "loading" && (
            <span className="w-3.5 h-3.5 border-t-[var(--hair)] rounded-[var(--r-pill)] animate-spin shrink-0" />
          )}
          <span>{statusBanner.text}</span>
        </div>
      )}

      {/* AI SETLIST ANALYSIS MODAL */}
      <SetlistAIAnalysisModal
        isOpen={showAIAnalysisModal}
        onClose={() => {
          setShowAIAnalysisModal(false);
          setHighlightedSongIds([]);
        }}
        setlistId={activeSetlist?.id || ""}
        setlistName={activeSetlist?.nombre}
        initialAnalysis={aiAnalysisResult}
        onAnalysisComplete={(analysis) => {
          setAiAnalysisResult(analysis);
          setAiAnalysisLoading(false);
        }}
        onHighlightSongs={setHighlightedSongIds}
        highlightedSongIds={highlightedSongIds}
        chartData={chartData}
        yDomain={yDomain}
        zonasEnergia={ZONAS_ENERGIA}
        warnings={energyAnalysis.warnings}
        onReorder={reorderSetlistItems}
        onEnergyChange={handleEnergyChartDrag}
        canUndo={canUndoReorder}
        onUndo={undoLastReorder}
        undoSourceKey={undoSourceKey}
      />

      {/* PERFECT SETLIST PLAN MODAL */}
      <PerfectSetlistModal
        isOpen={showPerfectSetlistModal}
        onClose={() => setShowPerfectSetlistModal(false)}
        setlistName={activeSetlist?.nombre}
        loading={perfectSetlistLoading}
        plan={perfectSetlistPlan}
        error={perfectSetlistError}
        onGenerate={handleGeneratePerfectSetlist}
        onApplyAction={applyPerfectSetlistAction}
        canUndo={canUndoReorder}
        onUndo={undoLastReorder}
        undoSourceKey={undoSourceKey}
        chartData={chartData}
        yDomain={yDomain}
        zonasEnergia={ZONAS_ENERGIA}
        onReorder={reorderSetlistItems}
        onEnergyChange={handleEnergyChartDrag}
      />

      {/* IMPORT SETLIST FROM PHOTO/PDF MODAL */}
      <ImportSetlistModal
        isOpen={showImportSetlistModal}
        onClose={() => setShowImportSetlistModal(false)}
        catalogSongs={songs}
        onCreated={handleSetlistImported}
      />

      {/* SETLIST PERFORMANCE VIEW (CONCIERTO EN VIVO O MODO ENSAYO) */}
      {performanceSetlistId && (
        <SetlistPerformanceView
          setlist={setlists.find((s) => s.id === performanceSetlistId)!}
          songs={songs}
          initialMode={performanceInitialMode}
          onClose={() => setPerformanceSetlistId(null)}
          onOpenStudioModal={(song) => handleOpenStudioModal(song)}
          onUpdateSong={handleUpdateSongFromStudio}
          currentUser={currentUser}
        />
      )}

      {/* SONG TRANSITION PREVIEW MODAL (PROBAR UNIÓN Y ENLACE AUDITIVO ENTRE TEMAS) */}
      {transitionPreviewData?.isOpen &&
        transitionPreviewData.songA &&
        transitionPreviewData.songB && (
          <SongTransitionPreviewModal
            isOpen={transitionPreviewData.isOpen}
            onClose={() => setTransitionPreviewData(null)}
            songA={transitionPreviewData.songA}
            songB={transitionPreviewData.songB}
            itemA={transitionPreviewData.itemA}
            itemB={transitionPreviewData.itemB}
            indexA={transitionPreviewData.indexA}
            indexB={transitionPreviewData.indexB}
            totalItemsCount={activeSetlist?.items?.length || 0}
            onNavigateTransition={(newIdxA, newIdxB) => {
              handleOpenTransitionPreview(newIdxA, newIdxB);
            }}
            onSwapSongs={(idxA, idxB) => {
              reorderSetlistItems(idxA, idxB);
              setTransitionPreviewData((prev) =>
                prev
                  ? {
                      ...prev,
                      songA: prev.songB,
                      songB: prev.songA,
                      itemA: prev.itemB,
                      itemB: prev.itemA,
                    }
                  : null,
              );
            }}
            onInsertInterludio={(afterItemId) => {
              handleAddItemToSetlist(
                undefined,
                "chapa",
                "Charla / Interludio",
                1,
                60,
                "Transición hablada para modular tono o descanso",
                afterItemId,
              );
            }}
            onUpdateSong={handleUpdateSongFromStudio}
          />
        )}

      {/* Tutorial Interactivo Paso a Paso */}
      <ModuleTutorialModal
        moduleId="repertorio"
        isOpen={isTutorialOpen}
        onClose={closeTutorial}
      />
    </div>
  );
}
