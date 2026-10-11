/**
 * Diagnóstico de los errores de Gemini, FFmpeg y Supabase Storage para la separación de stems.
 */
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import { ServiceDiagnosticError } from './diagnosticos.js';

/**
 * Parsea y clasifica con precisión diagnóstica cualquier error originado en la API de Google Gemini (GenAI).
 */
export function parseGeminiError(err: any): ServiceDiagnosticError {
  const errMsg = String(err?.message || err || '');
  const errStatus =
    err?.status ||
    (errMsg.includes('403')
      ? 403
      : errMsg.includes('429')
        ? 429
        : errMsg.includes('400')
          ? 400
          : 500);

  if (!process.env.GEMINI_API_KEY) {
    return {
      provider: 'gemini',
      errorType: 'gemini_key_missing',
      errorTitle: 'Clave GEMINI_API_KEY No Configurada (Google GenAI)',
      message:
        'No se encontró la variable GEMINI_API_KEY en el entorno del servidor.',
      actionAdvice:
        'Configura la variable GEMINI_API_KEY en Settings para habilitar el análisis musical, composición y generación con Lyria / Gemini.',
      errorDetail: 'Missing process.env.GEMINI_API_KEY',
      httpStatus: 400,
    };
  }

  if (
    errMsg.includes('API_KEY_INVALID') ||
    errMsg.includes('API key not valid') ||
    (errStatus === 400 && errMsg.includes('key'))
  ) {
    return {
      provider: 'gemini',
      errorType: 'gemini_auth_invalid',
      errorTitle: 'Clave GEMINI_API_KEY Inválida o Caducada (Google GenAI)',
      message:
        'La clave GEMINI_API_KEY no es válida o ha sido revocada en Google AI Studio.',
      actionAdvice:
        'Comprueba tu clave en https://aistudio.google.com/app/apikey y actualízala en Settings.',
      errorDetail: errMsg,
      httpStatus: 401,
    };
  }

  if (errMsg.includes('PERMISSION_DENIED') || errStatus === 403) {
    return {
      provider: 'gemini',
      errorType: 'gemini_auth_invalid',
      errorTitle: 'Permiso Denegado en Gemini API (HTTP 403)',
      message:
        'Tu proyecto de Google Cloud / AI Studio no tiene habilitada la API o los permisos necesarios.',
      actionAdvice:
        'Verifica los permisos y la habilitación de la Generative Language API en Google AI Studio / Google Cloud Console.',
      errorDetail: errMsg,
      httpStatus: 403,
    };
  }

  if (
    errMsg.includes('RESOURCE_EXHAUSTED') ||
    errMsg.includes('quota') ||
    errStatus === 429
  ) {
    return {
      provider: 'gemini',
      errorType: 'gemini_quota_exceeded',
      errorTitle: 'Cuota de Gemini API Excedida (HTTP 429 Resource Exhausted)',
      message:
        'Se ha superado el límite de peticiones por minuto (RPM/TPM) o la cuota diaria asignada a tu clave Gemini API.',
      actionAdvice:
        'Espera unos 60 segundos antes de reintentar o actualiza tu nivel en Google AI Studio (Pay-as-you-go / Tier 2).',
      errorDetail: errMsg,
      httpStatus: 429,
    };
  }

  if (
    errMsg.includes('NOT_FOUND') ||
    errMsg.includes('model') ||
    errMsg.includes('lyria')
  ) {
    return {
      provider: 'gemini',
      errorType: 'gemini_model_unavailable',
      errorTitle: 'Modelo de Gemini no Disponible en tu Región / Nivel',
      message: `El modelo solicitado (${errMsg.includes('lyria') ? 'Lyria Audio' : 'Gemini'}) no está accesible con tu clave o en tu región geográfica.`,
      actionAdvice:
        'El sistema utilizará automáticamente análisis compositivo local o el motor fallback de Gemini Flash.',
      errorDetail: errMsg,
      httpStatus: 404,
    };
  }

  if (
    errMsg.includes('SAFETY') ||
    errMsg.includes('blocked') ||
    errMsg.includes('HARM')
  ) {
    return {
      provider: 'gemini',
      errorType: 'gemini_safety_block',
      errorTitle: 'Bloqueo por Políticas de Seguridad de Gemini AI',
      message:
        'El contenido de la letra o el prompt fue bloqueado por los filtros de seguridad de Google AI.',
      actionAdvice:
        'Modifica el texto o título de la canción para evitar términos protegidos o palabras sensibles.',
      errorDetail: errMsg,
      httpStatus: 422,
    };
  }

  return {
    provider: 'gemini',
    errorType: 'gemini_generic',
    errorTitle: 'Error en la API de Google Gemini',
    message: `Gemini API devolvió una incidencia: ${errMsg.substring(0, 200)}`,
    actionAdvice:
      'Verifica la conectividad con los servicios de Google AI o reintenta en unos instantes.',
    errorDetail: errMsg,
    httpStatus: errStatus,
  };
}

