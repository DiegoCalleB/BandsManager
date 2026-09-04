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
   *  al final del grupo, solo mientras está abierto. */
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
  const items = group.itemIds.map((id) => NAV_ITEMS[id]).filter((item) => !item.adminOnly || isAdmin);
  if (items.length === 0) return null;

  const headerPadding = variant === 'desktop' ? 'px-3' : 'px-3.5';

  const handleHeaderClick = () => {
    onToggleOpen();
    onNavigate(items[0].id);
  };

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={handleHeaderClick}
        className={`w-full flex items-center justify-between ${headerPadding} py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer`}
        aria-expanded={isOpen}
      >
        <span>{t(group.titleKey, group.titleDefault)}</span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
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
