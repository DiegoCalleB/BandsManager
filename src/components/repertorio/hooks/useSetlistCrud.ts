/**
 * Crear, importar, guardar, duplicar y borrar setlists.
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
import { Setlist, Song } from "../../../types";
import { saveSongsToLocalStorageSafely, saveSetlistsToLocalStorageSafely } from "../../../utils/audioStorage";
import { guardarOReverter } from "../../../utils/guardarConReversion";
import { Dispatch, SetStateAction } from "react";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface SetlistCrudParams {
  setSetlistModalData: Dispatch<SetStateAction<{ isOpen: boolean; setlistToEdit: Setlist; }>>;
  setSongs: Dispatch<SetStateAction<Song[]>>;
  setSetlists: Dispatch<SetStateAction<Setlist[]>>;
  setActiveSetlistId: Dispatch<SetStateAction<string>>;
  setlists: Setlist[];
  getHeaders: () => { "x-band-id"?: string; Authorization?: string; "Content-Type": string; };
  songs: Song[];
}

/**
 * Crear, importar, guardar, duplicar y borrar setlists.
 * @param params Estado y callbacks del contenedor ({@link SetlistCrudParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useSetlistCrud({ setSetlistModalData, setSongs, setSetlists, setActiveSetlistId, setlists, getHeaders, songs }: SetlistCrudParams) {
  // Setlist Operations
  const handleCreateSetlist = () => {
    setSetlistModalData({ isOpen: true, setlistToEdit: null });
  };

  // El modal de importación ya hizo el POST tanto de las canciones nuevas como del setlist —
  // aquí solo se actualiza el estado local y se cambia a verlo, igual que tras crear/duplicar
  // un setlist a mano.
  const handleSetlistImported = (setlist: Setlist, newSongs: Song[]) => {
    if (newSongs.length > 0) {
      setSongs((prev) => {
        const next = [...prev, ...newSongs];
        saveSongsToLocalStorageSafely(next);
        return next;
      });
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

  const handleOldSetlist = () => {
    const name = prompt(
      "Nombre para el nuevo repertorio:",
      "Festival Verano 2026",
    );
    if (!name || !name.trim()) return;

    const newSetlist: Setlist = {
      id: `setlist-${Date.now()}`,
      nombre: name.trim(),
      descripcion: "Nuevo repertorio para directo",
      tipoFormato: "festival",
      duracionTotalEstimadaMinutos: 45,
      fechaCreacion: new Date().toISOString().split("T")[0],
      fechaUltimaEdicion: new Date().toISOString().split("T")[0],
      items: songs
        .filter((s) => s.favoritoGeneral)
        .map((s, idx) => ({
          id: `it-${Date.now()}-${idx}`,
          songId: s.id,
          tipoItem: "cancion",
        })),
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
  };

  const handleDuplicateSetlist = (
    st: Setlist,
    nameSuffix: string = "(Copia)",
  ): Setlist => {
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

  return { handleDuplicateSetlist, handleCreateSetlist, handleSaveSetlistModal, handleSetlistImported };
}
