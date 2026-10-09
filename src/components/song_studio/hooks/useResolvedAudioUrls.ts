/**
 * Resolución asíncrona de las URLs de audio (firmadas o relativas) de todas las pistas de la canción
 * Extraído de SongStudioModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useEffect, useState } from "react";
import { AudioTrack, Song } from "../../../types";
import { resolveAudioUrl } from "../../../utils/audioStorage";
import { getIdeaTracks } from "../ideaTracks";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface ResolvedAudioUrlsParams {
  song: Song;
}

/**
 * Resolución asíncrona de las URLs de audio (firmadas o relativas) de todas las pistas de la canción
 * @param params Estado y callbacks del contenedor ({@link ResolvedAudioUrlsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useResolvedAudioUrls({ song }: ResolvedAudioUrlsParams) {
  // Resolved audio URLs for HTML audio elements (resolves indexeddb: and drive URLs)
  const [resolvedAudioUrls, setResolvedAudioUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;
    const resolveAllTracks = async () => {
      const allTracks: AudioTrack[] = [];
      (song.audioIdeas || []).forEach((idea) => {
        const trs = getIdeaTracks(idea);
        allTracks.push(...trs);
      });

      const urlMap: Record<string, string> = {};
      for (const tr of allTracks) {
        if (tr.audioUrl) {
          if (tr.audioUrl.startsWith('indexeddb:') || tr.audioUrl.includes('drive.google.com')) {
            const res = await resolveAudioUrl(tr.audioUrl);
            if (res) urlMap[tr.id] = res;
          } else {
            urlMap[tr.id] = tr.audioUrl;
          }
        }
      }

      if (isMounted) {
        setResolvedAudioUrls((prev) => {
          const keysCurr = Object.keys(urlMap);
          const keysPrev = Object.keys(prev);
          if (keysCurr.length === keysPrev.length && keysCurr.every((k) => prev[k] === urlMap[k])) {
            return prev;
          }
          return urlMap;
        });
      }
    };

    resolveAllTracks();
    return () => {
      isMounted = false;
    };
  }, [song]);

  return { resolvedAudioUrls, setResolvedAudioUrls };
}
