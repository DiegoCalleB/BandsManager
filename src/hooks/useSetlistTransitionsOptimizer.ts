import { useState } from "react";
import { Setlist, SetlistItem, Song } from "../types";
import {
  HuecoCancion,
  costeTotalTransiciones,
  optimizarOrdenPorTransiciones,
  sugerirMejorPuntoParaChapa,
  SugerenciaChapa,
} from "../utils/setlistCompatibility";
import {
  PerfectSetlistAction,
  PerfectSetlistPlan,
  SetlistFeedbackInput,
} from "../components/repertorio/PerfectSetlistModal";
import { api } from "../services/api";

export interface UndoReorderSnapshot {
  setlistId: string;
  items: SetlistItem[];
  sourceKey: string;
}

export interface UseSetlistTransitionsOptimizerParams {
  activeSetlist: Setlist | null;
  songs: Song[];
  setlists: Setlist[];
  setSetlists: React.Dispatch<React.SetStateAction<Setlist[]>>;
  setActiveSetlistId: (id: string) => void;
  saveSetlistsToLocalStorageSafely: (setlists: Setlist[]) => void;
  syncSetlistToBackend: (setlist: Setlist) => void;
  handleDuplicateSetlist: (setlist: Setlist, suffix?: string) => Setlist;
  handleAddItemToSetlist: (
    songId?: string,
    tipoItem?: any,
    customTitle?: string,
    duracionMin?: number,
    duracionSeg?: number,
    customNote?: string,
    targetPositionItemId?: string,
  ) => void;
}

/**
 * Hook que gestiona la optimización de transiciones acústicas, detección de puntos de chapa,
 * generación del plan de "Setlist Perfecto" y el historial de "Deshacer" (Undo snapshot).
 */
