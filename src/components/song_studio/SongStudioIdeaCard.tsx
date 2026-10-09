/**
 * Tarjeta de una idea de audio: cabecera, transporte, mezclador, overdub, votos y comentarios
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/exhaustive-deps
*/
import { SECCIONES_TEMA } from "./studioConstants";
import { getIdeaTracks } from "./ideaTracks";
import { motion } from "motion/react";
import { ChevronUp, ChevronDown, User as UserIcon, Pause, Play, Trash2, MoreVertical, MessageSquare, Disc, Copy, Wand2, Plus, Square, Repeat, Sliders, Headphones, RefreshCw, Volume2 } from "lucide-react";
import { ShowIcon } from "../ui/ShowIcon";
import { esIdeaIris } from "../../utils/irisTracks";
import { Button, IconButton, MenuItem } from "../ui";
import { PopoverAncla } from "../ui/PopoverAncla";
import { esPistaBase } from "../../utils/ideaDeAtril";
import { SongStudioMixerTrackRow } from "./SongStudioMixerTrackRow";
import { SongStudioLiveRecordingRow } from "./SongStudioLiveRecordingRow";
import { SongStudioOverdubDrawer } from "./SongStudioOverdubDrawer";
import { SongStudioIdeaVoteBar } from "./SongStudioIdeaVoteBar";
import { SongStudioIdeaComments } from "./SongStudioIdeaComments";
import { SongAudioIdea, Song, AudioTrack } from "../../types";
import React, { MouseEvent, Dispatch, SetStateAction, RefObject } from "react";
import { useSongStudio } from "./SongStudioContext";

/** Datos propios de cada instancia (el resto sale del contexto del estudio). */
export interface SongStudioIdeaCardProps {
  opts?: { iris?: boolean; };
  idea: SongAudioIdea;
}

/**
 * Tarjeta de una idea de audio: cabecera, transporte, mezclador, overdub, votos y comentarios
 * @returns Sección de interfaz.
 */
export function SongStudioIdeaCard({ opts, idea }: SongStudioIdeaCardProps) {
  const { playingIdeaId, currentTimeMap, durationMap, currentUsername, addingTrackIdeaId, expandedIdeaIds, toggleIdeaExpanded, togglePlayIdea, handleDeleteIdea, setOpenIdeaActionsMenuId, openIdeaActionsMenuId, handleShareIdea, handleExportMasterMix, isExportingMaster, handleDuplicateIdea, setAiTrackGenPreview, setAiTrackGenError, setAiTrackGenStartOffsetSec, setShowAiTrackGenModal, setShowGenModalForIdea, setGenBpm, song, setGenKey, setAddingTrackIdeaId, setNewTrackName, setNewTrackInstrument, handleStopIdea, loopConfigMap, toggleIdeaLoop, selectedSongBaseUrl, saveNewTrackToIdea, formatTime, handleSeekIdea, pistasDeReproduccion, pistasBaseVirtuales, metaStems, setPracticeModeIdea, setShowMoisesStemsModal, editingTrackId, draggedTrackInfo, dragOverTrackIndex, setDragOverTrackIndex, handleDropTrack, setDraggedTrackInfo, editingTrackName, setEditingTrackName, handleSaveTrackName, setEditingTrackId, handleToggleMuteTrack, handleToggleSoloTrack, handleTrackVolumeChange, setExpandedTrackSettingsId, expandedTrackSettingsId, formatDesfase, trackAudioRefs, onUpdateSong, resolvedAudioUrls, setDurationMap, handleTrackPanChange, cleaningTrackId, handleCleanTrackAudio, handleTrackEqChange, handleAutoSyncTrackLatency, handleTrackDesfaseChange, handleMoveTrack, handleDeleteTrack, isRecordingTrack, recordingTrackIdeaId, newTrackName, recordingTrackTime, stopRecordingTrackOverdub, activeRecordingStream, studioAudioCtxRef, autoLatencyTrimMs, useCleanDSPFilter, setUseCleanDSPFilter, useEchoCancellation, setUseEchoCancellation, setAutoLatencyTrimMs, newTrackInstrument, startRecordingTrackOverdub, isUploading, handleUploadTrackFile, handleToggleVote, jumpToTime, handleDeleteComment, setCommentTimeTagMap, commentTrackTagMap, setCommentTrackTagMap, commentTextMap, setCommentTextMap, handleAddComment } = useSongStudio();
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
  
}
