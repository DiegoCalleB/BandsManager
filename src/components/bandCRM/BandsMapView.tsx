/**
 * Vista de mapa de las bandas filtradas.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import BandMap from "../BandMap";
import { useBandCrm } from "./BandCrmContext";

/**
 * Vista de mapa de las bandas filtradas.
 * @returns Sección de interfaz.
 */
export function BandsMapView() {
  const { filteredBands, handleOpenEditModal } = useBandCrm();
    return (

  <BandMap
    bands={filteredBands}
    onSelectBand={(band) => handleOpenEditModal(band)}
  />
    );

}
