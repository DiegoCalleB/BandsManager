import React, { useState, useRef } from "react";
import {
  Disc3,
  Search,
  Music,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  Play,
  Pause,
  Sparkles,
  Check,
  Layers,
  Clock,
  Award,
} from "lucide-react";
import { SpotifyAlbum, SpotifyTrack, ManualSongItem } from "../types";
import { Song } from "../../../types";
import { ShowIcon } from '../../ui/ShowIcon';

interface StepMusicSetlistProps {
  musicSubTab: "spotify" | "upload" | "manual";
  setMusicSubTab: (tab: "spotify" | "upload" | "manual") => void;
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
  const [bulkText, setBulkText] = useState("");
  const [showBulkInput, setShowBulkInput] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Disc3 className="w-5 h-5 text-[var(--acc)]" />
          <h3 className="text-base font-semibold text-[var(--ink)]">
            Discografía, Canciones & Generador de Setlists
          </h3>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-[var(--r-pill)] bg-[var(--acc)]/10 text-[var(--acc-ink)] font-medium">
          {totalImportedSongsCount}{" "}
          {totalImportedSongsCount === 1
            ? "canción en repertorio"
            : "canciones en repertorio"}
        </span>
      </div>

      {/* Sub tabs */}
      <div className="flex rounded-[var(--r-m)] bg-[var(--bg)]/80 p-1">
        <button
          type="button"
          onClick={() => setMusicSubTab("spotify")}
          className={`flex-1 py-2 px-3 rounded-[var(--r-pill)] text-xs font-medium transition-ui flex items-center justify-center gap-2 ${
            musicSubTab === "spotify"
              ? "bg-[var(--acc)] text-[var(--on-acc)] font-semibold"
              : "text-[var(--ink-2)] hover:text-[var(--ink)]"
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          Importar de Spotify
        </button>
        <button
          type="button"
          onClick={() => setMusicSubTab("upload")}
          className={`flex-1 py-2 px-3 rounded-[var(--r-pill)] text-xs font-medium transition-ui flex items-center justify-center gap-2 ${
            musicSubTab === "upload"
              ? "bg-[var(--acc)] text-[var(--on-acc)] font-semibold"
              : "text-[var(--ink-2)] hover:text-[var(--ink)]"
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          Subir audio (MP3 / WAV)
        </button>
        <button
          type="button"
          onClick={() => setMusicSubTab("manual")}
          className={`flex-1 py-2 px-3 rounded-[var(--r-pill)] text-xs font-medium transition-ui flex items-center justify-center gap-2 ${
            musicSubTab === "manual"
              ? "bg-[var(--acc)] text-[var(--on-acc)] font-semibold"
              : "text-[var(--ink-2)] hover:text-[var(--ink)]"
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          Añadir manual / en bloque
        </button>
      </div>

      {/* Subtab 1: Spotify */}
      {musicSubTab === "spotify" && (
        <div className="space-y-4">
          <form onSubmit={onSearchSpotify} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-2)]" />
              <input
                type="text"
                value={spotifyQuery}
                onChange={(e) => setSpotifyQuery(e.target.value)}
                placeholder="Buscar artista o grupo en Spotify…"
                className="w-full pl-10 pr-4 py-2.5 rounded-[var(--r-m)] bg-[var(--surface)] text-[var(--ink)] placeholder-[var(--ink-2)] text-xs focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSearchingSpotify || !spotifyQuery.trim()}
              className="px-4 py-2.5 rounded-[var(--r-pill)] bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSearchingSpotify ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Buscar"
              )}
            </button>
          </form>

          {spotifyAlbums.length > 0 && (
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {spotifyAlbums.map((album) => (
                <div
                  key={album.id}
                  className="p-3 rounded-[var(--r-m)] bg-[var(--surface)] space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={album.coverUrl}
                        alt={album.name}
                        className="w-10 h-10 rounded-[var(--r-s)] object-cover"
                      />
                      <div>
                        <h4 className="text-xs font-semibold text-[var(--ink)]">
                          {album.name}
                        </h4>
                        <span className="text-micro text-[var(--ink-2)]">
                          {album.releaseYear} · {album.totalTracks} temas
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectAllTracksInAlbum(album)}
                      className="text-xs text-[var(--acc)] hover:text-[var(--acc)]/70 font-medium"
                    >
                      Seleccionar todas
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {album.tracks.map((track) => {
                      const isSelected = selectedSpotifyTracks.has(track.id);
                      return (
                        <button
                          key={track.id}
                          type="button"
                          onClick={() => onToggleTrackSelection(track.id)}
                          className={`flex items-center justify-between p-2 rounded-[var(--r-s)] text-left text-xs transition-colors ${
                            isSelected
                              ? "bg-[var(--acc)]/20 text-[var(--acc-ink)]"
                              : "bg-[var(--sunken)]/40 text-[var(--ink-2)] hover:bg-[var(--sunken)]"
                          }`}
                        >
                          <span className="truncate pr-2">{track.name}</span>
                          <span className="text-micro text-[var(--ink-2)] flex-shrink-0">
                            {track.durationFormatted}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {selectedSpotifyTracks.size > 0 && (
                <div className="sticky bottom-0 bg-[var(--surface)]/95 p-3 rounded-[var(--r-m)] flex items-center justify-between">
                  <span className="text-xs text-[var(--acc)]/70 font-medium">
                    {selectedSpotifyTracks.size} canciones seleccionadas
                  </span>
                  <button
                    type="button"
                    onClick={onImportSpotifyTracks}
                    disabled={isImportingSpotify}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--r-pill)] bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-semibold text-xs transition-colors"
                  >
                    {isImportingSpotify ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    Importar al Repertorio
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Subir Audio Suelto */}
      {musicSubTab === "upload" && (
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
            className="  rounded-[var(--r-l)] p-8 text-center cursor-pointer transition-colors bg-[var(--bg)]/40 hover:bg-[var(--surface)]/70"
          >
            <div className="w-12 h-12 rounded-[var(--r-l)] bg-[var(--acc)]/10 text-[var(--acc-ink)] flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-[var(--ink)] mb-1">
              Arrastra o haz clic para subir archivos de audio (MP3, WAV, M4A)
            </h4>
            <p className="text-xs text-[var(--ink-2)] max-w-md mx-auto">
              Puedes subir canciones completas o maquetas. Se añadirán
              directamente al reproductor del EPK y a tu repertorio.
            </p>
            {isUploadingAudio && (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[var(--acc)] font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                Subiendo y procesando audio…
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subtab 3: Manual / En Bloque */}
      {musicSubTab === "manual" && (
        <div className="space-y-4">
          {!showBulkInput ? (
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--surface)] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-[var(--ink-2)]">
                  Añadir canción individual
                </h4>
                <button
                  type="button"
                  onClick={() => setShowBulkInput(true)}
                  className="text-xs text-[var(--acc)] hover:text-[var(--acc)]/70 font-medium"
                >
                  <ShowIcon inline emoji="⚡" />Pegar lista completa de temas en bloque
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newManualTitle}
                    onChange={(e) => setNewManualTitle(e.target.value)}
                    placeholder="Título de la canción *"
                    className="w-full px-3 py-2 rounded-[var(--r-s)] bg-[var(--bg)] text-[var(--ink)] placeholder-[var(--ink-2)] text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={newManualTonalidad}
                    onChange={(e) => setNewManualTonalidad(e.target.value)}
                    placeholder="Tonalidad (ej. Am, Sol)"
                    className="w-full px-3 py-2 rounded-[var(--r-s)] bg-[var(--bg)] text-[var(--ink)] placeholder-[var(--ink-2)] text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={newManualDuracion}
                    onChange={(e) => setNewManualDuracion(e.target.value)}
                    placeholder="Duración (ej. 3:45)"
                    className="w-full px-3 py-2 rounded-[var(--r-s)] bg-[var(--bg)] text-[var(--ink)] placeholder-[var(--ink-2)] text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onAddManualSong}
                  disabled={!newManualTitle.trim()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--r-pill)] bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Añadir canción
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--surface)] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-[var(--ink-2)]">
                  Pegar Títulos en Bloque (Uno por línea)
                </h4>
                <button
                  type="button"
                  onClick={() => setShowBulkInput(false)}
                  className="text-xs text-[var(--ink-2)] hover:text-[var(--ink)]"
                >
                  Volver a modo individual
                </button>
              </div>
              <textarea
                rows={4}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={
                  "1. El Despertar\n2. Noche en el Puerto\n3. Tormenta Eléctrica\n4. Último Baile"
                }
                className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--sunken)] text-[var(--ink)] placeholder-[var(--ink-2)] text-xs focus:outline-none focus:font-sans"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onBulkAddManualSongs(bulkText);
                    setBulkText("");
                    setShowBulkInput(false);
                  }}
                  disabled={!bulkText.trim()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--r-pill)] bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-semibold text-xs transition-colors disabled:opacity-50"
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
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2 rounded-[var(--r-s)] bg-[var(--bg)] text-xs"
                >
                  <span className="text-[var(--ink)] font-medium">
                    {s.titulo}
                  </span>
                  <div className="flex items-center gap-3 text-[var(--ink-2)]">
                    {s.tonalidad && <span>{s.tonalidad}</span>}
                    {s.duracion && <span>{s.duracion}</span>}
                    <button
                      type="button"
                      onClick={() => onRemoveManualSong(s.id)}
                      className="text-[var(--ink-2)] hover:text-[var(--alert)]"
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
      <div className="p-4 rounded-[var(--r-m)] bg-[var(--acc)]/10  space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--acc)]" />
            <h4 className="text-xs font-semibold text-[var(--acc)]/70">
              <ShowIcon inline emoji="⚡" />Generador Automático de Setlist Debut
            </h4>
          </div>
          {createdSetlistName && (
            <span className="text-xs px-2 py-0.5 rounded-[var(--r-s)] bg-[var(--ok)]/20 text-[var(--ink)] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {createdSetlistName} Creado
            </span>
          )}
        </div>

        <p className="text-xs text-[var(--ink-2)]">
          Crea al instante un setlist de concierto optimizado con tus temas para
          ensayos, teleprompter de acordes y escenario.
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => onGenerateSetlist(60)}
            disabled={isCreatingSetlist || totalImportedSongsCount === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--r-pill)] bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--acc-ink)] text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Layers className="w-3.5 h-3.5" />
            Crear Setlist directo (60 min)
          </button>

          <button
            type="button"
            onClick={() => onGenerateSetlist(45)}
            disabled={isCreatingSetlist || totalImportedSongsCount === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--r-pill)] bg-[var(--sunken)] hover:bg-[var(--ink-3)]/60 text-[var(--ink-2)] text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Clock className="w-3.5 h-3.5" />
            Crear Setlist Festival / Showcase (45 min)
          </button>
        </div>
      </div>
    </div>
  );
};
