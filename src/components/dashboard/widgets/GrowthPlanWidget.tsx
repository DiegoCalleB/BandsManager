import React from 'react';
import { Rocket, Sparkles, ArrowRight, CheckCircle2, TrendingUp, Compass, Calendar, Zap, ChevronRight, Target } from 'lucide-react';
import { GrowthPlan, ActionItem } from '../../../utils/growthPlanEngine';
import { ModuleWidgetProps } from './ModuleWidgets';

export interface GrowthGuidanceWidgetProps extends ModuleWidgetProps {
  /** Heredado de main: Espectro resuelve el tema en tokens, así que se acepta y se ignora. */
  isStitchLight?: boolean;
  growthPlan?: GrowthPlan;
  onOpenGuidanceModal?: () => void;
}

export const GrowthGuidanceWidget: React.FC<GrowthGuidanceWidgetProps> = ({
  growthPlan,
  activeBandName = 'Tu Banda',
  onNavigate,
  onOpenGuidanceModal,
  isStitchLight = false,
}) => {
  // Extract today's blueprint action or first available
  const todayBlueprint = growthPlan?.weeklyBlueprint?.[0];
  const totalPillars = growthPlan?.overallPillars?.length || 3;
  const channelPlaybooks = growthPlan?.channelPlaybooks || [];

  return (
    <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)]/95 border border-[var(--hair)] shadow-sm space-y-4">
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--hair)]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--acc)] border border-[var(--acc)]/30">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold font-display uppercase tracking-wider text-[var(--ink-2)]">
                Guía de Crecimiento & Promoción
              </h3>
              <span className="px-2 py-0.5 rounded-[var(--r-pill)] text-[9px] font-mono font-bold bg-[var(--acc)]/20 text-[var(--acc)] border border-[var(--hair)]">
                {growthPlan?.horizonDays || 30}D
              </span>
            </div>
            <p className="text-xs font-mono text-[var(--ink-2)]">Paso a paso para llenar bolos y visibilidad</p>
          </div>
        </div>

        {onOpenGuidanceModal ? (
          <button
            type="button"
            onClick={onOpenGuidanceModal}
            className="text-xs font-mono text-[var(--acc)] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Plan Completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : onNavigate ? (
          <button
            type="button"
            onClick={() => onNavigate('reels')}
            className="text-xs font-mono text-[var(--acc)] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Redes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Action Recommendation Banner */}
      {todayBlueprint ? (
        <div className="p-3.5 rounded-[var(--r-m)] bg-gradient-to-r from-[var(--acc)]/30 via-[var(--surface)] to-transparent border border-[var(--hair)] flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--acc)] font-mono text-[10px] font-bold uppercase">
                {todayBlueprint.day} · {todayBlueprint.recommendedPlatform}
              </span>
              <span className="text-xs font-bold text-[var(--ink-2)] truncate">{todayBlueprint.focus}</span>
            </div>
            <p className="text-xs text-[var(--ink-2)] line-clamp-2">{todayBlueprint.contentAction}</p>
          </div>

          <div className="shrink-0 text-right">
            <span className="text-[10px] font-mono text-[var(--acc)] flex items-center gap-1 justify-end">
              <Zap className="w-3 h-3" />
              {todayBlueprint.optimalPostingTime}
            </span>
            {onOpenGuidanceModal && (
              <button
                type="button"
                onClick={onOpenGuidanceModal}
                className="mt-2 px-2.5 py-1 rounded-[var(--r-m)] bg-[var(--acc)] hover:bg-[var(--acc)] text-[var(--ink)] text-[11px] font-mono font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs"
              >
                <span>Detalles</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--surface)] border border-[var(--hair)] text-xs text-[var(--ink-2)]">
          Recomendaciones estratégicas personalizadas para el crecimiento de {activeBandName}.
        </div>
      )}

      {/* 3 Pillars / Quick metrics status */}
      <div className="grid grid-cols-3 gap-2.5 pt-1">
        <div className="p-3 rounded-[var(--r-m)] bg-[var(--surface)] border border-[var(--hair)] text-center">
          <span className="text-base font-bold font-mono text-[var(--acc)]">{channelPlaybooks.length || 3}</span>
          <p className="text-[10px] font-mono text-[var(--ink-2)] uppercase tracking-wider mt-0.5">Canales Activos</p>
        </div>

        <div className="p-3 rounded-[var(--r-m)] bg-[var(--surface)] border border-[var(--hair)] text-center">
          <span className="text-base font-bold font-mono text-[var(--acc)]">{growthPlan?.weeklyBlueprint?.length || 7}</span>
          <p className="text-[10px] font-mono text-[var(--ink-2)] uppercase tracking-wider mt-0.5">Hitos Semanales</p>
        </div>

        <div className="p-3 rounded-[var(--r-m)] bg-[var(--surface)] border border-[var(--hair)] text-center">
          <span className="text-base font-bold font-mono text-[var(--ok)]">{totalPillars}</span>
          <p className="text-[10px] font-mono text-[var(--ink-2)] uppercase tracking-wider mt-0.5">Pilares Clave</p>
        </div>
      </div>
    </div>
  );
};
