/**
 * Pestaña de inteligencia de datos y APIs externas del lead.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars
*/
import { Sparkles, RefreshCw, Headphones, MapPin, Star, Disc, ShieldCheck, Truck, Navigation, Instagram, CheckCircle2, CalendarDays, Flame, Megaphone, Handshake, Calculator, Coins } from "lucide-react";
import { Button, LinkButton, Input } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { Lead } from "../../../types";
import { VenueFinancialSimulatorCard } from "./VenueFinancialSimulatorCard";
import { VenueCalendarEventsCards } from "./VenueCalendarEventsCards";
import { VenueCoBookingMediaCards } from "./VenueCoBookingMediaCards";
import { VenueRouteSocialCards } from "./VenueRouteSocialCards";
import { VenueAudienceVerificationCards } from "./VenueAudienceVerificationCards";
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

          <VenueAudienceVerificationCards selectedLead={selectedLead} onUpdateLead={onUpdateLead} setEditedPitch={setEditedPitch} setScoutActionFeedback={setScoutActionFeedback} routeOrigin={routeOrigin} setRouteOrigin={setRouteOrigin} handleCalculateRoute={handleCalculateRoute} isCalculatingRoute={isCalculatingRoute} handleFetchSocial={handleFetchSocial} isEnrichingSocial={isEnrichingSocial} handleFetchBookingWindow={handleFetchBookingWindow} isEnrichingBookingWindow={isEnrichingBookingWindow} handleFetchLocalEvents={handleFetchLocalEvents} isEnrichingLocalEvents={isEnrichingLocalEvents} handleFetchPressMedia={handleFetchPressMedia} isEnrichingPressMedia={isEnrichingPressMedia} handleFetchCoBooking={handleFetchCoBooking} isEnrichingCoBooking={isEnrichingCoBooking} />

          <VenueFinancialSimulatorCard handleRecalculateFinancial={handleRecalculateFinancial} isRecalculatingFinancial={isRecalculatingFinancial} simAnticipada={simAnticipada} setSimAnticipada={setSimAnticipada} simTaquilla={simTaquilla} setSimTaquilla={setSimTaquilla} simAlquiler={simAlquiler} setSimAlquiler={setSimAlquiler} simPctSala={simPctSala} setSimPctSala={setSimPctSala} simGastosProd={simGastosProd} setSimGastosProd={setSimGastosProd} simNumMusicos={simNumMusicos} setSimNumMusicos={setSimNumMusicos} selectedLead={selectedLead} />
        </div>
      )}
    </>
  );
}
