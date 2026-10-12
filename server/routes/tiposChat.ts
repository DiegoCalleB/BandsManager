/**
 * Tipos del chat del Mánager Virtual (chat.ts): mensajes del historial, acciones que propone la
 * IA y los parámetros con los que se dispara un agente.
 */
import type { Content, FunctionCall, Part } from '@google/genai';
import type { ErrorCapturado } from '../../src/utils/errorCapturado.js';

/** Mensaje del historial que manda el cliente en el cuerpo de la petición. */
export interface MensajeHistorialChat {
  sender?: string;
  text?: unknown;
}

/** Acción que el Mánager propone y el usuario confirma en la interfaz (el resto de campos depende del tipo). */
export interface AccionPropuesta {
  type: string;
  [campo: string]: unknown;
}

/** Turno de la conversación que se envía al modelo. */
export type TurnoChat = Content;

/**
 * Lo que el chat lee de la respuesta de `generateContentWithFallback`: el SDK de Gemini o, si
 * Gemini falla, la forma equivalente que fabrica el failover a DeepSeek (sin `functionCalls`).
 */
export interface VistaRespuestaIA {
  text?: string;
  functionCalls?: FunctionCall[];
  candidates?: { content?: { parts?: Part[] } }[];
}

/** Error final de `generateContentWithFallback`: cuelga la causa de cada proveedor. */
export type ErrorDeFailover = ErrorCapturado & {
  geminiError?: ErrorCapturado;
  deepSeekError?: ErrorCapturado;
};

/** Campos de una canción que se resumen para el prompt del chat. */
export interface CancionParaChat {
  id: string;
  titulo: string;
  estado?: string;
  duracion?: number | string;
  bpm?: number;
  tonalidad?: string;
  genero?: string;
}

/** Fila de `setlists` (columnas snake_case de Supabase) que se resume para el prompt del chat. */
export interface SetlistParaChat {
  id: string;
  nombre: string;
  fecha_ultima_edicion?: string;
  duracion_total_estimada_minutos?: number;
}

/** Parámetros con los que el chat dispara un agente (Scout: ciudad, región y tipo). */
export interface ParametrosAgenteChat {
  ciudad?: string;
  region?: string;
  tipo?: string;
}
