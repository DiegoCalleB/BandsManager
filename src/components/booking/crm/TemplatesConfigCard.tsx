/**
 * Tarjeta de plantillas de email y ajustes de IA del CRM.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ChevronDown, ChevronUp, Settings } from "lucide-react";
import { Button } from "../../ui";
import { TemplateConfigSection } from "../TemplateConfigSection";
import { useBookingCrm } from "./BookingCrmContext";
import { isStitchLight } from "./crmTheme";

/**
 * Tarjeta de plantillas de email y ajustes de IA del CRM.
 * @returns Sección de interfaz.
 */
export function TemplatesConfigCard() {
  const { setIsTemplatesSectionOpen, isTemplatesSectionOpen, colors, textSub, textMuted, templateTab, setTemplateTab, getActiveTemplateData, isTestingPrompt, testPromptResult, handleTestPrompt, handleSaveTemplates, handleOptimizeTemplate, isOptimizingTemplate, handleGenerateAllFromBase, isGeneratingAllTemplates, optimizationFeedbackMsg, setOptimizationFeedbackMsg } = useBookingCrm();
  return (
    <>
      {/* 3. EMAIL TEMPLATES & AI SETTINGS EDITOR CARD */}
      <div id="ai-template-config-section" className="bg-[var(--surface)] p-4 sm:p-5 rounded-[var(--r-l)] transition-colors">
      <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
      onClick={() => setIsTemplatesSectionOpen(!isTemplatesSectionOpen)}
      >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-[var(--r-m)] bg-[var(--acc-soft)] flex items-center justify-center text-[var(--acc-ink)] shrink-0">
          <Settings className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold font-display flex items-center gap-2 text-[var(--ink)]">
            Configuración de plantillas y pautas AI (Redactor)
          </h3>
          <p className="text-xs font-sans mt-0.5 text-[var(--ink-2)]">
            Personaliza el correo por defecto y las directrices del Redactor IA para Salas, Festivales, Medios y Grupos.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
        <Button
          variant={isTemplatesSectionOpen ? "inverse" : "neutral"}
          size="xs"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsTemplatesSectionOpen(!isTemplatesSectionOpen);
          }}
          className="items-center gap-1.5"
        >
          <span>{isTemplatesSectionOpen ? 'Plegar' : 'Configurar'}</span>
          {isTemplatesSectionOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </Button>
      </div>
      </div>

      {isTemplatesSectionOpen && (
      <div className="mt-5 pt-4">
        <TemplateConfigSection
          colors={colors}
          isStitchLight={isStitchLight}
          textSub={textSub}
          textMuted={textMuted}
          templateTab={templateTab}
          onSelectTemplateTab={setTemplateTab}
          activeTemplate={getActiveTemplateData()}
          isTestingPrompt={isTestingPrompt}
          testPromptResult={testPromptResult}
          onTestPrompt={handleTestPrompt}
          onSaveTemplates={handleSaveTemplates}
          onOptimizeTemplate={handleOptimizeTemplate}
          isOptimizingTemplate={isOptimizingTemplate}
          onGenerateAllTemplates={handleGenerateAllFromBase}
          isGeneratingAllTemplates={isGeneratingAllTemplates}
          optimizationFeedbackMsg={optimizationFeedbackMsg}
          onClearFeedbackMsg={() => setOptimizationFeedbackMsg(null)}
        />
      </div>
      )}
      </div>
    </>
  );
}
