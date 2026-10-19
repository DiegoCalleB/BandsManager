// Interruptor por banda de la suscripción de pago (`registered_bands.suscripcion_habilitada`).
// La suscripción está apagada por defecto: solo las bandas con el interruptor a true pueden contratar.
// El código no conoce qué bandas son (ADR 0027): se enciende con un UPDATE en la base de datos.

const sinPrefijo = (id: string) => id.replace(/^(band|reg)-/i, '').toLowerCase().trim();

/** Coincidencia exacta de `band_id` (sin prefijo): nada de nombres parecidos, es una puerta de pago. */
export function suscripcionHabilitada(
  bandas: ReadonlyArray<{ band_id?: string; suscripcion_habilitada?: unknown }> | undefined,
  bandId: string | undefined,
): boolean {
  const buscada = sinPrefijo(bandId || '');
  if (!buscada || buscada === 'default') return false;
  return (bandas || []).some((b) => sinPrefijo(b.band_id || '') === buscada && b.suscripcion_habilitada === true);
}

/** Cuerpo de la respuesta 403 del checkout de una banda sin el interruptor. */
export const SUSCRIPCION_NO_HABILITADA = {
  success: false,
  code: 'suscripcion_no_habilitada',
  error: 'La suscripción todavía no está disponible para esta banda.',
} as const;
