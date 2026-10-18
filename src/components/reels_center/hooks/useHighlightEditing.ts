/**
 * Selecciona un highlight y ajusta su recorte manteniendo sincronizado el resto del estado del clip.
 * Extraído de ReelsCenter.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch, SetStateAction } from "react";
import { HighlightClip } from "../../../utils/reelsUtils";
import { copyForPlatform, parseRangeTimes } from "../reelsHelpers";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface HighlightEditingParams {
  setSelectedHighlightIndex: Dispatch<SetStateAction<number>>;
  setRenderedClipUrl: Dispatch<SetStateAction<string>>;
  setRenderedClipSize: Dispatch<SetStateAction<number>>;
  setRenderedBurnedSubs: Dispatch<SetStateAction<boolean>>;
  setRenderedStoredPermanently: Dispatch<SetStateAction<boolean>>;
  setRenderedSubUrl: Dispatch<SetStateAction<string>>;
  setSubtitleCues: Dispatch<SetStateAction<{ text: string; start: number; end: number; }[]>>;
  setWordOffsets: Dispatch<SetStateAction<{ word: string; start: number; end: number; }[]>>;
  setCurrentSubtitleText: Dispatch<SetStateAction<string>>;
  setCuttingError: Dispatch<SetStateAction<string>>;
  setClipUserNote: Dispatch<SetStateAction<string>>;
  setReanalyzeSuccessMsg: Dispatch<SetStateAction<string>>;
  highlights: HighlightClip[];
  copyObjective: "viral" | "comunidad" | "conversion";
  setEditedCopy: Dispatch<SetStateAction<string>>;
  selectedPlatform: "Instagram" | "TikTok" | "YouTube" | "Facebook";
  selectedHighlightIndex: number;
  setHighlights: Dispatch<SetStateAction<HighlightClip[]>>;
  setSimulatedTime: Dispatch<SetStateAction<number>>;
  setYtLoopCount: Dispatch<SetStateAction<number>>;
}

/**
 * Selecciona un highlight y ajusta su recorte manteniendo sincronizado el resto del estado del clip.
 * @param params Estado y callbacks del contenedor ({@link HighlightEditingParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useHighlightEditing({ setSelectedHighlightIndex, setRenderedClipUrl, setRenderedClipSize, setRenderedBurnedSubs, setRenderedStoredPermanently, setRenderedSubUrl, setSubtitleCues, setWordOffsets, setCurrentSubtitleText, setCuttingError, setClipUserNote, setReanalyzeSuccessMsg, highlights, copyObjective, setEditedCopy, selectedPlatform, selectedHighlightIndex, setHighlights, setSimulatedTime, setYtLoopCount }: HighlightEditingParams) {
  // Change active highlight in lighttable
  const handleSelectHighlight = (index: number) => {
    setSelectedHighlightIndex(index);
    // Reset physical cutting states when switching segments
    setRenderedClipUrl(null);
    setRenderedClipSize(0);
    setRenderedBurnedSubs(false);
    setRenderedStoredPermanently(false);
    setRenderedSubUrl(null);
    setSubtitleCues([]);
    setWordOffsets([]);
    setCurrentSubtitleText("");
    setCuttingError(null);
    setClipUserNote("");
    setReanalyzeSuccessMsg(null);

    const clip = highlights[index];
    if (clip) {
      if (copyObjective === "viral" && clip.copyViral) {
        setEditedCopy(clip.copyViral);
      } else if (copyObjective === "comunidad" && clip.copyComunidad) {
        setEditedCopy(clip.copyComunidad);
      } else if (copyObjective === "conversion" && clip.copyConversion) {
        setEditedCopy(clip.copyConversion);
      } else {
        setEditedCopy(copyForPlatform(clip, selectedPlatform));
      }
    }
  };

  // Crop edit adjustments (Extending or trimming from left or right)
  const handleAdjustCrop = (
    direction: "start_minus" | "start_plus" | "end_minus" | "end_plus",
  ) => {
    const currentClip = highlights[selectedHighlightIndex];
    if (!currentClip) return;

    const { start, end } = parseRangeTimes(currentClip.range);
    let newStart = start;
    let newEnd = end;

    if (direction === "start_minus") {
      newStart = Math.max(0, start - 1);
    } else if (direction === "start_plus") {
      newStart = Math.min(end - 1, start + 1);
    } else if (direction === "end_minus") {
      newEnd = Math.max(start + 1, end - 1);
    } else if (direction === "end_plus") {
      newEnd = end + 1;
    }

    const formatSecsToMMSS = (totalSecs: number) => {
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const newRange = `${formatSecsToMMSS(newStart)}-${formatSecsToMMSS(newEnd)}`;

    // Update state
    setHighlights((prev) =>
      prev.map((clip, index) =>
        index === selectedHighlightIndex ? { ...clip, range: newRange } : clip,
      ),
    );
    setSimulatedTime(0); // reset playback timer to restart from new crop
    setYtLoopCount((c) => c + 1); // trigger iframe refresh
  };

  return { handleSelectHighlight, handleAdjustCrop };
}
