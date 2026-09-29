import React from 'react';
import { Lead } from '../../types';
import { Check, CheckCheck, Clock, MousePointerClick } from 'lucide-react';

interface EmailDeliveryTicksProps {
  lead: Lead;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

/**
 * Componente WhatsApp Style Delivery Ticks:
 * - 🕒 Reloj gris: En cola / borrador
 * - ✓ Tick gris: Enviado (entregado en el buzón de la sala)
 * - ✓✓ Doble tick azul: ¡Abierto / Leído por el programador!
 * - ✓✓ Doble tick azul + 🔥: ¡Clic en el EPK / Dossier!
 */
export const EmailDeliveryTicks: React.FC<EmailDeliveryTicksProps> = ({ lead, size = 'md', showLabel = false }) => {
  const isSent = Boolean(
    lead.fecha_envio || ['contactado', 'esperando_respuesta', 'respondido', 'negociando', 'confirmado', 'enviado'].includes(lead.estado)
  );

  const wasOpened = Boolean(lead.email_abierto || (lead.veces_abierto && lead.veces_abierto > 0));

  const hasClicked = Boolean(lead.clics_epk && lead.clics_epk > 0);
  const openCount = lead.veces_abierto || 1;

  if (!isSent) {
    if (lead.estado === 'pendiente_aprobacion' || lead.estado === 'aprobado_propuesta') {
      return (
        <span
          className="inline-flex items-center gap-1 text-xs text-[var(--ink-2)] bg-[var(--sunken)]/80 px-2 py-0.5 rounded-[var(--r-pill)] "
          title="Borrador listo o pendiente de despacho"
        >
          <Clock className={size === 'sm' ? 'w-2.5 h-2.5 text-[var(--ink-2)]' : 'w-3 h-3 text-[var(--ink-2)]'} />
          {showLabel && <span>En cola</span>}
        </span>
      );
    }
    return null;
  }

  // 1. Ha hecho clic en el EPK (Doble tick azul + badge de fuego)
  if (hasClicked) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-bold text-[var(--acc)] bg-[var(--acc)]/70 px-2 py-0.5 rounded-[var(--r-pill)] shadow-xs"
        title={`¡Leído y clic en EPK! (${lead.clics_epk} clics, ${openCount} aperturas)`}
      >
        <CheckCheck className={size === 'sm' ? 'w-3 h-3 text-[var(--acc)]' : 'w-3.5 h-3.5 text-[var(--acc)]'} />
        <MousePointerClick className="w-2.5 h-2.5 text-[var(--acc)]" />
        {showLabel && (
          <span className="text-micro text-[var(--acc)]">EPK visto {lead.clics_epk && lead.clics_epk > 1 ? `(${lead.clics_epk})` : ''}</span>
        )}
      </span>
    );
  }

  // 2. Ha abierto el email (Doble tick azul de WhatsApp)
  if (wasOpened) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-bold text-[var(--acc)] bg-[var(--acc)]/70 px-2 py-0.5 rounded-[var(--r-pill)] shadow-xs"
        title={`Email abierto por la sala (${openCount} ${openCount === 1 ? 'vez' : 'veces'})`}
      >
        <CheckCheck className={size === 'sm' ? 'w-3.5 h-3.5 text-[var(--acc)]' : 'w-4 h-4 text-[var(--acc)]'} />
        {showLabel && <span className="text-micro text-[var(--acc)]">Leído {openCount > 1 ? `(${openCount})` : ''}</span>}
      </span>
    );
  }

  // 3. Enviado pero todavía no abierto (Tick simple gris de WhatsApp)
  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-[var(--ink-2)] bg-[var(--sunken)]/90 px-2 py-0.5 rounded-[var(--r-pill)]"
      title={lead.fecha_envio ? `Enviado el ${lead.fecha_envio}` : 'Enviado a la sala'}
    >
      <Check className={size === 'sm' ? 'w-3 h-3 text-[var(--ink-2)]' : 'w-3.5 h-3.5 text-[var(--ink-2)]'} />
      {showLabel && <span className="text-micro text-[var(--ink-2)]">Entregado</span>}
    </span>
  );
};
