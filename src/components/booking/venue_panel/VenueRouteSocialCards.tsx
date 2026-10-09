/**
 * Rutas de gira y radar de redes sociales del lead.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/exhaustive-deps
*/
import { Truck, Navigation, RefreshCw, Instagram, CheckCircle2 } from "lucide-react";
import { Button } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import React, { Dispatch, SetStateAction } from "react";
import { Lead } from "../../../types";

/** Estado y callbacks que el contenedor inyecta a la sección. */
export interface VenueRouteSocialCardsProps {
  routeOrigin: string;
  setRouteOrigin: Dispatch<SetStateAction<string>>;
  handleCalculateRoute: () => Promise<void>;
  isCalculatingRoute: boolean;
  selectedLead: Lead;
  handleFetchSocial: () => Promise<void>;
  isEnrichingSocial: boolean;
}

/**
 * Rutas de gira y radar de redes sociales del lead.
 * @param props Estado y callbacks del contenedor ({@link VenueRouteSocialCardsProps}).
 * @returns Sección de interfaz.
 */
export function VenueRouteSocialCards({ routeOrigin, setRouteOrigin, handleCalculateRoute, isCalculatingRoute, selectedLead, handleFetchSocial, isEnrichingSocial }: VenueRouteSocialCardsProps) {
  return (
    <>
{/* 5. HERRAMIENTA 1: RUTAS DE GIRA, GASOLINA & FURGONETA */}
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3 bg-[var(--acc)]/10">
              <div className="flex items-center justify-between border-b border-[var(--hair)]/80 pb-2">
                <div className="flex items-center gap-2 text-[var(--acc)] font-bold text-xs">
                  <Truck className="w-4 h-4" />
                  <span>Ruta de Gira, gasolina y furgoneta</span>
                </div>
                <span className="text-micro font-mono px-2 py-0.5 rounded bg-[var(--acc)] text-[var(--on-acc)] font-bold">
                  Van Logistics
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-1.5 bg-[var(--surface)] px-2.5 py-1.5 rounded-[var(--r-m)] text-xs">
                  <Navigation className="w-3.5 h-3.5 text-[var(--ink-2)] shrink-0" />
                  <span className="text-[var(--ink-2)] text-xs">
                    Origen:
                  </span>
                  <input data-raw
                    type="text"
                    value={routeOrigin}
                    onChange={(e) => setRouteOrigin(e.target.value)}
                    placeholder="Ciudad base (ej: Madrid)"
                    className="bg-transparent border-none text-[var(--ink-2)] font-bold focus:outline-none w-full text-xs"
                  />
                </div>
                <Button
                  variant="primary"
                  size="xs"
                  type="button"
                  onClick={handleCalculateRoute}
                  disabled={isCalculatingRoute}
                  className="items-center gap-1"
                  title="Recalcular ruta y gasolina"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${isCalculatingRoute ? "animate-spin" : ""}`}
                  />
                  <span>Calcular</span>
                </Button>
              </div>

              {selectedLead.tour_logistics ? (
                <div className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] ">
                      <span className="text-micro text-[var(--ink-2)] block">
                        Distancia
                      </span>
                      <span className="text-sm font-bold text-[var(--acc)] font-mono">
                        {selectedLead.tour_logistics.distancia_km} km
                      </span>
                      <span className="text-micro text-[var(--ink-2)] block">
                        {selectedLead.tour_logistics.tiempo_conduccion}
                      </span>
                    </div>

                    <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] ">
                      <span className="text-micro text-[var(--ink-2)] block">
                        Gasolina (Ida)
                      </span>
                      <span className="text-sm font-bold text-[var(--acc)] font-mono">
                        {selectedLead.tour_logistics.coste_gasolina_estimado} €
                      </span>
                      <span className="text-micro text-[var(--ink-2)] block">
                        9L/100km Diésel
                      </span>
                    </div>

                    <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] ">
                      <span className="text-micro text-[var(--ink-2)] block">
                        Total Viaje I/V
                      </span>
                      <span className="text-sm font-bold text-[var(--ok)] font-mono">
                        {selectedLead.tour_logistics.coste_total_viaje} €
                      </span>
                      <span className="text-micro text-[var(--ink-2)] block">
                        +{selectedLead.tour_logistics.peajes_estimados}€ peajes
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--ink)] bg-[var(--acc)]/20 p-2.5 rounded-[var(--r-m)] leading-snug">
                    <ShowIcon inline emoji="🚐" />{" "}
                    <span className="font-semibold text-[var(--acc)]">
                      Road Manager:
                    </span>{" "}
                    {selectedLead.tour_logistics.recomendacion_logistica}
                  </p>
                </div>
              ) : (
                <div className="py-3 text-center text-[var(--ink-2)] text-xs italic">
                  Introduce tu ciudad base y pulsa “Calcular” para obtener
                  kilometraje y combustible.
                </div>
              )}
            </div>

            {/* 6. HERRAMIENTA 2: RADAR DE REDES SOCIALES (INSTAGRAM & TIKTOK) */}
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3 bg-[var(--alert)]/10">
              <div className="flex items-center justify-between border-b border-[var(--hair)]/80 pb-2">
                <div className="flex items-center gap-2 text-[var(--acc)] font-bold text-xs">
                  <Instagram className="w-4 h-4" />
                  <span>Radar redes sala (Instagram y TikTok)</span>
                </div>
                {selectedLead.social_engagement?.calidad_promo_sala && (
                  <span
                    className={`text-micro font-mono px-2 py-0.5 rounded font-bold ${
                      selectedLead.social_engagement.calidad_promo_sala ===
                      "alta"
                        ? "bg-[var(--ok)] text-[var(--on-ok)]"
                        : selectedLead.social_engagement.calidad_promo_sala ===
                            "media"
                          ? "bg-[var(--ink)] text-[var(--bg)]"
                          : "bg-[var(--alert)] text-[var(--on-alert)]"
                    }`}
                  >
                    Promo:{" "}
                    {selectedLead.social_engagement.calidad_promo_sala.toUpperCase()}
                  </span>
                )}
              </div>

              {selectedLead.social_engagement ? (
                <div className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] ">
                      <span className="text-micro text-[var(--ink-2)] block">
                        Seguidores
                      </span>
                      <span className="text-sm font-bold text-[var(--acc)] font-mono">
                        {selectedLead.social_engagement.instagram_followers.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] ">
                      <span className="text-micro text-[var(--ink-2)] block">
                        Engagement
                      </span>
                      <span className="text-sm font-bold text-[var(--acc)] font-mono">
                        {selectedLead.social_engagement.engagement_rate}%
                      </span>
                    </div>

                    <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] ">
                      <span className="text-micro text-[var(--ink-2)] block">
                        Media Reels
                      </span>
                      <span className="text-sm font-bold text-[var(--acc)] font-mono">
                        {selectedLead.social_engagement.promedio_views_reels.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] flex items-center justify-between text-xs">
                    <span className="text-[var(--ink-2)]">
                      ¿Comparte a las bandas en Stories/Feed?
                    </span>
                    <span className="font-bold text-[var(--ink-2)] flex items-center gap-1">
                      {selectedLead.social_engagement
                        .promociona_bandas_activo ? (
                        <span className="text-[var(--ok)] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Sí, sala
                          activa
                        </span>
                      ) : (
                        <span className="text-[var(--ink-2)]">
                          Pasivo / Solo cartel mensual
                        </span>
                      )}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--ink)] bg-[var(--acc)]/20 p-2.5 rounded-[var(--r-m)] leading-snug">
                    <ShowIcon inline emoji="📢" />{selectedLead.social_engagement.resumen_social}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 space-y-2">
                  <p className="text-[var(--ink-2)] text-xs italic">
                    Sin datos de radar en redes aún.
                  </p>
                  <Button
                    variant="primary"
                    size="xs"
                    type="button"
                    onClick={handleFetchSocial}
                    disabled={isEnrichingSocial}
                    className="items-center gap-1.5"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isEnrichingSocial ? "animate-spin" : ""}`}
                    />
                    <span>
                      {isEnrichingSocial
                        ? "Escaneando..."
                        : "Escanear Redes de la Sala"}
                    </span>
                  </Button>
                </div>
              )}
            </div>
    </>
  );
}
