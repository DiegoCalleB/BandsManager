import { SongStudioCubaseHelpModal } from "./song_studio/SongStudioCubaseHelpModal";
import { SongStudioDeleteConfirmModal } from "./song_studio/SongStudioDeleteConfirmModal";
import { SongStudioAiGeneratorModal } from "./song_studio/SongStudioAiGeneratorModal";
import { SongStudioAiMusicModal } from "./song_studio/SongStudioAiMusicModal";
import { SongStudioAiComposerModal } from "./song_studio/SongStudioAiComposerModal";
import { getLowLatencyAudioStream, createCleanAudioRecordingPipeline, cleanAudioBlobOffline, trimAudioBlobLatency, autoDetectAudioLatencyOffset, exportMasterMixAudioBlob, computeAutoBalanceVolumes } from "../utils/audioLatency";
import React, { useState, useRef, useEffect } from 'react';

const SILENT_AUDIO_URI = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
import { motion, AnimatePresence } from 'motion/react';
import { Song, SongAudioIdea, AudioTrack, ThemeColors, DrumPatternStyle, User } from '../types';
import { uploadFileToServer, resolveAudioUrl, getAudioBlobFromUrl, saveAudioToStorage } from '../utils/audioStorage';
import { apiFetch } from '../utils/api';
import { separateAudioIntoStems, IsolatedStemResult } from '../utils/stemSeparator';
import { generateAccompanimentAudioBlob } from '../utils/accompanimentSynth';
import WaveformTrack from './WaveformTrack';
import { SongChordsViewerModal } from './SongChordsViewerModal';
import PracticeModePanel from './PracticeModePanel';
import { ShareModal } from './ShareModal';
import { ModalPortal } from './common/ModalPortal';
import { useStudioShareModal } from '../hooks/useStudioShareModal';
import { useAccompanimentGenerator } from '../hooks/useAccompanimentGenerator';
import { useIdeaComments } from '../hooks/useIdeaComments';
import { useModuleTutorial } from '../hooks/useModuleTutorial';
import { getMemberReadiness, withMemberReadiness, READINESS_LEVELS, ReadinessLevel } from '../utils/repertorioUtils';
import { ModuleTutorialModal } from './common/ModuleTutorialModal';
import { 
  X, Play, Pause, Mic, Upload, Volume2, VolumeX, MessageSquare, 
  ThumbsUp, Plus, Music, User as UserIcon, Sparkles, Trash2, Send, Disc,
  Layers, Sliders, Edit2, Check, Radio, Wand2, RefreshCw, FileText, Keyboard,
  Square, Repeat, Flag, RotateCcw, Headphones, ShieldCheck, Filter, Share2,
  Maximize2, Minimize2, Cpu, Activity, Info, CheckCircle2, AlertCircle,
  FileAudio, HardDrive, Clock, Timer, CreditCard, Key, ExternalLink,
  ChevronDown, ChevronUp, AlertTriangle, Copy, Bot, Database, MoreVertical, GripVertical
} from 'lucide-react';



// Live microphone waveform visualization component for Cubase-style real-time recording
const LiveMicWaveformCanvas: React.FC<{
  stream: MediaStream | null;
  audioCtx: AudioContext | null;
  isRecording: boolean;
  color?: string;
  height?: number;
}> = ({ stream, audioCtx, isRecording, color = '#ef4444', height = 48 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isRecording || !stream) return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let ctxToUse = audioCtx;
    let createdLocalCtx = false;
    if (!ctxToUse || ctxToUse.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        ctxToUse = new AudioCtxClass();
        createdLocalCtx = true;
      }
    }
    if (!ctxToUse) return;

    let sourceNode: MediaStreamAudioSourceNode | null = null;
    let analyserNode: AnalyserNode | null = null;

    try {
      sourceNode = ctxToUse.createMediaStreamSource(stream);
      analyserNode = ctxToUse.createAnalyser();
      analyserNode.fftSize = 128;
      sourceNode.connect(analyserNode);
    } catch (e) {
      console.warn("LiveMicWaveformCanvas setup error:", e);
      return;
    }

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const historyBars: number[] = [];
    const maxBars = 100;

    const draw = () => {
      if (!canvas || !ctx || !analyserNode) return;
      const width = (canvas.width = canvas.offsetWidth || 300);
      const ch = (canvas.height = canvas.offsetHeight || height);

      analyserNode.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const avg = sum / bufferLength;
      const normVal = Math.min(1, avg / 120);

      historyBars.push(normVal);
      if (historyBars.length > maxBars) {
        historyBars.shift();
      }

      ctx.clearRect(0, 0, width, ch);

      // Grid background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, width, ch);

      const barWidth = width / maxBars;
      const centerY = ch / 2;

      for (let i = 0; i < historyBars.length; i++) {
        const val = historyBars[i];
        const barH = Math.max(3, val * (ch - 6));
        const x = i * barWidth;
        const y = centerY - barH / 2;

        const isCurrentPoint = i === historyBars.length - 1;
        ctx.fillStyle = isCurrentPoint ? '#ffffff' : (val > 0.6 ? '#f59e0b' : color);
        ctx.fillRect(x, y, Math.max(1.5, barWidth - 1), barH);
      }

      // Live recording line cursor
      const currentX = (historyBars.length / maxBars) * width;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(currentX, 0);
      ctx.lineTo(currentX, ch);
      ctx.stroke();

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animId) cancelAnimationFrame(animId);
      try { sourceNode?.disconnect(); } catch {}
      try { analyserNode?.disconnect(); } catch {}
      if (createdLocalCtx && ctxToUse) {
        try { ctxToUse.close(); } catch {}
      }
    };
  }, [isRecording, stream, audioCtx, color, height]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block rounded border border-red-500/40 bg-black/50"
    />
  );
};

// Guiño de marca a Iris mientras se procesa: un rayo de luz blanco entra en el prisma y sale
// descompuesto en el arcoíris de 6 colores — la misma paleta que colorea las pistas del mezclador.
const IRIS_PRISM_RAY_COLORS = ['#ff6b6b', '#ffab4a', '#ffe066', '#6fe89a', '#5b9dff', '#c084fc'];
const IrisPrismBanner: React.FC = () => {
  return (
    <div className="w-full aspect-video flex items-center justify-center overflow-hidden rounded-xl bg-black border border-white/10">
      <video
        className="w-full h-full object-cover pointer-events-none"
        src="/videos/iris-prism-banner.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />
    </div>
  );
};

interface SongStudioModalProps {
  song: Song;
  colors: ThemeColors;
  isStitchLight?: boolean;
  onClose: () => void;
  onUpdateSong: (updatedSong: Song) => void;
  currentUsername?: string;
  currentUser?: User;
}

// Coste aproximado por canción de cada motor de Iris, solo para orientar al usuario (no viene de
// una factura real reconciliada) — ajustar aquí si Diego consigue cifras reales del proveedor cloud.
const IRIS_ENGINE_COST_EUR: Record<'mvsep-mdx23' | 'demucs' | 'dsp-server', number> = {
  'mvsep-mdx23': 0.08,
  'demucs': 0.03,
  'dsp-server': 0
};
const formatEurEstimate = (n: number) => n.toFixed(2).replace('.', ',');

// Guiño a Iris (diosa del arcoíris): cada pista se colorea recorriendo el arcoíris en orden
// (rojo, naranja, amarillo, verde, azul, violeta). Por defecto sigue la posición en la
// lista, pero en cuanto el usuario reordena pistas a mano, cada una "congela" su color en
// tr.colorHue para que se lo lleve consigo al moverse — a partir de ahí el arcoíris ya no sale
// perfectamente en orden, y eso es justo lo esperado: gana la posición que elige el usuario.
const RAINBOW_HUE_STEPS = [355, 28, 50, 135, 215, 280]; // Rojo, Naranja, Amarillo, Verde, Azul, Violeta
// Convierte HSL a hex para poder seguir usando el truco de "hex + 2 dígitos de alpha" que ya
// usa WaveformTrack internamente (color + '40', color + '50'...) sin tener que tocar ese componente.
const hslToHex = (h: number, s: number, l: number): string => {
  const sat = s / 100, light = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => Math.round(255 * x).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
};
const getTrackRainbowColor = (tr: AudioTrack, fallbackIndex: number, alphaHex?: string): string => {
  const hue = typeof tr.colorHue === 'number' ? tr.colorHue : RAINBOW_HUE_STEPS[fallbackIndex % RAINBOW_HUE_STEPS.length];
  const hex = hslToHex(hue, 60, 68);
  return alphaHex ? `${hex}${alphaHex}` : hex;
};

