// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import React from 'react';
import { Lock } from 'lucide-react';
import { NavItemDef } from '../../config/navGroups';

interface NavItemButtonProps {
  item: NavItemDef;
  label: string;
  isSelected: boolean;
  isAllowed: boolean;
  badge?: number | string;
  onNavigate: () => void;
  variant: 'desktop' | 'mobile';
}

export const NavItemButton: React.FC<NavItemButtonProps> = ({ item, label, isSelected, isAllowed, badge, onNavigate, variant }) => {
  const IconComp = item.icon;

  if (variant === 'desktop') {
    return (
      <button
        id={`nav-btn-${item.id}`}
        onClick={onNavigate}
        className={`flex items-center justify-between py-2.5 px-3 rounded-xl text-[13px] font-sans transition-all duration-200 cursor-pointer active:scale-95 ${
          isSelected
            ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/35 shadow-xs'
            : 'text-neutral-300 hover:bg-[#22211f] hover:text-white hover:translate-x-0.5'
        }`}
      >
        <div className="flex items-center gap-3">
          <IconComp className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isSelected ? 'text-amber-400 scale-110' : 'text-neutral-400'}`} />
          <span className="whitespace-nowrap">{label}</span>
        </div>
        {!isAllowed ? (
          <span className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400/90 border border-amber-500/20">
            <Lock className="w-3 h-3" />
            <span>Plan</span>
          </span>
        ) : badge !== undefined && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold transition-colors ${
            isSelected ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-neutral-800 text-neutral-400'
          }`}>
            {badge}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onNavigate}
      className={`flex items-center justify-between py-3 px-3.5 rounded-xl text-sm font-sans transition-colors cursor-pointer ${
        isSelected
          ? 'bg-zinc-800/80 text-zinc-100 font-bold border-zinc-700'
          : !isAllowed
          ? 'text-neutral-500 hover:bg-[#22211f]/60'
          : 'text-neutral-300 hover:bg-[#22211f] hover:text-white'
      }`}
    >
      <div className="flex items-center gap-3">
        <IconComp className={`w-4 h-4 shrink-0 ${!isAllowed ? 'opacity-40' : ''}`} />
        <span className="whitespace-nowrap">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {!isAllowed && (
          <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Lock className="w-3 h-3" />
            <span>Upgrade</span>
          </span>
        )}
        {badge !== undefined && isAllowed && (
          <span className={`text-xs px-2 py-0.5 rounded-md font-sans font-bold ${
            isSelected ? 'bg-zinc-700 text-zinc-300' : 'bg-[#22211F] text-neutral-400'
          }`}>
            {badge}
          </span>
        )}
      </div>
    </button>
  );
};
