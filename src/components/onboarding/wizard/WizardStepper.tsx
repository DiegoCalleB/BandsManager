/**
 * Barra de progreso con los pasos del asistente.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Check } from "lucide-react";
import { useOnboardingWizard } from "./OnboardingWizardContext";

/**
 * Barra de progreso con los pasos del asistente.
 * @returns Sección de interfaz.
 */
export function WizardStepper() {
  const { isCelebrationStep, activeSteps, currentStepIndex, setCurrentStepIndex } = useOnboardingWizard();
  return (
    <>
      {!isCelebrationStep && (
      <div className="px-5 sm:px-6 py-2.5 bg-[var(--bg)]/60 flex items-center gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
      {activeSteps.map((step, idx) => {
        const isCurrent = idx === currentStepIndex;
        const isPassed = idx < currentStepIndex;
        return (
          <button
            key={step.key}
            type="button"
            onClick={() => setCurrentStepIndex(idx)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-[var(--r-pill)] text-xs whitespace-nowrap transition-ui ${
              isCurrent
                ? "bg-[var(--ink)] text-[var(--bg)] font-bold"
                : isPassed
                  ? "bg-[var(--acc)]/15 text-[var(--ink)] hover:bg-[var(--acc)]/25"
                  : "text-[var(--ink-2)] hover:text-[var(--ink-2)]"
            }`}
          >
            {isPassed ? (
              <Check className="w-3 h-3" />
            ) : (
              <span className="text-micro opacity-80">{idx + 1}.</span>
            )}
            <span>{step.shortTitle}</span>
          </button>
        );
      })}
      </div>
    )}
    </>
  );
}
