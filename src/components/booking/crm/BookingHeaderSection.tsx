/**
 * Cabecera del CRM de booking: título y acciones, panel de herramientas e IA, y búsqueda con vistas.
 * Agrupa las tres franjas para que la maqueta principal solo componga bloques.
 */
import { HeaderTitleAndActions } from "./HeaderTitleAndActions";
import { MobileToolsPanel } from "./MobileToolsPanel";
import { SearchAndViewRow } from "./SearchAndViewRow";

/**
 * Cabecera completa del CRM.
 * @returns Las tres franjas de la cabecera.
 */
export function BookingHeaderSection() {
  return (
    <div className="flex flex-col gap-3">
      <HeaderTitleAndActions />
      <MobileToolsPanel />
      <SearchAndViewRow />
    </div>
  );
}
