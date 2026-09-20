import React, { useState } from'react';
import { X, Search, Plus, Check, Disc3, Upload, Image as ImageIcon } from'lucide-react';
import { Song, ThemeColors } from'../../types';
import { formatSongTitle } from'../../utils/formatSongTitle';
import { ModalPortal } from'../common/ModalPortal';

interface AssignSongsToAlbumModalProps {
 isOpen: boolean;
 albumName: string;
 songs: Song[];
 colors: ThemeColors;
 isStitchLight: boolean;
 onClose: () => void;
 onSaveAlbumSongs: (albumName: string, selectedSongIds: string[], albumExtraInfo?: {
 año?: string;
 portadaUrl?: string;
 tipoTrabajo?: string;
 descripcion?: string;
 }) => void;
}

export function AssignSongsToAlbumModal({
 isOpen,
 albumName,
 songs,
 colors,
 isStitchLight,
 onClose,
 onSaveAlbumSongs,
}: AssignSongsToAlbumModalProps) {
 const currentAlbumSongs = songs.filter(s => (s.albumDisco ||'Singles / Sin Disco') === albumName || s.albumDisco === albumName);
 const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(currentAlbumSongs.map(s => s.id)));
 const [search, setSearch] = useState('');
 const [customAlbumName, setCustomAlbumName] = useState(albumName);
 const [albumYear, setAlbumYear] = useState(new Date().getFullYear().toString());
 const [albumType, setAlbumType] = useState('Álbum Estudio');
 const [coverUrl, setCoverUrl] = useState('');
 const [description, setDescription] = useState('');

 // Los hooks de arriba tienen que ejecutarse siempre (ver react-hooks/rules-of-hooks): este
 // guard vivía antes de ellos, así que abrir/cerrar el modal cambiaba cuántos hooks corrían.
 if (!isOpen) return null;

 const filteredSongs = songs.filter(s =>
 s.titulo.toLowerCase().includes(search.toLowerCase()) ||
 (s.tonalidad && s.tonalidad.toLowerCase().includes(search.toLowerCase())) ||
 (s.albumDisco && s.albumDisco.toLowerCase().includes(search.toLowerCase()))
 );

 const toggleSong = (id: string) => {
 setSelectedIds(prev => {
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
 if (typeof reader.result ==='string') {
 setCoverUrl(reader.result);
 }
 };
 reader.readAsDataURL(file);
 }
 };

 const handleSave = (e: React.FormEvent) => {
 e.preventDefault();
 const finalAlbumName = customAlbumName.trim() || albumName ||'Nuevo Álbum';
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
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto overscroll-contain">
 <div className={`w-full max-w-2xl p-5 rounded-[var(--r-l)] shadow-2xl my-auto max-h-[92vh] flex flex-col ${colors.card} text-white`}>
 <div className="flex justify-between items-center pb-3 border-b border-[var(--hair)]">
 <div className="flex items-center gap-2">
 <Disc3 className="w-5 h-5 text-[#1db954]" />
 <h3 className="text-sm font-bold font-mono uppercase text-white">
 {albumName ? `Editar Disco: ${albumName}` :'Crear Nuevo Disco / Lanzamiento'}
 </h3>
 </div>
 <button onClick={onClose} className="p-1 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-white cursor-pointer">
 <X className="w-5 h-5" />
 </button>
 </div>

 <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden space-y-4 pt-4">
 <div className="space-y-3 overflow-y-auto pr-1 max-h-[220px]">
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div className="sm:col-span-2">
 <label className="block text-xs font-bold text-[var(--ink-3)] mb-1">Nombre del Álbum / Disco *</label>
 <input
 type="text"
 required
 value={customAlbumName}
 onChange={(e) => setCustomAlbumName(e.target.value)}
 placeholder="ej. Lanzamiento Verano 2026"
 className={`w-full p-2.5 text-xs font-mono rounded-[var(--r-m)] focus:outline-none focus:border-[var(--hair)] ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-white'
 }`}
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-[var(--ink-3)] mb-1">Año de Lanzamiento</label>
 <input
 type="text"
 value={albumYear}
 onChange={(e) => setAlbumYear(e.target.value)}
 placeholder="ej. 2026"
 className={`w-full p-2.5 text-xs font-mono rounded-[var(--r-m)] focus:outline-none focus:border-[var(--hair)] ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-white'
 }`}
 />
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-bold text-[var(--ink-3)] mb-1">Tipo de Trabajo</label>
 <select
 value={albumType}
 onChange={(e) => setAlbumType(e.target.value)}
 className={`w-full p-2.5 text-xs font-mono rounded-[var(--r-m)] focus:outline-none focus:border-[var(--hair)] ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-white'
 }`}
 >
 <option value="Álbum Estudio">Álbum Estudio</option>
 <option value="EP">EP (Extended Play)</option>
 <option value="Single">Single / Sencillo</option>
 <option value="Directo">Álbum en Directo</option>
 <option value="Maqueta">Maqueta / Demo</option>
 </select>
 </div>

 <div>
 <label className="block text-xs font-bold text-[var(--ink-3)] mb-1">Imagen de Portada (Upload o URL)</label>
 <div className="flex gap-2 items-center">
 <input
 type="text"
 value={coverUrl}
 onChange={(e) => setCoverUrl(e.target.value)}
 placeholder="https://... o sube imagen"
 className={`flex-1 p-2.5 text-xs font-mono rounded-[var(--r-m)] focus:outline-none focus:border-[var(--hair)] ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-white'
 }`}
 />
 <label className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-[var(--r-m)] cursor-pointer shrink-0 border-[var(--hair)] flex items-center gap-1 text-xs">
 <Upload className="w-3.5 h-3.5 text-[#1db954]" />
 <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
 </label>
 </div>
 </div>
 </div>

 <div>
 <label className="block text-xs font-bold text-[var(--ink-3)] mb-1">Descripción / Notas de Lanzamiento</label>
 <textarea
 rows={2}
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 placeholder="Notas sobre la producción, estudio de grabación, concepto..."
 className={`w-full p-2 text-xs font-mono rounded-[var(--r-m)] focus:outline-none focus:border-[var(--hair)] ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-white'
 }`}
 />
 </div>
 </div>

 <div className="border-t border-[var(--hair)] pt-3 flex flex-col flex-1 overflow-hidden">
 <div className="flex items-center justify-between text-xs font-mono text-[var(--ink-3)] mb-2">
 <span className="font-bold flex items-center gap-1.5">
 <Disc3 className="w-4 h-4 text-[#1db954]" />
 <span>Seleccionar Canciones del Disco ({selectedIds.size} seleccionadas):</span>
 </span>
 </div>

 <div className="relative mb-2">
 <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
 <input
 type="text"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Buscar canción en el catálogo para incluir..."
 className={`w-full pl-9 pr-3 py-2 text-xs font-mono rounded-[var(--r-m)] focus:outline-none ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-white'
 }`}
 />
 </div>

 <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[220px]">
 {filteredSongs.map((song) => {
 const isSelected = selectedIds.has(song.id);
 return (
 <div
 key={song.id}
 onClick={() => toggleSong(song.id)}
 className={`p-2.5 rounded-[var(--r-m)] flex items-center justify-between cursor-pointer transition-all ${
 isSelected
 ?'bg-[var(--surface)]/20 border-[var(--hair)]/50 text-white'
 : isStitchLight
 ?'bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink)]'
 :'bg-neutral-800/60 hover:bg-neutral-800 border-[var(--hair)] text-[var(--ink-3)]'
 }`}
 >
 <div className="flex items-center gap-3 truncate pr-2">
 <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
 isSelected ?'bg-[var(--surface)] text-black' :'bg-neutral-700 text-[var(--ink-2)]'
 }`}>
 {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Plus className="w-3.5 h-3.5" />}
 </div>
 <div className="truncate">
 <div className="text-xs font-bold truncate flex items-center gap-1.5">
 <span>{formatSongTitle(song.titulo)}</span>
 {song.tonalidad && <span className="text-[10px] text-[#1db954] font-mono">({song.tonalidad})</span>}
 </div>
 <div className="text-[10px] text-neutral-500 truncate">
 {song.albumDisco ? `Álbum actual: ${song.albumDisco}` :'Sin álbum asignado'}
 </div>
 </div>
 </div>

 <span className="text-[10px] font-mono opacity-60 shrink-0">{song.duracion}</span>
 </div>
 );
 })}

 {filteredSongs.length === 0 && (
 <div className="text-center py-6 text-neutral-500 text-xs">
 No se encontraron canciones que coincidan.
 </div>
 )}
 </div>
 </div>

 <div className="pt-3 border-t border-[var(--hair)] flex justify-end gap-2 shrink-0">
 <button
 type="button"
 onClick={onClose}
 className="px-4 py-2 rounded-[var(--r-m)] text-xs text-[var(--ink-3)] hover:bg-neutral-800 transition-colors font-semibold cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className="px-5 py-2 rounded-[var(--r-m)] text-xs font-bold bg-[var(--surface)] hover:bg-[var(--surface)] text-black transition-transform active:scale-95 cursor-pointer shadow-lg flex items-center gap-1.5"
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

