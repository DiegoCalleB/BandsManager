import React from'react';
import { auditDateAndCity, HolidayAuditResult } from'../../utils/holidayAuditor';
import { AlertTriangle, Sparkles, Calendar, Info, CheckCircle2, Flame } from'lucide-react';

interface HolidayDateWarningProps {
 date?: string | Date | null;
 city?: string;
 compact?: boolean;
 className?: string;
}

export const HolidayDateWarning: React.FC<HolidayDateWarningProps> = ({
 date,
 city,
 compact = false,
 className =''
}) => {
 if (!date) return null;

 const audit = auditDateAndCity(date, city);
 if (!audit || audit.riskLevel ==='safe') return null;

 if (compact) {
 if (audit.riskLevel ==='opportunity') {
 return (
 <span 
 className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 ${className}`}
 title={`${audit.title}: ${audit.advice}`}
 >
 <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
 <span>Víspera Festivo ({audit.holidayName})</span>
 </span>
 );
 }

 if (audit.riskLevel ==='high_risk') {
 return (
 <span 
 className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 animate-pulse ${className}`}
 title={`${audit.title}: ${audit.advice}`}
 >
 <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
 <span>¡Puente/Festivo! {audit.holidayName}</span>
 </span>
 );
 }

 return (
 <span 
 className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 ${className}`}
 title={`${audit.title}: ${audit.advice}`}
 >
 <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
 <span>Festivo: {audit.holidayName}</span>
 </span>
 );
 }

 // Full detailed banner
 if (audit.riskLevel ==='opportunity') {
 return (
 <div className={`p-3 rounded-[var(--r-m)] bg-emerald-950/40 text-emerald-200 text-xs space-y-1 ${className}`}>
 <div className="flex items-center gap-2 font-bold text-emerald-300">
 <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
 <span>{audit.title}</span>
 </div>
 <p className="text-[11px] text-emerald-100/90 leading-relaxed">
 {audit.advice}
 </p>
 </div>
 );
 }

 if (audit.riskLevel ==='high_risk') {
 return (
 <div className={`p-3 rounded-[var(--r-m)] bg-rose-950/40 text-rose-200 text-xs space-y-1 ${className}`}>
 <div className="flex items-center gap-2 font-bold text-rose-300">
 <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
 <span>{audit.title}</span>
 </div>
 <p className="text-[11px] text-rose-100/90 leading-relaxed font-sans">
 {audit.advice}
 </p>
 </div>
 );
 }

 return (
 <div className={`p-3 rounded-[var(--r-m)] bg-amber-950/40 text-amber-200 text-xs space-y-1 ${className}`}>
 <div className="flex items-center gap-2 font-bold text-amber-300">
 <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
 <span>{audit.title}</span>
 </div>
 <p className="text-[11px] text-amber-100/90 leading-relaxed">
 {audit.advice}
 </p>
 </div>
 );
};
