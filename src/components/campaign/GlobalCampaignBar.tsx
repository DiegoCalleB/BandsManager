import React, { useState } from "react";
import { BookingCampaign, Lead } from "../../types";
import { leadMatchesCampaign } from "../../utils/campaignMatch";
import {
  Target,
  Calendar,
  MapPin,
  Users,
  X,
  Settings2,
  Building2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Flame,
  CheckCircle2,
} from "lucide-react";

interface GlobalCampaignBarProps {
  campaign: BookingCampaign;
  allLeads?: Lead[];
  onOpenManager: () => void;
  onDeactivate: () => void;
  onNavigate: (view: string, options?: any) => void;
  currentView: string;
}

export function GlobalCampaignBar({
  campaign,
  allLeads = [],
  onOpenManager,
  onDeactivate,
  onNavigate,
  currentView,
}: GlobalCampaignBarProps) {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  // Recuento de salas objetivo de la campaña: usa exactamente el mismo criterio que el listado
  // real de Booking Salas (leadMatchesCampaign), para que este número nunca prometa más salas de
  // las que luego aparecen al pulsar el botón.
  const matchingLeads = allLeads.filter((l) =>
    leadMatchesCampaign(l, campaign),
  );

  const firstTargetDate = campaign.targetDates?.[0];

  return (
    <div className="w-full mb-2 sm:mb-3 rounded-[var(--r-m)] bg-gradient-to-r from-[var(--sunken)] via-[var(--bg)] to-[var(--bg)] p-1.5 sm:p-2.5 animate-fade-in relative overflow-hidden">
      {/* Background ambient */}
      <div
        className="absolute -right-10 -top-10 w-28 h-28 rounded-[var(--r-pill)] blur-3xl opacity-15 pointer-events-none"
        style={{ backgroundColor: campaign.color || "var(--acc)" }}
      />

      {/* Main Bar Content */}
      <div className="flex items-center justify-between gap-2 relative z-10">
        {/* Left Side: Campaign Badge, Name & Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          <div
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-[var(--r-s)] flex items-center justify-center shrink-0"
            style={{
              backgroundColor: `${campaign.color || "var(--acc)"}25`,
              borderColor: `${campaign.color || "var(--acc)"}50`,
              color: campaign.color || "var(--acc)",
            }}
          >
            <Flame className="w-3.5 h-3.5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[8px] font-sans font-extrabold tracking-wider px-1 py-0.2 rounded bg-[var(--hair)]/25 text-[var(--acc)]/40 shrink-0">
                🎯 CAMPAÑA
              </span>
              <h2
                className="text-xs sm:text-sm font-bold font-display text-[var(--ink)] truncate"
                title={campaign.name}
              >
                {campaign.name}
              </h2>
            </div>

            {/* Desktop / Tablet Inline details */}
            <div className="hidden sm:flex flex-wrap items-center gap-2 text-[10px] text-[var(--ink-2)] mt-0.5">
              <span className="inline-flex items-center gap-1 text-[var(--ink-2)] font-medium truncate max-w-[200px]">
                <MapPin className="w-2.5 h-2.5 text-[var(--ink-2)] shrink-0" />
                {campaign.targetCities?.join(",") || "Todas las ciudades"}
              </span>
              <span className="text-[var(--ink-2)]">•</span>
              <span className="inline-flex items-center gap-1 text-[var(--acc)]/70 font-sans">
                <Users className="w-2.5 h-2.5 text-[var(--acc)] shrink-0" />
                {campaign.minCapacity}-{campaign.maxCapacity} pax
              </span>
              <span className="text-[var(--ink-2)]">•</span>
              <span className="inline-flex items-center gap-1 text-[var(--alert)]/60 font-sans font-semibold truncate max-w-[180px]">
                <Calendar className="w-2.5 h-2.5 text-[var(--alert)] shrink-0" />
                {campaign.targetDatesText ||
                  `${campaign.targetDates?.length || 0} fechas`}
              </span>
            </div>
          </div>

          {/* Mobile Info Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileExpanded((prev) => !prev)}
            className="sm:hidden p-1 text-[var(--ink-2)] hover:text-[var(--hair)]/80 transition-colors shrink-0"
            title={
              isMobileExpanded ? "Ocultar detalles" : "Ver ciudades y fechas"
            }
          >
            {isMobileExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Right Side: Quick Action Pills & Settings */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5 shrink-0">
          {/* Quick CRM filter button */}
          <button
            type="button"
            onClick={() =>
              onNavigate("booking", { campaignFilter: campaign.id })
            }
            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-[var(--r-s)] text-[9px] sm:text-[10px] font-sans font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
              currentView === "booking"
                ? "bg-[var(--hair)] text-[var(--ink)]"
                : "bg-[var(--acc)]/90 hover:bg-[var(--acc)]/80 text-[var(--acc)]/40"
            }`}
            title="Ver salas objetivo de esta campaña en Booking CRM"
          >
            <Building2 className="w-3 h-3 text-[var(--hair)]/80 shrink-0" />
            <span>Salas ({matchingLeads.length})</span>
          </button>

          {/* Quick Calendar button */}
          <button
            type="button"
            onClick={() =>
              onNavigate("calendario", { selectedDate: firstTargetDate })
            }
            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-[var(--r-s)] text-[9px] sm:text-[10px] font-sans font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
              currentView === "calendario"
                ? "bg-[var(--hair)] text-[var(--ink)]"
                : "bg-[var(--acc)]/90 hover:bg-[var(--acc)]/80 text-[var(--acc)]/40"
            }`}
            title="Ver fechas de la campaña en el Calendario"
          >
            <Calendar className="w-3 h-3 text-[var(--alert)]/60 shrink-0" />
            <span>Calendario</span>
          </button>

          {/* Quick Band CRM button */}
          <button
            type="button"
            onClick={() =>
              onNavigate("bandas", { campaignCities: campaign.targetCities })
            }
            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-[var(--r-s)] text-[9px] sm:text-[10px] font-sans font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
              currentView === "bandas"
                ? "bg-[var(--hair)] text-[var(--ink)]"
                : "bg-[var(--acc)]/90 hover:bg-[var(--acc)]/80 text-[var(--acc)]/40"
            }`}
            title="Ver grupos en las ciudades objetivo para Co-booking"
          >
            <Users className="w-3 h-3 text-[var(--ink-2)] shrink-0" />
            <span className="hidden sm:inline">Co-booking</span>
            <span className="sm:hidden">Bandas</span>
          </button>

          {/* Settings / Switcher button */}
          <button
            type="button"
            onClick={onOpenManager}
            className="p-1 rounded-[var(--r-s)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors shrink-0"
            title="Gestionar o cambiar campaña activa"
          >
            <Settings2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>

          {/* Deactivate button */}
          <button
            type="button"
            onClick={onDeactivate}
            className="p-1 rounded-[var(--r-s)] bg-[var(--surface)]/80 hover:bg-[var(--alert)]/90 text-[var(--ink-2)] hover:text-[var(--alert)]/60 hover:border-[var(--alert)]/40 transition-colors shrink-0"
            title="Desactivar modo campaña (volver a modo general)"
          >
            <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Details */}
      {isMobileExpanded && (
        <div className="sm:hidden pt-2 mt-2/20 text-[10px] text-[var(--ink-2)] flex flex-col gap-1 animate-fade-in relative z-10">
          <div className="flex items-center gap-1.5 text-[var(--ink-2)] font-medium">
            <MapPin className="w-3 h-3 text-[var(--ink-2)] shrink-0" />
            <span>
              {campaign.targetCities?.join(",") || "Todas las ciudades"}
            </span>
          </div>
          <div className="flex items-center justify-between text-[var(--ink-2)]">
            <span className="inline-flex items-center gap-1 text-[var(--acc)]/70 font-sans">
              <Users className="w-3 h-3 text-[var(--acc)] shrink-0" />
              {campaign.minCapacity} - {campaign.maxCapacity} pax
            </span>
            <span className="inline-flex items-center gap-1 text-[var(--alert)]/60 font-sans font-semibold">
              <Calendar className="w-3 h-3 text-[var(--alert)] shrink-0" />
              {campaign.targetDatesText ||
                `${campaign.targetDates?.length || 0} fechas`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default GlobalCampaignBar;