export function useSetlistTransitionsOptimizer({
  activeSetlist,
  songs,
  setlists,
  setSetlists,
  setActiveSetlistId,
  saveSetlistsToLocalStorageSafely,
  syncSetlistToBackend,
  handleDuplicateSetlist,
  handleAddItemToSetlist,
}: UseSetlistTransitionsOptimizerParams) {
  const [undoReorderSnapshot, setUndoReorderSnapshot] =
    useState<UndoReorderSnapshot | null>(null);
  const [chapaSuggestion, setChapaSuggestion] =
    useState<SugerenciaChapa | null>(null);
  const [optimizeSummary, setOptimizeSummary] = useState<string | null>(null);

  // Estado del generador IA "Setlist Perfecto"
  const [perfectSetlistLoading, setPerfectSetlistLoading] = useState(false);
  const [perfectSetlistPlan, setPerfectSetlistPlan] =
    useState<PerfectSetlistPlan | null>(null);
  const [perfectSetlistError, setPerfectSetlistError] = useState<string | null>(
    null,
  );
  const [perfectSetlistDraft, setPerfectSetlistDraft] = useState<{
    originalSetlistId: string;
    draftSetlistId: string;
  } | null>(null);

  const clearDraftIfMatches = (stId: string) => {
    if (
      perfectSetlistDraft &&
      (perfectSetlistDraft.draftSetlistId === stId ||
        perfectSetlistDraft.originalSetlistId === stId)
    ) {
      setPerfectSetlistDraft(null);
    }
  };

  const applySetlistItemsChange = (
    newItems: SetlistItem[],
    sourceKey: string,
  ) => {
    if (!activeSetlist) return;

    setUndoReorderSnapshot({
      setlistId: activeSetlist.id,
      items: activeSetlist.items,
      sourceKey,
    });

    const updatedSetlist: Setlist = {
      ...activeSetlist,
      fechaUltimaEdicion: new Date().toISOString().split("T")[0],
      items: newItems,
    };

    setSetlists((prev) => {
      const next = prev.map((st) =>
        st.id === activeSetlist.id ? updatedSetlist : st,
      );
      saveSetlistsToLocalStorageSafely(next);
      return next;
    });
    syncSetlistToBackend(updatedSetlist);
  };

  const reorderSetlistItems = (
    fromIndex: number,
    toIndex: number,
    sourceKey: string = "manual",
  ) => {
    if (!activeSetlist || fromIndex === toIndex || fromIndex < 0 || toIndex < 0)
      return;
    const newItems = [...activeSetlist.items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    applySetlistItemsChange(newItems, sourceKey);
  };

  const suggestChapaSpot = () => {
    if (!activeSetlist) return;
    const sugerencia = sugerirMejorPuntoParaChapa(activeSetlist.items, songs);
    setChapaSuggestion(sugerencia);
    if (!sugerencia) {
      setOptimizeSummary(
        "👍 Las transiciones ya van suaves — no hace falta forzar una chapa en ningún punto concreto.",
      );
      window.setTimeout(() => setOptimizeSummary(null), 7000);
    }
  };

  const insertSuggestedChapa = () => {
    if (!chapaSuggestion) return;
    handleAddItemToSetlist(
      undefined,
      "chapa",
      undefined,
      undefined,
      undefined,
      undefined,
      chapaSuggestion.insertAfterItemId,
    );
    setChapaSuggestion(null);
  };

  const optimizeSetlistTransitions = () => {
    if (!activeSetlist) return;
    setChapaSuggestion(null);
    const items = activeSetlist.items;
    const songPositions: number[] = [];
    const slots: HuecoCancion[] = [];
    items.forEach((item, i) => {
      if (item.tipoItem === "cancion" && item.songId) {
        const song = songs.find((s) => s.id === item.songId);
        if (song) {
          songPositions.push(i);
          slots.push({ item, song });
        }
      }
    });
    if (slots.length < 3) return;

    const costeAntes = costeTotalTransiciones(slots);
    const optimizado = optimizarOrdenPorTransiciones(slots);
    const costeDespues = costeTotalTransiciones(optimizado);

    const newItems = [...items];
    songPositions.forEach((pos, idx) => {
      newItems[pos] = optimizado[idx].item;
    });
    applySetlistItemsChange(newItems, "optimize-transitions");

    const mejoraPct =
      costeAntes > 0 ? Math.round((1 - costeDespues / costeAntes) * 100) : 0;
    setOptimizeSummary(
      mejoraPct > 0
        ? `🎯 Orden optimizado: transiciones un ${mejoraPct}% más suaves (tonalidad + tempo + energía).`
        : "El orden actual ya es prácticamente el mejor posible para estas transiciones.",
    );
    window.setTimeout(() => setOptimizeSummary(null), 7000);
  };

  const removeSetlistItemAtIndex = (index: number, sourceKey: string) => {
    if (!activeSetlist || index < 0 || index >= activeSetlist.items.length)
      return;
    const newItems = activeSetlist.items.filter((_, i) => i !== index);
    applySetlistItemsChange(newItems, sourceKey);
  };

  const insertSongAtIndex = (
    songId: string,
    insertIndex: number,
    sourceKey: string,
  ) => {
    if (!activeSetlist) return;
    const newItem: SetlistItem = {
      id: `it-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      tipoItem: "cancion",
      songId,
    };
    const newItems = [...activeSetlist.items];
    const clampedIndex = Math.max(0, Math.min(insertIndex, newItems.length));
    newItems.splice(clampedIndex, 0, newItem);
    applySetlistItemsChange(newItems, sourceKey);
  };

  const insertBlockAtIndex = (
    tipoItem: SetlistItem["tipoItem"],
    tituloCustom: string,
    duracionEstimadaMinutos: number | undefined,
    insertIndex: number,
    sourceKey: string,
  ) => {
    if (!activeSetlist) return;
    const newItem: SetlistItem = {
      id: `it-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      tipoItem,
      tituloCustom,
      duracionEstimadaMinutos,
      duracionEstimadaSegundos: duracionEstimadaMinutos
        ? Math.round(duracionEstimadaMinutos * 60)
        : undefined,
    };
    const newItems = [...activeSetlist.items];
    const clampedIndex = Math.max(0, Math.min(insertIndex, newItems.length));
    newItems.splice(clampedIndex, 0, newItem);
    applySetlistItemsChange(newItems, sourceKey);
  };

  const applyPerfectSetlistAction = (
    action: PerfectSetlistAction,
    sourceKey: string,
  ) => {
    switch (action.type) {
      case "reorder":
        if (action.from_position != null && action.to_position != null) {
          reorderSetlistItems(
            action.from_position - 1,
            action.to_position - 1,
            sourceKey,
          );
        }
        break;
      case "remove_song":
        if (action.item_position != null) {
          removeSetlistItemAtIndex(action.item_position - 1, sourceKey);
        }
        break;
      case "add_song":
        if (action.song_id && action.insert_at_position != null) {
          insertSongAtIndex(
            action.song_id,
            action.insert_at_position - 1,
            sourceKey,
          );
        }
        break;
      case "add_block":
        if (action.block_type && action.insert_at_position != null) {
          insertBlockAtIndex(
            action.block_type as SetlistItem["tipoItem"],
            action.title || "Nuevo bloque",
            action.duracion_minutos,
            action.insert_at_position - 1,
            sourceKey,
          );
        }
        break;
    }
  };

  const handleGeneratePerfectSetlist = async (
    forceNewCopy: boolean = false,
    feedback?: SetlistFeedbackInput,
  ) => {
    if (!activeSetlist) return;

    const existingDraft =
      !forceNewCopy &&
      perfectSetlistDraft &&
      (perfectSetlistDraft.draftSetlistId === activeSetlist.id ||
        perfectSetlistDraft.originalSetlistId === activeSetlist.id)
        ? perfectSetlistDraft
        : null;

    let targetSetlist = activeSetlist;
    if (existingDraft && existingDraft.draftSetlistId !== activeSetlist.id) {
      const draft = setlists.find((s) => s.id === existingDraft.draftSetlistId);
      if (draft) {
        targetSetlist = draft;
        setActiveSetlistId(draft.id);
      }
    }

    setPerfectSetlistLoading(true);
    setPerfectSetlistError(null);
    try {
      const result = await api.generatePerfectSetlist(
        targetSetlist.id,
        feedback,
      );
      if (result.success && result.plan) {
        if (!existingDraft) {
          const copy = handleDuplicateSetlist(
            targetSetlist,
            "(Setlist Perfecto)",
          );
          setPerfectSetlistDraft({
            originalSetlistId: targetSetlist.id,
            draftSetlistId: copy.id,
          });
        }
        setPerfectSetlistPlan(result.plan);
      } else {
        setPerfectSetlistError(result.error || "Error al generar el plan");
      }
    } catch (err: any) {
      setPerfectSetlistError(err.message || "Error desconocido");
    } finally {
      setPerfectSetlistLoading(false);
    }
  };

  const canUndoReorder =
    !!undoReorderSnapshot &&
    undoReorderSnapshot.setlistId === activeSetlist?.id;

  const undoSourceKey = canUndoReorder ? undoReorderSnapshot!.sourceKey : null;

  const undoLastReorder = () => {
    if (
      !activeSetlist ||
      !undoReorderSnapshot ||
      undoReorderSnapshot.setlistId !== activeSetlist.id
    )
      return;

    const restoredSetlist: Setlist = {
      ...activeSetlist,
      fechaUltimaEdicion: new Date().toISOString().split("T")[0],
      items: undoReorderSnapshot.items,
    };

    setSetlists((prev) => {
      const next = prev.map((st) =>
        st.id === activeSetlist.id ? restoredSetlist : st,
      );
      saveSetlistsToLocalStorageSafely(next);
      return next;
    });
    syncSetlistToBackend(restoredSetlist);
    setUndoReorderSnapshot(null);
  };

  return {
    undoReorderSnapshot,
    chapaSuggestion,
    setChapaSuggestion,
    optimizeSummary,
    setOptimizeSummary,
    perfectSetlistLoading,
    perfectSetlistPlan,
    setPerfectSetlistPlan,
    perfectSetlistError,
    setPerfectSetlistError,
    clearDraftIfMatches,
    applySetlistItemsChange,
    reorderSetlistItems,
    suggestChapaSpot,
    insertSuggestedChapa,
    optimizeSetlistTransitions,
    removeSetlistItemAtIndex,
    insertSongAtIndex,
    insertBlockAtIndex,
    applyPerfectSetlistAction,
    handleGeneratePerfectSetlist,
    canUndoReorder,
    undoSourceKey,
    undoLastReorder,
  };
}
