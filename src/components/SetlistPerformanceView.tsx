/**
 * Visor de repertorio en directo / ensayo.
 * Contenedor: controlador + proveedor + vistas (Strangler Fig, AGENTS.md §5.6).
 */
import React from "react";
import type { Rehearsal,RehearsalAgendaItem,Setlist,Song,SongAudioIdea,User } from "../types";
import { SetlistPerformanceProvider } from "./setlist_performance/SetlistPerformanceProvider";
import { SetlistPerformanceRoot } from "./setlist_performance/SetlistPerformanceRoot";
import { useSetlistPerformanceController } from "./setlist_performance/hooks/useSetlistPerformanceController";

export interface SetlistPerformanceViewProps {
  setlist: Setlist;
  songs: Song[];
  onClose: () => void;
  onOpenStudioModal?: (song: Song) => void;
  onOpenPracticeMode?: (song: Song, idea: SongAudioIdea) => void;
  onUpdateSong?: (song: Song) => void;
  currentUser?: User;
  initialMode?: "directo" | "ensayo";
  /** Si el visor se abre desde un ensayo: agenda original y callback para guardar la evaluación. */
  seguimientoEnsayo?: {
    agenda: RehearsalAgendaItem[];
    onUpdateRehearsal: (cambios: Partial<Rehearsal>) => void;
  };
}


/**
 * Visor de repertorio en directo / ensayo.
 * @param props Repertorio, canciones y callbacks de estudio, práctica y guardado.
 * @returns El visor con su contexto.
 */
export const SetlistPerformanceView: React.FC<SetlistPerformanceViewProps> = ({ initialMode = "directo", ...props }) => {
  const controller = useSetlistPerformanceController({ ...props, initialMode });
  return (
    <SetlistPerformanceProvider value={{ ...controller, ...props, initialMode }}>
      <SetlistPerformanceRoot />
    </SetlistPerformanceProvider>
  );
};
