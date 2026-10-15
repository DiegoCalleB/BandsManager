import type { LeadType } from "../../../../types";
import type { PlaceResult } from "../placesModel";
import { CATEGORIES } from "../placesModel";
/**
 * Resultados de la búsqueda, selección, avisos de estado y categoría por lugar.
 * Extraído de GooglePlacesExplorerModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";

/**
 * Resultados de la búsqueda, selección, avisos de estado y categoría por lugar.
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function usePlaceResults() {
  const [places, setPlaces] = useState<PlaceResult[]>([]);

  const [searchSource, setSearchSource] = useState("");

  const [searchError, setSearchError] = useState("");

  const [extractStatus, setExtractStatus] = useState("");

  const [importSuccessMsg, setImportSuccessMsg] = useState("");

  const toggleSelectPlace = (placeId: string) => {
    setPlaces((prev) =>
      prev.map((p) =>
        p.place_id === placeId ? { ...p, selected: !p.selected } : p,
      ),
    );
  };

  const toggleSelectAll = () => {
    const allSelected = places.every((p) => p.selected);
    setPlaces((prev) => prev.map((p) => ({ ...p, selected: !allSelected })));
  };

  const handlePlaceCategoryChange = (placeId: string, newType: LeadType) => {
    const catObj = CATEGORIES.find((c) => c.id === newType);
    setPlaces((prev) =>
      prev.map((p) =>
        p.place_id === placeId
          ? { ...p, tipo: newType, icono: catObj?.icon || p.icono }
          : p,
      ),
    );
  };

  return { handlePlaceCategoryChange, setPlaces, places, setSearchError, setImportSuccessMsg, setExtractStatus, setSearchSource, searchSource, searchError, extractStatus, importSuccessMsg, toggleSelectAll, toggleSelectPlace };
}
