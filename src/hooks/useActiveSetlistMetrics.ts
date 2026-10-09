import { useMemo } from "react";
import { Setlist, Song } from "../types";
import { calculateSetlistStats, formatSecondsToMinutes } from "../utils/repertorioUtils";

export interface ActiveSetlistMetricsResult {
  totalSeconds: number;
  formattedTime: string;
  songCount: number;
  eventCount: number;
  blockCount: number;
  avgBpm: number;
}

/**
 * Hook para calcular las métricas agregadas del setlist activo (duración total,
 * conteo de canciones, bloques de interludio, promedio de BPM).
 * Memoizado para evitar cálculos repetitivos en renderizados de audio o UI.
 */
export function useActiveSetlistMetrics(
  activeSetlist: Setlist | null,
  songs: Song[],
): ActiveSetlistMetricsResult {
  return useMemo(() => {
    if (!activeSetlist) {
      return {
        totalSeconds: 0,
        formattedTime: "0 min",
        songCount: 0,
        eventCount: 0,
        blockCount: 0,
        avgBpm: 0,
      };
    }

    const songMap = new Map(songs.map((s) => [s.id, s]));
    const stats = calculateSetlistStats(activeSetlist.items, songMap);

    return {
      totalSeconds: stats.totalDurationSeconds,
      formattedTime: formatSecondsToMinutes(stats.totalDurationSeconds),
      songCount: stats.songCount,
      eventCount: stats.eventCount,
      blockCount: stats.blockCount,
      avgBpm: stats.averageBpm,
    };
  }, [activeSetlist, songs]);
}
