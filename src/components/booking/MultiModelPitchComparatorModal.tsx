import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { api } from '../../services/api';
import {
  X,
  Sparkles,
  Zap,
  CheckCircle2,
  Copy,
  RefreshCw,
  Loader2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertCircle,
  Coins,
  TrendingDown,
  Calculator,
  HelpCircle
} from 'lucide-react';

interface MultiModelPitchComparatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onSelectProposal: (text: string, providerName: string) => void;
  isStitchLight?: boolean;
}

interface CostEstimateInfo {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  ratePer1MInputUsd: number;
  ratePer1MOutputUsd: number;
  costUsd: number;
  costEur: number;
  costEurFormatted: string;
  costPer100EurFormatted: string;
  costPer1000EurFormatted: string;
}

interface ProposalItem {
  provider: string;
  modelName: string;
  text: string;
  status: 'success' | 'error';
  durationMs: number;
  error?: string;
  costEstimate?: CostEstimateInfo;
}

interface AIProviderInfo {
  id: string;
  name: string;
  shortName: string;
  model: string;
  tagline: string;
  description: string;
  icon: string;
  configured: boolean;
  tier: string;
  badge?: string;
  pricing?: {
    inputPer1MUsd: number;
    outputPer1MUsd: number;
    costPer1000Eur: string;
    rank: string;
  };
}