/**
 * Parsea y clasifica con precisión diagnóstica cualquier error originado en FFmpeg (Motor DSP Local).
 */
export function parseFfmpegError(err: any): ServiceDiagnosticError {
  const msg = String(err?.message || err || '');
  if (!ffmpegPath && !fs.existsSync('/usr/bin/ffmpeg')) {
    return {
      provider: 'ffmpeg',
      errorType: 'ffmpeg_missing',
      errorTitle: 'Binario FFmpeg No Encontrado en Servidor',
      message:
        'La librería fluent-ffmpeg no pudo localizar el binario ejecutable de ffmpeg en el servidor.',
      actionAdvice:
        'El paquete ffmpeg-static debe estar instalado en el entorno de Railway/Node.',
      errorDetail: msg || 'ffmpegPath missing',
      httpStatus: 500,
    };
  }
  if (
    msg.includes('Invalid data found') ||
    msg.includes('codec') ||
    msg.includes('format') ||
    msg.includes('header')
  ) {
    return {
      provider: 'ffmpeg',
      errorType: 'ffmpeg_codec_unsupported',
      errorTitle: 'Formato o Códec de Audio no Compatible en FFmpeg',
      message:
        'El archivo de audio tiene un formato, compresión o encabezado corrupto que la librería FFmpeg no puede decodificar.',
      actionAdvice:
        'Exporta tu canción a WAV PCM de 16-bit / 44.1kHz o MP3 estándar antes de subirla.',
      errorDetail: msg,
      httpStatus: 422,
    };
  }
  return {
    provider: 'ffmpeg',
    errorType: 'ffmpeg_processing_error',
    errorTitle: 'Error en Filtro DSP Local con FFmpeg',
    message: `Fallo durante el filtrado espectral por software en el servidor: ${msg.substring(0, 200)}`,
    actionAdvice:
      'Comprueba que el archivo de audio tenga duración suficiente y que la memoria RAM del servidor sea adecuada.',
    errorDetail: msg,
    httpStatus: 500,
  };
}

/**
 * Parsea y clasifica con precisión diagnóstica errores originados en Supabase Storage.
 */
export function parseSupabaseStorageError(err: any): ServiceDiagnosticError {
  const msg = String(err?.message || err || '');
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      provider: 'supabase',
      errorType: 'supabase_credentials_missing',
      errorTitle: 'Credenciales de Supabase No Configuradas',
      message:
        'Faltan las variables SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el servidor.',
      actionAdvice:
        'Configura las variables de Supabase en tu panel de Railway para permitir persistir stems y audios.',
      errorDetail: msg || 'Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY',
      httpStatus: 500,
    };
  }
  return {
    provider: 'supabase',
    errorType: 'supabase_storage_error',
    errorTitle: 'Error de Almacenamiento en Supabase Storage',
    message: `No se pudo guardar la pista o archivo en el bucket de Supabase: ${msg.substring(0, 200)}`,
    actionAdvice:
      'Verifica los permisos del bucket o el tamaño máximo de archivo en tu proyecto de Supabase.',
    errorDetail: msg,
    httpStatus: 502,
  };
}
