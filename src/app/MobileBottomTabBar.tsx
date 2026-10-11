/**
 * Barra de pestañas inferior móvil.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Menu } from "lucide-react";
import { findNavGroupIdForItem,NAV_BOTTOM_BAR_SLOTS,NAV_GROUPS_MOBILE,NAV_ITEMS,NavItemId } from "../config/navGroups";
import { useApp } from "./AppContext";
import type { MainView } from "./appViews";

/**
 * Barra de pestañas inferior móvil.
 * @returns Sección de interfaz.
 */
export function MobileBottomTabBar() {
  const { grupoActivo, openGroupSheetId, isMobileMenuOpen, currentView, t, setOpenGroupSheetId, setIsMobileMenuOpen, handleNavigate } = useApp();
  return (
    <>
{/* MOBILE BOTTOM TAB BAR — sustituye la fila de tabs + el hamburger de antes: 5
 slots fijos, solo iconos (sin texto), siempre visibles sin scroll ni gestos.
 Resumen/Calendario navegan directo; Música/Promoción abren un sheet con sus
 sub-módulos; Más abre el drawer completo (Contactos, Negocio, Herramientas,
 Chat, perfil...). Ver NAV_BOTTOM_BAR_SLOTS en config/navGroups.tsx. */}
        <nav data-grupo={grupoActivo} className="lg:hidden fixed inset-x-0 bottom-0 z-40 h-16 flex bg-[var(--surface)]">
          {NAV_BOTTOM_BAR_SLOTS.map((slot) => {
            let isActive = false;
            if (openGroupSheetId) {
              isActive =
                slot.kind === "group" && openGroupSheetId === slot.groupId;
            } else if (isMobileMenuOpen) {
              isActive = slot.kind === "more";
            } else {
              if (slot.kind === "view") {
                isActive = currentView === slot.itemId;
              } else if (slot.kind === "group") {
                isActive =
                  (slot.itemId ? currentView === slot.itemId : false) ||
                  findNavGroupIdForItem(currentView) === slot.groupId;
              } else if (slot.kind === "more") {
                const groupOfView = findNavGroupIdForItem(currentView);
                const isDirectBottomSlot =
                  currentView === "resumen" ||
                  currentView === "calendario" ||
                  groupOfView === "musica" ||
                  groupOfView === "promocion";
                isActive = !isDirectBottomSlot;
              }
            }
            const IconComp = slot.itemId
              ? NAV_ITEMS[slot.itemId as NavItemId].icon
              : slot.kind === "group" && slot.groupId
                ? NAV_ITEMS[
                    NAV_GROUPS_MOBILE.find((g) => g.id === slot.groupId)!
                      .itemIds[0]
                  ].icon
                : Menu;
            const slotLabel = t(slot.labelKey, slot.labelDefault);
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => {
                  if (slot.kind === "view") {
                    setOpenGroupSheetId(null);
                    setIsMobileMenuOpen(false);
                    handleNavigate(slot.itemId as MainView);
                  } else if (slot.kind === "group") {
                    setIsMobileMenuOpen(false);
                    const isAlreadyInGroup =
                      (slot.itemId && currentView === slot.itemId) ||
                      findNavGroupIdForItem(currentView) === slot.groupId;
                    if (isAlreadyInGroup) {
                      setOpenGroupSheetId((prev) =>
                        prev === slot.groupId ? null : (slot.groupId as string),
                      );
                    } else {
                      setOpenGroupSheetId(null);
                      const defaultTarget =
                        slot.itemId ||
                        (slot.groupId === "musica" ? "repertorio" : "epk");
                      handleNavigate(defaultTarget as MainView);
                    }
                  } else {
                    setOpenGroupSheetId(null);
                    setIsMobileMenuOpen((prev) => !prev);
                  }
                }}
                className="flex-1 flex items-center justify-center cursor-pointer active:scale-[0.97] transition-transform"
                aria-label={slotLabel}
                title={slotLabel}
              >
                <span
                  className={`flex items-center justify-center w-10 h-10 rounded-[var(--r-pill)] transition-colors ${
                    isActive
                      ? "bg-[var(--acc-soft)] text-[var(--acc-ink)]"
                      : "text-[var(--ink-2)]"
                  }`}
                >
                  <IconComp className="w-5 h-5" />
                </span>
              </button>
            );
          })}
        </nav>
    </>
  );
}
