/**
 * Preparación de la conversación del chat del Mánager Virtual antes de enviarla al modelo.
 *
 * Todo lo que llega en el cuerpo de la petición (el mensaje y el historial) se paga en tokens de
 * entrada: sin tope, una sola petición manipulada puede costar mucho más que cien normales. Estos
 * topes son holgados para el uso real (el cliente manda los últimos 8 mensajes) y solo cortan el
 * abuso.
 */
import type { Content } from '@google/genai';

/** Turnos del historial que se envían al modelo: el contexto reciente basta y cada turno de más se paga. */
export const MAX_TURNOS_HISTORIAL = 20;
/** Caracteres que se conservan de cada turno del historial (el resto se recorta). */
export const MAX_CARACTERES_TURNO = 4_000;
/** Caracteres máximos del mensaje nuevo: si se pasa, se rechaza en vez de recortar en silencio. */
export const MAX_CARACTERES_MENSAJE = 4_000;
/**
 * Tope de tokens de la respuesta. El chat devuelve un JSON con el texto y las acciones propuestas;
 * 4.096 sobra para eso y evita que un prompt manipulado pida respuestas enormes.
 */
export const MAX_TOKENS_RESPUESTA_CHAT = 4_096;

export interface TurnoHistorial {
  role: 'user' | 'model';
  text: string;
}

/** El mensaje nuevo tiene que ser una cadena de longitud razonable. */
export function mensajeAceptable(mensaje: unknown): mensaje is string {
  return typeof mensaje === 'string' && mensaje.length <= MAX_CARACTERES_MENSAJE;
}

function aTexto(valor: unknown): string {
  if (typeof valor === 'string') return valor;
  if (valor === undefined || valor === null) return '';
  try {
    return JSON.stringify(valor) ?? '';
  } catch {
    return '';
  }
}

/**
 * Historial que manda el cliente, acotado: solo los últimos `MAX_TURNOS_HISTORIAL` turnos, cada uno
 * recortado, sin entradas que no sean objetos ni turnos vacíos (el modelo rechaza las partes vacías).
 */
export function acotarHistorial(historial: unknown): TurnoHistorial[] {
  if (!Array.isArray(historial)) return [];
  return historial.slice(-MAX_TURNOS_HISTORIAL).flatMap((h): TurnoHistorial[] => {
    if (!h || typeof h !== 'object') return [];
    const { sender, text } = h as { sender?: unknown; text?: unknown };
    const recortado = aTexto(text).slice(0, MAX_CARACTERES_TURNO);
    if (!recortado.trim()) return [];
    return [{ role: sender === 'user' ? 'user' : 'model', text: recortado }];
  });
}

/** Añade un turno; si el anterior es del mismo rol, lo une a él (el modelo exige alternar roles). */
export function agregarTurno(turnos: Content[], role: 'user' | 'model', text: string): void {
  const ultimo = turnos[turnos.length - 1];
  if (ultimo?.role === role) (ultimo.parts ??= []).push({ text });
  else turnos.push({ role, parts: [{ text }] });
}
