/**
 * Perfil de usuario: datos personales, banda principal, plan, apariencia y bandas.
 * Contenedor: controlador + proveedor + vista (Strangler Fig, AGENTS.md §5.6).
 */
import React from "react";
import type { EPKConfig,ThemeName,User } from "../types";
import type { FontPresetKey } from "../utils/typography";
import { UserProfileProvider } from "./user_profile/UserProfileProvider";
import { UserProfileView } from "./user_profile/UserProfileView";
import { useUserProfileController } from "./user_profile/hooks/useUserProfileController";

export interface UserProfileModalProps {
  currentUser: User;
  onClose: () => void;
  onUpdateUser: (updatedUser: User) => void;
  isAdmin?: boolean;
  onOpenBandManagement?: () => void;
  currentTheme?: ThemeName;
  onThemeChange?: (theme: ThemeName) => void;
  currentFont?: FontPresetKey;
  onFontChange?: (font: FontPresetKey) => void;
  epkConfig?: Partial<EPKConfig> | null;
  onUpdateEpkConfig?: (newConfig: EPKConfig) => Promise<unknown> | void;
  activeBandName?: string;
  onRefreshData?: () => void;
  availableBands?: Array<{
    band_id: string;
    bandName: string;
    role?: string;
    logoUrl?: string;
    plan?: string;
    is_main?: boolean;
  }>;
  onSetMainBand?: (bandId: string) => Promise<unknown>;
  onOpenBandSwitcher?: () => void;
  onNavigateToPlanes?: () => void;
  onOpenProfileWizard?: () => void;
  onOpenNotificationSettings?: () => void;
}

/** Props con los valores por defecto ya aplicados. */
export type ResolvedUserProfileProps = UserProfileModalProps & Required<Pick<UserProfileModalProps, "availableBands">>;

/**
 * Perfil de usuario.
 * @param props Usuario, tema, EPK y callbacks de actualización y navegación.
 * @returns El modal con su contexto.
 */
export const UserProfileModal: React.FC<UserProfileModalProps> = ({ availableBands = [], ...props }) => {
  const resolved: ResolvedUserProfileProps = { ...props, availableBands };
  const controller = useUserProfileController(resolved);
  return (
    <UserProfileProvider value={{ ...controller, ...resolved }}>
      <UserProfileView />
    </UserProfileProvider>
  );
};
