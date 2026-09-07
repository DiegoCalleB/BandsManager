import { getLowLatencyAudioStream } from "../utils/audioLatency";
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import { ThemeColors, Song, Setlist, SetlistItem, Concert, Rehearsal, SetlistShortcut } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { 
 Disc3, Music, Plus, Search, X, Edit3, Trash2, Copy,
 Download, Clock, Mic, FileText, Check, Layers, ExternalLink, Printer, 
 Sparkles, Sliders, CheckCircle2, ChevronLeft, ChevronRight, HelpCircle, Eye, EyeOff, Headphones,
 Play, Pause, Volume2, Upload, Zap, MessageSquare, Radio, Flag,
 SkipBack, SkipForward, Repeat, Square, VolumeX, Disc, MicOff, Heart, Camera, Image, Star,
  ChevronUp, ChevronDown, ListPlus, Users,
  GripVertical, ImagePlus, MoreHorizontal
} from 'lucide-react';
import SongStudioModal from './SongStudioModal';
import { SongChordsViewerModal } from './SongChordsViewerModal';
import { ShareModal } from './ShareModal';
import { useShareModal } from '../hooks/useShareModal';
import { useCatalogFilters } from '../hooks/useCatalogFilters';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useStagePlayer } from '../hooks/useStagePlayer';
import { ConfirmDeleteModal } from './repertorio/ConfirmDeleteModal';
import { ConfirmDeleteAlbumModal, ConfirmDeleteAlbumData } from './repertorio/ConfirmDeleteAlbumModal';
import { AssignSongsToAlbumModal } from './repertorio/AssignSongsToAlbumModal';
import { AssignSetlistModal } from './repertorio/AssignSetlistModal';
import { SongModal } from './repertorio/SongModal';
import { SetlistModal } from './repertorio/SetlistModal';
import { AddSongsToSetlistModal } from './repertorio/AddSongsToSetlistModal';
import { PdfExportModal } from './repertorio/PdfExportModal';
import { MemberNotesModal } from './repertorio/MemberNotesModal';
import { SetlistAIAnalysisModal } from './repertorio/SetlistAIAnalysisModal';
import { PerfectSetlistModal, PerfectSetlistAction, PerfectSetlistPlan, SetlistFeedbackInput } from './repertorio/PerfectSetlistModal';
import { ImportSetlistModal } from './repertorio/ImportSetlistModal';
import { DiscografiaView } from './repertorio/DiscografiaView';
import { SpotifyDiscographyModal } from './repertorio/SpotifyDiscographyModal';
import { EscenarioView } from './repertorio/EscenarioView';
import { AlbumCover } from "./AlbumCover";
import SpotifyPlayerBar from './SpotifyPlayerBar';
import { 
 uploadFileToServer, parseGoogleDriveAudioUrl, isGoogleDriveUrl, 
 saveSongsToLocalStorageSafely, saveSetlistsToLocalStorageSafely, resolveAudioUrl 
} from '../utils/audioStorage';
import { calculateSetlistStats, resolveBandMembers, BandMemberOption } from '../utils/repertorioUtils';
import { analyzeSetlistEnergy, getEnergyInfo, calcularCurvaEnergiaIdeal } from '../utils/energyPacingUtils';
import { EnergyChart, EnergyChartPoint } from './repertorio/EnergyChart';
import { titlesMatch } from '../utils/songTitleMatch';

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
 view?: 'repertorio' | 'catalogo' | 'discografia';
 currentUser?: any;
}

// Plantilla de la formación de Bakandeya usada como banda de demostración de la propia
// app: solo debe mostrarse cuando la banda activa es literalmente Bakandeya, nunca como
// fallback para otras bandas (ver bandRosterMembers más abajo).
const BAKANDEYA_DEMO_MEMBERS: BandMemberOption[] = [
  { id: 'usr-diego', name: 'Diego', instrument: 'Voz / Guitarra', avatarColor: '#6366f1' },
  { id: 'usr-filgue', name: 'Filgue', instrument: 'Beatbox / Coros', avatarColor: '#f59e0b' },
  { id: 'usr-jon', name: 'Jon', instrument: 'Bajo / Teclados', avatarColor: '#10b981' },
  { id: 'usr-mikel', name: 'Mikel', instrument: 'Batería / Percusión', avatarColor: '#ec4899' },
  { id: 'usr-larra', name: 'Larra', instrument: 'Trompeta / Vientos', avatarColor: '#3b82f6' },
  { id: 'usr-raul', name: 'Raúl', instrument: 'Violín / Arreglos', avatarColor: '#8b5cf6' }
];

