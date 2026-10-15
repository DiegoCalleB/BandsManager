/**
 * Diálogo de cambio de plan con la comparativa de planes.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { AlertCircle,Calendar,Check,CreditCard,ExternalLink,Sparkles,X } from "lucide-react";
import { api } from "../../services/api";
import { User } from "../../types";
import { PLANS } from "../../utils/planPermissions";
import { ModalPortal } from "../common/ModalPortal";
import { Button,IconButton } from "../ui";
import { useUserProfile } from "./UserProfileContext";

/**
 * Diálogo de cambio de plan con la comparativa de planes.
 * @returns Sección de interfaz.
 */
export function UpgradePlanDialog() {
  const { showUpgradeModal, setShowUpgradeModal, currentUser, currentPlanDef, onUpdateUser, onNavigateToPlanes, onClose } = useUserProfile();
  return (
    <>
      {showUpgradeModal && (
        <ModalPortal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        >
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/85 overflow-y-auto overscroll-contain animate-in fade-in duration-200 text-left">
            <div
              className={`w-full max-w-lg rounded-[var(--r-l)] overflow-hidden flex flex-col my-auto max-h-[90vh] ${"bg-[var(--surface)] text-[var(--ink)]"}`}
            >
              <div className="px-6 py-4 bg-[var(--acc)]   flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[var(--r-s)] bg-[var(--acc)]/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[var(--acc)]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[var(--acc)]/70 font-sans">
                      Cambiar plan de suscripción
                    </h3>
                    <p className="text-micro text-[var(--ink-2)] font-sans">
                      Selecciona el plan para tu proyecto musical
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
                {currentUser?.estado_suscripcion === "pago_pendiente" && (
                  <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--alert)]/20 text-[var(--ink)] text-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-[var(--alert)] shrink-0" />
                      <span>
                        Pago pendiente. Actualiza tu método de pago para
                        mantener tus funciones.
                      </span>
                    </div>
                    <Button
                      variant="danger"
                      size="xs"
                      type="button"
                      onClick={async () => {
                        try {
                          // Sin email de repuesto: el que había era el del dueño de la plataforma y abría SU
                          // portal de facturación a quien no tuviera email. Lo resuelve el servidor.
                          const res = await api.createPortalSession({
                            bandId: currentUser.band_id,
                            returnUrl: window.location.href,
                          });
                          if (res.success && res.url)
                            window.location.href = res.url;
                        } catch {
                          // El portal de facturación es opcional: si falla, el usuario sigue en el perfil.
                        }
                      }}
                      className="whitespace-nowrap"
                    >
                      Actualizar tarjeta
                    </Button>
                  </div>
                )}

                {currentUser?.plan_pendiente && (
                  <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--ink)] text-xs flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-[var(--acc)] shrink-0" />
                    <span>
                      Cambio programado a{" "}
                      <strong className=" font-sans text-[var(--acc)]/70">
                        {currentUser.plan_pendiente.replace("_", "")}
                      </strong>{" "}
                      al finalizar el ciclo.
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 p-3 rounded-[var(--r-m)] bg-[var(--surface)]/80">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[var(--acc)] shrink-0" />
                    <span className="text-xs text-[var(--ink-2)] font-sans">
                      Facturación y Tarjetas en Stripe:
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await api.createPortalSession({
                          bandId: currentUser.band_id,
                          returnUrl: window.location.href,
                        });
                        if (res.success && res.url) {
                          window.location.href = res.url;
                        } else {
                          alert(
                            res.error ||
                              "No se pudo abrir el portal de Stripe",
                          );
                        }
                      } catch (err) {
                        alert("Error al conectar con Stripe: " + (err instanceof Error ? err.message : "error desconocido"));
                      }
                    }}
                    className="px-3 py-1.5 rounded-[var(--r-pill)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--acc-ink)] text-xs font-sans font-bold transition-ui flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Portal de Stripe</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  Tu proyecto tiene actualmente activo el{" "}
                  <strong className="text-[var(--acc)]/70">
                    {currentPlanDef.name}
                  </strong>
                  . Puedes cambiar de plan al instante haciendo clic en el
                  botón de la opción que desees:
                </p>

                <div className="space-y-3">
                  {Object.values(PLANS).map((plan) => {
                    const isCurrent = plan.id === currentPlanDef.id;
                    return (
                      <div
                        key={plan.id}
                        className={`p-4 rounded-[var(--r-m)] transition-ui ${
                          isCurrent
                            ? "bg-[var(--acc)]/10  ring-1 ring-[var(--acc)]/30"
                            : "bg-[var(--surface)]/60 hover:"
                        }`}
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[var(--ink)] font-sans">
                              {plan.name}
                            </span>
                            <span
                              className="text-micro font-sans font-bold px-2 py-0.5 rounded"
                              style={{
                                backgroundColor: `${plan.color}20`,
                                color: plan.color,
                                borderColor: `${plan.color}40`,
                              }}
                            >
                              {plan.badge}
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

                        {plan.stickerGift && (
                          <div className="mt-2 px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--acc)] flex items-center gap-1.5 text-micro font-sans text-[var(--on-acc)] font-bold">
                            <span>
                              Regalo de bienvenida: {plan.stickerGift.qty}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs font-sans text-[var(--ink-2)] mt-1.5">
                          <span>{plan.description}</span>
                          <span className="text-[var(--ink-2)] font-bold shrink-0">
                            {plan.credits}
                          </span>
                        </div>

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
                              ? "Tu plan activo"
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
                                try {
                                  if (plan.id !== "ensayo") {
                                    await api.startCheckout({
                                      planId: plan.id,
                                      billingInterval: "monthly",
                                      bandId:
                                        currentUser.band_id || "default",
                                      userEmail:
                                        currentUser?.email &&
                                        currentUser.email.includes("@")
                                          ? currentUser.email
                                          : undefined,
                                    });
                                    setShowUpgradeModal(false);
                                    return;
                                  }

                                  if (currentUser?.id) {
                                    await api.updateUser(currentUser.id, {
                                      plan: plan.id,
                                      band_id: currentUser.band_id,
                                    });
                                  }
                                  const updatedUser = {
                                    ...currentUser,
                                    plan: plan.id,
                                  };
                                  localStorage.setItem(
                                    "bandmanager_user",
                                    JSON.stringify(updatedUser),
                                  );
                                  if (onUpdateUser)
                                    onUpdateUser(updatedUser as User);
                                  setShowUpgradeModal(false);
                                  alert(
                                    `¡Plan de suscripción cambiado con éxito a ${plan.name}! Módulos activados.`,
                                  );
                                } catch (e) {
                                  console.error("Error al cambiar plan:", e);
                                  alert(
                                    (e instanceof Error && e.message) ||
                                      "No se pudo cambiar el plan. Reintenta en unos instantes.",
                                  );
                                }
                              }}
                              className="items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3 fill-[var(--on-acc)]" />
                              <span>Seleccionar {plan.name}</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="px-6 py-3 bg-[var(--sunken)] flex items-center justify-between">
                {onNavigateToPlanes ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowUpgradeModal(false);
                      onClose();
                      onNavigateToPlanes();
                    }}
                    className="text-xs font-sans text-[var(--acc)] hover:text-[var(--acc)]/70 flex items-center gap-1.5 cursor-pointer font-bold"
                  >
                    <span>Ver comparativa completa y tabla de planes →</span>
                  </button>
                ) : (
                  <span />
                )}
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="px-4 py-1.5 rounded-[var(--r-pill)] text-xs font-sans bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}
