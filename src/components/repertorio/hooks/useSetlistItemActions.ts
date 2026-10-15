import type { User } from "../../../types";
import type { AddableItemKind } from "../setlistItemKind";
/**
 * Acciones sobre los items del setlist activo: añadir canciones y bloques, atajos personalizados, notas, asignación a conciertos e impresión de escenario.
 * Extraído de RepertorioSetlists.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars
*/
import { Dispatch,SetStateAction } from "react";
import { Concert,Rehearsal,Setlist,SetlistItem,SetlistShortcut,Song } from "../../../types";
import { saveSetlistsToLocalStorageSafely } from "../../../utils/audioStorage";
import { buildStageSetlistHtml,generatePdfStylesheet,getTokenValueForPrint } from "../../../utils/repertorioPdf";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface SetlistItemActionsParams {
  activeSetlist: Setlist;
  selectedSetlistItemId: string;
  setSetlists: Dispatch<SetStateAction<Setlist[]>>;
  syncSetlistToBackend: (updatedSetlist: Setlist) => void;
  setSelectedSetlistItemId: Dispatch<SetStateAction<string>>;
  newShortcutLabel: string;
  getHeaders: () => { "x-band-id"?: string; Authorization?: string; "Content-Type": string; };
  newShortcutIcon: string;
  newShortcutMinutes: number;
  setCustomShortcuts: Dispatch<SetStateAction<SetlistShortcut[]>>;
  setNewShortcutLabel: Dispatch<SetStateAction<string>>;
  setNewShortcutIcon: Dispatch<SetStateAction<string>>;
  setNewShortcutMinutes: Dispatch<SetStateAction<number>>;
  setIsAddingShortcut: Dispatch<SetStateAction<boolean>>;
  editingShowItem: SetlistItem;
  showItemAudioUrl: string;
  setShowShowItemModal: Dispatch<SetStateAction<boolean>>;
  setEditingShowItem: Dispatch<SetStateAction<SetlistItem>>;
  setShowItemAudioUrl: Dispatch<SetStateAction<string>>;
  assigningSetlist: Setlist;
  selectedConcertToAssign: string;
  concerts: Concert[];
  onUpdateConcert: (id: string, fields: Partial<Concert>) => void;
  rehearsals: Rehearsal[];
  onUpdateRehearsal: (id: string, fields: Partial<Rehearsal>) => void;
  setAssigningSetlist: Dispatch<SetStateAction<Setlist>>;
  songs: Song[];
  activeSetlistMetrics: { totalSeconds: number; formattedTime: string; songCount: number; eventCount: number; blockCount: number; avgBpm: number; };
  currentUser: User | undefined;
}

