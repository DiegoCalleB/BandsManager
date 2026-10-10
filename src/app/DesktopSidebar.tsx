/**
 * Barra lateral de escritorio con navegación, campañas y perfil.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ChevronDown,ExternalLink,Guitar,LogOut,Sparkles,Target,Zap } from "lucide-react";
import { NavGroupSection } from "../components/common/NavGroupSection";
import { NavItemButton } from "../components/common/NavItemButton";
import { ThemeToggle } from "../components/common/ThemeToggle";
import { AiSupportWidget } from "../components/dashboard/AiUsageSupportWidget";
import { NotificationCenterBell } from "../components/notifications/NotificationCenterBell";
import { Button,IconButton } from "../components/ui";
import { FLAT_NAV_ORDER_IDS,NAV_GROUPS_DESKTOP,NAV_ITEMS,NAV_PINNED_BOTTOM_IDS,NAV_PINNED_TOP_IDS,NavItemId } from "../config/navGroups";
import { textOnColor } from "../utils/contrastText";
import { getPlanDefinition,hasModuleAccess } from "../utils/planPermissions";
import { useApp } from "./AppContext";
import type { MainView } from "./appViews";

/**
 * Barra lateral de escritorio con navegación, campañas y perfil.
 * @returns Sección de interfaz.
 */
