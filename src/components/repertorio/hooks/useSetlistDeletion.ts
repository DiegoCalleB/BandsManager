/**
 * Borrado de setlists con confirmación, deshacer y sincronización con el backend.
 * Extraído de RepertorioSetlists.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
 
import { Dispatch,SetStateAction } from "react";
import { Setlist } from "../../../types";
import { guardarOReverter } from "../../../utils/guardarConReversion";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface SetlistDeletionParams {
  setlists: Setlist[];
  setConfirmDeleteModal: Dispatch<SetStateAction<{ title: string; description: string; onConfirm: () => void; }>>;
  setSetlists: Dispatch<SetStateAction<Setlist[]>>;
  activeSetlistId: string;
  setActiveSetlistId: Dispatch<SetStateAction<string>>;
  perfectSetlistDraft: { originalSetlistId: string; draftSetlistId: string; };
  setPerfectSetlistDraft: Dispatch<SetStateAction<{ originalSetlistId: string; draftSetlistId: string; }>>;
  getHeaders: () => { "x-band-id"?: string; Authorization?: string; "Content-Type": string; };
}

/**
 * Borrado de setlists con confirmación, deshacer y sincronización con el backend.
 * @param params Estado y callbacks del contenedor ({@link SetlistDeletionParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useSetlistDeletion({ setlists, setConfirmDeleteModal, setSetlists, activeSetlistId, setActiveSetlistId, perfectSetlistDraft, setPerfectSetlistDraft, getHeaders }: SetlistDeletionParams) {
  const handleDeleteSetlist = (stId: string) => {
    const st = setlists.find((s) => s.id === stId);
    setConfirmDeleteModal({
      title: "Eliminar Repertorio",
      description: `¿Seguro que deseas eliminar el repertorio "${st?.nombre || "este repertorio"}"?`,
      onConfirm: () => {
        const remaining = setlists.filter((s) => s.id !== stId);
        setSetlists(remaining);
        if (activeSetlistId === stId) {
          setActiveSetlistId(remaining[0]?.id || "");
        }
        // Si se borra justo la copia de trabajo de"Setlist Perfecto" (o su original), esa referencia
        // ya no vale — la próxima vez que se pida el plan, se creará una copia nueva desde cero.
        if (
          perfectSetlistDraft &&
          (perfectSetlistDraft.draftSetlistId === stId ||
            perfectSetlistDraft.originalSetlistId === stId)
        ) {
          setPerfectSetlistDraft(null);
        }

        void guardarOReverter(
          fetch(`/api/setlists/${stId}`, {
            method: "DELETE",
            headers: getHeaders(),
          }),
          () => {
            if (st) {
              setSetlists((prev) =>
                prev.some((s) => s.id === st.id) ? prev : [st, ...prev],
              );
            }
          },
        );
      },
    });
  };

  return { handleDeleteSetlist };
}