/**
 * Acciones sobre los items del setlist activo: añadir canciones y bloques, atajos personalizados, notas, asignación a conciertos e impresión de escenario.
 * @param params Estado y callbacks del contenedor ({@link SetlistItemActionsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useSetlistItemActions({ activeSetlist, selectedSetlistItemId, setSetlists, syncSetlistToBackend, setSelectedSetlistItemId, newShortcutLabel, getHeaders, newShortcutIcon, newShortcutMinutes, setCustomShortcuts, setNewShortcutLabel, setNewShortcutIcon, setNewShortcutMinutes, setIsAddingShortcut, editingShowItem, showItemAudioUrl, setShowShowItemModal, setEditingShowItem, setShowItemAudioUrl, assigningSetlist, selectedConcertToAssign, concerts, onUpdateConcert, rehearsals, onUpdateRehearsal, setAssigningSetlist, songs, activeSetlistMetrics, currentUser }: SetlistItemActionsParams) {
  const handleAddItemToSetlist = (
    songId?: string,
    tipoItem: AddableItemKind = "cancion",
    tituloCustom?: string,
    duracionEstimadaMinutos?: number,
    duracionEstimadaSegundos?: number,
    notaTema?: string,
    insertAfterId?: string | null,
  ) => {
    if (!activeSetlist) return;

    // Map old tipoItem values to new (tipoItem, bloqueSubtipo) structure
    let actualTipoItem: "cancion" | "bloque" = "cancion";
    let bloqueSubtipo: SetlistItem["bloqueSubtipo"] = undefined;

    if (tipoItem !== "cancion") {
      actualTipoItem = "bloque";
      bloqueSubtipo = tipoItem as SetlistItem["bloqueSubtipo"]; // Map directly:'presentacion','bis','header', etc.
    }

    const newItem: SetlistItem = {
      id: `it-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      tipoItem: actualTipoItem,
      bloqueSubtipo,
      songId,
      tituloCustom,
      duracionEstimadaMinutos,
      duracionEstimadaSegundos,
      notaTema,
    };

    if (!tituloCustom) {
      const subtype = bloqueSubtipo || tipoItem;
      if (subtype === "header" || subtype === "bloque_header") {
        newItem.tituloCustom = "Nuevo bloque del show";
      } else if (subtype === "presentacion") {
        newItem.tituloCustom = "Presentación Banda & Saludo";
        newItem.duracionEstimadaMinutos = 2;
        newItem.duracionEstimadaSegundos = 120;
      } else if (subtype === "beatbox") {
        newItem.tituloCustom = "Solo de Batería / Percusión";
        newItem.duracionEstimadaMinutos = 2;
        newItem.duracionEstimadaSegundos = 120;
      } else if (subtype === "intro_tema") {
        newItem.tituloCustom = "Intro / Historia del Tema";
        newItem.duracionEstimadaMinutos = 1;
        newItem.duracionEstimadaSegundos = 60;
      } else if (subtype === "solo_performance") {
        newItem.tituloCustom = "Solo Instrumental / Jam";
        newItem.duracionEstimadaMinutos = 2;
        newItem.duracionEstimadaSegundos = 120;
      } else if (subtype === "cambio_instrumento") {
        newItem.tituloCustom = "Cambio Instrumento & Afinación";
        newItem.duracionEstimadaMinutos = 1;
        newItem.duracionEstimadaSegundos = 60;
      } else if (subtype === "chapa") {
        newItem.tituloCustom = "Chapa / Discurso con Público";
        newItem.duracionEstimadaMinutos = 2;
        newItem.duracionEstimadaSegundos = 120;
      } else if (subtype === "descanso") {
        newItem.tituloCustom = "Pausa / Intermedio / Agua";
        newItem.duracionEstimadaMinutos = 2;
        newItem.duracionEstimadaSegundos = 120;
      } else if (subtype === "bis") {
        newItem.tituloCustom = "💣 BIS / PARTE FINAL DEL SHOW";
        newItem.duracionEstimadaMinutos = 1;
        newItem.duracionEstimadaSegundos = 60;
      }
    }

    const targetRefId =
      insertAfterId !== undefined ? insertAfterId : selectedSetlistItemId;
    let newItems: SetlistItem[];
    if (targetRefId) {
      const idx = activeSetlist.items.findIndex((it) => it.id === targetRefId);
      if (idx !== -1) {
        newItems = [...activeSetlist.items];
        newItems.splice(idx + 1, 0, newItem);
      } else {
        newItems = [...activeSetlist.items, newItem];
      }
    } else {
      newItems = [...activeSetlist.items, newItem];
    }

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
    setSelectedSetlistItemId(newItem.id);
  };

  // Inserts a band-created custom shortcut into the active setlist as a generic ('otro') item
  const handleUseCustomShortcut = (sc: SetlistShortcut) => {
    handleAddItemToSetlist(
      undefined,
      "otro",
      sc.tituloCustom,
      sc.duracionEstimadaMinutos,
      sc.duracionEstimadaSegundos,
      sc.notaTema,
    );
  };

  const handleCreateShortcut = async () => {
    const etiqueta = newShortcutLabel.trim();
    if (!etiqueta) return;
    try {
      const res = await fetch("/api/setlist-shortcuts", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          icono: newShortcutIcon.trim() || "⭐",
          etiqueta,
          tituloCustom: etiqueta,
          duracionEstimadaMinutos: newShortcutMinutes,
          duracionEstimadaSegundos: newShortcutMinutes * 60,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.shortcut) {
          setCustomShortcuts((prev) => [...prev, data.shortcut]);
        }
      }
    } catch (err) {
      console.error("Error al crear el acceso rápido:", err);
    } finally {
      setNewShortcutLabel("");
      setNewShortcutIcon("⭐");
      setNewShortcutMinutes(1);
      setIsAddingShortcut(false);
    }
  };

  const handleDeleteShortcut = async (id: string) => {
    setCustomShortcuts((prev) => prev.filter((sc) => sc.id !== id));
    try {
      await fetch(`/api/setlist-shortcuts/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
    } catch (err) {
      console.error("Error al eliminar el acceso rápido:", err);
    }
  };

  // Add several catalog songs to the active setlist in a single action/save
  const handleAddMultipleSongsToSetlist = (songIds: string[]) => {
    if (!activeSetlist || songIds.length === 0) return;

    const newSongItems: SetlistItem[] = songIds.map((songId) => ({
      id: `it-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      tipoItem: "cancion",
      songId,
    }));

    const targetRefId = selectedSetlistItemId;
    let newItems: SetlistItem[];
    if (targetRefId) {
      const idx = activeSetlist.items.findIndex((it) => it.id === targetRefId);
      if (idx !== -1) {
        newItems = [...activeSetlist.items];
        newItems.splice(idx + 1, 0, ...newSongItems);
      } else {
        newItems = [...activeSetlist.items, ...newSongItems];
      }
    } else {
      newItems = [...activeSetlist.items, ...newSongItems];
    }

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
    setSelectedSetlistItemId(newSongItems[newSongItems.length - 1].id);
  };

  const handleSaveShowItem = (itemData: Partial<SetlistItem>) => {
    if (!activeSetlist) return;

    // Map old tipoItem values to new structure if needed
    const mappedData = { ...itemData };
    if (mappedData.tipoItem && mappedData.tipoItem !== "cancion") {
      const subtype = mappedData.tipoItem;
      mappedData.tipoItem = "bloque" as const;
      mappedData.bloqueSubtipo = subtype as SetlistItem["bloqueSubtipo"];
    }

    let updatedItems: SetlistItem[];

    if (editingShowItem) {
      updatedItems = activeSetlist.items.map((it) =>
        it.id === editingShowItem.id
          ? { ...it, ...mappedData, audioUrl: showItemAudioUrl }
          : it,
      );
    } else {
      const defaultSubtype = (mappedData.bloqueSubtipo || "otro") as NonNullable<SetlistItem["bloqueSubtipo"]>;
      const newItem: SetlistItem = {
        id: `it-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        tipoItem: mappedData.tipoItem === "cancion" ? "cancion" : "bloque",
        bloqueSubtipo:
          mappedData.tipoItem === "cancion" ? undefined : defaultSubtype,
        tituloCustom: mappedData.tituloCustom || "Evento del Show",
        duracionEstimadaMinutos: mappedData.duracionEstimadaMinutos || 2,
        duracionEstimadaSegundos: mappedData.duracionEstimadaSegundos || 120,
        notaTema: mappedData.notaTema || "",
        audioUrl: showItemAudioUrl,
      };

      if (selectedSetlistItemId) {
        const idx = activeSetlist.items.findIndex(
          (it) => it.id === selectedSetlistItemId,
        );
        if (idx !== -1) {
          updatedItems = [...activeSetlist.items];
          updatedItems.splice(idx + 1, 0, newItem);
        } else {
          updatedItems = [...activeSetlist.items, newItem];
        }
      } else {
        updatedItems = [...activeSetlist.items, newItem];
      }
      setSelectedSetlistItemId(newItem.id);
    }

    const updatedSetlist: Setlist = {
      ...activeSetlist,
      fechaUltimaEdicion: new Date().toISOString().split("T")[0],
      items: updatedItems,
    };

    setSetlists((prev) => {
      const next = prev.map((st) =>
        st.id === activeSetlist.id ? updatedSetlist : st,
      );
      saveSetlistsToLocalStorageSafely(next);
      return next;
    });
    syncSetlistToBackend(updatedSetlist);
    setShowShowItemModal(false);
    setEditingShowItem(null);
    setShowItemAudioUrl("");
  };

  const handleRemoveSetlistItem = (itemId: string) => {
    if (!activeSetlist) return;
    const updatedSetlist: Setlist = {
      ...activeSetlist,
      fechaUltimaEdicion: new Date().toISOString().split("T")[0],
      items: activeSetlist.items.filter((it) => it.id !== itemId),
    };

    setSetlists((prev) =>
      prev.map((st) => (st.id === activeSetlist.id ? updatedSetlist : st)),
    );
    syncSetlistToBackend(updatedSetlist);
  };

  const handleUpdateItemNote = (itemId: string, note: string) => {
    if (!activeSetlist) return;
    const updatedSetlist: Setlist = {
      ...activeSetlist,
      items: activeSetlist.items.map((it) =>
        it.id === itemId ? { ...it, notaTema: note } : it,
      ),
    };

    setSetlists((prev) =>
      prev.map((st) => (st.id === activeSetlist.id ? updatedSetlist : st)),
    );
    syncSetlistToBackend(updatedSetlist);
  };

  // Assign setlist to concert or rehearsal
  const handleAssignSetlistToConcert = () => {
    if (!assigningSetlist || !selectedConcertToAssign) return;

    // Check if it's a concert or rehearsal
    const concertMatch = concerts.find((c) => c.id === selectedConcertToAssign);
    if (concertMatch && onUpdateConcert) {
      onUpdateConcert(concertMatch.id, { setlistId: assigningSetlist.id });
      alert(
        `Repertorio"${assigningSetlist.nombre}" asignado con éxito al concierto en ${concertMatch.sala} (${concertMatch.ciudad}).`,
      );
    } else {
      const rehMatch = rehearsals.find((r) => r.id === selectedConcertToAssign);
      if (rehMatch && onUpdateRehearsal) {
        onUpdateRehearsal(rehMatch.id, { setlistId: assigningSetlist.id });
        alert(
          `Repertorio"${assigningSetlist.nombre}" asignado con éxito al ensayo de ${rehMatch.fecha}.`,
        );
      }
    }
    setAssigningSetlist(null);
  };

  // Print Stage Setlist (el HTML lo construye la función pura buildStageSetlistHtml)
  const handlePrintStageSetlist = () => {
    if (!activeSetlist) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(
      buildStageSetlistHtml({
        setlist: activeSetlist,
        songs,
        metrics: activeSetlistMetrics,
        bandDisplayName: currentUser?.bandName || "BANDMANAGER",
        stylesheet: generatePdfStylesheet(),
        colors: {
          ok: getTokenValueForPrint("--ok"),
          acc: getTokenValueForPrint("--acc"),
          sunken: getTokenValueForPrint("--sunken"),
        },
      }),
    );
    printWindow.document.close();
  };

  return { handleAddMultipleSongsToSetlist, handleAddItemToSetlist, handleUseCustomShortcut, handleDeleteShortcut, handleCreateShortcut, handleRemoveSetlistItem, handleUpdateItemNote, handleAssignSetlistToConcert, handleSaveShowItem };
}
