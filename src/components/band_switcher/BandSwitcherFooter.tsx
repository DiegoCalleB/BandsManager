/**
 * Pie del selector con recuento y cierre.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Button } from "../ui";
import { useBandSwitcher } from "./BandSwitcherContext";

/**
 * Pie del selector con recuento y cierre.
 * @returns Sección de interfaz.
 */
export function BandSwitcherFooter() {
  const { uniqueBands, onClose } = useBandSwitcher();
  return (
    <>
{/* Modal Footer */}
          <div className="mt-8 pt-4/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--ink-2)]">
            <span className="font-sans">
              {uniqueBands.length}{" "}
              {uniqueBands.length === 1
                ? "proyecto disponible"
                : "proyectos disponibles"}
            </span>
            <Button
              variant="neutral"
              size="sm"
              onClick={onClose}
            >
              Mantener banda actual
            </Button>
          </div>
    </>
  );
}
