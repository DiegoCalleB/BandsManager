/**
 * Controlador de Song Studio: compone todos los hooks de estado y lógica del estudio y expone lo que consumen las vistas
 * Extraído de SongStudioModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useEffect, useRef, useState } from "react";
import { useAccompanimentGenerator } from "../../../hooks/useAccompanimentGenerator";
import { useIdeaComments } from "../../../hooks/useIdeaComments";
import { useModuleTutorial } from "../../../hooks/useModuleTutorial";
import { useStudioShareModal } from "../../../hooks/useStudioShareModal";
import { DrumPatternStyle, Song, SongAudioIdea } from "../../../types";
import { esIdeaIris } from "../../../utils/irisTracks";
import { useAiTrackGeneration } from "./useAiTrackGeneration";
import { useIdeaDurations } from "./useIdeaDurations";
import { useIdeaLoopControls } from "./useIdeaLoopControls";
import { useIdeaMicRecording } from "./useIdeaMicRecording";
import { useIdeaPlaybackTracks } from "./useIdeaPlaybackTracks";
import { useMoisesStemsPanel } from "./useMoisesStemsPanel";
import { useResolvedAudioUrls } from "./useResolvedAudioUrls";
import { useSongIdeasCrud } from "./useSongIdeasCrud";
import { useStudioFullScreen } from "./useStudioFullScreen";
import { useStudioIdeasView } from "./useStudioIdeasView";
import { useStudioKeyboardShortcuts } from "./useStudioKeyboardShortcuts";
import { useStudioMasterGain } from "./useStudioMasterGain";
import { useStudioPlaybackEngine } from "./useStudioPlaybackEngine";
import { useTrackAudioDsp } from "./useTrackAudioDsp";
import { useTrackMixerActions } from "./useTrackMixerActions";
import { useTrackOverdub } from "./useTrackOverdub";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface SongStudioControllerParams {
  song: Song;
  onUpdateSong: (updatedSong: Song) => void;
  currentUsername: string;
  initialOpenIrisModal: boolean;
}

/**
 * Controlador de Song Studio: compone todos los hooks de estado y lógica del estudio y expone lo que consumen las vistas
 * @param params Estado y callbacks del contenedor ({@link SongStudioControllerParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useSongStudioController({ song, onUpdateSong, currentUsername, initialOpenIrisModal }: SongStudioControllerParams) {
  const songRef = useRef<Song>(song);
  useEffect(() => {
    songRef.current = song;
  }, [song]);

  const [activeSectionFilter] = useState<string>('todas');
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
  const { openTutorial } = useModuleTutorial('song_studio');
  const { shareModalData, setShareModalData, handleShareSong, handleShareIdea } = useStudioShareModal(song);

  const [playingIdeaId, setPlayingIdeaId] = useState<string | null>(null);
  const [currentTimeMap, setCurrentTimeMap] = useState<Record<string, number>>({});
  const [durationMap, setDurationMap] = useState<Record<string, number>>({});
  const [loopConfigMap, setLoopConfigMap] = useState<Record<string, { enabled: boolean; start: number; end: number }>>({});

  const {
    commentTextMap,
    setCommentTextMap,
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
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingPromiseRef = useRef<Promise<string> | null>(null);

  // --- MULTITRACK (OVERDUB) STATE ---
  const [addingTrackIdeaId, setAddingTrackIdeaId] = useState<string | null>(null);
  const [newTrackName, setNewTrackName] = useState('');
  const [newTrackInstrument, setNewTrackInstrument] = useState('');
  const [, setSelectedTrackFile] = useState<File | null>(null);
  const [isRecordingTrack, setIsRecordingTrack] = useState(false);
  const [recordingTrackIdeaId, setRecordingTrackIdeaId] = useState<string | null>(null);
  const [recordingTrackTime, setRecordingTrackTime] = useState(0);
  const trackMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const trackAudioChunksRef = useRef<Blob[]>([]);
  // Pistas de Iris que suenan mientras se graba encima; viven aparte de trackAudioRefs para no pisar el mezclador de Iris.
  const basePlayRefs = useRef<HTMLAudioElement[]>([]);
  const trackRecordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editingTrackName, setEditingTrackName] = useState('');
  const [activeRecordingStream, setActiveRecordingStream] = useState<MediaStream | null>(null);

  const { selectedStemEngine, selectedStemsToExtract, setShowMoisesStemsModal, setShowIrisPanel, showIrisPanel, showMoisesStemsModal, moisesTab, setMoisesTab, moisesPreset, handleSelectMoisesPreset } = useMoisesStemsPanel({ initialOpenIrisModal, song, setExpandedIdeaIds, currentUsername });

  const { setShowAiTrackGenModal, isSeparatingStemsAi, handlePerformAiStemSeparation, showAiTrackGenModal, stemProgressModal, setStemProgressModal } = useAiTrackGeneration({ song, onUpdateSong, selectedStemEngine, selectedStemsToExtract, setExpandedIdeaIds });

  const { isFullScreen, toggleIsFullScreen } = useStudioFullScreen();

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

  const { applyMasterToElementVolume, getOrCreateMasterGain, setMasterVolume, masterVolume } = useStudioMasterGain({ trackAudioRefs, lastPerTrackGainRef });

  const { trackDSPMapRef, updateTrackAudioDSP, useEchoCancellation, useNoiseSuppression, useCleanDSPFilter, useCountInMetronome, triggerCountInBeeps, cleanPipelineRef, autoLatencyTrimMs, setCleaningTrackId, cleaningTrackId, setUseCleanDSPFilter, setUseEchoCancellation, setAutoLatencyTrimMs, countInCountdown } = useTrackAudioDsp({ lastPerTrackGainRef, applyMasterToElementVolume, studioAudioCtxRef, getOrCreateMasterGain, song });

  const { resolvedAudioUrls, setResolvedAudioUrls } = useResolvedAudioUrls({ song });

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

  // Ajuste durante el render (no en un efecto): cuando cambia la canción, la base vuelve a la principal.
  const [songDeLaBase, setSongDeLaBase] = useState(song);
  if (songDeLaBase !== song) {
    setSongDeLaBase(song);
    if (song.audioPrincipalUrl) {
      setSelectedSongBaseUrl(song.audioPrincipalUrl);
    } else if (song.audioIdeas && song.audioIdeas.length > 0 && song.audioIdeas[0]?.audioUrl) {
      setSelectedSongBaseUrl(song.audioIdeas[0].audioUrl);
    }
  }

  // --- CONFIRMATION MODAL STATE FOR DELETIONS ---
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  // --- TRACK EQ & MASTER EXPORT STATE ---
  const [expandedTrackSettingsId, setExpandedTrackSettingsId] = useState<string | null>(null);
  const [isExportingMaster, setIsExportingMaster] = useState<boolean>(false);


  const { ideasList, metaStems, irisIdea, fuenteIris, tomas } = useStudioIdeasView({ song, activeSectionFilter, currentUsername });

  const { getValidIdeaDuration, getSafeTrackDuration, formatTime, formatDesfase } = useIdeaDurations({ durationMap });

  const { toggleIdeaLoop, setIdeaCueIn, setIdeaCueOut } = useIdeaLoopControls({ getValidIdeaDuration, setLoopConfigMap, currentTimeMap });

  const { pistasDeReproduccion, pistasBaseVirtuales } = useIdeaPlaybackTracks({ songRef, song });

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

  return { playingIdeaId, currentTimeMap, durationMap, addingTrackIdeaId, expandedIdeaIds, toggleIdeaExpanded, togglePlayIdea, handleDeleteIdea, setOpenIdeaActionsMenuId, openIdeaActionsMenuId, handleShareIdea, handleExportMasterMix, isExportingMaster, handleDuplicateIdea, setShowAiTrackGenModal, setShowGenModalForIdea, setGenBpm, setGenKey, setAddingTrackIdeaId, setNewTrackName, setNewTrackInstrument, handleStopIdea, loopConfigMap, toggleIdeaLoop, selectedSongBaseUrl, saveNewTrackToIdea, formatTime, handleSeekIdea, pistasDeReproduccion, pistasBaseVirtuales, metaStems, setPracticeModeIdea, setShowMoisesStemsModal, editingTrackId, draggedTrackInfo, dragOverTrackIndex, setDragOverTrackIndex, handleDropTrack, setDraggedTrackInfo, editingTrackName, setEditingTrackName, handleSaveTrackName, setEditingTrackId, handleToggleMuteTrack, handleToggleSoloTrack, handleTrackVolumeChange, setExpandedTrackSettingsId, expandedTrackSettingsId, formatDesfase, trackAudioRefs, resolvedAudioUrls, setDurationMap, handleTrackPanChange, cleaningTrackId, handleCleanTrackAudio, handleTrackEqChange, handleAutoSyncTrackLatency, handleTrackDesfaseChange, handleMoveTrack, handleDeleteTrack, isRecordingTrack, recordingTrackIdeaId, newTrackName, recordingTrackTime, stopRecordingTrackOverdub, activeRecordingStream, studioAudioCtxRef, autoLatencyTrimMs, useCleanDSPFilter, setUseCleanDSPFilter, useEchoCancellation, setUseEchoCancellation, setAutoLatencyTrimMs, newTrackInstrument, startRecordingTrackOverdub, isUploading, handleUploadTrackFile, handleToggleVote, jumpToTime, handleDeleteComment, setCommentTimeTagMap, commentTrackTagMap, setCommentTrackTagMap, commentTextMap, setCommentTextMap, handleAddComment, isFullScreen, countInCountdown, setShowToolsMenu, showToolsMenu, setShowChordsModal, setShowAiComposerModal, setShowAiMusicModal, setShowCubaseHelp, openTutorial, handleShareSong, setMasterVolume, masterVolume, toggleIsFullScreen, irisIdea, setShowIrisPanel, fuenteIris, isSeparatingStemsAi, setShowAddIdea, showAddIdea, ideaTitle, setIdeaTitle, ideaSection, setIdeaSection, ideaUploader, setIdeaUploader, ideaInstrument, setIdeaInstrument, nuevaIdeaPistasIris, setNuevaIdeaPistasIris, useSongBaseTrack, setUseSongBaseTrack, setSelectedSongBaseUrl, selectedAudioFile, setSelectedAudioFile, setRecordedAudioUrl, setDriveAudioUrl, isRecording, startRecording, stopRecording, recordingTime, recordedAudioUrl, driveAudioUrl, setGenAiOnNewIdea, genAiOnNewIdea, newIdeaStyle, setNewIdeaStyle, newIdeaBpm, setNewIdeaBpm, newIdeaKey, setNewIdeaKey, newIdeaIncludeDrums, setNewIdeaIncludeDrums, newIdeaIncludeBass, setNewIdeaIncludeBass, ideaNotes, setIdeaNotes, handleSaveIdea, tomas, activeSectionFilter, showGenModalForIdea, genBpm, genKey, includeDrums, setIncludeDrums, includeBass, setIncludeBass, drumStyle, setDrumStyle, genDuration, setGenDuration, isGeneratingAccompaniment, handleGenerateAccompaniment, showIrisPanel, showChordsModal, showCubaseHelp, confirmDeleteModal, setConfirmDeleteModal, shareModalData, setShareModalData, showAiMusicModal, showAiComposerModal, practiceModeIdea, showMoisesStemsModal, moisesTab, setMoisesTab, moisesPreset, handleSelectMoisesPreset, handlePerformAiStemSeparation, showAiTrackGenModal, stemProgressModal, setStemProgressModal };
}
