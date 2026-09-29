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
    <div className="fixed inset-0 z-[9999] bg-[var(--scrim)]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-[var(--surface)] border border-[var(--hair)] rounded-[var(--r-l)] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl my-auto">
        {/* Modal Header */}
        <div className="p-5 border-b border-[var(--hair)] flex items-center justify-between bg-gradient-to-r from-[var(--acc)]/10 via-[var(--surface)] to-[var(--acc)]/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/20 text-[var(--acc)] border border-[var(--acc)]/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold font-display text-[var(--ink-2)]">Plan Estratégico de Crecimiento & Promoción</h3>
                <span className="px-2 py-0.5 rounded-[var(--r-pill)] text-[10px] font-mono font-bold bg-[var(--acc)]/20 text-[var(--acc)] border border-[var(--acc)]/30">
                  {growthPlan.horizonDays} Días
                </span>
              </div>
              <p className="text-xs text-[var(--ink-2)] mt-0.5">
                Ruta guiada paso a paso para {growthPlan.bandName || bandName}: conciertos, contenidos y publicidad sin complicaciones.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-[var(--r-m)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--sunken)] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-5 py-2.5 bg-[var(--surface)] border-b border-[var(--hair)] flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('blueprint')}
              className={`px-3 py-1.5 rounded-[var(--r-m)] text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'blueprint'
                  ? 'bg-[var(--acc)] text-[var(--ink)] shadow-sm'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink-2)] hover:bg-[var(--sunken)]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Agenda Semanal Guiada</span>
            </button>

            <button
              onClick={() => setActiveTab('channels')}
              className={`px-3 py-1.5 rounded-[var(--r-m)] text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'channels'
                  ? 'bg-[var(--acc)] text-[var(--ink)] shadow-sm'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink-2)] hover:bg-[var(--sunken)]'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Playbooks por Canal</span>
            </button>

            <button
              onClick={() => setActiveTab('pillars')}
              className={`px-3 py-1.5 rounded-[var(--r-m)] text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'pillars'
                  ? 'bg-[var(--acc)] text-[var(--ink)] shadow-sm'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink-2)] hover:bg-[var(--sunken)]'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Pilares & Diagnóstico</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-[var(--ink-2)] hidden sm:flex items-center gap-1">
            <span className="text-[var(--acc)] font-bold">{completedActionIds.length}</span> acciones completadas
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 bg-[var(--surface)]">
          {/* TAB 1: BLUEPRINT SEMANAL */}
          {activeTab === 'blueprint' && (
            <div className="space-y-4">
              <div className="p-4 rounded-[var(--r-m)] bg-gradient-to-r from-[var(--acc)]/10 via-[var(--surface)] to-transparent border border-[var(--acc)]/25 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-[var(--acc)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[var(--acc)] uppercase tracking-wider font-mono">
                    Cómo ejecutar esta semana sin agobios
                  </h4>
                  <p className="text-xs text-[var(--ink-2)] mt-1 leading-relaxed">
                    No necesitas pasar 8 horas al día en redes. Dedica 15 minutos en los días y franjas marcadas a continuación. Cada acción
                    alimenta directamente el interés para llenar los directos.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {growthPlan.weeklyBlueprint?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-[var(--r-m)] bg-[var(--surface)] border border-[var(--hair)] hover:border-[var(--hair)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <span className="px-2.5 py-1 rounded-[var(--r-m)] bg-[var(--surface)] border border-[var(--hair)] text-xs font-mono font-bold text-[var(--acc)] shrink-0 min-w-[75px] text-center">
                        {item.day}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[var(--ink-2)]">{item.focus}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--ink-2)] border border-[var(--hair)] uppercase">
                            {item.recommendedPlatform}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--ink-2)] mt-1">{item.contentAction}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[var(--hair)]">
                      <span className="text-[11px] font-mono text-[var(--ink-2)] flex items-center gap-1 bg-[var(--surface)] px-2 py-1 rounded-[var(--r-m)] border border-[var(--hair)]">
                        <Zap className="w-3 h-3 text-[var(--acc)]" />
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
              <div className="flex items-center gap-2 overflow-x-auto shrink-0 pb-1">
                {(['instagram', 'tiktok', 'youtube', 'spotify'] as const).map((platform) => {
                  const isSelected = selectedChannel === platform;
                  return (
                    <button
                      key={platform}
                      onClick={() => setSelectedChannel(platform)}
                      className={`px-3 py-1.5 rounded-[var(--r-m)] text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer capitalize ${
                        isSelected
                          ? 'bg-[var(--acc)] text-[var(--ink)] shadow-sm'
                          : 'bg-[var(--surface)] border border-[var(--hair)] text-[var(--ink-2)] hover:text-[var(--ink-2)]'
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
                  <div className="p-4 rounded-[var(--r-m)] bg-[var(--surface)] border border-[var(--hair)] space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[var(--ink-2)] font-display">Estrategia para {channelData.name}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--acc)]/10 text-[var(--acc)] border border-[var(--acc)]/30">
                        {channelData.growthStage}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--ink-2)] leading-relaxed">{channelData.coreStrategy}</p>
                    <div className="pt-2 text-[11px] font-mono text-[var(--ink-2)] flex items-center gap-1">
                      <span className="text-[var(--ink-2)] font-bold">Objetivo:</span> {channelData.primaryObjective}
                    </div>
                  </div>

                  {/* Action Checklist */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--ink-2)]">
                      Acciones Recomendadas (Marca al completarlas)
                    </h5>
                    <div className="space-y-2">
                      {channelData.actionItems?.map((action) => {
                        const isDone = completedActionIds.includes(action.id);
                        return (
                          <div
                            key={action.id}
                            onClick={() => toggleAction(action.id)}
                            className={`p-3 rounded-[var(--r-m)] border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                              isDone
                                ? 'bg-[var(--ok)]/20 border-[var(--ok)]/30 opacity-75'
                                : 'bg-[var(--surface)] border-[var(--hair)] hover:border-[var(--hair)]'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-1 rounded-[var(--r-s)] mt-0.5 ${isDone ? 'text-[var(--ok)]' : 'text-[var(--ink-2)]'}`}>
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-bold ${isDone ? 'line-through text-[var(--ink-2)]' : 'text-[var(--ink-2)]'}`}>
                                    {action.title}
                                  </span>
                                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-[var(--surface)] border border-[var(--hair)] text-[var(--acc)] font-bold">
                                    {action.impact}
                                  </span>
                                </div>
                                <p className="text-xs text-[var(--ink-2)] mt-1 leading-relaxed">{action.description}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hook Formulas */}
                  {channelData.hookFormulas && channelData.hookFormulas.length > 0 && (
                    <div className="p-4 rounded-[var(--r-m)] bg-[var(--surface)]/60 border border-[var(--hair)] space-y-2">
                      <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--acc)] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Fórmulas de Gancho Probadas
                      </h5>
                      <ul className="space-y-1.5">
                        {channelData.hookFormulas.map((hook, hIdx) => (
                          <li key={hIdx} className="text-xs text-[var(--ink-2)] font-mono italic pl-3 border-l-2 border-[var(--acc)]/40">
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
              <div className="p-4 rounded-[var(--r-m)] bg-[var(--surface)] border border-[var(--hair)] space-y-2">
                <h4 className="text-sm font-bold text-[var(--ink-2)] font-display">Resumen Ejecutivo & Diagnóstico</h4>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">{growthPlan.executiveSummary}</p>
              </div>

              <div className="space-y-2">
                <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--ink-2)]">
                  Pilares de Crecimiento & Reparto de Esfuerzo
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {growthPlan.overallPillars?.map((p, idx) => (
                    <div key={idx} className="p-3.5 rounded-[var(--r-m)] bg-[var(--surface)] border border-[var(--hair)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--acc)]">{p.pillar}</span>
                        <span className="text-xs font-mono font-bold text-[var(--ink-2)]">{p.weightPercentage}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-[var(--r-pill)] bg-[var(--surface)] overflow-hidden">
                        <div className="h-full bg-[var(--acc)] rounded-[var(--r-pill)]" style={{ width: `${p.weightPercentage}%` }} />
                      </div>
                      <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Quick Navigation */}
        <div className="p-4 border-t border-[var(--hair)] bg-[var(--surface)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-[var(--ink-2)]">
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
                className="px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--sunken)] hover:bg-[var(--surface)] text-[var(--ink-2)] text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Ir al Radar de Redes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-[var(--r-m)] bg-[var(--acc)] hover:bg-[var(--acc)] text-[var(--ink)] text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Cerrar & Empezar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
