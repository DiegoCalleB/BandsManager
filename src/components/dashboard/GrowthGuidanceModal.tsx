import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Target,
  Rocket,
  Compass,
  TrendingUp,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Zap,
  Lightbulb,
  Music,
  Users,
  Radio,
  Instagram,
  Youtube,
  Disc3,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { GrowthPlan, ActionItem } from '../../utils/growthPlanEngine';
import { ThemeColors } from '../../types';

interface GrowthGuidanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  growthPlan: GrowthPlan;
  bandName?: string;
  onNavigate?: (view: string, options?: any) => void;
  isStitchLight?: boolean;
}

export const GrowthGuidanceModal: React.FC<GrowthGuidanceModalProps> = ({
  isOpen,
  onClose,
  growthPlan,
  bandName = 'Tu Banda',
  onNavigate,
  isStitchLight = false,
}) => {
  const [activeTab, setActiveTab] = useState<'blueprint' | 'channels' | 'pillars'>('blueprint');
  const [selectedChannel, setSelectedChannel] = useState<'instagram' | 'tiktok' | 'youtube' | 'spotify'>('instagram');
  const [completedActionIds, setCompletedActionIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`growth_plan_actions_${bandName}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  if (!isOpen) return null;

  const toggleAction = (id: string) => {
    setCompletedActionIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(`growth_plan_actions_${bandName}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const channelData = growthPlan.channelPlaybooks?.find((c) => c.platform === selectedChannel) || growthPlan.channelPlaybooks?.[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-[#141416] border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl my-auto">
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-neutral-900 to-purple-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold font-display text-neutral-100">Plan Estratégico de Crecimiento & Promoción</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {growthPlan.horizonDays} Días
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Ruta guiada paso a paso para {growthPlan.bandName || bandName}: conciertos, contenidos y publicidad sin complicaciones.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-5 py-2.5 bg-[#101012] border-b border-neutral-800/80 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('blueprint')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'blueprint'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Agenda Semanal Guiada</span>
            </button>

            <button
              onClick={() => setActiveTab('channels')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'channels'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Playbooks por Canal</span>
            </button>

            <button
              onClick={() => setActiveTab('pillars')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'pillars'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Pilares & Diagnóstico</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-neutral-400 hidden sm:flex items-center gap-1">
            <span className="text-amber-400 font-bold">{completedActionIds.length}</span> acciones completadas
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 bg-[#141416]">
          {/* TAB 1: BLUEPRINT SEMANAL */}
          {activeTab === 'blueprint' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-neutral-900 to-transparent border border-amber-500/25 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                    Cómo ejecutar esta semana sin agobios
                  </h4>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                    No necesitas pasar 8 horas al día en redes. Dedica 15 minutos en los días y franjas marcadas a continuación. Cada acción
                    alimenta directamente el interés para llenar los directos.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {growthPlan.weeklyBlueprint?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#18181b] border border-neutral-800/90 hover:border-neutral-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-mono font-bold text-amber-400 shrink-0 min-w-[75px] text-center">
                        {item.day}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-neutral-100">{item.focus}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800 uppercase">
                            {item.recommendedPlatform}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-300 mt-1">{item.contentAction}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-800">
                      <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-800">
                        <Zap className="w-3 h-3 text-amber-400" />
                        {item.optimalPostingTime}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: PLAYBOOKS POR CANAL */}
          {activeTab === 'channels' && (
            <div className="space-y-5">
              {/* Channel Selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {(['instagram', 'tiktok', 'youtube', 'spotify'] as const).map((platform) => {
                  const isSelected = selectedChannel === platform;
                  return (
                    <button
                      key={platform}
                      onClick={() => setSelectedChannel(platform)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer capitalize ${
                        isSelected
                          ? 'bg-amber-500 text-stone-950 shadow-sm'
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {platform === 'instagram' && <Instagram className="w-3.5 h-3.5" />}
                      {platform === 'youtube' && <Youtube className="w-3.5 h-3.5" />}
                      {platform === 'spotify' && <Disc3 className="w-3.5 h-3.5" />}
                      {platform === 'tiktok' && <Radio className="w-3.5 h-3.5" />}
                      <span>{platform}</span>
                    </button>
                  );
                })}
              </div>

              {channelData && (
                <div className="space-y-4 animate-fade-in">
                  {/* Channel Summary Card */}
                  <div className="p-4 rounded-xl bg-[#18181b] border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-neutral-100 font-display">Estrategia para {channelData.name}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        {channelData.growthStage}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">{channelData.coreStrategy}</p>
                    <div className="pt-2 text-[11px] font-mono text-neutral-400 flex items-center gap-1">
                      <span className="text-neutral-500 font-bold">Objetivo:</span> {channelData.primaryObjective}
                    </div>
                  </div>

                  {/* Action Checklist */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
                      Acciones Recomendadas (Marca al completarlas)
                    </h5>
                    <div className="space-y-2">
                      {channelData.actionItems?.map((action) => {
                        const isDone = completedActionIds.includes(action.id);
                        return (
                          <div
                            key={action.id}
                            onClick={() => toggleAction(action.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                              isDone
                                ? 'bg-emerald-950/20 border-emerald-500/30 opacity-75'
                                : 'bg-[#18181b] border-neutral-800 hover:border-neutral-700'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-1 rounded-md mt-0.5 ${isDone ? 'text-emerald-400' : 'text-neutral-600'}`}>
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-bold ${isDone ? 'line-through text-neutral-400' : 'text-neutral-200'}`}>
                                    {action.title}
                                  </span>
                                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-amber-400 font-bold">
                                    {action.impact}
                                  </span>
                                </div>
                                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{action.description}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hook Formulas */}
                  {channelData.hookFormulas && channelData.hookFormulas.length > 0 && (
                    <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80 space-y-2">
                      <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Fórmulas de Gancho Probadas
                      </h5>
                      <ul className="space-y-1.5">
                        {channelData.hookFormulas.map((hook, hIdx) => (
                          <li key={hIdx} className="text-xs text-neutral-300 font-mono italic pl-3 border-l-2 border-purple-500/40">
                            {hook}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DIAGNÓSTICO & PILARES */}
          {activeTab === 'pillars' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#18181b] border border-neutral-800 space-y-2">
                <h4 className="text-sm font-bold text-neutral-100 font-display">Resumen Ejecutivo & Diagnóstico</h4>
                <p className="text-xs text-neutral-300 leading-relaxed">{growthPlan.executiveSummary}</p>
              </div>

              <div className="space-y-2">
                <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
                  Pilares de Crecimiento & Reparto de Esfuerzo
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {growthPlan.overallPillars?.map((p, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-[#18181b] border border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400">{p.pillar}</span>
                        <span className="text-xs font-mono font-bold text-neutral-400">{p.weightPercentage}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-neutral-900 overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${p.weightPercentage}%` }} />
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Quick Navigation */}
        <div className="p-4 border-t border-neutral-800 bg-[#101012] flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-neutral-500">
            Aplica estas recomendaciones directas para impulsar tu venta de entradas y repercusión.
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onNavigate && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('reels');
                }}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Ir al Radar de Redes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Cerrar & Empezar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
