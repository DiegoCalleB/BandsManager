import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { api } from '../../services/api';
import { ModalPortal } from '../common/ModalPortal';
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
 activeCampaign?: any;
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
 fallbackText?: string;
 status:'success' |'error';
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
 activeCampaign
}) => {
 const [providers, setProviders] = useState<AIProviderInfo[]>([]);
 const [selectedProviders, setSelectedProviders] = useState<string[]>(['deepseek','gemini']);
 const [proposals, setProposals] = useState<ProposalItem[]>([]);
 const [isLoading, setIsLoading] = useState(false);
 const [customComment, setCustomComment] = useState('');
 const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
 const [selectedProposalIndex, setSelectedProposalIndex] = useState<number | null>(null);
 const [appliedSuccess, setAppliedSuccess] = useState<string | null>(null);
 const [volumeScale, setVolumeScale] = useState<'1' |'100' |'1000'>('1');
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
 providers: selectedProviders,
 activeCampaign
 });

 if (res.success && res.proposals) {
 setProposals(res.proposals);
 }
 } catch (err: any) {
 console.error('Error generating multi-model pitch:', err);
 alert(`Error al generar propuestas con los modelos seleccionados: ${err.message ||'Verifica la conexión'}`);
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
 const textToApply = proposal.text || proposal.fallbackText ||'';
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
 if (id ==='gemini') return'Google Gemini';
 if (id ==='deepseek') return'DeepSeek V3';
 return id.toUpperCase();
 };

 const getProviderIcon = (id: string) => {
 if (id ==='gemini') return'⚡';
 if (id ==='deepseek') return'🚀';
 return'🤖';
 };

 const getProviderBadge = (id: string) => {
 if (id ==='gemini') return'bg-[var(--acc)]/15 text-[var(--acc)]/70 /30';
 if (id ==='deepseek') return'bg-[var(--acc)]/15 text-[var(--acc)]/30';
 return'bg-[var(--sunken)] text-[var(--ink-2)]700';
 };

 const getFallbackCostEstimate = (provider: string, charCount: number): CostEstimateInfo => {
 const estInTokens = 450;
 const estOutTokens = Math.max(50, Math.ceil(charCount / 3.8));
 const total = estInTokens + estOutTokens;
 let rateIn = 0.10;
 let rateOut = 0.40;
 if (provider ==='deepseek') {
 rateIn = 0.14;
 rateOut = 0.28;
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
 costEurFormatted: `${costEur.toFixed(5).replace('.',',')} €`,
 costPer100EurFormatted: `${(costEur * 100).toFixed(3).replace('.',',')} €`,
 costPer1000EurFormatted: `${(costEur * 1000).toFixed(2).replace('.',',')} €`
 };
 };

 if (!isOpen) return null;

 return (
 <ModalPortal isOpen={isOpen} onClose={onClose}>
 <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-[var(--scrim)]/85 overflow-y-auto overscroll-contain">
 <div className="relative w-full max-w-6xl bg-[var(--surface)] rounded-[var(--r-l)] overflow-hidden flex flex-col max-h-[94vh] my-auto">
 
 {/* HEADER */}
 <div className="px-5 py-3.5800 flex items-center justify-between bg-[var(--surface)]/95 sticky top-0 z-10">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--acc)]/15 flex items-center justify-center text-[var(--acc)]">
 <Layers className="w-5 h-5" />
 </div>
 <div>
 <div className="flex items-center gap-2 flex-wrap">
 <h2 className="text-base font-bold text-[var(--ink)] font-display">
 Comparador A/B: DeepSeek 🚀 vs. Gemini ⚡
 </h2>
 <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--acc)]/20 text-[var(--acc)]/70">
 A/B Testing + Costes Reales (€)
 </span>
 </div>
 <p className="text-xs text-[var(--ink-2)] font-sans">
 Evalúa en paralelo la calidad de redacción, el tiempo de respuesta y el <strong>coste económico real en céntimos de euro</strong> por propuesta.
 </p>
 </div>
 </div>

 <button
 onClick={onClose}
 className="p-2 text-[var(--ink-2)] hover:text-[var(--ink)] rounded-[var(--r-s)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* CONTROLS & VENUE BAR */}
 <div className="p-4 bg-[var(--bg)]800/80 space-y-3">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
 {/* Venue Badge */}
 <div className="flex items-center gap-2 text-xs">
 <span className="text-[var(--ink-2)] font-sans text-[11px]">SALA DESTINO:</span>
 <span className="px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--bg)]700 text-[var(--acc)]/70 font-bold">
 🏟️ {lead.nombre_sala} ({lead.ciudad ||'España'})
 </span>
 <span className="text-[var(--ink-2)] text-[11px]">
 • Tipo: {lead.tipo ||'sala'} • Aforo: {lead.aforo ||'N/D'}
 </span>
 </div>

 {/* Provider Selector Badges */}
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="text-[11px] text-[var(--ink-2)] mr-1 font-sans">Motores activos:</span>
 {[
 { id:'deepseek', name:'DeepSeek V3', icon:'🚀' },
 { id:'gemini', name:'Gemini 3.7 Flash', icon:'⚡' }
 ].map(prov => {
 const isSelected = selectedProviders.includes(prov.id);
 return (
 <button
 key={prov.id}
 type="button"
 onClick={() => handleToggleProvider(prov.id)}
 className={`px-2.5 py-1 rounded-[var(--r-s)] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
 isSelected
 ?'bg-[var(--acc)]/20 text-[var(--acc)]/70 /50'
 :'bg-[var(--bg)]/60 text-[var(--ink-2)]800 hover:border-[var(--hair)]700'
 }`}
 >
 <span>{prov.icon}</span>
 <span>{prov.name}</span>
 {isSelected && <Check className="w-3 h-3 text-[var(--acc)] ml-0.5" />}
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
 placeholder="Ajuste puntual opcional: Ej.'Destacar que tenemos 100k streams','Proponer viernes o sábado'..."
 className="w-full px-3 py-2 bg-[var(--sunken)] rounded-[var(--r-m)]700 text-xs text-[var(--ink)] placeholder-[var(--ink-2)] font-sans focus:outline-none focus:"
 onKeyDown={e => {
 if (e.key ==='Enter') handleRunComparison();
 }}
 />
 </div>

 <button
 onClick={handleRunComparison}
 disabled={isLoading || selectedProviders.length === 0}
 className="px-4 py-2 bg-[var(--acc)] hover:bg-[var(--acc)]/60 disabled:opacity-50 text-[var(--ink)] font-bold rounded-[var(--r-m)] text-xs flex items-center justify-center gap-2 cursor-pointer transition-all font-sans shrink-0"
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
 <div className="px-4 py-3 bg-gradient-to-r from-[var(--surface)] via-[var(--bg)] to-[var(--surface)]800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div className="flex items-center gap-2">
 <Coins className="w-4 h-4 text-[var(--ok)] shrink-0" />
 <div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-[var(--ink)]">
 Calculadora de Inversión y Coste por Envío:
 </span>
 <span className="text-[10px] px-1.5 py-0.2 bg-[var(--ok)]/10 text-[var(--ink-2)] rounded font-sans">
 Tarifas Oficiales 2025/2026
 </span>
 </div>
 <p className="text-[10px] text-[var(--ink-2)]">
 Calculado sobre tokens de entrada (ADN banda + sala) y salida (cuerpo de email redactado).
 </p>
 </div>
 </div>

 <div className="flex items-center gap-1 bg-[var(--sunken)] p-1 rounded-[var(--r-m)]800 self-start sm:self-auto">
 <span className="text-[10px] text-[var(--ink-2)] px-2 font-sans">Escala:</span>
 <button
 type="button"
 onClick={() => setVolumeScale('1')}
 className={`px-2.5 py-1 rounded-[var(--r-s)] text-[10px] font-bold cursor-pointer transition-all ${
 volumeScale ==='1'
 ?'bg-[var(--acc)] text-[var(--on-acc)]'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 1 Pitch
 </button>
 <button
 type="button"
 onClick={() => setVolumeScale('100')}
 className={`px-2.5 py-1 rounded-[var(--r-s)] text-[10px] font-bold cursor-pointer transition-all ${
 volumeScale ==='100'
 ?'bg-[var(--acc)] text-[var(--on-acc)]'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 100 Salas (1 Gira)
 </button>
 <button
 type="button"
 onClick={() => setVolumeScale('1000')}
 className={`px-2.5 py-1 rounded-[var(--r-s)] text-[10px] font-bold cursor-pointer transition-all ${
 volumeScale ==='1000'
 ?'bg-[var(--acc)] text-[var(--on-acc)]'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 1.000 Salas (Campaña Nacional)
 </button>
 </div>
 </div>

 {/* NOTIFICATION */}
 {appliedSuccess && (
 <div className="mx-4 mt-3 p-3 bg-[var(--ok)]/20 rounded-[var(--r-m)] text-[var(--ink-2)] text-xs font-medium flex items-center gap-2 animate-fadeIn">
 <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--ok)]" />
 <span>{appliedSuccess}</span>
 </div>
 )}

 {/* COMPARISON GRID */}
 <div className="p-4 flex-1 overflow-y-auto space-y-4">
 {isLoading ? (
 <div className="py-16 text-center space-y-4">
 <div className="inline-flex items-center justify-center p-4 bg-[var(--acc)]/10 rounded-[var(--r-l)]">
 <Loader2 className="w-8 h-8 animate-spin text-[var(--acc)]" />
 </div>
 <div>
 <h3 className="text-sm font-bold text-[var(--ink)]">Calculando propuestas y costes en paralelo...</h3>
 <p className="text-xs text-[var(--ink-2)] mt-1 max-w-md mx-auto">
 Enviando el mismo contexto a DeepSeek V3 y Google Gemini para medir persuasión, latencia y coste por token en paralelo.
 </p>
 </div>
 </div>
 ) : proposals.length === 0 ? (
 <div className="py-16 text-center space-y-3 text-[var(--ink-2)]">
 <Sparkles className="w-8 h-8 mx-auto text-[var(--ink-2)]" />
 <p className="text-xs">Haz clic en"Generar y Comparar Propuestas" para ver las opciones A/B y sus costes detallados.</p>
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
 let scaleLabel ='por este email';
 if (volumeScale ==='100') {
 displayCost = cost.costPer100EurFormatted;
 scaleLabel ='para 100 salas';
 } else if (volumeScale ==='1000') {
 displayCost = cost.costPer1000EurFormatted;
 scaleLabel ='para 1.000 salas';
 }

 const isDeepSeek = prop.provider ==='deepseek';
 const isGemini = prop.provider ==='gemini';

 return (
 <div
 key={prop.provider + idx}
 className={`flex flex-col rounded-[var(--r-m)] transition-all duration-200 ${
 isSelected
 ?'bg-[var(--surface)]/80 ring-1 ring-emerald-500/40'
 :'bg-[var(--surface)]800 hover:border-[var(--hair)]700'
 }`}
 >
 {/* Model Header */}
 <div className="p-3.5800/80 flex items-center justify-between bg-[var(--sunken)] rounded-t-xl">
 <div className="flex items-center gap-2">
 <span className="text-lg">{getProviderIcon(prop.provider)}</span>
 <div>
 <div className="flex items-center gap-1.5">
 <span className="text-xs font-bold text-[var(--ink)]">
 {getProviderDisplayName(prop.provider)}
 </span>
 <span className={`text-[9px] px-1.5 py-0.5 rounded font-sans font-semibold ${getProviderBadge(prop.provider)}`}>
 {isDeepSeek ?'🚀 Más Económico' :'⚡ Instantáneo'}
 </span>
 </div>
 <p className="text-[10px] text-[var(--ink-2)] font-sans">
 {prop.modelName} {prop.durationMs > 0 && `• ${prop.durationMs}ms`}
 </p>
 </div>
 </div>

 <button
 type="button"
 onClick={() => handleCopyText(prop.text, idx)}
 disabled={prop.status ==='error'}
 className="p-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] rounded-[var(--r-s)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
 title="Copiar propuesta"
 >
 {isCopied ? <Check className="w-3.5 h-3.5 text-[var(--ok)]" /> : <Copy className="w-3.5 h-3.5" />}
 </button>
 </div>

 {/* Cost & Economics Card Banner */}
 <div className="px-3.5 py-2.5 bg-[var(--sunken)]800/70 flex items-center justify-between text-xs">
 <div>
 <div className="flex items-center gap-1.5">
 <Coins className="w-3.5 h-3.5 text-[var(--ok)]" />
 <span className="font-bold text-[var(--ink-2)] font-sans text-sm">
 {displayCost}
 </span>
 <span className="text-[10px] text-[var(--ink-2)] font-sans">
 ({scaleLabel})
 </span>
 </div>
 <div className="text-[9px] text-[var(--ink-2)] font-sans mt-0.5">
 Tokens: {cost.inputTokens} in / {cost.outputTokens} out (Total: {cost.totalTokens})
 </div>
 </div>

 <div className="text-right">
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
 isDeepSeek
 ?'bg-[var(--ok)]/15 text-[var(--ink-2)]/30'
 :'bg-[var(--acc)]/15 text-[var(--acc)]/70 /30'
 }`}>
 {isDeepSeek ?'10x más barato' :'Ultra rápido'}
 </span>
 </div>
 </div>

 {/* Proposal Body */}
 <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
 {prop.status ==='error' ? (
 <div className="space-y-2.5">
 <div className="p-2.5 bg-[var(--acc)]/10 rounded-[var(--r-m)] text-[var(--ink)] text-xs flex items-start gap-2">
 <AlertCircle className="w-4 h-4 shrink-0 text-[var(--acc)] mt-0.5" />
 <div>
 <p className="font-bold text-[var(--acc)]/70">Aviso de Cuota / Saldo API</p>
 <p className="text-[11px] text-[var(--ink-2)] mt-0.5">{prop.error}</p>
 </div>
 </div>
 {prop.fallbackText && (
 <div className="space-y-1">
 <div className="flex items-center justify-between text-[10px] text-[var(--ink-2)] font-sans">
 <span>⚡ Borrador Inteligente Adaptado (Modo Local):</span>
 </div>
 <div className="p-3 bg-[var(--sunken)] rounded-[var(--r-m)] text-xs text-[var(--ink)] font-sans whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
 {prop.fallbackText}
 </div>
 </div>
 )}
 </div>
 ) : (
 <div className="p-3 bg-[var(--sunken)] rounded-[var(--r-m)] text-xs text-[var(--ink)] font-sans whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
 {prop.text}
 </div>
 )}

 {/* Footer Metrics & Selection Button */}
 <div className="pt-2800/60 space-y-2">
 <div className="flex items-center justify-between text-[10px] text-[var(--ink-2)] font-sans">
 <span>{wordCount} palabras ({charCount} car.)</span>
 {isDeepSeek ? (
 <span className="text-[var(--acc)]">Tono: Directo y comercial</span>
 ) : (
 <span className="text-[var(--acc)]/70">Tono: Ágil y contextual</span>
 )}
 </div>

 <button
 type="button"
 onClick={() => handleChooseProposal(prop, idx)}
 disabled={!prop.text && !prop.fallbackText}
 className={`w-full py-2 px-3 rounded-[var(--r-m)] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
 isSelected
 ?'bg-[var(--ok)] text-[var(--ink)]'
 :'bg-[var(--acc)]/15 hover:bg-[var(--acc)]/25 text-[var(--acc)]/70 hover:/60'
 }`}
 >
 {isSelected ? (
 <>
 <CheckCircle2 className="w-3.5 h-3.5" />
 <span>¡Propuesta Elegida!</span>
 </>
 ) : (
 <>
 <span>{prop.status ==='error' && prop.fallbackText ?'Elegir borrador local adaptado' :'Elegir esta propuesta'}</span>
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
 <div className="mt-4 p-3.5 bg-[var(--sunken)] rounded-[var(--r-m)] text-xs space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-[11px] font-bold text-[var(--ink-2)] tracking-wider flex items-center gap-1.5 font-sans">
 <Calculator className="w-3.5 h-3.5 text-[var(--acc)]" />
 Resumen de Costes & ROI para la Banda
 </span>
 <span className="text-[10px] text-[var(--ink-2)] font-sans">
 1 USD ≈ 0.925 EUR
 </span>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left text-[11px]">
 <thead>
 <tr className="border-b800 text-[var(--ink-2)] font-sans">
 <th className="py-1.5 px-2">Modelo</th>
 <th className="py-1.5 px-2">Entrada (1M tok)</th>
 <th className="py-1.5 px-2">Salida (1M tok)</th>
 <th className="py-1.5 px-2">Coste 1 Pitch</th>
 <th className="py-1.5 px-2 font-bold text-[var(--acc)]/70">Coste 100 Salas</th>
 <th className="py-1.5 px-2 font-bold text-[var(--ok)]">Coste 1.000 Salas</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-neutral-800/50 font-sans text-[var(--ink-2)]">
 <tr className="hover:bg-[var(--surface)]/40">
 <td className="py-1.5 px-2 font-bold text-[var(--acc)] flex items-center gap-1">
 <span>🚀</span> DeepSeek V3
 </td>
 <td className="py-1.5 px-2 font-sans text-[var(--ink-2)]">0,14 $ (0,13 €)</td>
 <td className="py-1.5 px-2 font-sans text-[var(--ink-2)]">0,28 $ (0,26 €)</td>
 <td className="py-1.5 px-2 font-sans font-bold text-[var(--ok)]">~0,00014 €</td>
 <td className="py-1.5 px-2 font-sans font-bold text-[var(--acc)]/70">~0,014 €</td>
 <td className="py-1.5 px-2 font-sans font-bold text-[var(--ok)]">~0,14 € (Máximo ROI)</td>
 </tr>
 <tr className="hover:bg-[var(--surface)]/40">
 <td className="py-1.5 px-2 font-bold text-[var(--acc)] flex items-center gap-1">
 <span>⚡</span> Google Gemini 3.7 Flash
 </td>
 <td className="py-1.5 px-2 font-sans text-[var(--ink-2)]">0,10 $ (0,09 €)</td>
 <td className="py-1.5 px-2 font-sans text-[var(--ink-2)]">0,40 $ (0,37 €)</td>
 <td className="py-1.5 px-2 font-sans font-bold text-[var(--ok)]">~0,00018 €</td>
 <td className="py-1.5 px-2 font-sans font-bold text-[var(--acc)]/70">~0,018 €</td>
 <td className="py-1.5 px-2 font-sans font-bold text-[var(--acc)]/70">~0,18 € (o 0 € con Free Tier)</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {/* FOOTER INFO BAR */}
 <div className="px-5 py-3800 bg-[var(--surface)] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--ink-2)]">
 <div className="flex items-center gap-2">
 <ShieldCheck className="w-4 h-4 text-[var(--acc)]" />
 <span>
 <strong>Human-in-the-Loop:</strong> Tú tienes el control total. La propuesta elegida se guarda en el CRM y no se enviará sin tu aprobación expresa.
 </span>
 </div>

 <button
 type="button"
 onClick={onClose}
 className="px-3 py-1 bg-[var(--sunken)] hover:bg-[var(--ink-3)]/60 text-[var(--ink-2)] rounded-[var(--r-s)] text-xs cursor-pointer font-sans"
 >
 Cerrar
 </button>
 </div>

 </div>
 </div>
 </ModalPortal>
);
};
