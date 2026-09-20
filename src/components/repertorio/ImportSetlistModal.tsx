import React, { useState } from'react';
import { X, Loader, AlertCircle, ImagePlus, Music, ListChecks } from'lucide-react';
import { Song, Setlist, SetlistItem } from'../../types';
import { getAuthHeaders } from'../../services/api';

type SongAction ='link_matched' |'link_other' |'create_new' |'discard';

interface ReviewSongItem {
 type:'song';
 detectedTitle: string;
 matchedSongId?: string;
 matchedSongTitle?: string;
 action: SongAction;
 linkedSongId: string;
 newTitle: string;
}

interface ReviewBlockItem {
 type:'block';
 titulo: string;
 blockType: SetlistItem['tipoItem'];
 included: boolean;
}

type ReviewItem = ReviewSongItem | ReviewBlockItem;

const BLOCK_TYPE_LABELS: Record<string, string> = {
 chapa:'Chapa / discurso con público',
 descanso:'Pausa / descanso',
 bis:'Bis',
 bloque_header:'Bloque / sección',
 interludio:'Interludio',
 presentacion:'Presentación de la banda',
 beatbox:'Solo de batería/percusión',
 intro_tema:'Intro / historia del tema',
 solo_performance:'Solo instrumental',
 cambio_instrumento:'Cambio de instrumento',
 otro:'Bloque'
};

interface ImportSetlistModalProps {
 isOpen: boolean;
 onClose: () => void;
 catalogSongs: Song[];
 /** El modal ya hizo el POST de las canciones nuevas y del setlist — el padre solo actualiza su
 * estado local (setSongs/setSetlists) y cambia a este setlist como activo. */
 onCreated: (setlist: Setlist, newSongs: Song[]) => void;
}

