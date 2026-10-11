/**
 * Tipos de error de los servicios de IA musical y diagnóstico de los errores de Replicate y Fal.ai (con reintentos de Replicate).
 */

export type MusicServiceErrorProvider =
  | 'fal'
  | 'replicate'
  | 'gemini'
  | 'ffmpeg'
  | 'supabase'
  | 'network'
  | 'system';

export type StemErrorType =
  // Fal.ai (GPU A100 Demucs)
  | 'fal_billing_locked'
  | 'fal_auth_invalid'
  | 'fal_rate_limit'
  | 'fal_server_error'
  | 'fal_generic'
  // Replicate (Demucs Neural Cloud GPU)
  | 'token_missing'
  | 'auth_invalid'
  | 'billing_required'
  | 'audio_unsupported'
  | 'rate_limit'
  | 'timeout'
  | 'gpu_failure'
  | 'server_error'
  // Google Gemini API (GenAI / Lyria / Flash)
  | 'gemini_key_missing'
  | 'gemini_auth_invalid'
  | 'gemini_quota_exceeded'
  | 'gemini_model_unavailable'
  | 'gemini_safety_block'
  | 'gemini_generic'
  // FFmpeg DSP (Local Server Library)
  | 'ffmpeg_missing'
  | 'ffmpeg_codec_unsupported'
  | 'ffmpeg_processing_error'
  // Supabase Storage
  | 'supabase_credentials_missing'
  | 'supabase_storage_error'
  // Network / SSRF
  | 'audio_fetch_failed'
  | 'ssrf_blocked'
  | 'generic';

export interface ServiceDiagnosticError {
  provider: MusicServiceErrorProvider;
  errorType: StemErrorType;
  errorTitle: string;
  message: string;
  actionAdvice: string;
  errorDetail: string;
  httpStatus: number;
}

// Retrocompatibilidad con ReplicateDiagnosticError
export type ReplicateDiagnosticError = ServiceDiagnosticError;

/**
 * Parsea y clasifica con precisión diagnóstica cualquier respuesta de error recibida de la API de Replicate.
 */
export function parseReplicateError(
  status: number,
  errBody: string
): ServiceDiagnosticError {
  let parsedDetail: string;
  try {
    const json = JSON.parse(errBody);
    parsedDetail =
      json.detail || json.title || json.error || json.message || '';
    if (typeof parsedDetail === 'object')
      parsedDetail = JSON.stringify(parsedDetail);
  } catch {
    parsedDetail = errBody.trim().substring(0, 400);
  }

  if (status === 401) {
    return {
      provider: 'replicate',
      errorType: 'auth_invalid',
      errorTitle: 'Error de Autenticación en Replicate (HTTP 401)',
      message: `El token de Replicate suministrado es inválido, ha caducado o carece de permisos. Detalle: ${parsedDetail || 'Unauthorized'}`,
      actionAdvice:
        "Verifica tu API Token en https://replicate.com/account/api-tokens. Asegúrate de que comience por 'r8_' y no contenga espacios ni comillas.",
      errorDetail: parsedDetail || errBody,
      httpStatus: 401,
    };
  }
  if (status === 402) {
    return {
      provider: 'replicate',
      errorType: 'billing_required',
      errorTitle: 'Saldo o Facturación Requerida en Replicate (HTTP 402)',
      message: `Tu cuenta de Replicate no dispone de saldo suficiente o requiere vincular una tarjeta de crédito para arrancar el contenedor Demucs v4. Detalle: ${parsedDetail || 'Payment Required'}`,
      actionAdvice:
        'Accede a tu panel de facturación en https://replicate.com/account/billing para añadir créditos a tu cuenta de Replicate. O bien utiliza la separación con Motor DSP local que es 100% gratuita.',
      errorDetail: parsedDetail || errBody,
      httpStatus: 402,
    };
  }
  if (status === 422) {
    return {
      provider: 'replicate',
      errorType: 'audio_unsupported',
      errorTitle:
        'Parámetro o Archivo de Audio no Válido en Replicate (HTTP 422)',
      message: `El modelo Demucs v4 rechazó los datos de audio suministrados. Detalle: ${parsedDetail || errBody.substring(0, 200)}`,
      actionAdvice:
        'Comprueba que la pista contenga audio real reproducible en formato MP3, WAV o FLAC con al menos 3 segundos de duración. Si el archivo es muy grande, recórtalo o usa el Motor DSP.',
      errorDetail: parsedDetail || errBody,
      httpStatus: 422,
    };
  }
  if (status === 429) {
    return {
      provider: 'replicate',
      errorType: 'rate_limit',
      errorTitle: 'Límite de Peticiones en Replicate Alcanzado (HTTP 429)',
      message: `Has sobrepasado temporalmente el límite de llamadas concurrentes o peticiones por minuto permitidas por Replicate. Detalle: ${parsedDetail || 'Rate limit exceeded'}`,
      actionAdvice:
        'Espera entre 30 y 60 segundos antes de enviar una nueva solicitud a Replicate o utiliza el Motor DSP local.',
      errorDetail: parsedDetail || errBody,
      httpStatus: 429,
    };
  }
  if (status >= 500) {
    return {
      provider: 'replicate',
      errorType: 'server_error',
      errorTitle: `Fallo Temporal en la Infraestructura de Replicate (HTTP ${status})`,
      message: `Los servidores de Replicate están respondiendo con un error interno de infraestructura temporal. Detalle: ${parsedDetail || 'Internal Server Error'}`,
      actionAdvice:
        'Puedes comprobar el estado global del servicio en https://replicatestatus.com o separar las pistas con el Motor DSP local que corre en tu propio servidor sin depender de la nube.',
      errorDetail: parsedDetail || errBody,
      httpStatus: status,
    };
  }

  return {
    provider: 'replicate',
    errorType: 'generic',
    errorTitle: `Respuesta Inesperada de Replicate (HTTP ${status})`,
    message: `Replicate devolvió una respuesta no habitual (${status}): ${parsedDetail || errBody.substring(0, 250)}`,
    actionAdvice:
      'Revisa los detalles técnicos a continuación o prueba la separación con el Motor DSP local.',
    errorDetail: parsedDetail || errBody,
    httpStatus: status,
  };
}