export function formatSecondsToMmSs(secs: number): string {
  if (!secs || isNaN(secs) || secs < 0) return '00:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const SHOW_ITEM_TYPES: Record<string, { label: string; icon: string; bg: string; text: string; border: string }> = {
  bloque_header: { label: 'Encabezado de Bloque / Sección', icon: '⚡', bg: 'bg-[#d1b375]/20', text: 'text-[#d1b375]', border: 'border-[#f2ca50]/50' },
  presentacion: { label: 'Presentación Banda / Saludo', icon: '🎤', bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' },
  intro_tema: { label: 'Intro / Historia del Tema', icon: '🗣️', bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  beatbox: { label: 'Performance Beatbox / Ritmo', icon: '🥁', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  solo_performance: { label: 'Solo de Instrumento / Jam', icon: '🎸', bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
  cambio_instrumento: { label: 'Cambio Instrumento / Afinación', icon: '🔧', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  chapa: { label: 'Chapa / Discurso con el Público', icon: '💬', bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  descanso: { label: 'Pausa / Intermedio / Agua', icon: '⏸️', bg: 'bg-zinc-800', text: 'text-zinc-300', border: 'border-zinc-700' },
  bis: { label: 'BIS / Parón Pre-Bis', icon: '💣', bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
  otro: { label: 'Otro Evento del Show', icon: '📌', bg: 'bg-neutral-800', text: 'text-neutral-300', border: 'border-neutral-700' }
};

// GIF 1x1 transparente para anular la "foto" fantasma que el navegador dibuja por defecto al
// arrastrar con drag-and-drop nativo (HTML5 draggable): sin `setDragImage`, cada fila reordenable
// (canciones y bloques por igual) deja ver una captura translúcida de sí misma siguiendo al
// cursor mientras se arrastra. Se crea una sola vez a nivel de módulo para que ya esté decodificada
// cuando el usuario arrastre de verdad — el reordenamiento en sí no cambia, solo desaparece la foto.
// window.Image (no el icono `Image` de lucide-react importado arriba, que shadowea el global).
const TRANSPARENT_DRAG_IMAGE = typeof window !== 'undefined' ? new window.Image() : null;
if (TRANSPARENT_DRAG_IMAGE) {
  TRANSPARENT_DRAG_IMAGE.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7';
}

const DEFAULT_SONGS: Song[] = [
 {
 id: 'song-cm-1',
 titulo: 'Intro (Live Casa México)',
 duracion: '1:30',
 duracionSegundos: 90,
 tonalidad: 'Am',
 bpm: 120,
 afinacion: 'E Standard',
 albumDisco: 'Directo Casa México',
 estadoTema: 'listo',
 esVersionCovers: false,
 notasInternas: 'Intro del directo en Casa México'
 },
 {
 id: 'song-cm-2',
 titulo: 'Tema1 (Live Casa México)',
 duracion: '3:45',
 duracionSegundos: 225,
 tonalidad: 'Em',
 bpm: 125,
 afinacion: 'E Standard',
 albumDisco: 'Directo Casa México',
 estadoTema: 'listo',
 esVersionCovers: false
 },
 {
 id: 'song-cm-3',
 titulo: 'Reggae Rock Style',
 duracion: '4:10',
 duracionSegundos: 250,
 tonalidad: 'Dm',
 bpm: 110,
 afinacion: 'E Standard',
 albumDisco: 'Directo Casa México',
 estadoTema: 'listo',
 esVersionCovers: false
 },
 {
 id: 'song-cm-4',
 titulo: 'Ska',
 duracion: '3:20',
 duracionSegundos: 200,
 tonalidad: 'Am',
 bpm: 145,
 afinacion: 'E Standard',
 albumDisco: 'Directo Casa México',
 estadoTema: 'listo',
 esVersionCovers: false
 },
 {
 id: 'song-cm-5',
 titulo: 'Llorona',
 duracion: '4:30',
 duracionSegundos: 270,
 tonalidad: 'Am',
 bpm: 100,
 afinacion: 'E Standard',
 albumDisco: 'Directo Casa México',
 estadoTema: 'listo',
 esVersionCovers: false
 },
 {
 id: 'song-1',
 titulo: 'Brisa y Cacharros',
 duracion: '3:30',
 duracionSegundos: 210,
 tonalidad: 'Am',
 bpm: 124,
 afinacion: 'E Standard',
 albumDisco: 'Álbum Debut (2025)',
 estadoTema: 'listo',
 esVersionCovers: false,
 enlaceAcordes: 'https://drive.google.com',
 notasInternas: 'Intro con sección de vientos y solo de trompeta. Gran fuerza en estribillos.'
 },
 {
 id: 'song-2',
 titulo: 'Fuego en la Sala',
 duracion: '4:12',
 duracionSegundos: 252,
 tonalidad: 'Em',
 bpm: 138,
 afinacion: 'E Standard',
 albumDisco: 'Álbum Debut (2025)',
 estadoTema: 'listo',
 esVersionCovers: false,
 notasInternas: 'Subida progresiva al final. Tema estelar de cierre en festival.'
 },
 {
 id: 'song-3',
 titulo: 'Noches de Garaje',
 duracion: '3:45',
 duracionSegundos: 225,
 tonalidad: 'Dm',
 bpm: 115,
 afinacion: 'Drop D',
 albumDisco: 'EP Cacharros & Ritmo',
 estadoTema: 'listo',
 esVersionCovers: false,
 notasInternas: 'Afinación especial en guitarra antes de empezar.'
 },
 {
 id: 'song-4',
 titulo: 'Ska del Norte',
 duracion: '3:15',
 duracionSegundos: 195,
 tonalidad: 'A Major',
 bpm: 152,
 afinacion: 'E Standard',
 albumDisco: 'Single 2026',
 estadoTema: 'listo',
 esVersionCovers: false,
 notasInternas: 'Ritmo acelerado ska. Ideal para subir la energía a mitad del concierto.'
 },
 {
 id: 'song-5',
 titulo: 'Canto a la Sombra',
 duracion: '5:10',
 duracionSegundos: 310,
 tonalidad: 'Bm',
 bpm: 96,
 afinacion: 'E Standard',
 albumDisco: 'Álbum Debut (2025)',
 estadoTema: 'listo',
 esVersionCovers: false,
 notasInternas: 'Balada rock progresiva con solo de violín de Raúl en la sección central.'
 },
 {
 id: 'song-6',
 titulo: 'Gira Sin Fin',
 duracion: '4:05',
 duracionSegundos: 245,
 tonalidad: 'G Major',
 bpm: 128,
 afinacion: 'E Standard',
 albumDisco: 'Álbum Debut (2025)',
 estadoTema: 'listo',
 esVersionCovers: false
 },
 {
 id: 'song-7',
 titulo: 'Mánager Fantasma',
 duracion: '3:50',
 duracionSegundos: 230,
 tonalidad: 'Cm',
 bpm: 120,
 afinacion: 'E Standard',
 albumDisco: 'Inéditas / En Proceso',
 estadoTema: 'ensayando',
 esVersionCovers: false,
 notasInternas: 'Sátira sobre los bots y mánagers virtuales. Ensayando para el próximo EP.'
 },
 {
 id: 'song-8',
 titulo: 'Maldita Dulzura (Cover)',
 duracion: '3:40',
 duracionSegundos: 220,
 tonalidad: 'C Major',
 bpm: 110,
 afinacion: 'E Standard',
 albumDisco: 'Covers & Versiones',
 estadoTema: 'listo',
 esVersionCovers: true,
 notasInternas: 'Versión acelerada adaptada a vientos y ritmo ska-rock.'
 }
];

const DEFAULT_SETLISTS: Setlist[] = [
 {
 id: 'setlist-1',
 nombre: 'Festival Directo Caña 45 min',
 descripcion: 'Estructura ágil en 3 bloques (Calentamiento, Nudo y Desenlace) con beatbox y presentación',
 tipoFormato: 'festival',
 duracionTotalEstimadaMinutos: 45,
 fechaCreacion: '2026-03-01',
 fechaUltimaEdicion: '2026-08-01',
 items: [
 { id: 'i-b1', tipoItem: 'bloque_header', tituloCustom: '🔥 Bloque 1: Calentamiento & Arranque' },
 { id: 'i-1', songId: 'song-1', tipoItem: 'cancion', notaTema: 'Arrancar directo sin intro' },
 { id: 'i-2', songId: 'song-2', tipoItem: 'cancion', notaTema: 'Empalmar batería con final de Brisa' },
 { id: 'i-bbx', tipoItem: 'beatbox', tituloCustom: 'Performance Beatbox Filgue & Intro Vocal', duracionEstimadaMinutos: 2, duracionEstimadaSegundos: 120, notaTema: 'Luz cenital sobre Filgue. Batería marca el pulso.' },
 
 { id: 'i-b2', tipoItem: 'bloque_header', tituloCustom: '⚡ Bloque 2: Nudo & Clímax' },
 { id: 'i-3', songId: 'song-4', tipoItem: 'cancion', notaTema: 'Subidón ska' },
 { id: 'i-4', tipoItem: 'presentacion', tituloCustom: 'Presentación Banda & Agradecimientos', duracionEstimadaMinutos: 2, duracionEstimadaSegundos: 120, notaTema: 'Jon habla al público y presenta a los vientos' },
 { id: 'i-5', songId: 'song-3', tipoItem: 'cancion', notaTema: 'Cambio de guitarra a Drop D' },
 
 { id: 'i-b3', tipoItem: 'bloque_header', tituloCustom: '💣 Bloque 3: Desenlace & BIS Final' },
 { id: 'i-6', songId: 'song-6', tipoItem: 'cancion', notaTema: 'Estribillo con coros del público' },
 { id: 'i-7', tipoItem: 'bis', tituloCustom: 'BIS / Cierre de Festival', duracionEstimadaMinutos: 1, duracionEstimadaSegundos: 60, notaTema: 'Salida rápida de escenario y vuelta para bis' },
 { id: 'i-8', songId: 'song-5', tipoItem: 'cancion', notaTema: 'Solo final de violín extendido' }
 ]
 },
 {
 id: 'setlist-2',
 nombre: 'Concierto Sala Larga 75 min',
 descripcion: 'Setlist completo con bloque acústico, solos e intros explicativas',
 tipoFormato: 'sala_larga',
 duracionTotalEstimadaMinutos: 75,
 fechaCreacion: '2026-04-10',
 fechaUltimaEdicion: '2026-07-20',
 items: [
 { id: 'i-20', tipoItem: 'bloque_header', tituloCustom: '🔥 Bloque 1: Bienvenida & Potencia' },
 { id: 'i-21', songId: 'song-1', tipoItem: 'cancion' },
 { id: 'i-22', songId: 'song-6', tipoItem: 'cancion' },
 { id: 'i-intro', tipoItem: 'intro_tema', tituloCustom: 'Historia / Intro a Noches de Garaje', duracionEstimadaMinutos: 1, duracionEstimadaSegundos: 60, notaTema: 'Diego explica el origen de la canción' },
 { id: 'i-23', songId: 'song-3', tipoItem: 'cancion' },
 
 { id: 'i-23b', tipoItem: 'bloque_header', tituloCustom: '🎸 Bloque 2: Acústico & Covers' },
 { id: 'i-24', songId: 'song-8', tipoItem: 'cancion', notaTema: 'Cover festivo' },
 { id: 'i-25', tipoItem: 'chapa', tituloCustom: 'Chapa Merch & Agradecimientos a la Sala', duracionEstimadaMinutos: 3, duracionEstimadaSegundos: 180 },
 { id: 'i-26', songId: 'song-7', tipoItem: 'cancion', notaTema: 'Tema nuevo en prueba' },
 
 { id: 'i-26b', tipoItem: 'bloque_header', tituloCustom: '⚡ Bloque 3: Desenlace & Traca' },
 { id: 'i-27', songId: 'song-5', tipoItem: 'cancion' },
 { id: 'i-28', songId: 'song-4', tipoItem: 'cancion' },
 { id: 'i-29', songId: 'song-2', tipoItem: 'cancion' }
 ]
 }
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
 currentUser
}: RepertorioSetlistsProps) {
 const { t } = useLanguage();
 const isStitchLight = colors.name?.toLowerCase().includes('light') || colors.bg.includes('f8fafc') || colors.bg.includes('white') || colors.bg.includes('slate-50') || false;
 const bName = bandName || 'Tu Banda';

 const cleanBand = (bandId || '').replace(/^(band|reg)-/, '').toLowerCase();
 const isBakandeya = cleanBand === 'bakandeya';

 // Plantilla de Bakandeya solo para la propia Bakandeya; el resto de bandas ven a sus
 // miembros reales (bandUsers, ya filtrados por banda en el servidor) y nunca el roster
 // de otra banda — este mismo bug (ver MemberNotesModal/PdfExportModal/SongModal más abajo)
 // hacía que cualquier banda viera hardcodeados los músicos de Bakandeya en "Repertorios".
 const bandRosterMembers: BandMemberOption[] = useMemo(() => {
   if (isBakandeya) return BAKANDEYA_DEMO_MEMBERS;
   return resolveBandMembers(bandUsers);
 }, [isBakandeya, bandUsers]);

 // Helper to filter out template songs for non-Bakandeya bands
 const sanitizeBandSongs = React.useCallback((rawList: Song[]): Song[] => {
   if (!Array.isArray(rawList)) return [];
   if (isBakandeya) return rawList;
   return rawList.filter(s => {
     if (!s || typeof s !== 'object') return false;
     const sId = (s.id || '').toLowerCase();
     if (sId.startsWith('song-cm-') || /^song-[1-8]$/.test(sId) || sId.startsWith('live_song_')) {
       return false;
     }
     return true;
   });
 }, [isBakandeya]);

 const sanitizeBandSetlists = React.useCallback((rawList: Setlist[]): Setlist[] => {
   if (!Array.isArray(rawList)) return [];
   if (isBakandeya) return rawList;
   return rawList.filter(sl => {
     if (!sl || typeof sl !== 'object') return false;
     const slId = (sl.id || '').toLowerCase();
     if (slId === 'setlist-1' || slId === 'setlist-2') return false;
     return true;
   });
 }, [isBakandeya]);

 // Navigation tab inside module
 const [showPdfPreview, setShowPdfPreview] = useState(false);
 const [activeTab, setActiveTab] = useState<'catalogo' | 'setlists' | 'discografia'>('setlists');
 // Plegado por defecto: la lista de setlists guardados ocupaba espacio permanentemente aunque
 // el usuario normalmente ya sabe con cuál está trabajando (ver activeSetlistId más abajo, que
 // recuerda el último setlist activo entre sesiones) — se despliega con un clic cuando hace falta.
 const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(true);

 // Sync activeTab with the view prop (when navigating from sidebar)
 useEffect(() => {
   if (view === 'catalogo') {
     setActiveTab('catalogo');
   } else if (view === 'discografia') {
     setActiveTab('discografia');
   } else {
     // repertorio, undefined, o el antiguo 'directo' (módulo eliminado) — aterriza en Repertorio
     // en vez de en una vista muerta.
     setActiveTab('setlists');
   }
 }, [view]);

 // Songs Repertoire State
 const [songs, setSongs] = useState<Song[]>(() => {
   try {
     const key = `band_songs_${cleanBand || 'default'}`;
     const saved = localStorage.getItem(key) || (isBakandeya ? localStorage.getItem('bakandeya_songs_catalog') : null);
     const parsed = saved ? JSON.parse(saved) : [];
     const sanitized = isBakandeya ? parsed : (Array.isArray(parsed) ? parsed.filter((s: any) => {
       const sId = (s?.id || '').toLowerCase();
       return !sId.startsWith('song-cm-') && !/^song-[1-8]$/.test(sId) && !sId.startsWith('live_song_');
     }) : []);
     if (sanitized.length > 0) {
       return sanitized;
     }
     return isBakandeya ? DEFAULT_SONGS : [];
   } catch {
     return isBakandeya ? DEFAULT_SONGS : [];
   }
 });

 // Setlists State
 const [setlists, setSetlists] = useState<Setlist[]>(() => {
   try {
     const key = `band_setlists_${cleanBand || 'default'}`;
     const saved = localStorage.getItem(key) || (isBakandeya ? localStorage.getItem('bakandeya_setlists') : null);
     const parsed = saved ? JSON.parse(saved) : [];
     const sanitized = isBakandeya ? parsed : (Array.isArray(parsed) ? parsed.filter((sl: any) => {
       const slId = (sl?.id || '').toLowerCase();
       return slId !== 'setlist-1' && slId !== 'setlist-2';
     }) : []);
     if (sanitized.length > 0) {
       return sanitized;
     }
     return isBakandeya ? DEFAULT_SETLISTS : [];
   } catch {
     return isBakandeya ? DEFAULT_SETLISTS : [];
   }
 });

 // Selected Active Setlist ID
 // Recuerda el último setlist con el que se trabajó entre sesiones/recargas, para no tener que
 // volver a buscarlo cada vez que se entra al módulo. Si el id guardado ya no existe (se borró
 // el setlist, o `setlists` aún no ha cargado en este render), activeSetlist más abajo ya cae a
 // setlists[0] como fallback — no hace falta validar aquí.
 const ACTIVE_SETLIST_STORAGE_KEY = 'bandmanager_active_setlist_id';
 const [activeSetlistId, setActiveSetlistId] = useState<string>(() => {
 try {
 const saved = localStorage.getItem(ACTIVE_SETLIST_STORAGE_KEY);
 if (saved) return saved;
 } catch {
 // localStorage puede no estar disponible (modo privado estricto, etc.)
 }
 return setlists[0]?.id || '';
 });

 useEffect(() => {
 if (!activeSetlistId) return;
 try {
 localStorage.setItem(ACTIVE_SETLIST_STORAGE_KEY, activeSetlistId);
 } catch {
 // Ignorado a propósito: perder la persistencia no debe romper la navegación.
 }
 }, [activeSetlistId]);

 const activeSetlist = useMemo(() => setlists.find(s => s.id === activeSetlistId) || setlists[0] || null, [setlists, activeSetlistId]);

 // Custom "quick add" shortcuts the band created itself for the "Rápidos" row below, on top of
 // the built-in ones (Presentación, Chapa, BIS...). Persisted per band in Supabase via
 // /api/setlist-shortcuts so every member of the band sees the same set.
 const [customShortcuts, setCustomShortcuts] = useState<SetlistShortcut[]>([]);
 const [isAddingShortcut, setIsAddingShortcut] = useState(false);
 const [newShortcutIcon, setNewShortcutIcon] = useState('⭐');
 const [newShortcutLabel, setNewShortcutLabel] = useState('');
 const [newShortcutMinutes, setNewShortcutMinutes] = useState<number>(1);

 const {
   shareModalData, setShareModalData,
   handleShareSetlist,
   handleShareSong,
 } = useShareModal(songs, bName);

 // Filter States for Catalog
 const {
   groupByAlbum, setGroupByAlbum,
   catalogSearch, setCatalogSearch,
   catalogAlbumFilter, setCatalogAlbumFilter,
   catalogStatusFilter, setCatalogStatusFilter,
   albumsList,
   filteredSongs,
 } = useCatalogFilters(songs);

 // Helper to parse"mm:ss" to seconds
 const parseMmSsToSeconds = (timeStr: string): number => {
 if (!timeStr) return 0;
 const parts = timeStr.trim().split(':');
 if (parts.length === 2) {
 const min = parseInt(parts[0], 10) || 0;
 const sec = parseInt(parts[1], 10) || 0;
 return min * 60 + sec;
 }
 const minOnly = parseInt(timeStr, 10) || 0;
 return minOnly * 60;
 };

 const {
   activePlayerSong, setActivePlayerSong,
   playerAutoPlay,
   playSignal,
   isPlayerPlaying, setIsPlayerPlaying,
   handleSelectPlayerSong,
 } = useAudioPlayer();

 // Concert Player (Reproductor de Concierto / Modo Escenario)
 const {
   stageAudioRef, stageAudioRefB,
   stagePlayingIndex, setStagePlayingIndex,
   stageIsPlaying, setStageIsPlaying,
   stageAutoplayNext, setStageAutoplayNext,
   stageCurrentTime, setStageCurrentTime,
   stageItemDuration,
   stageResolvedUrl,
   stageCrossfadeEnabled, setStageCrossfadeEnabled,
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
 // Catálogo/Discografía); "Reproducir desde aquí" en una fila de Repertorio la sustituye por las
 // canciones de ESE repertorio, en su orden. Se resetea a null (= catálogo) desde cualquier
 // entrada de reproducción que no venga de un repositorio.
 const [playerQueueOverride, setPlayerQueueOverride] = useState<Song[] | null>(null);
 const selectPlayerSongWithQueue = useCallback((song: Song | null, autoPlay: boolean = false, queue: Song[] | null = null) => {
   setPlayerQueueOverride(queue);
   handleSelectPlayerSong(song, autoPlay);
 }, [handleSelectPlayerSong]);

 // Song Modal State
 const [showSongModal, setShowSongModal] = useState(false);
 const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
 const [editingSong, setEditingSong] = useState<Song | null>(null);

 // Studio Ideas Modal State
 const [activeStudioSong, setActiveStudioSong] = useState<Song | null>(null);

 // Chords Viewer Modal State
 const [activeChordsSong, setActiveChordsSong] = useState<Song | null>(null);
 const [activeMemberNotesSong, setActiveMemberNotesSong] = useState<Song | null>(null);

 // Selected item in active setlist (for intelligent insertion beneath selected song)
 const [selectedSetlistItemId, setSelectedSetlistItemId] = useState<string | null>(null);
 // Mostrar/ocultar el Mapa de Energía del Show (visible por defecto: es la pieza más "wow")
 const [showEnergyMap, setShowEnergyMap] = useState<boolean>(true);
 // Curva "ideal" de referencia superpuesta al Mapa de Energía — visible por defecto, con su
 // propio toggle porque puede distraer una vez que ya conoces bien tu propio repertorio.
 const [showIdealCurve, setShowIdealCurve] = useState<boolean>(true);
 // Ajustes secundarios del gráfico (curva ideal, leyenda de colores) agrupados en un solo menú
 // "⚙️" en vez de ir cada uno como botón/fila propia — demasiadas opciones sueltas a la vista era
 // justo la queja: "estamos empezando a crear un monstruo con demasiadas opciones en pantalla".
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
 // único menú "⋯" en vez de tres botones de texto permanentes: no se usan en la mayoría de visitas.
 const [showSetlistActionsMenu, setShowSetlistActionsMenu] = useState(false);
 // Reproducir el concierto dentro de la pestaña Repertorio con la consola del reproductor
 // (antes vivía en la pestaña Directo, ahora está embebida en Repertorio con toggle)
 const [showConcertPlayer, setShowConcertPlayer] = useState(false);
 // Modal de análisis avanzado con IA
 const [showAIAnalysisModal, setShowAIAnalysisModal] = useState(false);
 // Modal del plan de "Setlist Perfecto" (reordenar + añadir/quitar canciones del catálogo + bloques)
 const [showPerfectSetlistModal, setShowPerfectSetlistModal] = useState(false);
 // Modal para importar un repertorio ya impreso desde una foto o PDF, analizado con IA
 const [showImportSetlistModal, setShowImportSetlistModal] = useState(false);
 // El plan se genera y aplica sobre una COPIA del setlist activo (ver handleGeneratePerfectSetlist),
 // nunca sobre el original — este estado vive en el padre, no en el modal, precisamente porque
 // generar el plan cambia qué setlist está activo (duplicado) y el modal no debe reiniciarse
 // (perder el plan a medio aplicar) solo porque activeSetlistId cambió por su propia acción.
 const [perfectSetlistPlan, setPerfectSetlistPlan] = useState<PerfectSetlistPlan | null>(null);
 const [perfectSetlistLoading, setPerfectSetlistLoading] = useState(false);
 const [perfectSetlistError, setPerfectSetlistError] = useState<string | null>(null);
 // Qué copia de trabajo ya existe para esta ronda de "Setlist Perfecto" — Diego pidió que
 // "Regenerar" no crease una copia nueva cada vez, así que se recuerda cuál ya se creó (por
 // ambos ids: el original del que salió y el propio id de la copia) y se reutiliza mientras no se
 // pida explícitamente una copia nueva. Solo se recuerda LA MÁS RECIENTE, no un historial por setlist.
 const [perfectSetlistDraft, setPerfectSetlistDraft] = useState<{ originalSetlistId: string; draftSetlistId: string } | null>(null);
 // Resultados del análisis IA guardados (para mostrar en la vista sin abrir modal)
 const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);
 const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
 // IDs de canciones a resaltar en el gráfico cuando se interactúa con sugerencias
 const [highlightedSongIds, setHighlightedSongIds] = useState<string[]>([]);
 // Snapshot del orden de items justo antes del ÚLTIMO reordenamiento (manual arrastrando, o por
 // "Aplicar" de un aviso/sugerencia) — permite un único "Deshacer" sobre ese cambio concreto.
 // Se sobrescribe con cada nuevo reordenamiento, así que solo cubre el más reciente, no un historial.
 // `sourceKey` identifica QUÉ acción generó este snapshot (p.ej. "ai-suggestion-2") — así el botón
 // "Aplicar" de esa sugerencia concreta puede convertirse en "Deshacer" solo mientras siga siendo
 // la acción más reciente (la única que este snapshot de un solo nivel puede revertir de verdad).
 const [undoReorderSnapshot, setUndoReorderSnapshot] = useState<{ setlistId: string; items: Setlist['items']; sourceKey: string } | null>(null);

 // Datos del Mapa de Energía, memoizados por setlist/repertorio real — si se recalculan en
 // cada render (p.ej. cada vez que cambia highlightedSongIds al hacer hover), Recharts ve un
 // array `data` con nueva referencia y remonta la animación entera desde cero (su `animationId`
 // depende de identidad de referencia, no de contenido), cancelando cualquier highlighting a
 // medio camino. Al depender solo de activeSetlist/songs, el gráfico no se re-anima por
 // interacciones de UI que no cambian los datos reales.
 const { energyAnalysis, chartData, yDomain, ZONAS_ENERGIA } = useMemo(() => {
  const analysis = analyzeSetlistEnergy(activeSetlist?.items || [], songs);
  // Curva de energía "ideal" de referencia (arco de pacing clásico, escalado al rango real de
  // este repertorio) — se pinta como segunda línea en el gráfico para ver de un vistazo dónde se
  // aleja más la curva real, sin depender de leer el texto del análisis.
  const idealCurve = calcularCurvaEnergiaIdeal(analysis.points);
  const data = analysis.points.map((pt, idx) => {
   // Chapa/presentación/interludio/pausa/bis/etc. — cualquier evento que no sea canción — no
   // representa energía real del show: el "bis" en concreto es solo la marca de "aquí empieza",
   // no una canción en sí (las canciones reales del bis puntúan por su cuenta justo después).
   // Contarlos como un punto más de la curva (con su score de relleno) dibujaba un "bajón" o un
   // pico falso ahí. Se marcan en el gráfico con su propia línea vertical (ver EnergyChart) en
   // vez de ensuciar la curva con un valor inventado.
   const isSpeechEvent = !pt.isSong;
   return {
    idx,
    id: pt.item.id,
    songId: isSpeechEvent ? undefined : pt.song?.id,
    name: pt.title,
    score: isSpeechEvent ? null : pt.score,
    idealScore: isSpeechEvent ? null : idealCurve[idx],
    range: [Math.max(1, pt.score - pt.variance), Math.min(20, pt.score + pt.variance)] as [number, number],
    color: pt.info.hexColor,
    icon: pt.info.icon,
    label: pt.info.label,
    variance: pt.variance,
    isSong: pt.isSong,
    isSpeechEvent
   };
  });

  // Dominio Y dinámico: se escala al propio setlist (no siempre 1-20) para que las
  // diferencias de energía entre temas se noten de verdad, no se aplasten en un rango fijo.
  // Los eventos de "speech" quedan fuera del cálculo — su rango de relleno (4±0) no debe estrechar
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
  // que convierte la curva en un "mapa" de verdad: se ve a simple vista en qué zona cae
  // cada canción, no solo por el color del punto sino por el propio fondo del chart.
  const zonas = [
   { min: 1, max: 8, color: '#0284c7' },
   { min: 9, max: 14, color: '#059669' },
   { min: 15, max: 18, color: '#a16207' },
   { min: 19, max: 20, color: '#a21caf' }
  ].map((z) => ({ ...z, y1: Math.max(z.min, domain[0]), y2: Math.min(z.max, domain[1]) }))
   .filter((z) => z.y1 < z.y2);

  return { energyAnalysis: analysis, chartData: data, yDomain: domain, ZONAS_ENERGIA: zonas };
 }, [activeSetlist, songs]);

 // Drag and Drop state for setlist items
 const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
 const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(null);
 const [expandedSetlistItemIds, setExpandedSetlistItemIds] = useState<Set<string>>(new Set());
 // Popover de energía manual (1-10 en UI, se guarda ×2 como energia 1-20): qué item de setlist
 // tiene el selector abierto ahora mismo, y estado de guardado para deshabilitar mientras dura.
 const [editingEnergyItemId, setEditingEnergyItemId] = useState<string | null>(null);
 const [savingEnergyItemId, setSavingEnergyItemId] = useState<string | null>(null);
 // Posición del popover, calculada al abrirlo a partir del botón real (getBoundingClientRect) y
 // pintada vía portal con position:fixed — antes el popover era position:absolute dentro de la
 // lista con scroll (overflow-y-auto), así que en canciones cerca del final del scroll quedaba
 // recortado/oculto por ese overflow ("hay que bajar" para verlo). openUpward se decide según si
 // queda hueco debajo del botón en el viewport.
 const [energyPopoverPos, setEnergyPopoverPos] = useState<{ top: number; left: number; openUpward: boolean } | null>(null);

 useEffect(() => {
   if (!editingEnergyItemId) return;
   const handleClickOutside = (e: MouseEvent) => {
     if (!(e.target as HTMLElement)?.closest?.('[data-energy-popover]')) {
       setEditingEnergyItemId(null);
     }
   };
   // Cerrar en scroll (de la lista o de la página): con position:fixed calculado una sola vez al
   // abrir, si el usuario sigue haciendo scroll el popover dejaría de estar junto a su botón.
   const handleScroll = () => setEditingEnergyItemId(null);
   document.addEventListener('mousedown', handleClickOutside);
   window.addEventListener('scroll', handleScroll, true);
   return () => {
     document.removeEventListener('mousedown', handleClickOutside);
     window.removeEventListener('scroll', handleScroll, true);
   };
 }, [editingEnergyItemId]);

 // Núcleo compartido: fija a mano la energía (1-20) de una canción, tanto desde el popover 1-10
 // de la fila (handleSetEnergiaManual) como desde el arrastre vertical en el propio gráfico
 // (handleEnergyChartDrag) — un solo sitio que llama al PATCH y actualiza el estado optimista.
 const handleSetEnergiaManualValue = async (song: Song, itemId: string, nuevaEnergia: number) => {
   setSavingEnergyItemId(itemId);
   // Optimista: refleja el cambio ya mismo en la UI y en el gráfico, sin esperar al servidor.
   setSongs(prev => prev.map(s => s.id === song.id ? { ...s, energia: nuevaEnergia, energiaManual: true } : s));
   try {
     await fetch(`/api/songs/${song.id}/energia`, {
       method: 'PATCH',
       headers: getHeaders(),
       body: JSON.stringify({ energia: nuevaEnergia })
     });
   } catch (err) {
     console.error('Error guardando energía manual:', err);
   } finally {
     setSavingEnergyItemId(null);
     setEditingEnergyItemId(null);
   }
 };

 const handleSetEnergiaManual = (song: Song, itemId: string, valor1a10: number) =>
   handleSetEnergiaManualValue(song, itemId, valor1a10 * 2);

 // Arrastrar un punto en vertical en el Mapa de Energía cambia su energía (1-20) directamente —
 // mismo resultado que el popover 1-10 de la fila, pero sin salir del gráfico. EnergyChart ya
 // filtra esto a puntos con songId (canciones reales, nunca eventos de "speech"/bis).
 const handleEnergyChartDrag = useCallback((point: EnergyChartPoint, newScore: number) => {
   if (!point.songId) return;
   const song = songs.find(s => s.id === point.songId);
   if (song) handleSetEnergiaManualValue(song, point.id, newScore);
   // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [songs]);

 // Deletion Confirmation Modal State
 const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
 title: string;
 description: string;
 onConfirm: () => void;
 } | null>(null);

 const [deleteAlbumData, setDeleteAlbumData] = useState<ConfirmDeleteAlbumData | null>(null);
 const [assignSongsModalData, setAssignSongsModalData] = useState<{ isOpen: boolean; albumName: string } | null>(null);
 const [setlistModalData, setSetlistModalData] = useState<{ isOpen: boolean; setlistToEdit: Setlist | null } | null>(null);
 const [isAddSongsModalOpen, setIsAddSongsModalOpen] = useState(false);
 const [statusBanner, setStatusBanner] = useState<{ text: string; type: 'loading' | 'success' | 'warning' | 'error' } | null>(null);
 const [defaultAlbumForNewSong, setDefaultAlbumForNewSong] = useState<string>('');
 const [selectedCatalogIds, setSelectedCatalogIds] = useState<Set<string>>(new Set());

 const sortedSongsByAlbumAndOrder = useMemo(() => {
   return [...songs].sort((a, b) => {
     const albumA = a.albumDisco || a.album || 'Z_SinDisco';
     const albumB = b.albumDisco || b.album || 'Z_SinDisco';
     if (albumA !== albumB) {
       return albumA.localeCompare(albumB);
     }
     const orderA = typeof a.ordenAlbum === 'number' ? a.ordenAlbum : 999;
     const orderB = typeof b.ordenAlbum === 'number' ? b.ordenAlbum : 999;
     if (orderA !== orderB) {
       return orderA - orderB;
     }
     return a.titulo.localeCompare(b.titulo);
   });
 }, [songs]);

 const handleUpdateSongFromChords = (updatedSong: Song) => {
 const updatedList = songs.map(s => s.id === updatedSong.id ? updatedSong : s);
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
 const updatedList = songs.map(s => s.id === updatedSong.id ? updatedSong : s);
 setSongs(updatedList);
 saveSongsToLocalStorageSafely(updatedList);
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
 body: JSON.stringify(updatedSong)
 }).catch(err => console.error("Error updating song on server:", err));
 };

 // Setlist Assign Modal State
 const [assigningSetlist, setAssigningSetlist] = useState<Setlist | null>(null);
 const [selectedConcertToAssign, setSelectedConcertToAssign] = useState<string>('');

 // Show Event / Interludio Modal State & Mic Recorder
 const [showShowItemModal, setShowShowItemModal] = useState(false);
 const [editingShowItem, setEditingShowItem] = useState<SetlistItem | null>(null);
 const [showItemAudioUrl, setShowItemAudioUrl] = useState<string>('');
 const [isRecordingShowItem, setIsRecordingShowItem] = useState<boolean>(false);
 const [recordingShowItemSecs, setRecordingShowItemSecs] = useState<number>(0);
 const showItemMediaRecorderRef = useRef<MediaRecorder | null>(null);
 const showItemChunksRef = useRef<Blob[]>([]);
 const showItemTimerRef = useRef<any>(null);


 const toggleFavoriteSong = (songId: string) => {
 setSongs(prevSongs => {
 const target = prevSongs.find(s => s.id === songId);
 const updated = prevSongs.map(s => s.id === songId ? { ...s, favoritoGeneral: !s.favoritoGeneral } : s);
 saveSongsToLocalStorageSafely(updated);
 if (target) {
 const updatedSong = { ...target, favoritoGeneral: !target.favoritoGeneral };
 fetch("/api/songs/" + songId, {
 method: "PUT",
 headers: getHeaders(),
 body: JSON.stringify(updatedSong)
 }).catch(err => console.error("Error updating favorite on server:", err));
 }
 return updated;
 });
 };

 // Save changes to localStorage and Backend API
 const getHeaders = () => {
 const token = localStorage.getItem('bakandeya_token');
 return {
 'Content-Type': 'application/json',
 ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
 ...(bandId ? { 'x-band-id': bandId } : {})
 };
 };

 useEffect(() => {
  let isCancelled = false;
  // On bandId change, immediately reset and load the clean cache for this band
  const keyS = `band_songs_${cleanBand || 'default'}`;
  const keySt = `band_setlists_${cleanBand || 'default'}`;
  try {
    const savedS = localStorage.getItem(keyS) || (isBakandeya ? localStorage.getItem('bakandeya_songs_catalog') : null);
    const parsedS = savedS ? JSON.parse(savedS) : [];
    const sanitizedS = sanitizeBandSongs(parsedS);
    setSongs(sanitizedS.length > 0 ? sanitizedS : (isBakandeya ? DEFAULT_SONGS : []));

    const savedSt = localStorage.getItem(keySt) || (isBakandeya ? localStorage.getItem('bakandeya_setlists') : null);
    const parsedSt = savedSt ? JSON.parse(savedSt) : [];
    const sanitizedSt = sanitizeBandSetlists(parsedSt);
    setSetlists(sanitizedSt.length > 0 ? sanitizedSt : (isBakandeya ? DEFAULT_SETLISTS : []));
    if (sanitizedSt.length > 0) {
      setActiveSetlistId(sanitizedSt[0].id);
    } else {
      setActiveSetlistId('');
    }
  } catch {
    setSongs(isBakandeya ? DEFAULT_SONGS : []);
    setSetlists(isBakandeya ? DEFAULT_SETLISTS : []);
  }

  const fetchRepertorio = async () => {
    try {
      const [resSongs, resSetlists] = await Promise.all([
        fetch('/api/songs', { headers: getHeaders() }),
        fetch('/api/setlists', { headers: getHeaders() })
      ]);

      if (isCancelled) return;

      if (resSongs.ok) {
        const dataS = await resSongs.json();
        if (dataS.songs && Array.isArray(dataS.songs)) {
          const sanitized = sanitizeBandSongs(dataS.songs);
          setSongs(sanitized);
        }
      }

      if (resSetlists.ok) {
        const dataSt = await resSetlists.json();
        if (dataSt.setlists && Array.isArray(dataSt.setlists)) {
          const sanitized = sanitizeBandSetlists(dataSt.setlists);
          setSetlists(sanitized);
          if (sanitized.length > 0) {
            setActiveSetlistId(prev => sanitized.some((s: any) => s.id === prev) ? prev : sanitized[0].id);
          } else {
            setActiveSetlistId('');
          }
        }
      }
    } catch (err) {
      console.warn('Unable to load repertorio from server API, using cached state:', err);
    }
  };

  fetchRepertorio();
  return () => {
    isCancelled = true;
  };
 }, [bandId, cleanBand, isBakandeya, sanitizeBandSongs, sanitizeBandSetlists]);

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
      const res = await fetch('/api/setlist-shortcuts', { headers: getHeaders() });
      if (isCancelled) return;
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.shortcuts)) {
          setCustomShortcuts(data.shortcuts);
        }
      }
    } catch (err) {
      console.warn('No se pudieron cargar los accesos rápidos de repertorio:', err);
    }
  };
  fetchShortcuts();
  return () => { isCancelled = true; };
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
 const audioBlob = new Blob(showItemChunksRef.current, { type: 'audio/webm' });
 const file = new File([audioBlob], `recording-show-${Date.now()}.webm`, { type: 'audio/webm' });
 try {
 const serverUrl = await uploadFileToServer(file);
 setShowItemAudioUrl(serverUrl);
 } catch (err) {
 console.error('Error uploading show item recording to server disk:', err);
 }
 stream.getTracks().forEach(track => track.stop());
 };

 mediaRecorder.start(100);
 setIsRecordingShowItem(true);
 setRecordingShowItemSecs(0);

 showItemTimerRef.current = setInterval(() => {
 setRecordingShowItemSecs(s => s + 1);
 }, 1000);
 } catch (err: any) {
 console.warn('Microphone access warning:', err?.message || err);
 alert('No se pudo acceder al micrófono (' + (err?.message || 'permisos denegados') + '). Por favor, comprueba los permisos de audio en tu navegador.');
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

 const handleShowItemAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
 console.error('Error uploading audio file for show item:', err);
 }
 };

 const syncSetlistToBackend = (updatedSetlist: Setlist) => {
 fetch(`/api/setlists/${updatedSetlist.id}`, {
 method: 'PUT',
 headers: getHeaders(),
 body: JSON.stringify(updatedSetlist)
 }).catch(err => console.error('Error updating setlist on server:', err));
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
 return '0 min';
 };

 // Calculate active setlist metrics (delegated to the shared, unit-tested helper)
 const activeSetlistMetrics = useMemo(() => {
 if (!activeSetlist) return { totalSeconds: 0, formattedTime: '0 min', songCount: 0, eventCount: 0, blockCount: 0, avgBpm: 0 };

 const songMap = new Map(songs.map(s => [s.id, s]));
 const stats = calculateSetlistStats(activeSetlist.items, songMap);

 return {
 totalSeconds: stats.totalDurationSeconds,
 formattedTime: formatSecondsToMinutes(stats.totalDurationSeconds),
 songCount: stats.songCount,
 eventCount: stats.eventCount,
 blockCount: stats.blockCount,
 avgBpm: stats.averageBpm
 };
 }, [activeSetlist, songs]);

 // Ask the backend to listen to a song's real audio and auto-fill its lyrics/chords (cifradoTexto).
 // Fires in the background after a song is saved with a new audio file, no extra click needed.
 const runAutoChordAnalysis = async (song: Song) => {
   if (!song.audioPrincipalUrl) return;

   // Si la subida cayó en uno de los fallbacks locales de audioStorage (IndexedDB o data URL),
   // el servidor no puede descargar ese audio, así que analizarlo daría un cifrado inventado
   // a partir del título. Mejor decirlo que fingir que se ha transcrito la grabación.
   if (!/^https?:\/\//i.test(song.audioPrincipalUrl) && !song.audioPrincipalUrl.startsWith('/')) {
     setStatusBanner({
       text: `El audio de "${song.titulo}" no llegó a subirse al servidor, así que no se pueden transcribir los acordes. Vuelve a subirlo.`,
       type: 'error'
     });
     setTimeout(() => setStatusBanner(null), 6000);
     return;
   }

   setStatusBanner({ text: `🎵 Analizando letra y acordes de "${song.titulo}" con IA…`, type: 'loading' });
   try {
     const res = await fetch('/api/generate-song-chords', {
       method: 'POST',
       headers: getHeaders(),
       body: JSON.stringify({
         songId: song.id,
         titulo: song.titulo,
         tonalidad: song.tonalidad,
         bpm: song.bpm,
         afinacion: song.afinacion,
         esVersionCovers: song.esVersionCovers,
         audioUrl: song.audioPrincipalUrl
       })
     });
     const data = await res.json();
     if (res.ok && data?.cifradoTexto) {
       const updatedSong = { ...song, cifradoTexto: data.cifradoTexto, guiaSustituto: data.guiaSustituto };
       setSongs(prev => {
         const next = prev.map(s => s.id === song.id ? { ...s, cifradoTexto: data.cifradoTexto, guiaSustituto: data.guiaSustituto } : s);
         saveSongsToLocalStorageSafely(next);
         return next;
       });

       // Si el servidor no pudo guardarlo, lo persistimos nosotros por la vía normal para que
       // el cifrado no se quede solo en esta pestaña y se pierda al recargar.
       if (!data.persisted) {
         fetch(`/api/songs/${encodeURIComponent(song.id)}`, {
           method: 'PUT',
           headers: getHeaders(),
           body: JSON.stringify(updatedSong)
         }).catch(err => console.error('Error persisting generated chords:', err));
       }

       // El backend distingue tres orígenes reales del cifrado para que este aviso nunca
       // haga pasar una plantilla genérica de relleno (cuando la IA falla del todo) por
       // una transcripción real o una propuesta honesta de la IA.
       if (data.chordsSource === 'audio_real') {
         setStatusBanner({
           text: `✓ Letra y acordes de "${song.titulo}" transcritos del audio`,
           type: 'success'
         });
       } else if (data.chordsSource === 'ia_sin_audio' && !data.esAproximado) {
         setStatusBanner({
           text: `✓ Cifrado propuesto por IA para "${song.titulo}" (no se pudo leer el audio: revísalo)`,
           type: 'success'
         });
       } else if (data.chordsSource === 'ia_sin_audio' && data.esAproximado) {
         setStatusBanner({
           text: `⚠️ Acordes aproximados de "${song.titulo}" (de memoria, sin audio ni certeza): verifícalos de oído antes de tocarlos`,
           type: 'warning'
         });
       } else {
         setStatusBanner({
           text: `⚠️ La IA no respondió: se ha puesto un cifrado de plantilla genérico en "${song.titulo}", revísalo antes de usarlo`,
           type: 'warning'
         });
       }
     } else {
       setStatusBanner({ text: `No se pudieron analizar los acordes de "${song.titulo}"`, type: 'error' });
     }
   } catch (err) {
     console.error('Error auto-generating chords from audio:', err);
     setStatusBanner({ text: `No se pudieron analizar los acordes de "${song.titulo}"`, type: 'error' });
   } finally {
     setTimeout(() => setStatusBanner(null), 4000);
   }
 };

 // Handle Add/Edit Song Form Submit
 const handleSaveSong = async (e: React.FormEvent<HTMLFormElement>) => {
 e.preventDefault();
 const formData = new FormData(e.currentTarget);
 const titulo = formData.get('titulo') as string;
 // La duración se introduce (y se autodetecta del audio) en dos campos separados, min y seg.
 const duracionMin = parseInt(formData.get('duracionMin') as string, 10) || 0;
 const duracionSeg = parseInt(formData.get('duracionSeg') as string, 10) || 0;
 const duracionSegundos = duracionMin * 60 + duracionSeg;
 const duracion = formatSecondsToMmSs(duracionSegundos);
 const tonalidad = (formData.get('tonalidad') as string) || 'Am';
 const bpm = parseInt(formData.get('bpm') as string, 10) || 120;
 const afinacion = formData.get('afinacion') as string;
 const albumDisco = formData.get('albumDisco') as string;
 const genero = (formData.get('genero') as string) || '';
 const tipo = (formData.get('tipo') as string) || 'propio';
 const energia = parseInt(formData.get('energia') as string, 10) || 5;
 const cantantePrincipal = (formData.get('cantantePrincipal') as string) || '';
 const estadoTema = (formData.get('estadoTema') as Song['estadoTema']) || 'listo';
 // "Cover / Versión" en el selector de tipo es la única fuente de este flag: evitamos
 // tener dos controles distintos que signifiquen lo mismo.
 const esVersionCovers = tipo === 'cover';
 const enlaceAcordes = (formData.get('enlaceAcordes') as string) || '';
 const notasInternas = formData.get('notasInternas') as string;
  const notasRepertorio = (formData.get('notasRepertorio') as string) || '';
  const notasMiembrosJson = formData.get('notasMiembrosJson') as string;
  let notasMiembros: Record<string, string> = editingSong?.notasMiembros || {};
  if (notasMiembrosJson) {
    try {
      notasMiembros = JSON.parse(notasMiembrosJson);
    } catch {
      // ignore
    }
  }
 let audioPrincipalUrl = (formData.get('audioPrincipalUrl') as string) || editingSong?.audioPrincipalUrl || '';
 let portadaUrl = (formData.get('portadaUrl') as string) || editingSong?.portadaUrl || '';

 const audioFile = formData.get('audioFile') as File;
 const hasNewAudio = Boolean(audioFile && audioFile.size > 0);
 if (hasNewAudio) {
   try {
     audioPrincipalUrl = await uploadFileToServer(audioFile);
   } catch (err) {
     console.error('Error reading uploaded audio file:', err);
   }
 }

 const portadaFile = formData.get('portadaFile') as File;
 if (portadaFile && portadaFile.size > 0) {
   try {
     portadaUrl = await uploadFileToServer(portadaFile);
   } catch (err) {
     console.error('Error reading uploaded portada file:', err);
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
 portadaUrl
 };
 setSongs(prev => {
   const next = prev.map(s => s.id === editingSong.id ? updatedSong : s);
   saveSongsToLocalStorageSafely(next);
   return next;
 });
 if (activePlayerSong?.id === editingSong.id) {
   setActivePlayerSong(updatedSong);
 }
 fetch(`/api/songs/${editingSong.id}`, {
 method: 'PUT',
 headers: getHeaders(),
 body: JSON.stringify(updatedSong)
 }).catch(err => console.error('Error updating song on server:', err));
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
 portadaUrl
 };
 setSongs(prev => {
   const next = [newSong, ...prev];
   saveSongsToLocalStorageSafely(next);
   return next;
 });
 fetch('/api/songs', {
 method: 'POST',
 headers: getHeaders(),
 body: JSON.stringify(newSong)
 }).catch(err => console.error('Error creating song on server:', err));
 if (hasNewAudio) runAutoChordAnalysis(newSong);
 }

 setShowSongModal(false);
 setEditingSong(null);
 };

 const handleDeleteSong = (songId: string) => {
 const song = songs.find(s => s.id === songId);
 setConfirmDeleteModal({
 title: 'Eliminar Canción',
 description: `¿Seguro que deseas eliminar "${song?.titulo || 'esta canción'}" del catálogo del grupo?`,
 onConfirm: () => {
 setSongs(prev => prev.filter(s => s.id !== songId));
 setSetlists(prev => prev.map(st => ({
 ...st,
 items: st.items.filter(it => it.songId !== songId)
 })));

 fetch(`/api/songs/${songId}`, {
 method: 'DELETE',
 headers: getHeaders()
 }).catch(err => console.error('Error deleting song on server:', err));
 }
 });
 };

 // Catalog multi-select: lets the user act on several songs at once instead of one by one
 const toggleCatalogSelect = (songId: string) => {
   setSelectedCatalogIds(prev => {
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
     title: 'Eliminar Canciones Seleccionadas',
     description: `¿Seguro que deseas eliminar ${songIds.length} canciones del catálogo del grupo? Se quitarán también de los repertorios donde aparezcan.`,
     onConfirm: () => {
       const idsSet = new Set(songIds);
       setSongs(prev => prev.filter(s => !idsSet.has(s.id)));
       setSetlists(prev => prev.map(st => ({
         ...st,
         items: st.items.filter(it => !it.songId || !idsSet.has(it.songId))
       })));
       songIds.forEach(songId => {
         fetch(`/api/songs/${songId}`, {
           method: 'DELETE',
           headers: getHeaders()
         }).catch(err => console.error('Error deleting song on server:', err));
       });
       clearCatalogSelection();
     }
   });
 };

 const handleBulkAddSelectedToSetlist = (songIds: string[]) => {
   if (songIds.length === 0) return;
   if (!activeSetlist) {
     setStatusBanner({ text: 'Selecciona o crea primero un repertorio en la pestaña "Setlists & Directos" para añadir estas canciones.', type: 'error' });
     setTimeout(() => setStatusBanner(null), 5000);
     return;
   }
   handleAddMultipleSongsToSetlist(songIds);
   setStatusBanner({ text: `✓ ${songIds.length} canciones añadidas a "${activeSetlist.nombre}"`, type: 'success' });
   setTimeout(() => setStatusBanner(null), 4000);
   clearCatalogSelection();
 };

 const handleToggleFavorite = (songId: string) => {
   const updated = songs.map(s => {
     if (s.id === songId) {
       const isFav = !s.favoritoGeneral;
       const updatedSong = { ...s, favoritoGeneral: isFav };
       fetch(`/api/songs/${s.id}`, {
         method: 'PUT',
         headers: getHeaders(),
         body: JSON.stringify(updatedSong)
       }).catch(err => console.error('Error toggling favorite on server:', err));
       return updatedSong;
     }
     return s;
   });
   setSongs(updated);
   saveSongsToLocalStorageSafely(updated);
 };

 const handleUnassignAlbumSongs = (albumName: string) => {
   const updatedSongs = songs.map(s => {
     if ((s.albumDisco || 'Singles / Sin Disco') === albumName || s.albumDisco === albumName) {
       return { ...s, albumDisco: '' };
     }
     return s;
   });
   setSongs(updatedSongs);
   saveSongsToLocalStorageSafely(updatedSongs);

   updatedSongs
     .filter(s => (s.albumDisco || 'Singles / Sin Disco') === albumName || s.albumDisco === albumName)
     .forEach(s => {
       fetch(`/api/songs/${s.id}`, {
         method: 'PUT',
         headers: getHeaders(),
         body: JSON.stringify(s)
       }).catch(err => console.error('Error updating song album on server:', err));
     });
 };

 const handleDeleteAlbumAndSongs = (albumName: string) => {
   const songsToDelete = songs.filter(s => (s.albumDisco || 'Singles / Sin Disco') === albumName || s.albumDisco === albumName);
   const idsToDelete = new Set(songsToDelete.map(s => s.id));

   const updatedSongs = songs.filter(s => !idsToDelete.has(s.id));
   setSongs(updatedSongs);
   saveSongsToLocalStorageSafely(updatedSongs);

   setSetlists(prev => prev.map(st => ({
     ...st,
     items: st.items.filter(it => !idsToDelete.has(it.songId))
   })));

   songsToDelete.forEach(s => {
     fetch(`/api/songs/${s.id}`, {
       method: 'DELETE',
       headers: getHeaders()
     }).catch(err => console.error('Error deleting song on server:', err));
   });
 };

 const handleSaveAlbumSongs = (albumName: string, selectedSongIds: string[]) => {
   const selectedSet = new Set(selectedSongIds);
   const updatedSongs = songs.map(s => {
     const isCurrentlyInAlbum = (s.albumDisco || 'Singles / Sin Disco') === albumName || s.albumDisco === albumName;
     if (selectedSet.has(s.id)) {
       return { ...s, albumDisco: albumName };
     } else if (isCurrentlyInAlbum) {
       return { ...s, albumDisco: '' };
     }
     return s;
   });

   setSongs(updatedSongs);
   saveSongsToLocalStorageSafely(updatedSongs);

   updatedSongs.forEach(s => {
     fetch(`/api/songs/${s.id}`, {
       method: 'PUT',
       headers: getHeaders(),
       body: JSON.stringify(s)
     }).catch(err => console.error('Error updating song album on server:', err));
   });
 };

 const handleReorderAlbumTrack = (albumName: string, songId: string, direction: 'up' | 'down') => {
   const albumSongs = songs
     .filter(s => (s.albumDisco || 'Singles / Sin Disco') === albumName)
     .sort((a, b) => (a.ordenAlbum ?? 0) - (b.ordenAlbum ?? 0));

   const index = albumSongs.findIndex(s => s.id === songId);
   if (index === -1) return;

   const targetIndex = direction === 'up' ? index - 1 : index + 1;
   if (targetIndex < 0 || targetIndex >= albumSongs.length) return;

   const newAlbumSongs = [...albumSongs];
   const temp = newAlbumSongs[index];
   newAlbumSongs[index] = newAlbumSongs[targetIndex];
   newAlbumSongs[targetIndex] = temp;

   const orderMap = new Map<string, number>();
   newAlbumSongs.forEach((song, idx) => {
     orderMap.set(song.id, idx + 1);
   });

   const updatedSongs = songs.map(s => {
     if (orderMap.has(s.id)) {
       return { ...s, ordenAlbum: orderMap.get(s.id) };
     }
     return s;
   });

   setSongs(updatedSongs);
   saveSongsToLocalStorageSafely(updatedSongs);

   newAlbumSongs.forEach(s => {
     const updated = { ...s, ordenAlbum: orderMap.get(s.id) };
     fetch(`/api/songs/${s.id}`, {
       method: 'PUT',
       headers: getHeaders(),
       body: JSON.stringify(updated)
     }).catch(err => console.error('Error updating song order on server:', err));
   });
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
   tipoFormato: Setlist['tipoFormato'];
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
               fechaUltimaEdicion: new Date().toISOString().split('T')[0],
             }
           : s
       )
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
         method: 'PUT',
         headers: getHeaders(),
         body: JSON.stringify(payload),
       }).catch((err) => console.error('Error updating setlist:', err));
     }
   } else {
     const newSetlist: Setlist = {
       id: `setlist-${Date.now()}`,
       nombre: setlistData.nombre,
       descripcion: setlistData.descripcion || 'Nuevo repertorio para directo',
       tipoFormato: setlistData.tipoFormato || 'festival',
       duracionTotalEstimadaMinutos: 45,
       fechaCreacion: new Date().toISOString().split('T')[0],
       fechaUltimaEdicion: new Date().toISOString().split('T')[0],
       items: [],
     };
     setSetlists((prev) => [newSetlist, ...prev]);
     setActiveSetlistId(newSetlist.id);

     fetch('/api/setlists', {
       method: 'POST',
       headers: getHeaders(),
       body: JSON.stringify(newSetlist),
     }).catch((err) => console.error('Error creating setlist on server:', err));
   }
 };

 const handleOldSetlist = () => {
 const name = prompt('Nombre para el nuevo repertorio:', 'Festival Verano 2026');
 if (!name || !name.trim()) return;

 const newSetlist: Setlist = {
 id: `setlist-${Date.now()}`,
 nombre: name.trim(),
 descripcion: 'Nuevo repertorio para directo',
 tipoFormato: 'festival',
 duracionTotalEstimadaMinutos: 45,
 fechaCreacion: new Date().toISOString().split('T')[0],
 fechaUltimaEdicion: new Date().toISOString().split('T')[0],
 items: songs.filter(s => s.favoritoGeneral).map((s, idx) => ({
 id: `it-${Date.now()}-${idx}`,
 songId: s.id,
 tipoItem: 'cancion'
 }))
 };

 setSetlists(prev => [newSetlist, ...prev]);
 setActiveSetlistId(newSetlist.id);

 fetch('/api/setlists', {
 method: 'POST',
 headers: getHeaders(),
 body: JSON.stringify(newSetlist)
 }).catch(err => console.error('Error creating setlist on server:', err));
 };

 const handleDuplicateSetlist = (st: Setlist, nameSuffix: string = '(Copia)'): Setlist => {
 const duplicated: Setlist = {
 ...st,
 id: `setlist-${Date.now()}`,
 nombre: `${st.nombre} ${nameSuffix}`,
 fechaCreacion: new Date().toISOString().split('T')[0],
 fechaUltimaEdicion: new Date().toISOString().split('T')[0],
 items: st.items.map(it => ({ ...it, id: `it-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` }))
 };
 setSetlists(prev => [duplicated, ...prev]);
 setActiveSetlistId(duplicated.id);

 fetch('/api/setlists', {
 method: 'POST',
 headers: getHeaders(),
 body: JSON.stringify(duplicated)
 }).catch(err => console.error('Error duplicating setlist on server:', err));

 return duplicated;
 };

 const handleDeleteSetlist = (stId: string) => {
 const st = setlists.find(s => s.id === stId);
 setConfirmDeleteModal({
 title: 'Eliminar Repertorio',
 description: `¿Seguro que deseas eliminar el repertorio "${st?.nombre || 'este repertorio'}"?`,
 onConfirm: () => {
 const remaining = setlists.filter(s => s.id !== stId);
 setSetlists(remaining);
 if (activeSetlistId === stId) {
 setActiveSetlistId(remaining[0]?.id || '');
 }
 // Si se borra justo la copia de trabajo de "Setlist Perfecto" (o su original), esa referencia
 // ya no vale — la próxima vez que se pida el plan, se creará una copia nueva desde cero.
 if (perfectSetlistDraft && (perfectSetlistDraft.draftSetlistId === stId || perfectSetlistDraft.originalSetlistId === stId)) {
 setPerfectSetlistDraft(null);
 }

 fetch(`/api/setlists/${stId}`, {
 method: 'DELETE',
 headers: getHeaders()
 }).catch(err => console.error('Error deleting setlist on server:', err));
 }
 });
 };

 // Setlist Item Manipulation & Agile Reordering (Drag & Drop) — lógica pura, parametrizada por
 // índices en vez de leer el estado de arrastre de la lista (draggedItemIndex), para poder
 // reutilizarla también desde el drag horizontal sobre el Mapa de Energía (ver EnergyChart).
 //
 // Punto único que de verdad escribe un array de items nuevo — reordenar, quitar una canción,
 // añadir una del catálogo o insertar un bloque son todos casos de "sustituir items por otro
 // array", así que todos pasan por aquí para compartir el snapshot de "Deshacer" (sourceKey
 // identifica qué acción lo generó) y el guardado/sync.
 const applySetlistItemsChange = (newItems: SetlistItem[], sourceKey: string) => {
   if (!activeSetlist) return;

   setUndoReorderSnapshot({ setlistId: activeSetlist.id, items: activeSetlist.items, sourceKey });

   const updatedSetlist: Setlist = {
     ...activeSetlist,
     fechaUltimaEdicion: new Date().toISOString().split('T')[0],
     items: newItems
   };

   setSetlists(prev => {
     const next = prev.map(st => st.id === activeSetlist.id ? updatedSetlist : st);
     saveSetlistsToLocalStorageSafely(next);
     return next;
   });
   syncSetlistToBackend(updatedSetlist);
 };

 const reorderSetlistItems = (fromIndex: number, toIndex: number, sourceKey: string = 'manual') => {
   if (!activeSetlist || fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
   const newItems = [...activeSetlist.items];
   const [movedItem] = newItems.splice(fromIndex, 1);
   newItems.splice(toIndex, 0, movedItem);
   applySetlistItemsChange(newItems, sourceKey);
 };

 // Quita el item en `index` (usado por el plan de "Setlist Perfecto" para retirar una canción que
 // no encaja — a diferencia de handleRemoveSetlistItem, que borra por id desde la lista visual,
 // esto trabaja por índice porque así es como el plan referencia sus posiciones).
 const removeSetlistItemAtIndex = (index: number, sourceKey: string) => {
   if (!activeSetlist || index < 0 || index >= activeSetlist.items.length) return;
   const newItems = activeSetlist.items.filter((_, i) => i !== index);
   applySetlistItemsChange(newItems, sourceKey);
 };

 // Inserta una canción del catálogo en `insertIndex` — variante de handleAddItemToSetlist que
 // inserta en una posición concreta (la que propuso el plan) en vez de tras el item seleccionado.
 const insertSongAtIndex = (songId: string, insertIndex: number, sourceKey: string) => {
   if (!activeSetlist) return;
   const newItem: SetlistItem = {
     id: `it-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
     tipoItem: 'cancion',
     songId
   };
   const newItems = [...activeSetlist.items];
   const clampedIndex = Math.max(0, Math.min(insertIndex, newItems.length));
   newItems.splice(clampedIndex, 0, newItem);
   applySetlistItemsChange(newItems, sourceKey);
 };

 // Inserta un bloque (presentación, pausa, bis...) en `insertIndex` — el plan de "Setlist
 // Perfecto" ya viene con block_type validado contra los tipoItem reales, así que aquí no hace
 // falta repetir los defaults por tipo que sí tiene handleAddItemToSetlist para el editor manual.
 const insertBlockAtIndex = (
   tipoItem: SetlistItem['tipoItem'],
   tituloCustom: string,
   duracionEstimadaMinutos: number | undefined,
   insertIndex: number,
   sourceKey: string
 ) => {
   if (!activeSetlist) return;
   const newItem: SetlistItem = {
     id: `it-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
     tipoItem,
     tituloCustom,
     duracionEstimadaMinutos,
     duracionEstimadaSegundos: duracionEstimadaMinutos ? Math.round(duracionEstimadaMinutos * 60) : undefined
   };
   const newItems = [...activeSetlist.items];
   const clampedIndex = Math.max(0, Math.min(insertIndex, newItems.length));
   newItems.splice(clampedIndex, 0, newItem);
   applySetlistItemsChange(newItems, sourceKey);
 };

 // Ejecuta UNA acción concreta del plan de "Setlist Perfecto" — cada acción ya viene validada por
 // el servidor (posiciones dentro de rango, catalog_index resuelto a un song_id real, block_type
 // dentro del enum), así que aquí solo se traduce cada tipo a la función que ya mueve/inserta/quita.
 const applyPerfectSetlistAction = (action: PerfectSetlistAction, sourceKey: string) => {
   switch (action.type) {
     case 'reorder':
       if (action.from_position != null && action.to_position != null) {
         reorderSetlistItems(action.from_position - 1, action.to_position - 1, sourceKey);
       }
       break;
     case 'remove_song':
       if (action.item_position != null) {
         removeSetlistItemAtIndex(action.item_position - 1, sourceKey);
       }
       break;
     case 'add_song':
       if (action.song_id && action.insert_at_position != null) {
         insertSongAtIndex(action.song_id, action.insert_at_position - 1, sourceKey);
       }
       break;
     case 'add_block':
       if (action.block_type && action.insert_at_position != null) {
         insertBlockAtIndex(action.block_type as SetlistItem['tipoItem'], action.title || 'Nuevo bloque', action.duracion_minutos, action.insert_at_position - 1, sourceKey);
       }
       break;
   }
 };

 // Genera el plan de "Setlist Perfecto" y, la PRIMERA vez, duplica el setlist ANTES de que se
 // pueda aplicar ninguna acción — para no arriesgar el original. Pero "Regenerar" no debe crear
 // una copia nueva cada vez (eso fue justo la queja: demasiadas copias) — mientras el usuario siga
 // trabajando sobre el mismo original (o ya esté sobre la copia), se reutiliza esa misma copia y
 // el plan nuevo se calcula contra SU estado actual (con lo que ya se haya aplicado). Solo se crea
 // una copia nueva si no existe ninguna todavía para este setlist, o si se pide explícitamente
 // (`forceNewCopy`, botón "Nueva copia" del modal).
 const handleGeneratePerfectSetlist = async (forceNewCopy: boolean = false, feedback?: SetlistFeedbackInput) => {
   if (!activeSetlist) return;

   const existingDraft = !forceNewCopy && perfectSetlistDraft && (
     perfectSetlistDraft.draftSetlistId === activeSetlist.id ||
     perfectSetlistDraft.originalSetlistId === activeSetlist.id
   ) ? perfectSetlistDraft : null;

   // Si el usuario volvió al setlist ORIGINAL (no a la copia) pero ya existe una copia de una
   // ronda anterior, se retoma esa copia en vez de generar/duplicar desde el original de nuevo.
   let targetSetlist = activeSetlist;
   if (existingDraft && existingDraft.draftSetlistId !== activeSetlist.id) {
     const draft = setlists.find(s => s.id === existingDraft.draftSetlistId);
     if (draft) {
       targetSetlist = draft;
       setActiveSetlistId(draft.id);
     }
   }

   setPerfectSetlistLoading(true);
   setPerfectSetlistError(null);
   try {
     const result = await api.generatePerfectSetlist(targetSetlist.id, feedback);
     if (result.success && result.plan) {
       if (!existingDraft) {
         const copy = handleDuplicateSetlist(targetSetlist, '(Setlist Perfecto)');
         setPerfectSetlistDraft({ originalSetlistId: targetSetlist.id, draftSetlistId: copy.id });
       }
       setPerfectSetlistPlan(result.plan);
     } else {
       setPerfectSetlistError(result.error || 'Error al generar el plan');
     }
   } catch (err: any) {
     setPerfectSetlistError(err.message || 'Error desconocido');
   } finally {
     setPerfectSetlistLoading(false);
   }
 };

 const canUndoReorder = !!undoReorderSnapshot && undoReorderSnapshot.setlistId === activeSetlist?.id;
 // Qué acción concreta es la que "Deshacer" revertiría ahora mismo — null si no hay nada que
 // deshacer, o si el setlist activo cambió desde entonces. Solo la acción que dejó este snapshot
 // (la más reciente) puede mostrar su propio botón como "Deshacer" en vez de "Aplicar"/"Aplicado".
 const undoSourceKey = canUndoReorder ? undoReorderSnapshot!.sourceKey : null;

 const undoLastReorder = () => {
   if (!activeSetlist || !undoReorderSnapshot || undoReorderSnapshot.setlistId !== activeSetlist.id) return;

   const restoredSetlist: Setlist = {
     ...activeSetlist,
     fechaUltimaEdicion: new Date().toISOString().split('T')[0],
     items: undoReorderSnapshot.items
   };

   setSetlists(prev => {
     const next = prev.map(st => st.id === activeSetlist.id ? restoredSetlist : st);
     saveSetlistsToLocalStorageSafely(next);
     return next;
   });
   syncSetlistToBackend(restoredSetlist);
   setUndoReorderSnapshot(null);
 };

 const handleDropItem = (targetIndex: number) => {
   if (draggedItemIndex !== null) reorderSetlistItems(draggedItemIndex, targetIndex);
   setDraggedItemIndex(null);
   setDragOverItemIndex(null);
 };

 const handleAddItemToSetlist = (
  songId?: string, 
  tipoItem: SetlistItem['tipoItem'] = 'cancion',
  tituloCustom?: string,
  duracionEstimadaMinutos?: number,
  duracionEstimadaSegundos?: number,
  notaTema?: string,
  insertAfterId?: string | null
 ) => {
  if (!activeSetlist) return;

  const newItem: SetlistItem = {
   id: `it-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
   tipoItem,
   songId,
   tituloCustom,
   duracionEstimadaMinutos,
   duracionEstimadaSegundos,
   notaTema
  };

  if (!tituloCustom) {
   if (tipoItem === 'bloque_header') {
    newItem.tituloCustom = '⚡ Nuevo Bloque / Sección del Show';
   } else if (tipoItem === 'presentacion') {
    newItem.tituloCustom = 'Presentación Banda & Saludo';
    newItem.duracionEstimadaMinutos = 2;
    newItem.duracionEstimadaSegundos = 120;
   } else if (tipoItem === 'beatbox') {
    newItem.tituloCustom = 'Solo de Batería / Percusión';
    newItem.duracionEstimadaMinutos = 2;
    newItem.duracionEstimadaSegundos = 120;
   } else if (tipoItem === 'intro_tema') {
    newItem.tituloCustom = 'Intro / Historia del Tema';
    newItem.duracionEstimadaMinutos = 1;
    newItem.duracionEstimadaSegundos = 60;
   } else if (tipoItem === 'solo_performance') {
    newItem.tituloCustom = 'Solo Instrumental / Jam';
    newItem.duracionEstimadaMinutos = 2;
    newItem.duracionEstimadaSegundos = 120;
   } else if (tipoItem === 'cambio_instrumento') {
    newItem.tituloCustom = 'Cambio Instrumento & Afinación';
    newItem.duracionEstimadaMinutos = 1;
    newItem.duracionEstimadaSegundos = 60;
   } else if (tipoItem === 'chapa') {
    newItem.tituloCustom = 'Chapa / Discurso con Público';
    newItem.duracionEstimadaMinutos = 2;
    newItem.duracionEstimadaSegundos = 120;
   } else if (tipoItem === 'descanso') {
    newItem.tituloCustom = 'Pausa / Intermedio / Agua';
    newItem.duracionEstimadaMinutos = 2;
    newItem.duracionEstimadaSegundos = 120;
   } else if (tipoItem === 'bis') {
    newItem.tituloCustom = '💣 BIS / PARTE FINAL DEL SHOW';
    newItem.duracionEstimadaMinutos = 1;
    newItem.duracionEstimadaSegundos = 60;
   }
  }

  const targetRefId = insertAfterId !== undefined ? insertAfterId : selectedSetlistItemId;
  let newItems: SetlistItem[];
  if (targetRefId) {
    const idx = activeSetlist.items.findIndex(it => it.id === targetRefId);
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
   fechaUltimaEdicion: new Date().toISOString().split('T')[0],
   items: newItems
  };

  setSetlists(prev => {
    const next = prev.map(st => st.id === activeSetlist.id ? updatedSetlist : st);
    saveSetlistsToLocalStorageSafely(next);
    return next;
  });
  syncSetlistToBackend(updatedSetlist);
  setSelectedSetlistItemId(newItem.id);
 };

 // Inserts a band-created custom shortcut into the active setlist as a generic ('otro') item
 const handleUseCustomShortcut = (sc: SetlistShortcut) => {
  handleAddItemToSetlist(undefined, 'otro', sc.tituloCustom, sc.duracionEstimadaMinutos, sc.duracionEstimadaSegundos, sc.notaTema);
 };

 const handleCreateShortcut = async () => {
  const etiqueta = newShortcutLabel.trim();
  if (!etiqueta) return;
  try {
    const res = await fetch('/api/setlist-shortcuts', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        icono: newShortcutIcon.trim() || '⭐',
        etiqueta,
        tituloCustom: etiqueta,
        duracionEstimadaMinutos: newShortcutMinutes,
        duracionEstimadaSegundos: newShortcutMinutes * 60
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.shortcut) {
        setCustomShortcuts(prev => [...prev, data.shortcut]);
      }
    }
  } catch (err) {
    console.error('Error al crear el acceso rápido:', err);
  } finally {
    setNewShortcutLabel('');
    setNewShortcutIcon('⭐');
    setNewShortcutMinutes(1);
    setIsAddingShortcut(false);
  }
 };

 const handleDeleteShortcut = async (id: string) => {
  setCustomShortcuts(prev => prev.filter(sc => sc.id !== id));
  try {
    await fetch(`/api/setlist-shortcuts/${id}`, { method: 'DELETE', headers: getHeaders() });
  } catch (err) {
    console.error('Error al eliminar el acceso rápido:', err);
  }
 };

 // Add several catalog songs to the active setlist in a single action/save
 const handleAddMultipleSongsToSetlist = (songIds: string[]) => {
  if (!activeSetlist || songIds.length === 0) return;

  const newSongItems: SetlistItem[] = songIds.map(songId => ({
   id: `it-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
   tipoItem: 'cancion',
   songId
  }));

  const targetRefId = selectedSetlistItemId;
  let newItems: SetlistItem[];
  if (targetRefId) {
    const idx = activeSetlist.items.findIndex(it => it.id === targetRefId);
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
   fechaUltimaEdicion: new Date().toISOString().split('T')[0],
   items: newItems
  };

  setSetlists(prev => {
    const next = prev.map(st => st.id === activeSetlist.id ? updatedSetlist : st);
    saveSetlistsToLocalStorageSafely(next);
    return next;
  });
  syncSetlistToBackend(updatedSetlist);
  setSelectedSetlistItemId(newSongItems[newSongItems.length - 1].id);
 };

 const handleSaveShowItem = (itemData: Partial<SetlistItem>) => {
  if (!activeSetlist) return;

  let updatedItems: SetlistItem[];

  if (editingShowItem) {
   updatedItems = activeSetlist.items.map(it => 
    it.id === editingShowItem.id ? { ...it, ...itemData, audioUrl: showItemAudioUrl } : it
   );
  } else {
   const newItem: SetlistItem = {
    id: `it-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    tipoItem: itemData.tipoItem || 'chapa',
    tituloCustom: itemData.tituloCustom || 'Evento del Show',
    duracionEstimadaMinutos: itemData.duracionEstimadaMinutos || 2,
    duracionEstimadaSegundos: itemData.duracionEstimadaSegundos || 120,
    notaTema: itemData.notaTema || '',
    audioUrl: showItemAudioUrl
   };

   if (selectedSetlistItemId) {
     const idx = activeSetlist.items.findIndex(it => it.id === selectedSetlistItemId);
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
   fechaUltimaEdicion: new Date().toISOString().split('T')[0],
   items: updatedItems
  };

  setSetlists(prev => {
   const next = prev.map(st => st.id === activeSetlist.id ? updatedSetlist : st);
   saveSetlistsToLocalStorageSafely(next);
   return next;
  });
  syncSetlistToBackend(updatedSetlist);
  setShowShowItemModal(false);
  setEditingShowItem(null);
  setShowItemAudioUrl('');
 };

 const handleRemoveSetlistItem = (itemId: string) => {
 if (!activeSetlist) return;
 const updatedSetlist: Setlist = {
 ...activeSetlist,
 fechaUltimaEdicion: new Date().toISOString().split('T')[0],
 items: activeSetlist.items.filter(it => it.id !== itemId)
 };

 setSetlists(prev => prev.map(st => st.id === activeSetlist.id ? updatedSetlist : st));
 syncSetlistToBackend(updatedSetlist);
 };

 const handleUpdateItemNote = (itemId: string, note: string) => {
 if (!activeSetlist) return;
 const updatedSetlist: Setlist = {
 ...activeSetlist,
 items: activeSetlist.items.map(it => it.id === itemId ? { ...it, notaTema: note } : it)
 };

 setSetlists(prev => prev.map(st => st.id === activeSetlist.id ? updatedSetlist : st));
 syncSetlistToBackend(updatedSetlist);
 };

 // Assign setlist to concert or rehearsal
 const handleAssignSetlistToConcert = () => {
 if (!assigningSetlist || !selectedConcertToAssign) return;
 
 // Check if it's a concert or rehearsal
 const concertMatch = concerts.find(c => c.id === selectedConcertToAssign);
 if (concertMatch && onUpdateConcert) {
 onUpdateConcert(concertMatch.id, { setlistId: assigningSetlist.id });
 alert(`Repertorio"${assigningSetlist.nombre}" asignado con éxito al concierto en ${concertMatch.sala} (${concertMatch.ciudad}).`);
 } else {
 const rehMatch = rehearsals.find(r => r.id === selectedConcertToAssign);
 if (rehMatch && onUpdateRehearsal) {
 onUpdateRehearsal(rehMatch.id, { setlistId: assigningSetlist.id });
 alert(`Repertorio"${assigningSetlist.nombre}" asignado con éxito al ensayo de ${rehMatch.fecha}.`);
 }
 }
 setAssigningSetlist(null);
 };

 // Print Stage Setlist
 const handlePrintStageSetlist = () => {
 if (!activeSetlist) return;
 const printWindow = window.open('', '_blank');
 if (!printWindow) return;

 printWindow.document.write(`
 <!DOCTYPE html>
 <html>
 <head>
 <title>SETLIST BAKANDEYA - ${activeSetlist.nombre}</title>
 <style>
 body { 
 font-family: system-ui, -apple-system, sans-serif; 
 margin: 20px; 
 background: #000; 
 color: #fff; 
 }
 .header { 
 -bottom: 4px solid #f2ca50; 
 padding-bottom: 15px; 
 margin-bottom: 25px; 
 display: flex; 
 justify-content: space-between; 
 align-items: center; 
 }
 h1 { font-size: 32px; text-transform: uppercase; margin: 0; color: #f2ca50; letter-spacing: 2px; }
 .meta { font-size: 16px; font-family: monospace; color: #aaa; }
 .set-table { width: 100%; -collapse: collapse; }
 .set-table th { 
 text-align: left; 
 padding: 10px; 
 -bottom: 2px solid #444; 
 font-size: 14px; 
 text-transform: uppercase; 
 color: #888; 
 }
 .set-table td { 
 padding: 14px 10px; 
 border-bottom: 1px solid #222; 
 font-size: 22px; 
 font-weight: bold; 
 }
 .num { color: #f2ca50; width: 40px; font-family: monospace; }
 .key-badge { 
 display: inline-block; 
 background: #222; 
 color: #10b981; 
 padding: 4px 10px; 
 border-radius: 6px; 
 font-size: 18px; 
 font-family: monospace; 
 }
 .bpm { color: #888; font-size: 16px; font-family: monospace; }
 .chapa { color: #f59e0b; font-style: italic; font-size: 18px; }
 .bis { color: #ec4899; text-transform: uppercase; font-size: 20px; text-align: center; }
 .note { display: block; font-size: 13px; color: #aaa; font-weight: normal; margin-top: 4px; font-style: italic; }
 .footer { margin-top: 30px; font-size: 12px; font-family: monospace; color: #666; text-align: center; }
 </style>
 </head>
 <body>
 <div class="header">
 <div>
 <h1>BAKANDEYA — SETLIST</h1>
 <div class="meta">${activeSetlist.nombre} (${activeSetlistMetrics.formattedTime} • ${activeSetlistMetrics.songCount} Temas)</div>
 </div>
 <div style="font-size:20px; font-weight:bold; color:#10b981; font-family:monospace;">
 AVG BPM: ${activeSetlistMetrics.avgBpm}
 </div>
 </div>

 <table class="set-table">
 <thead>
 <tr>
 <th style="width:40px;">#</th>
 <th>TÍTULO DEL TEMA</th>
 <th style="width:100px;">TONO</th>
 <th style="width:80px;">BPM</th>
 <th style="width:80px;">TIEMPO</th>
 </tr>
 </thead>
 <tbody>
 ${activeSetlist.items.map((it, idx) => {
 if (it.tipoItem === 'cancion' && it.songId) {
 const s = songs.find(x => x.id === it.songId);
 if (!s) return '';
 return `
 <tr>
 <td class="num">${idx + 1}</td>
 <td>
 ${s.titulo}
 ${it.notaTema ? `<span class="note">⚠️ ${it.notaTema}</span>` : ''}
 </td>
 <td><span class="key-badge">${s.tonalidad}</span></td>
 <td class="bpm">${s.bpm}</td>
 <td style="font-family:monospace; font-size:16px; color:#aaa;">${s.duracion}</td>
 </tr>
 `;
 } else if (it.tipoItem === 'bloque_header') {
 return `
 <tr style="background:#1e1e1e; border-top: 3px solid #f2ca50; border-bottom: 2px solid #f2ca50;">
 <td colspan="5" style="color:#f2ca50; font-size:20px; font-weight:900; letter-spacing:1px; text-transform:uppercase; padding: 12px 10px;">
 ⚡ ${it.tituloCustom || 'BLOQUE DEL SHOW'}
 </td>
 </tr>
 `;
 } else {
 const typeInfo = SHOW_ITEM_TYPES[it.tipoItem] || { label: 'Evento', icon: '📌' };
 const durText = formatItemDuration(it);
 return `
 <tr style="background:#121212; border-left: 4px solid #38bdf8;">
 <td class="num" style="color:#38bdf8;">•</td>
 <td colspan="3" style="color:#e0f2fe; font-size:18px; font-weight:bold;">
 <span style="background:rgba(56,189,248,0.2); color:#38bdf8; padding:2px 8px; border-radius:4px; font-size:13px; font-family:monospace; margin-right:8px;">
 ${typeInfo.icon} ${typeInfo.label.toUpperCase()}
 </span>
 ${it.tituloCustom || 'Evento del Show'}
 ${it.notaTema ? `<span class="note" style="color:#94a3b8;">📋 CUE: ${it.notaTema}</span>` : ''}
 </td>
 <td style="font-family:monospace; font-size:16px; color:#f2ca50; text-align:right;">${durText}</td>
 </tr>
 `;
 }
 }).join('')}
 </tbody>
 </table>

 <div class="footer">
 Hoja de Escenario Impresa • Bakandeya Repertoire Manager
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
  <div className="space-y-3">
  {/* MODULE HEADER BAR — en móvil se queda en una línea fina (el subtítulo "Gestión de Setlists"
      es una etiqueta decorativa: la sección ya se identifica por la navegación inferior). Antes
      ocupaba una tarjeta entera con padding grande en lo más alto del scroll. AGENTS.md §6. */}
  <div className={`px-3 py-1.5 sm:p-3.5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 ${colors.card} `}>
       {/* HEADER / TITULO PRINCIPAL */}
      <div className="shrink-0 flex items-center gap-3">
        <h1 className={`text-base sm:text-2xl font-display font-black tracking-tight ${isStitchLight ? 'text-slate-900' : 'text-zinc-100'}`}>{t('nav.repertorio', 'Repertorio')}</h1>
        <span className={`hidden sm:inline-block text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded ${isStitchLight ? 'bg-slate-200 text-slate-700' : 'bg-neutral-800 text-zinc-400'}`}>{t('repertoire.subtitle', 'Gestión de Setlists')}</span>
      </div>

 </div>

  {/* VIEW 1: SETLISTS & REPERTORIOS DE DIRECTO */}
  {activeTab === 'setlists' && (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-1.5">
  {/* SIDEBAR: LIST OF SAVED SETLISTS */}
  {!isSidebarCollapsed ? (
  <div className={`lg:col-span-3 p-3 rounded-2xl space-y-3 ${colors.card} `}>
  <div className="flex justify-between items-center">
  <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
  <Layers className="w-3.5 h-3.5 text-[#d1b375]/80" />
  <span>Setlists Guardados</span>
  </h3>
  <div className="flex items-center gap-1">
  <button
  id="btn-create-setlist"
  onClick={handleCreateSetlist}
  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all ${
  isStitchLight ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'
  }`}
  title="Crear un nuevo setlist"
  >
  <Plus className="w-3 h-3" />
  <span>Nuevo</span>
  </button>
  <button
  onClick={() => setShowImportSetlistModal(true)}
  className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer"
  title="Importar repertorio desde una foto o PDF ya impreso"
  >
  <ImagePlus className="w-3.5 h-3.5" />
  </button>
  <button
  onClick={() => setIsSidebarCollapsed(true)}
  className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 cursor-pointer"
  title="Colapsar panel lateral para ampliar editor"
  >
  <ChevronLeft className="w-4 h-4" />
  </button>
  </div>
  </div>

  <div className="space-y-1.5 max-h-[calc(85vh-180px)] min-h-[450px] overflow-y-auto pr-1">
  {setlists.map(st => {
  const isSelected = st.id === activeSetlistId;
  const songItemsCount = st.items.filter(i => i.tipoItem === 'cancion').length;
  
  return (
  <div
  key={st.id}
  onClick={() => {
  setActiveSetlistId(st.id);
  // En escritorio el sidebar vive en su propia columna junto al editor (no tapa el gráfico), pero
  // en pantallas estrechas comparten el mismo scroll vertical — sin este auto-colapso, elegir un
  // setlist distinto dejaba la lista entera tapando el Mapa de Energía hasta que el usuario volvía
  // a tocar la flecha. Mismo breakpoint `lg` que ya usa este grid (AGENTS.md §6: contenido
  // principal primero). No se toca en escritorio para no perder la lista de un vistazo.
  if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
  setIsSidebarCollapsed(true);
  }
  }}
  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
  isSelected 
  ? isStitchLight 
  ? 'bg-sky-500/15 ring-1 ring-indigo-500/30' 
  : 'bg-[#d1b375]/15 ring-1 ring-[#f2ca50]/30'
  : isStitchLight
  ? 'bg-white hover:border-slate-300'
  : 'bg-[#131313] hover:border-neutral-700'
  }`}
  >
  <div className="flex justify-between items-start gap-2">
  <h4 className={`text-[10px] font-mono font-bold truncate ${isSelected ? (isStitchLight ? 'text-sky-400' : 'text-[#f2ca50]') : colors.text}`}>
  {st.nombre}
  </h4>
  <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold shrink-0 ${
  st.tipoFormato === 'festival' 
  ? 'bg-[#d1b375]/15 text-[#d1b375]'
  : st.tipoFormato === 'sala_larga'
  ? 'bg-sky-500/15 text-sky-400'
  : (isStitchLight ? 'bg-emerald-100 text-emerald-700' : 'bg-[#10b981]/15 text-[#10b981]')
  }`}>
  {st.tipoFormato}
  </span>
  </div>

  <p className="text-[9px] text-neutral-400 line-clamp-1 mt-0.5 font-sans">
  {st.descripcion || 'Sin descripción'}
  </p>

  <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-white/5 text-[9px] font-mono text-neutral-400">
  <span className="flex items-center gap-1">
  <Music className="w-3 h-3 text-[#d1b375]" />
  <span>{songItemsCount} temas</span>
  </span>

  <div className="flex items-center gap-1">
  <button
  onClick={(e) => { e.stopPropagation(); handleDuplicateSetlist(st); }}
  className="p-0.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
  title="Duplicar Setlist"
  >
  <Copy className="w-3 h-3" />
  </button>
  <button
  onClick={(e) => { e.stopPropagation(); handleDeleteSetlist(st.id); }}
  className="p-0.5 text-neutral-400 hover:text-rose-400 rounded hover:bg-neutral-800"
  title="Eliminar Setlist"
  >
  <Trash2 className="w-3 h-3" />
  </button>
  </div>
  </div>
  </div>
  );
  })}
  </div>
  </div>
  ) : (
  // Barra de "abrir lista de setlists": en escritorio es una columna estrecha (chevron + texto
  // apilados); en móvil ocupa el ancho completo, así que ahí va en UNA línea horizontal en vez
  // de apilar icono y texto (antes gastaba ~150px de alto por encima del contenido). AGENTS.md §6.
  <div className="lg:col-span-1 flex flex-col items-center py-1 lg:py-3 bg-[#131313] border border-white/5 rounded-2xl shrink-0">
    <button
      onClick={() => setIsSidebarCollapsed(false)}
      className="p-1.5 lg:p-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl cursor-pointer flex flex-row lg:flex-col items-center gap-1.5 lg:gap-2"
      title="Mostrar lista de setlists guardados"
    >
      <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5 text-[#d1b375]" />
      <span className="text-[10px] font-mono font-bold tracking-wider text-neutral-400 uppercase">
        Setlists ({setlists.length})
      </span>
    </button>
  </div>
  )}

  {/* MAIN EDITOR FOR ACTIVE SETLIST */}
  <div className={`${isSidebarCollapsed ? 'lg:col-span-11' : 'lg:col-span-9'} p-3.5 sm:p-4 rounded-2xl space-y-3 ${colors.card} `}>
 {activeSetlist ? (
 <>
 {/* CABECERA COMPACTA: nombre del setlist + un único menú "⋯" con las acciones secundarias.
     Antes eran tres botones de texto (Compartir / Asignar / Imprimir) + descripción, que en
     móvil se apilaban en varias líneas empujando el gráfico fuera de pantalla. Ninguna acción
     se ha perdido: todas viven en el menú (ver AGENTS.md §6). */}
 <div className="flex items-center gap-1.5">
 <input
 type="text"
 value={activeSetlist.nombre}
 onChange={(e) => {
 const val = e.target.value;
 setSetlists(prev => prev.map(s => s.id === activeSetlist.id ? { ...s, nombre: val } : s));
 }}
 title={activeSetlist.descripcion || 'Nombre del repertorio'}
 className={`flex-1 min-w-0 text-sm sm:text-base font-bold font-mono border-dashed focus:border-amber-400 bg-transparent focus:outline-none ${colors.text}`}
 />

 <div className="relative shrink-0">
 <button
 type="button"
 onClick={() => setShowSetlistActionsMenu((v) => !v)}
 className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
 title="Acciones del repertorio: compartir, asignar a bolo, imprimir, editar detalles"
 >
 <MoreHorizontal className="w-4 h-4" />
 </button>
 {showSetlistActionsMenu && (
 <>
 <div className="fixed inset-0 z-30" onClick={() => setShowSetlistActionsMenu(false)} />
 <div className="absolute right-0 top-full mt-1.5 z-40 w-56 rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl p-1.5 space-y-0.5 text-[11px] font-mono">
 <button
 type="button"
 onClick={() => { setShowSetlistActionsMenu(false); handleShareSetlist(activeSetlist); }}
 className="w-full text-left px-2.5 py-2 rounded-lg text-emerald-300 hover:bg-neutral-800 transition cursor-pointer flex items-center gap-2"
 >
 <MessageSquare className="w-3.5 h-3.5 shrink-0" /> Compartir repertorio
 </button>
 <button
 type="button"
 onClick={() => { setShowSetlistActionsMenu(false); setAssigningSetlist(activeSetlist); }}
 className="w-full text-left px-2.5 py-2 rounded-lg text-[#10b981] hover:bg-neutral-800 transition cursor-pointer flex items-center gap-2"
 >
 <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Asignar a bolo/ensayo
 </button>
 <button
 type="button"
 onClick={() => { setShowSetlistActionsMenu(false); setShowPdfPreview(true); }}
 className="w-full text-left px-2.5 py-2 rounded-lg text-[#d1b375] hover:bg-neutral-800 transition cursor-pointer flex items-center gap-2"
 >
 <Printer className="w-3.5 h-3.5 shrink-0" /> Imprimir / PDF
 </button>
 <button
 type="button"
 onClick={() => { setShowSetlistActionsMenu(false); setSetlistModalData({ isOpen: true, setlistToEdit: activeSetlist }); }}
 className="w-full text-left px-2.5 py-2 rounded-lg text-neutral-300 hover:bg-neutral-800 transition cursor-pointer flex items-center gap-2"
 >
 <Edit3 className="w-3.5 h-3.5 shrink-0" /> Editar detalles
 </button>
 </div>
 </>
 )}
 </div>
  </div>

  {/* LIVE METRICS & ENERGY MAP BAR */}
  {(() => {
    return (
      // flex + order en vez de un stack fijo: el Mapa de Energía (order-1) va SIEMPRE por delante
      // de las métricas (order-2/3) — es a lo que se viene a esta pantalla, y antes quedaba
      // empujado fuera del primer pantallazo en móvil. Ver AGENTS.md §6.
      <div className="flex flex-col gap-2">
        <div className="order-2 flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl bg-black/40 text-[10px] font-mono">
          {/* Resumen en una línea con las 3 métricas que de verdad se miran; interludios,
              bloques y perfil de dinámica se pliegan detrás del toggle — antes eran 5 pills
              + badge que en móvil ocupaban 5-6 líneas por encima del gráfico. */}
          <button
            type="button"
            onClick={() => setShowSetlistStats((v) => !v)}
            className="flex items-center gap-1.5 min-w-0 truncate hover:opacity-80 transition cursor-pointer"
            title={showSetlistStats ? 'Ocultar métricas secundarias' : 'Ver interludios, bloques y perfil de dinámica'}
          >
            <span className="font-bold text-white">🎵 {activeSetlistMetrics.songCount}</span>
            <span className="text-neutral-600">·</span>
            <span className="font-bold text-[#d1b375]">⏱️ {activeSetlistMetrics.formattedTime}</span>
            <span className="text-neutral-600">·</span>
            <span className="font-bold text-[#10b981]">⚡ {activeSetlistMetrics.avgBpm} BPM</span>
            <span className="text-neutral-500 ml-0.5">{showSetlistStats ? '▲' : '▼'}</span>
          </button>

          <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowAssistantChooser((v) => !v)}
                className="px-2 py-1 rounded-lg bg-purple-800/50 hover:bg-purple-700 text-purple-300 hover:text-purple-100 transition-all cursor-pointer font-bold flex items-center gap-1.5"
                title="Asistente IA del repertorio"
              >
                🧠 <span className="hidden sm:inline">Asistente IA</span>
              </button>
              {showAssistantChooser && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowAssistantChooser(false)} />
                  <div className="absolute right-0 top-full mt-1.5 z-40 w-72 rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl p-1.5 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAssistantChooser(false);
                        setShowAIAnalysisModal(true);
                      }}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-neutral-800 transition-all cursor-pointer"
                    >
                      <span className="text-sm font-medium text-purple-300 flex items-center gap-1.5">📖 Ver análisis</span>
                      <span className="block text-[10.5px] text-neutral-400 mt-0.5">Arco narrativo, puntuación y sugerencias explicadas — sin tocar nada por su cuenta.</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAssistantChooser(false);
                        setPerfectSetlistPlan(null);
                        setPerfectSetlistError(null);
                        setShowPerfectSetlistModal(true);
                      }}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-neutral-800 transition-all cursor-pointer"
                    >
                      <span className="text-sm font-medium text-emerald-300 flex items-center gap-1.5">🪄 Generar plan de cambios</span>
                      <span className="block text-[10.5px] text-neutral-400 mt-0.5">Reordena, añade/quita canciones del catálogo y sugiere bloques — sobre una copia, nunca sobre este setlist.</span>
                    </button>
                  </div>
                </>
              )}
          </div>
        </div>

        {/* Métricas secundarias, solo si se piden */}
        {showSetlistStats && (
          <div className="order-3 flex flex-wrap items-center gap-1.5 px-1 text-[10px] font-mono">
            <span className="px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-400 font-bold border border-sky-500/20">
              💬 {activeSetlistMetrics.eventCount} interludios
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-yellow-500/10 text-[#f2ca50] font-bold border border-yellow-500/20">
              ⚡ {activeSetlistMetrics.blockCount} bloques
            </span>
            {/* profileLabel ya incluye su propio icono — antes se pintaba además profileIcon
                al lado, duplicando el emoji ("⚡ ⚡ Dinámica Equilibrada"). */}
            <span className="px-2 py-0.5 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold">
              {energyAnalysis.profileLabel}
            </span>
          </div>
        )}

        {/* MAPA Y CURVA DE ENERGÍA DEL SHOW — order-1: es el contenido principal de la pantalla */}
        {energyAnalysis.points.length > 0 && (
          <div className="order-1 p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-neutral-400">
              {/* Título corto y la ayuda en el tooltip: el hint largo entre paréntesis ocupaba
                  4 líneas en móvil justo encima del gráfico (AGENTS.md §6). */}
              <span
                className="font-bold uppercase tracking-wider text-white truncate"
                title="Arrastra un punto en horizontal para reordenar el setlist, o en vertical para cambiar su energía. También puedes seleccionarlo y usar las flechas."
              >
                📈 Mapa de Energía
              </span>
              <div className="flex items-center gap-2 shrink-0">
                {canUndoReorder && (
                  <button
                    type="button"
                    onClick={undoLastReorder}
                    className="px-2 py-0.5 rounded-lg bg-amber-900/40 hover:bg-amber-800/60 text-amber-300 hover:text-amber-100 transition-all cursor-pointer text-[10px] font-mono font-medium flex items-center gap-1"
                    title="Deshacer el último reordenamiento del setlist"
                  >
                    ↩️ Deshacer
                  </button>
                )}
                {showEnergyMap && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowChartSettingsMenu((v) => !v)}
                      className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-all cursor-pointer"
                      title="Ajustes del gráfico (leyenda de colores, curva ideal)"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>
                    {showChartSettingsMenu && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setShowChartSettingsMenu(false)} />
                        <div className="absolute right-0 top-full mt-1.5 z-40 w-56 rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl p-2.5 space-y-2.5">
                          <button
                            type="button"
                            onClick={() => setShowIdealCurve((v) => !v)}
                            className={`w-full px-2 py-1 rounded-lg transition-all cursor-pointer text-[10px] font-mono font-medium flex items-center justify-between ${
                              showIdealCurve ? 'bg-neutral-700 text-neutral-200' : 'bg-neutral-800 text-neutral-500'
                            }`}
                            title="Curva ideal de referencia: un arco de pacing clásico escalado al rango real de energías de tu repertorio"
                          >
                            <span>〰️ Curva ideal</span>
                            <span>{showIdealCurve ? 'ON' : 'OFF'}</span>
                          </button>
                          <div className="flex flex-col gap-1 text-[9px] text-neutral-300 pt-1 border-t border-neutral-800">
                            <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full inline-block" style={{ background: '#0284c7' }} />🌙 Balada</span>
                            <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full inline-block" style={{ background: '#059669' }} />🎵 Media</span>
                            <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full inline-block" style={{ background: '#a16207' }} />🔥 Alta</span>
                            <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full inline-block" style={{ background: '#a21caf' }} />💣 Explosiva</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowEnergyMap((v) => !v)}
                  className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-all cursor-pointer"
                  title={showEnergyMap ? 'Ocultar el mapa de energía' : 'Mostrar el mapa de energía'}
                >
                  {showEnergyMap ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConcertPlayer((v) => !v)}
                  className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-all cursor-pointer"
                  title={showConcertPlayer ? 'Ocultar reproductor de concierto' : 'Mostrar reproductor de concierto'}
                >
                  {showConcertPlayer ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
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
                <p className="text-[9px] text-neutral-500">
                  💡 Toca un punto para reordenar o cambiar su energía — la energía es de la canción, se aplica en todos tus repertorios.
                </p>

                <EnergyChart
                  setlistKey={activeSetlist.id}
                  chartData={chartData}
                  yDomain={yDomain}
                  zonasEnergia={ZONAS_ENERGIA}
                  highlightedSongIds={highlightedSongIds}
                  selectedSetlistItemId={selectedSetlistItemId}
                  onSelectItem={setSelectedSetlistItemId}
                  onReorder={reorderSetlistItems}
                  onEnergyChange={handleEnergyChartDrag}
                  height={256}
                  showIdealCurve={showIdealCurve}
                />

                {/* Joystick/D-pad del punto seleccionado: ◀▶ mueve el tema de posición, ▲▼ sube o
                    baja su energía un punto exacto — alternativa al arrastre del gráfico para
                    cuando se quiere precisión, o directamente para móvil, donde el arrastre (sobre
                    todo en vertical, encima de un SVG de recharts) no siempre responde igual de
                    bien que en escritorio. */}
                {selectedSetlistItemId && (() => {
                  const selectedIndex = chartData.findIndex((d) => d.id === selectedSetlistItemId);
                  if (selectedIndex === -1) return null;
                  const point = chartData[selectedIndex];
                  const canEditEnergy = point.songId != null && typeof point.score === 'number';
                  const info = canEditEnergy ? getEnergyInfo(point.score as number) : null;
                  const bumpEnergy = (delta: number) => {
                    if (!canEditEnergy || typeof point.score !== 'number') return;
                    const next = Math.max(1, Math.min(20, point.score + delta));
                    if (next !== point.score) handleEnergyChartDrag(point, next);
                  };
                  const dirBtnClass = "w-8 h-8 rounded-full flex items-center justify-center transition disabled:opacity-25 disabled:cursor-not-allowed shrink-0";
                  const reorderBtnClass = `${dirBtnClass} bg-neutral-800/80 hover:bg-neutral-700 text-amber-300/90 border border-amber-500/30 hover:border-amber-400/60`;
                  const energyBtnStyle = info
                    ? { color: info.hexColor, borderColor: `${info.hexColor}55`, background: 'rgba(23,23,23,0.8)' }
                    : undefined;
                  const prevName = selectedIndex > 0 ? chartData[selectedIndex - 1]?.name : null;
                  const nextName = selectedIndex < chartData.length - 1 ? chartData[selectedIndex + 1]?.name : null;
                  return (
                    <div className="w-full flex flex-col items-center gap-1.5 pt-1.5 pb-0.5">
                      {canEditEnergy && (
                        <button
                          type="button"
                          disabled={(point.score as number) >= 20}
                          onClick={() => bumpEnergy(1)}
                          className={`${dirBtnClass} border hover:brightness-125`}
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
                        <span className="w-20 sm:w-28 line-clamp-3 text-[9px] text-neutral-500 font-mono text-right leading-tight">
                          {prevName || ''}
                        </span>
                        <button
                          type="button"
                          disabled={selectedIndex <= 0}
                          onClick={() => reorderSetlistItems(selectedIndex, selectedIndex - 1, 'stepper')}
                          className={reorderBtnClass}
                          title={prevName ? `Mover antes de "${prevName}"` : 'Mover una posición hacia atrás'}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        {/* Hub central: solo el score de energía (sin el nombre del tema, ya se ve
                            resaltado en el propio gráfico), con un aro y un glow del color de su
                            categoría para que el joystick tenga vida propia en vez de ser cuatro
                            flechas sueltas. */}
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-mono font-bold shrink-0"
                          style={info ? {
                            background: `radial-gradient(circle at 35% 30%, ${info.hexColor}40, #0a0a0a 75%)`,
                            border: `1.5px solid ${info.hexColor}`,
                            boxShadow: `0 0 9px ${info.hexColor}80, inset 0 0 4px ${info.hexColor}30`,
                            color: info.hexColor
                          } : {
                            background: '#171717',
                            border: '1.5px solid #3f3f46',
                            color: '#71717a'
                          }}
                          title={info ? `${info.label} · ${point.score}/20` : point.name}
                        >
                          {info ? point.score : '•'}
                        </div>
                        <button
                          type="button"
                          disabled={selectedIndex >= chartData.length - 1}
                          onClick={() => reorderSetlistItems(selectedIndex, selectedIndex + 1, 'stepper')}
                          className={reorderBtnClass}
                          title={nextName ? `Mover después de "${nextName}"` : 'Mover una posición hacia adelante'}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <span className="w-20 sm:w-28 line-clamp-3 text-[9px] text-neutral-500 font-mono text-left leading-tight">
                          {nextName || ''}
                        </span>
                      </div>
                      {canEditEnergy && (
                        <button
                          type="button"
                          disabled={(point.score as number) <= 1}
                          onClick={() => bumpEnergy(-1)}
                          className={`${dirBtnClass} border hover:brightness-125`}
                          style={energyBtnStyle}
                          title="Bajar energía"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Avisos y sugerencias — plegados por defecto, con un solo toggle que resume
                    cuántos hay entre los heurísticos y los del último Análisis IA, en vez de dos
                    filas de badges siempre desplegadas ocupando pantalla. */}
                {(energyAnalysis.warnings.length > 0 || (aiAnalysisResult?.suggestions?.length ?? 0) > 0) && (
                  <button
                    type="button"
                    onClick={() => setShowHeuristicWarnings((v) => !v)}
                    className="w-full flex items-center justify-between px-2 py-1 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 text-[10px] font-mono transition-all cursor-pointer"
                  >
                    <span>⚠️ Avisos y sugerencias ({energyAnalysis.warnings.length + (aiAnalysisResult?.suggestions?.length ?? 0)})</span>
                    <span>{showHeuristicWarnings ? '▲' : '▼'}</span>
                  </button>
                )}

                {/* Warnings & Suggestions (Heuristic) */}
                {showHeuristicWarnings && energyAnalysis.warnings.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {energyAnalysis.warnings.map((w, i) => {
                      const hasSongs = !!w.songTitles && w.songTitles.length > 0;
                      const isHighlighted = hasSongs && highlightedSongIds.length > 0 &&
                        w.songTitles!.some(t => titlesMatch(t, highlightedSongIds));
                      return (
                        <span
                          key={i}
                          className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-medium flex items-center gap-1 border transition ${
                            w.type === 'warning'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : w.type === 'success'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                          } ${isHighlighted ? 'ring-2 ring-white/60' : ''}`}
                          style={{ cursor: hasSongs ? 'pointer' : 'default' }}
                          onMouseEnter={() => { if (hasSongs) setHighlightedSongIds(w.songTitles!); }}
                          onMouseLeave={() => setHighlightedSongIds([])}
                          onClick={() => { if (hasSongs) setHighlightedSongIds(isHighlighted ? [] : w.songTitles!); }}
                          title={hasSongs ? `Resalta: ${w.songTitles!.join(', ')}` : undefined}
                        >
                          <span>{w.icon}</span>
                          <span>{w.message}</span>
                          {w.suggestedReorder && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                reorderSetlistItems(w.suggestedReorder!.fromIndex, w.suggestedReorder!.toIndex, `warning-${i}`);
                              }}
                              className="ml-1 px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/25 text-white font-bold transition"
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
                      <span className="text-xs font-bold text-purple-300">🧠 Análisis IA: {aiAnalysisResult.overallScore}/100</span>
                      <button
                        type="button"
                        onClick={() => setShowAIAnalysisModal(true)}
                        className="px-2 py-0.5 rounded text-[9px] bg-purple-700/50 hover:bg-purple-600 text-purple-200 transition font-medium"
                      >
                        Ver análisis completo
                      </button>
                    </div>
                    {aiAnalysisResult.suggestions?.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {aiAnalysisResult.suggestions.map((s: any, i: number) => {
                          const songsToHighlight: string[] = (s.songs_involved && s.songs_involved.length > 0)
                            ? s.songs_involved
                            : []; // Si no hay songs_involved, usar array vacío
                          const hasSongs = songsToHighlight.length > 0;
                          const isHighlighted = hasSongs && highlightedSongIds.length > 0 &&
                            songsToHighlight.some((songTitle: string) => titlesMatch(songTitle, highlightedSongIds));
                          return (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-[9.5px] font-mono font-medium flex items-center gap-1 border transition"
                              style={{
                                backgroundColor: isHighlighted ? 'rgb(168 85 247 / 0.4)' : 'rgb(126 34 206 / 0.3)',
                                borderColor: isHighlighted ? 'rgb(168 85 247 / 0.8)' : 'rgb(147 51 234 / 0.4)',
                                color: 'rgb(196 181 253)',
                                cursor: hasSongs ? 'pointer' : 'default'
                              }}
                              onMouseEnter={() => {
                                if (hasSongs) setHighlightedSongIds(songsToHighlight);
                              }}
                              onMouseLeave={() => setHighlightedSongIds([])}
                              onClick={() => {
                                if (hasSongs) setHighlightedSongIds(isHighlighted ? [] : songsToHighlight);
                              }}
                              title={hasSongs ? `Resalta: ${songsToHighlight.join(', ')}` : s.title}
                            >
                              <span>{s.priority === 'high' && '🔴'}{s.priority === 'medium' && '🟠'}{s.priority === 'low' && '🟡'}</span>
                              <span>{s.title}</span>
                            </span>
                          );
                        })}
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

  {/* CONCERT PLAYER: Reproducir concierto dentro de Repertorio */}
  {showConcertPlayer && activeSetlist && (
    <div className="order-2 p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-2">
      <EscenarioView
        activeSetlist={activeSetlist}
        setlists={setlists}
        activeSetlistId={activeSetlistId}
        setActiveSetlistId={setActiveSetlistId}
        songs={songs}
        setShowPdfPreview={setShowPdfPreview}
        stageAudioRef={stageAudioRef}
        stageAudioRefB={stageAudioRefB}
        stagePlayingIndex={stagePlayingIndex}
        setStagePlayingIndex={setStagePlayingIndex}
        stageIsPlaying={stageIsPlaying}
        setStageIsPlaying={setStageIsPlaying}
        stageCurrentTime={stageCurrentTime}
        stageItemDuration={stageItemDuration}
        stageResolvedUrl={stageResolvedUrl}
        stageAutoplayNext={stageAutoplayNext}
        setStageAutoplayNext={setStageAutoplayNext}
        stageCrossfadeEnabled={stageCrossfadeEnabled}
        setStageCrossfadeEnabled={setStageCrossfadeEnabled}
        isCrossfading={isCrossfading}
        handleStageAudioEnded={handleStageAudioEnded}
        handleStageTimeUpdate={handleStageTimeUpdate}
        handleStageSeek={handleStageSeek}
        handleStagePrev={handleStagePrev}
        handleStageNext={handleStageNext}
        toggleStagePlayPause={toggleStagePlayPause}
        toggleFavoriteSong={toggleFavoriteSong}
        setEditingShowItem={setEditingShowItem}
        setShowItemAudioUrl={setShowItemAudioUrl}
        setShowShowItemModal={setShowShowItemModal}
        formatItemDuration={formatItemDuration}
        embedded
      />
    </div>
  )}

  {/* ADD ITEMS ACTION BAR */}
  <div className="space-y-1.5 pt-0.5">
  {/* Selected Song / Item Insertion Indicator */}
  {selectedSetlistItemId && (
    <div className="flex items-center justify-between gap-2 px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono animate-fadeIn">
      <div className="flex items-center gap-2 min-w-0">
        <span className="shrink-0 text-amber-400 font-bold">📌 Modo Inserción Activo:</span>
        <span className="truncate font-semibold text-white">
          Insertar debajo de: <strong>{
            (() => {
              const sel = activeSetlist.items.find(x => x.id === selectedSetlistItemId);
              if (!sel) return 'elemento seleccionado';
              if (sel.tipoItem === 'cancion' && sel.songId) {
                return songs.find(s => s.id === sel.songId)?.titulo || 'Canción seleccionada';
              }
              return sel.tituloCustom || 'Evento seleccionado';
            })()
          }</strong>
        </span>
      </div>
      <button
        onClick={() => setSelectedSetlistItemId(null)}
        className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[9px] font-mono whitespace-nowrap cursor-pointer transition-colors"
        title="Deseleccionar e insertar al final de la lista"
      >
        ✕ Deseleccionar
      </button>
    </div>
  )}

  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
  <span className="text-[9px] font-mono text-neutral-400 uppercase whitespace-nowrap font-bold">Añadir:</span>
  
  {/* Select song from catalog */}
  <select
  onChange={(e) => {
  if (e.target.value) {
  handleAddItemToSetlist(e.target.value, 'cancion');
  e.target.value = '';
  }
  }}
  className={`text-[10px] font-mono py-1 px-2.5 rounded-lg focus:outline-none cursor-pointer border border-neutral-800 font-bold ${
  isStitchLight ? 'bg-white text-slate-800' : 'bg-neutral-900 text-[#d1b375]'
  }`}
  >
  <option value="">+ 1 Tema Individual...</option>
  {sortedSongsByAlbumAndOrder.map((s, idx) => {
    const albumLabel = s.albumDisco || s.album || 'Single';
    return (
      <option key={`${s.id}-${idx}`} value={s.id}>
        [{albumLabel}] {s.titulo} ({s.tonalidad ? `${s.tonalidad} • ` : ''}{s.duracion || '0:00'})
      </option>
    );
  })}
  </select>

  <button
  onClick={() => setIsAddSongsModalOpen(true)}
  className="px-2.5 py-1 text-[10px] font-mono rounded-lg bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/40 hover:bg-[#1db954]/30 whitespace-nowrap cursor-pointer font-bold flex items-center gap-1"
  title="Seleccionar y añadir varias canciones del catálogo de una sola vez"
  >
  <ListPlus className="w-3.5 h-3.5" />
  <span>Añadir Varios Temas</span>
  </button>

  <button
  onClick={() => handleAddItemToSetlist(undefined, 'bloque_header', '⚡ Bloque Nuevo')}
  className="px-2.5 py-1 text-[10px] font-mono rounded-lg bg-[#d1b375]/20 text-[#d1b375] border border-[#f2ca50]/40 hover:bg-[#d1b375]/30 whitespace-nowrap cursor-pointer font-bold flex items-center gap-1"
  >
  <span>⚡</span>
  <span>+ Bloque</span>
  </button>

  <button
  onClick={() => { setEditingShowItem(null); setShowShowItemModal(true); }}
  className="px-2.5 py-1 text-[10px] font-mono rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 whitespace-nowrap cursor-pointer font-bold flex items-center gap-1"
  >
  <Zap className="w-3 h-3 text-sky-400" />
  <span>+ Evento...</span>
  </button>
  </div>

  {/* QUICK SHOW PRESET CHIPS */}
  <div className="flex items-center gap-1 overflow-x-auto text-[9px] font-mono">
  <span className="text-neutral-500 text-[8.5px] uppercase whitespace-nowrap">Rápidos:</span>
  <button
  onClick={() => handleAddItemToSetlist(undefined, 'presentacion')}
  className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 whitespace-nowrap cursor-pointer"
  >
  🎤 Presentación
  </button>
  <button
  onClick={() => handleAddItemToSetlist(undefined, 'beatbox')}
  className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 whitespace-nowrap cursor-pointer"
  >
  🥁 Solo Batería
  </button>
  <button
  onClick={() => handleAddItemToSetlist(undefined, 'intro_tema')}
  className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 whitespace-nowrap cursor-pointer"
  >
  🗣️ Intro Tema
  </button>
  <button
  onClick={() => handleAddItemToSetlist(undefined, 'cambio_instrumento')}
  className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 whitespace-nowrap cursor-pointer"
  >
  🔧 Cambio Instrumento
  </button>
  <button
  onClick={() => handleAddItemToSetlist(undefined, 'chapa')}
  className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 whitespace-nowrap cursor-pointer"
  >
  💬 Chapa / Público
  </button>
  <button
  onClick={() => handleAddItemToSetlist(undefined, 'bis')}
  className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 whitespace-nowrap cursor-pointer"
  >
  💣 BIS Final
  </button>

  {/* Band's own custom shortcuts, on top of the typical ones above */}
  {customShortcuts.map(sc => (
    <button
    key={sc.id}
    onClick={() => handleUseCustomShortcut(sc)}
    className="group/sc relative px-1.5 py-0.5 pr-4 rounded bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 whitespace-nowrap cursor-pointer"
    title={sc.tituloCustom}
    >
    {sc.icono} {sc.etiqueta}
    <span
    onClick={(e) => { e.stopPropagation(); handleDeleteShortcut(sc.id); }}
    className="absolute right-0.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/sc:opacity-100 text-rose-400 hover:text-rose-300 px-0.5"
    title="Eliminar este acceso rápido"
    >
    ×
    </span>
    </button>
  ))}

  {isAddingShortcut ? (
    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-800/60 border border-neutral-700">
    <input
    value={newShortcutIcon}
    onChange={(e) => setNewShortcutIcon(e.target.value)}
    maxLength={2}
    placeholder="⭐"
    className="w-6 bg-transparent text-center text-[10px] focus:outline-none"
    />
    <input
    value={newShortcutLabel}
    onChange={(e) => setNewShortcutLabel(e.target.value)}
    placeholder="Nombre del acceso rápido"
    maxLength={30}
    autoFocus
    onKeyDown={(e) => { if (e.key === 'Enter') handleCreateShortcut(); if (e.key === 'Escape') setIsAddingShortcut(false); }}
    className="w-32 bg-transparent text-[10px] focus:outline-none placeholder:text-neutral-600"
    />
    <input
    type="number"
    min={0}
    value={newShortcutMinutes}
    onChange={(e) => setNewShortcutMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
    title="Duración estimada (minutos)"
    className="w-9 bg-transparent text-[10px] text-center focus:outline-none"
    />
    <button onClick={handleCreateShortcut} disabled={!newShortcutLabel.trim()} className="text-emerald-400 hover:text-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed" title="Guardar acceso rápido">
    <Check className="w-3 h-3" />
    </button>
    <button onClick={() => setIsAddingShortcut(false)} className="text-neutral-500 hover:text-neutral-300" title="Cancelar">
    <X className="w-3 h-3" />
    </button>
    </div>
  ) : (
    <button
    onClick={() => setIsAddingShortcut(true)}
    className="px-1.5 py-0.5 rounded border border-dashed border-neutral-700 text-neutral-500 hover:text-neutral-300 hover:border-neutral-500 whitespace-nowrap cursor-pointer flex items-center gap-0.5"
    title="Crear tu propio acceso rápido para este grupo"
    >
    <Plus className="w-3 h-3" /> Nuevo
    </button>
  )}
  </div>
  </div>

  {/* ITEMS LIST WITH DRAG & DROP AND SELECTION */}
  <div className="space-y-1.5 max-h-[calc(88vh-200px)] min-h-[480px] overflow-y-auto pr-1">
  {activeSetlist.items.length === 0 ? (
  <div className="text-center py-10 border-dashed rounded-xl text-neutral-500 text-[10px] font-mono">
  No hay canciones en este repertorio. Usa el menú de arriba para añadir temas.
  </div>
  ) : (
  activeSetlist.items.map((it, index) => {
  const isSelected = selectedSetlistItemId === it.id;
  const isDragging = draggedItemIndex === index;
  const isDragOver = dragOverItemIndex === index;

  if (it.tipoItem === 'cancion' && it.songId) {
  const song = songs.find(s => s.id === it.songId);
  if (!song) return null;

  // Check if this song has member notes
  const memberNotesCount = song.notasMiembros
    ? Object.values(song.notasMiembros).filter(v => typeof v === 'string' && v.trim().length > 0).length
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

  // Reproducir esta canción sin tener que expandir la fila — manda a la misma barra Spotify
  // persistente de abajo, con la cola limitada a este repertorio en su orden (igual que
  // "Reproducir desde aquí" antes, pero accesible con un solo tap en la fila compacta).
  const isPlayingThisRow = activePlayerSong?.id === song.id && isPlayerPlaying;
  const playThisSong = () => {
    const setlistSongs = activeSetlist.items
      .filter((i) => i.tipoItem === 'cancion' && i.songId)
      .map((i) => songs.find((s) => s.id === i.songId))
      .filter((s): s is Song => !!s);
    selectPlayerSongWithQueue(song, true, setlistSongs);
  };

  return (
  <div
  key={it.id}
  draggable={true}
  onDragStart={(e) => { if (TRANSPARENT_DRAG_IMAGE) e.dataTransfer.setDragImage(TRANSPARENT_DRAG_IMAGE, 0, 0); setDraggedItemIndex(index); }}
  onDragOver={(e) => { e.preventDefault(); setDragOverItemIndex(index); }}
  onDragLeave={() => { if (dragOverItemIndex === index) setDragOverItemIndex(null); }}
  onDrop={(e) => { e.preventDefault(); handleDropItem(index); }}
  onDragEnd={() => { setDraggedItemIndex(null); setDragOverItemIndex(null); }}
  onClick={() => {
  // Seleccionar la canción (para el joystick del gráfico, o para insertar justo debajo) ya
  // expande sus detalles de paso — antes hacían falta dos taps distintos (seleccionar + chevron)
  // para ver la afinación/disco/cantante del tema que se acaba de elegir. El chevron sigue
  // sirviendo para expandir sin seleccionar. AGENTS.md §6.
  if (!isSelected && !isExpanded) {
  setExpandedSetlistItemIds(new Set(expandedSetlistItemIds).add(it.id));
  }
  setSelectedSetlistItemId(isSelected ? null : it.id);
  }}
  className={`group border rounded-lg transition-all cursor-pointer ${
  isDragging ? 'opacity-40 scale-[0.98]' : ''
  } ${
  isDragOver ? 'border-amber-400 border-2 scale-[1.01] bg-amber-500/10 shadow-lg' : ''
  } ${
  isSelected
    ? 'border-amber-400 ring-2 ring-amber-400/30 bg-amber-500/10 shadow-md'
    : isStitchLight
      ? 'bg-white border-slate-200 hover:border-slate-300'
      : 'bg-neutral-900/80 border-neutral-800/80 hover:border-neutral-700'
  }`}
  >
  {/* MAIN ROW - COMPACT */}
  <div className="flex items-center gap-2 px-2.5 py-1.5 overflow-x-auto">
    {/* Drag Handle */}
    <div
      className="cursor-grab active:cursor-grabbing text-neutral-500 hover:text-amber-400 transition-colors shrink-0"
      title="Arrastrar y soltar para reordenar"
      onClick={(e) => e.stopPropagation()}
    >
      <GripVertical className="w-3.5 h-3.5" />
    </div>

    {/* Index / Play: número por defecto, botón de play al pasar el ratón (o siempre tocable en
        móvil, aunque no cambie de icono sin hover) — reproduce sin tener que expandir la fila,
        mismo patrón que ya usa la fila del Catálogo. */}
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); playThisSong(); }}
      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer bg-[#1db954] text-black sm:bg-transparent sm:group-hover:bg-[#1db954] sm:group-hover:text-black"
      title={isPlayingThisRow ? 'Sonando ahora' : 'Reproducir esta canción'}
    >
      {isPlayingThisRow ? (
        <div className="flex items-center gap-0.5">
          <span className="w-0.5 h-2 bg-[#1db954] rounded-full animate-pulse" />
          <span className="w-0.5 h-2.5 bg-[#1ed760] rounded-full animate-pulse delay-75" />
          <span className="w-0.5 h-1.5 bg-[#1db954] rounded-full animate-pulse delay-150" />
        </div>
      ) : (
        <>
          <span className="sm:group-hover:hidden font-mono font-bold text-[9px] text-[#d1b375]">{index + 1}</span>
          <Play className="w-3 h-3 fill-current sm:hidden sm:group-hover:block ml-0.5 text-black" />
        </>
      )}
    </button>

    {/* Title + metadata in one line — shrink-0 con tope máximo: antes era el único elemento
        "encogible" de la fila (todo lo demás es shrink-0), así que en móvil, con tantos
        badges + 5 iconos de acción compitiendo por sitio, se comía todo el hueco negativo
        y acababa en 0px de ancho (título invisible). Con shrink-0 + max-width nunca baja de
        su contenido hasta ese tope, y el overflow-x-auto de la fila absorbe el resto. */}
    <span className={`text-[13px] font-bold font-mono ${colors.text} truncate shrink-0 max-w-[42vw] sm:max-w-[220px]`} title={song.titulo}>
      {song.titulo}
    </span>

    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] font-bold shrink-0">
      {song.tonalidad || '—'}
    </span>

    <span className="text-[9px] font-mono text-neutral-400 shrink-0">
      {song.bpm ? `${song.bpm}` : '—'}
    </span>

    <span className="text-[9px] font-mono text-[#d1b375] font-bold shrink-0">
      {song.duracion || '0:00'}
    </span>

    {(() => {
      const energy = getEnergyInfo(song);
      const currentVal1a10 = Math.max(1, Math.min(10, Math.round((song.energia || 10) / 2)));
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
              const rect = e.currentTarget.getBoundingClientRect();
              const openUpward = window.innerHeight - rect.bottom < POPOVER_HEIGHT_PX + 8;
              setEnergyPopoverPos({
                top: openUpward ? rect.top - POPOVER_HEIGHT_PX - 4 : rect.bottom + 4,
                left: Math.min(rect.left, window.innerWidth - POPOVER_WIDTH_PX - 8),
                openUpward
              });
              setEditingEnergyItemId(it.id);
            }}
            className={`text-[8px] font-mono px-1 py-0.5 rounded font-bold shrink-0 cursor-pointer transition hover:ring-1 hover:ring-white/40 ${energy.bgClass} ${energy.textClass} ${energy.borderClass}`}
            title={`Energía: ${energy.label} (${currentVal1a10}/10)${song.energiaManual ? ' — fijada a mano' : ''}. Clic para cambiarla.`}
          >
            <span>{energy.icon}</span>
            {song.energiaManual && <span className="ml-0.5" title="Energía fijada a mano">✋</span>}
          </button>
          {/* Portal + position:fixed a propósito: la fila vive dentro de una lista con
              overflow-y-auto (ver contenedor "ITEMS LIST"), así que un popover position:absolute
              quedaba recortado/oculto por ese overflow en canciones cerca del final del scroll —
              de ahí que "hubiera que bajar" para verlo. Con fixed + posición calculada al abrir
              (arriba o abajo según el hueco real en el viewport) escapa a ese clipping. */}
          {isEditingThis && energyPopoverPos && createPortal(
            // Selector 1-10 (más fácil de puntuar que 1-20 directamente) — se guarda como
            // energia = valor*2 para no tocar el resto del sistema, que ya usa escala 1-20.
            <div
              data-energy-popover
              className="fixed z-[100] bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl p-1.5 flex items-center gap-0.5"
              style={{ top: energyPopoverPos.top, left: energyPopoverPos.left }}
              onClick={(e) => e.stopPropagation()}
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map(val => (
                <button
                  key={val}
                  type="button"
                  disabled={savingEnergyItemId === it.id}
                  onClick={() => handleSetEnergiaManual(song, it.id, val)}
                  className={`w-5 h-5 rounded text-[9px] font-mono font-bold flex items-center justify-center transition disabled:opacity-50 ${
                    currentVal1a10 === val
                      ? 'bg-amber-500 text-black'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>,
            document.body
          )}
        </div>
      );
    })()}

    {isSelected && (
      <span className="px-1 py-0.5 rounded text-[8px] font-mono font-bold bg-amber-500 text-black shrink-0">
        📌
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
      <span className="text-amber-300 shrink-0" title={`${memberNotesCount} nota(s) de miembros`}>
        <Users className="w-3 h-3" />
      </span>
    )}

    {/* Edit song button */}
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setEditingSong(song);
        setShowSongModal(true);
      }}
      className="p-0.5 text-neutral-400 hover:text-amber-400 transition-colors shrink-0"
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
      className="p-0.5 text-neutral-400 hover:text-amber-400 transition-colors shrink-0"
      title={isExpanded ? "Ocultar detalles" : "Ver afinación, disco, cantante, acordes y notas de miembros"}
    >
      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
    </button>

    <button
      onClick={() => handleRemoveSetlistItem(it.id)}
      className="p-0.5 text-neutral-400 hover:text-rose-400 transition-colors shrink-0"
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
    const userNote = currentUser?.name && song.notasMiembros?.[currentUser.name.toLowerCase()];
    return (song.notasRepertorio || it.notaTema || userNote) ? (
      <div className="px-2.5 py-1.5 border-t text-[10px] font-mono space-y-1" onClick={(e) => e.stopPropagation()}>
        {song.notasRepertorio && (
          <div className="text-amber-600/80 truncate" title={song.notasRepertorio}>
            📝 {song.notasRepertorio}
          </div>
        )}
        {userNote && (
          <div className="text-cyan-600/80 truncate" title={userNote}>
            👤 {currentUser.name}: {userNote}
          </div>
        )}
        {it.notaTema && (
          <div className="text-emerald-600/80 truncate" title={it.notaTema}>
            💡 {it.notaTema}
          </div>
        )}
      </div>
    ) : null;
  })()}

  {/* EXPANDED DETAILS - Only when isExpanded */}
  {isExpanded && (
    <div className={`border-t px-2.5 py-2 text-[9px] font-mono space-y-1 ${isStitchLight ? 'bg-slate-50' : 'bg-black/20'}`}>
      {song.cantantePrincipal && (
        <div className="text-neutral-400">
          <span className="font-bold text-neutral-500">Cantante:</span> {song.cantantePrincipal}
        </div>
      )}
      {song.afinacion && (
        <div className="text-neutral-400">
          <span className="font-bold text-neutral-500">Afinación:</span> {song.afinacion}
        </div>
      )}
      {song.albumDisco && (
        <div className="text-neutral-400">
          <span className="font-bold text-neutral-500">Disco:</span> {song.albumDisco}
        </div>
      )}

      <input
        type="text"
        placeholder="Nota para este bolo (ej. Cambio a acústica / empalmar solo)..."
        value={it.notaTema || ''}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => handleUpdateItemNote(it.id, e.target.value)}
        className={`w-full text-[9px] font-mono px-2 py-1 rounded mt-1 ${
          isStitchLight
            ? 'bg-slate-100 text-slate-700 placeholder:text-slate-400'
            : 'bg-black/40 text-neutral-300 placeholder:text-neutral-600 border border-neutral-800'
        }`}
      />

      {/* Notas de miembros / acordes: consultas ocasionales, no algo permanente en la fila
          compacta (ver arriba) — viven aquí, un tap más lejos pero fuera del camino de lo que sí
          se mira en cada vistazo a la lista (AGENTS.md §6). Reproducir la canción tiene su propio
          botón ▶ en la fila compacta (junto al número), no hace falta expandir para eso. */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setActiveMemberNotesSong(song); }}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
            memberNotesCount > 0 ? 'text-amber-300 hover:text-amber-400' : 'text-neutral-400 hover:text-amber-300'
          }`}
        >
          <Users className="w-3 h-3" /> Notas de miembros{memberNotesCount > 0 ? ` (${memberNotesCount})` : ''}
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setActiveChordsSong(song); }}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-neutral-400 hover:text-indigo-400 transition-colors"
        >
          <FileText className="w-3 h-3" /> Acordes
        </button>
      </div>
    </div>
  )}
 </div>
 );
 } else if (it.tipoItem === 'bloque_header') {
 return (
 <div
 key={it.id}
 draggable={true}
 onDragStart={(e) => { if (TRANSPARENT_DRAG_IMAGE) e.dataTransfer.setDragImage(TRANSPARENT_DRAG_IMAGE, 0, 0); setDraggedItemIndex(index); }}
 onDragOver={(e) => { e.preventDefault(); setDragOverItemIndex(index); }}
 onDragLeave={() => { if (dragOverItemIndex === index) setDragOverItemIndex(null); }}
 onDrop={(e) => { e.preventDefault(); handleDropItem(index); }}
 onDragEnd={() => { setDraggedItemIndex(null); setDragOverItemIndex(null); }}
 onClick={() => setSelectedSetlistItemId(isSelected ? null : it.id)}
 className={`border rounded-lg transition-all cursor-pointer ${
 isDragging ? 'opacity-40 scale-[0.98]' : ''
 } ${
 isDragOver ? 'border-amber-400 border-2 scale-[1.01] bg-amber-500/10 shadow-lg' : ''
 } ${
 isSelected
   ? 'border-[#f2ca50] ring-2 ring-[#f2ca50]/30 bg-[#f2ca50]/10 shadow-md'
   : 'border-[#f2ca50]/50 bg-[#d1b375]/5 hover:border-[#f2ca50]/70'
 }`}
 >
 <div className="flex items-center gap-2 px-2.5 py-1.5">
   {/* Drag Handle */}
   <div
     className="cursor-grab active:cursor-grabbing text-[#f2ca50]/70 hover:text-[#f2ca50] transition-colors shrink-0"
     title="Arrastrar y soltar para reordenar"
     onClick={(e) => e.stopPropagation()}
   >
     <GripVertical className="w-3.5 h-3.5" />
   </div>

   {/* Icon */}
   <span className="text-[#f2ca50] shrink-0">⚡</span>

   {/* Title input - inline */}
   <input
     type="text"
     value={it.tituloCustom || ''}
     placeholder="Ej: 🔥 BLOQUE 1: CALENTAMIENTO"
     onClick={(e) => e.stopPropagation()}
     onChange={(e) => {
       const val = e.target.value;
       setSetlists(prev => prev.map(s => s.id === activeSetlist.id ? {
         ...s,
         items: s.items.map(x => x.id === it.id ? { ...x, tituloCustom: val } : x)
       } : s));
     }}
     className="bg-transparent text-[13px] font-extrabold font-mono text-[#f2ca50] border-b border-dashed border-[#f2ca50]/40 focus:outline-none min-w-0 flex-1 uppercase tracking-wider"
   />

   {/* Spacer */}
   <div className="flex-1"></div>

   {/* Controls */}
   <button
     onClick={() => { setEditingShowItem(it); setShowShowItemModal(true); }}
     className="p-0.5 text-[#f2ca50] hover:bg-[#f2ca50]/20 rounded transition-colors shrink-0 cursor-pointer"
     title="Editar Bloque"
   >
     <Edit3 className="w-3.5 h-3.5" />
   </button>
   <button
     onClick={() => handleRemoveSetlistItem(it.id)}
     className="p-0.5 text-neutral-400 hover:text-rose-400 transition-colors shrink-0"
     title="Eliminar Bloque"
   >
     <X className="w-3.5 h-3.5" />
   </button>
 </div>
 </div>
 );
 } else {
 const typeConfig = SHOW_ITEM_TYPES[it.tipoItem] || SHOW_ITEM_TYPES.otro;
 const durationText = formatItemDuration(it);

 return (
 <div
 key={it.id}
 draggable={true}
 onDragStart={(e) => { if (TRANSPARENT_DRAG_IMAGE) e.dataTransfer.setDragImage(TRANSPARENT_DRAG_IMAGE, 0, 0); setDraggedItemIndex(index); }}
 onDragOver={(e) => { e.preventDefault(); setDragOverItemIndex(index); }}
 onDragLeave={() => { if (dragOverItemIndex === index) setDragOverItemIndex(null); }}
 onDrop={(e) => { e.preventDefault(); handleDropItem(index); }}
 onDragEnd={() => { setDraggedItemIndex(null); setDragOverItemIndex(null); }}
 onClick={() => setSelectedSetlistItemId(isSelected ? null : it.id)}
 className={`border rounded-lg transition-all cursor-pointer ${typeConfig.bg} ${typeConfig.border} ${
 isDragging ? 'opacity-40 scale-[0.98]' : ''
 } ${
 isDragOver ? 'border-2 scale-[1.01] shadow-lg' : ''
 } ${
 isSelected ? 'ring-2 ring-amber-400/60 shadow-md' : ''
 }`}
 >
 <div className="flex items-center gap-2 px-2.5 py-1.5">
   {/* Drag Handle */}
   <div
     className="cursor-grab active:cursor-grabbing text-neutral-400 hover:text-amber-400 transition-colors shrink-0"
     title="Arrastrar y soltar para reordenar"
     onClick={(e) => e.stopPropagation()}
   >
     <GripVertical className="w-3.5 h-3.5" />
   </div>

   {/* Icon */}
   <span className="text-base shrink-0">{typeConfig.icon}</span>

   {/* Type Label */}
   <span className={`text-[8px] font-mono uppercase font-extrabold px-1.5 py-0.5 rounded-sm border shrink-0 ${typeConfig.text} ${typeConfig.border}`}>
     {typeConfig.label}
   </span>

   {/* Duration */}
   <span className="text-[9px] font-mono text-[#f2ca50] font-bold shrink-0">
     ⏱️ {durationText}
   </span>

   {/* Title - inline */}
   <input
     type="text"
     value={it.tituloCustom || ''}
     placeholder="Título/Descripción..."
     onClick={(e) => e.stopPropagation()}
     onChange={(e) => {
       const val = e.target.value;
       setSetlists(prev => prev.map(s => s.id === activeSetlist.id ? {
         ...s,
         items: s.items.map(x => x.id === it.id ? { ...x, tituloCustom: val } : x)
       } : s));
     }}
     className="bg-transparent border-b border-dashed border-white/20 text-[13px] font-bold font-mono text-white focus:outline-none min-w-0 flex-1"
   />

   {isSelected && (
     <span className="px-1 py-0.5 rounded text-[8px] font-mono font-bold bg-amber-500 text-black shrink-0">
       📌
     </span>
   )}

   {/* Controls */}
   <button
     onClick={() => { setEditingShowItem(it); setShowShowItemModal(true); }}
     className="p-0.5 text-neutral-400 hover:bg-neutral-800 rounded transition-colors shrink-0"
     title="Editar detalles"
   >
     <Edit3 className="w-3.5 h-3.5" />
   </button>
   <button
     onClick={() => handleRemoveSetlistItem(it.id)}
     className="p-0.5 text-neutral-400 hover:text-rose-400 transition-colors shrink-0"
     title="Quitar del setlist"
   >
     <X className="w-3.5 h-3.5" />
   </button>
 </div>

 {/* SHOW NOTES IF EXIST */}
 {it.notaTema && (
   <div className="px-2.5 py-1 border-t text-[8px] font-mono text-white/70 truncate" title={it.notaTema}>
     💡 {it.notaTema}
   </div>
 )}
 </div>
 );
 }
 })
 )}
 </div>
 </>
 ) : (
 <div className="text-center py-20 text-neutral-500 font-mono text-[10px]">
 Selecciona o crea un repertorio a la izquierda para empezar.
 </div>
 )}
 </div>
 </div>
 )}

 {/* VIEW 2: DISCOGRAFÍA & CATÁLOGO GENERAL DE TEMAS */}
 {activeTab === 'catalogo' && (
 <div className="space-y-5">
 {/* SPOTIFY PLAYLIST HERO BANNER — una sola fila compacta: portada pequeña + título/metadata + acciones, en vez del hero apilado de antes que llegaba a ocupar media pantalla en portátil. */}
 <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1b3e24] via-[#182a1e] to-[#121212] p-3 sm:p-4 border border-white/10 shadow-lg">
   <div className="relative z-10 flex flex-wrap items-center gap-3 sm:gap-4">
     <div className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#181818] shadow-lg overflow-hidden border border-white/10 flex items-center justify-center group">
       <AlbumCover
         title={`Repertorio ${bName}`}
         artist={bName}
         coverUrl={filteredSongs[0]?.portadaUrl}
         size={64}
         onPlay={() => {
           const first = filteredSongs[0];
           if (first) {
             selectPlayerSongWithQueue(first, true, null);
           }
         }}
         isPlaying={!!(activePlayerSong && isPlayerPlaying && filteredSongs.some(s => s.id === activePlayerSong.id))}
       />
       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
         <Sparkles className="w-5 h-5 text-[#1db954] animate-pulse" />
       </div>
     </div>

     <div className="flex-1 min-w-[180px]">
       <div className="flex items-center gap-1.5 text-[9px] font-mono font-extrabold uppercase tracking-widest text-[#1db954]">
         <Disc3 className="w-3 h-3 animate-spin-slow" />
         <span>Catálogo Completo</span>
       </div>
       <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-tight truncate">
         Repertorio & Directos {bName}
       </h1>
       <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-zinc-400 mt-0.5">
         <span className="text-[#1db954] font-bold">{songs.length} temas</span>
         <span>•</span>
         <span>{Math.round(songs.reduce((acc, s) => acc + (s.duracionSegundos || 210), 0) / 60)} min</span>
         <span>•</span>
         <span className="text-amber-400 font-semibold">{songs.filter(s => s.favoritoGeneral).length} Favoritos</span>
       </div>
     </div>

     <div className="flex items-center gap-2 shrink-0">
       <button
         onClick={() => {
           if (filteredSongs.length > 0) {
             const first = filteredSongs[0];
             selectPlayerSongWithQueue(first, true, null);
           }
         }}
         className="w-9 h-9 rounded-full bg-[#1db954] hover:bg-[#1ed760] hover:scale-105 text-black font-bold flex items-center justify-center shadow-lg transition-all cursor-pointer active:scale-95"
         title="Reproducir Catálogo"
       >
         {activePlayerSong && isPlayerPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
       </button>

       <button
         onClick={() => setCatalogStatusFilter(catalogStatusFilter === 'favoritos' ? 'todos' : 'favoritos')}
         className={`px-3 py-1.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border whitespace-nowrap ${
           catalogStatusFilter === 'favoritos'
             ? 'bg-[#1db954]/20 text-[#1ed760] border-[#1db954]/40 shadow-md'
             : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10 hover:text-white'
         }`}
       >
         <Sparkles className="w-3 h-3 text-[#1db954]" />
         <span>{catalogStatusFilter === 'favoritos' ? 'Solo Favoritos' : 'Filtrar Favoritos'}</span>
       </button>

       <button
         id="btn-add-song"
         onClick={() => { setEditingSong(null); setShowSongModal(true); }}
         className="px-3 py-1.5 rounded-full bg-white hover:bg-zinc-200 text-black font-extrabold text-[10px] font-mono flex items-center gap-1.5 cursor-pointer shadow-lg transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
       >
         <Plus className="w-3.5 h-3.5" />
         <span>Añadir Tema</span>
       </button>
     </div>
   </div>
 </div>

 {/* CATALOG FILTERS BAR */}
 <div className={`p-4 rounded-2xl flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center ${colors.card} `}>
 <div className="relative flex-1">
 <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500 pointer-events-none" />
 <input
 id="search-songs"
 type="text"
 placeholder="Buscar temas por título, tonalidad, voz principal o notas..."
 value={catalogSearch}
 onChange={(e) => setCatalogSearch(e.target.value)}
 className={`w-full rounded-lg pl-9 ${catalogSearch ? 'pr-8' : 'pr-3'} py-1.5 text-[10px] focus:outline-none font-mono transition-all ${
 isStitchLight 
 ? 'bg-white text-slate-800 focus:border-indigo-500 placeholder:text-slate-400' 
 : 'bg-[#131313] text-[#e5e2e1] focus:border-[#f2ca50]/50 placeholder:text-neutral-600'
 }`}
 />
 {catalogSearch && (
 <button
 id="search-songs-clear"
 type="button"
 onClick={() => setCatalogSearch('')}
 className={`absolute right-2.5 top-2 p-0.5 rounded-full transition-colors cursor-pointer ${
 isStitchLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
 }`}
 title="Borrar búsqueda"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 <div className="flex gap-2 flex-wrap sm:flex-nowrap">
 {/* Album dropdown */}
 <select
 value={catalogAlbumFilter}
 onChange={(e) => setCatalogAlbumFilter(e.target.value)}
 className={`text-[10px] font-mono py-1.5 px-3 rounded-lg focus:outline-none cursor-pointer ${
 isStitchLight ? 'bg-white text-slate-800' : 'bg-[#131313] text-neutral-200'
 }`}
 >
 <option value="todos">Todos los Discos / EPs</option>
 {albumsList.filter(a => a !== 'todos').map(alb => (
 <option key={alb} value={alb}>{alb}</option>
 ))}
 </select>

 {/* Status dropdown */}
 <select
 value={catalogStatusFilter}
 onChange={(e) => setCatalogStatusFilter(e.target.value)}
 className={`text-[10px] font-mono py-1.5 px-3 rounded-lg focus:outline-none cursor-pointer ${
 isStitchLight ? 'bg-white text-slate-800' : 'bg-[#131313] text-neutral-200'
 }`}
 >
 <option value="todos">Todos los estados</option>
 <option value="listo">Listo para Directo</option>
 <option value="ensayando">Ensayando</option>
 <option value="componiendo">Componiendo</option>
 <option value="descartado">Descartado</option>
            </select>
            <button
              onClick={() => setGroupByAlbum(!groupByAlbum)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all ${groupByAlbum ? (isStitchLight ? 'bg-indigo-100 text-indigo-700' : 'bg-[#f2ca50]/20 text-[#f2ca50]' ) : (isStitchLight ? 'bg-slate-50 text-slate-500' : 'bg-neutral-800 text-neutral-400')}`}
            >
              Agrupar por Álbum
            </button>

  <button
  id="btn-add-song"
  onClick={() => { setEditingSong(null); setShowSongModal(true); }}
  className="px-4 py-2 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold text-xs font-mono flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-lg transition-all hover:scale-105"
  >
  <Plus className="w-4 h-4" />
  <span>Añadir Tema</span>
  </button>
  </div>
  </div>

  {/* BULK ACTIONS BAR (appears once at least one catalog song is checked) */}
  {selectedCatalogIds.size > 0 && (
    <div className={`p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 border ${
      isStitchLight ? 'bg-indigo-50 border-indigo-200' : 'bg-[#1db954]/10 border-[#1db954]/30'
    }`}>
      <span className="text-xs font-mono font-bold text-[#1db954]">
        {selectedCatalogIds.size} canciones seleccionadas
      </span>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => handleBulkAddSelectedToSetlist(Array.from(selectedCatalogIds))}
          className="px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold bg-[#1db954] hover:bg-[#1ed760] text-black cursor-pointer transition-all flex items-center gap-1.5"
        >
          <ListPlus className="w-3.5 h-3.5" />
          <span>Añadir a Repertorio…</span>
        </button>
        <button
          type="button"
          onClick={() => handleBulkDeleteSongs(Array.from(selectedCatalogIds))}
          className="px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 cursor-pointer transition-all flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Eliminar Seleccionadas</span>
        </button>
        <button
          type="button"
          onClick={clearCatalogSelection}
          className="px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer transition-all"
        >
          Cancelar
        </button>
      </div>
    </div>
  )}

  {/* SPOTIFY TRACKLIST TABLE */}
  <div className="rounded-2xl overflow-hidden bg-[#121212] border border-zinc-800/80 shadow-2xl">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-left border-collapse">
 <thead>
 <tr className="border-b border-zinc-800/80 text-[11px] font-mono uppercase tracking-wider text-zinc-400 bg-black/40">
 <th className="py-3 px-3 w-8 text-center">
   <input
     type="checkbox"
     checked={filteredSongs.length > 0 && filteredSongs.every(s => selectedCatalogIds.has(s.id))}
     onChange={(e) => {
       if (e.target.checked) {
         setSelectedCatalogIds(new Set(filteredSongs.map(s => s.id)));
       } else {
         clearCatalogSelection();
       }
     }}
     className="w-3.5 h-3.5 cursor-pointer accent-[#1db954]"
     title="Seleccionar todo lo filtrado"
   />
 </th>
 <th className="py-3 px-4 w-12 text-center">#</th>
 <th className="py-3 px-4">TÍTULO Y TEMA</th>
 <th className="py-3 px-4">ÁLBUM / ESTADO</th>
 <th className="py-3 px-4">TONALIDAD / BPM</th>
 <th className="py-3 px-4">DURACIÓN</th>
 <th className="py-3 px-4 text-right">ACCIONES</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-zinc-800/60 text-xs font-mono">
 {filteredSongs.length === 0 ? (
 <tr>
 <td colSpan={7} className="text-center py-12 text-zinc-500 font-mono text-xs">
 No se encontraron canciones con los filtros seleccionados.
 </td>
 </tr>
 ) : (
 filteredSongs.map((s, idx) => {
 const isPlayingCurrent = activePlayerSong?.id === s.id;
 const isDrive = isGoogleDriveUrl(s.audioPrincipalUrl || '');
 const isSelected = selectedCatalogIds.has(s.id);

 const albumLabel = s.albumDisco || s.album || 'Singles / Sin Disco';
 const prevAlbumLabel = idx > 0 ? (filteredSongs[idx - 1].albumDisco || filteredSongs[idx - 1].album || 'Singles / Sin Disco') : null;
 const showAlbumHeader = groupByAlbum && albumLabel !== prevAlbumLabel;

 return (
 <React.Fragment key={`${s.id}-${idx}`}>
 {showAlbumHeader && (
   <tr className="bg-black/60">
     <td colSpan={7} className="py-2 px-4 text-[10px] font-mono font-bold uppercase tracking-wider text-[#f2ca50]">
       💿 {albumLabel}
     </td>
   </tr>
 )}
 <tr
 className={`group transition-all duration-150 cursor-pointer ${
   isPlayingCurrent
     ? 'bg-[#1db954]/10 text-white'
     : isSelected
     ? 'bg-[#1db954]/5 text-zinc-200'
     : 'hover:bg-zinc-900/80 text-zinc-300'
 }`}
 >
 {/* Column 0: Bulk-select Checkbox */}
 <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
   <input
     type="checkbox"
     checked={isSelected}
     onChange={() => toggleCatalogSelect(s.id)}
     className="w-3.5 h-3.5 cursor-pointer accent-[#1db954]"
   />
 </td>
 {/* Column 1: Track Number / Play Button */}
 <td className="py-3.5 px-4 text-center font-bold text-zinc-500">
 <button
 type="button"
 onClick={() => selectPlayerSongWithQueue(s, true, null)}
 className="w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer mx-auto group-hover:bg-[#1db954] group-hover:text-black"
 title={isPlayingCurrent && isPlayerPlaying ? "Pausar" : "Reproducir canción"}
 >
 {isPlayingCurrent ? (
 <div className="flex items-center gap-0.5">
 <span className="w-1 h-3 bg-[#1db954] rounded-full animate-pulse" />
 <span className="w-1 h-4 bg-[#1ed760] rounded-full animate-pulse delay-75" />
 <span className="w-1 h-2 bg-[#1db954] rounded-full animate-pulse delay-150" />
 </div>
 ) : (
 <>
 <span className="group-hover:hidden text-xs text-zinc-500 font-bold">{idx + 1}</span>
 <Play className="w-3.5 h-3.5 fill-current hidden group-hover:block ml-0.5 text-black" />
 </>
 )}
 </button>
 </td>

 {/* Column 2: Title & Details */}
 <td className="py-3.5 px-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden shrink-0 shadow-sm border border-white/5 flex items-center justify-center">
 {s.portadaUrl ? (
 <img src={s.portadaUrl} alt={s.titulo} className="w-full h-full object-cover" />
 ) : (
 <Music className={`w-5 h-5 ${isPlayingCurrent ? 'text-[#1db954]' : 'text-zinc-500'}`} />
 )}
 </div>

 <div>
 <div className="flex items-center gap-2 flex-wrap">
 <span className={`font-bold text-sm ${isPlayingCurrent ? 'text-[#1db954]' : 'text-white group-hover:text-[#1db954] transition'}`}>
 {s.titulo}
 </span>

 <button
 type="button"
 onClick={(e) => {
   e.stopPropagation();
   handleUpdateSongFromStudio({ ...s, favoritoGeneral: !s.favoritoGeneral });
 }}
 className={`p-1 rounded-md transition-all cursor-pointer ${
   s.favoritoGeneral 
     ? 'text-[#1db954]' 
     : 'text-zinc-600 hover:text-[#1db954]'
 }`}
 title={s.favoritoGeneral ? "Tema Favorito para Repertorio" : "Marcar como Favorito"}
 >
 <Sparkles className={`w-3.5 h-3.5 ${s.favoritoGeneral ? 'fill-[#1db954]' : ''}`} />
 </button>

 {s.audioPrincipalUrl ? (
 <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
   <Volume2 className="w-3 h-3 text-emerald-400" />
   {isDrive ? 'Drive' : 'Audio OK'}
 </span>
 ) : (s.audioIdeas || []).length > 0 ? (
 <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
   {s.audioIdeas?.length} Ideas
 </span>
 ) : (
 <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">
   Demo Ensayo
 </span>
 )}
 </div>

 {s.notasInternas && (
 <p className="text-[11px] text-zinc-500 line-clamp-1 italic mt-0.5 font-sans">
 {s.notasInternas}
 </p>
 )}
 </div>
 </div>
 </td>

 {/* Column 3: Album & Status */}
 <td className="py-3.5 px-4 text-zinc-400">
 <div className="font-semibold text-zinc-300">{s.albumDisco || 'Sin Disco'}</div>
 <span className={`inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
 s.estadoTema === 'listo'
 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
 : s.estadoTema === 'ensayando'
 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
 : 'bg-zinc-800 text-zinc-500'
 }`}>
 {s.estadoTema === 'listo' ? 'Listo Directo' : s.estadoTema === 'ensayando' ? 'Ensayando' : s.estadoTema || 'componiendo'}
 </span>
 </td>

 {/* Column 4: Key & BPM */}
 <td className="py-3.5 px-4 text-zinc-300 font-mono">
 <div className="flex items-center gap-2">
 <span className="px-2 py-0.5 rounded bg-[#1db954]/20 text-[#1ed760] font-bold text-xs border border-[#1db954]/30">
 {s.tonalidad || 'Am'}
 </span>
 <span className="text-zinc-400 text-xs">{s.bpm} BPM</span>
 </div>
 <div className="text-[10px] text-zinc-500 mt-0.5">{s.afinacion || 'E Standard'}</div>
 </td>

 {/* Column 5: Duration */}
 <td className="py-3.5 px-4 text-zinc-300 font-bold font-mono">
 {s.duracion}
 </td>

 {/* Column 6: Actions */}
 <td className="py-3.5 px-4 text-right">
 <div className="flex items-center justify-end gap-1.5">
 <button
 type="button"
 onClick={() => setActiveStudioSong(s)}
 className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-all"
 title="Abrir Studio de Audios & Ideas"
 >
 <Headphones className="w-3.5 h-3.5 text-indigo-400" />
 <span>Studio</span>
 {(s.audioIdeas || []).length > 0 && (
 <span className="px-1.5 py-0.5 bg-indigo-500/40 text-white rounded-full text-[9px]">
 {(s.audioIdeas || []).length}
 </span>
 )}
 </button>

 <button
 type="button"
 onClick={() => setActiveChordsSong(s)}
 className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
 title="Ver Acordes y Ficha para Músicos Sustitutos"
 >
 <FileText className="w-3.5 h-3.5 text-amber-400" />
 <span>Acordes</span>
 </button>

  <button
    type="button"
    onClick={() => setActiveMemberNotesSong(s)}
    className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
    title="Gestionar Notas para Repertorio por Miembro de la Banda"
  >
    <Users className="w-3.5 h-3.5 text-emerald-400" />
    <span>Notas Miembros</span>
    {s.notasMiembros && Object.keys(s.notasMiembros).length > 0 && (
      <span className="px-1.5 py-0.5 bg-emerald-500/40 text-white rounded-full text-[9px]">
        {Object.keys(s.notasMiembros).length}
      </span>
    )}
  </button>

 {s.enlaceAcordes && (
 <a
 href={s.enlaceAcordes}
 target="_blank"
 rel="noreferrer"
 className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
 title="Abrir Google Drive / Enlace Externo de Partitura"
 >
 <ExternalLink className="w-3.5 h-3.5" />
 </a>
 )}

 <button
 type="button"
 onClick={() => handleShareSong(s)}
 className="p-1.5 text-emerald-400 hover:text-emerald-300 rounded-lg hover:bg-emerald-500/20 transition cursor-pointer"
 title="Compartir esta canción y ficha por WhatsApp"
 >
 <MessageSquare className="w-3.5 h-3.5 fill-emerald-400/20" />
 </button>

 <button
 type="button"
 onClick={() => { setEditingSong(s); setShowSongModal(true); }}
 className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
 title="Editar Canción"
 >
 <Edit3 className="w-3.5 h-3.5" />
 </button>

 <button
 type="button"
 onClick={() => handleDeleteSong(s.id)}
 className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition"
 title="Eliminar Canción"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 </td>
 </tr>
 </React.Fragment>
 );
 })
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}

 {/* VIEW 2B: DISCOGRAFÍA SPOTIFY ALBUMS GRID */}
 {activeTab === 'discografia' && (
   <DiscografiaView
     songs={songs}
     albumsList={albumsList}
     colors={colors}
     isStitchLight={isStitchLight}
     bandName={bName}
     setSongs={setSongs}
     setSetlists={setSetlists}
     toggleFavoriteSong={handleToggleFavorite}
     activePlayerSong={activePlayerSong}
     isPlayerPlaying={isPlayerPlaying}
     onSelectSong={(song, autoPlay) => selectPlayerSongWithQueue(song, autoPlay, null)}
     onRequestDeleteAlbum={(albumName, songCount) => setDeleteAlbumData({ albumName, songCount })}
     onEditAlbum={(albumName) => setAssignSongsModalData({ isOpen: true, albumName })}
     onCreateAlbum={() => setAssignSongsModalData({ isOpen: true, albumName: '' })}
     onOpenMemberNotes={(song) => setActiveMemberNotesSong(song)}
     onOpenChords={(song) => setActiveChordsSong(song)}
   />
 )}

 {/* MODAL: ADD / EDIT SONG */}
 {/* key fuerza un remount por canción: SongModal se queda siempre montado (isOpen controla un
     `return null` interno, no un desmontaje), así que sin key su useState de notas por miembro
     (y duración/álbum) solo se inicializa una vez para toda la sesión con el primer editingSong
     que se vio (normalmente null) y nunca se resincroniza al abrir otra canción — ver notas del
     bug en SongModal.tsx: memberNotesState quedaba "congelado" y el guardado de notas por
     miembro sobrescribía siempre con ese valor obsoleto/vacío. */}
 <SongModal
   key={showSongModal ? (editingSong?.id || 'new-song') : 'closed'}
   isOpen={showSongModal}
    bandMembers={bandRosterMembers}
   editingSong={editingSong}
   defaultAlbumForNewSong={defaultAlbumForNewSong}
   albumsList={albumsList}
   colors={colors}
   isStitchLight={isStitchLight}
   onClose={() => setShowSongModal(false)}
   onSave={handleSaveSong}
 />

  {/* MODAL: ASSIGN SETLIST TO CONCERT OR REHEARSAL */}
  <AssignSetlistModal
    assigningSetlist={assigningSetlist}
    colors={colors}
    isStitchLight={isStitchLight}
    concerts={concerts}
    rehearsals={rehearsals}
    selectedConcertToAssign={selectedConcertToAssign}
    onSelectEvent={(id) => setSelectedConcertToAssign(id)}
    onClose={() => setAssigningSetlist(null)}
    onSave={handleAssignSetlistToConcert}
  />

  {/* MODAL: ADD OR EDIT NON-SONG SHOW ITEM OR BLOCK */}
  {showShowItemModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
  <div className={`w-full max-w-lg p-6 rounded-2xl space-y-4 shadow-2xl ${colors.card} border border-sky-500/30`}>
  <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
  <div className="flex items-center gap-2">
  <span className="p-2 bg-sky-500/20 text-sky-400 rounded-xl">⚡</span>
  <div>
  <h3 className={`text-sm font-extrabold font-mono uppercase ${colors.text}`}>
  {editingShowItem ? 'Editar Interludio / Evento del Show' : 'Nuevo Interludio / Bloque del Show'}
  </h3>
  <p className="text-[10px] text-neutral-400 font-sans">
  Organiza momentos del directo (beatbox, presentaciones, bloque de temas, pausas).
  </p>
  </div>
  </div>
  <button 
  onClick={() => { setShowShowItemModal(false); setEditingShowItem(null); }} 
  className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 cursor-pointer"
  >
  <X className="w-5 h-5" />
  </button>
  </div>

  <form onSubmit={(e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const formData = new FormData(form);
  const tipo = formData.get('tipoItem') as SetlistItem['tipoItem'];
  const titulo = formData.get('tituloCustom') as string;
  const min = parseInt(formData.get('minutos') as string, 10) || 0;
  const seg = parseInt(formData.get('segundos') as string, 10) || 0;
  const totalSeg = min * 60 + seg;
  const notas = formData.get('notaTema') as string;

  handleSaveShowItem({
  tipoItem: tipo,
  tituloCustom: titulo,
  duracionEstimadaMinutos: Math.ceil(totalSeg / 60),
  duracionEstimadaSegundos: totalSeg,
  notaTema: notas
  });
  }} className="space-y-4 text-xs font-mono">

  <div>
  <label className="block text-neutral-300 font-bold mb-1">Categoría del Evento *</label>
  <select
  name="tipoItem"
  defaultValue={editingShowItem?.tipoItem || 'presentacion'}
  className={`w-full p-2.5 rounded-xl border border-neutral-800 focus:outline-none cursor-pointer ${
  isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
  }`}
  onChange={(e) => {
  const val = e.target.value as keyof typeof SHOW_ITEM_TYPES;
  const titleInput = (e.target.form?.elements.namedItem('tituloCustom') as HTMLInputElement);
  if (titleInput && (!titleInput.value || Object.values(SHOW_ITEM_TYPES).some(t => t.label === titleInput.value))) {
  if (SHOW_ITEM_TYPES[val]) {
  titleInput.value = SHOW_ITEM_TYPES[val].label;
  }
  }
  }}
  >
  {Object.entries(SHOW_ITEM_TYPES).map(([key, config]) => (
  <option key={key} value={key}>
  {config.icon} {config.label}
  </option>
  ))}
  </select>
  </div>

  <div>
  <label className="block text-neutral-300 font-bold mb-1">Título / Nombre en la Hoja de Escenario *</label>
  <input
  name="tituloCustom"
  type="text"
  required
  defaultValue={editingShowItem?.tituloCustom || 'Presentación de la Banda'}
  placeholder="Ej: Solo Beatbox Filgue, Presentación Larra, Intro Acústica..."
  className={`w-full p-2.5 rounded-xl border border-neutral-800 focus:outline-none ${
  isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
  }`}
  />
  </div>

  <div className="p-3 bg-black/40 rounded-xl border border-neutral-800 space-y-2">
  <label className="block text-amber-400 font-bold text-[11px] flex items-center gap-1.5">
  <Clock className="w-3.5 h-3.5" />
  Tiempo Asignado al Evento (Minutos y Segundos) *
  </label>
  <div className="grid grid-cols-2 gap-3">
  <div>
  <span className="text-[10px] text-neutral-400 block mb-1">Minutos:</span>
  <input
  name="minutos"
  type="number"
  min="0"
  max="60"
  defaultValue={editingShowItem?.duracionEstimadaSegundos ? Math.floor(editingShowItem.duracionEstimadaSegundos / 60) : (editingShowItem?.duracionEstimadaMinutos || 2)}
  className={`w-full p-2 rounded-lg border border-neutral-800 text-center font-bold text-sm ${
  isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
  }`}
  />
  </div>
  <div>
  <span className="text-[10px] text-neutral-400 block mb-1">Segundos:</span>
  <input
  name="segundos"
  type="number"
  min="0"
  max="59"
  defaultValue={editingShowItem?.duracionEstimadaSegundos ? (editingShowItem.duracionEstimadaSegundos % 60) : 0}
  className={`w-full p-2 rounded-lg border border-neutral-800 text-center font-bold text-sm ${
  isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
  }`}
  />
  </div>
  </div>
  <p className="text-[9px] text-neutral-400 italic">
  Este tiempo se suma automáticamente a la duración total del concierto.
  </p>
  </div>

  <div>
  <label className="block text-neutral-300 font-bold mb-1">Notas / Cues para la Banda / Sonido (Opcional)</label>
  <textarea
  name="notaTema"
  rows={2}
  defaultValue={editingShowItem?.notaTema || ''}
  placeholder="Ej: Foco rojo a Filgue, aviso de merchandising en mesa, cambio a guitarra en Drop D..."
  className={`w-full p-2.5 rounded-xl border border-neutral-800 focus:outline-none ${
  isStitchLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'
  }`}
  />
  </div>

  <div className="p-3 bg-black/40 rounded-xl border border-sky-500/30 space-y-3">
  <div className="flex items-center justify-between">
    <label className="block text-sky-400 font-bold text-[11px] flex items-center gap-1.5">
      <Mic className="w-3.5 h-3.5" />
      Audio de la Presentación / Chapa / Ensayo
    </label>
    {showItemAudioUrl && (
      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
        <Check className="w-3 h-3" /> Audio Guardado
      </span>
    )}
  </div>

  <div className="flex flex-wrap items-center gap-2">
    {isRecordingShowItem ? (
      <button
        type="button"
        onClick={handleStopRecordingShowItem}
        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 animate-pulse cursor-pointer shadow-lg"
      >
        <Square className="w-3.5 h-3.5 fill-current" />
        <span>Detener Grabación ({recordingShowItemSecs}s)</span>
      </button>
    ) : (
      <button
        type="button"
        onClick={handleStartRecordingShowItem}
        className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
      >
        <Mic className="w-3.5 h-3.5" />
        <span>{showItemAudioUrl ? 'Regrabar Voz' : 'Grabar Voz'}</span>
      </button>
    )}

    <label className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-neutral-700">
      <Upload className="w-3.5 h-3.5 text-sky-400" />
      <span>Subir MP3 / WAV</span>
      <input
        type="file"
        accept="audio/*"
        onChange={handleShowItemAudioFileUpload}
        className="hidden"
      />
    </label>

    {showItemAudioUrl && (
      <button
        type="button"
        onClick={() => {
          setShowItemAudioUrl('');
          setRecordingShowItemSecs(0);
        }}
        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 cursor-pointer"
        title="Eliminar Audio"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    )}
  </div>

  {showItemAudioUrl && (
    <div className="pt-1">
      <audio src={showItemAudioUrl} controls className="w-full h-8 accent-sky-500" />
    </div>
  )}

  <p className="text-[9px] text-neutral-400 italic">
    Graba o sube la charla o performance para medir la duración exacta e incluirla en el reproductor del concierto.
  </p>
  </div>

  <div className="pt-2 flex justify-end gap-2">
  <button
  type="button"
  onClick={() => { setShowShowItemModal(false); setEditingShowItem(null); }}
  className="px-3 py-2 rounded-xl text-neutral-400 hover:bg-neutral-800 text-xs font-mono cursor-pointer"
  >
  Cancelar
  </button>
  <button
  type="submit"
  className="px-4 py-2 rounded-xl bg-sky-500 text-white font-bold hover:bg-sky-400 shadow-lg text-xs font-mono cursor-pointer flex items-center gap-1.5"
  >
  <span>Guardar en Setlist</span>
  </button>
  </div>
  </form>
  </div>
  </div>
  )}


      {/* PDF Preview Modal */}
      <PdfExportModal
        bandMembers={bandRosterMembers}
        bandLogoUrl={isBakandeya ? '/logo_bakandeya_bueno_sin_fondo.png' : (bandLogoUrl || '')}
        isOpen={showPdfPreview}
        activeSetlist={activeSetlist}
        activeSetlistMetrics={activeSetlistMetrics}
        songs={songs}
        isStitchLight={isStitchLight}
        onClose={() => setShowPdfPreview(false)}
        bandName={bName}
        onUpdateSong={handleUpdateSongFromStudio}
      />

 {activeStudioSong && (
 <SongStudioModal
 song={activeStudioSong}
 colors={colors}
 isStitchLight={isStitchLight}
 onClose={() => setActiveStudioSong(null)}
 onUpdateSong={handleUpdateSongFromStudio}
 />
 )}

 {/* Persistent Spotify Music Player Bottom Bar — `songs` es la cola real de Siguiente/Anterior
     y del fundido: el catálogo completo por defecto, o el repertorio activo cuando se arrancó
     con "Reproducir desde aquí" (ver playerQueueOverride/selectPlayerSongWithQueue).
     Portal a document.body a propósito: el shell raíz de la app (App.tsx) tiene
     `overflow-clip` en todo el layout, y eso atrapa cualquier `position: fixed` anidado dentro
     — sin el portal, la barra "fixed" quedaba pegada al final del contenido en vez de al fondo
     real de la ventana, así que solo se veía al hacer scroll hasta abajo del todo. Mismo truco
     que el popover de energía (ver energyPopoverPos) para el mismo problema de overflow. */}
 {activePlayerSong && createPortal(
 <SpotifyPlayerBar
 song={activePlayerSong}
 songs={playerQueueOverride || songs}
 colors={colors}
 onSelectSong={(newSong, autoPlay) => handleSelectPlayerSong(newSong, autoPlay)}
 onOpenStudio={(songToOpen) => setActiveStudioSong(songToOpen)}
 onUpdateSong={handleUpdateSongFromStudio}
 onClosePlayer={() => selectPlayerSongWithQueue(null, false, null)}
 autoPlay={playerAutoPlay}
 playSignal={playSignal}
 onIsPlayingChange={setIsPlayerPlaying}
 />,
 document.body
 )}

{assignSongsModalData && assignSongsModalData.isOpen && (
  <AssignSongsToAlbumModal
    isOpen={assignSongsModalData.isOpen}
    albumName={assignSongsModalData.albumName}
    songs={songs}
    colors={colors}
    isStitchLight={isStitchLight}
    onClose={() => setAssignSongsModalData(null)}
    onSaveAlbumSongs={handleSaveAlbumSongs}
  />
)}

{setlistModalData && setlistModalData.isOpen && (
  <SetlistModal
    isOpen={setlistModalData.isOpen}
    setlistToEdit={setlistModalData.setlistToEdit}
    colors={colors}
    isStitchLight={isStitchLight}
    onClose={() => setSetlistModalData(null)}
    onSave={handleSaveSetlistModal}
  />
)}

{isAddSongsModalOpen && activeSetlist && (
  <AddSongsToSetlistModal
    isOpen={isAddSongsModalOpen}
    songs={songs}
    existingSongIds={activeSetlist.items.map(it => it.songId).filter((id): id is string => Boolean(id))}
    colors={colors}
    isStitchLight={isStitchLight}
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
      isStitchLight={isStitchLight}
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
    onClose={() => setShareModalData(prev => ({ ...prev, isOpen: false }))}
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
    isStitchLight={isStitchLight}
    onSongsImported={(updatedSongs) => {
      setSongs(updatedSongs);
    }}
  />

  {/* LIGHTWEIGHT AI CHORDS/LYRICS ANALYSIS STATUS BANNER */}
  {statusBanner && (
    <div
      className={`fixed bottom-5 right-5 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-2xl text-xs font-mono max-w-sm ${
        statusBanner.type === 'success'
          ? 'bg-emerald-950 border-emerald-700/60 text-emerald-100'
          : statusBanner.type === 'error'
          ? 'bg-rose-950 border-rose-700/60 text-rose-100'
          : statusBanner.type === 'warning'
          ? 'bg-amber-950 border-amber-700/60 text-amber-100'
          : 'bg-neutral-900 border-neutral-700 text-neutral-100'
      }`}
    >
      {statusBanner.type === 'loading' && (
        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
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
    setlistId={activeSetlist?.id || ''}
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
</div>
 );
}
