import { LeadRowActions } from "./LeadRowActions";
import { LeadRowContact } from "./LeadRowContact";
/**
 * Fila de un lead en la vista de tabla.
 * Extraído de LeadsTableView (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Compass } from "lucide-react";
import type { Lead } from "../../../types";
import { isLeadVerificado } from "../../../utils/leadReliability";
import { FavoriteButton } from "../../common/FavoriteButton";
import { ReliabilityBadge } from "../../common/ReliabilityBadge";
import { VerifiedBadge } from "../../common/VerifiedBadge";
import { EmailDeliveryTicks } from "../EmailDeliveryTicks";
import { LeadAvatar } from "../LeadAvatar";
import { LeadHealthBadge } from "../LeadHealthBadge";
import { LeadDatesInfo } from "./LeadDatesInfo";
import { LeadIntentBadge } from "./LeadIntentBadge";
import { useLeadsTable } from "./LeadsTableContext";
import { LeadTemperatureBadge } from "./LeadTemperatureBadge";
import { LeadTipoBadge } from "./LeadTipoBadge";

/**
 * Fila de un lead en la vista de tabla.
 * @param props.lead Lead a pintar.
 * @param props.idx Posición del lead en la lista filtrada.
 * @returns Elemento de la lista.
 */
export function LeadTableRow({ lead, idx }: { lead: Lead; idx: number }) {
  const { cleanPhone, getStatusBadgeClass, getStatusLabel, onFilterByRouteCity, onSelectLead, onToggleSelectLead, onUpdateLead, selectedLead, selectedLeadIds, setLeadForImageChange } = useLeadsTable();
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
    ? `lead-row-${lead.id}`
    : `lead-row-${idx}`;

  return (
    <tr
      key={leadKey}
      onClick={() => onSelectLead(lead)}
      className={`transition-colors cursor-pointer ${
      isChecked
  ? "bg-[var(--acc-soft)]"
  : isDetailOpen
    ? "bg-[var(--sunken)]"
    : "hover:bg-[var(--sunken)]"
      }`}
    >
      {/* Row Select Checkbox */}
      {onToggleSelectLead && (
      <td
  className="py-1.5 px-2.5 text-center align-middle"
  onClick={(e) => {
    e.stopPropagation();
    onToggleSelectLead(lead.id, e);
  }}
      >
  <div className="flex items-center justify-center">
    <input
      type="checkbox"
      checked={isChecked}
      onChange={() => {}}
      onClick={(e) => {
        e.stopPropagation();
        onToggleSelectLead(lead.id, e);
      }}
      className="w-4 h-4 rounded-[var(--r-s)] text-[var(--acc)] focus:ring-[var(--acc)]/40 bg-[var(--sunken)] cursor-pointer accent-[var(--acc)]"
      title={isChecked ? "Deseleccionar" : "Seleccionar"}
    />
  </div>
      </td>
      )}

      <td
      className="py-1.5 px-2 text-center align-middle"
      onClick={(e) => e.stopPropagation()}
      >
      <FavoriteButton
  isFavorite={!!lead.es_favorito}
  onToggle={(newVal) =>
    onUpdateLead(lead.id, { es_favorito: newVal })
  }
  size="sm"
      />
      </td>

      <td className="py-1.5 px-2.5 min-w-[155px] align-middle">
      <div className="flex items-center gap-1.5 min-w-0">
  {/* Interactive Avatar Container Table View */}
  <LeadAvatar
    lead={lead}
    size="sm"
    onClick={(e) => {
      e.stopPropagation();
      setLeadForImageChange(lead);
    }}
  />
  <div className="min-w-0 flex-1 leading-tight">
    <div className="flex items-center gap-1">
      <span
        className="truncate font-bold text-xs sm:text-sm text-[var(--ink)] block max-w-[140px] notranslate"
        translate="no"
        title={lead.nombre_sala}
      >
        {lead.nombre_sala}
      </span>
      <VerifiedBadge
        isVerified={isLeadVerificado(lead)}
        size="sm"
      />
    </div>
    <span className="text-micro text-[var(--ink-2)] font-sans font-normal truncate block">
      {lead.genero || "Sin género"}
    </span>
  </div>
      </div>
      </td>

      <td className="py-1.5 px-2 min-w-[70px] whitespace-nowrap align-middle">
      <LeadTipoBadge tipoRaw={lead.tipo} />
      </td>

      <td className="py-1.5 px-2 min-w-[80px] whitespace-nowrap align-middle">
      <ReliabilityBadge item={lead} size="sm" />
      </td>

      <td className="py-1.5 px-2 min-w-[95px] whitespace-nowrap align-middle">
      <div className="flex items-center gap-1 flex-wrap">
  <LeadHealthBadge
    lead={lead}
    showDescription={false}
    size="sm"
  />
  <LeadTemperatureBadge lead={lead} />
  <LeadIntentBadge lead={lead} />
      </div>
      </td>

      <td className="py-1.5 px-2 min-w-[90px] text-[var(--ink-2)] align-middle">
      <div className="flex items-center gap-1 leading-snug">
  <span className="font-semibold text-xs text-[var(--ink-2)] block truncate">
    {lead.ciudad || "España"}
  </span>
  {lead.ciudad && onFilterByRouteCity && (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onFilterByRouteCity(lead.ciudad!);
      }}
      className="p-0.5 rounded hover:bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--acc)] transition-colors cursor-pointer shrink-0"
      title={`Filtrar salas para fin de semana doble desde ${lead.ciudad} (< 2.5h de ruta)`}
    >
      <Compass className="w-3 h-3" />
    </button>
  )}
      </div>
      <LeadDatesInfo lead={lead} isTable />
      </td>

      <td className="py-1.5 px-2 min-w-[65px] text-[var(--ink-2)] align-middle">
      <span
  className={
    lead.roster
      ? "text-[var(--acc-ink)] font-semibold"
      : "text-[var(--ink)]"
  }
      >
  {lead.roster
    ? `Róster: ${lead.roster}`
    : lead.aforo
      ? `${lead.aforo} pax`
      : "n/d"}
      </span>
      </td>

      <td className="py-1.5 px-2 min-w-[95px] whitespace-nowrap align-middle">
      <div className="flex items-center gap-1">
  <span
    className={`inline-flex items-center text-micro px-2 py-0.5 rounded-[var(--r-pill)] font-sans font-medium ${getStatusBadgeClass(
      lead.estado,
    )}`}
  >
    {getStatusLabel(lead.estado)}
  </span>
  <EmailDeliveryTicks
    lead={lead}
    size="sm"
    showLabel={false}
  />
      </div>
      </td>

      <LeadRowContact lead={lead} hasMovil={hasMovil} hasFijo={hasFijo} rawMovil={rawMovil} rawFijo={rawFijo} />

      {/* Direct Quick Action Buttons in Table View */}
      <LeadRowActions hasMovil={hasMovil} phoneForWhatsApp={phoneForWhatsApp} rawMovil={rawMovil} lead={lead} phoneForCall={phoneForCall} hasFijo={hasFijo} rawFijo={rawFijo} isDetailOpen={isDetailOpen} />
    </tr>
  );
}
