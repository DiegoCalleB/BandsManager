/**
 * Cabecera de una idea: escuchar, título, sección, votos y menú de acciones
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/exhaustive-deps
*/
import { ChevronUp, ChevronDown, User as UserIcon, Pause, Play, Trash2, MoreVertical, MessageSquare, Disc, Copy, Wand2 } from "lucide-react";
import { ShowIcon } from "../ui/ShowIcon";
import { esIdeaIris } from "../../utils/irisTracks";
import { motion } from "motion/react";
import { Button, IconButton, MenuItem } from "../ui";
import { PopoverAncla } from "../ui/PopoverAncla";
import { SongAudioIdea, AudioTrack, Song } from "../../types";
import React, { MouseEvent, Dispatch, SetStateAction } from "react";
import { useSongStudio } from "./SongStudioContext";

/** Datos propios de cada instancia (el resto sale del contexto del estudio). */
export interface SongStudioIdeaHeaderProps {
  modoIris: boolean;
  idea: SongAudioIdea;
  isIdeaExpanded: boolean;
  sectionInfo: { key: "general" | "intro" | "verso" | "estribillo" | "puente" | "solo" | "outro"; label: string; icon: string; color: string; };
  tracks: AudioTrack[];
  isPlaying: boolean;
}

/**
 * Cabecera de una idea: escuchar, título, sección, votos y menú de acciones
 * @returns Sección de interfaz.
 */
export function SongStudioIdeaHeader({ modoIris, idea, isIdeaExpanded, sectionInfo, tracks, isPlaying }: SongStudioIdeaHeaderProps) {
  const { toggleIdeaExpanded, togglePlayIdea, handleDeleteIdea, setOpenIdeaActionsMenuId, openIdeaActionsMenuId, handleShareIdea, handleExportMasterMix, isExportingMaster, handleDuplicateIdea, setAiTrackGenPreview, setAiTrackGenError, setAiTrackGenStartOffsetSec, setShowAiTrackGenModal, setShowGenModalForIdea, setGenBpm, song, setGenKey } = useSongStudio();
  return (
    <>
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
    </>
  );
}
