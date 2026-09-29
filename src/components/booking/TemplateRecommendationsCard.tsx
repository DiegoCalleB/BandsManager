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
      className={`rounded-[var(--r-m)] border p-4 transition-all duration-200 ${
        'bg-[var(--acc-soft)]/70 border-[var(--acc)] text-[var(--ink)] shadow-sm'
      }`}
    >
      {/* Header with category badge & toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`p-1.5 rounded-[var(--r-m)] flex items-center justify-center shrink-0 ${
              'bg-[var(--acc)] text-[var(--ink)] font-bold'
            }`}
          >
            <Compass className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold uppercase tracking-wide text-[var(--acc)]">Recomendaciones del Agente</span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-[var(--r-pill)] ${
                  'bg-[var(--acc-soft)] text-[var(--acc-ink)]'
                }`}
              >
                {rec.badge}
              </span>
            </div>
            <p className={`text-[11px] font-sans truncate ${'text-[var(--ink-2)]'}`}>{rec.tagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onApplyPromptImprovement(rec.quickImprovePrompt)}
            disabled={isOptimizing}
            className={`px-3 py-1.5 rounded-[var(--r-m)] text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95 disabled:opacity-50 ${
              'bg-[var(--acc)] hover:bg-[var(--acc)] text-[var(--ink)] font-extrabold'
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
              className={`p-1.5 rounded-[var(--r-m)] text-xs transition-colors cursor-pointer ${
                'hover:bg-[var(--acc-soft)] text-[var(--ink-2)]'
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
        <div className="mt-4 pt-3.5 border-t border-[var(--acc)]/20 space-y-3.5 animate-in fade-in duration-200">
          {/* Quick AI Tip / Secret */}
          <div
            className={`p-2.5 rounded-[var(--r-m)] flex items-start gap-2 text-[11px] leading-relaxed ${
              'bg-[var(--surface)] text-[var(--ink)] border border-[var(--acc)]'
            }`}
          >
            <Lightbulb className="w-4 h-4 text-[var(--acc)] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[var(--acc)] mr-1">Regla clave del Agente:</strong>
              <span>{rec.aiSecretTip}</span>
            </div>
          </div>

          {/* Dos and Don'ts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* DOs */}
            <div
              className={`p-3 rounded-[var(--r-m)] border space-y-1.5 ${
                'bg-[var(--ok-soft)]/70 border-[var(--ok)]'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--ok)]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ok)]" />
                <span>Buenas prácticas para {category}</span>
              </div>
              <ul className="space-y-1 text-[10px] leading-normal text-[var(--ok)]/90 list-disc list-inside">
                {rec.dos.map((item, idx) => (
                  <li key={`do-${idx}`} className="list-none flex items-start gap-1.5">
                    <span className="text-[var(--ok)] font-bold shrink-0">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* DON'Ts */}
            <div
              className={`p-3 rounded-[var(--r-m)] border space-y-1.5 ${
                'bg-[var(--alert)]/12 border-[var(--alert)]'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--alert)]">
                <XCircle className="w-3.5 h-3.5 text-[var(--alert)]" />
                <span>Qué evitar obligatoriamente</span>
              </div>
              <ul className="space-y-1 text-[10px] leading-normal text-[var(--alert)]/90 list-disc list-inside">
                {rec.donts.map((item, idx) => (
                  <li key={`dont-${idx}`} className="list-none flex items-start gap-1.5">
                    <span className="text-[var(--alert)] font-bold shrink-0">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Formula Blocks: Opening, Hooks, Call to Action */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[10px]">
            <div
              className={`p-2.5 rounded-[var(--r-m)] border space-y-1 ${
                'bg-[var(--surface)] border-[var(--acc)]'
              }`}
            >
              <span className="font-bold text-[var(--acc)] flex items-center gap-1 uppercase tracking-wider text-[9px]">
                🎯 Apertura Recomendada
              </span>
              <p className="italic text-[10px] opacity-90">{rec.bestOpening}</p>
            </div>

            <div
              className={`p-2.5 rounded-[var(--r-m)] border space-y-1 ${
                'bg-[var(--surface)] border-[var(--acc)]'
              }`}
            >
              <span className="font-bold text-[var(--acc)] flex items-center gap-1 uppercase tracking-wider text-[9px]">⚡ Ganchos Clave</span>
              <ul className="space-y-0.5">
                {rec.keyHooks.map((hook, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <span className="text-[var(--acc)]">•</span>
                    <span>{hook}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className={`p-2.5 rounded-[var(--r-m)] border space-y-1 ${
                'bg-[var(--surface)] border-[var(--acc)]'
              }`}
            >
              <span className="font-bold text-[var(--acc)] flex items-center gap-1 uppercase tracking-wider text-[9px]">
                📬 Cierre & Llamada a la Acción (CTA)
              </span>
              <p className="italic text-[10px] opacity-90">{rec.ctaSuggestion}</p>
            </div>
          </div>

          {/* Quick Action Prompt Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--acc)]/80">
              <MessageSquarePlus className="w-3.5 h-3.5 text-[var(--acc)]" />
              <span>Instrucción sugerida:</span>
              <span className="italic truncate max-w-md text-[10px] text-[var(--acc)]">"{rec.quickImprovePrompt}"</span>
            </div>

            <button
              type="button"
              onClick={() => onApplyPromptImprovement(rec.quickImprovePrompt)}
              disabled={isOptimizing}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                'bg-[var(--acc)] text-[var(--ink)] hover:bg-[var(--acc)]'
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
