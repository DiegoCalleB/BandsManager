/**
 * Reproducción del avance de audio de la banda.
 * Extraído de FansLanding.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React,{ useState } from "react";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface AudioPreviewParams {
  audioPreviewConfig: { audioUrl?: string } | null;
  trackClick: (platform: string, url?: string, context?: string) => void;
}

/**
 * Reproducción del avance de audio de la banda.
 * @param params Estado y callbacks del contenedor ({@link AudioPreviewParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useAudioPreview({ audioPreviewConfig, trackClick }: AudioPreviewParams) {
  const [isPlayingAudioPreview, setIsPlayingAudioPreview] = useState(false);

  const audioPreviewRef = React.useRef<HTMLAudioElement | null>(null);

  const toggleAudioPreview = () => {
    const targetAudioUrl = audioPreviewConfig?.audioUrl?.trim();
    if (!targetAudioUrl) {
      console.warn("No hay URL de audio configurada para reproducir.");
      return;
    }

    if (
      !audioPreviewRef.current ||
      audioPreviewRef.current.src !== targetAudioUrl
    ) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      const audio = new Audio(targetAudioUrl);
      audio.onended = () => setIsPlayingAudioPreview(false);
      audioPreviewRef.current = audio;
    }
    if (isPlayingAudioPreview) {
      audioPreviewRef.current.pause();
      setIsPlayingAudioPreview(false);
    } else {
      audioPreviewRef.current
        .play()
        .then(() => {
          setIsPlayingAudioPreview(true);
          trackClick("audio_preview", "", "landing");
        })
        .catch((err) => {
          console.warn("Error playing audio preview:", err);
          setIsPlayingAudioPreview(false);
        });
    }
  };

  return { toggleAudioPreview, isPlayingAudioPreview };
}
