/**
 * Contenedor de la lista de bandas según la vista (vacío, mapa, tarjetas o tabla).
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { BandCardsGrid } from "./BandCardsGrid";
import { useBandCrm } from "./BandCrmContext";
import { BandsEmptyState } from "./BandsEmptyState";
import { BandsMapView } from "./BandsMapView";
import { BandsTable } from "./BandsTable";

/**
 * Contenedor de la lista de bandas según la vista (vacío, mapa, tarjetas o tabla).
 * @returns Sección de interfaz.
 */
export function BandsListContainer() {
  const { filteredBands, viewMode } = useBandCrm();
  return (
    <>
      {/* 3. BAND LIST CONTAINER */}
      {filteredBands.length === 0 ? <BandsEmptyState /> : viewMode === "map" ? <BandsMapView /> : viewMode === "grid" ? <BandCardsGrid /> : <BandsTable />}
    </>
  );
}
