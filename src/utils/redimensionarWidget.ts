/** Tamaños de un widget y cómo salen de un arrastre o de una tecla. Todo puro, sin DOM. */

export const ANCHOS = [3, 4, 6, 8, 12] as const;
export type Ancho = (typeof ANCHOS)[number];
export const ALTOS = ['compact', 'normal', 'tall'] as const;
export type Alto = (typeof ALTOS)[number];

/** Píxeles de arrastre vertical para pasar de un alto al siguiente. */
export const PASO_ALTO_PX = 90;

/** El ancho de la rejilla de 12 columnas que más se parece a `anchoPx`. */
export function anchoDesdePixeles(anchoPx: number, anchoRejillaPx: number): Ancho {
  if (!(anchoRejillaPx > 0)) return 12;
  const columnas = (anchoPx / anchoRejillaPx) * 12;
  return ANCHOS.reduce((mejor, a) => (Math.abs(a - columnas) < Math.abs(mejor - columnas) ? a : mejor), ANCHOS[0]);
}

/** El alto que corresponde a arrastrar `dy` píxeles desde `inicial` (hacia abajo crece). */
export function altoDesdeDelta(inicial: Alto, dy: number): Alto {
  const i = ALTOS.indexOf(inicial) + Math.round(dy / PASO_ALTO_PX);
  return ALTOS[Math.min(ALTOS.length - 1, Math.max(0, i))];
}

/** Siguiente ancho permitido (para el teclado). En los extremos se queda donde está. */
export function pasoAncho(actual: number, dir: -1 | 1): Ancho {
  const i = ANCHOS.findIndex((a) => a >= actual);
  const base = i === -1 ? ANCHOS.length - 1 : i;
  // si el ancho guardado no está en la lista, se parte del más cercano por arriba
  return ANCHOS[Math.min(ANCHOS.length - 1, Math.max(0, base + dir))];
}

export function pasoAlto(actual: Alto | undefined, dir: -1 | 1): Alto {
  const i = ALTOS.indexOf(actual ?? 'normal');
  return ALTOS[Math.min(ALTOS.length - 1, Math.max(0, i + dir))];
}
