// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import React, { useState, useRef } from 'react';
import { 
  Disc3, Search, Music, Upload, Plus, Trash2, CheckCircle2, 
  Loader2, Play, Pause, Sparkles, Check, Layers, Clock, Award
} from 'lucide-react';
import { SpotifyAlbum, SpotifyTrack, ManualSongItem } from '../types';
import { Song } from '../../../types';

interface StepMusicSetlistProps {
  musicSubTab: 'spotify' | 'upload' | 'manual';
  setMusicSubTab: (tab: 'spotify' | 'upload' | 'manual') => void;
  spotifyQuery: string;
  setSpotifyQuery: (q: string) => void;
  isSearchingSpotify: boolean;
  spotifyAlbums: SpotifyAlbum[];
  selectedSpotifyTracks: Set<string>;
  onSearchSpotify: (e?: React.FormEvent) => void;
  onToggleTrackSelection: (trackId: string) => void;
  onSelectAllTracksInAlbum: (album: SpotifyAlbum) => void;
  onImportSpotifyTracks: () => void;
  isImportingSpotify: boolean;
  uploadedSongs: Song[];
  isUploadingAudio: boolean;
  onAudioFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  manualSongs: ManualSongItem[];
  newManualTitle: string;
  setNewManualTitle: (v: string) => void;
  newManualTonalidad: string;
  setNewManualTonalidad: (v: string) => void;
  newManualBpm: number;
  setNewManualBpm: (v: number) => void;
  newManualDuracion: string;
  setNewManualDuracion: (v: string) => void;
  onAddManualSong: () => void;
  onRemoveManualSong: (id: string) => void;
  onBulkAddManualSongs: (text: string) => void;
  createdSetlistName: string | null;
  isCreatingSetlist: boolean;
  onGenerateSetlist: (durationMinutes: number) => void;
  totalImportedSongsCount: number;
}

