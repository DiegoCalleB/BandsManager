import type { ModoEscucha } from './mezclaStems';

export type ModoAtril = 'Estudiar' | 'Ensayar' | 'Tocar';

export interface AjustesModoAtril {
  /** Diagramas de acordes abiertos al entrar (nunca por defecto: la barra «Acorde actual» ya enseña el diagrama que suena). */
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
  void anchoPantalla; // se conserva en la firma por si un modo vuelve a depender del ancho
  if (modo === 'Tocar') return { diagramas: false, oido: false, escucha: 'todo' };
  if (modo === 'Ensayar') return { diagramas: false, oido: true, escucha: 'sin' };
  return { diagramas: false, oido: true, escucha: 'todo' };
}
