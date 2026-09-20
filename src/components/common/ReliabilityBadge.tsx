import React, { useState } from 'react';
import { Target, CheckCircle2, AlertCircle } from 'lucide-react';
import { calculateLeadReliability } from '../../utils/leadReliability';
import { Lead, BandContact } from '../../types';

interface ReliabilityBadgeProps {
 item: Lead | BandContact;
 size?:'sm' |'md';
 showDetails?: boolean;
 className?: string;
}

export const ReliabilityBadge: React.FC<ReliabilityBadgeProps> = ({
 item,
 size ='md',
 showDetails = false,
 className =''
}) => {
 const [showTooltip, setShowTooltip] = useState(false);
 const { score, details } = calculateLeadReliability(item);

 // Color coding
 let badgeColor ='bg-[var(--ok)]/15 text-[var(--ink-2)]/30';
 let barColor ='bg-[var(--ok)]';
 let levelText ='Fiabilidad Alta';

 if (score < 50) {
 badgeColor ='bg-[var(--acc)]/15 text-[var(--acc)]/70 /30';
 barColor ='bg-[var(--acc)]/60';
 levelText ='Fiabilidad Media';
 }
 if (score < 30) {
 badgeColor ='bg-[var(--alert)]/15 text-[var(--alert)]/30';
 barColor ='bg-[var(--alert)]';
 levelText ='Fiabilidad Baja';
 }

 const isSmall = size ==='sm';

 return (
 <div 
 className={`relative inline-flex items-center gap-1.5 align-middle ${className}`}
 onMouseEnter={() => setShowTooltip(true)}
 onMouseLeave={() => setShowTooltip(false)}
 >
 <div 
 className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--r-s)] font-sans font-semibold transition-all cursor-help ${badgeColor} ${
 isSmall ?'text-[10px]' :'text-xs'
 }`}
 >
 <Target className={isSmall ?'w-3 h-3' :'w-3.5 h-3.5'} />
 <span>{score}% Fiabilidad</span>
 </div>

 {/* Tooltip Breakdown */}
 {showTooltip && (
 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-[var(--r-l)] bg-[var(--surface)]/95 text-[var(--ink-2)] text-xs z-50 pointer-events-none
 <div className="flex items-center justify-between pb-1.5 mb-2">
 <span className="font-bold text-[var(--ink-2)] flex items-center gap-1">
 <Target className="w-3.5 h-3.5 text-[var(--acc)]" />
 Autodetector de Fiabilidad
 </span>
 <span className={`font-sans font-bold text-xs ${score >= 50 ?'text-[var(--ok)]' :'text-[var(--acc)]'}`}>
 {score}%
 </span>
 </div>

 <div className="w-full bg-[var(--surface)]/80 h-1.5 rounded-full overflow-hidden mb-2.5">
 <div className={`h-full ${barColor} transition-all duration-300`} style={{ width: `${score}%` }} />
 </div>

 <p className="text-[11px] text-[var(--ink-2)] mb-2 font-sans leading-tight">
 Cálculo automático de completitud de datos y calidad de contacto:
 </p>

 <ul className="space-y-1">
 {details.map((detail, idx) => (
 <li key={idx} className="flex items-center gap-1.5 text-[11px] text-[var(--ink-2)]">
 <CheckCircle2 className="w-3 h-3 text-[var(--ok)] shrink-0" />
 <span>{detail}</span>
 </li>
 ))}
 {details.length === 0 && (
 <li className="flex items-center gap-1.5 text-[11px] text-[var(--acc)]/70">
 <AlertCircle className="w-3 h-3 text-[var(--acc)] shrink-0" />
 <span>Datos de contacto limitados. Añade email o teléfono para subir la fiabilidad.</span>
 </li>
 )}
 </ul>

 <div className="absolute top-full left-1/2 -translate-x-1/2 border-t-bg-[var(--surface)]/95" />
 </div>
 )}
 </div>
 );
};