export const StepMusicSetlist: React.FC<StepMusicSetlistProps> = ({
  musicSubTab,
  setMusicSubTab,
  spotifyQuery,
  setSpotifyQuery,
  isSearchingSpotify,
  spotifyAlbums,
  selectedSpotifyTracks,
  onSearchSpotify,
  onToggleTrackSelection,
  onSelectAllTracksInAlbum,
  onImportSpotifyTracks,
  isImportingSpotify,
  uploadedSongs,
  isUploadingAudio,
  onAudioFileUpload,
  manualSongs,
  newManualTitle,
  setNewManualTitle,
  newManualTonalidad,
  setNewManualTonalidad,
  newManualBpm,
  setNewManualBpm,
  newManualDuracion,
  setNewManualDuracion,
  onAddManualSong,
  onRemoveManualSong,
  onBulkAddManualSongs,
  createdSetlistName,
  isCreatingSetlist,
  onGenerateSetlist,
  totalImportedSongsCount,
}) => {
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const [bulkText, setBulkText] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Disc3 className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-semibold text-white">Discografía, Canciones & Generador de Setlists</h3>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 font-medium border border-amber-500/20">
          {totalImportedSongsCount} {totalImportedSongsCount === 1 ? 'canción en repertorio' : 'canciones en repertorio'}
        </span>
      </div>

      {/* Sub tabs */}
      <div className="flex rounded-xl bg-zinc-900/80 p-1 border border-white/5">
        <button
          type="button"
          onClick={() => setMusicSubTab('spotify')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
            musicSubTab === 'spotify'
              ? 'bg-amber-500 text-black shadow-md font-semibold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          Importar de Spotify
        </button>
        <button
          type="button"
          onClick={() => setMusicSubTab('upload')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
            musicSubTab === 'upload'
              ? 'bg-amber-500 text-black shadow-md font-semibold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          Subir Audio (MP3 / WAV)
        </button>
        <button
          type="button"
          onClick={() => setMusicSubTab('manual')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
            musicSubTab === 'manual'
              ? 'bg-amber-500 text-black shadow-md font-semibold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          Añadir Manual / En Bloque
        </button>
      </div>

      {/* Subtab 1: Spotify */}
      {musicSubTab === 'spotify' && (
        <div className="space-y-4">
          <form onSubmit={onSearchSpotify} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={spotifyQuery}
                onChange={(e) => setSpotifyQuery(e.target.value)}
                placeholder="Buscar artista o grupo en Spotify..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
            <button
              type="submit"
              disabled={isSearchingSpotify || !spotifyQuery.trim()}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSearchingSpotify ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
            </button>
          </form>

          {spotifyAlbums.length > 0 && (
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {spotifyAlbums.map((album) => (
                <div key={album.id} className="p-3 rounded-xl bg-zinc-900 border border-white/5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={album.coverUrl} alt={album.name} className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <h4 className="text-xs font-semibold text-white">{album.name}</h4>
                        <span className="text-[10px] text-zinc-500">{album.releaseYear} · {album.totalTracks} temas</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectAllTracksInAlbum(album)}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-medium"
                    >
                      Seleccionar todas
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 border-t border-white/5">
                    {album.tracks.map((track) => {
                      const isSelected = selectedSpotifyTracks.has(track.id);
                      return (
                        <button
                          key={track.id}
                          type="button"
                          onClick={() => onToggleTrackSelection(track.id)}
                          className={`flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                            isSelected
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-zinc-800/40 text-zinc-300 border border-transparent hover:border-white/10'
                          }`}
                        >
                          <span className="truncate pr-2">{track.name}</span>
                          <span className="text-[10px] text-zinc-500 flex-shrink-0">{track.durationFormatted}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {selectedSpotifyTracks.size > 0 && (
                <div className="sticky bottom-0 bg-[#121215]/95 backdrop-blur-md p-3 rounded-xl border border-amber-500/30 flex items-center justify-between">
                  <span className="text-xs text-amber-300 font-medium">
                    {selectedSpotifyTracks.size} canciones seleccionadas
                  </span>
                  <button
                    type="button"
                    onClick={onImportSpotifyTracks}
                    disabled={isImportingSpotify}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors"
                  >
                    {isImportingSpotify ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Importar al Repertorio
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Subir Audio Suelto */}
      {musicSubTab === 'upload' && (
        <div className="space-y-4">
          <input
            type="file"
            ref={audioInputRef}
            onChange={onAudioFileUpload}
            accept="audio/*"
            multiple
            className="hidden"
          />

          <div
            onClick={() => audioInputRef.current?.click()}
            className="border-2 border-dashed border-white/10 hover:border-amber-400/50 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-zinc-900/40 hover:bg-zinc-900/70"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">
              Arrastra o haz clic para subir archivos de audio (MP3, WAV, M4A)
            </h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Puedes subir canciones completas o maquetas. Se añadirán directamente al reproductor del EPK y a tu repertorio.
            </p>
            {isUploadingAudio && (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-amber-400 font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                Subiendo y procesando audio...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subtab 3: Manual / En Bloque */}
      {musicSubTab === 'manual' && (
        <div className="space-y-4">
          {!showBulkInput ? (
            <div className="p-4 rounded-xl bg-[#19191d] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Añadir Canción Individual
                </h4>
                <button
                  type="button"
                  onClick={() => setShowBulkInput(true)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                >
                  ⚡ Pegar lista completa de temas en bloque
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newManualTitle}
                    onChange={(e) => setNewManualTitle(e.target.value)}
                    placeholder="Título de la Canción *"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={newManualTonalidad}
                    onChange={(e) => setNewManualTonalidad(e.target.value)}
                    placeholder="Tonalidad (ej. Am, Sol)"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={newManualDuracion}
                    onChange={(e) => setNewManualDuracion(e.target.value)}
                    placeholder="Duración (ej. 3:45)"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onAddManualSong}
                  disabled={!newManualTitle.trim()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Añadir Canción
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#19191d] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Pegar Títulos en Bloque (Uno por línea)
                </h4>
                <button
                  type="button"
                  onClick={() => setShowBulkInput(false)}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Volver a modo individual
                </button>
              </div>
              <textarea
                rows={4}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={"1. El Despertar\n2. Noche en el Puerto\n3. Tormenta Eléctrica\n4. Último Baile"}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-600 text-xs focus:outline-none focus:border-amber-400 font-mono"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onBulkAddManualSongs(bulkText);
                    setBulkText('');
                    setShowBulkInput(false);
                  }}
                  disabled={!bulkText.trim()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Procesar e Importar Lista
                </button>
              </div>
            </div>
          )}

          {manualSongs.length > 0 && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {manualSongs.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-white/5 text-xs">
                  <span className="text-white font-medium">{s.titulo}</span>
                  <div className="flex items-center gap-3 text-zinc-400">
                    {s.tonalidad && <span>{s.tonalidad}</span>}
                    {s.duracion && <span>{s.duracion}</span>}
                    <button
                      type="button"
                      onClick={() => onRemoveManualSong(s.id)}
                      className="text-zinc-600 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ⚡ Generador de Setlist de Debut */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-semibold text-amber-300">
              ⚡ Generador Automático de Setlist Debut
            </h4>
          </div>
          {createdSetlistName && (
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {createdSetlistName} Creado
            </span>
          )}
        </div>

        <p className="text-xs text-zinc-400">
          Crea al instante un setlist de concierto optimizado con tus temas para ensayos, teleprompter de acordes y escenario.
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => onGenerateSetlist(60)}
            disabled={isCreatingSetlist || totalImportedSongsCount === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Layers className="w-3.5 h-3.5" />
            Crear Setlist Directo (60 min)
          </button>

          <button
            type="button"
            onClick={() => onGenerateSetlist(45)}
            disabled={isCreatingSetlist || totalImportedSongsCount === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/10 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Clock className="w-3.5 h-3.5" />
            Crear Setlist Festival / Showcase (45 min)
          </button>
        </div>
      </div>
    </div>
  );
};
