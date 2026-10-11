import type { ReactNode } from "react";
import { OnboardingWizardContext,type OnboardingWizardContextValue } from "./OnboardingWizardContext";

/**
 * Proveedor del contexto del asistente de configuración inicial.
 * @param props.value Valor completo (controlador + props).
 */
export function OnboardingWizardProvider({ value, children }: { value: OnboardingWizardContextValue; children: ReactNode }) {
  return <OnboardingWizardContext.Provider value={value}>{children}</OnboardingWizardContext.Provider>;
}
