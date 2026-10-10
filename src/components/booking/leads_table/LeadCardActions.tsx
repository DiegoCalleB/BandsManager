/**
 * Barra de acciones directas de la tarjeta: WhatsApp, Instagram, llamada, aprobar, seguimiento, ficha y borrado.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { CheckCircle2,Clock,Eye,Instagram,MessageCircle,PhoneCall,Trash2 } from "lucide-react";
import { Lead } from "../../../types";
import { generateFollowupTemplate,getDaysSinceContact,isLeadNeedsFollowup } from "../../../utils/bookingFollowup";
import { getWhatsAppUrl,openWhatsAppChat,WHATSAPP_WINDOW_NAME } from "../../../utils/whatsapp";
import { IconButton } from "../../ui";
import { useLeadsTable } from "./LeadsTableContext";

/** Datos propios de cada instancia (el resto sale del contexto del flujo). */
export interface LeadCardActionsProps {
  hasMovil: boolean;
  phoneForWhatsApp: string;
  rawMovil: string;
  lead: Lead;
  phoneForCall: string;
  isDetailOpen: boolean;
  hasIntelligence: boolean;
}

/**
 * Barra de acciones directas de la tarjeta: WhatsApp, Instagram, llamada, aprobar, seguimiento, ficha y borrado.
 * @returns Sección de interfaz.
 */
export function LeadCardActions({ hasMovil, phoneForWhatsApp, rawMovil, lead, phoneForCall, isDetailOpen, hasIntelligence }: LeadCardActionsProps) {
  const { handleQuickApprovePitch, effectiveBandName, onSelectLead, onDeleteLead } = useLeadsTable();
  return (
    <>
      <div className="pt-2.5800/80 flex flex-wrap items-center justify-between gap-2 w-full mt-1">
  <div className="flex items-center gap-1.5">
    {/* Direct WhatsApp Button — SOLO se muestra si tenemos teléfono móvil */}
    {hasMovil && phoneForWhatsApp ? (
      <a
      href={getWhatsAppUrl(rawMovil)}
      target={WHATSAPP_WINDOW_NAME}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openWhatsAppChat(rawMovil);
      }}
      className="p-2 sm:px-2.5 sm:py-1.5 bg-[var(--ok-soft)] hover:bg-[var(--ok-soft)] text-[var(--ink-2)] rounded-[var(--r-m)] font-bold text-xs flex items-center gap-1.5 transition-ui cursor-pointer min-h-[38px]"
      title={`Enviar WhatsApp directo al móvil (${rawMovil})`}
      >
      <MessageCircle className="w-4 h-4 text-[var(--ok)]" />
      <span className="hidden xs:inline text-xs">
        WhatsApp
      </span>
      </a>
    ) : null}

    {/* Direct Instagram Button */}
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
      className="p-2 sm:px-2.5 sm:py-1.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 border border-pink-500/20 rounded-[var(--r-m)] font-bold text-xs flex items-center gap-1.5 transition-ui cursor-pointer shadow-xs min-h-[38px] group"
      title={`Abrir Instagram (${lead.instagram})`}
      >
      <Instagram className="w-4 h-4 text-pink-500 group-hover:scale-110 transition-transform" />
      <span className="hidden xs:inline text-xs">
        Instagram
      </span>
      </a>
    ) : null}

    {/* Direct Call Button */}
    {phoneForCall ? (
      <a
      href={`tel:${phoneForCall}`}
      onClick={(e) => e.stopPropagation()}
      className="p-2 sm:px-2.5 sm:py-1.5 bg-[var(--bg)]/80 hover:bg-[var(--tentative)] text-[var(--ink-2)] rounded-[var(--r-m)] font-bold text-xs flex items-center gap-1.5 transition-ui cursor-pointer min-h-[38px]"
      title="Llamar directamente por teléfono"
      >
      <PhoneCall className="w-4 h-4 text-[var(--ink-2)]" />
      <span className="hidden xs:inline text-xs">
        Llamar
      </span>
      </a>
    ) : null}

    {/* Direct Pitch Approval Button if pending */}
    {(lead.estado === "pendiente_aprobacion" ||
      lead.estado === "nuevo") && (
      <button
      type="button"
      onClick={(e) => handleQuickApprovePitch(e, lead)}
      className="px-2.5 py-1.5 bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--ink)] rounded-[var(--r-m)] font-bold text-xs flex items-center gap-1 transition-ui cursor-pointer min-h-[38px]"
      title="Aprobar pitch directamente para envío"
      >
      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--acc)]" />
      <span className="text-xs">Aprobar</span>
      </button>
    )}

    {/* Direct Nudge Button if waiting */}
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
      className="px-2.5 py-1.5 bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--ink)] rounded-[var(--r-m)] font-bold text-xs flex items-center gap-1 transition-ui cursor-pointer min-h-[38px] shadow-xs"
      title={`Han pasado ${getDaysSinceContact(lead)} días sin respuesta. Cargar recordatorio de seguimiento`}
      >
      <Clock className="w-3.5 h-3.5 text-[var(--acc)]" />
      <span className="text-xs">
        Nudge ({getDaysSinceContact(lead)}d)
      </span>
      </button>
    )}
  </div>

  <div className="flex items-center gap-1.5">
    <button
      type="button"
      onClick={(e) => {
      e.stopPropagation();
      onSelectLead(lead);
      }}
      className={`px-3 py-1.5 rounded-[var(--r-m)] text-xs font-sans font-bold transition-ui cursor-pointer flex items-center gap-1 min-h-[38px] ${
      isDetailOpen
        ? "bg-[var(--ink)] text-[var(--bg)]"
        : "bg-[var(--sunken)] text-[var(--ink)] hover:bg-[var(--ink-3)]/60"
      }`}
    >
      <Eye className="w-3.5 h-3.5" />
      <span>{hasIntelligence ? "Copiloto" : "Ficha"}</span>
    </button>
    {onDeleteLead && (
      <IconButton
      label="Eliminar y guardar en lista negra"
      variant="danger"
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onDeleteLead(lead.id, lead.nombre_sala);
      }}
      className="flex"
      >
      <Trash2 className="w-4 h-4 text-[var(--alert)]" />
      </IconButton>
    )}
  </div>
      </div>
    </>
  );
}
