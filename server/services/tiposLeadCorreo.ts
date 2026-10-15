import type { Lead } from "../../src/types.js";

/**
 * Lead tal como lo leen los agentes de correo (Lector, Enviador): además de los campos de la app,
 * las columnas de `leads` que enlazan con Gmail y que el cliente no usa.
 */
export type LeadConCorreo = Lead & {
  /** Hilo de Gmail del último envío (emparejamiento determinista de respuestas). */
  gmail_thread_id?: string;
  /** Message-ID del último envío (cabeceras In-Reply-To / References). */
  gmail_message_id?: string;
  /** Borrador de Gmail que dejó el Enviador, pendiente de enviar a mano. */
  gmail_draft_id?: string;
};
