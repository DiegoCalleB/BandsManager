import React, { useState } from'react';
import { Song, ThemeColors } from'../../types';
import { Disc, Disc3, Star, Play, Pause, Trash2, ArrowUp, ArrowDown, Edit3, Plus, Music, Clock, ChevronDown, ChevronUp, Layers, Scissors, Sparkles, Users, FolderUp, FileText, Headphones, Loader2, Search, X, Download } from'lucide-react';
import { AlbumCover } from'../AlbumCover';
import { PublicoSilhouette } from'../ui/PublicoSilhouette';
import { uploadFileToServer, saveSongsToLocalStorageSafely } from'../../utils/audioStorage';
import { apiFetch } from'../../utils/api';
import { LiveConcertToAlbumModal, TrackCutItem } from'./LiveConcertToAlbumModal';
import { SpotifyDiscographyModal } from'./SpotifyDiscographyModal';
import { BulkAlbumAudioUploaderModal } from'./BulkAlbumAudioUploaderModal';
import { ExportAlbumSongsModal } from'./ExportAlbumSongsModal';
import { SongCardRow } from'./SongCardRow';

interface DiscografiaViewProps {
 songs: Song[];
 albumsList: string[];
 colors: ThemeColors;
 isStitchLight: boolean;
 bandName?: string;
 setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
 setSetlists?: React.Dispatch<React.SetStateAction<any[]>>;
 toggleFavoriteSong: (id: string) => void;
 activePlayerSong?: Song | null;
 isPlayerPlaying?: boolean;
 onSelectSong?: (song: Song | null, autoPlay?: boolean, queue?: Song[] | null) => void;
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
 if (typeof s.duracionSegundos ==='number' && s.duracionSegundos > 0) {
 return acc + s.duracionSegundos;
 }
 if (s.duracion && s.duracion.includes(':')) {
 const parts = s.duracion.split(':');
 const m = parseInt(parts[0], 10) || 0;
 const sec = parseInt(parts[1], 10) || 0;
 return acc + (m * 60 + sec);
 }
 return acc;
 }, 0);

 if (totalSeconds <= 0) return'0 min';
 const mins = Math.floor(totalSeconds / 60);
 const secs = totalSeconds % 60;
 if (mins >= 60) {
 const hrs = Math.floor(mins / 60);
 const remMins = mins % 60;
 return `${hrs} h ${remMins} min`;
 }
 return `${mins} min ${secs > 0 ? `${secs} s` :''}`;
};

