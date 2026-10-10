/**
 * Pie del asistente: anterior, saltar, siguiente y finalizar.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ArrowLeft,ArrowRight,Check,SkipForward } from "lucide-react";
import { Button } from "../../ui";
import { useOnboardingWizard } from "./OnboardingWizardContext";

/**
 * Pie del asistente: anterior, saltar, siguiente y finalizar.
 * @returns Sección de interfaz.
 */
export function WizardFooter() {
  const { isCelebrationStep, currentStepIndex, handlePrevStep, onClose, handleSkipStep, handleNextStep, activeSteps } = useOnboardingWizard();
  return (
    <>
      {!isCelebrationStep && (
      <div className="p-4 sm:p-5 bg-[var(--bg)]/80 flex items-center justify-between">
      <div>
        {currentStepIndex > 0 ? (
          <button
            type="button"
            onClick={handlePrevStep}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--r-pill)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Anterior
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-[var(--ink-2)] hover:text-[var(--ink-2)]"
          >
            Configurar más tarde
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSkipStep}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-[var(--r-m)] text-[var(--ink-2)] hover:text-[var(--ink)] text-xs transition-colors"
        >
          <SkipForward className="w-3.5 h-3.5" /> Saltar paso
        </button>

        <Button
          variant="primary"
          type="button"
          onClick={handleNextStep}
          className="items-center gap-2"
        >
          {currentStepIndex === activeSteps.length - 1 ? (
            <>
              <span>Finalizar y ver portales</span>
              <Check className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Siguiente</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
      </div>
    )}
    </>
  );
}
