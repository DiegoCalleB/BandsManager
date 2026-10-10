/**
 * Confirmación y borrado de una gira.
 * Extraído de TourManager.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface TourDeleteParams {
  onDeleteTour: (id: string) => void;
}

/**
 * Confirmación y borrado de una gira.
 * @param params Estado y callbacks del contenedor ({@link TourDeleteParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useTourDelete({ onDeleteTour }: TourDeleteParams) {
  // Delete Confirmation Modal state
  const [tourToDelete, setTourToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleDelete = (id: string, name: string) => {
    setTourToDelete({ id, name });
  };

  const confirmDelete = () => {
    if (tourToDelete) {
      onDeleteTour(tourToDelete.id);
      setTourToDelete(null);
    }
  };

  return { handleDelete, tourToDelete, setTourToDelete, confirmDelete };
}
