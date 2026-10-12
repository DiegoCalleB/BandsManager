/**
 * Respuestas y errores de `/api/ai-stem-separation` que leen `separacionIris.ts` y `useSeparacionIris`.
 * Aparte porque `separacionIris.ts` ya supera las 400 líneas.
 */
import type { ProgresoIris, ProveedorErrorIris, StemDelServidor } from './separacionIris';

/** Respuesta del arranque (202, `status: 'processing'`), del sondeo de estado o del resultado directo. */
export interface RespuestaSeparacion {
  status?: string;
  songHash?: string;
  engine?: string;
  stems?: StemDelServidor[];
  degraded?: boolean;
  degradedReason?: string;
  isNeural?: boolean;
  separationEngine?: string;
  engineUsed?: string;
  executionTimeSec?: string;
  timingBreakdown?: ProgresoIris['timingBreakdown'];
}

/** Cuerpo JSON de un error de la separación (lo que `apiFetch` deja en `ApiRequestError.data`). */
export interface DatosErrorSeparacion {
  message?: string;
  error?: string;
  provider?: ProveedorErrorIris;
  engine?: string;
  errorType?: string;
  errorTitle?: string;
  actionAdvice?: string;
  errorDetail?: string;
  details?: unknown;
}

/** Lo que se lee del valor capturado: un `Error`, un `ApiRequestError` (con `status` y `data`) o similar. */
export interface ErrorSeparacionCapturado {
  message?: string;
  status?: number;
  data?: DatosErrorSeparacion;
}
