/**
 * Persistencia del repertorio: favoritos, cabeceras de API, guardado local seguro, carga desde el servidor, reintento offline y análisis IA guardado.
 * Extraído de RepertorioSetlists.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
/* eslint-disable
 react-hooks/exhaustive-deps
*/
import { Dispatch,SetStateAction,useEffect } from "react";
import { DEFAULT_SETLISTS,DEFAULT_SONGS } from "../../../config/defaultRepertoire";
import { SAMPLER_SETLISTS,SAMPLER_SONGS } from "../../../config/sampleRepertoire";
import { Setlist,SetlistShortcut,Song } from "../../../types";
import { saveSetlistsToLocalStorageSafely,saveSongsToLocalStorageSafely } from "../../../utils/audioStorage";
import { guardarOReverter } from "../../../utils/guardarConReversion";
import { clearPendingSetlistSync,getPendingSetlistSyncs } from "../../../utils/offlineSync";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface RepertorioPersistenceParams {
  songs: Song[];
  setSongs: Dispatch<SetStateAction<Song[]>>;
  bandId: string;
  cleanBand: string;
  sanitizeBandSongs: (rawList: Song[]) => Song[];
  isBakandeya: boolean;
  sanitizeBandSetlists: (rawList: Setlist[]) => Setlist[];
  setSetlists: Dispatch<SetStateAction<Setlist[]>>;
  setActiveSetlistId: Dispatch<SetStateAction<string>>;
  setlists: Setlist[];
  setCustomShortcuts: Dispatch<SetStateAction<SetlistShortcut[]>>;
}

/**
 * Persistencia del repertorio: favoritos, cabeceras de API, guardado local seguro, carga desde el servidor, reintento offline y análisis IA guardado.
 * @param params Estado y callbacks del contenedor ({@link RepertorioPersistenceParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useRepertorioPersistence({ songs, setSongs, bandId, cleanBand, sanitizeBandSongs, isBakandeya, sanitizeBandSetlists, setSetlists, setActiveSetlistId, setlists, setCustomShortcuts }: RepertorioPersistenceParams) {
  const toggleFavoriteSong = (songId: string) => {
    const target = songs.find((s) => s.id === songId);
    if (!target) return;
    const updatedSong = { ...target, favoritoGeneral: !target.favoritoGeneral };
    const aplicar = (favorito: boolean | undefined) =>
      setSongs((prev) => {
        const next = prev.map((s) =>
          s.id === songId ? { ...s, favoritoGeneral: favorito } : s,
        );
        saveSongsToLocalStorageSafely(next);
        return next;
      });
    aplicar(updatedSong.favoritoGeneral);
    void guardarOReverter(
      fetch("/api/songs/" + songId, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(updatedSong),
      }),
      () => aplicar(target.favoritoGeneral),
    );
  };

  // Save changes to localStorage and Backend API
  const getHeaders = () => {
    const token =
      localStorage.getItem("bakandeya_token") || localStorage.getItem("token") || "";
    const effectiveBandId = bandId || cleanBand;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(effectiveBandId ? { "x-band-id": effectiveBandId } : {}),
    };
  };

  useEffect(() => {
    let isCancelled = false;
    // On bandId change, immediately reset and load the clean cache for this band
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
                finalSetlists.some((s: Setlist) => s.id === prev)
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

    // Antes de fiarnos de lo que diga el servidor, reenviamos cualquier edición de setlist que
    // se quedó pendiente sin conexión (p.ej. un cambio de tono en un bolo sin wifi) — si no, el
    // fetch de abajo traería la versión vieja del servidor y la pisaría sin que nadie se entere.
    const flushPendingSetlistSyncs = async () => {
      const pending = getPendingSetlistSyncs(bandId);
      if (pending.length === 0) return;
      await Promise.all(
        pending.map(async (setlist: Setlist) => {
          try {
            const res = await fetch(`/api/setlists/${setlist.id}`, {
              method: "PUT",
              headers: getHeaders(),
              body: JSON.stringify(setlist),
            });
            if (res.ok) clearPendingSetlistSync(bandId, setlist.id);
          } catch {
            // Sigue sin haber conexión — se reintenta en el próximo montaje o al volver'online'.
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
  }, [bandId, cleanBand, isBakandeya, sanitizeBandSongs, sanitizeBandSetlists]);

  // Reintenta ediciones de setlist pendientes en cuanto el navegador recupera conexión, sin
  // esperar a que el usuario cierre y reabra la pestaña (que es cuando fetchRepertorio corre).
  useEffect(() => {
    const handleOnline = () => {
      getPendingSetlistSyncs(bandId).forEach((setlist: Setlist) => {
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
  }, [bandId]);

  useEffect(() => {
    saveSongsToLocalStorageSafely(songs, bandId);
  }, [songs, bandId]);

  useEffect(() => {
    saveSetlistsToLocalStorageSafely(setlists, bandId);
  }, [setlists, bandId]);

  // Load this band's own custom setlist shortcuts
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
  }, [bandId]);

  return { getHeaders, toggleFavoriteSong };
}
