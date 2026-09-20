import React, { useState } from 'react';
import { BookingCampaign, Lead } from '../../types';
import { leadMatchesCampaign } from '../../utils/campaignMatch';
import {
  Target, Calendar, MapPin, Users, X, Settings2, Building2,
  ChevronRight, ChevronDown, ChevronUp, Sparkles, Flame, CheckCircle2
} from 'lucide-react';

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
  currentView
}: GlobalCampaignBarProps) {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  // Recuento de salas objetivo de la campaña: usa exactamente el mismo criterio que el listado
  // real de Booking Salas (leadMatchesCampaign), para que este número nunca prometa más salas de
  // las que luego aparecen al pulsar el botón.
  const matchingLeads = allLeads.filter(l => leadMatchesCampaign(l, campaign));

  const firstTargetDate = campaign.targetDates?.[0];

  return (
    <div className="w-full mb-2 sm:mb-3 rounded-[var(--r-m)] bg-gradient-to-r from-[#1b122e] via-[#141022] to-[#121110] border border-purple-500/30 p-1.5 sm:p-2.5 shadow-sm shadow-purple-950/20 animate-fade-in relative overflow-hidden">
      {/* Background ambient glow */}
      <div 
        className="absolute -right-10 -top-10 w-28 h-28 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ backgroundColor: campaign.color || '#8b5cf6' }}
      />

      {/* Main Bar Content */}
      <div className="flex items-center justify-between gap-2 relative z-10">
        
        {/* Left Side: Campaign Badge, Name & Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          <div 
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center shrink-0 shadow-xs border"
            style={{ 
              backgroundColor: `${campaign.color || '#8b5cf6'}25`,
              borderColor: `${campaign.color || '#8b5cf6'}50`,
              color: campaign.color || '#a78bfa'
            }}
          >
            <Flame className="w-3.5 h-3.5 animate-pulse" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[8px] font-mono font-extrabold uppercase tracking-wider px-1 py-0.2 rounded bg-purple-500/25 text-purple-200 border border-purple-400/30 shrink-0">
                🎯 CAMPAÑA
              </span>
              <h2 className="text-xs sm:text-sm font-bold font-display text-zinc-100 truncate" title={campaign.name}>
                {campaign.name}
              </h2>
            </div>

            {/* Desktop / Tablet Inline details */}
            <div className="hidden sm:flex flex-wrap items-center gap-2 text-[10px] text-text-[var(--ink-3)] mt-0.5">
              <span className="inline-flex items-center gap-1 text-sky-300 font-medium truncate max-w-[200px]">
                <MapPin className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                {campaign.targetCities?.join(', ') || 'Todas las ciudades'}
              </span>
              <span className="text-neutral-600">•</span>
              <span className="inline-flex items-center gap-1 text-amber-300 font-mono">
                <Users className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                {campaign.minCapacity}-{campaign.maxCapacity} pax
              </span>
              <span className="text-neutral-600">•</span>
              <span className="inline-flex items-center gap-1 text-pink-300 font-mono font-semibold truncate max-w-[180px]">
                <Calendar className="w-2.5 h-2.5 text-pink-400 shrink-0" />
                {campaign.targetDatesText || `${campaign.targetDates?.length || 0} fechas`}
              </span>
            </div>
          </div>

          {/* Mobile Info Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileExpanded(prev => !prev)}
            className="sm:hidden p-1 text-text-[var(--ink-2)] hover:text-purple-300 transition-colors shrink-0"
            title={isMobileExpanded ? "Ocultar detalles" : "Ver ciudades y fechas"}
          >
            {isMobileExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Right Side: Quick Action Pills & Settings */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5 shrink-0">
          
          {/* Quick CRM filter button */}
          <button
            type="button"
            onClick={() => onNavigate('booking', { campaignFilter: campaign.id })}
            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[9px] sm:text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-xs ${
              currentView === 'booking'
                ? 'bg-purple-500 text-white shadow-xs'
                : 'bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 border border-purple-500/30'
            }`}
            title="Ver salas objetivo de esta campaña en Booking CRM"
          >
            <Building2 className="w-3 h-3 text-purple-300 shrink-0" />
            <span>Salas ({matchingLeads.length})</span>
          </button>

          {/* Quick Calendar button */}
          <button
            type="button"
            onClick={() => onNavigate('calendario', { selectedDate: firstTargetDate })}
            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[9px] sm:text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-xs ${
              currentView === 'calendario'
                ? 'bg-purple-500 text-white shadow-xs'
                : 'bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 border border-purple-500/30'
            }`}
            title="Ver fechas de la campaña en el Calendario"
          >
            <Calendar className="w-3 h-3 text-pink-300 shrink-0" />
            <span>Calendario</span>
          </button>

          {/* Quick Band CRM button */}
          <button
            type="button"
            onClick={() => onNavigate('bandas', { campaignCities: campaign.targetCities })}
            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[9px] sm:text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-xs ${
              currentView === 'bandas'
                ? 'bg-purple-500 text-white shadow-xs'
                : 'bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 border border-purple-500/30'
            }`}
            title="Ver grupos en las ciudades objetivo para Co-booking"
          >
            <Users className="w-3 h-3 text-sky-300 shrink-0" />
            <span className="hidden sm:inline">Co-booking</span>
            <span className="sm:hidden">Bandas</span>
          </button>

          {/* Settings / Switcher button */}
          <button
            type="button"
            onClick={onOpenManager}
            className="p-1 rounded-md bg-bg-[var(--surface)]/80 hover:bg-neutral-800 text-text-[var(--ink-3)] hover:text-white border /60 transition-colors shrink-0"
            title="Gestionar o cambiar campaña activa"
          >
            <Settings2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>

          {/* Deactivate button */}
          <button
            type="button"
            onClick={onDeactivate}
            className="p-1 rounded-md bg-bg-[var(--surface)]/80 hover:bg-red-950/60 text-text-[var(--ink-2)] hover:text-red-300 border /60 hover:border-red-500/40 transition-colors shrink-0"
            title="Desactivar modo campaña (volver a modo general)"
          >
            <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>

        </div>

      </div>

      {/* Mobile Collapsible Details */}
      {isMobileExpanded && (
        <div className="sm:hidden pt-2 mt-2 border-t border-purple-500/20 text-[10px] text-text-[var(--ink-3)] flex flex-col gap-1 animate-fade-in relative z-10">
          <div className="flex items-center gap-1.5 text-sky-300 font-medium">
            <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
            <span>{campaign.targetCities?.join(', ') || 'Todas las ciudades'}</span>
          </div>
          <div className="flex items-center justify-between text-text-[var(--ink-3)]">
            <span className="inline-flex items-center gap-1 text-amber-300 font-mono">
              <Users className="w-3 h-3 text-amber-400 shrink-0" />
              {campaign.minCapacity} - {campaign.maxCapacity} pax
            </span>
            <span className="inline-flex items-center gap-1 text-pink-300 font-mono font-semibold">
              <Calendar className="w-3 h-3 text-pink-400 shrink-0" />
              {campaign.targetDatesText || `${campaign.targetDates?.length || 0} fechas`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default GlobalCampaignBar;
