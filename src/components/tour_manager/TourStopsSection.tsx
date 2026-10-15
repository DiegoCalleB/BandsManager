/**
 * Paradas de la gira con sala, fecha y caché.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Calculator,MapPin,Plus,Trash2 } from "lucide-react";
import { HolidayDateWarning } from "../common/HolidayDateWarning";
import { Button,IconButton,Input,Select } from "../ui";
import { useTourManager } from "./TourManagerContext";

/**
 * Paradas de la gira con sala, fecha y caché.
 * @returns Sección de interfaz.
 */
export function TourStopsSection() {
  const { addStop, formStops, removeStop, leads, handleSelectVenueForStop, updateStop, formVehiculos } = useTourManager();
  return (
    <>
<div className="pt-2">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-bold flex items-center gap-2 font-display">
                          <MapPin className="w-4 h-4 text-[var(--ink-2)]" />
                          Ruta y paradas
                        </h4>
                        <p className="text-xs text-[var(--ink-2)] mt-0.5">
                          Cada parada con fecha se reflejará en el calendario de
                          la banda con sus gastos logísticos y convocatoria.
                        </p>
                      </div>
                      <Button
                        variant="neutral"
                        size="xs"
                        type="button"
                        onClick={addStop}
                        className="items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Añadir parada
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {formStops.length === 0 ? (
                        <div className="p-6 text-center rounded-[var(--r-m)] bg-[var(--sunken)] text-[var(--ink-2)] text-sm italic">
                          Añade paradas para calcular automáticamente
                          kilometraje, estimación de combustible de todos tus
                          vehículos, dietas y margen financiero.
                        </div>
                      ) : (
                        formStops.map((stop, idx) => (
                          <div
                            key={stop.id || `form-stop-${idx}`}
                            className="p-4 rounded-[var(--r-m)] bg-[var(--surface)]/60 relative group"
                          >
                            <IconButton
                              label="Eliminar parada"
                              variant="danger"
                              type="button"
                              onClick={() => removeStop(idx)}
                              className="absolute top-3 right-3"
                            >
                              <Trash2 className="w-4 h-4" />
                            </IconButton>

                            <div className="text-xs font-bold text-[var(--ink-2)] font-sans mb-3 flex items-center gap-2">
                              <span>PARADA #{idx + 1}</span>
                              {leads.length > 0 && (
                                <Select
                                  size="sm"
                                  onChange={(e) =>
                                    handleSelectVenueForStop(
                                      idx,
                                      e.target.value,
                                    )
                                  }
                                  defaultValue=""
                                  wrapperClassName="ml-auto"
                                >
                                  <option value="" disabled>
                                    -- Cargar desde Salas BD --
                                  </option>
                                  {leads.map((lead, lIdx) => (
                                    <option
                                      key={`lead-opt-${lead.id || lIdx}-${lIdx}`}
                                      value={lead.id || lead.nombre_sala}
                                    >
                                      {lead.nombre_sala} ({lead.ciudad})
                                    </option>
                                  ))}
                                </Select>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
                              <div className="space-y-1">
                                <label className="text-micro font-sans text-[var(--ink-2)] block">
                                  Ciudad
                                </label>
                                <Input
                                  size="sm"
                                  value={stop.ciudad}
                                  onChange={(e) =>
                                    updateStop(idx, "ciudad", e.target.value)
                                  }
                                  placeholder="Ciudad"
                                  className="w-full"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-micro font-sans text-[var(--ink-2)] block">
                                  Sala / festival
                                </label>
                                <Input
                                  size="sm"
                                  value={stop.sala}
                                  onChange={(e) =>
                                    updateStop(idx, "sala", e.target.value)
                                  }
                                  placeholder="Nombre de la sala"
                                  className="w-full"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-micro font-sans text-[var(--ink-2)] block">
                                  Fecha
                                </label>
                                <Input size="sm" aria-label="Fecha"
                                  type="date"
                                  value={stop.fecha}
                                  onChange={(e) =>
                                    updateStop(idx, "fecha", e.target.value)
                                  }
                                  className="w-full"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-micro font-sans text-[var(--ink-2)] block flex items-center justify-between">
                                  <span className="flex items-center gap-1">
                                    <span>Distancia (Km)</span>
                                    <span title="Calcula combustible combinado para toda la flota automáticamente">
                                      <Calculator className="w-3 h-3 text-[var(--ink-2)]" />
                                    </span>
                                  </span>
                                  {stop.distanciaAnteriorKm &&
                                  stop.distanciaAnteriorKm > 0 ? (
                                    <span className="text-micro text-[var(--acc)]/70 font-normal">
                                      {formVehiculos.length}{" "}
                                      {formVehiculos.length === 1
                                        ? "vehículo"
                                        : "vehículos"}
                                    </span>
                                  ) : null}
                                </label>
                                <Input
                                  size="sm"
                                  type="number"
                                  min="0"
                                  value={stop.distanciaAnteriorKm || ""}
                                  onChange={(e) =>
                                    updateStop(
                                      idx,
                                      "distanciaAnteriorKm",
                                      Number(e.target.value),
                                    )
                                  }
                                  placeholder="Km desde anterior"
                                  className="w-full"
                                />
                              </div>
                            </div>

                            {/* Auditor de Festivos y Puentes para la Parada de Gira */}
                            <HolidayDateWarning
                              date={stop.fecha}
                              city={stop.ciudad}
                              className="mb-3"
                            />

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                              <div>
                                <label className="text-micro text-[var(--ok)] block font-sans">
                                  Caché / taquilla (€)
                                </label>
                                <Input
                                  size="sm"
                                  type="number"
                                  min="0"
                                  value={stop.ingresoCacheEstimated || ""}
                                  onChange={(e) =>
                                    updateStop(
                                      idx,
                                      "ingresoCacheEstimated",
                                      Number(e.target.value),
                                    )
                                  }
                                  placeholder="0 €"
                                  className="w-full"
                                />
                              </div>
                              <div>
                                <label className="text-micro text-[var(--acc)]/70 block font-sans flex items-center justify-between">
                                  <span>Gasolina flota (€)</span>
                                </label>
                                <Input
                                  size="sm"
                                  type="number"
                                  min="0"
                                  value={stop.gastosGasolina || ""}
                                  onChange={(e) =>
                                    updateStop(
                                      idx,
                                      "gastosGasolina",
                                      Number(e.target.value),
                                    )
                                  }
                                  placeholder="0 €"
                                  className="w-full"
                                />
                              </div>
                              <div>
                                <label className="text-micro text-[var(--ink-2)] block font-sans">
                                  Alojamiento (€)
                                </label>
                                <Input
                                  size="sm"
                                  type="number"
                                  min="0"
                                  value={stop.gastosAlojamiento || ""}
                                  onChange={(e) =>
                                    updateStop(
                                      idx,
                                      "gastosAlojamiento",
                                      Number(e.target.value),
                                    )
                                  }
                                  placeholder="0 €"
                                  className="w-full"
                                />
                              </div>
                              <div>
                                <label className="text-micro text-[var(--ink-2)] block font-sans">
                                  Dietas Expedición (€)
                                </label>
                                <Input
                                  size="sm"
                                  type="number"
                                  min="0"
                                  value={stop.gastosDietas || ""}
                                  onChange={(e) =>
                                    updateStop(
                                      idx,
                                      "gastosDietas",
                                      Number(e.target.value),
                                    )
                                  }
                                  placeholder="0 €"
                                  className="w-full"
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
    </>
  );
}
