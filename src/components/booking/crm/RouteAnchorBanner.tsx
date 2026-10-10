/**
 * Aviso del filtro activo por ciudad ancla de la ruta.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Compass } from "lucide-react";
import { ShowIcon } from "../../ui/ShowIcon";
import { useBookingCrm } from "./BookingCrmContext";

/**
 * Aviso del filtro activo por ciudad ancla de la ruta.
 * @returns Sección de interfaz.
 */
export function RouteAnchorBanner() {
  const { routeAnchorCity, filteredLeads, setRouteAnchorCity } = useBookingCrm();
  return (
    <>
      {/* Route Anchor Active Filter Banner */}
      {routeAnchorCity && (
      <div className="flex items-center justify-between p-2.5 px-3.5 rounded-[var(--r-m)] bg-[var(--acc)] text-[var(--on-acc)] text-xs">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[var(--acc)] shrink-0" />
          <span>
            <ShowIcon inline emoji="🚗" /><strong>Enlace de Fin de Semana desde {routeAnchorCity}:</strong> Mostrando {filteredLeads.length} salas compatibles
            en ruta (&lt; 2.5h)
          </span>
        </div>
        <button
          type="button"
          onClick={() => setRouteAnchorCity(null)}
          className="text-[var(--on-acc)] hover:text-[var(--ink)] text-xs font-bold px-2 py-0.5 rounded bg-[var(--acc)] cursor-pointer transition-colors"
        >
          ✕ Quitar filtro de ruta
        </button>
      </div>
      )}
    </>
  );
}
