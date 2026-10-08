import { PopoverAncla } from './ui/PopoverAncla';
import { SongStudioCubaseHelpModal } from './song_studio/SongStudioCubaseHelpModal';
import { SongStudioDeleteConfirmModal } from './song_studio/SongStudioDeleteConfirmModal';
import { SongStudioAiGeneratorModal } from './song_studio/SongStudioAiGeneratorModal';
import { SongStudioMoisesStemsModal } from './song_studio/SongStudioMoisesStemsModal';
import { SongStudioAiTrackGenModal } from './song_studio/SongStudioAiTrackGenModal';
import { SongStudioStemProgressModal } from './song_studio/SongStudioStemProgressModal';
import { ShowIcon } from './ui/ShowIcon';

import { SongStudioAiMusicModal } from './song_studio/SongStudioAiMusicModal';
import { SongStudioAiComposerModal } from './song_studio/SongStudioAiComposerModal';
import {
  getLowLatencyAudioStream,
  createCleanAudioRecordingPipeline,
  cleanAudioBlobOffline,
  trimAudioBlobLatency,
  autoDetectAudioLatencyOffset,
  exportMasterMixAudioBlob,
} from '../utils/audioLatency';
import React, { useState, useRef, useEffect } from 'react';
import { useSeparacionIris } from '../hooks/useSeparacionIris';
import { resolverAudioUrlParaSubida } from '../utils/audioParaSubida';

const SILENT_AUDIO_URI = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
import { motion, AnimatePresence } from 'motion/react';
import { Song, SongAudioIdea, AudioTrack, ThemeColors, DrumPatternStyle, User } from '../types';
import { uploadFileToServer, resolveAudioUrl, getAudioBlobFromUrl } from '../utils/audioStorage';
import { apiFetch } from '../utils/api';
import { generateAccompanimentAudioBlob } from '../utils/accompanimentSynth';
import WaveformTrack from './WaveformTrack';
import { Atril } from './Atril';
import PracticeModePanel from './PracticeModePanel';
import { ShareModal } from './ShareModal';
import { ModalPortal } from './common/ModalPortal';
import { useStudioShareModal } from '../hooks/useStudioShareModal';
import { useAccompanimentGenerator } from '../hooks/useAccompanimentGenerator';
import { useIdeaComments } from '../hooks/useIdeaComments';
import { useModuleTutorial } from '../hooks/useModuleTutorial';
import { getMemberReadiness, withMemberReadiness, READINESS_LEVELS, ReadinessLevel } from '../utils/repertorioUtils';
import { getSongIrisStemIdea, ideaDeStemsDeCancion, cancionConIdeas, cancionConPistas, esIdeaIris, irisPrimero, metaStemsDeCancion } from '../utils/irisTracks';
import { ModuleTutorialModal } from './common/ModuleTutorialModal';
import { formatSongTitle } from '../utils/formatSongTitle';
import {
  X,
  Play,
  Pause,
  Mic,
  Upload,
  Volume2,
  VolumeX,
  MessageSquare,
  ThumbsUp,
  Plus,
  Music,
  User as UserIcon,
  Sparkles,
  Trash2,
  Send,
  Disc,
  Layers,
  Sliders,
  Edit2,
  Check,
  Radio,
  Wand2,
  RefreshCw,
  FileText,
  Keyboard,
  Square,
  Repeat,
  Flag,
  RotateCcw,
  Headphones,
  ShieldCheck,
  Filter,
  Share2,
  Maximize2,
  Minimize2,
  Cpu,
  Activity,
  Info,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  HardDrive,
  Clock,
  Timer,
  CreditCard,
  Key,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Copy,
  Bot,
  Database,
  MoreVertical,
  GripVertical,
  Zap,
} from 'lucide-react';
import { Button, IconButton, Input, MenuItem, Select, Textarea } from './ui';

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
      console.warn('LiveMicWaveformCanvas setup error:', e);
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
        ctx.fillStyle = isCurrentPoint ? '#ffffff' : val > 0.6 ? 'var(--acc)' : color;
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
      try {
        sourceNode?.disconnect();
      } catch {}
      try {
        analyserNode?.disconnect();
      } catch {}
      if (createdLocalCtx && ctxToUse) {
        try {
          ctxToUse.close();
        } catch {}
      }
    };
  }, [isRecording, stream, audioCtx, color, height]);

  return <canvas ref={canvasRef} className="w-full h-full block rounded bg-[var(--sunken)]" />;
};

// Guiño de marca a Iris mientras se procesa: un rayo de luz blanco entra en el prisma y sale
// descompuesto en el arcoíris de 6 colores — la misma paleta que colorea las pistas del mezclador.
const IRIS_PRISM_RAY_COLORS = ['#ff6b6b', '#ffab4a', '#ffe066', '#6fe89a', '#5b9dff', '#c084fc'];
const IrisPrismBanner: React.FC = () => {
  return (
    <div className="w-full aspect-video flex items-center justify-center overflow-hidden rounded-[var(--r-m)] bg-[var(--surface)]">
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
  onClose: () => void;
  onUpdateSong: (updatedSong: Song) => void;
  currentUsername?: string;
  currentUser?: User;
  initialOpenIrisModal?: boolean;
}

// Coste aproximado por canción de cada motor de Iris, solo para orientar al usuario (no viene de
// una factura real reconciliada) — ajustar aquí si Diego consigue cifras reales del proveedor cloud.
const IRIS_ENGINE_COST_EUR: Record<'fal' | 'mvsep-mdx23' | 'demucs' | 'dsp-server', number> = {
  fal: 0.01,
  'mvsep-mdx23': 0.08,
  demucs: 0.03,
  'dsp-server': 0,
};
const formatEurEstimate = (n: number) => n.toFixed(2).replace('.', ',');

// Guiño a Iris (diosa del arcoíris): cada pista se colorea recorriendo el arcoíris en orden
// (rojo, naranja, amarillo, verde, azul, violeta). Por defecto sigue la posición en la
// lista, pero en cuanto el usuario reordena pistas a mano, cada una"congela" su color en
// tr.colorHue para que se lo lleve consigo al moverse — a partir de ahí el arcoíris ya no sale
// perfectamente en orden, y eso es justo lo esperado: gana la posición que elige el usuario.
const RAINBOW_HUE_STEPS = [355, 28, 50, 135, 215, 280]; // Rojo, Naranja, Amarillo, Verde, Azul, Violeta
// Convierte HSL a hex para poder seguir usando el truco de"hex + 2 dígitos de alpha" que ya
// usa WaveformTrack internamente (color +'40', color +'50'...) sin tener que tocar ese componente.
const hslToHex = (h: number, s: number, l: number): string => {
  const sat = s / 100,
    light = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) =>
    Math.round(255 * x)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
};
const getTrackRainbowColor = (tr: AudioTrack, fallbackIndex: number, alphaHex?: string): string => {
  const hue = typeof tr.colorHue === 'number' ? tr.colorHue : RAINBOW_HUE_STEPS[fallbackIndex % RAINBOW_HUE_STEPS.length];
  const hex = hslToHex(hue, 60, 68);
  return alphaHex ? `${hex}${alphaHex}` : hex;
};

const SECCIONES_TEMA: {
  key: SongAudioIdea['seccion'];
  label: string;
  icon: string;
  color: string;
}[] = [
  {
    key: 'general',
    label: 'Idea General / Demo',
    icon: '🎵',
    color: 'bg-[var(--tentative)]/10 text-[var(--tentative)]',
  },
  {
    key: 'intro',
    label: 'Intro',
    icon: '🚀',
    color: 'bg-[var(--ok)]/10 text-[var(--ok)]',
  },
  {
    key: 'verso',
    label: 'Verso / Estrofa',
    icon: '📝',
    color: 'bg-[var(--acc)]/10 text-[var(--ink)]',
  },
  {
    key: 'estribillo',
    label: 'Estribillo / Chorus',
    icon: '🔥',
    color: 'bg-[var(--acc)]/10 text-[var(--ink)] /30',
  },
  {
    key: 'puente',
    label: 'Puente / Bridge',
    icon: '🌉',
    color: 'bg-[var(--tentative)]/10 text-[var(--tentative)]',
  },
  {
    key: 'solo',
    label: 'Solo / Arreglo',
    icon: '🎸',
    color: 'bg-[var(--alert)]/10 text-[var(--alert)]',
  },
  {
    key: 'outro',
    label: 'Outro / Final',
    icon: '🏁',
    color: 'bg-[var(--acc)]/10 text-[var(--ink)]',
  },
];

// Galería de presets de estilo para el generador de pista con IA: en vez de una caja de texto en
// blanco (parálisis de decisión), un punto de partida de un clic con nombre + descripción de una
// línea, igual que las tarjetas de estilo de herramientas tipo Moisés/Suno Studio.
const AI_TRACK_STYLE_PRESETS: {
  key: string;
  label: string;
  icon: string;
  description: string;
  style: string;
}[] = [
  {
    key: 'rock',
    label: 'Rock Clásico',
    icon: '🎸',
    description: 'Riffs con guitarra distorsionada, bien pegado a la base rítmica.',
    style: 'Rock clásico, guitarra con distorsión moderada, riff pegado a la batería',
  },
  {
    key: 'balada',
    label: 'Balada Suave',
    icon: '🌊',
    description: 'Arreglo melódico y espacioso, dinámica contenida.',
    style: 'Balada suave, arreglo melódico y espacioso, dinámica contenida y emotiva',
  },
  {
    key: 'funk',
    label: 'Funk Groove',
    icon: '🕺',
    description: 'Patrón sincopado y percusivo, mucho groove.',
    style: 'Funk groove, patrón rítmico sincopado, muy percusivo y bailable',
  },
  {
    key: 'ska',
    label: 'Ska / Balkan',
    icon: '🎷',
    description: 'Vientos y ritmo saltarín, energía festiva.',
    style: 'Ska / Balkan, ritmo saltarín off-beat, energía festiva de fanfarria',
  },
  {
    key: 'pop',
    label: 'Pop Moderno',
    icon: '🌆',
    description: 'Producción limpia, ganchos melódicos directos.',
    style: 'Pop moderno, producción limpia y comercial, ganchos melódicos directos',
  },
  {
    key: 'punk',
    label: 'Punk Energético',
    icon: '🤘',
    description: 'Rápido, crudo, acordes potentes.',
    style: 'Punk rock energético, tempo rápido, acordes potentes, sonido crudo',
  },
  {
    key: 'synth',
    label: 'Synth Atmosférico',
    icon: '🎹',
    description: 'Texturas electrónicas, pads y capas.',
    style: 'Synth atmosférico, texturas electrónicas, pads envolventes y capas',
  },
  {
    key: 'orquestal',
    label: 'Cuerdas Orquestales',
    icon: '🎻',
    description: 'Arreglo sinfónico con dramatismo.',
    style: 'Cuerdas orquestales, arreglo sinfónico con dramatismo y amplitud',
  },
];

// Helper to standardise tracks array from idea
export function getIdeaTracks(idea: SongAudioIdea): AudioTrack[] {
  if (idea.pistas && idea.pistas.length > 0) {
    return idea.pistas;
  }
  // Fallback single track
  return [
    {
      id: `${idea.id}-track-1`,
      nombre: idea.titulo || 'Pista Principal',
      audioUrl: idea.audioUrl,
      autor: idea.subidoPor,
      instrumento: idea.instrumento,
      fecha: idea.fecha,
      volumen: 1,
      muted: false,
    },
  ];
}

export type MoisesSeparationPreset = '2_stems' | '4_stems' | '6_stems' | 'custom';

export interface MoisesStemOption {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  tag: string;
  desc: string;
  badgeBg: string;
}

export const MOISES_AVAILABLE_STEMS: MoisesStemOption[] = [
  {
    id: 'Voz',
    name: 'Voz Principal (Vocals)',
    shortName: 'Voz',
    icon: '🎤',
    tag: 'Acapella / Melodía',
    desc: 'Voz aislada en alta pureza espectral. Permite silenciar la voz original para ensayar cantando o directos.',
    badgeBg: 'bg-[var(--acc)]/20 text-[var(--ink)] ',
  },
  {
    id: 'Instrumental',
    name: 'Base Instrumental (Playback)',
    shortName: 'Instrumental',
    icon: '🎵',
    tag: 'Karaoke / Backing Track',
    desc: 'Mezcla musical completa sin voz principal. La opción predilecta para directos con playback o práctica vocal.',
    badgeBg: 'bg-[var(--alert)]/20 text-[var(--ink)] ',
  },
  {
    id: 'Batería',
    name: 'Batería & Percusión (Drums)',
    shortName: 'Batería',
    icon: '🥁',
    tag: 'Ritmo & Platos',
    desc: 'Aislamiento de bombo, caja, timbales y platos (>1800Hz) para practicar con metrónomo y batería real.',
    badgeBg: 'bg-[var(--acc)]/20 text-[var(--ink)] ',
  },
  {
    id: 'Bajo',
    name: 'Bajo Eléctrico (Bass)',
    shortName: 'Bajo',
    icon: '🎸',
    tag: 'Sub-Bass & Graves',
    desc: 'Frecuencias fundamentales y transitorios de bajo (<180Hz) para estudiar la línea o tocar encima.',
    badgeBg: 'bg-[var(--ok)]/20 text-[var(--ink)] ',
  },
  {
    id: 'Guitarras',
    name: 'Guitarras (Rítmicas & Solos)',
    shortName: 'Guitarras',
    icon: '🎸',
    tag: 'Eléctricas & Acústicas',
    desc: 'Guitarras eléctricas, distorsiones y acústicas sin bleed de voz ni percusión.',
    badgeBg: 'bg-[var(--acc)]/20 text-[var(--ink)] ',
  },
  {
    id: 'Teclados',
    name: 'Teclados & Piano (Keys)',
    shortName: 'Teclados',
    icon: '🎹',
    tag: 'Pianos & Sintes',
    desc: 'Pianos acústicos, sintetizadores polifónicos y teclados aislados para acompañamiento armónico.',
    badgeBg: 'bg-[var(--acc)]/20 text-[var(--ink)] ',
  },
  {
    id: 'Arreglos',
    name: 'Arreglos, Vientos & Cuerdas (Other)',
    shortName: 'Arreglos',
    icon: '🎺',
    tag: 'Metales & Efectos',
    desc: 'Secciones de viento metal, cuartetos de cuerda, solos y efectos secundarios de mezcla.',
    badgeBg: 'bg-[var(--acc)]/20 text-[var(--ink)] ',
  },
];

export const MOISES_PRESETS_CONFIG: Record<MoisesSeparationPreset, { label: string; badge: string; subtitle: string; stems: string[] }> = {
  '2_stems': {
    label: '2 Pistas',
    badge: 'Karaoke / Playback',
    subtitle: 'Voz Principal + Base Instrumental completa',
    stems: ['Voz', 'Instrumental'],
  },
  '4_stems': {
    label: '4 Pistas',
    badge: 'Moises Estándar',
    subtitle: 'Voz, Batería, Bajo y Guitarras/Armonía',
    stems: ['Voz', 'Batería', 'Bajo', 'Guitarras'],
  },
  '6_stems': {
    label: '6 Pistas',
    badge: 'Estudio Completo',
    subtitle: 'Voz, Batería, Bajo, Guitarras, Teclados y Arreglos',
    stems: ['Voz', 'Batería', 'Bajo', 'Guitarras', 'Teclados', 'Arreglos'],
  },
  custom: {
    label: 'A Tu Medida',
    badge: 'Personalizado',
    subtitle: 'Selección manual de instrumentos a aislar',
    stems: [],
  },
};

