/**
 * Formas de las respuestas del servidor que usa `api.ts` y que no tienen ya un tipo en
 * `src/types.ts`. Viven aparte para que `api.ts` (más de 1000 líneas) no siga creciendo.
 * Cada tipo describe lo que devuelve la ruta citada, no un ideal: los campos opcionales pueden faltar.
 */
import type { BandContact, BandSchedule } from '../types';
import type { AgentAutonomyConfig } from '../components/dashboard/agent_autonomy/autonomyTypes';

/**
 * Banda de contacto tal como llega en `GET /api/state` (`bands`, filas de band_contacts).
 * `contacto_booking` lo lee useAutonomyConfig para prerrellenar el email; hoy esas filas no lo traen.
 */
export type BandaDelEstado = BandContact & { contacto_booking?: { email?: string } };

/** Configuración de autonomía de `GET /api/autonomy`: la de Supabase o la de memoria, posiblemente incompleta. */
export type ConfigAutonomiaServidor = Partial<AgentAutonomyConfig>;

/** Respuesta de `POST /api/autonomy`. */
export interface RespuestaGuardarAutonomia {
  success: boolean;
  autonomyConfig?: ConfigAutonomiaServidor;
  error?: string;
}

/** Guía del Contestador para un tipo de respuesta (ver server/routes/bands/responseStrategies.ts). */
export interface EstrategiaRespuesta {
  responseType?: string;
  guidancePrompt?: string;
  tone?: string;
  mentionLinks?: boolean;
}

/** Respuesta de `POST`/`DELETE /api/response-strategies`. */
export interface RespuestaEstrategias {
  success: boolean;
  responseStrategies?: Record<string, EstrategiaRespuesta>;
  message?: string;
  error?: string;
}

/** Respuesta de `POST /api/metrics/cron-snapshot-all` (resultado de executeSocialRadar). */
export interface RespuestaRadar {
  success: boolean;
  message?: string;
  executionTime?: string;
  totalBands?: number;
  /** Un resultado por banda rastreada; el cliente no lo desglosa. */
  results?: unknown[];
  error?: string;
}

/** Cuenta de Instagram que devuelven `/api/metrics/instagram/status` y `/connect`. */
export type CuentaInstagram = {
  id?: string;
  username?: string;
  name?: string;
  followers_count?: number | null;
  media_count?: number | null;
};

/** Respuesta de `POST /api/bands/schedules`. */
export interface RespuestaGuardadoHorario {
  success: boolean;
  data?: BandSchedule;
  error?: string;
}

/** Estado de `GET /api/gmail-oauth/status` (toSafeGmailOAuthResponse: sin refresh_token). */
export interface EstadoGmailOAuth {
  connected: boolean;
  band_id?: string;
  gmail_email?: string;
  scope?: string;
  connected_at?: string;
  updated_at?: string;
  /** Si Google revocó el permiso (invalid_grant): cuándo. Hay que reconectar. */
  needs_reauth_at?: string | null;
}

/** Respuesta de `POST /api/billing/confirm-success` (applyPlanUpgrade o el error de validación). */
export interface RespuestaConfirmacionPago {
  success: boolean;
  plan?: string;
  status?: string;
  error?: string;
  /** El alta queda en manos del webhook de Stripe. */
  pendiente_webhook?: boolean;
}

/** Recinto de `POST /api/leads/campaign-mass-search`: el resultado bruto de Places más el cruce con el CRM. */
export interface RecintoBusquedaMasiva {
  nombre_sala?: string;
  aforo?: number | string;
  rating?: number;
  alreadyInCrm: boolean;
  crmStatus: string | null;
  crmId: string | null;
  crmNombre: string | null;
  capacityMatch: boolean;
  selected: boolean;
  [campo: string]: unknown;
}
