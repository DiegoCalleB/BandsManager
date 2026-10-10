/**
 * Barra de navegación: periodo, selector de vistas y filtro de banda.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { BandFilterToggle } from "./BandFilterToggle";
import { PeriodNavigation } from "./PeriodNavigation";
import { ViewSwitchers } from "./ViewSwitchers";

/**
 * Barra de navegación: periodo, selector de vistas y filtro de banda.
 * @returns Sección de interfaz.
 */
export function MonthNavigationBar() {
  return (
    <>
      <div className="pin-top flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-3 mt-3 pt-2">
        <PeriodNavigation />

        {/* Right: View Switchers + Band Filter */}
        <div className="flex items-center gap-2 flex-wrap justify-between 2xl:justify-end min-w-0">
          <ViewSwitchers />
        </div>

        <BandFilterToggle />
      </div>
    </>
  );
}
