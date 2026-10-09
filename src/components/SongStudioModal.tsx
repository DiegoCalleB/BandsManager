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
import { useIdeaPlaybackTracks } from "./song_studio/hooks/useIdeaPlaybackTracks";
import { useIdeaLoopControls } from "./song_studio/hooks/useIdeaLoopControls";
import { useIdeaDurations } from "./song_studio/hooks/useIdeaDurations";
import { useStudioIdeasView } from "./song_studio/hooks/useStudioIdeasView";
import { useStudioMasterGain } from "./song_studio/hooks/useStudioMasterGain";
import { useResolvedAudioUrls } from "./song_studio/hooks/useResolvedAudioUrls";
import { useTrackAudioDsp } from "./song_studio/hooks/useTrackAudioDsp";
import { useStudioFullScreen } from "./song_studio/hooks/useStudioFullScreen";
import { useAiTrackGeneration } from "./song_studio/hooks/useAiTrackGeneration";
import { useMoisesStemsPanel } from "./song_studio/hooks/useMoisesStemsPanel";
import { SongStudioProvider } from './song_studio/SongStudioContext';
import { useSongStudioController } from "./song_studio/hooks/useSongStudioController";
import { SongStudioIdeaCard } from "./song_studio/SongStudioIdeaCard";
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

  const studio = useSongStudioController({ song, onUpdateSong, currentUsername, initialOpenIrisModal });
  const { playingIdeaId, currentTimeMap, durationMap, addingTrackIdeaId, expandedIdeaIds, toggleIdeaExpanded, togglePlayIdea, handleDeleteIdea, setOpenIdeaActionsMenuId, openIdeaActionsMenuId, handleShareIdea, handleExportMasterMix, isExportingMaster, handleDuplicateIdea, setAiTrackGenPreview, setAiTrackGenError, setAiTrackGenStartOffsetSec, setShowAiTrackGenModal, setShowGenModalForIdea, setGenBpm, setGenKey, setAddingTrackIdeaId, setNewTrackName, setNewTrackInstrument, handleStopIdea, loopConfigMap, toggleIdeaLoop, selectedSongBaseUrl, saveNewTrackToIdea, formatTime, handleSeekIdea, pistasDeReproduccion, pistasBaseVirtuales, metaStems, setPracticeModeIdea, setShowMoisesStemsModal, editingTrackId, draggedTrackInfo, dragOverTrackIndex, setDragOverTrackIndex, handleDropTrack, setDraggedTrackInfo, editingTrackName, setEditingTrackName, handleSaveTrackName, setEditingTrackId, handleToggleMuteTrack, handleToggleSoloTrack, handleTrackVolumeChange, setExpandedTrackSettingsId, expandedTrackSettingsId, formatDesfase, trackAudioRefs, resolvedAudioUrls, setDurationMap, handleTrackPanChange, cleaningTrackId, handleCleanTrackAudio, handleTrackEqChange, handleAutoSyncTrackLatency, handleTrackDesfaseChange, handleMoveTrack, handleDeleteTrack, isRecordingTrack, recordingTrackIdeaId, newTrackName, recordingTrackTime, stopRecordingTrackOverdub, activeRecordingStream, studioAudioCtxRef, autoLatencyTrimMs, useCleanDSPFilter, setUseCleanDSPFilter, useEchoCancellation, setUseEchoCancellation, setAutoLatencyTrimMs, newTrackInstrument, startRecordingTrackOverdub, isUploading, handleUploadTrackFile, handleToggleVote, jumpToTime, handleDeleteComment, setCommentTimeTagMap, commentTrackTagMap, setCommentTrackTagMap, commentTextMap, setCommentTextMap, handleAddComment, isFullScreen, countInCountdown, setShowToolsMenu, showToolsMenu, setShowChordsModal, setShowAiComposerModal, setShowAiMusicModal, setShowCubaseHelp, openTutorial, handleShareSong, setMasterVolume, masterVolume, toggleIsFullScreen, irisIdea, setShowIrisPanel, fuenteIris, isSeparatingStemsAi, setShowAddIdea, showAddIdea, ideaTitle, setIdeaTitle, ideaSection, setIdeaSection, ideaUploader, setIdeaUploader, ideaInstrument, setIdeaInstrument, nuevaIdeaPistasIris, setNuevaIdeaPistasIris, useSongBaseTrack, setUseSongBaseTrack, setSelectedSongBaseUrl, selectedAudioFile, setSelectedAudioFile, setRecordedAudioUrl, setDriveAudioUrl, isRecording, startRecording, stopRecording, recordingTime, recordedAudioUrl, driveAudioUrl, setGenAiOnNewIdea, genAiOnNewIdea, newIdeaStyle, setNewIdeaStyle, newIdeaBpm, setNewIdeaBpm, newIdeaKey, setNewIdeaKey, newIdeaIncludeDrums, setNewIdeaIncludeDrums, newIdeaIncludeBass, setNewIdeaIncludeBass, ideaNotes, setIdeaNotes, handleSaveIdea, tomas, activeSectionFilter, showGenModalForIdea, genBpm, genKey, includeDrums, setIncludeDrums, includeBass, setIncludeBass, drumStyle, setDrumStyle, genDuration, setGenDuration, isGeneratingAccompaniment, handleGenerateAccompaniment, showIrisPanel, showChordsModal, showCubaseHelp, confirmDeleteModal, setConfirmDeleteModal, shareModalData, setShareModalData, showAiMusicModal, showAiComposerModal, practiceModeIdea, showMoisesStemsModal, moisesTab, setMoisesTab, moisesPreset, handleSelectMoisesPreset, handlePerformAiStemSeparation, showAiTrackGenModal, stemProgressModal, setStemProgressModal } = studio;
  const contextValue = { ...studio, song, colors, onClose, onUpdateSong, currentUsername, currentUser };


  return (
    <SongStudioProvider value={contextValue}>
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
                  {tomas.map((toma) => (
                    <SongStudioIdeaCard key={toma.id} idea={toma} />
                  ))}
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
                  <div className="space-y-6"><SongStudioIdeaCard idea={irisIdea} opts={{ iris: true }} /></div>
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
        {showCubaseHelp && <SongStudioCubaseHelpModal onClose={() => setShowCubaseHelp(false)} />}

        {/* CONFIRM DELETE MODAL DIALOG */}
        <SongStudioDeleteConfirmModal confirmDeleteModal={confirmDeleteModal} onClose={() => setConfirmDeleteModal(null)} />

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
    </SongStudioProvider>
  );
}
