/**
 * Tarjeta del plan Local.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Check,Loader2 } from "lucide-react";
import { useBandSwitcher } from "./BandSwitcherContext";

/**
 * Tarjeta del plan Local.
 * @returns Sección de interfaz.
 */
export function PlanCardLocal() {
  const { newBandFeatureCategory, handleSelectPlanForCreation, isCreatingBand, creatingPlanKey } = useBandSwitcher();
  return (
    <>
<div className="bg-[var(--sunken)] rounded-[var(--r-xl)] p-5 flex flex-col hover:transition-colors relative">
                      <div className="mb-3">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-micro font-sans font-bold px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--ink-2)]">
                            Iniciación
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[var(--ink-2)]">
                          Local
                        </h3>
                        <div className="mt-1.5 flex items-baseline gap-1">
                          <span className="text-2xl font-black text-[var(--ink)]">
                            12€
                          </span>
                          <span className="text-xs text-[var(--ink-2)]">
                            / mes
                          </span>
                        </div>
                        <p className="text-xs text-[var(--ink-2)] mt-1.5 min-h-[32px]">
                          El kit esencial para bandas tocando en su circuito
                          local.
                        </p>
                      </div>

                      <div className="mb-3 px-2.5 py-1 rounded-[var(--r-m)] bg-[var(--surface)]/80 flex items-center gap-1.5 text-micro font-sans text-[var(--ink-2)] font-bold">
                        <span>250 pegatinas gratis</span>
                      </div>

                      <ul className="space-y-2 mb-5 flex-1 text-xs">
                        {[
                          { text: "50 salas de conciertos", cat: "booking" },
                          { text: "20 medios y radios", cat: "booking" },
                          { text: "100 fans con QR", cat: "media" },
                          { text: "Reels & Social Center", cat: "media" },
                        ].map((f, i) => {
                          const isHighlighted =
                            newBandFeatureCategory === "all" ||
                            newBandFeatureCategory === f.cat;
                          return (
                            <li
                              key={i}
                              className={`flex items-start gap-2 transition-opacity duration-200 ${isHighlighted ? "text-[var(--ink-2)] opacity-100" : "text-[var(--ink-2)] opacity-40"}`}
                            >
                              <Check
                                className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isHighlighted ? "text-[var(--ink-2)]" : "text-[var(--ink-2)]"}`}
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
                        onClick={() => handleSelectPlanForCreation("local")}
                        disabled={isCreatingBand}
                        className="w-full py-2.5 rounded-[var(--r-l)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink)] font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isCreatingBand && creatingPlanKey === "local" ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[var(--ink)]" />
                            <span>Configurando…</span>
                          </>
                        ) : (
                          <span>Elegir local</span>
                        )}
                      </button>
                    </div>
    </>
  );
}