export default function SongStudioModal({
  song,
  colors,
  onClose,
  onUpdateSong,
  currentUsername = 'Tu Nombre',
  currentUser,
  initialOpenIrisModal = false,
}: SongStudioModalProps) {
  const songRef = useRef<Song>(song);
  useEffect(() => {
    songRef.current = song;
  }, [song]);

  const [activeSectionFilter, setActiveSectionFilter] = useState<string>('todas');
  // Auto-expandir de inicio cualquier idea que ya contenga pistas separadas por Iris
  const [expandedIdeaIds, setExpandedIdeaIds] = useState<Set<string>>(() => {
    const initialSet = new Set<string>();
    if (song.audioIdeas) {
      song.audioIdeas.forEach((idea) => {
        if (esIdeaIris(idea) || song.audioIdeas!.length === 1) {
          initialSet.add(idea.id);
        }
      });
    }
    return initialSet;
  });

  // Auto-expandir UNA sola vez cada idea nueva que traiga stems de Iris (o que sea la única).
  // Antes el efecto reañadía al Set toda idea con stems en cada cambio de song.audioIdeas (voto,
  // comentario, guardado...), así que al plegarla se reabría sola; y `filteredIdeas.length === 1`
  // la forzaba abierta aunque se pulsara el chevron. Ahora el usuario manda: lo que plegó queda plegado.
  const ideasYaVistasRef = useRef<Set<string>>(new Set(song.audioIdeas?.map((i) => i.id) ?? []));
  useEffect(() => {
    const ideas = song.audioIdeas ?? [];
    const nuevas = ideas.filter((idea) => !ideasYaVistasRef.current.has(idea.id));
    if (nuevas.length === 0) return;
    nuevas.forEach((idea) => ideasYaVistasRef.current.add(idea.id));
    const aAbrir = nuevas.filter(
      (idea) => esIdeaIris(idea) || ideas.length === 1
    );
    if (aAbrir.length === 0) return;
    setExpandedIdeaIds((prev) => new Set([...prev, ...aAbrir.map((i) => i.id)]));
  }, [song.audioIdeas]);

  const toggleIdeaExpanded = (ideaId: string) => {
    setExpandedIdeaIds((prev) => {
      const next = new Set(prev);
      if (next.has(ideaId)) next.delete(ideaId);
      else next.add(ideaId);
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
  const { shareModalData, setShareModalData, handleShareSong, handleShareIdea } = useStudioShareModal(song);

  const [playingIdeaId, setPlayingIdeaId] = useState<string | null>(null);
  const [currentTimeMap, setCurrentTimeMap] = useState<Record<string, number>>({});
  const [durationMap, setDurationMap] = useState<Record<string, number>>({});
  const [loopConfigMap, setLoopConfigMap] = useState<Record<string, { enabled: boolean; start: number; end: number }>>({});

  const {
    commentTextMap,
    setCommentTextMap,
    commentTimeTagMap,
    setCommentTimeTagMap,
    commentTrackTagMap,
    setCommentTrackTagMap,
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
  const [selectedStemEngine, setSelectedStemEngine] = useState<'fal' | 'mvsep-mdx23' | 'demucs' | 'dsp-server'>('fal');
  const [showMoisesStemsModal, setShowMoisesStemsModal] = useState<SongAudioIdea | null>(null);
  const [showIrisPanel, setShowIrisPanel] = useState(false);
  const [moisesTab, setMoisesTab] = useState<'stems' | 'how_it_works' | 'upload'>('stems');
  const [moisesPreset, setMoisesPreset] = useState<MoisesSeparationPreset>('6_stems');
  const [selectedStemsToExtract, setSelectedStemsToExtract] = useState<string[]>([
    'Voz',
    'Batería',
    'Bajo',
    'Guitarras',
    'Teclados',
    'Arreglos',
  ]);
  const [uploadingStemInstrument, setUploadingStemInstrument] = useState<string>('Voz');

  const handleSelectMoisesPreset = (preset: MoisesSeparationPreset) => {
    setMoisesPreset(preset);
    if (preset !== 'custom') {
      setSelectedStemsToExtract(MOISES_PRESETS_CONFIG[preset].stems);
    }
  };

  const handleToggleStem = (stemId: string) => {
    let next: string[];
    if (selectedStemsToExtract.includes(stemId)) {
      if (selectedStemsToExtract.length <= 1) return; // Mantener al menos 1 pista seleccionada
      next = selectedStemsToExtract.filter((s) => s !== stemId);
    } else {
      next = [...selectedStemsToExtract, stemId];
    }
    setSelectedStemsToExtract(next);

    // Comprobar si la combinación actual coincide con un preset estándar
    const matchingPreset = (Object.keys(MOISES_PRESETS_CONFIG) as MoisesSeparationPreset[]).find((p) => {
      if (p === 'custom') return false;
      const pStems = MOISES_PRESETS_CONFIG[p].stems;
      return pStems.length === next.length && pStems.every((s) => next.includes(s));
    });
    setMoisesPreset(matchingPreset || 'custom');
  };

  // Auto-abrir modal de separación de pistas con Iris al pulsar el acceso directo "Procesar con Iris"
  const atajoIrisAtendidoRef = useRef(false);
  useEffect(() => {
    // Solo la primera vez: con `song` en las dependencias, cada guardado reabría la idea.
    if (initialOpenIrisModal && !atajoIrisAtendidoRef.current) {
      atajoIrisAtendidoRef.current = true;
      const existingIrisIdea = getSongIrisStemIdea(song);
      if (existingIrisIdea) {
        // La canción YA tiene pistas separadas: asegurar que quede expandida en el mezclador multipista
        // de inmediato para que el usuario vea todos los canales (Voz, Batería, Bajo, Guitarras...)
        setExpandedIdeaIds((prev) => new Set([...prev, existingIrisIdea.id]));
        setShowMoisesStemsModal(null);
      } else if (song.audioIdeas && song.audioIdeas.length > 0) {
        setShowMoisesStemsModal(song.audioIdeas[0]);
      } else {
        const fallbackIdea: SongAudioIdea = {
          id: `idea-main-${song.id || Date.now()}`,
          titulo: `Maqueta Principal (${song.titulo})`,
          audioUrl: song.audioPrincipalUrl || (song as any).audioUrl || '',
          subidoPor: currentUsername || 'Banda',
          seccion: 'general',
          fecha: new Date().toLocaleDateString('es-ES'),
        };
        setShowMoisesStemsModal(fallbackIdea);
      }
    }
  }, [initialOpenIrisModal, song, currentUsername]);

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
  const {
    isSeparatingStemsAi,
    separationElapsedSeconds,
    stemProgressModal,
    setStemProgressModal,
    showStemErrorDetails,
    setShowStemErrorDetails,
    copiedStemError,
    setCopiedStemError,
    handlePerformAiStemSeparation,
    handleCancelStemSeparation,
  } = useSeparacionIris({
    song,
    onUpdateSong,
    motor: selectedStemEngine,
    pistasElegidas: selectedStemsToExtract,
    alTerminarIdea: (ids) => setExpandedIdeaIds((prev) => new Set([...prev, ...ids])),
  });


  // AI Custom Instrument Track Generator Handler — genera y deja en previsualización, NUNCA
  // compromete directo al mezclador: la IA generativa a veces devuelve algo que no encaja, y
  // forzar al usuario a escucharlo ya integrado en su mezcla (o peor, tener que deshacerlo a mano)
  // es peor experiencia que dejarle escuchar antes y decidir"Añadir" o"Descartar".
  const handleGenerateAiInstrumentTrack = async (targetIdea: SongAudioIdea) => {
    if (!aiTrackGenInstrument) return;
    setAiTrackGenError(null);
    setAiTrackGenPreview(null);
    try {
      setIsGeneratingAiTrack(true);

      // Audio real de la idea para que el motor (MusicGen) pueda ESCUCHAR melodía/acordes/ritmo
      // en vez de adivinar desde una descripción de texto — mismo saneado que ya hace la
      // separación de stems para blobs/IndexedDB, que Replicate no puede ir a buscar por sí solo.
      // idea.audioUrl es"la pista principal o legacy" y puede estar vacío en ideas que solo
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
            const file = new File([blob], `source-audio-${Date.now()}.${ext}`, {
              type: blob.type || 'audio/mpeg',
            });
            const bandIdToUse = localStorage.getItem('bandmanager_band_id') || undefined;
            const uploadedUrl = await uploadFileToServer(file, {
              category: 'stems',
              folder: 'inputs',
              bandId: bandIdToUse,
            });
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
          sourceAudioUrl,
        }),
      });

      const generatedAudioUrl =
        data.audioUrl || (data.audioBase64 ? `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}` : null);
      if (!generatedAudioUrl) {
        throw new Error(
          'La IA no devolvió audio esta vez (puede pasar con Lyria/MusicGen). Prueba a regenerar o cambia el estilo/instrucción.'
        );
      }

      setAiTrackGenPreview({
        audioUrl: generatedAudioUrl,
        trackName: data.trackName || `Pista IA: ${aiTrackGenInstrument}`,
        arrangementNotes: data.arrangementNotes || 'Generado en armonía con la tonalidad y BPM.',
      });
    } catch (err: any) {
      console.error('Error al generar pista por IA:', err);
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
      desfaseMs: aiTrackGenStartOffsetSec > 0 ? -(aiTrackGenStartOffsetSec * 1000) : 0,
    };

    onUpdateSong(cancionConPistas(song, targetIdea, [...existing, newAiTrack]));
    setShowAiTrackGenModal(null);
    setAiTrackGenPreview(null);
    setAiTrackGenPrompt('');
    setAiTrackGenStartOffsetSec(0);
  };

  // Studio Fullscreen Mode State & Handler
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  const toggleIsFullScreen = () => {
    setIsFullScreen((prev) => {
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
  const trackDSPMapRef = useRef<
    Record<
      string,
      {
        element: HTMLAudioElement;
        source?: MediaElementAudioSourceNode;
        stemFilter?: BiquadFilterNode | null;
        eqLow?: BiquadFilterNode;
        eqMid?: BiquadFilterNode;
        eqHigh?: BiquadFilterNode;
        gainNode?: GainNode;
        panNode?: StereoPannerNode | GainNode;
      }
    >
  >({});

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
    lastPerTrackGainRef.current[trackId] = targetGain;

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
          const isSameOriginOrBlob =
            !el.src || el.src.startsWith('blob:') || el.src.startsWith('data:') || el.src.includes(window.location.host);
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
          const isDedicatedStem =
            (el.src &&
              (el.src.includes('/stems/') ||
                el.src.includes('stem-') ||
                el.src.includes('replicate.delivery') ||
                el.src.startsWith('blob:'))) ||
            (tr.audioUrl &&
              (tr.audioUrl.includes('/stems/') ||
                tr.audioUrl.includes('stem-') ||
                tr.audioUrl.includes('replicate.delivery') ||
                tr.audioUrl.startsWith('blob:')));

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

          dsp = {
            element: el,
            source,
            stemFilter,
            eqLow,
            eqMid,
            eqHigh,
            gainNode,
            panNode,
          };
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
      console.warn('Could not setup WebAudio DSP for track:', trackId, err);
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

      const songBpm = bpm > 40 && bpm < 240 ? bpm : song.bpm || 120;
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
      (song.audioIdeas || []).forEach((idea) => {
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
        setResolvedAudioUrls((prev) => {
          const keysCurr = Object.keys(urlMap);
          const keysPrev = Object.keys(prev);
          if (keysCurr.length === keysPrev.length && keysCurr.every((k) => prev[k] === urlMap[k])) {
            return prev;
          }
          return urlMap;
        });
      }
    };

    resolveAllTracks();
    return () => {
      isMounted = false;
    };
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
  // Última ganancia POR PISTA aplicada (antes de multiplicar por el master) — updateTrackAudioDSP
  // la actualiza cada vez que corre. Hace falta guardarla aparte porque el efecto de más abajo
  // que reacciona a cambios del master necesita recalcular el volumen de cada <audio> sin volver
  // a evaluar mute/solo/volumen de cada pista desde cero.
  const lastPerTrackGainRef = useRef<Record<string, number>>({});
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
    // El GainNode de arriba solo alcanza a las pistas mismo-origen/blob (ver comentario encima de
    // getOrCreateMasterGain) — para la mayoría de pistas reales (Supabase Storage, origen cruzado)
    // el master no tenía NINGÚN efecto audible hasta este bucle: había que tocarlo a mano en cada
    // <audio> con la última ganancia por pista que updateTrackAudioDSP ya llevaba guardada.
    for (const [trackId, el] of Object.entries(trackAudioRefs.current)) {
      if (!el) continue;
      const perTrackGain = lastPerTrackGainRef.current[trackId] ?? 1;
      try {
        el.volume = applyMasterToElementVolume(perTrackGain);
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masterVolume]);

  const ideasList = song.audioIdeas || [];

  const filteredIdeas = irisPrimero(
    activeSectionFilter === 'todas' ? ideasList : ideasList.filter((i) => i.seccion === activeSectionFilter)
  );
  const tomas = filteredIdeas.filter((i) => !esIdeaIris(i));
  const metaStems = metaStemsDeCancion(song);
  const irisIdea = ideaDeStemsDeCancion(song);
  // Audio de partida para separar: la primera toma con audio, o el audio principal de la canción
  const fuenteIris: SongAudioIdea | null =
    ideasList.find((i) => i.audioUrl) ??
    ((song.audioPrincipalUrl || (song as any).audioUrl)
      ? {
          id: `idea-main-${song.id}`,
          titulo: `Maqueta Principal (${song.titulo})`,
          audioUrl: song.audioPrincipalUrl || (song as any).audioUrl,
          subidoPor: currentUsername || 'Banda',
          seccion: 'general',
          fecha: new Date().toLocaleDateString('es-ES'),
        }
      : null);

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
    setLoopConfigMap((prev) => {
      const current = prev[idea.id] || {
        enabled: false,
        start: 0,
        end: maxDur,
      };
      return {
        ...prev,
        [idea.id]: { ...current, enabled: !current.enabled },
      };
    });
  };

  const setIdeaCueIn = (idea: SongAudioIdea) => {
    const curTime = currentTimeMap[idea.id] || 0;
    const maxDur = getValidIdeaDuration(idea.id);
    setLoopConfigMap((prev) => {
      const current = prev[idea.id] || { enabled: true, start: 0, end: maxDur };
      const newEnd = current.end > curTime ? current.end : maxDur;
      return {
        ...prev,
        [idea.id]: { enabled: true, start: curTime, end: newEnd },
      };
    });
  };

  const setIdeaCueOut = (idea: SongAudioIdea) => {
    const curTime = currentTimeMap[idea.id] || 0;
    const maxDur = getValidIdeaDuration(idea.id);
    setLoopConfigMap((prev) => {
      const current = prev[idea.id] || { enabled: true, start: 0, end: maxDur };
      const newStart = current.start < curTime ? current.start : 0;
      return {
        ...prev,
        [idea.id]: { enabled: true, start: newStart, end: curTime },
      };
    });
  };

  const resetIdeaLoopBounds = (idea: SongAudioIdea) => {
    const maxDur = getValidIdeaDuration(idea.id);
    setLoopConfigMap((prev) => ({
      ...prev,
      [idea.id]: { enabled: true, start: 0, end: maxDur },
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
    tracks.forEach((tr) => {
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
    tracks.forEach((tr) => {
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
      const currentIdea = (currentSong.audioIdeas || []).find((i) => i.id === idea.id) || idea;
      const activeTracks = getIdeaTracks(currentIdea);
      const activeHasSolo = activeTracks.some((t) => t.solo);

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

      const masterTime = currentMasterEl ? currentMasterEl.currentTime : currentTimeMap[idea.id] || 0;

      // Loop / Cue Bounds
      const loopCfg = loopConfigMap[idea.id];
      const isLoopEnabled = !!loopCfg?.enabled;
      const loopStart = loopCfg?.start || 0;
      const loopEnd = loopCfg?.end && isFinite(loopCfg.end) && loopCfg.end > loopStart ? loopCfg.end : maxIdeaDuration;

      // A. Loop Cue Detection: Check if loop end point hit
      if (isLoopEnabled && masterTime >= loopEnd - 0.05) {
        handleSeekIdea(idea, loopStart);
        syncAnimationFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      // B. Align and enforce playback on all active tracks
      activeTracks.forEach((tr) => {
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
            try {
              slaveEl.currentTime = 0;
            } catch {}
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
        if (
          slaveEl.paused &&
          !isPending &&
          slaveEl.src &&
          !slaveEl.src.startsWith('indexeddb:') &&
          (slaveDur === 0 || targetSlaveTime < slaveDur - 0.05)
        ) {
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
            try {
              slaveEl.currentTime = Math.max(0, targetSlaveTime);
            } catch {}
          }
        }
      });

      // Update progress & duration maps at smooth ~10fps (every 100ms) to eliminate React re-render thrashing
      if (Math.abs(masterTime - lastReportedTime) >= 0.1 || lastReportedTime < 0) {
        lastReportedTime = masterTime;
        setCurrentTimeMap((prev) => ({ ...prev, [idea.id]: masterTime }));
      }

      if (maxIdeaDuration > 0 && isFinite(maxIdeaDuration)) {
        setDurationMap((prev) => {
          if (prev[idea.id] === maxIdeaDuration) return prev;
          return { ...prev, [idea.id]: maxIdeaDuration };
        });
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
    tracks.forEach((tr) => {
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
    const startPos = loopCfg && loopCfg.enabled && loopCfg.start > 0 ? loopCfg.start : 0;

    tracks.forEach((tr) => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        el.pause();
        const targetTrackTime = Math.max(0, startPos + (tr.desfaseMs || 0) / 1000);
        try {
          el.currentTime = targetTrackTime;
        } catch {}
        el.playbackRate = 1.0;
      }
    });

    pendingPlayPromiseRefs.current = {};
    setCurrentTimeMap((prev) => ({ ...prev, [idea.id]: startPos }));
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
        studioAudioCtxRef.current.resume().catch((e) => console.warn('AudioContext resume warning:', e));
      }
    } catch (e) {
      console.warn('AudioContext resume warning:', e);
    }

    // Pause all audio from other ideas
    (Object.values(trackAudioRefs.current) as (HTMLAudioElement | null)[]).forEach((el) => {
      if (el) el.pause();
    });

    const tracks = getIdeaTracks(idea);
    if (tracks.length === 0) return;

    const hasSoloTrack = tracks.some((t) => t.solo);
    let startPos = currentTimeMap[idea.id] || 0;

    let maxDur = 0;
    tracks.forEach((tr) => {
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
      setCurrentTimeMap((prev) => ({ ...prev, [idea.id]: 0 }));
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
            setResolvedAudioUrls((prev) => ({ ...prev, [tr.id]: res }));
          }
        } catch (_) {}
      }

      if (
        resolvedUrl &&
        !resolvedUrl.startsWith('indexeddb:') &&
        (!el.src || el.src === '' || el.src.endsWith('undefined') || (!el.src.includes(resolvedUrl) && el.src !== resolvedUrl))
      ) {
        el.src = resolvedUrl;
      }

      if (el.readyState === 0 && el.src && !el.src.startsWith('indexeddb:')) {
        try {
          el.load();
        } catch {}
      }

      const trackDur = getSafeTrackDuration(el);
      const trackOffsetSec = (tr.desfaseMs || 0) / 1000;
      const targetTrackTime = Math.max(0, startPos + trackOffsetSec);

      if (trackDur > 0 && startPos >= trackDur) {
        try {
          el.currentTime = trackDur;
        } catch {}
        el.pause();
      } else {
        if (Math.abs((el.currentTime || 0) - targetTrackTime) > 0.03) {
          try {
            el.currentTime = targetTrackTime;
          } catch {}
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
              }).catch((err) => {
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

    tracks.forEach((tr) => {
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
    setCurrentTimeMap((prev) => ({ ...prev, [idea.id]: targetTime }));

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
    allAudioElements.forEach((el) => {
      try {
        el.pause();
      } catch {}
    });

    return () => {
      if (syncAnimationFrameRef.current) {
        cancelAnimationFrame(syncAnimationFrameRef.current);
      }
      // Stop all multitrack studio audio elements on unmount
      Object.values(trackAudioRefs.current).forEach((el) => {
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

      const activeIdea = (song.audioIdeas || []).find((i) => i.id === playingIdeaIdRef.current) || (song.audioIdeas || [])[0];

      // If currently recording an overdub track, pressing R, Space, or Stop keys finishes recording
      if (isRecordingTrack) {
        if (
          ['Space', 'Numpad0', 'Digit0', 'KeyR', 'NumpadMultiply', 'KeyP', 'Escape', 'Home', 'NumpadEnter'].includes(e.code) ||
          e.key === 'Home'
        ) {
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
        setShowAddIdea((prev) => !prev);
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
            tracks.forEach((tr) => handleToggleMuteTrack(activeIdea, tr.id));
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
        setShowCubaseHelp((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [song, currentTimeMap, durationMap, loopConfigMap]);

  // Handle Track Volume Change
  const handleTrackVolumeChange = (idea: SongAudioIdea, trackId: string, newVol: number) => {
    const tracks = getIdeaTracks(idea);
    const updatedTracks = tracks.map((tr) => (tr.id === trackId ? { ...tr, volumen: newVol } : tr));
    const hasSolo = updatedTracks.some((t) => t.solo);

    updatedTracks.forEach((tr) => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        updateTrackAudioDSP(tr.id, el, tr, hasSolo);
      }
    });

    const updatedSong = cancionConPistas(song, idea, updatedTracks);
    songRef.current = updatedSong;
    onUpdateSong(updatedSong);
  };

  // Handle Track Latency Desfase Change (Nudge in ms)
  const handleTrackDesfaseChange = (idea: SongAudioIdea, trackId: string, newDesfaseMs: number) => {
    const tracks = getIdeaTracks(idea);
    const updatedTracks = tracks.map((tr) => (tr.id === trackId ? { ...tr, desfaseMs: newDesfaseMs } : tr));

    // Immediately adjust active element currentTime if currently playing
    const el = trackAudioRefs.current[trackId];
    if (el) {
      const masterTime = currentTimeMap[idea.id] || 0;
      const targetTime = Math.max(0, masterTime + newDesfaseMs / 1000);
      try {
        el.currentTime = targetTime;
      } catch {}
    }

    const updatedSong = cancionConPistas(song, idea, updatedTracks);
    songRef.current = updatedSong;
    onUpdateSong(updatedSong);
  };

  // Handle Track Mute Toggle
  const handleToggleMuteTrack = (idea: SongAudioIdea, trackId: string) => {
    const tracks = getIdeaTracks(idea);
    const updatedTracks = tracks.map((tr) => {
      if (tr.id !== trackId) return tr;
      const nextMuted = !tr.muted;
      return {
        ...tr,
        muted: nextMuted,
        solo: nextMuted ? false : tr.solo, // Mutually exclusive: turning Mute ON turns Solo OFF
      };
    });
    const hasSolo = updatedTracks.some((t) => t.solo);

    updatedTracks.forEach((tr) => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        updateTrackAudioDSP(tr.id, el, tr, hasSolo);
      }
    });

    const updatedSong = cancionConPistas(song, idea, updatedTracks);
    songRef.current = updatedSong;
    onUpdateSong(updatedSong);
  };

  // Handle Track Solo Toggle (Cubase style: Exclusive Solo)
  const handleToggleSoloTrack = (idea: SongAudioIdea, trackId: string) => {
    const tracks = getIdeaTracks(idea);
    const targetTrack = tracks.find((t) => t.id === trackId);
    const isTargetCurrentlySolo = !!targetTrack?.solo;

    const updatedTracks = tracks.map((tr) => {
      if (tr.id === trackId) {
        const nextSolo = !isTargetCurrentlySolo;
        return {
          ...tr,
          solo: nextSolo,
          muted: nextSolo ? false : tr.muted, // Turning Solo ON turns Mute OFF
        };
      }
      // Exclusive Solo: turning solo ON for 1 track turns solo OFF for all other tracks
      return {
        ...tr,
        solo: false,
      };
    });
    const hasSolo = updatedTracks.some((t) => t.solo);

    updatedTracks.forEach((tr) => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        updateTrackAudioDSP(tr.id, el, tr, hasSolo);
      }
    });

    const updatedSong = cancionConPistas(song, idea, updatedTracks);
    songRef.current = updatedSong;
    onUpdateSong(updatedSong);
  };

  // Handle Track Pan Change (-1 to 1)
  const handleTrackPanChange = (idea: SongAudioIdea, trackId: string, pan: number) => {
    const tracks = getIdeaTracks(idea);
    const updatedTracks = tracks.map((tr) => (tr.id === trackId ? { ...tr, pan } : tr));
    const hasSolo = updatedTracks.some((t) => t.solo);

    updatedTracks.forEach((tr) => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        updateTrackAudioDSP(tr.id, el, tr, hasSolo);
      }
    });

    const updatedSong = cancionConPistas(song, idea, updatedTracks);
    songRef.current = updatedSong;
    onUpdateSong(updatedSong);
  };

  // Handle Track EQ Change (low, mid, high: -12dB to +12dB)
  const handleTrackEqChange = (idea: SongAudioIdea, trackId: string, band: 'low' | 'mid' | 'high', value: number) => {
    const tracks = getIdeaTracks(idea);
    const updatedTracks = tracks.map((tr) => {
      if (tr.id !== trackId) return tr;
      if (band === 'low') return { ...tr, eqLow: value };
      if (band === 'mid') return { ...tr, eqMid: value };
      return { ...tr, eqHigh: value };
    });
    const hasSolo = updatedTracks.some((t) => t.solo);

    updatedTracks.forEach((tr) => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        updateTrackAudioDSP(tr.id, el, tr, hasSolo);
      }
    });

    const updatedSong = cancionConPistas(song, idea, updatedTracks);
    songRef.current = updatedSong;
    onUpdateSong(updatedSong);
  };

  // Handle Export Master Mix WAV
  const handleExportMasterMix = async (idea: SongAudioIdea) => {
    const tracks = getIdeaTracks(idea);
    if (!tracks || tracks.length === 0) {
      alert('No hay pistas registradas en esta sección para exportar.');
      return;
    }

    setIsExportingMaster(true);
    try {
      const tracksToMix = tracks.map((tr) => ({
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
      console.error('Error al exportar la mezcla máster:', err);
      alert('No se pudo exportar la mezcla máster: ' + (err.message || err));
    } finally {
      setIsExportingMaster(false);
    }
  };

  // Rename track
  const handleSaveTrackName = (idea: SongAudioIdea, trackId: string, newName: string) => {
    if (!newName.trim()) return;
    const tracks = getIdeaTracks(idea);
    const updatedTracks = tracks.map((tr) => (tr.id === trackId ? { ...tr, nombre: newName.trim() } : tr));
    onUpdateSong(cancionConPistas(song, idea, updatedTracks));
    setEditingTrackId(null);
  };

  // Delete track from idea (shows custom confirmation modal)
  const handleDeleteTrack = (idea: SongAudioIdea, trackId: string) => {
    const tracks = getIdeaTracks(idea);
    const track = tracks.find((t) => t.id === trackId);

    if (tracks.length <= 1) {
      setConfirmDeleteModal({
        title: 'Eliminar Idea Completa',
        description: `Esta pista es la única de la idea "${idea.titulo}". ¿Deseas eliminar la idea completa del tema?`,
        onConfirm: () => {
          handleDeleteIdea(undefined, idea.id, true);
        },
      });
      return;
    }

    setConfirmDeleteModal({
      title: 'Eliminar Pista de Audio',
      description: `¿Deseas eliminar la pista "${track?.nombre || 'Pista'}" de la mezcla de "${idea.titulo}"?`,
      onConfirm: () => {
        const el = trackAudioRefs.current[trackId];
        if (el) el.pause();

        const updatedTracks = tracks.filter((tr) => tr.id !== trackId);
        onUpdateSong(cancionConPistas(song, idea, updatedTracks, { audioUrl: updatedTracks[0]?.audioUrl || idea.audioUrl }));
      },
    });
  };

  // Reordenar pistas a mano (guiño a Iris: al mover, cada pista"congela" su color de arcoíris
  // actual en colorHue para que se lo lleve consigo — a partir de ahí el orden visual del
  // arcoíris ya no será perfecto, pero cada pista mantiene su identidad de color).
  const stampTrackColors = (tracks: AudioTrack[]): AudioTrack[] =>
    tracks.map((t, i) => ({
      ...t,
      colorHue: typeof t.colorHue === 'number' ? t.colorHue : RAINBOW_HUE_STEPS[i % RAINBOW_HUE_STEPS.length],
    }));

  const reorderIdeaTracks = (idea: SongAudioIdea, fromIndex: number, toIndex: number) => {
    const tracks = getIdeaTracks(idea);
    if (fromIndex === -1 || toIndex < 0 || toIndex >= tracks.length || fromIndex === toIndex) return;

    const reordered = stampTrackColors(tracks);
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    onUpdateSong(cancionConPistas(song, idea, reordered));
  };

  const handleMoveTrack = (idea: SongAudioIdea, trackId: string, direction: 'up' | 'down') => {
    const tracks = getIdeaTracks(idea);
    const fromIndex = tracks.findIndex((t) => t.id === trackId);
    reorderIdeaTracks(idea, fromIndex, direction === 'up' ? fromIndex - 1 : fromIndex + 1);
  };

  // Arrastrar y soltar para reordenar pistas — mismo sistema (handle GripVertical + HTML5 drag)
  // que ya usa el repertorio para reordenar canciones y setlists.
  const [draggedTrackInfo, setDraggedTrackInfo] = useState<{
    ideaId: string;
    index: number;
  } | null>(null);
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
        console.warn('AudioContext resume during overdub:', e);
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
      const activeBackingTracks = tracks.filter((t) => !t.muted && (!hasSolo || (t as any).solo));

      // 2. Pre-align backing tracks at position 0
      setCurrentTimeMap((prev) => ({ ...prev, [idea.id]: 0 }));
      tracks.forEach((tr) => {
        const resolvedUrl = resolvedAudioUrls[tr.id] || tr.audioUrl;
        let el = trackAudioRefs.current[tr.id];
        if (
          !el &&
          resolvedUrl &&
          typeof resolvedUrl === 'string' &&
          !resolvedUrl.startsWith('indexeddb:') &&
          !resolvedUrl.endsWith('undefined')
        ) {
          el = new Audio(resolvedUrl || SILENT_AUDIO_URI);
          trackAudioRefs.current[tr.id] = el;
        }
        if (el) {
          if (
            resolvedUrl &&
            typeof resolvedUrl === 'string' &&
            !resolvedUrl.startsWith('indexeddb:') &&
            !resolvedUrl.endsWith('undefined')
          ) {
            if (!el.src || !el.src.includes(resolvedUrl)) {
              el.src = resolvedUrl;
            }
          }
          try {
            el.currentTime = 0;
          } catch {}
          el.playbackRate = 1.0;
          const isMuted = tr.muted || (hasSolo && !(tr as any).solo);
          el.volume = applyMasterToElementVolume(isMuted ? 0 : (tr.volumen ?? 1));
        }
      });

      // 3. Play backing track audio FIRST so sound is emitted before mic recording captures performance
      const playPromises = activeBackingTracks.map((tr) => {
        const resolvedUrl = resolvedAudioUrls[tr.id] || tr.audioUrl;
        if (
          resolvedUrl &&
          typeof resolvedUrl === 'string' &&
          resolvedUrl.trim() !== '' &&
          !resolvedUrl.endsWith('undefined') &&
          !resolvedUrl.startsWith('indexeddb:')
        ) {
          let el = trackAudioRefs.current[tr.id];
          if (!el) {
            el = new Audio(resolvedUrl || SILENT_AUDIO_URI);
            trackAudioRefs.current[tr.id] = el;
          }
          if (!el.src || !el.src.includes(resolvedUrl)) {
            el.src = resolvedUrl;
          }
          if (el.readyState === 0) {
            try {
              el.load();
            } catch {}
          }
          try {
            el.currentTime = 0;
          } catch {}
          return el.play().catch((e) => console.warn('Backing track playback notice:', e?.message || e));
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
        setRecordingTrackTime((prev) => prev + 1);
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
        tracks.forEach((tr) => {
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
        rawStream.getTracks().forEach((track) => track.stop());

        const rawAudioBlob = new Blob(trackAudioChunksRef.current, {
          type: 'audio/webm',
        });

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
              console.warn('Auto latency detection during overdub:', e);
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
          const file = new File([finalBlob], `track-${Date.now()}.wav`, {
            type: 'audio/wav',
          });
          const serverUrl = await uploadFileToServer(file);
          const trackName = newTrackName.trim() || `Pista ${tracks.length + 1}`;
          const instrument = newTrackInstrument.trim() || undefined;
          saveNewTrackToIdea(idea, serverUrl, trackName, instrument, totalLagToTrimMs);
        } catch (err) {
          console.error('Error uploading track recording:', err);
          alert('Error al guardar la nueva pista en el disco del servidor.');
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
      console.warn('Microphone access for overdub not available:', err?.message || err);
      alert('No se pudo acceder al micrófono para grabar la pista (' + (err?.message || 'comprueba los permisos del navegador') + ').');
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
      const masterTrack = tracks.find((t) => t.id !== track.id) || tracks[0];
      if (!masterTrack || masterTrack.id === track.id) {
        alert('Necesitas tener al menos otra pista de referencia en la mezcla para calcular la sincronización por IA.');
        return;
      }
      const masterUrl = await resolveAudioUrl(masterTrack.audioUrl);
      const trackBlob = await getAudioBlobFromUrl(track.audioUrl);

      const calculatedLagMs = await autoDetectAudioLatencyOffset(masterUrl, trackBlob);
      handleTrackDesfaseChange(idea, track.id, calculatedLagMs);
      alert(`⚡ ¡Sincronizado! Se detectó un desfase de +${calculatedLagMs}ms y se ajustó la pista.`);
    } catch (err) {
      console.error('Auto sync error:', err);
      alert('No se pudo calcular automáticamente la latencia. Puedes ajustarla manualmente.');
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
      const updatedTracks = tracks.map((t) => (t.id === track.id ? { ...t, audioUrl: serverUrl } : t));
      onUpdateSong(cancionConPistas(song, idea, updatedTracks));
    } catch (err) {
      console.error('Error cleaning track audio:', err);
      alert('No se pudo filtrar el ruido de la pista.');
    } finally {
      setCleaningTrackId(null);
    }
  };

  const handleUploadTrackFile = async (idea: SongAudioIdea, file: File) => {
    try {
      setIsUploading(true);
      const serverUrl = await uploadFileToServer(file);
      const fileNameClean = file.name ? file.name.replace(/\.[^/.]+$/, '') : '';
      const existingTracks = getIdeaTracks(idea);
      const trackName = newTrackName.trim() || fileNameClean || `Pista ${existingTracks.length + 1}`;
      const instrument = newTrackInstrument.trim() || undefined;
      saveNewTrackToIdea(idea, serverUrl, trackName, instrument);
    } catch (err) {
      alert('Error al procesar el archivo de audio de la pista.');
      console.error('Track upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const saveNewTrackToIdea = (
    idea: SongAudioIdea,
    audioUrl: string,
    customTrackName?: string,
    customInstrument?: string,
    initialDesfaseMs?: number
  ) => {
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
      desfaseMs: initialDesfaseMs ?? 0,
    };

    const updatedTracks = [...existingTracks, newTrack];
    onUpdateSong(cancionConPistas(song, idea, updatedTracks));

    // Reset overdub form
    setAddingTrackIdeaId(null);
    setNewTrackName('');
    setNewTrackInstrument('');
    setSelectedTrackFile(null);
  };

  const {
    showGenModalForIdea,
    setShowGenModalForIdea,
    genBpm,
    setGenBpm,
    genKey,
    setGenKey,
    genDuration,
    setGenDuration,
    includeDrums,
    setIncludeDrums,
    includeBass,
    setIncludeBass,
    drumStyle,
    setDrumStyle,
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
        rawStream.getTracks().forEach((track) => track.stop());

        const rawBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm',
        });
        try {
          setIsUploading(true);
          let finalBlob = rawBlob;
          if (useCleanDSPFilter) {
            finalBlob = await cleanAudioBlobOffline(rawBlob);
          }
          const file = new File([finalBlob], `recording-${Date.now()}.wav`, {
            type: 'audio/wav',
          });
          const url = await uploadFileToServer(file);
          setRecordedAudioUrl(url);
          resolveFn(url);
        } catch (err) {
          console.error('Error uploading mic recording:', err);
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
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone capture warning:', err?.message || err);
      alert('No se pudo acceder al micrófono (' + (err?.message || 'comprueba los permisos del navegador') + ').');
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
          console.warn('Error awaiting recording URL:', e);
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
          instrument: 'Tema Base',
        };
      }

      // Auto-generate title if user left title blank
      const sectionInfo = SECCIONES_TEMA.find((s) => s.key === ideaSection);
      const sectionLabel = sectionInfo?.label || ideaSection;
      const autoTitle = selectedAudioFile
        ? selectedAudioFile.name.replace(/\.[^/.]+$/, '')
        : useSongBaseTrack && primaryAudioUrl === selectedSongBaseUrl
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
          drumPattern: newIdeaStyle,
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
          instrument: parts.join(' + ') || 'IA Synth',
        };

        if (useSongBaseTrack && selectedSongBaseUrl) {
          createNewIdea(selectedSongBaseUrl, aiTrackInfo, finalTitle, secondaryBaseTrack);
        } else if (primaryAudioUrl) {
          createNewIdea(primaryAudioUrl, aiTrackInfo, finalTitle, secondaryBaseTrack);
        } else {
          createNewIdea(aiServerUrl, undefined, finalTitle, secondaryBaseTrack);
        }
        return;
      }

      if (!primaryAudioUrl) {
        alert(
          'Debes seleccionar un archivo de audio, cargar el Tema Original, grabar con el micrófono, pegar un enlace de Drive o activar la generación de Base IA para la primera pista de la idea.'
        );
        return;
      }

      createNewIdea(primaryAudioUrl, undefined, finalTitle, secondaryBaseTrack);
    } catch (err) {
      console.error('Error al guardar la idea de audio:', err);
      alert('Error al guardar la idea de audio.');
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
    const finalTitle =
      customTitle ||
      ideaTitle.trim() ||
      `Idea (${ideaSection.toUpperCase()}) ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

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
        autor: isPrimaryBaseTrack ? 'Tema Original' : ideaUploader || currentUsername,
        instrumento: isPrimaryBaseTrack ? 'Tema Base' : ideaInstrument.trim() || undefined,
        fecha: new Date().toISOString().split('T')[0],
        volumen: 1,
        muted: false,
      },
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
        muted: false,
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
        muted: false,
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
      comentarios: [],
    };

    const updatedIdeas = [newIdea, ...(song.audioIdeas || [])];
    onUpdateSong({
      ...cancionConIdeas(song, updatedIdeas),
      // CRITICAL: Preserve original song demo audio and never overwrite with an idea
      audioPrincipalUrl: song.audioPrincipalUrl,
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
    const updatedIdeas = (song.audioIdeas || []).map((idea) => {
      if (idea.id === ideaId) {
        const currentVotos = idea.votos || [];
        const hasVoted = currentVotos.includes(currentUsername);
        const newVotos = hasVoted ? currentVotos.filter((u) => u !== currentUsername) : [...currentVotos, currentUsername];
        return { ...idea, votos: newVotos };
      }
      return idea;
    });

    onUpdateSong(cancionConIdeas(song, updatedIdeas));
  };

  // Delete whole idea
  const handleDeleteIdea = (e?: React.MouseEvent, ideaId?: string, skipModal = false) => {
    if (e) e.stopPropagation();
    if (!ideaId) return;

    const executeDelete = () => {
      // Pause any playing audio
      if (playingIdeaId === ideaId) {
        const activeIdea = ideasList.find((i) => i.id === ideaId);
        if (activeIdea) {
          getIdeaTracks(activeIdea).forEach((tr) => {
            const el = trackAudioRefs.current[tr.id];
            if (el) el.pause();
          });
        }
        setPlayingIdeaId(null);
      }

      const updatedIdeas = (song.audioIdeas || []).filter((i) => i.id !== ideaId);

      onUpdateSong({
        ...cancionConIdeas(song, updatedIdeas),
        audioPrincipalUrl: song.audioPrincipalUrl,
      });
    };

    if (skipModal) {
      executeDelete();
      return;
    }

    const idea = (song.audioIdeas || []).find((i) => i.id === ideaId);
    setConfirmDeleteModal({
      title: 'Eliminar Idea de Audio',
      description: `¿Estás seguro de que deseas eliminar la idea "${idea?.titulo || 'sin título'}"? Se borrarán todas las pistas y comentarios asociados.`,
      onConfirm: executeDelete,
    });
  };

  // Duplica una idea (con todas sus pistas/stems) como una nueva versión independiente, para
  // probar un arreglo distinto sin tocar ni arriesgar la versión que ya está validada por la
  // banda. Empieza sin votos ni comentarios propios: es una idea nueva, no un historial compartido.
  const handleDuplicateIdea = (e: React.MouseEvent, ideaId: string) => {
    e.stopPropagation();
    const ideas = song.audioIdeas || [];
    const original = ideas.find((i) => i.id === ideaId);
    if (!original) return;

    const baseTitle = original.titulo.replace(/\s+\(v\d+\)$/i, '');
    const versionCount = ideas.filter((i) => i.titulo === baseTitle || i.titulo.startsWith(`${baseTitle} (v`)).length;
    const newIdeaId = `idea-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const clonedTracks: AudioTrack[] = getIdeaTracks(original).map((t, idx) => ({
      ...t,
      id: `${newIdeaId}-track-${idx + 1}`,
    }));

    const duplicated: SongAudioIdea = {
      ...original,
      id: newIdeaId,
      titulo: `${baseTitle} (v${versionCount + 1})`,
      pistas: clonedTracks,
      subidoPor: currentUsername,
      fecha: new Date().toLocaleDateString('es-ES'),
      votos: [],
      comentarios: [],
    };

    onUpdateSong(cancionConIdeas(song, [...ideas, duplicated]));
  };

  // Delete comment from idea
  const handleDeleteComment = (idea: SongAudioIdea, commentId: string) => {
    setConfirmDeleteModal({
      title: 'Eliminar Comentario',
      description: '¿Deseas eliminar este comentario?',
      onConfirm: () => {
        const updatedComments = (idea.comentarios || []).filter((c) => c.id !== commentId);
        const updatedIdeas = (song.audioIdeas || []).map((i) => (i.id === idea.id ? { ...i, comentarios: updatedComments } : i));
        onUpdateSong(cancionConIdeas(song, updatedIdeas));
      },
    });
  };

  // Tarjeta de una toma con su mezclador. El panel de Iris la reutiliza en modoIris: solo stems y mezclador, sin cabecera de idea.
  const renderIdeaCard = (idea: SongAudioIdea, opts?: { iris?: boolean }) => {
                    const modoIris = !!opts?.iris;
                    const isPlaying = playingIdeaId === idea.id;
                    const currentTime = currentTimeMap[idea.id] || 0;
                    const rawDuration = durationMap[idea.id];
                    const duration = rawDuration && !isNaN(rawDuration) && isFinite(rawDuration) && rawDuration > 0 ? rawDuration : 0;
                    const sectionInfo = SECCIONES_TEMA.find((s) => s.key === idea.seccion) || SECCIONES_TEMA[0];
                    const votes = idea.votos || [];
                    const hasVoted = votes.includes(currentUsername);
                    const tracks = getIdeaTracks(idea);
                    const isAddingTrack = addingTrackIdeaId === idea.id;
                    const isIdeaExpanded = modoIris || expandedIdeaIds.has(idea.id);

                    return (
                      <motion.div
                        key={idea.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.25 }}
                        className={`p-4 sm:p-5 rounded-[var(--r-l)] transition-ui space-y-4 ${
                          isPlaying
                            ? 'bg-[var(--tentative)]/5 ring-1 ring-[var(--acc)]/30'
                            : 'bg-[var(--ink)]/5 '
                        } hover:brightness-95`}
                      >
                        {/* Idea Header: solo lo esencial siempre visible — escuchar, ver de qué va, y un
 menú de"más opciones" para todo lo demás. El resto se revela al expandir. */}
                        <div className="flex items-center justify-between gap-2 pb-3">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            {!modoIris && (<button
                              type="button"
                              onClick={() => toggleIdeaExpanded(idea.id)}
                              title={isIdeaExpanded ? 'Plegar idea' : 'Expandir idea'}
                              className="p-1 rounded-[var(--r-pill)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--ink)]/10 transition-ui cursor-pointer shrink-0"
                            >
                              {isIdeaExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>)}
                            {!modoIris && (
                            <span className={`px-2.5 py-1 rounded-[var(--r-s)] text-xs font-sans font-bold shrink-0 ${sectionInfo.color}`}>
                              <ShowIcon inline emoji={sectionInfo.icon} /> {sectionInfo.label}
                            </span>
                            )}
                            <div className="min-w-0">
                              <h4 className="text-base font-bold text-[var(--ink)] flex items-center gap-2 flex-wrap">
                                {modoIris ? 'Pistas de la canción' : idea.titulo}
                                {esIdeaIris(idea) && (
                                  <span className="text-micro font-sans px-2 py-0.5 rounded bg-[var(--acc-soft)] text-[var(--acc-ink)] font-bold">
                                    Iris
                                  </span>
                                )}
                                <span className="text-micro font-sans px-2 py-0.5 rounded bg-[var(--tentative)]/20 text-[var(--tentative)] font-semibold">
                                  {tracks.length} {tracks.length === 1 ? 'pista' : 'pistas separadas'}
                                </span>
                                {isPlaying && (
                                  <div className="flex items-end gap-0.5 h-4 px-2 py-0.5 rounded bg-[var(--ok)]/20">
                                    <motion.span
                                      animate={{
                                        height: ['25%', '90%', '40%', '100%', '30%'],
                                      }}
                                      transition={{
                                        repeat: Infinity,
                                        duration: 0.6,
                                        ease: 'easeInOut',
                                      }}
                                      className="w-1 bg-[var(--ok)] rounded-[var(--r-pill)]"
                                    />
                                    <motion.span
                                      animate={{
                                        height: ['80%', '30%', '95%', '40%', '70%'],
                                      }}
                                      transition={{
                                        repeat: Infinity,
                                        duration: 0.7,
                                        ease: 'easeInOut',
                                      }}
                                      className="w-1 bg-[var(--ok)] rounded-[var(--r-pill)]"
                                    />
                                    <motion.span
                                      animate={{
                                        height: ['40%', '100%', '30%', '80%', '20%'],
                                      }}
                                      transition={{
                                        repeat: Infinity,
                                        duration: 0.5,
                                        ease: 'easeInOut',
                                      }}
                                      className="w-1 bg-[var(--ok)] rounded-[var(--r-pill)]"
                                    />
                                  </div>
                                )}
                              </h4>
                              {!modoIris && (
                              <span className="text-xs text-[var(--ink-2)] font-sans flex items-center gap-1 mt-0.5 truncate">
                                <UserIcon className="w-3 h-3 text-[var(--tentative)] shrink-0" />
                                {idea.subidoPor} {idea.instrumento ? `(${idea.instrumento})` : ''} • {idea.fecha}
                              </span>
                              )}
                            </div>
                          </div>

                          {/* Únicas acciones siempre visibles: escuchar, eliminar directo y el menú de más opciones */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              variant={isPlaying ? "primary" : "primary"}
                              size="sm"
                              type="button"
                              onClick={() => togglePlayIdea(idea)}
                              className="items-center justify-center"
                              title="Play / pausa"
                            >
                              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                            </Button>

                            {!modoIris && (
                            <IconButton
                              label="Eliminar idea"
                              variant="danger"
                              type="button"
                              onClick={(e) => handleDeleteIdea(e, idea.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </IconButton>
                            )}

                            {!modoIris && (<div className="relative">
                              <IconButton
                                label="Más opciones"
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenIdeaActionsMenuId(openIdeaActionsMenuId === idea.id ? null : idea.id);
                                }}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </IconButton>

                              {openIdeaActionsMenuId === idea.id && (
                                <PopoverAncla className="absolute right-0 top-full mt-2 w-56 bg-[var(--surface)] rounded-[var(--r-m)] p-1.5 z-50 space-y-1 text-xs font-sans">
                                  <MenuItem
                                    tone="muted"
                                    dense
                                    type="button"
                                    onClick={() => {
                                      setOpenIdeaActionsMenuId(null);
                                      handleShareIdea(idea);
                                    }}
                                  >
                                    <MessageSquare className="w-4 h-4 text-[var(--ok)]" /> Compartir por WhatsApp
                                  </MenuItem>
                                  <MenuItem
                                    dense
                                    type="button"
                                    onClick={() => {
                                      setOpenIdeaActionsMenuId(null);
                                      handleExportMasterMix(idea);
                                    }}
                                    disabled={isExportingMaster}
                                  >
                                    <Disc className={`w-4 h-4 text-[var(--tentative)] ${isExportingMaster ? 'animate-spin' : ''}`} />{' '}
                                    Exportar mezcla (.WAV)
                                  </MenuItem>
                                  <MenuItem
                                    tone="muted"
                                    dense
                                    type="button"
                                    onClick={(e) => {
                                      setOpenIdeaActionsMenuId(null);
                                      handleDuplicateIdea(e, idea.id);
                                    }}
                                  >
                                    <Copy className="w-4 h-4 text-[var(--ink-2)]" /> Duplicar como nueva versión
                                  </MenuItem>
                                  <MenuItem
                                    dense
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenIdeaActionsMenuId(null);
                                      setAiTrackGenPreview(null);
                                      setAiTrackGenError(null);
                                      setAiTrackGenStartOffsetSec(0);
                                      setShowAiTrackGenModal(idea);
                                    }}
                                  >
                                    <Wand2 className="w-4 h-4 text-[var(--tentative)]" /> Generar pista con IA
                                  </MenuItem>
                                  <MenuItem
                                    dense
                                    type="button"
                                    onClick={() => {
                                      setOpenIdeaActionsMenuId(null);
                                      setShowGenModalForIdea(idea);
                                      setGenBpm(song.bpm || 120);
                                      setGenKey(song.tonalidad || 'Do');
                                    }}
                                  >
                                    <Wand2 className="w-4 h-4 text-[var(--tentative)]" /> Base rítmica IA (batería/bajo)
                                  </MenuItem>
                                  <MenuItem
                                    tone="muted"
                                    dense
                                    type="button"
                                    onClick={(e) => {
                                      setOpenIdeaActionsMenuId(null);
                                      handleDeleteIdea(e, idea.id);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 text-[var(--alert)]" /> Eliminar idea
                                  </MenuItem>
                                </PopoverAncla>
                              )}
                            </div>)}
                          </div>
                        </div>

                        {isIdeaExpanded && (
                          <>
                            {!modoIris && idea.notas && (
                              <p className="text-xs text-[var(--ink-2)] italic bg-[var(--sunken)] p-2.5 rounded-[var(--r-m)]">
                                "{idea.notas}"
                              </p>
                            )}

                            {/* Separar Stems / Añadir Pista: se revelan solo al expandir la idea.
 Una vez ya hay stems separados,"Separar Stems" deja paso a"Comparar
 Motor" (en la cabecera del mezclador) — no hace falta tenerlo doblado aquí. */}
                            {!modoIris && (<div className="flex items-center gap-2 flex-wrap justify-end">
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
                                className="px-3 py-1.5 rounded-[var(--r-pill)] bg-[var(--tentative)] hover:bg-[var(--tentative)] text-[var(--on-tentative)] font-bold text-xs flex items-center gap-1.5 transition-ui active:scale-[0.97] cursor-pointer"
                                title="Grabar micrófono o subir otra pista de instrumento"
                              >
                                <Plus className="w-4 h-4" />
                                <span>+ Pista</span>
                              </button>
                            </div>)}

                            {/* MASTER MULTITRACK CONTROLS & TIMELINE */}
                            <div className="p-2.5 sm:p-3.5 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-2 sm:space-y-3">
                              {/* Streamlined Transport Toolbar */}
                              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
                                {/* Playback Controls */}
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                  {/* Play / Pause Toggle */}
                                  <Button
                                    variant={isPlaying ? "primary" : "primary"}
                                    size="sm"
                                    type="button"
                                    onClick={() => togglePlayIdea(idea)}
                                    className="items-center gap-2"
                                    title="Play / pausa (Espacio)"
                                  >
                                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                                    <span>{isPlaying ? 'Pausa' : 'Reproducir'}</span>
                                  </Button>

                                  {/* Stop / Rewind to 0:00 */}
                                  <IconButton
                                    label="Detener e ir al inicio (Atajo: 0 / Home)"
                                    type="button"
                                    onClick={() => handleStopIdea(idea)}
                                  >
                                    <Square className="w-4 h-4 fill-current text-[var(--alert)]" />
                                  </IconButton>

                                  {/* Loop Toggle */}
                                  {(() => {
                                    const loopCfg = loopConfigMap[idea.id];
                                    const isLoopEnabled = !!loopCfg?.enabled;
                                    return (
                                      <button
                                        type="button"
                                        onClick={() => toggleIdeaLoop(idea)}
                                        className={`px-2.5 py-1.5 rounded-[var(--r-pill)] font-sans text-xs font-bold flex items-center gap-1.5 transition-ui cursor-pointer ${
                                          isLoopEnabled
                                            ? 'bg-[var(--tentative)] text-[var(--on-tentative)] ring-1 ring-[var(--acc)]/50'
                                            : 'bg-[var(--ink)]/5 hover:bg-[var(--ink)]/10 text-[var(--ink-2)]'
                                        }`}
                                        title="Bucle ON/OFF (Atajo: L)"
                                      >
                                        <Repeat className="w-3.5 h-3.5" />
                                        <span>{isLoopEnabled ? 'Bucle ON' : 'Bucle'}</span>
                                      </button>
                                    );
                                  })()}
                                </div>

                                {/* Extra Tools & Stems Actions:"+ Base Rítmica IA" vive en el menú ⋮ de la
 idea (es una acción ocasional, no algo que hace falta tener siempre a mano) */}
                                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                  {!modoIris && selectedSongBaseUrl && !tracks.some((t) => t.audioUrl === selectedSongBaseUrl) && (
                                    <Button
                                      variant="neutral"
                                      size="xs"
                                      type="button"
                                      onClick={() => {
                                        saveNewTrackToIdea(idea, selectedSongBaseUrl, `🎵 Base: ${song.titulo} (Original)`, 'Tema Base');
                                      }}
                                      className="items-center gap-1.5"
                                      title="Cargar tema original como base"
                                    >
                                      <Disc className="w-3.5 h-3.5 text-[var(--acc)]" />
                                      <span>+ Base tema</span>
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Timeline status & counter */}
                              <div className="flex items-center justify-between text-xs font-sans text-[var(--ink-2)] pt-1">
                                <span className="text-[var(--ink-2)] font-bold flex items-center gap-1.5">
                                  {isPlaying ? (
                                    <span className="w-2 h-2 rounded-[var(--r-pill)] bg-[var(--ok)] " />
                                  ) : (
                                    <span className="w-2 h-2 rounded-[var(--r-pill)] bg-[var(--ink-3)]" />
                                  )}
                                  {isPlaying ? 'Reproduciendo...' : 'Detenido'}
                                </span>

                                <div className="text-[var(--ok)] font-bold font-sans">
                                  {formatTime(currentTime)} <span className="text-[var(--ink-2)]">/</span> {formatTime(duration)}
                                </div>
                              </div>

                              {/* Timeline Slider with Visual Cue Range Highlight */}
                              {(() => {
                                const loopCfg = loopConfigMap[idea.id];
                                const isLoopEnabled = !!loopCfg?.enabled;
                                const lStart = loopCfg?.start || 0;
                                const lEnd = loopCfg?.end && loopCfg.end > lStart ? loopCfg.end : duration || 30;
                                const dur = duration || 30;

                                return (
                                  <div className="relative w-full pt-1 pb-1">
                                    {/* Visual Cue Loop Region */}
                                    {dur > 0 && isLoopEnabled && (
                                      <div
                                        className="absolute top-1 bottom-1 bg-[var(--tentative)]/25 rounded pointer-events-none z-0"
                                        style={{
                                          left: `${Math.min(100, Math.max(0, (lStart / dur) * 100))}%`,
                                          width: `${Math.min(100, Math.max(1, ((lEnd - lStart) / dur) * 100))}%`,
                                        }}
                                      >
                                        <span className="absolute -top-3 left-0 text-micro font-sans text-[var(--tentative)] font-bold bg-[var(--tentative)]/5 px-1 rounded">
                                          Cue A
                                        </span>
                                        <span className="absolute -top-3 right-0 text-micro font-sans text-[var(--tentative)] font-bold bg-[var(--tentative)]/5 px-1 rounded">
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
                                      className="w-full accent-indigo-500 h-2 bg-[var(--surface)] rounded-[var(--r-s)] cursor-pointer relative z-10 opacity-90 hover:opacity-100"
                                    />
                                  </div>
                                );
                              })()}
                            </div>

                            {/* MINI DAW TRACK LIST MIXER */}
                            <div className="space-y-1.5 sm:space-y-2 bg-[var(--sunken)] p-2 sm:p-3 rounded-[var(--r-m)]">
                              {(() => {
                                const hasSoloInIdea = tracks.some((t) => t.solo);
                                return (
                                  <>
                                    <div className="flex items-center justify-between text-xs font-sans text-[var(--ink-2)] pb-1.5 flex-wrap gap-2">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="flex items-center gap-1.5 font-bold text-[var(--ink)]">
                                          <Sliders className="w-3.5 h-3.5 text-[var(--tentative)]" /> Mezclador de Pistas ({tracks.length})
                                        </span>
                                        {esIdeaIris(idea) && metaStems?.motor && (
                                          <span
                                            className={`hidden sm:flex px-2 py-0.5 rounded text-micro font-sans items-center gap-1 font-bold ${
                                              metaStems.degradado
                                                ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)]'
                                                : 'bg-[var(--tentative)]/5 text-[var(--ink)]'
                                            }`}
                                          >
                                            <span>Motor: {metaStems.motor.split('(')[0].trim()}</span>
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                        {tracks.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => setPracticeModeIdea(idea)}
                                            className="px-1.5 sm:px-2 py-0.5 rounded text-micro font-sans font-bold bg-[var(--ok)]/20 hover:bg-[var(--ok)]/30 text-[var(--ink)] flex items-center gap-1 transition-ui cursor-pointer"
                                            title="Practica con tu propia mezcla, velocidad y bucle sin tocar la mezcla de la banda"
                                          >
                                            <Headphones className="w-3 h-3" />
                                            <span className="hidden sm:inline">Sala de ensayo</span>
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => setShowMoisesStemsModal(idea)}
                                          className="px-1.5 sm:px-2 py-0.5 rounded text-micro font-sans font-bold bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--ink)] flex items-center gap-1 transition-ui cursor-pointer"
                                          title="Comparar calidad con otro motor de Iris o volver a separar"
                                        >
                                          <RefreshCw className="w-3 h-3" />
                                          <span className="hidden sm:inline">Comparar motor</span>
                                        </button>
                                        {hasSoloInIdea && (
                                          <span className="px-2 py-0.5 rounded text-micro font-sans font-bold bg-[var(--acc)] text-[var(--on-acc)] flex items-center gap-1/20/40">
                                            <Volume2 className="w-3 h-3" /> SOLO (S) ACTIVO
                                          </span>
                                        )}
                                        <span className="hidden sm:inline">Volumen y Mute</span>
                                      </div>
                                    </div>

                                    <div className="space-y-1.5 sm:space-y-2">
                                      {tracks.map((tr, idx) => {
                                        const isMuted = tr.muted;
                                        const isSolo = (tr as any).solo;
                                        const vol = tr.volumen ?? 1;
                                        const isEditing = editingTrackId === tr.id;

                                        const isDraggingThisTrack = draggedTrackInfo?.ideaId === idea.id && draggedTrackInfo.index === idx;
                                        const isDragOverThisTrack =
                                          dragOverTrackIndex === idx && draggedTrackInfo?.ideaId === idea.id && !isDraggingThisTrack;

                                        return (
                                          <div
                                            key={tr.id}
                                            onDragOver={(e) => {
                                              e.preventDefault();
                                              if (draggedTrackInfo?.ideaId === idea.id) setDragOverTrackIndex(idx);
                                            }}
                                            onDragLeave={() => setDragOverTrackIndex((prev) => (prev === idx ? null : prev))}
                                            onDrop={(e) => {
                                              e.preventDefault();
                                              handleDropTrack(idea, idx);
                                            }}
                                            className={`rounded-[var(--r-m)] overflow-hidden transition-ui ${
                                              isDraggingThisTrack
                                                ? 'opacity-30 scale-[0.98]'
                                                : isDragOverThisTrack
                                                  ? 'ring-2 ring-[var(--acc)]/50 bg-[var(--tentative)]/10'
                                                  : isMuted
                                                    ? 'bg-[var(--alert)]/5 opacity-50 grayscale-[30%]'
                                                    : isSolo
                                                      ? 'bg-[var(--acc)]/10 /80 ring-1 ring-[var(--acc)]/40 border-l-[var(--acc)]/30'
                                                      : hasSoloInIdea
                                                        ? 'bg-[var(--surface)] /80 opacity-40 grayscale-[50%]'
                                                        : 'bg-[var(--ink)]/5 '
                                            } hover:brightness-95`}
                                          >
                                            <div className="flex items-stretch">
                                              {/* Asa de arrastre grande, ocupa todo el alto de la fila — igual sistema
 (HTML5 drag nativo) que ya funciona en el repertorio, pero con un
 objetivo táctil mucho mayor que un icono suelto */}
                                              {tracks.length > 1 && (
                                                <div
                                                  draggable
                                                  onDragStart={() =>
                                                    setDraggedTrackInfo({
                                                      ideaId: idea.id,
                                                      index: idx,
                                                    })
                                                  }
                                                  onDragEnd={() => {
                                                    setDraggedTrackInfo(null);
                                                    setDragOverTrackIndex(null);
                                                  }}
                                                  className="w-7 shrink-0 flex items-center justify-center bg-[var(--sunken)] hover:bg-[var(--sunken)] active:bg-[var(--tentative)]/20 cursor-grab active:cursor-grabbing touch-none select-none"
                                                  title="Arrastrar para reordenar pista"
                                                >
                                                  <GripVertical className="w-4 h-4 text-[var(--ink-2)]" />
                                                </div>
                                              )}
                                              {/* Cubase-style compact row: name/controls sidebar left of the waveform on tablet/desktop; on mobile the sidebar becomes a bar above the waveform instead (too narrow to sit side by side) */}
                                              <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-stretch">
                                                {/* Sidebar: name + transport controls, 2 compact lines */}
                                                <div
                                                  className="w-full sm:w-[190px] shrink-0 flex flex-col justify-center gap-1 px-2 py-1 sm:border-b-0 sm:border-r bg-[var(--sunken)]"
                                                  title={tr.instrumento || undefined}
                                                >
                                                  {/* Line 1: number badge (coloreado por familia de instrumento, guiño a Iris) + name + edit */}
                                                  <div className="flex items-center gap-1 min-w-0">
                                                    <span
                                                      className="w-4 h-4 rounded font-sans text-micro font-bold flex items-center justify-center shrink-0"
                                                      style={{
                                                        backgroundColor: getTrackRainbowColor(tr, idx, '30'),
                                                        borderColor: getTrackRainbowColor(tr, idx, '80'),
                                                        color: getTrackRainbowColor(tr, idx),
                                                      }}
                                                    >
                                                      {idx + 1}
                                                    </span>

                                                    {isEditing ? (
                                                      <div className="flex items-center gap-1 min-w-0 flex-1">
                                                        <Input
                                                          size="sm"
                                                          type="text"
                                                          value={editingTrackName}
                                                          onChange={(e) => setEditingTrackName(e.target.value)}
                                                          onKeyDown={(e) =>
                                                            e.key === 'Enter' && handleSaveTrackName(idea, tr.id, editingTrackName)
                                                          }
                                                          className="w-full min-w-0"
                                                          autoFocus
                                                        />
                                                        <IconButton
                                                          label="Confirmar"
                                                          size="icon-xs"
                                                          type="button"
                                                          onClick={() => handleSaveTrackName(idea, tr.id, editingTrackName)}
                                                          className="shrink-0"
                                                        >
                                                          <Check className="w-3 h-3" />
                                                        </IconButton>
                                                      </div>
                                                    ) : (
                                                      <div className="flex items-center gap-1 min-w-0 flex-1">
                                                        <span className="text-xs font-bold text-[var(--ink)] font-sans truncate">
                                                          {tr.nombre}
                                                        </span>
                                                        <IconButton
                                                          label="Editar nombre de pista"
                                                          type="button"
                                                          onClick={() => {
                                                            setEditingTrackId(tr.id);
                                                            setEditingTrackName(tr.nombre);
                                                          }}
                                                          className="shrink-0"
                                                        >
                                                          <Edit2 className="w-2.5 h-2.5" />
                                                        </IconButton>
                                                      </div>
                                                    )}
                                                  </div>

                                                  {/* Line 2: M/S + volume + ajustes + delete */}
                                                  <div className="flex items-center gap-1">
                                                    <button
                                                      type="button"
                                                      onClick={() => handleToggleMuteTrack(idea, tr.id)}
                                                      className={`px-1.5 py-0.5 rounded text-micro font-sans font-bold cursor-pointer transition-ui shrink-0 ${
                                                        isMuted
                                                          ? 'bg-[var(--alert)] text-[var(--on-alert)] ring-1 ring-[var(--alert)]/50'
                                                          : 'bg-[var(--surface)]/80 text-[var(--ink-2)] /80 hover:text-[var(--ink)] hover:bg-[var(--surface)]/70'
                                                      }`}
                                                      title="Mute (M) - Silenciar pista"
                                                    >
                                                      M
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => handleToggleSoloTrack(idea, tr.id)}
                                                      className={`px-1.5 py-0.5 rounded text-micro font-sans font-bold cursor-pointer transition-ui shrink-0 ${
                                                        isSolo
                                                          ? 'bg-[var(--ink)] text-[var(--bg)] ring-1 ring-[var(--acc)]/60'
                                                          : 'bg-[var(--surface)]/80 text-[var(--ink-2)] /80 hover:text-[var(--ink)] hover:bg-[var(--surface)]/70'
                                                      }`}
                                                      title="Solo (S) - Aísla esta pista en exclusiva (Cubase style)"
                                                    >
                                                      S
                                                    </button>

                                                    {vol === 0 || isMuted ? (
                                                      <VolumeX className="w-2.5 h-2.5 text-[var(--alert)] shrink-0" />
                                                    ) : (
                                                      <Volume2 className="w-2.5 h-2.5 text-[var(--tentative)] shrink-0" />
                                                    )}
                                                    <input
                                                      type="range"
                                                      min={0}
                                                      max={1}
                                                      step={0.05}
                                                      value={isMuted ? 0 : vol}
                                                      onChange={(e) => handleTrackVolumeChange(idea, tr.id, parseFloat(e.target.value))}
                                                      className="flex-1 min-w-0 accent-indigo-500 h-1 bg-[var(--surface)] rounded cursor-pointer"
                                                      title={`Volumen: ${Math.round(vol * 100)}%`}
                                                    />

                                                    {/* Toggle Advanced Track Settings Drawer */}
                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        setExpandedTrackSettingsId(expandedTrackSettingsId === tr.id ? null : tr.id)
                                                      }
                                                      className={`relative p-1 rounded cursor-pointer transition-ui shrink-0 ${
                                                        expandedTrackSettingsId === tr.id
                                                          ? 'bg-[var(--tentative)]/30 text-[var(--ink)]'
                                                          : 'bg-[var(--ink)]/5 text-[var(--ink-2)] hover:bg-[var(--ink)]/10'
                                                      }`}
                                                      title={`Ajustes de Pista: Paneo, Ecualizador 3 Bandas y Ajuste de Latencia${(tr.desfaseMs || 0) !== 0 ? ` · ${formatDesfase(tr.desfaseMs)}` : ''}`}
                                                    >
                                                      <Sliders className="w-2.5 h-2.5 text-[var(--tentative)]/80" />
                                                      {(tr.desfaseMs || 0) !== 0 && (
                                                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-[var(--r-pill)] bg-[var(--acc)] ring-1 ring-[var(--ink)]" />
                                                      )}
                                                    </button>
                                                  </div>
                                                </div>

                                                {/* Waveform Visualizer: fills remaining width, height = row height */}
                                                <div className="w-full sm:flex-1 relative bg-[var(--sunken)]">
                                                  <WaveformTrack
                                                    ref={(el) => {
                                                      trackAudioRefs.current[tr.id] = el as HTMLAudioElement;
                                                    }}
                                                    audioUrl={resolvedAudioUrls[tr.id] || tr.audioUrl}
                                                    color={getTrackRainbowColor(tr, idx)}
                                                    masterDuration={duration || 30}
                                                    trackDuration={trackAudioRefs.current[tr.id]?.duration || durationMap[tr.id]}
                                                    currentTime={currentTime}
                                                    onSeekTrack={(seekSec) => handleSeekIdea(idea, seekSec)}
                                                    onTrackLoaded={(dur) => {
                                                      if (dur > 0 && isFinite(dur)) {
                                                        setDurationMap((prev) => {
                                                          const cur = prev[idea.id] || 0;
                                                          if (dur > cur)
                                                            return {
                                                              ...prev,
                                                              [idea.id]: dur,
                                                            };
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
                                              <div className="mt-1 p-3 rounded-[var(--r-m)] bg-[var(--tentative)]/5 space-y-3 font-sans text-micro text-[var(--tentative)]">
                                                {/* Row 1: Paneo Estéreo & Limpiar Zumbidos */}
                                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3/10 pb-2">
                                                  {/* Stereo Pan Slider */}
                                                  <div
                                                    className="flex items-center gap-2 flex-1 min-w-[200px]"
                                                    title={`Paneo: ${tr.pan ? (tr.pan < 0 ? `L ${Math.round(Math.abs(tr.pan) * 100)}%` : `R ${Math.round(tr.pan * 100)}%`) : 'Centro'}`}
                                                  >
                                                    <span className="text-[var(--ink-2)] font-bold shrink-0"><ShowIcon inline emoji="🎧" />Paneo Estéreo:</span>
                                                    <span className="text-micro font-bold text-[var(--ink-2)]">L</span>
                                                    <input
                                                      type="range"
                                                      min={-1}
                                                      max={1}
                                                      step={0.05}
                                                      value={tr.pan ?? 0}
                                                      onChange={(e) => handleTrackPanChange(idea, tr.id, parseFloat(e.target.value))}
                                                      className="w-full accent-purple-400 h-1 bg-[var(--sunken)] rounded cursor-pointer"
                                                    />
                                                    <span className="text-micro font-bold text-[var(--ink-2)]">R</span>
                                                    <span className="text-micro text-[var(--tentative)]/80 font-bold shrink-0 min-w-[36px] text-right">
                                                      {tr.pan
                                                        ? tr.pan < 0
                                                          ? `L${Math.round(Math.abs(tr.pan) * 100)}`
                                                          : `R${Math.round(tr.pan * 100)}`
                                                        : 'C'}
                                                    </span>
                                                  </div>

                                                  {/* Clean Noise Filter Button */}
                                                  <Button
                                                    variant={cleaningTrackId === tr.id ? "neutral" : "neutral"}
                                                    size="xs"
                                                    type="button"
                                                    onClick={() => handleCleanTrackAudio(idea, tr)}
                                                    disabled={cleaningTrackId === tr.id}
                                                    className="shrink-0 items-center gap-1"
                                                    title="Limpiar ruido de fondo y zumbidos de esta pista con Filtro Studio DSP (High-Pass 80Hz + Notch)"
                                                  >
                                                    <span>{cleaningTrackId === tr.id ? 'Limpiando...' : 'Filtro Zumbidos'}</span>
                                                  </Button>
                                                </div>

                                                {/* Row 2: 3-Band EQ */}
                                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3/10 pb-2">
                                                  <span className="text-[var(--ink-2)] font-bold shrink-0"><ShowIcon inline emoji="🎛️" />Ecualizador:</span>

                                                  <div className="flex-1 flex flex-col gap-1">
                                                    <div className="flex justify-between items-center text-[var(--ink-2)] text-micro">
                                                      <span>Graves (100Hz)</span>
                                                      <span className="font-bold text-[var(--tentative)]/80">{tr.eqLow || 0}dB</span>
                                                    </div>
                                                    <input
                                                      type="range"
                                                      min={-12}
                                                      max={12}
                                                      step={1}
                                                      value={tr.eqLow ?? 0}
                                                      onChange={(e) => handleTrackEqChange(idea, tr.id, 'low', parseFloat(e.target.value))}
                                                      className="w-full accent-purple-400 h-1 bg-[var(--sunken)] rounded cursor-pointer"
                                                    />
                                                  </div>

                                                  <div className="flex-1 flex flex-col gap-1">
                                                    <div className="flex justify-between items-center text-[var(--ink-2)] text-micro">
                                                      <span>Medios (1kHz)</span>
                                                      <span className="font-bold text-[var(--tentative)]/80">{tr.eqMid || 0}dB</span>
                                                    </div>
                                                    <input
                                                      type="range"
                                                      min={-12}
                                                      max={12}
                                                      step={1}
                                                      value={tr.eqMid ?? 0}
                                                      onChange={(e) => handleTrackEqChange(idea, tr.id, 'mid', parseFloat(e.target.value))}
                                                      className="w-full accent-purple-400 h-1 bg-[var(--sunken)] rounded cursor-pointer"
                                                    />
                                                  </div>

                                                  <div className="flex-1 flex flex-col gap-1">
                                                    <div className="flex justify-between items-center text-[var(--ink-2)] text-micro">
                                                      <span>Agudos (8kHz)</span>
                                                      <span className="font-bold text-[var(--tentative)]/80">{tr.eqHigh || 0}dB</span>
                                                    </div>
                                                    <input
                                                      type="range"
                                                      min={-12}
                                                      max={12}
                                                      step={1}
                                                      value={tr.eqHigh ?? 0}
                                                      onChange={(e) => handleTrackEqChange(idea, tr.id, 'high', parseFloat(e.target.value))}
                                                      className="w-full accent-purple-400 h-1 bg-[var(--sunken)] rounded cursor-pointer"
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
                                                      className="px-1.5 py-0.5 rounded bg-[var(--alert)]/20 hover:bg-[var(--alert)]/30 text-[var(--ink)] font-bold text-micro cursor-pointer shrink-0 self-end sm:self-center"
                                                      title="Resetear EQ a 0dB"
                                                    >
                                                      Reset EQ
                                                    </button>
                                                  )}
                                                </div>

                                                {/* Row 3: Latency Nudge & Sync IA */}
                                                <div className="space-y-1.5">
                                                  <div className="flex items-center justify-between gap-2">
                                                    <span
                                                      className="text-[var(--acc)] font-bold flex items-center gap-1"
                                                      title="Ajuste fino de latencia en milisegundos (-adelantar/+atrasar)"
                                                    >
                                                      <ShowIcon inline emoji="⏱️" />Desfase de Latencia:{' '}
                                                      <span className="text-[var(--ink)]">{formatDesfase(tr.desfaseMs)}</span>
                                                    </span>

                                                    <div className="flex items-center gap-1">
                                                      <button
                                                        type="button"
                                                        onClick={() => handleAutoSyncTrackLatency(idea, tr)}
                                                        className="px-2 py-0.5 rounded bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--ink)] font-bold cursor-pointer transition-colors flex items-center gap-1 text-micro"
                                                        title="Sincronizar automáticamente por IA/DSP comparando las ondas de sonido de la mezcla"
                                                      >
                                                        <ShowIcon inline emoji="⚡" />Sync Auto IA
                                                      </button>
                                                      {(tr.desfaseMs || 0) !== 0 && (
                                                        <button
                                                          type="button"
                                                          onClick={() => handleTrackDesfaseChange(idea, tr.id, 0)}
                                                          className="px-1.5 py-0.5 rounded bg-[var(--alert)]/20 hover:bg-[var(--alert)]/30 text-[var(--ink)] font-bold text-micro cursor-pointer"
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
                                                        className="px-1.5 py-0.5 rounded bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--ink)] font-bold text-micro cursor-pointer"
                                                      >
                                                        -10ms
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() => handleTrackDesfaseChange(idea, tr.id, (tr.desfaseMs || 0) - 1)}
                                                        className="px-1.5 py-0.5 rounded bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--ink)] font-bold text-micro cursor-pointer"
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
                                                      className="w-full max-w-xs h-1 bg-[var(--sunken)] rounded appearance-none cursor-pointer accent-amber-400 mx-2"
                                                      title="Deslizar para sincronizar desfase en tiempo real (-500ms a +500ms)"
                                                    />

                                                    <div className="flex items-center gap-1">
                                                      <button
                                                        type="button"
                                                        onClick={() => handleTrackDesfaseChange(idea, tr.id, (tr.desfaseMs || 0) + 1)}
                                                        className="px-1.5 py-0.5 rounded bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--ink)] font-bold text-micro cursor-pointer"
                                                      >
                                                        +1ms
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() => handleTrackDesfaseChange(idea, tr.id, (tr.desfaseMs || 0) + 10)}
                                                        className="px-1.5 py-0.5 rounded bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--ink)] font-bold text-micro cursor-pointer"
                                                      >
                                                        +10ms
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* Row 4: Reordenar / Borrar pista — acciones ocasionales, fuera de
 la fila principal para que no se pulsen sin querer */}
                                                <div className="flex items-center justify-between/10 pt-2">
                                                  <div className="flex items-center gap-1">
                                                    <span className="text-[var(--ink-2)] font-bold mr-1">Orden:</span>
                                                    <IconButton
                                                      label="Subir pista"
                                                      type="button"
                                                      onClick={() => handleMoveTrack(idea, tr.id, 'up')}
                                                      disabled={idx === 0}
                                                    >
                                                      <ChevronUp className="w-3.5 h-3.5" />
                                                    </IconButton>
                                                    <IconButton
                                                      label="Bajar pista"
                                                      type="button"
                                                      onClick={() => handleMoveTrack(idea, tr.id, 'down')}
                                                      disabled={idx === tracks.length - 1}
                                                    >
                                                      <ChevronDown className="w-3.5 h-3.5" />
                                                    </IconButton>
                                                  </div>
                                                  <Button
                                                    variant="danger"
                                                    size="xs"
                                                    type="button"
                                                    onClick={() => handleDeleteTrack(idea, tr.id)}
                                                    className="items-center gap-1.5"
                                                  >
                                                    <X className="w-3 h-3" /> Borrar pista
                                                  </Button>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}

                                      {/* CUBASE LIVE RECORDING TRACK ROW */}
                                      {isRecordingTrack && recordingTrackIdeaId === idea.id && (
                                        <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--alert)]/5 flex flex-col gap-2.5/10/60 ring-2 ring-[var(--alert)]/50">
                                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                                              <span className="w-6 h-6 rounded bg-[var(--alert)] text-[var(--on-alert)] font-sans text-xs font-bold flex items-center justify-center shrink-0 shadow">
                                                {tracks.length + 1}
                                              </span>
                                              <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <span className="text-xs font-bold text-[var(--ink)] font-sans">
                                                    {newTrackName.trim() || `Pista ${tracks.length + 1}`}
                                                  </span>
                                                  <span className="px-2 py-0.5 rounded bg-[var(--alert)] text-[var(--on-alert)] font-sans text-micro font-extrabold flex items-center gap-1 shadow">
                                                    <span className="w-2 h-2 rounded-[var(--r-pill)] bg-[var(--surface)] " /> GRABANDO
                                                    ONDAS EN DIRECTO…
                                                  </span>
                                                </div>
                                                <span className="text-micro font-sans text-[var(--alert)]/80 block mt-0.5">
                                                  Grabación estilo Cubase sobre la barra de la pista
                                                </span>
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                              <div className="text-sm font-sans font-bold text-[var(--alert)] bg-[var(--sunken)] px-3 py-1 rounded-[var(--r-s)] shadow">
                                                {formatTime(recordingTrackTime)}
                                              </div>

                                              <Button
                                                variant="danger"
                                                size="xs"
                                                type="button"
                                                onClick={stopRecordingTrackOverdub}
                                                className="items-center gap-1.5 shrink-0"
                                                title="Detener y guardar pista en la idea"
                                              >
                                                <Square className="w-3.5 h-3.5 fill-current" />
                                                <span>Detener y guardar</span>
                                              </Button>
                                            </div>
                                          </div>

                                          {/* Live Waveform Timeline Bar across the track lane */}
                                          <div className="w-full h-12 relative rounded bg-[var(--sunken)] p-0.5 overflow-hidden">
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
                              <div className="p-4 rounded-[var(--r-m)] bg-[var(--surface)]/20 space-y-3 animate-in fade-in duration-150">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-sans font-bold text-[var(--ink-2)] flex items-center gap-1.5">
                                    <Radio className="w-4 h-4 text-[var(--ink-2)]" />
                                    Añadir Nueva Pista (Overdub / Superponer Audio)
                                  </span>
                                  <IconButton
                                    label="Cerrar"
                                    type="button"
                                    onClick={() => setAddingTrackIdeaId(null)}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </IconButton>
                                </div>

                                <div className="p-3 rounded-[var(--r-s)] bg-[var(--sunken)] space-y-2">
                                  <div className="flex items-center gap-2 text-[var(--acc)]/70 text-xs font-semibold">
                                    <Headphones className="w-4 h-4 text-[var(--acc)] shrink-0" />
                                    <span>RECOMENDACIÓN MULTIPISTA ESTUDIO:</span>
                                  </div>
                                  <p className="text-micro text-[var(--ink-2)] leading-relaxed font-sans">
                                    Para evitar que el sonido de las pistas anteriores se cuele por el micrófono (acople de altavoces),{' '}
                                    <strong className="text-[var(--ink)]">utiliza auriculares para escuchar la mezcla</strong> mientras
                                    grabas la nueva pista.
                                  </p>

                                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-micro font-sans text-[var(--ink-2)] font-bold flex items-center gap-1">
                                      <ShieldCheck className="w-3.5 h-3.5 text-[var(--ok)]" /> Filtros Anti-Ruido Studio:
                                    </span>

                                    <div className="flex flex-wrap items-center gap-3 text-micro font-sans">
                                      <label className="flex items-center gap-1.5 cursor-pointer text-[var(--ink-2)] hover:text-[var(--ink)]">
                                        <input
                                          type="checkbox"
                                          checked={useCleanDSPFilter}
                                          onChange={(e) => setUseCleanDSPFilter(e.target.checked)}
                                          className="rounded accent-sky-500"
                                        />
                                        <span>Filtro DSP anti-Zumbido (high-Pass 80Hz + notch)</span>
                                      </label>

                                      <label className="flex items-center gap-1.5 cursor-pointer text-[var(--ink-2)] hover:text-[var(--ink)]">
                                        <input
                                          type="checkbox"
                                          checked={useEchoCancellation}
                                          onChange={(e) => setUseEchoCancellation(e.target.checked)}
                                          className="rounded accent-sky-500"
                                        />
                                        <span>Cancelación de Eco</span>
                                      </label>

                                      <div className="space-y-1.5 pt-1.5">
                                        <div className="flex items-center justify-between text-[var(--acc)]/70 font-bold text-micro flex-wrap gap-1">
                                          <span><ShowIcon inline emoji="⚡" />Recorte de Latencia Micro: {autoLatencyTrimMs} ms</span>
                                          <div className="flex items-center gap-1">
                                            <button
                                              type="button"
                                              onClick={() => setAutoLatencyTrimMs(120)}
                                              className={`px-1.5 py-0.5 rounded text-micro font-sans transition-colors ${autoLatencyTrimMs === 120 ? 'bg-[var(--ink)] text-[var(--bg)] font-bold' : 'bg-[var(--ink)]/10 hover:bg-[var(--ink)]/20 text-[var(--ink)]'}`}
                                              title="Recorte estándar para altavoces o auriculares de cable en PC (120ms)"
                                            >
                                              PC (120ms)
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setAutoLatencyTrimMs(240)}
                                              className={`px-1.5 py-0.5 rounded text-micro font-sans transition-colors ${autoLatencyTrimMs === 240 ? 'bg-[var(--ink)] text-[var(--bg)] font-bold' : 'bg-[var(--ink)]/10 hover:bg-[var(--ink)]/20 text-[var(--ink)]'}`}
                                              title="Recorte para teléfonos móviles y tablets (240ms)"
                                            >
                                              Móvil (240ms)
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setAutoLatencyTrimMs(300)}
                                              className={`px-1.5 py-0.5 rounded text-micro font-sans transition-colors ${autoLatencyTrimMs === 300 ? 'bg-[var(--ink)] text-[var(--bg)] font-bold' : 'bg-[var(--ink)]/10 hover:bg-[var(--ink)]/20 text-[var(--ink)]'}`}
                                              title="Recorte para auriculares bluetooth tipo airPods o sony (300ms)"
                                            >
                                              Bluetooth (300ms)
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setAutoLatencyTrimMs(0)}
                                              className={`px-1.5 py-0.5 rounded text-micro font-sans transition-colors ${autoLatencyTrimMs === 0 ? 'bg-[var(--alert)] text-[var(--on-alert)] font-bold' : 'bg-[var(--alert)]/20 text-[var(--ink)]'}`}
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
                                          className="w-full h-1.5 bg-[var(--surface)] rounded-[var(--r-s)] appearance-none cursor-pointer accent-amber-400"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-micro font-sans text-[var(--ink-2)] block mb-0.5">Nombre de la pista *</label>
                                    <Input
                                      size="sm"
                                      type="text"
                                      value={newTrackName}
                                      onChange={(e) => setNewTrackName(e.target.value)}
                                      placeholder="Ej: Voz Segunda / Solo Guitarra / Batería"
                                      className="w-full"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-micro font-sans text-[var(--ink-2)] block mb-0.5">Instrumento (Opcional)</label>
                                    <Input
                                      size="sm"
                                      type="text"
                                      value={newTrackInstrument}
                                      onChange={(e) => setNewTrackInstrument(e.target.value)}
                                      placeholder="Ej: Voz, Guitarra, Bajo, Teclado"
                                      className="w-full"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                  {/* Option 1: Live Mic Recording while backing tracks play */}
                                  <div className="p-3 rounded-[var(--r-m)] bg-[var(--sunken)] flex flex-col items-center justify-center gap-2">
                                    {!isRecordingTrack ? (
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        type="button"
                                        onClick={() => startRecordingTrackOverdub(idea)}
                                        className="items-center gap-2"
                                      >
                                        <Mic className="w-4 h-4" /> Grabar encima (Mic)
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="danger"
                                        size="sm"
                                        type="button"
                                        onClick={stopRecordingTrackOverdub}
                                        className="items-center gap-2"
                                      >
                                        <Square className="w-4 h-4 fill-current" />
                                        <span>Detener ({formatTime(recordingTrackTime)})</span>
                                      </Button>
                                    )}
                                  </div>

                                  {/* Option 2: Upload audio file */}
                                  <label
                                    className={`p-3 rounded-[var(--r-m)] bg-[var(--ink)]/5 hover:bg-[var(--ink)]/10 flex flex-col items-center justify-center gap-1 cursor-pointer transition-ui ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                                  >
                                    <Upload className={`w-5 h-5 text-[var(--ink-2)] ${isUploading ? 'animate-pulse' : ''}`} />
                                    <span className="text-xs font-semibold text-[var(--ink)]">
                                      {isUploading ? 'Subiendo pista...' : 'Subir Archivo de Pista'}
                                    </span>
                                    <span className="text-micro text-[var(--ink-2)]">MP3, WAV, M4A, WEBM, OGG</span>
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
                                        saveNewTrackToIdea(idea, selectedSongBaseUrl, `🎵 Base: ${song.titulo} (Original)`, 'Tema Base');
                                        setAddingTrackIdeaId(null);
                                      }}
                                      className="p-3 rounded-[var(--r-m)] bg-[var(--acc-soft)] hover:bg-[var(--acc-soft)] flex flex-col items-center justify-center gap-1 cursor-pointer transition-ui text-[var(--ink)] active:scale-[0.97]"
                                      title={`Importar la pista base del tema "${song.titulo}" directamente a esta mezcla multipista`}
                                    >
                                      <Disc className="w-5 h-5 text-[var(--acc)] animate-spin-slow" />
                                      <span className="text-xs font-bold text-center">Base tema original</span>
                                      <span className="text-micro text-[var(--acc)]/70 font-sans text-center">Usar "{song.titulo}"</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Upvote & Main Audio buttons */}
                            <div className="flex items-center justify-between gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => handleToggleVote(idea.id)}
                                className={`px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-sans font-bold flex items-center gap-1.5 transition-ui cursor-pointer ${
                                  hasVoted
                                    ? 'bg-[var(--ok)]/20 text-[var(--ink)]'
                                    : 'bg-[var(--ink)]/5 text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--ink)]/10'
                                }`}
                              >
                                <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-current' : ''}`} />
                                <span>Me gusta ({votes.length})</span>
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  // resolverAudioUrlParaSubida: si esta idea es una grabación reciente
                                  // aún no subida (blob:/indexeddb: local del navegador), la sube antes
                                  // de fijarla como maqueta — si no, la canción se quedaba con una URL
                                  // que ni el propio servidor puede llegar a descargar.
                                  const audioUrlPermanente = await resolverAudioUrlParaSubida(idea.audioUrl);
                                  onUpdateSong({
                                    ...song,
                                    audioPrincipalUrl: audioUrlPermanente,
                                  });
                                  alert(`"${idea.titulo}" establecida como Maqueta Principal del tema.`);
                                }}
                                className={`px-2.5 py-1.5 rounded-[var(--r-pill)] text-micro font-sans font-bold flex items-center gap-1 transition-ui cursor-pointer ${
                                  song.audioPrincipalUrl === idea.audioUrl
                                    ? 'bg-[var(--acc)]/20 text-[var(--ink)]'
                                    : 'bg-[var(--ink)]/5 text-[var(--ink-2)] hover:text-[var(--acc)]/70 hover:bg-[var(--ink)]/10'
                                }`}
                                title="Establecer esta idea como la maqueta principal del tema"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" />
                                <span>{song.audioPrincipalUrl === idea.audioUrl ? 'Maqueta Principal' : 'Hacer Maqueta Principal'}</span>
                              </button>
                            </div>

                            {/* Feedback & Comments Thread */}
                            <div className="space-y-2 pt-2">
                              <span className="text-xs font-sans text-[var(--ink-2)] flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-[var(--tentative)]" />
                                Comentarios y Críticas del Grupo ({(idea.comentarios || []).length})
                              </span>

                              {/* Comment items list */}
                              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                {(idea.comentarios || []).map((comm) => (
                                  <div
                                    key={comm.id}
                                    className="p-2 rounded-[var(--r-m)] bg-[var(--sunken)] text-xs flex items-start justify-between gap-2 group"
                                  >
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-[var(--tentative)]/80 font-sans">{comm.autor}:</span>
                                        {comm.instrumento && (
                                          <span
                                            className="px-1.5 py-0.5 rounded bg-[var(--ok)]/20 text-[var(--ink)] font-sans text-micro font-bold"
                                            title="Comentario referido a esta pista"
                                          >
                                            <ShowIcon inline emoji="🎚️" />{comm.instrumento}
                                          </span>
                                        )}
                                        {comm.timestampSegundos !== undefined && comm.timestampSegundos > 0 && (
                                          <button
                                            type="button"
                                            onClick={() => jumpToTime(idea, comm.timestampSegundos!)}
                                            className="px-1.5 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--ink)] font-sans text-micro font-bold hover:bg-[var(--acc)]/30 cursor-pointer"
                                          >
                                            <ShowIcon inline emoji="⏱️" />{formatTime(comm.timestampSegundos)}
                                          </button>
                                        )}
                                      </div>
                                      <p className="text-[var(--ink-2)] mt-0.5">{comm.texto}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="text-micro font-sans text-[var(--ink-2)]">{comm.fecha}</span>
                                      <IconButton
                                        label="Borrar comentario"
                                        variant="danger"
                                        size="icon-xs"
                                        type="button"
                                        onClick={() => handleDeleteComment(idea, comm.id)}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </IconButton>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Add comment input */}
                              <div className="flex items-center gap-2 pt-1 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCommentTimeTagMap((prev) => ({
                                      ...prev,
                                      [idea.id]: Math.floor(currentTime),
                                    }))
                                  }
                                  className="px-2 py-1 rounded-[var(--r-pill)] bg-[var(--ink)]/5 hover:bg-[var(--ink)]/10 text-micro font-sans text-[var(--acc)] font-bold whitespace-nowrap cursor-pointer"
                                  title="Añadir timestamp actual"
                                >
                                  <ShowIcon inline emoji="⏱️" />@ {formatTime(currentTime)}
                                </button>

                                {getIdeaTracks(idea).length > 1 && (
                                  <Select
                                    size="sm"
                                    value={commentTrackTagMap[idea.id] || ''}
                                    onChange={(e) =>
                                      setCommentTrackTagMap((prev) => ({
                                        ...prev,
                                        [idea.id]: e.target.value || null,
                                      }))
                                    }
                                    title="Referir este comentario a una pista concreta"
                                  >
                                    <option value="">General</option>
                                    {getIdeaTracks(idea).map((tr) => (
                                      <option key={tr.id} value={tr.instrumento || tr.nombre}>
                                        {tr.nombre}
                                      </option>
                                    ))}
                                  </Select>
                                )}

                                <Input
                                  size="sm"
                                  type="text"
                                  value={commentTextMap[idea.id] || ''}
                                  onChange={(e) =>
                                    setCommentTextMap((prev) => ({
                                      ...prev,
                                      [idea.id]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment(idea)}
                                  placeholder="Escribe tu crítica o sugerencia…"
                                  className="flex-1"
                                />

                                <IconButton
                                  label="Enviar"
                                  type="button"
                                  onClick={() => handleAddComment(idea)}
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </IconButton>
                              </div>
                            </div>
                          </>
                        )}
                      </motion.div>
                    );
  };

  return (
    <ModalPortal isOpen={true} onClose={onClose}>
      <div
        className={`fixed inset-0 z-[9999] bg-[var(--scrim)]/80 flex items-center justify-center overflow-y-auto overscroll-contain animate-in fade-in duration-200 ${
          isFullScreen ? 'p-0' : 'p-2 sm:p-4'
        }`}
      >
        {countInCountdown !== null && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[10000] bg-[var(--acc)]  text-[var(--on-acc)] font-sans font-bold px-6 py-3 rounded-[var(--r-l)] flex items-center gap-3">
            <span className="text-2xl"><ShowIcon inline emoji="🥁" /></span>
            <div className="text-sm">
              <div>PREPARANDO GRABACIÓN MULTIPISTA…</div>
              <div className="text-xs opacity-80 font-bold">Arranca en: ¡{countInCountdown}!</div>
            </div>
            <span className="text-3xl font-black ml-2 bg-[var(--sunken)] text-[var(--acc)] px-3.5 py-1 rounded-[var(--r-m)]">
              {countInCountdown}
            </span>
          </div>
        )}
        <div
          className={`w-full ${
            isFullScreen
              ? 'fixed inset-0 z-[9999] w-screen h-screen max-w-none max-h-none rounded-none m-0 shadow-none'
              : 'max-w-4xl rounded-[var(--r-l)] overflow-hidden my-auto max-h-[92vh]'
          } flex flex-col ${'bg-[var(--surface)] text-[var(--ink-2)]'}`}
        >
          {/* Header Bar */}
          <div className="p-2.5 sm:p-5 flex items-center justify-between bg-[var(--ink)]/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--acc)]  flex items-center justify-center text-[var(--on-acc)]">
                <Disc className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2
                    className="text-xl font-bold tracking-tight text-[var(--ink)]"
                    title={`⏱️ ${song.duracion} · 🎵 ${song.tonalidad} · ⚡ ${song.bpm} BPM${song.afinacion ? ` · 🎸 ${song.afinacion}` : ''}`}
                  >
                    {formatSongTitle(song.titulo)}
                  </h2>
                  <span className="text-micro font-sans px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/20 text-[var(--ink)] font-semibold">
                    {song.estadoTema || 'componiendo'}
                  </span>
                  {song.favoritoGeneral && (
                    <span className="text-[var(--acc)]" title="Tema favorito">
                      <Sparkles className="w-3.5 h-3.5 fill-[var(--acc)]" />
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
                    const levelInfo = READINESS_LEVELS.find((l) => l.value === myReadiness);
                    return (
                      <select data-raw
                        value={myReadiness || ''}
                        onChange={(e) => {
                          const val = e.target.value as ReadinessLevel;
                          if (!val) return;
                          onUpdateSong({
                            ...song,
                            notasPorMiembro: withMemberReadiness(song, myKey, myName, val),
                          });
                        }}
                        title="Tu nivel de preparación con esta canción, de cara al próximo bolo"
                        className={`hidden sm:inline-block px-2.5 py-1 rounded-[var(--r-m)] text-xs font-sans font-bold cursor-pointer outline-none ${
                          levelInfo ? levelInfo.colorClass : 'bg-[var(--ink)]/5 text-[var(--ink-2)]'
                        }`}
                      >
                        <option value="" disabled>
                          Mi preparación…
                        </option>
                        {READINESS_LEVELS.map((l) => (
                          <option key={l.value} value={l.value}>
                            <ShowIcon inline emoji={l.icon} /> {l.label}
                          </option>
                        ))}
                      </select>
                    );
                  })()}

                  {/* Menú Desplegable de Herramientas Secundarias */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowToolsMenu((prev) => !prev)}
                      className="px-3 py-1 rounded-[var(--r-pill)] text-xs font-sans font-bold flex items-center gap-1.5 transition-ui cursor-pointer bg-[var(--ink)]/10 hover:bg-[var(--ink)]/20 text-[var(--ink)]"
                      title="Herramientas y opciones del Estudio"
                    >
                      <Sliders className="w-3.5 h-3.5 text-[var(--tentative)]" />
                      <span>Herramientas <ShowIcon inline emoji="⚙️" /></span>
                    </button>

                    {showToolsMenu && (
                      <PopoverAncla className="absolute right-0 top-full mt-2 w-56 bg-[var(--surface)] rounded-[var(--r-m)] p-1.5 z-50 space-y-1 text-xs font-sans">
                        <MenuItem
                          tone="acc"
                          dense
                          type="button"
                          onClick={() => {
                            setShowToolsMenu(false);
                            onUpdateSong({
                              ...song,
                              favoritoGeneral: !song.favoritoGeneral,
                            });
                          }}
                        >
                          <Sparkles className={`w-4 h-4 text-[var(--acc)] ${song.favoritoGeneral ? 'fill-[var(--acc)]' : ''}`} />
                          {song.favoritoGeneral ? 'Quitar de Favoritos' : 'Marcar como Favorito'}
                        </MenuItem>
                        {/* Mi preparación: solo en móvil, en escritorio ya se ve en la cabecera */}
                        <div className="sm:hidden px-1 pb-1">
                          {(() => {
                            const myKey = currentUser?.id || currentUser?.username;
                            const myName = currentUser?.name || currentUser?.username || currentUsername;
                            const myReadiness = getMemberReadiness(song, myKey, myName);
                            const levelInfo = READINESS_LEVELS.find((l) => l.value === myReadiness);
                            return (
                              <Select
                                size="sm"
                                value={myReadiness || ''}
                                onChange={(e) => {
                                  const val = e.target.value as ReadinessLevel;
                                  if (!val) return;
                                  onUpdateSong({
                                    ...song,
                                    notasPorMiembro: withMemberReadiness(song, myKey, myName, val),
                                  });
                                }}
                                title="Tu nivel de preparación con esta canción, de cara al próximo bolo"
                                wrapperClassName="w-full"
                              >
                                <option value="" disabled>
                                  Mi preparación…
                                </option>
                                {READINESS_LEVELS.map((l) => (
                                  <option key={l.value} value={l.value}>
                                    <ShowIcon inline emoji={l.icon} /> {l.label}
                                  </option>
                                ))}
                              </Select>
                            );
                          })()}
                        </div>
                        <MenuItem
                          tone="acc"
                          dense
                          type="button"
                          onClick={() => {
                            setShowToolsMenu(false);
                            setShowChordsModal(true);
                          }}
                        >
                          <FileText className="w-4 h-4 text-[var(--acc)]" /> Acordes y Partitura
                        </MenuItem>
                        <MenuItem
                          dense
                          type="button"
                          onClick={() => {
                            setShowToolsMenu(false);
                            setShowAiComposerModal(true);
                          }}
                        >
                          <Sparkles className="w-4 h-4 text-[var(--tentative)]" /> Arreglos IA (músico virtual)
                        </MenuItem>
                        <MenuItem
                          dense
                          type="button"
                          onClick={() => {
                            setShowToolsMenu(false);
                            setShowAiMusicModal(true);
                          }}
                        >
                          <Sparkles className="w-4 h-4 text-[var(--tentative)]" /> Soundtrack IA (Lyria)
                        </MenuItem>
                        <MenuItem
                          tone="muted"
                          dense
                          type="button"
                          onClick={() => {
                            setShowToolsMenu(false);
                            setShowCubaseHelp(true);
                          }}
                        >
                          <Keyboard className="w-4 h-4 text-[var(--ink-2)]" /> Atajos teclado (Cubase)
                        </MenuItem>
                        <MenuItem
                          tone="muted"
                          dense
                          type="button"
                          onClick={() => {
                            setShowToolsMenu(false);
                            openTutorial();
                          }}
                        >
                          <Info className="w-4 h-4 text-[var(--ink-2)]" /> Guía rápida
                        </MenuItem>
                        <MenuItem
                          tone="muted"
                          dense
                          type="button"
                          onClick={() => {
                            setShowToolsMenu(false);
                            handleShareSong();
                          }}
                        >
                          <MessageSquare className="w-4 h-4 text-[var(--ok)]" /> Compartir tema por WhatsApp
                        </MenuItem>
                      </PopoverAncla>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Volumen master de salida — control personal de escucha, no se guarda en la canción */}
              <div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--r-m)] bg-[var(--ink)]/5"
                title="Volumen master de salida (solo tu escucha, no afecta a la mezcla de la banda)"
              >
                <button
                  type="button"
                  onClick={() => setMasterVolume((v) => (v > 0 ? 0 : 1))}
                  className="text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer shrink-0"
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
                <span className="text-micro font-sans text-[var(--ink-2)] w-8 text-right">{Math.round(masterVolume * 100)}%</span>
              </div>

              <button
                type="button"
                onClick={toggleIsFullScreen}
                className={`px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-sans font-bold flex items-center gap-1.5 transition-ui cursor-pointer ${
                  isFullScreen
                    ? 'bg-[var(--ink)] text-[var(--bg)] font-bold hover:bg-[var(--acc)]/60'
                    : 'bg-[var(--ink)]/10 hover:bg-[var(--ink)]/20 text-[var(--ink)]'
                }`}
                title={isFullScreen ? 'Salir de Pantalla Completa' : 'Poner Modo Studio en Pantalla Completa'}
              >
                {isFullScreen ? (
                  <>
                    <Minimize2 className="w-4 h-4 text-[var(--acc-ink)]" />
                    <span className="hidden sm:inline">Salir pantalla completa</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-4 h-4 text-[var(--acc)]" />
                    <span className="hidden sm:inline">Pantalla completa HD</span>
                  </>
                )}
              </button>

              <IconButton
                label="Cerrar"
                type="button"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </IconButton>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-2.5 sm:p-6 overflow-y-auto space-y-2.5 sm:space-y-6 flex-1">
            {/* Sleek Top Action Bar:"Atajos" y"Cargar Tema Original" viven ya en Herramientas
 y en el propio formulario de nueva idea — un único botón de acción aquí basta */}
            {/* Iris es de la canción, no de una toma: tiene su propia hoja (mezclador, motor, separar). Aquí solo la entrada */}
            <div className="flex items-center justify-between gap-3 p-2 sm:p-3 bg-[var(--acc-soft)] rounded-[var(--r-l)] flex-wrap">
              <span className="text-xs font-sans font-bold text-[var(--acc-ink)] flex items-center gap-1.5">
                <Cpu className="w-4 h-4" /> Iris · pistas de la canción
                {irisIdea && (
                  <span className="font-semibold text-[var(--ink-2)]">
                    {' '}
                    · {irisIdea.pistas?.length ?? 0} pistas
                    {metaStems?.motor ? ` · ${metaStems.motor.split('(')[0].trim()}` : ''}
                    {metaStems?.degradado ? ' (degradado)' : ''}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => (irisIdea ? setShowIrisPanel(true) : setShowMoisesStemsModal(fuenteIris))}
                disabled={!irisIdea && (isSeparatingStemsAi || !fuenteIris)}
                className="px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--acc)] hover:brightness-110 text-[var(--on-acc)] font-bold text-xs flex items-center gap-1.5 transition-ui cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Abrir Iris: mezclador y separación de pistas"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{isSeparatingStemsAi ? 'Separando...' : irisIdea ? 'Abrir Iris' : 'Separar con Iris'}</span>
              </button>
            </div>

            {/* Ideas: bloque propio, separado de Iris por aire (sin bordes) */}
            <div className="flex items-center justify-between gap-3 p-2 sm:p-3 bg-[var(--bg)]/80 rounded-[var(--r-l)]">
              <span className="text-xs font-sans font-bold text-[var(--ink-2)] flex items-center gap-1.5">
                <Music className="w-4 h-4 text-[var(--tentative)]" /> Ideas y grabaciones
              </span>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setShowAddIdea(true)}
                className="px-3.5 py-1.5 rounded-[var(--r-m)] bg-[var(--ok)] hover:brightness-110 text-[var(--on-ok)] font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-ui"
              >
                <Plus className="w-4 h-4" />
                <span>+ Grabar / subir idea</span>
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
                  <div className="p-5 rounded-[var(--r-l)] bg-[var(--ok-soft)] space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[var(--ink-2)] font-sans flex items-center gap-2">
                        <Mic className="w-4 h-4 text-[var(--ok)]" /> Aportar idea o arreglo de audio
                      </h4>
                      <IconButton label="Cerrar" type="button" onClick={() => setShowAddIdea(false)}>
                        <X className="w-4 h-4" />
                      </IconButton>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-sans text-[var(--ink-2)] block mb-1">Título de la idea / arreglo *</label>
                        <Input
                          size="sm"
                          type="text"
                          value={ideaTitle}
                          onChange={(e) => setIdeaTitle(e.target.value)}
                          placeholder="Ej: Riff Estribillo / Arreglo Vientos / Base Acústica"
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-sans text-[var(--ink-2)] block mb-1">Sección del tema *</label>
                        <Select size="sm" aria-label="Sección del tema"
                          value={ideaSection}
                          onChange={(e) => setIdeaSection(e.target.value as any)}
                          wrapperClassName="w-full"
                        >
                          {SECCIONES_TEMA.map((sec) => (
                            <option key={sec.key} value={sec.key} className="bg-[var(--bg)] text-[var(--ink)]">
                              {sec.icon} {sec.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-sans text-[var(--ink-2)] block mb-1">Aportado por (Tu nombre)</label>
                        <Input size="sm" aria-label="Aportado por (Tu nombre)"
                          type="text"
                          value={ideaUploader}
                          onChange={(e) => setIdeaUploader(e.target.value)}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-sans text-[var(--ink-2)] block mb-1">Instrumento / rol (Opcional)</label>
                        <Input
                          size="sm"
                          type="text"
                          value={ideaInstrument}
                          onChange={(e) => setIdeaInstrument(e.target.value)}
                          placeholder="Ej: Guitarra, Trompeta, Batería, Voz"
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Source Selector */}
                    <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3">
                      <span className="text-xs font-sans font-bold text-[var(--ink-2)] block">
                        Fuente de Audio Principal / Base Rítmica:
                      </span>

                      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5 [&>*]:min-w-0">
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
                          className={`p-3 rounded-[var(--r-m)] flex flex-col items-center justify-center gap-1 cursor-pointer transition-ui text-center ${
                            useSongBaseTrack
                              ? 'bg-[var(--acc-soft)] text-[var(--ink)] ring-1 ring-[var(--acc)]/60'
                              : 'bg-[var(--acc-soft)]/50 text-[var(--acc-ink)] hover:bg-[var(--acc-soft)]'
                          }`}
                        >
                          <Disc className={`w-5 h-5 text-[var(--acc)] ${useSongBaseTrack ? 'animate-spin-slow' : ''}`} />
                          <span className="text-xs font-bold text-center">Tema original</span>
                          <span className="text-micro text-[var(--acc)]/70 text-center font-sans">
                            {useSongBaseTrack ? '✓ Base Cargada' : `Usar "${song.titulo}"`}
                          </span>
                        </button>

                        {/* Option 2: File Upload */}
                        <label className="p-3 rounded-[var(--r-m)] bg-[var(--ink)]/5 hover:bg-[var(--ink)]/10 flex flex-col items-center justify-center gap-1 cursor-pointer transition-ui">
                          <Upload className="w-5 h-5 text-[var(--ok)]" />
                          <span className="text-xs font-semibold text-[var(--ink)] text-center w-full truncate" title={selectedAudioFile?.name}>
                            {selectedAudioFile ? selectedAudioFile.name : 'Subir Archivo'}
                          </span>
                          <span className="text-micro text-[var(--ink-2)]">MP3, WAV, M4A</span>
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
                        <div className="p-3 rounded-[var(--r-m)] bg-[var(--ink)]/5 flex flex-col items-center justify-center gap-2">
                          {!isRecording ? (
                            <Button
                              variant="danger"
                              size="xs"
                              type="button"
                              onClick={startRecording}
                              className="items-center gap-1.5 w-full justify-center whitespace-nowrap"
                            >
                              <Mic className="w-3.5 h-3.5 shrink-0" /> Grabar micro
                            </Button>
                          ) : (
                            <div className="w-full space-y-2">
                              <button
                                type="button"
                                onClick={stopRecording}
                                className="w-full px-2.5 py-1.5 rounded-[var(--r-s)] bg-[var(--alert)] hover:bg-[var(--alert)] text-[var(--on-alert)] font-bold text-xs flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                              >
                                <ShowIcon inline emoji="⏹️" />Detener ({formatTime(recordingTime)})
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
                            <span className="text-micro text-[var(--ok)] font-sans font-bold text-center">✓ Grabación lista</span>
                          )}
                        </div>

                        {/* Drive Link */}
                        <div className="p-3 rounded-[var(--r-m)] bg-[var(--ink)]/5 flex flex-col justify-center gap-1">
                          <span className="text-micro font-sans font-bold text-[var(--acc)]/70 flex items-center gap-1 min-w-0">
                            <Music className="w-3 h-3 text-[var(--acc)] shrink-0" /> <span className="truncate">Enlace Google Drive:</span>
                          </span>
                          <Input
                            size="sm"
                            type="text"
                            value={driveAudioUrl}
                            onChange={(e) => {
                              setDriveAudioUrl(e.target.value);
                              setSelectedAudioFile(null);
                              setRecordedAudioUrl(null);
                            }}
                            placeholder="https://drive.google.com/…"
                            className="w-full"
                          />
                        </div>

                        {/* AI Base Generator Card */}
                        <button
                          type="button"
                          onClick={() => setGenAiOnNewIdea(!genAiOnNewIdea)}
                          className={`p-3 rounded-[var(--r-m)] flex flex-col items-center justify-center gap-1 cursor-pointer transition-ui text-center ${
                            genAiOnNewIdea
                              ? 'bg-[var(--tentative)]/15 text-[var(--tentative)] ring-1 ring-[var(--tentative)]/50'
                              : 'bg-[var(--tentative)]/5 text-[var(--ink)] hover:bg-[var(--tentative)]/10'
                          }`}
                        >
                          <Wand2 className="w-5 h-5 text-[var(--tentative)]" />
                          <span className="text-xs font-bold text-center">Base IA (Batería + bajo)</span>
                          <span className="text-micro text-[var(--tentative)]/80 text-center font-sans">
                            {genAiOnNewIdea ? '✓ Activado' : 'Generar Sintética'}
                          </span>
                        </button>
                      </div>

                      {/* ORIGINAL SONG BASE TRACK BANNER & SELECTOR */}
                      {useSongBaseTrack && (
                        <div className="mt-3 p-3.5 rounded-[var(--r-m)] bg-[var(--acc-soft)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-sans text-[var(--ink)] animate-in fade-in duration-150">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-[var(--r-s)] bg-[var(--acc)]/20 text-[var(--ink)] shrink-0">
                              <Disc className="w-5 h-5 animate-spin-slow" />
                            </div>
                            <div>
                              <span className="font-bold text-[var(--ink)] block text-sm">Pista base creada sobre: "{song.titulo}"</span>
                              <span className="text-micro text-[var(--acc)]/70 block mt-0.5 font-sans">
                                {selectedAudioFile || recordedAudioUrl || driveAudioUrl
                                  ? 'Se cargará el tema original como Pista Base de fondo para sonar sincronizado junto a tu idea/grabación.'
                                  : 'Se cargará la pista original en la idea para que puedas usar el botón "+ Pista" o "Grabar encima (Mic)" e improvisar sobre el tema.'}
                              </span>
                            </div>
                          </div>

                          {((song.audioIdeas && song.audioIdeas.length > 0) || song.audioPrincipalUrl) && (
                            <div className="flex items-center gap-2 min-w-0 bg-[var(--sunken)] p-2 rounded-[var(--r-m)] w-full sm:w-auto sm:max-w-[60%]">
                              <span className="text-micro text-[var(--acc)] font-bold shrink-0 whitespace-nowrap">Seleccionar Maqueta:</span>
                              <Select
                                size="sm"
                                value={selectedSongBaseUrl}
                                onChange={(e) => setSelectedSongBaseUrl(e.target.value)}
                                wrapperClassName="flex-1 min-w-0"
                              >
                                {song.audioPrincipalUrl && <option value={song.audioPrincipalUrl}>Tema Original ({song.titulo})</option>}
                                {song.audioIdeas?.map((idItem) => (
                                  <option key={idItem.id} value={idItem.audioUrl}>
                                    Idea: {idItem.titulo} ({idItem.seccion})
                                  </option>
                                ))}
                              </Select>
                            </div>
                          )}
                        </div>
                      )}

                      {/* AI ACCOMPANIMENT GENERATION CONTROLS ON NEW IDEA */}
                      {genAiOnNewIdea && (
                        <div className="mt-3 bg-[var(--tentative)]/5 p-3.5 rounded-[var(--r-m)] space-y-3 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-sans font-bold text-[var(--tentative)]/80 flex items-center gap-1.5">
                              Ajustes de la base IA (Batería + bajo)
                            </span>
                            <span className="text-micro font-sans text-[var(--ink)] bg-[var(--tentative)]/10 px-2 py-0.5 rounded">
                              {selectedAudioFile || recordedAudioUrl || driveAudioUrl
                                ? 'Se añadirá como Pista 2'
                                : 'Será la Pista Principal'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div>
                              <label className="text-micro font-sans text-[var(--ink-2)] block mb-0.5">Estilo Rítmico</label>
                              <Select size="sm" aria-label="Estilo Rítmico"
                                value={newIdeaStyle}
                                onChange={(e) => setNewIdeaStyle(e.target.value as any)}
                                wrapperClassName="w-full"
                              >
                                <option value="rock">Rock / pop standard</option>
                                <option value="pop">Pop / Disco 4-on-floor</option>
                                <option value="funk">Funk Syncopated</option>
                                <option value="reggae">Reggae One-Drop</option>
                                <option value="ska">Ska Skank</option>
                                <option value="cumbia">Cumbia Tresillo</option>
                                <option value="punk">Punk Corcheas</option>
                              </Select>
                            </div>

                            <div>
                              <label className="text-micro font-sans text-[var(--ink-2)] block mb-0.5">Tempo (BPM)</label>
                              <Input size="sm" aria-label="Tempo (BPM)"
                                type="number"
                                value={newIdeaBpm}
                                onChange={(e) => setNewIdeaBpm(parseInt(e.target.value) || 120)}
                                className="w-full"
                              />
                            </div>

                            <div>
                              <label className="text-micro font-sans text-[var(--ink-2)] block mb-0.5">Tonalidad base</label>
                              <Input
                                size="sm"
                                type="text"
                                value={newIdeaKey}
                                onChange={(e) => setNewIdeaKey(e.target.value)}
                                className="w-full"
                                placeholder="Do, Re, Mi…"
                              />
                            </div>

                            <div className="sm:col-span-3 flex flex-wrap items-center justify-between gap-3 text-xs font-sans text-[var(--ink-2)] pt-1">
                              <div className="flex flex-wrap items-center gap-4">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={newIdeaIncludeDrums}
                                    onChange={(e) => setNewIdeaIncludeDrums(e.target.checked)}
                                    className="accent-purple-500"
                                  />
                                  <span><ShowIcon inline emoji="🥁" />Batería Synth</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={newIdeaIncludeBass}
                                    onChange={(e) => setNewIdeaIncludeBass(e.target.checked)}
                                    className="accent-purple-500"
                                  />
                                  <span><ShowIcon inline emoji="🎸" />Bajo</span>
                                </label>
                              </div>

                              <span className="text-micro text-[var(--tentative)]/80 italic">
                                <ShowIcon inline emoji="⚡" />Se sintetizará un bucle rítmico automático al guardar la idea.
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-sans text-[var(--ink-2)] block mb-1">Notas o explicación para el grupo</label>
                      <Textarea
                        value={ideaNotes}
                        onChange={(e) => setIdeaNotes(e.target.value)}
                        placeholder="Explica qué has grabado o la propuesta…"
                        rows={2}
                        className="w-full"
                      />
                    </div>

                    {/* Status Indicator of Primary Audio Track */}
                    <div className="p-3 rounded-[var(--r-m)] bg-[var(--sunken)] flex flex-wrap items-center justify-between gap-2 font-sans text-xs text-[var(--ink-2)]">
                      <span className="font-bold flex items-center gap-1.5 text-[var(--tentative)]/80">
                        <Disc className="w-4 h-4 text-[var(--tentative)]" /> Pista 1 de la Idea:
                      </span>
                      <div>
                        {selectedAudioFile ? (
                          <span className="text-[var(--ok)] font-bold flex items-center gap-1">
                            <Check className="w-4 h-4" /> Archivo: {selectedAudioFile.name}
                          </span>
                        ) : isRecording ? (
                          <span className="text-[var(--alert)] font-bold flex items-center gap-1">
                            <Mic className="w-4 h-4" /> Grabando micro ({Math.floor(recordingTime / 60)}:
                            {String(recordingTime % 60).padStart(2, '0')})…
                          </span>
                        ) : recordedAudioUrl ? (
                          <span className="text-[var(--ok)] font-bold flex items-center gap-1">
                            <Check className="w-4 h-4" /> Grabación de micrófono lista ({recordingTime}s)
                          </span>
                        ) : driveAudioUrl.trim() ? (
                          <span className="text-[var(--acc)] font-bold flex items-center gap-1">
                            <Check className="w-4 h-4" /> Google Drive vinculado
                          </span>
                        ) : useSongBaseTrack && selectedSongBaseUrl ? (
                          <span className="text-[var(--acc)]/70 font-bold flex items-center gap-1">
                            <Disc className="w-4 h-4 text-[var(--acc)] animate-spin-slow" /> Base: Tema Original ({song.titulo})
                          </span>
                        ) : genAiOnNewIdea ? (
                          <span className="text-[var(--tentative)]/80 font-bold flex items-center gap-1">
                            Base IA ({newIdeaStyle.toUpperCase()} - {newIdeaKey})
                          </span>
                        ) : (
                          <span className="text-[var(--acc)]/90 italic text-xs">
                            <ShowIcon inline emoji="⚠️" />Selecciona un archivo, carga el Tema Original, graba con el micro o activa Base IA
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="neutral"
                        size="sm"
                        type="button"
                        onClick={() => setShowAddIdea(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        type="button"
                        onClick={handleSaveIdea}
                        disabled={isUploading}
                      >
                        {isUploading ? 'Guardando en Servidor...' : 'Guardar Idea'}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Ideas Audio Feed */}
            {tomas.length === 0 ? (
              <div className="p-8 rounded-[var(--r-l)] text-center space-y-3">
                <Sparkles className="w-8 h-8 text-[var(--ink-2)] mx-auto" />
                <p className="text-sm text-[var(--ink-2)] font-sans">
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
                  className="px-4 py-2 rounded-[var(--r-pill)] bg-[var(--ink)]/10 hover:bg-[var(--ink)]/20 text-xs text-[var(--ink)] font-bold transition-ui cursor-pointer"
                >
                  + Grabar / Subir la primera idea
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <AnimatePresence>
                  {tomas.map((toma) => renderIdeaCard(toma))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Mini-transporte fijo: reproducir/pausar la idea activa sin tener que volver a subir
 hasta la cabecera cuando estás abajo del todo viendo las últimas pistas */}
          {(() => {
            const ideas = song.audioIdeas || [];
            const activeIdea =
              ideas.find((i) => i.id === playingIdeaId) ||
              (expandedIdeaIds.size === 1 ? ideas.find((i) => expandedIdeaIds.has(i.id)) : undefined);
            if (!activeIdea) return null;
            const isPlaying = playingIdeaId === activeIdea.id;
            const curTime = currentTimeMap[activeIdea.id] || 0;
            const dur = durationMap[activeIdea.id] || 0;
            return (
              <div className=" bg-[var(--bg)]/95 px-3 sm:px-4 py-2 flex items-center gap-3">
                <Button
                  variant={isPlaying ? "primary" : "primary"}
                  type="button"
                  onClick={() => togglePlayIdea(activeIdea)}
                  className="items-center justify-center shrink-0"
                  title="Play / pausa"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </Button>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[var(--ink)] truncate">{activeIdea.titulo}</p>
                  <p className="text-micro font-sans text-[var(--ink-2)]">
                    {formatTime(curTime)} <span className="text-[var(--ink-2)]">/</span> {formatTime(dur)}
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

        {/* HOJA DE IRIS: módulo propio de la canción, fuera del estudio de ideas */}
        {showIrisPanel && (
          <ModalPortal isOpen onClose={() => setShowIrisPanel(false)}>
            <div className="fixed inset-0 z-[10001] bg-[var(--scrim)]/85 flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-label="Iris, pistas de la canción">
              <div className="bg-[var(--surface)] rounded-t-[var(--r-xl)] sm:rounded-[var(--r-xl)] w-full max-w-3xl max-h-[92vh] overflow-y-auto p-3 sm:p-6 space-y-4 text-[var(--ink)]">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[var(--acc)]" /> Iris · {song.titulo}
                    {metaStems?.motor && (
                      <span className="text-xs font-semibold text-[var(--ink-2)]">
                        {metaStems.motor.split('(')[0].trim()}{metaStems.degradado ? ' (degradado)' : ''}
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowMoisesStemsModal(irisIdea ?? fuenteIris)}
                      disabled={isSeparatingStemsAi || !fuenteIris}
                      className="px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--acc)] hover:brightness-110 text-[var(--on-acc)] font-bold text-xs flex items-center gap-1.5 transition-ui cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Elegir pistas y motor (Iris Studio, Iris Cloud o Iris Básico)"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>{isSeparatingStemsAi ? 'Separando...' : irisIdea ? 'Volver a separar' : 'Separar con Iris'}</span>
                    </button>
                    <IconButton label="Cerrar Iris" type="button" onClick={() => setShowIrisPanel(false)}>
                      <X className="w-5 h-5" />
                    </IconButton>
                  </div>
                </div>
                {irisIdea ? (
                  <div className="space-y-6">{renderIdeaCard(irisIdea, { iris: true })}</div>
                ) : (
                  <p className="text-sm text-[var(--ink-2)]">Aún no hay pistas. Separa la canción con Iris y aparecerán aquí.</p>
                )}
              </div>
            </div>
          </ModalPortal>
        )}

        {/* CHORDS & SUBSTITUTE GUIDE VIEWER OVERLAY */}
        {showChordsModal && <Atril cancion={song} modo="Estudiar" onClose={() => setShowChordsModal(false)} onUpdateSong={onUpdateSong} />}

        {/* CUBASE KEYBOARD SHORTCUTS CHEAT SHEET MODAL */}
        {showCubaseHelp && (
          <div className="fixed inset-0 z-[9999] bg-[var(--scrim)]/85 flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] rounded-[var(--r-l)] max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 text-[var(--ink)] relative">
              <IconButton
                label="Cerrar"
                type="button"
                onClick={() => setShowCubaseHelp(false)}
                className="absolute top-4 right-4"
              >
                <X className="w-5 h-5" />
              </IconButton>

              <div className="flex items-center gap-3/20 pb-4">
                <div className="p-3 rounded-[var(--r-m)] bg-[var(--tentative)]/20 text-[var(--tentative)]">
                  <Keyboard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--ink)] flex items-center gap-2">
                    Atajos de teclado tipo Cubase DAW
                    <span className="text-micro font-sans px-2 py-0.5 rounded bg-[var(--tentative)]/30 text-[var(--ink)]">
                      Modo Studio
                    </span>
                  </h3>
                  <p className="text-xs text-[var(--ink-2)]">
                    Controla la reproducción y grabación multipista directamente con tu teclado en tiempo real.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
                <div className="p-3 rounded-[var(--r-m)] bg-[var(--ink)]/5 flex items-center justify-between">
                  <span className="text-[var(--ink-2)]">Play / pausa</span>
                  <kbd className="px-2 py-1 rounded bg-[var(--sunken)] text-[var(--tentative)]/80 font-bold shadow">Espacio</kbd>
                </div>

                <div className="p-3 rounded-[var(--r-m)] bg-[var(--ink)]/5 flex items-center justify-between">
                  <span className="text-[var(--ink-2)]">Pausar Mantenida</span>
                  <kbd className="px-2 py-1 rounded bg-[var(--sunken)] text-[var(--acc-ink)] font-bold shadow">P</kbd>
                </div>

                <div className="p-3 rounded-[var(--r-m)] bg-[var(--ink)]/5 flex items-center justify-between">
                  <span className="text-[var(--ink-2)]">Detener e ir a inicio (Stop)</span>
                  <kbd className="px-2 py-1 rounded bg-[var(--sunken)] text-[var(--ink-2)] font-bold shadow">0 / Stop / Home</kbd>
                </div>

                <div className="p-3 rounded-[var(--r-m)] bg-[var(--ink)]/5 flex items-center justify-between">
                  <span className="text-[var(--ink-2)]">Alternar bucle (Loop ON/OFF)</span>
                  <kbd className="px-2 py-1 rounded bg-[var(--sunken)] text-[var(--tentative)]/80 font-bold shadow">L / /</kbd>
                </div>

                <div className="p-3 rounded-[var(--r-m)] bg-[var(--ink)]/5 flex items-center justify-between">
                  <span className="text-[var(--ink-2)]">Fijar cue In (inicio bucle)</span>
                  <kbd className="px-2 py-1 rounded bg-[var(--sunken)] text-[var(--tentative)]/80 font-bold shadow">I</kbd>
                </div>

                <div className="p-3 rounded-[var(--r-m)] bg-[var(--ink)]/5 flex items-center justify-between">
                  <span className="text-[var(--ink-2)]">Fijar cue out (fin bucle)</span>
                  <kbd className="px-2 py-1 rounded bg-[var(--sunken)] text-[var(--tentative)]/80 font-bold shadow">O</kbd>
                </div>

                <div className="p-3 rounded-[var(--r-m)] bg-[var(--ink)]/5 flex items-center justify-between">
                  <span className="text-[var(--ink-2)]">Grabar pista overdub</span>
                  <kbd className="px-2 py-1 rounded bg-[var(--sunken)] text-[var(--ink-2)] font-bold shadow">R / Numpad *</kbd>
                </div>

                <div className="p-3 rounded-[var(--r-m)] bg-[var(--ink)]/5 flex items-center justify-between">
                  <span className="text-[var(--ink-2)]">Nueva idea / proyecto</span>
                  <kbd className="px-2 py-1 rounded bg-[var(--sunken)] text-[var(--ink-2)] font-bold shadow">N</kbd>
                </div>

                <div className="p-3 rounded-[var(--r-m)] bg-[var(--ink)]/5 flex items-center justify-between">
                  <span className="text-[var(--ink-2)]">Retroceder 5s / 15s</span>
                  <kbd className="px-2 py-1 rounded bg-[var(--sunken)] text-[var(--tentative)]/80 font-bold shadow">← / Shift + ←</kbd>
                </div>

                <div className="p-3 rounded-[var(--r-m)] bg-[var(--ink)]/5 flex items-center justify-between">
                  <span className="text-[var(--ink-2)]">Avanzar 5s / 15s</span>
                  <kbd className="px-2 py-1 rounded bg-[var(--sunken)] text-[var(--tentative)]/80 font-bold shadow">→ / Shift + →</kbd>
                </div>

                <div className="p-3 rounded-[var(--r-m)] bg-[var(--ink)]/5 flex items-center justify-between">
                  <span className="text-[var(--ink-2)]">Alternar silencio (mute)</span>
                  <kbd className="px-2 py-1 rounded bg-[var(--sunken)] text-[var(--acc-ink)] font-bold shadow">M</kbd>
                </div>

                <div className="p-3 rounded-[var(--r-m)] bg-[var(--ink)]/5 flex items-center justify-between">
                  <span className="text-[var(--ink-2)]">Alternar solo</span>
                  <kbd className="px-2 py-1 rounded bg-[var(--sunken)] text-[var(--acc-ink)] font-bold shadow">S</kbd>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-[var(--ink-2)] font-sans">
                  <ShowIcon inline emoji="💡" />Presiona <kbd className="px-1 py-0.5 rounded bg-[var(--sunken)] text-[var(--ink-2)]">K</kbd> o{' '}
                  <kbd className="px-1 py-0.5 rounded bg-[var(--sunken)] text-[var(--ink-2)]">?</kbd> en cualquier momento para abrir este
                  menú.
                </span>
                <button
                  type="button"
                  onClick={() => setShowCubaseHelp(false)}
                  className="px-5 py-2 rounded-[var(--r-pill)] text-xs font-bold text-[var(--on-tentative)] bg-[var(--tentative)] hover:bg-[var(--tentative)] transition-ui cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONFIRM DELETE MODAL DIALOG */}
        {confirmDeleteModal && (
          <div className="fixed inset-0 z-[9999] bg-[var(--scrim)]/80 flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] rounded-[var(--r-l)] max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-[var(--r-m)] bg-[var(--alert)]/20 text-[var(--ink)] shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--ink)]">{confirmDeleteModal.title}</h3>
                  <p className="text-xs text-[var(--ink-2)] mt-1.5 leading-relaxed">{confirmDeleteModal.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteModal(null)}
                  className="px-4 py-2 rounded-[var(--r-pill)] text-xs font-bold text-[var(--ink-2)] hover:text-[var(--ink)] bg-[var(--ink)]/5 hover:bg-[var(--ink)]/10 transition-ui cursor-pointer"
                >
                  Cancelar
                </button>
                <Button
                  variant="danger"
                  size="sm"
                  type="button"
                  onClick={() => {
                    const action = confirmDeleteModal.onConfirm;
                    setConfirmDeleteModal(null);
                    action();
                  }}
                >
                  Sí, Eliminar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* SHARE MODAL */}
        <ShareModal
          isOpen={shareModalData.isOpen}
          onClose={() => setShareModalData((prev) => ({ ...prev, isOpen: false }))}
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
              fecha: new Date().toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
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
                  muted: false,
                },
              ],
            };
            const updatedIdeas = [newIdea, ...(song.audioIdeas || [])];
            onUpdateSong(cancionConIdeas(song, updatedIdeas));
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
            onUpdateSong(cancionConIdeas(song, updatedIdeas));
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
            onClose={() => setPracticeModeIdea(null)}
            onApplyAsMainChords={(cifradoTexto, guiaSustituto) => {
              if (
                !window.confirm(
                  'Esto sustituye el cifrado de acordes principal de la canción (visible para toda la banda) por el detectado en esta pista aislada. ¿Continuar?'
                )
              )
                return;
              onUpdateSong({ ...song, cifradoTexto, guiaSustituto });
            }}
          />
        )}

        {/* MODAL MOISES STEMS SEPARATION & MULTITRACK CONTROL */}
        <SongStudioMoisesStemsModal
          showMoisesStemsModal={showMoisesStemsModal}
          setShowMoisesStemsModal={setShowMoisesStemsModal}
          moisesTab={moisesTab}
          setMoisesTab={setMoisesTab}
          moisesPreset={moisesPreset}
          setMoisesPreset={handleSelectMoisesPreset}
          handlePerformAiStemSeparation={handlePerformAiStemSeparation}
          song={song}
          onUpdateSong={onUpdateSong}
        />

        {/* AI Instrument Track Generator Modal */}
        <SongStudioAiTrackGenModal
          showAiTrackGenModal={showAiTrackGenModal}
          setShowAiTrackGenModal={setShowAiTrackGenModal}
          isGeneratingAiTrack={false}
          handleGenerateAiInstrumentTrack={() => {}}
          song={song}
        />

        {/* MODAL DE PROGRESO DE SEPARACIÓN DE STEMS IA */}
        <SongStudioStemProgressModal stemProgressModal={stemProgressModal} setStemProgressModal={setStemProgressModal} />
      </div>
    </ModalPortal>
  );
}
