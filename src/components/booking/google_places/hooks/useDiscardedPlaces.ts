import type { DiscardedPlace,PlaceResult } from "../placesModel";
import { getStoredDiscarded,saveStoredDiscarded } from "../placesModel";
/**
 * Lugares descartados por el usuario y su persistencia local.
 * Extraído de GooglePlacesExplorerModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch,SetStateAction,useState } from "react";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface DiscardedPlacesParams {
  places: PlaceResult[];
  setPlaces: Dispatch<SetStateAction<PlaceResult[]>>;
}

/**
 * Lugares descartados por el usuario y su persistencia local.
 * @param params Estado y callbacks del contenedor ({@link DiscardedPlacesParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useDiscardedPlaces({ places, setPlaces }: DiscardedPlacesParams) {
  const selectedCount = places.filter((p) => p.selected).length;

  // Discarded places state
  const [discardedList, setDiscardedList] = useState<DiscardedPlace[]>(() =>
    getStoredDiscarded(),
  );

  const [showDiscardedModal, setShowDiscardedModal] = useState(false);

  const [discardToast, setDiscardToast] = useState("");

  const handleDiscardPlace = (place: PlaceResult) => {
    const current = getStoredDiscarded();
    const newItem: DiscardedPlace = {
      place_id: place.place_id,
      nombre_sala: place.nombre_sala,
      ciudad: place.ciudad,
      tipo: String(place.tipo || ""),
      discarded_at: new Date().toISOString(),
    };
    const updated = [
      newItem,
      ...current.filter(
        (d) =>
          (d.place_id && place.place_id
            ? d.place_id !== place.place_id
            : true) &&
          d.nombre_sala.toLowerCase().trim() !==
            place.nombre_sala.toLowerCase().trim(),
      ),
    ];
    saveStoredDiscarded(updated);
    setDiscardedList(updated);
    setPlaces((prev) => prev.filter((p) => p.place_id !== place.place_id));
    setDiscardToast(
      `"${place.nombre_sala}" descartada. No volverá a aparecer en las sugerencias.`,
    );
    setTimeout(() => setDiscardToast(""), 4000);
  };

  const handleRestorePlace = (placeName: string) => {
    const current = getStoredDiscarded();
    const updated = current.filter(
      (d) =>
        d.nombre_sala.toLowerCase().trim() !== placeName.toLowerCase().trim(),
    );
    saveStoredDiscarded(updated);
    setDiscardedList(updated);
  };

  const handleClearAllDiscarded = () => {
    if (
      window.confirm(
        "¿Deseas restablecer todas las sugerencias no deseadas? Volverán a aparecer en futuras búsquedas.",
      )
    ) {
      saveStoredDiscarded([]);
      setDiscardedList([]);
      setShowDiscardedModal(false);
    }
  };

  return { handleClearAllDiscarded, setDiscardedList, setShowDiscardedModal, setDiscardToast, discardedList, discardToast, selectedCount, handleDiscardPlace, showDiscardedModal, handleRestorePlace };
}
