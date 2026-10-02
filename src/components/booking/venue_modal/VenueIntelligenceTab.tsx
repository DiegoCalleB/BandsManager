import React from 'react';
import { Calendar, Compass, DollarSign, Calculator, TrendingUp, Sparkles, ExternalLink } from 'lucide-react';
import { Lead } from '../../../types';
import { QuickDealSimulator } from '../QuickDealSimulator';
import { DealAndLogisticsCopilot } from '../DealAndLogisticsCopilot';
import { ShowIcon } from '../../ui/ShowIcon';

interface VenueIntelligenceTabProps {
  lead: Lead;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  bandName?: string;
}

export const VenueIntelligenceTab: React.FC<VenueIntelligenceTabProps> = ({
  lead,
  onUpdateLead,
  bandName,
}) => {
  const fechasLibres = lead.fechas_libres_detectadas || [];
  const wegowOk = (lead as any).radar_wegow_status === 'ok';

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar p-4 sm:p-6 space-y-5">
      {/* 1. RADAR WEGOW & FECHAS LIBRES */}
      <div className="p-4 rounded-[var(--r-l)] bg-[var(--surface)] border border-[var(--hair)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--acc)]" />
            <h4 className="text-xs font-bold font-sans uppercase tracking-wider text-[var(--ink)]">
              Radar de Fechas Libres (Wegow & Ticketing)
            </h4>
          </div>
          {wegowOk && (
            <span className="text-micro font-bold text-[var(--ok)] bg-[var(--ok-soft)] px-2 py-0.5 rounded-[var(--r-pill)] flex items-center gap-1">
              ✓ Cartelera contrastada
            </span>
          )}
        </div>

        {fechasLibres.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-[var(--ink-2)]">
              Fechas sin programación detectadas por el radar para los próximos fines de semana:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {fechasLibres.map((f, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--sunken)] border border-[var(--hair)] text-xs font-mono font-semibold text-[var(--ink)]"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-[var(--ink-2)] italic">
            No se han registrado fechas libres específicas para esta sala todavía. Puedes consultar su cartelera en Wegow o Bandsintown.
          </p>
        )}

        <div className="flex items-center gap-3 pt-1 text-xs">
          <a
            href={`https://www.wegow.com/es-es/busqueda?query=${encodeURIComponent(lead.nombre_sala)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--acc)] hover:underline flex items-center gap-1"
          >
            <span>Ver cartelera en Wegow</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* 2. COPILOTO Y SIMULADOR FINANCIERO P&L */}
      <div className="p-4 rounded-[var(--r-l)] bg-[var(--surface)] border border-[var(--hair)] space-y-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-[var(--ok)]" />
          <h4 className="text-xs font-bold font-sans uppercase tracking-wider text-[var(--ink)]">
            Simulador de Bolo & Punto de Equilibrio (P&L)
          </h4>
        </div>
        <p className="text-xs text-[var(--ink-2)]">
          Calcula la rentabilidad del concierto según aforo, precio de entrada y porcentaje de taquilla o caché fijo.
        </p>

        <QuickDealSimulator
          lead={lead}
          onUpdateLead={(updates) => onUpdateLead(lead.id, updates)}
        />
      </div>
    </div>
  );
};
