/**
 * Campos que el radar de fechas añade a un lead y que aún no figuran en el tipo `Lead`.
 * Centraliza el acceso tipado en lugar de `un cast a any` repartido por las vistas.
 */
import type { BookingCampaign,Lead } from "../../../types";

export interface LeadRadarFields {
  fecha_posible_evento?: string;
  fechas_libres_campana?: string[];
  fechas_propuestas?: string[];
  fechas_disponibles?: string[];
  disponible_para_campana?: boolean;
  estado_cartelera?: string;
  max_fecha_publicada?: string;
  radar_wegow_status?: string;
  radar_bandsintown_status?: string;
  contrastado_multi_fuente?: boolean;
  fiabilidad_radar?: string;
}

/**
 * Vista del lead con los campos del radar tipados.
 * @param lead Lead de la fila o tarjeta.
 * @returns El mismo objeto, tipado con los campos opcionales del radar.
 */
export function radarDe(lead: Lead): Lead & LeadRadarFields {
  return lead;
}

/** Alias heredados de la API para los datos de una campaña (snake_case, castellano). */
export interface CampaignLegacyFields {
  target_dates?: string[];
  fechas_objetivo?: string;
  fechasObjetivo?: string;
  fechas?: string;
  nombre?: string;
}

/**
 * Campaña activa con sus alias heredados tipados.
 * @param campaign Campaña activa, si la hay.
 * @returns La misma campaña tipada con los alias, o `undefined`.
 */
export function campanaDe(campaign?: BookingCampaign | null): (BookingCampaign & CampaignLegacyFields) | undefined {
  return campaign ?? undefined;
}
