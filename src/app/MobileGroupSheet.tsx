/**
 * Hoja de grupo de navegación móvil.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { NavItemButton } from "../components/common/NavItemButton";
import { NAV_GROUPS_MOBILE,NAV_ITEMS } from "../config/navGroups";
import { hasModuleAccess } from "../utils/planPermissions";
import { useApp } from "./AppContext";
import type { MainView } from "./appViews";

/**
 * Hoja de grupo de navegación móvil.
 * @returns Sección de interfaz.
 */
export function MobileGroupSheet() {
  const { openGroupSheetId, setOpenGroupSheetId, t, isAdmin, currentActiveBandPlan, currentView, navBadges, handleNavigate } = useApp();
  return (
    <>
{/* MOBILE GROUP SHEET (Música / Promoción): lista los itemIds del grupo tocado
 en la bottom bar, reusando NavItemButton tal cual lo usa el drawer completo. */}
        {openGroupSheetId &&
          (() => {
            const group = NAV_GROUPS_MOBILE.find(
              (g) => g.id === openGroupSheetId,
            );
            if (!group) return null;
            return (
              <>
                <div
                  className="lg:hidden fixed inset-x-0 top-0 bottom-16 z-40 bg-[var(--sunken)]"
                  onClick={() => setOpenGroupSheetId(null)}
                />
                <div className="lg:hidden fixed inset-x-0 bottom-16 z-40 max-h-[60vh] overflow-y-auto bg-[var(--surface)] rounded-t-[var(--r-xl)]">
                  <div className="w-9 h-1 rounded-[var(--r-pill)] bg-[var(--sunken)] mx-auto mt-2.5 mb-1" />
                  <div className="px-4 pt-1 pb-2 text-xs font-semibold text-[var(--ink-2)]">
                    {t(group.titleKey, group.titleDefault)}
                  </div>
                  <div className="px-3 pb-4 flex flex-col gap-1">
                    {group.itemIds
                      .filter(
                        (id) =>
                          (!NAV_ITEMS[id].adminOnly || isAdmin) &&
                          hasModuleAccess(currentActiveBandPlan, id),
                      )
                      .map((id) => {
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
                            onNavigate={() => {
                              handleNavigate(item.id as MainView);
                              setOpenGroupSheetId(null);
                            }}
                            variant="mobile"
                          />
                        );
                      })}
                  </div>
                </div>
              </>
            );
          })()}
    </>
  );
}
