/**
 * Pestaña de inteligencia de datos y APIs externas del lead.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/exhaustive-deps
*/
import { Sparkles, RefreshCw, Headphones, MapPin, Star, Disc, ShieldCheck, Truck, Navigation, Instagram, CheckCircle2, CalendarDays, Flame, Megaphone, Handshake, Calculator, Coins } from "lucide-react";
import { Button, LinkButton, Input } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { Lead } from "../../../types";
import React, { Dispatch, SetStateAction } from "react";

/** Estado y callbacks que el contenedor inyecta a la sección. */
export interface VenueIntelligenceSectionProps {
  activeTab: "info" | "emails" | "intelligence" | "copilot" | "bitacora";
  handleEnrichAllApis: () => Promise<void>;
  isEnrichingApis: boolean;
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
  handleRecalculateFinancial: (overrideData?: { precioAnticipada: number; precioTaquilla: number; alquilerSalaFijo: number; porcentajeSala: number; gastosProduccionFijos: number; numMusicos: number; }) => Promise<void>;
  isRecalculatingFinancial: boolean;
  simAnticipada: number;
  setSimAnticipada: Dispatch<SetStateAction<number>>;
  simTaquilla: number;
  setSimTaquilla: Dispatch<SetStateAction<number>>;
  simAlquiler: number;
  setSimAlquiler: Dispatch<SetStateAction<number>>;
  simPctSala: number;
  setSimPctSala: Dispatch<SetStateAction<number>>;
  simGastosProd: number;
  setSimGastosProd: Dispatch<SetStateAction<number>>;
  simNumMusicos: number;
  setSimNumMusicos: Dispatch<SetStateAction<number>>;
}

/**
 * Pestaña de inteligencia de datos y APIs externas del lead.
 * @param props Estado y callbacks del contenedor ({@link VenueIntelligenceSectionProps}).
 * @returns Sección de interfaz.
 */
