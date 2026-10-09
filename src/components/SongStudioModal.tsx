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
import { SILENT_AUDIO_URI } from './song_studio/silentAudio';
import { getTrackRainbowColor, RAINBOW_HUE_STEPS } from './song_studio/trackColors';
import { MOISES_PRESETS_CONFIG, type MoisesSeparationPreset } from './song_studio/moisesStems';
import { SECCIONES_TEMA, AI_TRACK_STYLE_PRESETS } from './song_studio/studioConstants';
import { getIdeaTracks } from './song_studio/ideaTracks';
import { LiveMicWaveformCanvas } from './song_studio/LiveMicWaveformCanvas';
import { SongStudioIdeaComments } from "./song_studio/SongStudioIdeaComments";
import { SongStudioIdeaVoteBar } from "./song_studio/SongStudioIdeaVoteBar";
import { SongStudioOverdubDrawer } from "./song_studio/SongStudioOverdubDrawer";
import { SongStudioLiveRecordingRow } from "./song_studio/SongStudioLiveRecordingRow";
import { SongStudioMixerTrackRow } from "./song_studio/SongStudioMixerTrackRow";
import { useSongIdeasCrud } from "./song_studio/hooks/useSongIdeasCrud";
import { useIdeaMicRecording } from "./song_studio/hooks/useIdeaMicRecording";
import { useTrackOverdub } from "./song_studio/hooks/useTrackOverdub";
import { useTrackMixerActions } from "./song_studio/hooks/useTrackMixerActions";
import { useStudioPlaybackEngine } from "./song_studio/hooks/useStudioPlaybackEngine";
import { useStudioKeyboardShortcuts } from "./song_studio/hooks/useStudioKeyboardShortcuts";
import React, { useState, useRef, useEffect } from 'react';
import { useSeparacionIris } from '../hooks/useSeparacionIris';
import { resolverAudioUrlParaSubida } from '../utils/audioParaSubida';

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
import { getSongIrisStemIdea, ideaDeStemsDeCancion, cancionConIdeas, cancionConPistas, esIdeaIris, irisPrimero, metaStemsDeCancion, pistasDeCancion } from '../utils/irisTracks';
import { cancionConMezcla, esPistaBase, ideaConPistasBase, ideasConFondo, pistasBaseDeIdea, pistasBaseMezcladas } from '../utils/ideaDeAtril';
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

interface SongStudioModalProps {
  song: Song;
  colors: ThemeColors;
  onClose: () => void;
  onUpdateSong: (updatedSong: Song) => void;
  currentUsername?: string;
  currentUser?: User;
  initialOpenIrisModal?: boolean;
}

