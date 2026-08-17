import React, { useState } from 'react';
import { ThemeColors, SocialMetric, EPKConfig } from '../../types';
import { GrowthPlan, ChannelRecommendation, ActionItem } from '../../utils/growthPlanEngine';
import { BandProfileArchetype } from '../../utils/bandGrowthTiers';
import {
  TrendingUp, Sparkles, Target, Calendar, CheckCircle2, Circle, 
  Instagram, Youtube, Video, Music2, AlertCircle, ArrowUpRight,
  Flame, Zap, Compass, Check, Copy, Share2, Award, Clock, Lightbulb,
  ChevronRight, RefreshCw, Layers, Sliders, ShieldCheck, Users, Eye, HelpCircle
} from 'lucide-react';

interface SocialGrowthPlanViewProps {
  colors: ThemeColors;
  isStitchLight: boolean;
  bandName: string;
  latestMetric: SocialMetric | null;
  epkConfig?: EPKConfig | null;
  growthPlan: GrowthPlan;
  onRefreshPlanWithAI: (horizon: 30 | 60 | 90, customFocus?: string) => Promise<void>;
  isGeneratingAI: boolean;
}

export const SocialGrowthPlanView: React.FC<SocialGrowthPlanViewProps> = ({
  colors,
  isStitchLight,
  bandName,
  latestMetric,
  epkConfig,
  growthPlan,
  onRefreshPlanWithAI,
  isGeneratingAI
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'instagram' | 'tiktok' | 'youtube' | 'spotify' | 'weekly'>('overview');
  const [selectedHorizon, setSelectedHorizon] = useState<30 | 60 | 90>(growthPlan.horizonDays || 30);
  const [customPrompt, setCustomPrompt] = useState('');
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`growth_completed_actions_${bandName}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [copiedHook, setCopiedHook] = useState<string | null>(null);

  const toggleActionCompleted = (actionId: string) => {
    setCompletedActions(prev => {
      const updated = { ...prev, [actionId]: !prev[actionId] };
      try {
        localStorage.setItem(`growth_completed_actions_${bandName}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHook(id);
    setTimeout(() => setCopiedHook(null), 2000);
  };

  // Calculate overall checklist progress
  const allActionItems: ActionItem[] = growthPlan.channels.flatMap(c => c.actionItems);
  const completedCount = allActionItems.filter(item => completedActions[item.id]).length;
  const progressPercent = allActionItems.length > 0 ? Math.round((completedCount / allActionItems.length) * 100) : 0;

  const currentChannel = growthPlan.channels.find(c => c.platform === selectedTab);
  const archetype: BandProfileArchetype | undefined = growthPlan.archetype;

  const igCount = latestMetric?.instagram_followers || latestMetric?.instagram || 0;
  const tkCount = latestMetric?.tiktok_followers || latestMetric?.tiktok || 0;
  const ytSubs = latestMetric?.youtube_subscribers || latestMetric?.youtube || 0;
  const ytViews = latestMetric?.youtube_total_views || 0;
  const spListeners = latestMetric?.spotify_monthly_listeners || latestMetric?.spotify || 0;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Band Stage Archetype */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isStitchLight 
          ? 'bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-slate-50 border-indigo-100 shadow-sm' 
          : 'bg-gradient-to-br from-indigo-950/30 via-neutral-900/60 to-neutral-950 border-indigo-500/20 shadow-lg'
      }`}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className={`text-base font-bold font-display uppercase tracking-wider ${isStitchLight ? 'text-slate-900' : 'text-white'}`}>
                Plan de Crecimiento Musical ({growthPlan.horizonDays} Días)
              </h3>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                🎸 {bandName}
              </span>
              {archetype && (
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${archetype.stageBadgeColor}`}>
                  {archetype.stageName}
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-neutral-300 mt-2 max-w-3xl leading-relaxed">
              {growthPlan.executiveSummary}
            </p>
          </div>

          {/* AI Controls */}
          <div className="flex flex-wrap items-center gap-2.5 self-stretch lg:self-auto">
            <div className="flex items-center bg-black/30 p-1 rounded-xl border border-neutral-800">
              {([30, 60, 90] as const).map(h => (
                <button
                  key={h}
                  onClick={() => setSelectedHorizon(h)}
                  className={`px-2.5 py-1 text-[10px] font-mono rounded-lg transition-all cursor-pointer ${
                    selectedHorizon === h 
                      ? 'bg-indigo-600 text-white font-bold shadow' 
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {h} Días
                </button>
              ))}
            </div>

            <button
              disabled={isGeneratingAI}
              onClick={() => onRefreshPlanWithAI(selectedHorizon, customPrompt || undefined)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                isGeneratingAI 
                  ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-500/30 cursor-wait' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border border-indigo-400/30 hover:scale-[1.02]'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAI ? 'Generando con Gemini AI...' : 'Recalcular Plan IA'}</span>
            </button>
          </div>
        </div>

        {/* Band Profile Analysis Card */}
        {archetype && (
          <div className="mt-4 pt-4 border-t border-neutral-800/60 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className={`p-3 rounded-xl border ${isStitchLight ? 'bg-white/80 border-slate-200' : 'bg-black/40 border-neutral-800/80'}`}>
              <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-mono uppercase mb-1">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Perfil & Audiencia Actual</span>
              </div>
              <p className="text-xs font-mono font-bold text-white">
                {archetype.label}
              </p>
              <p className="text-[10px] font-mono text-neutral-400 mt-1">
                IG: {igCount.toLocaleString()} · TK: {tkCount.toLocaleString()} · YT: {ytSubs.toLocaleString()}
              </p>
            </div>

            <div className={`p-3 rounded-xl border ${isStitchLight ? 'bg-white/80 border-slate-200' : 'bg-black/40 border-neutral-800/80'}`}>
              <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-mono uppercase mb-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Cuello de Botella a Resolver</span>
              </div>
              <p className="text-xs font-mono text-amber-200 leading-snug">
                {archetype.primaryBottleneck}
              </p>
            </div>

            <div className={`p-3 rounded-xl border ${isStitchLight ? 'bg-white/80 border-slate-200' : 'bg-black/40 border-neutral-800/80'}`}>
              <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-mono uppercase mb-1">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span>Objetivo de Conversión a Salas</span>
              </div>
              <p className="text-xs font-mono text-emerald-300 leading-snug">
                {archetype.conversionFocus}
              </p>
            </div>
          </div>
        )}

        {/* Global Progress Bar */}
        <div className="mt-4 pt-4 border-t border-neutral-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-neutral-300 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-400" />
              Ejecución del Plan: <b>{completedCount} / {allActionItems.length}</b> tácticas completadas
            </span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-64">
            <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden border border-neutral-700/50">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 min-w-[3rem] text-right">
              {progressPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs for Channels & Blueprint */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setSelectedTab('overview')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            selectedTab === 'overview'
              ? 'bg-indigo-600 text-white shadow'
              : isStitchLight ? 'text-slate-600 hover:bg-slate-100' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Visión Global</span>
        </button>

        <button
          onClick={() => setSelectedTab('weekly')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            selectedTab === 'weekly'
              ? 'bg-indigo-600 text-white shadow'
              : isStitchLight ? 'text-slate-600 hover:bg-slate-100' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>Calendario Semanal</span>
        </button>

        <button
          onClick={() => setSelectedTab('instagram')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            selectedTab === 'instagram'
              ? 'bg-pink-600 text-white shadow'
              : isStitchLight ? 'text-slate-600 hover:bg-slate-100' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
          }`}
        >
          <Instagram className="w-3.5 h-3.5 text-pink-400" />
          <span>Instagram ({igCount.toLocaleString()})</span>
        </button>

        <button
          onClick={() => setSelectedTab('tiktok')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            selectedTab === 'tiktok'
              ? 'bg-cyan-600 text-white shadow'
              : isStitchLight ? 'text-slate-600 hover:bg-slate-100' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
          }`}
        >
          <Video className="w-3.5 h-3.5 text-cyan-400" />
          <span>TikTok ({tkCount.toLocaleString()})</span>
        </button>

        <button
          onClick={() => setSelectedTab('youtube')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            selectedTab === 'youtube'
              ? 'bg-red-600 text-white shadow'
              : isStitchLight ? 'text-slate-600 hover:bg-slate-100' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
          }`}
        >
          <Youtube className="w-3.5 h-3.5 text-red-400" />
          <span>YouTube ({ytSubs.toLocaleString()})</span>
        </button>

        <button
          onClick={() => setSelectedTab('spotify')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            selectedTab === 'spotify'
              ? 'bg-emerald-600 text-white shadow'
              : isStitchLight ? 'text-slate-600 hover:bg-slate-100' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
          }`}
        >
          <Music2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Spotify & Streaming</span>
        </button>
      </div>

      {/* 3. Tab Content */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Strategic Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {growthPlan.overallPillars.map((p, idx) => (
              <div key={idx} className={`p-4 rounded-xl border flex flex-col justify-between ${
                isStitchLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#131313] border-neutral-800 shadow'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                      Pilar Musical {idx + 1}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {p.weightPercentage}% esfuerzo
                    </span>
                  </div>
                  <h4 className={`text-sm font-bold font-display ${isStitchLight ? 'text-slate-900' : 'text-white'}`}>
                    {p.pillar}
                  </h4>
                  <p className="text-xs font-mono text-neutral-400 mt-2 leading-relaxed">
                    {p.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Summary Cards by Channel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {growthPlan.channels.map(channel => {
              const channelCompleted = channel.actionItems.filter(a => completedActions[a.id]).length;
              const channelColor = channel.platform === 'instagram' ? 'text-pink-400 border-pink-500/20 bg-pink-500/5' :
                                   channel.platform === 'tiktok' ? 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5' :
                                   channel.platform === 'youtube' ? 'text-red-400 border-red-500/20 bg-red-500/5' :
                                   'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
              
              return (
                <div key={channel.platform} className={`p-4 rounded-xl border transition-all ${
                  isStitchLight ? 'bg-white border-slate-200' : 'bg-[#131313] border-neutral-800'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {channel.platform === 'instagram' && <Instagram className="w-4 h-4 text-pink-500" />}
                      {channel.platform === 'tiktok' && <Video className="w-4 h-4 text-cyan-400" />}
                      {channel.platform === 'youtube' && <Youtube className="w-4 h-4 text-red-500" />}
                      {channel.platform === 'spotify' && <Music2 className="w-4 h-4 text-emerald-500" />}
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-200">
                        {channel.name}
                      </h4>
                    </div>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${channelColor}`}>
                      {channel.growthStage}
                    </span>
                  </div>

                  <p className="text-xs font-mono text-neutral-300 mb-3 leading-relaxed">
                    {channel.primaryObjective}
                  </p>

                  <div className="space-y-2 mb-4">
                    <span className="text-[10px] font-mono uppercase text-neutral-500 block">Tácticas Clave para la Banda:</span>
                    {channel.actionItems.slice(0, 2).map(action => (
                      <div 
                        key={action.id}
                        onClick={() => toggleActionCompleted(action.id)}
                        className={`p-2.5 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
                          completedActions[action.id] 
                            ? 'bg-emerald-950/20 border-emerald-500/30 line-through opacity-70' 
                            : isStitchLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-neutral-900/50 hover:bg-neutral-900 border-neutral-800'
                        }`}
                      >
                        {completedActions[action.id] ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="text-xs font-mono font-bold text-neutral-200">{action.title}</p>
                          <p className="text-[10px] font-mono text-neutral-400 mt-0.5">{action.kpiTarget}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                    <span className="text-[10px] font-mono text-neutral-400">
                      {channelCompleted} / {channel.actionItems.length} completadas
                    </span>
                    <button
                      onClick={() => setSelectedTab(channel.platform)}
                      className="text-xs font-mono font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ver Estrategia Completa</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly Blueprint Tab */}
      {selectedTab === 'weekly' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <div>
                <h4 className="text-xs font-mono font-bold uppercase text-white">Cronograma Semanal de Publicación Optimizado para Músicos</h4>
                <p className="text-[10px] font-mono text-neutral-400">Diseñado para equilibrar ensayos, grabación y bolos sin quemar a los miembros de la banda.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
            {growthPlan.weeklyBlueprint.map((dayPlan, idx) => (
              <div key={idx} className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-3 ${
                isStitchLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#131313] border-neutral-800'
              }`}>
                <div>
                  <div className="flex items-center justify-between border-b border-neutral-800/60 pb-2 mb-2">
                    <span className="text-xs font-mono font-bold text-white uppercase">{dayPlan.day}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {dayPlan.optimalPostingTime}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase mb-2">
                    {dayPlan.recommendedPlatform === 'instagram' && <span className="text-pink-400 flex items-center gap-1"><Instagram className="w-3 h-3" /> Instagram</span>}
                    {dayPlan.recommendedPlatform === 'tiktok' && <span className="text-cyan-400 flex items-center gap-1"><Video className="w-3 h-3" /> TikTok</span>}
                    {dayPlan.recommendedPlatform === 'youtube' && <span className="text-red-400 flex items-center gap-1"><Youtube className="w-3 h-3" /> YouTube</span>}
                    {dayPlan.recommendedPlatform === 'todas' && <span className="text-amber-400 flex items-center gap-1"><Flame className="w-3 h-3" /> Todas las Redes</span>}
                  </div>

                  <h5 className="text-xs font-bold text-neutral-200 mb-1">{dayPlan.focus}</h5>
                  <p className="text-[10px] font-mono text-neutral-400 leading-relaxed">{dayPlan.contentAction}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Specific Platform View (Instagram / TikTok / YouTube / Spotify) */}
      {currentChannel && selectedTab !== 'overview' && selectedTab !== 'weekly' && (
        <div className="space-y-6">
          {/* Channel Hero Summary */}
          <div className={`p-5 rounded-2xl border ${
            currentChannel.platform === 'instagram' ? 'bg-gradient-to-r from-pink-950/20 to-neutral-900 border-pink-500/30' :
            currentChannel.platform === 'tiktok' ? 'bg-gradient-to-r from-cyan-950/20 to-neutral-900 border-cyan-500/30' :
            currentChannel.platform === 'youtube' ? 'bg-gradient-to-r from-red-950/20 to-neutral-900 border-red-500/30' :
            'bg-gradient-to-r from-emerald-950/20 to-neutral-900 border-emerald-500/30'
          }`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  {currentChannel.platform === 'instagram' && <Instagram className="w-5 h-5 text-pink-500" />}
                  {currentChannel.platform === 'tiktok' && <Video className="w-5 h-5 text-cyan-400" />}
                  {currentChannel.platform === 'youtube' && <Youtube className="w-5 h-5 text-red-500" />}
                  {currentChannel.platform === 'spotify' && <Music2 className="w-5 h-5 text-emerald-500" />}
                  <h3 className="text-base font-bold font-display uppercase tracking-wider text-white">
                    Estrategia para {currentChannel.name}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                    {currentChannel.growthStage}
                  </span>
                </div>
                <p className="text-xs font-mono text-neutral-300 mt-2 max-w-3xl leading-relaxed">
                  {currentChannel.coreStrategy}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-neutral-800 text-right min-w-[200px]">
                <span className="text-[9px] font-mono text-neutral-500 uppercase block">Horario Recomendado</span>
                <span className="text-xs font-mono font-bold text-amber-400 mt-0.5 block">{currentChannel.recommendedSchedule}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Action Items & Tactics Checklist (7 columns) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Checklist de Tácticas & Plan de Acción para la Banda
                </h4>
                <span className="text-[10px] font-mono text-neutral-500">
                  Haz clic para marcar como hecha
                </span>
              </div>

              <div className="space-y-3">
                {currentChannel.actionItems.map(action => {
                  const isDone = completedActions[action.id];
                  const impactColor = action.impact === 'critico' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                      action.impact === 'alto' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                      'bg-blue-500/10 text-blue-400 border-blue-500/20';

                  return (
                    <div
                      key={action.id}
                      onClick={() => toggleActionCompleted(action.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isDone 
                          ? 'bg-emerald-950/20 border-emerald-500/30 opacity-75' 
                          : isStitchLight ? 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm' : 'bg-[#131313] hover:bg-neutral-900 border-neutral-800 shadow'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button className="mt-0.5 shrink-0">
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Circle className="w-5 h-5 text-neutral-600 hover:text-neutral-400" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`text-xs font-bold ${isDone ? 'line-through text-neutral-400' : 'text-neutral-100'}`}>
                              {action.title}
                            </span>
                            <span className={`text-[8px] font-mono uppercase px-1.5 py-0.2 rounded border ${impactColor} font-bold`}>
                              Impacto {action.impact}
                            </span>
                            <span className="text-[8px] font-mono uppercase px-1.5 py-0.2 rounded border border-neutral-800 text-neutral-400">
                              {action.frequency}
                            </span>
                          </div>
                          <p className={`text-[11px] font-mono text-neutral-400 leading-relaxed ${isDone ? 'line-through opacity-70' : ''}`}>
                            {action.description}
                          </p>
                          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                            <Target className="w-3 h-3 shrink-0" />
                            <span>Meta KPI: <b>{action.kpiTarget}</b></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Hooks, Dont's & Viral Concepts (5 columns) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Hook Formulas for Music Content */}
              <div className={`p-4 rounded-xl border ${
                isStitchLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#131313] border-neutral-800'
              }`}>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-3">
                  <Flame className="w-4 h-4" />
                  Ganchos Líricos & Visuales de Alto Impacto
                </h4>
                <div className="space-y-2.5">
                  {currentChannel.hookFormulas.map((hook, hIdx) => (
                    <div key={hIdx} className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80 flex items-start justify-between gap-2 group">
                      <p className="text-xs font-mono text-neutral-300 italic">
                        {hook}
                      </p>
                      <button
                        onClick={() => copyToClipboard(hook, `hook-${hIdx}`)}
                        className="p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all shrink-0 cursor-pointer"
                        title="Copiar gancho"
                      >
                        {copiedHook === `hook-${hIdx}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Viral Concepts for Musician Reels */}
              {currentChannel.viralConcepts && currentChannel.viralConcepts.length > 0 && (
                <div className={`p-4 rounded-xl border ${
                  isStitchLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#131313] border-neutral-800'
                }`}>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 mb-3">
                    <Lightbulb className="w-4 h-4" />
                    Conceptos Virales Adaptados a Tu Sonido
                  </h4>
                  <div className="space-y-3">
                    {currentChannel.viralConcepts.map((v, vIdx) => (
                      <div key={vIdx} className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/20 space-y-1.5">
                        <h5 className="text-xs font-bold text-white">{v.title}</h5>
                        <p className="text-[11px] font-mono text-neutral-300">{v.concept}</p>
                        <div className="text-[10px] font-mono text-amber-300 bg-black/40 p-1.5 rounded">
                          <b>Gancho:</b> {v.hook}
                        </div>
                        <div className="text-[10px] font-mono text-emerald-400">
                          <b>Llamada a la Acción (CTA):</b> {v.callToAction}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errores Críticos a Evitar (Don'ts) */}
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Errores Típicos de Músicos a Evitar
                </h4>
                <ul className="space-y-2 text-xs font-mono text-neutral-300">
                  {currentChannel.donts.map((d, dIdx) => (
                    <li key={dIdx} className="flex items-start gap-2">
                      <span className="text-red-400 shrink-0 mt-0.5">✕</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
