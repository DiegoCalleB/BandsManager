/**
 * Carga inicial y por API de canciones y setlists, saneados por banda sin mezclar datos de otra banda.
 * Extraído de RepertorioSetlists.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
 
import { useEffect,useState } from "react";
import { SAMPLER_SETLISTS,SAMPLER_SONGS } from "../../../config/sampleRepertoire";
import { api } from "../../../services/api";
import { Setlist,Song } from "../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface RepertorioDataParams {
  cleanBand: string;
}

/**
 * Carga inicial y por API de canciones y setlists, saneados por banda sin mezclar datos de otra banda.
 * @param params Estado y callbacks del contenedor ({@link RepertorioDataParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useRepertorioData({ cleanBand }: RepertorioDataParams) {
  // Songs Repertoire State
  const [songs, setSongs] = useState<Song[]>(() => {
    try {
      const key = `band_songs_${cleanBand || "default"}`;
      const saved = localStorage.getItem(key);
      const parsed = saved ? JSON.parse(saved) : [];
      const sanitized: Song[] = Array.isArray(parsed) ? parsed : [];
      if (sanitized.length > 0) {
        return sanitized;
      }
      return SAMPLER_SONGS;
    } catch {
      return SAMPLER_SONGS;
    }
  });

  useEffect(() => {
    let isMounted = true;
    const loadSongs = async () => {
      try {
        const res = await api.getSongs();
        // Solo actualizar si la API devuelve canciones (array no-vacío)
        if (
          isMounted &&
          res?.songs &&
          Array.isArray(res.songs) &&
          res.songs.length > 0
        ) {
          setSongs(res.songs);
        }
      } catch (err) {
        console.error("Failed to load songs:", err);
      }
    };
    loadSongs();
    return () => {
      isMounted = false;
    };
  }, [cleanBand]);

  // Setlists State
  const [setlists, setSetlists] = useState<Setlist[]>(() => {
    try {
      const key = `band_setlists_${cleanBand || "default"}`;
      const saved = localStorage.getItem(key);
      const parsed = saved ? JSON.parse(saved) : [];
      const sanitized: Setlist[] = Array.isArray(parsed) ? parsed : [];
      if (sanitized.length > 0) {
        return sanitized;
      }
      return SAMPLER_SETLISTS;
    } catch {
      return SAMPLER_SETLISTS;
    }
  });

  return { setlists, songs, setSongs, setSetlists };
}
