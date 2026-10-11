/**
 * Espacio de trabajo de bandas aliadas: filtros, acciones masivas y listado.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { BandsFilterBar } from "./BandsFilterBar";
import { BandsListContainer } from "./BandsListContainer";
import { BulkBandsBar } from "./BulkBandsBar";

/**
 * Espacio de trabajo de bandas aliadas: filtros, acciones masivas y listado.
 * @returns Sección de interfaz.
 */
export function BandsWorkspace() {
    return (
      <>
        <BandsFilterBar />

        <BulkBandsBar />

        <BandsListContainer />
      </>
    );

}
