import React from 'react';
import { Lead } from '../../types';

export type LeadTemperature = 'caliente' | 'seguimiento' | 'frio' | 'neutral';

export interface LeadHealthInfo {
  type: LeadTemperature;
  label: string;
  badgeClass: string;
  icon: string;
  description: string;
}

export function getLeadHealth(lead: Lead): LeadHealthInfo {
  const now = new Date();

  // Detect latest activity date
  let lastActivityDate: Date | null = null;

  if (lead.fecha_ultima_respuesta) {
    const d = new Date(lead.fecha_ultima_respuesta);
    if (!isNaN(d.getTime())) lastActivityDate = d;
  }

  if (lead.historial_contacto && lead.historial_contacto.length > 0) {
    for (const log of lead.historial_contacto) {
      const logD = new Date(log.fecha);
      if (!isNaN(logD.getTime()) && (!lastActivityDate || logD > lastActivityDate)) {
        lastActivityDate = logD;
      }
    }
  }

  let daysSinceLastActivity: number | null = null;
  if (lastActivityDate) {
    daysSinceLastActivity = Math.max(0, Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)));
  }

  let daysSincePitch: number | null = null;
  if (lead.fecha_envio) {
    const pitchD = new Date(lead.fecha_envio);
    if (!isNaN(pitchD.getTime())) {
      daysSincePitch = Math.max(0, Math.floor((now.getTime() - pitchD.getTime()) / (1000 * 60 * 60 * 24)));
    }
  }

  // 1. 🔥 Lead Caliente: Clic en EPK, múltiples aperturas, respuesta reciente o negociación activa
  const hasClickedEpk = Boolean(lead.clics_epk && lead.clics_epk > 0);
  const multipleOpens = Boolean(lead.veces_abierto && lead.veces_abierto >= 2);

  if (
    hasClickedEpk ||
    multipleOpens ||
    (daysSinceLastActivity !== null && daysSinceLastActivity <= 3) ||
    lead.estado === 'interesado' ||
    lead.estado === 'negociando'
  ) {
    let desc = 'Interés activo';
    if (hasClickedEpk) {
      desc = `Dossier EPK revisado (${lead.clics_epk} ${lead.clics_epk === 1 ? 'clic' : 'clics'})`;
    } else if (multipleOpens) {
      desc = `Email abierto ${lead.veces_abierto} veces`;
    } else if (daysSinceLastActivity !== null) {
      desc = daysSinceLastActivity === 0 ? 'Actividad hoy' : `Actividad hace ${daysSinceLastActivity}d`;
    } else {
      desc = 'Negociación / Respuesta activa';
    }

    return {
      type: 'caliente',
      label: hasClickedEpk ? '🔥 EPK Visto' : multipleOpens ? '🔥 Releyendo' : '🔥 Lead Caliente',
      badgeClass: 'bg-[var(--acc)]/20 text-[var(--ink)] font-bold',
      icon: '🔥',
      description: desc,
    };
  }

  // 2. ⏳ Seguimiento Necesario: Más de 7 días sin respuesta tras enviar el pitch
  if (lead.estado === 'esperando_respuesta' || (lead.fecha_envio && !lead.fecha_ultima_respuesta && lead.estado !== 'no_interesado')) {
    const days = daysSincePitch ?? daysSinceLastActivity ?? 7;
    if (days >= 7) {
      return {
        type: 'seguimiento',
        label: 'Seguimiento Necesario',
        badgeClass: 'bg-[var(--acc)]/20 text-[var(--ink)] font-bold',
        icon: '⏳',
        description: `Enviado hace ${days}d sin respuesta`,
      };
    }
  }

  // 3. 🧊 Lead Frío: Más de 14 días sin interacción registrada / sin respuesta
  if ((daysSinceLastActivity !== null && daysSinceLastActivity >= 14) || (daysSincePitch !== null && daysSincePitch >= 14)) {
    const days = daysSinceLastActivity ?? daysSincePitch ?? 14;
    return {
      type: 'frio',
      label: 'Lead Frío',
      badgeClass: 'bg-[var(--acc)]/20 text-[var(--ink)] font-medium',
      icon: '🧊',
      description: `Sin interacción desde hace ${days}d`,
    };
  }

  // Default / Nuevo / Pendiente
  return {
    type: 'neutral',
    label: 'Activo',
    badgeClass: 'bg-[var(--sunken)]/80 text-[var(--ink-2)] font-medium',
    icon: '✨',
    description: 'En seguimiento regular',
  };
}

interface LeadHealthBadgeProps {
  lead: Lead;
  showDescription?: boolean;
  size?: 'sm' | 'md';
}

export const LeadHealthBadge: React.FC<LeadHealthBadgeProps> = ({ lead, showDescription = false, size = 'md' }) => {
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
