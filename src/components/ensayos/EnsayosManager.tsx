import React, { useState, useMemo, useEffect } from'react';
import { 
 Calendar, Clock, MapPin, Users, Plus, Disc3, Mic, ListOrdered, 
 Radio, CheckCircle2, ChevronDown, History, Sparkles, Filter, Edit3, Trash2
} from'lucide-react';
import { Rehearsal, Song, Setlist, Concert, ThemeColors } from'../../types';
import { EnsayoCronometro } from'./EnsayoCronometro';
import { OrdenDelDiaTab } from'./OrdenDelDiaTab';
import { ModoLocalEnVivoTab } from'./ModoLocalEnVivoTab';
import { GrabacionActaTab } from'./GrabacionActaTab';
import { ConvocarEnsayoModal } from'./ConvocarEnsayoModal';
import { api } from'../../services/api';
import { SAMPLER_SONGS, SAMPLER_SETLISTS } from'../../config/sampleRepertoire';

interface EnsayosManagerProps {
 rehearsals: Rehearsal[];
 onSaveRehearsal: (rehearsal: Partial<Rehearsal>) => void;
 onDeleteRehearsal?: (id: string) => void;
 songs?: Song[];
 setlists?: Setlist[];
 concerts: Concert[];
 colors?: ThemeColors;
 currentBandId?: string;
 bandUsers?: Array<{ id: string; name: string; instrument?: string }>;
 onUpdateSong?: (updatedSong: Song) => void;
}

