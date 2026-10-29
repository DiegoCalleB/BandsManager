/** Semitonos (−6…+6) para llevar una tónica a otra por el camino más corto: E→G = +3, E→C = −4. */
export function semitonosHasta(tonicaOrigen: number, tonicaDestino: number): number {
  const d = (((tonicaDestino - tonicaOrigen) % 12) + 12) % 12;
  return d > 6 ? d - 12 : d;
}

/** Velocidad de práctica en pasos del 5 % (50–125 %), sin errores de coma flotante. */
export const VELOCIDAD_MIN = 0.5;
export const VELOCIDAD_MAX = 1.25;
export const ajustarVelocidad = (v: number): number => Math.round(Math.min(VELOCIDAD_MAX, Math.max(VELOCIDAD_MIN, v)) * 20) / 20;
