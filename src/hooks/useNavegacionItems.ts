import { useCallback, useState } from 'react';

/** Índice acotado al rango de una lista (vacía → 0). */
export function acotarIndice(i: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(Math.max(0, i), total - 1);
}

/**
 * Posición dentro de la lista de ítems del modo en vivo (setlist o agenda de ensayo).
 * `anterior`/`siguiente` no se salen del rango y, si la lista se acorta mientras se toca,
 * el índice se reajusta en vez de apuntar a un ítem que ya no existe.
 */
export function useNavegacionItems(total: number) {
  const [indiceGuardado, setIndice] = useState(0);
  // Si la lista encoge, el índice se acota al leerlo (sin efecto que lo corrija después).
  const indice = acotarIndice(indiceGuardado, total);

  const irA = useCallback((i: number) => setIndice(acotarIndice(i, total)), [total]);
  const anterior = useCallback(() => setIndice((i) => acotarIndice(acotarIndice(i, total) - 1, total)), [total]);
  const siguiente = useCallback(() => setIndice((i) => acotarIndice(acotarIndice(i, total) + 1, total)), [total]);

  return {
    indice,
    irA,
    anterior,
    siguiente,
    esPrimero: indice <= 0,
    esUltimo: indice >= total - 1,
  };
}
