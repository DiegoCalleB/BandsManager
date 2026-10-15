/**
 * Edita la lista de cortes: añadir, borrar, mover, fusionar, dividir y renombrar por lote.
 * Extraído de LiveConcertToAlbumModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch, SetStateAction, useState } from "react";
import { formatSeconds } from "../timeFormat";
import { TrackCutItem } from "../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface TrackEditingParams {
  pushHistorySnapshot: () => void;
  setTracks: Dispatch<SetStateAction<TrackCutItem[]>>;
  tracks: TrackCutItem[];
  setSelectedIndices: Dispatch<SetStateAction<number[]>>;
  selectedIndices: number[];
  activeSnippet: { trackIndex: number; title: string; audioUrl: string; start: number; end: number; };
  snippetCurrentTime: number;
  setActiveSnippet: Dispatch<SetStateAction<{ trackIndex: number; title: string; audioUrl: string; start: number; end: number; }>>;
}

/**
 * Edita la lista de cortes: añadir, borrar, mover, fusionar, dividir y renombrar por lote.
 * @param params Estado y callbacks del contenedor ({@link TrackEditingParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useTrackEditing({ pushHistorySnapshot, setTracks, tracks, setSelectedIndices, selectedIndices, activeSnippet, snippetCurrentTime, setActiveSnippet }: TrackEditingParams) {
  // Quick Naming & Batch Renaming Assistant state
  const [showQuickNamingModal, setShowQuickNamingModal] = useState(false);

  const [batchPastedText, setBatchPastedText] = useState("");

  const [quickNamingActiveTab, setQuickNamingActiveTab] = useState<
    "table" | "paste"
  >("table");

  // Track modification helpers
  const handleUpdateTrack = (
    index: number,
    key: keyof TrackCutItem,
    value: TrackCutItem[keyof TrackCutItem],
  ) => {
    pushHistorySnapshot();
    setTracks((prev) =>
      prev.map((t) => {
        if (t.index === index) {
          const updated = { ...t, [key]: value };
          if (key === "start" || key === "end") {
            updated.duration = Math.max(0, updated.end - updated.start);
          }
          return updated;
        }
        return t;
      }),
    );
  };

  const handleAddCutTrack = (afterIndex: number) => {
    pushHistorySnapshot();
    setTracks((prev) => {
      const currentTrack = prev.find((t) => t.index === afterIndex);
      const start = currentTrack ? currentTrack.end : 0;
      const end = start + 180;
      const newTrack: TrackCutItem = {
        index: prev.length + 1,
        title: `Nueva Pista ${prev.length + 1}`,
        start,
        end,
        duration: 180,
        type: "musica",
      };
      const updated = [...prev, newTrack];
      return updated.map((t, i) => ({ ...t, index: i + 1 }));
    });
  };

  const handleDeleteTrack = (index: number) => {
    pushHistorySnapshot();
    setTracks((prev) => {
      const filtered = prev.filter((t) => t.index !== index);
      return filtered.map((t, i) => ({ ...t, index: i + 1 }));
    });
  };

  const handleMoveTrack = (index: number, direction: "up" | "down") => {
    pushHistorySnapshot();
    setTracks((prev) => {
      const idx = prev.findIndex((t) => t.index === index);
      if (idx < 0) return prev;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;

      const newArr = [...prev];
      const temp = newArr[idx];
      newArr[idx] = newArr[targetIdx];
      newArr[targetIdx] = temp;

      return newArr.map((t, i) => ({ ...t, index: i + 1 }));
    });
  };

  // Quick naming & speech title helpers
  const handleSuggestTitleFromSpeech = (trackIndex: number) => {
    const track = tracks.find((t) => t.index === trackIndex);
    if (!track || !track.speechTranscription) return;

    const cleanSpeech = track.speechTranscription
      .replace(/[\n\r]+/g, " ")
      .trim();
    const firstPhrase = cleanSpeech.split(/[.!?]/)[0].trim();
    const suggested =
      firstPhrase.length > 45 ? `${firstPhrase.slice(0, 42)}...` : firstPhrase;
    if (suggested) {
      handleUpdateTrack(trackIndex, "title", `Speech: "${suggested}"`);
    }
  };

  const handleApplyBatchPastedNames = () => {
    if (!batchPastedText.trim()) return;
    pushHistorySnapshot();

    const lines = batchPastedText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    setTracks((prev) => {
      return prev.map((tr, idx) => {
        if (idx >= lines.length) return tr;

        let cleanName = lines[idx];
        // Strip leading numbering:"1.","01.","1 -","1)","#1", etc.
        cleanName = cleanName
          .replace(/^(?:#?\d+[.)\-:\s]+|\s*[-–—]\s*)+/i, "")
          .trim();
        if (!cleanName) cleanName = lines[idx];

        // Auto-detect if it sounds like a speech or dialogue
        const lower = cleanName.toLowerCase();
        const isSpeechKeyword =
          /speech|presentaci[oó]n|saludo|hablado|charla|an[eé]cdota|intro hablada|palabras|agradecimiento|bises?\s+hablado|chapa/i.test(
            lower,
          );
        const newType = isSpeechKeyword ? "dialogo" : tr.type;

        return {
          ...tr,
          title: cleanName,
          type: newType,
        };
      });
    });

    setBatchPastedText("");
    setShowQuickNamingModal(false);
  };

  // Selection for multi-track fusion
  const handleToggleSelectTrack = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  // Merge track with next track
  const handleMergeWithNext = (trackIndex: number) => {
    const idx = tracks.findIndex((t) => t.index === trackIndex);
    if (idx < 0 || idx >= tracks.length - 1) return;

    pushHistorySnapshot();

    const trackA = tracks[idx];
    const trackB = tracks[idx + 1];

    const minStart = Math.min(trackA.start, trackB.start);
    const maxEnd = Math.max(trackA.end, trackB.end);
    const mergedTitle = `${trackA.title} + ${trackB.title}`;
    const mergedSpeech = [
      trackA.speechTranscription,
      trackB.speechTranscription,
    ]
      .filter(Boolean)
      .join("\n");

    const mergedTrack: TrackCutItem = {
      index: trackA.index,
      title: mergedTitle,
      start: minStart,
      end: maxEnd,
      duration: maxEnd - minStart,
      type:
        trackA.type === "musica" || trackB.type === "musica"
          ? "musica"
          : "dialogo",
      speechTranscription: mergedSpeech,
    };

    const newArr = [...tracks];
    newArr.splice(idx, 2, mergedTrack);
    const reindexed = newArr.map((t, i) => ({ ...t, index: i + 1 }));
    setTracks(reindexed);
    setSelectedIndices([]);
  };

  // Merge all checked tracks
  const handleMergeSelectedTracks = () => {
    if (selectedIndices.length < 2) return;
    const sortedIdxs = [...selectedIndices].sort((a, b) => a - b);
    const targetTracks = tracks.filter((t) => sortedIdxs.includes(t.index));
    if (targetTracks.length < 2) return;

    pushHistorySnapshot();

    const minStart = Math.min(...targetTracks.map((t) => t.start));
    const maxEnd = Math.max(...targetTracks.map((t) => t.end));
    const mergedTitle = targetTracks.map((t) => t.title).join(" + ");
    const mergedSpeech = targetTracks
      .map((t) => t.speechTranscription)
      .filter(Boolean)
      .join("\n");
    const hasMusic = targetTracks.some((t) => t.type === "musica");

    const mergedTrack: TrackCutItem = {
      index: sortedIdxs[0],
      title: mergedTitle,
      start: minStart,
      end: maxEnd,
      duration: maxEnd - minStart,
      type: hasMusic ? "musica" : "dialogo",
      speechTranscription: mergedSpeech,
    };

    const remaining = tracks.filter((t) => !sortedIdxs.includes(t.index));
    const updatedList = [...remaining, mergedTrack].sort(
      (a, b) => a.start - b.start,
    );
    const reindexed = updatedList.map((t, i) => ({ ...t, index: i + 1 }));

    setTracks(reindexed);
    setSelectedIndices([]);
  };

  // Split track into 2 parts at custom position, current snippet player time, or midpoint
  const handleSplitTrack = (trackIndex: number, customSplitSecs?: number) => {
    pushHistorySnapshot();
    setTracks((prev) => {
      const idx = prev.findIndex((t) => t.index === trackIndex);
      if (idx < 0) return prev;

      const orig = prev[idx];
      let splitPoint = customSplitSecs;

      if (splitPoint === undefined) {
        if (
          activeSnippet &&
          activeSnippet.trackIndex === trackIndex &&
          snippetCurrentTime > 0
        ) {
          splitPoint =
            Math.round((activeSnippet.start + snippetCurrentTime) * 10) / 10;
        } else {
          splitPoint =
            Math.round((orig.start + (orig.end - orig.start) / 2) * 10) / 10;
        }
      }

      if (splitPoint <= orig.start + 0.5 || splitPoint >= orig.end - 0.5) {
        alert(
          `Punto de corte inválido (${formatSeconds(splitPoint)}). Debe estar dentro del intervalo del tramo (${formatSeconds(orig.start)} - ${formatSeconds(orig.end)}).`,
        );
        return prev;
      }

      const part1: TrackCutItem = {
        ...orig,
        title: orig.title.includes("(Parte")
          ? orig.title
          : `${orig.title} (Parte 1)`,
        end: splitPoint,
        duration: Math.max(1, splitPoint - orig.start),
        audioUrl: undefined,
      };

      const part2: TrackCutItem = {
        ...orig,
        title: orig.title.includes("(Parte")
          ? `${orig.title} b`
          : `${orig.title} (Parte 2)`,
        start: splitPoint,
        end: orig.end,
        duration: Math.max(1, orig.end - splitPoint),
        audioUrl: undefined,
      };

      const newArr = [...prev];
      newArr.splice(idx, 1, part1, part2);
      return newArr.map((t, i) => ({ ...t, index: i + 1 }));
    });

    if (activeSnippet && activeSnippet.trackIndex === trackIndex) {
      setActiveSnippet(null);
    }
  };

  return { handleUpdateTrack, setShowQuickNamingModal, handleMergeSelectedTracks, handleAddCutTrack, handleToggleSelectTrack, handleSplitTrack, handleMergeWithNext, handleMoveTrack, handleDeleteTrack, handleSuggestTitleFromSpeech, showQuickNamingModal, setQuickNamingActiveTab, quickNamingActiveTab, batchPastedText, setBatchPastedText, handleApplyBatchPastedNames };
}
