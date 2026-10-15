/**
 * Tipos de respuestas de la API usadas por el CRM de booking.
 * Documentan los campos que la UI lee para no usar `any` sobre el JSON de apiFetch.
 */

/** Resultado por lead del agente Enviador. */
export interface EnviadorResult {
  status?: string;
  nombre_sala?: string;
  error?: string;
}

/** Respuesta de `/api/trigger-agent` para el agente Enviador. */
export interface EnviadorResponse {
  message?: string;
  dispatchedCount?: number;
  results?: EnviadorResult[];
}

/** Respuesta de `/api/leads/enrich-addresses`. */
export interface EnrichAddressesResponse {
  enrichedCount?: number;
  totalLeads?: number;
  leads?: unknown[];
}

/** Datos extraídos al rastrear una sala (cada campo puede venir como `{ valor }` o como valor plano). */
export type ScrapedField = string | { valor?: string } | null | undefined;
