/**
 * Fecha de hoy (`YYYY-MM-DD`) en hora de Madrid.
 * `new Date().toISOString().slice(0, 10)` da la fecha en UTC: entre las 00:00 y las 01:00/02:00 de
 * Madrid devuelve AYER, y el bolo de anoche seguía saliendo como «próximo» y un gasto apuntado
 * después de medianoche se guardaba con la fecha del día anterior.
 */
export function hoyMadrid(ahora: Date = new Date()): string {
  return ahora.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
}
