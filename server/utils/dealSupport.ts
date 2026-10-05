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
