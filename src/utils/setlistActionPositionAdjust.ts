/**
 * Cuando un modal ofrece varias sugerencias/acciones para aplicar de una en una (Análisis IA,
 * Setlist Perfecto), cada una lleva posiciones calculadas contra el setlist tal como estaba
 * cuando se generó el plan. Aplicar la primera cambia el array real — si las demás no se
 * actualizan, la segunda "Aplicar" mueve/quita/añade sobre el índice EQUIVOCADO (el setlist
 * cambió de forma, pero la posición que la sugerencia lleva escrita sigue siendo la de antes).
 * Esto es justo lo que hacía que solo se pudiera aplicar una sugerencia con confianza.
 *
 * Estas funciones reproducen, sobre un único número de posición, el mismo desplazamiento que
 * sufre el array real de items al reordenar/quitar/insertar — así el resto de sugerencias
 * pendientes se pueden "reajustar" en el frontend sin tener que volver a llamar a la IA.
 */

export type IndexChange = { type: 'move'; from: number; to: number } | { type: 'remove'; at: number } | { type: 'insert'; at: number };

/**
 * Ajusta una posición 0-indexada tras un cambio en OTRO punto del mismo array. Devuelve null si
 * el cambio fue justo "quitar el item que esta posición señalaba" — en ese caso la posición ya no
 * significa nada, y quien la use debe descartar la acción entera, no ejecutarla con un índice
 * inventado.
 */
export function adjustIndex(position0: number, change: IndexChange): number | null {
  if (change.type === 'move') {
    const { from, to } = change;
    if (position0 === from) return to;
    if (from < position0 && position0 <= to) return position0 - 1;
    if (to <= position0 && position0 < from) return position0 + 1;
    return position0;
  }
  if (change.type === 'remove') {
    if (position0 === change.at) return null;
    return position0 > change.at ? position0 - 1 : position0;
  }
  // insert
  return position0 >= change.at ? position0 + 1 : position0;
}

/** Misma idea que `adjustIndex` pero en 1-indexado (que es como estas posiciones viajan en las
 * acciones de la IA) y pasando `undefined` a través sin tocar (un campo que esa acción no usa). */
export function adjustPosition1(pos: number | undefined, change: IndexChange): number | null | undefined {
  if (pos == null) return undefined;
  const adjusted0 = adjustIndex(pos - 1, change);
  return adjusted0 == null ? null : adjusted0 + 1;
}
