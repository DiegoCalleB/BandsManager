/**
 * Estado vacío cuando ningún filtro devuelve bandas.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { AlertCircle, Plus } from "lucide-react";
import { Button } from "../ui";
import { useBandCrm } from "./BandCrmContext";

/**
 * Estado vacío cuando ningún filtro devuelve bandas.
 * @returns Sección de interfaz.
 */
export function BandsEmptyState() {
  const { colors, handleOpenCreateModal } = useBandCrm();
    return (

  <div
    className={`p-12 rounded-[var(--r-l)] text-center space-y-3 ${colors.card} `}
  >
    <AlertCircle className="w-10 h-10 text-[var(--ink-2)] mx-auto" />
    <h3 className="text-sm font-sans font-bold text-[var(--ink-2)]">
      No se encontraron bandas
    </h3>
    <p className="text-micro text-[var(--ink-2)] max-w-md mx-auto font-sans">
      No hay bandas registradas que coincidan con los criterios de
      búsqueda o filtros seleccionados. Prorroga tu búsqueda o añade
      una nueva banda.
    </p>
    <Button
      variant="neutral"
      size="xs"
      onClick={handleOpenCreateModal}
      className="mt-2 items-center gap-2"
    >
      <Plus className="w-4 h-4" />
      <span>Añadir primera banda</span>
    </Button>
  </div>
    );

}
