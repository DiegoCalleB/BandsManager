/**
 * Fechas y conflictos de agenda del lead.
 * Extraído de LeadDatesInfo (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { AlertCircle,CalendarCheck } from "lucide-react";
import type { Lead } from "../../../types";
import { LeadCampaignDates } from "./LeadCampaignDates";
import { LeadDatesTableBadges } from "./LeadDatesTableBadges";
import { LeadSourcePills } from "./LeadSourcePills";
import { useLeadsTable } from "./LeadsTableContext";

/** Datos propios de cada instancia (el resto sale del contexto del flujo). */
export interface LeadDatesInfoProps {
  isTable?: boolean;
  lead: Lead;
}

/**
 * Fechas y conflictos de agenda del lead.
 * @returns Sección de interfaz.
 */
export function LeadDatesInfo({ isTable = false, lead }: LeadDatesInfoProps) {
  const { activeCampaign, onSelectLead } = useLeadsTable();
  if (isTable) return <LeadDatesTableBadges lead={lead} />;

  const campaignIsActive = activeCampaign && (activeCampaign.isActive ?? activeCampaign.is_active ?? true);
  if (campaignIsActive) return <LeadCampaignDates lead={lead} />;

  const freeDates = lead.fechas_libres_detectadas || [];
  if (
    lead.datos_fechas_encontrados === false ||
    (!freeDates.length &&
      !(lead.fechas_ocupadas && lead.fechas_ocupadas.length > 0))
  ) {
    return lead.nombre_sala ? (
      <div className="flex flex-col gap-0.5 mt-0.5">
  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--r-s)] text-micro font-sans font-medium text-[var(--ink)] bg-[var(--acc)]/40 ">
    <AlertCircle className="w-3 h-3 text-[var(--acc)] shrink-0" />
    (no se han encontrado datos de fechas de esta sala)
  </span>
  <LeadSourcePills lead={lead} />
      </div>
    ) : null;
  }

  if (freeDates.length > 0) {
    return (
      <div className="flex flex-col gap-0.5 mt-0.5">
  <span
    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--r-s)] text-micro font-sans font-semibold bg-[var(--acc)] text-[var(--on-acc)] shadow-2xs cursor-pointer hover:bg-[var(--acc)] transition-colors"
    title={`Fechas libres detectadas por radar: ${freeDates.join(", ")}`}
    onClick={(e) => {
      e.stopPropagation();
      onSelectLead(lead);
    }}
  >
    <CalendarCheck className="w-3 h-3 text-[var(--acc)] shrink-0" />
    <span>{freeDates.length} fecha(s) libre(s) detectadas</span>
  </span>
  <LeadSourcePills lead={lead} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 mt-0.5">
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--r-s)] text-micro font-sans text-[var(--ink)] bg-[var(--acc)]/40 ">
  (no se han encontrado datos de fechas de esta sala)
      </span>
      <LeadSourcePills lead={lead} />
    </div>
  );
}
