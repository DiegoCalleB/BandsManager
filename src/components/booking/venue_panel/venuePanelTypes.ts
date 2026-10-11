/**
 * Tipos compartidos por el contenedor del panel de sala y sus secciones extraídas.
 * Evitan repetir uniones literales y el uso de `any` en las props de cada sección.
 */
import type { EmailMessage } from "../../../types";

/** Pestañas internas del panel de sala. */
export type VenuePanelTab = "info" | "emails" | "intelligence" | "copilot" | "bitacora";

/** Entrada del hilo unificado: mensaje manual (`hilo_emails`) o real (`lead_messages`). */
export type VenueThreadEntry = EmailMessage & { _origen: "manual" | "real" };

/** Respuesta de `/api/trigger-agent`: resultado por lead procesado. */
export interface TriggerAgentResponse {
  message?: string;
  results?: Array<{ id: string; status?: string; error?: string; message?: string }>;
}
