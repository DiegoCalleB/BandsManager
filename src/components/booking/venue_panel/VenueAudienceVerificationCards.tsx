/**
 * Audiencia en Spotify, Google Places, Setlist.fm y verificación de email.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/exhaustive-deps
*/
import { Headphones, MapPin, Star, Disc, ShieldCheck } from "lucide-react";
import { ShowIcon } from "../../ui/ShowIcon";
import { LinkButton } from "../../ui";
import { VenueRouteSocialCards } from "./VenueRouteSocialCards";
import { VenueCalendarEventsCards } from "./VenueCalendarEventsCards";
import { VenueCoBookingMediaCards } from "./VenueCoBookingMediaCards";
import { Lead } from "../../../types";
import React, { Dispatch, SetStateAction } from "react";

/** Estado y callbacks que el contenedor inyecta a la sección. */
export interface VenueAudienceVerificationCardsProps {
  selectedLead: Lead;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  setEditedPitch: Dispatch<SetStateAction<string>>;
  setScoutActionFeedback: Dispatch<SetStateAction<string>>;
  routeOrigin: string;
  setRouteOrigin: Dispatch<SetStateAction<string>>;
  handleCalculateRoute: () => Promise<void>;
  isCalculatingRoute: boolean;
  handleFetchSocial: () => Promise<void>;
  isEnrichingSocial: boolean;
  handleFetchBookingWindow: () => Promise<void>;
  isEnrichingBookingWindow: boolean;
  handleFetchLocalEvents: () => Promise<void>;
  isEnrichingLocalEvents: boolean;
  handleFetchPressMedia: () => Promise<void>;
  isEnrichingPressMedia: boolean;
  handleFetchCoBooking: () => Promise<void>;
  isEnrichingCoBooking: boolean;
}

/**
 * Audiencia en Spotify, Google Places, Setlist.fm y verificación de email.
 * @param props Estado y callbacks del contenedor ({@link VenueAudienceVerificationCardsProps}).
 * @returns Sección de interfaz.
 */
