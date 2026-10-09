import React, { useEffect, useCallback } from "react";
import { Song, Setlist, SetlistShortcut } from "../types";
import {
  saveSongsToLocalStorageSafely,
  saveSetlistsToLocalStorageSafely,
} from "../utils/audioStorage";
import {
  queuePendingSetlistSync,
  clearPendingSetlistSync,
  getPendingSetlistSyncs,
} from "../utils/offlineSync";
import { DEFAULT_SONGS, DEFAULT_SETLISTS } from "../config/defaultRepertoire";
import { SAMPLER_SONGS, SAMPLER_SETLISTS } from "../config/sampleRepertoire";

export interface UseRepertorioSyncParams {
  bandId?: string;
  cleanBand: string;
  isBakandeya: boolean;
  songs: Song[];
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
  setlists: Setlist[];
  setSetlists: React.Dispatch<React.SetStateAction<Setlist[]>>;
  setActiveSetlistId: React.Dispatch<React.SetStateAction<string>>;
  setCustomShortcuts: React.Dispatch<React.SetStateAction<SetlistShortcut[]>>;
  sanitizeBandSongs: (rawList: Song[]) => Song[];
  sanitizeBandSetlists: (rawList: Setlist[]) => Setlist[];
}

export interface UseRepertorioSyncResult {
  getHeaders: () => Record<string, string>;
  syncSetlistToBackend: (updatedSetlist: Setlist) => void;
}

/**
 * Hook para la sincronización robusta offline/online y persistencia segura de Repertorio y Setlists.
 * Cumple estrictamente AGENTS.md §2:
 * 1. Claves de localStorage aisladas con prefijo de banda (cero fugas multi-tenant).
 * 2. Cola offline de ediciones no sincronizadas (reintento automático al volver la conexión).
 * 3. Cabecera x-band-id y Bearer token consistentes en llamadas API.
 */
