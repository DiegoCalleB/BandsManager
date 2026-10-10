/**
 * Modal para mejorar el plan de una banda.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Check,Sparkles,X } from "lucide-react";
import { api } from "../../services/api";
import { isSameBandId } from "../../utils/bandUtils";
import { getErrorMessage } from "../../utils/errorMessage";
import { getPlanDefinition,PLANS } from "../../utils/planPermissions";
import { Button,IconButton } from "../ui";
import { SIMPLE_PROMO_ONLY_BAND_CREATION } from "./bandSwitcherConfig";
import { useBandSwitcher } from "./BandSwitcherContext";

/**
 * Modal para mejorar el plan de una banda.
 * @returns Sección de interfaz.
 */
export function UpgradePlanModal() {
  const { showUpgradeModal, selectedBandForUpgrade, availableBands, currentUser, setShowUpgradeModal, setSuccessMessage, onRefreshData } = useBandSwitcher();
  return (
    <>
{/* Upgrade Plan Modal */}
        {showUpgradeModal &&
          (() => {
            const targetBand = selectedBandForUpgrade ||
              availableBands.find((b) =>
                isSameBandId(b.band_id, currentUser?.band_id),
              ) || {
                band_id: currentUser?.band_id,
                bandName: currentUser?.bandName,
                plan: currentUser?.plan,
              };
            const targetBandName =
              targetBand.bandName ||
              targetBand.nombre_banda ||
              currentUser?.bandName ||
              "tu banda";
            const targetBandPlan =
              targetBand.plan ||
              (isSameBandId(targetBand.band_id, currentUser?.band_id)
                ? currentUser?.plan
                : "ensayo");
            const currentPlanDef = getPlanDefinition(targetBandPlan);

            return (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/85 animate-in fade-in duration-200 text-left">
                <div className="w-full max-w-lg rounded-[var(--r-l)] bg-[var(--surface)] text-[var(--ink-2)] overflow-hidden flex flex-col">
                  <div className="px-6 py-4 bg-[var(--acc)] flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-[var(--r-s)] bg-[var(--acc)]/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-[var(--acc)]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[var(--acc)]/70 font-sans">
                          Planes y Upgrade — {targetBandName}
                        </h3>
                        <p className="text-micro text-[var(--ink-2)] font-sans">
                          Plan independiente para {targetBandName}
                        </p>
                      </div>
                    </div>
                    <IconButton
                      label="Cerrar"
                      size="icon-xs"
                      onClick={() => setShowUpgradeModal(false)}
                    >
                      <X className="w-5 h-5" />
                    </IconButton>
                  </div>

                  <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-3">
                      {Object.values(PLANS)
                        .filter(
                          (p) =>
                            !SIMPLE_PROMO_ONLY_BAND_CREATION ||
                            p.id === "promo",
                        )
                        .map((plan) => {
                          const isCurrent = currentPlanDef.id === plan.id;
                          return (
                            <div
                              key={plan.id}
                              className={`p-4 rounded-[var(--r-m)] transition-ui ${
                                isCurrent
                                  ? "bg-[var(--acc)]/10 ring-1 ring-[var(--acc)]/30"
                                  : "bg-[var(--surface)]/60 hover:"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-[var(--ink)] font-sans">
                                    {plan.name}
                                  </span>
                                  {isCurrent && (
                                    <span className="text-micro font-sans font-bold px-2 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--ink)]">
                                      Plan actual
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs font-bold font-sans text-[var(--acc)]">
                                  {plan.price}
                                </span>
                              </div>
                              <p className="text-xs text-[var(--ink-2)] mt-1">
                                {plan.description}
                              </p>
                              <ul className="mt-2.5 space-y-1 font-sans">
                                {plan.features.map((feat, idx) => (
                                  <li
                                    key={idx}
                                    className="text-micro text-[var(--ink-2)] flex items-center gap-1.5"
                                  >
                                    <Check className="w-3 h-3 text-[var(--ok)] shrink-0" />
                                    <span>{feat}</span>
                                  </li>
                                ))}
                              </ul>

                              <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 ">
                                <span className="text-micro font-sans text-[var(--ink-2)]">
                                  {isCurrent
                                    ? "Plan activo para esta banda"
                                    : "Cambio de plan inmediato"}
                                </span>
                                {isCurrent ? (
                                  <span className="text-micro font-sans font-bold px-2.5 py-1 rounded bg-[var(--acc)]/20 text-[var(--ink)] flex items-center gap-1">
                                    <Check className="w-3 h-3 text-[var(--acc)]" />
                                    <span>Activo</span>
                                  </span>
                                ) : (
                                  <Button
                                    variant="primary"
                                    size="xs"
                                    type="button"
                                    onClick={async () => {
                                      const isLeaderOrAdmin =
                                        targetBand?.role === "leader" ||
                                        targetBand?.role === "admin" ||
                                        currentUser?.role === "leader" ||
                                        currentUser?.role === "admin";
                                      if (!isLeaderOrAdmin) {
                                        alert(
                                          "Sólo los administradores o líderes de esta banda pueden cambiar o mejorar su plan de suscripción.",
                                        );
                                        return;
                                      }
                                      try {
                                        const targetBandId =
                                          targetBand.band_id ||
                                          currentUser?.band_id;

                                        // If it's a paid plan, initiate Stripe Checkout session!
                                        if (plan.id !== "ensayo") {
                                          await api.startCheckout({
                                            planId: plan.id,
                                            billingInterval: "monthly",
                                            bandId: targetBandId,
                                            userEmail:
                                              currentUser?.email &&
                                              currentUser.email.includes("@")
                                                ? currentUser.email
                                                : undefined,
                                          });
                                          setShowUpgradeModal(false);
                                          return;
                                        }

                                        // Free plan (ensayo)
                                        if (currentUser?.id) {
                                          await api.updateUser(currentUser.id, {
                                            plan: plan.id,
                                            band_id: targetBandId,
                                          });
                                        }
                                        if (
                                          isSameBandId(
                                            targetBandId,
                                            currentUser?.band_id,
                                          ) &&
                                          currentUser
                                        ) {
                                          const updatedUser = {
                                            ...currentUser,
                                            plan: plan.id,
                                          };
                                          localStorage.setItem(
                                            "bandmanager_user",
                                            JSON.stringify(updatedUser),
                                          );
                                        }
                                        setShowUpgradeModal(false);
                                        setSuccessMessage(
                                          `¡Plan de ${targetBandName} cambiado a ${plan.name}!`,
                                        );
                                        if (onRefreshData)
                                          await onRefreshData();
                                      } catch (e) {
                                        console.error(
                                          "Error al cambiar plan:",
                                          e,
                                        );
                                        alert(
                                          getErrorMessage(e) ||
                                            "No se pudo actualizar el plan. Reintenta en unos instantes.",
                                        );
                                      }
                                    }}
                                    className="items-center gap-1"
                                  >
                                    <Sparkles className="w-3 h-3 fill-[var(--ink-3)]" />
                                    <span>Seleccionar {plan.name}</span>
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  <div className="px-6 py-3 bg-[var(--sunken)] flex justify-end">
                    <button
                      onClick={() => setShowUpgradeModal(false)}
                      className="px-4 py-1.5 rounded-[var(--r-pill)] text-xs font-sans bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] transition-colors cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
    </>
  );
}
