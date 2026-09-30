import React from 'react';
import { Rocket, Sparkles, ArrowRight, CheckCircle2, TrendingUp, Compass, Calendar, Zap, ChevronRight, Target } from 'lucide-react';
import { GrowthPlan, ActionItem } from '../../../utils/growthPlanEngine';
import { ModuleWidgetProps } from './ModuleWidgets';
import { Button } from '../../ui';

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
    <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)]/95 space-y-4">
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--hair)]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--acc-ink)] ">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold font-display text-[var(--ink-2)]">
                Guía de crecimiento y promoción
              </h3>
              <span className="px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-mono font-bold bg-[var(--acc)]/20 text-[var(--acc-ink)] ">
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
            <span>Ver plan completo</span>
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
        <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--acc)]/30 flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--acc-ink)] font-mono text-micro font-bold">
                {todayBlueprint.day} · {todayBlueprint.recommendedPlatform}
              </span>
              <span className="text-xs font-bold text-[var(--ink-2)] truncate">{todayBlueprint.focus}</span>
            </div>
            <p className="text-xs text-[var(--ink-2)] line-clamp-2">{todayBlueprint.contentAction}</p>
          </div>

          <div className="shrink-0 text-right">
            <span className="text-micro font-mono text-[var(--acc)] flex items-center gap-1 justify-end">
              <Zap className="w-3 h-3" />
              {todayBlueprint.optimalPostingTime}
            </span>
            {onOpenGuidanceModal && (
              <Button
                variant="primary"
                size="xs"
                type="button"
                onClick={onOpenGuidanceModal}
                className="mt-2 items-center gap-1"
              >
                <span>Detalles</span>
                <ChevronRight className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--sunken)] text-xs text-[var(--ink-2)]">
          Recomendaciones estratégicas personalizadas para el crecimiento de {activeBandName}.
        </div>
      )}

      {/* 3 Pillars / Quick metrics status */}
      <div className="grid grid-cols-3 gap-2.5 pt-1">
        <div className="p-3 rounded-[var(--r-m)] bg-[var(--sunken)] text-center">
          <span className="text-base font-bold font-mono text-[var(--acc)]">{channelPlaybooks.length || 3}</span>
          <p className="text-micro font-mono text-[var(--ink-2)] mt-0.5">Canales Activos</p>
        </div>

        <div className="p-3 rounded-[var(--r-m)] bg-[var(--sunken)] text-center">
          <span className="text-base font-bold font-mono text-[var(--acc)]">{growthPlan?.weeklyBlueprint?.length || 7}</span>
          <p className="text-micro font-mono text-[var(--ink-2)] mt-0.5">Hitos Semanales</p>
        </div>

        <div className="p-3 rounded-[var(--r-m)] bg-[var(--sunken)] text-center">
          <span className="text-base font-bold font-mono text-[var(--ok)]">{totalPillars}</span>
          <p className="text-micro font-mono text-[var(--ink-2)] mt-0.5">Pilares clave</p>
        </div>
      </div>
    </div>
  );
};