const SECCIONES_TEMA: { key: SongAudioIdea['seccion']; label: string; icon: string; color: string }[] = [
  { key: 'general', label: 'Idea General / Demo', icon: '🎵', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  { key: 'intro', label: 'Intro', icon: '🚀', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { key: 'verso', label: 'Verso / Estrofa', icon: '📝', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  { key: 'estribillo', label: 'Estribillo / Chorus', icon: '🔥', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { key: 'puente', label: 'Puente / Bridge', icon: '🌉', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  { key: 'solo', label: 'Solo / Arreglo', icon: '🎸', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  { key: 'outro', label: 'Outro / Final', icon: '🏁', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' }
];

// Galería de presets de estilo para el generador de pista con IA: en vez de una caja de texto en
// blanco (parálisis de decisión), un punto de partida de un clic con nombre + descripción de una
// línea, igual que las tarjetas de estilo de herramientas tipo Moisés/Suno Studio.
const AI_TRACK_STYLE_PRESETS: { key: string; label: string; icon: string; description: string; style: string }[] = [
  { key: 'rock', label: 'Rock Clásico', icon: '🎸', description: 'Riffs con guitarra distorsionada, bien pegado a la base rítmica.', style: 'Rock clásico, guitarra con distorsión moderada, riff pegado a la batería' },
  { key: 'balada', label: 'Balada Suave', icon: '🌊', description: 'Arreglo melódico y espacioso, dinámica contenida.', style: 'Balada suave, arreglo melódico y espacioso, dinámica contenida y emotiva' },
  { key: 'funk', label: 'Funk Groove', icon: '🕺', description: 'Patrón sincopado y percusivo, mucho groove.', style: 'Funk groove, patrón rítmico sincopado, muy percusivo y bailable' },
  { key: 'ska', label: 'Ska / Balkan', icon: '🎷', description: 'Vientos y ritmo saltarín, energía festiva.', style: 'Ska / Balkan, ritmo saltarín off-beat, energía festiva de fanfarria' },
  { key: 'pop', label: 'Pop Moderno', icon: '🌆', description: 'Producción limpia, ganchos melódicos directos.', style: 'Pop moderno, producción limpia y comercial, ganchos melódicos directos' },
  { key: 'punk', label: 'Punk Energético', icon: '🤘', description: 'Rápido, crudo, acordes potentes.', style: 'Punk rock energético, tempo rápido, acordes potentes, sonido crudo' },
  { key: 'synth', label: 'Synth Atmosférico', icon: '🎹', description: 'Texturas electrónicas, pads y capas.', style: 'Synth atmosférico, texturas electrónicas, pads envolventes y capas' },
  { key: 'orquestal', label: 'Cuerdas Orquestales', icon: '🎻', description: 'Arreglo sinfónico con dramatismo.', style: 'Cuerdas orquestales, arreglo sinfónico con dramatismo y amplitud' }
];

// Helper to standardise tracks array from idea
export function getIdeaTracks(idea: SongAudioIdea): AudioTrack[] {
  if (idea.pistas && idea.pistas.length > 0) {
    return idea.pistas;
  }
  // Fallback single track
  return [{
    id: `${idea.id}-track-1`,
    nombre: idea.titulo || 'Pista Principal',
    audioUrl: idea.audioUrl,
    autor: idea.subidoPor,
    instrumento: idea.instrumento,
    fecha: idea.fecha,
    volumen: 1,
    muted: false
  }];
}

export default function SongStudioModal({
  song,
  colors,
  isStitchLight = false,
  onClose,
  onUpdateSong,
  currentUsername = 'Tu Nombre',
  currentUser
}: SongStudioModalProps) {
  const songRef = useRef<Song>(song);
  useEffect(() => {
    songRef.current = song;
  }, [song]);

  const [activeSectionFilter, setActiveSectionFilter] = useState<string>('todas');
  // Máxima sencillez: cada idea empieza PLEGADA (solo título + escuchar + menú de opciones),
  // el mezclador completo y las acciones secundarias solo aparecen al expandir a propósito.
  const [expandedIdeaIds, setExpandedIdeaIds] = useState<Set<string>>(new Set());
  const toggleIdeaExpanded = (ideaId: string) => {
    setExpandedIdeaIds(prev => {
      const next = new Set(prev);
      if (next.has(ideaId)) next.delete(ideaId); else next.add(ideaId);
      return next;
    });
  };
  const [openIdeaActionsMenuId, setOpenIdeaActionsMenuId] = useState<string | null>(null);
  const [showToolsMenu, setShowToolsMenu] = useState<boolean>(false);
  const [showChordsModal, setShowChordsModal] = useState<boolean>(false);
  const [showCubaseHelp, setShowCubaseHelp] = useState<boolean>(false);
  const [showAiMusicModal, setShowAiMusicModal] = useState<boolean>(false);
  const [showAiComposerModal, setShowAiComposerModal] = useState<boolean>(false);
  const [practiceModeIdea, setPracticeModeIdea] = useState<SongAudioIdea | null>(null);
  const { isOpen: isTutorialOpen, openTutorial, closeTutorial } = useModuleTutorial('song_studio');
  const {
    shareModalData, setShareModalData,
    handleShareSong,
    handleShareIdea,
  } = useStudioShareModal(song);

  const [playingIdeaId, setPlayingIdeaId] = useState<string | null>(null);
  const [currentTimeMap, setCurrentTimeMap] = useState<Record<string, number>>({});
  const [durationMap, setDurationMap] = useState<Record<string, number>>({});
  const [loopConfigMap, setLoopConfigMap] = useState<Record<string, { enabled: boolean; start: number; end: number }>>({});

  const {
    commentTextMap, setCommentTextMap,
    commentTimeTagMap, setCommentTimeTagMap,
    commentTrackTagMap, setCommentTrackTagMap,
    handleAddComment,
  } = useIdeaComments(song, onUpdateSong, currentUsername, currentTimeMap);
  
  // Audio upload / new idea form state
  const [showAddIdea, setShowAddIdea] = useState(false);
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaSection, setIdeaSection] = useState<SongAudioIdea['seccion']>('general');
  const [ideaNotes, setIdeaNotes] = useState('');
  const [ideaUploader, setIdeaUploader] = useState(currentUsername);
  const [ideaInstrument, setIdeaInstrument] = useState('');
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [driveAudioUrl, setDriveAudioUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // Recording main audio for new idea
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const recordingPromiseRef = useRef<Promise<string> | null>(null);

  // --- MULTITRACK (OVERDUB) STATE ---
  const [addingTrackIdeaId, setAddingTrackIdeaId] = useState<string | null>(null);
  const [newTrackName, setNewTrackName] = useState('');
  const [newTrackInstrument, setNewTrackInstrument] = useState('');
  const [selectedTrackFile, setSelectedTrackFile] = useState<File | null>(null);
  const [isRecordingTrack, setIsRecordingTrack] = useState(false);
  const [recordingTrackIdeaId, setRecordingTrackIdeaId] = useState<string | null>(null);
  const [recordingTrackTime, setRecordingTrackTime] = useState(0);
  const trackMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const trackAudioChunksRef = useRef<Blob[]>([]);
  const trackRecordingTimerRef = useRef<any>(null);
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editingTrackName, setEditingTrackName] = useState('');
  const [activeRecordingStream, setActiveRecordingStream] = useState<MediaStream | null>(null);
  const [selectedStemEngine, setSelectedStemEngine] = useState<'mvsep-mdx23' | 'demucs' | 'dsp-server'>('demucs');
  const [showMoisesStemsModal, setShowMoisesStemsModal] = useState<SongAudioIdea | null>(null);
  const [moisesTab, setMoisesTab] = useState<'stems' | 'how_it_works' | 'upload'>('stems');
  const [uploadingStemInstrument, setUploadingStemInstrument] = useState<string>('Voz');

  // AI Instrument Track Generator State — guarda la idea de destino (no un simple boolean) para
  // saber a qué mezcla añadir la pista generada; antes se asumía siempre audioIdeas[0], ignorando
  // sobre qué idea había pulsado el usuario el botón.
  const [showAiTrackGenModal, setShowAiTrackGenModal] = useState<SongAudioIdea | null>(null);
  const [aiTrackGenInstrument, setAiTrackGenInstrument] = useState<string>('Guitarra Solista');
  const [aiTrackGenMode, setAiTrackGenMode] = useState<'presets' | 'custom'>('presets');
  const [aiTrackGenStyle, setAiTrackGenStyle] = useState<string>(AI_TRACK_STYLE_PRESETS[0].style);
  const [aiTrackGenPrompt, setAiTrackGenPrompt] = useState<string>('');
  // Segundo de la canción en el que debe empezar a sonar la pista generada — Lyria solo genera
  // clips de ~30s fieles al contexto, así que en vez de pedirle una canción entera (peor
  // resultado, ver commit anterior), dejamos elegir EN QUÉ PARTE de la canción encaja ese clip
  // (p.ej. el puente en el minuto 1:45), colocándolo ahí en vez de siempre al principio.
  const [aiTrackGenStartOffsetSec, setAiTrackGenStartOffsetSec] = useState<number>(0);
  const [aiTrackGenError, setAiTrackGenError] = useState<string | null>(null);
  const [aiTrackGenPreview, setAiTrackGenPreview] = useState<{
    audioUrl: string;
    trackName: string;
    arrangementNotes: string;
  } | null>(null);
  const [isGeneratingAiTrack, setIsGeneratingAiTrack] = useState<boolean>(false);
  const [isSeparatingStemsAi, setIsSeparatingStemsAi] = useState<boolean>(false);
  const [separationElapsedSeconds, setSeparationElapsedSeconds] = useState<number>(0);
  const [showStemErrorDetails, setShowStemErrorDetails] = useState<boolean>(false);
  const [copiedStemError, setCopiedStemError] = useState<boolean>(false);
  const [stemProgressModal, setStemProgressModal] = useState<{
    isOpen: boolean;
    songTitle: string;
    ideaTitle: string;
    targetIdea?: SongAudioIdea;
    stage: 'preparing' | 'demucs' | 'persisting' | 'completed' | 'error';
    progressPct: number;
    /** El usuario minimizó el modal para seguir trabajando mientras Iris separa en segundo
     *  plano — el proceso sigue corriendo igual (vive en este mismo componente, no en el modal),
     *  solo cambia lo que se renderiza: el overlay completo o una píldora flotante discreta. */
    minimized?: boolean;
    /** Timestamp (Date.now()) de cuándo empezó la fase de inferencia neuronal/DSP — única fuente
     *  de verdad para calcular su % de progreso, así el timer rápido de la barra y el polling de
     *  estado (cada 4s) nunca vuelven a pisarse el uno al otro con valores distintos. */
    demucsStartedAt?: number;
    currentStepText: string;
    isNeural?: boolean;
    engineUsed?: string;
    degraded?: boolean;
    degradedReason?: string;
    separationEngine?: string;
    engineChoice?: 'mvsep-mdx23' | 'demucs' | 'dsp-server';
    stemsAdded?: number;
    stemsInfo?: Array<{ instrument: string; trackName: string; formato: string; tamano: string; audioUrl?: string }>;
    errorMessage?: string;
    errorDetail?: string;
    errorProvider?: 'replicate' | 'gemini' | 'ffmpeg' | 'supabase' | 'network' | 'system';
    errorType?: string;
    errorTitle?: string;
    actionAdvice?: string;
    executionTimeSec?: string;
    timingBreakdown?: {
      preloadSec?: string;
      gpuInferenceSec?: string;
      stemsPersistenceSec?: string;
      totalSec?: string;
    };
  } | null>(null);

  // Si el proceso termina (bien o mal) mientras el usuario tenía la píldora minimizada, se
  // reabre solo: completado/error son estados que necesitan que el usuario los vea (celebrar,
  // o decidir qué hacer con un fallo), no algo para dejar pasar desapercibido en una esquina.
  useEffect(() => {
    if (stemProgressModal?.minimized && (stemProgressModal.stage === 'completed' || stemProgressModal.stage === 'error')) {
      setStemProgressModal(prev => prev ? { ...prev, minimized: false } : null);
    }
  }, [stemProgressModal?.stage, stemProgressModal?.minimized]);

  // Separación de pistas con IA (motor propio "Iris", con dos niveles de calidad + fallback local)
  const handlePerformAiStemSeparation = async (targetIdea: SongAudioIdea, overrideEngine?: 'mvsep-mdx23' | 'demucs' | 'dsp-server') => {
    setIsSeparatingStemsAi(true);
    setSeparationElapsedSeconds(0);
    const engineToUse = overrideEngine || selectedStemEngine;

    const stepInitText =
      engineToUse === 'mvsep-mdx23' ? "Iniciando Iris Studio (red neuronal de máxima calidad)..." :
      engineToUse === 'demucs' ? 'Iniciando Iris Cloud (red neuronal en la nube)...' :
      'Iniciando Iris Básico (procesamiento local, gratis)...';

    setStemProgressModal({
      isOpen: true,
      songTitle: song.titulo,
      ideaTitle: targetIdea.titulo,
      targetIdea,
      stage: 'preparing',
      progressPct: 15,
      currentStepText: stepInitText,
      engineChoice: engineToUse
    });

    const elapsedTimer = setInterval(() => {
      setSeparationElapsedSeconds(prev => prev + 1);
    }, 1000);

    // Única fuente de verdad para el % de progreso en cada fase: el polling de estado (cada 4s)
    // ya NO toca progressPct, solo el texto explicativo — así nunca compiten dos relojes distintos
    // por el mismo valor y la barra no retrocede (ver demucsStartedAt más arriba).
    const progressTimer = setInterval(() => {
      setStemProgressModal(prev => {
        if (!prev || prev.stage === 'completed' || prev.stage === 'error') return prev;
        if (prev.stage === 'preparing') {
          return { ...prev, progressPct: Math.min(prev.progressPct + 3, 30) };
        }
        if (prev.stage === 'demucs') {
          const elapsedSec = prev.demucsStartedAt ? (Date.now() - prev.demucsStartedAt) / 1000 : 0;
          return { ...prev, progressPct: Math.min(45 + elapsedSec / 3, 88) };
        }
        if (prev.stage === 'persisting') {
          return { ...prev, progressPct: Math.min(prev.progressPct + 1, 96) };
        }
        return prev;
      });
    }, 350);

    try {
      setStemProgressModal(prev => prev ? {
        ...prev,
        stage: 'preparing',
        progressPct: 25,
        currentStepText: engineToUse !== 'dsp-server'
          ? 'Verificando el audio y enviándolo a la nube...'
          : 'Preparando espectro de audio en el motor local...'
      } : null);

      let sendableAudioUrl = targetIdea.audioUrl;
      try {
        const resolved = await resolveAudioUrl(targetIdea.audioUrl);
        if (resolved) {
          sendableAudioUrl = resolved;
        }

        if (sendableAudioUrl.startsWith('indexeddb:') || sendableAudioUrl.startsWith('blob:') || sendableAudioUrl.startsWith('data:')) {
          const blob = await getAudioBlobFromUrl(targetIdea.audioUrl);
          const ext = blob.type.includes('wav') ? 'wav' : blob.type.includes('flac') ? 'flac' : 'mp3';
          const file = new File([blob], `input-audio-idea-${Date.now()}.${ext}`, { type: blob.type || 'audio/mpeg' });
          const bandIdToUse = localStorage.getItem('bandmanager_band_id') || undefined;
          const uploadedUrl = await uploadFileToServer(file, { category: 'stems', folder: 'inputs', bandId: bandIdToUse });
          if (uploadedUrl && (uploadedUrl.startsWith('http://') || uploadedUrl.startsWith('https://') || uploadedUrl.startsWith('/'))) {
            sendableAudioUrl = uploadedUrl;
          }
        }
      } catch (prepErr) {
        console.warn("[Stem Separation Frontend] Error preparando audio para el servidor:", prepErr);
      }

      const stepProcessingText =
        engineToUse === 'mvsep-mdx23'
          ? "Iris Studio aislando pistas vocales e instrumentales..."
          : engineToUse === 'demucs'
          ? 'Iris Cloud aislando Voz, Batería, Bajo, Guitarras...'
          : 'Iris Básico realizando filtrado de frecuencias (gratis)...';

      setStemProgressModal(prev => prev ? {
        ...prev,
        stage: 'demucs',
        progressPct: 45,
        demucsStartedAt: Date.now(),
        currentStepText: stepProcessingText
      } : null);

      const kickoff = await apiFetch('/api/ai-stem-separation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songTitle: song.titulo,
          sectionName: targetIdea.seccion,
          audioUrl: sendableAudioUrl,
          bpm: song.bpm,
          key: song.tonalidad,
          forceEngine: engineToUse
        })
      });

      let data = kickoff;

      // El servidor responde al instante (202) y sigue procesando en segundo plano para no
      // chocar con el límite de ~5 minutos de conexión inactiva del proxy de Railway. Hacemos
      // polling ligero del resultado en vez de mantener esta petición abierta varios minutos.
      if (kickoff?.status === 'processing') {
        const pollStartedAt = Date.now();
        const maxWaitMs = 20 * 60 * 1000; // El job sigue vivo en el servidor aunque dejemos de esperar aquí
        const engineLabel =
          engineToUse === 'mvsep-mdx23' ? "Iris Studio" :
          engineToUse === 'demucs' ? 'Iris Cloud' :
          'Iris Básico';
        while (true) {
          await new Promise(r => setTimeout(r, 4000));
          const elapsedSec = Math.round((Date.now() - pollStartedAt) / 1000);
          // Fases explicativas: qué está pasando realmente en cada tramo de tiempo de la GPU en
          // la nube (no es una barra ficticia: refleja subida, cold-start del contenedor e inferencia).
          const phaseText =
            engineToUse === 'dsp-server'
              ? `${stepProcessingText} (${elapsedSec}s transcurridos)`
              : elapsedSec < 12
              ? `📤 Subiendo tu audio a ${engineLabel}... (${elapsedSec}s)`
              : elapsedSec < 40
              ? `🧊 Arrancando el motor — si llevaba un rato sin usarse, tarda hasta ~1 min en "despertar"... (${elapsedSec}s)`
              : `🎛️ ${engineLabel} separando voz, batería, bajo, guitarras, teclados y arreglos por frecuencia... (${elapsedSec}s transcurridos, puede tardar varios minutos)`;
          setStemProgressModal(prev => prev ? {
            ...prev,
            stage: 'demucs',
            currentStepText: phaseText
          } : null);

          const statusRes = await apiFetch(
            `/api/ai-stem-separation/status?songHash=${encodeURIComponent(kickoff.songHash)}&engine=${encodeURIComponent(kickoff.engine)}`
          );
          if (statusRes?.status === 'completed') {
            data = statusRes;
            break;
          }
          if (Date.now() - pollStartedAt > maxWaitMs) {
            throw new Error('La separación sigue procesándose en el servidor tras 20 minutos. Cierra esta ventana e inténtalo de nuevo en un rato: el resultado quedará guardado y no se repetirá el gasto en GPU.');
          }
          // statusRes.status === 'processing' o 'not_found' (aún no escrito en caché): seguimos esperando.
          // Un estado 'failed' hace que apiFetch lance ApiRequestError automáticamente (respuesta no-2xx),
          // que cae de forma natural en el catch de más abajo con el mismo formato de error enriquecido.
        }
      }

      setStemProgressModal(prev => prev ? {
        ...prev,
        stage: 'persisting',
        progressPct: 92,
        currentStepText: 'Sincronizando pistas aisladas MP3 HQ en la nube...'
      } : null);

      const existing = getIdeaTracks(targetIdea);
      // Al generar las pistas por separado, eliminamos la pista master original no separada (Pista Principal / Demo Unificada)
      let newTracks = existing.filter(t => 
        t.audioUrl !== targetIdea.audioUrl && 
        t.id !== `${targetIdea.id}-track-1` && 
        t.nombre !== 'Pista Principal' &&
        t.nombre !== targetIdea.titulo &&
        !!t.instrumento
      );
      let stemsAdded = 0;

      if (data.stems && Array.isArray(data.stems) && data.stems.length > 0) {
        const engineAuthor = data.degraded
          ? 'Iris Básico (Modo Degradado)'
          : data.separationEngine?.includes('MVSEP')
          ? 'Iris Studio'
          : data.isNeural
          ? 'Iris Cloud'
          : 'Iris Básico (gratis)';
        data.stems.forEach((st: any) => {
          if (!st.audioUrl) return;

          const instClean = (st.instrument || '').toLowerCase();
          const existingIdx = newTracks.findIndex(t => 
            (t.instrumento && t.instrumento.toLowerCase() === instClean) ||
            (t.nombre && t.nombre.toLowerCase().includes(instClean)) ||
            (instClean === 'voz' && t.nombre.toLowerCase().includes('voz')) ||
            (instClean === 'batería' && (t.nombre.toLowerCase().includes('batería') || t.nombre.toLowerCase().includes('bateria'))) ||
            (instClean === 'bajo' && t.nombre.toLowerCase().includes('bajo')) ||
            (instClean === 'guitarras' && t.nombre.toLowerCase().includes('guitarra')) ||
            (instClean === 'teclados' && (t.nombre.toLowerCase().includes('teclado') || t.nombre.toLowerCase().includes('piano'))) ||
            (instClean === 'arreglos' && t.nombre.toLowerCase().includes('arreglo'))
          );

          const fmt = st.formato || (st.audioUrl.toLowerCase().includes('.wav') ? 'WAV' : 'MP3');
          const sz = st.tamano || '2.5 MB';

          if (existingIdx >= 0) {
            newTracks[existingIdx] = {
              ...newTracks[existingIdx],
              nombre: st.trackName || newTracks[existingIdx].nombre,
              audioUrl: st.audioUrl,
              autor: engineAuthor,
              instrumento: st.instrument,
              formato: fmt,
              tamano: sz,
              volumen: st.recommendedVolume || newTracks[existingIdx].volumen || 1
            };
            stemsAdded++;
          } else {
            newTracks.push({
              id: `stem-ai-${instClean}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              nombre: st.trackName || `Pista IA (${st.instrument})`,
              audioUrl: st.audioUrl,
              autor: engineAuthor,
              instrumento: st.instrument,
              formato: fmt,
              tamano: sz,
              fecha: new Date().toISOString().split('T')[0],
              volumen: st.recommendedVolume || 1,
              muted: false
            });
            stemsAdded++;
          }
        });
      } else {
        let renderedStems: IsolatedStemResult[] = [];
        try {
          renderedStems = await separateAudioIntoStems(targetIdea.audioUrl);
        } catch (renderErr) {
          console.warn("Could not render client audio stem buffers:", renderErr);
        }

        if (renderedStems.length > 0) {
          // Guardado persistente de cada stem en servidor/IndexedDB (sin depender de blob URLs efímeras)
          await Promise.all(
            renderedStems.map(async (stemRes) => {
              let uploadedUrl = stemRes.audioUrl;
              try {
                const wavFile = new File([stemRes.audioBlob], `stem-${stemRes.instrument.toLowerCase()}-${Date.now()}.wav`, { type: 'audio/wav' });
                uploadedUrl = await uploadFileToServer(wavFile, { category: 'stems', folder: 'separated' });
              } catch (upErr) {
                console.warn("Using IndexedDB fallback for stem upload:", upErr);
                try {
                  const key = `stem_${stemRes.instrument.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                  await saveAudioToStorage(key, stemRes.audioBlob);
                  uploadedUrl = `indexeddb:${key}`;
                } catch (idbErr) {
                  console.warn("IndexedDB fallback error:", idbErr);
                }
              }

              if (!newTracks.some(t => t.nombre.includes(stemRes.instrument))) {
                newTracks.push({
                  id: `stem-ai-${stemRes.instrument.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  nombre: stemRes.trackName,
                  audioUrl: uploadedUrl,
                  autor: 'Anti-Phase AI Engine',
                  instrumento: stemRes.instrument,
                  formato: stemRes.formato || 'WAV',
                  tamano: stemRes.tamano || '3.2 MB',
                  fecha: new Date().toISOString().split('T')[0],
                  volumen: stemRes.recommendedVolume || 1,
                  muted: false
                });
                stemsAdded++;
              }
            })
          );
        }
      }

      // Nivelamos el volumen inicial de las pistas recién separadas con el RMS real de cada una,
      // en vez de dejar el valor genérico por instrumento (STEM_METADATA.recommendedVolume): así
      // el primer miembro que abra la canción ya escucha una mezcla equilibrada de fábrica, no una
      // guitarra tapando la voz porque esa toma en concreto se grabó más alta de nivel. Si el
      // análisis falla para alguna pista, se queda con su volumen por defecto sin bloquear nada.
      setStemProgressModal(prev => prev ? {
        ...prev,
        currentStepText: 'Analizando volumen real de cada pista para una mezcla inicial equilibrada...'
      } : null);
      try {
        const autoBalanceVolumes = await computeAutoBalanceVolumes(
          newTracks.map(t => ({ id: t.id, audioUrl: t.audioUrl })),
          resolveAudioUrl
        );
        newTracks = newTracks.map(t =>
          autoBalanceVolumes[t.id] !== undefined ? { ...t, volumen: autoBalanceVolumes[t.id] } : t
        );
      } catch (balanceErr) {
        console.warn('[Stem Separation] Auto-Balance inicial falló, se mantienen los volúmenes por defecto:', balanceErr);
      }

      const finalSeparationEngine = data.degraded
        ? 'Iris Básico (modo degradado)'
        : engineToUse === 'mvsep-mdx23' ? 'Iris Studio' : engineToUse === 'demucs' ? 'Iris Cloud' : 'Iris Básico';
      const updatedIdeas = (song.audioIdeas || []).map(i => i.id === targetIdea.id ? {
        ...i,
        pistas: newTracks,
        stemEngineUsed: finalSeparationEngine,
        stemIsNeural: !!data.isNeural,
        stemDegraded: !!data.degraded,
        stemProcessedAt: new Date().toISOString()
      } : i);
      onUpdateSong({ ...song, audioIdeas: updatedIdeas });

      const stemsInfo = newTracks.map(t => ({
        instrument: t.instrumento || 'Pista',
        trackName: t.nombre,
        formato: t.formato || (t.audioUrl?.toLowerCase().includes('.wav') ? 'WAV' : 'MP3'),
        tamano: t.tamano || '2.5 MB',
        audioUrl: t.audioUrl
      }));

      clearInterval(progressTimer);
      clearInterval(elapsedTimer);
      setStemProgressModal({
        isOpen: true,
        songTitle: song.titulo,
        ideaTitle: targetIdea.titulo,
        targetIdea,
        stage: 'completed',
        progressPct: 100,
        currentStepText: data.degraded
          ? '¡Pistas procesadas en Modo Degradado (DSP básico) y montadas en el mezclador!'
          : '¡Pistas aisladas montadas en el mezclador con éxito!',
        isNeural: !!data.isNeural,
        engineUsed: data.engineUsed,
        degraded: !!data.degraded,
        degradedReason: data.degradedReason,
        separationEngine: finalSeparationEngine,
        engineChoice: engineToUse,
        stemsAdded: stemsAdded || 5,
        stemsInfo,
        executionTimeSec: data.executionTimeSec,
        timingBreakdown: data.timingBreakdown
      });
    } catch (err: any) {
      clearInterval(progressTimer);
      clearInterval(elapsedTimer);
      console.error("Error en separación de stems por IA:", err);
      const data = err?.data || {};
      const errMsg = String(data.message || data.error || err?.message || "");

      // Diferenciar el proveedor origen del error (Replicate, Gemini API Key, Librería FFmpeg, Supabase, etc.)
      const errorProvider: 'replicate' | 'gemini' | 'ffmpeg' | 'supabase' | 'network' | 'system' = data.provider || (
        data.errorType?.startsWith('gemini_') || errMsg.includes('GEMINI_API_KEY') || errMsg.includes('Gemini') || errMsg.includes('GoogleGenAI') ? 'gemini' :
        data.errorType?.startsWith('ffmpeg_') || errMsg.includes('ffmpeg') || errMsg.includes('fluent-ffmpeg') ? 'ffmpeg' :
        data.errorType?.startsWith('supabase_') || errMsg.includes('supabase') || errMsg.includes('storage') ? 'supabase' :
        (engineToUse !== 'dsp-server' || data.engine === 'replicate' || data.engine === 'mvsep-mdx23' || data.engine === 'demucs' || errMsg.includes('replicate') || errMsg.includes('r8_')) ? 'replicate' :
        'system'
      );

      // Determinar el tipo específico de error
      let errorType = data.errorType;
      if (!errorType) {
        if (errorProvider === 'gemini') {
          if (errMsg.includes('key') && (errMsg.includes('not valid') || errMsg.includes('API_KEY_INVALID') || err?.status === 400 || err?.status === 401)) {
            errorType = 'gemini_auth_invalid';
          } else if (errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED') || err?.status === 429) {
            errorType = 'gemini_quota_exceeded';
          } else if (errMsg.includes('model') || errMsg.includes('NOT_FOUND') || err?.status === 404) {
            errorType = 'gemini_model_unavailable';
          } else {
            errorType = 'gemini_generic';
          }
        } else if (errorProvider === 'ffmpeg') {
          if (errMsg.includes('codec') || errMsg.includes('Invalid data') || err?.status === 422) {
            errorType = 'ffmpeg_codec_unsupported';
          } else if (errMsg.includes('missing') || errMsg.includes('not found')) {
            errorType = 'ffmpeg_missing';
          } else {
            errorType = 'ffmpeg_processing_error';
          }
        } else if (errorProvider === 'supabase') {
          if (errMsg.includes('credentials') || errMsg.includes('URL') || errMsg.includes('KEY')) {
            errorType = 'supabase_credentials_missing';
          } else {
            errorType = 'supabase_storage_error';
          }
        } else {
          errorType = (
            err?.status === 401 ? 'auth_invalid' :
            err?.status === 402 ? 'billing_required' :
            err?.status === 422 ? 'audio_unsupported' :
            err?.status === 429 ? 'rate_limit' :
            err?.status === 504 ? 'timeout' :
            err?.status >= 500 ? 'server_error' : 'generic'
          );
        }
      }

      // Títulos diferenciados por proveedor y tipo
      const errorTitle = data.errorTitle || (
        errorType === 'gemini_key_missing' ? 'Clave GEMINI_API_KEY No Configurada' :
        errorType === 'gemini_auth_invalid' ? 'Clave GEMINI_API_KEY Inválida o Revocada' :
        errorType === 'gemini_quota_exceeded' ? 'Cuota de Gemini API Excedida (HTTP 429)' :
        errorType === 'gemini_model_unavailable' ? 'Modelo de Gemini no Accesible en tu Región' :
        errorType === 'gemini_safety_block' ? 'Bloqueo de Seguridad en Gemini AI' :
        errorType === 'gemini_generic' ? 'Error en la API de Google Gemini' :
        errorType === 'ffmpeg_missing' ? 'Librería FFmpeg no Instalada en Servidor' :
        errorType === 'ffmpeg_codec_unsupported' ? 'Formato de Audio Incompatible con FFmpeg' :
        errorType === 'ffmpeg_processing_error' ? 'Error en Filtros Espectrales FFmpeg' :
        errorType === 'supabase_credentials_missing' ? 'Credenciales de Supabase no Configuradas' :
        errorType === 'supabase_storage_error' ? 'Error de Almacenamiento en Supabase Storage' :
        errorType === 'billing_required' ? 'Saldo o Facturación Requerida en el Servicio de IA (HTTP 402)' :
        errorType === 'auth_invalid' ? 'Token de Acceso Inválido o Expirado (HTTP 401)' :
        errorType === 'token_missing' ? 'Token de Acceso No Configurado' :
        errorType === 'audio_unsupported' ? 'Formato de Audio Rechazado por el Servicio de IA (HTTP 422)' :
        errorType === 'rate_limit' ? 'Límite de Peticiones Alcanzado (HTTP 429)' :
        errorType === 'timeout' ? 'Tiempo de Espera en la Nube Excedido (>120s)' :
        errorType === 'gpu_failure' ? 'Fallo en el Contenedor de Procesamiento en la Nube' :
        errorType === 'server_error' ? 'Fallo Temporal en la Infraestructura de IA' :
        'Inconveniente en la Separación de Pistas'
      );

      const specificMsg = data.message || data.error || errMsg || 'No se pudo conectar con el servidor de IA.';

      // Consejo / Acción guiada según el origen exacto
      const actionAdvice = data.actionAdvice || (
        errorType === 'gemini_key_missing' ? 'Añade tu clave GEMINI_API_KEY en los ajustes del proyecto o variables de entorno.' :
        errorType === 'gemini_auth_invalid' ? 'Verifica tu API Key en Google AI Studio (https://aistudio.google.com/app/apikey) y actualízala.' :
        errorType === 'gemini_quota_exceeded' ? 'Has superado el ratio de llamadas de tu cuenta en Gemini. Espera 60s o utiliza el plan de pago.' :
        errorType === 'gemini_model_unavailable' ? 'El modelo solicitado no está activo para tu clave. Se usará el análisis local de respaldo.' :
        errorType === 'ffmpeg_codec_unsupported' ? 'Exporta tu pista a MP3 estándar o WAV PCM 16-bit / 44.1kHz antes de subirla.' :
        errorType === 'ffmpeg_missing' ? 'Verifica la instalación de ffmpeg-static en el servidor backend de Railway.' :
        errorType === 'supabase_credentials_missing' ? 'Asegúrate de que SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY estén definidas en Railway.' :
        errorType === 'billing_required' ? 'Tu cuenta de Replicate requiere añadir saldo en replicate.com/account/billing o utilizar el Motor DSP local gratuito.' :
        errorType === 'auth_invalid' ? 'Comprueba que tu API Token comience por r8_ y esté activo en replicate.com/account/api-tokens.' :
        errorType === 'token_missing' ? 'Configura la variable REPLICATE_API_TOKEN en los ajustes de tu proyecto.' :
        errorType === 'rate_limit' ? 'Espera 30-60 segundos antes de enviar una nueva solicitud o utiliza el Motor DSP local.' :
        errorType === 'timeout' ? 'La máquina GPU tardó en inicializar. Vuelve a intentarlo o usa la separación con el Motor DSP local.' :
        'Puedes reintentar o usar la separación con el Motor DSP local que procesa el audio en el propio servidor.'
      );
      const detailInfo = data.details || data.errorDetail;

      setShowStemErrorDetails(false);
      setCopiedStemError(false);

      setStemProgressModal({
        isOpen: true,
        songTitle: song.titulo,
        ideaTitle: targetIdea.titulo,
        targetIdea,
        stage: 'error',
        progressPct: 0,
        currentStepText: 'Error al procesar la separación.',
        errorProvider,
        errorType,
        errorTitle,
        errorMessage: typeof specificMsg === 'string' ? specificMsg : JSON.stringify(specificMsg),
        actionAdvice,
        errorDetail: detailInfo && detailInfo !== specificMsg ? (typeof detailInfo === 'string' ? detailInfo : JSON.stringify(detailInfo, null, 2)) : undefined,
        engineChoice: engineToUse
      });
    } finally {
      setIsSeparatingStemsAi(false);
    }
  };

  // AI Custom Instrument Track Generator Handler — genera y deja en previsualización, NUNCA
  // compromete directo al mezclador: la IA generativa a veces devuelve algo que no encaja, y
  // forzar al usuario a escucharlo ya integrado en su mezcla (o peor, tener que deshacerlo a mano)
  // es peor experiencia que dejarle escuchar antes y decidir "Añadir" o "Descartar".
  const handleGenerateAiInstrumentTrack = async (targetIdea: SongAudioIdea) => {
    if (!aiTrackGenInstrument) return;
    setAiTrackGenError(null);
    setAiTrackGenPreview(null);
    try {
      setIsGeneratingAiTrack(true);

      // Audio real de la idea para que el motor (MusicGen) pueda ESCUCHAR melodía/acordes/ritmo
      // en vez de adivinar desde una descripción de texto — mismo saneado que ya hace la
      // separación de stems para blobs/IndexedDB, que Replicate no puede ir a buscar por sí solo.
      // idea.audioUrl es "la pista principal o legacy" y puede estar vacío en ideas que solo
      // tienen pistas separadas (stems) o grabaciones multipista — sin este fallback, esas ideas
      // se iban derechas a Lyria (solo texto) sin que se notara por qué.
      const originalSourceAudioUrl = targetIdea.audioUrl || getIdeaTracks(targetIdea)[0]?.audioUrl || '';
      let sourceAudioUrl: string | undefined = originalSourceAudioUrl || undefined;
      try {
        if (sourceAudioUrl) {
          const resolved = await resolveAudioUrl(sourceAudioUrl);
          if (resolved) sourceAudioUrl = resolved;
          if (sourceAudioUrl.startsWith('indexeddb:') || sourceAudioUrl.startsWith('blob:') || sourceAudioUrl.startsWith('data:')) {
            const blob = await getAudioBlobFromUrl(originalSourceAudioUrl);
            const ext = blob.type.includes('wav') ? 'wav' : blob.type.includes('flac') ? 'flac' : 'mp3';
            const file = new File([blob], `source-audio-${Date.now()}.${ext}`, { type: blob.type || 'audio/mpeg' });
            const bandIdToUse = localStorage.getItem('bandmanager_band_id') || undefined;
            const uploadedUrl = await uploadFileToServer(file, { category: 'stems', folder: 'inputs', bandId: bandIdToUse });
            if (uploadedUrl && (uploadedUrl.startsWith('http://') || uploadedUrl.startsWith('https://') || uploadedUrl.startsWith('/'))) {
              sourceAudioUrl = uploadedUrl;
            }
          }
        }
      } catch (prepErr) {
        console.warn('[AI Track Gen] No se pudo preparar el audio de referencia, se generará solo por texto:', prepErr);
        sourceAudioUrl = undefined;
      }

      const data = await apiFetch('/api/ai-generate-instrument-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instrument: aiTrackGenInstrument,
          songTitle: song.titulo,
          sectionName: targetIdea.seccion,
          bpm: song.bpm,
          key: song.tonalidad,
          genero: song.genero,
          style: aiTrackGenMode === 'presets' ? aiTrackGenStyle : undefined,
          contextPrompt: aiTrackGenMode === 'custom' ? aiTrackGenPrompt : undefined,
          targetDurationSec: song.duracionSegundos || undefined,
          sourceAudioUrl
        })
      });

      const generatedAudioUrl = data.audioUrl || (data.audioBase64 ? `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}` : null);
      if (!generatedAudioUrl) {
        throw new Error('La IA no devolvió audio esta vez (puede pasar con Lyria/MusicGen). Prueba a regenerar o cambia el estilo/instrucción.');
      }

      setAiTrackGenPreview({
        audioUrl: generatedAudioUrl,
        trackName: data.trackName || `Pista IA: ${aiTrackGenInstrument}`,
        arrangementNotes: data.arrangementNotes || 'Generado en armonía con la tonalidad y BPM.'
      });
    } catch (err: any) {
      console.error("Error al generar pista por IA:", err);
      setAiTrackGenError(err?.message || 'No se pudo generar la pista de instrumento. Inténtalo de nuevo.');
    } finally {
      setIsGeneratingAiTrack(false);
    }
  };

  const handleConfirmAddAiTrack = (targetIdea: SongAudioIdea) => {
    if (!aiTrackGenPreview) return;
    const existing = getIdeaTracks(targetIdea);
    const newAiTrack: AudioTrack = {
      id: `ai-track-${Date.now()}`,
      nombre: aiTrackGenPreview.trackName,
      audioUrl: aiTrackGenPreview.audioUrl,
      autor: 'IA Lyria & Gemini',
      instrumento: aiTrackGenInstrument,
      fecha: new Date().toISOString().split('T')[0],
      volumen: 1,
      muted: false,
      // Negativo = retrasa la entrada de la pista en la mezcla (mismo campo que la corrección
      // fina de latencia, reutilizado aquí para colocar el clip de ~30s en el punto de la canción
      // que el usuario eligió en vez de siempre al principio).
      desfaseMs: aiTrackGenStartOffsetSec > 0 ? -(aiTrackGenStartOffsetSec * 1000) : 0
    };

    const updatedIdeas = (song.audioIdeas || []).map(i =>
      i.id === targetIdea.id ? { ...i, pistas: [...existing, newAiTrack] } : i
    );

    onUpdateSong({ ...song, audioIdeas: updatedIdeas });
    setShowAiTrackGenModal(null);
    setAiTrackGenPreview(null);
    setAiTrackGenPrompt('');
    setAiTrackGenStartOffsetSec(0);
  };

  // Studio Fullscreen Mode State & Handler
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  const toggleIsFullScreen = () => {
    setIsFullScreen(prev => {
      const next = !prev;
      if (next) {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
      return next;
    });
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isFullScreen]);

  // DSP Noise Reduction & Anti-Bleed Studio Settings
  const [useCleanDSPFilter, setUseCleanDSPFilter] = useState<boolean>(true);
  const [useEchoCancellation, setUseEchoCancellation] = useState<boolean>(true);
  const [useNoiseSuppression, setUseNoiseSuppression] = useState<boolean>(true);
  const [autoLatencyTrimMs, setAutoLatencyTrimMs] = useState<number>(110);
  const [useCountInMetronome, setUseCountInMetronome] = useState<boolean>(true);
  const [countInCountdown, setCountInCountdown] = useState<number | null>(null);
  const [cleaningTrackId, setCleaningTrackId] = useState<string | null>(null);
  const cleanPipelineRef = useRef<any>(null);

  // Web Audio API DSP nodes map for live smooth volume, 3-band EQ, Stem Isolators and Stereo Panning per track
  const trackDSPMapRef = useRef<Record<string, {
    element: HTMLAudioElement;
    source?: MediaElementAudioSourceNode;
    stemFilter?: BiquadFilterNode | null;
    eqLow?: BiquadFilterNode;
    eqMid?: BiquadFilterNode;
    eqHigh?: BiquadFilterNode;
    gainNode?: GainNode;
    panNode?: StereoPannerNode | GainNode;
  }>>({});

  const updateTrackAudioDSP = (
    trackId: string,
    el: HTMLAudioElement | null,
    tr: { 
      volumen?: number; 
      muted?: boolean; 
      solo?: boolean; 
      eqLow?: number; 
      eqMid?: number; 
      eqHigh?: number; 
      pan?: number; 
      instrumento?: string;
      nombre?: string;
      audioUrl?: string;
    },
    hasSoloInSession: boolean = false
  ) => {
    if (!el) return;

    const isAudible = (hasSoloInSession ? !!tr.solo : true) && !tr.muted;
    const targetGain = isAudible ? Math.max(0, tr.volumen ?? 1) : 0;

    // Apply direct HTML5 Audio element volume baseline first to prevent silence on cross-origin stems
    try {
      el.volume = applyMasterToElementVolume(targetGain);
      el.muted = !isAudible;
    } catch (e) {}

    try {
      if (!studioAudioCtxRef.current || studioAudioCtxRef.current.state === 'closed') {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          studioAudioCtxRef.current = new AudioCtxClass();
        }
      }

      const ctx = studioAudioCtxRef.current;
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      let dsp = trackDSPMapRef.current[trackId];

      if (!dsp || dsp.element !== el) {
        let source: MediaElementAudioSourceNode | undefined = (el as any).__mediaElementSource;

        if (!source) {
          const isSameOriginOrBlob = !el.src || el.src.startsWith('blob:') || el.src.startsWith('data:') || el.src.includes(window.location.host);
          if (isSameOriginOrBlob) {
            try {
              source = ctx.createMediaElementSource(el);
              (el as any).__mediaElementSource = source;
            } catch (e) {
              source = (el as any).__mediaElementSource;
            }
          }
        }

        if (source) {
          // Only apply simulated frequency isolation filter if track shares the exact original unseparated mix file
          // If it's a dedicated stem file (Demucs v4, FFmpeg isolated stem, or uploaded WAV), let it play in full 20Hz-20kHz studio fidelity!
          let stemFilter: BiquadFilterNode | null = null;
          const inst = (tr.instrumento || tr.nombre || '').toLowerCase();
          const isDedicatedStem = (
            (el.src && (el.src.includes('/stems/') || el.src.includes('stem-') || el.src.includes('replicate.delivery') || el.src.startsWith('blob:'))) ||
            (tr.audioUrl && (tr.audioUrl.includes('/stems/') || tr.audioUrl.includes('stem-') || tr.audioUrl.includes('replicate.delivery') || tr.audioUrl.startsWith('blob:')))
          );

          if (!isDedicatedStem) {
            if (inst.includes('voz') || inst.includes('vocal')) {
              // Gentle vocal contour only for unseparated base mix
              stemFilter = ctx.createBiquadFilter();
              stemFilter.type = 'peaking';
              stemFilter.frequency.value = 1500;
              stemFilter.Q.value = 1.2;
              stemFilter.gain.value = 6;
            } else if (inst.includes('batería') || inst.includes('bateria') || inst.includes('drum')) {
              stemFilter = ctx.createBiquadFilter();
              stemFilter.type = 'highpass';
              stemFilter.frequency.value = 1200;
              stemFilter.Q.value = 0.7;
            } else if (inst.includes('bajo') || inst.includes('bass')) {
              stemFilter = ctx.createBiquadFilter();
              stemFilter.type = 'lowpass';
              stemFilter.frequency.value = 240;
              stemFilter.Q.value = 1.0;
            }
          }

          // 1. Low Shelf Filter (Graves < 150Hz)
          const eqLow = ctx.createBiquadFilter();
          eqLow.type = 'lowshelf';
          eqLow.frequency.value = 150;
          eqLow.gain.value = tr.eqLow ?? 0;

          // 2. Peaking Filter (Medios 1000Hz)
          const eqMid = ctx.createBiquadFilter();
          eqMid.type = 'peaking';
          eqMid.frequency.value = 1000;
          eqMid.Q.value = 1.0;
          eqMid.gain.value = tr.eqMid ?? 0;

          // 3. High Shelf Filter (Agudos > 3500Hz)
          const eqHigh = ctx.createBiquadFilter();
          eqHigh.type = 'highshelf';
          eqHigh.frequency.value = 3500;
          eqHigh.gain.value = tr.eqHigh ?? 0;

          // 4. Smooth GainNode (Web Audio volume control)
          const gainNode = ctx.createGain();

          // 5. Stereo Panner Node L / R
          let panNode: StereoPannerNode | GainNode;
          if (ctx.createStereoPanner) {
            panNode = ctx.createStereoPanner();
            (panNode as StereoPannerNode).pan.value = tr.pan ?? 0;
          } else {
            panNode = ctx.createGain();
          }

          // Connect DSP chain in series
          let lastNode: AudioNode = source;
          if (stemFilter) {
            lastNode.connect(stemFilter);
            lastNode = stemFilter;
          }
          lastNode.connect(eqLow);
          eqLow.connect(eqMid);
          eqMid.connect(eqHigh);
          eqHigh.connect(gainNode);
          gainNode.connect(panNode);
          panNode.connect(getOrCreateMasterGain(ctx));

          // Keep HTMLAudioElement volume at 1.0 so GainNode controls volume without HTMLAudioElement stutter
          el.volume = 1.0;

          dsp = { element: el, source, stemFilter, eqLow, eqMid, eqHigh, gainNode, panNode };
          trackDSPMapRef.current[trackId] = dsp;
        }
      }

      const now = ctx.currentTime;
      const isAudible = (hasSoloInSession ? !!tr.solo : true) && !tr.muted;
      const targetGain = isAudible ? Math.max(0, tr.volumen ?? 1) : 0;

      if (dsp && dsp.gainNode) {
        // Smooth gain transition over 15ms (setTargetAtTime prevents clicking, popping, buffer drops)
        dsp.gainNode.gain.setTargetAtTime(targetGain, now, 0.015);

        if (dsp.eqLow) dsp.eqLow.gain.setTargetAtTime(tr.eqLow ?? 0, now, 0.015);
        if (dsp.eqMid) dsp.eqMid.gain.setTargetAtTime(tr.eqMid ?? 0, now, 0.015);
        if (dsp.eqHigh) dsp.eqHigh.gain.setTargetAtTime(tr.eqHigh ?? 0, now, 0.015);

        if (dsp.panNode && 'pan' in dsp.panNode) {
          (dsp.panNode as StereoPannerNode).pan.setTargetAtTime(tr.pan ?? 0, now, 0.015);
        }
      } else {
        // Fallback to HTMLAudioElement volume if WebAudio source creation was bypassed
        el.volume = applyMasterToElementVolume(targetGain);
      }
    } catch (err) {
      console.warn("Could not setup WebAudio DSP for track:", trackId, err);
      const isAudible = (hasSoloInSession ? !!tr.solo : true) && !tr.muted;
      el.volume = applyMasterToElementVolume(isAudible ? Math.max(0, tr.volumen ?? 1) : 0);
    }
  };

  const triggerCountInBeeps = (bpm: number, onDone: () => void) => {
    try {
      if (!studioAudioCtxRef.current) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) studioAudioCtxRef.current = new AudioCtxClass();
      }
      const ctx = studioAudioCtxRef.current;
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});

      const songBpm = bpm > 40 && bpm < 240 ? bpm : (song.bpm || 120);
      const beatIntervalMs = Math.max(300, Math.min(1200, (60 / songBpm) * 1000));

      const playBeep = (freq: number) => {
        try {
          if (!ctx) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
          osc.connect(gain);
          gain.connect(getOrCreateMasterGain(ctx));
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.09);
        } catch (_) {}
      };

      setCountInCountdown(4);
      playBeep(880);

      let current = 4;
      const interval = setInterval(() => {
        current -= 1;
        if (current > 0) {
          setCountInCountdown(current);
          playBeep(current === 1 ? 1760 : 880);
        } else {
          clearInterval(interval);
          setCountInCountdown(null);
          onDone();
        }
      }, beatIntervalMs);
    } catch (err) {
      setCountInCountdown(null);
      onDone();
    }
  };

  // Resolved audio URLs for HTML audio elements (resolves indexeddb: and drive URLs)
  const [resolvedAudioUrls, setResolvedAudioUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;
    const resolveAllTracks = async () => {
      const allTracks: AudioTrack[] = [];
      (song.audioIdeas || []).forEach(idea => {
        const trs = getIdeaTracks(idea);
        allTracks.push(...trs);
      });

      const urlMap: Record<string, string> = {};
      for (const tr of allTracks) {
        if (tr.audioUrl) {
          if (tr.audioUrl.startsWith('indexeddb:') || tr.audioUrl.includes('drive.google.com')) {
            const res = await resolveAudioUrl(tr.audioUrl);
            if (res) urlMap[tr.id] = res;
          } else {
            urlMap[tr.id] = tr.audioUrl;
          }
        }
      }

      if (isMounted) {
        setResolvedAudioUrls(prev => {
          const keysCurr = Object.keys(urlMap);
          const keysPrev = Object.keys(prev);
          if (keysCurr.length === keysPrev.length && keysCurr.every(k => prev[k] === urlMap[k])) {
            return prev;
          }
          return urlMap;
        });
      }
    };

    resolveAllTracks();
    return () => { isMounted = false; };
  }, [song]);

  // --- NEW IDEA AI BASE GENERATION STATE ---
  const [genAiOnNewIdea, setGenAiOnNewIdea] = useState<boolean>(false);
  const [newIdeaBpm, setNewIdeaBpm] = useState<number>(song.bpm || 120);
  const [newIdeaKey, setNewIdeaKey] = useState<string>(song.tonalidad || 'Do');
  const [newIdeaStyle, setNewIdeaStyle] = useState<DrumPatternStyle>('rock');
  const [newIdeaIncludeDrums, setNewIdeaIncludeDrums] = useState<boolean>(true);
  const [newIdeaIncludeBass, setNewIdeaIncludeBass] = useState<boolean>(true);

  // --- SONG ORIGINAL BASE TRACK STATE ---
  const [useSongBaseTrack, setUseSongBaseTrack] = useState<boolean>(false);
  const [selectedSongBaseUrl, setSelectedSongBaseUrl] = useState<string>(
    song.audioPrincipalUrl || (song.audioIdeas && song.audioIdeas[0]?.audioUrl) || ''
  );

  useEffect(() => {
    if (song.audioPrincipalUrl) {
      setSelectedSongBaseUrl(song.audioPrincipalUrl);
    } else if (song.audioIdeas && song.audioIdeas.length > 0 && song.audioIdeas[0]?.audioUrl) {
      setSelectedSongBaseUrl(song.audioIdeas[0].audioUrl);
    }
  }, [song]);

  // --- CONFIRMATION MODAL STATE FOR DELETIONS ---
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);


  // --- TRACK EQ & MASTER EXPORT STATE ---
  const [expandedTrackSettingsId, setExpandedTrackSettingsId] = useState<string | null>(null);
  const [isExportingMaster, setIsExportingMaster] = useState<boolean>(false);



  // Audio elements refs map for multitrack: trackAudioRefs.current[trackId]
  const trackAudioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const pendingPlayPromiseRefs = useRef<Record<string, Promise<void>>>({});
  const lastPlayAttemptMapRef = useRef<Record<string, number>>({});
  
  // High-precision WebAudio & Synchronization Master Engine Refs
  const studioAudioCtxRef = useRef<AudioContext | null>(null);
  const syncAnimationFrameRef = useRef<number | null>(null);
  const playingIdeaIdRef = useRef<string | null>(null);

  // Volumen master de salida del Studio — control personal de escucha (nunca se guarda en song,
  // no es parte de la mezcla de la banda, solo cuánto suena EN TU dispositivo mientras trabajas).
  // Todas las pistas se conectan a este gain compartido en vez de ir directas a ctx.destination.
  const [masterVolume, setMasterVolume] = useState<number>(1);
  const masterGainNodeRef = useRef<GainNode | null>(null);
  const getOrCreateMasterGain = (ctx: AudioContext): GainNode => {
    if (!masterGainNodeRef.current || masterGainNodeRef.current.context !== ctx) {
      const g = ctx.createGain();
      g.gain.value = masterVolume;
      g.connect(ctx.destination);
      masterGainNodeRef.current = g;
    }
    return masterGainNodeRef.current;
  };
  // Para pistas de origen cruzado (Supabase Storage, la mayoría del audio real) el navegador nunca
  // llega a construir el MediaElementAudioSourceNode (ver isSameOriginOrBlob más abajo), así que el
  // GainNode maestro de arriba jamás entra en su cadena de audio — solo sirve para las pistas
  // mismo-origen/blob. Para que el master también afecte a esas pistas hay que aplicarlo al propio
  // `el.volume` nativo (con techo de 1.0: el elemento no puede amplificar por encima del 100%,
  // solo el GainNode puede boostear).
  const applyMasterToElementVolume = (perTrackGain: number) => Math.max(0, Math.min(1, perTrackGain * masterVolume));
  useEffect(() => {
    if (masterGainNodeRef.current) {
      masterGainNodeRef.current.gain.value = masterVolume;
    }
  }, [masterVolume]);

  const ideasList = song.audioIdeas || [];

  const filteredIdeas = activeSectionFilter === 'todas' 
    ? ideasList 
    : ideasList.filter(i => i.seccion === activeSectionFilter);

  // Safe helper to extract finite audio duration in seconds
  const getSafeTrackDuration = (el: HTMLAudioElement | null | undefined): number => {
    if (!el) return 0;
    const dur = el.duration;
    if (dur && !isNaN(dur) && isFinite(dur) && dur > 0) return dur;
    return 0;
  };

  const getValidIdeaDuration = (ideaId: string): number => {
    const raw = durationMap[ideaId];
    if (raw && !isNaN(raw) && isFinite(raw) && raw > 0) {
      return raw;
    }
    return 30;
  };

  // Format seconds to M:SS
  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || !isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Bajo ~1s siguen siendo micro-correcciones de latencia (+Nms); por encima es una pista (p.ej.
  // IA) colocada deliberadamente más adelante en la canción, así que se lee mejor como timestamp.
  const formatDesfase = (ms?: number) => {
    const val = ms || 0;
    if (val === 0) return '0ms';
    if (Math.abs(val) >= 1000) {
      return val < 0 ? `empieza en ${formatTime(-val / 1000)}` : `+${(val / 1000).toFixed(1)}s`;
    }
    return val > 0 ? `+${val}ms` : `${val}ms`;
  };

  // Cue Loop Helper Functions
  const toggleIdeaLoop = (idea: SongAudioIdea) => {
    const maxDur = getValidIdeaDuration(idea.id);
    setLoopConfigMap(prev => {
      const current = prev[idea.id] || { enabled: false, start: 0, end: maxDur };
      return {
        ...prev,
        [idea.id]: { ...current, enabled: !current.enabled }
      };
    });
  };

  const setIdeaCueIn = (idea: SongAudioIdea) => {
    const curTime = currentTimeMap[idea.id] || 0;
    const maxDur = getValidIdeaDuration(idea.id);
    setLoopConfigMap(prev => {
      const current = prev[idea.id] || { enabled: true, start: 0, end: maxDur };
      const newEnd = current.end > curTime ? current.end : maxDur;
      return {
        ...prev,
        [idea.id]: { enabled: true, start: curTime, end: newEnd }
      };
    });
  };

  const setIdeaCueOut = (idea: SongAudioIdea) => {
    const curTime = currentTimeMap[idea.id] || 0;
    const maxDur = getValidIdeaDuration(idea.id);
    setLoopConfigMap(prev => {
      const current = prev[idea.id] || { enabled: true, start: 0, end: maxDur };
      const newStart = current.start < curTime ? current.start : 0;
      return {
        ...prev,
        [idea.id]: { enabled: true, start: newStart, end: curTime }
      };
    });
  };

  const resetIdeaLoopBounds = (idea: SongAudioIdea) => {
    const maxDur = getValidIdeaDuration(idea.id);
    setLoopConfigMap(prev => ({
      ...prev,
      [idea.id]: { enabled: true, start: 0, end: maxDur }
    }));
  };

  // High-Precision Master Sync Loop (16ms / requestAnimationFrame)
  // Keeps all multitrack audio elements aligned within < 10ms with pitch-safe micro-adjustments
  // Handles variable track durations cleanly by padding shorter tracks
  const runMasterSyncLoop = (idea: SongAudioIdea) => {
    if (syncAnimationFrameRef.current) {
      cancelAnimationFrame(syncAnimationFrameRef.current);
      syncAnimationFrameRef.current = null;
    }

    const tracks = getIdeaTracks(idea);
    if (tracks.length === 0) return;

    const hasSolo = tracks.some((t: any) => t.solo);

    // 1. Determine maximum idea duration across all loaded audio tracks
    let maxIdeaDuration = 0;
    tracks.forEach(tr => {
      const el = trackAudioRefs.current[tr.id];
      const dur = getSafeTrackDuration(el);
      if (dur > maxIdeaDuration) {
        maxIdeaDuration = dur;
      }
    });
    if (maxIdeaDuration === 0 || !isFinite(maxIdeaDuration)) {
      maxIdeaDuration = getValidIdeaDuration(idea.id);
    }

    // 2. Select master clock track element (longest active non-muted track)
    let masterTrack = tracks[0];
    let longestDur = 0;
    tracks.forEach(tr => {
      const el = trackAudioRefs.current[tr.id];
      const dur = getSafeTrackDuration(el);
      if (dur >= longestDur && !tr.muted) {
        longestDur = dur;
        masterTrack = tr;
      }
    });

    let masterEl = trackAudioRefs.current[masterTrack.id];
    if (!masterEl) {
      for (const tr of tracks) {
        if (trackAudioRefs.current[tr.id]) {
          masterEl = trackAudioRefs.current[tr.id];
          break;
        }
      }
    }

    let lastReportedTime = -1;

    const tick = () => {
      if (playingIdeaIdRef.current !== idea.id) {
        return;
      }

      // Read fresh track definitions and solo status from songRef
      const currentSong = songRef.current || song;
      const currentIdea = (currentSong.audioIdeas || []).find(i => i.id === idea.id) || idea;
      const activeTracks = getIdeaTracks(currentIdea);
      const activeHasSolo = activeTracks.some(t => t.solo);

      // Rock-solid Master Clock reference:
      // masterEl serves as the uninterrupted timeline anchor. It does NOT switch on Mute/Solo
      // because GainNode controls silence without disrupting playback or jumping clocks.
      let currentMasterEl: HTMLAudioElement | null = masterEl;
      if (!currentMasterEl || currentMasterEl.paused) {
        for (const tr of activeTracks) {
          const el = trackAudioRefs.current[tr.id];
          if (el && !el.paused && el.currentTime >= 0) {
            currentMasterEl = el;
            break;
          }
        }
      }
      if (!currentMasterEl) {
        currentMasterEl = masterEl || trackAudioRefs.current[masterTrack.id] || null;
      }

      const masterTime = currentMasterEl ? currentMasterEl.currentTime : (currentTimeMap[idea.id] || 0);

      // Loop / Cue Bounds
      const loopCfg = loopConfigMap[idea.id];
      const isLoopEnabled = !!loopCfg?.enabled;
      const loopStart = loopCfg?.start || 0;
      const loopEnd = (loopCfg?.end && isFinite(loopCfg.end) && loopCfg.end > loopStart) ? loopCfg.end : maxIdeaDuration;

      // A. Loop Cue Detection: Check if loop end point hit
      if (isLoopEnabled && masterTime >= loopEnd - 0.05) {
        handleSeekIdea(idea, loopStart);
        syncAnimationFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      // B. Align and enforce playback on all active tracks
      activeTracks.forEach(tr => {
        const slaveEl = trackAudioRefs.current[tr.id];
        if (!slaveEl) return;

        const slaveDur = getSafeTrackDuration(slaveEl);
        const isMuted = tr.muted || (activeHasSolo && !tr.solo);
        const targetGain = isMuted ? 0 : Math.max(0, tr.volumen ?? 1);
        const targetElementVolume = applyMasterToElementVolume(targetGain);

        // Only modify DOM properties when changed to prevent Chrome audio engine stutter
        if (slaveEl.muted !== isMuted) {
          slaveEl.muted = isMuted;
        }
        if (Math.abs(slaveEl.volume - targetElementVolume) > 0.005) {
          slaveEl.volume = targetElementVolume;
        }

        const dsp = trackDSPMapRef.current[tr.id];
        if (dsp && dsp.gainNode && studioAudioCtxRef.current) {
          try {
            const currentGain = dsp.gainNode.gain.value;
            if (Math.abs(currentGain - targetGain) > 0.005) {
              dsp.gainNode.gain.setTargetAtTime(targetGain, studioAudioCtxRef.current.currentTime, 0.015);
            }
          } catch (_) {}
        }

        const trackOffsetSec = (tr.desfaseMs || 0) / 1000;
        const targetSlaveTime = masterTime + trackOffsetSec;

        // If master has not reached track offset yet, keep slave paused at 0
        if (targetSlaveTime < 0) {
          if (!slaveEl.paused) slaveEl.pause();
          if (Math.abs(slaveEl.currentTime) > 0.01) {
            try { slaveEl.currentTime = 0; } catch {}
          }
          return;
        }

        // If track has ended its length, keep it quietly paused at end
        if (slaveDur > 0 && targetSlaveTime >= slaveDur - 0.05) {
          if (!slaveEl.paused) slaveEl.pause();
          return;
        }

        // Ensure slave element is playing if in active audio range (throttled & non-blocking to prevent Chrome audio engine lockup)
        const isPending = !!pendingPlayPromiseRefs.current[tr.id];
        if (slaveEl.paused && !isPending && slaveEl.src && !slaveEl.src.startsWith('indexeddb:') && (slaveDur === 0 || targetSlaveTime < slaveDur - 0.05)) {
          const now = Date.now();
          const lastAttempt = lastPlayAttemptMapRef.current[tr.id] || 0;
          if (now - lastAttempt > 600) {
            lastPlayAttemptMapRef.current[tr.id] = now;
            const p = slaveEl.play();
            if (p !== undefined) {
              pendingPlayPromiseRefs.current[tr.id] = p;
              p.then(() => {
                delete pendingPlayPromiseRefs.current[tr.id];
              }).catch(() => {
                delete pendingPlayPromiseRefs.current[tr.id];
              });
            }
          }
        }

        // Keep playbackRate always at 1.0 to eliminate resample distortion and pitch wobble
        if (slaveEl.playbackRate !== 1.0) {
          slaveEl.playbackRate = 1.0;
        }

        // Hard seek ONLY when drift is severe (> 350ms) to prevent continuous seek popping
        if (currentMasterEl && slaveEl !== currentMasterEl) {
          const diff = slaveEl.currentTime - targetSlaveTime;
          if (Math.abs(diff) > 0.35) {
            try { slaveEl.currentTime = Math.max(0, targetSlaveTime); } catch {}
          }
        }
      });

      // Update progress & duration maps at smooth ~10fps (every 100ms) to eliminate React re-render thrashing
      if (Math.abs(masterTime - lastReportedTime) >= 0.10 || lastReportedTime < 0) {
        lastReportedTime = masterTime;
        setCurrentTimeMap(prev => ({ ...prev, [idea.id]: masterTime }));
      }

      if (maxIdeaDuration > 0 && isFinite(maxIdeaDuration)) {
        setDurationMap(prev => ({ ...prev, [idea.id]: maxIdeaDuration }));
      }

      // Check if finished (if loop is disabled)
      if (!isLoopEnabled && maxIdeaDuration > 0 && currentMasterEl && (currentMasterEl.ended || masterTime >= maxIdeaDuration - 0.05)) {
        handleStopIdea(idea);
        return;
      }

      syncAnimationFrameRef.current = requestAnimationFrame(tick);
    };

    syncAnimationFrameRef.current = requestAnimationFrame(tick);
  };

  // Master Transport: Pause (holds position)
  const handlePauseIdea = (idea: SongAudioIdea) => {
    if (syncAnimationFrameRef.current) {
      cancelAnimationFrame(syncAnimationFrameRef.current);
      syncAnimationFrameRef.current = null;
    }
    const tracks = getIdeaTracks(idea);
    tracks.forEach(tr => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        el.pause();
        el.playbackRate = 1.0;
      }
    });
    pendingPlayPromiseRefs.current = {};
    playingIdeaIdRef.current = null;
    setPlayingIdeaId(null);
  };

  // Master Transport: Stop (resets position to start / loop start)
  const handleStopIdea = (idea: SongAudioIdea) => {
    if (syncAnimationFrameRef.current) {
      cancelAnimationFrame(syncAnimationFrameRef.current);
      syncAnimationFrameRef.current = null;
    }
    const tracks = getIdeaTracks(idea);
    const loopCfg = loopConfigMap[idea.id];
    const startPos = (loopCfg && loopCfg.enabled && loopCfg.start > 0) ? loopCfg.start : 0;

    tracks.forEach(tr => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        el.pause();
        const targetTrackTime = Math.max(0, startPos + ((tr.desfaseMs || 0) / 1000));
        try { el.currentTime = targetTrackTime; } catch {}
        el.playbackRate = 1.0;
      }
    });

    pendingPlayPromiseRefs.current = {};
    setCurrentTimeMap(prev => ({ ...prev, [idea.id]: startPos }));
    playingIdeaIdRef.current = null;
    setPlayingIdeaId(null);
  };

  // Master Transport: Play (starts/resumes from current position)
  const handlePlayIdea = async (idea: SongAudioIdea) => {
    // 1. Immediately unlock and resume AudioContext in the user click callstack
    try {
      if (!studioAudioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) studioAudioCtxRef.current = new AudioCtx();
      }
      if (studioAudioCtxRef.current && studioAudioCtxRef.current.state === 'suspended') {
        studioAudioCtxRef.current.resume().catch((e) => console.warn("AudioContext resume warning:", e));
      }
    } catch (e) {
      console.warn("AudioContext resume warning:", e);
    }

    // Pause all audio from other ideas
    (Object.values(trackAudioRefs.current) as (HTMLAudioElement | null)[]).forEach(el => {
      if (el) el.pause();
    });

    const tracks = getIdeaTracks(idea);
    if (tracks.length === 0) return;

    const hasSoloTrack = tracks.some(t => t.solo);
    let startPos = currentTimeMap[idea.id] || 0;

    let maxDur = 0;
    tracks.forEach(tr => {
      let el = trackAudioRefs.current[tr.id];
      if (!el) {
        el = new Audio(SILENT_AUDIO_URI);
        trackAudioRefs.current[tr.id] = el;
      }
      const dur = getSafeTrackDuration(el);
      if (dur > maxDur) maxDur = dur;
    });
    if (maxDur === 0) maxDur = getValidIdeaDuration(idea.id);

    // Auto rewind if at or beyond end
    if (maxDur > 0 && startPos >= maxDur - 0.2) {
      startPos = 0;
      setCurrentTimeMap(prev => ({ ...prev, [idea.id]: 0 }));
    }

    // Set playing state IMMEDIATELY so UI reflects playback and loop runs
    playingIdeaIdRef.current = idea.id;
    setPlayingIdeaId(idea.id);

    // Synchronize initial timestamps, DSP and volumes across all tracks
    for (const tr of tracks) {
      let el = trackAudioRefs.current[tr.id];
      if (!el) {
        el = new Audio(SILENT_AUDIO_URI);
        trackAudioRefs.current[tr.id] = el;
      }

      let resolvedUrl = resolvedAudioUrls[tr.id] || tr.audioUrl;
      if (resolvedUrl && (resolvedUrl.startsWith('indexeddb:') || resolvedUrl.includes('drive.google.com'))) {
        try {
          const res = await resolveAudioUrl(resolvedUrl);
          if (res) {
            resolvedUrl = res;
            setResolvedAudioUrls(prev => ({ ...prev, [tr.id]: res }));
          }
        } catch (_) {}
      }

      if (resolvedUrl && !resolvedUrl.startsWith('indexeddb:') && (!el.src || el.src === '' || el.src.endsWith('undefined') || (!el.src.includes(resolvedUrl) && el.src !== resolvedUrl))) {
        el.src = resolvedUrl;
      }

      if (el.readyState === 0 && el.src && !el.src.startsWith('indexeddb:')) {
        try { el.load(); } catch {}
      }

      const trackDur = getSafeTrackDuration(el);
      const trackOffsetSec = (tr.desfaseMs || 0) / 1000;
      const targetTrackTime = Math.max(0, startPos + trackOffsetSec);

      if (trackDur > 0 && startPos >= trackDur) {
        try { el.currentTime = trackDur; } catch {}
        el.pause();
      } else {
        if (Math.abs((el.currentTime || 0) - targetTrackTime) > 0.03) {
          try { el.currentTime = targetTrackTime; } catch {}
        }
        el.playbackRate = 1.0;
        el.muted = false;

        // Apply DSP and volume
        updateTrackAudioDSP(tr.id, el, tr, hasSoloTrack);

        // Ensure audio element play is triggered
        if (el.src && el.src !== '' && !el.src.endsWith('undefined') && !el.src.startsWith('indexeddb:')) {
          if (!pendingPlayPromiseRefs.current[tr.id]) {
            const p = el.play();
            if (p !== undefined) {
              pendingPlayPromiseRefs.current[tr.id] = p;
              p.then(() => {
                delete pendingPlayPromiseRefs.current[tr.id];
              }).catch(err => {
                delete pendingPlayPromiseRefs.current[tr.id];
                console.warn(`Track ${tr.id} play deferred:`, err);
              });
            }
          }
        }
      }
    }

    // 3. Launch Master Sync Engine
    runMasterSyncLoop(idea);
  };

  // Toggle Play / Pause
  const togglePlayIdea = async (idea: SongAudioIdea) => {
    if (playingIdeaId === idea.id || playingIdeaIdRef.current === idea.id) {
      handlePauseIdea(idea);
    } else {
      await handlePlayIdea(idea);
    }
  };

  // Seek master progress for an idea
  const handleSeekIdea = (idea: SongAudioIdea, newTime: number) => {
    const tracks = getIdeaTracks(idea);
    const targetTime = Math.max(0, newTime);

    tracks.forEach(tr => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        const dur = getSafeTrackDuration(el);
        if (dur > 0 && targetTime >= dur) {
          el.currentTime = dur;
          if (!el.paused) el.pause();
        } else {
          el.currentTime = targetTime;
          el.playbackRate = 1.0;
          if (playingIdeaIdRef.current === idea.id && el.paused && !tr.muted) {
            el.play().catch(() => {});
          }
        }
      }
    });
    setCurrentTimeMap(prev => ({ ...prev, [idea.id]: targetTime }));

    if (playingIdeaIdRef.current === idea.id) {
      runMasterSyncLoop(idea);
    }
  };

  // Jump to timestamp from comment
  const jumpToTime = (idea: SongAudioIdea, timestampSegs: number) => {
    handleSeekIdea(idea, timestampSegs);
    if (playingIdeaId !== idea.id) {
      handlePlayIdea(idea);
    }
  };

  // Stop background discography player when entering studio modal & cleanup on unmount
  useEffect(() => {
    // Silence any background discography audio elements when entering Song Studio
    const allAudioElements = document.querySelectorAll('audio');
    allAudioElements.forEach(el => {
      try {
        el.pause();
      } catch {}
    });

    return () => {
      if (syncAnimationFrameRef.current) {
        cancelAnimationFrame(syncAnimationFrameRef.current);
      }
      // Stop all multitrack studio audio elements on unmount
      Object.values(trackAudioRefs.current).forEach(el => {
        if (el) {
          try {
            el.pause();
            el.currentTime = 0;
          } catch {}
        }
      });
      playingIdeaIdRef.current = null;
    };
  }, []);

  // Cubase Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keypresses if typing in input, textarea, select or contenteditable
      const activeEl = document.activeElement;
      if (activeEl) {
        const tagName = activeEl.tagName.toUpperCase();
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || (activeEl as HTMLElement).isContentEditable) {
          return;
        }
      }

      const activeIdea = (song.audioIdeas || []).find(i => i.id === playingIdeaIdRef.current) || (song.audioIdeas || [])[0];

      // If currently recording an overdub track, pressing R, Space, or Stop keys finishes recording
      if (isRecordingTrack) {
        if (['Space', 'Numpad0', 'Digit0', 'KeyR', 'NumpadMultiply', 'KeyP', 'Escape', 'Home', 'NumpadEnter'].includes(e.code) || e.key === 'Home') {
          e.preventDefault();
          stopRecordingTrackOverdub();
          return;
        }
      }

      // [Espacio]: Alternar Reproducir / Pausar Transport
      if (e.code === 'Space') {
        e.preventDefault();
        if (activeIdea) {
          togglePlayIdea(activeIdea);
        }
      }
      // [Numpad0 / Digit0 / Home / Escape / Enter]: Detener e ir a inicio (Stop & Rewind)
      else if (e.code === 'Numpad0' || e.code === 'Digit0' || e.key === 'Home' || e.code === 'NumpadEnter') {
        e.preventDefault();
        if (activeIdea) {
          handleStopIdea(activeIdea);
        }
      }
      // [KeyP]: Pausar en posición actual
      else if (e.code === 'KeyP') {
        e.preventDefault();
        if (activeIdea) {
          handlePauseIdea(activeIdea);
        }
      }
      // [KeyL / Slash]: Alternar Bucle (Loop)
      else if (e.code === 'KeyL' || e.code === 'Slash') {
        e.preventDefault();
        if (activeIdea) {
          toggleIdeaLoop(activeIdea);
        }
      }
      // [KeyI]: Fijar Cue In / Loop Start en la posición actual
      else if (e.code === 'KeyI') {
        e.preventDefault();
        if (activeIdea) {
          setIdeaCueIn(activeIdea);
        }
      }
      // [KeyO]: Fijar Cue Out / Loop End en la posición actual
      else if (e.code === 'KeyO') {
        e.preventDefault();
        if (activeIdea) {
          setIdeaCueOut(activeIdea);
        }
      }
      // [KeyR / NumpadMultiply]: Iniciar grabación overdub
      else if (e.code === 'KeyR' || e.code === 'NumpadMultiply') {
        e.preventDefault();
        if (activeIdea) {
          startRecordingTrackOverdub(activeIdea);
        } else {
          setShowAddIdea(true);
        }
      }
      // [KeyN]: Abrir/Cerrar formulario de Nueva Idea
      else if (e.code === 'KeyN') {
        e.preventDefault();
        setShowAddIdea(prev => !prev);
      }
      // [Flecha Izquierda]: Retroceder 5s (o 15s con Shift)
      else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (activeIdea) {
          const cur = currentTimeMap[activeIdea.id] || 0;
          const delta = e.shiftKey ? 15 : 5;
          handleSeekIdea(activeIdea, Math.max(0, cur - delta));
        }
      }
      // [Flecha Derecha]: Avanzar 5s (o 15s con Shift)
      else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (activeIdea) {
          const cur = currentTimeMap[activeIdea.id] || 0;
          const maxDur = durationMap[activeIdea.id] || 300;
          const delta = e.shiftKey ? 15 : 5;
          handleSeekIdea(activeIdea, Math.min(maxDur, cur + delta));
        }
      }
      // [KeyM]: Alternar Silencio (Mute) en la idea activa
      else if (e.code === 'KeyM') {
        e.preventDefault();
        if (activeIdea) {
          const tracks = getIdeaTracks(activeIdea);
          if (tracks.length > 0) {
            tracks.forEach(tr => handleToggleMuteTrack(activeIdea, tr.id));
          }
        }
      }
      // [KeyS]: Alternar Solo en la primera pista
      else if (e.code === 'KeyS') {
        e.preventDefault();
        if (activeIdea) {
          const tracks = getIdeaTracks(activeIdea);
          if (tracks.length > 0) {
            handleToggleSoloTrack(activeIdea, tracks[0].id);
          }
        }
      }
      // [KeyK or ?]: Abrir / Cerrar guía de atajos Cubase
      else if (e.code === 'KeyK' || e.key === '?') {
        e.preventDefault();
        setShowCubaseHelp(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [song, currentTimeMap, durationMap, loopConfigMap]);

  // Handle Track Volume Change
  const handleTrackVolumeChange = (idea: SongAudioIdea, trackId: string, newVol: number) => {
    const tracks = getIdeaTracks(idea);
    const updatedTracks = tracks.map(tr => tr.id === trackId ? { ...tr, volumen: newVol } : tr);
    const hasSolo = updatedTracks.some(t => t.solo);

    updatedTracks.forEach(tr => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        updateTrackAudioDSP(tr.id, el, tr, hasSolo);
      }
    });

    const updatedIdeas = (song.audioIdeas || []).map(i => i.id === idea.id ? { ...i, pistas: updatedTracks } : i);
    const updatedSong = { ...song, audioIdeas: updatedIdeas };
    songRef.current = updatedSong;
    onUpdateSong(updatedSong);
  };

  // Handle Track Latency Desfase Change (Nudge in ms)
  const handleTrackDesfaseChange = (idea: SongAudioIdea, trackId: string, newDesfaseMs: number) => {
    const tracks = getIdeaTracks(idea);
    const updatedTracks = tracks.map(tr => tr.id === trackId ? { ...tr, desfaseMs: newDesfaseMs } : tr);
    
    // Immediately adjust active element currentTime if currently playing
    const el = trackAudioRefs.current[trackId];
    if (el) {
      const masterTime = currentTimeMap[idea.id] || 0;
      const targetTime = Math.max(0, masterTime + (newDesfaseMs / 1000));
      try { el.currentTime = targetTime; } catch {}
    }

    const updatedIdeas = (song.audioIdeas || []).map(i => i.id === idea.id ? { ...i, pistas: updatedTracks } : i);
    const updatedSong = { ...song, audioIdeas: updatedIdeas };
    songRef.current = updatedSong;
    onUpdateSong(updatedSong);
  };

  // Handle Track Mute Toggle
  const handleToggleMuteTrack = (idea: SongAudioIdea, trackId: string) => {
    const tracks = getIdeaTracks(idea);
    const updatedTracks = tracks.map(tr => {
      if (tr.id !== trackId) return tr;
      const nextMuted = !tr.muted;
      return {
        ...tr,
        muted: nextMuted,
        solo: nextMuted ? false : tr.solo // Mutually exclusive: turning Mute ON turns Solo OFF
      };
    });
    const hasSolo = updatedTracks.some(t => t.solo);

    updatedTracks.forEach(tr => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        updateTrackAudioDSP(tr.id, el, tr, hasSolo);
      }
    });

    const updatedIdeas = (song.audioIdeas || []).map(i => i.id === idea.id ? { ...i, pistas: updatedTracks } : i);
    const updatedSong = { ...song, audioIdeas: updatedIdeas };
    songRef.current = updatedSong;
    onUpdateSong(updatedSong);
  };

  // Handle Track Solo Toggle (Cubase style: Exclusive Solo)
  const handleToggleSoloTrack = (idea: SongAudioIdea, trackId: string) => {
    const tracks = getIdeaTracks(idea);
    const targetTrack = tracks.find(t => t.id === trackId);
    const isTargetCurrentlySolo = !!targetTrack?.solo;

    const updatedTracks = tracks.map(tr => {
      if (tr.id === trackId) {
        const nextSolo = !isTargetCurrentlySolo;
        return {
          ...tr,
          solo: nextSolo,
          muted: nextSolo ? false : tr.muted // Turning Solo ON turns Mute OFF
        };
      }
      // Exclusive Solo: turning solo ON for 1 track turns solo OFF for all other tracks
      return {
        ...tr,
        solo: false
      };
    });
    const hasSolo = updatedTracks.some(t => t.solo);

    updatedTracks.forEach(tr => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        updateTrackAudioDSP(tr.id, el, tr, hasSolo);
      }
    });

    const updatedIdeas = (song.audioIdeas || []).map(i => i.id === idea.id ? { ...i, pistas: updatedTracks } : i);
    const updatedSong = { ...song, audioIdeas: updatedIdeas };
    songRef.current = updatedSong;
    onUpdateSong(updatedSong);
  };

  // Handle Track Pan Change (-1 to 1)
  const handleTrackPanChange = (idea: SongAudioIdea, trackId: string, pan: number) => {
    const tracks = getIdeaTracks(idea);
    const updatedTracks = tracks.map(tr => tr.id === trackId ? { ...tr, pan } : tr);
    const hasSolo = updatedTracks.some(t => t.solo);

    updatedTracks.forEach(tr => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        updateTrackAudioDSP(tr.id, el, tr, hasSolo);
      }
    });

    const updatedIdeas = (song.audioIdeas || []).map(i => i.id === idea.id ? { ...i, pistas: updatedTracks } : i);
    const updatedSong = { ...song, audioIdeas: updatedIdeas };
    songRef.current = updatedSong;
    onUpdateSong(updatedSong);
  };

  // Handle Track EQ Change (low, mid, high: -12dB to +12dB)
  const handleTrackEqChange = (idea: SongAudioIdea, trackId: string, band: 'low' | 'mid' | 'high', value: number) => {
    const tracks = getIdeaTracks(idea);
    const updatedTracks = tracks.map(tr => {
      if (tr.id !== trackId) return tr;
      if (band === 'low') return { ...tr, eqLow: value };
      if (band === 'mid') return { ...tr, eqMid: value };
      return { ...tr, eqHigh: value };
    });
    const hasSolo = updatedTracks.some(t => t.solo);

    updatedTracks.forEach(tr => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        updateTrackAudioDSP(tr.id, el, tr, hasSolo);
      }
    });

    const updatedIdeas = (song.audioIdeas || []).map(i => i.id === idea.id ? { ...i, pistas: updatedTracks } : i);
    const updatedSong = { ...song, audioIdeas: updatedIdeas };
    songRef.current = updatedSong;
    onUpdateSong(updatedSong);
  };

  // Handle Export Master Mix WAV
  const handleExportMasterMix = async (idea: SongAudioIdea) => {
    const tracks = getIdeaTracks(idea);
    if (!tracks || tracks.length === 0) {
      alert("No hay pistas registradas en esta sección para exportar.");
      return;
    }

    setIsExportingMaster(true);
    try {
      const tracksToMix = tracks.map(tr => ({
        audioUrl: resolvedAudioUrls[tr.id] || tr.audioUrl,
        volumen: tr.volumen ?? 1,
        pan: tr.pan ?? 0,
        muted: tr.muted ?? false,
        solo: tr.solo ?? false,
        desfaseMs: tr.desfaseMs ?? 0,
        eqLow: tr.eqLow ?? 0,
        eqMid: tr.eqMid ?? 0,
        eqHigh: tr.eqHigh ?? 0,
      }));

      const wavBlob = await exportMasterMixAudioBlob(tracksToMix, resolveAudioUrl);
      const downloadUrl = URL.createObjectURL(wavBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const safeTitle = (idea.titulo || 'mezcla_master').toLowerCase().replace(/\s+/g, '_');
      link.download = `${song.titulo || 'cancion'}_${safeTitle}_master.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
    } catch (err: any) {
      console.error("Error al exportar la mezcla máster:", err);
      alert("No se pudo exportar la mezcla máster: " + (err.message || err));
    } finally {
      setIsExportingMaster(false);
    }
  };


  // Rename track
  const handleSaveTrackName = (idea: SongAudioIdea, trackId: string, newName: string) => {
    if (!newName.trim()) return;
    const tracks = getIdeaTracks(idea);
    const updatedTracks = tracks.map(tr => tr.id === trackId ? { ...tr, nombre: newName.trim() } : tr);
    const updatedIdeas = (song.audioIdeas || []).map(i => i.id === idea.id ? { ...i, pistas: updatedTracks } : i);
    onUpdateSong({ ...song, audioIdeas: updatedIdeas });
    setEditingTrackId(null);
  };

  // Delete track from idea (shows custom confirmation modal)
  const handleDeleteTrack = (idea: SongAudioIdea, trackId: string) => {
    const tracks = getIdeaTracks(idea);
    const track = tracks.find(t => t.id === trackId);

    if (tracks.length <= 1) {
      setConfirmDeleteModal({
        title: 'Eliminar Idea Completa',
        description: `Esta pista es la única de la idea "${idea.titulo}". ¿Deseas eliminar la idea completa del tema?`,
        onConfirm: () => {
          handleDeleteIdea(undefined, idea.id, true);
        }
      });
      return;
    }

    setConfirmDeleteModal({
      title: 'Eliminar Pista de Audio',
      description: `¿Deseas eliminar la pista "${track?.nombre || 'Pista'}" de la mezcla de "${idea.titulo}"?`,
      onConfirm: () => {
        const el = trackAudioRefs.current[trackId];
        if (el) el.pause();

        const updatedTracks = tracks.filter(tr => tr.id !== trackId);
        const updatedIdeas = (song.audioIdeas || []).map(i => i.id === idea.id ? {
          ...i,
          pistas: updatedTracks,
          audioUrl: updatedTracks[0]?.audioUrl || i.audioUrl
        } : i);
        onUpdateSong({ ...song, audioIdeas: updatedIdeas });
      }
    });
  };

  // Reordenar pistas a mano (guiño a Iris: al mover, cada pista "congela" su color de arcoíris
  // actual en colorHue para que se lo lleve consigo — a partir de ahí el orden visual del
  // arcoíris ya no será perfecto, pero cada pista mantiene su identidad de color).
  const stampTrackColors = (tracks: AudioTrack[]): AudioTrack[] =>
    tracks.map((t, i) => ({
      ...t,
      colorHue: typeof t.colorHue === 'number' ? t.colorHue : RAINBOW_HUE_STEPS[i % RAINBOW_HUE_STEPS.length]
    }));

  const reorderIdeaTracks = (idea: SongAudioIdea, fromIndex: number, toIndex: number) => {
    const tracks = getIdeaTracks(idea);
    if (fromIndex === -1 || toIndex < 0 || toIndex >= tracks.length || fromIndex === toIndex) return;

    const reordered = stampTrackColors(tracks);
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const updatedIdeas = (song.audioIdeas || []).map(i => i.id === idea.id ? { ...i, pistas: reordered } : i);
    onUpdateSong({ ...song, audioIdeas: updatedIdeas });
  };

  const handleMoveTrack = (idea: SongAudioIdea, trackId: string, direction: 'up' | 'down') => {
    const tracks = getIdeaTracks(idea);
    const fromIndex = tracks.findIndex(t => t.id === trackId);
    reorderIdeaTracks(idea, fromIndex, direction === 'up' ? fromIndex - 1 : fromIndex + 1);
  };

  // Arrastrar y soltar para reordenar pistas — mismo sistema (handle GripVertical + HTML5 drag)
  // que ya usa el repertorio para reordenar canciones y setlists.
  const [draggedTrackInfo, setDraggedTrackInfo] = useState<{ ideaId: string; index: number } | null>(null);
  const [dragOverTrackIndex, setDragOverTrackIndex] = useState<number | null>(null);

  const handleDropTrack = (idea: SongAudioIdea, dropIndex: number) => {
    if (draggedTrackInfo && draggedTrackInfo.ideaId === idea.id) {
      reorderIdeaTracks(idea, draggedTrackInfo.index, dropIndex);
    }
    setDraggedTrackInfo(null);
    setDragOverTrackIndex(null);
  };

  // --- OVERDUB / ADDING NEW TRACK TO IDEA ---
  const startRecordingTrackOverdub = async (idea: SongAudioIdea) => {
    if (useCountInMetronome) {
      triggerCountInBeeps(song.bpm || 120, () => {
        executeRecordingTrackOverdub(idea);
      });
    } else {
      executeRecordingTrackOverdub(idea);
    }
  };

  const executeRecordingTrackOverdub = async (idea: SongAudioIdea) => {
    try {
      // Resume studio audio context if suspended
      try {
        if (!studioAudioCtxRef.current) {
          const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtxClass) studioAudioCtxRef.current = new AudioCtxClass();
        }
        if (studioAudioCtxRef.current && studioAudioCtxRef.current.state === 'suspended') {
          await studioAudioCtxRef.current.resume();
        }
      } catch (e) {
        console.warn("AudioContext resume during overdub:", e);
      }

      // 1. Request microphone permission with hardware Echo Cancellation & Noise Suppression options
      const rawStream = await getLowLatencyAudioStream({
        echoCancellation: useEchoCancellation,
        noiseSuppression: useNoiseSuppression,
        autoGainControl: false,
      });
      setActiveRecordingStream(rawStream);

      let streamToRecord = rawStream;
      if (useCleanDSPFilter) {
        const pipeline = createCleanAudioRecordingPipeline(rawStream, studioAudioCtxRef.current);
        cleanPipelineRef.current = pipeline;
        streamToRecord = pipeline.cleanStream;
      }

      const recorderOptions: MediaRecorderOptions = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 256000 }
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? { mimeType: 'audio/mp4', audioBitsPerSecond: 256000 }
        : { audioBitsPerSecond: 256000 };

      const mediaRecorder = new MediaRecorder(streamToRecord, recorderOptions);
      trackMediaRecorderRef.current = mediaRecorder;
      trackAudioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) trackAudioChunksRef.current.push(e.data);
      };

      const tracks = getIdeaTracks(idea);
      const hasSolo = tracks.some((t: any) => t.solo);
      const activeBackingTracks = tracks.filter(t => !t.muted && (!hasSolo || (t as any).solo));

      // 2. Pre-align backing tracks at position 0
      setCurrentTimeMap(prev => ({ ...prev, [idea.id]: 0 }));
      tracks.forEach(tr => {
        const resolvedUrl = resolvedAudioUrls[tr.id] || tr.audioUrl;
        let el = trackAudioRefs.current[tr.id];
        if (!el && resolvedUrl && typeof resolvedUrl === 'string' && !resolvedUrl.startsWith('indexeddb:') && !resolvedUrl.endsWith('undefined')) {
          el = new Audio(resolvedUrl || SILENT_AUDIO_URI);
          trackAudioRefs.current[tr.id] = el;
        }
        if (el) {
          if (resolvedUrl && typeof resolvedUrl === 'string' && !resolvedUrl.startsWith('indexeddb:') && !resolvedUrl.endsWith('undefined')) {
            if (!el.src || !el.src.includes(resolvedUrl)) {
              el.src = resolvedUrl;
            }
          }
          try { el.currentTime = 0; } catch {}
          el.playbackRate = 1.0;
          const isMuted = tr.muted || (hasSolo && !(tr as any).solo);
          el.volume = applyMasterToElementVolume(isMuted ? 0 : (tr.volumen ?? 1));
        }
      });

      // 3. Play backing track audio FIRST so sound is emitted before mic recording captures performance
      const playPromises = activeBackingTracks.map(tr => {
        const resolvedUrl = resolvedAudioUrls[tr.id] || tr.audioUrl;
        if (resolvedUrl && typeof resolvedUrl === 'string' && resolvedUrl.trim() !== '' && !resolvedUrl.endsWith('undefined') && !resolvedUrl.startsWith('indexeddb:')) {
          let el = trackAudioRefs.current[tr.id];
          if (!el) {
            el = new Audio(resolvedUrl || SILENT_AUDIO_URI);
            trackAudioRefs.current[tr.id] = el;
          }
          if (!el.src || !el.src.includes(resolvedUrl)) {
            el.src = resolvedUrl;
          }
          if (el.readyState === 0) {
            try { el.load(); } catch {}
          }
          try { el.currentTime = 0; } catch {}
          return el.play().catch(e => console.warn("Backing track playback notice:", e?.message || e));
        }
        return Promise.resolve();
      });

      await Promise.all(playPromises);

      // 4. Start MediaRecorder immediately after backing tracks begin playback
      mediaRecorder.start(20);
      setIsRecordingTrack(true);
      setRecordingTrackIdeaId(idea.id);
      setRecordingTrackTime(0);

      if (trackRecordingTimerRef.current) {
        clearInterval(trackRecordingTimerRef.current);
      }
      trackRecordingTimerRef.current = setInterval(() => {
        setRecordingTrackTime(prev => prev + 1);
      }, 1000);

      // Launch master sync loop during overdub session
      playingIdeaIdRef.current = idea.id;
      setPlayingIdeaId(idea.id);
      runMasterSyncLoop(idea);

      mediaRecorder.onstop = async () => {
        if (syncAnimationFrameRef.current) {
          cancelAnimationFrame(syncAnimationFrameRef.current);
          syncAnimationFrameRef.current = null;
        }
        playingIdeaIdRef.current = null;
        setPlayingIdeaId(null);
        setIsRecordingTrack(false);
        setRecordingTrackIdeaId(null);

        if (trackRecordingTimerRef.current) {
          clearInterval(trackRecordingTimerRef.current);
        }

        // Stop all backing track audio elements
        tracks.forEach(tr => {
          const el = trackAudioRefs.current[tr.id];
          if (el) {
            el.pause();
            el.playbackRate = 1.0;
          }
        });

        // Cleanup stream & DSP pipeline
        if (cleanPipelineRef.current) {
          cleanPipelineRef.current.cleanup();
          cleanPipelineRef.current = null;
        }
        rawStream.getTracks().forEach(track => track.stop());

        const rawAudioBlob = new Blob(trackAudioChunksRef.current, { type: 'audio/webm' });

        try {
          setIsUploading(true);
          let finalBlob = rawAudioBlob;

          // Auto DSP/AI correlation latency detection against master backing track
          let detectedOffsetMs = 0;
          const refTrack = tracks[0] || (idea.audioUrl ? { audioUrl: idea.audioUrl } : null);
          if (refTrack && refTrack.audioUrl) {
            try {
              const masterResolvedUrl = await resolveAudioUrl(refTrack.audioUrl);
              detectedOffsetMs = await autoDetectAudioLatencyOffset(masterResolvedUrl, rawAudioBlob);
            } catch (e) {
              console.warn("Auto latency detection during overdub:", e);
            }
          }

          // Calculate total latency lag to physically trim from recording start
          const isMobileDevice = /iPad|iPhone|iPod|Android/i.test(navigator.userAgent);
          const defaultHardwareLagMs = isMobileDevice ? 240 : 120;
          
          let totalLagToTrimMs = defaultHardwareLagMs;
          if (autoLatencyTrimMs > 0) {
            totalLagToTrimMs = autoLatencyTrimMs;
          } else if (detectedOffsetMs > 0) {
            totalLagToTrimMs = detectedOffsetMs;
          }

          if (totalLagToTrimMs > 0) {
            finalBlob = await trimAudioBlobLatency(rawAudioBlob, totalLagToTrimMs);
          }
          if (useCleanDSPFilter) {
            finalBlob = await cleanAudioBlobOffline(finalBlob);
          }
          const file = new File([finalBlob], `track-${Date.now()}.wav`, { type: 'audio/wav' });
          const serverUrl = await uploadFileToServer(file);
          const trackName = newTrackName.trim() || `Pista ${tracks.length + 1}`;
          const instrument = newTrackInstrument.trim() || undefined;
          saveNewTrackToIdea(idea, serverUrl, trackName, instrument, totalLagToTrimMs);
        } catch (err) {
          console.error("Error uploading track recording:", err);
          alert("Error al guardar la nueva pista en el disco del servidor.");
        } finally {
          setIsUploading(false);
        }
      };
    } catch (err: any) {
      setIsRecordingTrack(false);
      setRecordingTrackIdeaId(null);
      if (trackRecordingTimerRef.current) {
        clearInterval(trackRecordingTimerRef.current);
      }
      console.warn("Microphone access for overdub not available:", err?.message || err);
      alert("No se pudo acceder al micrófono para grabar la pista (" + (err?.message || "comprueba los permisos del navegador") + ").");
    }
  };

  const stopRecordingTrackOverdub = () => {
    if (trackMediaRecorderRef.current && trackMediaRecorderRef.current.state !== 'inactive') {
      trackMediaRecorderRef.current.stop();
    }
    setIsRecordingTrack(false);
    setRecordingTrackIdeaId(null);
    setActiveRecordingStream(null);
    if (trackRecordingTimerRef.current) {
      clearInterval(trackRecordingTimerRef.current);
    }
  };

  const handleAutoSyncTrackLatency = async (idea: SongAudioIdea, track: AudioTrack) => {
    try {
      setCleaningTrackId(track.id);
      const tracks = getIdeaTracks(idea);
      const masterTrack = tracks.find(t => t.id !== track.id) || tracks[0];
      if (!masterTrack || masterTrack.id === track.id) {
        alert("Necesitas tener al menos otra pista de referencia en la mezcla para calcular la sincronización por IA.");
        return;
      }
      const masterUrl = await resolveAudioUrl(masterTrack.audioUrl);
      const trackBlob = await getAudioBlobFromUrl(track.audioUrl);

      const calculatedLagMs = await autoDetectAudioLatencyOffset(masterUrl, trackBlob);
      handleTrackDesfaseChange(idea, track.id, calculatedLagMs);
      alert(`⚡ ¡Sincronizado! Se detectó un desfase de +${calculatedLagMs}ms y se ajustó la pista.`);
    } catch (err) {
      console.error("Auto sync error:", err);
      alert("No se pudo calcular automáticamente la latencia. Puedes ajustarla manualmente.");
    } finally {
      setCleaningTrackId(null);
    }
  };

  const handleCleanTrackAudio = async (idea: SongAudioIdea, track: AudioTrack) => {
    try {
      setCleaningTrackId(track.id);
      const rawBlob = await getAudioBlobFromUrl(track.audioUrl);
      const cleanedBlob = await cleanAudioBlobOffline(rawBlob);
      const cleanedFile = new File([cleanedBlob], `clean-${track.nombre || 'pista'}-${Date.now()}.wav`, { type: 'audio/wav' });
      const serverUrl = await uploadFileToServer(cleanedFile);

      const tracks = getIdeaTracks(idea);
      const updatedTracks = tracks.map(t => t.id === track.id ? { ...t, audioUrl: serverUrl } : t);
      const updatedIdeas = (song.audioIdeas || []).map(i => i.id === idea.id ? { ...i, pistas: updatedTracks } : i);
      onUpdateSong({ ...song, audioIdeas: updatedIdeas });
    } catch (err) {
      console.error("Error cleaning track audio:", err);
      alert("No se pudo filtrar el ruido de la pista.");
    } finally {
      setCleaningTrackId(null);
    }
  };

  const handleUploadTrackFile = async (idea: SongAudioIdea, file: File) => {
    try {
      setIsUploading(true);
      const serverUrl = await uploadFileToServer(file);
      const fileNameClean = file.name ? file.name.replace(/\.[^/.]+$/, "") : "";
      const existingTracks = getIdeaTracks(idea);
      const trackName = newTrackName.trim() || fileNameClean || `Pista ${existingTracks.length + 1}`;
      const instrument = newTrackInstrument.trim() || undefined;
      saveNewTrackToIdea(idea, serverUrl, trackName, instrument);
    } catch (err) {
      alert("Error al procesar el archivo de audio de la pista.");
      console.error("Track upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const saveNewTrackToIdea = (idea: SongAudioIdea, audioUrl: string, customTrackName?: string, customInstrument?: string, initialDesfaseMs?: number) => {
    const existingTracks = getIdeaTracks(idea);
    const trackName = customTrackName || newTrackName.trim() || `Pista ${existingTracks.length + 1}`;
    const instrument = customInstrument || newTrackInstrument.trim() || undefined;

    const newTrack: AudioTrack = {
      id: `track-${Date.now()}`,
      nombre: trackName,
      audioUrl,
      autor: currentUsername,
      instrumento: instrument,
      fecha: new Date().toISOString().split('T')[0],
      volumen: 1,
      muted: false,
      desfaseMs: initialDesfaseMs ?? 0
    };

    const updatedTracks = [...existingTracks, newTrack];
    const updatedIdeas = (song.audioIdeas || []).map(i => i.id === idea.id ? { ...i, pistas: updatedTracks } : i);

    onUpdateSong({ ...song, audioIdeas: updatedIdeas });

    // Reset overdub form
    setAddingTrackIdeaId(null);
    setNewTrackName('');
    setNewTrackInstrument('');
    setSelectedTrackFile(null);
  };

  const {
    showGenModalForIdea, setShowGenModalForIdea,
    genBpm, setGenBpm,
    genKey, setGenKey,
    genDuration, setGenDuration,
    includeDrums, setIncludeDrums,
    includeBass, setIncludeBass,
    drumStyle, setDrumStyle,
    isGeneratingAccompaniment,
    handleGenerateAccompaniment,
  } = useAccompanimentGenerator(song, saveNewTrackToIdea);

  // --- CREATE NEW MAIN IDEA FORM ---
  const startRecording = async () => {
    try {
      const rawStream = await getLowLatencyAudioStream({
        echoCancellation: useEchoCancellation,
        noiseSuppression: useNoiseSuppression,
        autoGainControl: false,
      });
      setActiveRecordingStream(rawStream);

      let streamToRecord = rawStream;
      let cleanPipeline: any = null;
      if (useCleanDSPFilter) {
        cleanPipeline = createCleanAudioRecordingPipeline(rawStream, studioAudioCtxRef.current);
        streamToRecord = cleanPipeline.cleanStream;
      }

      const mediaRecorder = new MediaRecorder(streamToRecord);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      let resolveFn: (url: string) => void = () => {};
      let rejectFn: (err: any) => void = () => {};
      recordingPromiseRef.current = new Promise<string>((resolve, reject) => {
        resolveFn = resolve;
        rejectFn = reject;
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        if (cleanPipeline) cleanPipeline.cleanup();
        rawStream.getTracks().forEach(track => track.stop());

        const rawBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        try {
          setIsUploading(true);
          let finalBlob = rawBlob;
          if (useCleanDSPFilter) {
            finalBlob = await cleanAudioBlobOffline(rawBlob);
          }
          const file = new File([finalBlob], `recording-${Date.now()}.wav`, { type: 'audio/wav' });
          const url = await uploadFileToServer(file);
          setRecordedAudioUrl(url);
          resolveFn(url);
        } catch (err) {
          console.error("Error uploading mic recording:", err);
          rejectFn(err);
        } finally {
          setIsUploading(false);
        }
      };

      mediaRecorder.start(50);
      setIsRecording(true);
      setRecordingTime(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn("Microphone capture warning:", err?.message || err);
      alert("No se pudo acceder al micrófono (" + (err?.message || "comprueba los permisos del navegador") + ").");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setActiveRecordingStream(null);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const handleSaveIdea = async () => {
    try {
      setIsUploading(true);

      // 1. If currently recording with mic, stop and await the upload automatically
      if (isRecording) {
        stopRecording();
      }

      let primaryAudioUrl = recordedAudioUrl || '';

      // If recording promise is pending or just completed, await it
      if (!primaryAudioUrl && recordingPromiseRef.current) {
        try {
          primaryAudioUrl = await recordingPromiseRef.current;
        } catch (e) {
          console.warn("Error awaiting recording URL:", e);
        }
      }

      // 2. Check selected audio file, drive URL, or song base track if no mic recording
      if (!primaryAudioUrl) {
        if (useSongBaseTrack && selectedSongBaseUrl) {
          primaryAudioUrl = selectedSongBaseUrl;
        } else if (driveAudioUrl.trim()) {
          primaryAudioUrl = driveAudioUrl.trim();
        } else if (selectedAudioFile) {
          primaryAudioUrl = await uploadFileToServer(selectedAudioFile);
        }
      }

      // 3. Prepare secondary track if song base track is toggled alongside user's recording/file
      let secondaryBaseTrack: { url: string; label: string; instrument: string } | undefined = undefined;
      if (useSongBaseTrack && selectedSongBaseUrl && primaryAudioUrl !== selectedSongBaseUrl) {
        secondaryBaseTrack = {
          url: selectedSongBaseUrl,
          label: `🎵 Base: Tema Original (${song.titulo})`,
          instrument: 'Tema Base'
        };
      }

      // Auto-generate title if user left title blank
      const sectionInfo = SECCIONES_TEMA.find(s => s.key === ideaSection);
      const sectionLabel = sectionInfo?.label || ideaSection;
      const autoTitle = selectedAudioFile 
        ? selectedAudioFile.name.replace(/\.[^/.]+$/, "") 
        : (useSongBaseTrack && primaryAudioUrl === selectedSongBaseUrl)
          ? `Idea sobre ${song.titulo} (${sectionLabel})`
          : `Idea ${sectionLabel} - ${new Date().toLocaleDateString([], { day: '2-digit', month: '2-digit' })} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      const finalTitle = ideaTitle.trim() || autoTitle;

      // 4. AI Backing track generation if selected
      if (genAiOnNewIdea) {
        const aiWavBlob = await generateAccompanimentAudioBlob({
          bpm: newIdeaBpm,
          durationSecs: 30,
          keyName: newIdeaKey,
          includeDrums: newIdeaIncludeDrums,
          includeBass: newIdeaIncludeBass,
          drumPattern: newIdeaStyle
        });
        const aiFile = new File([aiWavBlob], `base-ia-${newIdeaStyle}-${Date.now()}.wav`, { type: 'audio/wav' });
        const aiServerUrl = await uploadFileToServer(aiFile);

        const parts = [];
        if (newIdeaIncludeDrums) parts.push('Batería');
        if (newIdeaIncludeBass) parts.push('Bajo');
        const aiTrackLabel = `Ref AI: ${parts.join(' + ') || 'IA Synth'} (${newIdeaStyle.toUpperCase()} - ${newIdeaKey})`;

        const aiTrackInfo = {
          url: aiServerUrl,
          label: aiTrackLabel,
          instrument: parts.join(' + ') || 'IA Synth'
        };

        if (useSongBaseTrack && selectedSongBaseUrl) {
          createNewIdea(
            selectedSongBaseUrl,
            aiTrackInfo,
            finalTitle,
            secondaryBaseTrack
          );
        } else if (primaryAudioUrl) {
          createNewIdea(primaryAudioUrl, aiTrackInfo, finalTitle, secondaryBaseTrack);
        } else {
          createNewIdea(aiServerUrl, undefined, finalTitle, secondaryBaseTrack);
        }
        return;
      }

      if (!primaryAudioUrl) {
        alert("Debes seleccionar un archivo de audio, cargar el Tema Original, grabar con el micrófono, pegar un enlace de Drive o activar la generación de Base IA para la primera pista de la idea.");
        return;
      }

      createNewIdea(primaryAudioUrl, undefined, finalTitle, secondaryBaseTrack);
    } catch (err) {
      console.error("Error al guardar la idea de audio:", err);
      alert("Error al guardar la idea de audio.");
    } finally {
      setIsUploading(false);
    }
  };

  const createNewIdea = (
    audioDataUrl: string, 
    secondaryAiTrack?: { url: string; label: string; instrument: string },
    customTitle?: string,
    secondaryBaseTrack?: { url: string; label: string; instrument: string }
  ) => {
    const finalTitle = customTitle || ideaTitle.trim() || `Idea (${ideaSection.toUpperCase()}) ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const isPrimaryBaseTrack = useSongBaseTrack && audioDataUrl === selectedSongBaseUrl;

    const tracks: AudioTrack[] = [
      {
        id: `track-${Date.now()}-1`,
        nombre: isPrimaryBaseTrack
          ? `🎵 Base: ${song.titulo} (Tema Original)`
          : secondaryAiTrack || secondaryBaseTrack
            ? 'Pista 1 (Grabación/Idea)' 
            : 'Pista 1 (Base)',
        audioUrl: audioDataUrl,
        autor: isPrimaryBaseTrack ? 'Tema Original' : (ideaUploader || currentUsername),
        instrumento: isPrimaryBaseTrack ? 'Tema Base' : (ideaInstrument.trim() || undefined),
        fecha: new Date().toISOString().split('T')[0],
        volumen: 1,
        muted: false
      }
    ];

    if (secondaryBaseTrack) {
      tracks.push({
        id: `track-${Date.now()}-base`,
        nombre: secondaryBaseTrack.label,
        audioUrl: secondaryBaseTrack.url,
        autor: 'Tema Original',
        instrumento: secondaryBaseTrack.instrument,
        fecha: new Date().toISOString().split('T')[0],
        volumen: 0.9,
        muted: false
      });
    }

    if (secondaryAiTrack) {
      tracks.push({
        id: `track-${Date.now()}-ai`,
        nombre: secondaryAiTrack.label,
        audioUrl: secondaryAiTrack.url,
        autor: 'IA Synthesizer',
        instrumento: secondaryAiTrack.instrument,
        fecha: new Date().toISOString().split('T')[0],
        volumen: 0.85,
        muted: false
      });
    }

    const newIdea: SongAudioIdea = {
      id: `idea-${Date.now()}`,
      titulo: finalTitle,
      seccion: ideaSection,
      audioUrl: audioDataUrl,
      pistas: tracks,
      subidoPor: ideaUploader || currentUsername,
      instrumento: ideaInstrument.trim() || undefined,
      fecha: new Date().toISOString().split('T')[0],
      notas: ideaNotes.trim() || undefined,
      votos: [currentUsername],
      comentarios: []
    };

    const updatedIdeas = [newIdea, ...(song.audioIdeas || [])];
    onUpdateSong({
      ...song,
      audioIdeas: updatedIdeas,
      // CRITICAL: Preserve original song demo audio and never overwrite with an idea
      audioPrincipalUrl: song.audioPrincipalUrl
    });

    // Reset form & promise
    recordingPromiseRef.current = null;
    setIdeaTitle('');
    setIdeaNotes('');
    setSelectedAudioFile(null);
    setRecordedAudioUrl(null);
    setDriveAudioUrl('');
    setGenAiOnNewIdea(false);
    setShowAddIdea(false);
  };

  // Toggle upvote / like
  const handleToggleVote = (ideaId: string) => {
    const updatedIdeas = (song.audioIdeas || []).map(idea => {
      if (idea.id === ideaId) {
        const currentVotos = idea.votos || [];
        const hasVoted = currentVotos.includes(currentUsername);
        const newVotos = hasVoted 
          ? currentVotos.filter(u => u !== currentUsername)
          : [...currentVotos, currentUsername];
        return { ...idea, votos: newVotos };
      }
      return idea;
    });

    onUpdateSong({ ...song, audioIdeas: updatedIdeas });
  };

  // Delete whole idea
  const handleDeleteIdea = (e?: React.MouseEvent, ideaId?: string, skipModal = false) => {
    if (e) e.stopPropagation();
    if (!ideaId) return;

    const executeDelete = () => {
      // Pause any playing audio
      if (playingIdeaId === ideaId) {
        const activeIdea = ideasList.find(i => i.id === ideaId);
        if (activeIdea) {
          getIdeaTracks(activeIdea).forEach(tr => {
            const el = trackAudioRefs.current[tr.id];
            if (el) el.pause();
          });
        }
        setPlayingIdeaId(null);
      }

      const updatedIdeas = (song.audioIdeas || []).filter(i => i.id !== ideaId);

      onUpdateSong({ 
        ...song, 
        audioIdeas: updatedIdeas,
        audioPrincipalUrl: song.audioPrincipalUrl 
      });
    };

    if (skipModal) {
      executeDelete();
      return;
    }

    const idea = (song.audioIdeas || []).find(i => i.id === ideaId);
    setConfirmDeleteModal({
      title: 'Eliminar Idea de Audio',
      description: `¿Estás seguro de que deseas eliminar la idea "${idea?.titulo || 'sin título'}"? Se borrarán todas las pistas y comentarios asociados.`,
      onConfirm: executeDelete
    });
  };

  // Duplica una idea (con todas sus pistas/stems) como una nueva versión independiente, para
  // probar un arreglo distinto sin tocar ni arriesgar la versión que ya está validada por la
  // banda. Empieza sin votos ni comentarios propios: es una idea nueva, no un historial compartido.
  const handleDuplicateIdea = (e: React.MouseEvent, ideaId: string) => {
    e.stopPropagation();
    const ideas = song.audioIdeas || [];
    const original = ideas.find(i => i.id === ideaId);
    if (!original) return;

    const baseTitle = original.titulo.replace(/\s+\(v\d+\)$/i, '');
    const versionCount = ideas.filter(i => i.titulo === baseTitle || i.titulo.startsWith(`${baseTitle} (v`)).length;
    const newIdeaId = `idea-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const clonedTracks: AudioTrack[] = getIdeaTracks(original).map((t, idx) => ({
      ...t,
      id: `${newIdeaId}-track-${idx + 1}`
    }));

    const duplicated: SongAudioIdea = {
      ...original,
      id: newIdeaId,
      titulo: `${baseTitle} (v${versionCount + 1})`,
      pistas: clonedTracks,
      subidoPor: currentUsername,
      fecha: new Date().toLocaleDateString('es-ES'),
      votos: [],
      comentarios: []
    };

    onUpdateSong({ ...song, audioIdeas: [...ideas, duplicated] });
  };

  // Delete comment from idea
  const handleDeleteComment = (idea: SongAudioIdea, commentId: string) => {
    setConfirmDeleteModal({
      title: 'Eliminar Comentario',
      description: '¿Deseas eliminar este comentario?',
      onConfirm: () => {
        const updatedComments = (idea.comentarios || []).filter(c => c.id !== commentId);
        const updatedIdeas = (song.audioIdeas || []).map(i => i.id === idea.id ? { ...i, comentarios: updatedComments } : i);
        onUpdateSong({ ...song, audioIdeas: updatedIdeas });
      }
    });
  };

  return (
    <ModalPortal isOpen={true} onClose={onClose}>
      <div className={`fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center overflow-y-auto overscroll-contain animate-in fade-in duration-200 ${
        isFullScreen ? 'p-0' : 'p-2 sm:p-4'
      }`}>
        {countInCountdown !== null && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[10000] bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-black font-mono font-black px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-amber-300 animate-pulse">
            <span className="text-2xl">🥁</span>
            <div className="text-sm">
              <div>PREPARANDO GRABACIÓN MULTIPISTA...</div>
              <div className="text-xs opacity-80 font-bold">Arranca en: ¡{countInCountdown}!</div>
            </div>
            <span className="text-3xl font-black ml-2 bg-black text-amber-400 px-3.5 py-1 rounded-xl shadow-inner">
              {countInCountdown}
            </span>
          </div>
        )}
        <div className={`w-full ${
          isFullScreen 
            ? 'fixed inset-0 z-[9999] w-screen h-screen max-w-none max-h-none rounded-none m-0 shadow-none border-none' 
            : 'max-w-4xl rounded-2xl border shadow-2xl overflow-hidden my-auto max-h-[92vh]'
        } flex flex-col ${
          isStitchLight ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-[#0f0f15] border-zinc-800 text-zinc-100'
        }`}>
        
        {/* Header Bar */}
        <div className="p-2.5 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <Disc className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  className="text-xl font-bold tracking-tight text-white"
                  title={`⏱️ ${song.duracion} · 🎵 ${song.tonalidad} · ⚡ ${song.bpm} BPM${song.afinacion ? ` · 🎸 ${song.afinacion}` : ''}`}
                >
                  {song.titulo}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-semibold">
                  {song.estadoTema || 'componiendo'}
                </span>
                {song.favoritoGeneral && (
                  <span className="text-amber-400" title="Tema favorito">
                    <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
                  </span>
                )}

                {/* Mi nivel de preparación con esta canción — cada miembro opina por sí mismo, no
                    es un estado global (ya existe song.estadoTema para eso). Sirve para que quien
                    lleva la banda vea de un vistazo quién necesita repasar antes del bolo.
                    En móvil se oculta de la cabecera y vive dentro de Herramientas. */}
                {(() => {
                  const myKey = currentUser?.id || currentUser?.username;
                  const myName = currentUser?.name || currentUser?.username || currentUsername;
                  const myReadiness = getMemberReadiness(song, myKey, myName);
                  const levelInfo = READINESS_LEVELS.find(l => l.value === myReadiness);
                  return (
                    <select
                      value={myReadiness || ''}
                      onChange={(e) => {
                        const val = e.target.value as ReadinessLevel;
                        if (!val) return;
                        onUpdateSong({ ...song, notasPorMiembro: withMemberReadiness(song, myKey, myName, val) });
                      }}
                      title="Tu nivel de preparación con esta canción, de cara al próximo bolo"
                      className={`hidden sm:inline-block px-2.5 py-1 rounded-xl text-xs font-mono font-bold border cursor-pointer outline-none ${
                        levelInfo ? levelInfo.colorClass : 'bg-white/5 text-neutral-400 border-white/10'
                      }`}
                    >
                      <option value="" disabled>Mi preparación...</option>
                      {READINESS_LEVELS.map(l => (
                        <option key={l.value} value={l.value}>{l.icon} {l.label}</option>
                      ))}
                    </select>
                  );
                })()}

                {/* Menú Desplegable de Herramientas Secundarias */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowToolsMenu(prev => !prev)}
                    className="px-3 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-white/10 hover:bg-white/20 text-white border border-white/10 shadow-sm"
                    title="Herramientas y opciones del Estudio"
                  >
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Herramientas ⚙️</span>
                  </button>

                  {showToolsMenu && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl p-1.5 z-50 space-y-1 text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => { setShowToolsMenu(false); onUpdateSong({ ...song, favoritoGeneral: !song.favoritoGeneral }); }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-amber-300 flex items-center gap-2"
                      >
                        <Sparkles className={`w-4 h-4 text-amber-400 ${song.favoritoGeneral ? 'fill-amber-400' : ''}`} />
                        {song.favoritoGeneral ? 'Quitar de Favoritos' : 'Marcar como Favorito'}
                      </button>
                      {/* Mi preparación: solo en móvil, en escritorio ya se ve en la cabecera */}
                      <div className="sm:hidden px-1 pb-1">
                        {(() => {
                          const myKey = currentUser?.id || currentUser?.username;
                          const myName = currentUser?.name || currentUser?.username || currentUsername;
                          const myReadiness = getMemberReadiness(song, myKey, myName);
                          const levelInfo = READINESS_LEVELS.find(l => l.value === myReadiness);
                          return (
                            <select
                              value={myReadiness || ''}
                              onChange={(e) => {
                                const val = e.target.value as ReadinessLevel;
                                if (!val) return;
                                onUpdateSong({ ...song, notasPorMiembro: withMemberReadiness(song, myKey, myName, val) });
                              }}
                              title="Tu nivel de preparación con esta canción, de cara al próximo bolo"
                              className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border cursor-pointer outline-none ${
                                levelInfo ? levelInfo.colorClass : 'bg-white/5 text-neutral-400 border-white/10'
                              }`}
                            >
                              <option value="" disabled>Mi preparación...</option>
                              {READINESS_LEVELS.map(l => (
                                <option key={l.value} value={l.value}>{l.icon} {l.label}</option>
                              ))}
                            </select>
                          );
                        })()}
                      </div>
                      <button
                        type="button"
                        onClick={() => { setShowToolsMenu(false); setShowChordsModal(true); }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-amber-300 flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-amber-400" /> Acordes & Partitura
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowToolsMenu(false); setShowAiComposerModal(true); }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-indigo-300 flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-indigo-400" /> Arreglos IA (Músico Virtual)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowToolsMenu(false); setShowAiMusicModal(true); }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-purple-300 flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-purple-400" /> Soundtrack IA (Lyria)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowToolsMenu(false); setShowCubaseHelp(true); }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-neutral-300 flex items-center gap-2"
                      >
                        <Keyboard className="w-4 h-4 text-neutral-400" /> Atajos Teclado (Cubase)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowToolsMenu(false); openTutorial(); }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-sky-300 flex items-center gap-2"
                      >
                        <Info className="w-4 h-4 text-sky-400" /> Guía rápida
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowToolsMenu(false); handleShareSong(); }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-emerald-300 flex items-center gap-2 border-t border-white/10 pt-2"
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-400" /> Compartir Tema por WhatsApp
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Volumen master de salida — control personal de escucha, no se guarda en la canción */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10" title="Volumen master de salida (solo tu escucha, no afecta a la mezcla de la banda)">
              <button
                type="button"
                onClick={() => setMasterVolume(v => v > 0 ? 0 : 1)}
                className="text-neutral-300 hover:text-white cursor-pointer shrink-0"
              >
                {masterVolume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1.5}
                step={0.01}
                value={masterVolume}
                onChange={(e) => setMasterVolume(Number(e.target.value))}
                className="w-20 accent-amber-500"
              />
              <span className="text-[10px] font-mono text-neutral-400 w-8 text-right">{Math.round(masterVolume * 100)}%</span>
            </div>

            <button
              type="button"
              onClick={toggleIsFullScreen}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                isFullScreen
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-lg font-black hover:bg-amber-400'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              }`}
              title={isFullScreen ? "Salir de Pantalla Completa" : "Poner Modo Studio en Pantalla Completa"}
            >
              {isFullScreen ? (
                <>
                  <Minimize2 className="w-4 h-4 text-zinc-950" />
                  <span className="hidden sm:inline">Salir Pantalla Completa</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Pantalla Completa HD</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-2.5 sm:p-6 overflow-y-auto space-y-2.5 sm:space-y-6 flex-1">

          {/* Sleek Top Action Bar: "Atajos" y "Cargar Tema Original" viven ya en Herramientas
              y en el propio formulario de nueva idea — un único botón de acción aquí basta */}
          <div className="flex items-center justify-between gap-3 p-2 sm:p-3 bg-zinc-900/80 rounded-2xl border border-white/10 shadow-md">
            <span className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Music className="w-4 h-4 text-indigo-400 animate-pulse" /> Ideas & Grabaciones
            </span>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setShowAddIdea(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Grabar / Subir Idea</span>
            </motion.button>
          </div>

          {/* Add New Audio Idea Form */}
          <AnimatePresence>
            {showAddIdea && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-emerald-300 font-mono uppercase tracking-wider flex items-center gap-2">
                      <Mic className="w-4 h-4 text-emerald-400 animate-pulse" /> Aportar Idea o Arreglo de Audio
                    </h4>
                    <button type="button" onClick={() => setShowAddIdea(false)} className="text-neutral-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-neutral-400 block mb-1">Título de la Idea / Arreglo *</label>
                  <input
                    type="text"
                    value={ideaTitle}
                    onChange={(e) => setIdeaTitle(e.target.value)}
                    placeholder="Ej: Riff Estribillo / Arreglo Vientos / Base Acústica"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-neutral-400 block mb-1">Sección del Tema *</label>
                  <select
                    value={ideaSection}
                    onChange={(e) => setIdeaSection(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-neutral-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {SECCIONES_TEMA.map(sec => (
                      <option key={sec.key} value={sec.key} className="bg-zinc-900 text-white">
                        {sec.icon} {sec.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-neutral-400 block mb-1">Aportado por (Tu Nombre)</label>
                  <input
                    type="text"
                    value={ideaUploader}
                    onChange={(e) => setIdeaUploader(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-neutral-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-neutral-400 block mb-1">Instrumento / Rol (Opcional)</label>
                  <input
                    type="text"
                    value={ideaInstrument}
                    onChange={(e) => setIdeaInstrument(e.target.value)}
                    placeholder="Ej: Guitarra, Trompeta, Batería, Voz"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-neutral-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Source Selector */}
              <div className="p-4 rounded-xl border border-white/10 bg-black/30 space-y-3">
                <span className="text-xs font-mono font-bold text-neutral-300 block">Fuente de Audio Principal / Base Rítmica:</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                  {/* Option 1: Tema Base Original */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !useSongBaseTrack;
                      setUseSongBaseTrack(next);
                      if (next && !selectedSongBaseUrl) {
                        setSelectedSongBaseUrl(song.audioPrincipalUrl || (song.audioIdeas && song.audioIdeas[0]?.audioUrl) || '');
                      }
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all text-left ${
                      useSongBaseTrack 
                        ? 'border-amber-500 bg-amber-950/50 text-amber-200 shadow-lg ring-1 ring-amber-500/60' 
                        : 'border-amber-500/30 hover:border-amber-400 bg-amber-950/20 text-amber-300 hover:bg-amber-950/40'
                    }`}
                  >
                    <Disc className={`w-5 h-5 text-amber-400 ${useSongBaseTrack ? 'animate-spin-slow' : ''}`} />
                    <span className="text-xs font-bold text-center">Tema Original</span>
                    <span className="text-[10px] text-amber-300/80 text-center font-mono">
                      {useSongBaseTrack ? '✓ Base Cargada' : `Usar "${song.titulo}"`}
                    </span>
                  </button>

                  {/* Option 2: File Upload */}
                  <label className="p-3 rounded-xl border border-dashed border-neutral-700 hover:border-emerald-500 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all">
                    <Upload className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-semibold text-white text-center">
                      {selectedAudioFile ? selectedAudioFile.name : 'Subir Archivo'}
                    </span>
                    <span className="text-[10px] text-neutral-400">MP3, WAV, M4A</span>
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedAudioFile(e.target.files[0]);
                          setRecordedAudioUrl(null);
                          setDriveAudioUrl('');
                        }
                      }}
                    />
                  </label>

                  {/* Mic Recording */}
                  <div className="p-3 rounded-xl border border-neutral-700 bg-white/5 flex flex-col items-center justify-center gap-2">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer"
                      >
                        <Mic className="w-3.5 h-3.5 animate-pulse" /> Grabar Micrófono
                      </button>
                    ) : (
                      <div className="w-full space-y-2">
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer animate-pulse"
                        >
                          ⏹️ Detener Grabación ({formatTime(recordingTime)})
                        </button>
                        <div className="w-full h-11 relative rounded overflow-hidden">
                          <LiveMicWaveformCanvas
                            stream={activeRecordingStream}
                            audioCtx={studioAudioCtxRef.current}
                            isRecording={isRecording}
                            color="#f43f5e"
                            height={44}
                          />
                        </div>
                      </div>
                    )}

                    {recordedAudioUrl && (
                      <span className="text-[9px] text-emerald-400 font-mono font-bold text-center">
                        ✓ Grabación Lista
                      </span>
                    )}
                  </div>

                  {/* Drive Link */}
                  <div className="p-3 rounded-xl border border-neutral-700 bg-white/5 flex flex-col justify-center gap-1">
                    <span className="text-[10px] font-mono font-bold text-amber-300 flex items-center gap-1">
                      <Music className="w-3 h-3 text-amber-400" /> Enlace Google Drive:
                    </span>
                    <input
                      type="text"
                      value={driveAudioUrl}
                      onChange={(e) => {
                        setDriveAudioUrl(e.target.value);
                        setSelectedAudioFile(null);
                        setRecordedAudioUrl(null);
                      }}
                      placeholder="https://drive.google.com/..."
                      className="w-full px-2 py-1 rounded-lg bg-black/50 border border-neutral-700 text-[10px] text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>

                  {/* AI Base Generator Card */}
                  <button
                    type="button"
                    onClick={() => setGenAiOnNewIdea(!genAiOnNewIdea)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all text-left ${
                      genAiOnNewIdea 
                        ? 'border-purple-500 bg-purple-900/40 text-purple-200 shadow-lg' 
                        : 'border-purple-500/40 hover:border-purple-400 bg-purple-950/20 text-purple-300 hover:bg-purple-950/40'
                    }`}
                  >
                    <Wand2 className="w-5 h-5 text-purple-400 animate-bounce" />
                    <span className="text-xs font-bold text-center">Base IA (Batería + Bajo)</span>
                    <span className="text-[10px] text-purple-300/80 text-center font-mono">
                      {genAiOnNewIdea ? '✓ Activado' : 'Generar Sintética'}
                    </span>
                  </button>
                </div>

                {/* ORIGINAL SONG BASE TRACK BANNER & SELECTOR */}
                {useSongBaseTrack && (
                  <div className="mt-3 p-3.5 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/50 via-orange-950/30 to-black/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono text-amber-200 animate-in fade-in duration-150 shadow-md">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                        <Disc className="w-5 h-5 animate-spin-slow" />
                      </div>
                      <div>
                        <span className="font-bold text-white block text-sm">
                          Pista Base Creada sobre: "{song.titulo}"
                        </span>
                        <span className="text-[10px] text-amber-300/80 block mt-0.5 font-sans">
                          {selectedAudioFile || recordedAudioUrl || driveAudioUrl
                            ? '⚡ Se cargará el tema original como Pista Base de fondo para sonar sincronizado junto a tu idea/grabación.'
                            : '⚡ Se cargará la pista original en la idea para que puedas usar el botón "+ Pista" o "Grabar encima (Mic)" e improvisar sobre el tema.'}
                        </span>
                      </div>
                    </div>

                    {((song.audioIdeas && song.audioIdeas.length > 0) || song.audioPrincipalUrl) && (
                      <div className="flex items-center gap-2 shrink-0 bg-black/60 p-2 rounded-xl border border-amber-500/30 w-full sm:w-auto">
                        <span className="text-[10px] text-amber-400 font-bold">Seleccionar Maqueta:</span>
                        <select
                          value={selectedSongBaseUrl}
                          onChange={(e) => setSelectedSongBaseUrl(e.target.value)}
                          className="px-2 py-1 rounded-lg bg-zinc-900 border border-amber-500/50 text-[11px] text-amber-200 font-mono focus:outline-none focus:border-amber-400 flex-1 min-w-0"
                        >
                          {song.audioPrincipalUrl && (
                            <option value={song.audioPrincipalUrl}>🎵 Tema Original ({song.titulo})</option>
                          )}
                          {song.audioIdeas?.map((idItem) => (
                            <option key={idItem.id} value={idItem.audioUrl}>
                              💡 Idea: {idItem.titulo} ({idItem.seccion})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* AI ACCOMPANIMENT GENERATION CONTROLS ON NEW IDEA */}
                {genAiOnNewIdea && (
                  <div className="mt-3 pt-3 border-t border-purple-500/30 bg-purple-950/30 p-3.5 rounded-xl border border-purple-500/40 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-purple-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        Ajustes de la Base IA (Batería + Bajo)
                      </span>
                      <span className="text-[10px] font-mono text-purple-400/80 bg-purple-900/50 px-2 py-0.5 rounded border border-purple-500/30">
                        {selectedAudioFile || recordedAudioUrl || driveAudioUrl ? 'Se añadirá como Pista 2' : 'Será la Pista Principal'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[10px] font-mono text-neutral-400 block mb-0.5">Estilo Rítmico</label>
                        <select
                          value={newIdeaStyle}
                          onChange={(e) => setNewIdeaStyle(e.target.value as any)}
                          className="w-full px-2 py-1 rounded-lg bg-black border border-purple-500/50 text-xs text-white font-mono"
                        >
                          <option value="rock">Rock / Pop Standard</option>
                          <option value="pop">Pop / Disco 4-on-floor</option>
                          <option value="funk">Funk Syncopated</option>
                          <option value="reggae">Reggae One-Drop</option>
                          <option value="ska">Ska Skank</option>
                          <option value="cumbia">Cumbia Tresillo</option>
                          <option value="punk">Punk Corcheas</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-neutral-400 block mb-0.5">Tempo (BPM)</label>
                        <input
                          type="number"
                          value={newIdeaBpm}
                          onChange={(e) => setNewIdeaBpm(parseInt(e.target.value) || 120)}
                          className="w-full px-2 py-1 rounded-lg bg-black border border-purple-500/50 text-xs text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-neutral-400 block mb-0.5">Tonalidad Base</label>
                        <input
                          type="text"
                          value={newIdeaKey}
                          onChange={(e) => setNewIdeaKey(e.target.value)}
                          className="w-full px-2 py-1 rounded-lg bg-black border border-purple-500/50 text-xs text-white font-mono"
                          placeholder="Do, Re, Mi..."
                        />
                      </div>

                      <div className="sm:col-span-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-neutral-300 pt-1 border-t border-purple-500/20">
                        <div className="flex flex-wrap items-center gap-4">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newIdeaIncludeDrums}
                              onChange={(e) => setNewIdeaIncludeDrums(e.target.checked)}
                              className="accent-purple-500"
                            />
                            <span>🥁 Batería Synth</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newIdeaIncludeBass}
                              onChange={(e) => setNewIdeaIncludeBass(e.target.checked)}
                              className="accent-purple-500"
                            />
                            <span>🎸 Bajo</span>
                          </label>
                        </div>

                        <span className="text-[10px] text-purple-300/80 italic">
                          ⚡ Se sintetizará un bucle rítmico automático al guardar la idea.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-mono text-neutral-400 block mb-1">Notas o explicación para el grupo</label>
                <textarea
                  value={ideaNotes}
                  onChange={(e) => setIdeaNotes(e.target.value)}
                  placeholder="Explica qué has grabado o la propuesta..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Status Indicator of Primary Audio Track */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-neutral-300">
                <span className="font-bold flex items-center gap-1.5 text-indigo-300">
                  <Disc className="w-4 h-4 text-indigo-400" /> Pista 1 de la Idea:
                </span>
                <div>
                  {selectedAudioFile ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Archivo: {selectedAudioFile.name}
                    </span>
                  ) : isRecording ? (
                    <span className="text-rose-400 font-bold flex items-center gap-1 animate-pulse">
                      <Mic className="w-4 h-4" /> Grabando micro ({Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')})...
                    </span>
                  ) : recordedAudioUrl ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Grabación de micrófono lista ({recordingTime}s)
                    </span>
                  ) : driveAudioUrl.trim() ? (
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Google Drive vinculado
                    </span>
                  ) : useSongBaseTrack && selectedSongBaseUrl ? (
                    <span className="text-amber-300 font-bold flex items-center gap-1">
                      <Disc className="w-4 h-4 text-amber-400 animate-spin-slow" /> Base: Tema Original ({song.titulo})
                    </span>
                  ) : genAiOnNewIdea ? (
                    <span className="text-purple-300 font-bold flex items-center gap-1">
                      <Sparkles className="w-4 h-4" /> Base IA ({newIdeaStyle.toUpperCase()} - {newIdeaKey})
                    </span>
                  ) : (
                    <span className="text-amber-400/90 italic text-[11px]">
                      ⚠️ Selecciona un archivo, carga el Tema Original, graba con el micro o activa Base IA
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddIdea(false)}
                  className="px-3 py-2 rounded-xl text-xs text-neutral-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveIdea}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold text-xs uppercase tracking-wider"
                >
                  {isUploading ? 'Guardando en Servidor...' : 'Guardar Idea'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

          {/* Ideas Audio Feed */}
          {filteredIdeas.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-neutral-600 mx-auto" />
              <p className="text-sm text-neutral-400 font-mono">
                {activeSectionFilter === 'todas'
                  ? 'Aún no hay ideas de audio subidas para este tema.'
                  : `No hay propuestas grabadas para la sección "${activeSectionFilter}".`}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (activeSectionFilter !== 'todas') setIdeaSection(activeSectionFilter as any);
                  setShowAddIdea(true);
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white font-bold transition-all cursor-pointer"
              >
                + Grabar / Subir la primera idea
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence>
                {filteredIdeas.map((idea) => {
                  const isPlaying = playingIdeaId === idea.id;
                  const currentTime = currentTimeMap[idea.id] || 0;
                  const rawDuration = durationMap[idea.id];
                  const duration = (rawDuration && !isNaN(rawDuration) && isFinite(rawDuration) && rawDuration > 0) ? rawDuration : 0;
                  const sectionInfo = SECCIONES_TEMA.find(s => s.key === idea.seccion) || SECCIONES_TEMA[0];
                  const votes = idea.votos || [];
                  const hasVoted = votes.includes(currentUsername);
                  const tracks = getIdeaTracks(idea);
                  const isAddingTrack = addingTrackIdeaId === idea.id;
                  // Con una sola idea en el catálogo no hay nada que "priorizar" plegando —
                  // se abre directa, sin necesidad de tocar el chevron para empezar a trabajar.
                  const isIdeaExpanded = filteredIdeas.length === 1 || expandedIdeaIds.has(idea.id);

                  return (
                    <motion.div
                      key={idea.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.25 }}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-4 ${
                        isPlaying 
                          ? 'bg-indigo-950/30 border-indigo-500/50 shadow-2xl ring-1 ring-indigo-500/30' 
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* Idea Header: solo lo esencial siempre visible — escuchar, ver de qué va, y un
                          menú de "más opciones" para todo lo demás. El resto se revela al expandir. */}
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <button
                            type="button"
                            onClick={() => toggleIdeaExpanded(idea.id)}
                            title={isIdeaExpanded ? 'Plegar idea' : 'Expandir idea'}
                            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer shrink-0"
                          >
                            {isIdeaExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border shrink-0 ${sectionInfo.color}`}>
                            {sectionInfo.icon} {sectionInfo.label}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
                              {idea.titulo}
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                                {tracks.length} {tracks.length === 1 ? 'pista' : 'pistas separadas'}
                              </span>
                              {isPlaying && (
                                <div className="flex items-end gap-0.5 h-4 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40">
                                  <motion.span animate={{ height: ['25%', '90%', '40%', '100%', '30%'] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }} className="w-1 bg-emerald-400 rounded-full" />
                                  <motion.span animate={{ height: ['80%', '30%', '95%', '40%', '70%'] }} transition={{ repeat: Infinity, duration: 0.7, ease: "easeInOut" }} className="w-1 bg-emerald-400 rounded-full" />
                                  <motion.span animate={{ height: ['40%', '100%', '30%', '80%', '20%'] }} transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }} className="w-1 bg-emerald-400 rounded-full" />
                                </div>
                              )}
                            </h4>
                            <span className="text-[11px] text-neutral-400 font-mono flex items-center gap-1 mt-0.5 truncate">
                              <UserIcon className="w-3 h-3 text-indigo-400 shrink-0" />
                              {idea.subidoPor} {idea.instrumento ? `(${idea.instrumento})` : ''} • {idea.fecha}
                            </span>
                          </div>
                        </div>

                        {/* Únicas acciones siempre visibles: escuchar y el menú de más opciones */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => togglePlayIdea(idea)}
                            className={`p-2 rounded-xl flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer ${
                              isPlaying ? 'bg-amber-500 text-zinc-950' : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
                            }`}
                            title="Play / Pausa"
                          >
                            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                          </button>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setOpenIdeaActionsMenuId(openIdeaActionsMenuId === idea.id ? null : idea.id); }}
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                              title="Más opciones"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {openIdeaActionsMenuId === idea.id && (
                              <div className="absolute right-0 top-full mt-2 w-56 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl p-1.5 z-50 space-y-1 text-xs font-mono">
                                <button
                                  type="button"
                                  onClick={() => { setOpenIdeaActionsMenuId(null); handleShareIdea(idea); }}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-emerald-300 flex items-center gap-2"
                                >
                                  <MessageSquare className="w-4 h-4 text-emerald-400" /> Compartir por WhatsApp
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setOpenIdeaActionsMenuId(null); handleExportMasterMix(idea); }}
                                  disabled={isExportingMaster}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-indigo-300 flex items-center gap-2 disabled:opacity-50"
                                >
                                  <Disc className={`w-4 h-4 text-indigo-400 ${isExportingMaster ? 'animate-spin' : ''}`} /> Exportar mezcla (.WAV)
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { setOpenIdeaActionsMenuId(null); handleDuplicateIdea(e, idea.id); }}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-sky-300 flex items-center gap-2"
                                >
                                  <Copy className="w-4 h-4 text-sky-400" /> Duplicar como nueva versión
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenIdeaActionsMenuId(null);
                                    setAiTrackGenPreview(null);
                                    setAiTrackGenError(null);
                                    setAiTrackGenStartOffsetSec(0);
                                    setShowAiTrackGenModal(idea);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-purple-300 flex items-center gap-2"
                                >
                                  <Wand2 className="w-4 h-4 text-purple-400" /> Generar pista con IA
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenIdeaActionsMenuId(null);
                                    setShowGenModalForIdea(idea);
                                    setGenBpm(song.bpm || 120);
                                    setGenKey(song.tonalidad || 'Do');
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-purple-300 flex items-center gap-2"
                                >
                                  <Wand2 className="w-4 h-4 text-purple-400" /> Base rítmica IA (batería/bajo)
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { setOpenIdeaActionsMenuId(null); handleDeleteIdea(e, idea.id); }}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-950/40 text-rose-300 flex items-center gap-2 border-t border-white/10 pt-2"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-400" /> Eliminar idea
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                    {isIdeaExpanded && (
                    <>
                    {idea.notas && (
                      <p className="text-xs text-neutral-300 italic bg-black/20 p-2.5 rounded-xl border border-white/5">
                        "{idea.notas}"
                      </p>
                    )}

                    {/* Separar Stems / Añadir Pista: se revelan solo al expandir la idea.
                        Una vez ya hay stems separados, "Separar Stems" deja paso a "Comparar
                        Motor" (en la cabecera del mezclador) — no hace falta tenerlo doblado aquí. */}
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {!idea.stemEngineUsed && (
                      <div className="flex items-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 shadow-md overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handlePerformAiStemSeparation(idea)}
                          disabled={isSeparatingStemsAi}
                          className="px-3 py-1.5 hover:bg-amber-400/20 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                          title="Separar voces, batería, bajo y guitarras en pistas aisladas con el motor seleccionado"
                        >
                          <Cpu className={`w-4 h-4 ${isSeparatingStemsAi ? 'animate-spin text-zinc-950' : 'text-zinc-950'}`} />
                          <span>{isSeparatingStemsAi ? 'Separando...' : '🎛️ Separar con Iris'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowMoisesStemsModal(idea)}
                          className="px-2 py-1.5 border-l border-amber-600/60 hover:bg-amber-400/30 text-zinc-950 transition-all cursor-pointer flex items-center"
                          title="Elegir motor de separación (Iris Studio, Iris Cloud o Iris Básico) o comparar calidad"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (addingTrackIdeaId === idea.id) {
                            setAddingTrackIdeaId(null);
                          } else {
                            setAddingTrackIdeaId(idea.id);
                            setNewTrackName(`Pista ${tracks.length + 1}`);
                            setNewTrackInstrument('');
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                        title="Grabar micrófono o subir otra pista de instrumento"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Pista</span>
                      </button>
                    </div>

                    {/* MASTER MULTITRACK CONTROLS & TIMELINE */}
                    <div className="p-2.5 sm:p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-2 sm:space-y-3 shadow-inner">
                      {/* Streamlined Transport Toolbar */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
                        {/* Playback Controls */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {/* Play / Pause Toggle */}
                          <button
                            type="button"
                            onClick={() => togglePlayIdea(idea)}
                            className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-xs shadow-lg transition-all active:scale-95 cursor-pointer ${
                              isPlaying
                                ? 'bg-amber-500 text-zinc-950 font-black'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
                            }`}
                            title="Play / Pausa (Espacio)"
                          >
                            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                            <span>{isPlaying ? 'Pausa' : 'Reproducir'}</span>
                          </button>

                          {/* Stop / Rewind to 0:00 */}
                          <button
                            type="button"
                            onClick={() => handleStopIdea(idea)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 transition-all cursor-pointer"
                            title="Detener e ir al inicio (Atajo: 0 / Home)"
                          >
                            <Square className="w-4 h-4 fill-current text-rose-400" />
                          </button>

                          {/* Loop Toggle */}
                          {(() => {
                            const loopCfg = loopConfigMap[idea.id];
                            const isLoopEnabled = !!loopCfg?.enabled;
                            return (
                              <button
                                type="button"
                                onClick={() => toggleIdeaLoop(idea)}
                                className={`px-2.5 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                                  isLoopEnabled
                                    ? 'bg-purple-600 text-white border-purple-400 shadow-md ring-1 ring-purple-400/50'
                                    : 'bg-white/5 hover:bg-white/10 text-neutral-400 border-white/10'
                                }`}
                                title="Bucle ON/OFF (Atajo: L)"
                              >
                                <Repeat className="w-3.5 h-3.5" />
                                <span>{isLoopEnabled ? 'Bucle ON' : 'Bucle'}</span>
                              </button>
                            );
                          })()}
                        </div>

                        {/* Extra Tools & Stems Actions: "+ Base Rítmica IA" vive en el menú ⋮ de la
                            idea (es una acción ocasional, no algo que hace falta tener siempre a mano) */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          {selectedSongBaseUrl && !tracks.some(t => t.audioUrl === selectedSongBaseUrl) && (
                            <button
                              type="button"
                              onClick={() => {
                                saveNewTrackToIdea(
                                  idea,
                                  selectedSongBaseUrl,
                                  `🎵 Base: ${song.titulo} (Original)`,
                                  'Tema Base'
                                );
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                              title="Cargar tema original como base"
                            >
                              <Disc className="w-3.5 h-3.5 text-amber-400" />
                              <span>+ Base Tema</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Timeline status & counter */}
                      <div className="flex items-center justify-between text-xs font-mono text-neutral-400 pt-1">
                        <span className="text-neutral-300 font-bold flex items-center gap-1.5">
                          {isPlaying ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-neutral-500" />
                          )}
                          {isPlaying ? 'Reproduciendo...' : 'Detenido'}
                        </span>

                        <div className="text-emerald-400 font-bold font-mono">
                          {formatTime(currentTime)} <span className="text-neutral-500">/</span> {formatTime(duration)}
                        </div>
                      </div>

                      {/* Timeline Slider with Visual Cue Range Highlight */}
                      {(() => {
                        const loopCfg = loopConfigMap[idea.id];
                        const isLoopEnabled = !!loopCfg?.enabled;
                        const lStart = loopCfg?.start || 0;
                        const lEnd = (loopCfg?.end && loopCfg.end > lStart) ? loopCfg.end : (duration || 30);
                        const dur = duration || 30;

                        return (
                          <div className="relative w-full pt-1 pb-1">
                            {/* Visual Cue Loop Region */}
                            {dur > 0 && isLoopEnabled && (
                              <div
                                className="absolute top-1 bottom-1 bg-purple-500/25 border-x-2 border-purple-400/80 rounded pointer-events-none z-0"
                                style={{
                                  left: `${Math.min(100, Math.max(0, (lStart / dur) * 100))}%`,
                                  width: `${Math.min(100, Math.max(1, ((lEnd - lStart) / dur) * 100))}%`
                                }}
                              >
                                <span className="absolute -top-3 left-0 text-[8px] font-mono text-purple-200 font-bold bg-purple-950 px-1 rounded border border-purple-500/50">
                                  Cue A
                                </span>
                                <span className="absolute -top-3 right-0 text-[8px] font-mono text-purple-200 font-bold bg-purple-950 px-1 rounded border border-purple-500/50">
                                  Cue B
                                </span>
                              </div>
                            )}

                            <input
                              type="range"
                              min={0}
                              max={dur}
                              step={0.05}
                              value={currentTime}
                              onChange={(e) => handleSeekIdea(idea, parseFloat(e.target.value))}
                              className="w-full accent-indigo-500 h-2 bg-neutral-800 rounded-lg cursor-pointer relative z-10 opacity-90 hover:opacity-100"
                            />
                          </div>
                        );
                      })()}
                    </div>

                    {/* MINI DAW TRACK LIST MIXER */}
                    <div className="space-y-1.5 sm:space-y-2 bg-black/30 p-2 sm:p-3 rounded-xl border border-white/5">
                      {(() => {
                        const hasSoloInIdea = tracks.some(t => t.solo);
                        return (
                          <>
                            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 uppercase tracking-wider border-b border-white/10 pb-1.5 flex-wrap gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="flex items-center gap-1.5 font-bold text-white">
                                  <Sliders className="w-3.5 h-3.5 text-indigo-400" /> Mezclador de Pistas ({tracks.length})
                                </span>
                                {idea.stemEngineUsed && (
                                  <span className={`hidden sm:flex px-2 py-0.5 rounded text-[10px] font-mono items-center gap-1 font-bold ${
                                    idea.stemDegraded
                                      ? 'bg-amber-950/70 border border-amber-500/40 text-amber-300'
                                      : 'bg-purple-950/70 border border-purple-500/40 text-purple-300'
                                  }`}>
                                    <Sparkles className="w-3 h-3 text-amber-400" />
                                    <span>Motor: {idea.stemEngineUsed.split('(')[0].trim()}</span>
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                {tracks.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => setPracticeModeIdea(idea)}
                                    className="px-1.5 sm:px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 transition-all cursor-pointer"
                                    title="Practica con tu propia mezcla, velocidad y bucle sin tocar la mezcla de la banda"
                                  >
                                    <Headphones className="w-3 h-3" />
                                    <span className="hidden sm:inline">Sala de Ensayo</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setShowMoisesStemsModal(idea)}
                                  className="px-1.5 sm:px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1 transition-all cursor-pointer"
                                  title="Comparar calidad con otro motor de Iris o volver a separar"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  <span className="hidden sm:inline">Comparar Motor</span>
                                </button>
                                {hasSoloInIdea && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-amber-400 text-black flex items-center gap-1 shadow-md shadow-amber-400/40 animate-pulse">
                                    <Volume2 className="w-3 h-3" /> SOLO (S) ACTIVO
                                  </span>
                                )}
                                <span className="hidden sm:inline">Volumen & Mute</span>
                              </div>
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                              {tracks.map((tr, idx) => {
                                const isMuted = tr.muted;
                                const isSolo = (tr as any).solo;
                                const vol = tr.volumen ?? 1;
                                const isEditing = editingTrackId === tr.id;

                                const isDraggingThisTrack = draggedTrackInfo?.ideaId === idea.id && draggedTrackInfo.index === idx;
                                const isDragOverThisTrack = dragOverTrackIndex === idx && draggedTrackInfo?.ideaId === idea.id && !isDraggingThisTrack;

                                return (
                                  <div
                                    key={tr.id}
                                    onDragOver={(e) => { e.preventDefault(); if (draggedTrackInfo?.ideaId === idea.id) setDragOverTrackIndex(idx); }}
                                    onDragLeave={() => setDragOverTrackIndex(prev => (prev === idx ? null : prev))}
                                    onDrop={(e) => { e.preventDefault(); handleDropTrack(idea, idx); }}
                                    className={`rounded-xl border overflow-hidden transition-all ${
                                      isDraggingThisTrack
                                        ? 'opacity-30 scale-[0.98] border-dashed border-indigo-400'
                                        : isDragOverThisTrack
                                        ? 'border-indigo-400 ring-2 ring-indigo-400/50 bg-indigo-500/10'
                                        : isMuted
                                        ? 'bg-red-950/20 border-red-900/40 opacity-50 grayscale-[30%]'
                                        : isSolo
                                          ? 'bg-amber-500/10 border-amber-400/80 ring-1 ring-amber-400/40 border-l-4 border-l-amber-400 shadow-lg shadow-amber-950/30'
                                          : hasSoloInIdea
                                            ? 'bg-black/50 border-neutral-800/80 opacity-40 grayscale-[50%]'
                                            : 'bg-white/5 border-white/10 hover:border-white/20'
                                    }`}
                                  >
                                    <div className="flex items-stretch">
                                      {/* Asa de arrastre grande, ocupa todo el alto de la fila — igual sistema
                                          (HTML5 drag nativo) que ya funciona en el repertorio, pero con un
                                          objetivo táctil mucho mayor que un icono suelto */}
                                      {tracks.length > 1 && (
                                        <div
                                          draggable
                                          onDragStart={() => setDraggedTrackInfo({ ideaId: idea.id, index: idx })}
                                          onDragEnd={() => { setDraggedTrackInfo(null); setDragOverTrackIndex(null); }}
                                          className="w-7 shrink-0 flex items-center justify-center bg-black/30 hover:bg-black/50 active:bg-indigo-500/20 border-r border-white/10 cursor-grab active:cursor-grabbing touch-none select-none"
                                          title="Arrastrar para reordenar pista"
                                        >
                                          <GripVertical className="w-4 h-4 text-neutral-400" />
                                        </div>
                                      )}
                                      {/* Cubase-style compact row: name/controls sidebar left of the waveform on tablet/desktop; on mobile the sidebar becomes a bar above the waveform instead (too narrow to sit side by side) */}
                                      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-stretch">
                                        {/* Sidebar: name + transport controls, 2 compact lines */}
                                        <div
                                          className="w-full sm:w-[190px] shrink-0 flex flex-col justify-center gap-1 px-2 py-1 border-b sm:border-b-0 sm:border-r border-white/10 bg-black/25"
                                          title={tr.instrumento || undefined}
                                        >
                                        {/* Line 1: number badge (coloreado por familia de instrumento, guiño a Iris) + name + edit */}
                                        <div className="flex items-center gap-1 min-w-0">
                                          <span
                                            className="w-4 h-4 rounded font-mono text-[9px] font-bold flex items-center justify-center shrink-0 border"
                                            style={{
                                              backgroundColor: getTrackRainbowColor(tr, idx, '30'),
                                              borderColor: getTrackRainbowColor(tr, idx, '80'),
                                              color: getTrackRainbowColor(tr, idx)
                                            }}
                                          >
                                            {idx + 1}
                                          </span>

                                          {isEditing ? (
                                            <div className="flex items-center gap-1 min-w-0 flex-1">
                                              <input
                                                type="text"
                                                value={editingTrackName}
                                                onChange={(e) => setEditingTrackName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSaveTrackName(idea, tr.id, editingTrackName)}
                                                className="w-full min-w-0 px-1.5 py-0.5 rounded bg-black border border-indigo-500 text-[11px] text-white font-bold"
                                                autoFocus
                                              />
                                              <button
                                                type="button"
                                                onClick={() => handleSaveTrackName(idea, tr.id, editingTrackName)}
                                                className="p-0.5 text-emerald-400 hover:text-emerald-300 shrink-0"
                                              >
                                                <Check className="w-3 h-3" />
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-1 min-w-0 flex-1">
                                              <span className="text-[11px] font-bold text-white font-mono truncate">{tr.nombre}</span>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setEditingTrackId(tr.id);
                                                  setEditingTrackName(tr.nombre);
                                                }}
                                                className="text-neutral-500 hover:text-neutral-300 shrink-0"
                                                title="Editar nombre de pista"
                                              >
                                                <Edit2 className="w-2.5 h-2.5" />
                                              </button>
                                            </div>
                                          )}
                                        </div>

                                        {/* Line 2: M/S + volume + ajustes + delete */}
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => handleToggleMuteTrack(idea, tr.id)}
                                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black cursor-pointer transition-all border shrink-0 ${
                                              isMuted
                                                ? 'bg-red-600 text-white border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.7)] ring-1 ring-red-400/50'
                                                : 'bg-neutral-800/90 text-neutral-400 border-neutral-700/80 hover:text-white hover:bg-neutral-700'
                                            }`}
                                            title="Mute (M) - Silenciar pista"
                                          >
                                            M
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleToggleSoloTrack(idea, tr.id)}
                                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black cursor-pointer transition-all border shrink-0 ${
                                              isSolo
                                                ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.8)] ring-1 ring-amber-300/60'
                                                : 'bg-neutral-800/90 text-neutral-400 border-neutral-700/80 hover:text-white hover:bg-neutral-700'
                                            }`}
                                            title="Solo (S) - Aísla esta pista en exclusiva (Cubase style)"
                                          >
                                            S
                                          </button>

                                          {vol === 0 || isMuted ? (
                                            <VolumeX className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                                          ) : (
                                            <Volume2 className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                                          )}
                                          <input
                                            type="range"
                                            min={0}
                                            max={1}
                                            step={0.05}
                                            value={isMuted ? 0 : vol}
                                            onChange={(e) => handleTrackVolumeChange(idea, tr.id, parseFloat(e.target.value))}
                                            className="flex-1 min-w-0 accent-indigo-500 h-1 bg-neutral-800 rounded cursor-pointer"
                                            title={`Volumen: ${Math.round(vol * 100)}%`}
                                          />

                                          {/* Toggle Advanced Track Settings Drawer */}
                                          <button
                                            type="button"
                                            onClick={() => setExpandedTrackSettingsId(expandedTrackSettingsId === tr.id ? null : tr.id)}
                                            className={`relative p-1 rounded cursor-pointer transition-all border shrink-0 ${
                                              expandedTrackSettingsId === tr.id
                                                ? 'bg-purple-500/30 text-purple-300 border-purple-500/50'
                                                : 'bg-white/5 text-neutral-300 border-white/10 hover:bg-white/10'
                                            }`}
                                            title={`Ajustes de Pista: Paneo, Ecualizador 3 Bandas y Ajuste de Latencia${(tr.desfaseMs || 0) !== 0 ? ` · ${formatDesfase(tr.desfaseMs)}` : ''}`}
                                          >
                                            <Sliders className="w-2.5 h-2.5 text-purple-300" />
                                            {(tr.desfaseMs || 0) !== 0 && (
                                              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 ring-1 ring-black" />
                                            )}
                                          </button>
                                        </div>
                                      </div>

                                      {/* Waveform Visualizer: fills remaining width, height = row height */}
                                      <div className="w-full sm:flex-1 relative bg-black/20">
                                        <WaveformTrack
                                          ref={(el) => { trackAudioRefs.current[tr.id] = el as HTMLAudioElement; }}
                                          audioUrl={resolvedAudioUrls[tr.id] || tr.audioUrl}
                                          color={getTrackRainbowColor(tr, idx)}
                                          masterDuration={duration || 30}
                                          trackDuration={trackAudioRefs.current[tr.id]?.duration || durationMap[tr.id]}
                                          currentTime={currentTime}
                                          onSeekTrack={(seekSec) => handleSeekIdea(idea, seekSec)}
                                          onTrackLoaded={(dur) => {
                                            if (dur > 0 && isFinite(dur)) {
                                              setDurationMap(prev => {
                                                const cur = prev[idea.id] || 0;
                                                if (dur > cur) return { ...prev, [idea.id]: dur };
                                                return prev;
                                              });
                                            }
                                          }}
                                        />
                                      </div>
                                      </div>
                                    </div>

                              {/* Collapsible Advanced Track Settings Drawer (Pan, EQ, Latency Nudge) */}
                              {expandedTrackSettingsId === tr.id && (
                                <div className="mt-1 p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-3 font-mono text-[10px] text-purple-200">
                                  {/* Row 1: Paneo Estéreo & Limpiar Zumbidos */}
                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-purple-500/10 pb-2">
                                    {/* Stereo Pan Slider */}
                                    <div className="flex items-center gap-2 flex-1 min-w-[200px]" title={`Paneo: ${tr.pan ? (tr.pan < 0 ? `L ${Math.round(Math.abs(tr.pan)*100)}%` : `R ${Math.round(tr.pan*100)}%`) : 'Centro'}`}>
                                      <span className="text-neutral-400 font-bold shrink-0">🎧 Paneo Estéreo:</span>
                                      <span className="text-[9px] font-bold text-neutral-400">L</span>
                                      <input
                                        type="range"
                                        min={-1}
                                        max={1}
                                        step={0.05}
                                        value={tr.pan ?? 0}
                                        onChange={(e) => handleTrackPanChange(idea, tr.id, parseFloat(e.target.value))}
                                        className="w-full accent-purple-400 h-1 bg-neutral-900 rounded cursor-pointer"
                                      />
                                      <span className="text-[9px] font-bold text-neutral-400">R</span>
                                      <span className="text-[9px] text-purple-300 font-bold shrink-0 min-w-[36px] text-right">
                                        {tr.pan ? (tr.pan < 0 ? `L${Math.round(Math.abs(tr.pan)*100)}` : `R${Math.round(tr.pan*100)}`) : 'C'}
                                      </span>
                                    </div>

                                    {/* Clean Noise Filter Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleCleanTrackAudio(idea, tr)}
                                      disabled={cleaningTrackId === tr.id}
                                      className={`px-2 py-1 rounded-lg font-bold cursor-pointer transition-all border shrink-0 flex items-center gap-1 ${
                                        cleaningTrackId === tr.id
                                          ? 'bg-amber-500/30 text-amber-300 border-amber-500/50 animate-pulse'
                                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                      }`}
                                      title="Limpiar ruido de fondo y zumbidos de esta pista con Filtro Studio DSP (High-Pass 80Hz + Notch)"
                                    >
                                      <span>{cleaningTrackId === tr.id ? '🧹 Limpiando...' : '🧹 Filtro Zumbidos'}</span>
                                    </button>
                                  </div>

                                  {/* Row 2: 3-Band EQ */}
                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-purple-500/10 pb-2">
                                    <span className="text-neutral-400 font-bold shrink-0">🎛️ Ecualizador:</span>
                                    
                                    <div className="flex-1 flex flex-col gap-1">
                                      <div className="flex justify-between items-center text-neutral-400 text-[9px]">
                                        <span>Graves (100Hz)</span>
                                        <span className="font-bold text-purple-300">{tr.eqLow || 0}dB</span>
                                      </div>
                                      <input
                                        type="range"
                                        min={-12}
                                        max={12}
                                        step={1}
                                        value={tr.eqLow ?? 0}
                                        onChange={(e) => handleTrackEqChange(idea, tr.id, 'low', parseFloat(e.target.value))}
                                        className="w-full accent-purple-400 h-1 bg-neutral-900 rounded cursor-pointer"
                                      />
                                    </div>

                                    <div className="flex-1 flex flex-col gap-1">
                                      <div className="flex justify-between items-center text-neutral-400 text-[9px]">
                                        <span>Medios (1kHz)</span>
                                        <span className="font-bold text-purple-300">{tr.eqMid || 0}dB</span>
                                      </div>
                                      <input
                                        type="range"
                                        min={-12}
                                        max={12}
                                        step={1}
                                        value={tr.eqMid ?? 0}
                                        onChange={(e) => handleTrackEqChange(idea, tr.id, 'mid', parseFloat(e.target.value))}
                                        className="w-full accent-purple-400 h-1 bg-neutral-900 rounded cursor-pointer"
                                      />
                                    </div>

                                    <div className="flex-1 flex flex-col gap-1">
                                      <div className="flex justify-between items-center text-neutral-400 text-[9px]">
                                        <span>Agudos (8kHz)</span>
                                        <span className="font-bold text-purple-300">{tr.eqHigh || 0}dB</span>
                                      </div>
                                      <input
                                        type="range"
                                        min={-12}
                                        max={12}
                                        step={1}
                                        value={tr.eqHigh ?? 0}
                                        onChange={(e) => handleTrackEqChange(idea, tr.id, 'high', parseFloat(e.target.value))}
                                        className="w-full accent-purple-400 h-1 bg-neutral-900 rounded cursor-pointer"
                                      />
                                    </div>

                                    {(tr.eqLow !== 0 || tr.eqMid !== 0 || tr.eqHigh !== 0) && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleTrackEqChange(idea, tr.id, 'low', 0);
                                          handleTrackEqChange(idea, tr.id, 'mid', 0);
                                          handleTrackEqChange(idea, tr.id, 'high', 0);
                                        }}
                                        className="px-1.5 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[8px] cursor-pointer shrink-0 self-end sm:self-center"
                                        title="Resetear EQ a 0dB"
                                      >
                                        Reset EQ
                                      </button>
                                    )}
                                  </div>

                                  {/* Row 3: Latency Nudge & Sync IA */}
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-amber-400 font-bold flex items-center gap-1" title="Ajuste fino de latencia en milisegundos (-adelantar/+atrasar)">
                                        ⏱️ Desfase de Latencia: <span className="text-white">{formatDesfase(tr.desfaseMs)}</span>
                                      </span>

                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => handleAutoSyncTrackLatency(idea, tr)}
                                          className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-black border border-amber-500/40 cursor-pointer transition-colors flex items-center gap-1 text-[9px]"
                                          title="Sincronizar automáticamente por IA/DSP comparando las ondas de sonido de la mezcla"
                                        >
                                          ⚡ Sync Auto IA
                                        </button>
                                        {(tr.desfaseMs || 0) !== 0 && (
                                          <button
                                            type="button"
                                            onClick={() => handleTrackDesfaseChange(idea, tr.id, 0)}
                                            className="px-1.5 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[9px] cursor-pointer"
                                            title="Resetear desfase a 0ms"
                                          >
                                            Reset 0ms
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Nudge Buttons & Slider */}
                                    <div className="flex items-center gap-1 justify-between">
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => handleTrackDesfaseChange(idea, tr.id, (tr.desfaseMs || 0) - 10)}
                                          className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[9px] cursor-pointer"
                                        >
                                          -10ms
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleTrackDesfaseChange(idea, tr.id, (tr.desfaseMs || 0) - 1)}
                                          className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[9px] cursor-pointer"
                                        >
                                          -1ms
                                        </button>
                                      </div>

                                      <input
                                        type="range"
                                        min={-500}
                                        max={500}
                                        step={1}
                                        value={tr.desfaseMs || 0}
                                        onChange={(e) => handleTrackDesfaseChange(idea, tr.id, Number(e.target.value))}
                                        className="w-full max-w-xs h-1 bg-black/40 rounded appearance-none cursor-pointer accent-amber-400 mx-2"
                                        title="Deslizar para sincronizar desfase en tiempo real (-500ms a +500ms)"
                                      />

                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => handleTrackDesfaseChange(idea, tr.id, (tr.desfaseMs || 0) + 1)}
                                          className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[9px] cursor-pointer"
                                        >
                                          +1ms
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleTrackDesfaseChange(idea, tr.id, (tr.desfaseMs || 0) + 10)}
                                          className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[9px] cursor-pointer"
                                        >
                                          +10ms
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Row 4: Reordenar / Borrar pista — acciones ocasionales, fuera de
                                      la fila principal para que no se pulsen sin querer */}
                                  <div className="flex items-center justify-between border-t border-purple-500/10 pt-2">
                                    <div className="flex items-center gap-1">
                                      <span className="text-neutral-400 font-bold mr-1">Orden:</span>
                                      <button
                                        type="button"
                                        onClick={() => handleMoveTrack(idea, tr.id, 'up')}
                                        disabled={idx === 0}
                                        className="px-1.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                                        title="Subir pista"
                                      >
                                        <ChevronUp className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleMoveTrack(idea, tr.id, 'down')}
                                        disabled={idx === tracks.length - 1}
                                        className="px-1.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                                        title="Bajar pista"
                                      >
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTrack(idea, tr.id)}
                                      className="px-2 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-bold text-[10px] flex items-center gap-1.5 cursor-pointer transition-all"
                                    >
                                      <X className="w-3 h-3" /> Borrar Pista
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* CUBASE LIVE RECORDING TRACK ROW */}
                        {isRecordingTrack && recordingTrackIdeaId === idea.id && (
                          <div className="p-3.5 rounded-xl border-2 border-red-500 bg-red-950/40 flex flex-col gap-2.5 shadow-xl shadow-red-950/60 ring-2 ring-red-500/50">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                                <span className="w-6 h-6 rounded bg-red-600 text-white font-mono text-xs font-black flex items-center justify-center shrink-0 shadow">
                                  {tracks.length + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-white font-mono">
                                      {newTrackName.trim() || `Pista ${tracks.length + 1}`}
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow">
                                      <span className="w-2 h-2 rounded-full bg-white animate-ping" /> GRABANDO ONDAS EN DIRECTO...
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono text-red-300 block mt-0.5">
                                    Grabación estilo Cubase sobre la barra de la pista
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                <div className="text-sm font-mono font-black text-red-400 bg-black/80 px-3 py-1 rounded-lg border border-red-500/50 shadow">
                                  {formatTime(recordingTrackTime)}
                                </div>

                                <button
                                  type="button"
                                  onClick={stopRecordingTrackOverdub}
                                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer transition-all active:scale-95 shrink-0"
                                  title="Detener y guardar pista en la idea"
                                >
                                  <Square className="w-3.5 h-3.5 fill-current" />
                                  <span>Detener & Guardar</span>
                                </button>
                              </div>
                            </div>

                            {/* Live Waveform Timeline Bar across the track lane */}
                            <div className="w-full h-12 relative rounded bg-black/60 border border-red-500/40 p-0.5 overflow-hidden">
                              <LiveMicWaveformCanvas 
                                stream={activeRecordingStream}
                                audioCtx={studioAudioCtxRef.current}
                                isRecording={isRecordingTrack}
                                color="#ef4444"
                                height={44}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
                </div>

                    {/* OVERDUB ADD TRACK DRAWER */}
                    {isAddingTrack && (
                      <div className="p-4 rounded-xl border border-sky-500/40 bg-sky-950/20 space-y-3 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-sky-300 flex items-center gap-1.5">
                            <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
                            Añadir Nueva Pista (Overdub / Superponer Audio)
                          </span>
                          <button type="button" onClick={() => setAddingTrackIdeaId(null)} className="text-neutral-400 hover:text-white">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="p-3 rounded-lg bg-black/60 border border-sky-500/30 space-y-2">
                          <div className="flex items-center gap-2 text-amber-300 text-[11px] font-semibold">
                            <Headphones className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>💡 RECOMENDACIÓN MULTIPISTA ESTUDIO:</span>
                          </div>
                          <p className="text-[10px] text-neutral-300 leading-relaxed font-sans">
                            Para evitar que el sonido de las pistas anteriores se cuele por el micrófono (acople de altavoces), <strong className="text-white">utiliza auriculares para escuchar la mezcla</strong> mientras grabas la nueva pista.
                          </p>

                          <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[10px] font-mono text-sky-300 font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Filtros Anti-Ruido Studio:
                            </span>

                            <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono">
                              <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300 hover:text-white">
                                <input
                                  type="checkbox"
                                  checked={useCleanDSPFilter}
                                  onChange={(e) => setUseCleanDSPFilter(e.target.checked)}
                                  className="rounded accent-sky-500"
                                />
                                <span>Filtro DSP Anti-Zumbido (High-Pass 80Hz + Notch)</span>
                              </label>

                              <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300 hover:text-white">
                                <input
                                  type="checkbox"
                                  checked={useEchoCancellation}
                                  onChange={(e) => setUseEchoCancellation(e.target.checked)}
                                  className="rounded accent-sky-500"
                                />
                                <span>Cancelación de Eco</span>
                              </label>

                              <div className="space-y-1.5 pt-1.5 border-t border-white/10">
                                <div className="flex items-center justify-between text-amber-300 font-bold text-[10px] flex-wrap gap-1">
                                  <span>⚡ Recorte de Latencia Micro: {autoLatencyTrimMs} ms</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setAutoLatencyTrimMs(120)}
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-colors ${autoLatencyTrimMs === 120 ? 'bg-amber-500 text-black font-bold' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                                      title="Recorte estándar para altavoces o auriculares de cable en PC (120ms)"
                                    >
                                      PC (120ms)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setAutoLatencyTrimMs(240)}
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-colors ${autoLatencyTrimMs === 240 ? 'bg-amber-500 text-black font-bold' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                                      title="Recorte para teléfonos móviles y tablets (240ms)"
                                    >
                                      Móvil (240ms)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setAutoLatencyTrimMs(300)}
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-colors ${autoLatencyTrimMs === 300 ? 'bg-amber-500 text-black font-bold' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                                      title="Recorte para auriculares Bluetooth tipo AirPods o Sony (300ms)"
                                    >
                                      Bluetooth (300ms)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setAutoLatencyTrimMs(0)}
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-colors ${autoLatencyTrimMs === 0 ? 'bg-rose-500 text-white font-bold' : 'bg-rose-500/20 text-rose-300'}`}
                                      title="Sin recorte (0ms)"
                                    >
                                      0ms
                                    </button>
                                  </div>
                                </div>
                                <input
                                  type="range"
                                  min={0}
                                  max={400}
                                  step={10}
                                  value={autoLatencyTrimMs}
                                  onChange={(e) => setAutoLatencyTrimMs(Number(e.target.value))}
                                  className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-amber-400"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-mono text-neutral-400 block mb-0.5">Nombre de la Pista *</label>
                            <input
                              type="text"
                              value={newTrackName}
                              onChange={(e) => setNewTrackName(e.target.value)}
                              placeholder="Ej: Voz Segunda / Solo Guitarra / Batería"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-neutral-700 text-xs text-white focus:outline-none focus:border-sky-500"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-mono text-neutral-400 block mb-0.5">Instrumento (Opcional)</label>
                            <input
                              type="text"
                              value={newTrackInstrument}
                              onChange={(e) => setNewTrackInstrument(e.target.value)}
                              placeholder="Ej: Voz, Guitarra, Bajo, Teclado"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-neutral-700 text-xs text-white focus:outline-none focus:border-sky-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                          {/* Option 1: Live Mic Recording while backing tracks play */}
                          <div className="p-3 rounded-xl border border-sky-500/30 bg-black/40 flex flex-col items-center justify-center gap-2">
                            {!isRecordingTrack ? (
                              <button
                                type="button"
                                onClick={() => startRecordingTrackOverdub(idea)}
                                className="px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
                              >
                                <Mic className="w-4 h-4 animate-pulse" /> Grabar encima (Mic)
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={stopRecordingTrackOverdub}
                                className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg"
                              >
                                <Square className="w-4 h-4 fill-current" />
                                <span>Detener ({formatTime(recordingTrackTime)})</span>
                              </button>
                            )}
                          </div>

                          {/* Option 2: Upload audio file */}
                          <label className={`p-3 rounded-xl border border-dashed border-neutral-700 hover:border-sky-400 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            <Upload className={`w-5 h-5 text-sky-400 ${isUploading ? 'animate-bounce' : ''}`} />
                            <span className="text-xs font-semibold text-white">
                              {isUploading ? "Subiendo pista..." : "Subir Archivo de Pista"}
                            </span>
                            <span className="text-[9px] text-neutral-400">MP3, WAV, M4A, WEBM, OGG</span>
                            <input
                              type="file"
                              accept="audio/*"
                              disabled={isUploading}
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  e.target.value = '';
                                  handleUploadTrackFile(idea, file);
                                }
                              }}
                            />
                          </label>

                          {/* Option 3: Load Original Song Track as Backing Track */}
                          {selectedSongBaseUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                saveNewTrackToIdea(
                                  idea,
                                  selectedSongBaseUrl,
                                  `🎵 Base: ${song.titulo} (Original)`,
                                  'Tema Base'
                                );
                                setAddingTrackIdeaId(null);
                              }}
                              className="p-3 rounded-xl border border-amber-500/40 bg-amber-950/30 hover:bg-amber-950/50 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all text-amber-200 shadow-md active:scale-95"
                              title={`Importar la pista base del tema "${song.titulo}" directamente a esta mezcla multipista`}
                            >
                              <Disc className="w-5 h-5 text-amber-400 animate-spin-slow" />
                              <span className="text-xs font-bold text-center">Base Tema Original</span>
                              <span className="text-[9px] text-amber-300/80 font-mono text-center">Usar "{song.titulo}"</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Upvote & Main Audio buttons */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => handleToggleVote(idea.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          hasVoted 
                            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' 
                            : 'bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-current' : ''}`} />
                        <span>Me gusta ({votes.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onUpdateSong({
                            ...song,
                            audioPrincipalUrl: idea.audioUrl
                          });
                          alert(`"${idea.titulo}" establecida como Maqueta Principal del tema.`);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          song.audioPrincipalUrl === idea.audioUrl
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-white/5 border border-white/10 text-neutral-400 hover:text-amber-300 hover:bg-white/10'
                        }`}
                        title="Establecer esta idea como la Maqueta Principal del tema"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>{song.audioPrincipalUrl === idea.audioUrl ? 'Maqueta Principal' : 'Hacer Maqueta Principal'}</span>
                      </button>
                    </div>

                    {/* Feedback & Comments Thread */}
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                        Comentarios & Críticas del Grupo ({(idea.comentarios || []).length})
                      </span>

                      {/* Comment items list */}
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {(idea.comentarios || []).map((comm) => (
                          <div key={comm.id} className="p-2 rounded-xl bg-black/30 border border-white/5 text-xs flex items-start justify-between gap-2 group">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-indigo-300 font-mono">{comm.autor}:</span>
                                {comm.instrumento && (
                                  <span
                                    className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold"
                                    title="Comentario referido a esta pista"
                                  >
                                    🎚️ {comm.instrumento}
                                  </span>
                                )}
                                {comm.timestampSegundos !== undefined && comm.timestampSegundos > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => jumpToTime(idea, comm.timestampSegundos!)}
                                    className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[10px] font-bold hover:bg-amber-500/30 cursor-pointer"
                                  >
                                    ⏱️ {formatTime(comm.timestampSegundos)}
                                  </button>
                                )}
                              </div>
                              <p className="text-neutral-200 mt-0.5">{comm.texto}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[9px] font-mono text-neutral-500">{comm.fecha}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(idea, comm.id)}
                                className="text-neutral-500 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                                title="Borrar comentario"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add comment input */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setCommentTimeTagMap(prev => ({ ...prev, [idea.id]: Math.floor(currentTime) }))}
                          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-amber-400 font-bold whitespace-nowrap cursor-pointer"
                          title="Añadir timestamp actual"
                        >
                          ⏱️ @ {formatTime(currentTime)}
                        </button>

                        {getIdeaTracks(idea).length > 1 && (
                          <select
                            value={commentTrackTagMap[idea.id] || ''}
                            onChange={(e) => setCommentTrackTagMap(prev => ({ ...prev, [idea.id]: e.target.value || null }))}
                            title="Referir este comentario a una pista concreta"
                            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-emerald-400 font-bold cursor-pointer outline-none"
                          >
                            <option value="">🎚️ General</option>
                            {getIdeaTracks(idea).map(tr => (
                              <option key={tr.id} value={tr.instrumento || tr.nombre}>{tr.nombre}</option>
                            ))}
                          </select>
                        )}

                        <input
                          type="text"
                          value={commentTextMap[idea.id] || ''}
                          onChange={(e) => setCommentTextMap(prev => ({ ...prev, [idea.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(idea)}
                          placeholder="Escribe tu crítica o sugerencia..."
                          className="flex-1 px-3 py-1.5 rounded-xl bg-black/40 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                        />

                        <button
                          type="button"
                          onClick={() => handleAddComment(idea)}
                          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    </>
                    )}
                  </motion.div>
                );
              })}
              </AnimatePresence>
            </div>
          )}

        </div>

        {/* Mini-transporte fijo: reproducir/pausar la idea activa sin tener que volver a subir
            hasta la cabecera cuando estás abajo del todo viendo las últimas pistas */}
        {(() => {
          const ideas = song.audioIdeas || [];
          const activeIdea =
            ideas.find(i => i.id === playingIdeaId) ||
            (expandedIdeaIds.size === 1 ? ideas.find(i => expandedIdeaIds.has(i.id)) : undefined);
          if (!activeIdea) return null;
          const isPlaying = playingIdeaId === activeIdea.id;
          const curTime = currentTimeMap[activeIdea.id] || 0;
          const dur = durationMap[activeIdea.id] || 0;
          return (
            <div className="border-t border-white/10 bg-zinc-950/95 backdrop-blur-sm px-3 sm:px-4 py-2 flex items-center gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.4)]">
              <button
                type="button"
                onClick={() => togglePlayIdea(activeIdea)}
                className={`p-2.5 rounded-full flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer shrink-0 ${
                  isPlaying ? 'bg-amber-500 text-zinc-950' : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
                }`}
                title="Play / Pausa"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{activeIdea.titulo}</p>
                <p className="text-[10px] font-mono text-neutral-400">
                  {formatTime(curTime)} <span className="text-neutral-600">/</span> {formatTime(dur)}
                </p>
              </div>
            </div>
          );
        })()}

      </div>

      <SongStudioAiGeneratorModal
        showGenModalForIdea={showGenModalForIdea}
        onClose={() => setShowGenModalForIdea(null)}
        genBpm={genBpm}
        setGenBpm={setGenBpm}
        genKey={genKey}
        setGenKey={setGenKey}
        includeDrums={includeDrums}
        setIncludeDrums={setIncludeDrums}
        includeBass={includeBass}
        setIncludeBass={setIncludeBass}
        drumStyle={drumStyle}
        setDrumStyle={setDrumStyle}
        genDuration={genDuration}
        setGenDuration={setGenDuration}
        isGeneratingAccompaniment={isGeneratingAccompaniment}
        handleGenerateAccompaniment={handleGenerateAccompaniment}
      />

      {/* CHORDS & SUBSTITUTE GUIDE VIEWER OVERLAY */}
      {showChordsModal && (
        <SongChordsViewerModal
          song={song}
          onClose={() => setShowChordsModal(false)}
          onUpdateSong={onUpdateSong}
        />
      )}

      {/* CUBASE KEYBOARD SHORTCUTS CHEAT SHEET MODAL */}
      {showCubaseHelp && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12111d] border border-purple-500/40 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 text-zinc-100 relative">
            <button
              type="button"
              onClick={() => setShowCubaseHelp(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-purple-500/20 pb-4">
              <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <Keyboard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Atajos de Teclado Tipo Cubase DAW
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-500/40">
                    Modo Studio
                  </span>
                </h3>
                <p className="text-xs text-neutral-400">
                  Controla la reproducción y grabación multipista directamente con tu teclado en tiempo real.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">Play / Pausa</span>
                <kbd className="px-2 py-1 rounded bg-black/80 border border-purple-500/40 text-purple-300 font-bold shadow">
                  Espacio
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">Pausar Mantenida</span>
                <kbd className="px-2 py-1 rounded bg-black/80 border border-amber-500/40 text-amber-300 font-bold shadow">
                  P
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">Detener e ir a Inicio (Stop)</span>
                <kbd className="px-2 py-1 rounded bg-black/80 border border-rose-500/40 text-rose-300 font-bold shadow">
                  0 / Stop / Home
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">Alternar Bucle (Loop ON/OFF)</span>
                <kbd className="px-2 py-1 rounded bg-black/80 border border-purple-500/40 text-purple-300 font-bold shadow">
                  L / /
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">Fijar Cue In (Inicio Bucle)</span>
                <kbd className="px-2 py-1 rounded bg-black/80 border border-indigo-500/40 text-indigo-300 font-bold shadow">
                  I
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">Fijar Cue Out (Fin Bucle)</span>
                <kbd className="px-2 py-1 rounded bg-black/80 border border-purple-500/40 text-purple-300 font-bold shadow">
                  O
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">Grabar Pista Overdub</span>
                <kbd className="px-2 py-1 rounded bg-black/80 border border-rose-500/40 text-rose-300 font-bold shadow">
                  R / Numpad *
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">Nueva Idea / Proyecto</span>
                <kbd className="px-2 py-1 rounded bg-black/80 border border-emerald-500/40 text-emerald-300 font-bold shadow">
                  N
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">Retroceder 5s / 15s</span>
                <kbd className="px-2 py-1 rounded bg-black/80 border border-purple-500/40 text-purple-300 font-bold shadow">
                  ←  /  Shift + ←
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">Avanzar 5s / 15s</span>
                <kbd className="px-2 py-1 rounded bg-black/80 border border-purple-500/40 text-purple-300 font-bold shadow">
                  →  /  Shift + →
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">Alternar Silencio (Mute)</span>
                <kbd className="px-2 py-1 rounded bg-black/80 border border-amber-500/40 text-amber-300 font-bold shadow">
                  M
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">Alternar Solo</span>
                <kbd className="px-2 py-1 rounded bg-black/80 border border-amber-500/40 text-amber-300 font-bold shadow">
                  S
                </kbd>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-white/10">
              <span className="text-[11px] text-neutral-500 font-mono">
                💡 Presiona <kbd className="px-1 py-0.5 rounded bg-black/50 border border-white/20 text-neutral-300">K</kbd> o <kbd className="px-1 py-0.5 rounded bg-black/50 border border-white/20 text-neutral-300">?</kbd> en cualquier momento para abrir este menú.
              </span>
              <button
                type="button"
                onClick={() => setShowCubaseHelp(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all cursor-pointer shadow-lg"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL DIALOG */}
      {confirmDeleteModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{confirmDeleteModal.title}</h3>
                <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed">{confirmDeleteModal.description}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setConfirmDeleteModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const action = confirmDeleteModal.onConfirm;
                  setConfirmDeleteModal(null);
                  action();
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all cursor-pointer shadow-lg shadow-rose-950/50"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      <ShareModal
        isOpen={shareModalData.isOpen}
        onClose={() => setShareModalData(prev => ({ ...prev, isOpen: false }))}
        title={shareModalData.title}
        subtitle={shareModalData.subtitle}
        initialText={shareModalData.text}
        itemType={shareModalData.itemType}
      />

      {/* AI MUSIC / SOUNDTRACK GENERATOR MODAL */}
      <SongStudioAiMusicModal
        isOpen={showAiMusicModal}
        onClose={() => setShowAiMusicModal(false)}
        song={song}
        onAddGeneratedAudio={(audioUrl, title) => {
          // Create new idea with generated soundtrack
          const newIdea: SongAudioIdea = {
            id: `idea-${Date.now()}`,
            titulo: title,
            seccion: 'general',
            audioUrl: audioUrl,
            fecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            subidoPor: currentUsername || 'AI Lyria Engine',
            instrumento: 'Soundtrack IA',
            comentarios: [],
            pistas: [
              {
                id: `track-${Date.now()}-1`,
                nombre: title,
                audioUrl: audioUrl,
                autor: 'Lyria AI',
                instrumento: 'Soundtrack / Jingle',
                fecha: new Date().toLocaleDateString('es-ES'),
                volumen: 1,
                muted: false
              }
            ]
          };
          const updatedIdeas = [newIdea, ...(song.audioIdeas || [])];
          onUpdateSong({ ...song, audioIdeas: updatedIdeas });
        }}
      />

      {/* AI COMPOSER / MUSICIAN ARRANGEMENT MODAL */}
      <SongStudioAiComposerModal
        isOpen={showAiComposerModal}
        onClose={() => setShowAiComposerModal(false)}
        song={song}
        currentUsername={currentUsername}
        onAddIdea={(newIdea) => {
          const updatedIdeas = [newIdea, ...(song.audioIdeas || [])];
          onUpdateSong({ ...song, audioIdeas: updatedIdeas });
        }}
      />

      {/* SALA DE ENSAYO INDIVIDUAL: mezcla 100% local, nunca escribe en `song` */}
      {practiceModeIdea && (
        <PracticeModePanel
          key={practiceModeIdea.id}
          song={song}
          idea={practiceModeIdea}
          tracks={getIdeaTracks(practiceModeIdea)}
          currentUser={currentUser}
          isStitchLight={isStitchLight}
          onClose={() => setPracticeModeIdea(null)}
          onApplyAsMainChords={(cifradoTexto, guiaSustituto) => {
            if (!window.confirm('Esto sustituye el cifrado de acordes principal de la canción (visible para toda la banda) por el detectado en esta pista aislada. ¿Continuar?')) return;
            onUpdateSong({ ...song, cifradoTexto, guiaSustituto });
          }}
        />
      )}

      {/* MODAL MOISES STEMS SEPARATION & MULTITRACK CONTROL */}
      {showMoisesStemsModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-amber-500/40 rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-5 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-sm">
                <Sliders className="w-5 h-5 text-amber-400" />
                <span>Iris Espectro — Separador de Pistas con IA</span>
              </div>
              <button
                type="button"
                onClick={() => setShowMoisesStemsModal(null)}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setMoisesTab('stems')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  moisesTab === 'stems'
                    ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-neutral-300'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>1. Pistas Separadas</span>
              </button>

              <button
                type="button"
                onClick={() => setMoisesTab('how_it_works')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  moisesTab === 'how_it_works'
                    ? 'bg-indigo-500 text-white font-black shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-neutral-300'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>2. ¿Cómo funciona Iris?</span>
              </button>

              <button
                type="button"
                onClick={() => setMoisesTab('upload')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  moisesTab === 'upload'
                    ? 'bg-emerald-500 text-zinc-950 font-black shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-neutral-300'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>3. Subir Pistas Aisladas</span>
              </button>
            </div>

            {/* TAB 1: CANALES DE PISTAS SEPARADAS & HABILITACIÓN */}
            {moisesTab === 'stems' && (
              <div className="space-y-4 text-xs text-neutral-300 leading-relaxed">
                <p className="text-neutral-300 font-sans">
                  BandManager crea canales de pistas independientes (Voz, Batería, Bajo, Guitarras) para controlar el volumen, silenciar (Mute) o dejar en Solo cada instrumento en tus ensayos y composición.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-[11px]">
                  <div className="p-3 rounded-xl bg-black/60 border border-indigo-500/30 text-indigo-200 space-y-1">
                    <span className="font-bold text-white block flex items-center gap-1.5">
                      🎤 1. Voz (Vocals)
                    </span>
                    <p className="text-[10px] text-neutral-400">
                      Filtro DSP de frecuencia centrada en 1200Hz. Silencia la voz para cantar la letra en directo o practicar afinación.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/60 border border-amber-500/30 text-amber-200 space-y-1">
                    <span className="font-bold text-white block flex items-center gap-1.5">
                      🥁 2. Batería (Drums)
                    </span>
                    <p className="text-[10px] text-neutral-400">
                      Aísla transitorios de platos (&gt;1800Hz) y golpes de bombo/caja. Ideal para tocar la batería encima sin estorbar.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/60 border border-emerald-500/30 text-emerald-200 space-y-1">
                    <span className="font-bold text-white block flex items-center gap-1.5">
                      🎸 3. Bajo (Bass)
                    </span>
                    <p className="text-[10px] text-neutral-400">
                      Filtro sub-bass paso bajo en 220Hz. Apaga la línea de bajo grabada para que el bajista de la banda toque su línea real.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/60 border border-purple-500/30 text-purple-200 space-y-1">
                    <span className="font-bold text-white block flex items-center gap-1.5">
                      🎹 4. Guitarras & Armonía
                    </span>
                    <p className="text-[10px] text-neutral-400">
                      Filtro de espectro medio (350Hz-3.5kHz). Controla el nivel armónico para acompañar con teclado o rítmicas.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 font-mono text-[11px] space-y-1">
                  <span className="font-bold text-amber-300 block flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Controles Activos en la Línea de Tiempo:
                  </span>
                  <p className="text-neutral-300">
                    Al separar las pistas, cada instrumento tendrá su propia pista con botones <strong>Mute (M)</strong>, <strong>Solo (S)</strong>, Fader de Volumen (0-100%), Ecualizador de 3 bandas (Graves, Medios, Agudos) y Paneo L/R estéreo.
                  </p>
                </div>

                {/* SELECTOR DE MOTOR IRIS: STUDIO / CLOUD / BÁSICO */}
                <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/10 space-y-3 font-mono text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-400" /> Selecciona el Motor de Iris Espectro:
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                      selectedStemEngine === 'mvsep-mdx23'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : selectedStemEngine === 'demucs'
                        ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                        : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                    }`}>
                      {selectedStemEngine === 'mvsep-mdx23' && "✨ Iris Studio"}
                      {selectedStemEngine === 'demucs' && '⚡ Iris Cloud'}
                      {selectedStemEngine === 'dsp-server' && '⚙️ Iris Básico (gratis)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Iris Studio */}
                    <button
                      type="button"
                      onClick={() => setSelectedStemEngine('mvsep-mdx23')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                        selectedStemEngine === 'mvsep-mdx23'
                          ? 'bg-amber-950/60 border-amber-500 text-amber-200 ring-1 ring-amber-500/50 shadow-lg shadow-amber-950/50'
                          : 'bg-black/40 border-white/10 text-neutral-400 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs flex items-center gap-1.5 text-white">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Iris Studio
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black border border-amber-500/30">
                          Máxima calidad
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-300 leading-normal">
                        Combina dos redes neuronales de alta precisión para aislar voz, bajo, batería y demás fuentes al máximo detalle.
                      </span>
                      <span className="text-[9px] text-amber-400/80 font-bold">
                        🐢 Más lento, ~{formatEurEstimate(IRIS_ENGINE_COST_EUR['mvsep-mdx23'])}€ estimado por canción.
                      </span>
                    </button>

                    {/* Iris Cloud */}
                    <button
                      type="button"
                      onClick={() => setSelectedStemEngine('demucs')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                        selectedStemEngine === 'demucs'
                          ? 'bg-purple-950/60 border-purple-500 text-purple-200 ring-1 ring-purple-500/50 shadow-lg shadow-purple-950/50'
                          : 'bg-black/40 border-white/10 text-neutral-400 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs flex items-center gap-1.5 text-white">
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Iris Cloud
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-black border border-purple-500/30">
                          Recomendado
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-300 leading-normal">
                        Red neuronal en la nube probada en estudio para aislamiento directo de Voz, Batería, Bajo y Guitarras.
                      </span>
                      <span className="text-[9px] text-emerald-400 font-bold">
                        ⚡ Rápido, ~{formatEurEstimate(IRIS_ENGINE_COST_EUR['demucs'])}€ estimado por canción.
                      </span>
                    </button>

                    {/* Iris Básico (local) */}
                    <button
                      type="button"
                      onClick={() => setSelectedStemEngine('dsp-server')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                        selectedStemEngine === 'dsp-server'
                          ? 'bg-blue-950/60 border-blue-500 text-blue-200 ring-1 ring-blue-500/50 shadow-lg shadow-blue-950/50'
                          : 'bg-black/40 border-white/10 text-neutral-400 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs flex items-center gap-1.5 text-white">
                          <Cpu className="w-3.5 h-3.5 text-blue-400" /> Iris Básico
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-black border border-blue-500/30">
                          100% Gratis
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-300 leading-normal">
                        Filtros de frecuencia y Mid/Side procesados en nuestro propio servidor. Rápido y sin coste.
                      </span>
                    </button>
                  </div>

                  {/* Banner de Garantía Anti-Duplicación */}
                  <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 text-[10px] flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">🛡️ Cero Coste Duplicado:</span>
                    <span className="text-neutral-300">
                      Las pistas procesadas se guardan en la nube por hash de canción. Nunca pagarás 2 veces por la misma canción.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const targetIdea = showMoisesStemsModal;
                    setShowMoisesStemsModal(null);
                    if (targetIdea) {
                      handlePerformAiStemSeparation(targetIdea, selectedStemEngine);
                    }
                  }}
                  className={`w-full py-3 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg text-center flex items-center justify-center gap-2 ${
                    selectedStemEngine === 'mvsep-mdx23'
                      ? 'bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-amber-900/30'
                      : selectedStemEngine === 'demucs'
                      ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white shadow-purple-900/30'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-blue-900/30'
                  }`}
                >
                  {selectedStemEngine === 'mvsep-mdx23' && (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                      <span>✨ Separar con Iris Studio</span>
                    </>
                  )}
                  {selectedStemEngine === 'demucs' && (
                    <>
                      <Sparkles className="w-4 h-4 text-purple-300 animate-pulse" />
                      <span>⚡ Separar con Iris Cloud</span>
                    </>
                  )}
                  {selectedStemEngine === 'dsp-server' && (
                    <>
                      <Cpu className="w-4 h-4 text-cyan-200" />
                      <span>⚙️ Separar con Iris Básico (gratis)</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* TAB 2: ¿CÓMO FUNCIONA IRIS? */}
            {moisesTab === 'how_it_works' && (
              <div className="space-y-4 text-xs text-neutral-300 leading-relaxed font-sans">
                <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 space-y-2">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2 font-mono">
                    <Cpu className="w-4 h-4 text-indigo-400" />
                    ¿Cómo consigue Iris Espectro separar audio de forma tan precisa?
                  </h4>
                  <p className="text-neutral-300 leading-normal">
                    Iris Espectro se apoya en redes neuronales de <strong>Deep Learning (Aprendizaje Profundo)</strong> entrenadas específicamente para <em>Music Source Separation</em> (Separación de fuentes sonoras musicales).
                  </p>
                </div>

                <div className="space-y-2.5 font-mono text-[11px]">
                  <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                    <span className="font-bold text-amber-300 block">1. Transformada de Fourier (STFT) & Espectrogramas 2D:</span>
                    <p className="text-neutral-400 font-sans">
                      El audio estéreo se convierte en un espectrograma 2D donde el eje Y representa la frecuencia (Hz) y el eje X representa el tiempo (ms).
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                    <span className="font-bold text-indigo-300 block">2. Arquitectura de Dominio Dual (Tiempo + Frecuencia):</span>
                    <p className="text-neutral-400 font-sans">
                      A diferencia de filtros clásicos, la red procesa tanto la forma de onda pura en el tiempo (para transitorios de batería) como el espectrograma de frecuencias con capas neuronales especializadas.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                    <span className="font-bold text-purple-300 block">3. Máscaras de Fase Compleja & Estimación Tímbrica:</span>
                    <p className="text-neutral-400 font-sans">
                      El modelo predice una "máscara" espectral que multiplica el audio original para aislar la firma tímbrica de la voz o del bajo, preservando la fase original para evitar artefactos chirriantes o cancelación de fase.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                    <span className="font-bold text-emerald-300 block">4. Entrenamiento Masivo en Clusters de GPUs:</span>
                    <p className="text-neutral-400 font-sans">
                      Estos modelos se entrenan con miles de temas grabados en pistas separadas en estudio. Al procesar, ejecutan inferencia acelerada en servidores de GPU dedicadas.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-300 text-[11px] font-mono">
                  💡 <strong>Integración en BandManager:</strong> Nuestra app combina filtros DSP en tiempo real mediante Web Audio API con ruteo de nodos `BiquadFilterNode` para silenciar la voz o batería en vivo, y te permite subir pistas ya separadas en otro programa para máxima calidad.
                </div>
              </div>
            )}

            {/* TAB 3: SUBIR PISTAS YA SEPARADAS EN OTRO PROGRAMA */}
            {moisesTab === 'upload' && (
              <div className="space-y-4 text-xs text-neutral-300 leading-relaxed font-sans">
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 space-y-1">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2 font-mono">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    Cargar Pistas Separadas
                  </h4>
                  <p className="text-neutral-300 text-[11px]">
                    Si ya has procesado un tema en otro programa de separación de pistas y tienes los archivos MP3/WAV independientes, súbelos aquí para añadirlos directamente a la mezcla multipista de esta sección.
                  </p>
                </div>

                <div className="space-y-3 font-mono text-[11px]">
                  <div>
                    <label className="block text-neutral-300 mb-1 font-bold">Selecciona el Instrumento de la Pista:</label>
                    <select
                      value={uploadingStemInstrument}
                      onChange={(e) => setUploadingStemInstrument(e.target.value)}
                      className="w-full bg-black/60 border border-neutral-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Voz">🎤 Pista: Voz Aislada</option>
                      <option value="Batería">🥁 Pista: Batería Aislada</option>
                      <option value="Bajo">🎸 Pista: Bajo Aislado</option>
                      <option value="Guitarras">🎹 Pista: Guitarras / Teclados</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-300 mb-1 font-bold">Seleccionar Archivo de Audio (WAV / MP3 / M4A):</label>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !showMoisesStemsModal) return;

                        try {
                          const uploadedUrl = await uploadFileToServer(file);
                          const targetIdea = showMoisesStemsModal;
                          const existing = getIdeaTracks(targetIdea);

                          const newTrack: AudioTrack = {
                            id: `stem-file-${uploadingStemInstrument.toLowerCase()}-${Date.now()}`,
                            nombre: `Pista (${uploadingStemInstrument}): ${file.name.replace(/\.[^/.]+$/, '')}`,
                            audioUrl: uploadedUrl,
                            autor: 'Importado (pista externa)',
                            instrumento: uploadingStemInstrument,
                            fecha: new Date().toISOString().split('T')[0],
                            volumen: 1,
                            muted: false
                          };

                          const updatedIdeas = (song.audioIdeas || []).map(i => 
                            i.id === targetIdea.id ? { ...i, pistas: [...existing, newTrack] } : i
                          );

                          onUpdateSong({ ...song, audioIdeas: updatedIdeas });
                          setShowMoisesStemsModal(null);
                          alert(`¡Pista de Stem "${file.name}" cargada con éxito en la mezcla!`);
                        } catch (err) {
                          console.error("Error al subir archivo Stem:", err);
                          alert("Ocurrió un error al cargar el archivo de audio Stem.");
                        }
                      }}
                      className="w-full bg-black/60 border border-neutral-700 rounded-xl p-2.5 text-neutral-300 text-xs cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-500 file:text-zinc-950 hover:file:bg-emerald-400"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-400 text-[10px] font-mono">
                  📌 Los archivos subidos se sincronizan con Supabase Storage y estarán disponibles inmediatamente para el resto de miembros de la banda.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Instrument Track Generator Modal */}
      {showAiTrackGenModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-gradient-to-b from-zinc-900 via-indigo-950/80 to-zinc-950 border border-purple-500/40 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative overflow-hidden my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div className="flex items-center gap-2.5 text-purple-300 font-mono font-bold text-sm">
                <Wand2 className="w-5 h-5 text-purple-400 animate-pulse" />
                <span>Generar Pista con IA (Gemini & Lyria)</span>
              </div>
              <button
                type="button"
                onClick={() => { setShowAiTrackGenModal(null); setAiTrackGenPreview(null); setAiTrackGenError(null); }}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <p className="text-neutral-300 leading-relaxed">
                Genera una pista de acompañamiento con IA para <strong>"{showAiTrackGenModal.titulo}"</strong> — <strong className="text-purple-300">escuchando el audio real de la idea</strong> (melodía, acordes y ritmo), no solo adivinando desde una descripción, para que encaje de verdad. Perfecta para practicar cuando falta un instrumento en la demo, no para sustituir a nadie de la banda.
              </p>

              <div>
                <label className="block text-purple-300 font-mono font-bold mb-1.5">
                  Instrumento a generar:
                </label>
                <select
                  value={aiTrackGenInstrument}
                  onChange={(e) => setAiTrackGenInstrument(e.target.value)}
                  className="w-full bg-black/60 border border-purple-500/40 rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none focus:border-purple-400"
                >
                  <option value="Guitarra Solista">🎸 Guitarra Solista (Solo / Lead Riff)</option>
                  <option value="Sintetizador Lead">🎹 Sintetizador Lead / Teclado Moderno</option>
                  <option value="Bajo Bailable">🎸 Bajo Bailable & Groovy</option>
                  <option value="Vientos (Trompeta / Saxo)">🎺 Vientos (Sección de Trompeta / Saxo Ska)</option>
                  <option value="Batería & Percusión">🥁 Percusión Adicional & Batería Rítmica</option>
                  <option value="Violín / Cuerdas">🎻 Violín Solista / Arreglo de Cuerdas</option>
                  <option value="Acordeón">🪗 Acordeón Balkan / Folclórico</option>
                </select>
              </div>

              <div>
                <label className="block text-purple-300 font-mono font-bold mb-1.5 flex items-center justify-between">
                  <span>¿En qué momento de la canción debe empezar a sonar?</span>
                  <span className="text-white bg-black/60 px-2 py-0.5 rounded-lg text-[11px]">Se colocará en {formatTime(aiTrackGenStartOffsetSec)}</span>
                </label>

                {/* Mini transporte: reproduce la idea real para elegir el punto de oído, no a ciegas con un slider */}
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => showAiTrackGenModal && togglePlayIdea(showAiTrackGenModal)}
                    className="w-8 h-8 rounded-full bg-purple-500 hover:bg-purple-400 text-white flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    {showAiTrackGenModal && playingIdeaId === showAiTrackGenModal.id
                      ? <Pause className="w-4 h-4 fill-current" />
                      : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(1, song.duracionSegundos || 180)}
                    step={0.1}
                    value={showAiTrackGenModal ? (currentTimeMap[showAiTrackGenModal.id] || 0) : 0}
                    onChange={(e) => showAiTrackGenModal && handleSeekIdea(showAiTrackGenModal, Number(e.target.value))}
                    className="flex-1 accent-purple-500"
                  />
                  <span className="text-[10px] font-mono text-neutral-400 w-10 text-right shrink-0">
                    {formatTime(showAiTrackGenModal ? (currentTimeMap[showAiTrackGenModal.id] || 0) : 0)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!showAiTrackGenModal) return;
                    handlePauseIdea(showAiTrackGenModal);
                    setAiTrackGenStartOffsetSec(Math.floor(currentTimeMap[showAiTrackGenModal.id] || 0));
                  }}
                  className="w-full py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  📍 Marcar este punto ({formatTime(showAiTrackGenModal ? (currentTimeMap[showAiTrackGenModal.id] || 0) : 0)})
                </button>

                <p className="text-[10px] text-neutral-400 font-sans mt-1">
                  Dale al play, escucha la canción y pulsa "Marcar este punto" justo donde quieras que entre — Lyria genera clips fieles al contexto de ~30s, así que elige la sección donde mejor encaje (ej. el puente) en vez de forzar una canción entera.
                </p>
              </div>

              {/* Pestañas Presets / Personalizado */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-purple-500/20 w-fit">
                <button
                  type="button"
                  onClick={() => setAiTrackGenMode('presets')}
                  className={`px-3 py-1.5 rounded-lg font-mono text-[11px] font-bold transition-all ${
                    aiTrackGenMode === 'presets' ? 'bg-purple-500/30 text-purple-200' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Presets
                </button>
                <button
                  type="button"
                  onClick={() => setAiTrackGenMode('custom')}
                  className={`px-3 py-1.5 rounded-lg font-mono text-[11px] font-bold transition-all ${
                    aiTrackGenMode === 'custom' ? 'bg-purple-500/30 text-purple-200' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Personalizado
                </button>
              </div>

              {aiTrackGenMode === 'presets' ? (
                <div className="grid grid-cols-2 gap-2">
                  {AI_TRACK_STYLE_PRESETS.map(preset => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => setAiTrackGenStyle(preset.style)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-0.5 ${
                        aiTrackGenStyle === preset.style
                          ? 'bg-purple-950/60 border-purple-500 ring-1 ring-purple-500/50'
                          : 'bg-black/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="font-bold text-[11px] text-white flex items-center gap-1.5">
                        <span>{preset.icon}</span> {preset.label}
                      </span>
                      <span className="text-[10px] text-neutral-400 leading-snug">{preset.description}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <label className="block text-purple-300 font-mono font-bold mb-1.5">
                    Instrucción / Estilo deseado para el Arreglo:
                  </label>
                  <textarea
                    value={aiTrackGenPrompt}
                    onChange={(e) => setAiTrackGenPrompt(e.target.value)}
                    placeholder="Ej: Solo virtuosista y energético con aire rock balkan para dar la máxima potencia al estribillo..."
                    className="w-full h-20 bg-black/60 border border-purple-500/40 rounded-xl p-2.5 text-white placeholder-neutral-500 font-sans text-xs focus:outline-none focus:border-purple-400 resize-none"
                  />
                </div>
              )}

              {aiTrackGenError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-[11px] font-mono">
                  ⚠️ {aiTrackGenError}
                </div>
              )}

              {aiTrackGenPreview && (
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-mono font-bold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {aiTrackGenPreview.trackName}
                  </div>
                  <audio controls src={aiTrackGenPreview.audioUrl} className="w-full h-9" onError={(e) => e.preventDefault()} />
                  <p className="text-[10px] text-neutral-300 font-sans italic leading-relaxed">{aiTrackGenPreview.arrangementNotes}</p>
                  <p className="text-[10px] text-emerald-400/80 font-mono">Escúchala antes de decidir — si no te convence, regenera o prueba otro preset, no se ha tocado aún tu mezcla.</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowAiTrackGenModal(null); setAiTrackGenPreview(null); setAiTrackGenError(null); }}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 font-mono text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              {aiTrackGenPreview && (
                <button
                  type="button"
                  onClick={() => showAiTrackGenModal && handleConfirmAddAiTrack(showAiTrackGenModal)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95"
                >
                  <Check className="w-4 h-4" /> Añadir a la mezcla
                </button>
              )}
              <button
                type="button"
                disabled={isGeneratingAiTrack}
                onClick={() => showAiTrackGenModal && handleGenerateAiInstrumentTrack(showAiTrackGenModal)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                {isGeneratingAiTrack ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generando...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>{aiTrackGenPreview ? 'Regenerar' : 'Generar Pista con IA'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PROGRESO DE SEPARACIÓN DE STEMS IA */}
      {stemProgressModal && stemProgressModal.isOpen && !stemProgressModal.minimized && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[1200] flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-amber-500/40 rounded-2xl max-w-md md:max-w-2xl w-full p-6 text-white shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">

            {/* Guiño de marca: rayo blanco entrando en el prisma de Iris, saliendo en arcoíris.
                -mx-6 cancela el padding del modal para que ocupe todo el ancho, de borde a borde. */}
            {stemProgressModal.stage !== 'completed' && stemProgressModal.stage !== 'error' && (
              <div className="-mx-6">
                <IrisPrismBanner />
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center relative border ${
                  stemProgressModal.stage === 'completed'
                    ? 'bg-emerald-500/20 border-emerald-500/50'
                    : stemProgressModal.stage === 'error'
                    ? stemProgressModal.errorType === 'billing_required'
                      ? 'bg-amber-500/20 border-amber-500/50'
                      : stemProgressModal.errorType === 'rate_limit'
                      ? 'bg-sky-500/20 border-sky-500/50'
                      : stemProgressModal.errorType === 'timeout'
                      ? 'bg-purple-500/20 border-purple-500/50'
                      : stemProgressModal.errorType === 'audio_unsupported'
                      ? 'bg-orange-500/20 border-orange-500/50'
                      : stemProgressModal.errorType === 'gpu_failure'
                      ? 'bg-fuchsia-500/20 border-fuchsia-500/50'
                      : 'bg-rose-500/20 border-rose-500/50'
                    : 'bg-amber-500/20 border-amber-500/50'
                }`}>
                  {stemProgressModal.stage === 'completed' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : stemProgressModal.stage === 'error' ? (
                    stemProgressModal.errorType === 'billing_required' ? (
                      <CreditCard className="w-5 h-5 text-amber-400" />
                    ) : stemProgressModal.errorType === 'auth_invalid' || stemProgressModal.errorType === 'token_missing' ? (
                      <Key className="w-5 h-5 text-rose-400" />
                    ) : stemProgressModal.errorType === 'audio_unsupported' ? (
                      <FileAudio className="w-5 h-5 text-orange-400" />
                    ) : stemProgressModal.errorType === 'rate_limit' ? (
                      <Clock className="w-5 h-5 text-sky-400" />
                    ) : stemProgressModal.errorType === 'timeout' ? (
                      <Timer className="w-5 h-5 text-purple-400" />
                    ) : stemProgressModal.errorType === 'gpu_failure' ? (
                      <Cpu className="w-5 h-5 text-fuchsia-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-400" />
                    )
                  ) : (
                    <Cpu className="w-6 h-6 text-amber-400 animate-pulse" />
                  )}
                </div>
                <div>
                  <h3 className="font-mono font-bold text-sm text-white flex items-center gap-2">
                    {stemProgressModal.stage === 'completed'
                      ? '¡Separación de Pistas Completada!'
                      : stemProgressModal.stage === 'error'
                      ? stemProgressModal.errorTitle || 'Error en la Separación'
                      : 'Iris está separando tus pistas'}
                  </h3>
                  <p className="text-[11px] text-neutral-400 font-sans">
                    {stemProgressModal.ideaTitle} • <span className="text-amber-300">{stemProgressModal.songTitle}</span>
                  </p>
                </div>
              </div>

              {stemProgressModal.stage === 'error' ? (
                <span className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold border flex items-center gap-1.5 ${
                  stemProgressModal.errorType === 'billing_required'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : stemProgressModal.errorType === 'auth_invalid' || stemProgressModal.errorType === 'token_missing'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : stemProgressModal.errorType === 'audio_unsupported'
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                    : stemProgressModal.errorType === 'rate_limit'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    : stemProgressModal.errorType === 'timeout'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : stemProgressModal.errorType === 'gpu_failure'
                    ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                  {stemProgressModal.errorType === 'billing_required'
                    ? '💳 HTTP 402 Saldo'
                    : stemProgressModal.errorType === 'auth_invalid'
                    ? '🔑 HTTP 401 Auth'
                    : stemProgressModal.errorType === 'token_missing'
                    ? '⚙️ Sin Token'
                    : stemProgressModal.errorType === 'audio_unsupported'
                    ? '🎵 HTTP 422 Audio'
                    : stemProgressModal.errorType === 'rate_limit'
                    ? '⏳ HTTP 429 Límite'
                    : stemProgressModal.errorType === 'timeout'
                    ? '⏱️ Timeout >120s'
                    : stemProgressModal.errorType === 'gpu_failure'
                    ? '⚡ Worker GPU'
                    : stemProgressModal.errorType === 'server_error'
                    ? '☁️ Error del Servicio'
                    : '⚠️ Error'}
                </span>
              ) : stemProgressModal.stage !== 'completed' && (
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold border flex items-center gap-1.5 animate-pulse ${
                    stemProgressModal.engineChoice === 'mvsep-mdx23'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : stemProgressModal.engineChoice === 'demucs'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                    {stemProgressModal.engineChoice === 'mvsep-mdx23'
                      ? '✨ Iris Studio'
                      : stemProgressModal.engineChoice === 'demucs'
                      ? '⚡ Iris Cloud'
                      : '⚙️ Iris Básico'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStemProgressModal(prev => prev ? { ...prev, minimized: true } : null)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0"
                    title="Minimizar y seguir trabajando mientras Iris separa las pistas"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Content for Processing States */}
            {stemProgressModal.stage !== 'completed' && stemProgressModal.stage !== 'error' && (
              <div className="space-y-4">
                
                {/* Live Elapsed Time Monitor */}
                <div className="p-3 rounded-xl bg-zinc-900/90 border border-amber-500/30 flex items-center justify-between font-mono text-[11px]">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                    <span>⏱️ Monitor de Tiempo:</span>
                  </div>
                  <span className="text-white font-black bg-black/60 px-2.5 py-1 rounded border border-white/10 text-xs">
                    {separationElapsedSeconds}s transcurridos
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-300 text-[11px]">Progreso del Proceso</span>
                    <span className="font-bold text-amber-400">{Math.round(stemProgressModal.progressPct)}%</span>
                  </div>
                  <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-white/10 p-0.5">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(5, stemProgressModal.progressPct)}%` }}
                    />
                  </div>
                </div>

                {/* Animated Equalizer Visualizer */}
                <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 h-8">
                    <div className="w-1.5 rounded-full animate-[bounce_1s_infinite_100ms]" style={{ height: '60%', backgroundColor: IRIS_PRISM_RAY_COLORS[0] }} />
                    <div className="w-1.5 rounded-full animate-[bounce_1s_infinite_300ms]" style={{ height: '90%', backgroundColor: IRIS_PRISM_RAY_COLORS[1] }} />
                    <div className="w-1.5 rounded-full animate-[bounce_1s_infinite_200ms]" style={{ height: '40%', backgroundColor: IRIS_PRISM_RAY_COLORS[2] }} />
                    <div className="w-1.5 rounded-full animate-[bounce_1s_infinite_400ms]" style={{ height: '100%', backgroundColor: IRIS_PRISM_RAY_COLORS[4] }} />
                    <div className="w-1.5 rounded-full animate-[bounce_1s_infinite_150ms]" style={{ height: '75%', backgroundColor: IRIS_PRISM_RAY_COLORS[5] }} />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-bold text-amber-200 animate-pulse">
                      {stemProgressModal.currentStepText}
                    </p>
                    <p className="text-[10px] text-neutral-400 font-sans mt-0.5">
                      Modelos de Inteligencia Artificial separando frecuencias...
                    </p>
                  </div>
                </div>

                {/* Step Checklist */}
                <div className="space-y-2 font-mono text-[11px] pt-1">
                  <div className={`p-2.5 rounded-lg border flex items-center gap-2.5 transition-all ${
                    stemProgressModal.stage === 'preparing' 
                      ? 'bg-amber-950/40 border-amber-500/50 text-amber-200' 
                      : 'bg-zinc-900/60 border-white/5 text-neutral-400'
                  }`}>
                    {stemProgressModal.stage === 'preparing' ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    <span>1. Verificación e ingesta de flujo de audio</span>
                  </div>

                  <div className={`p-2.5 rounded-lg border flex items-center gap-2.5 transition-all ${
                    stemProgressModal.stage === 'demucs' 
                      ? 'bg-purple-950/40 border-purple-500/50 text-purple-200' 
                      : stemProgressModal.stage === 'persisting'
                      ? 'bg-zinc-900/60 border-white/5 text-neutral-400'
                      : 'bg-zinc-900/30 border-white/5 text-neutral-600'
                  }`}>
                    {stemProgressModal.stage === 'demucs' ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400 shrink-0" />
                    ) : stemProgressModal.stage === 'persisting' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-neutral-600 shrink-0" />
                    )}
                    <span>
                      {stemProgressModal.engineChoice !== 'dsp-server' || stemProgressModal.isNeural
                        ? '2. Inferencia Neuronal en la Nube'
                        : '2. Procesamiento de Señal en el Servidor Local'}
                    </span>
                  </div>

                  <div className={`p-2.5 rounded-lg border flex items-center gap-2.5 transition-all ${
                    stemProgressModal.stage === 'persisting' 
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200' 
                      : 'bg-zinc-900/30 border-white/5 text-neutral-600'
                  }`}>
                    {stemProgressModal.stage === 'persisting' ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-neutral-600 shrink-0" />
                    )}
                    <span>3. Codificación MP3 HQ & Carga al Mezclador Multipista</span>
                  </div>
                </div>

              </div>
            )}

            {/* Completed State */}
            {stemProgressModal.stage === 'completed' && (
              <div className="space-y-4">
                {stemProgressModal.degraded ? (
                  <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-xs">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      <span>⚠️ Modo Degradado Activo (Filtros DSP Básicos)</span>
                    </div>
                    <p className="text-[11px] text-neutral-200 font-sans leading-relaxed">
                      {stemProgressModal.degradedReason || 'El motor neuronal no estaba disponible en este momento. Las pistas se han generado con Iris Básico (filtrado por frecuencias de señal).'}
                    </p>
                    <div className="pt-1 text-[10px] font-mono text-amber-300">
                      💡 Para separación de calidad de estudio, comprueba la configuración del proveedor de IA en Ajustes.
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>¡Pistas Separadas con Éxito!</span>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                        stemProgressModal.isNeural
                          ? 'bg-purple-950/80 text-purple-300 border-purple-500/40'
                          : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                      }`}>
                        {stemProgressModal.isNeural ? '🧠 Red Neuronal en la Nube' : '⚙️ Motor Local'}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-300 font-sans leading-relaxed">
                      Procesado con <strong className="text-white bg-black/40 px-1.5 py-0.5 rounded border border-white/10">{stemProgressModal.separationEngine || 'Iris'}</strong>. Cada instrumento cuenta con controles independientes de <strong>Mute (M)</strong>, <strong>Solo (S)</strong>, fader de volumen y ecualizador en el mezclador.
                    </p>
                    {stemProgressModal.engineChoice && (
                      <p className="text-[10px] text-emerald-400/70 font-mono">
                        💶 Coste estimado: {IRIS_ENGINE_COST_EUR[stemProgressModal.engineChoice] > 0 ? `~${formatEurEstimate(IRIS_ENGINE_COST_EUR[stemProgressModal.engineChoice])}€` : 'gratis'}
                      </p>
                    )}
                  </div>
                )}

                {/* TELEMETRY TIMING CARD */}
                <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/10 font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-300 font-bold flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-400" /> Telemetría de Rendimiento:
                    </span>
                    <span className="text-emerald-400 font-black text-xs bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-500/30">
                      ⏱️ {stemProgressModal.executionTimeSec || `${separationElapsedSeconds}s`} Total
                    </span>
                  </div>

                  {stemProgressModal.timingBreakdown ? (
                    <div className="grid grid-cols-3 gap-2 text-[10px] pt-1">
                      <div className="p-2 rounded bg-black/40 border border-white/5 text-center">
                        <span className="text-neutral-400 block">📥 Prelectura</span>
                        <span className="font-bold text-white">{stemProgressModal.timingBreakdown.preloadSec || '0.1s'}</span>
                      </div>
                      <div className="p-2 rounded bg-purple-950/40 border border-purple-500/30 text-center">
                        <span className="text-purple-300 block">⚡ GPU Inferencia</span>
                        <span className="font-bold text-purple-200">{stemProgressModal.timingBreakdown.gpuInferenceSec || 'GPU Cloud'}</span>
                      </div>
                      <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-center">
                        <span className="text-emerald-300 block">☁️ Supabase</span>
                        <span className="font-bold text-emerald-200">{stemProgressModal.timingBreakdown.stemsPersistenceSec || 'Stems OK'}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-neutral-400 font-sans">
                      Tiempo de procesamiento total registrado: {stemProgressModal.executionTimeSec || `${separationElapsedSeconds}s`}.
                    </p>
                  )}
                </div>

                {/* Stems generated display */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded-lg bg-zinc-900 border border-white/10 flex items-center gap-1.5">
                    <span>🎤</span> <span className="truncate">Voz Principal</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-900 border border-white/10 flex items-center gap-1.5">
                    <span>🥁</span> <span className="truncate">Batería</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-900 border border-white/10 flex items-center gap-1.5">
                    <span>🎸</span> <span className="truncate">Bajo</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-900 border border-white/10 flex items-center gap-1.5">
                    <span>🎹</span> <span className="truncate">Guitarras/Tecl.</span>
                  </div>
                </div>

                {/* A/B Quality Comparison / Re-processing Engine Selector */}
                {stemProgressModal.targetIdea && (
                  <div className="p-3.5 rounded-xl bg-black/60 border border-indigo-500/30 space-y-2.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Banco de Pruebas A/B: Comparar Calidad
                      </span>
                      <span className="text-[10px] text-indigo-300">
                        Re-separar con otro motor
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-400 font-sans leading-normal">
                      ¿Quieres comparar la pureza del aislamiento vocal y sangrado armónico? Selecciona un motor alternativo para re-procesar:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      {/* Iris Studio */}
                      <button
                        type="button"
                        onClick={() => {
                          const idea = stemProgressModal.targetIdea;
                          if (idea) handlePerformAiStemSeparation(idea, 'mvsep-mdx23');
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                          stemProgressModal.engineChoice === 'mvsep-mdx23'
                            ? 'bg-amber-500/20 border-amber-500/60 text-amber-200 ring-1 ring-amber-400/40'
                            : 'bg-zinc-900/90 border-white/10 text-neutral-300 hover:border-amber-400/50 hover:bg-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white">✨ Iris Studio</span>
                          {stemProgressModal.engineChoice === 'mvsep-mdx23' && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400 text-zinc-950 font-black">ACTIVO</span>
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-400">Máxima calidad (ensamble)</span>
                      </button>

                      {/* Iris Cloud */}
                      <button
                        type="button"
                        onClick={() => {
                          const idea = stemProgressModal.targetIdea;
                          if (idea) handlePerformAiStemSeparation(idea, 'demucs');
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                          stemProgressModal.engineChoice === 'demucs'
                            ? 'bg-purple-500/20 border-purple-500/60 text-purple-200 ring-1 ring-purple-400/40'
                            : 'bg-zinc-900/90 border-white/10 text-neutral-300 hover:border-purple-400/50 hover:bg-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white">⚡ Iris Cloud</span>
                          {stemProgressModal.engineChoice === 'demucs' && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-purple-400 text-zinc-950 font-black">ACTIVO</span>
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-400">Recomendado (6 canales)</span>
                      </button>

                      {/* Iris Básico */}
                      <button
                        type="button"
                        onClick={() => {
                          const idea = stemProgressModal.targetIdea;
                          if (idea) handlePerformAiStemSeparation(idea, 'dsp-server');
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                          stemProgressModal.engineChoice === 'dsp-server'
                            ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 ring-1 ring-emerald-400/40'
                            : 'bg-zinc-900/90 border-white/10 text-neutral-300 hover:border-emerald-400/50 hover:bg-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white">⚙️ Iris Básico</span>
                          {stemProgressModal.engineChoice === 'dsp-server' && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-400 text-zinc-950 font-black">ACTIVO</span>
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-400">Servidor local (gratis)</span>
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setStemProgressModal(null)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 font-mono text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Abrir Mezclador Multipista</span>
                </button>
              </div>
            )}

            {/* Error State */}
            {stemProgressModal.stage === 'error' && (
              <div className="space-y-3.5">
                {/* Provider Origin Badge */}
                <div className="flex items-center justify-between">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border ${
                    stemProgressModal.errorProvider === 'replicate'
                      ? 'bg-purple-950/70 border-purple-500/50 text-purple-200'
                      : stemProgressModal.errorProvider === 'gemini'
                      ? 'bg-sky-950/70 border-sky-500/50 text-sky-200'
                      : stemProgressModal.errorProvider === 'ffmpeg'
                      ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                      : stemProgressModal.errorProvider === 'supabase'
                      ? 'bg-amber-950/70 border-amber-500/50 text-amber-200'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-300'
                  }`}>
                    {stemProgressModal.errorProvider === 'replicate' && <Cpu className="w-3.5 h-3.5 text-purple-400" />}
                    {stemProgressModal.errorProvider === 'gemini' && <Bot className="w-3.5 h-3.5 text-sky-400" />}
                    {stemProgressModal.errorProvider === 'ffmpeg' && <Sliders className="w-3.5 h-3.5 text-emerald-400" />}
                    {stemProgressModal.errorProvider === 'supabase' && <Database className="w-3.5 h-3.5 text-amber-400" />}
                    {(!stemProgressModal.errorProvider || stemProgressModal.errorProvider === 'system' || stemProgressModal.errorProvider === 'network') && (
                      <AlertCircle className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                    <span>
                      {stemProgressModal.errorProvider === 'replicate' && 'Origen: Proveedor de IA en la Nube'}
                      {stemProgressModal.errorProvider === 'gemini' && 'Origen: Google Gemini API (GenAI)'}
                      {stemProgressModal.errorProvider === 'ffmpeg' && 'Origen: Librería Local FFmpeg (Motor DSP)'}
                      {stemProgressModal.errorProvider === 'supabase' && 'Origen: Supabase Storage (Almacenamiento)'}
                      {(!stemProgressModal.errorProvider || stemProgressModal.errorProvider === 'system' || stemProgressModal.errorProvider === 'network') && 'Origen: Sistema Local'}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                    {stemProgressModal.errorType || 'ERROR'}
                  </span>
                </div>

                {/* Error Banner */}
                <div className={`p-4 rounded-xl border space-y-2 transition-all ${
                  stemProgressModal.errorType === 'billing_required'
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                    : stemProgressModal.errorType === 'rate_limit' || stemProgressModal.errorType === 'gemini_quota_exceeded'
                    ? 'bg-sky-950/40 border-sky-500/50 text-sky-200'
                    : stemProgressModal.errorType === 'timeout'
                    ? 'bg-purple-950/40 border-purple-500/50 text-purple-200'
                    : stemProgressModal.errorType === 'audio_unsupported' || stemProgressModal.errorType === 'ffmpeg_codec_unsupported'
                    ? 'bg-orange-950/40 border-orange-500/50 text-orange-200'
                    : stemProgressModal.errorType === 'gpu_failure'
                    ? 'bg-fuchsia-950/40 border-fuchsia-500/50 text-fuchsia-200'
                    : stemProgressModal.errorType === 'server_error'
                    ? 'bg-slate-900/90 border-slate-600/50 text-slate-200'
                    : stemProgressModal.errorProvider === 'gemini'
                    ? 'bg-blue-950/50 border-blue-500/40 text-blue-200'
                    : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                }`}>
                  <div className="flex items-center gap-2 font-mono font-bold text-xs">
                    {stemProgressModal.errorType === 'billing_required' ? (
                      <CreditCard className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : stemProgressModal.errorType === 'auth_invalid' || stemProgressModal.errorType === 'token_missing' || stemProgressModal.errorType === 'gemini_key_missing' || stemProgressModal.errorType === 'gemini_auth_invalid' ? (
                      <Key className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : stemProgressModal.errorType === 'audio_unsupported' || stemProgressModal.errorType === 'ffmpeg_codec_unsupported' ? (
                      <FileAudio className="w-4 h-4 text-orange-400 shrink-0" />
                    ) : stemProgressModal.errorType === 'rate_limit' || stemProgressModal.errorType === 'gemini_quota_exceeded' ? (
                      <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                    ) : stemProgressModal.errorType === 'timeout' ? (
                      <Timer className="w-4 h-4 text-purple-400 shrink-0" />
                    ) : stemProgressModal.errorType === 'gpu_failure' ? (
                      <Cpu className="w-4 h-4 text-fuchsia-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{stemProgressModal.errorTitle || 'Diagnóstico del Error'}</span>
                  </div>
                  <p className="text-[12px] text-neutral-100 font-sans leading-relaxed whitespace-pre-wrap break-words font-medium">
                    {stemProgressModal.errorMessage || 'No se pudo completar la separación de pistas.'}
                  </p>
                </div>

                {/* Recommended Solution Card */}
                {stemProgressModal.actionAdvice && (
                  <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-emerald-500/30 space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>💡 Solución Recomendada:</span>
                    </div>
                    <p className="text-[11px] text-neutral-300 font-sans leading-relaxed">
                      {stemProgressModal.actionAdvice}
                    </p>
                  </div>
                )}

                {/* Primary Action Buttons Based on Error Provider & Type */}
                <div className="space-y-2">
                  {/* Replicate Specific Actions */}
                  {stemProgressModal.errorProvider === 'replicate' && stemProgressModal.errorType === 'billing_required' && (
                    <a
                      href="https://replicate.com/account/billing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-zinc-950 font-mono text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Recargar Saldo del Proveedor de IA</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {stemProgressModal.errorProvider === 'replicate' && (stemProgressModal.errorType === 'auth_invalid' || stemProgressModal.errorType === 'token_missing') && (
                    <a
                      href="https://replicate.com/account/api-tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <Key className="w-4 h-4" />
                      <span>Gestionar Token del Proveedor de IA</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {stemProgressModal.errorProvider === 'replicate' && (stemProgressModal.errorType === 'rate_limit' || stemProgressModal.errorType === 'timeout' || stemProgressModal.errorType === 'gpu_failure') && (
                    <button
                      type="button"
                      onClick={() => {
                        const idea = stemProgressModal.targetIdea;
                        if (idea) handlePerformAiStemSeparation(idea, stemProgressModal.engineChoice || 'demucs');
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Reintentar en la Nube</span>
                    </button>
                  )}

                  {stemProgressModal.errorProvider === 'replicate' && stemProgressModal.errorType === 'server_error' && (
                    <a
                      href="https://replicatestatus.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <Activity className="w-4 h-4" />
                      <span>Comprobar Estado del Servicio</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {/* Gemini API Specific Actions */}
                  {stemProgressModal.errorProvider === 'gemini' && (stemProgressModal.errorType === 'gemini_key_missing' || stemProgressModal.errorType === 'gemini_auth_invalid') && (
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <Key className="w-4 h-4" />
                      <span>Configurar API Key en Google AI Studio</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {stemProgressModal.errorProvider === 'gemini' && stemProgressModal.errorType === 'gemini_quota_exceeded' && (
                    <a
                      href="https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Revisar Cuotas de Gemini en Google Cloud</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {/* Fallback and Alternative Engine Buttons */}
                  <div className="flex gap-2">
                    {stemProgressModal.targetIdea && (
                      <button
                        type="button"
                        onClick={() => {
                          const idea = stemProgressModal.targetIdea;
                          if (idea) {
                            if (stemProgressModal.engineChoice === 'dsp-server') {
                              handlePerformAiStemSeparation(idea, 'mvsep-mdx23');
                            } else {
                              handlePerformAiStemSeparation(idea, 'dsp-server');
                            }
                          }
                        }}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          {stemProgressModal.engineChoice === 'dsp-server'
                            ? 'Probar con Iris Studio'
                            : 'Separar con Iris Básico (Gratis)'}
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setStemProgressModal(null)}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold transition-all cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>

                {/* Collapsible Technical Details */}
                {stemProgressModal.errorDetail && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowStemErrorDetails(!showStemErrorDetails)}
                      className="text-[11px] font-mono text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {showStemErrorDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      <span>{showStemErrorDetails ? 'Ocultar diagnóstico técnico' : 'Ver diagnóstico técnico detallado (logs / error)'}</span>
                    </button>
                    {showStemErrorDetails && (
                      <div className="mt-2 p-3 rounded-xl bg-black/80 border border-white/10 font-mono text-[11px] text-neutral-300 space-y-2 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                          <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Detalles técnicos del error:</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(stemProgressModal.errorDetail || '');
                              setCopiedStemError(true);
                              setTimeout(() => setCopiedStemError(false), 2000);
                            }}
                            className="flex items-center gap-1 text-[10px] text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedStemError ? '¡Copiado!' : 'Copiar'}</span>
                          </button>
                        </div>
                        <div className="max-h-40 overflow-y-auto whitespace-pre-wrap break-all text-[10px] text-neutral-400 font-mono leading-relaxed select-all">
                          {stemProgressModal.errorDetail}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Píldora flotante: Iris sigue separando en segundo plano mientras el usuario minimizado
          sigue trabajando en el resto del Studio (reproducir ideas, ver acordes, etc.) */}
      {stemProgressModal && stemProgressModal.isOpen && stemProgressModal.minimized && (
        <button
          type="button"
          onClick={() => setStemProgressModal(prev => prev ? { ...prev, minimized: false } : null)}
          className="fixed bottom-20 right-3 sm:right-6 z-[1150] w-56 rounded-2xl bg-zinc-950/95 backdrop-blur-md border border-amber-500/40 shadow-2xl p-3 text-left cursor-pointer hover:border-amber-400/70 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-200"
          title="Reabrir el progreso de Iris"
        >
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-mono font-bold text-white truncate">Iris separando pistas…</p>
              <p className="text-[10px] font-mono text-neutral-400 truncate">{stemProgressModal.ideaTitle}</p>
            </div>
            <span className="font-mono text-xs font-bold text-amber-400 shrink-0">{Math.round(stemProgressModal.progressPct)}%</span>
            <Maximize2 className="w-3 h-3 text-neutral-500 shrink-0" />
          </div>
          <div className="mt-2 w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(5, stemProgressModal.progressPct)}%` }}
            />
          </div>
        </button>
      )}

      {/* Tutorial Interactivo Paso a Paso */}
      <ModuleTutorialModal
        moduleId="song_studio"
        isOpen={isTutorialOpen}
        onClose={closeTutorial}
      />

    </div>
    </ModalPortal>
  );
}
