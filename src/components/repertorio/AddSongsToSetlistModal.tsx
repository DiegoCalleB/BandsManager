import React, { useMemo, useState } from 'react';
import { X, Search, Check, ListPlus, Star } from 'lucide-react';
import { Song, ThemeColors } from '../../types';
import { ModalPortal } from '../common/ModalPortal';
import { formatSecondsToMmSs } from '../../utils/repertorioUtils';

interface AddSongsToSetlistModalProps {
  isOpen: boolean;
  songs: Song[];
  existingSongIds: string[];
  colors: ThemeColors;
  isStitchLight: boolean;
  onClose: () => void;
  onAddSongs: (songIds: string[]) => void;
}

export function AddSongsToSetlistModal({
  isOpen,
  songs,
  existingSongIds,
  colors,
  isStitchLight,
  onClose,
  onAddSongs,
}: AddSongsToSetlistModalProps) {
  const [search, setSearch] = useState('');
  const [onlyFavoritos, setOnlyFavoritos] = useState(false);
  const [albumFilter, setAlbumFilter] = useState('todos');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const existingSet = useMemo(() => new Set(existingSongIds), [existingSongIds]);

  const albumsList = useMemo(() => {
    const set = new Set<string>();
    songs.forEach(s => {
      const alb = s.albumDisco || s.album;
      set.add(alb || 'Singles / Sin Disco');
    });
    return ['todos', ...Array.from(set)];
  }, [songs]);

  if (!isOpen) return null;

  const filteredSongs = songs.filter(s => {
    const matchSearch = search === '' ||
      s.titulo.toLowerCase().includes(search.toLowerCase()) ||
      (s.tonalidad && s.tonalidad.toLowerCase().includes(search.toLowerCase()));
    const matchFav = !onlyFavoritos || s.favoritoGeneral;
    const alb = s.albumDisco || s.album || 'Singles / Sin Disco';
    const matchAlbum = albumFilter === 'todos' || alb === albumFilter;
    return matchSearch && matchFav && matchAlbum;
  });

  const toggleSong = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      filteredSongs.forEach(s => next.add(s.id));
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const selectedDurationSeconds = songs
    .filter(s => selectedIds.has(s.id))
    .reduce((acc, s) => acc + (s.duracionSegundos || 0), 0);

  const handleSubmit = () => {
    if (selectedIds.size === 0) return;
    onAddSongs(Array.from(selectedIds));
    onClose();
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto overscroll-contain">
        <div className={`w-full max-w-2xl p-5 rounded-2xl shadow-2xl my-auto max-h-[92vh] flex flex-col border border-neutral-800 ${colors.card} text-white`}>
          <div className="flex justify-between items-center pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ListPlus className="w-5 h-5 text-[#1db954]" />
              <h3 className="text-sm font-bold font-mono uppercase text-white">
                Añadir Varias Canciones al Repertorio
              </h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="pt-3 space-y-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título o tonalidad..."
                className={`w-full pl-8 pr-3 py-2 text-xs font-mono rounded-xl border focus:outline-none focus:border-[#1db954] ${
                  isStitchLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-neutral-900 text-white border-neutral-800'
                }`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={albumFilter}
                onChange={(e) => setAlbumFilter(e.target.value)}
                className={`text-[10px] font-mono py-1.5 px-2.5 rounded-lg focus:outline-none cursor-pointer border border-neutral-800 font-bold ${
                  isStitchLight ? 'bg-white text-slate-800' : 'bg-neutral-900 text-[#d1b375]'
                }`}
              >
                {albumsList.map(alb => (
                  <option key={alb} value={alb}>{alb === 'todos' ? 'Todos los álbumes' : alb}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setOnlyFavoritos(p => !p)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                  onlyFavoritos
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                }`}
              >
                <Star className={`w-3 h-3 ${onlyFavoritos ? 'fill-amber-400' : ''}`} />
                <span>Solo Favoritos</span>
              </button>

              <button
                type="button"
                onClick={selectAllFiltered}
                className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold cursor-pointer bg-neutral-900 text-neutral-300 border border-neutral-800 hover:text-white transition-colors"
              >
                Seleccionar todo lo filtrado ({filteredSongs.length})
              </button>

              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold cursor-pointer bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white transition-colors"
                >
                  Vaciar selección
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto mt-3 space-y-1.5 pr-1">
            {filteredSongs.length === 0 ? (
              <div className="text-center py-8 text-xs text-neutral-500 font-mono">
                No hay canciones que coincidan con el filtro.
              </div>
            ) : (
              filteredSongs.map(s => {
                const isSelected = selectedIds.has(s.id);
                const alreadyInSetlist = existingSet.has(s.id);
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => toggleSong(s.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#1db954]/15 border-[#1db954]/50'
                        : isStitchLight
                        ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-[#1db954] border-[#1db954]' : 'border-neutral-600'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">{s.titulo}</span>
                        {s.favoritoGeneral && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                        {alreadyInSetlist && (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-700 text-neutral-300 shrink-0">
                            Ya en el repertorio
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono truncate">
                        {(s.albumDisco || s.album || 'Sin álbum')} · {s.tonalidad || '—'} · {formatSecondsToMmSs(s.duracionSegundos || 0)}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="pt-3 mt-2 border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
            <span className="text-[10px] font-mono text-neutral-400">
              {selectedIds.size > 0
                ? `${selectedIds.size} seleccionadas · ${formatSecondsToMmSs(selectedDurationSeconds)}`
                : 'Ninguna canción seleccionada'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-neutral-300 hover:bg-neutral-800 transition-colors font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={selectedIds.size === 0}
                onClick={handleSubmit}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#1db954] hover:bg-[#1ed760] disabled:opacity-40 disabled:cursor-not-allowed text-black transition-transform active:scale-95 cursor-pointer shadow-lg flex items-center gap-1.5"
              >
                <ListPlus className="w-4 h-4 stroke-[3]" />
                <span>Añadir {selectedIds.size > 0 ? selectedIds.size : ''} Canciones</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
