/**
 * Extracción segura del mensaje de un valor capturado en `catch`, que en TypeScript estricto es `unknown`.
 * Evita `catch (err: any)` y centraliza el fallback mostrado al usuario.
 */

/**
 * Devuelve el mensaje legible de un error capturado.
 * @param error Valor capturado en un `catch`.
 * @param fallback Texto si el valor no es un `Error` con mensaje; por defecto cadena vacía.
 * @returns El `message` del error o el `fallback`.
 */
export function getErrorMessage(error: unknown, fallback = ""): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
