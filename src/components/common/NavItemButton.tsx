import React from'react';
import { Lock } from'lucide-react';
import { NavItemDef } from'../../config/navGroups';

interface NavItemButtonProps {
 item: NavItemDef;
 label: string;
 isSelected: boolean;
 isAllowed: boolean;
 badge?: number | string;
 onNavigate: () => void;
 variant:'desktop' |'mobile';
}

export const NavItemButton: React.FC<NavItemButtonProps> = ({ item, label, isSelected, isAllowed, badge, onNavigate, variant }) => {
 const IconComp = item.icon;

 if (variant ==='desktop') {
 return (
 <button
 id={`nav-btn-${item.id}`}
 onClick={onNavigate}
 className={`flex items-center justify-between py-2.5 px-3 rounded-[var(--r-pill)] text-[13px] font-sans transition-colors duration-200 cursor-pointer active:scale-95 ${
 isSelected
 ?'bg-[var(--acc-soft)] text-[var(--acc-ink)] font-bold'
 :'text-[var(--ink-2)] hover:bg-[var(--sunken)] hover:text-[var(--ink)] hover:translate-x-0.5'
 }`}
 >
 <div className="flex items-center gap-3">
 <IconComp className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isSelected ?'text-[var(--acc-ink)] scale-110' :'text-[var(--ink-2)]'}`} />
 <span className="whitespace-nowrap">{label}</span>
 </div>
 {!isAllowed ? (
 <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-[var(--r-pill)] bg-[var(--sunken)] text-[var(--ink-2)]">
 <Lock className="w-3 h-3" />
 <span>Plan</span>
 </span>
 ) : badge !== undefined && (
 <span className={`text-[10px] px-2 py-0.5 rounded-[var(--r-pill)] font-semibold tabular-nums transition-colors ${
 isSelected ?'bg-[var(--acc)]/20 text-[var(--on-acc)]' :'bg-[var(--sunken)] text-[var(--ink-2)]'
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
 className={`flex items-center justify-between py-3 px-3.5 rounded-[var(--r-pill)] text-sm font-sans transition-colors cursor-pointer ${
 isSelected
 ?'bg-[var(--acc-soft)] text-[var(--acc-ink)] font-bold'
 : !isAllowed
 ?'text-[var(--ink-2)] hover:bg-[var(--sunken)]'
 :'text-[var(--ink-2)] hover:bg-[var(--sunken)] hover:text-[var(--ink)]'
 }`}
 >
 <div className="flex items-center gap-3">
 <IconComp className={`w-4 h-4 shrink-0 ${!isAllowed ?'opacity-40' :''}`} />
 <span className="whitespace-nowrap">{label}</span>
 </div>
 <div className="flex items-center gap-1.5">
 {!isAllowed && (
 <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-[var(--r-pill)] bg-[var(--sunken)] text-[var(--ink-2)]">
 <Lock className="w-3 h-3" />
 <span>Upgrade</span>
 </span>
 )}
 {badge !== undefined && isAllowed && (
 <span className={`text-xs px-2 py-0.5 rounded-[var(--r-pill)] font-sans font-bold tabular-nums ${
 isSelected ?'bg-[var(--acc)]/20 text-[var(--on-acc)]' :'bg-[var(--sunken)] text-[var(--ink-2)]'
 }`}>
 {badge}
 </span>
 )}
 </div>
 </button>
 );
};