export const DiscografiaView: React.FC<DiscografiaViewProps> = ({
 songs = [],
 albumsList = [],
 colors,
 isStitchLight,
 bandName,
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
 const [activeFilterTab, setActiveFilterTab] = useState<'todos' |'albumes' |'singles'>('todos');
 const [expandedAlbums, setExpandedAlbums] = useState<Record<string, boolean>>({});
 const [isLiveConcertModalOpen, setIsLiveConcertModalOpen] = useState(false);
 const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
 const [bulkUploadAlbum, setBulkUploadAlbum] = useState<{ name: string; songs: Song[] } | null>(null);
 const [dynamicsAnalysis, setDynamicsAnalysis] = useState<{ running: boolean; done: number; total: number; failedTitles: string[] } | null>(null);
 // Las 4 formas de crear un disco (vacío / subir MP3-WAV / Spotify / recortar de un concierto)
 // vivían como 4 botones de texto siempre visibles — se usan una vez por disco, no en cada
 // visita. Un solo punto de entrada"+ Nuevo disco" con las 4 opciones explicadas, mismo patrón
 // que el"🧠 Asistente IA" de RepertorioSetlists.tsx (AGENTS.md §6).
 const [showCreateAlbumMenu, setShowCreateAlbumMenu] = useState(false);
 const [draggedItem, setDraggedItem] = useState<{ album: string; index: number } | null>(null);
 const [dragOverItem, setDragOverItem] = useState<{ album: string; index: number } | null>(null);
 const [searchQuery, setSearchQuery] = useState('');
 const [exportModalData, setExportModalData] = useState<{ isOpen: boolean; albumName?: string }>({ isOpen: false });

 const handleSaveLiveConcertAlbum = (albumTitle: string, tracks: TrackCutItem[]) => {
 const createdSongs: Song[] = tracks.map((t) => {
 const mins = Math.floor(t.duration / 60);
 const secs = Math.floor(t.duration % 60);
 const durationStr = `${mins}:${String(secs).padStart(2,'0')}`;
 const songAudioUrl = t.audioUrl ||'';

 return {
 id: `live_song_${Date.now()}_${t.index}`,
 titulo: t.title,
 artista:'Nuestra Banda',
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
 titulo:'Audio Recortado Directo',
 seccion:'general' as const,
 audioUrl: songAudioUrl,
 subidoPor:'Concierto en Directo',
 fecha: new Date().toISOString(),
 },
 ]
 : [],
 tipo: t.type ==='musica' ?'cancion' :'interludio',
 ordenAlbum: t.index,
 speechTranscription: t.speechTranscription ||'',
 cifradoTexto: t.lyricsWithChords ||'',
 tonalidad: t.tonalidad ||'Mim',
 bpm: t.bpm || 120,
 favorite: false,
 cueIn: t.cueIn,
 cueOut: t.cueOut,
 trimSilenceDetectedAt: (t.cueIn || t.cueOut) ? new Date().toISOString() : undefined,
 applauseDetected: (t.hasApplauseIntro || t.hasApplauseOutro) ? {
 intro: Boolean(t.hasApplauseIntro),
 outro: Boolean(t.hasApplauseOutro),
 introDurationSec: t.cueIn || 0,
 outroDurationSec: t.cueOut ? Math.max(0, t.duration - t.cueOut) : 0,
 } : undefined,
 };
 });

 const updatedSongs = [...songs, ...createdSongs];
 setSongs(updatedSongs);
 saveSongsToLocalStorageSafely(updatedSongs);

 // Save each new song to backend API
 createdSongs.forEach((song) => {
 apiFetch('/api/songs', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify(song),
 }).catch((err) => console.warn('Could not persist live song to backend:', err));
 });

 // Auto expand new album in UI
 setExpandedAlbums((prev) => ({ ...prev, [albumTitle]: true }));
 };

 const safeSongs = (songs || []).filter((s): s is Song => Boolean(s && typeof s ==='object' && s.id));
 const safeAlbumsList = (albumsList || []).filter((a): a is string => Boolean(a && typeof a ==='string'));

 const allNonEmptyAlbums = safeAlbumsList.filter((a) => a !=='todos');

 const cleanSearchQuery = searchQuery.trim().toLowerCase();

 const songMatchesSearch = (s: Song, query: string): boolean => {
 if (!query) return true;
 const title = (s.titulo ||'').toLowerCase();
 const artist = (s.artista ||'').toLowerCase();
 const key = (s.tonalidad ||'').toLowerCase();
 const albumName = (s.albumDisco || s.album ||'').toLowerCase();
 const speech = (s.speechTranscription ||'').toLowerCase();
 return (
 title.includes(query) ||
 artist.includes(query) ||
 key.includes(query) ||
 albumName.includes(query) ||
 speech.includes(query)
 );
 };

 const filteredAlbums = allNonEmptyAlbums.filter((album) => {
 if (activeFilterTab ==='albumes' && album ==='Singles / Sin Disco') {
 return false;
 }
 if (activeFilterTab ==='singles' && album !=='Singles / Sin Disco') {
 return false;
 }

 if (!cleanSearchQuery) return true;

 // Si el nombre del disco coincide con la búsqueda
 if (album.toLowerCase().includes(cleanSearchQuery)) return true;

 // O si alguna de sus canciones coincide con la búsqueda
 const albumSongs = safeSongs.filter((s) => {
 const songAlbum = (s.albumDisco || s.album ||'').trim();
 const albumClean = album.trim();
 if (albumClean ==='Singles / Sin Disco') {
 return !songAlbum || songAlbum ==='Singles / Sin Disco';
 }
 return songAlbum === albumClean || songAlbum.toLowerCase() === albumClean.toLowerCase();
 });

 return albumSongs.some((s) => songMatchesSearch(s, cleanSearchQuery));
 });

 const toggleAlbumExpand = (albumName: string) => {
 setExpandedAlbums((prev) => ({
 ...prev,
 [albumName]: !prev[albumName],
 }));
 };

 const areAllExpanded = filteredAlbums.length > 0 && filteredAlbums.every((a) => expandedAlbums[a] === true);

 const toggleAllAlbums = () => {
 const nextState = !areAllExpanded;
 const newMap: Record<string, boolean> = {};
 filteredAlbums.forEach((a) => {
 newMap[a] = nextState;
 });
 setExpandedAlbums(newMap);
 };

 const handleMoveSongInAlbum = (albumName: string, sortedAlbumSongs: Song[], songId: string, direction:'up' |'down') => {
 const index = sortedAlbumSongs.findIndex((s) => s.id === songId);
 if (index < 0) return;
 const targetIndex = direction ==='up' ? index - 1 : index + 1;
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
 method:'PUT',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify(updatedSong),
 }).catch((err) => console.error('Error updating song order in album on server:', err));
 });
 };

 const handleDropSongInAlbum = (albumName: string, sortedAlbumSongs: Song[], sourceIndex: number, targetIndex: number) => {
 if (sourceIndex === targetIndex || sourceIndex < 0 || targetIndex < 0 || targetIndex >= sortedAlbumSongs.length) return;

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
 method:'PUT',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify(updatedSong),
 }).catch((err) => console.error('Error updating song order in album on server:', err));
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
 return Boolean(audio) && (!s.energiaVariacionCalculadaEn || !s.bpmDetectadoEn || !s.tonalidadDetectadaEn);
 });

 const handleAnalyzeAllDynamics = async () => {
 const pending = songsPendingDynamicsAnalysis;
 if (pending.length === 0 || dynamicsAnalysis?.running) return;

 setDynamicsAnalysis({ running: true, done: 0, total: pending.length, failedTitles: [] });

 const CONCURRENCIA = 2;
 let siguiente = 0;
 let completadas = 0;
 const fallidas: string[] = [];

 const trabajador = async () => {
 while (siguiente < pending.length) {
 const song = pending[siguiente++];
 const audio = song.audioPrincipalUrl || (song as any).audioUrl;
 try {
 const result = await apiFetch<{ variacionDetectada: number; audioAnalizable: boolean; bpmDetectado: number | null; tonalidadDetectada: string | null }>(`/api/songs/${song.id}/analizar-dinamica`, {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({ audioUrl: audio }),
 });
 // El backend no marca"analizado" cuando el audio no fue analizable (por ejemplo si
 // la descarga falló) — aquí tampoco: si se hiciera, la canción quedaría marcada como
 // analizada para siempre y la próxima repesca nunca la reintentaría.
 if (!result.audioAnalizable) {
 throw new Error('El audio no se pudo analizar (no accesible o formato no soportado)');
 }
 const ahora = new Date().toISOString();
 setSongs((prev) =>
 prev.map((s) => (s.id === song.id ? {
 ...s,
 energiaVariacion: result.variacionDetectada,
 energiaVariacionCalculadaEn: ahora,
 ...(result.bpmDetectado !== null ? { bpm: result.bpmDetectado, bpmDetectadoEn: ahora } : {}),
 ...(result.tonalidadDetectada ? { tonalidad: result.tonalidadDetectada, tonalidadDetectadaEn: ahora } : {})
 } : s))
 );
 } catch (err) {
 console.warn(`No se pudo analizar la dinámica interna de"${song.titulo}":`, err);
 fallidas.push(song.titulo);
 }
 completadas++;
 setDynamicsAnalysis({ running: true, done: completadas, total: pending.length, failedTitles: fallidas });
 }
 };

 await Promise.all(Array.from({ length: Math.min(CONCURRENCIA, pending.length) }, trabajador));
 setDynamicsAnalysis({ running: false, done: pending.length, total: pending.length, failedTitles: fallidas });
 };

 return (
 <div
 className={`p-3.5 sm:p-6 md:p-8 rounded-[var(--r-l)] sm:rounded-3xl shadow-xl transition-all ${
 isStitchLight ?'bg-white' :'bg-[var(--surface)]/95 backdrop-blur-sm'
 }`}
 >
 {/* Top Controls Bar (Search + Quick Filters + Actions) */}
 <div className="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b /60 space-y-2.5">
 {/* Desktop title row (hidden on mobile to keep screen ultra-clean since RepertorioNavBar already provides title) */}
 <div className="hidden sm:flex items-center justify-between gap-3">
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-[var(--r-m)] bg-[var(--acc)]/15 flex items-center justify-center shadow-inner shrink-0">
 <Disc3 className="w-4 h-4 text-[var(--acc)]" />
 </div>
 <div>
 <h2 className="text-base sm:text-lg font-bold tracking-tight text-[var(--ink)]">
 Lanzamientos & Discografía
 </h2>
 <p className="text-xs text-[var(--ink-2)]">
 {allNonEmptyAlbums.length} {allNonEmptyAlbums.length === 1 ?'lanzamiento' :'lanzamientos'} • {safeSongs.length} temas
 </p>
 </div>
 </div>

 {/* Desktop"+ Nuevo Disco" and"Exportar Canciones" Buttons */}
 <div className="flex items-center gap-2 relative">
 <button
 type="button"
 onClick={() => setExportModalData({ isOpen: true, albumName:'all' })}
 className={`px-3.5 py-1.5 rounded-[var(--r-m)] font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all ${
 isStitchLight
 ?'bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink)]'
 :'bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink)] hover:text-[var(--ink)] /80'
 }`}
 title="Exportar canciones de la discografía a Excel, M3U playlist, TXT o PDF"
 >
 <Download className="w-3.5 h-3.5 text-emerald-400" />
 <span>Exportar</span>
 </button>

 <button
 type="button"
 onClick={() => setShowCreateAlbumMenu((v) => !v)}
 className="px-3.5 py-1.5 rounded-[var(--r-m)] bg-[var(--acc)] hover:bg-[var(--acc)] text-[var(--on-acc)] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>Nuevo Disco</span>
 </button>
 {showCreateAlbumMenu && (
 <>
 <div className="fixed inset-0 z-30" onClick={() => setShowCreateAlbumMenu(false)} />
 <div className={`absolute right-0 top-full mt-1.5 z-40 w-72 rounded-[var(--r-l)] shadow-2xl p-1.5 space-y-1 text-xs backdrop-blur-md ${
 isStitchLight
 ?' bg-[var(--surface)] text-[var(--ink)]'
 :' bg-[var(--surface)] text-[var(--ink)]'
 }`}>
 {onCreateAlbum && (
 <button
 type="button"
 onClick={() => { setShowCreateAlbumMenu(false); onCreateAlbum(); }}
 className={`w-full text-left p-2.5 rounded-[var(--r-m)] transition-all cursor-pointer flex items-start gap-2.5 ${
 isStitchLight ?'hover:bg-[var(--sunken)]' :'hover:bg-[var(--surface)]/80'
 }`}
 >
 <Plus className="w-4 h-4 text-[var(--acc)] shrink-0 mt-0.5" />
 <span>
 <span className="text-xs font-semibold text-[var(--ink)] block">Disco vacío</span>
 <span className="block text-[11px] text-[var(--ink-2)] mt-0.5">Crea el disco y añade canciones después, una a una.</span>
 </span>
 </button>
 )}
 <button
 type="button"
 onClick={() => { setShowCreateAlbumMenu(false); setBulkUploadAlbum({ name:'', songs: [] }); }}
 className={`w-full text-left p-2.5 rounded-[var(--r-m)] transition-all cursor-pointer flex items-start gap-2.5 ${
 isStitchLight ?'hover:bg-[var(--sunken)]' :'hover:bg-[var(--surface)]/80'
 }`}
 >
 <FolderUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
 <span>
 <span className="text-xs font-semibold text-emerald-400 block">Subir Disco (MP3/WAV)</span>
 <span className="block text-[11px] text-[var(--ink-2)] mt-0.5">Arrastra archivos de audio desde tu ordenador.</span>
 </span>
 </button>
 <button
 type="button"
 onClick={() => { setShowCreateAlbumMenu(false); setIsSpotifyModalOpen(true); }}
 className={`w-full text-left p-2.5 rounded-[var(--r-m)] transition-all cursor-pointer flex items-start gap-2.5 ${
 isStitchLight ?'hover:bg-[var(--sunken)]' :'hover:bg-[var(--surface)]/80'
 }`}
 >
 <Disc className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
 <span>
 <span className="text-xs font-semibold text-emerald-400 block">🟢 Traer de Spotify</span>
 <span className="block text-[11px] text-[var(--ink-2)] mt-0.5">Importa la discografía completa de la banda.</span>
 </span>
 </button>
 <button
 type="button"
 onClick={() => { setShowCreateAlbumMenu(false); setIsLiveConcertModalOpen(true); }}
 className={`w-full text-left p-2.5 rounded-[var(--r-m)] transition-all cursor-pointer flex items-start gap-2.5 ${
 isStitchLight ?'hover:bg-[var(--sunken)]' :'hover:bg-[var(--surface)]/80'
 }`}
 >
 <Scissors className="w-4 h-4 text-[var(--acc)] shrink-0 mt-0.5" />
 <span>
 <span className="text-xs font-semibold text-[var(--acc)] block">🔴 Concierto en Vivo a Disco</span>
 <span className="block text-[11px] text-[var(--ink-2)] mt-0.5">Recorta y cataloga a partir del vídeo o audio de un concierto en vivo.</span>
 </span>
 </button>
 </div>
 </>
 )}
 </div>
 </div>

 {/* Filter Pills, Search Bar, Expand All, & Mobile Create Album */}
 <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
 {/* Search Input Bar */}
 <div className="relative flex-1 min-w-[140px]">
 <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-2)] pointer-events-none" />
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
	placeholder="Buscar canción, tono, letra..."
	className={`w-full pl-8 pr-7 py-1.5 rounded-[var(--r-m)] text-xs transition-all focus:outline-none focus:ring-2 focus:ring-amber-0/40 ${
	isStitchLight
	?'bg-[var(--sunken)] text-[var(--ink)] placeholder-[var(--ink-2)] focus:bg-[var(--surface)]'
	:'bg-[var(--surface)]/80 text-[var(--ink)] placeholder-[var(--ink-2)] focus:/60'
	}`}
 />
 {searchQuery && (
 <button
 type="button"
 onClick={() => setSearchQuery('')}
 className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--ink-2)] hover:text-[var(--ink)] p-0.5 rounded-full transition-colors cursor-pointer"
 title="Limpiar búsqueda"
 >
 <X className="w-3 h-3" />
 </button>
 )}
 </div>

 {/* Quick Filter Tabs */}
 <div className={`p-0.5 rounded-[var(--r-m)] flex items-center gap-0.5 shrink-0 ${isStitchLight ?'bg-[var(--sunken)]' :'bg-[var(--surface)]/80'}`}>
 <button
 type="button"
 onClick={() => setActiveFilterTab('todos')}
 className={`px-2.5 py-1 rounded-[var(--r-s)] text-xs font-medium transition-all cursor-pointer ${
 activeFilterTab ==='todos'
 ?'bg-[var(--acc)] text-[var(--on-acc)] font-bold shadow-xs'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 Todos
 </button>
 <button
 type="button"
 onClick={() => setActiveFilterTab('albumes')}
 className={`px-2.5 py-1 rounded-[var(--r-s)] text-xs font-medium transition-all cursor-pointer ${
 activeFilterTab ==='albumes'
 ?'bg-[var(--acc)] text-[var(--on-acc)] font-bold shadow-xs'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 Álbumes
 </button>
 <button
 type="button"
 onClick={() => setActiveFilterTab('singles')}
 className={`px-2.5 py-1 rounded-[var(--r-s)] text-xs font-medium transition-all cursor-pointer ${
 activeFilterTab ==='singles'
 ?'bg-[var(--acc)] text-[var(--on-acc)] font-bold shadow-xs'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 Singles
 </button>
 </div>

 {/* Action Icons: Fold/Unfold & Dynamics */}
 <div className="flex items-center gap-1.5 shrink-0">
 {filteredAlbums.length > 0 && (
 <button
 type="button"
 onClick={toggleAllAlbums}
 className={`p-1.5 rounded-[var(--r-m)] transition-all cursor-pointer ${
 isStitchLight
 ?'bg-[var(--sunken)] text-[var(--ink-2)] hover:bg-[var(--sunken)]'
 :'bg-[var(--surface)]/80 text-[var(--ink-2)] hover:bg-[var(--surface)]/80 hover:text-[var(--ink)]'
 }`}
 title={areAllExpanded ?'Plegar todos los discos' :'Desplegar todos los discos'}
 >
 <Layers className="w-3.5 h-3.5 text-[var(--acc)]" />
 </button>
 )}

 {/* Analizar Dinámica Button (Compact & Discreet) */}
 {songsPendingDynamicsAnalysis.length > 0 && (
 <div className="relative inline-flex flex-col items-end">
 <button
 type="button"
 onClick={handleAnalyzeAllDynamics}
 disabled={dynamicsAnalysis?.running}
 className="px-2 py-1 rounded-[var(--r-m)] bg-sky-600/20 hover:bg-sky-600/30 disabled:opacity-70 disabled:cursor-wait text-sky-300 hover:text-sky-200 font-bold text-[11px] font-mono flex items-center gap-1 cursor-pointer shadow-sm transition-all"
 title="Analiza el audio con Iris: dinámica interna, BPM y tonalidad de cada canción"
 >
 {dynamicsAnalysis?.running ? (
 <>
 <Loader2 className="w-3 h-3 animate-spin text-sky-400" />
 <span>{dynamicsAnalysis.done}/{dynamicsAnalysis.total}</span>
 </>
 ) : (
 <>
 <Headphones className="w-3 h-3 text-sky-400" />
 <span className="hidden xs:inline">Audio IA</span>
 <span>({songsPendingDynamicsAnalysis.length})</span>
 </>
 )}
 </button>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Albums Stack */}
 <div className="space-y-4">
 {filteredAlbums.map((album) => {
 const rawAlbumSongs = safeSongs.filter((s) => {
 const songAlbum = (s.albumDisco || s.album ||'').trim();
 const albumClean = album.trim();
 const belongsToAlbum = albumClean ==='Singles / Sin Disco'
 ? (!songAlbum || songAlbum ==='Singles / Sin Disco')
 : (songAlbum === albumClean || songAlbum.toLowerCase() === albumClean.toLowerCase());

 if (!belongsToAlbum) return false;

 if (cleanSearchQuery && !album.toLowerCase().includes(cleanSearchQuery)) {
 return songMatchesSearch(s, cleanSearchQuery);
 }
 return true;
 });

 const sortedAlbumSongs = [...rawAlbumSongs].sort((a, b) => {
 const oA = typeof a.ordenAlbum ==='number' ? a.ordenAlbum : 999;
 const oB = typeof b.ordenAlbum ==='number' ? b.ordenAlbum : 999;
 return oA - oB;
 });

 const coverUrl = rawAlbumSongs.find((s) => s.portadaUrl)?.portadaUrl;
 const isExpanded = cleanSearchQuery ? true : expandedAlbums[album] === true;

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
 className={`rounded-[var(--r-l)] overflow-hidden transition-all duration-200 shadow-sm ${
 isStitchLight
 ?' bg-[var(--bg)]'
 :'/80 bg-[var(--surface)]/40 hover:/80'
 }`}
 >
 {/* Compact Album Header Bar */}
 <div
 onClick={() => toggleAlbumExpand(album)}
 className={`p-3.5 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer select-none transition-colors ${
 isStitchLight
 ?'hover:bg-[var(--sunken)]/80 border-b'
 :'hover:bg-[var(--surface)]/80 border-b /60'
 }`}
 >
 {/* Left: Cover & Information */}
 <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1 w-full sm:w-auto">
 <div className="shrink-0 relative group" onClick={(e) => e.stopPropagation()}>
 <AlbumCover
 url={coverUrl}
 onPlay={onSelectSong ? handlePlayAlbum : undefined}
 isPlaying={isPlayingAlbum}
 className="w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-[var(--r-m)] sm:rounded-[var(--r-l)] shadow-sm object-cover"
 />
 </div>

 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-1.5 mb-1 flex-wrap">
 <span className="px-2 py-0.5 rounded-md bg-[var(--acc)]/10 text-[var(--acc)]/70 text-[10px] font-medium tracking-wide inline-flex items-center gap-1">
 <Disc3 className="w-3 h-3 text-[var(--acc)]" />
 {album ==='Singles / Sin Disco' ?'SENCILLOS & INÉDITAS' :'ÁLBUM OFICIAL'}
 </span>
 </div>

 <h3
 className="text-sm sm:text-base md:text-lg font-bold tracking-tight truncate leading-snug text-[var(--ink)]"
 title={album}
 >
 {album}
 </h3>

 <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-[var(--ink-2)] mt-1 flex-wrap">
 <span className="font-medium text-[var(--ink-2)] truncate max-w-[140px]">{bandName ||'Banda'}</span>
 <span>•</span>
 <span>{sortedAlbumSongs.length} {sortedAlbumSongs.length === 1 ?'canción' :'canciones'}</span>
 <span>•</span>
 <span className="flex items-center gap-1">
 <Clock className="w-3 h-3 text-[var(--ink-2)]" />
 {formatTotalDuration(sortedAlbumSongs)}
 </span>
 </div>
 </div>
 </div>

 {/* Right: Controls & Fold/Unfold Chevron */}
 <div className="flex items-center gap-2 shrink-0 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
 {sortedAlbumSongs.length > 0 && onSelectSong && (
 <button
 type="button"
 onClick={handlePlayAlbum}
 className="px-3 py-1.5 rounded-[var(--r-m)] bg-emerald-600 hover:bg-emerald-500 text-[var(--ink)] font-medium text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
 title={isPlayingAlbum ?'Pausar disco' :'Reproducir disco'}
 >
 {isPlayingAlbum ? (
 <>
 <Pause className="w-3.5 h-3.5 fill-current" />
 <span className="hidden xs:inline">Pausar</span>
 </>
 ) : (
 <>
 <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
 <span className="hidden xs:inline">Play</span>
 </>
 )}
 </button>
 )}

 {onEditAlbum && (
 <button
 type="button"
 onClick={() => onEditAlbum(album)}
 className={`px-3 py-1.5 rounded-[var(--r-m)] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
 isStitchLight
 ?'bg-[var(--surface)] text-[var(--ink-2)] hover:bg-[var(--sunken)]'
 :'bg-[var(--surface)]/80 text-[var(--ink)] hover:bg-[var(--surface)]/70 hover:text-[var(--ink)]'
 }`}
 title="Gestionar las canciones de este álbum"
 >
 <Edit3 className="w-3.5 h-3.5 text-[var(--acc)]" />
 <span className="hidden xs:inline">Gestionar</span>
 </button>
 )}

 {/* Per-Album Export Button */}
 {sortedAlbumSongs.length > 0 && (
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 setExportModalData({ isOpen: true, albumName: album });
 }}
 className={`px-2.5 py-1.5 rounded-[var(--r-m)] text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
 'bg-[var(--surface)]/80 text-[var(--acc)]/70 hover:bg-[var(--surface)]/70 hover:text-[var(--ink)]'
 }`}
 title="Exportar canciones de este disco (Excel, M3U, TXT, PDF)"
 >
 <Download className="w-3.5 h-3.5 text-[var(--acc)]" />
 <span className="hidden lg:inline">Exportar</span>
 </button>
 )}

 {/* Bulk Audio Master Uploader Button */}
 {sortedAlbumSongs.length > 0 && (
 <button
 type="button"
 onClick={() => setBulkUploadAlbum({ name: album, songs: sortedAlbumSongs })}
 className={`px-3 py-1.5 rounded-[var(--r-m)] text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
 isStitchLight
 ?'bg-emerald-50 border-[var(--ok)] text-emerald-800 hover:bg-emerald-100'
 :'bg-[var(--surface)]/80 text-[var(--ink-2)] hover:bg-[var(--surface)]/70 hover:text-[var(--ink)]'
 }`}
 title="Subir archivos de audio completos (MP3/WAV/FLAC) para este disco"
 >
 <FolderUp className="w-3.5 h-3.5" />
 <span className="hidden md:inline">Subir Audios</span>
 </button>
 )}

 {onRequestDeleteAlbum && album !=='Singles / Sin Disco' && (
 <button
 type="button"
 onClick={() => onRequestDeleteAlbum(album, sortedAlbumSongs.length)}
 className="p-1.5 rounded-[var(--r-m)] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer shrink-0"
 title="Eliminar álbum"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 )}

 {/* Expand / Collapse Toggle Button */}
 <button
 type="button"
 onClick={(e) => { e.stopPropagation(); toggleAlbumExpand(album); }}
 className={`px-3 py-1.5 rounded-[var(--r-m)] text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
 isExpanded
 ?'bg-[var(--acc)]/15 /30 text-[var(--acc)]/70'
 : isStitchLight
 ?'bg-[var(--sunken)]/80 text-[var(--ink-2)] hover:bg-[var(--surface)]'
 :'bg-[var(--surface)]/80 text-[var(--ink-2)] hover:bg-[var(--surface)]/70 hover:text-[var(--ink)]'
 }`}
 >
 <span className="hidden xs:inline">{isExpanded ?'Ocultar' : `Temas (${sortedAlbumSongs.length})`}</span>
 {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
 </button>
 </div>
 </div>

 {/* Collapsible Tracklist Section */}
 {isExpanded && (
 <div className={`p-3 sm:p-4 border-t space-y-1.5 ${isStitchLight ?'bg-[var(--bg)]/70' :'bg-[var(--surface)]/80 /80'}`}>
 {sortedAlbumSongs.map((s, idx) => {
 const isCurrentTrack = activePlayerSong?.id === s.id;
 const isDraggingThis = draggedItem?.album === album && draggedItem?.index === idx;
 const isDragOverThis = dragOverItem?.album === album && dragOverItem?.index === idx;

 return (
 <SongCardRow
 key={s.id}
 song={s}
 index={idx + 1}
 isPlayingCurrent={isCurrentTrack}
 isPlayerPlaying={isPlayerPlaying}
 onPlay={() => onSelectSong?.(s, true, sortedAlbumSongs)}
 onSelect={() => onSelectSong?.(s, false, sortedAlbumSongs)}
 onToggleFavorite={() => toggleFavoriteSong(s.id)}
 onOpenChords={onOpenChords ? () => onOpenChords(s) : undefined}
 onOpenMemberNotes={onOpenMemberNotes ? () => onOpenMemberNotes(s) : undefined}
 onOpenStudio={onOpenStudio ? () => onOpenStudio(s) : undefined}
 onEditSong={onEditSong ? () => onEditSong(s) : undefined}
 onDeleteSong={onDeleteSong ? () => onDeleteSong(s.id) : undefined}
 onShareSong={onShareSong ? () => onShareSong(s) : undefined}
 externalLink={s.enlaceAcordes}
 showAlbumBadge={false}
 draggable={sortedAlbumSongs.length > 1}
 isDragging={isDraggingThis}
 isDragOver={isDragOverThis}
 onDragStart={(e) => {
 e.dataTransfer.effectAllowed ='move';
 setDraggedItem({ album, index: idx });
 }}
 onDragOver={(e) => {
 e.preventDefault();
 e.dataTransfer.dropEffect ='move';
 if (draggedItem?.album === album && dragOverItem?.index !== idx) {
 setDragOverItem({ album, index: idx });
 }
 }}
 onDragLeave={() => {
 if (dragOverItem?.album === album && dragOverItem?.index === idx) {
 setDragOverItem(null);
 }
 }}
 onDrop={(e) => {
 e.preventDefault();
 if (draggedItem && draggedItem.album === album) {
 handleDropSongInAlbum(album, sortedAlbumSongs, draggedItem.index, idx);
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
 onMoveUp={() => handleMoveSongInAlbum(album, sortedAlbumSongs, s.id,'up')}
 onMoveDown={() => handleMoveSongInAlbum(album, sortedAlbumSongs, s.id,'down')}
 colors={colors}
 isStitchLight={isStitchLight}
 />
 );
 })}

 {sortedAlbumSongs.length === 0 && (
 <div className="text-center py-6 text-[var(--ink-2)] text-xs italic font-mono bg-[var(--ink)]/5 rounded-[var(--r-l)] border-dashed border-[var(--hair)]">
 Disco sin canciones asignadas. Haz clic en"Gestionar" para añadir temas a este álbum.
 </div>
 )}
 </div>
 )}
 </div>
 );
 })}

 {filteredAlbums.length === 0 && (
 <div className="text-center py-12 space-y-4">
 <PublicoSilhouette opacity={0.12} size="medium" className="mx-auto" />
 <div className="space-y-2">
 <p className="text-sm font-semibold text-[var(--ink)]">
 {cleanSearchQuery ? 'No encontramos coincidencias' : 'La discografía está vacía'}
 </p>
 <p className="text-xs text-[var(--ink-2)] max-w-sm mx-auto">
 {cleanSearchQuery
 ? `Ningún disco o tema coincide con"${searchQuery}". Prueba otras palabras clave.`
 :'Graba tu primer álbum para llevarlo al directo. Cada disco es una historia.'}
 </p>
 </div>
 {cleanSearchQuery && (
 <button
 type="button"
 onClick={() => setSearchQuery('')}
 className="mt-3 px-3 py-1.5 rounded-full bg-[var(--surface)]/20 text-[var(--ok)] border-[var(--hair)]/30 text-xs font-mono font-bold hover:bg-[var(--surface)]/30 transition-all cursor-pointer inline-flex items-center gap-1.5 mx-auto"
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
 bandName={bandName ||"Nuestra Banda"}
 colors={colors}
 isStitchLight={isStitchLight}
 onSaveAlbumToCatalog={handleSaveLiveConcertAlbum}
 onSaveSetlist={(newSetlist) => {
 if (setSetlists) {
 setSetlists((prev: any[]) => [newSetlist, ...(Array.isArray(prev) ? prev : [])]);
 }
 }}
 />

 {/* Spotify Discography Importer Modal */}
 <SpotifyDiscographyModal
 isOpen={isSpotifyModalOpen}
 onClose={() => setIsSpotifyModalOpen(false)}
 bandName={bandName ||"Tu Banda"}
 existingSongs={songs}
 colors={colors}
 isStitchLight={isStitchLight}
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
 isStitchLight={isStitchLight}
 bandId={bandName ||"Tu Banda"}
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
 setExpandedAlbums((prev) => ({ ...prev, [newAlbumName]: true }));
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
 bandName={bandName ||"Tu Banda"}
 colors={colors}
 isStitchLight={isStitchLight}
 />
 </div>
 );
};
