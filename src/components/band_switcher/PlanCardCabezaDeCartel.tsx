/**
 * Tarjeta del plan Cabeza de Cartel.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Loader2,Shield } from "lucide-react";
import { useBandSwitcher } from "./BandSwitcherContext";

/**
 * Tarjeta del plan Cabeza de Cartel.
 * @returns Sección de interfaz.
 */
export function PlanCardCabezaDeCartel() {
  const { newBandFeatureCategory, handleSelectPlanForCreation, isCreatingBand, creatingPlanKey } = useBandSwitcher();
  return (
    <>
<div className="bg-[var(--sunken)] rounded-[var(--r-xl)] p-5 flex flex-col hover:bg-[var(--ok-soft)] transition-colors">
                      <div className="mb-3">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-micro font-sans font-bold px-2 py-0.5 rounded bg-[var(--ok-soft)] text-[var(--ink-2)]">
                            Élite 360
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[var(--ink-2)]">
                          Cabeza de cartel
                        </h3>
                        <div className="mt-1.5 flex items-baseline gap-1">
                          <span className="text-2xl font-black text-[var(--ink)]">
                            79€
                          </span>
                          <span className="text-xs text-[var(--ink-2)]">
                            / mes
                          </span>
                        </div>
                        <p className="text-xs text-[var(--ink-2)] mt-1.5 min-h-[32px]">
                          Control total para proyectos profesionales y agencias.
                        </p>
                      </div>

                      <div className="mb-3 px-2.5 py-1 rounded-[var(--r-m)] bg-[var(--ok-soft)] flex items-center gap-1.5 text-micro font-sans text-[var(--ink-2)] font-bold">
                        <span>1.000 pegatinas + Express</span>
                      </div>

                      <ul className="space-y-2 mb-5 flex-1 text-xs">
                        {[
                          { text: "Hasta 5 bandas multi-proyecto", cat: "all" },
                          { text: "Finanzas & Balances Pro", cat: "finance" },
                          {
                            text: "Taller Merchan & Inventario",
                            cat: "finance",
                          },
                          {
                            text: "IA Multi-Agente & Soporte VIP",
                            cat: "finance",
                          },
                        ].map((f, i) => {
                          const isHighlighted =
                            newBandFeatureCategory === "all" ||
                            newBandFeatureCategory === f.cat;
                          return (
                            <li
                              key={i}
                              className={`flex items-start gap-2 transition-opacity duration-200 ${isHighlighted ? "text-[var(--ink-2)] opacity-100" : "text-[var(--ink-2)] opacity-40"}`}
                            >
                              <Shield
                                className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isHighlighted ? "text-[var(--ok)]" : "text-[var(--ink-2)]"}`}
                              />
                              <span
                                className={
                                  isHighlighted &&
                                  newBandFeatureCategory !== "all"
                                    ? "font-bold text-[var(--acc)]"
                                    : ""
                                }
                              >
                                {f.text}
                              </span>
                            </li>
                          );
                        })}
                      </ul>

                      <button
                        type="button"
                        onClick={() =>
                          handleSelectPlanForCreation("cabeza_de_cartel")
                        }
                        disabled={isCreatingBand}
                        className="w-full py-2.5 rounded-[var(--r-l)] bg-[var(--ok-soft)] hover:bg-[var(--ok-soft)] text-[var(--ink)] font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isCreatingBand &&
                        creatingPlanKey === "cabeza_de_cartel" ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[var(--ink)]" />
                            <span>Configurando…</span>
                          </>
                        ) : (
                          <span>Seleccionar 360</span>
                        )}
                      </button>
                    </div>
    </>
  );
}
