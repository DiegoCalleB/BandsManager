/**
 * Mezclador de pistas de una idea: pistas, grabación en directo y ajustes
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/exhaustive-deps
*/
import { Sliders, Headphones, RefreshCw, Volume2 } from "lucide-react";
import { esIdeaIris } from "../../utils/irisTracks";
import { esPistaBase } from "../../utils/ideaDeAtril";
import { SongStudioMixerTrackRow } from "./SongStudioMixerTrackRow";
import { SongStudioLiveRecordingRow } from "./SongStudioLiveRecordingRow";
import { SongAudioIdea, AudioTrack, Song } from "../../types";
import React, { Dispatch, SetStateAction, RefObject } from "react";
import { useSongStudio } from "./SongStudioContext";

/** Datos propios de cada instancia (el resto sale del contexto del estudio). */
export interface SongStudioIdeaMixerProps {
  idea: SongAudioIdea;
  tracks: AudioTrack[];
  duration: number;
  currentTime: number;
}

/**
 * Mezclador de pistas de una idea: pistas, grabación en directo y ajustes
 * @returns Sección de interfaz.
 */
export function SongStudioIdeaMixer({ idea, tracks, duration, currentTime }: SongStudioIdeaMixerProps) {
  const { pistasDeReproduccion, pistasBaseVirtuales, metaStems, setPracticeModeIdea, setShowMoisesStemsModal, editingTrackId, draggedTrackInfo, dragOverTrackIndex, setDragOverTrackIndex, handleDropTrack, setDraggedTrackInfo, editingTrackName, setEditingTrackName, handleSaveTrackName, setEditingTrackId, handleToggleMuteTrack, handleToggleSoloTrack, handleTrackVolumeChange, setExpandedTrackSettingsId, expandedTrackSettingsId, formatDesfase, song, trackAudioRefs, onUpdateSong, resolvedAudioUrls, durationMap, handleSeekIdea, setDurationMap, handleTrackPanChange, cleaningTrackId, handleCleanTrackAudio, handleTrackEqChange, handleAutoSyncTrackLatency, handleTrackDesfaseChange, handleMoveTrack, handleDeleteTrack, isRecordingTrack, recordingTrackIdeaId, newTrackName, formatTime, recordingTrackTime, stopRecordingTrackOverdub, activeRecordingStream, studioAudioCtxRef } = useSongStudio();
  return (
    <>
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
    </>
  );
}