export { getIdeaTracks } from './song_studio/ideaTracks';
export { MOISES_AVAILABLE_STEMS, MOISES_PRESETS_CONFIG } from './song_studio/moisesStems';
export type { MoisesSeparationPreset, MoisesStemOption } from './song_studio/moisesStems';

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
  // Pistas de Iris que suenan mientras se graba encima; viven aparte de trackAudioRefs para no pisar el mezclador de Iris.
  const basePlayRefs = useRef<HTMLAudioElement[]>([]);
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
  const [nuevaIdeaPistasIris, setNuevaIdeaPistasIris] = useState<string[]>([]);
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

  // Pistas de Iris elegidas como base de la idea (por referencia, no copiadas): se oyen con el
  // transporte de la idea pero NO entran en getIdeaTracks, así las escrituras del mezclador
  // nunca las copian a la idea. id propio para no chocar con el refs de la hoja de Iris.
  const pistasBaseVirtuales = (idea: SongAudioIdea): AudioTrack[] => {
    const cancion = songRef.current || song;
    const ideaFresca = (cancion.audioIdeas || []).find((i) => i.id === idea.id) || idea;
    return pistasBaseMezcladas(ideaFresca, pistasDeCancion(cancion));
  };
  const pistasDeReproduccion = (idea: SongAudioIdea): AudioTrack[] => [
    ...getIdeaTracks(idea),
    ...pistasBaseVirtuales(idea),
  ];

  const { togglePlayIdea, handleStopIdea, handlePauseIdea, handleSeekIdea, runMasterSyncLoop, jumpToTime } = useStudioPlaybackEngine({ syncAnimationFrameRef, pistasDeReproduccion, trackAudioRefs, getSafeTrackDuration, getValidIdeaDuration, playingIdeaIdRef, songRef, song, currentTimeMap, loopConfigMap, applyMasterToElementVolume, trackDSPMapRef, studioAudioCtxRef, pendingPlayPromiseRefs, lastPlayAttemptMapRef, setCurrentTimeMap, setDurationMap, setPlayingIdeaId, resolvedAudioUrls, setResolvedAudioUrls, updateTrackAudioDSP, playingIdeaId });


  // Handle Track Volume Change
  const { stopRecording, startRecording } = useIdeaMicRecording({ useEchoCancellation, useNoiseSuppression, setActiveRecordingStream, useCleanDSPFilter, studioAudioCtxRef, mediaRecorderRef, audioChunksRef, recordingPromiseRef, setIsUploading, setRecordedAudioUrl, setIsRecording, setRecordingTime, recordingTimerRef });
  const { handleDeleteIdea, handleDuplicateIdea, handleToggleVote, handleDeleteComment, handleSaveIdea } = useSongIdeasCrud({ setIsUploading, isRecording, stopRecording, recordedAudioUrl, recordingPromiseRef, useSongBaseTrack, selectedSongBaseUrl, driveAudioUrl, selectedAudioFile, song, ideaSection, ideaTitle, genAiOnNewIdea, newIdeaBpm, newIdeaKey, newIdeaIncludeDrums, newIdeaIncludeBass, newIdeaStyle, ideaUploader, currentUsername, ideaInstrument, ideaNotes, nuevaIdeaPistasIris, onUpdateSong, setIdeaTitle, setIdeaNotes, setSelectedAudioFile, setRecordedAudioUrl, setDriveAudioUrl, setGenAiOnNewIdea, setNuevaIdeaPistasIris, setShowAddIdea, playingIdeaId, ideasList, trackAudioRefs, setPlayingIdeaId, setConfirmDeleteModal });

  const { handleToggleMuteTrack, handleToggleSoloTrack, handleTrackDesfaseChange, handleExportMasterMix, draggedTrackInfo, dragOverTrackIndex, setDragOverTrackIndex, handleDropTrack, setDraggedTrackInfo, handleSaveTrackName, handleTrackVolumeChange, handleTrackPanChange, handleTrackEqChange, handleMoveTrack, handleDeleteTrack } = useTrackMixerActions({ pistasDeReproduccion, trackAudioRefs, updateTrackAudioDSP, song, songRef, onUpdateSong, currentTimeMap, setIsExportingMaster, resolvedAudioUrls, setEditingTrackId, setConfirmDeleteModal, handleDeleteIdea });

  const { stopRecordingTrackOverdub, startRecordingTrackOverdub, saveNewTrackToIdea, handleCleanTrackAudio, handleAutoSyncTrackLatency, handleUploadTrackFile } = useTrackOverdub({ useCountInMetronome, triggerCountInBeeps, song, studioAudioCtxRef, useEchoCancellation, useNoiseSuppression, setActiveRecordingStream, useCleanDSPFilter, cleanPipelineRef, trackMediaRecorderRef, trackAudioChunksRef, setCurrentTimeMap, resolvedAudioUrls, trackAudioRefs, applyMasterToElementVolume, basePlayRefs, setIsRecordingTrack, setRecordingTrackIdeaId, setRecordingTrackTime, trackRecordingTimerRef, playingIdeaIdRef, setPlayingIdeaId, runMasterSyncLoop, syncAnimationFrameRef, setIsUploading, autoLatencyTrimMs, newTrackName, newTrackInstrument, setCleaningTrackId, handleTrackDesfaseChange, onUpdateSong, currentUsername, setAddingTrackIdeaId, setNewTrackName, setNewTrackInstrument, setSelectedTrackFile });

  useStudioKeyboardShortcuts({ song, playingIdeaIdRef, isRecordingTrack, stopRecordingTrackOverdub, togglePlayIdea, handleStopIdea, handlePauseIdea, toggleIdeaLoop, setIdeaCueIn, setIdeaCueOut, startRecordingTrackOverdub, setShowAddIdea, currentTimeMap, handleSeekIdea, durationMap, handleToggleMuteTrack, handleToggleSoloTrack, setShowCubaseHelp, loopConfigMap });

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
                                const hasSoloInIdea = pistasDeReproduccion(idea).some((t) => t.solo);
                                return (
                                  <>
                                    <div className="flex items-center justify-between text-xs font-sans text-[var(--ink-2)] pb-1.5 flex-wrap gap-2">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="flex items-center gap-1.5 font-bold text-[var(--ink)]">
                                          <Sliders className="w-3.5 h-3.5 text-[var(--tentative)]" /> Mezclador de Pistas ({tracks.length + pistasBaseVirtuales(idea).length})
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
                                      {pistasDeReproduccion(idea).map((tr, idx) => {
                                        const esBase = esPistaBase(idea.id, tr.id);
                                        const isMuted = tr.muted;
                                        const isSolo = (tr as any).solo;
                                        const vol = tr.volumen ?? 1;
                                        const isEditing = editingTrackId === tr.id;

                                        const isDraggingThisTrack = draggedTrackInfo?.ideaId === idea.id && draggedTrackInfo.index === idx;
                                        const isDragOverThisTrack =
                                          dragOverTrackIndex === idx && draggedTrackInfo?.ideaId === idea.id && !isDraggingThisTrack;

                                        return (
                                          <SongStudioMixerTrackRow tr={tr} draggedTrackInfo={draggedTrackInfo} idea={idea} setDragOverTrackIndex={setDragOverTrackIndex} idx={idx} handleDropTrack={handleDropTrack} isDraggingThisTrack={isDraggingThisTrack} isDragOverThisTrack={isDragOverThisTrack} isMuted={isMuted} isSolo={isSolo} hasSoloInIdea={hasSoloInIdea} tracks={tracks} esBase={esBase} setDraggedTrackInfo={setDraggedTrackInfo} isEditing={isEditing} editingTrackName={editingTrackName} setEditingTrackName={setEditingTrackName} handleSaveTrackName={handleSaveTrackName} setEditingTrackId={setEditingTrackId} handleToggleMuteTrack={handleToggleMuteTrack} handleToggleSoloTrack={handleToggleSoloTrack} vol={vol} handleTrackVolumeChange={handleTrackVolumeChange} setExpandedTrackSettingsId={setExpandedTrackSettingsId} expandedTrackSettingsId={expandedTrackSettingsId} formatDesfase={formatDesfase} song={song} trackAudioRefs={trackAudioRefs} onUpdateSong={onUpdateSong} resolvedAudioUrls={resolvedAudioUrls} duration={duration} durationMap={durationMap} currentTime={currentTime} handleSeekIdea={handleSeekIdea} setDurationMap={setDurationMap} handleTrackPanChange={handleTrackPanChange} cleaningTrackId={cleaningTrackId} handleCleanTrackAudio={handleCleanTrackAudio} handleTrackEqChange={handleTrackEqChange} handleAutoSyncTrackLatency={handleAutoSyncTrackLatency} handleTrackDesfaseChange={handleTrackDesfaseChange} handleMoveTrack={handleMoveTrack} handleDeleteTrack={handleDeleteTrack} />
                                        );
                                      })}

                                      <SongStudioLiveRecordingRow isRecordingTrack={isRecordingTrack} recordingTrackIdeaId={recordingTrackIdeaId} idea={idea} tracks={tracks} newTrackName={newTrackName} formatTime={formatTime} recordingTrackTime={recordingTrackTime} stopRecordingTrackOverdub={stopRecordingTrackOverdub} activeRecordingStream={activeRecordingStream} studioAudioCtxRef={studioAudioCtxRef} />
                                    </div>
                                  </>
                                );
                              })()}
                            </div>

                            <SongStudioOverdubDrawer isAddingTrack={isAddingTrack} setAddingTrackIdeaId={setAddingTrackIdeaId} autoLatencyTrimMs={autoLatencyTrimMs} useCleanDSPFilter={useCleanDSPFilter} setUseCleanDSPFilter={setUseCleanDSPFilter} useEchoCancellation={useEchoCancellation} setUseEchoCancellation={setUseEchoCancellation} setAutoLatencyTrimMs={setAutoLatencyTrimMs} newTrackName={newTrackName} setNewTrackName={setNewTrackName} newTrackInstrument={newTrackInstrument} setNewTrackInstrument={setNewTrackInstrument} song={song} idea={idea} onUpdateSong={onUpdateSong} isRecordingTrack={isRecordingTrack} startRecordingTrackOverdub={startRecordingTrackOverdub} stopRecordingTrackOverdub={stopRecordingTrackOverdub} formatTime={formatTime} recordingTrackTime={recordingTrackTime} isUploading={isUploading} handleUploadTrackFile={handleUploadTrackFile} selectedSongBaseUrl={selectedSongBaseUrl} saveNewTrackToIdea={saveNewTrackToIdea} />

                            <SongStudioIdeaVoteBar handleToggleVote={handleToggleVote} idea={idea} hasVoted={hasVoted} votes={votes} onUpdateSong={onUpdateSong} song={song} />

                            <SongStudioIdeaComments idea={idea} jumpToTime={jumpToTime} formatTime={formatTime} handleDeleteComment={handleDeleteComment} setCommentTimeTagMap={setCommentTimeTagMap} currentTime={currentTime} commentTrackTagMap={commentTrackTagMap} setCommentTrackTagMap={setCommentTrackTagMap} commentTextMap={commentTextMap} setCommentTextMap={setCommentTextMap} handleAddComment={handleAddComment} />
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

                      {/* Pistas de Iris que sonarán al grabar encima de esta idea */}
                      {pistasDeCancion(song).length > 0 && (
                        <div className="space-y-2">
                          <span className="text-micro font-sans font-bold text-[var(--ink-2)] block">
                            Pistas de Iris para grabar encima · {nuevaIdeaPistasIris.length}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {pistasDeCancion(song).map((st) => {
                              const on = nuevaIdeaPistasIris.includes(st.id);
                              return (
                                <button
                                  key={st.id}
                                  type="button"
                                  aria-pressed={on}
                                  onClick={() =>
                                    setNuevaIdeaPistasIris((prev) => (on ? prev.filter((id) => id !== st.id) : [...prev, st.id]))
                                  }
                                  className={`px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-sans cursor-pointer transition-ui ${
                                    on ? 'bg-[var(--acc)] text-[var(--on-acc)] font-bold' : 'bg-[var(--ink)]/5 text-[var(--ink-2)] hover:bg-[var(--ink)]/10'
                                  }`}
                                >
                                  {st.nombre || st.instrumento || 'Pista'}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

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
