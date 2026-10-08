import { useCallback, useEffect, useState } from 'react';

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
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    setIndice((i) => acotarIndice(i, total));
  }, [total]);

  const irA = useCallback((i: number) => setIndice(acotarIndice(i, total)), [total]);
  const anterior = useCallback(() => setIndice((i) => acotarIndice(i - 1, total)), [total]);
  const siguiente = useCallback(() => setIndice((i) => acotarIndice(i + 1, total)), [total]);

  return {
    indice,
    irA,
    anterior,
    siguiente,
    esPrimero: indice <= 0,
    esUltimo: indice >= total - 1,
  };
}
