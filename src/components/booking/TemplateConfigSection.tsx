import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Building2,
  Tent,
  Disc3,
  Radio,
  Users,
  Briefcase,
  MessageSquare,
  Landmark,
  Wand2,
  Lightbulb,
  Save,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { ThemeColors } from '../../types';
import { ExampleThreadsSection } from './ExampleThreadsSection';
import { TemplateRecommendationsCard } from './TemplateRecommendationsCard';
import { GenerateAllTemplatesModal } from './GenerateAllTemplatesModal';

// Espectro resuelve claro/oscuro en tokens: las ramas `isStitchLight` que llegan de main no deben
// activarse nunca (traerían de vuelta slate/indigo). Se eliminan en el restyle de este fichero.
const isStitchLight = false;

export type TemplateCategory = 'salas' | 'festivales' | 'discotecas' | 'medios' | 'grupos' | 'managements' | 'ayuntamientos';

const CATEGORIES: { id: TemplateCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'salas', label: '🏛️ Salas', icon: Building2 },
  { id: 'festivales', label: '🎪 Festivales', icon: Tent },
  { id: 'discotecas', label: '🪩 Discotecas', icon: Disc3 },
  { id: 'medios', label: '📻 Medios', icon: Radio },
  { id: 'grupos', label: '🎸 Grupos', icon: Users },
  { id: 'managements', label: '💼 Managements', icon: Briefcase },
  { id: 'ayuntamientos', label: '🎉 Ayuntamientos', icon: Landmark },
];

export interface ActiveTemplateData {
  title: string;
  desc: string;
  subject: string;
  setSubject: (val: string) => void;
  body: string;
  setBody: (val: string) => void;
  guidelines: string;
  setGuidelines: (val: string) => void;
}

interface TemplateConfigSectionProps {
  /** Heredado de main: Espectro resuelve el tema en tokens, así que se acepta y se ignora. */
  isStitchLight?: boolean;
  colors: ThemeColors;
  textSub: string;
  textMuted: string;
  templateTab: TemplateCategory;
  onSelectTemplateTab: (tab: TemplateCategory) => void;
  activeTemplate: ActiveTemplateData;
  isTestingPrompt: boolean;
  testPromptResult: string;
  onTestPrompt: () => void;
  onSaveTemplates: () => void;
  onOptimizeTemplate?: (overrideInstruction?: string) => void;
  isOptimizingTemplate?: boolean;
  onGenerateAllTemplates?: (baseProposal: string) => Promise<boolean>;
  isGeneratingAllTemplates?: boolean;
  optimizationFeedbackMsg?: string | null;
  onClearFeedbackMsg?: () => void;
  customInstruction?: string;
  onCustomInstructionChange?: (val: string) => void;
  toneRating?: number;
  onToneRatingChange?: (rating: number) => void;
  contentRating?: number;
  onContentRatingChange?: (rating: number) => void;
}

const TEMPLATE_VARIABLES = [
  { tag: '{{nombre_sala}}', label: 'Nombre sala/festival' },
  { tag: '{{ciudad}}', label: 'Ciudad' },
  { tag: '{{contacto_nombre}}', label: 'Nombre contacto' },
  { tag: '{{aforo}}', label: 'Aforo' },
  { tag: '{{nombre_banda}}', label: 'Nombre banda' },
];

