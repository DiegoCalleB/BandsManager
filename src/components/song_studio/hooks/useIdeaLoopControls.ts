/**
 * Bucle y puntos de entrada/salida (cue in/out) por idea
 * Extraído de SongStudioModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch, SetStateAction } from "react";
import { SongAudioIdea } from "../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface IdeaLoopControlsParams {
  getValidIdeaDuration: (ideaId: string) => number;
  setLoopConfigMap: Dispatch<SetStateAction<Record<string, { enabled: boolean; start: number; end: number; }>>>;
  currentTimeMap: Record<string, number>;
}

/**
 * Bucle y puntos de entrada/salida (cue in/out) por idea
 * @param params Estado y callbacks del contenedor ({@link IdeaLoopControlsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useIdeaLoopControls({ getValidIdeaDuration, setLoopConfigMap, currentTimeMap }: IdeaLoopControlsParams) {
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

  return { toggleIdeaLoop, setIdeaCueIn, setIdeaCueOut };
}