/**
 * Parsea y clasifica con precisión diagnóstica cualquier respuesta de error recibida de la API de Fal.ai.
 */
export function parseFalError(
  status: number,
  errBody: any
): ServiceDiagnosticError {
  let parsedDetail: string;
  let isLocked = false;
  let isRateLimit = status === 429;
  const rawStr =
    typeof errBody === 'string'
      ? errBody
      : errBody?.message || JSON.stringify(errBody || {});

  try {
    const json = typeof errBody === 'object' ? errBody : JSON.parse(errBody);
    parsedDetail =
      json.detail || json.title || json.error || json.message || '';
    if (typeof parsedDetail === 'object')
      parsedDetail = JSON.stringify(parsedDetail);
    if (
      parsedDetail.includes('TOP_UP') ||
      parsedDetail.includes('locked') ||
      parsedDetail.includes('balance') ||
      parsedDetail.includes('credit')
    ) {
      isLocked = true;
    }
    if (
      parsedDetail.includes('rate') ||
      parsedDetail.includes('limit') ||
      parsedDetail.includes('429')
    ) {
      isRateLimit = true;
    }
  } catch {
    parsedDetail = rawStr.trim().substring(0, 400);
    if (
      rawStr.includes('TOP_UP') ||
      rawStr.includes('locked') ||
      rawStr.includes('balance') ||
      rawStr.includes('credit')
    ) {
      isLocked = true;
    }
    if (
      rawStr.includes('rate limit') ||
      rawStr.includes('Rate Limit') ||
      rawStr.includes('429')
    ) {
      isRateLimit = true;
    }
  }

  if (
    status === 403 ||
    isLocked ||
    rawStr.includes('TOP_UP') ||
    rawStr.includes('User is locked')
  ) {
    return {
      provider: 'fal',
      errorType: 'fal_billing_locked',
      errorTitle: 'Fal.ai API Key Bloqueada (HTTP 403 - Reason: TOP_UP)',
      message:
        'Fal.ai ha rechazado la llamada con "User is locked. Reason: TOP_UP". Tu saldo de $10.00 sigue intacto ($0.00 cobrado) porque Fal.ai detuvo la petición antes de arrancar la GPU. Esto sucede habitualmente cuando la API Key se creó antes de recargar créditos o el gateway de Fal.ai aún no ha refrescado el estado del balance.',
      actionAdvice:
        '1) Ve a fal.ai/dashboard/keys y genera una NUEVA API Key para sincronizar tu saldo de $10, o 2) Ejecuta una prueba en fal.ai/models/fal-ai/demucs para desbloquear el gateway, o 3) Usa Iris Cloud o Iris Básico gratis.',
      errorDetail: parsedDetail || rawStr,
      httpStatus: 403,
    };
  }

  if (status === 401) {
    return {
      provider: 'fal',
      errorType: 'fal_auth_invalid',
      errorTitle: 'Error de Autenticación en Fal.ai (HTTP 401)',
      message: `La clave FAL_KEY suministrada es inválida, ha caducado o carece de permisos. Detalle: ${parsedDetail || 'Unauthorized'}`,
      actionAdvice:
        'Verifica tu FAL_KEY en https://fal.ai/dashboard/keys o actualízala en las variables de entorno del servidor.',
      errorDetail: parsedDetail || rawStr,
      httpStatus: 401,
    };
  }

  if (status === 429 || isRateLimit) {
    return {
      provider: 'fal',
      errorType: 'fal_rate_limit',
      errorTitle: 'Límite de Peticiones en Fal.ai Alcanzado (HTTP 429)',
      message: `Has superado temporalmente el límite de llamadas concurrentes en Fal.ai. Detalle: ${parsedDetail || 'Rate limit exceeded'}`,
      actionAdvice:
        'Espera unos segundos antes de reintentar o utiliza la separación local con Iris Básico.',
      errorDetail: parsedDetail || rawStr,
      httpStatus: 429,
    };
  }

  if (status >= 500) {
    return {
      provider: 'fal',
      errorType: 'fal_server_error',
      errorTitle: `Fallo Temporal en la Infraestructura de Fal.ai (HTTP ${status})`,
      message: `Los servidores GPU de Fal.ai están experimentando un error interno temporal. Detalle: ${parsedDetail || 'Internal Server Error'}`,
      actionAdvice:
        'Puedes reintentar en unos instantes o separar las pistas con Iris Básico en tu propio servidor.',
      errorDetail: parsedDetail || rawStr,
      httpStatus: status,
    };
  }

  return {
    provider: 'fal',
    errorType: 'fal_generic',
    errorTitle: `Respuesta Inesperada de Fal.ai (HTTP ${status})`,
    message: `Fal.ai devolvió una respuesta no habitual (${status}): ${parsedDetail || rawStr.substring(0, 250)}`,
    actionAdvice:
      'Revisa los detalles técnicos a continuación o utiliza Iris Básico local.',
    errorDetail: parsedDetail || rawStr,
    httpStatus: status,
  };
}

