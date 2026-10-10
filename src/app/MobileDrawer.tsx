/**
 * Cajón de navegación móvil.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { LogOut,X,Zap } from "lucide-react";
import { NavGroupSection } from "../components/common/NavGroupSection";
import { NavItemButton } from "../components/common/NavItemButton";
import { AiSupportWidget } from "../components/dashboard/AiUsageSupportWidget";
import { IconButton } from "../components/ui";
import { FLAT_NAV_ORDER_IDS,NAV_GROUPS_MOBILE,NAV_ITEMS,NAV_PINNED_BOTTOM_IDS,NAV_PINNED_TOP_IDS,NavItemId } from "../config/navGroups";
import { textOnColor } from "../utils/contrastText";
import { getPlanDefinition,hasModuleAccess } from "../utils/planPermissions";
import { useApp } from "./AppContext";
import type { MainView } from "./appViews";

/**
 * Cajón de navegación móvil.
 * @returns Sección de interfaz.
 */
export function MobileDrawer() {
  const { isMobileMenuOpen, setIsMobileMenuOpen, currentActiveBandLogo, currentActiveBandName, syncStatus, grupoActivo, t, currentView, currentActiveBandPlan, navBadges, handleNavigate, shouldGroupNav, isAdmin, openNavGroupIds, toggleNavGroup, isPromoPlan, leads, posts, currentUser, setShowUserProfileModal, handleLogout } = useApp();
  return (
    <>
{/* z-[9999], no z-50: mismo motivo que el resto de overlays de esta sesión — la barra del
 reproductor y la nav inferior (z-40, en su propio contexto de apilamiento) pueden tapar
 un z-50 local a este árbol. Encontrado por scripts/design-audit.js, no a mano. */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-[9999] flex">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-[var(--scrim)]/75 transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Drawer panel */}
            <div className="relative w-[280px] max-w-[85vw] bg-[var(--surface)] flex flex-col h-full z-10 overflow-y-auto">
              {/* Drawer Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {currentActiveBandLogo ? (
                    <img
                      src={currentActiveBandLogo}
                      alt="Logo"
                      className="w-14 h-14 object-contain p-1 bg-[var(--sunken)] rounded-[var(--r-m)] shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--acc-soft)] text-[var(--acc-ink)] flex items-center justify-center font-bold text-sm shrink-0">
                      {currentActiveBandName[0]?.toUpperCase() || "B"}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <h1
                      className={`font-bold font-display text-[var(--ink)] leading-tight notranslate ${currentActiveBandName.length > 20 ? "text-xs" : currentActiveBandName.length > 12 ? "text-sm" : "text-base"}`}
                      translate="no"
                    >
                      {currentActiveBandName}
                    </h1>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-[var(--r-pill)] shrink-0 ${syncStatus === "synced" ? "bg-[var(--ok)]/30" : syncStatus === "error" ? "bg-[var(--alert)]" : "bg-[var(--ink-3)]"}`}
                      />
                      <span className="text-micro font-sans text-[var(--ink-2)]">
                        Banda activa
                      </span>
                    </div>
                  </div>
                </div>
                <IconButton
                  label="Cerrar"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="w-5 h-5" />
                </IconButton>
              </div>

              {/* Drawer Nav */}
              <nav data-grupo={grupoActivo} className="flex flex-col gap-1 px-3 pt-3 flex-1">
                {NAV_PINNED_TOP_IDS.map((id) => {
                  const item = NAV_ITEMS[id];
                  return (
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
                      variant="mobile"
                    />
                  );
                })}
                {shouldGroupNav
                  ? NAV_GROUPS_MOBILE.map((group) => (
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
                        variant="mobile"
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
                          variant="mobile"
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
                        isAllowed={hasModuleAccess(
                          currentActiveBandPlan,
                          item.id,
                        )}
                        badge={navBadges[item.id]}
                        onNavigate={() => handleNavigate(item.id as MainView)}
                        variant="mobile"
                      />
                    );
                  })}
              </nav>

              {/* Mobile AI Credits Widget (oculto en plan Promo: no tiene créditos IA ni acceso a Planes).
 Antes tenía datos inventados a fuego ("340 / 800", "Plan De Gira" fijos, sin mirar el plan
 real de la banda) - se sustituye por el mismo cálculo que ya usa la versión de escritorio,
 para no enseñar un número que no tiene nada que ver con la banda que estás viendo. */}
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
                      onClick={() => {
                        handleNavigate("planes");
                        setIsMobileMenuOpen(false);
                      }}
                      className="mx-3 my-2 p-2.5 rounded-[var(--r-m)] bg-[var(--sunken)] hover:brightness-95 transition-colors cursor-pointer group"
                      title="Ver uso de créditos IA y planes"
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

              {/* Ko-fi en el menú móvil: sin esto, en móvil el CTA de apoyo solo salía en la tarjeta del
 Resumen - un usuario que vive navegando por Booking/Repertorio/etc. y nunca entra en
 Resumen no lo veía nunca. Sin gate de plan: el gasto de IA (y el apoyo a él) no depende
 de qué plan tengas. */}
              <AiSupportWidget variant="sidebar" />

              {/* Drawer User Footer */}
              <div className="p-4 mt-auto">
                {currentUser && (
                  <div className="flex flex-col gap-2 mb-4 p-2.5 rounded-[var(--r-m)] bg-[var(--sunken)]">
                    <div
                      onClick={() => {
                        setShowUserProfileModal(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full cursor-pointer text-left group"
                    >
                      <div
                        className="w-8 h-8 rounded-[var(--r-s)] flex items-center justify-center font-bold text-[var(--ink)] text-xs font-sans shrink-0 transition-transform "
                        style={{
                          backgroundColor:
                            currentUser.avatarColor || "var(--acc)",
                          color: textOnColor(currentUser.avatarColor || "var(--acc)"),
                        }}
                      >
                        {currentUser.name ? currentUser.name.slice(0, 2) : "US"}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-bold font-sans text-[var(--ink)] truncate">
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
                  </div>
                )}
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <img
                      src="/logo_bandmanager_symbol.png?v=4"
                      alt="BandManager.io"
                      className="w-7 h-7 object-contain shrink-0 transition-ui cursor-pointer"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col text-left">
                      <span className="text-micro font-bold font-display text-[var(--ink-2)] leading-none">
                        BANDMANAGER
                        <span className="text-[var(--acc)]">.io</span>
                      </span>
                    </div>
                  </div>
                  <IconButton
                    label="Cerrar Sesión"
                    variant="danger"
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                  </IconButton>
                </div>
              </div>
            </div>
          </div>
        )}
    </>
  );
}
