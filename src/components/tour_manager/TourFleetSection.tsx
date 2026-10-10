/**
 * Vehículos de la gira y dietas.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Calculator,Plus,Trash2,Truck } from "lucide-react";
import { Button,Input,Select } from "../ui";
import { ShowIcon } from "../ui/ShowIcon";
import { useTourManager } from "./TourManagerContext";

/**
 * Vehículos de la gira y dietas.
 * @returns Sección de interfaz.
 */
export function TourFleetSection() {
  const { formVehiculos, handleAddVehicle, recalculateAllFuelStops, handleRemoveVehicle, handleApplyPresetToVehicle, VEHICLE_PRESETS, handleUpdateVehicle, totalFleetCostPer100Km } = useTourManager();
  return (
    <>
<div className="sm:col-span-3 p-4 rounded-[var(--r-m)] bg-[var(--bg)]/20 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2/20 pb-3">
                        <div>
                          <span className="text-xs font-sans font-bold text-[var(--ink-2)] flex items-center gap-1.5">
                            <Truck className="w-4 h-4 text-[var(--ink-2)]" />{" "}
                            Flota y Vehículos de la Gira ({formVehiculos.length}{" "}
                            {formVehiculos.length === 1
                              ? "vehículo"
                              : "vehículos"}
                            )
                          </span>
                          <p className="text-xs text-[var(--ink-2)] mt-0.5">
                            Añade todos los coches o furgonetas que viajan. El
                            consumo de combustible sumará el gasto combinado de
                            la flota.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="neutral"
                            size="xs"
                            type="button"
                            onClick={() => handleAddVehicle(0)}
                            className="items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" /> Añadir vehículo
                          </Button>
                          <button
                            type="button"
                            onClick={() => recalculateAllFuelStops()}
                            className="px-3 py-1.5 rounded-[var(--r-pill)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] text-xs font-sans font-bold flex items-center gap-1.5 transition-ui cursor-pointer"
                            title="Aplica la suma de consumos a las distancias de todas las paradas"
                          >
                            <Calculator className="w-3.5 h-3.5 text-[var(--acc)]" />{" "}
                            Recalcular Paradas
                          </button>
                        </div>
                      </div>

                      {/* Vehicles List */}
                      <div className="space-y-3">
                        {formVehiculos.map((veh, vIdx) => (
                          <div
                            key={veh.id || `veh-${vIdx}`}
                            className="p-3.5 rounded-[var(--r-m)] bg-[var(--sunken)] relative space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--ink)] text-micro font-sans font-bold">
                                  Vehículo #{vIdx + 1}
                                </span>
                                <span className="text-xs font-semibold text-[var(--ink)]">
                                  {veh.nombre || "Vehículo sin nombre"}
                                </span>
                              </div>
                              {formVehiculos.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVehicle(vIdx)}
                                  className="p-1 rounded-[var(--r-pill)] text-[var(--alert)] hover:bg-[var(--alert)]/20 transition-colors text-xs flex items-center gap-1 cursor-pointer"
                                  title="Eliminar este vehículo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline text-micro font-sans">
                                    Eliminar
                                  </span>
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              <div>
                                <label className="text-micro font-sans text-[var(--ink-2)] block mb-1">
                                  Cargar plantilla
                                </label>
                                <Select size="sm" aria-label="Cargar plantilla"
                                  onChange={(e) =>
                                    handleApplyPresetToVehicle(
                                      vIdx,
                                      e.target.value,
                                    )
                                  }
                                  defaultValue=""
                                  wrapperClassName="w-full"
                                >
                                  <option value="" disabled>
                                    -- Seleccionar Modelo --
                                  </option>
                                  {VEHICLE_PRESETS.map((p, idx) => (
                                    <option
                                      key={`veh-preset-${p.name}-${idx}`}
                                      value={p.label}
                                    >
                                      {p.label}
                                    </option>
                                  ))}
                                </Select>
                              </div>

                              <div>
                                <label className="text-micro font-sans text-[var(--ink-2)] block mb-1">
                                  Nombre / Identificador
                                </label>
                                <Input
                                  size="sm"
                                  value={veh.nombre}
                                  onChange={(e) =>
                                    handleUpdateVehicle(
                                      vIdx,
                                      "nombre",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Ej. Furgoneta Principal (Banda)"
                                  className="w-full"
                                />
                              </div>

                              <div>
                                <label className="text-micro font-sans text-[var(--acc)]/70 block mb-1">
                                  Consumo (
                                  {veh.tipoCombustible === "electrico"
                                    ? "kWh/100km"
                                    : "L/100km"}
                                  )
                                </label>
                                <Input size="sm" aria-label="Consumo ( )"
                                  type="number"
                                  step="0.1"
                                  min="0.1"
                                  value={veh.consumoL100km}
                                  onChange={(e) =>
                                    handleUpdateVehicle(
                                      vIdx,
                                      "consumoL100km",
                                      Number(e.target.value),
                                    )
                                  }
                                  className="w-full"
                                />
                              </div>

                              <div>
                                <label className="text-micro font-sans text-[var(--ink-2)] block mb-1">
                                  Precio (€/
                                  {veh.tipoCombustible === "electrico"
                                    ? "kWh"
                                    : "Litro"}
                                  )
                                </label>
                                <div className="flex gap-1">
                                  <Input size="sm" aria-label="Precio (€/ )"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={veh.precioCarburanteEUR ?? 1.55}
                                    onChange={(e) =>
                                      handleUpdateVehicle(
                                        vIdx,
                                        "precioCarburanteEUR",
                                        Number(e.target.value),
                                      )
                                    }
                                    className="w-full"
                                  />
                                  <Select size="sm" aria-label="Precio (€/ )"
                                    value={veh.tipoCombustible || "diesel"}
                                    onChange={(e) =>
                                      handleUpdateVehicle(
                                        vIdx,
                                        "tipoCombustible",
                                        e.target.value,
                                      )
                                    }
                                  >
                                    <option value="diesel">Diésel</option>
                                    <option value="gasolina95">G95</option>
                                    <option value="gasolina98">G98</option>
                                    <option value="electrico">kWh</option>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Combined Fleet Summary */}
                      <div className="p-3 rounded-[var(--r-m)] bg-[var(--sunken)] flex flex-wrap items-center justify-between gap-3 text-xs font-sans">
                        <div className="space-y-1">
                          <span className="text-[var(--ink)] flex items-center gap-1.5">
                            <ShowIcon inline emoji="📐" />{" "}
                            <strong className="text-[var(--ink)]">
                              Cálculo de Consumo Combinado:
                            </strong>
                          </span>
                          <div className="text-xs text-[var(--ink-2)]">
                            {formVehiculos.map((v, i) => (
                              <span
                                key={`veh-fleet-summary-${v.id || i}-${i}`}
                                className="inline-block mr-2"
                              >
                                • {v.nombre || `Vehículo ${i + 1}`}:{" "}
                                {v.consumoL100km}{" "}
                                {v.tipoCombustible === "electrico"
                                  ? "kWh"
                                  : "L"}
                                /100km @ {v.precioCarburanteEUR || 1.55}€ (≈{" "}
                                {(
                                  (Number(v.consumoL100km) || 0) *
                                  (Number(v.precioCarburanteEUR) || 1.55)
                                ).toFixed(2)}
                                €/100km)
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="bg-[var(--acc)]/10 px-3 py-1.5 rounded-[var(--r-s)] text-right shrink-0">
                          <span className="text-micro block text-[var(--ink-2)] font-sans">
                            Coste flota total / 100 km
                          </span>
                          <span className="text-sm font-extrabold text-[var(--acc)]/70">
                            {totalFleetCostPer100Km.toFixed(2)} € / 100 km
                          </span>
                        </div>
                      </div>
                    </div>
    </>
  );
}
