import React, { useState } from "react";
import { Setlist, SetlistItem, Song } from "../types";

export interface UseRepertorioSetlistOperationsProps {
  activeSetlist: Setlist | null;
  songs: Song[];
  setlists: Setlist[];
  setSetlists: React.Dispatch<React.SetStateAction<Setlist[]>>;
  setActiveSetlistId: (id: string | ((prev: string) => string)) => void;
  getHeaders: () => Record<string, string>;
  syncSetlistToBackend: (setlist: Setlist) => void;
  saveSetlistsToLocalStorageSafely: (setlists: Setlist[]) => void;
  saveSongsToLocalStorageSafely: (songs: Song[]) => void;
  guardarOReverter: (promesa: Promise<Response>, reverter: () => void) => Promise<boolean>;
  setConfirmDeleteModal: (modal: { title: string; description: string; onConfirm: () => void } | null) => void;
  selectedSetlistItemId: string | null;
  setSelectedSetlistItemId: (id: string | null) => void;
  clearDraftIfMatches?: (stId: string) => void;
}

export function useRepertorioSetlistOperations({
  activeSetlist,
  songs,
  setlists,
  setSetlists,
  setActiveSetlistId,
  getHeaders,
  syncSetlistToBackend,
  saveSetlistsToLocalStorageSafely,
  saveSongsToLocalStorageSafely,
  guardarOReverter,
  setConfirmDeleteModal,
  selectedSetlistItemId,
  setSelectedSetlistItemId,
  clearDraftIfMatches,
}: UseRepertorioSetlistOperationsProps) {
  const [setlistModalData, setSetlistModalData] = useState<{
    isOpen: boolean;
    setlistToEdit: Setlist | null;
  } | null>(null);

  const handleCreateSetlist = () => {
    setSetlistModalData({ isOpen: true, setlistToEdit: null });
  };

  const handleSetlistImported = (setlist: Setlist, newSongs: Song[]) => {
    if (newSongs.length > 0) {
      saveSongsToLocalStorageSafely([...songs, ...newSongs]);
    }
    setSetlists((prev) => {
      const next = [setlist, ...prev];
      saveSetlistsToLocalStorageSafely(next);
      return next;
    });
    setActiveSetlistId(setlist.id);
  };

  const handleSaveSetlistModal = (setlistData: {
    id?: string;
    nombre: string;
    descripcion: string;
    tipoFormato: Setlist["tipoFormato"];
  }) => {
    if (setlistData.id) {
      setSetlists((prev) =>
        prev.map((s) =>
          s.id === setlistData.id
            ? {
                ...s,
                nombre: setlistData.nombre,
                descripcion: setlistData.descripcion,
                tipoFormato: setlistData.tipoFormato,
                fechaUltimaEdicion: new Date().toISOString().split("T")[0],
              }
            : s,
        ),
      );
      const existing = setlists.find((s) => s.id === setlistData.id);
      if (existing) {
        const payload = {
          ...existing,
          nombre: setlistData.nombre,
          descripcion: setlistData.descripcion,
          tipoFormato: setlistData.tipoFormato,
        };
        void guardarOReverter(
          fetch(`/api/setlists/${setlistData.id}`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(payload),
          }),
          () => setSetlists((prev) => prev.map((s) => (s.id === existing.id ? existing : s))),
        );
      }
    } else {
      const newSetlist: Setlist = {
        id: `setlist-${Date.now()}`,
        nombre: setlistData.nombre,
        descripcion: setlistData.descripcion || "Nuevo repertorio para directo",
        tipoFormato: setlistData.tipoFormato || "festival",
        duracionTotalEstimadaMinutos: 45,
        fechaCreacion: new Date().toISOString().split("T")[0],
        fechaUltimaEdicion: new Date().toISOString().split("T")[0],
        items: [],
      };
      setSetlists((prev) => [newSetlist, ...prev]);
      setActiveSetlistId(newSetlist.id);

      void guardarOReverter(
        fetch("/api/setlists", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(newSetlist),
        }),
        () => {
          setSetlists((prev) => prev.filter((s) => s.id !== newSetlist.id));
          setActiveSetlistId((actual) => (actual === newSetlist.id ? "" : actual));
        },
      );
    }
  };

  const handleDuplicateSetlist = (st: Setlist, nameSuffix: string = "(Copia)"): Setlist => {
    const duplicated: Setlist = {
      ...st,
      id: `setlist-${Date.now()}`,
      nombre: `${st.nombre} ${nameSuffix}`,
      fechaCreacion: new Date().toISOString().split("T")[0],
      fechaUltimaEdicion: new Date().toISOString().split("T")[0],
      items: st.items.map((it) => ({
        ...it,
        id: `it-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      })),
    };
    setSetlists((prev) => [duplicated, ...prev]);
    setActiveSetlistId(duplicated.id);

    void guardarOReverter(
      fetch("/api/setlists", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(duplicated),
      }),
      () => {
        setSetlists((prev) => prev.filter((s) => s.id !== duplicated.id));
        setActiveSetlistId((actual) => (actual === duplicated.id ? "" : actual));
      },
    );

    return duplicated;
  };

  const handleDeleteSetlist = (stId: string) => {
    const st = setlists.find((s) => s.id === stId);
    setConfirmDeleteModal({
      title: "Eliminar Repertorio",
      description: `¿Seguro que deseas eliminar el repertorio "${st?.nombre || "este repertorio"}"?`,
      onConfirm: () => {
        const remaining = setlists.filter((s) => s.id !== stId);
        setSetlists(remaining);
        if (activeSetlist?.id === stId) {
          setActiveSetlistId(remaining[0]?.id || "");
        }
        if (clearDraftIfMatches) {
          clearDraftIfMatches(stId);
        }

        void guardarOReverter(
          fetch(`/api/setlists/${stId}`, {
            method: "DELETE",
            headers: getHeaders(),
          }),
          () => {
            if (st) {
              setSetlists((prev) => (prev.some((s) => s.id === st.id) ? prev : [st, ...prev]));
            }
          },
        );
      },
    });
  };

  const handleAddItemToSetlist = (
    songId?: string,
    tipoItem: any = "cancion",
    tituloCustom?: string,
    duracionEstimadaMinutos?: number,
    duracionEstimadaSegundos?: number,
    notaTema?: string,
    insertAfterId?: string | null,
  ) => {
    if (!activeSetlist) return;

    let actualTipoItem: "cancion" | "bloque" = "cancion";
    let bloqueSubtipo: SetlistItem["bloqueSubtipo"] = undefined;

    if (tipoItem !== "cancion") {
      actualTipoItem = "bloque";
      bloqueSubtipo = tipoItem;
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

    const targetRefId = insertAfterId !== undefined ? insertAfterId : selectedSetlistItemId;
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
      const next = prev.map((st) => (st.id === activeSetlist.id ? updatedSetlist : st));
      saveSetlistsToLocalStorageSafely(next);
      return next;
    });
    syncSetlistToBackend(updatedSetlist);
    setSelectedSetlistItemId(newItem.id);
  };

  const handleRemoveSetlistItem = (itemId: string) => {
    if (!activeSetlist) return;
    const updatedSetlist: Setlist = {
      ...activeSetlist,
      fechaUltimaEdicion: new Date().toISOString().split("T")[0],
      items: activeSetlist.items.filter((it) => it.id !== itemId),
    };

    setSetlists((prev) => prev.map((st) => (st.id === activeSetlist.id ? updatedSetlist : st)));
    syncSetlistToBackend(updatedSetlist);
  };

  const handleUpdateItemNote = (itemId: string, note: string) => {
    if (!activeSetlist) return;
    const updatedSetlist: Setlist = {
      ...activeSetlist,
      items: activeSetlist.items.map((it) => (it.id === itemId ? { ...it, notaTema: note } : it)),
    };

    setSetlists((prev) => prev.map((st) => (st.id === activeSetlist.id ? updatedSetlist : st)));
    syncSetlistToBackend(updatedSetlist);
  };

  return {
    setlistModalData,
    setSetlistModalData,
    handleCreateSetlist,
    handleSetlistImported,
    handleSaveSetlistModal,
    handleDuplicateSetlist,
    handleDeleteSetlist,
    handleAddItemToSetlist,
    handleRemoveSetlistItem,
    handleUpdateItemNote,
  };
}
