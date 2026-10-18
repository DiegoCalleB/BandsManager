/**
 * Etiquetas de fuentes de radar y enlace a la programación de la sala.
 * Extraído de LeadDatesInfo (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { ExternalLink } from "lucide-react";
import type { Lead } from "../../../types";
import { checkBandDateConflict,getCityTourHistory } from "../../../utils/bookingTourContext";
import { ShowIcon } from "../../ui/ShowIcon";
import { radarDe } from "./leadRadar";
import { useLeadsTable } from "./LeadsTableContext";

/**
 * Etiquetas de fiabilidad del radar y enlace a la programación de la sala.
 * @param props.lead Lead del que se muestran las fuentes.
 * @returns Bloque de etiquetas de fuentes.
 */
export function LeadSourcePills({ lead }: { lead: Lead }) {
  const { concerts } = useLeadsTable();

  // Status indicators de fuentes de radar
  const wegowStatus =
    radarDe(lead).radar_wegow_status ||
    (lead.fechas_ocupadas && lead.fechas_ocupadas.length > 0
      ? "ok"
      : undefined);
  const bandsintownStatus =
    radarDe(lead).radar_bandsintown_status ||
    radarDe(lead).contrastado_multi_fuente
      ? "ok"
      : undefined;
  const contrastado = Boolean(
    radarDe(lead).contrastado_multi_fuente ||
    (wegowStatus === "ok" && bandsintownStatus === "ok"),
  );
  const fiabilidad =
    radarDe(lead).fiabilidad_radar ||
    (contrastado
      ? "alta"
      : lead.fechas_ocupadas && lead.fechas_ocupadas.length > 0
  ? "media"
  : "sin_datos");


  const renderSourcePills = () => {
    const targetDate =
      radarDe(lead).fecha_posible_evento ||
      (lead.fechas_propuestas_sala && lead.fechas_propuestas_sala[0]) ||
      (lead.fechas_libres_detectadas && lead.fechas_libres_detectadas[0]) ||
      radarDe(lead).fechas_libres_campana?.[0] ||
      radarDe(lead).fechas_propuestas?.[0] ||
      radarDe(lead).fechas_disponibles?.[0];
    const conflict = checkBandDateConflict(targetDate, concerts, lead.ciudad);
    const hist = getCityTourHistory(lead.ciudad, concerts);

    return (
      <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-micro font-mono">
  {wegowStatus === "ok" && (
    <a
      href={`https://www.wegow.com/es-es/busqueda?query=${encodeURIComponent(lead.nombre_sala)}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded hover:opacity-80 transition-opacity cursor-pointer bg-[var(--ok)] text-[var(--on-ok)]"
      title="Wegow API verificado - clic para ver cartelera en wegow"
    >
      <span className="w-1.5 h-1.5 rounded-[var(--r-pill)] bg-current"></span>
      Wegow: ✓ OK
      <ExternalLink className="w-2 h-2 ml-0.5 opacity-60 shrink-0" />
    </a>
  )}

  {bandsintownStatus === "ok" && (
    <a
      href={`https://www.bandsintown.com/a/search?q=${encodeURIComponent(lead.nombre_sala)}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded hover:opacity-80 transition-opacity cursor-pointer bg-[var(--ink)] text-[var(--bg)]"
      title="Bandsintown verificado - clic para ver en bandsintown"
    >
      <span className="w-1.5 h-1.5 rounded-[var(--r-pill)] bg-current"></span>
      Bandsintown: ✓ OK
      <ExternalLink className="w-2 h-2 ml-0.5 opacity-60 shrink-0" />
    </a>
  )}

  {contrastado && (
    <span className="text-micro text-[var(--on-acc)] font-bold bg-[var(--acc)] px-1 py-0.2 rounded">
      <ShowIcon inline emoji="⭐" />Contrastado (Fiabilidad {fiabilidad})
    </span>
  )}

  {conflict.status === "conflicto_directo" && (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-[var(--alert)] text-[var(--on-alert)] font-bold"
      title={conflict.mensaje}
    >
      <ShowIcon inline emoji="🔴" />Conflicto agenda
    </span>
  )}

  {conflict.status === "cercano_compatible" && (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-[var(--ok)] text-[var(--on-ok)] font-bold"
      title={conflict.mensaje}
    >
      <ShowIcon inline emoji="🚗" />Enlace 2x1
    </span>
  )}

  {hist && (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-[var(--acc)] text-[var(--on-acc)] "
      title={hist.resumenTexto}
    >
      <ShowIcon inline emoji="🏛️" />{hist.totalConciertos}{" "}
      {hist.totalConciertos === 1 ? "bolo" : "bolos"} prev.
    </span>
  )}
      </div>
    );
  };
  return renderSourcePills();
}
