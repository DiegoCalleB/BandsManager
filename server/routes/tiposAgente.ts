/**
 * Filas de Supabase y resúmenes que manejan las rutas de los agentes (agent.ts). Solo los campos
 * que se leen; con `?` los que pueden faltar en la fila.
 */

/** Campaña tal como viene de `campaigns` / `booking_campaigns`, sin normalizar (snake_case). */
export interface CampanaCruda {
  name?: string;
  target_dates?: string[];
  target_dates_text?: string;
  [campo: string]: unknown;
}

/** Lead al que el Redactor acaba de generar un pitch, tal como se devuelve al cliente. */
export interface PitchRedactado {
  id: string;
  nombre_sala: string;
  pitch_preview: string;
  estado: string;
}

/** Fila de `agent_execution_logs`. */
export interface RegistroEjecucionAgente {
  id?: string;
  agente?: string;
  motor?: string;
  estado?: string;
  mensaje?: string;
  disparado_por_tipo?: string;
  created_at?: string;
  detalles?: unknown;
  leads_afectados?: unknown;
  conteo_afectados?: number;
  duracion_ms?: number;
}
