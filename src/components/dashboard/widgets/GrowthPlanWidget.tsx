import React from 'react';
import { 
  Rocket, Sparkles, ArrowRight, CheckCircle2, TrendingUp, Compass, 
  Calendar, Zap, ChevronRight, Target
} from 'lucide-react';
import { GrowthPlan, ActionItem } from '../../../utils/growthPlanEngine';
import { ModuleWidgetProps } from './ModuleWidgets';

export interface GrowthGuidanceWidgetProps extends ModuleWidgetProps {
  growthPlan?: GrowthPlan;
  onOpenGuidanceModal?: () => void;
}

export const GrowthGuidanceWidget: React.FC<GrowthGuidanceWidgetProps> = ({
  growthPlan,
  activeBandName = 'Tu Banda',
  onNavigate,
  onOpenGuidanceModal,
  isStitchLight = false
}) => {
  // Extract today's blueprint action or first available
  const todayBlueprint = growthPlan?.weeklyBlueprint?.[0];
  const totalPillars = growthPlan?.overallPillars?.length || 3;
  const channelPlaybooks = growthPlan?.channelPlaybooks || [];

  return (
    <div className="p-5 rounded-2xl bg-[#18181b]/95 border border-neutral-800/90 shadow-sm space-y-4">
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold font-display uppercase tracking-wider text-neutral-100">
                Guía de Crecimiento & Promoción
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {growthPlan?.horizonDays || 30}D
              </span>
            </div>
            <p className="text-xs font-mono text-neutral-400">Paso a paso para llenar bolos y visibilidad</p>
          </div>
        </div>

        {onOpenGuidanceModal ? (
          <button
            type="button"
            onClick={onOpenGuidanceModal}
            className="text-xs font-mono text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Plan Completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : onNavigate ? (
          <button
            type="button"
            onClick={() => onNavigate('reels')}
            className="text-xs font-mono text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Redes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Action Recommendation Banner */}
      {todayBlueprint ? (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/30 via-neutral-900 to-transparent border border-purple-500/30 flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold uppercase">
                {todayBlueprint.day} · {todayBlueprint.recommendedPlatform}
              </span>
              <span className="text-xs font-bold text-neutral-200 truncate">
                {todayBlueprint.focus}
              </span>
            </div>
            <p className="text-xs text-neutral-300 line-clamp-2">
              {todayBlueprint.contentAction}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1 justify-end">
              <Zap className="w-3 h-3" />
              {todayBlueprint.optimalPostingTime}
            </span>
            {onOpenGuidanceModal && (
              <button
                type="button"
                onClick={onOpenGuidanceModal}
                className="mt-2 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-mono font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs"
              >
                <span>Detalles</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-[#121214] border border-neutral-800 text-xs text-neutral-400">
          Recomendaciones estratégicas personalizadas para el crecimiento de {activeBandName}.
        </div>
      )}

      {/* 3 Pillars / Quick metrics status */}
      <div className="grid grid-cols-3 gap-2.5 pt-1">
        <div className="p-3 rounded-xl bg-[#121214] border border-neutral-800 text-center">
          <span className="text-base font-bold font-mono text-purple-400">
            {channelPlaybooks.length || 3}
          </span>
          <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider mt-0.5">Canales Activos</p>
        </div>

        <div className="p-3 rounded-xl bg-[#121214] border border-neutral-800 text-center">
          <span className="text-base font-bold font-mono text-amber-400">
            {growthPlan?.weeklyBlueprint?.length || 7}
          </span>
          <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider mt-0.5">Hitos Semanales</p>
        </div>

        <div className="p-3 rounded-xl bg-[#121214] border border-neutral-800 text-center">
          <span className="text-base font-bold font-mono text-emerald-400">
            {totalPillars}
          </span>
          <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider mt-0.5">Pilares Clave</p>
        </div>
      </div>
    </div>
  );
};
