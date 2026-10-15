/**
 * Vista tipada de un valor capturado en un `catch`.
 *
 * Lo que se lanza es `unknown`: puede ser un Error, la respuesta de un SDK o incluso un texto. Antes
 * se capturaba como `any` y cualquier acceso valía. Este tipo declara los campos que el código lee
 * de verdad (todos opcionales), así que TypeScript comprueba cada acceso sin cambiar qué hace en
 * ejecución. Uso: `catch (capturado) { const err = comoErrorCapturado(capturado); … }`.
 */
export interface ErrorCapturado {
  message?: string;
  name?: string;
  stack?: string;
  code?: string | number;
  status?: number;
  statusCode?: number;
  details?: unknown;
  cause?: unknown;
  response?: { status?: number; statusText?: string; data?: { error?: string; message?: string; [campo: string]: unknown } };
  /** Procesos hijos (`execFile`, FFmpeg). */
  stderr?: string;
  stdout?: string;
  /** Errores SMTP de nodemailer. */
  responseText?: string;
  responseStatus?: number;
  description?: string;
  authenticationFailed?: boolean;
  /** Campos que añade el servicio de Fal.ai al relanzar (ver FalAiService). */
  isLocked?: boolean;
  isRateLimit?: boolean;
  rawDetail?: string;
}

/**
 * Lee un valor capturado como {@link ErrorCapturado}. No transforma el valor: es el mismo objeto.
 * @param capturado Lo recibido en el `catch`.
 */
export function comoErrorCapturado(capturado: unknown): ErrorCapturado {
  return (capturado ?? {}) as ErrorCapturado;
}
