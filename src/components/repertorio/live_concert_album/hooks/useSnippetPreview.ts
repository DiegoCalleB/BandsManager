/**
 * Reproduce la muestra de un corte y fija inicio/fin desde la posición del reproductor.
 * Extraído de LiveConcertToAlbumModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch, RefObject, SetStateAction, useState } from "react";
import { apiFetch } from "../../../../utils/api";
import { getErrorMessage } from "../../../../utils/errorMessage";
import type { SnippetPreviewResponse, TrackCutItem } from "../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface SnippetPreviewParams {
  activeSnippet: { trackIndex: number; title: string; audioUrl: string; start: number; end: number; };
  snippetAudioRef: RefObject<HTMLAudioElement>;
  setSnippetCurrentTime: Dispatch<SetStateAction<number>>;
  setSnippetIsPlaying: Dispatch<SetStateAction<boolean>>;
  snippetIsPlaying: boolean;
  setActiveSnippet: Dispatch<SetStateAction<{ trackIndex: number; title: string; audioUrl: string; start: number; end: number; }>>;
  youtubeUrl: string;
  analyzedSourcePath: string;
  handleUpdateTrack: (index: number, key: keyof TrackCutItem, value: TrackCutItem[keyof TrackCutItem]) => void;
  snippetCurrentTime: number;
}

/**
 * Reproduce la muestra de un corte y fija inicio/fin desde la posición del reproductor.
 * @param params Estado y callbacks del contenedor ({@link SnippetPreviewParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useSnippetPreview({ activeSnippet, snippetAudioRef, setSnippetCurrentTime, setSnippetIsPlaying, snippetIsPlaying, setActiveSnippet, youtubeUrl, analyzedSourcePath, handleUpdateTrack, snippetCurrentTime }: SnippetPreviewParams) {
  const [playingTrackUrl] = useState<string | null>(null);

  const [loadingSnippetIndex, setLoadingSnippetIndex] = useState<number | null>(
    null,
  );

  const getYouTubeVideoId = (url: string) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Preview snippet playback (Generates or plays audio for a single cut item)
  const handlePlaySnippetPreview = async (
    track: TrackCutItem,
    startFromCue: boolean = false,
  ) => {
    const cueOffset =
      startFromCue && track.cueIn && track.cueIn > 0 ? track.cueIn : 0;

    if (activeSnippet && activeSnippet.trackIndex === track.index) {
      if (snippetAudioRef.current) {
        if (startFromCue && track.cueIn) {
          snippetAudioRef.current.currentTime = track.cueIn;
          setSnippetCurrentTime(track.cueIn);
          snippetAudioRef.current.play();
          setSnippetIsPlaying(true);
          return;
        }
        if (snippetIsPlaying) {
          snippetAudioRef.current.pause();
        } else {
          snippetAudioRef.current.play();
        }
      }
      return;
    }

    if (track.audioUrl) {
      setActiveSnippet({
        trackIndex: track.index,
        title: track.title,
        audioUrl: track.audioUrl,
        start: track.start,
        end: track.end,
      });
      setSnippetCurrentTime(cueOffset);
      setSnippetIsPlaying(true);
      setTimeout(() => {
        if (snippetAudioRef.current && cueOffset > 0) {
          snippetAudioRef.current.currentTime = cueOffset;
        }
      }, 100);
      return;
    }

    // Direct YouTube Player Sync if no local file is uploaded
    const ytVideoId = getYouTubeVideoId(youtubeUrl);
    if (!analyzedSourcePath && ytVideoId) {
      setActiveSnippet({
        trackIndex: track.index,
        title: track.title,
        audioUrl: "",
        start: track.start,
        end: track.end,
      });
      setSnippetCurrentTime(cueOffset);
      setSnippetIsPlaying(true);
      return;
    }

    setLoadingSnippetIndex(track.index);
    try {
      const data = await apiFetch<SnippetPreviewResponse>("/api/concert-to-album/preview-snippet", {
        method: "POST",
        body: JSON.stringify({
          url: youtubeUrl.trim(),
          sourceFilePath: analyzedSourcePath,
          start: track.start,
          end: track.end,
          trackIndex: track.index,
        }),
      });

      if (data?.audioUrl) {
        handleUpdateTrack(track.index, "audioUrl", data.audioUrl);
        setActiveSnippet({
          trackIndex: track.index,
          title: track.title,
          audioUrl: data.audioUrl,
          start: track.start,
          end: track.end,
        });
        setSnippetCurrentTime(cueOffset);
        setSnippetIsPlaying(true);
        setTimeout(() => {
          if (snippetAudioRef.current && cueOffset > 0) {
            snippetAudioRef.current.currentTime = cueOffset;
          }
        }, 150);
      }
    } catch (err) {
      console.error("Error generating snippet preview:", err);
      alert(getErrorMessage(err, "No se pudo generar la previsualización del trozo."));
    } finally {
      setLoadingSnippetIndex(null);
    }
  };

  const handleSetStartFromCurrentSnippet = (trackIndex: number) => {
    if (!activeSnippet) return;
    const currentAbs = Math.max(
      0,
      Math.round((activeSnippet.start + snippetCurrentTime) * 10) / 10,
    );
    handleUpdateTrack(trackIndex, "start", currentAbs);
  };

  const handleSetEndFromCurrentSnippet = (trackIndex: number) => {
    if (!activeSnippet) return;
    const currentAbs = Math.max(
      0,
      Math.round((activeSnippet.start + snippetCurrentTime) * 10) / 10,
    );
    handleUpdateTrack(trackIndex, "end", currentAbs);
  };

  return { loadingSnippetIndex, playingTrackUrl, handlePlaySnippetPreview, handleSetStartFromCurrentSnippet, handleSetEndFromCurrentSnippet, getYouTubeVideoId };
}
