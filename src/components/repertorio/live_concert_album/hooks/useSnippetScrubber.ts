/**
 * Estado y controles del reproductor de fragmentos (tiempo, velocidad, salto, play/pausa).
 * Extraído de LiveConcertToAlbumModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React, { useState } from "react";

/**
 * Estado y controles del reproductor de fragmentos (tiempo, velocidad, salto, play/pausa).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useSnippetScrubber() {
  // Audio Fragment Scrubber Player State
  const [activeSnippet, setActiveSnippet] = useState<{
    trackIndex: number;
    title: string;
    audioUrl: string;
    start: number;
    end: number;
  } | null>(null);

  const [snippetCurrentTime, setSnippetCurrentTime] = useState(0);

  const [snippetDuration, setSnippetDuration] = useState(0);

  const [snippetIsPlaying, setSnippetIsPlaying] = useState(false);

  const [snippetSpeed, setSnippetSpeed] = useState(1);

  const snippetAudioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    if (snippetAudioRef.current) {
      if (snippetIsPlaying) {
        snippetAudioRef.current.play().catch((err) => {
          console.warn("Autoplay prevented or audio error:", err);
          setSnippetIsPlaying(false);
        });
      } else {
        snippetAudioRef.current.pause();
      }
    }
  }, [snippetIsPlaying, activeSnippet]);

  // Audio scrubber helper methods
  const handleSeekSnippet = (timeSecs: number) => {
    setSnippetCurrentTime(timeSecs);
    if (snippetAudioRef.current) {
      snippetAudioRef.current.currentTime = timeSecs;
    }
  };

  const handleSkipSnippet = (deltaSecs: number) => {
    if (!snippetAudioRef.current) return;
    const maxDur = snippetAudioRef.current.duration || 1000;
    const newTime = Math.max(
      0,
      Math.min(maxDur, snippetAudioRef.current.currentTime + deltaSecs),
    );
    snippetAudioRef.current.currentTime = newTime;
    setSnippetCurrentTime(newTime);
  };

  const handleChangeSnippetSpeed = (speed: number) => {
    setSnippetSpeed(speed);
    if (snippetAudioRef.current) {
      snippetAudioRef.current.playbackRate = speed;
    }
  };

  return { activeSnippet, snippetCurrentTime, setActiveSnippet, snippetAudioRef, setSnippetCurrentTime, setSnippetIsPlaying, snippetIsPlaying, setSnippetDuration, snippetDuration, handleSeekSnippet, handleSkipSnippet, handleChangeSnippetSpeed, snippetSpeed };
}