export function useRepertorioSync({
  bandId,
  cleanBand,
  isBakandeya,
  songs,
  setSongs,
  setlists,
  setSetlists,
  setActiveSetlistId,
  setCustomShortcuts,
  sanitizeBandSongs,
  sanitizeBandSetlists,
}: UseRepertorioSyncParams): UseRepertorioSyncResult {
  const getHeaders = useCallback(() => {
    const token =
      localStorage.getItem("bakandeya_token") || localStorage.getItem("token") || "";
    const effectiveBandId = bandId || cleanBand;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(effectiveBandId ? { "x-band-id": effectiveBandId } : {}),
    };
  }, [bandId, cleanBand]);

  // Si el PUT falla (sin conexión en concierto), queda en cola local para no perderse
  const syncSetlistToBackend = useCallback(
    (updatedSetlist: Setlist) => {
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
    },
    [bandId, getHeaders],
  );

  // Carga inicial y reconciliación offline/backend
  useEffect(() => {
    let isCancelled = false;
    const keyS = `band_songs_${cleanBand || "default"}`;
    const keySt = `band_setlists_${cleanBand || "default"}`;

    try {
      const savedS = localStorage.getItem(keyS);
      const parsedS = savedS ? JSON.parse(savedS) : [];
      const sanitizedS = sanitizeBandSongs(parsedS);
      setSongs(
        sanitizedS.length > 0
          ? sanitizedS
          : isBakandeya
            ? DEFAULT_SONGS
            : SAMPLER_SONGS,
      );

      const savedSt = localStorage.getItem(keySt);
      const parsedSt = savedSt ? JSON.parse(savedSt) : [];
      const sanitizedSt = sanitizeBandSetlists(parsedSt);
      setSetlists(
        sanitizedSt.length > 0
          ? sanitizedSt
          : isBakandeya
            ? DEFAULT_SETLISTS
            : SAMPLER_SETLISTS,
      );
      if (sanitizedSt.length > 0) {
        setActiveSetlistId(sanitizedSt[0].id);
      } else {
        setActiveSetlistId(
          isBakandeya ? "setlist-1" : SAMPLER_SETLISTS[0]?.id || "",
        );
      }
    } catch {
      setSongs(isBakandeya ? DEFAULT_SONGS : SAMPLER_SONGS);
      setSetlists(isBakandeya ? DEFAULT_SETLISTS : SAMPLER_SETLISTS);
    }

    const fetchRepertorio = async () => {
      try {
        const [resSongs, resSetlists] = await Promise.all([
          fetch("/api/songs", { headers: getHeaders() }),
          fetch("/api/setlists", { headers: getHeaders() }),
        ]);

        if (isCancelled) return;

        if (resSongs.ok) {
          const dataS = await resSongs.json();
          if (dataS.songs && Array.isArray(dataS.songs)) {
            const sanitized = sanitizeBandSongs(dataS.songs);
            setSongs(
              sanitized.length > 0
                ? sanitized
                : isBakandeya
                  ? DEFAULT_SONGS
                  : SAMPLER_SONGS,
            );
          }
        }

        if (resSetlists.ok) {
          const dataSt = await resSetlists.json();
          if (dataSt.setlists && Array.isArray(dataSt.setlists)) {
            const sanitized = sanitizeBandSetlists(dataSt.setlists);
            const finalSetlists =
              sanitized.length > 0
                ? sanitized
                : isBakandeya
                  ? DEFAULT_SETLISTS
                  : SAMPLER_SETLISTS;
            setSetlists(finalSetlists);
            if (finalSetlists.length > 0) {
              setActiveSetlistId((prev) =>
                finalSetlists.some((s: any) => s.id === prev)
                  ? prev
                  : finalSetlists[0].id,
              );
            } else {
              setActiveSetlistId("");
            }
          }
        }
      } catch (err) {
        console.warn(
          "Unable to load repertorio from server API, using cached state:",
          err,
        );
      }
    };

    const flushPendingSetlistSyncs = async () => {
      const pending = getPendingSetlistSyncs(bandId);
      if (pending.length === 0) return;
      await Promise.all(
        pending.map(async (setlist: any) => {
          try {
            const res = await fetch(`/api/setlists/${setlist.id}`, {
              method: "PUT",
              headers: getHeaders(),
              body: JSON.stringify(setlist),
            });
            if (res.ok) clearPendingSetlistSync(bandId, setlist.id);
          } catch {
            // Sigue sin haber conexión — se reintenta en el próximo montaje o al volver online.
          }
        }),
      );
    };

    (async () => {
      await flushPendingSetlistSyncs();
      if (!isCancelled) await fetchRepertorio();
    })();

    return () => {
      isCancelled = true;
    };
  }, [
    bandId,
    cleanBand,
    isBakandeya,
    sanitizeBandSongs,
    sanitizeBandSetlists,
    getHeaders,
    setSongs,
    setSetlists,
    setActiveSetlistId,
  ]);

  // Reintento al recuperar conexión de red
  useEffect(() => {
    const handleOnline = () => {
      getPendingSetlistSyncs(bandId).forEach((setlist: any) => {
        fetch(`/api/setlists/${setlist.id}`, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(setlist),
        })
          .then((res) => {
            if (res.ok) clearPendingSetlistSync(bandId, setlist.id);
          })
          .catch(() => {});
      });
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [bandId, getHeaders]);

  // Persistencia local segura en cambios de canciones y setlists
  useEffect(() => {
    saveSongsToLocalStorageSafely(songs, bandId);
  }, [songs, bandId]);

  useEffect(() => {
    saveSetlistsToLocalStorageSafely(setlists, bandId);
  }, [setlists, bandId]);

  // Carga de atajos personalizados de la banda
  useEffect(() => {
    let isCancelled = false;
    setCustomShortcuts([]);
    const fetchShortcuts = async () => {
      try {
        const res = await fetch("/api/setlist-shortcuts", {
          headers: getHeaders(),
        });
        if (isCancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.shortcuts)) {
            setCustomShortcuts(data.shortcuts);
          }
        }
      } catch (err) {
        console.warn(
          "No se pudieron cargar los accesos rápidos de repertorio:",
          err,
        );
      }
    };
    fetchShortcuts();
    return () => {
      isCancelled = true;
    };
  }, [bandId, getHeaders, setCustomShortcuts]);

  return {
    getHeaders,
    syncSetlistToBackend,
  };
}
