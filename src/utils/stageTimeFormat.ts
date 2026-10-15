/**
 * Formato de tiempo de escenario (mm:ss con ceros a la izquierda). Vive fuera del componente
 * para que los hooks de Repertorio lo reutilicen sin dependencias circulares.
 */

/**
 * Formatea segundos como `mm:ss`.
 * @param secs Segundos totales; valores nulos, negativos o NaN devuelven `00:00`.
 * @returns Cadena `mm:ss`.
 */
export function formatSecondsToMmSs(secs: number): string {
  if (!secs || isNaN(secs) || secs < 0) return "00:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
