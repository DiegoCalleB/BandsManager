import type { ModoEscucha } from './mezclaStems';

export type ModoAtril = 'Estudiar' | 'Ensayar' | 'Tocar';

export interface AjustesModoAtril {
  /** Diagramas de acordes abiertos al entrar (en móvil nunca, ocupan la hoja). */
  diagramas: boolean;
  /** Banda del Oído (análisis de audio) visible al entrar. */
  oido: boolean;
  /** Qué suena de los stems al entrar. */
  escucha: ModoEscucha;
}

/**
 * Qué enseña el Atril al abrirse según el modo.
 * Estudiar: todo a la vista. Ensayar: la banda suena sin mi pista. Tocar: hoja limpia, sin distracciones.
 */
export function ajustesDeModoAtril(modo: ModoAtril, anchoPantalla: number): AjustesModoAtril {
  const escritorio = anchoPantalla >= 768;
  if (modo === 'Tocar') return { diagramas: false, oido: false, escucha: 'todo' };
  if (modo === 'Ensayar') return { diagramas: escritorio, oido: true, escucha: 'sin' };
  return { diagramas: escritorio, oido: true, escucha: 'todo' };
}