/**
 * Helper resiliente para llamadas a la API de Replicate con reintento automático ante
 * errores transitorios de upstream/gateway (500, 502, 503, 504) o rate limiting (429).
 */
export async function fetchReplicateWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;

      // Si es un error transitorio de servidor (5xx) o rate limit (429), reintentar con backoff exponencial
      if ((res.status >= 500 || res.status === 429) && attempt <= maxRetries) {
        let waitSec = attempt * 2;
        if (res.status === 429) {
          const retryAfter = Number(res.headers.get('retry-after'));
          if (retryAfter && !isNaN(retryAfter)) {
            waitSec = Math.max(retryAfter, waitSec);
          }
        }
        console.warn(
          `[Replicate API] Error transitorio ${res.status} en intento ${attempt}/${maxRetries}. Reintentando en ${waitSec}s...`
        );
        await new Promise((r) => setTimeout(r, waitSec * 1000));
        continue;
      }
      return res;
    } catch (netErr: any) {
      if (attempt <= maxRetries) {
        const waitSec = attempt * 2;
        console.warn(
          `[Replicate API] Error de red en intento ${attempt}/${maxRetries} (${netErr?.message}). Reintentando en ${waitSec}s...`
        );
        await new Promise((r) => setTimeout(r, waitSec * 1000));
        continue;
      }
      throw netErr;
    }
  }
}
