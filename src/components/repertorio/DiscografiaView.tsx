import React, { useState } from 'react';
import { Song, ThemeColors } from '../../types';
import { Disc, Disc3, Star, Play, Pause, Trash2, ArrowUp, ArrowDown, Edit3, Plus, Music, Clock, ChevronDown, ChevronUp, Layers, Scissors, Sparkles, Users, FolderUp, FileText, Headphones, Loader2, Search, X, Download } from 'lucide-react';
import { AlbumCover } from '../AlbumCover';
import { uploadFileToServer, saveSongsToLocalStorageSafely } from '../../utils/audioStorage';
import { apiFetch } from '../../utils/api';
import { LiveConcertToAlbumModal, TrackCutItem } from './LiveConcertToAlbumModal';
import { SpotifyDiscographyModal } from './SpotifyDiscographyModal';
import { BulkAlbumAudioUploaderModal } from './BulkAlbumAudioUploaderModal';
import { ExportAlbumSongsModal } from './ExportAlbumSongsModal';
import { SongCardRow } from './SongCardRow';

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
    if (typeof s.duracionSegundos === 'number' && s.duracionSegundos > 0) {
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

  if (totalSeconds <= 0) return '0 min';
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs} h ${remMins} min`;
  }
  return `${mins} min ${secs > 0 ? `${secs} s` : ''}`;
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
  const [activeFilterTab, setActiveFilterTab] = useState<'todos' | 'albumes' | 'singles'>('todos');
  const [expandedAlbums, setExpandedAlbums] = useState<Record<string, boolean>>({});
  const [isLiveConcertModalOpen, setIsLiveConcertModalOpen] = useState(false);
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
  const [bulkUploadAlbum, setBulkUploadAlbum] = useState<{ name: string; songs: Song[] } | null>(null);
  const [dynamicsAnalysis, setDynamicsAnalysis] = useState<{ running: boolean; done: number; total: number; failedTitles: string[] } | null>(null);
  // Las 4 formas de crear un disco (vacío / subir MP3-WAV / Spotify / recortar de un concierto)
  // vivían como 4 botones de texto siempre visibles — se usan una vez por disco, no en cada
  // visita. Un solo punto de entrada "+ Nuevo disco" con las 4 opciones explicadas, mismo patrón
  // que el "🧠 Asistente IA" de RepertorioSetlists.tsx (AGENTS.md §6).
  const [showCreateAlbumMenu, setShowCreateAlbumMenu] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ album: string; index: number } | null>(null);
  const [dragOverItem, setDragOverItem] = useState<{ album: string; index: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [exportModalData, setExportModalData] = useState<{ isOpen: boolean; albumName?: string }>({ isOpen: false });

  const handleSaveLiveConcertAlbum = (albumTitle: string, tracks: TrackCutItem[]) => {
    const createdSongs: Song[] = tracks.map((t) => {
      const mins = Math.floor(t.duration / 60);
      const secs = Math.floor(t.duration % 60);
      const durationStr = `${mins}:${String(secs).padStart(2, '0')}`;
      const songAudioUrl = t.audioUrl || '';

      return {
        id: `live_song_${Date.now()}_${t.index}`,
        titulo: t.title,
        artista: 'Nuestra Banda',
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
                titulo: 'Audio Recortado Directo',
                seccion: 'general' as const,
                audioUrl: songAudioUrl,
                subidoPor: 'Concierto en Directo',
                fecha: new Date().toISOString(),
              },
            ]
          : [],
        tipo: t.type === 'musica' ? 'cancion' : 'interludio',
        ordenAlbum: t.index,
        speechTranscription: t.speechTranscription || '',
        cifradoTexto: t.lyricsWithChords || '',
        tonalidad: t.tonalidad || 'Mim',
        bpm: t.bpm || 120,
        favorite: false,
      };
    });

    const updatedSongs = [...songs, ...createdSongs];
    setSongs(updatedSongs);
    saveSongsToLocalStorageSafely(updatedSongs);

    // Save each new song to backend API
    createdSongs.forEach((song) => {
      apiFetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(song),
      }).catch((err) => console.warn('Could not persist live song to backend:', err));
    });

    // Auto expand new album in UI
    setExpandedAlbums((prev) => ({ ...prev, [albumTitle]: true }));
  };

  const safeSongs = (songs || []).filter((s): s is Song => Boolean(s && typeof s === 'object' && s.id));
  const safeAlbumsList = (albumsList || []).filter((a): a is string => Boolean(a && typeof a === 'string'));

  const allNonEmptyAlbums = safeAlbumsList.filter((a) => a !== 'todos');

  const cleanSearchQuery = searchQuery.trim().toLowerCase();

  const songMatchesSearch = (s: Song, query: string): boolean => {
    if (!query) return true;
    const title = (s.titulo || '').toLowerCase();
    const artist = (s.artista || '').toLowerCase();
    const key = (s.tonalidad || '').toLowerCase();
    const albumName = (s.albumDisco || s.album || '').toLowerCase();
    const speech = (s.speechTranscription || '').toLowerCase();
    return (
      title.includes(query) ||
      artist.includes(query) ||
      key.includes(query) ||
      albumName.includes(query) ||
      speech.includes(query)
    );
  };

  const filteredAlbums = allNonEmptyAlbums.filter((album) => {
    if (activeFilterTab === 'albumes' && album === 'Singles / Sin Disco') {
      return false;
    }
    if (activeFilterTab === 'singles' && album !== 'Singles / Sin Disco') {
      return false;
    }

    if (!cleanSearchQuery) return true;

    // Si el nombre del disco coincide con la búsqueda
    if (album.toLowerCase().includes(cleanSearchQuery)) return true;

    // O si alguna de sus canciones coincide con la búsqueda
    const albumSongs = safeSongs.filter((s) => {
      const songAlbum = (s.albumDisco || s.album || '').trim();
      const albumClean = album.trim();
      if (albumClean === 'Singles / Sin Disco') {
        return !songAlbum || songAlbum === 'Singles / Sin Disco';
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

  const handleMoveSongInAlbum = (albumName: string, sortedAlbumSongs: Song[], songId: string, direction: 'up' | 'down') => {
    const index = sortedAlbumSongs.findIndex((s) => s.id === songId);
    if (index < 0) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
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
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSong),
      }).catch((err) => console.error('Error updating song order in album on server:', err));
    });
  };

  // Repesca manual: analiza la dinámica interna (partes lentas/rápidas) de las canciones con
  // audio que todavía no se han analizado. Lo normal es que esto ya haya pasado solo al
  // guardar cada tema (ver dbUpsertSong en el servidor); esto es solo para ponerse al día con
  // canciones subidas antes de que existiera esta feature.
  const songsPendingDynamicsAnalysis = safeSongs.filter((s) => {
    const audio = s.audioPrincipalUrl || (s as any).audioUrl;
    return Boolean(audio) && !s.energiaVariacionCalculadaEn;
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
          const result = await apiFetch<{ variacionDetectada: number; audioAnalizable: boolean }>(`/api/songs/${song.id}/analizar-dinamica`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioUrl: audio }),
          });
          // El backend no marca "analizado" cuando el audio no fue analizable (por ejemplo si
          // la descarga falló) — aquí tampoco: si se hiciera, la canción quedaría marcada como
          // analizada para siempre y la próxima repesca nunca la reintentaría.
          if (!result.audioAnalizable) {
            throw new Error('El audio no se pudo analizar (no accesible o formato no soportado)');
          }
          const ahora = new Date().toISOString();
          setSongs((prev) =>
            prev.map((s) => (s.id === song.id ? { ...s, energiaVariacion: result.variacionDetectada, energiaVariacionCalculadaEn: ahora } : s))
          );
        } catch (err) {
          console.warn(`No se pudo analizar la dinámica interna de "${song.titulo}":`, err);
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
      className={`p-3 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-2xl transition-all ${
        isStitchLight ? 'bg-white border border-slate-200' : 'bg-[#121212] border border-neutral-800'
      }`}
    >
      {/* Top Controls Bar (Search + Quick Filters + Actions) */}
      <div className="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-white/10 space-y-2.5">
        {/* Desktop title row (hidden on mobile to keep screen ultra-clean since RepertorioNavBar already provides title) */}
        <div className="hidden sm:flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1db954]/15 border border-[#1db954]/30 flex items-center justify-center shadow-inner shrink-0">
              <Disc3 className="w-4 h-4 text-[#1db954]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-display font-black tracking-tight" style={{ color: colors.text }}>
                Lanzamientos & Discografía
              </h2>
              <p className="text-[10px] font-mono opacity-60">
                {allNonEmptyAlbums.length} {allNonEmptyAlbums.length === 1 ? 'lanzamiento' : 'lanzamientos'} • {safeSongs.length} temas
              </p>
            </div>
          </div>

          {/* Desktop "+ Nuevo Disco" and "Exportar Canciones" Buttons */}
          <div className="flex items-center gap-2 relative">
            <button
              type="button"
              onClick={() => setExportModalData({ isOpen: true, albumName: 'all' })}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs font-mono flex items-center gap-1.5 cursor-pointer border border-white/10 shadow-sm transition-all hover:scale-105 active:scale-95"
              title="Exportar canciones de la discografía a Excel, M3U playlist, TXT o PDF"
            >
              <Download className="w-3.5 h-3.5 text-[#1ed760]" />
              <span>Exportar</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCreateAlbumMenu((v) => !v)}
              className="px-3 py-1.5 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Nuevo Disco</span>
            </button>
            {showCreateAlbumMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowCreateAlbumMenu(false)} />
                <div className="absolute right-0 top-full mt-1.5 z-40 w-72 rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl p-1.5 space-y-1">
                  {onCreateAlbum && (
                    <button
                      type="button"
                      onClick={() => { setShowCreateAlbumMenu(false); onCreateAlbum(); }}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-neutral-800 transition-all cursor-pointer flex items-start gap-2"
                    >
                      <Plus className="w-4 h-4 text-[#1db954] shrink-0 mt-0.5" />
                      <span>
                        <span className="text-sm font-medium text-[#1db954] block">Disco vacío</span>
                        <span className="block text-[10.5px] text-neutral-400 mt-0.5">Crea el disco y añade canciones después, una a una.</span>
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setShowCreateAlbumMenu(false); setBulkUploadAlbum({ name: '', songs: [] }); }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-neutral-800 transition-all cursor-pointer flex items-start gap-2"
                  >
                    <FolderUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <span className="text-sm font-medium text-emerald-300 block">Subir Disco (MP3/WAV)</span>
                      <span className="block text-[10.5px] text-neutral-400 mt-0.5">Arrastra archivos de audio desde tu ordenador.</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCreateAlbumMenu(false); setIsSpotifyModalOpen(true); }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-neutral-800 transition-all cursor-pointer flex items-start gap-2"
                  >
                    <Disc className="w-4 h-4 text-[#1db954] shrink-0 mt-0.5" />
                    <span>
                      <span className="text-sm font-medium text-[#1db954] block">🟢 Traer de Spotify</span>
                      <span className="block text-[10.5px] text-neutral-400 mt-0.5">Importa la discografía completa de la banda.</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCreateAlbumMenu(false); setIsLiveConcertModalOpen(true); }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-neutral-800 transition-all cursor-pointer flex items-start gap-2"
                  >
                    <Scissors className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <span className="text-sm font-medium text-amber-300 block">🔴 Concierto a Disco (IA/FFmpeg)</span>
                      <span className="block text-[10.5px] text-neutral-400 mt-0.5">Recorta y cataloga a partir del vídeo/audio de un concierto en vivo.</span>
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
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar canción, tono, letra..."
              className={`w-full pl-8 pr-7 py-1 sm:py-1.5 rounded-xl text-xs font-mono border transition-all focus:outline-none focus:ring-2 focus:ring-[#1db954]/50 ${
                isStitchLight
                  ? 'bg-slate-100 border-slate-300 text-slate-800 placeholder-slate-400 focus:bg-white'
                  : 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500 focus:border-[#1db954]/60'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-0.5 rounded-full transition-colors cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div className={`p-0.5 rounded-xl border flex items-center gap-0.5 shrink-0 ${isStitchLight ? 'bg-slate-100 border-slate-300' : 'bg-neutral-900 border-neutral-800'}`}>
            <button
              type="button"
              onClick={() => setActiveFilterTab('todos')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-mono font-bold transition-all cursor-pointer ${
                activeFilterTab === 'todos'
                  ? 'bg-[#1db954] text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterTab('albumes')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-mono font-bold transition-all cursor-pointer ${
                activeFilterTab === 'albumes'
                  ? 'bg-[#1db954] text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Álbumes
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterTab('singles')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-mono font-bold transition-all cursor-pointer ${
                activeFilterTab === 'singles'
                  ? 'bg-[#1db954] text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Singles
            </button>
          </div>

          {/* Action Icons: Fold/Unfold & Dynamics */}
          <div className="flex items-center gap-1 shrink-0">
            {filteredAlbums.length > 0 && (
              <button
                type="button"
                onClick={toggleAllAlbums}
                className={`p-1.5 rounded-xl transition-all cursor-pointer border ${
                  isStitchLight
                    ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                    : 'bg-neutral-900 border-neutral-800 text-zinc-300 hover:bg-neutral-800 hover:text-white'
                }`}
                title={areAllExpanded ? 'Plegar todos los discos' : 'Desplegar todos los discos'}
              >
                <Layers className="w-3.5 h-3.5 text-[#1db954]" />
              </button>
            )}

            {/* Analizar Dinámica Button (Compact & Discreet) */}
            {songsPendingDynamicsAnalysis.length > 0 && (
              <div className="relative inline-flex flex-col items-end">
                <button
                  type="button"
                  onClick={handleAnalyzeAllDynamics}
                  disabled={dynamicsAnalysis?.running}
                  className="px-2 py-1 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 disabled:opacity-70 disabled:cursor-wait text-sky-300 hover:text-sky-200 font-bold text-[11px] font-mono flex items-center gap-1 cursor-pointer shadow-sm transition-all"
                  title="Detecta automáticamente qué canciones tienen subidas y bajadas de energía internas"
                >
                  {dynamicsAnalysis?.running ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-sky-400" />
                      <span>{dynamicsAnalysis.done}/{dynamicsAnalysis.total}</span>
                    </>
                  ) : (
                    <>
                      <Headphones className="w-3 h-3 text-sky-400" />
                      <span className="hidden xs:inline">Dinámica</span>
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
            const songAlbum = (s.albumDisco || s.album || '').trim();
            const albumClean = album.trim();
            const belongsToAlbum = albumClean === 'Singles / Sin Disco'
              ? (!songAlbum || songAlbum === 'Singles / Sin Disco')
              : (songAlbum === albumClean || songAlbum.toLowerCase() === albumClean.toLowerCase());

            if (!belongsToAlbum) return false;

            if (cleanSearchQuery && !album.toLowerCase().includes(cleanSearchQuery)) {
              return songMatchesSearch(s, cleanSearchQuery);
            }
            return true;
          });

          const sortedAlbumSongs = [...rawAlbumSongs].sort((a, b) => {
            const oA = typeof a.ordenAlbum === 'number' ? a.ordenAlbum : 999;
            const oB = typeof b.ordenAlbum === 'number' ? b.ordenAlbum : 999;
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
              className={`rounded-2xl overflow-hidden border transition-all duration-200 shadow-md ${
                isStitchLight
                  ? 'border-slate-200 bg-slate-50 shadow-slate-200/50'
                  : 'border-neutral-800/90 bg-[#161616] hover:border-neutral-700'
              }`}
            >
              {/* Compact Album Header Bar */}
              <div
                onClick={() => toggleAlbumExpand(album)}
                className={`p-3 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer select-none transition-colors ${
                  isStitchLight
                    ? 'hover:bg-slate-100/80 border-b border-slate-200'
                    : 'hover:bg-neutral-800/40 border-b border-neutral-800/80'
                }`}
              >
                {/* Left: Cover & Information */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 w-full sm:w-auto">
                  <div className="shrink-0 relative group" onClick={(e) => e.stopPropagation()}>
                    <AlbumCover
                      url={coverUrl}
                      onPlay={onSelectSong ? handlePlayAlbum : undefined}
                      isPlaying={isPlayingAlbum}
                      className="w-14 h-14 xs:w-16 xs:h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-xl sm:rounded-2xl shadow-md border border-white/10 object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1 flex-wrap">
                      <span className="px-2 py-0.2 rounded-full bg-[#1db954]/15 text-[#1ed760] border border-[#1db954]/30 text-[8.5px] sm:text-[9px] font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1">
                        <Disc3 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        {album === 'Singles / Sin Disco' ? 'SENCILLOS & INÉDITAS' : 'ÁLBUM OFICIAL'}
                      </span>
                    </div>

                    <h3
                      className="text-sm sm:text-lg md:text-xl font-bold font-display tracking-tight truncate leading-snug"
                      style={{ color: colors.text }}
                      title={album}
                    >
                      {album}
                    </h3>

                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-mono text-neutral-400 mt-0.5 sm:mt-1 flex-wrap">
                      <span className="font-semibold text-[#1ed760] truncate max-w-[120px]">{bandName || 'Banda'}</span>
                      <span>•</span>
                      <span>{sortedAlbumSongs.length} {sortedAlbumSongs.length === 1 ? 'canción' : 'canciones'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neutral-500" />
                        {formatTotalDuration(sortedAlbumSongs)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Controls & Fold/Unfold Chevron */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                  {sortedAlbumSongs.length > 0 && onSelectSong && (
                    <button
                      type="button"
                      onClick={handlePlayAlbum}
                      className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold text-[11px] sm:text-xs font-mono flex items-center gap-1.5 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      title={isPlayingAlbum ? 'Pausar disco' : 'Reproducir disco'}
                    >
                      {isPlayingAlbum ? (
                        <>
                          <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                          <span className="hidden xs:inline">Pausar</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current ml-0.5" />
                          <span className="hidden xs:inline">Play</span>
                        </>
                      )}
                    </button>
                  )}

                  {onEditAlbum && (
                    <button
                      type="button"
                      onClick={() => onEditAlbum(album)}
                      className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium font-mono flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer border ${
                        isStitchLight
                          ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                          : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white'
                      }`}
                      title="Gestionar las canciones de este álbum"
                    >
                      <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-400" />
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
                      className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium font-mono flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer border ${
                        isStitchLight
                          ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                          : 'bg-white/5 border-white/10 text-amber-300 hover:bg-white/10 hover:text-white'
                      }`}
                      title="Exportar canciones de este disco (Excel, M3U, TXT, PDF)"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden lg:inline">Exportar</span>
                    </button>
                  )}

                  {/* Bulk Audio Master Uploader Button */}
                  {sortedAlbumSongs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setBulkUploadAlbum({ name: album, songs: sortedAlbumSongs })}
                      className={`p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium font-mono flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer border ${
                        isStitchLight
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                          : 'bg-[#1db954]/15 border-[#1db954]/30 text-[#1ed760] hover:bg-[#1db954]/25 hover:text-white'
                      }`}
                      title="Subir archivos de audio completos (MP3/WAV/FLAC) para este disco"
                    >
                      <FolderUp className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Subir Audios</span>
                    </button>
                  )}

                  {onRequestDeleteAlbum && album !== 'Singles / Sin Disco' && (
                    <button
                      type="button"
                      onClick={() => onRequestDeleteAlbum(album, sortedAlbumSongs.length)}
                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer shrink-0"
                      title="Eliminar álbum"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Expand / Collapse Toggle Button */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleAlbumExpand(album); }}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                      isExpanded
                        ? 'bg-[#1db954]/20 border-[#1db954]/40 text-[#1ed760]'
                        : isStitchLight
                        ? 'bg-slate-200/80 border-slate-300 text-slate-700 hover:bg-slate-300'
                        : 'bg-white/10 border-white/10 text-zinc-300 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    <span className="hidden xs:inline">{isExpanded ? 'Ocultar' : `Temas (${sortedAlbumSongs.length})`}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Collapsible Tracklist Section */}
              {isExpanded && (
                <div className={`p-3 sm:p-4 border-t space-y-1.5 ${isStitchLight ? 'bg-slate-50/70 border-slate-200' : 'bg-[#101010] border-neutral-800'}`}>
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
                          e.dataTransfer.effectAllowed = 'move';
                          setDraggedItem({ album, index: idx });
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
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
                        onMoveUp={() => handleMoveSongInAlbum(album, sortedAlbumSongs, s.id, 'up')}
                        onMoveDown={() => handleMoveSongInAlbum(album, sortedAlbumSongs, s.id, 'down')}
                        colors={colors}
                        isStitchLight={isStitchLight}
                      />
                    );
                  })}

                  {sortedAlbumSongs.length === 0 && (
                    <div className="text-center py-6 text-neutral-500 text-xs italic font-mono bg-white/5 rounded-2xl border border-dashed border-white/10">
                      Disco sin canciones asignadas. Haz clic en "Gestionar" para añadir temas a este álbum.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredAlbums.length === 0 && (
          <div className="text-center py-16 opacity-60">
            <Disc3 className="w-12 h-12 mx-auto mb-3 text-neutral-500" />
            <p className="text-sm font-mono">
              {cleanSearchQuery
                ? `No se encontraron canciones ni discos que coincidan con "${searchQuery}".`
                : 'No hay discos creados en esta categoría.'}
            </p>
            {cleanSearchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-3 px-3 py-1.5 rounded-full bg-[#1db954]/20 text-[#1ed760] border border-[#1db954]/30 text-xs font-mono font-bold hover:bg-[#1db954]/30 transition-all cursor-pointer inline-flex items-center gap-1.5"
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
        bandName={bandName || "Tu Banda"}
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
        bandName={bandName || "Tu Banda"}
        colors={colors}
        isStitchLight={isStitchLight}
      />
    </div>
  );
};
