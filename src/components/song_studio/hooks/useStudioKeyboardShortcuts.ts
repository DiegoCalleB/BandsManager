/**
 * Atajos de teclado estilo Cubase de Song Studio (espacio, bucle, cue, mute/solo, grabar)
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
import { useEffect, RefObject, Dispatch, SetStateAction } from "react";
import { getIdeaTracks } from "../ideaTracks";
import { Song, SongAudioIdea } from "../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface StudioKeyboardShortcutsParams {
  song: Song;
  playingIdeaIdRef: RefObject<string>;
  isRecordingTrack: boolean;
  stopRecordingTrackOverdub: () => void;
  togglePlayIdea: (idea: SongAudioIdea) => Promise<void>;
  handleStopIdea: (idea: SongAudioIdea) => void;
  handlePauseIdea: (idea: SongAudioIdea) => void;
  toggleIdeaLoop: (idea: SongAudioIdea) => void;
  setIdeaCueIn: (idea: SongAudioIdea) => void;
  setIdeaCueOut: (idea: SongAudioIdea) => void;
  startRecordingTrackOverdub: (idea: SongAudioIdea) => Promise<void>;
  setShowAddIdea: Dispatch<SetStateAction<boolean>>;
  currentTimeMap: Record<string, number>;
  handleSeekIdea: (idea: SongAudioIdea, newTime: number) => void;
  durationMap: Record<string, number>;
  handleToggleMuteTrack: (idea: SongAudioIdea, trackId: string) => void;
  handleToggleSoloTrack: (idea: SongAudioIdea, trackId: string) => void;
  setShowCubaseHelp: Dispatch<SetStateAction<boolean>>;
  loopConfigMap: Record<string, { enabled: boolean; start: number; end: number; }>;
}

/**
 * Atajos de teclado estilo Cubase de Song Studio (espacio, bucle, cue, mute/solo, grabar)
 * @param params Estado y callbacks del contenedor ({@link StudioKeyboardShortcutsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useStudioKeyboardShortcuts({ song, playingIdeaIdRef, isRecordingTrack, stopRecordingTrackOverdub, togglePlayIdea, handleStopIdea, handlePauseIdea, toggleIdeaLoop, setIdeaCueIn, setIdeaCueOut, startRecordingTrackOverdub, setShowAddIdea, currentTimeMap, handleSeekIdea, durationMap, handleToggleMuteTrack, handleToggleSoloTrack, setShowCubaseHelp, loopConfigMap }: StudioKeyboardShortcutsParams) {
  // Cubase Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keypresses if typing in input, textarea, select or contenteditable
      const activeEl = document.activeElement;
      if (activeEl) {
        const tagName = activeEl.tagName.toUpperCase();
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || (activeEl as HTMLElement).isContentEditable) {
          return;
        }
      }

      const activeIdea = (song.audioIdeas || []).find((i) => i.id === playingIdeaIdRef.current) || (song.audioIdeas || [])[0];

      // If currently recording an overdub track, pressing R, Space, or Stop keys finishes recording
      if (isRecordingTrack) {
        if (
          ['Space', 'Numpad0', 'Digit0', 'KeyR', 'NumpadMultiply', 'KeyP', 'Escape', 'Home', 'NumpadEnter'].includes(e.code) ||
          e.key === 'Home'
        ) {
          e.preventDefault();
          stopRecordingTrackOverdub();
          return;
        }
      }

      // [Espacio]: Alternar Reproducir / Pausar Transport
      if (e.code === 'Space') {
        e.preventDefault();
        if (activeIdea) {
          togglePlayIdea(activeIdea);
        }
      }
      // [Numpad0 / Digit0 / Home / Escape / Enter]: Detener e ir a inicio (Stop & Rewind)
      else if (e.code === 'Numpad0' || e.code === 'Digit0' || e.key === 'Home' || e.code === 'NumpadEnter') {
        e.preventDefault();
        if (activeIdea) {
          handleStopIdea(activeIdea);
        }
      }
      // [KeyP]: Pausar en posición actual
      else if (e.code === 'KeyP') {
        e.preventDefault();
        if (activeIdea) {
          handlePauseIdea(activeIdea);
        }
      }
      // [KeyL / Slash]: Alternar Bucle (Loop)
      else if (e.code === 'KeyL' || e.code === 'Slash') {
        e.preventDefault();
        if (activeIdea) {
          toggleIdeaLoop(activeIdea);
        }
      }
      // [KeyI]: Fijar Cue In / Loop Start en la posición actual
      else if (e.code === 'KeyI') {
        e.preventDefault();
        if (activeIdea) {
          setIdeaCueIn(activeIdea);
        }
      }
      // [KeyO]: Fijar Cue Out / Loop End en la posición actual
      else if (e.code === 'KeyO') {
        e.preventDefault();
        if (activeIdea) {
          setIdeaCueOut(activeIdea);
        }
      }
      // [KeyR / NumpadMultiply]: Iniciar grabación overdub
      else if (e.code === 'KeyR' || e.code === 'NumpadMultiply') {
        e.preventDefault();
        if (activeIdea) {
          startRecordingTrackOverdub(activeIdea);
        } else {
          setShowAddIdea(true);
        }
      }
      // [KeyN]: Abrir/Cerrar formulario de Nueva Idea
      else if (e.code === 'KeyN') {
        e.preventDefault();
        setShowAddIdea((prev) => !prev);
      }
      // [Flecha Izquierda]: Retroceder 5s (o 15s con Shift)
      else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (activeIdea) {
          const cur = currentTimeMap[activeIdea.id] || 0;
          const delta = e.shiftKey ? 15 : 5;
          handleSeekIdea(activeIdea, Math.max(0, cur - delta));
        }
      }
      // [Flecha Derecha]: Avanzar 5s (o 15s con Shift)
      else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (activeIdea) {
          const cur = currentTimeMap[activeIdea.id] || 0;
          const maxDur = durationMap[activeIdea.id] || 300;
          const delta = e.shiftKey ? 15 : 5;
          handleSeekIdea(activeIdea, Math.min(maxDur, cur + delta));
        }
      }
      // [KeyM]: Alternar Silencio (Mute) en la idea activa
      else if (e.code === 'KeyM') {
        e.preventDefault();
        if (activeIdea) {
          const tracks = getIdeaTracks(activeIdea);
          if (tracks.length > 0) {
            tracks.forEach((tr) => handleToggleMuteTrack(activeIdea, tr.id));
          }
        }
      }
      // [KeyS]: Alternar Solo en la primera pista
      else if (e.code === 'KeyS') {
        e.preventDefault();
        if (activeIdea) {
          const tracks = getIdeaTracks(activeIdea);
          if (tracks.length > 0) {
            handleToggleSoloTrack(activeIdea, tracks[0].id);
          }
        }
      }
      // [KeyK or ?]: Abrir / Cerrar guía de atajos Cubase
      else if (e.code === 'KeyK' || e.key === '?') {
        e.preventDefault();
        setShowCubaseHelp((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [song, currentTimeMap, durationMap, loopConfigMap]);

  return {  };
}
