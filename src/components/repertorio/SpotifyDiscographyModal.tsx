import React, { useState, useEffect, useRef } from 'react';
import { Song, ThemeColors } from '../../types';
import { 
  Music, Disc, Search, Check, X, ExternalLink, Play, Pause, 
  Sparkles, CheckSquare, Square, Layers, RefreshCw, AlertCircle, 
  Radio, ListMusic, ChevronDown, ChevronUp, ShieldCheck
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { saveSongsToLocalStorageSafely } from '../../utils/audioStorage';

interface SpotifyTrack {
  id: string;
  name: string;
  trackNumber: number;
  discNumber: number;
  durationMs: number;
  durationFormatted: string;
  durationSeconds: number;
  previewUrl: string | null;
  explicit: boolean;
  spotifyUrl: string;
  uri: string;
  tonalidadEstimada?: string;
  bpmEstimado?: number;
}

interface SpotifyAlbum {
  id: string;
  name: string;
  albumType: 'album' | 'single' | 'compilation';
  releaseDate: string;
  releaseYear: string;
  totalTracks: number;
  coverUrl: string;
  coverUrlMedium: string;
  spotifyUrl: string;
  uri: string;
  genres: string[];
  tracks: SpotifyTrack[];
}

interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  followers: number;
  popularity: number;
  imageUrl: string;
  spotifyUrl: string;
  uri: string;
}

interface SpotifyDiscographyModalProps {
  isOpen: boolean;
  onClose: () => void;
  bandName?: string;
  existingSongs: Song[];
  colors: ThemeColors;
  isStitchLight: boolean;
  onSongsImported: (updatedSongs: Song[]) => void;
}

