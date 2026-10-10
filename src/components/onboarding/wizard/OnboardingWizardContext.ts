/**
 * Contexto del asistente de configuración inicial: reparte el estado del controlador y las props a las vistas.
 */
import { createContext,useContext } from "react";
import type { ResolvedOnboardingWizardProps } from "../OnboardingWizardModal";
import type { useOnboardingWizardController } from "./hooks/useOnboardingWizardController";

/** Todo lo que expone el controlador (inferido de su retorno, siempre sincronizado). */
export type OnboardingWizardController = ReturnType<typeof useOnboardingWizardController>;

/** Valor del contexto: controlador + props del asistente (con sus valores por defecto aplicados). */
export type OnboardingWizardContextValue = OnboardingWizardController & ResolvedOnboardingWizardProps;

export const OnboardingWizardContext = createContext<OnboardingWizardContextValue | null>(null);

/**
 * Lee el contexto del asistente.
 * @returns El valor del contexto.
 * @throws Error si se usa fuera de {@link OnboardingWizardProvider} (error de programación, falla rápido).
 */
export function useOnboardingWizard(): OnboardingWizardContextValue {
  const value = useContext(OnboardingWizardContext);
  if (!value) throw new Error("useOnboardingWizard debe usarse dentro de <OnboardingWizardProvider>");
  return value;
}