export function VenueIntelligenceSection({ activeTab, handleEnrichAllApis, isEnrichingApis, selectedLead, onUpdateLead, setEditedPitch, setScoutActionFeedback, routeOrigin, setRouteOrigin, handleCalculateRoute, isCalculatingRoute, handleFetchSocial, isEnrichingSocial, handleFetchBookingWindow, isEnrichingBookingWindow, handleFetchLocalEvents, isEnrichingLocalEvents, handleFetchPressMedia, isEnrichingPressMedia, handleFetchCoBooking, isEnrichingCoBooking, handleRecalculateFinancial, isRecalculatingFinancial, simAnticipada, setSimAnticipada, simTaquilla, setSimTaquilla, simAlquiler, setSimAlquiler, simPctSala, setSimPctSala, simGastosProd, setSimGastosProd, simNumMusicos, setSimNumMusicos }: VenueIntelligenceSectionProps) {
  return (
    <>
{/* TAB 2.5: INTELIGENCIA DE DATOS & APIS EXTERNAS */}
      {activeTab === "intelligence" && (
        <div className="space-y-4 font-sans animate-fadeIn">
          {/* Top Bar with Refresh All APIs button */}
          <div className="p-3 bg-[var(--sunken)] rounded-[var(--r-m)] flex items-center justify-between flex-wrap gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[var(--r-m)] bg-[var(--acc)]/10 flex items-center justify-center text-[var(--ink)]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[var(--ink-2)] flex items-center gap-2">
                  <span>Inteligencia multi-Fuente conectada</span>
                  <span className="text-micro px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/20 text-[var(--ink)] font-mono font-bold ">
                    11 Herramientas activas
                  </span>
                </h4>
                <p className="text-micro text-[var(--ink-2)]">
                  Spotify • Google Places • Setlist.fm • DNS/MX • Rutas • Redes
                  • Break-Even • Booking Window • Clash/Eventos • Medios •
                  Co-Booking
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="xs"
              type="button"
              onClick={handleEnrichAllApis}
              disabled={isEnrichingApis}
              className="items-center gap-1.5"
              title="Volver a consultar todas las APIs en tiempo real"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isEnrichingApis ? "animate-spin" : ""}`}
              />
              <span>
                {isEnrichingApis
                  ? "Consultando APIs..."
                  : "Actualizar Todas las APIs"}
              </span>
            </Button>
          </div>

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
          </div>

          {/* 7. HERRAMIENTA 5: SIMULADOR INTERACTIVO DE TAQUILLA, CACHÉ & BREAK-EVEN (P&L FINANCIERO) */}
          <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3.5 bg-[var(--ok)]/10">
            <div className="flex items-center justify-between border-b border-[var(--hair)]/80 pb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2 text-[var(--ok)] font-bold text-xs">
                <Calculator className="w-4 h-4" />
                <span className="text-sm">
                  Simulador de Taquilla, Caché y Break-Even (P&L por Concierto)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="xs"
                  type="button"
                  onClick={() => handleRecalculateFinancial()}
                  disabled={isRecalculatingFinancial}
                  className="items-center gap-1.5"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isRecalculatingFinancial ? "animate-spin" : ""}`}
                  />
                  <span>Recalcular y guardar P&L</span>
                </Button>
              </div>
            </div>

            {/* Inputs de simulación */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
              <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1">
                <label className="text-micro text-[var(--ink-2)] block font-medium">
                  <ShowIcon inline emoji="🎟️" />Anticipada (€)
                </label>
                <Input size="sm" aria-label="Anticipada (€)"
                  type="number"
                  value={simAnticipada}
                  onChange={(e) => setSimAnticipada(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1">
                <label className="text-micro text-[var(--ink-2)] block font-medium">
                  <ShowIcon inline emoji="🚪" />Puerta (€)
                </label>
                <Input size="sm" aria-label="Puerta (€)"
                  type="number"
                  value={simTaquilla}
                  onChange={(e) => setSimTaquilla(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1">
                <label className="text-micro text-[var(--ink-2)] block font-medium">
                  <ShowIcon inline emoji="🏢" />Alquiler sala (€)
                </label>
                <Input size="sm" aria-label="Alquiler sala (€)"
                  type="number"
                  value={simAlquiler}
                  onChange={(e) => setSimAlquiler(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1">
                <label className="text-micro text-[var(--ink-2)] block font-medium">
                  % Sala / taquilla
                </label>
                <Input size="sm" aria-label="% Sala / taquilla"
                  type="number"
                  value={simPctSala}
                  onChange={(e) => setSimPctSala(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1">
                <label className="text-micro text-[var(--ink-2)] block font-medium">
                  <ShowIcon inline emoji="🚐" />Gastos Viaje/Prod (€)
                </label>
                <Input size="sm" aria-label="Gastos Viaje/Prod (€)"
                  type="number"
                  value={simGastosProd}
                  onChange={(e) => setSimGastosProd(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1">
                <label className="text-micro text-[var(--ink-2)] block font-medium">
                  <ShowIcon inline emoji="🎸" />Nº Músicos
                </label>
                <Input size="sm" aria-label="Nº Músicos"
                  type="number"
                  value={simNumMusicos}
                  onChange={(e) => setSimNumMusicos(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Resultados de rentabilidad */}
            {selectedLead.financial_break_even ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-[var(--r-m)] bg-[var(--ok)]/30 text-center">
                    <span className="text-micro text-[var(--ok)] font-bold block">
                      Punto de Equilibrio
                    </span>
                    <span className="text-xl font-extrabold text-[var(--ok)] font-mono block">
                      {selectedLead.financial_break_even.entradas_break_even}
                    </span>
                    <span className="text-micro text-[var(--ink-2)] block">
                      entradas para no perder (€0)
                    </span>
                  </div>

                  <div className="p-3 rounded-[var(--r-m)] bg-[var(--surface)] text-center">
                    <span className="text-micro text-[var(--ink-2)] font-bold block">
                      % Aforo Requerido
                    </span>
                    <span className="text-xl font-bold text-[var(--ink-2)] font-mono block">
                      {Math.round(
                        ((selectedLead.financial_break_even
                          .entradas_break_even || 1) /
                          (selectedLead.aforo || 250)) *
                          100,
                      )}
                      %
                    </span>
                    <span className="text-micro text-[var(--ink-2)] block">
                      de {selectedLead.aforo || 250} aforo máx.
                    </span>
                  </div>

                  <div className="p-3 rounded-[var(--r-m)] bg-[var(--surface)] text-center">
                    <span className="text-micro text-[var(--ink-2)] font-bold block">
                      Beneficio Banda (80% lleno)
                    </span>
                    <span className="text-xl font-bold text-[var(--ok)] font-mono block">
                      {
                        selectedLead.financial_break_even
                          .beneficio_estimado_lleno
                      }{" "}
                      €
                    </span>
                    <span className="text-micro text-[var(--ink-2)] block">
                      margen neto total
                    </span>
                  </div>

                  <div className="p-3 rounded-[var(--r-m)] bg-[var(--ok)]/40 text-center">
                    <span className="text-micro text-[var(--ok)] font-bold block">
                      Limpio por músico
                    </span>
                    <span className="text-xl font-extrabold text-[var(--ok)] font-mono block">
                      {
                        selectedLead.financial_break_even
                          .beneficio_por_musico_estimado
                      }{" "}
                      €
                    </span>
                    <span className="text-micro text-[var(--ok)]/80 block">
                      / cada uno (
                      {selectedLead.financial_break_even.num_musicos}{" "}
                      integrantes)
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--ok)]/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-[var(--ok)] shrink-0" />
                    <span className="text-[var(--ink-2)] text-xs">
                      Con{" "}
                      <strong className="text-[var(--ok)]">
                        {selectedLead.financial_break_even.entradas_break_even}{" "}
                        entradas
                      </strong>{" "}
                      cubrís íntegramente el alquiler de la sala ({simAlquiler}
                      €) y los gastos de furgoneta/sonido ({simGastosProd}€).
                    </span>
                  </div>
                  <span className="font-bold text-[var(--ok)] font-mono shrink-0 ml-2">
                    ✓ Margen Positivo
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-3 text-center text-[var(--ink-2)] text-xs italic">
                Ajusta los precios y pulsa “Recalcular y Guardar P&L” para
                simular la rentabilidad del concierto.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
