import { LeadCardActions } from "./LeadCardActions";
import { LeadCardHeader } from "./LeadCardHeader";
import { LeadCardIntelligence } from "./LeadCardIntelligence";
import { LeadCardQualityBadges } from "./LeadCardQualityBadges";
/**
 * Tarjeta de un lead en la vista de rejilla.
 * Extraído de LeadsTableView (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import type { Lead } from "../../../types";
import { useLeadsTable } from "./LeadsTableContext";

/**
 * Tarjeta de un lead en la vista de rejilla.
 * @param props.lead Lead a pintar.
 * @param props.idx Posición del lead en la lista filtrada.
 * @returns Elemento de la lista.
 */
export function LeadGridCard({ lead, idx }: { lead: Lead; idx: number }) {
  const { cleanPhone, onSelectLead, selectedLead, selectedLeadIds } = useLeadsTable();
  const isDetailOpen = selectedLead?.id === lead.id;
  const isChecked = selectedLeadIds.includes(lead.id);
  const rawMovil =
    (lead.telefono_movil || "").trim() ||
    (!lead.telefono_fijo &&
    lead.telefono &&
    /^(?:\+?34\s*)?[67]/.test(lead.telefono.trim())
      ? lead.telefono.trim()
      : "");
  const rawFijo =
    (lead.telefono_fijo || "").trim() ||
    (!lead.telefono_movil &&
    lead.telefono &&
    /^(?:\+?34\s*)?[89]/.test(lead.telefono.trim())
      ? lead.telefono.trim()
      : "");
  const hasMovil = Boolean(rawMovil && rawMovil.length >= 6);
  const hasFijo = Boolean(rawFijo && rawFijo.length >= 6);
  // WhatsApp sólo disponible si se dispone de teléfono móvil
  const phoneForWhatsApp = hasMovil ? cleanPhone(rawMovil) : null;
  const phoneForCall = rawMovil || rawFijo || lead.telefono;
  const leadKey = lead.id
    ? `lead-grid-${lead.id}`
    : `lead-grid-${idx}`;

  // Check if there is high-value intelligence on this lead
  const hasIntelligence = Boolean(
    lead.ultimo_sentimiento_score !== undefined ||
    lead.temperatura_lead ||
    lead.ultima_intencion ||
    (lead.fechas_propuestas_sala &&
      lead.fechas_propuestas_sala.length > 0) ||
    lead.condiciones_economicas_detectadas ||
    lead.ultimo_analisis_resumen ||
    lead.estrategia_playbook ||
    lead.ultimo_mensaje_recibido,
  );

  return (
    <div
      key={leadKey}
      onClick={() => onSelectLead(lead)}
      className={`p-4 rounded-[var(--r-l)] transition-ui cursor-pointer flex flex-col justify-between gap-3 relative group ${
  isChecked
    ? "bg-[var(--surface)] ring-2 ring-[var(--acc)]/25"
    : isDetailOpen
      ? "bg-[var(--sunken)] ring-1 ring-[var(--acc)]/30"
      : "bg-[var(--bg)] hover:bg-[var(--sunken)]"
      }`}
    >
      <LeadCardHeader lead={lead} isChecked={isChecked} />

      <LeadCardIntelligence hasIntelligence={hasIntelligence} lead={lead} />

      <LeadCardQualityBadges lead={lead} hasMovil={hasMovil} rawMovil={rawMovil} hasFijo={hasFijo} rawFijo={rawFijo} />

      {/* Direct Action Bar (WhatsApp, Call, Quick Pitch Approve, View) */}
      <LeadCardActions hasMovil={hasMovil} phoneForWhatsApp={phoneForWhatsApp} rawMovil={rawMovil} lead={lead} phoneForCall={phoneForCall} isDetailOpen={isDetailOpen} hasIntelligence={hasIntelligence} />
    </div>
  );
}
