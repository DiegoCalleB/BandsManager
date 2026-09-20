import React, { useEffect, useState } from 'react';

const SILENT_AUDIO_URI = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
import { Song, Setlist, SetlistItem } from '../../types';
import { 
 Printer, Music, Mic, Radio, SkipBack, SkipForward, Play, Pause, Repeat, Heart,
 Activity, Footprints, Zap, FileText, WifiOff, Check, ChevronDown, ChevronUp
} from 'lucide-react';
import { SHOW_ITEM_TYPES, formatSecondsToMmSs } from '../RepertorioSetlists';
import { cacheActiveStageSetlist } from '../../utils/stageOfflineCache';
import { formatSongTitle } from '../../utils/formatSongTitle';

interface EscenarioViewProps {
 activeSetlist: Setlist | null;
 setlists: Setlist[];
 activeSetlistId: string;
 setActiveSetlistId: (id: string) => void;
 songs: Song[];
 setShowPdfPreview: (val: boolean) => void;
 stageAudioRef: React.RefObject<HTMLAudioElement | null>;
 stageAudioRefB: React.RefObject<HTMLAudioElement | null>;
 stagePlayingIndex: number | null;
 setStagePlayingIndex: (idx: number | null) => void;
 stageIsPlaying: boolean;
 setStageIsPlaying: (playing: boolean) => void;
 stageCurrentTime: number;
 stageItemDuration: number;
 stageResolvedUrl: string | null;
 stageAutoplayNext: boolean;
 setStageAutoplayNext: (val: boolean) => void;
 stageCrossfadeEnabled: boolean;
 setStageCrossfadeEnabled: (val: boolean) => void;
 isCrossfading: boolean;
 handleStageAudioEnded: () => void;
 handleStageTimeUpdate: (currentTimeSec: number) => void;
 handleStageSeek: (val: number) => void;
 handleStagePrev: () => void;
 handleStageNext: () => void;
 toggleStagePlayPause: () => void;
 toggleFavoriteSong: (id: string) => void;
 setEditingShowItem: (item: SetlistItem | null) => void;
 setShowItemAudioUrl: (url: string) => void;
 setShowShowItemModal: (val: boolean) => void;
 formatItemDuration: (item: SetlistItem) => string;
 /** true cuando este componente se embebe dentro de la pestaña Repertorio (ver
 * RepertorioSetlists.tsx, toggle "Reproducir concierto") en vez de vivir en su propia pestaña
 * — oculta el selector de repertorio, el botón "Imprimir/Exportar" y la lista de solo lectura
 * de temas, porque Repertorio ya tiene su propio selector, su propio "Imprimir/Exportar" y su
 * propia lista (editable, con arrastre) — mostrarlos dos veces sería puro ruido. Solo se queda
 * la consola del reproductor (metadata, controles, barra de progreso, atajos). */
 embedded?: boolean;
}

