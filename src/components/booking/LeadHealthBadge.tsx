import React from 'react';
import { Lead } from '../../types';
import { getLeadHealth } from './leadHealth';

interface LeadHealthBadgeProps {
  lead: Lead;
  showDescription?: boolean;
  size?: 'sm' | 'md';
}

export const LeadHealthBadge: React.FC<LeadHealthBadgeProps> = ({ lead, showDescription = false }) => {
  const health = getLeadHealth(lead);

  return (
    <div className="inline-flex flex-col items-start gap-0.5">
      <span
        className={`inline-flex items-center gap-1 rounded-[var(--r-pill)] px-2 py-0.5 text-micro sm:text-xs ${health.badgeClass}`}
        title={health.description}
      >
        <span>{health.label}</span>
      </span>
      {showDescription && <span className="text-micro text-[var(--ink-2)] font-sans tracking-tight pl-1">{health.description}</span>}
    </div>
  );
};
