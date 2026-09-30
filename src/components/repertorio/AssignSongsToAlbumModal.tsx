import React, { useState } from 'react';
import { X, Search, Plus, Check, Disc3, Upload, Image as ImageIcon } from 'lucide-react';
import { Song, ThemeColors } from '../../types';
import { formatSongTitle } from '../../utils/formatSongTitle';
import { ModalPortal } from '../common/ModalPortal';
import { PublicoSilhouette } from '../ui/PublicoSilhouette';
import { IconButton, Input, Select, Textarea } from '../ui';

interface AssignSongsToAlbumModalProps {
  isOpen: boolean;
  albumName: string;
  songs: Song[];
  colors: ThemeColors;
  onClose: () => void;
  onSaveAlbumSongs: (
    albumName: string,
    selectedSongIds: string[],
    albumExtraInfo?: {
      año?: string;
      portadaUrl?: string;
      tipoTrabajo?: string;
      descripcion?: string;
    }
  ) => void;
}

export function AssignSongsToAlbumModal({ isOpen, albumName, songs, colors, onClose, onSaveAlbumSongs }: AssignSongsToAlbumModalProps) {
  const currentAlbumSongs = songs.filter((s) => (s.albumDisco || 'Singles / Sin Disco') === albumName || s.albumDisco === albumName);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(currentAlbumSongs.map((s) => s.id)));
  const [search, setSearch] = useState('');
  const [customAlbumName, setCustomAlbumName] = useState(albumName);
  const [albumYear, setAlbumYear] = useState(new Date().getFullYear().toString());
  const [albumType, setAlbumType] = useState('Álbum Estudio');
  const [coverUrl, setCoverUrl] = useState('');
  const [description, setDescription] = useState('');

  // Los hooks de arriba tienen que ejecutarse siempre (ver react-hooks/rules-of-hooks): este
  // guard vivía antes de ellos, así que abrir/cerrar el modal cambiaba cuántos hooks corrían.
  if (!isOpen) return null;

  const filteredSongs = songs.filter(
    (s) =>
      s.titulo.toLowerCase().includes(search.toLowerCase()) ||
      (s.tonalidad && s.tonalidad.toLowerCase().includes(search.toLowerCase())) ||
      (s.albumDisco && s.albumDisco.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleSong = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setCoverUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAlbumName = customAlbumName.trim() || albumName || 'Nuevo Álbum';
    onSaveAlbumSongs(finalAlbumName, Array.from(selectedIds), {
      año: albumYear,
      portadaUrl: coverUrl,
      tipoTrabajo: albumType,
      descripcion: description,
    });
    onClose();
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-[var(--scrim)]/80 overflow-y-auto overscroll-contain">
        <div className={`w-full max-w-2xl p-5 rounded-[var(--r-l)] my-auto max-h-[92vh] flex flex-col ${colors.card} text-[var(--ink)]`}>
          <div className="flex justify-between items-center pb-3">
            <div className="flex items-center gap-2">
              <Disc3 className="w-5 h-5 text-[var(--ok)]" />
              <h3 className="text-sm font-bold font-sans text-[var(--ink)]">
                {albumName ? `Editar Disco: ${albumName}` : 'Crear Nuevo Disco / Lanzamiento'}
              </h3>
            </div>
            <IconButton label="Cerrar" size="icon-xs" onClick={onClose}>
              <X className="w-5 h-5" />
            </IconButton>
          </div>

          <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden space-y-4 pt-4">
            <div className="space-y-3 overflow-y-auto pr-1 max-h-[220px]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[var(--ink-2)] mb-1">Nombre del álbum / disco *</label>
                  <Input
                    size="sm"
                    type="text"
                    required
                    value={customAlbumName}
                    onChange={(e) => setCustomAlbumName(e.target.value)}
                    placeholder="ej. Lanzamiento Verano 2026"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink-2)] mb-1">Año de Lanzamiento</label>
                  <Input
                    size="sm"
                    type="text"
                    value={albumYear}
                    onChange={(e) => setAlbumYear(e.target.value)}
                    placeholder="ej. 2026"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--ink-2)] mb-1">Tipo de trabajo</label>
                  <Select size="sm" aria-label="Tipo de trabajo"
                    value={albumType}
                    onChange={(e) => setAlbumType(e.target.value)}
                    wrapperClassName="w-full"
                  >
                    <option value="Álbum Estudio">Álbum estudio</option>
                    <option value="EP">EP (Extended Play)</option>
                    <option value="Single">Single / Sencillo</option>
                    <option value="Directo">Álbum en directo</option>
                    <option value="Maqueta">Maqueta / demo</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink-2)] mb-1">Imagen de portada (Upload o URL)</label>
                  <div className="flex gap-2 items-center">
                    <Input
                      size="sm"
                      type="text"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder="https://… o sube imagen"
                      className="flex-1"
                    />
                    <label className="px-3 py-2 bg-[var(--sunken)] hover:bg-[var(--ink-3)]/60 text-[var(--ink)] rounded-[var(--r-m)] cursor-pointer shrink-0 flex items-center gap-1 text-xs">
                      <Upload className="w-3.5 h-3.5 text-[var(--ok)]" />
                      <input aria-label="Imagen de portada (Upload o URL)" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink-2)] mb-1">Descripción / notas de lanzamiento</label>
                <Textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notas sobre la producción, estudio de grabación, concepto…"
                  className="w-full"
                />
              </div>
            </div>

            <div className=" pt-3 flex flex-col flex-1 overflow-hidden">
              <div className="flex items-center justify-between text-xs font-sans text-[var(--ink-2)] mb-2">
                <span className="font-bold flex items-center gap-1.5">
                  <Disc3 className="w-4 h-4 text-[var(--ok)]" />
                  <span>Seleccionar Canciones del Disco ({selectedIds.size} seleccionadas):</span>
                </span>
              </div>

              <div className="relative mb-2">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--ink-2)]" />
                <Input
                  size="sm"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar canción en el catálogo para incluir…"
                  className="w-full pl-9 pr-3"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[220px]">
                {filteredSongs.map((song) => {
                  const isSelected = selectedIds.has(song.id);
                  return (
                    <div
                      key={song.id}
                      onClick={() => toggleSong(song.id)}
                      className={`p-2.5 rounded-[var(--r-m)] flex items-center justify-between cursor-pointer transition-ui ${
                        isSelected
                          ? 'bg-[var(--surface)]/50 text-[var(--ink)]'
                          : 'bg-[var(--surface)]/80 hover:bg-[var(--surface)]/80 text-[var(--ink-2)]'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate pr-2">
                        <div
                          className={`w-5 h-5 rounded-[var(--r-s)] flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-[var(--surface)] text-[var(--ink)]' : 'bg-[var(--surface)]/70 text-[var(--ink-2)]'
                          }`}
                        >
                          {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Plus className="w-3.5 h-3.5" />}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold truncate flex items-center gap-1.5">
                            <span>{formatSongTitle(song.titulo)}</span>
                            {song.tonalidad && <span className="text-micro text-[var(--ok)] font-sans">({song.tonalidad})</span>}
                          </div>
                          <div className="text-micro text-[var(--ink-2)] truncate">
                            {song.albumDisco ? `Álbum actual: ${song.albumDisco}` : 'Sin álbum asignado'}
                          </div>
                        </div>
                      </div>

                      <span className="text-micro font-sans opacity-60 shrink-0">{song.duracion}</span>
                    </div>
                  );
                })}

                {filteredSongs.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8">
                    <PublicoSilhouette opacity={0.12} size="small" />
                    <p className="mt-4 font-medium text-[var(--ink)] text-xs">Sin canciones disponibles</p>
                    <p className="mt-1.5 text-[var(--ink-2)] text-xs max-w-xs text-center">
                      Ajusta el filtro o crea nuevas canciones en tu repertorio.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-[var(--r-pill)] text-xs text-[var(--ink-2)] hover:bg-[var(--surface)]/80 transition-colors font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-[var(--r-pill)] text-xs font-bold bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink)] transition-transform active:scale-[0.97] cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Guardar Disco ({selectedIds.size} temas)</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
