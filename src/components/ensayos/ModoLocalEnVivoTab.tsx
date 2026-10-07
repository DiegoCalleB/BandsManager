import React, { useState, useEffect, useRef, useMemo } from "react";
import { ControlAutoscroll } from "../chords/ControlAutoscroll";
import { useAutoScroll } from "../../hooks/useAutoScroll";
import { tonalidadDelCifrado } from "../../utils/vistaAcordes";
import { useVistaAcordes } from "../chords/AcordeEnInstrumento";
import { DrawerDiagramas } from "../chords/DrawerDiagramas";
import { useAcordesDeLaHoja } from "../../hooks/useAcordesDeLaHoja";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Disc3,
  Clock,
  Sparkles,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ThumbsUp,
  Flame,
  Music,
  Maximize2,
  Minimize2,
  FileText,
  CheckSquare,
  List,
  BookOpen,
  Sliders,
  Type,
  ArrowDown,
  Edit3,
  X,
  Eye,
} from "lucide-react";
import {
  Rehearsal,
  RehearsalAgendaItem,
  Song,
  ThemeColors,
  SongSubstituteGuide,
} from "../../types";
import { formatTime } from "./EnsayoCronometro";
import {
  processChordText,
  transposeChordToken,
} from "../../utils/chordUtils";
import { SongChordsViewerModal } from "../SongChordsViewerModal";
import { ShowIcon } from '../ui/ShowIcon';
import { Button, IconButton } from '../ui';
import { programarClic } from '../../utils/clicMetronomo';

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
  onUpdateSong,
}: ModoLocalEnVivoTabProps) {
  const agenda = rehearsal.agenda || [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [vistaAcordes, setVistaAcordes] = useVistaAcordes();

  const currentItem = agenda[activeIndex] || null;
  const currentSong = currentItem?.songId
    ? songs.find((s) => s.id === currentItem.songId)
    : null;

  // View Mode:'escenario' (metrics, structure, notes) vs'atril' (chords & lyrics teleprompter)
  const [viewMode, setViewMode] = useState<"escenario" | "atril">("escenario");

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
  const [timeSignature, setTimeSignature] = useState<
    "4/4" | "3/4" | "6/8" | "2/4"
  >("4/4");
  const [currentBeat, setCurrentBeat] = useState(0);

  // Web Audio Context for Metronome
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);
  const tapTimesRef = useRef<number[]>([]);

  // Atril Mode State: Transpose, Notation, Font Size, Auto-Scroll, Diagrams
  const [transpose, setTranspose] = useState<number>(0);
  const [notation, setNotation] = useState<"ES" | "EN">("ES");
  const [fontSizeIndex, setFontSizeIndex] = useState<number>(1); // 0=sm, 1=md, 2=lg, 3=xl
  const [showChordDiagrams, setShowChordDiagrams] = useState<boolean>(false);
  const [showSubstituteGuideTab, setShowSubstituteGuideTab] =
    useState<boolean>(false);
  const [editingSongModal, setEditingSongModal] = useState<Song | null>(null);
  const atrilScrollRef = useRef<HTMLDivElement>(null);
  const autoScroll = useAutoScroll(atrilScrollRef, 1, viewMode === "atril");

  // Swipe and Keyboard Gestures
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);
  const touchDeltaY = useRef<number>(0);
  const [swipeToast, setSwipeToast] = useState<{
    text: string;
    dir: "left" | "right";
  } | null>(null);

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
        setSwipeToast({
          text: `Pista ${nextIdx + 1}: ${agenda[nextIdx]?.titulo || ""}`,
          dir: "left",
        });
        setTimeout(() => setSwipeToast(null), 1000);
      } else if (dx > 0 && activeIndex > 0) {
        // Swipe Right -> Previous Song
        const prevIdx = activeIndex - 1;
        setActiveIndex(prevIdx);
        setSwipeToast({
          text: `Pista ${prevIdx + 1}: ${agenda[prevIdx]?.titulo || ""}`,
          dir: "right",
        });
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
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName))
        return;

      if (e.key === "ArrowRight" || e.key === "PageDown") {
        if (activeIndex < agenda.length - 1) {
          e.preventDefault();
          setActiveIndex((prev) => prev + 1);
        }
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        if (activeIndex > 0) {
          e.preventDefault();
          setActiveIndex((prev) => prev - 1);
        }
      } else if (e.key === " " && viewMode === "atril") {
        e.preventDefault();
        autoScroll.alternar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, agenda.length, viewMode]);

  // Font sizes classes for Atril mode
  const FONT_SIZE_CLASSES = [
    "text-xs sm:text-sm leading-relaxed",
    "text-sm sm:text-base leading-relaxed",
    "text-base sm:text-xl leading-relaxed",
    "text-lg sm:text-2xl leading-loose font-medium",
  ];

  // Wake Lock handler to prevent phone screen from turning off in rehearsals
  useEffect(() => {
    async function requestWakeLock() {
      if ("wakeLock" in navigator && (isFullscreen || isTrackTimerActive)) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request(
            "screen",
          );
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
    autoScroll.setActivo(false);
  }, [activeIndex, currentSong?.bpm]);

  // Track Timer Interval
  useEffect(() => {
    if (isTrackTimerActive) {
      trackTimerRef.current = window.setInterval(() => {
        setTrackSeconds((prev) => prev + 1);
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
  const beatsPerBar =
    timeSignature === "3/4"
      ? 3
      : timeSignature === "6/8"
        ? 6
        : timeSignature === "2/4"
          ? 2
          : 4;

  const playClick = (time: number, isAccent: boolean) => {
    if (!audioCtxRef.current) return;
    programarClic(audioCtxRef.current, time, isAccent, 0.7);
  };

  useEffect(() => {
    if (!isMetronomeActive) {
      if (timerIDRef.current) clearInterval(timerIDRef.current);
      setCurrentBeat(0);
      return;
    }

    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === "suspended") {
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
      const avgInterval =
        intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 40 && calculatedBpm <= 280) {
        setBpm(calculatedBpm);
      }
    }
  };

  // Evaluation Handler
  const handleSetEvaluation = (
    evaluacion: "bordada" | "regular" | "repetir",
  ) => {
    if (!currentItem) return;
    const newAgenda = agenda.map((a) =>
      a.id === currentItem.id ? { ...a, evaluacion } : a,
    );
    onUpdateRehearsal({ agenda: newAgenda });
  };

  // Note handler for current item
  const handleUpdateCurrentNote = (nota: string) => {
    if (!currentItem) return;
    const newAgenda = agenda.map((a) =>
      a.id === currentItem.id ? { ...a, enfoque: nota } : a,
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

  // Current chord text
  // Sin cifrado guardado se muestra vacío: antes caía en una letra
  // de ejemplo escrita en el código que parecía la letra de la canción.
  const rawChordText = currentSong?.cifradoTexto || "";
  const tonalidadHoja = useMemo(() => tonalidadDelCifrado(rawChordText, currentSong?.tonalidad), [rawChordText, currentSong?.tonalidad]);
  const { acordes: uniqueChords, contexto: contextoAcordes } = useAcordesDeLaHoja(rawChordText, tonalidadHoja, 0);

  if (agenda.length === 0) {
    return (
      <div className="p-8 sm:p-12 text-center bg-[var(--surface)] rounded-[var(--r-l)] space-y-4">
        <Disc3 className="w-12 h-12 text-[var(--ink-2)] mx-auto animate-spin-slow" />
        <h3 className="text-base font-bold text-[var(--ink)]">
          Orden del día vacío: añade lo que vais a tocar
        </h3>
        <p className="text-xs text-[var(--ink-2)] max-w-md mx-auto">
          Ve a la pestaña “1. Orden del día” para añadir canciones y bloques
          antes de activar el modo local.
        </p>
      </div>
    );
  }

  // Get structure pills
  const estructuraPills = currentSong?.guiaSustituto?.estructura
    ? currentSong.guiaSustituto.estructura.split(",").map((s) => s.trim())
    : [
        "Intro",
        "Estrofa 1",
        "Estribillo",
        "Estrofa 2",
        "Solo",
        "Estribillo Final",
        "Outro",
      ];


  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`animate-fade-in select-none ${
        isFullscreen
          ? "fixed inset-0 z-[9999] bg-[var(--bg)] h-[100dvh] max-h-[100dvh] w-screen max-w-full overflow-hidden flex flex-col p-2 sm:p-3 justify-between"
          : "space-y-4"
      }`}
    >
      {/* Swipe Feedback Toast */}
      {swipeToast && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-[var(--r-l)] font-sans text-xs font-bold flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150 ${
            swipeToast.dir === "left"
              ? "bg-[var(--ink)] text-[var(--bg)]"
              : "bg-[var(--ok)] text-[var(--on-ok)]"
          }`}
        >
          <span>{swipeToast.dir === "left" ? "⏩" : "⏪"}</span>
          <span>{swipeToast.text}</span>
        </div>
      )}

      {/* Top Session Progress Bar & Track Selector Carousel */}
      <div
        className={`flex items-center justify-between gap-2 p-1.5 sm:p-2 rounded-[var(--r-l)] bg-[var(--surface)] ${isFullscreen ? "shrink-0 mb-1.5" : ""}`}
      >
        <div className="flex items-center gap-1.5 overflow-x-auto shrink-0 py-0.5 px-1 scrollbar-none flex-1">
          {agenda.map((item, idx) => {
            const isCurrent = idx === activeIndex;
            return (
              <button
                key={item.id}
                onClick={() => setActiveIndex(idx)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-[var(--r-pill)] font-sans text-xs whitespace-nowrap transition-ui cursor-pointer ${
                  isCurrent
                    ? "bg-[var(--ink)] text-[var(--bg)] font-bold scale-102"
                    : item.evaluacion === "bordada"
                      ? "bg-[var(--ok)]/20 text-[var(--ink)]"
                      : item.evaluacion === "repetir"
                        ? "bg-[var(--alert)]/20 text-[var(--ink)]"
                        : "bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]"
                }`}
              >
                <span>{idx + 1}.</span>
                <span className="truncate max-w-[90px] sm:max-w-[140px]">
                  {item.titulo}
                </span>
                {item.evaluacion === "bordada" && <span><ShowIcon inline emoji="🟢" /></span>}
                {item.evaluacion === "regular" && <span><ShowIcon inline emoji="🟡" /></span>}
                {item.evaluacion === "repetir" && <span><ShowIcon inline emoji="🔴" /></span>}
              </button>
            );
          })}
        </div>

        {/* View Switcher Buttons + Fullscreen Toggle */}
        <div className="flex items-center gap-1.5 shrink-0 pl-1">
          {/* Toggle Escenario vs Atril */}
          <div className="flex items-center p-0.5 bg-[var(--sunken)] rounded-[var(--r-m)]">
            <Button
              variant={viewMode === "escenario" ? "selected" : "ghost"}
              size="xs"
              onClick={() => setViewMode("escenario")}
              className="items-center gap-1"
              title="Vista escenario y estructura"
            >
              <Flame className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Ficha</span>
            </Button>

            <Button
              variant={viewMode === "atril" ? "selected" : "ghost"}
              size="xs"
              onClick={() => setViewMode("atril")}
              className="items-center gap-1"
              title="Modo atril / acordes y letra (Teleprompter)"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Atril / acordes</span>
            </Button>
          </div>

          {/* Fullscreen Button */}
          <Button
            variant="neutral"
            size="sm"
            onClick={toggleFullscreen}
            title={
              isFullscreen
                ? "Salir de pantalla completa"
                : "Ver a pantalla completa"
            }
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-[var(--acc)]" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* VIEW MODE 1: FICHA DE ESCENARIO & DINÁMICA */}
      {viewMode === "escenario" && (
        <div className="p-4 sm:p-7 rounded-[var(--r-l)] bg-[var(--surface)] relative overflow-hidden space-y-6">
          {/* Subtle stage spotlight effect */}

          {/* Top Header: Track Title & Musical Meta (100% Mobile Responsive) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-[var(--r-pill)] text-micro sm:text-xs font-sans font-bold bg-[var(--acc)] text-[var(--on-acc)]">
                  Pista {activeIndex + 1} de {agenda.length}
                </span>
                <span className="text-xs font-sans text-[var(--ink-2)]">
                  {currentItem?.tipo.replace("_", "")}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-display font-black text-[var(--ink)] tracking-tight truncate">
                {currentItem?.titulo}
              </h1>
            </div>

            {/* Key, BPM & Stopwatch Badges (Grid on Mobile) */}
            <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-3">
              <div className="p-2.5 sm:p-4 rounded-[var(--r-l)] bg-[var(--sunken)] text-center min-w-[75px] sm:min-w-[90px]">
                <span className="block text-micro sm:text-micro font-sans text-[var(--ink-2)] font-bold">
                  Tonalidad
                </span>
                <span className="text-lg sm:text-3xl font-sans font-black text-[var(--acc)]">
                  {currentSong?.tonalidad || "—"}
                </span>
              </div>

              <div className="p-2.5 sm:p-4 rounded-[var(--r-l)] bg-[var(--sunken)] text-center min-w-[75px] sm:min-w-[90px]">
                <span className="block text-micro sm:text-micro font-sans text-[var(--ink-2)] font-bold">
                  Tempo
                </span>
                <span className="text-lg sm:text-3xl font-sans font-black text-[var(--acc)]">
                  {bpm}{" "}
                  <span className="text-micro text-[var(--ink-2)] font-normal">
                    BPM
                  </span>
                </span>
              </div>

              <div className="p-2.5 sm:p-4 rounded-[var(--r-l)] bg-[var(--sunken)] text-center min-w-[85px] sm:min-w-[100px]">
                <span className="block text-micro sm:text-micro font-sans text-[var(--ink-2)] font-bold flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-[var(--acc)]" /> Tiempo
                </span>
                <span className="text-lg sm:text-3xl font-sans font-black text-[var(--ink)]">
                  {formatTime(trackSeconds)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action: Button to open Atril / Chords immediately */}
          <div className="flex items-center justify-between p-3 rounded-[var(--r-l)] bg-[var(--acc)]">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[var(--acc)]" />
              <span className="text-xs font-sans font-bold text-[var(--acc)]/70">
                ¿Necesitas ver los acordes y la letra completa para tocar?
              </span>
            </div>
            <Button
              variant="primary"
              size="xs"
              onClick={() => setViewMode("atril")}
            >
              Abrir atril <ShowIcon inline emoji="📜" />
            </Button>
          </div>

          {/* Middle Body: Structure Pills & Instrument Notes */}
          <div className="space-y-6">
            {/* Song Structure Flow */}
            <div>
              <label className="block text-xs font-sans font-bold text-[var(--ink-2)] mb-2.5">
                Estructura y dinámica del tema
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {estructuraPills.map((sec, sIdx) => (
                  <div
                    key={sIdx}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--sunken)] text-xs font-sans font-bold text-[var(--ink)]"
                  >
                    <span className="text-[var(--acc)] text-micro">
                      0{sIdx + 1}
                    </span>
                    <span>{sec}</span>
                    {sIdx < estructuraPills.length - 1 && (
                      <span className="text-[var(--ink-2)] font-normal">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Instrument Specific Advice / Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Focus Note */}
              <div className="p-4 rounded-[var(--r-l)] bg-[var(--sunken)] space-y-2">
                <label className="text-xs font-sans font-bold text-[var(--acc)] flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" /> Enfoque / Detalle para este
                  ensayo
                </label>
                <textarea data-raw
                  rows={2}
                  placeholder="Escribe anotaciones para la banda (ej. entrada con slap, cuidar coros, acento al final)…"
                  value={currentItem?.enfoque || ""}
                  onChange={(e) => handleUpdateCurrentNote(e.target.value)}
                  className="w-full bg-transparent text-sm text-[var(--ink)] font-sans outline-none resize-none focus:transition-colors"
                />
              </div>

              {/* Quick Musician Cheatsheet */}
              <div className="p-4 rounded-[var(--r-l)] bg-[var(--sunken)] space-y-2">
                <label className="text-xs font-sans font-bold text-[var(--ink-2)] flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-[var(--acc)]" /> Afinación
                  y arreglos
                </label>
                <p className="text-xs text-[var(--ink-2)] font-sans">
                  {currentSong?.afinacion
                    ? `Afinación: ${currentSong.afinacion}`
                    : "Afinación estándar (E A D G B E)"}
                  {currentSong?.guiaSustituto?.capoTraste
                    ? ` • Capo: ${currentSong.guiaSustituto.capoTraste}`
                    : ""}
                </p>
                {currentSong?.guiaSustituto?.progresionClave && (
                  <p className="text-xs text-[var(--acc)]/70 font-sans truncate">
                    Progresión: {currentSong.guiaSustituto.progresionClave}
                  </p>
                )}
                {currentSong?.notasInternas && (
                  <p className="text-xs text-[var(--ink-2)] italic line-clamp-2">
                    "{currentSong.notasInternas}"
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Metronome Embedded Strip (100% Mobile Responsive) */}
          <div className="p-3 sm:p-4 rounded-[var(--r-l)] bg-[var(--sunken)] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant={isMetronomeActive ? "danger" : "primary"}
                size="sm"
                onClick={() => setIsMetronomeActive(!isMetronomeActive)}
                className="items-center gap-2"
              >
                {isMetronomeActive ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
                <span>{isMetronomeActive ? "Parar Clic" : "Activar Clic"}</span>
              </Button>

              {/* Visual Beat Indicator Dots */}
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--r-m)] bg-[var(--surface)]">
                {Array.from({ length: beatsPerBar }).map((_, bIdx) => (
                  <div
                    key={bIdx}
                    className={`w-3 h-3 rounded-[var(--r-pill)] transition-ui duration-75 ${
                      isMetronomeActive && currentBeat === bIdx
                        ? bIdx === 0
                          ? "bg-[var(--alert)] scale-125"
                          : "bg-[var(--acc)] scale-125"
                        : "bg-[var(--surface)]/70"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* BPM Controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setBpm(Math.max(40, bpm - 5))}
                className="px-2 py-1.5 rounded-[var(--r-pill)] bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] font-sans text-xs cursor-pointer"
              >
                -5
              </button>
              <button
                onClick={() => setBpm(Math.max(40, bpm - 1))}
                className="px-2 py-1.5 rounded-[var(--r-pill)] bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] font-sans text-xs cursor-pointer"
              >
                -1
              </button>

              <span className="font-sans font-bold text-base sm:text-lg text-[var(--acc)] px-1 sm:px-2">
                {bpm}{" "}
                <span className="text-micro text-[var(--ink-2)]">BPM</span>
              </span>

              <button
                onClick={() => setBpm(Math.min(280, bpm + 1))}
                className="px-2 py-1.5 rounded-[var(--r-pill)] bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] font-sans text-xs cursor-pointer"
              >
                +1
              </button>
              <button
                onClick={() => setBpm(Math.min(280, bpm + 5))}
                className="px-2 py-1.5 rounded-[var(--r-pill)] bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] font-sans text-xs cursor-pointer"
              >
                +5
              </button>

              <Button
                variant="primary"
                size="xs"
                onClick={handleTapTempo}
              >
                Tap
              </Button>
            </div>
          </div>

          {/* Bottom Bar: 1-Tap Evaluation & Track Switcher (100% Mobile Responsive) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            {/* 1-Tap Evaluation Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
              <span className="text-xs font-sans text-[var(--ink-2)] mr-1 hidden xs:inline">
                Evaluación:
              </span>

              <Button
                variant={currentItem?.evaluacion === "bordada" ? "primary" : "neutral"}
                size="sm"
                onClick={() => handleSetEvaluation("bordada")}
                className="flex-1 sm:flex-none items-center justify-center gap-1.5"
              >
                <span><ShowIcon inline emoji="🟢" /></span>
                <span>Bordada</span>
              </Button>

              <Button
                variant={currentItem?.evaluacion === "regular" ? "primary" : "primary"}
                size="sm"
                onClick={() => handleSetEvaluation("regular")}
                className="flex-1 sm:flex-none items-center justify-center gap-1.5"
              >
                <span><ShowIcon inline emoji="🟡" /></span>
                <span>Regular</span>
              </Button>

              <button
                onClick={() => handleSetEvaluation("repetir")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-[var(--r-pill)] text-xs font-sans font-bold transition-ui cursor-pointer ${
                  currentItem?.evaluacion === "repetir"
                    ? "bg-[var(--alert)] text-[var(--on-alert)]"
                    : "bg-[var(--alert)]/15 text-[var(--ink)] hover:bg-[var(--alert)]/25"
                }`}
              >
                <span><ShowIcon inline emoji="🔴" /></span>
                <span>Repetir</span>
              </button>
            </div>

            {/* Previous / Next Song Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                disabled={activeIndex === 0}
                onClick={() => setActiveIndex((prev) => prev - 1)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2.5 rounded-[var(--r-pill)] bg-[var(--surface)]/80 text-[var(--ink-2)] hover:bg-[var(--surface)]/70 disabled:opacity-30 disabled:hover:bg-[var(--surface)]/80 font-sans font-bold text-xs cursor-pointer transition-ui"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <Button
                variant="primary"
                disabled={activeIndex === agenda.length - 1}
                onClick={() => setActiveIndex((prev) => prev + 1)}
                className="flex-1 sm:flex-none items-center justify-center gap-1"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: MODO ATRIL COMPLETO (TELEPROMPTER / CIFRADO & LETRA) */}
      {viewMode === "atril" && (
        <div
          className={`flex flex-col ${isFullscreen ? "flex-1 min-h-0 overflow-hidden space-y-2" : "space-y-4"}`}
        >
          {/* Atril Control Toolbar (100% Mobile Responsive) */}
          <div className="p-2 sm:p-3.5 rounded-[var(--r-l)] bg-[var(--surface)] flex flex-wrap items-center justify-between gap-2 shrink-0">
            {/* Left: Metronome click & Tempo pulse */}
            <div className="flex items-center gap-2">
              <Button
                variant={isMetronomeActive ? "danger" : "primary"}
                size="sm"
                onClick={() => setIsMetronomeActive(!isMetronomeActive)}
                title="Metrónomo clic"
              >
                {isMetronomeActive ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>

              {/* Visual Flash */}
              <div className="flex items-center gap-1 px-2 py-1.5 rounded-[var(--r-s)] bg-[var(--sunken)] font-sans text-xs text-[var(--acc)] font-bold">
                <span>{bpm} BPM</span>
                <div
                  className={`w-2.5 h-2.5 rounded-[var(--r-pill)] transition-ui ${
                    isMetronomeActive && currentBeat === 0
                      ? "bg-[var(--alert)] scale-125"
                      : isMetronomeActive
                        ? "bg-[var(--acc)]"
                        : "bg-[var(--surface)]/70"
                  }`}
                />
              </div>
            </div>

            {/* Middle: Auto-Scroll & Speed */}
            <ControlAutoscroll auto={autoScroll} velocidadSiempre />

            {/* Transpose & Notation & Font Size Controls */}
            <div className="flex items-center gap-2">
              {/* Transpose */}
              <div className="flex items-center gap-1 bg-[var(--sunken)] px-2 py-1 rounded-[var(--r-m)]">
                <span className="text-micro font-sans text-[var(--ink-2)] font-bold mr-0.5">
                  Tono:
                </span>
                <button
                  onClick={() => setTranspose((t) => t - 1)}
                  className="px-1.5 py-0.5 rounded bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] text-xs font-sans font-bold cursor-pointer"
                >
                  -1
                </button>
                <span className="text-xs font-sans font-bold text-[var(--acc)] px-1">
                  {transpose === 0
                    ? "Orig"
                    : transpose > 0
                      ? `+${transpose}`
                      : transpose}
                </span>
                <button
                  onClick={() => setTranspose((t) => t + 1)}
                  className="px-1.5 py-0.5 rounded bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] text-xs font-sans font-bold cursor-pointer"
                >
                  +1
                </button>
              </div>

              {/* Notation ES/EN */}
              <Button
                variant="neutral"
                size="xs"
                onClick={() => setNotation((n) => (n === "ES" ? "EN" : "ES"))}
                title="Cambiar notación Do-Re-Mi vs C-D-E"
              >
                {notation}
              </Button>

              {/* Font Size */}
              <div className="flex items-center gap-0.5 bg-[var(--sunken)] p-1 rounded-[var(--r-m)]">
                <button
                  onClick={() => setFontSizeIndex((i) => Math.max(0, i - 1))}
                  className="px-1.5 py-0.5 text-xs font-sans text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
                  title="Reducir fuente"
                >
                  A-
                </button>
                <button
                  onClick={() =>
                    setFontSizeIndex((i) =>
                      Math.min(FONT_SIZE_CLASSES.length - 1, i + 1),
                    )
                  }
                  className="px-1.5 py-0.5 text-xs font-sans text-[var(--acc)] font-bold hover:text-[var(--acc)]/70 cursor-pointer"
                  title="Aumentar fuente"
                >
                  A+
                </button>
              </div>

              {/* Toggle Chord Boxes */}
              <Button
                variant={showChordDiagrams ? "inverse" : "neutral"}
                size="sm"
                onClick={() => setShowChordDiagrams(!showChordDiagrams)}
                title="Ver diagramas de acordes de guitarra"
              >
                <ShowIcon inline emoji="🎸" />
              </Button>

              {/* Edit Chords in Studio Modal */}
              {currentSong && (
                <Button
                  variant="neutral"
                  size="sm"
                  onClick={() => setEditingSongModal(currentSong)}
                  title="Editar letra y acordes"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Guitar Chord Shapes Drawer (if open) */}
          {showChordDiagrams && uniqueChords.length > 0 && (
            <DrawerDiagramas
              disposicion="tira"
              acordes={uniqueChords}
              contexto={contextoAcordes}
              vista={vistaAcordes}
              onVista={setVistaAcordes}
              onCerrar={() => setShowChordDiagrams(false)}
            />
          )}

          {/* Teleprompter Chords Sheet Card */}
          <div
            className={`rounded-[var(--r-l)] sm:rounded-[var(--r-l)] bg-[var(--surface)] p-3.5 sm:p-6 relative flex flex-col ${isFullscreen ? "flex-1 min-h-0 overflow-hidden" : ""}`}
          >
            {/* Header Song Info */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-sans font-bold bg-[var(--acc)] text-[var(--on-acc)]">
                    Pista {activeIndex + 1} de {agenda.length}
                  </span>
                  <span className="hidden sm:inline-block text-micro font-sans text-[var(--ink-2)]">
                    (Desliza o pulsa flechas para pasar de tema)
                  </span>
                </div>
                <h2 className="text-lg sm:text-2xl font-display font-black text-[var(--ink)]">
                  {currentItem?.titulo}
                </h2>
              </div>

              <div className="flex items-center gap-2 text-xs font-sans">
                <span className="px-2 py-1 rounded-[var(--r-m)] bg-[var(--sunken)] text-[var(--acc)] font-bold">
                  Tonalidad: {currentSong?.tonalidad || "Am"}
                </span>
                <span className="px-2 py-1 rounded-[var(--r-m)] bg-[var(--sunken)] text-[var(--ink-2)]">
                  {currentSong?.afinacion || "Standard E"}
                </span>
                <span className="px-2 py-1 rounded-[var(--r-m)] bg-[var(--sunken)] text-[var(--ink-2)]">
                  <ShowIcon inline emoji="⏱" />{formatTime(trackSeconds)}
                </span>
              </div>
            </div>

            {/* Scrollable Chord Content Container */}
            <div
              ref={atrilScrollRef}
              className={`overflow-y-auto pr-2 scrollbar-thin scrollbar-thumbbg-[var(--surface)] space-y-1 font-sans select-text ${FONT_SIZE_CLASSES[fontSizeIndex]} ${isFullscreen ? "flex-1 min-h-0" : "max-h-[60vh]"}`}
            >
              {rawChordText ? (
                renderFormattedChords(rawChordText, transpose, notation)
              ) : (
                <p className="text-sm text-[var(--ink-2)] italic py-6">
                  Esta canción aún no tiene cifrado. Ábrela en Repertorio → Acordes para escribirlo, subir un PDF o
                  transcribirlo del audio.
                </p>
              )}
            </div>

            {/* Bottom Bar inside Atril: 1-Tap Evaluation & Quick Next/Previous */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 mt-3 shrink-0">
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <Button
                  variant={currentItem?.evaluacion === "bordada" ? "primary" : "neutral"}
                  size="xs"
                  onClick={() => handleSetEvaluation("bordada")}
                  className="flex-1 sm:flex-none items-center justify-center gap-1"
                >
                  <span><ShowIcon inline emoji="🟢" />Bordada</span>
                </Button>

                <Button
                  variant={currentItem?.evaluacion === "regular" ? "primary" : "primary"}
                  size="xs"
                  onClick={() => handleSetEvaluation("regular")}
                  className="flex-1 sm:flex-none items-center justify-center gap-1"
                >
                  <span><ShowIcon inline emoji="🟡" />Regular</span>
                </Button>

                <button
                  onClick={() => handleSetEvaluation("repetir")}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-sans font-bold transition-ui cursor-pointer ${
                    currentItem?.evaluacion === "repetir"
                      ? "bg-[var(--alert)] text-[var(--on-alert)] font-bold"
                      : "bg-[var(--alert)]/15 text-[var(--ink)]"
                  }`}
                >
                  <span><ShowIcon inline emoji="🔴" />Repetir</span>
                </button>
              </div>

              {/* Middle swipe hint indicator */}
              <div className="hidden lg:flex items-center gap-1 text-xs font-sans text-[var(--ink-2)]">
                <span><ShowIcon inline emoji="👈" />Desliza para cambiar <ShowIcon inline emoji="👉" /></span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  disabled={activeIndex === 0}
                  onClick={() => setActiveIndex((prev) => prev - 1)}
                  className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-[var(--r-pill)] bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] text-xs font-sans font-bold disabled:opacity-30 cursor-pointer transition-ui"
                >
                  ← Anterior
                </button>

                <Button
                  variant="primary"
                  size="xs"
                  disabled={activeIndex === agenda.length - 1}
                  onClick={() => setActiveIndex((prev) => prev + 1)}
                  className="flex-1 sm:flex-none"
                >
                  Siguiente →
                </Button>
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
          onUpdateSong={(updated) => {
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
function renderFormattedChords(
  text: string,
  transpose: number,
  notation: "ES" | "EN",
) {
  if (!text) return null;

  const lines = text.split("\n");

  return lines.map((rawLine, idx) => {
    const line = rawLine.trimEnd();

    // Empty line spacer
    if (!line.trim()) {
      return <div key={idx} className="h-3" />;
    }

    // Section header e.g. [Intro], [Verso 1], [Estribillo], [Solo], [Puente], [Outro]
    if (line.trim().startsWith("[") && line.trim().endsWith("]")) {
      return (
        <div key={idx} className="pt-3 pb-1">
          <span className="inline-flex items-center px-3 py-1 rounded-[var(--r-m)] bg-[var(--acc)]/20 text-[var(--ink)] text-xs font-sans font-bold">
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
        className="text-[var(--ink)] py-0.5 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: processedLine }}
      />
    );
  });
}
