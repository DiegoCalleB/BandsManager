/**
 * Aviso de éxito del formulario y plan suscrito con acceso a mejorarlo.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Check,Crown,Sparkles } from "lucide-react";
import { Button } from "../ui";
import { useUserProfile } from "./UserProfileContext";

/**
 * Aviso de éxito del formulario y plan suscrito con acceso a mejorarlo.
 * @returns Sección de interfaz.
 */
export function ProfilePlanSection() {
  const { successMsg, currentPlanDef, isHighestPlan, isPromoUser, setShowUpgradeModal, onOpenProfileWizard } = useUserProfile();
  return (
    <>
      {successMsg && (
        <div className="p-3 bg-[var(--ok)]/10  rounded-[var(--r-m)] text-xs text-[var(--ok)] flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Plan Suscrito & Upgrade Section */}
      <div
        className={`p-3.5 rounded-[var(--r-m)] relative overflow-hidden transition-ui ${"bg-[var(--sunken)]"}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-[12rem]">
            <div className="w-9 h-9 rounded-[var(--r-s)] bg-[var(--acc)]/20 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-[var(--acc)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-sans text-[var(--ink-2)]">
                  Plan:
                </span>
                <span className="text-xs font-bold text-[var(--acc)]/70 font-sans">
                  {currentPlanDef.name}
                </span>
              </div>
              <p className="text-xs text-[var(--ink-2)] mt-0.5">
                {currentPlanDef.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isHighestPlan && !isPromoUser && (
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={() => setShowUpgradeModal(true)}
                className="items-center gap-1.5 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 fill-[var(--on-acc)]" />
                <span>Upgrade</span>
              </Button>
            )}

            {onOpenProfileWizard && (
              <Button
                variant="raised"
                size="xs"
                type="button"
                onClick={onOpenProfileWizard}
                className="items-center gap-1.5 shrink-0"
                title="Abrir asistente de inicio / onboarding"
              >
                <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" />
                <span>Guía de inicio</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
