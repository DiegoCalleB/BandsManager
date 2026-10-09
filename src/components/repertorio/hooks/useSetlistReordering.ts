/**
 * Reordenación y optimización del setlist activo: deshacer, sugerencia de chapa, plan de Setlist Perfecto y drag and drop.
 * Extraído de RepertorioSetlists.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/set-state-in-effect,
 react-hooks/exhaustive-deps,
 react-hooks/purity,
 react-hooks/immutability
*/
import { PerfectSetlistAction, SetlistFeedbackInput, PerfectSetlistPlan } from "../PerfectSetlistModal";
import { SetlistItem, Setlist } from "../../../types";
import { api } from "../../../services/api";
import { saveSetlistsToLocalStorageSafely } from "../../../utils/audioStorage";
import { Dispatch, SetStateAction } from "react";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface SetlistReorderingParams {
  reorderSetlistItems: (fromIndex: number, toIndex: number, sourceKey?: string) => void;
  removeSetlistItemAtIndex: (index: number, sourceKey: string) => void;
  insertSongAtIndex: (songId: string, insertIndex: number, sourceKey: string) => void;
  insertBlockAtIndex: (tipoItem: "cancion" | "bloque", tituloCustom: string, duracionEstimadaMinutos: number, insertIndex: number, sourceKey: string) => void;
  activeSetlist: Setlist;
  perfectSetlistDraft: { originalSetlistId: string; draftSetlistId: string; };
  setlists: Setlist[];
  setActiveSetlistId: Dispatch<SetStateAction<string>>;
  setPerfectSetlistLoading: Dispatch<SetStateAction<boolean>>;
  setPerfectSetlistError: Dispatch<SetStateAction<string>>;
  handleDuplicateSetlist: (st: Setlist, nameSuffix?: string) => Setlist;
  setPerfectSetlistDraft: Dispatch<SetStateAction<{ originalSetlistId: string; draftSetlistId: string; }>>;
  setPerfectSetlistPlan: Dispatch<SetStateAction<PerfectSetlistPlan>>;
  undoReorderSnapshot: { setlistId: string; items: SetlistItem[]; sourceKey: string; };
  setSetlists: Dispatch<SetStateAction<Setlist[]>>;
  syncSetlistToBackend: (updatedSetlist: Setlist) => void;
  setUndoReorderSnapshot: Dispatch<SetStateAction<{ setlistId: string; items: SetlistItem[]; sourceKey: string; }>>;
  draggedItemIndex: number;
  setDraggedItemIndex: Dispatch<SetStateAction<number>>;
  setDragOverItemIndex: Dispatch<SetStateAction<number>>;
}

/**
 * Reordenación y optimización del setlist activo: deshacer, sugerencia de chapa, plan de Setlist Perfecto y drag and drop.
 * @param params Estado y callbacks del contenedor ({@link SetlistReorderingParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useSetlistReordering({ reorderSetlistItems, removeSetlistItemAtIndex, insertSongAtIndex, insertBlockAtIndex, activeSetlist, perfectSetlistDraft, setlists, setActiveSetlistId, setPerfectSetlistLoading, setPerfectSetlistError, handleDuplicateSetlist, setPerfectSetlistDraft, setPerfectSetlistPlan, undoReorderSnapshot, setSetlists, syncSetlistToBackend, setUndoReorderSnapshot, draggedItemIndex, setDraggedItemIndex, setDragOverItemIndex }: SetlistReorderingParams) {
  // Ejecuta UNA acción concreta del plan de"Setlist Perfecto" — cada acción ya viene validada por
  // el servidor (posiciones dentro de rango, catalog_index resuelto a un song_id real, block_type
  // dentro del enum), así que aquí solo se traduce cada tipo a la función que ya mueve/inserta/quita.
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

  // Genera el plan de"Setlist Perfecto" y, la PRIMERA vez, duplica el setlist ANTES de que se
  // pueda aplicar ninguna acción — para no arriesgar el original. Pero"Regenerar" no debe crear
  // una copia nueva cada vez (eso fue justo la queja: demasiadas copias) — mientras el usuario siga
  // trabajando sobre el mismo original (o ya esté sobre la copia), se reutiliza esa misma copia y
  // el plan nuevo se calcula contra SU estado actual (con lo que ya se haya aplicado). Solo se crea
  // una copia nueva si no existe ninguna todavía para este setlist, o si se pide explícitamente
  // (`forceNewCopy`, botón"Nueva copia" del modal).
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

    // Si el usuario volvió al setlist ORIGINAL (no a la copia) pero ya existe una copia de una
    // ronda anterior, se retoma esa copia en vez de generar/duplicar desde el original de nuevo.
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
  // Qué acción concreta es la que"Deshacer" revertiría ahora mismo — null si no hay nada que
  // deshacer, o si el setlist activo cambió desde entonces. Solo la acción que dejó este snapshot
  // (la más reciente) puede mostrar su propio botón como"Deshacer" en vez de"Aplicar"/"Aplicado".
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

  const handleDropItem = (targetIndex: number) => {
    if (draggedItemIndex !== null)
      reorderSetlistItems(draggedItemIndex, targetIndex);
    setDraggedItemIndex(null);
    setDragOverItemIndex(null);
  };

  return { canUndoReorder, undoLastReorder, handleDropItem, undoSourceKey, handleGeneratePerfectSetlist, applyPerfectSetlistAction };
}
