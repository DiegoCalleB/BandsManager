/**
 * Fechas del lead frente a la campaña activa: disponibilidad en las fechas objetivo.
 * Extraído de LeadDatesInfo (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { AlertCircle,CalendarCheck,Clock,ExternalLink } from "lucide-react";
import type { Lead } from "../../../types";
import { ShowIcon } from "../../ui/ShowIcon";
import { campanaDe,radarDe } from "./leadRadar";
import { LeadSourcePills } from "./LeadSourcePills";
import { useLeadsTable } from "./LeadsTableContext";
import { venueProgrammingUrl } from "./venueProgrammingUrl";

/**
 * Disponibilidad del lead en las fechas objetivo de la campaña activa.
 * @param props.lead Lead evaluado.
 * @returns Insignia de disponibilidad de campaña, o `null` si no aplica.
 */
export function LeadCampaignDates({ lead }: { lead: Lead }) {
  const { activeCampaign } = useLeadsTable();
  const campana = campanaDe(activeCampaign);
  const targetDates = campana?.targetDates || campana?.target_dates || [];
  const targetDatesText = campana?.fechas_objetivo || campana?.fechasObjetivo || campana?.fechas || campana?.nombre || "";

  const campaignFreeDates = radarDe(lead).fechas_libres_campana || [];
  const hasVerifiedSources =
    Array.isArray(lead.radar_fuentes_verificadas) &&
    lead.radar_fuentes_verificadas.length > 0;
  const hasOccupied =
    Array.isArray(lead.fechas_ocupadas) && lead.fechas_ocupadas.length > 0;
  const hasWegowOk = radarDe(lead).radar_wegow_status === "ok";
  const hasBandsintownOk = radarDe(lead).radar_bandsintown_status === "ok";

  const hasConcertsOrSources =
    lead.datos_fechas_encontrados === true ||
    hasWegowOk ||
    hasBandsintownOk ||
    hasVerifiedSources ||
    hasOccupied;
  const isSinDatos =
    !hasConcertsOrSources || lead.datos_fechas_encontrados === false;

  // Si no se han encontrado datos de fechas ni cartelera verificada de esta sala
  if (isSinDatos) {
    return (
      <div className="flex flex-col gap-0.5 mt-0.5">
  <a
    href={venueProgrammingUrl(lead)}
    target="_blank"
    rel="noopener noreferrer"
    onClick={(e) => e.stopPropagation()}
    title={`Ver web u obtener programación de ${lead.nombre_sala}`}
    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--r-s)] text-micro font-sans font-medium text-[var(--on-acc)] bg-[var(--acc)] hover:bg-[var(--acc)]/60 transition-colors cursor-pointer group"
  >
    <AlertCircle className="w-3 h-3 text-[var(--acc)] shrink-0" />
    <span>(no se han encontrado datos de fechas de esta sala)</span>
    <ExternalLink className="w-2.5 h-2.5 text-[var(--acc)]/70 group-hover:text-[var(--acc)] shrink-0 ml-0.5" />
  </a>
  <LeadSourcePills lead={lead} />
      </div>
    );
  }

  // Evaluar coincidencia exclusiva con fechas de la campaña y horizonte de cartelera
  const estadoCartelera = radarDe(lead).estado_cartelera;
  const maxFecha = radarDe(lead).max_fecha_publicada;
  const formatIsoShort = (isoStr?: string) => {
    if (!isoStr || !/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) return isoStr || "";
    const [, m, d] = isoStr.split("-").map((n) => parseInt(n, 10));
    const months = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    return `${d} ${months[m - 1] || ""}`.trim();
  };
  const maxFechaFmt = formatIsoShort(maxFecha);

  let isAvailableForCampaign: boolean;
  let matchingDatesInCampaign: string[];

  if (radarDe(lead).disponible_para_campana !== undefined) {
    isAvailableForCampaign = Boolean(radarDe(lead).disponible_para_campana);
    matchingDatesInCampaign = radarDe(lead).fechas_libres_campana || [];
  } else if (Array.isArray(targetDates) && targetDates.length > 0) {
    const occupiedSet = new Set(lead.fechas_ocupadas || []);
    matchingDatesInCampaign = targetDates.filter(
      (t) => !occupiedSet.has(t),
    );
    isAvailableForCampaign = matchingDatesInCampaign.length > 0;
  } else if (targetDatesText) {
    const terms = String(targetDatesText)
      .toLowerCase()
      .split(/[\s,;&/]+/);
    matchingDatesInCampaign = campaignFreeDates.filter((f: string) => {
      const fLower = f.toLowerCase();
      return terms.some(
  (term) => term.length >= 2 && fLower.includes(term),
      );
    });
    isAvailableForCampaign = matchingDatesInCampaign.length > 0;
  } else {
    isAvailableForCampaign = campaignFreeDates.length > 0;
    matchingDatesInCampaign = campaignFreeDates;
  }

  // 1. Caso: Programación de la sala no llega aún a la fecha de la campaña
  if (estadoCartelera === "no_publicada_aun") {
    return (
      <div className="flex flex-col gap-0.5 mt-0.5">
  <a
    href={venueProgrammingUrl(lead)}
    target="_blank"
    rel="noopener noreferrer"
    onClick={(e) => e.stopPropagation()}
    title={`La agenda publicada de esta sala solo llega hasta ${maxFechaFmt || "meses anteriores"}. Oportunidad para enviar propuesta antes de que cierren agenda.`}
    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--r-s)] text-micro font-sans font-bold bg-[var(--acc)] text-[var(--on-acc)] hover:bg-[var(--acc)]/90 transition-colors shadow-2xs group cursor-pointer"
  >
    <Clock className="w-3 h-3 text-[var(--acc)] shrink-0" />
    <span>
      <ShowIcon inline emoji="📅" />AGENDA AÚN NO PUBLICADA{" "}
      {maxFechaFmt ? `(Publicado hasta ${maxFechaFmt})` : ""}
    </span>
    <ExternalLink className="w-2.5 h-2.5 text-[var(--acc)]/80 group-hover:text-[var(--acc)] shrink-0 ml-0.5" />
  </a>
  <LeadSourcePills lead={lead} />
      </div>
    );
  }

  // 2. Caso: Fuera de temporada / vacaciones
  if (estadoCartelera === "fuera_temporada") {
    return (
      <div className="flex flex-col gap-0.5 mt-0.5">
  <a
    href={venueProgrammingUrl(lead)}
    target="_blank"
    rel="noopener noreferrer"
    onClick={(e) => e.stopPropagation()}
    title={`Cierre temporal o fuera de temporada en la época de la campaña`}
    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--r-s)] text-micro font-sans font-bold bg-[var(--acc)] text-[var(--on-acc)] hover:bg-[var(--acc)]/90 transition-colors shadow-2xs group cursor-pointer"
  >
    <AlertCircle className="w-3 h-3 text-[var(--acc)] shrink-0" />
    <span>FUERA DE TEMPORADA / VACACIONES</span>
    <ExternalLink className="w-2.5 h-2.5 text-[var(--acc)]/80 group-hover:text-[var(--acc)] shrink-0 ml-0.5" />
  </a>
  <LeadSourcePills lead={lead} />
      </div>
    );
  }

  // 3. Caso: Cartelera confirmada publicada y fecha disponible ("Sándwich")
  if (isAvailableForCampaign || estadoCartelera === "publicada_libre") {
    return (
      <div className="flex flex-col gap-0.5 mt-0.5">
  <a
    href={venueProgrammingUrl(lead)}
    target="_blank"
    rel="noopener noreferrer"
    onClick={(e) => e.stopPropagation()}
    title={`Clic para verificar la programación oficial en la web de ${lead.nombre_sala} (${lead.website || "Buscar en Google"})`}
    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--r-s)] text-micro font-sans font-bold bg-[var(--ok)] text-[var(--on-ok)] hover:bg-[var(--ok)]/90 transition-colors shadow-2xs group cursor-pointer"
  >
    <CalendarCheck className="w-3 h-3 text-[var(--ok)] shrink-0" />
    <span>
      <ShowIcon inline emoji="🎯" />Campaña: <ShowIcon inline emoji="✅" />DISPONIBLE ({matchingDatesInCampaign.join(", ")})
    </span>
    <ExternalLink className="w-2.5 h-2.5 text-[var(--ok)]/80 group-hover:text-[var(--ok)] shrink-0 ml-0.5" />
  </a>
  <LeadSourcePills lead={lead} />
      </div>
    );
  } else {
    return (
      <div className="flex flex-col gap-0.5 mt-0.5">
  <a
    href={venueProgrammingUrl(lead)}
    target="_blank"
    rel="noopener noreferrer"
    onClick={(e) => e.stopPropagation()}
    title={`Clic para verificar la programación oficial en la web de ${lead.nombre_sala} (${lead.website || "Buscar en Google"})`}
    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--r-s)] text-micro font-sans font-bold bg-[var(--alert)] text-[var(--on-alert)] hover:bg-[var(--alert)]/90 transition-colors shadow-2xs group cursor-pointer"
  >
    <AlertCircle className="w-3 h-3 text-[var(--alert)] shrink-0" />
    <span>
      <ShowIcon inline emoji="🎯" />Campaña: <ShowIcon inline emoji="❌" />NO DISPONIBLE (Ocupada en fechas de campaña)
    </span>
    <ExternalLink className="w-2.5 h-2.5 text-[var(--alert)]/80 group-hover:text-[var(--alert)] shrink-0 ml-0.5" />
  </a>
  <LeadSourcePills lead={lead} />
      </div>
    );
  }
  return null;
}