export const SpotifyDiscographyModal: React.FC<SpotifyDiscographyModalProps> = ({
  isOpen,
  onClose,
  bandName = 'Bakandeya',
  existingSongs = [],
  colors,
  isStitchLight,
  onSongsImported,
}) => {
  const [searchQuery, setSearchQuery] = useState(bandName);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingDiscography, setIsFetchingDiscography] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [artistProfile, setArtistProfile] = useState<SpotifyArtist | null>(null);
  const [albums, setAlbums] = useState<SpotifyAlbum[]>([]);
  const [selectedAlbumIds, setSelectedAlbumIds] = useState<Record<string, boolean>>({});
  const [expandedAlbumIds, setExpandedAlbumIds] = useState<Record<string, boolean>>({});
  const [filterType, setFilterType] = useState<'todos' | 'album' | 'single'>('todos');

  const [overwriteDuplicates, setOverwriteDuplicates] = useState(false);
  const [updateEpkUrl, setUpdateEpkUrl] = useState(true);

  // Audio snippet preview player state
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Initial fetch when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialQuery = bandName || 'Bakandeya';
      setSearchQuery(initialQuery);
      handleFetchDiscography(initialQuery);
    } else {
      stopAudioPreview();
    }
  }, [isOpen, bandName]);

  const [loadingPreviewTrackId, setLoadingPreviewTrackId] = useState<string | null>(null);

  const stopAudioPreview = () => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current = null;
    }
    setPlayingTrackId(null);
    setLoadingPreviewTrackId(null);
  };

  const togglePlayTrackPreview = async (track: SpotifyTrack, albumName?: string) => {
    if (playingTrackId === track.id) {
      stopAudioPreview();
      return;
    }

    stopAudioPreview();

    let streamUrl = track.previewUrl;

    if (!streamUrl) {
      setLoadingPreviewTrackId(track.id);
      try {
        const artist = artistProfile?.name || bandName || '';
        const res = await apiFetch(`/api/spotify/preview?artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track.name)}`);
        if (res && res.previewUrl) {
          streamUrl = res.previewUrl;
          track.previewUrl = res.previewUrl;
        }
      } catch (err) {
        console.warn('Could not fetch preview on demand:', err);
      } finally {
        setLoadingPreviewTrackId(null);
      }
    }

    if (!streamUrl) {
      setErrorMsg(`No se encontró snippet de audio de 30s para "${track.name}".`);
      return;
    }

    try {
      const audio = new Audio(streamUrl);
      audio.volume = 0.75;
      audio.onended = () => setPlayingTrackId(null);
      audio.onerror = () => {
        setPlayingTrackId(null);
        setErrorMsg('No se pudo reproducir el snippet de audio.');
      };
      audio.play().catch(() => setPlayingTrackId(null));
      audioPreviewRef.current = audio;
      setPlayingTrackId(track.id);
    } catch (e) {
      setPlayingTrackId(null);
    }
  };

  const handleFetchDiscography = async (queryToFetch?: string) => {
    const q = (queryToFetch || searchQuery).trim();
    if (!q) {
      setErrorMsg('Por favor ingresa el nombre de la banda o enlace de Spotify.');
      return;
    }

    setErrorMsg(null);
    setIsFetchingDiscography(true);
    stopAudioPreview();

    try {
      const data = await apiFetch(`/api/spotify/artist-discography?query=${encodeURIComponent(q)}`);

      if (!data || !data.success || !data.discography) {
        throw new Error(data?.error || 'No se pudo encontrar la discografía en Spotify.');
      }

      const { artist, albums: fetchedAlbums } = data.discography;
      setArtistProfile(artist);
      setAlbums(fetchedAlbums || []);

      // Default: Select all fetched albums
      const initialSelected: Record<string, boolean> = {};
      const initialExpanded: Record<string, boolean> = {};
      (fetchedAlbums || []).forEach((alb: SpotifyAlbum, idx: number) => {
        initialSelected[alb.id] = true;
        // Expand first album by default
        if (idx === 0) initialExpanded[alb.id] = true;
      });

      setSelectedAlbumIds(initialSelected);
      setExpandedAlbumIds(initialExpanded);
    } catch (err: any) {
      console.error('Error fetching Spotify discography:', err);
      setErrorMsg(err.message || 'Error al conectar con Spotify.');
      setArtistProfile(null);
      setAlbums([]);
    } finally {
      setIsFetchingDiscography(false);
    }
  };

  const toggleSelectAll = (select: boolean) => {
    const next: Record<string, boolean> = {};
    albums.forEach((alb) => {
      next[alb.id] = select;
    });
    setSelectedAlbumIds(next);
  };

  const toggleSelectAlbum = (albumId: string) => {
    setSelectedAlbumIds((prev) => ({
      ...prev,
      [albumId]: !prev[albumId],
    }));
  };

  const toggleExpandAlbum = (albumId: string) => {
    setExpandedAlbumIds((prev) => ({
      ...prev,
      [albumId]: !prev[albumId],
    }));
  };

  const filteredAlbums = albums.filter((alb) => {
    if (filterType === 'album') return alb.albumType === 'album';
    if (filterType === 'single') return alb.albumType === 'single';
    return true;
  });

  const selectedAlbumsCount = Object.values(selectedAlbumIds).filter(Boolean).length;
  const selectedSongsCount = albums
    .filter((a) => selectedAlbumIds[a.id])
    .reduce((acc, a) => acc + a.tracks.length, 0);

  const handleImport = async () => {
    const selected = albums.filter((a) => selectedAlbumIds[a.id]);
    if (selected.length === 0) {
      setErrorMsg('Selecciona al menos un álbum o single para importar.');
      return;
    }

    setIsImporting(true);
    setErrorMsg(null);
    stopAudioPreview();

    try {
      const data = await apiFetch('/api/spotify/import-discography', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artist: artistProfile,
          selectedAlbums: selected,
          options: {
            overwriteDuplicates,
            updateEpkSpotifyUrl: updateEpkUrl,
          },
        }),
      });

      if (!data || !data.success) {
        throw new Error(data?.error || 'Error al guardar la discografía en la base de datos.');
      }

      // Update local storage and app state
      if (Array.isArray(data.allBandSongs)) {
        saveSongsToLocalStorageSafely(data.allBandSongs);
        onSongsImported(data.allBandSongs);
      }

      onClose();
    } catch (err: any) {
      console.error('Error importing Spotify discography:', err);
      setErrorMsg(err.message || 'Error al importar las canciones.');
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden transition-all ${
          isStitchLight
            ? 'bg-slate-50 border-slate-300 text-slate-900'
            : 'bg-[#121212] border-neutral-800 text-white'
        }`}
      >
        {/* Header Modal Bar */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#1db954]/20 via-[#1db954]/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1db954] text-black flex items-center justify-center shadow-lg shadow-[#1db954]/20">
              <Disc className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-display font-black tracking-tight flex items-center gap-2">
                  Importar Discografía de Spotify
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/30">
                  OFICIAL SPOTIFY API
                </span>
              </div>
              <p className="text-xs font-mono opacity-70 mt-0.5">
                Trae automáticamente todos los álbumes, sencillos, portadas, duraciones y previews de audio de la banda.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & URL Input Bar */}
        <div className="p-5 sm:p-6 border-b border-white/10 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFetchDiscography();
            }}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nombre de la banda (ej: Bakandeya) o URL de Spotify (https://open.spotify.com/artist/...)"
                className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm font-mono border focus:outline-none focus:ring-2 focus:ring-[#1db954] transition-all ${
                  isStitchLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                    : 'bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500'
                }`}
              />
            </div>
            <button
              type="submit"
              disabled={isFetchingDiscography}
              className="px-6 py-2.5 rounded-2xl bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold font-mono text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#1db954]/20 transition-all disabled:opacity-50 shrink-0"
            >
              {isFetchingDiscography ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <Radio className="w-4 h-4" />
                  <span>Buscar en Spotify</span>
                </>
              )}
            </button>
          </form>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Artist Profile Card */}
          {artistProfile && (
            <div
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                isStitchLight
                  ? 'bg-white border-slate-200 shadow-sm'
                  : 'bg-neutral-900/90 border-neutral-800'
              }`}
            >
              <div className="flex items-center gap-3.5">
                {artistProfile.imageUrl ? (
                  <img
                    src={artistProfile.imageUrl}
                    alt={artistProfile.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#1db954] shadow-md"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#1db954]/20 border border-[#1db954]/40 flex items-center justify-center text-xl">
                    🎸
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-display font-black tracking-tight">{artistProfile.name}</h3>
                    <ShieldCheck className="w-4 h-4 text-[#1db954]" title="Artista verificado en Spotify" />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono opacity-75 mt-0.5 flex-wrap">
                    <span>{artistProfile.followers?.toLocaleString()} seguidores</span>
                    <span>•</span>
                    <span>Popularidad: {artistProfile.popularity}/100</span>
                    {artistProfile.genres?.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{artistProfile.genres.slice(0, 2).join(', ')}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <a
                href={artistProfile.spotifyUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl border border-white/10 hover:border-[#1db954] text-xs font-mono font-bold flex items-center gap-1.5 text-neutral-300 hover:text-[#1db954] transition-all"
              >
                <span>Ver en Spotify</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Discography List / Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">
          {isFetchingDiscography ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
              <RefreshCw className="w-10 h-10 text-[#1db954] animate-spin" />
              <p className="font-mono text-sm font-bold">Conectando con la API de Spotify y extrayendo discografía completa...</p>
              <p className="font-mono text-xs opacity-60">Obteniendo pistas, duraciones, portadas oficiales y metadatos de audio...</p>
            </div>
          ) : albums.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Disc className="w-12 h-12 text-neutral-600 mx-auto" />
              <p className="font-mono text-sm text-neutral-400">
                Escribe el nombre de tu banda arriba o pega tu enlace de artista de Spotify para escanear tus álbumes y canciones.
              </p>
            </div>
          ) : (
            <>
              {/* Discography Controls Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Category Filter */}
                  <div className={`p-1 rounded-full border flex items-center gap-1 ${isStitchLight ? 'bg-slate-200 border-slate-300' : 'bg-neutral-900 border-neutral-800'}`}>
                    <button
                      type="button"
                      onClick={() => setFilterType('todos')}
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
                        filterType === 'todos' ? 'bg-[#1db954] text-black shadow' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Todos ({albums.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterType('album')}
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
                        filterType === 'album' ? 'bg-[#1db954] text-black shadow' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Álbumes ({albums.filter((a) => a.albumType === 'album').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterType('single')}
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
                        filterType === 'single' ? 'bg-[#1db954] text-black shadow' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Singles y EPs ({albums.filter((a) => a.albumType === 'single').length})
                    </button>
                  </div>

                  {/* Select / Deselect All */}
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(selectedAlbumsCount < albums.length)}
                    className="px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono font-bold hover:bg-white/5 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {selectedAlbumsCount === albums.length ? (
                      <>
                        <Square className="w-3.5 h-3.5" />
                        <span>Deseleccionar todos</span>
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-3.5 h-3.5 text-[#1db954]" />
                        <span>Seleccionar todos</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-xs font-mono font-bold text-[#1db954]">
                  {selectedAlbumsCount} de {albums.length} lanzamientos seleccionados ({selectedSongsCount} temas)
                </div>
              </div>

              {/* Albums List */}
              <div className="space-y-4">
                {filteredAlbums.map((album) => {
                  const isSelected = Boolean(selectedAlbumIds[album.id]);
                  const isExpanded = Boolean(expandedAlbumIds[album.id]);

                  return (
                    <div
                      key={album.id}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        isSelected
                          ? isStitchLight
                            ? 'border-[#1db954] bg-white shadow-md'
                            : 'border-[#1db954]/50 bg-neutral-900/90 shadow-lg'
                          : isStitchLight
                          ? 'border-slate-200 bg-white/70 opacity-60'
                          : 'border-neutral-800 bg-neutral-900/40 opacity-60'
                      }`}
                    >
                      {/* Album Header Bar */}
                      <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => toggleSelectAlbum(album.id)}
                            className="text-neutral-400 hover:text-white cursor-pointer shrink-0"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-[#1db954]" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>

                          {album.coverUrl ? (
                            <img
                              src={album.coverUrl}
                              alt={album.name}
                              className="w-14 h-14 rounded-xl object-cover shadow-md border border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0">
                              <Disc className="w-6 h-6 text-neutral-500" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-base font-display font-black truncate">{album.name}</h4>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                                  album.albumType === 'album'
                                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                }`}
                              >
                                {album.albumType === 'album' ? 'Álbum' : 'Single / EP'}
                              </span>
                              {album.releaseYear && (
                                <span className="text-xs font-mono opacity-60">{album.releaseYear}</span>
                              )}
                            </div>
                            <p className="text-xs font-mono opacity-70 mt-0.5">
                              {album.tracks.length} {album.tracks.length === 1 ? 'canción' : 'canciones'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <a
                            href={album.spotifyUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl text-neutral-400 hover:text-[#1db954] hover:bg-white/5 transition"
                            title="Abrir álbum en Spotify"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          <button
                            type="button"
                            onClick={() => toggleExpandAlbum(album.id)}
                            className="px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/10 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition"
                          >
                            <span>{isExpanded ? 'Ocultar Pistas' : 'Ver Pistas'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Tracklist */}
                      {isExpanded && (
                        <div className="border-t border-white/10 bg-black/20 p-3 sm:p-4 space-y-1.5">
                          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400 px-3 pb-1 flex items-center justify-between">
                            <span>Tracklist Oficial de Spotify ({album.tracks.length} temas)</span>
                            <span>Duración / Preview</span>
                          </div>

                          {album.tracks.map((track) => {
                            const isPlaying = playingTrackId === track.id;
                            const hasPreview = Boolean(track.previewUrl);

                            return (
                              <div
                                key={track.id}
                                className={`px-3 py-2 rounded-xl flex items-center justify-between gap-3 text-xs font-mono transition-all ${
                                  isPlaying
                                    ? 'bg-[#1db954]/20 border border-[#1db954]/40 text-white'
                                    : 'hover:bg-white/5 text-neutral-300'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <span className="w-5 text-neutral-500 font-bold text-center">
                                    {track.trackNumber}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => togglePlayTrackPreview(track, album.name)}
                                    className={`p-1.5 rounded-full transition-all cursor-pointer ${
                                      isPlaying
                                        ? 'bg-[#1db954] text-black shadow-md'
                                        : 'bg-white/10 hover:bg-[#1db954] hover:text-black text-neutral-300'
                                    }`}
                                    title={isPlaying ? 'Pausar preview' : 'Reproducir preview 30s de Spotify/Deezer'}
                                    disabled={loadingPreviewTrackId === track.id}
                                  >
                                    {loadingPreviewTrackId === track.id ? (
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : isPlaying ? (
                                      <Pause className="w-3 h-3" />
                                    ) : (
                                      <Play className="w-3 h-3 fill-current ml-0.5" />
                                    )}
                                  </button>

                                  <div className="min-w-0 flex-1">
                                    <span className="font-bold truncate block">{track.name}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  {track.tonalidadEstimada && (
                                    <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-amber-400 font-bold border border-amber-500/20">
                                      {track.tonalidadEstimada}
                                    </span>
                                  )}
                                  <span className="text-neutral-400 font-bold">{track.durationFormatted}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer with Options & Import Action */}
        <div className="p-5 sm:p-6 border-t border-white/10 bg-black/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-mono text-neutral-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={overwriteDuplicates}
                onChange={(e) => setOverwriteDuplicates(e.target.checked)}
                className="rounded border-neutral-700 text-[#1db954] focus:ring-[#1db954]"
              />
              <span>Sobrescribir temas existentes con el mismo título</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-mono text-neutral-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={updateEpkUrl}
                onChange={(e) => setUpdateEpkUrl(e.target.checked)}
                className="rounded border-neutral-700 text-[#1db954] focus:ring-[#1db954]"
              />
              <span>Vincular enlace de Spotify al EPK y dossier de la banda</span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl border border-white/10 hover:bg-white/5 text-xs font-mono font-bold transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleImport}
              disabled={isImporting || selectedSongsCount === 0}
              className="px-6 py-2.5 rounded-2xl bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold font-mono text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-[#1db954]/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Importando a la Discografía...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Importar {selectedSongsCount} Temas ({selectedAlbumsCount} Discos)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
