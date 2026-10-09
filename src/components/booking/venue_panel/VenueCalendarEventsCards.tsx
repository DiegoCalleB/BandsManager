/**
 * Radares de ventana de programación y eventos locales.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/exhaustive-deps
*/
import { CalendarDays, RefreshCw, Flame } from "lucide-react";
import { ShowIcon } from "../../ui/ShowIcon";
import { Button } from "../../ui";
import { Lead } from "../../../types";
import React from "react";

/** Estado y callbacks que el contenedor inyecta a la sección. */
export interface VenueCalendarEventsCardsProps {
  selectedLead: Lead;
  handleFetchBookingWindow: () => Promise<void>;
  isEnrichingBookingWindow: boolean;
  handleFetchLocalEvents: () => Promise<void>;
  isEnrichingLocalEvents: boolean;
}

/**
 * Radares de ventana de programación y eventos locales.
 * @param props Estado y callbacks del contenedor ({@link VenueCalendarEventsCardsProps}).
 * @returns Sección de interfaz.
 */
export function VenueCalendarEventsCards({ selectedLead, handleFetchBookingWindow, isEnrichingBookingWindow, handleFetchLocalEvents, isEnrichingLocalEvents }: VenueCalendarEventsCardsProps) {
  return (
    <>
{/* 8. HERRAMIENTA 1: RADAR DE CALENDARIO & VENTANA DE PROGRAMACIÓN (BOOKING WINDOW) */}
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3 bg-[var(--acc)]/10">
              <div className="flex items-center justify-between border-b border-[var(--hair)]/80 pb-2">
                <div className="flex items-center gap-2 text-[var(--acc)] font-bold text-xs">
                  <CalendarDays className="w-4 h-4" />
                  <span>Ventana de programación y lead time</span>
                </div>
                {selectedLead.booking_window_info
                  ?.estado_calendario_estimado && (
                  <span
                    className={`text-micro font-mono px-2 py-0.5 rounded font-bold ${
                      selectedLead.booking_window_info
                        .estado_calendario_estimado === "abierto"
                        ? "bg-[var(--ok)] text-[var(--on-ok)]"
                        : selectedLead.booking_window_info
                              .estado_calendario_estimado === "llenandose"
                          ? "bg-[var(--ink)] text-[var(--bg)]"
                          : "bg-[var(--alert)] text-[var(--on-alert)]"
                    }`}
                  >
                    Estado:{" "}
                    {selectedLead.booking_window_info.estado_calendario_estimado
                      .replace("_", " ")
                      .toUpperCase()}
                  </span>
                )}
              </div>

              {selectedLead.booking_window_info ? (
                <div className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] ">
                      <span className="text-micro text-[var(--ink-2)] block">
                        Antelación ideal
                      </span>
                      <span className="text-sm font-bold text-[var(--acc)] font-mono">
                        {
                          selectedLead.booking_window_info
                            .antelacion_meses_recomendada
                        }{" "}
                        meses
                      </span>
                    </div>

                    <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] ">
                      <span className="text-micro text-[var(--ink-2)] block">
                        Días Fuertes
                      </span>
                      <span className="text-xs font-bold text-[var(--ink-2)]">
                        {selectedLead.booking_window_info.dias_semana_ideales?.join(
                          ", ",
                        ) || "Viernes, Sábado"}
                      </span>
                    </div>

                    <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] ">
                      <span className="text-micro text-[var(--ink-2)] block">
                        Cierre / Vacaciones
                      </span>
                      <span className="text-xs font-bold text-[var(--alert)]">
                        {selectedLead.booking_window_info.meses_cierre_temporada?.join(
                          ", ",
                        ) || "Ninguno"}
                      </span>
                    </div>
                  </div>

                  {selectedLead.booking_window_info.consejo_antelacion && (
                    <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/20 space-y-1.5">
                      <p className="text-xs text-[var(--ink-2)] leading-snug">
                        <ShowIcon inline emoji="💡" />{" "}
                        <strong className="text-[var(--acc)]">
                          Consejo Táctico:
                        </strong>{" "}
                        {selectedLead.booking_window_info.consejo_antelacion}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 space-y-2">
                  <p className="text-[var(--ink-2)] text-xs italic">
                    Sin análisis de ventana de programación aún.
                  </p>
                  <Button
                    variant="primary"
                    size="xs"
                    type="button"
                    onClick={handleFetchBookingWindow}
                    disabled={isEnrichingBookingWindow}
                    className="items-center gap-1.5"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isEnrichingBookingWindow ? "animate-spin" : ""}`}
                    />
                    <span>
                      {isEnrichingBookingWindow
                        ? "Calculando..."
                        : "Calcular Lead Time y Ventana"}
                    </span>
                  </Button>
                </div>
              )}
            </div>

            {/* 9. HERRAMIENTA 2: RADAR DE EVENTOS LOCALES & ALERTA DE CLASH */}
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3 bg-[var(--alert)]/10">
              <div className="flex items-center justify-between border-b border-[var(--hair)]/80 pb-2">
                <div className="flex items-center gap-2 text-[var(--alert)] font-bold text-xs">
                  <Flame className="w-4 h-4" />
                  <span>Radar eventos locales y alerta clash</span>
                </div>
                {selectedLead.local_events_clash_info?.eventos_detectados && (
                  <span
                    className={`text-micro font-mono px-2 py-0.5 rounded font-bold ${
                      selectedLead.local_events_clash_info.eventos_detectados.some(
                        (e) => e.nivel_riesgo_solapamiento === "alto",
                      )
                        ? "bg-[var(--alert)] text-[var(--on-alert)]"
                        : selectedLead.local_events_clash_info.eventos_detectados.some(
                              (e) => e.nivel_riesgo_solapamiento === "medio",
                            )
                          ? "bg-[var(--ink)] text-[var(--bg)]"
                          : "bg-[var(--ok)] text-[var(--on-ok)]"
                    }`}
                  >
                    Riesgo Clash:{" "}
                    {selectedLead.local_events_clash_info.eventos_detectados.some(
                      (e) => e.nivel_riesgo_solapamiento === "alto",
                    )
                      ? "ALTO"
                      : selectedLead.local_events_clash_info.eventos_detectados.some(
                            (e) => e.nivel_riesgo_solapamiento === "medio",
                          )
                        ? "MEDIO"
                        : "BAJO"}
                  </span>
                )}
              </div>

              {selectedLead.local_events_clash_info ? (
                <div className="space-y-2.5 text-xs">
                  {selectedLead.local_events_clash_info
                    .fechas_favorables_sugeridas?.length > 0 && (
                    <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1.5">
                      <span className="text-micro text-[var(--ink-2)] font-bold block">
                        Ventanas Recomendadas en{" "}
                        {selectedLead.ciudad || "la ciudad"}:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedLead.local_events_clash_info.fechas_favorables_sugeridas.map(
                          (v, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-[var(--r-s)] bg-[var(--ok)]/15 text-[var(--ink)] text-xs font-medium"
                            >
                              ✓ {v}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {selectedLead.local_events_clash_info.eventos_detectados
                    ?.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-micro text-[var(--ink-2)] font-bold block">
                        Eventos masivos detectados en la zona:
                      </span>
                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {selectedLead.local_events_clash_info.eventos_detectados.map(
                          (ev, i) => (
                            <div
                              key={i}
                              className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] flex items-center justify-between text-xs"
                            >
                              <div>
                                <strong className="text-[var(--ink-2)] block">
                                  {ev.nombre}
                                </strong>
                                <span className="text-micro text-[var(--ink-2)] font-mono">
                                  <ShowIcon inline emoji="📅" />{ev.fecha_aproximada} • {ev.tipo}
                                </span>
                              </div>
                              <span
                                className={`text-micro px-1.5 py-0.5 rounded font-bold shrink-0 ${
                                  ev.nivel_riesgo_solapamiento === "alto"
                                    ? "bg-[var(--alert)] text-[var(--on-alert)] "
                                    : ev.nivel_riesgo_solapamiento === "medio"
                                      ? "bg-[var(--ink)] text-[var(--bg)] "
                                      : "bg-[var(--ok)] text-[var(--on-ok)] "
                                }`}
                              >
                                Solape {ev.nivel_riesgo_solapamiento}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {selectedLead.local_events_clash_info.alerta_resumen && (
                    <p className="text-xs text-[var(--ink)] bg-[var(--alert)]/20 p-2.5 rounded-[var(--r-m)] leading-snug">
                      <ShowIcon inline emoji="⚠️" />{selectedLead.local_events_clash_info.alerta_resumen}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 space-y-2">
                  <p className="text-[var(--ink-2)] text-xs italic">
                    Sin escaneo de eventos locales aún.
                  </p>
                  <Button
                    variant="danger"
                    size="xs"
                    type="button"
                    onClick={handleFetchLocalEvents}
                    disabled={isEnrichingLocalEvents}
                    className="items-center gap-1.5"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isEnrichingLocalEvents ? "animate-spin" : ""}`}
                    />
                    <span>
                      {isEnrichingLocalEvents
                        ? "Escaneando..."
                        : "Escanear Eventos Locales"}
                    </span>
                  </Button>
                </div>
              )}
            </div>
    </>
  );
}
