/**
 * Sincronización del setlist con el backend (con cola offline) y métricas derivadas del setlist activo.
 * Extraído de RepertorioSetlists.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
 
import { useMemo } from "react";
import { Setlist,Song } from "../../../types";
import { clearPendingSetlistSync,queuePendingSetlistSync } from "../../../utils/offlineSync";
import { calculateSetlistStats,formatSecondsToMinutes } from "../../../utils/repertorioUtils";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface SetlistSyncParams {
  getHeaders: () => { "x-band-id"?: string; Authorization?: string; "Content-Type": string; };
  bandId: string;
  activeSetlist: Setlist;
  songs: Song[];
}

/**
 * Sincronización del setlist con el backend (con cola offline) y métricas derivadas del setlist activo.
 * @param params Estado y callbacks del contenedor ({@link SetlistSyncParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useSetlistSync({ getHeaders, bandId, activeSetlist, songs }: SetlistSyncParams) {
  // Si el PUT falla (típicamente sin conexión, en un bolo), el cambio queda en una cola local
  // en vez de perderse: sin esto, un cambio de tono hecho sin wifi durante un concierto podía
  // desaparecer en cuanto la app recuperase conexión y volviera a pedir el setlist al servidor,
  // que devolvería la versión vieja sin enterarse nunca del cambio.
  const syncSetlistToBackend = (updatedSetlist: Setlist) => {
    fetch(`/api/setlists/${updatedSetlist.id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(updatedSetlist),
    })
      .then((res) => {
        if (res.ok) clearPendingSetlistSync(bandId, updatedSetlist.id);
        else queuePendingSetlistSync(bandId, updatedSetlist);
      })
      .catch((err) => {
        console.error("Error updating setlist on server:", err);
        queuePendingSetlistSync(bandId, updatedSetlist);
      });
  };


  // Calculate active setlist metrics (delegated to the shared, unit-tested helper)
  const activeSetlistMetrics = useMemo(() => {
    if (!activeSetlist)
      return {
        totalSeconds: 0,
        formattedTime: "0 min",
        songCount: 0,
        eventCount: 0,
        blockCount: 0,
        avgBpm: 0,
      };

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

  return { syncSetlistToBackend, activeSetlistMetrics };
}
