// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, ChevronLeft, ChevronRight, Disc3, Clock, Sparkles, 
  Volume2, VolumeX, CheckCircle2, AlertCircle, RotateCcw, ThumbsUp,
  Flame, Music, Maximize2, Minimize2, FileText, CheckSquare, List,
  BookOpen, Sliders, Type, ArrowDown, Edit3, X, Eye
} from 'lucide-react';
import { Rehearsal, RehearsalAgendaItem, Song, ThemeColors, SongSubstituteGuide } from '../../types';
import { formatTime } from './EnsayoCronometro';
import { 
  processChordText, 
  extractUniqueChords, 
  GUITAR_CHORD_DATABASE, 
  GuitarChordShape, 
  transposeChordToken 
} from '../../utils/chordUtils';
import { SongChordsViewerModal } from '../SongChordsViewerModal';

interface ModoLocalEnVivoTabProps {
  rehearsal: Rehearsal;
  onUpdateRehearsal: (updated: Partial<Rehearsal>) => void;
  songs: Song[];
  colors?: ThemeColors;
  onUpdateSong?: (updated: Song) => void;
}

export function ModoLocalEnVivoTab({
  rehearsal,
  onUpdateRehearsal,
  songs = [],
  colors,
  onUpdateSong
}: ModoLocalEnVivoTabProps) {
  const agenda = rehearsal.agenda || [];
  const [activeIndex, setActiveIndex] = useState(0);

  const currentItem = agenda[activeIndex] || null;
  const currentSong = currentItem?.songId ? songs.find(s => s.id === currentItem.songId) : null;

  // View Mode: 'escenario' (metrics, structure, notes) vs 'atril' (chords & lyrics teleprompter)
  const [viewMode, setViewMode] = useState<'escenario' | 'atril'>('escenario');

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wakeLockRef = useRef<any>(null);

  // Track / Block Timer State
  const [trackSeconds, setTrackSeconds] = useState(0);
  const [isTrackTimerActive, setIsTrackTimerActive] = useState(false);
  const trackTimerRef = useRef<number | null>(null);

  // Metronome State
  const [bpm, setBpm] = useState(currentSong?.bpm || 120);
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [timeSignature, setTimeSignature] = useState<'4/4' | '3/4' | '6/8' | '2/4'>('4/4');
  const [currentBeat, setCurrentBeat] = useState(0);

  // Web Audio Context for Metronome
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);
  const tapTimesRef = useRef<number[]>([]);

  // Atril Mode State: Transpose, Notation, Font Size, Auto-Scroll, Diagrams
  const [transpose, setTranspose] = useState<number>(0);
  const [notation, setNotation] = useState<'ES' | 'EN'>('ES');
  const [fontSizeIndex, setFontSizeIndex] = useState<number>(1); // 0=sm, 1=md, 2=lg, 3=xl
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(1); // 1, 2, 3
  const [showChordDiagrams, setShowChordDiagrams] = useState<boolean>(false);
  const [showSubstituteGuideTab, setShowSubstituteGuideTab] = useState<boolean>(false);
  const [editingSongModal, setEditingSongModal] = useState<Song | null>(null);
  const atrilScrollRef = useRef<HTMLDivElement>(null);

  // Swipe and Keyboard Gestures
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);
  const touchDeltaY = useRef<number>(0);
  const [swipeToast, setSwipeToast] = useState<{ text: string; dir: 'left' | 'right' } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchDeltaX.current = 0;
    touchDeltaY.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
    touchDeltaY.current = e.touches[0].clientY - touchStartY.current;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = touchDeltaX.current;
    const dy = touchDeltaY.current;

    // Detect horizontal swipe (at least 35px and predominantly horizontal)
    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (dx < 0 && activeIndex < agenda.length - 1) {
        // Swipe Left -> Next Song
        const nextIdx = activeIndex + 1;
        setActiveIndex(nextIdx);
        setSwipeToast({ text: `Pista ${nextIdx + 1}: ${agenda[nextIdx]?.titulo || ''}`, dir: 'left' });
        setTimeout(() => setSwipeToast(null), 1000);
      } else if (dx > 0 && activeIndex > 0) {
        // Swipe Right -> Previous Song
        const prevIdx = activeIndex - 1;
        setActiveIndex(prevIdx);
        setSwipeToast({ text: `Pista ${prevIdx + 1}: ${agenda[prevIdx]?.titulo || ''}`, dir: 'right' });
        setTimeout(() => setSwipeToast(null), 1000);
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    touchDeltaX.current = 0;
    touchDeltaY.current = 0;
  };

  // Keyboard navigation (pedals, arrows, space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        if (activeIndex < agenda.length - 1) {
          e.preventDefault();
          setActiveIndex(prev => prev + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (activeIndex > 0) {
          e.preventDefault();
          setActiveIndex(prev => prev - 1);
        }
      } else if (e.key === ' ' && viewMode === 'atril') {
        e.preventDefault();
        setIsAutoScrolling(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, agenda.length, viewMode]);

  // Font sizes classes for Atril mode
  const FONT_SIZE_CLASSES = [
    'text-xs sm:text-sm leading-relaxed',
    'text-sm sm:text-base leading-relaxed',
    'text-base sm:text-xl leading-relaxed',
    'text-lg sm:text-2xl leading-loose font-medium'
  ];

  // Wake Lock handler to prevent phone screen from turning off in rehearsals
  useEffect(() => {
    async function requestWakeLock() {
      if ('wakeLock' in navigator && (isFullscreen || isTrackTimerActive)) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch {
          // Wake lock rejected or unsupported
        }
      }
    }
    requestWakeLock();
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [isFullscreen, isTrackTimerActive]);

  // When song changes, update BPM, reset track timer and transposition
  useEffect(() => {
    if (currentSong?.bpm) {
      setBpm(currentSong.bpm);
    }
    setTrackSeconds(0);
    setIsTrackTimerActive(true);
    setTranspose(0);
    setIsAutoScrolling(false);
  }, [activeIndex, currentSong?.bpm]);

  // Track Timer Interval
  useEffect(() => {
    if (isTrackTimerActive) {
      trackTimerRef.current = window.setInterval(() => {
        setTrackSeconds(prev => prev + 1);
      }, 1000);
    } else if (trackTimerRef.current) {
      clearInterval(trackTimerRef.current);
      trackTimerRef.current = null;
    }
    return () => {
      if (trackTimerRef.current) clearInterval(trackTimerRef.current);
    };
  }, [isTrackTimerActive]);

  // Metronome Scheduler
  const beatsPerBar = timeSignature === '3/4' ? 3 : timeSignature === '6/8' ? 6 : timeSignature === '2/4' ? 2 : 4;

  const playClick = (time: number, isAccent: boolean) => {
    if (!audioCtxRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();

    osc.frequency.value = isAccent ? 1200 : 800;
    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);

    osc.start(time);
    osc.stop(time + 0.05);
  };

  useEffect(() => {
    if (!isMetronomeActive) {
      if (timerIDRef.current) clearInterval(timerIDRef.current);
      setCurrentBeat(0);
      return;
    }

    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.05;
    let beatCount = 0;

    const interval = setInterval(() => {
      if (!audioCtxRef.current) return;
      const secondsPerBeat = 60.0 / bpm;

      while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + 0.1) {
        const isAccent = beatCount % beatsPerBar === 0;
        playClick(nextNoteTimeRef.current, isAccent);
        setCurrentBeat(beatCount % beatsPerBar);
        nextNoteTimeRef.current += secondsPerBeat;
        beatCount++;
      }
    }, 25);

    timerIDRef.current = interval as any;

    return () => {
      clearInterval(interval);
    };
  }, [isMetronomeActive, bpm, beatsPerBar]);

  // Auto-scroll effect for Atril Mode
  useEffect(() => {
    let scrollInterval: any = null;
    if (isAutoScrolling && viewMode === 'atril') {
      scrollInterval = setInterval(() => {
        if (atrilScrollRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = atrilScrollRef.current;
          if (scrollTop + clientHeight >= scrollHeight - 10) {
            setIsAutoScrolling(false);
          } else {
            atrilScrollRef.current.scrollTop += scrollSpeed * 0.9;
          }
        }
      }, 50);
    } else {
      clearInterval(scrollInterval);
    }
    return () => clearInterval(scrollInterval);
  }, [isAutoScrolling, scrollSpeed, viewMode]);

  // Tap Tempo
  const handleTapTempo = () => {
    const now = performance.now();
    const taps = tapTimesRef.current;
    taps.push(now);
    if (taps.length > 4) taps.shift();

    if (taps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < taps.length; i++) {
        intervals.push(taps[i] - taps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 40 && calculatedBpm <= 280) {
        setBpm(calculatedBpm);
      }
    }
  };

  // Evaluation Handler
  const handleSetEvaluation = (evaluacion: 'bordada' | 'regular' | 'repetir') => {
    if (!currentItem) return;
    const newAgenda = agenda.map(a =>
      a.id === currentItem.id ? { ...a, evaluacion } : a
    );
    onUpdateRehearsal({ agenda: newAgenda });
  };

  // Note handler for current item
  const handleUpdateCurrentNote = (nota: string) => {
    if (!currentItem) return;
    const newAgenda = agenda.map(a =>
      a.id === currentItem.id ? { ...a, enfoque: nota } : a
    );
    onUpdateRehearsal({ agenda: newAgenda });
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      if (containerRef.current && containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
    } else {
      setIsFullscreen(false);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  if (agenda.length === 0) {
    return (
      <div className="p-8 sm:p-12 text-center bg-[#141413] border border-[#262522] rounded-3xl space-y-4">
        <Disc3 className="w-12 h-12 text-neutral-600 mx-auto animate-spin-slow" />
        <h3 className="text-base font-bold text-zinc-200">No hay temas en el orden del día</h3>
        <p className="text-xs text-neutral-400 max-w-md mx-auto">
          Ve a la pestaña "1. Orden del Día" para añadir canciones y bloques antes de activar el modo local.
        </p>
      </div>
    );
  }

  // Get structure pills
  const estructuraPills = currentSong?.guiaSustituto?.estructura
    ? currentSong.guiaSustituto.estructura.split(',').map(s => s.trim())
    : ['Intro', 'Estrofa 1', 'Estribillo', 'Estrofa 2', 'Solo', 'Estribillo Final', 'Outro'];

  // Current chord text
  const rawChordText = currentSong?.cifradoTexto || getSampleCifrado(currentSong?.titulo || currentItem?.titulo || 'Tema');
  const uniqueChords = extractUniqueChords(rawChordText);

  return (
    <div 
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`animate-fade-in select-none ${
        isFullscreen 
          ? 'fixed inset-0 z-50 bg-[#090908] h-[100dvh] max-h-[100dvh] w-screen max-w-full overflow-hidden flex flex-col p-2 sm:p-3 justify-between' 
          : 'space-y-4'
      }`}
    >
      {/* Swipe Feedback Toast */}
      {swipeToast && (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-2xl font-mono text-xs font-bold shadow-2xl flex items-center gap-2 border animate-in fade-in zoom-in-95 duration-150 ${
          swipeToast.dir === 'left' 
            ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-amber-400/20' 
            : 'bg-emerald-400 text-neutral-950 border-emerald-300 shadow-emerald-400/20'
        }`}>
          <span>{swipeToast.dir === 'left' ? '⏩' : '⏪'}</span>
          <span>{swipeToast.text}</span>
        </div>
      )}

      {/* Top Session Progress Bar & Track Selector Carousel */}
      <div className={`flex items-center justify-between gap-2 p-1.5 sm:p-2 rounded-2xl bg-[#141413] border border-[#262522] ${isFullscreen ? 'shrink-0 mb-1.5' : ''}`}>
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 px-1 scrollbar-none flex-1">
          {agenda.map((item, idx) => {
            const isCurrent = idx === activeIndex;
            return (
              <button
                key={item.id}
                onClick={() => setActiveIndex(idx)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-mono text-xs whitespace-nowrap transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-amber-400 text-neutral-950 font-black shadow-md shadow-amber-400/20 scale-102'
                    : item.evaluacion === 'bordada'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : item.evaluacion === 'repetir'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-[#1a1918] text-neutral-400 hover:text-white border border-[#2a2825]'
                }`}
              >
                <span>{idx + 1}.</span>
                <span className="truncate max-w-[90px] sm:max-w-[140px]">{item.titulo}</span>
                {item.evaluacion === 'bordada' && <span>🟢</span>}
                {item.evaluacion === 'regular' && <span>🟡</span>}
                {item.evaluacion === 'repetir' && <span>🔴</span>}
              </button>
            );
          })}
        </div>

        {/* View Switcher Buttons + Fullscreen Toggle */}
        <div className="flex items-center gap-1.5 shrink-0 pl-1">
          {/* Toggle Escenario vs Atril */}
          <div className="flex items-center p-0.5 bg-[#1a1918] border border-[#2e2d2a] rounded-xl">
            <button
              onClick={() => setViewMode('escenario')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                viewMode === 'escenario'
                  ? 'bg-amber-400 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Vista Escenario & Estructura"
            >
              <Flame className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Ficha</span>
            </button>

            <button
              onClick={() => setViewMode('atril')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                viewMode === 'atril'
                  ? 'bg-amber-400 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Modo Atril / Acordes & Letra (Teleprompter)"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Atril / Acordes</span>
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-[#1c1b19] border border-[#2e2d2a] text-neutral-300 hover:text-white hover:border-amber-400/40 transition-all cursor-pointer"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Ver a pantalla completa'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: FICHA DE ESCENARIO & DINÁMICA */}
      {viewMode === 'escenario' && (
        <div className="p-4 sm:p-7 rounded-3xl bg-gradient-to-b from-[#181716] via-[#121110] to-[#0d0d0c] border-2 border-amber-500/30 shadow-2xl relative overflow-hidden space-y-6">
          {/* Subtle stage spotlight effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-amber-500/10 blur-3xl pointer-events-none" />

          {/* Top Header: Track Title & Musical Meta (100% Mobile Responsive) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2a2825] pb-5">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase">
                  Pista {activeIndex + 1} de {agenda.length}
                </span>
                <span className="text-xs font-mono text-neutral-400 uppercase">
                  {currentItem?.tipo.replace('_', ' ')}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-display font-black text-white tracking-tight truncate">
                {currentItem?.titulo}
              </h1>
            </div>

            {/* Key, BPM & Stopwatch Badges (Grid on Mobile) */}
            <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-3">
              <div className="p-2.5 sm:p-4 rounded-2xl bg-[#1f1e1c] border border-[#33312c] text-center min-w-[75px] sm:min-w-[90px]">
                <span className="block text-[9px] sm:text-[10px] font-mono text-neutral-400 uppercase font-bold">
                  Tonalidad
                </span>
                <span className="text-lg sm:text-3xl font-mono font-black text-amber-400">
                  {currentSong?.tonalidad || '—'}
                </span>
              </div>

              <div className="p-2.5 sm:p-4 rounded-2xl bg-[#1f1e1c] border border-[#33312c] text-center min-w-[75px] sm:min-w-[90px]">
                <span className="block text-[9px] sm:text-[10px] font-mono text-neutral-400 uppercase font-bold">
                  Tempo
                </span>
                <span className="text-lg sm:text-3xl font-mono font-black text-amber-400">
                  {bpm} <span className="text-[10px] text-neutral-400 font-normal">BPM</span>
                </span>
              </div>

              <div className="p-2.5 sm:p-4 rounded-2xl bg-[#1f1e1c] border border-[#33312c] text-center min-w-[85px] sm:min-w-[100px]">
                <span className="block text-[9px] sm:text-[10px] font-mono text-neutral-400 uppercase font-bold flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" /> Tiempo
                </span>
                <span className="text-lg sm:text-3xl font-mono font-black text-zinc-100">
                  {formatTime(trackSeconds)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action: Button to open Atril / Chords immediately */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-400/10 border border-amber-400/30">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono font-bold text-amber-300">
                ¿Necesitas ver los acordes y la letra completa para tocar?
              </span>
            </div>
            <button
              onClick={() => setViewMode('atril')}
              className="px-3 py-1.5 rounded-xl bg-amber-400 text-neutral-950 hover:bg-amber-300 text-xs font-mono font-black cursor-pointer shadow-md transition-all active:scale-95"
            >
              Abrir Atril 📜
            </button>
          </div>

          {/* Middle Body: Structure Pills & Instrument Notes */}
          <div className="space-y-6">
            {/* Song Structure Flow */}
            <div>
              <label className="block text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider mb-2.5">
                Estructura & Dinámica del Tema
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {estructuraPills.map((sec, sIdx) => (
                  <div
                    key={sIdx}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#22211f] border border-[#33312c] text-xs font-mono font-bold text-zinc-200 shadow-sm"
                  >
                    <span className="text-amber-400 text-[10px]">0{sIdx + 1}</span>
                    <span>{sec}</span>
                    {sIdx < estructuraPills.length - 1 && (
                      <span className="text-neutral-600 font-normal">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Instrument Specific Advice / Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Focus Note */}
              <div className="p-4 rounded-2xl bg-[#1a1918] border border-[#2a2825] space-y-2">
                <label className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" /> Enfoque / Detalle para este ensayo
                </label>
                <textarea
                  rows={2}
                  placeholder="Escribe anotaciones para la banda (ej. entrada con slap, cuidar coros, acento al final)..."
                  value={currentItem?.enfoque || ''}
                  onChange={e => handleUpdateCurrentNote(e.target.value)}
                  className="w-full bg-transparent text-sm text-zinc-100 font-mono outline-none resize-none border-b border-transparent focus:border-amber-400 transition-colors"
                />
              </div>

              {/* Quick Musician Cheatsheet */}
              <div className="p-4 rounded-2xl bg-[#1a1918] border border-[#2a2825] space-y-2">
                <label className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-amber-400" /> Afinación & Arreglos
                </label>
                <p className="text-xs text-neutral-300 font-mono">
                  {currentSong?.afinacion ? `Afinación: ${currentSong.afinacion}` : 'Afinación estándar (E A D G B E)'}
                  {currentSong?.guiaSustituto?.capoTraste ? ` • Capo: ${currentSong.guiaSustituto.capoTraste}` : ''}
                </p>
                {currentSong?.guiaSustituto?.progresionClave && (
                  <p className="text-xs text-amber-300 font-mono truncate">
                    Progresión: {currentSong.guiaSustituto.progresionClave}
                  </p>
                )}
                {currentSong?.notasInternas && (
                  <p className="text-xs text-neutral-400 italic line-clamp-2">
                    "{currentSong.notasInternas}"
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Metronome Embedded Strip (100% Mobile Responsive) */}
          <div className="p-3 sm:p-4 rounded-2xl bg-[#161514] border border-[#2e2d2a] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setIsMetronomeActive(!isMetronomeActive)}
                className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md ${
                  isMetronomeActive
                    ? 'bg-rose-500 text-white hover:bg-rose-400 shadow-rose-500/20'
                    : 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400 shadow-emerald-500/20'
                }`}
              >
                {isMetronomeActive ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{isMetronomeActive ? 'Parar Clic' : 'Activar Clic'}</span>
              </button>

              {/* Visual Beat Indicator Dots */}
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800">
                {Array.from({ length: beatsPerBar }).map((_, bIdx) => (
                  <div
                    key={bIdx}
                    className={`w-3 h-3 rounded-full transition-all duration-75 ${
                      isMetronomeActive && currentBeat === bIdx
                        ? bIdx === 0
                          ? 'bg-rose-500 scale-125 shadow-lg shadow-rose-500/50'
                          : 'bg-amber-400 scale-125 shadow-lg shadow-amber-400/50'
                        : 'bg-neutral-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* BPM Controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setBpm(Math.max(40, bpm - 5))}
                className="px-2 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white font-mono text-xs cursor-pointer"
              >
                -5
              </button>
              <button
                onClick={() => setBpm(Math.max(40, bpm - 1))}
                className="px-2 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white font-mono text-xs cursor-pointer"
              >
                -1
              </button>

              <span className="font-mono font-black text-base sm:text-lg text-amber-400 px-1 sm:px-2">
                {bpm} <span className="text-[10px] text-neutral-500">BPM</span>
              </span>

              <button
                onClick={() => setBpm(Math.min(280, bpm + 1))}
                className="px-2 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white font-mono text-xs cursor-pointer"
              >
                +1
              </button>
              <button
                onClick={() => setBpm(Math.min(280, bpm + 5))}
                className="px-2 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white font-mono text-xs cursor-pointer"
              >
                +5
              </button>

              <button
                onClick={handleTapTempo}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40 hover:bg-amber-400/30 text-xs font-mono font-bold cursor-pointer active:scale-90 transition-transform"
              >
                Tap
              </button>
            </div>
          </div>

          {/* Bottom Bar: 1-Tap Evaluation & Track Switcher (100% Mobile Responsive) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#2a2825]">
            {/* 1-Tap Evaluation Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
              <span className="text-xs font-mono text-neutral-400 uppercase mr-1 hidden xs:inline">
                Evaluación:
              </span>

              <button
                onClick={() => handleSetEvaluation('bordada')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  currentItem?.evaluacion === 'bordada'
                    ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                }`}
              >
                <span>🟢</span>
                <span>Bordada</span>
              </button>

              <button
                onClick={() => handleSetEvaluation('regular')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  currentItem?.evaluacion === 'regular'
                    ? 'bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/20'
                    : 'bg-amber-400/15 text-amber-300 border border-amber-400/30 hover:bg-amber-400/25'
                }`}
              >
                <span>🟡</span>
                <span>Regular</span>
              </button>

              <button
                onClick={() => handleSetEvaluation('repetir')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  currentItem?.evaluacion === 'repetir'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25'
                }`}
              >
                <span>🔴</span>
                <span>Repetir</span>
              </button>
            </div>

            {/* Previous / Next Song Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                disabled={activeIndex === 0}
                onClick={() => setActiveIndex(prev => prev - 1)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl bg-neutral-800 text-neutral-200 hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-neutral-800 font-mono font-bold text-xs cursor-pointer transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <button
                disabled={activeIndex === agenda.length - 1}
                onClick={() => setActiveIndex(prev => prev + 1)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-5 py-2.5 rounded-xl bg-amber-400 text-neutral-950 hover:bg-amber-300 disabled:opacity-30 font-mono font-black text-xs cursor-pointer transition-all shadow-md shadow-amber-400/20"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: MODO ATRIL COMPLETO (TELEPROMPTER / CIFRADO & LETRA) */}
      {viewMode === 'atril' && (
        <div className={`flex flex-col ${isFullscreen ? 'flex-1 min-h-0 overflow-hidden space-y-2' : 'space-y-4'}`}>
          {/* Atril Control Toolbar (100% Mobile Responsive) */}
          <div className="p-2 sm:p-3.5 rounded-2xl bg-[#161514] border border-[#2c2a27] shadow-xl flex flex-wrap items-center justify-between gap-2 shrink-0">
            {/* Left: Metronome click & Tempo pulse */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMetronomeActive(!isMetronomeActive)}
                className={`p-2 rounded-xl font-mono text-xs font-bold cursor-pointer transition-all ${
                  isMetronomeActive
                    ? 'bg-rose-500 text-white'
                    : 'bg-emerald-500 text-neutral-950'
                }`}
                title="Metrónomo Clic"
              >
                {isMetronomeActive ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Visual Flash */}
              <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 font-mono text-xs text-amber-400 font-bold">
                <span>{bpm} BPM</span>
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    isMetronomeActive && currentBeat === 0
                      ? 'bg-rose-500 scale-125'
                      : isMetronomeActive
                      ? 'bg-amber-400'
                      : 'bg-neutral-700'
                  }`}
                />
              </div>
            </div>

            {/* Middle: Auto-Scroll & Speed */}
            <div className="flex items-center gap-1.5 bg-[#1f1e1c] p-1 rounded-xl border border-[#33312c]">
              <button
                onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
                  isAutoScrolling
                    ? 'bg-amber-400 text-neutral-950 animate-pulse'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                {isAutoScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isAutoScrolling ? 'Pausar' : 'Auto-Scroll'}</span>
              </button>

              {/* Speed Switcher */}
              <div className="flex items-center gap-0.5">
                {[1, 2, 3].map(spd => (
                  <button
                    key={spd}
                    onClick={() => setScrollSpeed(spd)}
                    className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold cursor-pointer ${
                      scrollSpeed === spd
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Transpose & Notation & Font Size Controls */}
            <div className="flex items-center gap-2">
              {/* Transpose */}
              <div className="flex items-center gap-1 bg-[#1f1e1c] px-2 py-1 rounded-xl border border-[#33312c]">
                <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase mr-0.5">
                  Tono:
                </span>
                <button
                  onClick={() => setTranspose(t => t - 1)}
                  className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 hover:text-white text-xs font-mono font-bold cursor-pointer"
                >
                  -1
                </button>
                <span className="text-xs font-mono font-bold text-amber-400 px-1">
                  {transpose === 0 ? 'Orig' : transpose > 0 ? `+${transpose}` : transpose}
                </span>
                <button
                  onClick={() => setTranspose(t => t + 1)}
                  className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 hover:text-white text-xs font-mono font-bold cursor-pointer"
                >
                  +1
                </button>
              </div>

              {/* Notation ES/EN */}
              <button
                onClick={() => setNotation(n => (n === 'ES' ? 'EN' : 'ES'))}
                className="px-2 py-1.5 rounded-xl bg-[#1f1e1c] border border-[#33312c] text-xs font-mono text-neutral-300 hover:text-white font-bold cursor-pointer"
                title="Cambiar notación Do-Re-Mi vs C-D-E"
              >
                {notation}
              </button>

              {/* Font Size */}
              <div className="flex items-center gap-0.5 bg-[#1f1e1c] p-1 rounded-xl border border-[#33312c]">
                <button
                  onClick={() => setFontSizeIndex(i => Math.max(0, i - 1))}
                  className="px-1.5 py-0.5 text-xs font-mono text-neutral-400 hover:text-white cursor-pointer"
                  title="Reducir fuente"
                >
                  A-
                </button>
                <button
                  onClick={() => setFontSizeIndex(i => Math.min(FONT_SIZE_CLASSES.length - 1, i + 1))}
                  className="px-1.5 py-0.5 text-xs font-mono text-amber-400 font-bold hover:text-amber-300 cursor-pointer"
                  title="Aumentar fuente"
                >
                  A+
                </button>
              </div>

              {/* Toggle Chord Boxes */}
              <button
                onClick={() => setShowChordDiagrams(!showChordDiagrams)}
                className={`p-2 rounded-xl text-xs font-mono cursor-pointer border transition-all ${
                  showChordDiagrams
                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                    : 'bg-[#1f1e1c] text-neutral-400 border-[#33312c] hover:text-white'
                }`}
                title="Ver diagramas de acordes de guitarra"
              >
                🎸
              </button>

              {/* Edit Chords in Studio Modal */}
              {currentSong && (
                <button
                  onClick={() => setEditingSongModal(currentSong)}
                  className="p-2 rounded-xl bg-[#1f1e1c] border border-[#33312c] text-neutral-400 hover:text-amber-400 transition-all cursor-pointer"
                  title="Editar letra y acordes"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Guitar Chord Shapes Drawer (if open) */}
          {showChordDiagrams && uniqueChords.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-[#141413] border border-[#2a2825] space-y-2 animate-fade-in shrink-0">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-400 uppercase">
                <span>Diagramas de Acordes de este Tema ({uniqueChords.length})</span>
                <button
                  onClick={() => setShowChordDiagrams(false)}
                  className="text-neutral-500 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {uniqueChords.map((chord, cIdx) => (
                  <ChordDiagramBox key={cIdx} chord={chord} />
                ))}
              </div>
            </div>
          )}

          {/* Teleprompter Chords Sheet Card */}
          <div className={`rounded-2xl sm:rounded-3xl bg-[#0f0f0e] border-2 border-[#262522] shadow-2xl p-3.5 sm:p-6 relative flex flex-col ${isFullscreen ? 'flex-1 min-h-0 overflow-hidden' : ''}`}>
            {/* Header Song Info */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#242321] pb-3 mb-3 shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase">
                    Pista {activeIndex + 1} de {agenda.length}
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-mono text-neutral-400">
                    (Desliza o pulsa flechas para pasar de tema)
                  </span>
                </div>
                <h2 className="text-lg sm:text-2xl font-display font-black text-white">
                  {currentItem?.titulo}
                </h2>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2 py-1 rounded-xl bg-[#1c1b1a] border border-[#2e2d2a] text-amber-400 font-bold">
                  Tonalidad: {currentSong?.tonalidad || 'Am'}
                </span>
                <span className="px-2 py-1 rounded-xl bg-[#1c1b1a] border border-[#2e2d2a] text-zinc-300">
                  {currentSong?.afinacion || 'Standard E'}
                </span>
                <span className="px-2 py-1 rounded-xl bg-[#1c1b1a] border border-[#2e2d2a] text-neutral-400">
                  ⏱ {formatTime(trackSeconds)}
                </span>
              </div>
            </div>

            {/* Scrollable Chord Content Container */}
            <div
              ref={atrilScrollRef}
              className={`overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neutral-800 space-y-1 font-mono select-text ${FONT_SIZE_CLASSES[fontSizeIndex]} ${isFullscreen ? 'flex-1 min-h-0' : 'max-h-[60vh]'}`}
            >
              {renderFormattedChords(rawChordText, transpose, notation)}
            </div>

            {/* Bottom Bar inside Atril: 1-Tap Evaluation & Quick Next/Previous */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 mt-3 border-t border-[#242321] shrink-0">
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  onClick={() => handleSetEvaluation('bordada')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    currentItem?.evaluacion === 'bordada'
                      ? 'bg-emerald-500 text-neutral-950 font-black'
                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  <span>🟢 Bordada</span>
                </button>

                <button
                  onClick={() => handleSetEvaluation('regular')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    currentItem?.evaluacion === 'regular'
                      ? 'bg-amber-400 text-neutral-950 font-black'
                      : 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                  }`}
                >
                  <span>🟡 Regular</span>
                </button>

                <button
                  onClick={() => handleSetEvaluation('repetir')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    currentItem?.evaluacion === 'repetir'
                      ? 'bg-rose-500 text-white font-black'
                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  <span>🔴 Repetir</span>
                </button>
              </div>

              {/* Middle swipe hint indicator */}
              <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-neutral-500">
                <span>👈 Desliza para cambiar 👉</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  disabled={activeIndex === 0}
                  onClick={() => setActiveIndex(prev => prev - 1)}
                  className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white text-xs font-mono font-bold disabled:opacity-30 cursor-pointer transition-all"
                >
                  ← Anterior
                </button>

                <button
                  disabled={activeIndex === agenda.length - 1}
                  onClick={() => setActiveIndex(prev => prev + 1)}
                  className="flex-1 sm:flex-none px-4 py-1.5 rounded-xl bg-amber-400 text-neutral-950 hover:bg-amber-300 text-xs font-mono font-black shadow-md disabled:opacity-30 cursor-pointer transition-all"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chords Viewer & Editor Modal */}
      {editingSongModal && (
        <SongChordsViewerModal
          song={editingSongModal}
          onClose={() => setEditingSongModal(null)}
          onUpdateSong={updated => {
            if (onUpdateSong) {
              onUpdateSong(updated);
            }
            setEditingSongModal(null);
          }}
        />
      )}
    </div>
  );
}

// RENDER CHORDS WITH HIGHLIGHTING & SECTION BADGES
function renderFormattedChords(text: string, transpose: number, notation: 'ES' | 'EN') {
  if (!text) return null;

  const lines = text.split('\n');

  return lines.map((rawLine, idx) => {
    const line = rawLine.trimEnd();

    // Empty line spacer
    if (!line.trim()) {
      return <div key={idx} className="h-3" />;
    }

    // Section header e.g. [Intro], [Verso 1], [Estribillo], [Solo], [Puente], [Outro]
    if (line.trim().startsWith('[') && line.trim().endsWith(']')) {
      return (
        <div key={idx} className="pt-3 pb-1">
          <span className="inline-flex items-center px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-black uppercase tracking-wider shadow-sm">
            {line.trim()}
          </span>
        </div>
      );
    }

    // Check if line contains chords or is a pure chords line
    const processedLine = processChordText(line, transpose, notation);

    return (
      <div 
        key={idx} 
        className="text-zinc-200 py-0.5 leading-relaxed tracking-wide"
        dangerouslySetInnerHTML={{ __html: processedLine }}
      />
    );
  });
}

// COMPONENT TO RENDER A SINGLE GUITAR CHORD BOX/FRETBOARD DIAGRAM
const ChordDiagramBox: React.FC<{ chord: string }> = ({ chord }) => {
  const shape: GuitarChordShape | undefined = GUITAR_CHORD_DATABASE[chord];

  return (
    <div className="bg-black/60 p-2 rounded-xl border border-neutral-800 text-center space-y-1 hover:border-amber-500/40 transition">
      <div className="text-xs font-bold text-amber-400 font-mono flex items-center justify-center gap-1">
        <span>{chord}</span>
      </div>

      {shape ? (
        <div className="flex justify-center pt-0.5">
          <div className="w-20 bg-neutral-900 border border-neutral-700 p-1 rounded text-[8px] font-mono">
            {shape.baseFret && shape.baseFret > 1 && (
              <div className="text-[7px] text-amber-400 font-bold text-left pl-0.5">
                Tr. {shape.baseFret}
              </div>
            )}
            <div className="grid grid-cols-6 gap-0.5 my-0.5 text-neutral-400 border-b border-neutral-600 pb-0.5 text-[7px]">
              {['E', 'A', 'D', 'G', 'B', 'E'].map((s, i) => (
                <span key={i} className="text-center">{s}</span>
              ))}
            </div>

            <div className="grid grid-cols-6 gap-0.5 my-0.5">
              {shape.frets.map((fret, stringIdx) => (
                <div key={stringIdx} className="flex flex-col items-center">
                  <span className={`font-bold ${
                    fret === -1 ? 'text-rose-400' : fret === 0 ? 'text-emerald-400' : 'text-amber-300'
                  }`}>
                    {fret === -1 ? 'x' : fret === 0 ? 'o' : fret}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-[9px] text-neutral-500 font-mono">
          [Acorde]
        </p>
      )}
    </div>
  );
};

// SAMPLE DEFAULT CHORD SHEETS FOR SONGS WITHOUT CUSTOM CHORD TEXT
function getSampleCifrado(title: string): string {
  return `[Intro]
Lam   Fa   Sol   Lam
Lam   Fa   Sol   Lam

[Verso 1]
Lam                Fa
Arrancamos la noche en la ciudad
Sol                 Lam
Buscando el sonido de la libertad
Lam                Fa
Guitarras encendidas y el viento a favor
Sol                 Lam
Marcando el ritmo con el corazón.

[Estribillo]
Do                 Sol
Siente la fuerza del rock en las venas
Rem                Lam
Rompiendo juntos todas las cadenas
Do                 Sol
Noche de ensayo, fuego y pasión
Fa                 Sol        Lam
Cantando juntos la misma canción.

[Solo de Guitarra]
Fa   Sol   Lam   Lam
Fa   Sol   Lam   Lam

[Outro]
Fa        Sol        Lam
Cierre con final seco en Lam!`;
}
