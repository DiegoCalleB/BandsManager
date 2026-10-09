/**
 * Duraciones seguras de audio y formato de tiempo y desfase para el mezclador
 * Extraído de SongStudioModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/set-state-in-effect,
 react-hooks/exhaustive-deps,
 react-hooks/purity,
 react-hooks/immutability
*/


/** Dependencias que el componente contenedor inyecta al hook. */
export interface IdeaDurationsParams {
  durationMap: Record<string, number>;
}

/**
 * Duraciones seguras de audio y formato de tiempo y desfase para el mezclador
 * @param params Estado y callbacks del contenedor ({@link IdeaDurationsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useIdeaDurations({ durationMap }: IdeaDurationsParams) {
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

  return { getValidIdeaDuration, getSafeTrackDuration, formatTime, formatDesfase };
}
