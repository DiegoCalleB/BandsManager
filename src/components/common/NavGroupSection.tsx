import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { NavGroupDef, NavItemId, NAV_ITEMS } from '../../config/navGroups';
import { hasModuleAccess } from '../../utils/planPermissions';
import { NavItemButton } from './NavItemButton';

interface NavGroupSectionProps {
  group: NavGroupDef;
  currentView: string;
  currentActiveBandPlan?: string;
  isAdmin: boolean;
  navBadges: Record<string, number | string>;
  onNavigate: (id: NavItemId) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  t: (key: string, fallback: string) => string;
  variant: 'desktop' | 'mobile';
  /** Contenido extra (no-navegación, ej. accesos a Metrónomo/Afinador) mostrado
   * al final del grupo, solo mientras está abierto. */
  children?: React.ReactNode;
}

export const NavGroupSection: React.FC<NavGroupSectionProps> = ({
  group,
  currentView,
  currentActiveBandPlan,
  isAdmin,
  navBadges,
  onNavigate,
  isOpen,
  onToggleOpen,
  t,
  variant,
  children,
}) => {
  const items = group.itemIds
    .map((id) => NAV_ITEMS[id])
    .filter((item) => (!item.adminOnly || isAdmin) && hasModuleAccess(currentActiveBandPlan, item.id));
  if (items.length === 0) return null;

  const headerPadding = variant === 'desktop' ? 'px-3' : 'px-3.5';

  const isGroupActive = items.some((i) => i.id === currentView);

  const handleHeaderClick = () => {
    if (!isGroupActive && items.length > 0) {
      const targetItem = items[0];
      onNavigate(targetItem.id);
      if (!isOpen) {
        onToggleOpen();
      }
    } else {
      onToggleOpen();
    }
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleOpen();
  };

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={handleHeaderClick}
        className={`w-full flex items-center justify-between ${headerPadding} py-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${
          isGroupActive ? 'text-[var(--acc-ink)]' : 'text-[var(--ink-2)] hover:text-[var(--ink-2)]'
        }`}
        aria-expanded={isOpen}
      >
        <span
          className="flex items-center gap-1.5"
          onClick={(e) => {
            e.stopPropagation();
            handleHeaderClick();
          }}
        >
          {isGroupActive && <span className="w-1.5 h-1.5 rounded-[var(--r-pill)] bg-[var(--acc)]" />}
          <span>{t(group.titleKey, group.titleDefault)}</span>
        </span>
        <span
          role="button"
          tabIndex={0}
          onClick={handleChevronClick}
          className="p-1 -mr-1 rounded-[var(--r-s)] hover:bg-[var(--sunken)] transition-colors"
          title={isOpen ? 'Plegar sección' : 'Desplegar sección'}
        >
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>

      {isOpen && (
        <>
          <div className={variant === 'desktop' ? 'flex flex-col gap-0.5' : 'flex flex-col gap-1'}>
            {items.map((item) => (
              <NavItemButton
                key={item.id}
                item={item}
                label={t(item.labelKey, item.labelDefault)}
                isSelected={currentView === item.id}
                isAllowed={hasModuleAccess(currentActiveBandPlan, item.id)}
                badge={navBadges[item.id]}
                onNavigate={() => onNavigate(item.id)}
                variant={variant}
              />
            ))}
          </div>
          {children}
        </>
      )}
    </div>
  );
};
