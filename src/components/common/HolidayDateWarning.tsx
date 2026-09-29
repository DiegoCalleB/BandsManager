import React from 'react';
import { auditDateAndCity, HolidayAuditResult } from '../../utils/holidayAuditor';
import { AlertTriangle, Sparkles, Calendar, Info, CheckCircle2, Flame } from 'lucide-react';

interface HolidayDateWarningProps {
  date?: string | Date | null;
  city?: string;
  compact?: boolean;
  className?: string;
}

export const HolidayDateWarning: React.FC<HolidayDateWarningProps> = ({ date, city, compact = false, className = '' }) => {
  if (!date) return null;

  const audit = auditDateAndCity(date, city);
  if (!audit || audit.riskLevel === 'safe') return null;

  if (compact) {
    if (audit.riskLevel === 'opportunity') {
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--r-s)] text-micro font-sans font-bold bg-[var(--ok)]/20 text-[var(--ink-2)] ${className}`}
          title={`${audit.title}: ${audit.advice}`}
        >
          <Sparkles className="w-3 h-3 text-[var(--ok)] shrink-0" />
          <span>Víspera Festivo ({audit.holidayName})</span>
        </span>
      );
    }

    if (audit.riskLevel === 'high_risk') {
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--r-s)] text-micro font-sans font-bold bg-[var(--alert)]/20 text-[var(--ink-2)] ${className}`}
          title={`${audit.title}: ${audit.advice}`}
        >
          <AlertTriangle className="w-3 h-3 text-[var(--alert)] shrink-0" />
          <span>¡Puente/Festivo! {audit.holidayName}</span>
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--r-s)] text-micro font-sans font-bold bg-[var(--acc)]/20 text-[var(--acc)]/70 ${className}`}
        title={`${audit.title}: ${audit.advice}`}
      >
        <AlertTriangle className="w-3 h-3 text-[var(--acc)] shrink-0" />
        <span>Festivo: {audit.holidayName}</span>
      </span>
    );
  }

  // Full detailed banner
  if (audit.riskLevel === 'opportunity') {
    return (
      <div className={`p-3 rounded-[var(--r-m)] bg-[var(--ok-soft)] text-[var(--ink)] text-xs space-y-1 ${className}`}>
        <div className="flex items-center gap-2 font-bold text-[var(--ink-2)]">
          <Sparkles className="w-4 h-4 text-[var(--ok)] shrink-0" />
          <span>{audit.title}</span>
        </div>
        <p className="text-xs text-[var(--ok)]/90 leading-relaxed">{audit.advice}</p>
      </div>
    );
  }

  if (audit.riskLevel === 'high_risk') {
    return (
      <div className={`p-3 rounded-[var(--r-m)] bg-[var(--alert-soft)] text-[var(--ink)] text-xs space-y-1 ${className}`}>
        <div className="flex items-center gap-2 font-bold text-[var(--ink-2)]">
          <AlertTriangle className="w-4 h-4 text-[var(--alert)] shrink-0 animate-bounce" />
          <span>{audit.title}</span>
        </div>
        <p className="text-xs text-[var(--alert)]/90 leading-relaxed font-sans">{audit.advice}</p>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-[var(--r-m)] bg-[var(--acc-soft)] text-[var(--ink)] text-xs space-y-1 ${className}`}>
      <div className="flex items-center gap-2 font-bold text-[var(--acc)]/70">
        <AlertTriangle className="w-4 h-4 text-[var(--acc)] shrink-0" />
        <span>{audit.title}</span>
      </div>
      <p className="text-xs text-[var(--acc)]/90 leading-relaxed">{audit.advice}</p>
    </div>
  );
};
