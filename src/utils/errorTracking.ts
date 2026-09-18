// Red de errores del frontend (React / Navegador del usuario).
// Al igual que en el servidor (server/utils/errorTracking.ts), Sentry aquí es pasivo:
// sin VITE_SENTRY_DSN en el entorno, initFrontendErrorTracking() y captureFrontendError() son no-ops.
// Se activa únicamente al definir VITE_SENTRY_DSN en el entorno del cliente.
import * as Sentry from '@sentry/react';

let habilitado = false;

export function initFrontendErrorTracking(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'production',
    tracesSampleRate: 0.1,
  });

  habilitado = true;
  console.log('[ErrorTracking] Sentry Frontend activado.');
}

export function captureFrontendError(err: unknown, context?: Record<string, unknown>): void {
  if (!habilitado) return;
  Sentry.captureException(err, context ? { extra: context } : undefined);
}
