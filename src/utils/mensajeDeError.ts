/**
 * Un error técnico del servidor («Error 404: Not Found», «Failed to fetch») no se le enseña tal cual a un músico.
 * @param err Error capturado.
 * @param amable Mensaje que se muestra si el del error es técnico o no existe.
 * @returns El mensaje del error si es legible; si no, el amable.
 */
export function mensajeDeError(err: unknown, amable: string): string {
  const m = err instanceof Error ? err.message : "";
  return !m || /^(error\s*)?\d{3}\b|not found|failed to fetch|networkerror|load failed/i.test(m) ? amable : m;
}
