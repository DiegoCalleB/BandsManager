// Red de errores del frontend (React / Navegador del usuario).
// Al igual que en el servidor (server/utils/errorTracking.ts), Sentry aquí es pasivo:
// sin VITE_SENTRY_DSN en el entorno, initFrontendErrorTracking() y captureFrontendError() son no-ops.
// Se activa únicamente al definir VITE_SENTRY_DSN en el entorno del cliente.
import * as Sentry from '@sentry/react';

// Inyectada por Vite desde package.json (ver vite.config.ts); en tests sin Vite no existe.
const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'desconocida';

let habilitado = false;

export function initFrontendErrorTracking(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'production',
    release: `bandmanager@${APP_VERSION}`,
    tracesSampleRate: 0.1,
    integrations: [Sentry.replayIntegration()],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    ignoreErrors: [
      // Ruido de desarrollo e HMR de Vite
      'WebSocket closed without opened',
      'Failed to resolve module specifier',
      // Ruido de extensiones de navegador / traductores / AdBlockers
      'ERR_BLOCKED_BY_CLIENT',
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'updateFrom',
    ],
    beforeSend(event) {
      // Descarta errores causados por extensiones del navegador del usuario (chrome-extension:// o moz-extension://)
      const stack = event.exception?.values?.[0]?.stacktrace?.frames;
      if (stack && stack.some((frame) => frame.filename?.includes('extension://'))) {
        return null;
      }
      return event;
    },
  });

  habilitado = true;
  console.log('[ErrorTracking] Sentry Frontend activado con filtros anti-ruido.');
}

export function captureFrontendError(err: unknown, context?: Record<string, unknown>): void {
  if (!habilitado) return;
  Sentry.captureException(err, context ? { extra: context } : undefined);
}
