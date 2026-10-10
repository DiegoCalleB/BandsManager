/**
 * Asistente de configuración inicial de la banda (EPK, repertorio, eventos, condiciones de booking).
 * Contenedor: controlador + proveedor + vista (Strangler Fig, AGENTS.md §5.6).
 */
import React from "react";
import type { Concert,EPKConfig,Rehearsal,Song,User } from "../../types";
import { OnboardingWizardProvider } from "./wizard/OnboardingWizardProvider";
import { OnboardingWizardView } from "./wizard/OnboardingWizardView";
import type { EpkWizardExtras } from "./wizard/epkLegacy";
import { useOnboardingWizardController } from "./wizard/hooks/useOnboardingWizardController";

export interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  epkConfig: EPKConfig | null;
  onUpdateEpkConfig?: (config: Partial<EPKConfig> & EpkWizardExtras) => Promise<unknown> | void;
  onSongsImported?: (songs: Song[]) => void;
  onRefreshData?: () => void;
  onAddConcert?: (concert: Concert) => Promise<unknown> | void;
  onAddRehearsal?: (reh: Rehearsal) => Promise<unknown> | void;
  bandId?: string;
  bandName?: string;
  bandLogoUrl?: string;
  bandPlan?: string;
}

/** Props con los valores por defecto ya aplicados. */
export type ResolvedOnboardingWizardProps = OnboardingWizardModalProps &
  Required<Pick<OnboardingWizardModalProps, "bandId" | "bandName" | "bandLogoUrl">>;

/**
 * Asistente de configuración inicial.
 * @param props Estado de apertura, usuario, configuración del EPK y callbacks de persistencia.
 * @returns El asistente con su contexto, o `null` si está cerrado.
 */
export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({
  bandId = "",
  bandName = "",
  bandLogoUrl = "",
  ...props
}) => {
  const resolved: ResolvedOnboardingWizardProps = { ...props, bandId, bandName, bandLogoUrl };
  const controller = useOnboardingWizardController(resolved);
  if (!props.isOpen) return null;

  return (
    <OnboardingWizardProvider value={{ ...controller, ...resolved }}>
      <OnboardingWizardView />
    </OnboardingWizardProvider>
  );
};
