import React, { useState } from 'react';
import { Sparkles, CheckCircle2, XCircle, Lightbulb, Compass, MessageSquarePlus, ChevronDown, ChevronUp, Wand2 } from 'lucide-react';
import type { TemplateCategory } from './TemplateConfigSection';
import { CATEGORY_RECOMMENDATIONS } from '../../data/templateRecommendations';
import { ShowIcon } from '../ui/ShowIcon';

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
      className={`rounded-[var(--r-m)] p-4 transition-ui duration-200 ${
        'bg-[var(--acc-soft)]/70 text-[var(--ink)]'
      }`}
    >
      {/* Header with category badge & toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`p-1.5 rounded-[var(--r-m)] flex items-center justify-center shrink-0 ${
              'bg-[var(--acc)] text-[var(--on-acc)] font-bold'
            }`}
          >
            <Compass className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold text-[var(--acc)]">Recomendaciones del Agente</span>
              <span
                className={`text-micro font-semibold px-2 py-0.5 rounded-[var(--r-pill)] ${
                  'bg-[var(--acc-soft)] text-[var(--acc-ink)]'
                }`}
              >
                {rec.badge}
              </span>
            </div>
            <p className={`text-xs font-sans truncate ${'text-[var(--ink-2)]'}`}>{rec.tagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onApplyPromptImprovement(rec.quickImprovePrompt)}
            disabled={isOptimizing}
            className={`px-3 py-1.5 rounded-[var(--r-m)] text-xs font-bold flex items-center gap-1.5 transition-ui cursor-pointer active:scale-[0.97] disabled:opacity-50 ${
              'bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-extrabold'
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
        <div className="mt-4 pt-3.5 border-t border-[var(--hair)] space-y-3.5 animate-in fade-in duration-200">
          {/* Quick AI Tip / Secret */}
          <div
            className={`p-2.5 rounded-[var(--r-m)] flex items-start gap-2 text-xs leading-relaxed ${
              'bg-[var(--sunken)] text-[var(--ink)] '
            } bg-[var(--acc)]/10`}
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
              className={`p-3 rounded-[var(--r-m)] space-y-1.5 ${
                'bg-[var(--ok-soft)]/70 '
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--ok)]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ok)]" />
                <span>Buenas prácticas para {category}</span>
              </div>
              <ul className="space-y-1 text-micro leading-normal text-[var(--ok)]/90 list-disc list-inside">
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
              className={`p-3 rounded-[var(--r-m)] space-y-1.5 ${
                'bg-[var(--alert)]/12 '
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--alert)]">
                <XCircle className="w-3.5 h-3.5 text-[var(--alert)]" />
                <span>Qué evitar obligatoriamente</span>
              </div>
              <ul className="space-y-1 text-micro leading-normal text-[var(--alert)]/90 list-disc list-inside">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-micro">
            <div
              className={`p-2.5 rounded-[var(--r-m)] space-y-1 ${
                'bg-[var(--sunken)] '
              }`}
            >
              <span className="font-bold text-[var(--acc)] flex items-center gap-1 text-micro">
                <ShowIcon inline emoji="🎯" />Apertura Recomendada
              </span>
              <p className="italic text-micro opacity-90">{rec.bestOpening}</p>
            </div>

            <div
              className={`p-2.5 rounded-[var(--r-m)] space-y-1 ${
                'bg-[var(--sunken)] '
              }`}
            >
              <span className="font-bold text-[var(--acc)] flex items-center gap-1 text-micro"><ShowIcon inline emoji="⚡" />Ganchos Clave</span>
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
              className={`p-2.5 rounded-[var(--r-m)] space-y-1 ${
                'bg-[var(--sunken)] '
              }`}
            >
              <span className="font-bold text-[var(--acc)] flex items-center gap-1 text-micro">
                <ShowIcon inline emoji="📬" />Cierre & Llamada a la Acción (CTA)
              </span>
              <p className="italic text-micro opacity-90">{rec.ctaSuggestion}</p>
            </div>
          </div>

          {/* Quick Action Prompt Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-micro text-[var(--acc)]/80">
              <MessageSquarePlus className="w-3.5 h-3.5 text-[var(--acc)]" />
              <span>Instrucción sugerida:</span>
              <span className="italic truncate max-w-md text-micro text-[var(--acc)]">"{rec.quickImprovePrompt}"</span>
            </div>

            <button
              type="button"
              onClick={() => onApplyPromptImprovement(rec.quickImprovePrompt)}
              disabled={isOptimizing}
              className={`px-2.5 py-1 rounded text-micro font-bold transition-ui flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                'bg-[var(--acc)] text-[var(--on-acc)] hover:bg-[var(--acc)]'
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
