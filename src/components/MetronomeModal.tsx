import React, { useState, useEffect, useRef } from'react';
import { X, Play, Pause, Disc, Zap, Volume2, VolumeX, Music, Clock } from'lucide-react';
import { Song, ThemeColors } from'../types';
import { ModalPortal } from'./common/ModalPortal';

interface MetronomeModalProps {
 isOpen: boolean;
 onClose: () => void;
 songs?: Song[];
 colors?: ThemeColors;
 initialBpm?: number;
}

export function MetronomeModal({
 isOpen,
 onClose,
 songs = [],
 colors,
 initialBpm = 120
}: MetronomeModalProps) {
 const [bpm, setBpm] = useState<number>(initialBpm);
 const [isPlaying, setIsPlaying] = useState<boolean>(false);
 const [timeSignature, setTimeSignature] = useState<number>(4); // Beats per bar: 4 = 4/4, 3 = 3/4, 6 = 6/8, 2 = 2/4
 const [currentBeat, setCurrentBeat] = useState<number>(0);
 const [volume, setVolume] = useState<number>(0.8);
 const [isMuted, setIsMuted] = useState<boolean>(false);
 const [selectedSongId, setSelectedSongId] = useState<string>('');

 // Tap tempo state
 const tapTimesRef = useRef<number[]>([]);

 // Web Audio refs
 const audioCtxRef = useRef<AudioContext | null>(null);
 const timerWorkerRef = useRef<number | null>(null);
 const nextNoteTimeRef = useRef<number>(0);
 const currentBeatRef = useRef<number>(0);

 // Update initial BPM when prop changes
 useEffect(() => {
 if (initialBpm && initialBpm > 0) {
 setBpm(initialBpm);
 }
 }, [initialBpm]);

 // Handle selected song BPM sync
 const handleSelectSong = (e: React.ChangeEvent<HTMLSelectElement>) => {
 const sId = e.target.value;
 setSelectedSongId(sId);
 const found = songs.find(s => s.id === sId);
 if (found && found.bpm && found.bpm > 0) {
 setBpm(found.bpm);
 }
 };

 // Tap Tempo calculation
 const handleTapTempo = () => {
 const now = performance.now();
 const tapTimes = tapTimesRef.current;

 // Reset if last tap was more than 2 seconds ago
 if (tapTimes.length > 0 && now - tapTimes[tapTimes.length - 1] > 2000) {
 tapTimesRef.current = [];
 }

 tapTimesRef.current.push(now);

 if (tapTimesRef.current.length > 1) {
 // Calculate intervals
 const intervals = [];
 for (let i = 1; i < tapTimesRef.current.length; i++) {
 intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
 }
 const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
 const calculatedBpm = Math.round(60000 / avgInterval);

 if (calculatedBpm >= 30 && calculatedBpm <= 280) {
 setBpm(calculatedBpm);
 }
 }

 // Keep max 6 taps
 if (tapTimesRef.current.length > 6) {
 tapTimesRef.current.shift();
 }
 };

 // Play click audio oscillator
 const scheduleClick = (beatNumber: number, time: number) => {
 if (!audioCtxRef.current || isMuted) return;

 const osc = audioCtxRef.current.createOscillator();
 const gain = audioCtxRef.current.createGain();

 // High pitch for beat 1 (accent), lower pitch for other beats
 if (beatNumber === 0) {
 osc.frequency.value = 1200; // Accent pitch (Hz)
 gain.gain.value = volume;
 } else {
 osc.frequency.value = 800; // Normal click pitch (Hz)
 gain.gain.value = volume * 0.6;
 }

 osc.type ='sine';

 // Fast exponential decay for clean click sound
 gain.gain.setValueAtTime(gain.gain.value, time);
 gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

 osc.connect(gain);
 gain.connect(audioCtxRef.current.destination);

 osc.start(time);
 osc.stop(time + 0.05);
 };

 // Scheduler loop
 const scheduler = () => {
 if (!audioCtxRef.current) return;

 const lookahead = 0.1; // 100ms lookahead
 const scheduleAheadTime = 0.1;

 while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + scheduleAheadTime) {
 scheduleClick(currentBeatRef.current, nextNoteTimeRef.current);

 // Advance beat
 const currentBeatVal = currentBeatRef.current;
 setTimeout(() => {
 setCurrentBeat(currentBeatVal);
 }, (nextNoteTimeRef.current - audioCtxRef.current!.currentTime) * 1000);

 const secondsPerBeat = 60.0 / bpm;
 nextNoteTimeRef.current += secondsPerBeat;

 currentBeatRef.current = (currentBeatRef.current + 1) % timeSignature;
 }
 };

 // Toggle metronome play/stop
 const togglePlay = () => {
 if (!isPlaying) {
 // Start audio context
 if (!audioCtxRef.current) {
 audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
 }
 if (audioCtxRef.current.state ==='suspended') {
 audioCtxRef.current.resume();
 }

 currentBeatRef.current = 0;
 nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.05;

 // Start interval timer
 timerWorkerRef.current = window.setInterval(scheduler, 25);
 setIsPlaying(true);
 } else {
 if (timerWorkerRef.current) {
 clearInterval(timerWorkerRef.current);
 timerWorkerRef.current = null;
 }
 setIsPlaying(false);
 setCurrentBeat(0);
 }
 };

 // Stop metronome on modal close
 useEffect(() => {
 if (!isOpen && isPlaying) {
 if (timerWorkerRef.current) {
 clearInterval(timerWorkerRef.current);
 timerWorkerRef.current = null;
 }
 setIsPlaying(false);
 setCurrentBeat(0);
 }
 }, [isOpen]);

 // Clean up on unmount
 useEffect(() => {
 return () => {
 if (timerWorkerRef.current) {
 clearInterval(timerWorkerRef.current);
 }
 if (audioCtxRef.current) {
 audioCtxRef.current.close().catch(() => {});
 }
 };
 }, []);

 if (!isOpen) return null;

 return (
 <ModalPortal isOpen={isOpen} onClose={onClose}>
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/80 backdrop-blur-md overflow-y-auto overscroll-contain animate-in fade-in duration-200">
 <div className="bg-gradient-to-b from-zinc-900 to-[var(--sunken)] rounded-[var(--r-l)] w-full max-w-md overflow-hidden shadow-2xl shadow-amber-0/10 my-auto max-h-[90vh] overflow-y-auto">
 
 {/* Header */}
 <div className="p-4 border-b border-[var(--hair)] flex items-center justify-between bg-[var(--ink)]/5">
 <div className="flex items-center gap-2">
 <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc)]/20 text-[var(--acc)]">
 <Clock className="w-5 h-5 animate-pulse" />
 </div>
 <div>
 <h3 className="text-base font-bold text-[var(--ink)] flex items-center gap-1.5">
 Metrónomo Pro
 <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-bold bg-[var(--acc)]/20 text-[var(--acc)]/70">
 WebAudio API
 </span>
 </h3>
 <p className="text-xs text-[var(--ink-2)]">Click de alta precisión para ensayos y estudio</p>
 </div>
 </div>
 <button
 onClick={onClose}
 className="p-1.5 rounded-[var(--r-s)] bg-[var(--ink)]/5 hover:bg-[var(--ink)]/10 text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Content */}
 <div className="p-6 space-y-6">
 
 {/* Song Selector Sync */}
 {songs.length > 0 && (
 <div className="bg-[var(--ink)]/5 rounded-[var(--r-m)] p-3 border-[var(--hair)] flex flex-col gap-1.5">
 <label className="text-xs font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
 <Music className="w-3.5 h-3.5 text-[var(--acc)]" />
 Sincronizar BPM desde Repertorio:
 </label>
 <select
 value={selectedSongId}
 onChange={handleSelectSong}
 className="w-full bg-[var(--bg)] border-[var(--hair)] rounded-[var(--r-s)] px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:/50"
 >
 <option value="">-- Seleccionar Canción --</option>
 {songs.map(song => (
 <option key={song.id} value={song.id}>
 {song.titulo} {song.bpm ? `(${song.bpm} BPM)` :'(Sin BPM definido)'}
 </option>
 ))}
 </select>
 </div>
 )}

 {/* Large BPM Display & Quick Adjustment */}
 <div className="flex flex-col items-center justify-center bg-[var(--sunken)] border-[var(--hair)] rounded-[var(--r-l)] p-6 relative overflow-hidden">
 <div className="text-xs font-sans font-bold text-[var(--acc)] tracking-widest mb-1 flex items-center gap-1">
 <Zap className="w-3.5 h-3.5" /> Tempo Actual
 </div>

 <div className="flex items-center gap-4">
 <button
 onClick={() => setBpm(b => Math.max(30, b - 5))}
 className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--ink)]/5 hover:bg-[var(--acc)]/20 hover:text-[var(--acc)]/70 border-[var(--hair)] font-bold text-lg text-[var(--ink)] transition-all cursor-pointer active:scale-95 flex items-center justify-center"
 title="-5 BPM"
 >
 -5
 </button>
 <button
 onClick={() => setBpm(b => Math.max(30, b - 1))}
 className="w-9 h-9 rounded-[var(--r-m)] bg-[var(--ink)]/5 hover:bg-[var(--acc)]/20 hover:text-[var(--acc)]/70 border-[var(--hair)] font-bold text-sm text-[var(--ink)] transition-all cursor-pointer active:scale-95 flex items-center justify-center"
 title="-1 BPM"
 >
 -1
 </button>

 <div className="flex flex-col items-center">
 <span className="text-5xl font-black font-sans tracking-tight text-[var(--ink)] drop-shadow-md">
 {bpm}
 </span>
 <span className="text-[10px] font-sans text-[var(--ink-2)] tracking-wider">
 Pulsaciones por Minuto
 </span>
 </div>

 <button
 onClick={() => setBpm(b => Math.min(280, b + 1))}
 className="w-9 h-9 rounded-[var(--r-m)] bg-[var(--ink)]/5 hover:bg-[var(--acc)]/20 hover:text-[var(--acc)]/70 border-[var(--hair)] font-bold text-sm text-[var(--ink)] transition-all cursor-pointer active:scale-95 flex items-center justify-center"
 title="+1 BPM"
 >
 +1
 </button>
 <button
 onClick={() => setBpm(b => Math.min(280, b + 5))}
 className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--ink)]/5 hover:bg-[var(--acc)]/20 hover:text-[var(--acc)]/70 border-[var(--hair)] font-bold text-lg text-[var(--ink)] transition-all cursor-pointer active:scale-95 flex items-center justify-center"
 title="+5 BPM"
 >
 +5
 </button>
 </div>

 {/* Slider */}
 <input
 type="range"
 min="30"
 max="260"
 value={bpm}
 onChange={(e) => setBpm(Number(e.target.value))}
 className="w-full mt-5 accent-amber-500 cursor-pointer"
 />
 </div>

 {/* Animated Beat Visualizer Bar */}
 <div className="space-y-2">
 <div className="flex items-center justify-between text-xs text-[var(--ink-2)]">
 <span className="font-semibold flex items-center gap-1">
 Compás ({timeSignature}/4):
 </span>
 <span className="font-sans text-[var(--acc)]/70 font-bold">
 Golpe {isPlaying ? currentBeat + 1 :'-'} / {timeSignature}
 </span>
 </div>

 <div className="grid grid-cols-4 gap-2">
 {Array.from({ length: timeSignature }).map((_, idx) => {
 const isActive = isPlaying && currentBeat === idx;
 const isAccent = idx === 0;

 return (
 <div
 key={idx}
 className={`h-12 rounded-[var(--r-m)] flex items-center justify-center font-sans font-bold text-sm transition-all duration-75 ${
 isActive
 ? isAccent
 ?'bg-[var(--acc)]/60 text-[var(--ink)] shadow-lg shadow-amber-0/50 scale-105'
 :'bg-[var(--ok)] text-[var(--ink)] border-[var(--ok)] shadow-lg shadow-emerald-500/50 scale-105'
 :'bg-[var(--ink)]/5 text-[var(--ink-2)] border-[var(--hair)]'
 }`}
 >
 {idx + 1}
 </div>
 );
 })}
 </div>
 </div>

 {/* Time Signature Pickers & Tap Tempo */}
 <div className="grid grid-cols-2 gap-3">
 {/* Compás selector */}
 <div className="bg-[var(--ink)]/5 rounded-[var(--r-m)] p-2.5 border-[var(--hair)]">
 <label className="text-[11px] font-semibold text-[var(--ink-2)] block mb-1.5">
 Métrica:
 </label>
 <div className="grid grid-cols-3 gap-1">
 {[4, 3, 2].map((sig) => (
 <button
 key={sig}
 onClick={() => setTimeSignature(sig)}
 className={`py-1 text-xs font-bold rounded-[var(--r-s)] transition-colors cursor-pointer ${
 timeSignature === sig
 ?'bg-[var(--acc)] text-[var(--ink)]'
 :'bg-[var(--sunken)] text-[var(--ink-2)] hover:bg-[var(--ink)]/10'
 }`}
 >
 {sig}/4
 </button>
 ))}
 </div>
 </div>

 {/* Tap Tempo Button */}
 <button
 onClick={handleTapTempo}
 className="bg-gradient-to-br from-amber-0/20 to-orange-500/20 hover:from-amber-0/30 hover:to-orange-500/30 rounded-[var(--r-m)] p-2.5 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 group"
 >
 <span className="text-xs font-black text-[var(--acc)]/70 tracking-wider group-hover:scale-105 transition-transform">
 👆 TAP TEMPO
 </span>
 <span className="text-[10px] text-[var(--ink-2)]">Toca el ritmo 4 veces</span>
 </button>
 </div>

 {/* Quick BPM Presets */}
 <div className="space-y-1.5">
 <span className="text-[11px] font-semibold text-[var(--ink-2)] block">
 Presets Rápidos:
 </span>
 <div className="flex items-center gap-1.5 flex-wrap">
 {[
 { label:'Balada (75)', val: 75 },
 { label:'Pop/Mid (105)', val: 105 },
 { label:'Ska/Disco (124)', val: 124 },
 { label:'Rock (140)', val: 140 },
 { label:'Punk (165)', val: 165 },
 ].map(p => (
 <button
 key={p.val}
 onClick={() => setBpm(p.val)}
 className={`px-2.5 py-1 rounded-[var(--r-s)] text-xs font-medium cursor-pointer transition-colors ${
 bpm === p.val
 ?'bg-[var(--acc)]/20 /50 text-[var(--acc)]/70 font-bold'
 :'bg-[var(--ink)]/5 border-[var(--hair)] text-[var(--ink-2)] hover:bg-[var(--ink)]/10'
 }`}
 >
 {p.label}
 </button>
 ))}
 </div>
 </div>

 {/* Primary Play/Pause Action */}
 <div className="pt-2">
 <button
 onClick={togglePlay}
 className={`w-full py-3.5 rounded-[var(--r-m)] font-bold text-base flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer active:scale-98 ${
 isPlaying
 ?'bg-[var(--alert)] hover:bg-[var(--alert)] text-[var(--ink)] shadow-rose-500/25'
 :'bg-gradient-to-r from-[var(--acc)] to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[var(--ink)] shadow-amber-0/25'
 }`}
 >
 {isPlaying ? (
 <>
 <Pause className="w-5 h-5 fill-current" />
 DETENER METRÓNOMO
 </>
 ) : (
 <>
 <Play className="w-5 h-5 fill-current" />
 INICIAR METRÓNOMO ({bpm} BPM)
 </>
 )}
 </button>
 </div>

 </div>

 </div>
 </div>
 </ModalPortal>
 );
}
