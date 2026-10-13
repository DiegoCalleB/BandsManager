/** Orden del panel de widgets: funciones puras para poder probarlas sin pintar el Dashboard. */

/**
 * Sube o baja un widget una posición ENTRE LOS VISIBLES. La lista completa puede llevar widgets
 * ocultos (el plan no los permite o están desactivados); mover por índice de la lista completa,
 * como se hacía, intercambiaba con un widget que el usuario ni ve y parecía que no pasaba nada.
 * Devuelve la misma lista si no hay a dónde mover.
 */
export function moverEntreVisibles<T extends { id: string }>(
  todos: readonly T[],
  visibles: readonly T[],
  indiceVisible: number,
  direccion: 'up' | 'down',
): T[] {
  const vecino = visibles[indiceVisible + (direccion === 'up' ? -1 : 1)];
  const actual = visibles[indiceVisible];
  if (!vecino || !actual) return [...todos];
  const copia = [...todos];
  const a = copia.findIndex((w) => w.id === actual.id);
  const b = copia.findIndex((w) => w.id === vecino.id);
  if (a === -1 || b === -1) return copia;
  [copia[a], copia[b]] = [copia[b], copia[a]];
  return copia;
}
