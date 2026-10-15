/**
 * Estado de cortes con historial deshacer/rehacer y atajos de teclado.
 * Extraído de LiveConcertToAlbumModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React, { useCallback, useState } from "react";
import { TrackCutItem } from "../types";

/**
 * Estado de cortes con historial deshacer/rehacer y atajos de teclado.
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useTrackHistory() {
  const [tracks, setTracks] = useState<TrackCutItem[]>([]);

  const [history, setHistory] = useState<TrackCutItem[][]>([]);

  const [redoStack, setRedoStack] = useState<TrackCutItem[][]>([]);

  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  // Push snapshot to history stack before mutating tracks
  const pushHistorySnapshot = () => {
    setHistory((prev) => [...prev, tracks]);
    setRedoStack([]);
  };

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack((prev) => [tracks, ...prev]);
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setTracks(previous);
    setSelectedIndices([]);
  }, [history, tracks]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setHistory((prev) => [...prev, tracks]);
    setRedoStack((prev) => prev.slice(1));
    setTracks(next);
    setSelectedIndices([]);
  }, [redoStack, tracks]);

  // Keyboard shortcut listener for Ctrl+Z (Undo) and Ctrl+Y / Ctrl+Shift+Z (Redo)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditingText =
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          if (!isEditingText && redoStack.length > 0) {
            e.preventDefault();
            handleRedo();
          }
        } else {
          if (!isEditingText && history.length > 0) {
            e.preventDefault();
            handleUndo();
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        if (!isEditingText && redoStack.length > 0) {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [history.length, redoStack.length, handleUndo, handleRedo]);

  return { pushHistorySnapshot, setTracks, tracks, setSelectedIndices, selectedIndices, handleUndo, history, handleRedo, redoStack };
}
