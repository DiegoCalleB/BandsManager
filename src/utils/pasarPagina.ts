/**
 * Gestos de «pasar página» compartidos por los dos modos en vivo (concierto y ensayo):
 * pedales bluetooth (emulan teclas) y swipe táctil. Puro, sin React.
 */
export type TeclaPagina = 'atras' | 'adelante' | 'espacio';
export type DireccionPagina = 'anterior' | 'siguiente';

/** Flechas y RePág/AvPág (los pedales de partituras emulan estas teclas) + espacio. */
export function accionDeTecla(key: string): TeclaPagina | null {
  if (key === 'ArrowLeft' || key === 'PageUp') return 'atras';
  if (key === 'ArrowRight' || key === 'PageDown') return 'adelante';
  if (key === ' ') return 'espacio';
  return null;
}

/**
 * Un swipe horizontal claro pasa de página; uno corto o predominantemente vertical se deja pasar
 * para no robarle el scroll al documento. `dy` en 0 desactiva la comprobación vertical.
 */
export function direccionDeSwipe(dx: number, dy: number, umbral: number): DireccionPagina | null {
  if (Math.abs(dx) < umbral) return null;
  if (dy !== 0 && Math.abs(dx) <= Math.abs(dy) * 1.2) return null;
  return dx < 0 ? 'siguiente' : 'anterior';
}