export function ImportSetlistModal({ isOpen, onClose, catalogSongs, onCreated }: ImportSetlistModalProps) {
 const [file, setFile] = useState<File | null>(null);
 const [analyzing, setAnalyzing] = useState(false);
 const [creating, setCreating] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [setlistName, setSetlistName] = useState('');
 const [reviewItems, setReviewItems] = useState<ReviewItem[] | null>(null);

 if (!isOpen) return null;

 const reset = () => {
 setFile(null);
 setAnalyzing(false);
 setCreating(false);
 setError(null);
 setSetlistName('');
 setReviewItems(null);
 };

 const handleClose = () => {
 reset();
 onClose();
 };

 const findCatalogMatch = (title: string): Song | undefined =>
 catalogSongs.find((s) => s.titulo.trim().toLowerCase() === title.trim().toLowerCase());

 const handleAnalyze = async () => {
 if (!file) return;
 setAnalyzing(true);
 setError(null);
 try {
 const authHeaders = getAuthHeaders() as Record<string, string>;
 const {'Content-Type': _ct, ...uploadHeaders } = authHeaders;
 const formData = new FormData();
 formData.append('file', file);
 const res = await fetch('/api/setlists/import-from-image', {
 method:'POST',
 headers: uploadHeaders,
 body: formData
 });
 const data = await res.json();
 if (!res.ok || !data.success) {
 throw new Error(data.error ||'No se pudo analizar el archivo');
 }
 setSetlistName(data.nombreSugerido ||'Repertorio importado');
 setReviewItems(
 (data.items || []).map((it: any): ReviewItem => {
 if (it.type ==='block') {
 return { type:'block', titulo: it.titulo, blockType: it.blockType ||'otro', included: true };
 }
 // El backend ya intentó casar el título contra el catálogo; si por lo que sea no vino
 // matchedSongId, se prueba una vez más aquí con el catálogo que ya tiene el frontend.
 const fallbackMatch = it.matchedSongId ? undefined : findCatalogMatch(it.detectedTitle);
 const matchedSongId = it.matchedSongId || fallbackMatch?.id;
 const matchedSongTitle = it.matchedSongTitle || fallbackMatch?.titulo;
 return {
 type:'song',
 detectedTitle: it.detectedTitle,
 matchedSongId,
 matchedSongTitle,
 action: matchedSongId ?'link_matched' :'create_new',
 linkedSongId:'',
 newTitle: it.detectedTitle
 };
 })
 );
 } catch (err: any) {
 setError(err.message ||'Error al analizar el archivo');
 } finally {
 setAnalyzing(false);
 }
 };

 const updateSongItem = (idx: number, patch: Partial<ReviewSongItem>) => {
 setReviewItems((prev) =>
 (prev || []).map((it, i) => (i === idx && it.type ==='song' ? { ...it, ...patch } : it))
 );
 };

 const toggleBlockIncluded = (idx: number) => {
 setReviewItems((prev) =>
 (prev || []).map((it, i) => (i === idx && it.type ==='block' ? { ...it, included: !it.included } : it))
 );
 };

 const handleCreate = async () => {
 if (!reviewItems || !setlistName.trim()) return;
 setCreating(true);
 setError(null);
 try {
 const authHeaders = getAuthHeaders() as Record<string, string>;
 const newSongs: Song[] = [];
 const items: SetlistItem[] = [];

 for (const it of reviewItems) {
 if (it.type ==='block') {
 if (!it.included) continue;
 items.push({
 id: `it-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
 tipoItem: it.blockType,
 tituloCustom: it.titulo
 });
 continue;
 }

 if (it.action ==='discard') continue;

 let songId: string | undefined;
 if (it.action ==='link_matched') songId = it.matchedSongId;
 else if (it.action ==='link_other') songId = it.linkedSongId || undefined;
 else if (it.action ==='create_new') {
 const titulo = it.newTitle.trim() || it.detectedTitle;
 const newSong: Song = {
 id: `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
 titulo,
 duracion:'0:00',
 duracionSegundos: 0,
 tonalidad:'Mim',
 bpm: 120
 };
 // Secuencial (no Promise.all): así cada id generado con Date.now() es único de verdad.
 await fetch('/api/songs', { method:'POST', headers: authHeaders, body: JSON.stringify(newSong) });
 newSongs.push(newSong);
 songId = newSong.id;
 }

 if (!songId) continue;
 items.push({
 id: `it-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
 tipoItem:'cancion',
 songId
 });
 }

 const newSetlist: Setlist = {
 id: `setlist-${Date.now()}`,
 nombre: setlistName.trim(),
 descripcion:'Importado desde foto/PDF',
 tipoFormato:'festival',
 duracionTotalEstimadaMinutos: 45,
 fechaCreacion: new Date().toISOString().split('T')[0],
 fechaUltimaEdicion: new Date().toISOString().split('T')[0],
 items
 };

 await fetch('/api/setlists', { method:'POST', headers: authHeaders, body: JSON.stringify(newSetlist) });

 onCreated(newSetlist, newSongs);
 reset();
 onClose();
 } catch (err: any) {
 setError(err.message ||'Error al crear el repertorio');
 } finally {
 setCreating(false);
 }
 };

 const songItemsCount = (reviewItems || []).filter((it) => it.type ==='song').length;
 const matchedCount = (reviewItems || []).filter((it) => it.type ==='song' && it.action ==='link_matched').length;

 return (
 <div className="fixed inset-0 flex items-start justify-center z-50 p-4 pt-12 pointer-events-none">
 <div className="bg-[var(--surface)] rounded-[var(--r-s)] w-full max-w-2xl max-h-[85vh] overflow-y-auto pointer-events-auto">
 <div className="sticky top-0 z-10 bg-[var(--surface)] border-b p-3 flex justify-between items-center">
 <div className="flex items-center gap-2.5">
 <ImagePlus className="w-5 h-5 text-[var(--ink-2)]" />
 <h2 className="text-base font-bold">Importar Repertorio de Foto/PDF</h2>
 </div>
 <button onClick={handleClose} className="p-2 hover:bg-[var(--surface)]/80 rounded-[var(--r-s)] transition">
 <X className="w-4 h-4" />
 </button>
 </div>

 <div className="p-4 space-y-4">
 {!reviewItems && !analyzing && (
 <div className="text-center py-8 space-y-4">
 <ImagePlus className="w-12 h-12 text-[var(--ink-2)]/50 mx-auto" />
 <p className="text-[var(--ink-2)]">
 Sube una foto o PDF de un repertorio ya impreso (a mano o a máquina) — la IA lee los
 temas en orden y los casa contra tu catálogo antes de crear nada.
 </p>
 <input
 type="file"
 accept="image/*,.pdf"
 onChange={(e) => setFile(e.target.files?.[0] || null)}
 className="text-xs text-[var(--ink-2)] file:mr-3 file:py-1.5 file:px-3 file:rounded-[var(--r-s)] file:border-0 file:bg-[var(--tentative)] file:text-[var(--ink)] file:text-xs file:font-medium mx-auto block"
 />
 {file && (
 <button
 onClick={handleAnalyze}
 className="bg-[var(--tentative)] hover:bg-[var(--tentative)] text-[var(--ink)] px-6 py-2 rounded-[var(--r-s)] transition font-medium"
 >
 Analizar
 </button>
 )}
 </div>
 )}

 {analyzing && (
 <div className="text-center py-12">
 <Loader className="w-8 h-8 animate-spin text-[var(--ink-2)] mx-auto mb-4" />
 <p className="text-[var(--ink-2)]">Leyendo el repertorio...</p>
 </div>
 )}

 {error && (
 <div className="bg-[var(--alert)]/80/20 border-[var(--alert)] rounded-[var(--r-s)] p-4 flex gap-3">
 <AlertCircle className="w-5 h-5 text-[var(--alert)] flex-shrink-0 mt-0.5" />
 <p className="text-sm text-[var(--alert)]/60">{error}</p>
 </div>
 )}

 {reviewItems && (
 <div className="space-y-4">
 <div>
 <label className="text-[11px] font-sans tracking-wider text-[var(--ink-2)] block mb-1">Nombre del repertorio</label>
 <input
 type="text"
 value={setlistName}
 onChange={(e) => setSetlistName(e.target.value)}
 className="w-full p-2 bg-[var(--sunken)] rounded-[var(--r-s)] text-sm text-[var(--ink-2)] focus:outline-none focus:border-[var(--acc)]"
 />
 </div>

 <p className="text-[11px] font-sans text-[var(--ink-2)] flex items-center gap-1.5">
 <ListChecks className="w-3.5 h-3.5" />
 {matchedCount}/{songItemsCount} temas ya vinculados automáticamente al catálogo
 </p>

 <div className="space-y-1.5">
 {reviewItems.map((it, idx) => {
 if (it.type ==='block') {
 return (
 <div key={idx} className={`p-2 rounded-[var(--r-s)] flex items-center justify-between gap-2 ${it.included ?'bg-[var(--surface)]/80' :'bg-[var(--surface)] opacity-50'}`}>
 <span className="text-xs text-[var(--ink-2)]">📋 {it.titulo} <span className="text-[var(--ink-2)]">({BLOCK_TYPE_LABELS[it.blockType] || it.blockType})</span></span>
 <button
 type="button"
 onClick={() => toggleBlockIncluded(idx)}
 className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface)]/70 hover:bg-[var(--sunken)] text-[var(--ink-2)] font-sans"
 >
 {it.included ?'Descartar' :'Incluir'}
 </button>
 </div>
 );
 }

 const isDiscarded = it.action ==='discard';
 return (
 <div key={idx} className={`p-2 rounded-[var(--r-s)] space-y-1.5 ${isDiscarded ?'bg-[var(--surface)] opacity-50' :'bg-[var(--surface)]/80'}`}>
 <div className="flex items-center justify-between gap-2">
 <span className="text-xs text-[var(--ink-2)] flex items-center gap-1.5">
 <Music className="w-3.5 h-3.5 text-[var(--ink-2)] shrink-0" />"{it.detectedTitle}"
 </span>
 {it.action ==='link_matched' && (
 <span className="text-[10px] text-[var(--ok)] font-sans whitespace-nowrap">✓ {it.matchedSongTitle}</span>
 )}
 </div>
 <div className="flex flex-wrap items-center gap-1.5">
 <select
 value={it.action}
 onChange={(e) => updateSongItem(idx, { action: e.target.value as SongAction })}
 className="text-[10px] bg-[var(--sunken)] rounded px-1.5 py-1 text-[var(--ink-2)] font-sans"
 >
 {it.matchedSongId && <option value="link_matched">Vincular a"{it.matchedSongTitle}"</option>}
 <option value="create_new">Crear canción nueva</option>
 <option value="link_other">Vincular a otra canción del catálogo</option>
 <option value="discard">Descartar (no incluir)</option>
 </select>
 {it.action ==='create_new' && (
 <input
 type="text"
 value={it.newTitle}
 onChange={(e) => updateSongItem(idx, { newTitle: e.target.value })}
 placeholder="Título de la canción nueva"
 className="text-[10px] bg-[var(--sunken)] rounded px-1.5 py-1 text-[var(--ink-2)] flex-1 min-w-[140px]"
 />
 )}
 {it.action ==='link_other' && (
 <select
 value={it.linkedSongId}
 onChange={(e) => updateSongItem(idx, { linkedSongId: e.target.value })}
 className="text-[10px] bg-[var(--sunken)] rounded px-1.5 py-1 text-[var(--ink-2)] flex-1 min-w-[140px]"
 >
 <option value="">Elige una canción del catálogo...</option>
 {catalogSongs.map((s) => (
 <option key={s.id} value={s.id}>{s.titulo}</option>
 ))}
 </select>
 )}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 )}
 </div>

 {reviewItems && (
 <div className="px-4 pb-4 flex gap-3">
 <button
 onClick={handleCreate}
 disabled={creating || !setlistName.trim()}
 className="flex-1 bg-[var(--tentative)] hover:bg-[var(--tentative)] disabled:opacity-50 text-[var(--ink)] px-4 py-2 rounded-[var(--r-s)] transition font-medium text-sm flex items-center justify-center gap-1.5"
 >
 {creating ? <Loader className="w-4 h-4 animate-spin" /> :'✓ Crear Repertorio'}
 </button>
 <button
 onClick={handleClose}
 className="flex-1 bg-[var(--surface)]/70 hover:bg-[var(--sunken)] text-[var(--ink)] px-4 py-2 rounded-[var(--r-s)] transition font-medium text-sm"
 >
 Cancelar
 </button>
 </div>
 )}
 </div>
 </div>
 );
}
