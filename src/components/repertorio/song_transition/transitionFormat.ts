/**
 * Formato de tiempos de la comprobación de transición.
 */

/**
 * Formatea segundos como `m:ss`.
 * @param seconds Segundos (se trunca la parte decimal).
 * @returns Texto `m:ss`, p. ej. `3:07`.
 */
export function formatSec(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}
