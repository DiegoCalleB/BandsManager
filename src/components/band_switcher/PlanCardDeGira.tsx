/**
 * Tarjeta del plan De Gira.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ArrowRight,Loader2,Star,Zap } from "lucide-react";
import { useBandSwitcher } from "./BandSwitcherContext";

/**
 * Tarjeta del plan De Gira.
 * @returns Sección de interfaz.
 */
export function PlanCardDeGira() {
  const { newBandFeatureCategory, handleSelectPlanForCreation, isCreatingBand, creatingPlanKey } = useBandSwitcher();
  return (
    <>
<div className="bg-[var(--sunken)] rounded-[var(--r-l)] p-5 flex flex-col relative">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--acc)] text-[var(--on-acc)] text-micro font-bold py-0.5 px-2.5 rounded-[var(--r-pill)] flex items-center gap-1 whitespace-nowrap">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        Más Popular
                      </div>

                      <div className="mb-3 mt-1">
                        <h3 className="text-base font-bold text-[var(--acc)]">
                          De Gira
                        </h3>
                        <div className="mt-1.5 flex items-baseline gap-1">
                          <span className="text-2xl font-black text-[var(--ink)]">
                            29€
                          </span>
                          <span className="text-xs text-[var(--ink-2)]">
                            / mes
                          </span>
                        </div>
                        <p className="text-xs text-[var(--ink-2)] mt-1.5 min-h-[32px]">
                          Para bandas que tocan con frecuencia y automatizan con
                          IA.
                        </p>
                      </div>

                      <div className="mb-3 px-2.5 py-1 rounded-[var(--r-m)] bg-[var(--acc)]/20 flex items-center gap-1.5 text-micro font-sans text-[var(--ink)] font-bold">
                        <span>500 pegatinas gratis</span>
                      </div>

                      <ul className="space-y-2 mb-5 flex-1 text-xs">
                        {[
                          { text: "Salas & medios ilimitados", cat: "booking" },
                          {
                            text: "Agente Booking IA en batch",
                            cat: "booking",
                          },
                          { text: "Rutas de Gira & Dietas", cat: "booking" },
                          { text: "Fans & Reels ilimitados", cat: "media" },
                        ].map((f, i) => {
                          const isHighlighted =
                            newBandFeatureCategory === "all" ||
                            newBandFeatureCategory === f.cat;
                          return (
                            <li
                              key={i}
                              className={`flex items-start gap-2 transition-opacity duration-200 ${isHighlighted ? "text-[var(--ink-2)] opacity-100" : "text-[var(--ink-2)] opacity-40"}`}
                            >
                              <Zap
                                className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isHighlighted ? "text-[var(--acc)]" : "text-[var(--ink-2)]"}`}
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
                        onClick={() => handleSelectPlanForCreation("de_gira")}
                        disabled={isCreatingBand}
                        className="w-full py-2.5 rounded-[var(--r-l)] bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-bold text-xs transition-colors cursor-pointer/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {isCreatingBand && creatingPlanKey === "de_gira" ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[var(--ink)]" />
                            <span>Configurando…</span>
                          </>
                        ) : (
                          <>
                            <span>Elegir de Gira</span>
                            <ArrowRight className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    </div>
    </>
  );
}
