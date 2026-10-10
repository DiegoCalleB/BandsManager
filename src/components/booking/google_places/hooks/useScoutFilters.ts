/**
 * Filtros del explorador: ciudad, tipo, aforo, límite y tipos de la búsqueda masiva.
 * Extraído de GooglePlacesExplorerModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useEffect,useState } from "react";
import { BookingCampaign,LeadType } from "../../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface ScoutFiltersParams {
  activeCampaign: BookingCampaign;
  isOpen: boolean;
}

/**
 * Filtros del explorador: ciudad, tipo, aforo, límite y tipos de la búsqueda masiva.
 * @param params Estado y callbacks del contenedor ({@link ScoutFiltersParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useScoutFilters({ activeCampaign, isOpen }: ScoutFiltersParams) {
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedCity, setSelectedCity] = useState(
    activeCampaign?.targetCities[0] || "",
  );

  const [selectedType, setSelectedType] = useState<LeadType>("sala");

  const [searchLimit, setSearchLimit] = useState<number>(6);

 // Between 1 and 10
  const [aforoMin, setAforoMin] = useState<string>(
    activeCampaign?.minCapacity?.toString() || "",
  );

  const [aforoMax, setAforoMax] = useState<string>(
    activeCampaign?.maxCapacity?.toString() || "",
  );

  // Keep state synced if campaign changes while modal is open
  // Resincroniza los filtros con la campaña activa cada vez que se abre el modal o cambia la campaña.
  useEffect(() => {
    if (activeCampaign && isOpen) {
      /* eslint-disable react-hooks/set-state-in-effect -- sincronización con la prop activeCampaign */
      setSelectedCity(activeCampaign.targetCities[0] || "");
      setAforoMin(activeCampaign.minCapacity?.toString() || "");
      setAforoMax(activeCampaign.maxCapacity?.toString() || "");
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [activeCampaign, isOpen]);

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [massFilterTipos, setMassFilterTipos] = useState<string[]>([
    "sala",
    "local",
    "discoteca",
    "teatro",
  ]);

  return { massFilterTipos, setMassFilterTipos, selectedCity, selectedType, searchQuery, searchLimit, aforoMin, aforoMax, setSelectedCity, setSearchQuery, setSelectedType, setSearchLimit, setShowAdvancedFilters, showAdvancedFilters, setAforoMin, setAforoMax };
}