export function EnsayosManager({
 rehearsals = [],
 onSaveRehearsal,
 onDeleteRehearsal,
 songs: initialSongs = [],
 setlists: initialSetlists = [],
 concerts = [],
 colors,
 currentBandId,
 bandUsers = [],
 onUpdateSong
}: EnsayosManagerProps) {
 const [loadedSongs, setLoadedSongs] = useState<Song[]>(initialSongs);
 const [loadedSetlists, setLoadedSetlists] = useState<Setlist[]>(initialSetlists);

 const handleUpdateSongInternal = (updatedSong: Song) => {
 setLoadedSongs(prev => prev.map(s => s.id === updatedSong.id ? updatedSong : s));
 if (onUpdateSong) {
 onUpdateSong(updatedSong);
 }
 if (updatedSong.id) {
 api.updateSong(updatedSong.id, updatedSong).catch(() => {});
 }
 };

 useEffect(() => {
 let isMounted = true;
 async function loadCatalog() {
 try {
 const [songsRes, setlistsRes] = await Promise.all([
 api.getSongs().catch(() => ({ songs: [] })),
 api.getSetlists().catch(() => ({ setlists: [] }))
 ]);
 if (isMounted) {
 const s = (songsRes?.songs && songsRes.songs.length > 0) ? songsRes.songs : SAMPLER_SONGS;
 const st = (setlistsRes?.setlists && setlistsRes.setlists.length > 0) ? setlistsRes.setlists : SAMPLER_SETLISTS;
 setLoadedSongs(s);
 setLoadedSetlists(st);
 }
 } catch {
 if (isMounted) {
 setLoadedSongs(SAMPLER_SONGS);
 setLoadedSetlists(SAMPLER_SETLISTS);
 }
 }
 }
 loadCatalog();
 return () => {
 isMounted = false;
 };
 }, [currentBandId]);

 const effectiveSongs = loadedSongs.length > 0 ? loadedSongs : initialSongs.length > 0 ? initialSongs : SAMPLER_SONGS;
 const effectiveSetlists = loadedSetlists.length > 0 ? loadedSetlists : initialSetlists.length > 0 ? initialSetlists : SAMPLER_SETLISTS;
 // Sort rehearsals: upcoming first, then past
 const sortedRehearsals = useMemo(() => {
 return [...rehearsals].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
 }, [rehearsals]);

 // Find next upcoming rehearsal or active rehearsal
 const nextRehearsal = useMemo(() => {
 const todayStr = new Date().toISOString().split('T')[0];
 const upcoming = sortedRehearsals
 .filter(r => r.fecha >= todayStr && r.estado !=='completado')
 .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
 return upcoming[0] || sortedRehearsals[0] || null;
 }, [sortedRehearsals]);

 const [selectedRehearsalId, setSelectedRehearsalId] = useState<string | null>(
 nextRehearsal?.id || null
 );

 const currentRehearsal = useMemo(() => {
 return sortedRehearsals.find(r => r.id === selectedRehearsalId) || nextRehearsal || null;
 }, [sortedRehearsals, selectedRehearsalId, nextRehearsal]);

 // View tabs
 const [activeTab, setActiveTab] = useState<'orden_del_dia' |'modo_local' |'grabacion_acta'>('orden_del_dia'
 );

 // Modal
 const [showConvocarModal, setShowConvocarModal] = useState(false);
 const [editingRehearsal, setEditingRehearsal] = useState<Rehearsal | null>(null);

 // Next upcoming concert
 const nextConcert = useMemo(() => {
 const todayStr = new Date().toISOString().split('T')[0];
 const upcoming = concerts
 .filter(c => c.fecha >= todayStr)
 .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
 return upcoming[0] || null;
 }, [concerts]);

 // Update Rehearsal Handler
 const handleUpdateRehearsal = (updatedFields: Partial<Rehearsal>) => {
 if (!currentRehearsal) return;
 const merged = { ...currentRehearsal, ...updatedFields };
 onSaveRehearsal(merged);
 };

 // If no rehearsals exist at all, offer creating one
 if (rehearsals.length === 0) {
 return (
 <div className="p-6 sm:p-12 max-w-4xl mx-auto text-center space-y-6 animate-fade-in">
 <div className="w-16 h-16 rounded-3xl bg-[var(--acc)]/60/15 flex items-center justify-center text-[var(--acc)] mx-auto">
 <Mic className="w-8 h-8" />
 </div>

 <div className="space-y-2">
 <h2 className="text-2xl sm:text-3xl font-display font-black text-[var(--ink)]">
 Módulo de Ensayos & Local en Vivo
 </h2>
 <p className="text-sm text-[var(--ink-2)] max-w-lg mx-auto">
 Planifica el orden del día, cronometra tus sesiones, usa el metrónomo en el local y genera actas con IA para tu grupo de WhatsApp.
 </p>
 </div>

 <button
 onClick={() => {
 setEditingRehearsal(null);
 setShowConvocarModal(true);
 }}
 className="inline-flex items-center gap-2 px-6 py-3.5 rounded-[var(--r-l)] bg-[var(--acc)]/60 text-[var(--ink)] font-sans font-black text-sm tracking-wider hover:bg-[var(--acc)] transition-all cursor-pointer active:scale-95"
 >
 <Plus className="w-4 h-4" />
 <span>Convocar Primer Ensayo</span>
 </button>

 {showConvocarModal && (
 <ConvocarEnsayoModal
 isOpen={showConvocarModal}
 onClose={() => setShowConvocarModal(false)}
 onSave={rehearsal => {
 onSaveRehearsal(rehearsal);
 setSelectedRehearsalId(rehearsal.id || null);
 }}
 setlists={effectiveSetlists}
 bandUsers={bandUsers}
 currentBandId={currentBandId}
 initialRehearsal={null}
 />
 )}
 </div>
 );
 }

 return (
 <div className="space-y-6 animate-fade-in pb-12">
 {/* Top Header Card: Active Rehearsal Details & Session Selector */}
 <div className="p-4 sm:p-6 rounded-3xl bg-[var(--surface)] space-y-4">
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
 {/* Left: Rehearsal Picker & Title */}
 <div className="space-y-2">
 <div className="flex flex-wrap items-center gap-2">
 {/* Session Selector Dropdown */}
 <div className="relative">
 <select
 value={currentRehearsal?.id ||''}
 onChange={e => setSelectedRehearsalId(e.target.value)}
 className="appearance-none bg-[var(--surface)] text-[var(--ink)] px-3.5 py-1.5 pr-8 rounded-[var(--r-m)] text-xs font-sans font-bold hover: focus: outline-none cursor-pointer"
 >
 {sortedRehearsals.map(r => (
 <option key={r.id} value={r.id}>
 {r.fecha} • {r.lugar} ({r.hora ||'19:30'}) {r.estado ==='completado' ?'✓' :''}
 </option>
 ))}
 </select>
 <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-[var(--ink-2)] pointer-events-none" />
 </div>

 {/* Status Badge */}
 <span
 className={`px-2.5 py-1 rounded-full text-[10px] font-sans font-bold tracking-wider ${
 currentRehearsal?.estado ==='completado'
 ?'bg-[var(--ok)]/15 text-[var(--ink-2)]/30'
 : currentRehearsal?.estado ==='en_curso'
 ?'bg-[var(--acc)]/60/20 text-[var(--acc)]/70 /40'
 :'bg-[var(--surface)]/80 text-[var(--ink-2)]'
 }`}
 >
 {currentRehearsal?.estado ==='completado'
 ?'✓ Ensayo Finalizado'
 : currentRehearsal?.estado ==='en_curso'
 ?'● Ensayo en Curso'
 :'📅 Ensayo Programado'}
 </span>

 {/* Edit Rehearsal */}
 {currentRehearsal && (
 <button
 onClick={() => {
 setEditingRehearsal(currentRehearsal);
 setShowConvocarModal(true);
 }}
 className="p-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]/80 rounded-[var(--r-s)] transition-colors cursor-pointer"
 title="Editar datos de este ensayo"
 >
 <Edit3 className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 {/* Rehearsal Headline */}
 <div className="flex flex-wrap items-center gap-4 text-xs font-sans text-[var(--ink-2)]">
 <span className="flex items-center gap-1.5 text-[var(--ink)] font-bold">
 <Calendar className="w-4 h-4 text-[var(--acc)]" />
 {currentRehearsal?.fecha} ({currentRehearsal?.hora ||'19:30'} - {currentRehearsal?.horaFin ||'21:30'})
 </span>

 <span className="flex items-center gap-1.5 text-[var(--ink-2)]">
 <MapPin className="w-3.5 h-3.5 text-[var(--ink-2)]" />
 {currentRehearsal?.lugar ||'Local de ensayo'}
 </span>

 {currentRehearsal?.convocados_nombres && (
 <span className="flex items-center gap-1.5 text-[var(--ink-2)]">
 <Users className="w-3.5 h-3.5 text-[var(--ink-2)]" />
 {Array.isArray(currentRehearsal.convocados_nombres)
 ? currentRehearsal.convocados_nombres.join(',')
 : String(currentRehearsal.convocados_nombres)}
 </span>
 )}
 </div>
 </div>

 {/* Right Actions: Schedule New Rehearsal & Cronómetro */}
 <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
 {/* Embedded Rehearsal Timer */}
 {currentRehearsal && (
 <EnsayoCronometro
 totalEstimatedMin={currentRehearsal.duracionEstimadaMin || 120}
 initialElapsedSeg={0}
 isCompact
 />
 )}

 <button
 onClick={() => {
 setEditingRehearsal(null);
 setShowConvocarModal(true);
 }}
 className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-[var(--r-m)] bg-[var(--acc)]/60 text-[var(--ink)] hover:bg-[var(--acc)] text-xs font-sans font-bold transition-all cursor-pointer active:scale-95"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>+ Convocar Ensayo</span>
 </button>
 </div>
 </div>

 {/* Master Navigation Tabs - 100% Mobile Responsive */}
 <div className="grid grid-cols-3 gap-1 sm:gap-2 p-1 bg-[var(--surface)] rounded-[var(--r-l)]">
 <button
 onClick={() => setActiveTab('orden_del_dia')}
 className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 px-1 sm:px-3 rounded-[var(--r-m)] text-xs font-sans font-bold transition-all cursor-pointer text-center ${
 activeTab ==='orden_del_dia'
 ?'bg-[var(--acc)]/60 text-[var(--ink)] font-black'
 :'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]/80'
 }`}
 >
 <ListOrdered className="w-4 h-4 shrink-0" />
 <span className="sm:hidden text-[11px] leading-tight font-bold">1. Agenda</span>
 <span className="hidden sm:inline">1. Orden del Día</span>
 </button>

 <button
 onClick={() => setActiveTab('modo_local')}
 className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 px-1 sm:px-3 rounded-[var(--r-m)] text-xs font-sans font-bold transition-all cursor-pointer text-center ${
 activeTab ==='modo_local'
 ?'bg-[var(--acc)]/60 text-[var(--ink)] font-black'
 :'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]/80'
 }`}
 >
 <Radio className="w-4 h-4 shrink-0" />
 <span className="sm:hidden text-[11px] leading-tight font-bold">2. En Vivo</span>
 <span className="hidden sm:inline">2. Modo Local en Vivo</span>
 </button>

 <button
 onClick={() => setActiveTab('grabacion_acta')}
 className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 px-1 sm:px-3 rounded-[var(--r-m)] text-xs font-sans font-bold transition-all cursor-pointer text-center ${
 activeTab ==='grabacion_acta'
 ?'bg-[var(--acc)]/60 text-[var(--ink)] font-black'
 :'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]/80'
 }`}
 >
 <Mic className="w-4 h-4 shrink-0" />
 <span className="sm:hidden text-[11px] leading-tight font-bold">3. Acta IA</span>
 <span className="hidden sm:inline">3. Grabación & Acta</span>
 </button>
 </div>
 </div>

 {/* Tab Content */}
 {currentRehearsal && activeTab ==='orden_del_dia' && (
 <OrdenDelDiaTab
 rehearsal={currentRehearsal}
 onUpdateRehearsal={handleUpdateRehearsal}
 songs={effectiveSongs}
 setlists={effectiveSetlists}
 nextConcert={nextConcert}
 colors={colors}
 onGoToLiveMode={() => setActiveTab('modo_local')}
 />
 )}

 {currentRehearsal && activeTab ==='modo_local' && (
 <ModoLocalEnVivoTab
 rehearsal={currentRehearsal}
 onUpdateRehearsal={handleUpdateRehearsal}
 songs={effectiveSongs}
 colors={colors}
 onUpdateSong={handleUpdateSongInternal}
 />
 )}

 {currentRehearsal && activeTab ==='grabacion_acta' && (
 <GrabacionActaTab
 rehearsal={currentRehearsal}
 onUpdateRehearsal={handleUpdateRehearsal}
 songs={effectiveSongs}
 colors={colors}
 />
 )}

 {/* Convocar Ensayo Modal */}
 {showConvocarModal && (
 <ConvocarEnsayoModal
 isOpen={showConvocarModal}
 onClose={() => {
 setShowConvocarModal(false);
 setEditingRehearsal(null);
 }}
 onSave={rehearsal => {
 onSaveRehearsal(rehearsal);
 setSelectedRehearsalId(rehearsal.id || null);
 }}
 setlists={effectiveSetlists}
 bandUsers={bandUsers}
 currentBandId={currentBandId}
 initialRehearsal={editingRehearsal}
 />
 )}
 </div>
 );
}
