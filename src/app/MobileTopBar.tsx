/**
 * Cabecera móvil con marca y menú.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ChevronDown,Sparkles,Target } from "lucide-react";
import { NotificationCenterBell } from "../components/notifications/NotificationCenterBell";
import { Button } from "../components/ui";
import { getPlanDefinition } from "../utils/planPermissions";
import { useApp } from "./AppContext";

/**
 * Cabecera móvil con marca y menú.
 * @returns Sección de interfaz.
 */
export function MobileTopBar() {
  const { setShowBandSwitcherModal, currentActiveBandLogo, currentActiveBandName, syncStatus, setShowUserProfileModal, currentActiveBandPlan, notificationPermission, notificationConfig, notificationHistory, notificationUnreadCount, setShowNotificationSettingsModal, requestNotificationPermission, markAllNotificationsAsRead, markNotificationAsRead, clearNotificationHistory, handleNavigate, setShowOnboardingModal, isPromoPlan, activeCampaign, setShowCampaignModal } = useApp();
  return (
    <>
{/* MOBILE TOP BAR */}
        <header className="lg:hidden flex flex-col bg-[var(--surface)] sticky top-0 z-30 shrink-0">
          {/* Top Brand & Menu Row */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <div
              onClick={() => setShowBandSwitcherModal(true)}
              className="flex items-center gap-3 cursor-pointer group active:scale-[0.97] transition-colors p-1 -ml-1 rounded-[var(--r-m)] hover:bg-[var(--sunken)]"
              title="Toca para cambiar de banda"
            >
              <div className="relative shrink-0">
                {currentActiveBandLogo ? (
                  <img
                    src={currentActiveBandLogo}
                    alt="Logo"
                    className="w-12 h-12 sm:w-14 sm:h-14 object-contain p-1 bg-[var(--sunken)] rounded-[var(--r-m)] shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--acc-soft)] text-[var(--acc-ink)] flex items-center justify-center font-bold text-xs shrink-0">
                    {currentActiveBandName[0]?.toUpperCase() || "B"}
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <h1
                    className={`font-bold font-display text-[var(--ink)] group-hover:text-[var(--acc-ink)] transition-colors leading-none truncate max-w-[150px] sm:max-w-[200px] notranslate ${currentActiveBandName.length > 20 ? "text-xs" : "text-xs sm:text-sm"}`}
                    translate="no"
                  >
                    {currentActiveBandName}
                  </h1>
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--acc-ink)] group-hover:translate-y-0.5 transition-transform" />
                  <span
                    className={`w-1.5 h-1.5 rounded-[var(--r-pill)] shrink-0 ${syncStatus === "synced" ? "bg-[var(--ok)]/30" : syncStatus === "error" ? "bg-[var(--alert)]" : "bg-[var(--ink-3)]"}`}
                  />
                </div>
                <Button
                  variant="neutral"
                  size="xs"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserProfileModal(true);
                  }}
                  className="items-center gap-1 mt-0.5 w-fit"
                  title="Plan actual. Clic para gestionar suscripción (Upgrade / Downgrade)"
                >
                  <Sparkles className="w-2 h-2" />
                  <span>{getPlanDefinition(currentActiveBandPlan).name}</span>
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <NotificationCenterBell
                permission={notificationPermission}
                config={notificationConfig}
                history={notificationHistory}
                unreadCount={notificationUnreadCount}
                onOpenSettings={() => setShowNotificationSettingsModal(true)}
                onRequestPermission={requestNotificationPermission}
                onMarkAllAsRead={markAllNotificationsAsRead}
                onMarkAsRead={markNotificationAsRead}
                onClearHistory={clearNotificationHistory}
                onSelectLead={(leadId) =>
                  handleNavigate("booking", { selectedLeadId: leadId })
                }
                variant="mobile"
              />
              <Button
                variant="neutral"
                size="xs"
                type="button"
                onClick={() => setShowOnboardingModal(true)}
                className="items-center gap-1.5"
                title="Guía rápida: ¿Por dónde empezar?"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-micro hidden xs:inline">Guía</span>
              </Button>
              {!isPromoPlan && (
                <Button
                  variant={activeCampaign ? "inverse" : "neutral"}
                  size="xs"
                  onClick={() => setShowCampaignModal(true)}
                  className="items-center gap-1.5"
                  title="Gestionar campañas de booking"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span className="text-micro hidden xs:inline">
                    {activeCampaign ? "Campaña" : "Campañas"}
                  </span>
                </Button>
              )}
            </div>
          </div>
        </header>
    </>
  );
}
