/**
 * Cabecera de la tarjeta: selección, avatar, nombre, estado, tipo, ciudad y temperatura.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { CheckSquare,Compass } from "lucide-react";
import { Lead } from "../../../types";
import { isLeadVerificado } from "../../../utils/leadReliability";
import { FavoriteButton } from "../../common/FavoriteButton";
import { VerifiedBadge } from "../../common/VerifiedBadge";
import { ShowIcon } from "../../ui/ShowIcon";
import { LeadAvatar } from "../LeadAvatar";
import { LeadIntentBadge } from "./LeadIntentBadge";
import { useLeadsTable } from "./LeadsTableContext";
import { LeadTemperatureBadge } from "./LeadTemperatureBadge";
import { LeadTipoBadge } from "./LeadTipoBadge";

/** Datos propios de cada instancia (el resto sale del contexto del flujo). */
export interface LeadCardHeaderProps {
  lead: Lead;
  isChecked: boolean;
}

/**
 * Cabecera de la tarjeta: selección, avatar, nombre, estado, tipo, ciudad y temperatura.
 * @returns Sección de interfaz.
 */
export function LeadCardHeader({ lead, isChecked }: LeadCardHeaderProps) {
  const { onToggleSelectLead, setLeadForImageChange, onUpdateLead, getStatusBadgeClass, getStatusLabel, onFilterByRouteCity } = useLeadsTable();
  return (
    <>
      {/* Header info */}
      <div className="flex items-start gap-2.5 min-w-0 w-full">
  {/* Select Checkbox (Grid Mode) */}
  {onToggleSelectLead && (
    <div
      onClick={(e) => {
      e.stopPropagation();
      onToggleSelectLead(lead.id, e);
      }}
      className="shrink-0 pt-0.5 cursor-pointer"
      title={
      isChecked
        ? "Deseleccionar sala"
        : "Seleccionar sala para acciones masivas"
      }
    >
      <div
      className={`w-5 h-5 rounded-[var(--r-s)] flex items-center justify-center transition-ui ${
        isChecked
          ? "bg-[var(--ink)] text-[var(--bg)]"
          : "bg-[var(--bg)]/80 group-hover:bg-[var(--sunken)]"
      }`}
      >
      {isChecked && <CheckSquare className="w-3.5 h-3.5" />}
      </div>
    </div>
  )}

  {/* Interactive Avatar Container */}
  <LeadAvatar
    lead={lead}
    size="md"
    onClick={(e) => {
      e.stopPropagation();
      setLeadForImageChange(lead);
    }}
  />

  <div className="flex flex-col min-w-0 flex-1">
    <div className="flex items-start justify-between gap-1.5">
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
      <h4
        className="font-display font-bold text-base sm:text-lg text-[var(--ink)] truncate notranslate"
        translate="no"
      >
        {lead.nombre_sala}
      </h4>
      <VerifiedBadge
        isVerified={isLeadVerificado(lead)}
        size="sm"
      />
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
      <FavoriteButton
        isFavorite={!!lead.es_favorito}
        onToggle={(newVal) =>
          onUpdateLead(lead.id, { es_favorito: newVal })
        }
        size="sm"
      />
      <span
        className={`inline-flex items-center text-micro px-2 py-0.5 rounded-[var(--r-pill)] font-sans font-medium shrink-0 ${getStatusBadgeClass(
          lead.estado,
        )}`}
      >
        {getStatusLabel(lead.estado)}
      </span>
      </div>
    </div>

    <div className="flex flex-wrap items-center gap-1.5 text-xs font-sans text-[var(--ink-2)] font-medium mt-1">
      <LeadTipoBadge tipoRaw={lead.tipo} />
      <span className="text-[var(--ink)] font-semibold">
      {lead.ciudad || "España"}
      </span>
      {lead.ciudad && onFilterByRouteCity && (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onFilterByRouteCity(lead.ciudad!);
        }}
        className="p-1 rounded hover:bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--acc)] transition-colors cursor-pointer shrink-0"
        title={`Filtrar salas para fin de semana doble desde ${lead.ciudad} (< 2.5h de ruta)`}
      >
        <Compass className="w-3 h-3" />
      </button>
      )}
      <span>•</span>
      <span
      className={
        lead.roster
          ? "text-[var(--acc)]/70 font-semibold"
          : ""
      }
      >
      {lead.roster
        ? `Róster: ${lead.roster}`
        : [
              "agencia",
              "manager",
              "productora",
              "sello",
            ].includes(String(lead.tipo || "").toLowerCase())
          ? "Agencia / Booking"
          : lead.aforo
            ? `${lead.aforo} pax`
            : "Aforo n/d"}
      </span>
      {lead.financial_break_even?.entradas_break_even ? (
      <span
        className={`inline-flex items-center gap-1 text-micro font-sans font-semibold px-1.5 py-0.2 rounded ${
          lead.financial_break_even.entradas_break_even /
            (lead.aforo || 250) <=
          0.4
            ? "bg-[var(--ok)] text-[var(--on-ok)] "
            : lead.financial_break_even.entradas_break_even /
                  (lead.aforo || 250) <=
                0.7
              ? "bg-[var(--ink)] text-[var(--bg)] "
              : "bg-[var(--alert)] text-[var(--on-alert)] "
        }`}
        title={`Break-Even: Cubre gastos vendiendo ${lead.financial_break_even.entradas_break_even} entradas (${Math.round((lead.financial_break_even.entradas_break_even / (lead.aforo || 250)) * 100)}% del aforo)`}
      >
        <ShowIcon inline emoji="🎯" />B-E:{" "}
        {lead.financial_break_even.entradas_break_even}
      </span>
      ) : null}
      <span>•</span>
      <span className="text-[var(--ink-2)]">
      {lead.genero || "Variado"}
      </span>
    </div>

    {/* Temperatura & Intención Directas */}
    {(lead.temperatura_lead ||
      lead.ultima_intencion ||
      lead.ultimo_sentimiento_score !== undefined) && (
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      <LeadTemperatureBadge lead={lead} />
      <LeadIntentBadge lead={lead} />
      {lead.ultimo_sentimiento_score !== undefined && (
        <span
          className={`text-micro font-mono font-bold px-1.5 py-0.5 rounded ${
            lead.ultimo_sentimiento_score >= 0.4
              ? "text-[var(--ok)] bg-[var(--ok)]/10 "
              : lead.ultimo_sentimiento_score <= -0.3
                ? "text-[var(--alert)] bg-[var(--alert)]/10 "
                : "text-[var(--ink-2)] bg-[var(--sunken)] "
          }`}
        >
          {lead.ultimo_sentimiento_score > 0
            ? `+${(lead.ultimo_sentimiento_score * 100).toFixed(0)}%`
            : `${(lead.ultimo_sentimiento_score * 100).toFixed(0)}%`}
        </span>
      )}
      </div>
    )}
  </div>
      </div>
    </>
  );
}