export const EscenarioView: React.FC<EscenarioViewProps> = ({
 activeSetlist,
 setlists,
 activeSetlistId,
 setActiveSetlistId,
 songs,
 setShowPdfPreview,
 stageAudioRef,
 stageAudioRefB,
 stagePlayingIndex,
 setStagePlayingIndex,
 stageIsPlaying,
 setStageIsPlaying,
 stageCurrentTime,
 stageItemDuration,
 stageResolvedUrl,
 stageAutoplayNext,
 setStageAutoplayNext,
 stageCrossfadeEnabled,
 setStageCrossfadeEnabled,
 isCrossfading,
 handleStageAudioEnded,
 handleStageTimeUpdate,
 handleStageSeek,
 handleStagePrev,
 handleStageNext,
 toggleStagePlayPause,
 toggleFavoriteSong,
 setEditingShowItem,
 setShowItemAudioUrl,
 setShowShowItemModal,
 formatItemDuration,
 embedded = false
}) => {
 const currentStageItem = (stagePlayingIndex !== null && activeSetlist) ? activeSetlist.items[stagePlayingIndex] : null;
 const currentStageSong = currentStageItem && currentStageItem.tipoItem === 'cancion'
 ? songs.find(s => s.id === currentStageItem.songId)
 : null;
 const nextStageItem = (stagePlayingIndex !== null && activeSetlist) ? activeSetlist.items[stagePlayingIndex + 1] : null;
 const nextStageSong = nextStageItem && nextStageItem.tipoItem === 'cancion'
 ? songs.find(s => s.id === nextStageItem.songId)
 : null;
 const isCurrentSongFavorited = currentStageSong?.favoritoGeneral || false;
 const stageProgressPct = stageItemDuration > 0 ? Math.min(100, (stageCurrentTime / stageItemDuration) * 100) : 0;

 // Visual metronome state based on active track BPM
 const currentBpm = Number(currentStageSong?.bpm) || 120;
 const [metronomeTick, setMetronomeTick] = useState(false);
 const [showPedalShortcuts, setShowPedalShortcuts] = useState(false);

 // Offline Stage Mode & Local Cache
 const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
 const [isCached, setIsCached] = useState(false);
 const [showChordsPanel, setShowChordsPanel] = useState(false);
 const [chordsFontSize, setChordsFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');

 useEffect(() => {
 const handleOnline = () => setIsOnline(true);
 const handleOffline = () => setIsOnline(false);
 window.addEventListener('online', handleOnline);
 window.addEventListener('offline', handleOffline);
 return () => {
 window.removeEventListener('online', handleOnline);
 window.removeEventListener('offline', handleOffline);
 };
 }, []);

 // Auto-caching setlist and relevant songs into persistent storage
 useEffect(() => {
 if (activeSetlist && songs.length > 0) {
 const success = cacheActiveStageSetlist(activeSetlist, songs);
 setIsCached(success);
 }
 }, [activeSetlist, songs]);

 useEffect(() => {
 if (!stageIsPlaying || !currentBpm || currentBpm <= 0) return;
 const intervalMs = (60 / currentBpm) * 1000;
 const interval = setInterval(() => {
 setMetronomeTick(prev => !prev);
 }, intervalMs / 2);
 return () => clearInterval(interval);
 }, [stageIsPlaying, currentBpm]);

 // Bluetooth Pedal / Keyboard Shortcuts (PageDown = Next, PageUp = Prev, Space = Play/Pause)
 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 // Avoid triggering when user is typing in an input or textarea
 if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
 return;
 }
 if (e.key === 'PageDown' || e.key === 'ArrowRight' || e.key === ']') {
 e.preventDefault();
 handleStageNext();
 } else if (e.key === 'PageUp' || e.key === 'ArrowLeft' || e.key === '[') {
 e.preventDefault();
 handleStagePrev();
 } else if (e.code === 'Space' && e.target === document.body) {
 e.preventDefault();
 toggleStagePlayPause();
 }
 };
 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, [handleStageNext, handleStagePrev, toggleStagePlayPause]);

 return (
 <div className="p-4 sm:p-6 rounded-[var(--r-l)] bg-black space-y-6 text-white shadow-2xl">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
 <div>
 <div className="flex flex-wrap items-center gap-2 mb-1">
 <span className="px-2.5 py-0.5 rounded-full bg-[#1db954]/20 border-[#1db954]/40 text-[#1ed760] font-mono text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5">
 <span className="w-2 h-2 rounded-full bg-[#1db954] animate-ping" />
 Directo & Concierto
 </span>

 {/* Offline Robustness Badge */}
 {!isOnline ? (
 <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5" title="Sin conexión a internet: funcionando 100% con el repertorio y letras cacheados localmente">
 <WifiOff className="w-3 h-3 text-amber-400" />
 Modo Offline Activo
 </span>
 ) : isCached ? (
 <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5" title="Repertorio, letras, acordes y tempos guardados localmente para tocar sin red">
 <Check className="w-3 h-3 text-emerald-400" />
 Caché Offline Listo
 </span>
 ) : null}
 </div>
 <h2 className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
 {activeSetlist ? activeSetlist.nombre : 'Sin Setlist Seleccionado'}
 </h2>
 </div>

 {/* Selector de repertorio + Imprimir/Exportar: Repertorio ya tiene los suyos propios
 (sidebar de setlists + menú "⋯") cuando este reproductor va embebido ahí — mostrarlos
 aquí también sería un control duplicado en la misma pantalla. */}
 {!embedded && (
 <div className="flex items-center gap-2">
 <select
 value={activeSetlistId}
 onChange={(e) => setActiveSetlistId(e.target.value)}
 className="bg-[var(--surface)] text-[#d1b375] text-[10px] font-mono py-2 px-3 rounded-[var(--r-m)] focus:outline-none"
 >
 {setlists.map(s => (
 <option key={s.id} value={s.id}>{s.nombre}</option>
 ))}
 </select>

 <button
 onClick={() => setShowPdfPreview(true)}
 className="px-2 py-1 bg-[var(--acc)] text-black font-mono font-extrabold text-[10px] rounded-[var(--r-m)] hover:bg-[#d1b375]/15 transition-all flex items-center gap-2 cursor-pointer shadow-lg"
 >
 <Printer className="w-4 h-4" />
 <span>Imprimir / Exportar</span>
 </button>
 </div>
 )}
 </div>

 {/* Dos <audio> en vez de uno: durante un fundido cruzado, uno termina la canción actual
 mientras el otro ya reproduce la siguiente desde cero — ver useStagePlayer.ts. Cuando el
 fundido está desactivado, el segundo simplemente no se usa nunca. */}
 <audio
 ref={stageAudioRef as any}
 src={SILENT_AUDIO_URI}
 preload="none"
 onError={(e) => e.preventDefault()}
 onEnded={handleStageAudioEnded}
 onTimeUpdate={(e) => handleStageTimeUpdate(Math.round(e.currentTarget.currentTime))}
 />
 <audio
 ref={stageAudioRefB as any}
 src={SILENT_AUDIO_URI}
 preload="none"
 onError={(e) => e.preventDefault()}
 onEnded={handleStageAudioEnded}
 />

 {/* CONCERT PLAYER CONSOLE (SPOTIFY LIVE BAR) */}
 {activeSetlist && activeSetlist.items.length > 0 && (
 <div className="p-5 sm:p-6 rounded-[var(--r-l)] bg-[#181818] border-[var(--hair)] space-y-4 shadow-2xl relative overflow-hidden">
 {/* Subtle top glow line */}
 <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#1db954]/60 to-transparent" />

 <div className="flex flex-col md:flex-row items-center justify-between gap-4">
 {/* Active Track Metadata & Heart Favorite */}
 <div className="flex items-center gap-3.5 w-full md:w-auto">
 <div className="w-13 h-13 rounded-[var(--r-m)] bg-[#282828] border-[var(--hair)] flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden group">
 {currentStageSong?.portadaUrl ? (
 <img src={currentStageSong.portadaUrl} alt={currentStageSong.titulo} className="w-full h-full object-cover" />
 ) : stagePlayingIndex !== null ? (
 currentStageItem?.tipoItem === 'cancion' ? (
 <Music className="w-6 h-6 text-[#1ed760] animate-bounce" />
 ) : (
 <Mic className="w-6 h-6 text-sky-400 animate-pulse" />
 )
 ) : (
 <Radio className="w-6 h-6 text-zinc-500" />
 )}
 </div>

 <div className="min-w-0 flex-1">
 <div className="text-[10px] font-mono uppercase text-zinc-400 font-bold flex items-center gap-2">
 <span>
 {stagePlayingIndex !== null 
 ? `En Directo (${stagePlayingIndex + 1}/${activeSetlist.items.length})`
 : 'Reproductor de Concierto'}
 </span>
 {stageResolvedUrl ? (
 <span className="px-2 py-0.5 rounded-full text-[9px] bg-[#1db954]/20 text-[#1ed760] border-[#1db954]/30 font-bold">
 Audio Real
 </span>
 ) : stagePlayingIndex !== null ? (
 <span className="px-2 py-0.5 rounded-full text-[9px] bg-amber-500/20 text-amber-300 font-bold">
 Simulación
 </span>
 ) : null}
 {isCrossfading && nextStageSong && (
 <span className="px-2 py-0.5 rounded-full text-[9px] bg-sky-500/20 text-sky-300 font-bold flex items-center gap-1 animate-pulse">
 🔀 Fundiendo → {formatSongTitle(nextStageSong.titulo)}
 </span>
 )}
 </div>

 <div className="text-base sm:text-lg font-extrabold font-mono text-white truncate max-w-xs sm:max-w-md flex items-center gap-2">
 <span>
 {currentStageItem
 ? (currentStageItem.tipoItem === 'cancion'
 ? (currentStageSong ? formatSongTitle(currentStageSong.titulo) : 'Canción')
 : currentStageItem.tituloCustom || 'Interludio / Presentación')
 : 'Listos para iniciar el concierto'}
 </span>
 </div>

 {currentStageSong && (
 <div className="text-xs font-mono text-zinc-400 flex items-center gap-2 mt-0.5 flex-wrap">
 <span className="font-bold text-white">{currentStageSong.tonalidad || 'Am'}</span>
 <span>•</span>
 <span className="flex items-center gap-1.5 font-bold text-amber-300">
 <span className={`w-2 h-2 rounded-full transition-all duration-75 ${
 stageIsPlaying 
 ? (metronomeTick ? 'bg-amber-400 scale-125 shadow-[0_0_8px_#f59e0b]' : 'bg-amber-950 scale-90')
 : 'bg-zinc-600'
 }`} />
 {currentStageSong.bpm || 120} BPM
 </span>
 {currentStageSong.afinacion && (
 <>
 <span>•</span>
 <span className="text-amber-400/90">{currentStageSong.afinacion}</span>
 </>
 )}
 </div>
 )}
 </div>

 {/* Bluetooth Pedal Indicator & Info */}
 <button
 type="button"
 onClick={() => setShowPedalShortcuts(!showPedalShortcuts)}
 className={`p-2 rounded-[var(--r-m)] text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
 showPedalShortcuts
 ? 'bg-amber-500/20 text-amber-300 /40'
 : 'bg-[var(--surface)] hover:bg-neutral-800 text-zinc-400 border-zinc-700'
 }`}
 title="Atajos de teclado / Pedal Bluetooth para pasar canciones sin manos"
 >
 <Footprints className="w-3.5 h-3.5 text-amber-400" />
 <span className="hidden sm:inline">Pedal</span>
 </button>

 {/* Heart Favorite Button (Spotify Style) */}
 {currentStageSong && (
 <button
 onClick={() => toggleFavoriteSong(currentStageSong.id)}
 className="p-2.5 rounded-full hover:bg-zinc-800 transition-all cursor-pointer group flex items-center justify-center shrink-0 ml-1"
 title={isCurrentSongFavorited ? "Quitar de tus temas favoritos" : "Guardar en tus favoritos (Spotify)"}
 >
 <Heart 
 className={`w-5 h-5 transition-all transform group-active:scale-125 ${
 isCurrentSongFavorited 
 ? 'fill-[#1db954] text-[#1db954] drop-shadow-[0_0_8px_rgba(29,185,84,0.5)] scale-110' 
 : 'text-zinc-400 group-hover:text-white'
 }`}
 />
 </button>
 )}

 {/* Modify Audio Button for Show Items in Stage Mode */}
 {currentStageItem && currentStageItem.tipoItem !== 'cancion' && (
 <button
 onClick={() => {
 setEditingShowItem(currentStageItem);
 setShowItemAudioUrl(currentStageItem.audioUrl || '');
 setShowShowItemModal(true);
 }}
 className="px-3 py-1.5 rounded-[var(--r-m)] bg-sky-950/80 hover:bg-sky-900 text-sky-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ml-1 hover:scale-105 shadow-md"
 title="Grabar o subir audio para esta presentación / interludio"
 >
 <Mic className="w-4 h-4 text-sky-400" />
 <span className="hidden sm:inline">{currentStageItem.audioUrl ? 'Modificar Audio' : '+ Subir / Grabar Audio'}</span>
 </button>
 )}
 </div>

 {/* Minimalist Circular Playback Controls */}
 <div className="flex items-center gap-3">
 {/* Previous Track */}
 <button
 onClick={handleStagePrev}
 className="w-10 h-10 rounded-full bg-[#282828] hover:bg-[#3e3e3e] text-zinc-300 hover:text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
 title="Pista anterior"
 >
 <SkipBack className="w-5 h-5 fill-current" />
 </button>

 {/* Play / Pause Circular Main Button */}
 <button
 onClick={toggleStagePlayPause}
 className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold flex items-center justify-center shadow-xl shadow-[#1db954]/25 cursor-pointer hover:scale-105 active:scale-95 transition-all"
 title={stageIsPlaying ? "Pausar show" : "Iniciar directo"}
 >
 {stageIsPlaying ? (
 <Pause className="w-6 h-6 fill-current" />
 ) : (
 <Play className="w-6 h-6 fill-current ml-0.5" strokeWidth={2.5} />
 )}
 </button>

 {/* Next Track */}
 <button
 onClick={handleStageNext}
 className="w-10 h-10 rounded-full bg-[#282828] hover:bg-[#3e3e3e] text-zinc-300 hover:text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
 title="Pista siguiente"
 >
 <SkipForward className="w-5 h-5 fill-current" />
 </button>

 {/* Autoplay / Repeat Continuous Link */}
 <button
 onClick={() => setStageAutoplayNext(!stageAutoplayNext)}
 className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all ${
 stageAutoplayNext
 ? 'bg-[#1db954]/20 text-[#1ed760] border-[#1db954]/50 shadow-sm'
 : 'bg-[#282828] text-zinc-400 border-transparent hover:text-white'
 }`}
 title={stageAutoplayNext ? "Autoplay continuo activado" : "Autoplay desactivado"}
 >
 <Repeat className="w-4 h-4" />
 </button>

 {/* Fundido real entre canciones consecutivas (5s, curva de potencia constante) —
 desactivado por defecto, junto al botón de Autoplay del que depende. */}
 <button
 onClick={() => setStageCrossfadeEnabled(!stageCrossfadeEnabled)}
 className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all text-base ${
 stageCrossfadeEnabled
 ? 'bg-sky-500/20 text-sky-300 shadow-sm'
 : 'bg-[#282828] text-zinc-400 border-transparent hover:text-white'
 }`}
 title={stageCrossfadeEnabled ? "Fundido entre canciones activado (5s)" : "Fundido entre canciones desactivado (corte directo)"}
 >
 🔀
 </button>
 </div>
 </div>

 {/* Striated / Ridged Progress Seeker Bar */}
 <div className="space-y-1.5 pt-1">
 <div className="flex justify-between items-center text-[11px] font-mono text-zinc-400 font-bold px-0.5">
 <span>{formatSecondsToMmSs(stageCurrentTime)}</span>
 <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
 {stageIsPlaying ? '• EN REPRODUCCIÓN' : 'PAUSADO'}
 </span>
 <span>{formatSecondsToMmSs(stageItemDuration)}</span>
 </div>

 {/* Ridged Progress Track */}
 <div className="relative w-full h-3.5 rounded-full bg-[#242424] border-[var(--hair)] overflow-hidden group cursor-pointer shadow-inner flex items-center">
 <div 
 className="absolute inset-0 opacity-20 pointer-events-none"
 style={{
 backgroundImage: 'repeating-linear-gradient(90deg, #ffffff 0px, #ffffff 1.5px, transparent 1.5px, transparent 7px)'
 }}
 />

 <div 
 className="h-full bg-gradient-to-r from-[#1db954] via-[#1ed760] to-[#20df64] transition-all duration-150 relative shadow-[0_0_12px_rgba(29,185,84,0.4)]"
 style={{ width: `${stageProgressPct}%` }}
 >
 <div 
 className="absolute inset-0 opacity-40 pointer-events-none" 
 style={{
 backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, transparent 3px, rgba(0, 0, 0, 0.5) 3px, rgba(0, 0, 0, 0.5) 6px)'
 }}
 />
 <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.15)] opacity-90" />
 </div>

 <input
 type="range"
 min={0}
 max={stageItemDuration || 100}
 value={stageCurrentTime}
 onChange={(e) => handleStageSeek(Number(e.target.value))}
 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
 />
 </div>
 </div>

 {/* Bluetooth Pedal / Foot Controller Helper Banner */}
 {showPedalShortcuts && (
 <div className="p-3.5 rounded-[var(--r-m)] bg-amber-500/10 text-amber-200 text-xs font-mono space-y-2 animate-fadeIn">
 <div className="flex items-center justify-between font-bold text-amber-300">
 <span className="flex items-center gap-1.5">
 <Footprints className="w-4 h-4 text-amber-400" />
 <span>Compatibilidad con Pedal Bluetooth / Controlador de Pie (AirTurn, PageFlip, Donner, iRig):</span>
 </span>
 <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">Activo</span>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
 <div className="p-2 rounded-[var(--r-s)] bg-black/60">
 <span className="font-bold text-white">🦶 Pista Siguiente:</span> <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-amber-300">PageDown</code> / <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-amber-300">→</code> / <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-amber-300">]</code>
 </div>
 <div className="p-2 rounded-[var(--r-s)] bg-black/60">
 <span className="font-bold text-white">🦶 Pista Anterior:</span> <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-amber-300">PageUp</code> / <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-amber-300">←</code> / <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-amber-300">[</code>
 </div>
 <div className="p-2 rounded-[var(--r-s)] bg-black/60">
 <span className="font-bold text-white">🦶 Play / Pausa:</span> <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-amber-300">Barra Espaciadora</code>
 </div>
 </div>
 </div>
 )}

 {/* Quick Stage Actions: Pedal Helper & Live Lyrics/Chords Teleprompter */}
 <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--hair)]">
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => setShowPedalShortcuts(!showPedalShortcuts)}
 className={`text-[11px] font-mono px-3 py-1.5 rounded-[var(--r-s)] flex items-center gap-1.5 transition-colors cursor-pointer ${
 showPedalShortcuts 
 ? 'bg-amber-500/20 text-amber-300' 
 : 'bg-[var(--surface)] text-zinc-400 hover:text-white border-[var(--hair)]'
 }`}
 >
 <Footprints className="w-3.5 h-3.5" />
 <span>Pedal Bluetooth</span>
 </button>

 <button
 type="button"
 onClick={() => setShowChordsPanel(!showChordsPanel)}
 className={`text-[11px] font-mono px-3 py-1.5 rounded-[var(--r-s)] flex items-center gap-1.5 transition-colors cursor-pointer font-bold ${
 showChordsPanel 
 ? 'bg-[#1db954]/20 text-[#1ed760] border-[#1db954]/50 shadow-sm' 
 : 'bg-[var(--surface)] text-zinc-300 hover:text-white border-[var(--hair)]'
 }`}
 >
 <FileText className="w-3.5 h-3.5 text-[#1ed760]" />
 <span>{showChordsPanel ? 'Ocultar Letra/Acordes' : '📜 Letra y Acordes en Directo'}</span>
 </button>
 </div>

 {currentStageSong && (
 <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2">
 {currentStageSong.tonalidad && (
 <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-bold">
 Tono: {currentStageSong.tonalidad}
 </span>
 )}
 {currentStageSong.bpm && (
 <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
 {currentStageSong.bpm} BPM
 </span>
 )}
 </div>
 )}
 </div>

 {/* Live Stage Lyrics & Chords Teleprompter Drawer (Offline-safe) */}
 {showChordsPanel && (
 <div className="p-4 rounded-[var(--r-m)] bg-[var(--surface)] border-zinc-800 space-y-3 animate-fadeIn">
 <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
 <div className="flex items-center gap-2">
 <FileText className="w-4 h-4 text-[#1ed760]" />
 <h4 className="font-mono text-sm font-black text-white">
 {currentStageSong ? formatSongTitle(currentStageSong.titulo) : 'Sin tema seleccionado'}
 </h4>
 {currentStageSong?.afinacion && (
 <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
 {currentStageSong.afinacion}
 </span>
 )}
 </div>

 {/* Font Size controls for stage readability */}
 <div className="flex items-center gap-1.5 text-[11px] font-mono">
 <span className="text-zinc-500 mr-1 text-[10px] uppercase font-bold">Tamaño:</span>
 <button
 type="button"
 onClick={() => setChordsFontSize('sm')}
 className={`px-2 py-0.5 rounded ${chordsFontSize === 'sm' ? 'bg-[#1ed760] text-black font-bold' : 'bg-zinc-800 text-zinc-300'}`}
 >
 A-
 </button>
 <button
 type="button"
 onClick={() => setChordsFontSize('base')}
 className={`px-2 py-0.5 rounded ${chordsFontSize === 'base' ? 'bg-[#1ed760] text-black font-bold' : 'bg-zinc-800 text-zinc-300'}`}
 >
 A
 </button>
 <button
 type="button"
 onClick={() => setChordsFontSize('lg')}
 className={`px-2 py-0.5 rounded ${chordsFontSize === 'lg' ? 'bg-[#1ed760] text-black font-bold' : 'bg-zinc-800 text-zinc-300'}`}
 >
 A+
 </button>
 <button
 type="button"
 onClick={() => setChordsFontSize('xl')}
 className={`px-2 py-0.5 rounded ${chordsFontSize === 'xl' ? 'bg-[#1ed760] text-black font-bold' : 'bg-zinc-800 text-zinc-300'}`}
 >
 A++
 </button>
 </div>
 </div>

 {/* Chords and Lyrics View */}
 {currentStageSong?.cifradoTexto ? (
 <div className="max-h-[380px] overflow-y-auto pr-1">
 <pre 
 className={`font-mono text-zinc-100 whitespace-pre-wrap select-text leading-relaxed ${
 chordsFontSize === 'sm' ? 'text-xs' :
 chordsFontSize === 'base' ? 'text-sm' :
 chordsFontSize === 'lg' ? 'text-base' : 'text-lg font-bold'
 }`}
 >
 {currentStageSong.cifradoTexto}
 </pre>
 </div>
 ) : (
 <div className="p-6 text-center text-zinc-500 font-mono text-xs space-y-1">
 <p>No hay letra o acordes cifrados guardados para este tema todavía.</p>
 <p className="text-[11px] text-zinc-600">Puedes autogenerarlos o pegarlos desde el catálogo de canciones en Repertorio.</p>
 </div>
 )}

 {/* Musician/Substitute notes if present */}
 {currentStageSong?.notasRepertorio && (
 <div className="p-2.5 rounded bg-zinc-900/80 border-zinc-800 text-xs font-mono text-amber-200/90">
 <span className="font-bold text-amber-400">💡 Nota de directo:</span> {currentStageSong.notasRepertorio}
 </div>
 )}
 </div>
 )}
 </div>
 )}

 {/* Lista de solo lectura de temas: Repertorio ya trae su propia lista (editable, con
 arrastre, notas, popover de energía...) cuando este reproductor va embebido ahí —
 repetirla aquí sería la misma información dos veces en la misma pantalla. */}
 {!embedded && activeSetlist ? (
 <div className="bg-[var(--surface)] border-[var(--hair)] rounded-[var(--r-l)] overflow-hidden shadow-2xl p-4 sm:p-6">
 <div className="overflow-x-auto">
 <div className="min-w-[650px] space-y-2">
 <div className="grid grid-cols-12 text-[11px] font-mono font-extrabold text-[#b3b3b3] uppercase pb-3 border-b border-zinc-800/80 px-3">
 <div className="col-span-1">#</div>
 <div className="col-span-6">TÍTULO DEL TEMA / EVENTO</div>
 <div className="col-span-2 text-center">TONO / CATEGORÍA</div>
 <div className="col-span-1 text-center">BPM</div>
 <div className="col-span-2 text-right">DURACIÓN</div>
 </div>

 {activeSetlist.items.map((it, idx) => {
 if (it.tipoItem === 'cancion' && it.songId) {
 const s = songs.find(x => x.id === it.songId);
 if (!s) return null;

 const isPlayingThis = stagePlayingIndex === idx && stageIsPlaying;
 const isSelectedThis = stagePlayingIndex === idx;

 return (
 <div
 key={it.id}
 className={`grid grid-cols-12 items-center py-3.5 px-3 rounded-[var(--r-m)] transition-all cursor-pointer ${
 isSelectedThis
 ? 'bg-[#1db954]/15 border-l-4 border-[#1db954] text-white' 
 : 'hover:bg-zinc-800/60 text-zinc-300'
 }`}
 >
 <div className="col-span-1 flex items-center gap-2">
 <button
 onClick={() => {
 setStagePlayingIndex(idx);
 setStageIsPlaying(!(stagePlayingIndex === idx && stageIsPlaying));
 }}
 className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all ${
 isPlayingThis
 ? 'bg-[#1db954] text-black font-bold scale-105 shadow-md' 
 : 'bg-[#282828] text-[#1db954] hover:bg-[#1db954] hover:text-black'
 }`}
 title={isPlayingThis ? 'Pausar' : 'Reproducir este tema'}
 >
 {isPlayingThis ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
 </button>
 <span className="font-mono text-xs font-bold text-zinc-500">{idx + 1}</span>
 </div>

 <div className="col-span-6">
 <div className="text-base sm:text-lg font-bold font-mono text-white flex items-center gap-2">
 <span>{formatSongTitle(s.titulo)}</span>
 {isPlayingThis && (
 <div className="flex items-end gap-0.5 h-3">
 <span className="w-0.5 h-full bg-[#1db954] animate-pulse" />
 <span className="w-0.5 h-2/3 bg-[#1db954] animate-pulse delay-75" />
 <span className="w-0.5 h-4/5 bg-[#1db954] animate-pulse delay-150" />
 </div>
 )}
 </div>
 {it.notaTema && (
 <div className="text-[11px] font-mono text-amber-400 mt-0.5 flex items-center gap-1">
 <span>⚠️</span>
 <span>{it.notaTema}</span>
 </div>
 )}
 </div>

 <div className="col-span-2 text-center">
 <span className="px-2.5 py-1 bg-[#1db954]/20 text-[#1ed760] border-[#1db954]/30 rounded-md text-xs font-mono font-black">
 {s.tonalidad || 'Am'}
 </span>
 </div>

 <div className="col-span-1 text-center font-mono text-xs text-zinc-400 font-bold">
 {s.bpm || '—'}
 </div>

 <div className="col-span-2 text-right font-mono text-xs text-zinc-300 font-bold">
 {s.duracion}
 </div>
 </div>
 );
 } else if (it.tipoItem === 'bloque' && it.bloqueSubtipo === 'header') {
 return (
 <div
 key={it.id}
 className="py-3 px-4 bg-gradient-to-r from-[#1db954]/20 via-[var(--surface)] to-[var(--sunken)] border-l-4 border-[#1db954] rounded-[var(--r-m)] font-mono text-[#1ed760] font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 my-2 shadow-md"
 >
 <span className="text-sm">⚡</span>
 <span>{it.tituloCustom || 'SECCIÓN DEL SHOW'}</span>
 </div>
 );
 } else {
 const typeConfig = SHOW_ITEM_TYPES[it.tipoItem] || SHOW_ITEM_TYPES.otro;
 const durationText = formatItemDuration(it);
 const isPlayingThis = stagePlayingIndex === idx && stageIsPlaying;
 const isSelectedThis = stagePlayingIndex === idx;

 return (
 <div
 key={it.id}
 className={`grid grid-cols-12 items-center py-3.5 px-3 rounded-[var(--r-m)] transition-all cursor-pointer ${
 isSelectedThis 
 ? 'bg-sky-500/15 border-l-4 border-sky-400 text-white' 
 : 'hover:bg-zinc-800/60 text-zinc-300'
 }`}
 onClick={() => {
 setStagePlayingIndex(idx);
 if (stagePlayingIndex === idx) {
 setStageIsPlaying(!stageIsPlaying);
 } else {
 setStageIsPlaying(true);
 }
 }}
 >
 <div className="col-span-1 flex items-center gap-2">
 <button
 onClick={(e) => {
 e.stopPropagation();
 setStagePlayingIndex(idx);
 setStageIsPlaying(!isPlayingThis);
 }}
 className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all ${
 isPlayingThis 
 ? 'bg-sky-400 text-black font-bold scale-105 shadow-md' 
 : 'bg-[#282828] text-sky-400 hover:bg-sky-400 hover:text-black'
 }`}
 title={isPlayingThis ? 'Pausar' : 'Reproducir discurso / audio'}
 >
 {isPlayingThis ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
 </button>
 <span className="font-mono text-xs font-bold text-zinc-500">{idx + 1}</span>
 </div>

 <div className="col-span-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
 <div>
 <div className="flex items-center gap-2 flex-wrap">
 <span className="text-sm font-bold font-mono text-white">
 {typeConfig.icon} {it.tituloCustom || 'Interludio / Evento del Show'}
 </span>
 {it.audioUrl && (
 <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold flex items-center gap-1">
 <Mic className="w-3 h-3" /> Audio Real
 </span>
 )}
 </div>
 {it.notaTema && (
 <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
 📝 {it.notaTema}
 </div>
 )}
 </div>
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 setEditingShowItem(it);
 setShowItemAudioUrl(it.audioUrl || '');
 setShowShowItemModal(true);
 }}
 className="px-2 py-1 rounded-[var(--r-s)] bg-sky-950/70 hover:bg-sky-900 text-sky-300 text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer hover:scale-105 shrink-0 self-start sm:self-auto"
 title="Modificar Audio o Grabación de este evento"
 >
 <Mic className="w-3 h-3 text-sky-400" />
 <span>{it.audioUrl ? 'Modificar Audio' : '+ Audio'}</span>
 </button>
 </div>

 <div className="col-span-2 text-center">
 <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${typeConfig.text} ${typeConfig.border}`}>
 {typeConfig.label}
 </span>
 </div>

 <div className="col-span-1 text-center font-mono text-xs text-zinc-500">
 —
 </div>

 <div className="col-span-2 text-right font-mono text-xs text-amber-300 font-bold">
 ⏱️ {durationText}
 </div>
 </div>
 );
 }
 })}
 </div>
 </div>
 </div>
 ) : null}
 </div>
 );
};