export function DesktopSidebar() {
  const { setShowBandSwitcherModal, currentActiveBandLogo, currentActiveBandName, currentActiveBandPlan, setShowOnboardingModal, grupoActivo, t, currentView, navBadges, handleNavigate, shouldGroupNav, isAdmin, openNavGroupIds, toggleNavGroup, isPromoPlan, setShowCampaignModal, activeCampaign, leads, posts, currentUser, setShowUserProfileModal, handleLogout, notificationPermission, notificationConfig, notificationHistory, notificationUnreadCount, setShowNotificationSettingsModal, requestNotificationPermission, markAllNotificationsAsRead, markNotificationAsRead, clearNotificationHistory } = useApp();
  return (
    <>
<aside className="hidden lg:flex w-[240px] shrink-0 bg-[var(--surface)] flex-col h-screen sticky top-0 overflow-hidden border-r border-[var(--hair)]">
          {/* Scrollable Middle Area (Brand, Nav, Campañas, Créditos, Soporte) */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col">
            {/* Brand Header (Clickable Netflix Style Switcher) */}
            <div
              onClick={() => setShowBandSwitcherModal(true)}
              className="p-3.5 flex flex-col gap-2 items-center text-center cursor-pointer group transition-colors duration-300 hover:bg-[var(--sunken)] relative"
              title="Haz clic para cambiar de banda"
            >
            <div className="relative group/logo">
              {currentActiveBandLogo ? (
                <img
                  src={currentActiveBandLogo}
                  alt="Logo"
                  className="w-24 h-24 xl:w-28 xl:h-28 object-contain p-2 bg-[var(--sunken)] rounded-[var(--r-l)] transition-transform duration-300 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-24 h-24 xl:w-28 xl:h-28 rounded-[var(--r-l)] bg-[var(--sunken)] flex flex-col items-center justify-center text-[var(--acc-ink)] gap-1 p-2 shrink-0 transition-transform duration-300">
                  <Guitar className="w-6 h-6 opacity-80 transition-transform" />
                  <span className="text-micro font-bold text-[var(--ink-2)] text-center">
                    {currentActiveBandName}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center w-full px-1 gap-1">
              <div className="flex items-center justify-center gap-1 w-full">
                <h1
                  className={`font-bold font-display text-[var(--ink)] group-hover:text-[var(--acc-ink)] transition-colors leading-tight text-center break-words line-clamp-2 max-w-full notranslate ${
                    currentActiveBandName.length > 22
                      ? "text-xs"
                      : currentActiveBandName.length > 14
                        ? "text-sm"
                        : currentActiveBandName.length > 9
                          ? "text-base"
                          : "text-lg"
                  }`}
                  translate="no"
                >
                  {currentActiveBandName}
                </h1>
                <ChevronDown className="w-4 h-4 text-[var(--acc-ink)] group-hover:translate-y-0.5 transition-transform shrink-0" />
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-bold bg-[var(--acc-soft)] text-[var(--acc-ink)]">
                <Sparkles className="w-2.5 h-2.5" />
                {getPlanDefinition(currentActiveBandPlan).name}
              </span>
            </div>
          </div>

          <div className="px-3 pt-2.5 pb-1">
            <Button
              variant="neutral"
              size="xs"
              type="button"
              onClick={() => setShowOnboardingModal(true)}
              className="w-full items-center justify-center gap-1.5"
              title="Guía interactiva para nuevos músicos"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>¿Por dónde empezar?</span>
            </Button>
          </div>

          {/* Navigation */}
          <nav data-grupo={grupoActivo} className="flex flex-col gap-0.5 px-3 pt-2 flex-1">
            {NAV_PINNED_TOP_IDS.map((id) => {
              const item = NAV_ITEMS[id];
              return (
                <NavItemButton
                  key={item.id}
                  item={item}
                  label={t(item.labelKey, item.labelDefault)}
                  isSelected={currentView === item.id}
                  isAllowed={hasModuleAccess(currentActiveBandPlan, item.id)}
                  badge={navBadges[item.id]}
                  onNavigate={() => handleNavigate(item.id as MainView)}
                  variant="desktop"
                />
              );
            })}
            {shouldGroupNav
              ? NAV_GROUPS_DESKTOP.map((group) => (
                  <NavGroupSection
                    key={group.id}
                    group={group}
                    currentView={currentView}
                    currentActiveBandPlan={currentActiveBandPlan}
                    isAdmin={isAdmin}
                    navBadges={navBadges}
                    onNavigate={(id) => handleNavigate(id as MainView)}
                    isOpen={!!openNavGroupIds[group.id]}
                    onToggleOpen={() => toggleNavGroup(group.id)}
                    t={t}
                    variant="desktop"
                  />
                ))
              : FLAT_NAV_ORDER_IDS.filter(
                  (id) => !(NAV_PINNED_TOP_IDS as NavItemId[]).includes(id),
                )
                  .map((id) => NAV_ITEMS[id])
                  .filter(
                    (item) =>
                      (!item.adminOnly || isAdmin) &&
                      (!isPromoPlan ||
                        hasModuleAccess(currentActiveBandPlan, item.id)),
                  )
                  .map((item) => (
                    <NavItemButton
                      key={item.id}
                      item={item}
                      label={t(item.labelKey, item.labelDefault)}
                      isSelected={currentView === item.id}
                      isAllowed={hasModuleAccess(
                        currentActiveBandPlan,
                        item.id,
                      )}
                      badge={navBadges[item.id]}
                      onNavigate={() => handleNavigate(item.id as MainView)}
                      variant="desktop"
                    />
                  ))}
            {shouldGroupNav &&
              NAV_PINNED_BOTTOM_IDS.filter((id) =>
                hasModuleAccess(currentActiveBandPlan, id),
              ).map((id) => {
                const item = NAV_ITEMS[id];
                return (
                  <NavItemButton
                    key={item.id}
                    item={item}
                    label={t(item.labelKey, item.labelDefault)}
                    isSelected={currentView === item.id}
                    isAllowed={hasModuleAccess(currentActiveBandPlan, item.id)}
                    badge={navBadges[item.id]}
                    onNavigate={() => handleNavigate(item.id as MainView)}
                    variant="desktop"
                  />
                );
              })}
          </nav>

          {/* Campañas de Booking (oculto en plan Promo, no tiene acceso a Booking) */}
          {!isPromoPlan && (
            <div className="px-3 pt-3 pb-2 space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-semibold text-[var(--ink-2)]">
                  Campañas
                </p>
                <button
                  onClick={() => setShowCampaignModal(true)}
                  className="text-xs font-semibold text-[var(--acc-ink)] hover:brightness-90 flex items-center gap-1 cursor-pointer"
                  title="Gestionar campañas de booking"
                >
                  <Target className="w-3 h-3" />
                  <span>Configurar</span>
                </button>
              </div>

              {/* Quick Campaign Switcher / Status */}
              <button
                onClick={() => setShowCampaignModal(true)}
                className={`w-full flex items-center justify-between p-2 rounded-[var(--r-m)] text-left transition-colors cursor-pointer group ${
                  activeCampaign
                    ? "bg-[var(--acc-soft)] text-[var(--acc-ink)]"
                    : "bg-[var(--sunken)] hover:brightness-95 text-[var(--ink-2)] hover:text-[var(--ink-2)]"
                }`}
                title="Configurar y activar campañas de booking con fechas objetivo"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`p-1 rounded-[var(--r-s)] ${activeCampaign ? "bg-[var(--acc)]/25 text-[var(--ink)]" : "bg-[var(--surface)] text-[var(--ink-2)]"}`}
                  >
                    <Target className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold truncate leading-tight">
                      {activeCampaign ? activeCampaign.name : "Modo Campaña"}
                    </span>
                    <span className="text-micro text-[var(--ink-2)] truncate">
                      {activeCampaign
                        ? `${activeCampaign.targetDates?.length || 0} fechas en calendario`
                        : "Sin campaña activa"}
                    </span>
                  </div>
                </div>
                <span className="text-micro font-bold px-1.5 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/20 text-[var(--ink)] shrink-0">
                  {activeCampaign ? "Activa" : "Elegir"}
                </span>
              </button>
            </div>
          )}

          {/* Sidebar AI Credits Widget (oculto en plan Promo: no tiene créditos IA ni acceso a Planes) */}
          {!isPromoPlan &&
            (() => {
              const userPlan = currentActiveBandPlan;
              const pDef = getPlanDefinition(userPlan);
              const totalCredits =
                userPlan === "cabeza_de_cartel"
                  ? 2500
                  : userPlan === "de_gira"
                    ? 800
                    : userPlan === "local"
                      ? 300
                      : 100;
              const estimatedUsed = Math.min(
                totalCredits,
                Math.max(12, leads.length * 2 + posts.length),
              );
              const pct = Math.min(
                100,
                Math.round((estimatedUsed / totalCredits) * 100),
              );

              return (
                <div
                  onClick={() => handleNavigate("planes")}
                  className="mx-3 my-2 p-2.5 rounded-[var(--r-m)] bg-[var(--sunken)] hover:brightness-95 transition-colors cursor-pointer group"
                  title="Ver consumo de créditos IA y planes"
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-[var(--acc-ink)]" />
                      <span className="text-xs font-semibold text-[var(--ink-2)]">
                        Créditos IA
                      </span>
                    </div>
                    <span className="text-micro font-semibold tabular-nums text-[var(--ink-2)]">
                      {estimatedUsed} / {totalCredits}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-[var(--r-pill)] bg-[var(--surface)] overflow-hidden">
                    <div
                      className={`h-full rounded-[var(--r-pill)] transition-ui duration-300 ${
                        pct > 85 ? "bg-[var(--alert)]" : "bg-[var(--acc)]"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-micro text-[var(--ink-2)] mt-1">
                    <span className="truncate max-w-[100px]">
                      Plan {pDef.name}
                    </span>
                    <span className="text-[var(--acc-ink)] font-semibold transition-colors">
                      Planes →
                    </span>
                  </div>
                </div>
              );
            })()}

          <AiSupportWidget variant="sidebar" />
          </div>

          {/* Bottom Fixed User Profile & Actions Footer */}
          <div className="shrink-0 p-3 border-t border-[var(--hair)] bg-[var(--surface)] flex flex-col gap-2">
            {currentUser && (
              <div className="flex items-center justify-between p-2 rounded-[var(--r-m)] bg-[var(--sunken)] gap-2">
                <div
                  onClick={() => setShowUserProfileModal(true)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer text-left group"
                  title="Ver perfil de usuario"
                >
                  <div
                    className="w-7 h-7 rounded-[var(--r-s)] flex items-center justify-center font-bold text-[var(--ink)] text-xs font-sans shrink-0 transition-ui group-hover:brightness-105"
                    style={{
                      backgroundColor: currentUser.avatarColor || "var(--acc)",
                      color: textOnColor(currentUser.avatarColor || "var(--acc)"),
                    }}
                  >
                    {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : "US"}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-bold font-sans text-[var(--ink)] truncate group-hover:text-[var(--acc-ink)] transition-colors">
                      {currentUser.name}
                    </span>
                    <span
                      className="text-micro text-[var(--ink-2)] truncate"
                      title={currentUser.email || currentUser.username}
                    >
                      {currentUser.email || currentUser.username}
                    </span>
                  </div>
                </div>

                <IconButton
                  label="Cerrar Sesión"
                  variant="danger"
                  size="icon-xs"
                  onClick={handleLogout}
                  className="shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </IconButton>
              </div>
            )}

            <div className="flex items-center justify-between px-1">
              <a
                href="/landing"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 min-w-0 group hover:opacity-80 transition-opacity"
                title="Ver landing page oficial (abrir en pestaña nueva)"
              >
                <img
                  src="/logo_bandmanager_symbol.png?v=4"
                  alt="BandManager.io"
                  className="w-6 h-6 object-contain shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-micro font-bold font-display text-[var(--ink-2)] leading-none truncate group-hover:text-[var(--ink)]">
                    BANDMANAGER<span className="text-[var(--acc)]">.io</span>
                  </span>
                  <span className="text-micro text-[var(--ink-2)] font-normal flex items-center gap-0.5">
                    Landing <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                  </span>
                </div>
              </a>
              <div className="flex items-center gap-1 shrink-0">
                <ThemeToggle compact openUpward />
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
                  variant="desktop"
                  openUpward
                />
              </div>
            </div>
          </div>
        </aside>
    </>
  );
}