export function TemplateConfigSection({
  colors,
  textSub,
  textMuted,
  templateTab,
  onSelectTemplateTab,
  activeTemplate,
  isTestingPrompt,
  testPromptResult,
  onTestPrompt,
  onSaveTemplates,
  onOptimizeTemplate,
  isOptimizingTemplate,
  onGenerateAllTemplates,
  isGeneratingAllTemplates = false,
  optimizationFeedbackMsg,
  onClearFeedbackMsg,
}: TemplateConfigSectionProps) {
  const [isMultiModalOpen, setIsMultiModalOpen] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [copiedPreview, setCopiedPreview] = useState(false);

  const handleInsertTag = (tag: string) => {
    activeTemplate.setBody((activeTemplate.body || '') + (activeTemplate.body ? ' ' : '') + tag);
  };

  const handleCopyPreview = () => {
    if (!testPromptResult) return;
    navigator.clipboard.writeText(testPromptResult);
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 2000);
  };

  const currentCategory = CATEGORIES.find((c) => c.id === templateTab) || CATEGORIES[0];

  return (
    <div className={`${colors.card} p-5 space-y-4`}>
      {/* Top Header: Category Tabs & Global Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[var(--hair)]/10">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-[var(--r-m)] bg-[var(--sunken)] border border-[var(--hair)]/5">
          {CATEGORIES.map((tab) => {
            const isActive = templateTab === tab.id;
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                id={`template-tab-${tab.id}`}
                onClick={() => {
                  onSelectTemplateTab(tab.id);
                  setShowRecommendations(false);
                }}
                className={`py-1.5 px-3 rounded-[var(--r-m)] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive ? 'bg-[var(--acc)] text-[var(--ink)] font-black shadow-md' : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--ink)]/5'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {onGenerateAllTemplates && (
            <button
              type="button"
              onClick={() => setIsMultiModalOpen(true)}
              className="px-3 py-1.5 rounded-[var(--r-m)] text-xs font-bold bg-gradient-to-r from-[var(--acc)]/20 to-[var(--acc)]/20 text-[var(--acc)] border border-[var(--hair)] hover:border-[var(--ink-3)] hover:text-[var(--ink)] flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              title="Genera las 7 plantillas desde una propuesta base"
            >
              <Wand2 className="w-3.5 h-3.5 text-[var(--acc)]" />
              <span>Generar las 7 con IA</span>
            </button>
          )}

          <button
            id="template-btn-save"
            type="button"
            onClick={onSaveTemplates}
            className="px-4 py-1.5 rounded-[var(--r-m)] text-xs font-bold bg-[var(--acc)] hover:bg-[var(--acc)] text-[var(--ink)] flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Guardar</span>
          </button>
        </div>
      </div>

      {/* 7-in-1 Modal */}
      {onGenerateAllTemplates && (
        <GenerateAllTemplatesModal
          isOpen={isMultiModalOpen}
          onClose={() => setIsMultiModalOpen(false)}
          colors={colors}
          isStitchLight={isStitchLight}
          initialBaseText={activeTemplate.body || ''}
          onGenerateAll={onGenerateAllTemplates}
          isGenerating={isGeneratingAllTemplates}
        />
      )}

      {/* Sub-bar: Category helper controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="text-[var(--ink-2)] flex items-center gap-2">
          <span className="font-bold text-[var(--acc)]">{currentCategory.label}:</span>
          <span className="text-[var(--ink-2)] text-[11px]">{activeTemplate.desc}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRecommendations(!showRecommendations)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--r-m)] text-[11px] font-bold border transition-all cursor-pointer ${
              showRecommendations
                ? 'bg-[var(--acc)]/20 text-[var(--acc)] border-[var(--acc)]/30'
                : 'bg-[var(--surface)]/60 text-[var(--ink-2)] border-[var(--hair)] hover:text-[var(--acc)] hover:border-[var(--ink-3)]'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-[var(--acc)]" />
            <span>{showRecommendations ? 'Ocultar consejos' : 'Ver consejos de IA'}</span>
            {showRecommendations ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            type="button"
            onClick={() => setShowExamples(!showExamples)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--r-m)] text-[11px] font-bold border transition-all cursor-pointer ${
              showExamples
                ? 'bg-[var(--acc)]/20 text-[var(--acc)] border-[var(--acc)]/30'
                : 'bg-[var(--surface)]/60 text-[var(--ink-2)] border-[var(--hair)] hover:text-[var(--ink)] hover:border-[var(--hair)]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{showExamples ? 'Ocultar ejemplos' : 'Ejemplos reales'}</span>
            {showExamples ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Optional Recommendations Card - ONLY shown when requested */}
      {showRecommendations && (
        <div className="animate-in fade-in duration-200">
          <TemplateRecommendationsCard
            category={templateTab}
            isStitchLight={isStitchLight}
            onApplyPromptImprovement={(promptText) => {
              if (onOptimizeTemplate) {
                onOptimizeTemplate(promptText);
              }
            }}
            isOptimizing={isOptimizingTemplate}
            onClose={() => setShowRecommendations(false)}
          />
        </div>
      )}

      {/* Optional Real Example Threads - ONLY shown when requested */}
      {showExamples && (
        <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] border border-[var(--hair)]/10 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--acc)] flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" /> Hilos de referencia para {currentCategory.label}
            </span>
            <button type="button" onClick={() => setShowExamples(false)} className="text-[var(--ink-2)] hover:text-[var(--ink)] text-xs font-bold">
              ✕
            </button>
          </div>
          <p className="text-[11px] text-[var(--ink-2)]">
            Añade correos reales de éxito para que la IA aprenda tu tono natural en esta categoría.
          </p>
          <ExampleThreadsSection category={templateTab} isStitchLight={isStitchLight} textSub={textSub} />
        </div>
      )}

      {/* Optimization Feedback Message */}
      {optimizationFeedbackMsg && (
        <div className="p-3 bg-[var(--acc)]/15 border border-[var(--hair)] text-[var(--acc)] text-xs rounded-[var(--r-m)] flex items-center justify-between animate-in fade-in">
          <span>{optimizationFeedbackMsg}</span>
          {onClearFeedbackMsg && (
            <button type="button" onClick={onClearFeedbackMsg} className="text-[var(--acc)] font-bold ml-2 hover:text-[var(--ink)]">
              ✕
            </button>
          )}
        </div>
      )}

      {/* Main Workspace: 2-Column Grid (Editor Left, Live Preview Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Form (7 cols) */}
        <div className="lg:col-span-7 space-y-3.5">
          {/* Subject */}
          <div className="space-y-1">
            <label className="block text-[11px] font-mono font-bold text-[var(--ink-2)]">Asunto del Email</label>
            <input
              id="template-subject"
              type="text"
              value={activeTemplate.subject}
              onChange={(e) => activeTemplate.setSubject(e.target.value)}
              placeholder="Ej: Propuesta de directo: {{nombre_banda}} en {{nombre_sala}}"
              className="w-full bg-[var(--surface)] border border-[var(--hair)] rounded-[var(--r-m)] px-3 py-2 text-xs text-[var(--ink-2)] placeholder:text-[var(--ink-2)] focus:border-[var(--ink-3)] focus:outline-none transition-colors"
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-mono font-bold text-[var(--ink-2)]">Cuerpo del Correo</label>
              {/* Insertable variables chips */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] text-[var(--ink-2)] mr-1">Insertar:</span>
                {TEMPLATE_VARIABLES.map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => handleInsertTag(v.tag)}
                    className="px-1.5 py-0.5 rounded bg-[var(--ink)]/5 hover:bg-[var(--acc)]/20 text-[var(--ink-2)] hover:text-[var(--acc)] text-[10px] font-mono transition-colors cursor-pointer border border-[var(--hair)]/5 hover:border-[var(--ink-3)]"
                    title={`Insertar ${v.label}`}
                  >
                    {v.tag}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              id="template-body"
              rows={8}
              value={activeTemplate.body}
              onChange={(e) => activeTemplate.setBody(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--hair)] rounded-[var(--r-m)] p-3 text-xs text-[var(--ink-2)] placeholder:text-[var(--ink-2)] focus:border-[var(--ink-3)] focus:outline-none leading-relaxed transition-colors font-sans"
              placeholder="Escribe el cuerpo base de la plantilla usando las etiquetas como {{nombre_sala}}, {{ciudad}}..."
            />
          </div>

          {/* AI Guidelines */}
          <div className="space-y-1">
            <label className="block text-[11px] font-mono font-bold text-[var(--acc)] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" />
              <span>Pautas de Redacción para la IA (Opcional)</span>
            </label>
            <textarea
              id="template-guidelines"
              rows={2}
              value={activeTemplate.guidelines}
              onChange={(e) => activeTemplate.setGuidelines(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--hair)] rounded-[var(--r-m)] px-3 py-2 text-xs text-[var(--ink-2)] placeholder:text-[var(--ink-2)] focus:border-[var(--ink-3)] focus:outline-none transition-colors"
              placeholder="Ej: Mantén el mensaje en menos de 100 palabras, tono cercano, destaca nuestra sección rítmica..."
            />
          </div>

          {/* Form Actions (Only 2 clear buttons) */}
          <div className="flex items-center gap-2 pt-1">
            {onOptimizeTemplate && (
              <button
                type="button"
                onClick={() => onOptimizeTemplate()}
                disabled={isOptimizingTemplate}
                className="py-2 px-3 bg-[var(--acc)]/10 hover:bg-[var(--acc)]/20 text-[var(--acc)]/70 rounded-[var(--r-s)] text-[10px] font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 text-[var(--acc)] ${isOptimizingTemplate ? 'animate-spin' : ''}`} />
                <span>{isOptimizingTemplate ? 'Optimizando...' : 'Optimizar con IA'}</span>
              </button>
            )}

            <button
              id="template-btn-test"
              type="button"
              onClick={onTestPrompt}
              disabled={isTestingPrompt}
              className={`px-2 py-1 font-sans text-[10px] rounded-[var(--r-s)] transition-all cursor-pointer flex items-center gap-1.5 ${'bg-[var(--surface)] hover:bg-[var(--bg)] text-[var(--ink-2)]'}`}
            >
              <Eye className={`w-3.5 h-3.5 ${isTestingPrompt ? 'animate-spin' : ''}`} />
              <span>{isTestingPrompt ? 'Generando...' : 'Simular Vista Previa'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Preview Sandbox (5 cols) */}
        <div className="lg:col-span-5 bg-[var(--surface)] border border-[var(--hair)] rounded-[var(--r-l)] p-4 flex flex-col justify-between min-h-[360px]">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--hair)]/5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-[var(--r-pill)] bg-[var(--acc)] animate-pulse" />
                <span className="text-xs font-mono font-bold text-[var(--ink-2)]">Vista Previa Simulada</span>
              </div>
              {testPromptResult && (
                <button
                  type="button"
                  onClick={handleCopyPreview}
                  className="text-[11px] text-[var(--ink-2)] hover:text-[var(--ink)] flex items-center gap-1 transition-colors"
                >
                  {copiedPreview ? <Check className="w-3 h-3 text-[var(--ok)]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPreview ? 'Copiado' : 'Copiar'}</span>
                </button>
              )}
            </div>

            {testPromptResult ? (
              <div className="p-3.5 bg-[var(--sunken)] border border-[var(--hair)]/5 rounded-[var(--r-m)] text-xs text-[var(--ink-2)] leading-relaxed whitespace-pre-wrap max-h-[320px] overflow-y-auto select-text font-sans">
                {testPromptResult}
              </div>
            ) : (
              <div className="py-16 px-4 text-center space-y-2 border border-dashed border-[var(--hair)] rounded-[var(--r-m)]">
                <Eye className="w-6 h-6 text-[var(--ink-2)] mx-auto" />
                <p className="text-xs text-[var(--ink-2)] font-medium">Ninguna simulación activa</p>
                <p className="text-[11px] text-[var(--ink-2)] max-w-xs mx-auto">
                  Haz clic en <strong>"Simular Vista Previa"</strong> para ver cómo la IA adapta esta plantilla a un contacto real.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[var(--hair)]/5 text-[10px] text-[var(--ink-2)] flex items-center justify-between">
            <span>Redactor IA v2.4</span>
            <span>Salas · Festivales · Medios</span>
          </div>
        </div>
      </div>
    </div>
  );
}
export default TemplateConfigSection;
