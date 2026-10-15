/**
 * Insignias de fechas de un lead en la vista de tabla (compacta).
 * Extraído de LeadDatesInfo (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { CalendarCheck } from "lucide-react";
import type { Lead } from "../../../types";
import { checkBandDateConflict,getCityTourHistory } from "../../../utils/bookingTourContext";
import { Chip } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { radarDe } from "./leadRadar";
import { useLeadsTable } from "./LeadsTableContext";

/**
 * Insignias compactas de fechas para la fila de la tabla.
 * @param props.lead Lead de la fila.
 * @returns Insignias de conflicto, historial de gira y fechas libres, o `null` si no hay datos.
 */
export function LeadDatesTableBadges({ lead }: { lead: Lead }) {
  const { concerts, activeCampaign } = useLeadsTable();
    const targetDate =
      radarDe(lead).fecha_posible_evento ||
      (lead.fechas_propuestas_sala && lead.fechas_propuestas_sala[0]) ||
      (lead.fechas_libres_detectadas && lead.fechas_libres_detectadas[0]) ||
      radarDe(lead).fechas_libres_campana?.[0] ||
      radarDe(lead).fechas_propuestas?.[0] ||
      radarDe(lead).fechas_disponibles?.[0];
    const conflict = checkBandDateConflict(targetDate, concerts, lead.ciudad);
    const hist = getCityTourHistory(lead.ciudad, concerts);
    const freeDates = lead.fechas_libres_detectadas || [];
    const campaignFreeDates = radarDe(lead).fechas_libres_campana || [];
    const campaignIsActive =
      activeCampaign &&
      (activeCampaign.isActive ?? activeCampaign.is_active ?? true);

    const badges: React.ReactNode[] = [];

    if (conflict.status === "conflicto_directo") {
      badges.push(
  <Chip
    key="conf"
    tone="alert"
    title={conflict.mensaje}
  >
    <ShowIcon inline emoji="🔴" />Conflicto
  </Chip>,
      );
    } else if (conflict.status === "cercano_compatible") {
      badges.push(
  <Chip
    key="compat"
    tone="ok"
    title={conflict.mensaje}
  >
    <ShowIcon inline emoji="🚗" />Enlace 2x1
  </Chip>,
      );
    }

    if (campaignIsActive && campaignFreeDates.length > 0) {
      badges.push(
  <Chip
    key="camp"
    tone="acc"
    title={`Fechas campaña: ${campaignFreeDates.join(", ")}`}
  >
    <ShowIcon inline emoji="🎯" />{campaignFreeDates.length} d.
  </Chip>,
      );
    } else if (freeDates.length > 0) {
      badges.push(
  <Chip
    key="free"
    tone="acc"
    title={`Fechas libres detectadas: ${freeDates.join(", ")}`}
  >
    <CalendarCheck className="w-3 h-3 shrink-0" />
    <span>{freeDates.length} lib.</span>
  </Chip>,
      );
    }

    if (hist && hist.totalConciertos > 0) {
      badges.push(
  <Chip
    key="hist"
    tone="neutral"
    title={hist.resumenTexto}
  >
    <ShowIcon inline emoji="🏛️" />{hist.totalConciertos} prev.
  </Chip>,
      );
    }

    if (badges.length === 0) return null;

    return (
      <div className="flex items-center gap-1 mt-0.5 flex-wrap">{badges}</div>
    );
}