export const MultiModelPitchComparatorModal: React.FC<MultiModelPitchComparatorModalProps> = ({
  isOpen,
  onClose,
  lead,
  onSelectProposal,
  isStitchLight = false
}) => {
  const [providers, setProviders] = useState<AIProviderInfo[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>(['deepseek', 'gemini']);
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customComment, setCustomComment] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedProposalIndex, setSelectedProposalIndex] = useState<number | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState<string | null>(null);
  const [volumeScale, setVolumeScale] = useState<'1' | '100' | '1000'>('1');
  const [showCostBreakdown, setShowCostBreakdown] = useState(true);

  // Load providers on mount
  useEffect(() => {
    if (!isOpen) return;

    api.getAIProviders()
      .then(res => {
        if (res.success && res.providers) {
          setProviders(res.providers);
        }
      })
      .catch(err => {
        console.warn('Error fetching AI providers:', err);
      });

    // Run initial parallel comparison if no proposals yet
    if (proposals.length === 0) {
      handleRunComparison();
    }
  }, [isOpen, lead.id]);

  const handleToggleProvider = (id: string) => {
    setSelectedProviders(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // keep at least one
        return prev.filter(p => p !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleRunComparison = async () => {
    setIsLoading(true);
    setAppliedSuccess(null);
    setSelectedProposalIndex(null);

    try {
      const res = await api.generateMultiPitch(lead.id, {
        comentario: customComment || undefined,
        providers: selectedProviders
      });

      if (res.success && res.proposals) {
        setProposals(res.proposals);
      }
    } catch (err: any) {
      console.error('Error generating multi-model pitch:', err);
      alert(`Error al generar propuestas con los modelos seleccionados: ${err.message || 'Verifica la conexión'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleChooseProposal = (proposal: ProposalItem, index: number) => {
    const textToApply = proposal.text || proposal.fallbackText || '';
    if (!textToApply) return;
    setSelectedProposalIndex(index);
    onSelectProposal(textToApply, proposal.provider);
    setAppliedSuccess(`¡Propuesta de ${getProviderDisplayName(proposal.provider)} seleccionada y asignada con éxito!`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const getProviderDisplayName = (id: string) => {
    const found = providers.find(p => p.id === id);
    if (found) return found.shortName;
    if (id === 'gemini') return 'Google Gemini';
    if (id === 'deepseek') return 'DeepSeek V3';
    if (id === 'claude') return 'Claude 3.5 Haiku';
    return id.toUpperCase();
  };

  const getProviderIcon = (id: string) => {
    if (id === 'gemini') return '⚡';
    if (id === 'deepseek') return '🚀';
    if (id === 'claude') return '✨';
    return '🤖';
  };

  const getProviderBadge = (id: string) => {
    if (id === 'gemini') return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    if (id === 'deepseek') return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
    if (id === 'claude') return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
    return 'bg-zinc-800 text-zinc-300 border-zinc-700';
  };

  const getFallbackCostEstimate = (provider: string, charCount: number): CostEstimateInfo => {
    const estInTokens = 450;
    const estOutTokens = Math.max(50, Math.ceil(charCount / 3.8));
    const total = estInTokens + estOutTokens;
    let rateIn = 0.10;
    let rateOut = 0.40;
    if (provider === 'deepseek') {
      rateIn = 0.14;
      rateOut = 0.28;
    } else if (provider === 'claude') {
      rateIn = 0.80;
      rateOut = 4.00;
    }
    const costUsd = ((estInTokens / 1_000_000) * rateIn) + ((estOutTokens / 1_000_000) * rateOut);
    const costEur = costUsd / 1.08;
    return {
      inputTokens: estInTokens,
      outputTokens: estOutTokens,
      totalTokens: total,
      ratePer1MInputUsd: rateIn,
      ratePer1MOutputUsd: rateOut,
      costUsd,
      costEur,
      costEurFormatted: `${costEur.toFixed(5).replace('.', ',')} €`,
      costPer100EurFormatted: `${(costEur * 100).toFixed(3).replace('.', ',')} €`,
      costPer1000EurFormatted: `${(costEur * 1000).toFixed(2).replace('.', ',')} €`
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-[#141312] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] my-auto">
        
        {/* HEADER */}
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between bg-[#191817]/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-zinc-100 font-display">
                  Comparador A/B: DeepSeek 🚀 vs. Gemini ⚡
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  A/B Testing + Costes Reales (€)
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans">
                Evalúa en paralelo la calidad de redacción, el tiempo de respuesta y el <strong>coste económico real en céntimos de euro</strong> por propuesta.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTROLS & VENUE BAR */}
        <div className="p-4 bg-[#11100f] border-b border-zinc-800/80 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Venue Badge */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400 font-mono text-[11px]">SALA DESTINO:</span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-amber-300 font-bold">
                🏟️ {lead.nombre_sala} ({lead.ciudad || 'España'})
              </span>
              <span className="text-zinc-500 text-[11px]">
                • Tipo: {lead.tipo || 'sala'} • Aforo: {lead.aforo || 'N/D'}
              </span>
            </div>

            {/* Provider Selector Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-zinc-400 mr-1 font-mono">Motores activos:</span>
              {[
                { id: 'deepseek', name: 'DeepSeek V3', icon: '🚀' },
                { id: 'gemini', name: 'Gemini 3.7 Flash', icon: '⚡' }
              ].map(prov => {
                const isSelected = selectedProviders.includes(prov.id);
                return (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => handleToggleProvider(prov.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-zinc-900/60 text-zinc-500 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <span>{prov.icon}</span>
                    <span>{prov.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-amber-400 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt adjustments */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={customComment}
                onChange={e => setCustomComment(e.target.value)}
                placeholder="Ajuste puntual opcional: Ej. 'Destacar que tenemos 100k streams', 'Proponer viernes o sábado'..."
                className="w-full px-3 py-2 bg-black/60 rounded-xl border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 font-sans focus:outline-none focus:border-amber-400"
                onKeyDown={e => {
                  if (e.key === 'Enter') handleRunComparison();
                }}
              />
            </div>

            <button
              onClick={handleRunComparison}
              disabled={isLoading || selectedProviders.length === 0}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all font-sans shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Consultando modelos en paralelo...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Generar y Comparar Propuestas</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* COMPARATIVA DE COSTES ECONÓMICOS / PROYECCIÓN DE GASTO */}
        <div className="px-4 py-3 bg-gradient-to-r from-[#171614] via-[#121110] to-[#181715] border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-200">
                  Calculadora de Inversión y Coste por Envío:
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded font-mono">
                  Tarifas Oficiales 2025/2026
                </span>
              </div>
              <p className="text-[10px] text-zinc-400">
                Calculado sobre tokens de entrada (ADN banda + sala) y salida (cuerpo de email redactado).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
            <span className="text-[10px] text-zinc-500 px-2 font-mono uppercase">Escala:</span>
            <button
              type="button"
              onClick={() => setVolumeScale('1')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                volumeScale === '1'
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              1 Pitch
            </button>
            <button
              type="button"
              onClick={() => setVolumeScale('100')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                volumeScale === '100'
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              100 Salas (1 Gira)
            </button>
            <button
              type="button"
              onClick={() => setVolumeScale('1000')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                volumeScale === '1000'
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              1.000 Salas (Campaña Nacional)
            </button>
          </div>
        </div>

        {/* NOTIFICATION */}
        {appliedSuccess && (
          <div className="mx-4 mt-3 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{appliedSuccess}</span>
          </div>
        )}

        {/* COMPARISON GRID */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="py-16 text-center space-y-4">
              <div className="inline-flex items-center justify-center p-4 bg-amber-500/10 rounded-2xl border border-amber-500/30">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100">Calculando propuestas y costes en paralelo...</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                  Enviando el mismo contexto a DeepSeek V3 y Google Gemini para medir persuasión, latencia y coste por token en paralelo.
                </p>
              </div>
            </div>
          ) : proposals.length === 0 ? (
            <div className="py-16 text-center space-y-3 text-zinc-500">
              <Sparkles className="w-8 h-8 mx-auto text-zinc-600" />
              <p className="text-xs">Haz clic en "Generar y Comparar Propuestas" para ver las opciones A/B y sus costes detallados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              {proposals.map((prop, idx) => {
                const isSelected = selectedProposalIndex === idx;
                const isCopied = copiedIndex === idx;
                const charCount = prop.text.length;
                const wordCount = prop.text.split(/\s+/).filter(Boolean).length;
                const cost = prop.costEstimate || getFallbackCostEstimate(prop.provider, charCount);

                // Cost for volume scale
                let displayCost = cost.costEurFormatted;
                let scaleLabel = 'por este email';
                if (volumeScale === '100') {
                  displayCost = cost.costPer100EurFormatted;
                  scaleLabel = 'para 100 salas';
                } else if (volumeScale === '1000') {
                  displayCost = cost.costPer1000EurFormatted;
                  scaleLabel = 'para 1.000 salas';
                }

                const isDeepSeek = prop.provider === 'deepseek';
                const isClaude = prop.provider === 'claude';
                const isGemini = prop.provider === 'gemini';

                return (
                  <div
                    key={prop.provider + idx}
                    className={`flex flex-col rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? 'bg-[#1e1c19] border-emerald-500/80 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                        : 'bg-[#161514] border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {/* Model Header */}
                    <div className="p-3.5 border-b border-zinc-800/80 flex items-center justify-between bg-black/30 rounded-t-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getProviderIcon(prop.provider)}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-zinc-100">
                              {getProviderDisplayName(prop.provider)}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono font-semibold ${getProviderBadge(prop.provider)}`}>
                              {isDeepSeek ? '🚀 Más Económico' : isGemini ? '⚡ Instantáneo' : '✨ Top Redactor'}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 font-mono">
                            {prop.modelName} {prop.durationMs > 0 && `• ${prop.durationMs}ms`}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyText(prop.text, idx)}
                        disabled={prop.status === 'error'}
                        className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Copiar propuesta"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Cost & Economics Card Banner */}
                    <div className="px-3.5 py-2.5 bg-black/40 border-b border-zinc-800/70 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Coins className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-bold text-emerald-300 font-mono text-sm">
                            {displayCost}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-sans">
                            ({scaleLabel})
                          </span>
                        </div>
                        <div className="text-[9px] text-zinc-500 font-mono mt-0.5">
                          Tokens: {cost.inputTokens} in / {cost.outputTokens} out (Total: {cost.totalTokens})
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          isDeepSeek
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : isGemini
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                        }`}>
                          {isDeepSeek ? '10x más barato' : isGemini ? 'Ultra rápido' : 'Premium'}
                        </span>
                      </div>
                    </div>

                    {/* Proposal Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      {prop.status === 'error' ? (
                        <div className="space-y-2.5">
                          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                            <div>
                              <p className="font-bold text-amber-300">Aviso de Cuota / Saldo API</p>
                              <p className="text-[11px] text-zinc-300 mt-0.5">{prop.error}</p>
                            </div>
                          </div>
                          {prop.fallbackText && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                                <span>⚡ Borrador Inteligente Adaptado (Modo Local):</span>
                              </div>
                              <div className="p-3 bg-[#0d0c0c] rounded-xl border border-zinc-800/80 text-xs text-zinc-200 font-sans whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                                {prop.fallbackText}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 bg-[#0d0c0c] rounded-xl border border-zinc-800/80 text-xs text-zinc-200 font-sans whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                          {prop.text}
                        </div>
                      )}

                      {/* Footer Metrics & Selection Button */}
                      <div className="pt-2 border-t border-zinc-800/60 space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                          <span>{wordCount} palabras ({charCount} car.)</span>
                          {isClaude ? (
                            <span className="text-purple-300">Tono: Cálido y humano</span>
                          ) : isDeepSeek ? (
                            <span className="text-sky-300">Tono: Directo y comercial</span>
                          ) : (
                            <span className="text-amber-300">Tono: Ágil y contextual</span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleChooseProposal(prop, idx)}
                          disabled={!prop.text && !prop.fallbackText}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                              : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 hover:border-amber-500/60'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>¡Propuesta Elegida!</span>
                            </>
                          ) : (
                            <>
                              <span>{prop.status === 'error' && prop.fallbackText ? 'Elegir borrador local adaptado' : 'Elegir esta propuesta'}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TABLA COMPARATIVA DE RENTABILIDAD & TARIFAS */}
          <div className="mt-4 p-3.5 bg-black/50 rounded-xl border border-zinc-800/90 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Calculator className="w-3.5 h-3.5 text-amber-400" />
                Resumen de Costes & ROI para la Banda
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                1 USD ≈ 0.925 EUR
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 font-mono">
                    <th className="py-1.5 px-2">Modelo</th>
                    <th className="py-1.5 px-2">Entrada (1M tok)</th>
                    <th className="py-1.5 px-2">Salida (1M tok)</th>
                    <th className="py-1.5 px-2">Coste 1 Pitch</th>
                    <th className="py-1.5 px-2 font-bold text-amber-300">Coste 100 Salas</th>
                    <th className="py-1.5 px-2 font-bold text-emerald-400">Coste 1.000 Salas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 font-sans text-zinc-300">
                  <tr className="hover:bg-zinc-900/40">
                    <td className="py-1.5 px-2 font-bold text-sky-400 flex items-center gap-1">
                      <span>🚀</span> DeepSeek V3
                    </td>
                    <td className="py-1.5 px-2 font-mono text-zinc-400">0,14 $ (0,13 €)</td>
                    <td className="py-1.5 px-2 font-mono text-zinc-400">0,28 $ (0,26 €)</td>
                    <td className="py-1.5 px-2 font-mono font-bold text-emerald-400">~0,00014 €</td>
                    <td className="py-1.5 px-2 font-mono font-bold text-amber-300">~0,014 €</td>
                    <td className="py-1.5 px-2 font-mono font-bold text-emerald-400">~0,14 € (Máximo ROI)</td>
                  </tr>
                  <tr className="hover:bg-zinc-900/40">
                    <td className="py-1.5 px-2 font-bold text-amber-400 flex items-center gap-1">
                      <span>⚡</span> Google Gemini 3.7 Flash
                    </td>
                    <td className="py-1.5 px-2 font-mono text-zinc-400">0,10 $ (0,09 €)</td>
                    <td className="py-1.5 px-2 font-mono text-zinc-400">0,40 $ (0,37 €)</td>
                    <td className="py-1.5 px-2 font-mono font-bold text-emerald-400">~0,00018 €</td>
                    <td className="py-1.5 px-2 font-mono font-bold text-amber-300">~0,018 €</td>
                    <td className="py-1.5 px-2 font-mono font-bold text-amber-300">~0,18 € (o 0 € con Free Tier)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FOOTER INFO BAR */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-[#161514] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>
              <strong>Human-in-the-Loop:</strong> Tú tienes el control total. La propuesta elegida se guarda en el CRM y no se enviará sin tu aprobación expresa.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs cursor-pointer font-sans"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
