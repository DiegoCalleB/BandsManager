import {
AlertCircle,
Check
} from "lucide-react";
import { ModalPortal } from "../common/ModalPortal";
import { AgentAutonomySettingsModal } from "../dashboard/AgentAutonomySettingsModal";
import { AdminBandSection } from "./AdminBandSection";
import { AgentConfigCard } from "./AgentConfigCard";
import { AppearanceSettings } from "./AppearanceSettings";
import { BandLogoSection } from "./BandLogoSection";
import { BandSelectionSection } from "./BandSelectionSection";
import { EspectroPreferenceCard } from "./EspectroPreferenceCard";
import { IdentityFields } from "./IdentityFields";
import { LanguageSelector } from "./LanguageSelector";
import { NotificationSettingsCard } from "./NotificationSettingsCard";
import { PasswordSection } from "./PasswordSection";
import { ProfileFooter } from "./ProfileFooter";
import { ProfileHeader } from "./ProfileHeader";
import { ProfilePlanSection } from "./ProfilePlanSection";
import { UpgradePlanDialog } from "./UpgradePlanDialog";

import { useUserProfile } from "./UserProfileContext";

/**
 * Vista del perfil: cabecera, formulario por secciones, pie y modales de plan y agentes.
 * @returns El modal del perfil de usuario.
 */
export function UserProfileView() {
  const { isPromoUser, loading, error, showAgentConfig, setShowAgentConfig, handleSubmit, currentUser, onClose, activeBandName,} = useUserProfile();

  return (
    <ModalPortal isOpen={true} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/80 overflow-y-auto overscroll-contain animate-in fade-in duration-300">
  <div
    className={`w-full max-w-md rounded-[var(--r-l)] overflow-hidden flex flex-col my-auto max-h-[90vh] ${"bg-[var(--surface)] text-[var(--ink)]"}`}
  >
    {/* Modal Header */}
    <ProfileHeader />

    {/* Form Body */}
    <form
      onSubmit={handleSubmit}
      className="p-6 space-y-4 overflow-y-auto max-h-[75vh]"
    >
      {error && (
        <div className="p-3 bg-[var(--alert)]/10  rounded-[var(--r-m)] text-xs text-[var(--alert)] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <ProfilePlanSection />

      <IdentityFields />

      {/* Active Band Logo Edit Section (Netflix Profile Style) */}
      <BandLogoSection />

      {/* Main Band Selection Section */}
      <BandSelectionSection />

      {/* Language Selection */}
      <LanguageSelector />

      <AppearanceSettings />
      <EspectroPreferenceCard />
      <AgentConfigCard />

      <NotificationSettingsCard />

      <PasswordSection />

      <AdminBandSection />

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2.5 px-4 rounded-[var(--r-m)] font-bold text-xs transition-ui cursor-pointer flex items-center justify-center gap-2 mt-4 active:scale-[0.97] ${"bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)]"}`}
      >
        {loading ? (
          <span>Guardando cambios…</span>
        ) : (
          <>
            <Check className="w-4 h-4" />
            <span>Guardar cambios de perfil</span>
          </>
        )}
      </button>
    </form>

    {/* Modal Footer */}
    <ProfileFooter />
  </div>

  {/* Upgrade Plan Modal */}
  <UpgradePlanDialog />

  {/* Panel de Control de Agentes IA (Autonomía, Email & Buzón, Horarios, Tono, Auditoría) */}
  {currentUser.band_id && !isPromoUser && (
    <AgentAutonomySettingsModal
      isOpen={showAgentConfig}
      onClose={() => setShowAgentConfig(false)}
      bandName={activeBandName || currentUser.bandName}
      bandId={currentUser.band_id}
      currentUser={currentUser}
    />
  )}
      </div>
    </ModalPortal>
  );
};
