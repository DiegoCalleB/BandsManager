/**
 * Modal de política de privacidad
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Shield,X } from "lucide-react";
import { renderBold } from "../../utils/richText";
import { Button,IconButton } from "../ui";
import { useFansLanding } from "./FansLandingContext";

/**
 * Modal de política de privacidad
 * @returns Sección de interfaz.
 */
export function PrivacyPolicyModal() {
  const { showPrivacyModal, t, setShowPrivacyModal, bandName } = useFansLanding();
  return (
    <>
{/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-[9999] bg-[var(--scrim)]/80 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-[var(--surface)] rounded-[var(--r-l)] p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-2 text-[var(--acc)] font-sans font-bold text-sm">
                <Shield className="w-5 h-5" /> {t("privacyModalTitle")}
              </div>
              <IconButton
                label="Cerrar"
                size="icon-xs"
                onClick={() => setShowPrivacyModal(false)}
              >
                <X className="w-5 h-5" />
              </IconButton>
            </div>

            <div className="text-xs text-[var(--ink-2)] font-sans space-y-3 leading-relaxed">
              <p>{renderBold(t("privacyPara1", { bandName }))}</p>
              <p>{renderBold(t("privacyPara2", { bandName }))}</p>
              <p>{renderBold(t("privacyPara3", { bandName }))}</p>
              <p>{renderBold(t("privacyPara4", { bandName }))}</p>
            </div>

            <div className="pt-4 text-right">
              <Button
                variant="primary"
                onClick={() => setShowPrivacyModal(false)}
              >
                {t("understood")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
