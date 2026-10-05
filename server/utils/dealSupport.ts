/**
 * Aportación voluntaria a BandManager al cerrar un bolo (sustituye, de momento, a la comisión
 * obligatoria del 5%). El importe sugerido es un % del caché redondeado al euro: un número
 * "bonito" convierte mejor que un 2,87 € calculado al céntimo.
 */

/** Porcentaje del caché que se sugiere (la banda puede cambiarlo en el checkout). */
export const APOYO_PORCENTAJE_SUGERIDO = 3;
/** Suelo y techo de la SUGERENCIA, en euros. */
export const APOYO_SUGERIDO_MIN_EUR = 2;
export const APOYO_SUGERIDO_MAX_EUR = 100;
/** Rango que admite el checkout (pay what you want), en céntimos. */
export const APOYO_MIN_CENTS = 100; // 1 €
export const APOYO_MAX_CENTS = 50000; // 500 €
/** Cuánto tiempo después de la firma se sigue ofreciendo la aportación. */
export const APOYO_VENTANA_DIAS = 60;

export function sugerenciaApoyoCents(totalAcordado: number): number {
  const total = Number(totalAcordado);
  const base = Number.isFinite(total) && total > 0 ? total : 0;
  const euros = Math.round((base * APOYO_PORCENTAJE_SUGERIDO) / 100);
  const acotado = Math.min(APOYO_SUGERIDO_MAX_EUR, Math.max(APOYO_SUGERIDO_MIN_EUR, euros));
  return acotado * 100;
}

/** Porcentaje máximo que se puede elegir al crear el acuerdo. */
export const APOYO_PORCENTAJE_MAX = 20;

/**
 * Normaliza el porcentaje de apoyo que llega del cliente. `null` = la banda no ha elegido (se usa
 * la sugerencia por defecto); `0` = ha elegido no apoyar (no se le vuelve a pedir); 0.5-20 = su
 * elección. Cualquier cosa que no sea un número finito se trata como "no elegido".
 */
export function normalizarApoyoPorcentaje(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(valor);
  if (!Number.isFinite(n)) return null;
  const acotado = Math.min(APOYO_PORCENTAJE_MAX, Math.max(0, n));
  return Math.round(acotado * 2) / 2; // pasos de 0,5
}

/**
 * Importe propuesto cuando la banda ha elegido un porcentaje: ese % del caché redondeado al euro,
 * dentro del rango del checkout. 0 % (o un caché sin valor) = 0: no se propone nada.
 */
export function apoyoCentsDePorcentaje(totalAcordado: number, porcentaje: number): number {
  const total = Number(totalAcordado);
  if (!Number.isFinite(total) || total <= 0 || !(porcentaje > 0)) return 0;
  const euros = Math.round((total * porcentaje) / 100);
  return Math.min(APOYO_MAX_CENTS, Math.max(APOYO_MIN_CENTS, euros * 100));
}

/** Importe a proponer para un acuerdo: su porcentaje elegido, o la sugerencia por defecto. */
export function apoyoPropuestoCents(totalAcordado: number, apoyoPorcentaje: number | null | undefined): number {
  return apoyoPorcentaje === null || apoyoPorcentaje === undefined
    ? sugerenciaApoyoCents(totalAcordado)
    : apoyoCentsDePorcentaje(totalAcordado, apoyoPorcentaje);
}
