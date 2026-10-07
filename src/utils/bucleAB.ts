/** Bucle A/B de una pieza, en segundos. Compartido por el Atril y el panel de práctica. */
export interface BucleAB {
  a: number | null;
  b: number | null;
}

export const SIN_BUCLE: BucleAB = { a: null, b: null };

export function bucleActivo(bucle: BucleAB): bucle is { a: number; b: number } {
  return bucle.a != null && bucle.b != null && bucle.b > bucle.a;
}

/** Marca un extremo en `t`; si deja el bucle del revés (A >= B) descarta el otro extremo. */
export function marcarExtremo(bucle: BucleAB, extremo: 'a' | 'b', t: number): BucleAB {
  if (extremo === 'a') return { a: t, b: bucle.b != null && bucle.b > t ? bucle.b : null };
  return { a: bucle.a != null && bucle.a < t ? bucle.a : null, b: t };
}

/** Tiempo al que hay que saltar si `t` ha pasado B (a A, o al inicio si no hay A); `null` si no toca. */
export function saltoDeBucle(t: number, a: number | null, b: number | null): number | null {
  if (b == null || t < b) return null;
  return a ?? 0;
}
