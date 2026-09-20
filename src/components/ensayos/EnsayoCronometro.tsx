import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, Zap, AlertCircle } from 'lucide-react';
import { ThemeColors } from '../../types';

interface EnsayoCronometroProps {
 totalEstimatedMin?: number;
 initialElapsedSeg?: number;
 onTimeUpdate?: (elapsedSeg: number) => void;
 colors?: ThemeColors;
 isCompact?: boolean;
}

export function formatTime(seconds: number): string {
 const hrs = Math.floor(seconds / 3600);
 const mins = Math.floor((seconds % 3600) / 60);
 const secs = seconds % 60;
 if (hrs > 0) {
 return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
 }
 return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function EnsayoCronometro({
 totalEstimatedMin = 120,
 initialElapsedSeg = 0,
 onTimeUpdate,
 colors,
 isCompact = false
}: EnsayoCronometroProps) {
 const [seconds, setSeconds] = useState(initialElapsedSeg);
 const [isActive, setIsActive] = useState(false);
 const intervalRef = useRef<number | null>(null);

 useEffect(() => {
 setSeconds(initialElapsedSeg);
 }, [initialElapsedSeg]);

 useEffect(() => {
 if (isActive) {
 intervalRef.current = window.setInterval(() => {
 setSeconds(prev => {
 const next = prev + 1;
 if (onTimeUpdate && next % 5 === 0) {
 onTimeUpdate(next);
 }
 return next;
 });
 }, 1000);
 } else if (intervalRef.current) {
 clearInterval(intervalRef.current);
 intervalRef.current = null;
 }
 return () => {
 if (intervalRef.current) clearInterval(intervalRef.current);
 };
 }, [isActive, onTimeUpdate]);

 const toggleTimer = () => {
 const nextState = !isActive;
 setIsActive(nextState);
 if (!nextState && onTimeUpdate) {
 onTimeUpdate(seconds);
 }
 };

 const resetTimer = () => {
 if (window.confirm('¿Reiniciar el cronómetro del ensayo a 00:00?')) {
 setIsActive(false);
 setSeconds(0);
 if (onTimeUpdate) onTimeUpdate(0);
 }
 };

 const totalTargetSec = (totalEstimatedMin || 120) * 60;
 const progressPct = Math.min(100, Math.round((seconds / totalTargetSec) * 100));
 const isOvertime = seconds > totalTargetSec;

 if (isCompact) {
 return (
 <div className="flex items-center gap-2 bg-[#141413] border-[#262522] rounded-[var(--r-m)] px-3 py-1.5 shadow-sm">
 <Clock className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400 animate-pulse' : 'text-text-[var(--ink-2)]'}`} />
 <span className={`font-mono font-bold text-sm tracking-wider ${isOvertime ? 'text-rose-400' : 'text-zinc-100'}`}>
 {formatTime(seconds)}
 </span>
 <button
 onClick={toggleTimer}
 className={`p-1 rounded-[var(--r-s)] text-xs font-mono font-bold transition-all cursor-pointer ${
 isActive
 ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
 : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
 }`}
 title={isActive ? 'Pausar Cronómetro' : 'Iniciar Cronómetro'}
 >
 {isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
 </button>
 </div>
 );
 }

 return (
 <div className="p-4 rounded-[var(--r-l)] bg-gradient-to-br from-[var(--surface)] to-[#121110] border-[#2a2825] shadow-lg relative overflow-hidden">
 {/* Background soft glow when running */}
 {isActive && (
 <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
 )}

 <div className="flex items-center justify-between gap-3 mb-3">
 <div className="flex items-center gap-2">
 <div className={`p-1.5 rounded-[var(--r-s)] ${isActive ? 'bg-amber-400/15 text-amber-400' : 'bg-neutral-800 text-text-[var(--ink-2)]'}`}>
 <Clock className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
 </div>
 <div>
 <h4 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
 Cronómetro de Ensayo
 </h4>
 <p className="text-[10px] font-mono text-text-[var(--ink-2)]">
 Objetivo: {totalEstimatedMin} min planificados
 </p>
 </div>
 </div>

 {isOvertime && (
 <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-300 animate-pulse">
 <AlertCircle className="w-3 h-3" /> Tiempo excedido
 </span>
 )}
 </div>

 {/* Big Display */}
 <div className="flex items-baseline justify-between gap-4 my-2">
 <div className="flex items-baseline gap-2">
 <span className={`text-3xl sm:text-4xl font-mono font-black tracking-tight ${
 isOvertime ? 'text-rose-400' : isActive ? 'text-amber-400' : 'text-zinc-100'
 }`}>
 {formatTime(seconds)}
 </span>
 <span className="text-xs font-mono text-neutral-500">
 / {formatTime(totalTargetSec)}
 </span>
 </div>

 {/* Action Controls */}
 <div className="flex items-center gap-1.5">
 <button
 onClick={toggleTimer}
 className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--r-m)] text-xs font-mono font-bold transition-all cursor-pointer shadow-sm active:scale-95 ${
 isActive
 ? 'bg-amber-500 text-bg-[var(--surface)] hover:bg-amber-400 shadow-amber-500/20'
 : 'bg-emerald-500 text-bg-[var(--surface)] hover:bg-emerald-400 shadow-emerald-500/20'
 }`}
 >
 {isActive ? (
 <>
 <Pause className="w-3.5 h-3.5" />
 <span>Pausar</span>
 </>
 ) : (
 <>
 <Play className="w-3.5 h-3.5 fill-current" />
 <span>Iniciar</span>
 </>
 )}
 </button>

 <button
 onClick={resetTimer}
 className="p-2 rounded-[var(--r-m)] text-text-[var(--ink-2)] hover:text-bg-[var(--sunken)] hover:bg-neutral-800 transition-colors cursor-pointer border-[#2a2825]"
 title="Reiniciar cronómetro"
 >
 <RotateCcw className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>

 {/* Progress Bar */}
 <div className="mt-3">
 <div className="w-full h-2 rounded-full bg-bg-[var(--surface)] overflow-hidden">
 <div
 className={`h-full rounded-full transition-all duration-300 ${
 isOvertime
 ? 'bg-gradient-to-r from-rose-500 to-red-600'
 : progressPct > 80
 ? 'bg-gradient-to-r from-amber-400 to-orange-500'
 : 'bg-gradient-to-r from-emerald-400 to-teal-500'
 }`}
 style={{ width: `${progressPct}%` }}
 />
 </div>
 <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500 mt-1">
 <span>{progressPct}% completado</span>
 <span>{Math.max(0, Math.round((totalTargetSec - seconds) / 60))} min restantes</span>
 </div>
 </div>
 </div>
 );
}
