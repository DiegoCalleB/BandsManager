import type { PlaceResult } from "../placesModel";
import { errorMessage } from "../placesModel";
/**
 * Importación de los lugares seleccionados al CRM de booking.
 * Extraído de GooglePlacesExplorerModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch,SetStateAction,useState } from "react";
import { Lead } from "../../../../types";
import { apiFetch } from "../../../../utils/api";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface PlaceCrmImportParams {
  places: PlaceResult[];
  setImportSuccessMsg: Dispatch<SetStateAction<string>>;
  onImportLeads: (leads: Lead[]) => void;
  onClose: () => void;
  setSearchError: Dispatch<SetStateAction<string>>;
}

/**
 * Importación de los lugares seleccionados al CRM de booking.
 * @param params Estado y callbacks del contenedor ({@link PlaceCrmImportParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function usePlaceCrmImport({ places, setImportSuccessMsg, onImportLeads, onClose, setSearchError }: PlaceCrmImportParams) {
  const [isImporting, setIsImporting] = useState(false);

  // Import selected places directly to CRM & Supabase Leads table
  const handleImportToCRM = async () => {
    const selectedPlaces = places.filter((p) => p.selected);
    if (selectedPlaces.length === 0) return;

    setIsImporting(true);
    setImportSuccessMsg("");

    try {
      const res = await apiFetch("/api/leads/import-places", {
        method: "POST",
        body: JSON.stringify({
          leads: selectedPlaces,
        }),
      });

      if (res.success) {
        setImportSuccessMsg(
          `🎉 ¡${res.importedCount} contactos clasificados e importados con éxito a tu CRM!`,
        );
        if (Array.isArray(res.leads)) {
          onImportLeads(res.leads);
        }
        setTimeout(() => {
          onClose();
        }, 1600);
      }
    } catch (err) {
      console.error("Error al importar recintos:", err);
      setSearchError(
        `Error al guardar en el CRM: ${errorMessage(err) || "Fallo del servidor"}`,
      );
    } finally {
      setIsImporting(false);
    }
  };

  return { handleImportToCRM, isImporting };
}
