import type { AddableItemKind } from "../setlistItemKind";
/**
 * Mutaciones puras del setlist activo: aplicar cambios de items con snapshot de deshacer, reordenar, insertar y quitar elementos, sugerir chapa y optimizar transiciones.
 * Extraído de RepertorioSetlists.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
 
import { Dispatch,SetStateAction } from "react";
import { Setlist,SetlistItem,Song } from "../../../types";
import { saveSetlistsToLocalStorageSafely } from "../../../utils/audioStorage";
import { costeTotalTransiciones,HuecoCancion,optimizarOrdenPorTransiciones,SugerenciaChapa,sugerirMejorPuntoParaChapa } from "../../../utils/setlistCompatibility";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface SetlistItemsMutationsParams {
  activeSetlist: Setlist;
  setUndoReorderSnapshot: Dispatch<SetStateAction<{ setlistId: string; items: SetlistItem[]; sourceKey: string; }>>;
  setSetlists: Dispatch<SetStateAction<Setlist[]>>;
  syncSetlistToBackend: (updatedSetlist: Setlist) => void;
  songs: Song[];
  setChapaSuggestion: Dispatch<SetStateAction<SugerenciaChapa>>;
  setOptimizeSummary: Dispatch<SetStateAction<string>>;
  chapaSuggestion: SugerenciaChapa;
  handleAddItemToSetlist: (songId?: string, tipoItem?: AddableItemKind, tituloCustom?: string, duracionEstimadaMinutos?: number, duracionEstimadaSegundos?: number, notaTema?: string, insertAfterId?: string) => void;
}

/**
 * Mutaciones puras del setlist activo: aplicar cambios de items con snapshot de deshacer, reordenar, insertar y quitar elementos, sugerir chapa y optimizar transiciones.
 * @param params Estado y callbacks del contenedor ({@link SetlistItemsMutationsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useSetlistItemsMutations({ activeSetlist, setUndoReorderSnapshot, setSetlists, syncSetlistToBackend, songs, setChapaSuggestion, setOptimizeSummary, chapaSuggestion, handleAddItemToSetlist }: SetlistItemsMutationsParams) {
  // Setlist Item Manipulation & Agile Reordering (Drag & Drop) — lógica pura, parametrizada por
  // índices en vez de leer el estado de arrastre de la lista (draggedItemIndex), para poder
  // reutilizarla también desde el drag horizontal sobre el Mapa de Energía (ver EnergyChart).
  //
  // Punto único que de verdad escribe un array de items nuevo — reordenar, quitar una canción,
  // añadir una del catálogo o insertar un bloque son todos casos de"sustituir items por otro
  // array", así que todos pasan por aquí para compartir el snapshot de"Deshacer" (sourceKey
  // identifica qué acción lo generó) y el guardado/sync.
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

  // Busca el mejor hueco del setlist ACTUAL para meter una chapa/interludio — la transición entre
  // dos canciones ya consecutivas que más"chirría" (choque de tonalidad + salto de tempo/energía).
  // No reordena nada: solo sugiere, y el usuario decide si la inserta.
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

  // Inserta la chapa sugerida justo donde se calculó — reutiliza el mismo flujo que"+ Añadir
  // bloque" del editor manual (handleAddItemToSetlist ya sabe rellenar título/duración por defecto
  // para el subtipo'chapa').
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

  // Reordena solo las CANCIONES (nunca los bloques de chapa/presentación/bis, que el usuario
  // colocó a propósito en un punto concreto del show) para minimizar el coste total de transición
  // — choque de tonalidad + salto de tempo + salto de energía entre temas consecutivos. La
  // primera canción del setlist nunca se mueve (ver optimizarOrdenPorTransiciones): es la apertura
  // que ya eligió el usuario, no un dato más a optimizar.
  const optimizeSetlistTransitions = () => {
    if (!activeSetlist) return;
    setChapaSuggestion(null); // el orden va a cambiar: cualquier sugerencia calculada sobre el orden anterior queda obsoleta
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
    if (slots.length < 3) return; // con 2 canciones o menos no hay nada que reordenar

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

  // Quita el item en `index` (usado por el plan de"Setlist Perfecto" para retirar una canción que
  // no encaja — a diferencia de handleRemoveSetlistItem, que borra por id desde la lista visual,
  // esto trabaja por índice porque así es como el plan referencia sus posiciones).
  const removeSetlistItemAtIndex = (index: number, sourceKey: string) => {
    if (!activeSetlist || index < 0 || index >= activeSetlist.items.length)
      return;
    const newItems = activeSetlist.items.filter((_, i) => i !== index);
    applySetlistItemsChange(newItems, sourceKey);
  };

  // Inserta una canción del catálogo en `insertIndex` — variante de handleAddItemToSetlist que
  // inserta en una posición concreta (la que propuso el plan) en vez de tras el item seleccionado.
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

  // Inserta un bloque (presentación, pausa, bis...) en `insertIndex` — el plan de"Setlist
  // Perfecto" ya viene con block_type validado contra los tipoItem reales, así que aquí no hace
  // falta repetir los defaults por tipo que sí tiene handleAddItemToSetlist para el editor manual.
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

  return { optimizeSetlistTransitions, suggestChapaSpot, insertSuggestedChapa, reorderSetlistItems, removeSetlistItemAtIndex, insertSongAtIndex, insertBlockAtIndex };
}
