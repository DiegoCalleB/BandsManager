/**
 * Cabecera del asistente: plan, número de paso, título y cierre.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { X } from "lucide-react";
import { IconButton } from "../../ui";
import { useOnboardingWizard } from "./OnboardingWizardContext";

/**
 * Cabecera del asistente: plan, número de paso, título y cierre.
 * @returns Sección de interfaz.
 */
export function WizardHeader() {
  const { userPlanId, isCelebrationStep, currentStepIndex, activeSteps, currentStepDef, onClose } = useOnboardingWizard();
  return (
    <>
      <div className="p-5 sm:p-6 flex items-center justify-between bg-[var(--bg)]/50">
      <div>
      <div className="flex items-center gap-2">
        <span className="text-micro px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/20 text-[var(--ink)] font-semibold">
          Configuración inicial · plan{" "}
          {userPlanId.toUpperCase().replace("_", " ")}
        </span>
        {!isCelebrationStep && (
          <span className="text-xs text-[var(--ink-2)]">
            Paso {currentStepIndex + 1} de {activeSteps.length}
          </span>
        )}
      </div>
      <h2 className="text-lg sm:text-xl font-bold text-[var(--ink)] mt-1">
        {isCelebrationStep ? "¡Todo Listo!" : currentStepDef?.title}
      </h2>
      </div>

      <IconButton
      label="Cerrar asistente"
      type="button"
      onClick={onClose}
      >
      <X className="w-5 h-5" />
      </IconButton>
    </div>
    </>
  );
}
