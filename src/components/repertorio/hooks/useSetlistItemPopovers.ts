/**
 * Arrastre de items, popovers de energía y tonalidad deseada por item, y edición de energía desde el gráfico.
 * Extraído de RepertorioSetlists.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
/* eslint-disable
 react-hooks/exhaustive-deps
*/
import { Dispatch,SetStateAction,useCallback,useEffect,useState } from "react";
import { Setlist,Song } from "../../../types";
import { EnergyChartPoint } from "../EnergyChart";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface SetlistItemPopoversParams {
  activeSetlist: Setlist;
  setSetlists: Dispatch<SetStateAction<Setlist[]>>;
  syncSetlistToBackend: (updatedSetlist: Setlist) => void;
  setSongs: Dispatch<SetStateAction<Song[]>>;
  getHeaders: () => { "x-band-id"?: string; Authorization?: string; "Content-Type": string; };
  songs: Song[];
}

/**
 * Arrastre de items, popovers de energía y tonalidad deseada por item, y edición de energía desde el gráfico.
 * @param params Estado y callbacks del contenedor ({@link SetlistItemPopoversParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useSetlistItemPopovers({ activeSetlist, setSetlists, syncSetlistToBackend, setSongs, getHeaders, songs }: SetlistItemPopoversParams) {
  // Drag and Drop state for setlist items
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(
    null,
  );
  const [expandedSetlistItemIds, setExpandedSetlistItemIds] = useState<
    Set<string>
  >(new Set());
  // Popover de energía manual (1-10 en UI, se guarda ×2 como energia 1-20): qué item de setlist
  // tiene el selector abierto ahora mismo, y estado de guardado para deshabilitar mientras dura.
  const [editingEnergyItemId, setEditingEnergyItemId] = useState<string | null>(
    null,
  );
  const [savingEnergyItemId, setSavingEnergyItemId] = useState<string | null>(
    null,
  );
  // Posición del popover, calculada al abrirlo a partir del botón real (getBoundingClientRect) y
  // pintada vía portal con position:fixed — antes el popover era position:absolute dentro de la
  // lista con scroll (overflow-y-auto), así que en canciones cerca del final del scroll quedaba
  // recortado/oculto por ese overflow ("hay que bajar" para verlo). openUpward se decide según si
  // queda hueco debajo del botón en el viewport.
  const [energyPopoverPos, setEnergyPopoverPos] = useState<{
    top: number;
    left: number;
    openUpward: boolean;
  } | null>(null);

  useEffect(() => {
    if (!editingEnergyItemId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement)?.closest?.("[data-energy-popover]")) {
        setEditingEnergyItemId(null);
      }
    };
    // Cerrar en scroll (de la lista o de la página): con position:fixed calculado una sola vez al
    // abrir, si el usuario sigue haciendo scroll el popover dejaría de estar junto a su botón.
    const handleScroll = () => setEditingEnergyItemId(null);
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [editingEnergyItemId]);

  // Popover de"tono deseado" (transposición): mismo patrón que el de energía — item de setlist
  // con el selector de las 12 notas abierto, y posición calculada al abrir vía portal fixed.
  const [editingKeyItemId, setEditingKeyItemId] = useState<string | null>(null);
  const [keyPopoverPos, setKeyPopoverPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    if (!editingKeyItemId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement)?.closest?.("[data-key-popover]")) {
        setEditingKeyItemId(null);
      }
    };
    const handleScroll = () => setEditingKeyItemId(null);
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [editingKeyItemId]);

  // Guarda (o quita, con null) el tono en el que se quiere tocar esta canción en ESTE
  // repertorio — vive en el SetlistItem, no en la canción, porque el mismo tema puede tocarse
  // en tonos distintos según el bolo/cantante (ver comentario en types.ts).
  const handleSetTonalidadDeseada = (
    itemId: string,
    tonalidad: string | null,
  ) => {
    if (!activeSetlist) return;
    const updatedSetlist: Setlist = {
      ...activeSetlist,
      items: activeSetlist.items.map((it) =>
        it.id === itemId
          ? { ...it, tonalidadDeseada: tonalidad || undefined }
          : it,
      ),
    };
    setSetlists((prev) =>
      prev.map((st) => (st.id === activeSetlist.id ? updatedSetlist : st)),
    );
    syncSetlistToBackend(updatedSetlist);
    setEditingKeyItemId(null);
  };

  // Núcleo compartido: fija a mano la energía (1-20) de una canción, tanto desde el popover 1-10
  // de la fila (handleSetEnergiaManual) como desde el arrastre vertical en el propio gráfico
  // (handleEnergyChartDrag) — un solo sitio que llama al PATCH y actualiza el estado optimista.
  const handleSetEnergiaManualValue = async (
    song: Song,
    itemId: string,
    nuevaEnergia: number,
  ) => {
    setSavingEnergyItemId(itemId);
    // Optimista: refleja el cambio ya mismo en la UI y en el gráfico, sin esperar al servidor.
    setSongs((prev) =>
      prev.map((s) =>
        s.id === song.id
          ? { ...s, energia: nuevaEnergia, energiaManual: true }
          : s,
      ),
    );
    try {
      await fetch(`/api/songs/${song.id}/energia`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ energia: nuevaEnergia }),
      });
    } catch (err) {
      console.error("Error guardando energía manual:", err);
    } finally {
      setSavingEnergyItemId(null);
      setEditingEnergyItemId(null);
    }
  };

  const handleSetEnergiaManual = (
    song: Song,
    itemId: string,
    valor1a10: number,
  ) => handleSetEnergiaManualValue(song, itemId, valor1a10 * 2);

  // Arrastrar un punto en vertical en el Mapa de Energía cambia su energía (1-20) directamente —
  // mismo resultado que el popover 1-10 de la fila, pero sin salir del gráfico. EnergyChart ya
  // filtra esto a puntos con songId (canciones reales, nunca eventos de"speech"/bis).
  const handleEnergyChartDrag = useCallback(
    (point: EnergyChartPoint, newScore: number) => {
      if (!point.songId) return;
      const song = songs.find((s) => s.id === point.songId);
      if (song) handleSetEnergiaManualValue(song, point.id, newScore);
    },
    [songs],
  );

  return { draggedItemIndex, setDraggedItemIndex, setDragOverItemIndex, handleEnergyChartDrag, expandedSetlistItemIds, setExpandedSetlistItemIds, dragOverItemIndex, editingKeyItemId, setEditingKeyItemId, keyPopoverPos, setKeyPopoverPos, handleSetTonalidadDeseada, editingEnergyItemId, setEditingEnergyItemId, energyPopoverPos, setEnergyPopoverPos, savingEnergyItemId, handleSetEnergiaManual };
}
