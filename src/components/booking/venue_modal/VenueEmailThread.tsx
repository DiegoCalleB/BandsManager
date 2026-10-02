import React from 'react';
import { Mail, Clock, Send, Sparkles, AlertCircle } from 'lucide-react';
import { Lead, EmailMessage } from '../../../types';
import { isLeadNeedsFollowup, getDaysSinceContact, generateFollowupTemplate } from '../../../utils/bookingFollowup';
import { Button } from '../../ui';
import { ShowIcon } from '../../ui/ShowIcon';
import { EmailDeliveryTicks } from '../EmailDeliveryTicks';

interface VenueEmailThreadProps {
  lead: Lead;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  onSelectPitchTab: () => void;
  bandName?: string;
}

export const VenueEmailThread: React.FC<VenueEmailThreadProps> = ({
  lead,
  onUpdateLead,
  onSelectPitchTab,
  bandName,
}) => {
  const needsFollowup = isLeadNeedsFollowup(lead);
  const daysSince = getDaysSinceContact(lead);

  // Normalize messages from lead
  const messages: EmailMessage[] = (lead as any).mensajes || (lead as any).email_thread || [];

  const handleApplyFollowupNudge = () => {
    const draft = generateFollowupTemplate(lead, bandName || 'la banda');
    onUpdateLead(lead.id, {
      pitch_generado: draft,
      estado: 'pendiente_aprobacion',
    });
    onSelectPitchTab();
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar p-4 sm:p-6 space-y-4">
      {/* 1. GENTLE NUDGE / FOLLOW-UP BANNER IF NEEDED */}
      {needsFollowup && (
        <div className="p-3.5 sm:p-4 rounded-[var(--r-l)] bg-[var(--acc-soft)] border border-[var(--acc)]/30 text-[var(--ink)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[var(--r-m)] bg-[var(--acc)]/20 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-[var(--acc-ink)]" />
            </div>
            <div>
              <span className="text-xs font-bold font-sans text-[var(--acc-ink)] block">
                <ShowIcon inline emoji="⏰" /> Seguimiento recomendado ({daysSince} días sin respuesta)
              </span>
              <span className="text-micro text-[var(--ink-2)] font-sans">
                La sala no ha respondido. Puedes cargar un recordatorio breve y educado.
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            size="xs"
            onClick={handleApplyFollowupNudge}
            className="items-center gap-1.5 shrink-0 self-end sm:self-auto"
          >
            <Sparkles className="w-3 h-3" />
            <span>Cargar mensaje de seguimiento</span>
          </Button>
        </div>
      )}

      {/* 2. MESSAGES LIST */}
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-[var(--r-pill)] bg-[var(--sunken)] flex items-center justify-center text-[var(--ink-2)] mb-3">
            <Mail className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-[var(--ink)]">Sin correspondencia todavía</h4>
          <p className="text-xs text-[var(--ink-2)] max-w-sm mt-1">
            Cuando envíes la propuesta a través del Agente Enviador o recibas respuestas en tu buzón conectado, el hilo de conversación se mostrará aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg, idx) => {
            const isFromVenue = msg.remitente === 'sala';
            return (
              <div
                key={msg.id || `msg-${idx}`}
                className={`p-4 rounded-[var(--r-l)] border space-y-2 text-xs font-sans transition-ui ${
                  isFromVenue
                    ? 'bg-[var(--acc-soft)]/60 border-[var(--acc)]/20 text-[var(--ink)] ml-0 mr-4 sm:mr-8'
                    : 'bg-[var(--surface)] border-[var(--hair)] text-[var(--ink)] ml-4 sm:ml-8 mr-0'
                }`}
              >
                <div className="flex items-center justify-between gap-2 border-b border-[var(--hair)] pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[var(--ink)]">
                      {isFromVenue ? (lead.nombre_sala || 'Programador') : (bandName || 'Tu banda')}
                    </span>
                    <span className="text-micro text-[var(--ink-2)] font-mono">
                      {msg.fecha ? new Date(msg.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!isFromVenue && <EmailDeliveryTicks lead={lead} size="sm" />}
                    {msg.asunto && <span className="text-micro font-medium text-[var(--ink-2)] truncate max-w-[150px]">{msg.asunto}</span>}
                  </div>
                </div>

                <div className="whitespace-pre-wrap leading-relaxed text-xs text-[var(--ink)] pt-1">
                  {msg.mensaje}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
