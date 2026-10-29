/** Deshacer y rehacer del cartel: pilas de «fotos» del diseño (ajustes + fondo), acotadas. */
export interface Historial<T> {
  pasado: T[];
  futuro: T[];
}

export const MAX_HISTORIAL = 50;
export const HISTORIAL_VACIO: Historial<never> = { pasado: [], futuro: [] };

/** Anota el estado previo a un cambio. Cualquier cambio nuevo borra lo que se podía rehacer. */
export function anotar<T>(h: Historial<T>, previo: T): Historial<T> {
  return { pasado: [...h.pasado, previo].slice(-MAX_HISTORIAL), futuro: [] };
}

/** Vuelve un paso atrás. `null` si no hay nada que deshacer. */
export function deshacer<T>(h: Historial<T>, actual: T): { historial: Historial<T>; estado: T } | null {
  const estado = h.pasado[h.pasado.length - 1];
  if (estado === undefined) return null;
  return { estado, historial: { pasado: h.pasado.slice(0, -1), futuro: [...h.futuro, actual] } };
}

/** Rehace lo último deshecho. `null` si no hay nada que rehacer. */
export function rehacer<T>(h: Historial<T>, actual: T): { historial: Historial<T>; estado: T } | null {
  const estado = h.futuro[h.futuro.length - 1];
  if (estado === undefined) return null;
  return { estado, historial: { pasado: [...h.pasado, actual].slice(-MAX_HISTORIAL), futuro: h.futuro.slice(0, -1) } };
}
