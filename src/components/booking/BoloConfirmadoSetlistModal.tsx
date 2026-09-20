import React, { useState, useEffect, useMemo } from'react';
import { Lead, Setlist, Song, ThemeColors } from'../../types';
import { ModalPortal } from'../common/ModalPortal';
import { 
 findBestSetlistMatch, 
 generateAutoSetlistForConcert, 
 calculateSetlistDurationSec 
} from'../../utils/setlistOptimization';
import { apiFetch } from'../../utils/api';
import { 
 X, Calendar, Clock, Music, Sparkles, Check, ChevronRight, Zap, CheckCircle2 
} from'lucide-react';

interface BoloConfirmadoSetlistModalProps {
 isOpen: boolean;
 lead: Lead;
 onClose: () => void;
 onConfirmWithSetlist: (data: {
 concertDate: string;
 cacheAmount?: number;
 setlistId: string;
 newSetlist?: Setlist;
 }) => Promise<void> | void;
 onConfirmWithoutSetlist: () => void;
 colors?: ThemeColors;
 isStitchLight?: boolean;
}

export const BoloConfirmadoSetlistModal: React.FC<BoloConfirmadoSetlistModalProps> = ({
 isOpen,
 lead,
 onClose,
 onConfirmWithSetlist,
 onConfirmWithoutSetlist,
 colors,
 isStitchLight = false
}) => {
 const [setlists, setSetlists] = useState<Setlist[]>([]);
 const [songs, setSongs] = useState<Song[]>([]);
 const [isLoadingData, setIsLoadingData] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);

 // Event details
 const isFestival = useMemo(() => {
 const t = (lead.tipo ||'').toLowerCase();
 const n = (lead.nombre_sala ||'').toLowerCase();
 return t ==='festival' || t ==='ayuntamiento' || n.includes('fest');
 }, [lead]);

 const [targetDurationMin, setTargetDurationMin] = useState<number>(() => isFestival ? 50 : 75);
 const [concertDate, setConcertDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
 const [cacheAmount, setCacheAmount] = useState<string>('');
 const [selectedSetlistId, setSelectedSetlistId] = useState<string>('');
 const [generateNewSetlist, setGenerateNewSetlist] = useState<boolean>(false);

 // Load setlists & songs
 useEffect(() => {
 if (!isOpen) return;

 let isMounted = true;
 setIsLoadingData(true);

 async function loadData() {
 try {
 const [setlistsRes, songsRes] = await Promise.all([
 apiFetch('/api/setlists').catch(() => null),
 apiFetch('/api/songs').catch(() => null)
 ]);

 let loadedSetlists: Setlist[] = [];
 let loadedSongs: Song[] = [];

 if (setlistsRes && setlistsRes.ok) {
 const data = await setlistsRes.json();
 loadedSetlists = Array.isArray(data) ? data : (data.setlists || []);
 } else {
 // Fallback a localStorage
 const local = localStorage.getItem('bakandeya_setlists_data') || localStorage.getItem('bakandeya_setlists');
 if (local) {
 try { loadedSetlists = JSON.parse(local); } catch {}
 }
 }

 if (songsRes && songsRes.ok) {
 const data = await songsRes.json();
 loadedSongs = Array.isArray(data) ? data : (data.songs || []);
 } else {
 const local = localStorage.getItem('bakandeya_songs');
 if (local) {
 try { loadedSongs = JSON.parse(local); } catch {}
 }
 }

 if (isMounted) {
 setSetlists(loadedSetlists);
 setSongs(loadedSongs);
 }
 } catch (err) {
 console.warn('[BoloConfirmadoSetlistModal] Error cargando repertorio:', err);
 } finally {
 if (isMounted) setIsLoadingData(false);
 }
 }

 loadData();

 return () => {
 isMounted = false;
 };
 }, [isOpen]);

 // Compute best match whenever duration or setlists change
 const bestMatch = useMemo(() => {
 return findBestSetlistMatch(setlists, songs, targetDurationMin, isFestival ?'festival' :'sala');
 }, [setlists, songs, targetDurationMin, isFestival]);

 // Pre-select best match
 useEffect(() => {
 if (bestMatch && !selectedSetlistId && !generateNewSetlist) {
 setSelectedSetlistId(bestMatch.setlist.id);
 }
 }, [bestMatch, selectedSetlistId, generateNewSetlist]);

 if (!isOpen) return null;

 const handleSaveAndLink = async () => {
 setIsSubmitting(true);
 try {
 if (generateNewSetlist) {
 // Auto-generate setlist
 const auto = generateAutoSetlistForConcert(lead.nombre_sala, targetDurationMin, songs, isFestival);
 const newSetlistId = `setlist-auto-${Date.now()}`;
 const nowIso = new Date().toISOString();
 const newSetlist: Setlist = {
 id: newSetlistId,
 nombre: auto.nombre,
 tipoFormato: isFestival ?'festival' :'sala_larga',
 items: auto.items,
 fechaCreacion: nowIso,
 fechaUltimaEdicion: nowIso
 };

 await onConfirmWithSetlist({
 concertDate,
 cacheAmount: cacheAmount ? Number(cacheAmount) : undefined,
 setlistId: newSetlistId,
 newSetlist
 });
 } else {
 await onConfirmWithSetlist({
 concertDate,
 cacheAmount: cacheAmount ? Number(cacheAmount) : undefined,
 setlistId: selectedSetlistId || (bestMatch ? bestMatch.setlist.id :'')
 });
 }
 } catch (err) {
 console.error('[BoloConfirmadoSetlistModal] Error al confirmar bolo con setlist:', err);
 } finally {
 setIsSubmitting(false);
 }
 };

 return (
 <ModalPortal isOpen={isOpen} onClose={onClose}>
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-[var(--scrim)]/85 backdrop-blur-md overflow-y-auto overscroll-contain animate-fadeIn">
 <div className="w-full max-w-lg bg-zinc-950 border-[var(--hair)]800 rounded-3xl p-5 sm:p-6 text-[var(--ink)] space-y-5 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
 
 {/* Header */}
 <div className="flex justify-between items-start border-b border-[var(--hair)]800/80 pb-3">
 <div>
 <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--ok)]/20 text-[var(--ok)] font-mono text-[10px] font-black uppercase tracking-wider mb-1">
 <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ok)]" />
 Concierto Confirmado
 </div>
 <h3 className="text-lg sm:text-xl font-black font-mono text-[var(--ink)]">
 {lead.nombre_sala}
 </h3>
 <p className="text-xs text-[var(--ink-2)] font-mono">
 {lead.ciudad} {lead.region ? `• ${lead.region}` :''}
 </p>
 </div>
 <button
 onClick={onClose}
 className="p-1 rounded-[var(--r-m)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)] transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Quick Details Form (Fecha y Duración pactada) */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
 <div className="space-y-1">
 <label className="text-[var(--ink-2)] flex items-center gap-1 font-bold">
 <Calendar className="w-3.5 h-3.5 text-[var(--ok)]" />
 Fecha del Concierto:
 </label>
 <input
 type="date"
 value={concertDate}
 onChange={(e) => setConcertDate(e.target.value)}
 className="w-full bg-[var(--bg)] border-[var(--hair)]800 rounded-[var(--r-m)] px-3 py-2 text-[var(--ink)] font-mono focus:border-[var(--hair)] focus:outline-none"
 />
 </div>

 <div className="space-y-1">
 <label className="text-[var(--ink-2)] flex items-center gap-1 font-bold">
 <Clock className="w-3.5 h-3.5 text-[var(--acc)]" />
 Caché Pactado (€):
 </label>
 <input
 type="number"
 placeholder="Ej. 600"
 value={cacheAmount}
 onChange={(e) => setCacheAmount(e.target.value)}
 className="w-full bg-[var(--bg)] border-[var(--hair)]800 rounded-[var(--r-m)] px-3 py-2 text-[var(--ink)] font-mono focus: focus:outline-none"
 />
 </div>
 </div>

 {/* Duración Pactada / Formato Selector */}
 <div className="space-y-1.5">
 <label className="text-xs font-mono font-bold text-[var(--ink-2)] flex items-center justify-between">
 <span>Duración pactada para el pase:</span>
 <span className="text-[var(--ok)]">{targetDurationMin} min</span>
 </label>
 <div className="grid grid-cols-4 gap-1.5 font-mono text-[11px]">
 {[45, 60, 75, 90].map((mins) => (
 <button
 key={mins}
 type="button"
 onClick={() => {
 setTargetDurationMin(mins);
 setGenerateNewSetlist(false);
 }}
 className={`py-2 px-1 rounded-[var(--r-m)] font-bold transition-all cursor-pointer text-center ${
 targetDurationMin === mins
 ?'bg-[var(--surface)]/20 border-[var(--hair)] text-[var(--ok)] shadow-sm'
 :'bg-[var(--bg)] border-[var(--hair)]800 text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 {mins} min
 </button>
 ))}
 </div>
 </div>

 {/* Setlists Section: Sugerencia óptima o selector */}
 <div className="space-y-2 pt-1">
 <div className="flex items-center justify-between text-xs font-mono">
 <span className="text-[var(--ink-2)] font-bold flex items-center gap-1.5">
 <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" />
 Asignación de Repertorio Óptimo:
 </span>
 <button
 type="button"
 onClick={() => setGenerateNewSetlist(!generateNewSetlist)}
 className={`text-[11px] underline decoration-dotted transition-colors ${
 generateNewSetlist ?'text-[var(--ok)] font-bold' :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 {generateNewSetlist ?'← Elegir de mis setlists' :'⚡ Crear setlist a medida'}
 </button>
 </div>

 {isLoadingData ? (
 <div className="p-4 rounded-[var(--r-m)] bg-[var(--bg)] border-[var(--hair)]800 text-center text-xs font-mono text-[var(--ink-2)] animate-pulse">
 Calculando duraciones y repertorios óptimos...
 </div>
 ) : generateNewSetlist ? (
 <div className="p-3.5 rounded-[var(--r-l)] bg-[var(--surface)]/10 border-[var(--hair)]/40 space-y-2 animate-fadeIn">
 <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--ok)]">
 <Zap className="w-4 h-4 text-[var(--ok)]" />
 <span>Se creará un nuevo setlist automático:</span>
 </div>
 <p className="text-[11px] font-mono text-[var(--ink-2)]">"Bolo {lead.nombre_sala} ({targetDurationMin} min)" seleccionando canciones de tu catálogo según la energía requerida.
 </p>
 </div>
 ) : setlists.length === 0 ? (
 <div className="p-4 rounded-[var(--r-l)] bg-[var(--bg)] border-[var(--hair)]800 text-center space-y-2 text-xs font-mono text-[var(--ink-2)]">
 <p>No tienes ningún setlist guardado aún.</p>
 <button
 type="button"
 onClick={() => setGenerateNewSetlist(true)}
 className="px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--surface)] text-[var(--ink)] font-bold text-[11px] cursor-pointer"
 >
 ⚡ Autogenerar Setlist ({targetDurationMin} min)
 </button>
 </div>
 ) : (
 <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
 {setlists.map((st) => {
 const durationSec = calculateSetlistDurationSec(st, songs);
 const durationMin = Math.round(durationSec / 60);
 const isOptimal = bestMatch && bestMatch.setlist.id === st.id;
 const isSelected = selectedSetlistId === st.id;

 return (
 <div
 key={st.id}
 onClick={() => {
 setSelectedSetlistId(st.id);
 setGenerateNewSetlist(false);
 }}
 className={`p-3 rounded-[var(--r-l)] transition-all cursor-pointer flex items-center justify-between gap-2 ${
 isSelected
 ?'bg-[var(--acc)]/15 /80 shadow-md'
 : isOptimal
 ?'bg-[var(--ok)]/10 border-[var(--ok)]/40 hover:bg-[var(--ok)]/15'
 :'bg-[var(--bg)]/60 border-[var(--hair)]800 hover:border-[var(--hair)]700'
 }`}
 >
 <div className="space-y-0.5">
 <div className="flex items-center gap-2">
 <Music className={`w-3.5 h-3.5 ${isSelected ?'text-[var(--acc)]' :'text-[var(--ink-2)]'}`} />
 <span className="font-mono text-xs font-bold text-[var(--ink)]">
 {st.nombre}
 </span>
 {isOptimal && (
 <span className="px-2 py-0.5 rounded-full bg-[var(--ok)]/20 text-[var(--ok)] font-mono text-[9px] font-black uppercase">
 ✨ Sugerido
 </span>
 )}
 </div>
 <p className="text-[10px] font-mono text-[var(--ink-2)]">
 {durationMin} min aprox. • {st.items?.length || 0} items
 {isOptimal && ` • ${bestMatch?.reason}`}
 </p>
 </div>

 <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
 isSelected ?' bg-[var(--acc)]/60 text-[var(--acc-ink)]' :'border-[var(--hair)]700'
 }`}>
 {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>

 {/* Action Buttons */}
 <div className="pt-2 space-y-2">
 <button
 type="button"
 disabled={isSubmitting || (!selectedSetlistId && !generateNewSetlist)}
 onClick={handleSaveAndLink}
 className="w-full py-3 px-4 rounded-[var(--r-m)] bg-gradient-to-r from-[var(--ok)] to-[var(--ok)] text-[var(--ink)] font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-500/20"
 >
 <Check className="w-4 h-4 stroke-[3]" />
 <span>{isSubmitting ?'Guardando...' :'Confirmar Bolo y Asignar Setlist'}</span>
 </button>

 <button
 type="button"
 disabled={isSubmitting}
 onClick={onConfirmWithoutSetlist}
 className="w-full py-2 px-3 text-center text-[var(--ink-2)] hover:text-[var(--ink)] text-xs font-mono transition-colors cursor-pointer"
 >
 Confirmar solo en CRM (asignar repertorio más tarde)
 </button>
 </div>

 </div>
 </div>
 </ModalPortal>
 );
};
