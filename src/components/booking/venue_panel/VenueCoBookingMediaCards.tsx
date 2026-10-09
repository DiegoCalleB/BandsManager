/**
 * Radares de medios locales y de bandas afines (co-booking).
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/exhaustive-deps
*/
import { Megaphone, RefreshCw, Handshake } from "lucide-react";
import { LinkButton, Button } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { Lead } from "../../../types";
import React, { Dispatch, SetStateAction } from "react";

/** Estado y callbacks que el contenedor inyecta a la sección. */
export interface VenueCoBookingMediaCardsProps {
  selectedLead: Lead;
  setScoutActionFeedback: Dispatch<SetStateAction<string>>;
  handleFetchPressMedia: () => Promise<void>;
  isEnrichingPressMedia: boolean;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  setEditedPitch: Dispatch<SetStateAction<string>>;
  handleFetchCoBooking: () => Promise<void>;
  isEnrichingCoBooking: boolean;
}

/**
 * Radares de medios locales y de bandas afines (co-booking).
 * @param props Estado y callbacks del contenedor ({@link VenueCoBookingMediaCardsProps}).
 * @returns Sección de interfaz.
 */
export function VenueCoBookingMediaCards({ selectedLead, setScoutActionFeedback, handleFetchPressMedia, isEnrichingPressMedia, onUpdateLead, setEditedPitch, handleFetchCoBooking, isEnrichingCoBooking }: VenueCoBookingMediaCardsProps) {
  return (
    <>
{/* 10. HERRAMIENTA 4: RADAR DE MEDIOS, RADIOS & PRENSA CULTURAL LOCAL */}
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3 bg-[var(--acc)]/10">
              <div className="flex items-center justify-between border-b border-[var(--hair)]/80 pb-2">
                <div className="flex items-center gap-2 text-[var(--acc)] font-bold text-xs">
                  <Megaphone className="w-4 h-4" />
                  <span>Medios, radios y prensa cultural local</span>
                </div>
                <span className="text-micro font-mono px-2 py-0.5 rounded bg-[var(--acc)] text-[var(--on-acc)] font-bold">
                  {selectedLead.ciudad || "Provincial"}
                </span>
              </div>

              {selectedLead.local_press_media_info ? (
                <div className="space-y-2.5 text-xs">
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedLead.local_press_media_info.medios?.map((m, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] flex items-center justify-between text-xs"
                      >
                        <div>
                          <strong className="text-[var(--acc)] block">
                            {m.nombre}
                          </strong>
                          <span className="text-micro text-[var(--ink-2)]">
                            {m.tipo.replace("_", " ")} • {m.alcance}
                          </span>
                        </div>
                        <span className="text-micro font-mono text-[var(--ink-2)] bg-[var(--sunken)] px-2 py-0.5 rounded ">
                          {m.contacto_sugerido || m.canal}
                        </span>
                      </div>
                    ))}
                  </div>

                  {selectedLead.local_press_media_info
                    .plantilla_nota_prensa_hook && (
                    <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/30 space-y-1.5">
                      <span className="text-micro text-[var(--acc)] font-bold flex items-center gap-1">
                        Gancho Titular para Medios / Radio:
                      </span>
                      <p className="text-xs text-[var(--ink-2)] italic leading-snug">
                        "
                        {
                          selectedLead.local_press_media_info
                            .plantilla_nota_prensa_hook
                        }
                        "
                      </p>
                      <LinkButton
                        size="xs"
                        type="button"
                        onClick={() => {
                          const hook =
                            selectedLead.local_press_media_info
                              ?.plantilla_nota_prensa_hook;
                          if (hook) {
                            navigator.clipboard.writeText(hook);
                            setScoutActionFeedback(
                              "✓ Titular de nota de prensa copiado al portapapeles.",
                            );
                            setTimeout(
                              () => setScoutActionFeedback(null),
                              3500,
                            );
                          }
                        }}
                      >
                        <ShowIcon inline emoji="📋" />Copiar titular de prensa
                      </LinkButton>
                    </div>
                  )}

                  {selectedLead.local_press_media_info.resumen_cobertura && (
                    <p className="text-micro text-[var(--ink-2)] bg-[var(--surface)] p-2 rounded-[var(--r-m)] ">
                      <ShowIcon inline emoji="📢" />{selectedLead.local_press_media_info.resumen_cobertura}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 space-y-2">
                  <p className="text-[var(--ink-2)] text-xs italic">
                    Sin medios locales detectados aún.
                  </p>
                  <Button
                    variant="primary"
                    size="xs"
                    type="button"
                    onClick={handleFetchPressMedia}
                    disabled={isEnrichingPressMedia}
                    className="items-center gap-1.5"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isEnrichingPressMedia ? "animate-spin" : ""}`}
                    />
                    <span>
                      {isEnrichingPressMedia
                        ? "Buscando..."
                        : "Buscar Medios y Radios"}
                    </span>
                  </Button>
                </div>
              )}
            </div>

            {/* 11. HERRAMIENTA 5: RADAR DE BANDAS LOCALES AFINES (CO-BOOKING) */}
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3 bg-[var(--acc)]/10">
              <div className="flex items-center justify-between border-b border-[var(--hair)]/80 pb-2">
                <div className="flex items-center gap-2 text-[var(--acc)] font-bold text-xs">
                  <Handshake className="w-4 h-4" />
                  <span>Bandas locales hermanadas (co-Booking)</span>
                </div>
                <span className="text-micro font-mono px-2 py-0.5 rounded bg-[var(--acc)] text-[var(--on-acc)] font-bold">
                  Taquilla Compartida
                </span>
              </div>

              {selectedLead.local_band_partners_info ? (
                <div className="space-y-2.5 text-xs">
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedLead.local_band_partners_info.bandas_compatibles?.map(
                      (b, i) => (
                        <div
                          key={i}
                          className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <strong className="text-[var(--acc)]">
                              <ShowIcon inline emoji="🎸" />{b.nombre}
                            </strong>
                            {b.oyentes_estimados !== undefined && (
                              <span className="text-micro font-mono text-[var(--ink-2)]">
                                {b.oyentes_estimados.toLocaleString()} oyentes
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-micro text-[var(--ink-2)]">
                            <span>
                              {b.genero} {b.instagram ? `• ${b.instagram}` : ""}
                            </span>
                            <span className="text-[var(--acc)] font-medium text-micro">
                              {b.motivo_afinidad}
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  {selectedLead.local_band_partners_info
                    .gancho_propuesta_sala && (
                    <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/30 space-y-1.5">
                      <span className="text-micro text-[var(--acc)] font-bold flex items-center gap-1">
                        Propuesta Co-Booking para el Programador:
                      </span>
                      <p className="text-xs text-[var(--ink-2)] italic leading-snug">
                        "
                        {
                          selectedLead.local_band_partners_info
                            .gancho_propuesta_sala
                        }
                        "
                      </p>
                      <LinkButton
                        size="xs"
                        type="button"
                        onClick={() => {
                          const cobooking =
                            selectedLead.local_band_partners_info
                              ?.gancho_propuesta_sala;
                          if (cobooking && selectedLead.pitch_generado) {
                            const newPitch = `${selectedLead.pitch_generado}\n\nPD: ${cobooking}`;
                            onUpdateLead(selectedLead.id, {
                              pitch_generado: newPitch,
                            });
                            setEditedPitch(newPitch);
                            setScoutActionFeedback(
                              "✓ Propuesta de co-booking añadida al pitch.",
                            );
                            setTimeout(
                              () => setScoutActionFeedback(null),
                              4000,
                            );
                          }
                        }}
                      >
                        + Añadir propuesta de co-booking al Pitch
                      </LinkButton>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 space-y-2">
                  <p className="text-[var(--ink-2)] text-xs italic">
                    Sin bandas locales para co-booking cargadas.
                  </p>
                  <Button
                    variant="primary"
                    size="xs"
                    type="button"
                    onClick={handleFetchCoBooking}
                    disabled={isEnrichingCoBooking}
                    className="items-center gap-1.5"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isEnrichingCoBooking ? "animate-spin" : ""}`}
                    />
                    <span>
                      {isEnrichingCoBooking
                        ? "Buscando..."
                        : "Buscar Bandas para Co-Booking"}
                    </span>
                  </Button>
                </div>
              )}
            </div>
    </>
  );
}