export function VenueAudienceVerificationCards({ selectedLead, onUpdateLead, setEditedPitch, setScoutActionFeedback, routeOrigin, setRouteOrigin, handleCalculateRoute, isCalculatingRoute, handleFetchSocial, isEnrichingSocial, handleFetchBookingWindow, isEnrichingBookingWindow, handleFetchLocalEvents, isEnrichingLocalEvents, handleFetchPressMedia, isEnrichingPressMedia, handleFetchCoBooking, isEnrichingCoBooking }: VenueAudienceVerificationCardsProps) {
  return (
    <>
<div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* 1. SPOTIFY AUDIENCE & CITY DEMAND */}
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3 relative overflow-hidden bg-[var(--ok)]/10">
              <div className="flex items-center justify-between border-b border-[var(--hair)]/80 pb-2">
                <div className="flex items-center gap-2 text-[var(--ok)] font-bold text-xs">
                  <Headphones className="w-4 h-4" />
                  <span>Spotify city demand</span>
                </div>
                <span className="text-micro font-mono px-2 py-0.5 rounded bg-[var(--ok)] text-[var(--on-ok)]">
                  {selectedLead.ciudad || "Madrid"}
                </span>
              </div>

              {selectedLead.spotify_city_demand ? (
                <div className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--surface)] ">
                      <span className="text-micro text-[var(--ink-2)] block font-medium">
                        Oyentes en la ciudad
                      </span>
                      <span className="text-base font-bold text-[var(--ok)] font-mono">
                        {selectedLead.spotify_city_demand.oyentes_ciudad.toLocaleString()}
                      </span>
                      <span className="text-micro text-[var(--ink-2)] block">
                        Top #
                        {selectedLead.spotify_city_demand.top_ciudades_ranking}{" "}
                        audiencia
                      </span>
                    </div>

                    <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--surface)] ">
                      <span className="text-micro text-[var(--ink-2)] block font-medium">
                        Afinidad de género
                      </span>
                      <span className="text-base font-bold text-[var(--ok)] font-mono">
                        {selectedLead.spotify_city_demand.afinidad_genero}%
                      </span>
                      <span className="text-micro text-[var(--ink-2)] block">
                        Match con público local
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[var(--ink-2)]">
                        Demanda Estimada de Entradas:
                      </span>
                      <span className="font-bold text-[var(--ink-2)] font-mono">
                        {selectedLead.spotify_city_demand.prediccion_entradas}{" "}
                        pax / {selectedLead.aforo || 300} aforo
                      </span>
                    </div>
                    <div className="w-full bg-[var(--sunken)] h-2 rounded-[var(--r-pill)] overflow-hidden">
                      <div
                        className="bg-[var(--ok)] h-full rounded-[var(--r-pill)] transition-ui"
                        style={{
                          width: `${Math.min(100, selectedLead.spotify_city_demand.porcentaje_ocupacion_estimado)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-micro text-[var(--ink-2)]">
                      <span>Ocupación calculada:</span>
                      <span className="font-bold text-[var(--ok)]">
                        {
                          selectedLead.spotify_city_demand
                            .porcentaje_ocupacion_estimado
                        }
                        % de aforo
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-[var(--ink-2)] text-xs italic">
                  Pulsa “Actualizar Todas las APIs” para calcular la demanda de
                  Spotify en {selectedLead.ciudad || "Madrid"}.
                </div>
              )}
            </div>

            {/* 2. GOOGLE PLACES & FICHA TÉCNICA */}
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3 relative bg-[var(--acc)]/10">
              <div className="flex items-center justify-between border-b border-[var(--hair)]/80 pb-2">
                <div className="flex items-center gap-2 text-[var(--acc)] font-bold text-xs">
                  <MapPin className="w-4 h-4" />
                  <span>Google Places y escenario</span>
                </div>
                {selectedLead.google_places_info?.rating && (
                  <span className="text-micro font-mono px-2 py-0.5 rounded bg-[var(--acc)] text-[var(--on-acc)] flex items-center gap-1 font-bold">
                    <Star className="w-3 h-3 fill-amber-400 text-[var(--acc)]" />
                    {selectedLead.google_places_info.rating} (
                    {selectedLead.google_places_info.total_reviews})
                  </span>
                )}
              </div>

              {selectedLead.google_places_info ? (
                <div className="space-y-2 text-xs">
                  {selectedLead.google_places_info.fotos &&
                    selectedLead.google_places_info.fotos.length > 0 && (
                      <div className="grid grid-cols-2 gap-1.5 rounded-[var(--r-m)] overflow-hidden ">
                        {selectedLead.google_places_info.fotos
                          .slice(0, 2)
                          .map((url, i) => (
                            <div
                              key={i}
                              className="h-20 bg-[var(--surface)] relative group overflow-hidden"
                            >
                              <img
                                src={url}
                                alt={`${selectedLead.nombre_sala} foto ${i + 1}`}
                                className="w-full h-full object-cover transition-transform duration-300"
                                referrerPolicy="no-referrer"
                                onError={(e: any) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            </div>
                          ))}
                      </div>
                    )}

                  <div className="space-y-1.5 text-xs bg-[var(--surface)] p-2.5 rounded-[var(--r-m)] ">
                    <div className="flex items-start gap-1.5">
                      <span className="text-[var(--ink-2)] font-bold shrink-0">
                        <ShowIcon inline emoji="🔊" />Acústica:
                      </span>
                      <span className="text-[var(--ink-2)] leading-tight">
                        {selectedLead.google_places_info.resumen_acustica ||
                          "Sala con equipo de PA profesional instalado."}
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-[var(--ink-2)] font-bold shrink-0">
                        <ShowIcon inline emoji="🚛" />Carga / Backline:
                      </span>
                      <span className="text-[var(--ink-2)] leading-tight">
                        {selectedLead.google_places_info.acceso_backline ||
                          "Acceso por calle peatonal / vado autorizado."}
                      </span>
                    </div>
                    {selectedLead.google_places_info.horario_carga && (
                      <div className="flex items-start gap-1.5">
                        <span className="text-[var(--ink-2)] font-bold shrink-0">
                          <ShowIcon inline emoji="⏰" />Horario prueba:
                        </span>
                        <span className="text-[var(--ink-2)] leading-tight">
                          {selectedLead.google_places_info.horario_carga}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-[var(--ink-2)] text-xs italic">
                  Pulsa “Actualizar Todas las APIs” para cargar la ficha técnica
                  de Google Places.
                </div>
              )}
            </div>

            {/* 3. SETLIST.FM & HISTORIAL DE CONCIERTOS */}
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3 bg-[var(--acc)]/10">
              <div className="flex items-center justify-between border-b border-[var(--hair)]/80 pb-2">
                <div className="flex items-center gap-2 text-[var(--acc)] font-bold text-xs">
                  <Disc className="w-4 h-4" />
                  <span>Setlist.fm y Cartelera Reciente</span>
                </div>
                <span className="text-micro font-mono px-2 py-0.5 rounded bg-[var(--acc)] text-[var(--on-acc)]">
                  Histórico bolos
                </span>
              </div>

              {selectedLead.setlist_history ? (
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1.5">
                    <span className="text-micro text-[var(--ink-2)] font-bold block">
                      Bandas Similares que han tocado:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedLead.setlist_history.bandas_similares_recientes.map(
                        (banda, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-[var(--r-s)] bg-[var(--acc)]/15 text-[var(--ink)] text-xs font-medium"
                          >
                            <ShowIcon inline emoji="🎸" />{banda}
                          </span>
                        ),
                      )}
                    </div>
                  </div>

                  {selectedLead.setlist_history.referencia_pitch_sugerida && (
                    <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/30 space-y-1.5">
                      <span className="text-micro text-[var(--acc)] font-bold flex items-center gap-1">
                        Gancho Recomendado para el Pitch:
                      </span>
                      <p className="text-xs text-[var(--ink-2)] italic leading-snug">
                        "
                        {selectedLead.setlist_history.referencia_pitch_sugerida}
                        "
                      </p>
                      <LinkButton
                        size="xs"
                        type="button"
                        onClick={() => {
                          const hook =
                            selectedLead.setlist_history
                              ?.referencia_pitch_sugerida;
                          if (hook && selectedLead.pitch_generado) {
                            const newPitch = `${selectedLead.pitch_generado}\n\nPD: ${hook}`;
                            onUpdateLead(selectedLead.id, {
                              pitch_generado: newPitch,
                            });
                            setEditedPitch(newPitch);
                            setScoutActionFeedback(
                              "✓ Gancho de Setlist.fm insertado en el borrador del pitch.",
                            );
                            setTimeout(
                              () => setScoutActionFeedback(null),
                              4000,
                            );
                          }
                        }}
                      >
                        + Añadir este gancho al final del Pitch
                      </LinkButton>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center text-[var(--ink-2)] text-xs italic">
                  Sin histórico de Setlist.fm cargado aún.
                </div>
              )}
            </div>

            {/* 4. VERIFICACIÓN EMAIL & SERVIDORES MX */}
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3 bg-[var(--acc)]/10">
              <div className="flex items-center justify-between border-b border-[var(--hair)]/80 pb-2">
                <div className="flex items-center gap-2 text-[var(--acc)] font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verificación de email y DNS MX</span>
                </div>
                {selectedLead.email_verification?.entregabilidad_score !==
                  undefined && (
                  <span
                    className={`text-micro font-mono px-2 py-0.5 rounded font-bold ${
                      selectedLead.email_verification.entregabilidad_score >= 80
                        ? "bg-[var(--ok)] text-[var(--on-ok)]"
                        : selectedLead.email_verification
                              .entregabilidad_score >= 50
                          ? "bg-[var(--ink)] text-[var(--bg)]"
                          : "bg-[var(--alert)] text-[var(--on-alert)]"
                    }`}
                  >
                    <ShowIcon inline emoji="🛡️" />{selectedLead.email_verification.entregabilidad_score}%
                    Entregable
                  </span>
                )}
              </div>

              {selectedLead.email_verification ? (
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--ink-2)]">
                        Estado del Buzón:
                      </span>
                      <span className="font-bold text-[var(--ink-2)] capitalize">
                        {selectedLead.email_verification.estado === "valido"
                          ? "Buzón Válido"
                          : selectedLead.email_verification.estado}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--ink-2)]">
                        Registros DNS MX:
                      </span>
                      <span className="font-bold text-[var(--ok)]">
                        {selectedLead.email_verification.mx_valido
                          ? "✓ Servidores de correo activos"
                          : "Sin registros MX"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--ink-2)]">
                        Tipo de Dirección:
                      </span>
                      <span className="font-bold text-[var(--ink-2)]">
                        {selectedLead.email_verification.es_cuenta_rol
                          ? "Buzón de Booking / Programación"
                          : "Cuenta Personal Directa"}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--ink)] bg-[var(--acc)]/20 p-2 rounded-[var(--r-m)] ">
                    <ShowIcon inline emoji="💡" />{selectedLead.email_verification.motivo}
                  </p>
                </div>
              ) : (
                <div className="py-4 text-center text-[var(--ink-2)] text-xs italic">
                  Pulsa “Actualizar Todas las APIs” para validar los registros
                  DNS y entregabilidad del email.
                </div>
              )}
            </div>

            <VenueRouteSocialCards routeOrigin={routeOrigin} setRouteOrigin={setRouteOrigin} handleCalculateRoute={handleCalculateRoute} isCalculatingRoute={isCalculatingRoute} selectedLead={selectedLead} handleFetchSocial={handleFetchSocial} isEnrichingSocial={isEnrichingSocial} />

            <VenueCalendarEventsCards selectedLead={selectedLead} handleFetchBookingWindow={handleFetchBookingWindow} isEnrichingBookingWindow={isEnrichingBookingWindow} handleFetchLocalEvents={handleFetchLocalEvents} isEnrichingLocalEvents={isEnrichingLocalEvents} />

            <VenueCoBookingMediaCards selectedLead={selectedLead} setScoutActionFeedback={setScoutActionFeedback} handleFetchPressMedia={handleFetchPressMedia} isEnrichingPressMedia={isEnrichingPressMedia} onUpdateLead={onUpdateLead} setEditedPitch={setEditedPitch} handleFetchCoBooking={handleFetchCoBooking} isEnrichingCoBooking={isEnrichingCoBooking} />
          </div>
    </>
  );
}
