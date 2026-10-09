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
import { SongStudioIdeaMixer } from "./SongStudioIdeaMixer";
import { SongStudioIdeaTransport } from "./SongStudioIdeaTransport";
import { SongStudioIdeaTrackActions } from "./SongStudioIdeaTrackActions";
import { SongStudioIdeaHeader } from "./SongStudioIdeaHeader";
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
                        <SongStudioIdeaHeader modoIris={modoIris} idea={idea} isIdeaExpanded={isIdeaExpanded} sectionInfo={sectionInfo} tracks={tracks} isPlaying={isPlaying} />

                        {isIdeaExpanded && (
                          <>
                            {!modoIris && idea.notas && (
                              <p className="text-xs text-[var(--ink-2)] italic bg-[var(--sunken)] p-2.5 rounded-[var(--r-m)]">
                                "{idea.notas}"
                              </p>
                            )}

                            <SongStudioIdeaTrackActions modoIris={modoIris} idea={idea} tracks={tracks} />

                            <SongStudioIdeaTransport isPlaying={isPlaying} idea={idea} modoIris={modoIris} tracks={tracks} currentTime={currentTime} duration={duration} />

                            <SongStudioIdeaMixer idea={idea} tracks={tracks} duration={duration} currentTime={currentTime} />

                            <SongStudioOverdubDrawer isAddingTrack={isAddingTrack} setAddingTrackIdeaId={setAddingTrackIdeaId} autoLatencyTrimMs={autoLatencyTrimMs} useCleanDSPFilter={useCleanDSPFilter} setUseCleanDSPFilter={setUseCleanDSPFilter} useEchoCancellation={useEchoCancellation} setUseEchoCancellation={setUseEchoCancellation} setAutoLatencyTrimMs={setAutoLatencyTrimMs} newTrackName={newTrackName} setNewTrackName={setNewTrackName} newTrackInstrument={newTrackInstrument} setNewTrackInstrument={setNewTrackInstrument} song={song} idea={idea} onUpdateSong={onUpdateSong} isRecordingTrack={isRecordingTrack} startRecordingTrackOverdub={startRecordingTrackOverdub} stopRecordingTrackOverdub={stopRecordingTrackOverdub} formatTime={formatTime} recordingTrackTime={recordingTrackTime} isUploading={isUploading} handleUploadTrackFile={handleUploadTrackFile} selectedSongBaseUrl={selectedSongBaseUrl} saveNewTrackToIdea={saveNewTrackToIdea} />

                            <SongStudioIdeaVoteBar handleToggleVote={handleToggleVote} idea={idea} hasVoted={hasVoted} votes={votes} onUpdateSong={onUpdateSong} song={song} />

                            <SongStudioIdeaComments idea={idea} jumpToTime={jumpToTime} formatTime={formatTime} handleDeleteComment={handleDeleteComment} setCommentTimeTagMap={setCommentTimeTagMap} currentTime={currentTime} commentTrackTagMap={commentTrackTagMap} setCommentTrackTagMap={setCommentTrackTagMap} commentTextMap={commentTextMap} setCommentTextMap={setCommentTextMap} handleAddComment={handleAddComment} />
                          </>
                        )}
                      </motion.div>
                    );
  
}
