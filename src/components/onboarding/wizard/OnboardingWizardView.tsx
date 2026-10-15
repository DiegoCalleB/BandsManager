import { ModalPortal } from "../../common/ModalPortal";
import { WizardFooter } from "./WizardFooter";
import { WizardHeader } from "./WizardHeader";
import { WizardStepper } from "./WizardStepper";
import { WizardStepsEarly } from "./WizardStepsEarly";
import { WizardStepsLate } from "./WizardStepsLate";




/**
 * Vista del asistente: cabecera, barra de pasos y el paso activo.
 * @returns El modal del asistente.
 */
export function OnboardingWizardView() {

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-[var(--scrim)]/85 overflow-y-auto">
  <div className="relative w-full max-w-3xl rounded-[var(--r-l)] bg-[var(--surface)] overflow-hidden flex flex-col max-h-[90vh] my-auto">
    {/* Header */}
    <WizardHeader />

    {/* Stepper Progress Bar */}
    <WizardStepper />

    {/* Content Body */}
    <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
      {/* Step 1: Idioma */}
      <WizardStepsEarly />

      {/* Step 7 */}
      <WizardStepsLate />
    </div>

    {/* Footer Controls */}
    <WizardFooter />
  </div>
      </div>
    </ModalPortal>
  );
}
