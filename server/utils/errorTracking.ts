// Red de errores del servidor: hasta ahora, un fallo no anticipado (uno que ningún try/catch
// específico esperaba) terminaba en un console.error/console.warn y nada más - nadie se entera
// hasta que una banda avisa de que algo no funciona. Sentry aquí es deliberadamente pasivo:
// sin SENTRY_DSN en el entorno, initErrorTracking() y captureError() son no-ops (ni siquiera
// cargan el SDK de verdad), así que en local/desarrollo esto no cambia nada. Se activa solo
// añadiendo SENTRY_DSN en Railway.
//
// No sustituye a agent_execution_logs (Supabase): esa tabla audita fallos DE NEGOCIO esperables
// (una banda sin cuenta de email conectada, una sala con email inválido...) y ya tiene su propio
// panel. Esto es solo para los bugs que nadie prevé.
import * as Sentry from "@sentry/node";

let habilitado = false;

export function initErrorTracking(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "production",
    tracesSampleRate: 0
  });
  habilitado = true;
  console.log("[ErrorTracking] Sentry activado.");
}

export function captureError(err: unknown, context?: Record<string, unknown>): void {
  if (!habilitado) return;
  Sentry.captureException(err, context ? { extra: context } : undefined);
}
