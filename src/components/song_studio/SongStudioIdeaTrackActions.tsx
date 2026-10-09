/**
 * Acciones de pista de una idea: añadir pista (grabar o subir)
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/exhaustive-deps
*/
import { Plus } from "lucide-react";
import { SongAudioIdea, AudioTrack } from "../../types";
import React, { Dispatch, SetStateAction } from "react";
import { useSongStudio } from "./SongStudioContext";

/** Datos propios de cada instancia (el resto sale del contexto del estudio). */
export interface SongStudioIdeaTrackActionsProps {
  modoIris: boolean;
  idea: SongAudioIdea;
  tracks: AudioTrack[];
}

/**
 * Acciones de pista de una idea: añadir pista (grabar o subir)
 * @returns Sección de interfaz.
 */
export function SongStudioIdeaTrackActions({ modoIris, idea, tracks }: SongStudioIdeaTrackActionsProps) {
  const { addingTrackIdeaId, setAddingTrackIdeaId, setNewTrackName, setNewTrackInstrument } = useSongStudio();
  return (
    <>
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
    </>
  );
}
