import React, { useState } from 'react';
import { Sparkles, CheckCircle2, XCircle, Lightbulb, Compass, MessageSquarePlus, ChevronDown, ChevronUp, Wand2 } from 'lucide-react';
import type { TemplateCategory } from './TemplateConfigSection';
import { CATEGORY_RECOMMENDATIONS } from '../../data/templateRecommendations';

interface TemplateRecommendationsCardProps {
  category: TemplateCategory;
  isStitchLight?: boolean;
  onApplyPromptImprovement: (promptText: string) => void;
  isOptimizing?: boolean;
}

export function TemplateRecommendationsCard({
  category,
  isStitchLight,
  onApplyPromptImprovement,
  isOptimizing,
  onClose,
}: TemplateRecommendationsCardProps & { onClose?: () => void }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const rec = CATEGORY_RECOMMENDATIONS[category] || CATEGORY_RECOMMENDATIONS.salas;

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-200 ${
        isStitchLight
          ? 'bg-amber-50/70 border-amber-200 text-stone-900 shadow-sm'
          : 'bg-[#181510] border-amber-500/30 text-amber-100 shadow-md'
      }`}
    >
      {/* Header with category badge & toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`p-1.5 rounded-lg flex items-center justify-center shrink-0 ${
              isStitchLight ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
            }`}
          >
            <Compass className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold uppercase tracking-wide text-amber-400">Recomendaciones del Agente</span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isStitchLight ? 'bg-amber-200 text-amber-900' : 'bg-amber-400/15 text-amber-300 border border-amber-400/20'
                }`}
              >
                {rec.badge}
              </span>
            </div>
            <p className={`text-[11px] font-sans truncate ${isStitchLight ? 'text-stone-600' : 'text-amber-200/80'}`}>{rec.tagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onApplyPromptImprovement(rec.quickImprovePrompt)}
            disabled={isOptimizing}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95 disabled:opacity-50 ${
              isStitchLight
                ? 'bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold'
                : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black'
            }`}
            title="Aplica la recomendación del agente y re-redacta la plantilla y pautas con IA"
          >
            <Wand2 className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>{isOptimizing ? 'Mejorando...' : 'Aplicar recomendación con IA'}</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                isStitchLight ? 'hover:bg-amber-200/50 text-stone-600' : 'hover:bg-white/10 text-neutral-400'
              }`}
              title="Cerrar recomendaciones"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 pt-3.5 border-t border-amber-500/20 space-y-3.5 animate-in fade-in duration-200">
          {/* Quick AI Tip / Secret */}
          <div
            className={`p-2.5 rounded-lg flex items-start gap-2 text-[11px] leading-relaxed ${
              isStitchLight ? 'bg-white text-stone-800 border border-amber-200' : 'bg-black/40 text-amber-200/90 border border-amber-500/20'
            }`}
          >
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-400 mr-1">Regla clave del Agente:</strong>
              <span>{rec.aiSecretTip}</span>
            </div>
          </div>

          {/* Dos and Don'ts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* DOs */}
            <div
              className={`p-3 rounded-lg border space-y-1.5 ${
                isStitchLight ? 'bg-emerald-50/70 border-emerald-200' : 'bg-emerald-950/20 border-emerald-500/30'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Buenas prácticas para {category}</span>
              </div>
              <ul className="space-y-1 text-[10px] leading-normal text-emerald-200/90 list-disc list-inside">
                {rec.dos.map((item, idx) => (
                  <li key={`do-${idx}`} className="list-none flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* DON'Ts */}
            <div
              className={`p-3 rounded-lg border space-y-1.5 ${
                isStitchLight ? 'bg-rose-50/70 border-rose-200' : 'bg-rose-950/20 border-rose-500/30'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Qué evitar obligatoriamente</span>
              </div>
              <ul className="space-y-1 text-[10px] leading-normal text-rose-200/90 list-disc list-inside">
                {rec.donts.map((item, idx) => (
                  <li key={`dont-${idx}`} className="list-none flex items-start gap-1.5">
                    <span className="text-rose-400 font-bold shrink-0">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Formula Blocks: Opening, Hooks, Call to Action */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[10px]">
            <div
              className={`p-2.5 rounded-lg border space-y-1 ${
                isStitchLight ? 'bg-white border-amber-200' : 'bg-black/30 border-amber-500/20'
              }`}
            >
              <span className="font-bold text-amber-400 flex items-center gap-1 uppercase tracking-wider text-[9px]">
                🎯 Apertura Recomendada
              </span>
              <p className="italic text-[10px] opacity-90">{rec.bestOpening}</p>
            </div>

            <div
              className={`p-2.5 rounded-lg border space-y-1 ${
                isStitchLight ? 'bg-white border-amber-200' : 'bg-black/30 border-amber-500/20'
              }`}
            >
              <span className="font-bold text-amber-400 flex items-center gap-1 uppercase tracking-wider text-[9px]">⚡ Ganchos Clave</span>
              <ul className="space-y-0.5">
                {rec.keyHooks.map((hook, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <span className="text-amber-400">•</span>
                    <span>{hook}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className={`p-2.5 rounded-lg border space-y-1 ${
                isStitchLight ? 'bg-white border-amber-200' : 'bg-black/30 border-amber-500/20'
              }`}
            >
              <span className="font-bold text-amber-400 flex items-center gap-1 uppercase tracking-wider text-[9px]">
                📬 Cierre & Llamada a la Acción (CTA)
              </span>
              <p className="italic text-[10px] opacity-90">{rec.ctaSuggestion}</p>
            </div>
          </div>

          {/* Quick Action Prompt Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-[10px] text-amber-300/80">
              <MessageSquarePlus className="w-3.5 h-3.5 text-amber-400" />
              <span>Instrucción sugerida:</span>
              <span className="italic truncate max-w-md text-[10px] text-amber-100">"{rec.quickImprovePrompt}"</span>
            </div>

            <button
              type="button"
              onClick={() => onApplyPromptImprovement(rec.quickImprovePrompt)}
              disabled={isOptimizing}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                isStitchLight ? 'bg-amber-500 text-stone-950 hover:bg-amber-600' : 'bg-amber-400 text-stone-950 hover:bg-amber-300'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Ejecutar Mejora con IA</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
