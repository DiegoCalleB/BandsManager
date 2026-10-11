/**
 * Resumen económico de la gira.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { useTourManager } from "./TourManagerContext";

/**
 * Resumen económico de la gira.
 * @returns Sección de interfaz.
 */
export function TourStatsSummary() {
  const { formStops, formConvocatoriaTipo, availableMembers, formConvocadosIds } = useTourManager();
  return (
    <>
{formStops.length > 0 &&
                    (() => {
                      const totalIngresos = formStops.reduce(
                        (sum, stop) => sum + (stop.ingresoCacheEstimated || 0),
                        0,
                      );
                      const totalGastos = formStops.reduce(
                        (sum, stop) =>
                          sum +
                          (stop.gastosAlojamiento || 0) +
                          (stop.gastosGasolina || 0) +
                          (stop.gastosDietas || 0),
                        0,
                      );
                      const neto = totalIngresos - totalGastos;
                      const numPers =
                        formConvocatoriaTipo === "completa"
                          ? availableMembers.length
                          : formConvocadosIds.length || availableMembers.length;
                      const netoPorPersona =
                        numPers > 0 ? Math.round(neto / numPers) : 0;

                      return (
                        <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                          <div>
                            <span className="text-micro text-[var(--ink-2)] font-sans block">
                              Caché Total Est.
                            </span>
                            <span className="text-base sm:text-lg font-bold text-[var(--ok)]">
                              +{totalIngresos} €
                            </span>
                          </div>
                          <div>
                            <span className="text-micro text-[var(--ink-2)] font-sans block">
                              Gastos Logística
                            </span>
                            <span className="text-base sm:text-lg font-bold text-[var(--alert)]">
                              -{totalGastos} €
                            </span>
                          </div>
                          <div>
                            <span className="text-micro text-[var(--ink-2)] font-sans block">
                              Margen neto total
                            </span>
                            <span
                              className={`text-base sm:text-lg font-extrabold ${neto >= 0 ? "text-[var(--ok)]" : "text-[var(--alert)]"}`}
                            >
                              {neto >= 0 ? `+${neto}` : neto} €
                            </span>
                          </div>
                          <div>
                            <span className="text-micro text-[var(--ink-2)] font-sans block">
                              Neto / Músico ({numPers}pax)
                            </span>
                            <span
                              className={`text-base sm:text-lg font-extrabold ${netoPorPersona >= 0 ? "text-[var(--ok)]" : "text-[var(--alert)]"}`}
                            >
                              {netoPorPersona >= 0
                                ? `+${netoPorPersona}`
                                : netoPorPersona}{" "}
                              €
                            </span>
                          </div>
                        </div>
                      );
                    })()}
    </>
  );
}
