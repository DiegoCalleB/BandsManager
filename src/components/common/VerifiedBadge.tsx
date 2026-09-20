import React, { useState } from'react';
import { ShieldCheck, Check } from'lucide-react';

interface VerifiedBadgeProps {
 isVerified?: boolean;
 size?:'sm' |'md' |'lg';
 showLabel?: boolean;
 className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
 isVerified = true,
 size ='md',
 showLabel = false,
 className =''
}) => {
 const [showTooltip, setShowTooltip] = useState(false);

 if (!isVerified) return null;

 const sizeClasses = {
 sm:'w-4 h-4 text-[10px]',
 md:'w-5 h-5 text-xs',
 lg:'w-6 h-6 text-sm'
 };

 const iconSizes = {
 sm:'w-3 h-3',
 md:'w-3.5 h-3.5',
 lg:'w-4 h-4'
 };

 return (
 <div 
 className={`relative inline-flex items-center gap-1.5 align-middle ${className}`}
 onMouseEnter={() => setShowTooltip(true)}
 onMouseLeave={() => setShowTooltip(false)}
 >
 <span 
 className={`inline-flex items-center justify-center rounded-full bg-gradient-to-tr from-[var(--acc)] via-amber-400 to-yellow-300 text-[var(--ink)] font-black ring-1 ring-amber-300/50 ${sizeClasses[size]}`}
 title="Lead Verificado • Conversación activa mediante agentes de IA"
 >
 <Check className={`${iconSizes[size]} stroke-[3.5]`} />
 </span>

 {showLabel && (
 <span className="text-[11px] font-bold tracking-wide text-[var(--acc)]/70 bg-[var(--acc)]/10 px-1.5 py-0.5 rounded-md">
 Verificado
 </span>
 )}

 {/* Tooltip Popup */}
 {showTooltip && (
 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 p-2.5 rounded-[var(--r-m)] bg-[var(--surface)]/95 text-[var(--ink-2)] text-xs z-50 pointer-events-none
 <div className="flex items-center gap-1.5 font-bold text-[var(--acc)] mb-1">
 <ShieldCheck className="w-4 h-4 text-[var(--acc)]" />
 <span>Lead Verificado por IA</span>
 </div>
 <p className="text-[11px] text-[var(--ink-2)] leading-tight">
 Este contacto ha sido verificado mediante interacción y conversación real lograda por los agentes de IA de Booking.
 </p>
 <div className="absolute top-full left-1/2 -translate-x-1/2 border-t-bg-[var(--surface)]/95" />
 </div>
 )}
 </div>
 );
};
