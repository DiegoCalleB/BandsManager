/**
 * Vista de mapa de fans por ciudad.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Map as MapIcon,MapPin } from "lucide-react";
import { useFansPanel } from "./FansPanelContext";

/**
 * Vista de mapa de fans por ciudad.
 * @returns Sección de interfaz.
 */
export function FansMapView() {
  const { viewMode, filteredFans } = useFansPanel();
  return (
    <>
{viewMode === "map" && (
            <div className="space-y-4">
              <div className="bg-[var(--sunken)] rounded-[var(--r-l)] p-4 text-xs font-sans text-[var(--ink-2)]">
                <div className="flex items-center gap-2 text-[var(--acc)] font-bold mb-3">
                  <MapIcon className="w-4 h-4" />
                  <span>
                    Distribución Geográfica de la Comunidad de Fans por Ciudades
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(
                    filteredFans.reduce(
                      (acc, f) => {
                        const city = f.ciudad || "Ciudad no indicada";
                        acc[city] = (acc[city] || 0) + 1;
                        return acc;
                      },
                      {} as Record<string, number>,
                    ),
                  )
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .map(([city, count]) => (
                      <div
                        key={city}
                        className="bg-[var(--surface)] p-3 rounded-[var(--r-m)] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <MapPin className="w-4 h-4 text-[var(--acc)] shrink-0" />
                          <span className="font-bold text-[var(--ink)] truncate">
                            {city}
                          </span>
                        </div>
                        <span className="bg-[var(--acc)]/20 text-[var(--ink)] text-micro font-bold px-2 py-0.5 rounded-[var(--r-pill)]">
                          {count} {count === 1 ? "fan" : "fans"}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
    </>
  );
}
