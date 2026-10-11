/**
 * Celda de acciones rápidas de la fila: WhatsApp, Instagram, llamada, aprobar, seguimiento y ficha.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { CheckCircle2,Clock,Eye,Instagram,MessageCircle,PhoneCall } from "lucide-react";
import { Lead } from "../../../types";
import { generateFollowupTemplate,getDaysSinceContact,isLeadNeedsFollowup } from "../../../utils/bookingFollowup";
import { getWhatsAppUrl,openWhatsAppChat,WHATSAPP_WINDOW_NAME } from "../../../utils/whatsapp";
import { Button } from "../../ui";
import { useLeadsTable } from "./LeadsTableContext";

/** Datos propios de cada instancia (el resto sale del contexto del flujo). */
export interface LeadRowActionsProps {
  hasMovil: boolean;
  phoneForWhatsApp: string;
  rawMovil: string;
  lead: Lead;
  phoneForCall: string;
  hasFijo: boolean;
  rawFijo: string;
  isDetailOpen: boolean;
}

/**
 * Celda de acciones rápidas de la fila: WhatsApp, Instagram, llamada, aprobar, seguimiento y ficha.
 * @returns Sección de interfaz.
 */
export function LeadRowActions({ hasMovil, phoneForWhatsApp, rawMovil, lead, phoneForCall, hasFijo, rawFijo, isDetailOpen }: LeadRowActionsProps) {
  const { handleQuickApprovePitch, effectiveBandName, onSelectLead } = useLeadsTable();
  return (
    <>
      <td className="py-1.5 px-2 min-w-[105px] text-right whitespace-nowrap align-middle">
      <div className="flex items-center justify-end gap-1">
      {/* WhatsApp: SOLO si tiene teléfono móvil */}
      {hasMovil && phoneForWhatsApp ? (
        <a
          href={getWhatsAppUrl(rawMovil)}
          target={WHATSAPP_WINDOW_NAME}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openWhatsAppChat(rawMovil);
          }}
          className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-[var(--r-s)] transition-colors inline-flex items-center"
          title={`WhatsApp directo al móvil (${rawMovil})`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
        </a>
      ) : null}

      {/* Instagram: SOLO si tiene instagram */}
      {lead.instagram ? (
        <a
          href={
            lead.instagram.startsWith("http")
              ? lead.instagram
              : `https://instagram.com/${lead.instagram.replace(/^@/, "")}`
          }
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 border border-pink-500/20 rounded-[var(--r-s)] transition-colors inline-flex items-center"
          title={`Abrir perfil de Instagram (${lead.instagram})`}
        >
          <Instagram className="w-3.5 h-3.5 text-pink-500" />
        </a>
      ) : null}

      {phoneForCall ? (
        <a
          href={`tel:${phoneForCall}`}
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 rounded-[var(--r-s)] transition-colors inline-flex items-center"
          title={
            hasMovil && hasFijo
              ? `Llamar (Móvil: ${rawMovil} / Fijo: ${rawFijo})`
              : hasMovil
                ? `Llamar al móvil (${rawMovil})`
                : `Llamar al fijo (${rawFijo})`
          }
        >
          <PhoneCall className="w-3.5 h-3.5" />
        </a>
      ) : null}

      {(lead.estado === "pendiente_aprobacion" ||
        lead.estado === "nuevo") && (
        <Button
          variant="neutral"
          size="xs"
          type="button"
          onClick={(e) => handleQuickApprovePitch(e, lead)}
          className="items-center gap-1"
          title="Aprobar pitch directamente"
        >
          <CheckCircle2 className="w-3 h-3 text-[var(--ok)]" />
          <span>Aprobar</span>
        </Button>
      )}

      {isLeadNeedsFollowup(lead) && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const nudgeText = generateFollowupTemplate(
              lead,
              effectiveBandName || "la banda",
            );
            onSelectLead(lead, {
              tab: "emails",
              pitchDraft: nudgeText,
            });
          }}
          className="px-1.5 py-0.5 bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--ink)] rounded text-micro font-bold transition-ui cursor-pointer inline-flex items-center gap-0.5 shadow-xs"
          title={`Han pasado ${getDaysSinceContact(lead)} días sin respuesta. Cargar recordatorio de seguimiento`}
        >
          <Clock className="w-3 h-3 text-[var(--acc)]" />
          <span>Nudge</span>
        </button>
      )}

      <Button
        variant={isDetailOpen ? "inverse" : "neutral"}
        size="xs"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelectLead(lead);
        }}
        className="items-center"
        title="Abrir ficha"
      >
        <Eye className="w-3.5 h-3.5" />
      </Button>
      </div>
      </td>
    </>
  );
}
