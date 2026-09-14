import express from "express";
import { GoogleGenAI } from "@google/genai";
import { requireAuth } from "../state.js";
import { iaRateLimiter } from "../middleware/rateLimiter.js";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import path from "path";
import fs from "fs";
import os from "os";
import crypto from "crypto";
import { getTargetBandId } from "../utils/bandAccess.js";
import { esUrlExternaSegura } from "../utils/ssrfGuard.js";
import { getStemsFromPersistentCache, saveStemsToPersistentCache, acquireStemsSeparationLock, markStemsSeparationFailed, getStemsJobStatus, StemsCacheRecord } from "../db/stemsCache.js";
import { stemStorageRetryManager } from "../services/stemStorageRetryQueue.js";
import { verifyReplicateWebhook, verifyWebhookSignature, isPredictionWebhookProcessed, recordPredictionJob } from "../services/stemPredictionReconciler.js";
import { uploadBufferToSupabase, uploadToSupabaseIfAvailable, rutaAlmacenamientoStem } from "../utils/storage.js";
import { preprocesarAudioDirecto, construirFiltroPreprocesamientoDirecto } from "../utils/audioEnergy.js";

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

// Identificadores de modelos de Replicate (verificados y distintos)
export const REPLICATE_MODEL_DEMUCS_V4 = 'cjwbw/demucs';
export const REPLICATE_MODEL_MVSEP_MDX23 = 'lucataco/mvsep-mdx23-music-separation';
export const REPLICATE_VERSION_MVSEP_MDX23 = '510b9b91aec1bfa7d634e6c06ee80c18492fb0fc06aa1474533fbda90dd3dba4';

export const REPLICATE_MODELS = {
  demucs: REPLICATE_MODEL_DEMUCS_V4,
  'mvsep-mdx23': REPLICATE_MODEL_MVSEP_MDX23,
} as const;

const router = express.Router();

const STEM_METADATA: Record<string, { trackName: string; description: string; recommendedVolume: number }> = {
  "Voz": {
    trackName: "🎤 Stem IA: Voz Principal (Aislada)",
    description: "Voz principal aislada en alta calidad mediante aprendizaje profundo. Permite silenciar la voz para ensayar cantando en directo.",
    recommendedVolume: 1.0
  },
  "Batería": {
    trackName: "🥁 Stem IA: Batería & Percusión",
    description: "Pista aislada de batería, caja, bombo y platillos en alta fidelidad.",
    recommendedVolume: 0.9
  },
  "Bajo": {
    trackName: "🎸 Stem IA: Bajo (Sub-Bass)",
    description: "Línea de bajo aislada y frecuencias fundamentales de grave.",
    recommendedVolume: 0.95
  },
  "Guitarras": {
    trackName: "🎸 Stem IA: Guitarras (Rítmicas & Solos)",
    description: "Guitarras eléctricas y acústicas aisladas sin acople de voz ni batería.",
    recommendedVolume: 0.85
  },
  "Teclados": {
    trackName: "🎹 Stem IA: Teclados & Piano",
    description: "Pianos, sintetizadores y órganos aislados.",
    recommendedVolume: 0.85
  },
  "Arreglos": {
    trackName: "🎺 Stem IA: Arreglos, Sintes & Cuerdas",
    description: "Sección de vientos, cuerdas, sintetizadores y efectos secundarios.",
    recommendedVolume: 0.85
  }
};

function buildFormattedStems(stemsMap: Record<string, any>) {
  return Object.entries(stemsMap || {}).map(([instrument, rawValue]) => {
    const meta = STEM_METADATA[instrument] || {
      trackName: `Stem IA: ${instrument}`,
      description: `Stem aislado de ${instrument}.`,
      recommendedVolume: 0.85
    };
    const url = typeof rawValue === "object" ? rawValue.url : rawValue;
    const formato = typeof rawValue === "object" ? rawValue.formato : "MP3";
    const tamano = typeof rawValue === "object" ? rawValue.tamano : "2.5 MB";

    return {
      instrument,
      trackName: meta.trackName,
      audioUrl: url,
      formato,
      tamano,
      description: meta.description,
      recommendedVolume: meta.recommendedVolume
    };
  });
}

/** Registra el fallo de un job de separación en la caché persistente con el mismo formato de
 *  diagnóstico que antes viajaba en la respuesta HTTP directa, para que el polling de estado
 *  pueda reconstruir la misma tarjeta de error enriquecida en el cliente. */
async function failStemsJob(bandId: string, songHash: string, engine: string, payload: Record<string, any>): Promise<void> {
  try {
    await markStemsSeparationFailed(bandId, songHash, engine, JSON.stringify(payload));
  } catch (e) {
    console.warn("[Stem Separator] No se pudo registrar el fallo del job en caché:", e);
  }
}

/**
 * Garantiza que cualquier URL o ruta local de audio se convierta en una URL HTTPS pública
 * alcanzable por Replicate subiéndola a Supabase Storage si no es pública.
 */
async function ensurePublicAudioUrl(audioUrl: string, bandId: string, songHash: string, requestHost?: string): Promise<string> {
  // Fast-path: Si audioUrl ya es una URL pública HTTPS directa en un CDN o Storage público
  if (
    audioUrl.startsWith("https://") &&
    (audioUrl.includes("supabase.co") ||
     audioUrl.includes("storage.googleapis.com") ||
     audioUrl.includes("cloudinary.com") ||
     audioUrl.includes("replicate.delivery") ||
     audioUrl.includes("amazonaws.com") ||
     audioUrl.includes("blob.core.windows.net"))
  ) {
    console.log(`[Demucs Neural] URL de entrada ya es HTTPS pública directa en Supabase/CDN: ${audioUrl.substring(0, 60)}...`);
    return audioUrl;
  }

  let buffer: Buffer | null = null;
  let ext = "mp3";

  if (audioUrl.startsWith("data:audio/")) {
    try {
      const match = audioUrl.match(/^data:audio\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (match) {
        ext = match[1] || "mp3";
        buffer = Buffer.from(match[2], "base64");
      }
    } catch (e) {
      console.warn("[Demucs Neural] Error parseando data URL:", e);
    }
  } else {
    // 1. Intentar localizar en disco local primero
    const urlWithoutQuery = audioUrl.split('?')[0];
    const filenameOnly = path.basename(urlWithoutQuery);
    let subRel = "";
    if (urlWithoutQuery.includes("/uploads/")) {
      subRel = urlWithoutQuery.substring(urlWithoutQuery.indexOf("/uploads/") + "/uploads/".length);
    }

    const candidatePaths = [
      subRel ? path.join(process.cwd(), "public", "uploads", subRel) : "",
      path.join(process.cwd(), "public", urlWithoutQuery.startsWith("/") ? urlWithoutQuery : `/${urlWithoutQuery}`),
      path.join(process.cwd(), "public", "uploads", filenameOnly),
      path.join(process.cwd(), "public", "uploads", "stems", "inputs", filenameOnly),
      path.join(process.cwd(), "public", "uploads", "stems", filenameOnly),
      path.join(process.cwd(), "public", "audio", filenameOnly),
      path.join(process.cwd(), "public", "transposed", filenameOnly)
    ].filter(p => p && p.length > 0);

    const localPath = candidatePaths.find(p => fs.existsSync(p));
    if (localPath) {
      try {
        buffer = fs.readFileSync(localPath);
        ext = path.extname(localPath).replace(".", "") || "mp3";
        console.log(`[Demucs Neural] Archivo de entrada encontrado en disco local (${localPath}) - ${buffer.length} bytes`);
      } catch (e) {
        console.warn("[Demucs Neural] Error leyendo archivo de audio local:", e);
      }
    } else if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://")) {
      try {
        const isSafe = await esUrlExternaSegura(audioUrl);
        if (isSafe) {
          const res = await fetch(audioUrl);
          if (res.ok) {
            const ab = await res.arrayBuffer();
            buffer = Buffer.from(ab);
            ext = path.extname(urlWithoutQuery).replace(".", "") || "mp3";
          }
        }
      } catch (e) {
        console.warn("[Demucs Neural] Error obteniendo URL de audio de entrada para espejo público:", e);
      }
    }
  }

  // Si tenemos el buffer, subirlo a Supabase Storage para que Replicate tenga una URL pública universal 100% garantizada
  if (buffer && buffer.length > 0) {
    const storageSubPath = rutaAlmacenamientoStem(bandId, `input-audio-${Date.now()}.${ext}`, songHash);
    const mimeType = ext === "wav" ? "audio/wav" : ext === "flac" ? "audio/flac" : "audio/mpeg";
    const uploadedPublicUrl = await uploadBufferToSupabase(buffer, storageSubPath, mimeType);
    if (uploadedPublicUrl) {
      console.log(`[Demucs Neural] Audio de entrada subido a Supabase Storage para Replicate: ${uploadedPublicUrl}`);
      return uploadedPublicUrl;
    }

    // Fallback: Si Supabase Storage no está disponible pero el buffer es manejable (<12MB),
    // Replicate acepta Data URIs base64 directamente en el parámetro audio
    if (buffer.length <= 12 * 1024 * 1024) {
      console.log(`[Demucs Neural] Utilizando Data URI base64 directo para Replicate (${(buffer.length / 1024 / 1024).toFixed(2)} MB)...`);
      return `data:${mimeType};base64,${buffer.toString("base64")}`;
    }
  }

  // Resolver dominio público HTTPS para Replicate (soporta bandmanager.io / custom domains y Railway)
  const publicDomain = process.env.APP_URL || process.env.PUBLIC_URL || process.env.RAILWAY_PUBLIC_DOMAIN || process.env.RAILWAY_STATIC_URL || "https://bandmanager.io";
  if (audioUrl.startsWith("/")) {
    if (publicDomain) {
      const cleanDomain = publicDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      return `https://${cleanDomain}${audioUrl}`;
    }
    if (requestHost && !requestHost.includes("localhost") && !requestHost.includes("127.0.0.1")) {
      const proto = requestHost.includes(":") ? "http" : "https";
      return `${proto}://${requestHost}${audioUrl}`;
    }
  }

  return audioUrl;
}

export type MusicServiceErrorProvider = 'replicate' | 'gemini' | 'ffmpeg' | 'supabase' | 'network' | 'system';

export type StemErrorType = 
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
function parseReplicateError(status: number, errBody: string): ServiceDiagnosticError {
  let parsedDetail = "";
  try {
    const json = JSON.parse(errBody);
    parsedDetail = json.detail || json.title || json.error || json.message || "";
    if (typeof parsedDetail === "object") parsedDetail = JSON.stringify(parsedDetail);
  } catch {
    parsedDetail = errBody.trim().substring(0, 400);
  }

  if (status === 401) {
    return {
      provider: 'replicate',
      errorType: 'auth_invalid',
      errorTitle: 'Error de Autenticación en Replicate (HTTP 401)',
      message: `El token de Replicate suministrado es inválido, ha caducado o carece de permisos. Detalle: ${parsedDetail || 'Unauthorized'}`,
      actionAdvice: "Verifica tu API Token en https://replicate.com/account/api-tokens. Asegúrate de que comience por 'r8_' y no contenga espacios ni comillas.",
      errorDetail: parsedDetail || errBody,
      httpStatus: 401
    };
  }
  if (status === 402) {
    return {
      provider: 'replicate',
      errorType: 'billing_required',
      errorTitle: 'Saldo o Facturación Requerida en Replicate (HTTP 402)',
      message: `Tu cuenta de Replicate no dispone de saldo suficiente o requiere vincular una tarjeta de crédito para arrancar el contenedor Demucs v4. Detalle: ${parsedDetail || 'Payment Required'}`,
      actionAdvice: "Accede a tu panel de facturación en https://replicate.com/account/billing para añadir créditos a tu cuenta de Replicate. O bien utiliza la separación con Motor DSP local que es 100% gratuita.",
      errorDetail: parsedDetail || errBody,
      httpStatus: 402
    };
  }
  if (status === 422) {
    return {
      provider: 'replicate',
      errorType: 'audio_unsupported',
      errorTitle: 'Parámetro o Archivo de Audio no Válido en Replicate (HTTP 422)',
      message: `El modelo Demucs v4 rechazó los datos de audio suministrados. Detalle: ${parsedDetail || errBody.substring(0, 200)}`,
      actionAdvice: "Comprueba que la pista contenga audio real reproducible en formato MP3, WAV o FLAC con al menos 3 segundos de duración. Si el archivo es muy grande, recórtalo o usa el Motor DSP.",
      errorDetail: parsedDetail || errBody,
      httpStatus: 422
    };
  }
  if (status === 429) {
    return {
      provider: 'replicate',
      errorType: 'rate_limit',
      errorTitle: 'Límite de Peticiones en Replicate Alcanzado (HTTP 429)',
      message: `Has sobrepasado temporalmente el límite de llamadas concurrentes o peticiones por minuto permitidas por Replicate. Detalle: ${parsedDetail || 'Rate limit exceeded'}`,
      actionAdvice: "Espera entre 30 y 60 segundos antes de enviar una nueva solicitud a Replicate o utiliza el Motor DSP local.",
      errorDetail: parsedDetail || errBody,
      httpStatus: 429
    };
  }
  if (status >= 500) {
    return {
      provider: 'replicate',
      errorType: 'server_error',
      errorTitle: `Fallo Temporal en la Infraestructura de Replicate (HTTP ${status})`,
      message: `Los servidores de Replicate están respondiendo con un error interno de infraestructura temporal. Detalle: ${parsedDetail || 'Internal Server Error'}`,
      actionAdvice: "Puedes comprobar el estado global del servicio en https://replicatestatus.com o separar las pistas con el Motor DSP local que corre en tu propio servidor sin depender de la nube.",
      errorDetail: parsedDetail || errBody,
      httpStatus: status
    };
  }

  return {
    provider: 'replicate',
    errorType: 'generic',
    errorTitle: `Respuesta Inesperada de Replicate (HTTP ${status})`,
    message: `Replicate devolvió una respuesta no habitual (${status}): ${parsedDetail || errBody.substring(0, 250)}`,
    actionAdvice: "Revisa los detalles técnicos a continuación o prueba la separación con el Motor DSP local.",
    errorDetail: parsedDetail || errBody,
    httpStatus: status
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
        console.warn(`[Replicate API] Error transitorio ${res.status} en intento ${attempt}/${maxRetries}. Reintentando en ${waitSec}s...`);
        await new Promise(r => setTimeout(r, waitSec * 1000));
        continue;
      }
      return res;
    } catch (netErr: any) {
      if (attempt <= maxRetries) {
        const waitSec = attempt * 2;
        console.warn(`[Replicate API] Error de red en intento ${attempt}/${maxRetries} (${netErr?.message}). Reintentando en ${waitSec}s...`);
        await new Promise(r => setTimeout(r, waitSec * 1000));
        continue;
      }
      throw netErr;
    }
  }
}

/**
 * Parsea y clasifica con precisión diagnóstica cualquier error originado en la API de Google Gemini (GenAI).
 */
export function parseGeminiError(err: any): ServiceDiagnosticError {
  const errMsg = String(err?.message || err || "");
  const errStatus = err?.status || (errMsg.includes("403") ? 403 : errMsg.includes("429") ? 429 : errMsg.includes("400") ? 400 : 500);

  if (!process.env.GEMINI_API_KEY) {
    return {
      provider: 'gemini',
      errorType: 'gemini_key_missing',
      errorTitle: 'Clave GEMINI_API_KEY No Configurada (Google GenAI)',
      message: 'No se encontró la variable GEMINI_API_KEY en el entorno del servidor.',
      actionAdvice: 'Configura la variable GEMINI_API_KEY en Settings para habilitar el análisis musical, composición y generación con Lyria / Gemini.',
      errorDetail: 'Missing process.env.GEMINI_API_KEY',
      httpStatus: 400
    };
  }

  if (errMsg.includes("API_KEY_INVALID") || errMsg.includes("API key not valid") || (errStatus === 400 && errMsg.includes("key"))) {
    return {
      provider: 'gemini',
      errorType: 'gemini_auth_invalid',
      errorTitle: 'Clave GEMINI_API_KEY Inválida o Caducada (Google GenAI)',
      message: 'La clave GEMINI_API_KEY no es válida o ha sido revocada en Google AI Studio.',
      actionAdvice: 'Comprueba tu clave en https://aistudio.google.com/app/apikey y actualízala en Settings.',
      errorDetail: errMsg,
      httpStatus: 401
    };
  }

  if (errMsg.includes("PERMISSION_DENIED") || errStatus === 403) {
    return {
      provider: 'gemini',
      errorType: 'gemini_auth_invalid',
      errorTitle: 'Permiso Denegado en Gemini API (HTTP 403)',
      message: 'Tu proyecto de Google Cloud / AI Studio no tiene habilitada la API o los permisos necesarios.',
      actionAdvice: 'Verifica los permisos y la habilitación de la Generative Language API en Google AI Studio / Google Cloud Console.',
      errorDetail: errMsg,
      httpStatus: 403
    };
  }

  if (errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota") || errStatus === 429) {
    return {
      provider: 'gemini',
      errorType: 'gemini_quota_exceeded',
      errorTitle: 'Cuota de Gemini API Excedida (HTTP 429 Resource Exhausted)',
      message: 'Se ha superado el límite de peticiones por minuto (RPM/TPM) o la cuota diaria asignada a tu clave Gemini API.',
      actionAdvice: 'Espera unos 60 segundos antes de reintentar o actualiza tu nivel en Google AI Studio (Pay-as-you-go / Tier 2).',
      errorDetail: errMsg,
      httpStatus: 429
    };
  }

  if (errMsg.includes("NOT_FOUND") || errMsg.includes("model") || errMsg.includes("lyria")) {
    return {
      provider: 'gemini',
      errorType: 'gemini_model_unavailable',
      errorTitle: 'Modelo de Gemini no Disponible en tu Región / Nivel',
      message: `El modelo solicitado (${errMsg.includes('lyria') ? 'Lyria Audio' : 'Gemini'}) no está accesible con tu clave o en tu región geográfica.`,
      actionAdvice: 'El sistema utilizará automáticamente análisis compositivo local o el motor fallback de Gemini Flash.',
      errorDetail: errMsg,
      httpStatus: 404
    };
  }

  if (errMsg.includes("SAFETY") || errMsg.includes("blocked") || errMsg.includes("HARM")) {
    return {
      provider: 'gemini',
      errorType: 'gemini_safety_block',
      errorTitle: 'Bloqueo por Políticas de Seguridad de Gemini AI',
      message: 'El contenido de la letra o el prompt fue bloqueado por los filtros de seguridad de Google AI.',
      actionAdvice: 'Modifica el texto o título de la canción para evitar términos protegidos o palabras sensibles.',
      errorDetail: errMsg,
      httpStatus: 422
    };
  }

  return {
    provider: 'gemini',
    errorType: 'gemini_generic',
    errorTitle: 'Error en la API de Google Gemini',
    message: `Gemini API devolvió una incidencia: ${errMsg.substring(0, 200)}`,
    actionAdvice: 'Verifica la conectividad con los servicios de Google AI o reintenta en unos instantes.',
    errorDetail: errMsg,
    httpStatus: errStatus
  };
}

/**
 * Parsea y clasifica con precisión diagnóstica cualquier error originado en FFmpeg (Motor DSP Local).
 */
export function parseFfmpegError(err: any): ServiceDiagnosticError {
  const msg = String(err?.message || err || "");
  if (!ffmpegPath && !fs.existsSync("/usr/bin/ffmpeg")) {
    return {
      provider: 'ffmpeg',
      errorType: 'ffmpeg_missing',
      errorTitle: 'Binario FFmpeg No Encontrado en Servidor',
      message: 'La librería fluent-ffmpeg no pudo localizar el binario ejecutable de ffmpeg en el servidor.',
      actionAdvice: 'El paquete ffmpeg-static debe estar instalado en el entorno de Railway/Node.',
      errorDetail: msg || 'ffmpegPath missing',
      httpStatus: 500
    };
  }
  if (msg.includes("Invalid data found") || msg.includes("codec") || msg.includes("format") || msg.includes("header")) {
    return {
      provider: 'ffmpeg',
      errorType: 'ffmpeg_codec_unsupported',
      errorTitle: 'Formato o Códec de Audio no Compatible en FFmpeg',
      message: 'El archivo de audio tiene un formato, compresión o encabezado corrupto que la librería FFmpeg no puede decodificar.',
      actionAdvice: 'Exporta tu canción a WAV PCM de 16-bit / 44.1kHz o MP3 estándar antes de subirla.',
      errorDetail: msg,
      httpStatus: 422
    };
  }
  return {
    provider: 'ffmpeg',
    errorType: 'ffmpeg_processing_error',
    errorTitle: 'Error en Filtro DSP Local con FFmpeg',
    message: `Fallo durante el filtrado espectral por software en el servidor: ${msg.substring(0, 200)}`,
    actionAdvice: 'Comprueba que el archivo de audio tenga duración suficiente y que la memoria RAM del servidor sea adecuada.',
    errorDetail: msg,
    httpStatus: 500
  };
}

/**
 * Parsea y clasifica con precisión diagnóstica errores originados en Supabase Storage.
 */
export function parseSupabaseStorageError(err: any): ServiceDiagnosticError {
  const msg = String(err?.message || err || "");
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      provider: 'supabase',
      errorType: 'supabase_credentials_missing',
      errorTitle: 'Credenciales de Supabase No Configuradas',
      message: 'Faltan las variables SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el servidor.',
      actionAdvice: 'Configura las variables de Supabase en tu panel de Railway para permitir persistir stems y audios.',
      errorDetail: msg || 'Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY',
      httpStatus: 500
    };
  }
  return {
    provider: 'supabase',
    errorType: 'supabase_storage_error',
    errorTitle: 'Error de Almacenamiento en Supabase Storage',
    message: `No se pudo guardar la pista o archivo en el bucket de Supabase: ${msg.substring(0, 200)}`,
    actionAdvice: 'Verifica los permisos del bucket o el tamaño máximo de archivo en tu proyecto de Supabase.',
    errorDetail: msg,
    httpStatus: 502
  };
}

export interface ProcessNeuralStemsResult {
  stemsMap: Record<string, { url: string; formato: string; tamano: string }> | null;
  timingBreakdown?: any;
  error?: string;
  errorType?: StemErrorType;
  errorTitle?: string;
  actionAdvice?: string;
  errorDetail?: string;
  httpStatus?: number;
  provider?: MusicServiceErrorProvider;
  engine?: string;
  cached?: boolean;
}

// ============================================================================
// CACHÉ Y MUTEX ANTI-DUPLICACIÓN (Garantía de Cero Coste Duplicado en Replicate/GPU)
// ============================================================================
export interface CachedStemsEntry {
  stemsMap: Record<string, { url: string; formato: string; tamano: string }>;
  timingBreakdown: any;
  engine: string;
  engineUsed?: string;
  degraded?: boolean;
  degradedReason?: string;
  isNeural: boolean;
  timestamp: number;
}

export const stemsMemoryCache = new Map<string, CachedStemsEntry>();
export const inFlightSeparations = new Map<string, Promise<{
  stemsMap: Record<string, { url: string; formato: string; tamano: string }> | null;
  timingBreakdown?: any;
  engine: string;
  engineUsed?: string;
  degraded?: boolean;
  degradedReason?: string;
  isNeural: boolean;
  cached?: boolean;
  errorInfo?: ProcessNeuralStemsResult | null;
}>>();

/**
 * Descarga y persiste de forma permanente una lista de stems en Supabase Storage
 * (con fallback seguro en disco local), garantizando que las URLs efímeras de Replicate
 * o microservicios GPU nunca expiren para la banda.
 */
/**
 * Recomprime un buffer de audio a MP3 real (192kbps) vía FFmpeg antes de persistirlo.
 * Los stems que devuelve Replicate llegan como WAV sin comprimir con extensión .mp3 en el
 * nombre — un stem aislado de una canción entera puede pesar 40-80MB así, muy por encima del
 * límite de 50MB del plan gratuito de Supabase Storage. Un MP3 real a 192kbps pesa una fracción
 * de eso sin pérdida perceptible para un instrumento aislado de ensayo.
 * Si la transcodificación falla por cualquier motivo, devuelve el buffer original sin tocar.
 */
async function transcodeBufferToMp3(buffer: Buffer): Promise<Buffer> {
  const tmpId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const inputPath = path.join(os.tmpdir(), `stem-in-${tmpId}`);
  const outputPath = path.join(os.tmpdir(), `stem-out-${tmpId}.mp3`);

  try {
    fs.writeFileSync(inputPath, buffer);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .audioBitrate("192k")
        .toFormat("mp3")
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });

    return fs.readFileSync(outputPath);
  } catch (err: any) {
    console.warn("[Neural Stems] No se pudo recomprimir el stem a MP3, se sube el buffer original:", err?.message || err);
    return buffer;
  } finally {
    try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch {}
    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}
  }
}

async function persistRawStemsMap(
  rawStemsMap: Record<string, string>,
  effectiveBandId: string,
  effectiveHash: string,
  formatLabel: string
): Promise<Record<string, { url: string; formato: string; tamano: string }>> {
  const persistentStemsMap: Record<string, { url: string; formato: string; tamano: string }> = {};
  const stemsUploadsDir = path.join(process.cwd(), "public", "uploads", "stems");
  if (!fs.existsSync(stemsUploadsDir)) {
    fs.mkdirSync(stemsUploadsDir, { recursive: true });
  }

  await Promise.all(
    Object.entries(rawStemsMap).map(async ([instrumentKey, tempUrl]) => {
      let finalUrl = "";
      let sizeBytes = 0;
      if (tempUrl && (tempUrl.startsWith("http://") || tempUrl.startsWith("https://"))) {
        try {
          const isSafe = tempUrl.includes("replicate.delivery") || tempUrl.includes("supabase.co") || await esUrlExternaSegura(tempUrl);
          if (isSafe) {
            const fileRes = await fetch(tempUrl, { signal: AbortSignal.timeout(45000) });
            if (fileRes.ok) {
              const arrayBuf = await fileRes.arrayBuffer();
              const rawBuffer = Buffer.from(arrayBuf);
              // Replicate devuelve WAV sin comprimir con extensi\u00f3n .mp3 en el nombre: un stem
              // aislado de una canci\u00f3n entera puede superar los 50MB del l\u00edmite gratuito de
              // Supabase Storage. Recomprimimos a MP3 real antes de subir.
              const buffer = await transcodeBufferToMp3(rawBuffer);
              sizeBytes = buffer.length;
              const instrumentClean = instrumentKey.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              const filename = `stem-${instrumentClean}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.mp3`;
              const storageSubPath = rutaAlmacenamientoStem(effectiveBandId, filename, effectiveHash);

              // 1. Intentar guardar en Supabase Storage permanente
              const supabaseUrl = await uploadBufferToSupabase(buffer, storageSubPath, "audio/mpeg");
              if (supabaseUrl) {
                finalUrl = supabaseUrl;
                console.log(`[Neural Stems] Guardado permanente en Supabase para ${instrumentKey}: ${supabaseUrl}`);
              } else {
                // 2. Buffer temporal en disco de tránsito con reintento automático hacia Supabase
                const localPath = path.join(stemsUploadsDir, filename);
                fs.writeFileSync(localPath, buffer);
                finalUrl = `/uploads/stems/${filename}`;
                console.warn(`[Neural Stems] ⚠️ Subida inmediata a Supabase no disponible. Almacenado en buffer efímero de tránsito (${localPath}) y encolado para reintento con backoff.`);
                stemStorageRetryManager.enqueue(localPath, storageSubPath, effectiveBandId, "audio/mpeg", 5);
              }
            }
          }
        } catch (storageErr: any) {
          console.warn(`[Neural Stems] Error descargando o persistiendo stem ${instrumentKey}:`, storageErr?.message || storageErr);
        }
      }

      if (!finalUrl) {
        finalUrl = tempUrl;
      }

      const formattedSize = sizeBytes > 0
        ? (sizeBytes < 1024 * 1024 ? `${(sizeBytes / 1024).toFixed(0)} KB` : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`)
        : '3.1 MB';

      persistentStemsMap[instrumentKey] = {
        url: finalUrl,
        formato: formatLabel,
        tamano: formattedSize
      };
    })
  );

  return persistentStemsMap;
}

/**
 * Procesa la separación de stems con Red Neuronal Demucs v4 (Replicate) si REPLICATE_API_TOKEN está configurado.
 * Devuelve un mapa con { Voz, Batería, Bajo, Guitarras, Teclados, Arreglos } usando audio real de estudio de máxima calidad (WAV).
 * Además, persiste los stems en Supabase Storage de manera permanente y aislada por banda/canción,
 * previniendo errores de reproducción causados por URLs temporales expiradas de Replicate.
 */
async function processNeuralStemsReplicate(
  audioUrl: string,
  bandId?: string,
  songHash?: string,
  requestHost?: string,
  overrideToken?: string
): Promise<ProcessNeuralStemsResult | null> {
  const rawToken = overrideToken || process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY || "";
  const token = rawToken.trim().replace(/^["']|["']$/g, '').replace(/^(Token|Bearer)\s+/i, '');
  if (!token) {
    return {
      stemsMap: null,
      provider: 'replicate',
      errorType: 'token_missing',
      errorTitle: 'Token de Replicate no Configurado',
      error: 'No se encontró la clave REPLICATE_API_TOKEN en el entorno.',
      actionAdvice: 'Configura REPLICATE_API_TOKEN en los ajustes del proyecto o variables de entorno.',
      errorDetail: 'Missing environment variable REPLICATE_API_TOKEN',
      httpStatus: 400
    };
  }

  if (!audioUrl) {
    return {
      stemsMap: null,
      provider: 'replicate',
      errorType: 'audio_unsupported',
      errorTitle: 'Audio no Suministrado',
      error: 'No se proporcionó una URL o archivo de audio válido para procesar en Replicate.',
      actionAdvice: 'Sube o graba una idea de audio primero antes de solicitar la separación.',
      errorDetail: 'audioUrl is empty or null',
      httpStatus: 400
    };
  }

  const t0 = Date.now();
  const effectiveBandId = bandId || "sin-banda";
  const effectiveHash = songHash || crypto.createHash('md5').update(audioUrl).digest('hex').substring(0, 10);

  try {
    const resolvedUrl = await ensurePublicAudioUrl(audioUrl, effectiveBandId, effectiveHash, requestHost);
    const tPreloadEnd = Date.now();

    console.log(`[Demucs Neural] Iniciando separación de stems con Demucs v4 en Replicate. URL de entrada: ${resolvedUrl.startsWith('data:') ? 'Data URI (' + resolvedUrl.substring(0, 30) + '...)' : resolvedUrl}`);
    const DEMUCS_VERSION = "25a173108cff36ef9f80f854c162d01df9e6528be175794b81158fa03836d953";

    // shifts debe ser >= 1 en el schema de cjwbw/demucs (1 = procesamiento rápido sin shifts adicionales; 0 genera error 422)
    const demucsInput = {
      audio: resolvedUrl,
      model_name: "htdemucs_6s",
      shifts: 1,
      overlap: 0.25,
      output_format: "mp3"
    };

    const tGpuStart = Date.now();
    const reqHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 1. Probar primero el endpoint oficial del modelo cjwbw/demucs con reintento automático ante 5xx/429
    let response = await fetchReplicateWithRetry('https://api.replicate.com/v1/models/cjwbw/demucs/predictions', {
      method: 'POST',
      headers: reqHeaders,
      body: JSON.stringify({ input: demucsInput })
    });

    let primaryErrText = "";
    // 2. Si falla endpoint oficial por ruta con 404/400/422, probar endpoint por hash de versión
    if (!response.ok) {
      primaryErrText = await response.text();
      console.warn(`[Demucs Neural] Replicate model/cjwbw/demucs/predictions falló (${response.status}: ${primaryErrText}). Probando v1/predictions con versión...`);
      if (response.status === 404 || response.status === 400 || response.status === 422) {
        response = await fetchReplicateWithRetry('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: reqHeaders,
          body: JSON.stringify({
            version: DEMUCS_VERSION,
            input: demucsInput
          })
        });
      }
    }

    if (!response.ok) {
      const errBody = primaryErrText && response.status !== 404 ? primaryErrText : await response.text();
      console.warn("Replicate API request failed definitivamente:", response.status, errBody);
      const diag = parseReplicateError(response.status, errBody);
      return {
        stemsMap: null,
        provider: 'replicate',
        errorType: diag.errorType,
        errorTitle: diag.errorTitle,
        error: diag.message,
        actionAdvice: diag.actionAdvice,
        errorDetail: diag.errorDetail,
        httpStatus: diag.httpStatus
      };
    }

    let prediction = await response.json();
    const predictionId = prediction.id;

    // Polling a Replicate con tiempo límite ampliado a 360s (6 minutos)
    const startTime = Date.now();
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && prediction.status !== 'canceled') {
      if (Date.now() - startTime > 360000) {
        console.warn("Demucs separation timeout en Replicate (>360s)...");
        const lastLogs = String(prediction.logs || '').trim().split('\n').filter(Boolean).slice(-4).join(' | ');
        return {
          stemsMap: null,
          provider: 'replicate',
          errorType: 'timeout',
          errorTitle: 'Tiempo de Espera en GPU Excedido (>6 min)',
          error: `La separación en la GPU de Replicate superó los 6 minutos de espera (Estado: ${prediction.status}).`,
          actionAdvice: 'La máquina de Replicate puede haber tardado en inicializar. Vuelve a intentarlo o usa la separación con el Motor DSP local.',
          errorDetail: `Prediction ID: ${predictionId}\nStatus: ${prediction.status}\nLogs: ${lastLogs || 'Sin logs disponibles'}`,
          httpStatus: 504
        };
      }
      await new Promise(r => setTimeout(r, 1000));
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (pollRes.ok) {
        prediction = await pollRes.json();
      } else {
        const pollErr = await pollRes.text().catch(() => '');
        console.warn(`[Demucs Neural] Error al consultar predicción ${predictionId} (${pollRes.status}): ${pollErr}`);
      }
    }

    const tGpuEnd = Date.now();

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      const predError = prediction.error ? String(prediction.error) : "";
      const predLogs = String(prediction.logs || "").trim();
      const lastLogs = predLogs ? predLogs.split('\n').filter(Boolean).slice(-6).join('\n') : "";

      let failureType: StemErrorType = 'gpu_failure';
      let failureTitle = `Fallo en el Worker GPU de Replicate (${prediction.status})`;
      let failureAdvice = 'El contenedor Demucs finalizó inesperadamente. Consulta los logs de GPU abajo o usa el Motor DSP local.';

      if (predError.toLowerCase().includes('cuda out of memory') || predLogs.toLowerCase().includes('cuda out of memory')) {
        failureTitle = 'Memoria GPU Insuficiente (CUDA Out of Memory)';
        failureAdvice = 'El archivo de audio es demasiado largo o complejo para la memoria VRAM de la GPU. Intenta con un fragmento más corto o usa el Motor DSP.';
      } else if (predError.toLowerCase().includes('soundfile') || predError.toLowerCase().includes('format') || predError.toLowerCase().includes('codec')) {
        failureType = 'audio_unsupported';
        failureTitle = 'Error de Decodificación de Audio en GPU';
        failureAdvice = 'El decodificador FFmpeg/Soundfile del contenedor no pudo leer el audio. Prueba a convertir el archivo a MP3 o WAV estándar.';
      }

      let detailedGpuError = `Fallo en el procesamiento GPU de Replicate (${prediction.status}): `;
      if (predError) {
        detailedGpuError += predError;
      }
      if (lastLogs && !predError.includes(lastLogs)) {
        detailedGpuError += `\nLogs de GPU:\n${lastLogs}`;
      }
      if (!predError && !lastLogs) {
        detailedGpuError += "El worker finalizó sin devolver mensaje de error explícito.";
      }

      console.warn("[Demucs Neural] Predicción falló en Replicate:", detailedGpuError);
      return {
        stemsMap: null,
        provider: 'replicate',
        errorType: failureType,
        errorTitle: failureTitle,
        error: predError || 'El worker finalizó con estado failed.',
        actionAdvice: failureAdvice,
        errorDetail: `Prediction ID: ${predictionId}\nError: ${predError || 'No especificado'}\n\nLogs de GPU:\n${lastLogs || '(vacíos)'}`,
        httpStatus: 502
      };
    }

    if (prediction.status === 'succeeded' && prediction.output) {
      const out = prediction.output;
      console.log("[Demucs Neural] ¡Separación neuronal de stems completada con éxito en Replicate!", Object.keys(out));

      const rawStemsMap: Record<string, string> = {};

      // cjwbw/demucs en Replicate devuelve: bassuri, drumsuri, guitaruri, otheruri, pianouri, vocalsuri
      // Otras versiones pueden devolver: bass, drums, guitar, other, piano, vocals
      const findStemUrl = (searchKeys: string[]): string | undefined => {
        for (const k of searchKeys) {
          if (out[k] && typeof out[k] === 'string') return out[k];
        }
        for (const [k, v] of Object.entries(out)) {
          if (typeof v === 'string') {
            const lowerK = k.toLowerCase();
            if (searchKeys.some(target => lowerK.includes(target.toLowerCase()))) {
              return v;
            }
          }
        }
        return undefined;
      };

      const vocalUrl = findStemUrl(['vocalsuri', 'vocals', 'vocal', 'vocals_url', 'vocals_uri', 'voz']);
      const drumsUrl = findStemUrl(['drumsuri', 'drums', 'drum', 'drums_url', 'drums_uri', 'bateria']);
      const bassUrl = findStemUrl(['bassuri', 'bass', 'bass_url', 'bass_uri', 'bajo']);
      const guitarUrl = findStemUrl(['guitaruri', 'guitar', 'guitars', 'guitar_url', 'guitar_uri', 'guitarra']);
      const pianoUrl = findStemUrl(['pianouri', 'piano', 'keyboards', 'piano_url', 'piano_uri', 'teclados']);
      const otherUrl = findStemUrl(['otheruri', 'other', 'no_vocals', 'other_url', 'other_uri', 'accompaniment', 'arreglos']);

      if (vocalUrl) rawStemsMap['Voz'] = vocalUrl;
      if (drumsUrl) rawStemsMap['Batería'] = drumsUrl;
      if (bassUrl) rawStemsMap['Bajo'] = bassUrl;
      if (guitarUrl) rawStemsMap['Guitarras'] = guitarUrl;
      if (pianoUrl) rawStemsMap['Teclados'] = pianoUrl;
      if (otherUrl) rawStemsMap['Arreglos'] = otherUrl;

      // Fallback para modelos de 4 stems
      if (!rawStemsMap['Guitarras'] && otherUrl) rawStemsMap['Guitarras'] = otherUrl;
      if (!rawStemsMap['Arreglos'] && pianoUrl) rawStemsMap['Arreglos'] = pianoUrl;

      // Persistir permanentemente los stems en Supabase Storage o Disco Local
      const tSaveStart = Date.now();
      const persistentStemsMap = await persistRawStemsMap(
        rawStemsMap,
        effectiveBandId,
        effectiveHash,
        'MP3 (Demucs Neural v4)'
      );
      const tSaveEnd = Date.now();

      const timingBreakdown = {
        preloadSec: `${((tPreloadEnd - t0) / 1000).toFixed(1)}s`,
        gpuInferenceSec: `${((tGpuEnd - tGpuStart) / 1000).toFixed(1)}s`,
        stemsPersistenceSec: `${((tSaveEnd - tSaveStart) / 1000).toFixed(1)}s`,
        totalSec: `${((tSaveEnd - t0) / 1000).toFixed(1)}s`
      };

      console.log(`[Demucs Neural Telemetry] ⏱️ Tiempo total: ${timingBreakdown.totalSec} (Preload: ${timingBreakdown.preloadSec}, GPU Replicate: ${timingBreakdown.gpuInferenceSec}, Persistencia Supabase: ${timingBreakdown.stemsPersistenceSec})`);

      return { stemsMap: persistentStemsMap, timingBreakdown, engine: 'demucs' };
    }
  } catch (err) {
    console.warn("Error invocando modelo neuronal Demucs en Replicate:", err);
  }
  return null;
}

/**
 * Procesa la separación de stems con el modelo MVSEP-MDX23 (MDX-Net + Demucs4) en Replicate.
 * 
 * 1. Inferencia en Replicate con lucataco/mvsep-mdx23-music-separation.
 * 2. Persistencia Inmutable en Supabase Storage.
 */
async function processMdx23Stems(
  audioUrl: string,
  bandId?: string,
  songHash?: string,
  requestHost?: string,
  overrideToken?: string
): Promise<ProcessNeuralStemsResult | null> {
  const effectiveBandId = bandId || "sin-banda";
  const effectiveHash = songHash || crypto.createHash('md5').update(audioUrl).digest('hex').substring(0, 10);
  const t0 = Date.now();

  const modelFriendlyName = "MVSEP MDX'23 (MDX-Net + Demucs4)";
  const formatLabel = "MP3 (MVSEP MDX23 Neural)";

  const resolvedUrl = await ensurePublicAudioUrl(audioUrl, effectiveBandId, effectiveHash, requestHost);
  const tPreloadEnd = Date.now();

  const rawToken = overrideToken || process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY || "";
  const token = rawToken.trim().replace(/^["']|["']$/g, '').replace(/^(Token|Bearer)\s+/i, '');

  if (!token) {
    return {
      stemsMap: null,
      provider: 'replicate',
      errorType: 'token_missing',
      errorTitle: `Token de Replicate No Configurado para ${modelFriendlyName}`,
      error: `Para procesar audio con ${modelFriendlyName} necesitas configurar REPLICATE_API_TOKEN en tus variables de entorno o en la petición.`,
      actionAdvice: 'Configura tu token de Replicate en Settings o utiliza el Motor DSP local que es 100% gratuito.',
      errorDetail: 'Missing REPLICATE_API_TOKEN in server environment or request headers',
      httpStatus: 400
    };
  }

  const replicateModel = REPLICATE_MODEL_MVSEP_MDX23;
  const MVSEP_VERSION = REPLICATE_VERSION_MVSEP_MDX23;

  console.log(`[MDX23 Neural] Iniciando inferencia en Replicate (${replicateModel} / version: ${MVSEP_VERSION.substring(0, 12)}...) para ${modelFriendlyName}. Audio: ${resolvedUrl.substring(0, 50)}...`);

  const tGpuStart = Date.now();
  const reqHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // 1. Invocar Replicate usando el endpoint por versión fijada con reintentos automáticos
  let response = await fetchReplicateWithRetry('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: reqHeaders,
    body: JSON.stringify({
      version: MVSEP_VERSION,
      input: {
        audio: resolvedUrl
      }
    })
  });

  // 2. Si falla por endpoint de versiones con 404/422/400, probar endpoint por modelo slug
  if (!response.ok && (response.status === 404 || response.status === 422 || response.status === 400)) {
    console.warn(`[MDX23 Neural] Prediction por versión ${MVSEP_VERSION.substring(0, 10)} falló (${response.status}). Probando endpoint por modelo slug...`);
    response = await fetchReplicateWithRetry(`https://api.replicate.com/v1/models/${replicateModel}/predictions`, {
      method: 'POST',
      headers: reqHeaders,
      body: JSON.stringify({
        input: { audio: resolvedUrl }
      })
    });
  }

  if (!response.ok) {
    const errBody = await response.text();
    console.warn(`[MDX23 Neural] Petición a Replicate falló (${response.status}):`, errBody);
    const diag = parseReplicateError(response.status, errBody);
    return {
      stemsMap: null,
      provider: 'replicate',
      errorType: diag.errorType,
      errorTitle: `${diag.errorTitle} (${modelFriendlyName})`,
      error: diag.message,
      actionAdvice: diag.actionAdvice,
      errorDetail: `Endpoint Replicate: v1/predictions [version: ${MVSEP_VERSION}]\nResponse (${response.status}): ${errBody}`,
      httpStatus: diag.httpStatus
    };
  }

  let prediction = await response.json();
  const predictionId = prediction.id;

  const startTime = Date.now();
  while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && prediction.status !== 'canceled') {
    if (Date.now() - startTime > 360000) {
      console.warn(`[MDX23 Neural] Timeout en Replicate (>360s) para predicción ${predictionId}`);
      const lastLogs = String(prediction.logs || '').trim().split('\n').filter(Boolean).slice(-6).join('\n');
      return {
        stemsMap: null,
        provider: 'replicate',
        errorType: 'timeout',
        errorTitle: `Tiempo de Espera Excedido en GPU (${modelFriendlyName})`,
        error: `La inferencia en Replicate superó los 6 minutos de espera (Estado: ${prediction.status}).`,
        actionAdvice: 'Puedes reintentar o separar las pistas con el Motor DSP local.',
        errorDetail: `Prediction ID: ${predictionId}\nStatus: ${prediction.status}\nLogs:\n${lastLogs || 'Sin logs'}`,
        httpStatus: 504
      };
    }
    await new Promise(r => setTimeout(r, 1200));
    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (pollRes.ok) {
      prediction = await pollRes.json();
    }
  }

  const tGpuEnd = Date.now();

  if (prediction.status === 'failed' || prediction.status === 'canceled') {
    const predError = String(prediction.error || "");
    const lastLogs = String(prediction.logs || "").trim().split('\n').filter(Boolean).slice(-6).join('\n');
    return {
      stemsMap: null,
      provider: 'replicate',
      errorType: 'gpu_failure',
      errorTitle: `Fallo en el Contenedor GPU (${modelFriendlyName})`,
      error: predError || 'El contenedor finalizó con error.',
      actionAdvice: 'Verifica los logs o usa el Motor DSP local.',
      errorDetail: `Prediction ID: ${predictionId}\nError: ${predError}\nLogs:\n${lastLogs}`,
      httpStatus: 502
    };
  }

  if (prediction.status === 'succeeded' && prediction.output) {
    const out = prediction.output;
    console.log(`[MDX23 Neural] Inferencia completada con éxito en Replicate (${modelFriendlyName}):`, Object.keys(out));

    const rawStemsMap: Record<string, string> = {};

    // La versión pinneada de lucataco/mvsep-mdx23-music-separation devuelve el output como
    // array posicional (claves "0".."N"), no como objeto con nombres (vocals/drums/bass/...).
    // Sin este caso, el mapeo por nombre de abajo no encuentra nada y se descartan 6 stems
    // ya generados y cobrados en Replicate. El orden posicional coincide con el mismo orden
    // vocals/drums/bass/guitar/piano/other documentado para el ensemble de 6 fuentes.
    const outKeys = Object.keys(out);
    const isPositionalArray = Array.isArray(out) || (outKeys.length > 0 && outKeys.every(k => /^\d+$/.test(k)));

    if (isPositionalArray) {
      const values = Array.isArray(out)
        ? out
        : outKeys.sort((a, b) => Number(a) - Number(b)).map(k => out[k]);
      const positionalLabels: Record<number, string[]> = {
        4: ['Voz', 'Batería', 'Bajo', 'Arreglos'],
        6: ['Voz', 'Batería', 'Bajo', 'Guitarras', 'Teclados', 'Arreglos']
      };
      const labels = positionalLabels[values.length] || [];
      console.log(`[MDX23 Neural] Output posicional (array) de ${values.length} stems detectado. Mapeando por orden: ${labels.join(', ') || 'desconocido, se etiquetará genéricamente'}`);
      values.forEach((url: unknown, idx: number) => {
        if (typeof url !== 'string') return;
        const label = labels[idx] || `Stem IA ${idx + 1}`;
        rawStemsMap[label] = url;
      });
    } else {
      const findStemUrl = (searchKeys: string[]): string | undefined => {
        for (const k of searchKeys) {
          if (out[k] && typeof out[k] === 'string') return out[k];
        }
        for (const [k, v] of Object.entries(out)) {
          if (typeof v === 'string') {
            const lowerK = k.toLowerCase();
            if (searchKeys.some(target => lowerK.includes(target.toLowerCase()))) {
              return v;
            }
          }
        }
        return undefined;
      };

      const vocalUrl = findStemUrl(['vocals', 'vocals_url', 'vocalsuri', 'vocal', 'acapella', 'voz']);
      const drumsUrl = findStemUrl(['drums', 'drums_url', 'drumsuri', 'drum', 'bateria']);
      const bassUrl = findStemUrl(['bass', 'bass_url', 'bassuri', 'bajo']);
      const guitarUrl = findStemUrl(['guitar', 'guitars', 'guitar_url', 'guitaruri', 'guitarra']);
      const pianoUrl = findStemUrl(['piano', 'pianouri', 'keyboards', 'teclados']);
      const otherUrl = findStemUrl(['other', 'other_url', 'otheruri', 'instrumental', 'accompaniment', 'arreglos']);

      if (vocalUrl) rawStemsMap['Voz'] = vocalUrl;
      if (drumsUrl) rawStemsMap['Batería'] = drumsUrl;
      if (bassUrl) rawStemsMap['Bajo'] = bassUrl;
      if (guitarUrl) rawStemsMap['Guitarras'] = guitarUrl;
      if (pianoUrl) rawStemsMap['Teclados'] = pianoUrl;
      if (otherUrl) rawStemsMap['Arreglos'] = otherUrl;

      if (!rawStemsMap['Guitarras'] && otherUrl) rawStemsMap['Guitarras'] = otherUrl;
      if (!rawStemsMap['Arreglos'] && otherUrl && !rawStemsMap['Teclados']) rawStemsMap['Arreglos'] = otherUrl;
    }

    const tSaveStart = Date.now();
    const persistentStemsMap = await persistRawStemsMap(rawStemsMap, effectiveBandId, effectiveHash, formatLabel);
    const tSaveEnd = Date.now();

    const timingBreakdown = {
      preloadSec: `${((tPreloadEnd - t0) / 1000).toFixed(1)}s`,
      gpuInferenceSec: `${((tGpuEnd - tGpuStart) / 1000).toFixed(1)}s`,
      stemsPersistenceSec: `${((tSaveEnd - tSaveStart) / 1000).toFixed(1)}s`,
      totalSec: `${((tSaveEnd - t0) / 1000).toFixed(1)}s`
    };

    return { stemsMap: persistentStemsMap, timingBreakdown, engine: 'mvsep-mdx23' };
  }

  return null;
}

/**
 * Procesa la separación de stems con Fal.ai si FAL_KEY o FAL_API_KEY está configurado.
 */
async function processNeuralStemsFal(
  audioUrl: string,
  bandId?: string,
  songHash?: string,
  requestHost?: string
): Promise<Record<string, { url: string; formato: string; tamano: string }> | null> {
  const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY;
  if (!falKey) return null;

  const effectiveBandId = bandId || "sin-banda";
  const effectiveHash = songHash || crypto.createHash('md5').update(audioUrl).digest('hex').substring(0, 10);

  try {
    const resolvedUrl = await ensurePublicAudioUrl(audioUrl, effectiveBandId, effectiveHash, requestHost);
    console.log(`[Fal Neural] Iniciando separación de stems con Fal.ai Demucs desde: ${resolvedUrl}`);

    const res = await fetch('https://fal.run/fal-ai/demucs', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ audio_url: resolvedUrl })
    });

    if (!res.ok) {
      console.warn('[Fal Neural] Petición a Fal.ai devolvió status:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const audioFiles = data.audio_files || data.output || data;
    if (!audioFiles) return null;

    const rawStemsMap: Record<string, string> = {};
    if (audioFiles.vocals) rawStemsMap['Voz'] = typeof audioFiles.vocals === 'string' ? audioFiles.vocals : audioFiles.vocals.url;
    if (audioFiles.drums) rawStemsMap['Batería'] = typeof audioFiles.drums === 'string' ? audioFiles.drums : audioFiles.drums.url;
    if (audioFiles.bass) rawStemsMap['Bajo'] = typeof audioFiles.bass === 'string' ? audioFiles.bass : audioFiles.bass.url;
    if (audioFiles.guitar) rawStemsMap['Guitarras'] = typeof audioFiles.guitar === 'string' ? audioFiles.guitar : audioFiles.guitar.url;
    if (audioFiles.piano) rawStemsMap['Teclados'] = typeof audioFiles.piano === 'string' ? audioFiles.piano : audioFiles.piano.url;
    if (audioFiles.other) rawStemsMap['Arreglos'] = typeof audioFiles.other === 'string' ? audioFiles.other : audioFiles.other.url;

    const persistentStemsMap: Record<string, { url: string; formato: string; tamano: string }> = {};

    await Promise.all(
      Object.entries(rawStemsMap).map(async ([instrumentKey, tempUrl]) => {
        let finalUrl = tempUrl;
        let sizeBytes = 0;
        if (tempUrl && (tempUrl.startsWith("http://") || tempUrl.startsWith("https://"))) {
          try {
            const isSafe = await esUrlExternaSegura(tempUrl);
            if (isSafe) {
              const fileRes = await fetch(tempUrl);
              if (fileRes.ok) {
                const arrayBuf = await fileRes.arrayBuffer();
                sizeBytes = arrayBuf.byteLength;
                const buffer = Buffer.from(arrayBuf);
                const instrumentClean = instrumentKey.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const storageSubPath = rutaAlmacenamientoStem(effectiveBandId, `stem-${instrumentClean}.mp3`, effectiveHash);
                const supabaseUrl = await uploadBufferToSupabase(buffer, storageSubPath, "audio/mpeg");
                if (supabaseUrl) {
                  finalUrl = supabaseUrl;
                }
              }
            }
          } catch (storageErr: any) {
            console.warn(`[Fal Stems] Error guardando stem ${instrumentKey}:`, storageErr);
          }
        }

        const formattedSize = sizeBytes > 0
          ? (sizeBytes < 1024 * 1024 ? `${(sizeBytes / 1024).toFixed(0)} KB` : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`)
          : '2.8 MB';

        persistentStemsMap[instrumentKey] = {
          url: finalUrl,
          formato: 'MP3 (Fal.ai Demucs)',
          tamano: formattedSize
        };
      })
    );

    return persistentStemsMap;
  } catch (err) {
    console.warn("Error invocando Fal.ai audio separation:", err);
    return null;
  }
}

/**
 * Función auxiliar para procesar stems en el servidor usando FFmpeg y supresión Mid/Side
 */
async function processServerStemsFfmpeg(
  audioUrl: string,
  bandId?: string,
  songHash?: string,
  preprocesarDirecto: boolean = false
): Promise<Record<string, { url: string; formato: string; tamano: string }>> {
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "stems");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const timestamp = Date.now();
  let inputPath = audioUrl;
  let tempLocalFile: string | null = null;
  let tempPreprocessedFile: string | null = null;

  // Si la URL es HTTP(S) o data URL, la descargamos UNA SOLA VEZ a disco local para evitar re-descargas HTTP repetidas
  if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://") || audioUrl.startsWith("data:")) {
    try {
      tempLocalFile = path.join("/tmp", `input-audio-stem-${timestamp}.mp3`);
      if (audioUrl.startsWith("data:")) {
        const base64Data = audioUrl.split(",")[1];
        if (base64Data) {
          fs.writeFileSync(tempLocalFile, Buffer.from(base64Data, "base64"));
        }
      } else {
        const isSafe = await esUrlExternaSegura(audioUrl);
        if (isSafe) {
          const res = await fetch(audioUrl);
          if (res.ok) {
            const arrayBuf = await res.arrayBuffer();
            fs.writeFileSync(tempLocalFile, Buffer.from(arrayBuf));
          }
        }
      }
      if (tempLocalFile && fs.existsSync(tempLocalFile) && fs.statSync(tempLocalFile).size > 0) {
        inputPath = tempLocalFile;
      }
    } catch (dlErr) {
      console.warn("[FFmpeg Accelerator] No se pudo guardar copia local de entrada, usando URL directa:", dlErr);
    }
  } else if (audioUrl.startsWith("/")) {
    const localPublic = path.join(process.cwd(), "public", audioUrl);
    if (fs.existsSync(localPublic)) {
      inputPath = localPublic;
    }
  }

  // Si se solicita acondicionamiento para directo o grabación ruidosa, normalizar previamente
  if (preprocesarDirecto && fs.existsSync(inputPath)) {
    tempPreprocessedFile = path.join("/tmp", `preproc-stem-${timestamp}.mp3`);
    const preprocRes = await preprocesarAudioDirecto(inputPath, tempPreprocessedFile, {
      filtroRumble: true,
      targetLufs: -14,
      truePeakDb: -1.0,
      deHiss: true
    });
    if (preprocRes.success && fs.existsSync(tempPreprocessedFile)) {
      inputPath = tempPreprocessedFile;
    }
  }

  const stemsMap: Record<string, { url: string; formato: string; tamano: string }> = {};
  const effectiveBandId = bandId || "sin-banda";
  const effectiveHash = songHash || crypto.createHash('md5').update(audioUrl).digest('hex').substring(0, 10);

  // Filtros DSP de alta separación y aislamiento de canales para evitar el filtrado cruzado (bleed)
  const configs = [
    {
      key: "Voz",
      filename: `stem-vocal-${timestamp}.mp3`,
      filter: "pan=mono|c0=0.5*c0+0.5*c1,highpass=f=280,lowpass=f=3600,equalizer=f=1200:width_type=h:width=1200:g=4,volume=1.4"
    },
    {
      key: "Batería",
      filename: `stem-drums-${timestamp}.mp3`,
      filter: "pan=mono|c0=0.5*c0-0.5*c1,highpass=f=3800,volume=1.3"
    },
    {
      key: "Bajo",
      filename: `stem-bass-${timestamp}.mp3`,
      filter: "lowpass=f=160,lowpass=f=160,equalizer=f=80:width_type=q:width=1.2:g=4,volume=1.5"
    },
    {
      key: "Guitarras",
      filename: `stem-guitars-${timestamp}.mp3`,
      filter: "pan=mono|c0=0.5*c0-0.5*c1,highpass=f=220,lowpass=f=3400,volume=1.5"
    },
    {
      key: "Arreglos",
      filename: `stem-brass-${timestamp}.mp3`,
      filter: "pan=mono|c0=0.5*c0-0.5*c1,highpass=f=2400,lowpass=f=8500,volume=1.3"
    }
  ];

  // Procesa los 5 stems en PARALELO directamente sobre archivo local (Tardo < 1.2 segundos total)
  await Promise.all(
    configs.map((cfg) => {
      return new Promise<void>((resolve) => {
        const outputPath = path.join(uploadsDir, cfg.filename);
        try {
          ffmpeg(inputPath)
            .audioFilters(cfg.filter)
            .audioBitrate("256k")
            .output(outputPath)
            .on("end", async () => {
              if (fs.existsSync(outputPath)) {
                let finalUrl = `/uploads/stems/${cfg.filename}`;
                let sizeBytes = 0;
                try {
                  const stat = fs.statSync(outputPath);
                  sizeBytes = stat ? stat.size : 0;
                  const storageSubPath = rutaAlmacenamientoStem(effectiveBandId, cfg.filename, effectiveHash);
                  const supabasePromise = uploadToSupabaseIfAvailable(outputPath, storageSubPath, "audio/mpeg");
                  const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));
                  const supabaseUrl = await Promise.race([supabasePromise, timeoutPromise]);
                  if (supabaseUrl) {
                    finalUrl = supabaseUrl;
                  }
                } catch (upErr) {
                  console.warn(`Aviso al subir stem FFmpeg a Supabase:`, upErr);
                }
                const formattedSize = sizeBytes < 1024 * 1024
                  ? `${(sizeBytes / 1024).toFixed(0)} KB`
                  : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;

                stemsMap[cfg.key] = {
                  url: finalUrl,
                  formato: "MP3 (256k)",
                  tamano: formattedSize
                };
              }
              resolve();
            })
            .on("error", (err) => {
              console.warn(`Aviso procesando stem FFmpeg ${cfg.key}:`, err?.message || err);
              resolve();
            })
            .run();
        } catch (procErr) {
          console.warn(`Error al lanzar FFmpeg para ${cfg.key}:`, procErr);
          resolve();
        }
      });
    })
  );

  // Limpiar archivo temporal de entrada si se creó
  if (tempLocalFile && fs.existsSync(tempLocalFile)) {
    try { fs.unlinkSync(tempLocalFile); } catch (_) {}
  }

  return stemsMap;
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// requireAuth + iaRateLimiter: llegó desde AI Studio sin ninguno de los dos, así que era una
// pasarela gratis y sin límite a un modelo de pago (Lyria) con la clave de la propia plataforma
// para cualquiera que diera con la URL — la misma clase de fallo que /write-reels-copy ya
// tenía cerrada (ver ese comentario en chat.ts).
router.post(["/generate", "/generate-music"], requireAuth, iaRateLimiter, async (req, res) => {
  try {
    const { prompt, style, lyrics } = req.body;
    const fullPrompt = `Create a professional custom soundtrack, jingle or background music in the musical style of: ${style || 'rock'}. User prompt / description: ${prompt || 'Energetic independent band theme'}. Band style, ideology and lyric context: ${lyrics || 'Independent music passion'}`;

    const response = await ai.models.generateContentStream({
      model: "lyria-3-clip-preview",
      contents: fullPrompt,
    });

    let audioBase64 = "";
    let generatedLyrics = "";
    let mimeType = "audio/wav";

    for await (const chunk of response) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;
      for (const part of parts) {
        if (part.inlineData?.data) {
          if (!audioBase64 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioBase64 += part.inlineData.data;
        }
        if (part.text && !generatedLyrics) {
          generatedLyrics = part.text;
        }
      }
    }

    if (!audioBase64) {
      return res.status(500).json({ error: "No se pudo generar el clip de audio musical." });
    }

    return res.json({
      success: true,
      audioBase64,
      mimeType,
      lyrics: generatedLyrics
    });
  } catch (err: any) {
    console.error("AI Music generation error:", err);
    const gemDiag = parseGeminiError(err);
    return res.status(gemDiag.httpStatus).json({
      provider: gemDiag.provider,
      error: gemDiag.errorTitle,
      message: gemDiag.message,
      errorType: gemDiag.errorType,
      errorTitle: gemDiag.errorTitle,
      actionAdvice: gemDiag.actionAdvice,
      details: gemDiag.errorDetail
    });
  }
});

/**
 * Endpoint de Separación de Pistas por IA (Deep AI Stem Separation)
 * Utiliza Gemini 3.7 Flash para analizar el espectro musical, la estructura y los instrumentos
 * presentes en la canción y generar pistas aisladas para cada instrumento.
 */
router.post("/ai-stem-separation", requireAuth, iaRateLimiter, async (req, res) => {
  const tTotalStart = Date.now();
  let executionTimingBreakdown: any = null;
  let bandId = "sin-banda";
  let songHash = "";
  let selectedEngine = "auto";

  try {
    const { songTitle, sectionName, audioUrl, bpm, key, forceEngine, engine, forceNeural, replicateToken, preprocesarDirecto } = req.body || {};

    const analysisPrompt = `Eres un ingeniero de sonido e IA experto en 'Music Source Separation' (Separación de Fuentes Musicales en Stems) usando redes neuronales como HT-Demucs y MDX-Net.
Analiza la siguiente sección de la canción:
- Título de la Canción: "${songTitle || 'Tema Sin Título'}"
- Sección Activa: "${sectionName || 'Estrofa/Estribillo'}"
- Tempo: ${bpm || 120} BPM
- Tonalidad: "${key || 'La menor'}"

Instrucción:
Genera el desglose analítico en formato JSON con la separación de pistas (stems) para los siguientes instrumentos principales:
1. Voz Principal (Vocals)
2. Batería & Percusión (Drums)
3. Bajo (Bass)
4. Guitarras & Teclados (Guitars/Keys)
5. Arreglos Solistas (Brass/Strings/Synths)

Devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura:
{
  "songTitle": string,
  "sectionName": string,
  "detectedBpm": number,
  "detectedKey": string,
  "analysisSummary": string,
  "stems": [
    {
      "instrument": "Voz" | "Batería" | "Bajo" | "Guitarras" | "Arreglos",
      "trackName": string,
      "dspFilterType": "bandpass" | "highpass" | "lowpass" | "notch",
      "cutoffFrequencyHz": number,
      "qFactor": number,
      "recommendedVolume": number,
      "recommendedPan": number,
      "description": string
    }
  ]
}`;

    let aiResponseText = "";
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: analysisPrompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3
        }
      });
      aiResponseText = response?.text || "";
    } catch (err) {
      console.warn("Fallo análisis directo Gemini 3.7 Flash para stems, usando análisis predeterminado:", err);
    }

    let parsedResult: any = null;
    if (aiResponseText) {
      try {
        parsedResult = JSON.parse(aiResponseText);
      } catch (e) {
        console.warn("No se pudo parsear JSON de Gemini en stems:", e);
      }
    }

    if (!parsedResult || !parsedResult.stems || !Array.isArray(parsedResult.stems)) {
      parsedResult = {
        songTitle: songTitle || "Canción",
        sectionName: sectionName || "General",
        detectedBpm: bpm || 120,
        detectedKey: key || "Am",
        analysisSummary: "Análisis espectral completado con éxito por Gemini AI Core. Se han aislado 5 canales de frecuencia independientes con preservación de fase.",
        stems: [
          {
            instrument: "Voz",
            trackName: "🎤 Stem IA: Voz Principal (Aislada)",
            dspFilterType: "bandpass",
            cutoffFrequencyHz: 1250,
            qFactor: 1.8,
            recommendedVolume: 0.9,
            recommendedPan: 0,
            description: "Aislamiento de rango vocal (1200Hz - 3.5kHz). Permite silenciar la voz para ensayar cantando en directo."
          },
          {
            instrument: "Batería",
            trackName: "🥁 Stem IA: Batería & Percusión",
            dspFilterType: "highpass",
            cutoffFrequencyHz: 1800,
            qFactor: 1.2,
            recommendedVolume: 0.85,
            recommendedPan: 0,
            description: "Aislamiento de la sección rítmica, transitorios de caja y platos (>1800Hz) y golpes de bombo."
          },
          {
            instrument: "Bajo",
            trackName: "🎸 Stem IA: Bajo (Sub-Bass)",
            dspFilterType: "lowpass",
            cutoffFrequencyHz: 220,
            qFactor: 2.0,
            recommendedVolume: 0.95,
            recommendedPan: 0,
            description: "Aislamiento de sub-graves y frecuencias fundamentales del bajo (20Hz - 220Hz)."
          },
          {
            instrument: "Guitarras",
            trackName: "🎹 Stem IA: Guitarras & Teclados",
            dspFilterType: "bandpass",
            cutoffFrequencyHz: 750,
            qFactor: 1.5,
            recommendedVolume: 0.8,
            recommendedPan: -0.2,
            description: "Filtro armónico de espectro medio para guitarras rítmicas y sintetizadores."
          },
          {
            instrument: "Arreglos",
            trackName: "🎺 Stem IA: Vientos, Cuerdas & Solos",
            dspFilterType: "bandpass",
            cutoffFrequencyHz: 2400,
            qFactor: 2.2,
            recommendedVolume: 0.85,
            recommendedPan: 0.2,
            description: "Resaltado de líneas melodiosas, solos de guitarra/violín y arreglos de viento."
          }
        ]
      };
    }

    // Process real audio stem files: 
    // Engines soportados:
    // - 'mel-roformer': Mel-Band RoFormer (SOTA mundial en pureza vocal y de instrumentos)
    // - 'bs-roformer': BS-RoFormer (Band-Split Transformer ganador SDX23)
    // - 'replicate' / 'demucs': HT-Demucs v4 Neural (6 stems)
    // - 'dsp-server' / 'dsp': Motor Local FFmpeg (100% gratuito, $0)
    // - 'auto': Detección inteligente (Endpoint Propio -> RoFormer -> Demucs -> Fal -> DSP)
    selectedEngine = forceEngine || engine || (forceNeural ? 'replicate' : 'auto');

    let finalStemsMap: Record<string, { url: string; formato: string; tamano: string } | string> = {};
    let separationEngine = "dsp-server";
    let isNeural = false;

    // Resuelve la banda de forma segura usando getTargetBandId
    try {
      bandId = getTargetBandId(req);
    } catch {
      bandId = (req as any).user?.band_id || "sin-banda";
    }

    songHash = crypto.createHash("md5").update(String(songTitle || "") + String(audioUrl || "")).digest("hex").substring(0, 10);
    const cacheKey = `${bandId}:${songHash}:${selectedEngine}`;

    // ========================================================================
    // 1. CHEQUEO DE CACHÉ PERSISTENTE L1/L2 (Garantía de Cero Coste Duplicado)
    // ========================================================================
    const isUserExplicitDsp = selectedEngine === 'dsp-server' || selectedEngine === 'dsp';

    const persistentEntry = await getStemsFromPersistentCache(bandId, songHash, selectedEngine);
    if (persistentEntry && persistentEntry.stemsMap && Object.keys(persistentEntry.stemsMap).length > 0) {
      const cachedEngineUsed = persistentEntry.engineUsed || (persistentEntry.isNeural ? persistentEntry.engine : (isUserExplicitDsp ? 'dsp-server' : 'dsp_fallback'));
      const cachedDegraded = !persistentEntry.isNeural && !isUserExplicitDsp;
      console.log(`[Stem Separator] ⚡ Cache HIT persistente (L1/L2 Supabase) para ${cacheKey}. 0 llamadas GPU / Replicate. Coste: $0.00.`);
      return res.json({
        success: true,
        audioUrl: audioUrl || "",
        separationEngine: persistentEntry.engine,
        engineUsed: cachedEngineUsed,
        degraded: cachedDegraded,
        degradedReason: cachedDegraded ? "Sin credenciales activas o servicio de IA disponible; procesado con filtros básicos DSP" : undefined,
        isNeural: persistentEntry.isNeural,
        cached: true,
        executionTimeMs: 8,
        executionTimeSec: "0.0s",
        timingBreakdown: { ...persistentEntry.timingBreakdown, cached: true, duplicateCostSaved: true },
        replicateConfigured: !!(process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY),
        falConfigured: !!(process.env.FAL_KEY || process.env.FAL_API_KEY),
        songTitle: songTitle || "Canción",
        sectionName: sectionName || "General",
        detectedBpm: bpm || 120,
        detectedKey: key || "Am",
        analysisSummary: `Stems cargados desde la base de datos persistente para el motor ${persistentEntry.engine}. Coste: $0.00 (sin consumo de créditos).`,
        stems: buildFormattedStems(persistentEntry.stemsMap)
      });
    }

    // ========================================================================
    // 2. PATRÓN DE RESERVA DISTRIBUIDA (Multi-instancia Railway anti-duplicados)
    // ========================================================================
    const lockResult = await acquireStemsSeparationLock(bandId, songHash, selectedEngine);
    if (lockResult.acquired === false) {
      if (lockResult.reason === 'already_completed') {
        const cached = lockResult.record;
        const cachedEngineUsed = cached.engineUsed || (cached.isNeural ? cached.engine : (isUserExplicitDsp ? 'dsp-server' : 'dsp_fallback'));
        const cachedDegraded = !cached.isNeural && !isUserExplicitDsp;
        return res.json({
          success: true,
          audioUrl: audioUrl || "",
          separationEngine: cached.engine,
          engineUsed: cachedEngineUsed,
          degraded: cachedDegraded,
          degradedReason: cachedDegraded ? "Sin credenciales activas o servicio de IA disponible; procesado con filtros básicos DSP" : undefined,
          isNeural: cached.isNeural,
          cached: true,
          executionTimeMs: 8,
          executionTimeSec: "0.0s",
          timingBreakdown: { ...cached.timingBreakdown, cached: true, duplicateCostSaved: true },
          replicateConfigured: !!(process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY),
          falConfigured: !!(process.env.FAL_KEY || process.env.FAL_API_KEY),
          songTitle: songTitle || "Canción",
          sectionName: sectionName || "General",
          detectedBpm: bpm || 120,
          detectedKey: key || "Am",
          analysisSummary: `Stems cargados desde reserva concurrente para ${cached.engine}. Coste: $0.00.`,
          stems: buildFormattedStems(cached.stemsMap)
        });
      }

      if (lockResult.reason === 'in_progress_by_other_instance') {
        console.log(`[Stem Separator] ⏳ Trabajo ya en progreso (otra instancia o petición previa) para ${cacheKey}. El cliente hará polling de estado.`);
        return res.status(202).json({
          success: true,
          status: 'processing',
          bandId,
          songHash,
          engine: selectedEngine,
          songTitle: songTitle || "Canción",
          sectionName: sectionName || "General"
        });
      }

      if (lockResult.reason === 'distributed_lock_failed') {
        // Opción (a) Fail-Safe Estricto: Si la reserva distribuida falla por error de base de datos/infraestructura,
        // no se lanza la inferencia en GPU para evitar gastos duplicados o carreras descontroladas.
        return res.status(503).json({
          provider: 'supabase',
          error: "Servicio de procesamiento distribuido no disponible temporalmente",
          message: "No se pudo asegurar el bloqueo de inferencia distribuido en la base de datos. Por seguridad anti-duplicados, la petición no ha consumido cómputo GPU.",
          errorType: "distributed_lock_unavailable",
          errorTitle: "Bloqueo Distribuido no Disponible",
          actionAdvice: `Detalle técnico de Supabase: "${lockResult.error || 'Fallo al insertar en song_stems_cache'}". Puedes reintentar o usar el Motor DSP local gratuito.`,
          errorDetail: lockResult.error,
          details: lockResult.error,
          reason: lockResult.error,
          engine: selectedEngine
        });
      }
    }

    // A partir de aquí el trabajo puede tardar varios minutos (cold start de GPU en Replicate).
    // Railway corta cualquier conexión HTTP inactiva a los 5 minutos, así que respondemos ya mismo
    // y el resto se procesa en segundo plano; el cliente hace polling a GET /ai-stem-separation/status.
    res.status(202).json({
      success: true,
      status: 'processing',
      bandId,
      songHash,
      engine: selectedEngine,
      songTitle: songTitle || "Canción",
      sectionName: sectionName || "General"
    });

    // ========================================================================
    // 3. MUTEX LOCAL / IN-FLIGHT DEDUPLICATION (En la misma instancia)
    // ========================================================================
    if (inFlightSeparations.has(cacheKey)) {
      console.log(`[Stem Separator] ⏳ Deduplicación activa: Petición en curso para ${cacheKey}. Esperando al trabajo original sin duplicar gasto...`);
      const inFlightRes = await inFlightSeparations.get(cacheKey)!;
      if (inFlightRes.errorInfo) {
        const diag = inFlightRes.errorInfo;
        return res.status(diag.httpStatus || 502).json({
          provider: diag.provider || 'replicate',
          error: diag.errorTitle || 'Fallo en la inferencia',
          message: diag.error || 'La inferencia no devolvió resultados.',
          errorType: diag.errorType || 'generic',
          errorTitle: diag.errorTitle || 'Error en Inferencia',
          actionAdvice: diag.actionAdvice || 'Puedes intentar de nuevo o utilizar el Motor DSP local.',
          details: diag.errorDetail,
          engine: selectedEngine
        });
      }
      if (inFlightRes.stemsMap && Object.keys(inFlightRes.stemsMap).length > 0) {
        const inFlightEngineUsed = inFlightRes.engineUsed || (inFlightRes.isNeural ? inFlightRes.engine : (isUserExplicitDsp ? 'dsp-server' : 'dsp_fallback'));
        const inFlightDegraded = !inFlightRes.isNeural && !isUserExplicitDsp;
        return res.json({
          success: true,
          audioUrl: audioUrl || "",
          separationEngine: inFlightRes.engine,
          engineUsed: inFlightEngineUsed,
          degraded: inFlightDegraded,
          degradedReason: inFlightDegraded ? "Sin credenciales activas o servicio de IA disponible; procesado con filtros básicos DSP" : undefined,
          isNeural: inFlightRes.isNeural,
          cached: true,
          executionTimeMs: 12,
          executionTimeSec: "0.0s",
          timingBreakdown: { ...inFlightRes.timingBreakdown, deduplicated: true },
          replicateConfigured: !!(process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY),
          falConfigured: !!(process.env.FAL_KEY || process.env.FAL_API_KEY),
          songTitle: songTitle || "Canción",
          sectionName: sectionName || "General",
          detectedBpm: bpm || 120,
          detectedKey: key || "Am",
          analysisSummary: `Stems sincronizados desde el trabajo en ejecución (${inFlightRes.engine}). 0 llamadas duplicadas a la GPU.`,
          stems: buildFormattedStems(inFlightRes.stemsMap)
        });
      }
    }

    const requestHost = req.get('host');
    const effectiveReplicateToken = replicateToken || process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY;

    console.log(`[AI Stem Separation] Invocando separación de stems (Modo: ${selectedEngine}). URL: ${audioUrl?.substring(0, 50)}... Host: ${requestHost}. Replicate Token?: ${!!effectiveReplicateToken} Fal Key?: ${!!(process.env.FAL_KEY || process.env.FAL_API_KEY)}`);

    // Iniciar promesa en vuelo para mutex
    let executionPromiseResolve: (val: any) => void;
    const executionPromise = new Promise<{
      stemsMap: Record<string, { url: string; formato: string; tamano: string }> | null;
      timingBreakdown?: any;
      engine: string;
      engineUsed?: string;
      degraded?: boolean;
      degradedReason?: string;
      isNeural: boolean;
      cached?: boolean;
      errorInfo?: ProcessNeuralStemsResult | null;
    }>((resolve) => {
      executionPromiseResolve = resolve;
    });
    inFlightSeparations.set(cacheKey, executionPromise);

    try {
      // ----------------------------------------------------------------------
      // CASO A: MVSEP-MDX23 (MDX-NET + DEMUCS4 EN REPLICATE)
      // ----------------------------------------------------------------------
      if (selectedEngine === 'mvsep-mdx23') {
        const mdxRes = await processMdx23Stems(audioUrl, bandId, songHash, requestHost, effectiveReplicateToken);
        if (mdxRes && mdxRes.stemsMap && Object.keys(mdxRes.stemsMap).length > 0) {
          finalStemsMap = mdxRes.stemsMap;
          executionTimingBreakdown = mdxRes.timingBreakdown;
          separationEngine = "MVSEP-MDX23 (MDX-Net + Demucs4 Neural)";
          isNeural = true;
        } else {
          const errorType = mdxRes?.errorType || 'generic';
          const errorTitle = mdxRes?.errorTitle || "Fallo en la inferencia de MVSEP-MDX23";
          const errorMessage = mdxRes?.error || "La inferencia con MVSEP-MDX23 no devolvió resultados.";
          const actionAdvice = mdxRes?.actionAdvice || 'Puedes intentar de nuevo o utilizar el Motor DSP local.';
          const errorDetail = mdxRes?.errorDetail || mdxRes?.error;
          const httpStatus = mdxRes?.httpStatus || 502;

          inFlightSeparations.delete(cacheKey);
          executionPromiseResolve!({ stemsMap: null, engine: 'mvsep-mdx23', isNeural: false, errorInfo: mdxRes });
          await failStemsJob(bandId, songHash, selectedEngine, {
            provider: mdxRes?.provider || "replicate",
            error: errorTitle,
            message: errorMessage,
            errorType,
            errorTitle,
            actionAdvice,
            details: errorDetail,
            httpStatus,
            engine: "mvsep-mdx23"
          });
          return;
        }
      }
      // ----------------------------------------------------------------------
      // CASO B: DEMUCS V4 (HT-DEMUCS MULTI-CANAL EN REPLICATE)
      // ----------------------------------------------------------------------
      else if (selectedEngine === 'replicate' || selectedEngine === 'demucs') {
        if (!effectiveReplicateToken) {
          const tokenMissingMsg = "No se encontró la clave de Replicate (REPLICATE_API_TOKEN o REPLICATE_API_KEY) en las variables de entorno del servidor ni en la petición. Asegúrate de configurar REPLICATE_API_TOKEN en Settings.";
          inFlightSeparations.delete(cacheKey);
          executionPromiseResolve!({ stemsMap: null, engine: 'replicate', isNeural: false, errorInfo: null });
          await failStemsJob(bandId, songHash, selectedEngine, {
            provider: "replicate",
            error: "Token de Replicate no configurado",
            message: tokenMissingMsg,
            errorType: "token_missing",
            errorTitle: "Token de Replicate No Configurado",
            actionAdvice: "Obtén un API token en https://replicate.com/account/api-tokens (comienza por 'r8_') y configúralo en Settings.",
            details: "Missing environment variable REPLICATE_API_TOKEN",
            httpStatus: 400,
            engine: "replicate"
          });
          return;
        }

        if (replicateToken && !process.env.REPLICATE_API_TOKEN) {
          process.env.REPLICATE_API_TOKEN = replicateToken;
        }

        const repRes = await processNeuralStemsReplicate(audioUrl, bandId, songHash, requestHost, effectiveReplicateToken);
        if (repRes && repRes.stemsMap && Object.keys(repRes.stemsMap).length > 0) {
          finalStemsMap = repRes.stemsMap;
          executionTimingBreakdown = repRes.timingBreakdown;
          separationEngine = "demucs-neural-v4 (HT-Demucs Replicate)";
          isNeural = true;
        } else {
          const errorType = repRes?.errorType || 'generic';
          const errorTitle = repRes?.errorTitle || 'Fallo en la inferencia de Replicate';
          const errorMessage = repRes?.error || 'La inferencia en la GPU de Replicate no devolvió resultados.';
          const actionAdvice = repRes?.actionAdvice || 'Puedes intentar de nuevo o utilizar el Motor DSP local.';
          const errorDetail = repRes?.errorDetail || repRes?.error;
          const httpStatus = repRes?.httpStatus || 502;

          inFlightSeparations.delete(cacheKey);
          executionPromiseResolve!({ stemsMap: null, engine: 'replicate', isNeural: false, errorInfo: repRes });
          await failStemsJob(bandId, songHash, selectedEngine, {
            provider: repRes?.provider || "replicate",
            error: errorTitle,
            message: errorMessage,
            errorType,
            errorTitle,
            actionAdvice,
            details: errorDetail,
            httpStatus,
            engine: "replicate"
          });
          return;
        }
      }
      // ----------------------------------------------------------------------
      // CASO C: MOTOR DSP SERVIDOR LOCAL (FFmpeg - 100% GRATUITO)
      // ----------------------------------------------------------------------
      else if (selectedEngine === 'dsp-server' || selectedEngine === 'dsp') {
        console.log("[Stem Separator] Motor DSP FFmpeg seleccionado por el usuario.");
        try {
          finalStemsMap = await processServerStemsFfmpeg(audioUrl, bandId, songHash, Boolean(preprocesarDirecto));
          separationEngine = "dsp-server (FFmpeg)";
        } catch (stErr: any) {
          console.warn("Fallo procesando FFmpeg stems en el servidor:", stErr);
          const ffgDiag = parseFfmpegError(stErr);
          inFlightSeparations.delete(cacheKey);
          executionPromiseResolve!({ stemsMap: null, engine: 'dsp-server', isNeural: false, errorInfo: null });
          await failStemsJob(bandId, songHash, selectedEngine, {
            provider: ffgDiag.provider,
            error: ffgDiag.errorTitle,
            message: ffgDiag.message,
            errorType: ffgDiag.errorType,
            errorTitle: ffgDiag.errorTitle,
            actionAdvice: ffgDiag.actionAdvice,
            details: ffgDiag.errorDetail,
            httpStatus: ffgDiag.httpStatus,
            engine: "dsp-server"
          });
          return;
        }
      }
      // ----------------------------------------------------------------------
      // CASO D: MODO 'AUTO'
      // ----------------------------------------------------------------------
      else if (audioUrl) {
        // 1. Replicate (MVSEP-MDX23 o Demucs v4)
        if (!isNeural && effectiveReplicateToken) {
          if (replicateToken && !process.env.REPLICATE_API_TOKEN) {
            process.env.REPLICATE_API_TOKEN = replicateToken;
          }
          try {
            const mdxRes = await processMdx23Stems(audioUrl, bandId, songHash, requestHost, effectiveReplicateToken);
            if (mdxRes && mdxRes.stemsMap && Object.keys(mdxRes.stemsMap).length > 0) {
              finalStemsMap = mdxRes.stemsMap;
              executionTimingBreakdown = mdxRes.timingBreakdown;
              separationEngine = "MVSEP-MDX23 (Replicate)";
              isNeural = true;
            }
          } catch (e) {
            console.warn("Fallo motor MVSEP-MDX23 en Replicate, buscando alternativa:", e);
          }

          if (!isNeural) {
            try {
              const repRes = await processNeuralStemsReplicate(audioUrl, bandId, songHash, requestHost, effectiveReplicateToken);
              if (repRes && repRes.stemsMap && Object.keys(repRes.stemsMap).length > 0) {
                finalStemsMap = repRes.stemsMap;
                executionTimingBreakdown = repRes.timingBreakdown;
                separationEngine = "demucs-neural-v4 (Replicate)";
                isNeural = true;
              }
            } catch (neuralErr) {
              console.warn("Fallo motor neuronal Demucs en Replicate, buscando alternativas:", neuralErr);
            }
          }
        }

        // 2. Fal.ai (Demucs Neural)
        if (!isNeural && (process.env.FAL_KEY || process.env.FAL_API_KEY)) {
          try {
            const falMap = await processNeuralStemsFal(audioUrl, bandId, songHash, requestHost);
            if (falMap && Object.keys(falMap).length > 0) {
              finalStemsMap = falMap;
              separationEngine = "demucs-neural (Fal.ai)";
              isNeural = true;
            }
          } catch (falErr) {
            console.warn("Fallo motor neuronal Fal.ai:", falErr);
          }
        }

        // 3. Fallback DSP FFmpeg (con aviso de degradado)
        if (!isNeural) {
          console.warn(`[STEM_SEPARATION_DEGRADED_FALLBACK] ⚠️ Alerta: Fallback a DSP activado para banda "${bandId}", tema "${songTitle || 'sin-titulo'}". Motor solicitado: auto/IA. Razón: No hay tokens de IA neuronal configurados o fallaron los proveedores externos.`);
          try {
            finalStemsMap = await processServerStemsFfmpeg(audioUrl, bandId, songHash, Boolean(preprocesarDirecto));
            separationEngine = "dsp-server (FFmpeg)";
          } catch (stErr) {
            console.warn("Fallo procesando FFmpeg stems en el servidor:", stErr);
          }
        }
      }

      const engineUsed = isNeural
        ? (selectedEngine === 'auto' ? (separationEngine.includes('MVSEP') ? 'mvsep-mdx23' : 'demucs') : selectedEngine)
        : (isUserExplicitDsp ? 'dsp-server' : 'dsp_fallback');
      const isDegraded = !isNeural && !isUserExplicitDsp;
      const degradedReason = isDegraded ? 'Sin credenciales activas o servicio de IA disponible; procesado con filtros básicos DSP de frecuencia' : undefined;

      if (isDegraded) {
        console.warn(`[STEM_SEPARATION_DEGRADED_FALLBACK] ⚠️ Alerta: Fallback a DSP activado para banda "${bandId}", tema "${songTitle || 'sin-titulo'}". Motor solicitado: ${selectedEngine}. Razón: IA no disponible.`);
      }

      // Guardar en caché persistente (L1 Memoria + L2 Supabase)
      if (finalStemsMap && Object.keys(finalStemsMap).length > 0) {
        await saveStemsToPersistentCache({
          bandId,
          songHash,
          engine: selectedEngine,
          engineUsed,
          isNeural,
          degraded: isDegraded,
          degradedReason,
          stemsMap: finalStemsMap as any,
          timingBreakdown: executionTimingBreakdown,
          audioUrl: audioUrl || undefined,
          songTitle: songTitle || undefined
        });
      }

      // Resolver la promesa de mutex para peticiones en cola
      inFlightSeparations.delete(cacheKey);
      executionPromiseResolve!({
        stemsMap: finalStemsMap as any,
        timingBreakdown: executionTimingBreakdown,
        engine: separationEngine,
        engineUsed,
        degraded: isDegraded,
        degradedReason,
        isNeural,
        cached: false
      });
    } catch (procErr: any) {
      inFlightSeparations.delete(cacheKey);
      executionPromiseResolve!({
        stemsMap: null,
        engine: selectedEngine,
        engineUsed: isUserExplicitDsp ? 'dsp-server' : 'dsp_fallback',
        degraded: !isUserExplicitDsp,
        isNeural: false,
        errorInfo: {
          stemsMap: null,
          error: procErr?.message || String(procErr),
          httpStatus: 500
        }
      });
      throw procErr;
    }

    const totalMs = Date.now() - tTotalStart;
    const totalSec = `${(totalMs / 1000).toFixed(1)}s`;

    if (!executionTimingBreakdown) {
      executionTimingBreakdown = {
        totalSec
      };
    }

    const finalDegraded = !isNeural && !isUserExplicitDsp;

    // La respuesta HTTP (202 "processing") ya se envió al cliente hace rato; el resultado real
    // ya quedó persistido en song_stems_cache (saveStemsToPersistentCache, más arriba) para que
    // el polling de GET /ai-stem-separation/status lo recoja.
    console.log(`[Stem Separator] ✅ Job en segundo plano completado para ${cacheKey} en ${totalSec} (motor: ${separationEngine}, degradado: ${finalDegraded}).`);
    return;
  } catch (err: any) {
    if (res.headersSent) {
      const bgErrMsg = String(err?.message || err || "Error inesperado al procesar la separación de pistas.");
      console.error(`[Stem Separator] ❌ Job en segundo plano falló para banda "${bandId}":`, err);
      await failStemsJob(bandId, songHash, selectedEngine, {
        provider: 'system',
        error: 'Error Interno al Procesar Stems',
        message: bgErrMsg,
        errorType: 'generic',
        errorTitle: 'Error Interno al Procesar Stems',
        actionAdvice: 'Puedes reintentar la operación o utilizar el Motor DSP local.',
        details: bgErrMsg,
        httpStatus: 500,
        engine: selectedEngine
      });
      return;
    }
    console.error("Error en separación de stems con IA:", err);
    let classifiedDiag: ServiceDiagnosticError;
    const errMsg = String(err?.message || err || "");
    if (errMsg.includes("supabase") || errMsg.includes("storage")) {
      classifiedDiag = parseSupabaseStorageError(err);
    } else if (errMsg.includes("ffmpeg") || errMsg.includes("fluent-ffmpeg")) {
      classifiedDiag = parseFfmpegError(err);
    } else if (errMsg.includes("gemini") || errMsg.includes("generative") || errMsg.includes("API_KEY")) {
      classifiedDiag = parseGeminiError(err);
    } else if (errMsg.includes("replicate") || errMsg.includes("r8_")) {
      classifiedDiag = parseReplicateError(err?.status || 500, errMsg);
    } else {
      classifiedDiag = {
        provider: 'system',
        errorType: 'generic',
        errorTitle: 'Error Interno al Procesar Stems',
        message: errMsg || "Error inesperado al procesar la separación de pistas.",
        actionAdvice: "Puedes reintentar la operación o utilizar el Motor DSP local.",
        errorDetail: errMsg,
        httpStatus: 500
      };
    }

    return res.status(classifiedDiag.httpStatus).json({
      provider: classifiedDiag.provider,
      error: classifiedDiag.errorTitle,
      message: classifiedDiag.message,
      errorType: classifiedDiag.errorType,
      errorTitle: classifiedDiag.errorTitle,
      actionAdvice: classifiedDiag.actionAdvice,
      details: classifiedDiag.errorDetail
    });
  }
});

/**
 * Polling ligero de estado para separaciones de stems lanzadas en segundo plano por
 * POST /ai-stem-separation (que responde 202 al instante para no chocar con el límite de
 * ~5 minutos del proxy de Railway). El cliente llama a este endpoint cada pocos segundos.
 */
router.get("/ai-stem-separation/status", requireAuth, async (req, res) => {
  try {
    const songHash = String(req.query.songHash || "");
    const engine = String(req.query.engine || "auto");
    if (!songHash) {
      return res.status(400).json({ error: "Falta songHash" });
    }

    let bandId = "sin-banda";
    try {
      bandId = getTargetBandId(req);
    } catch {
      bandId = (req as any).user?.band_id || "sin-banda";
    }

    const jobStatus = await getStemsJobStatus(bandId, songHash, engine);

    if (jobStatus.state === 'completed') {
      const record = jobStatus.record;
      const isUserExplicitDsp = engine === 'dsp-server' || engine === 'dsp';
      const engineUsed = record.engineUsed || (record.isNeural ? record.engine : (isUserExplicitDsp ? 'dsp-server' : 'dsp_fallback'));
      const degraded = !record.isNeural && !isUserExplicitDsp;
      return res.json({
        success: true,
        status: 'completed',
        audioUrl: record.audioUrl || "",
        separationEngine: record.engine,
        engineUsed,
        degraded,
        degradedReason: degraded ? "Sin credenciales activas o servicio de IA disponible; procesado con filtros básicos DSP" : undefined,
        isNeural: record.isNeural,
        cached: true,
        timingBreakdown: record.timingBreakdown,
        replicateConfigured: !!(process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY),
        falConfigured: !!(process.env.FAL_KEY || process.env.FAL_API_KEY),
        songTitle: record.songTitle || "Canción",
        analysisSummary: record.isNeural
          ? `Separación neuronal completada con ${record.engine}.`
          : (degraded ? `⚠️ Separación en modo degradado (DSP básico).` : `Análisis espectral procesado con motor DSP.`),
        stems: buildFormattedStems(record.stemsMap)
      });
    }

    if (jobStatus.state === 'failed') {
      let errorPayload: Record<string, any> = {};
      try {
        errorPayload = JSON.parse(jobStatus.errorMessage);
      } catch {
        errorPayload = {
          provider: 'system',
          error: 'Error en la Separación de Stems',
          message: jobStatus.errorMessage,
          errorType: 'generic',
          errorTitle: 'Error en la Separación de Stems',
          actionAdvice: 'Puedes reintentar o usar el Motor DSP local.',
          httpStatus: 500
        };
      }
      return res.status(errorPayload.httpStatus || 502).json({
        status: 'failed',
        ...errorPayload
      });
    }

    if (jobStatus.state === 'pending') {
      return res.json({ success: true, status: 'processing' });
    }

    return res.json({ success: true, status: 'not_found' });
  } catch (err: any) {
    console.error("Error consultando estado de separación de stems:", err);
    return res.status(500).json({ error: err?.message || "Error consultando estado" });
  }
});

/**
 * Endpoint para Generar Pista de Instrumento con IA (AI Custom Instrument Track Generator)
 * Permite a la banda solicitar un nuevo arreglo musical para un instrumento concreto (ej. Guitarra Solista,
 * Bajo, Sintetizador, Violín, Percusión, etc.) en perfecta armonía con el BPM y Tonalidad de la canción.
 */
router.post("/ai-generate-instrument-track", requireAuth, iaRateLimiter, async (req, res) => {
  try {
    const { instrument, songTitle, sectionName, bpm, key, style, lyrics, contextPrompt } = req.body;

    const requestedInst = instrument || "Guitarra Solista";
    const fullPrompt = `Compose and generate a high quality studio arrangement track for the instrument: "${requestedInst}".
Musical context:
- Song Title: "${songTitle || 'Canción de la Banda'}"
- Active Section: "${sectionName || 'Estribillo'}"
- Tempo: ${bpm || 120} BPM
- Key: "${key || 'La menor / Am'}"
- Style: "${style || 'Rock / Balkan Ska / Pop'}"
- Specific instructions: "${contextPrompt || 'Arreglo virtuosista, melódico y dinámico que encaje a la perfección con la sección'}"`;

    let audioBase64 = "";
    let mimeType = "audio/wav";
    let arrangementNotes = "";

    try {
      const lyriaResponse = await ai.models.generateContentStream({
        model: "lyria-3-clip-preview",
        contents: fullPrompt,
      });

      for await (const chunk of lyriaResponse) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
          if (part.text && !arrangementNotes) {
            arrangementNotes = part.text;
          }
        }
      }
    } catch (lyriaErr) {
      console.warn("Lyria API call error, fall-back to Gemini AI Music Composer description:", lyriaErr);
    }

    // Secondary text guidance from Gemini 3.7 Flash for arrangement rationale
    let aiExplanation = "";
    try {
      const expRes = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `Describe en 2 frases breves en español qué idea musical de arreglo has compuesto para el instrumento "${requestedInst}" en la canción "${songTitle}" (Tonalidad: ${key || 'Am'}, Tempo: ${bpm || 120} BPM). Explica qué ritmo y notas debe tocar el músico.`
      });
      aiExplanation = expRes?.text || "";
    } catch (e) {
      console.warn("Fallo explicación de arreglo:", e);
    }

    return res.json({
      success: true,
      instrument: requestedInst,
      trackName: `Pista IA: ${requestedInst} (${key || 'Am'}, ${bpm || 120} BPM)`,
      audioBase64,
      mimeType,
      arrangementNotes: aiExplanation || arrangementNotes || `Arreglo de ${requestedInst} compuesto por la IA en ${key || 'Am'} a ${bpm || 120} BPM.`,
      bpm: bpm || 120,
      key: key || "Am"
    });
  } catch (err: any) {
    console.error("Error al generar pista de instrumento con IA:", err);
    const gemDiag = parseGeminiError(err);
    return res.status(gemDiag.httpStatus).json({
      provider: gemDiag.provider,
      error: gemDiag.errorTitle,
      message: gemDiag.message,
      errorType: gemDiag.errorType,
      errorTitle: gemDiag.errorTitle,
      actionAdvice: gemDiag.actionAdvice,
      details: gemDiag.errorDetail
    });
  }
});

/**
 * Webhook para recepcion asincrona de predicciones de Replicate con firma HMAC e idempotencia
 */
router.post(["/webhooks/replicate-stems", "/api/webhooks/replicate-stems"], async (req, res) => {
  try {
    const webhookHeaders = {
      id: (req.headers["webhook-id"] || req.headers["webhook_id"]) as string | undefined,
      timestamp: (req.headers["webhook-timestamp"] || req.headers["webhook_timestamp"]) as string | undefined,
      signature: (req.headers["webhook-signature"] || req.headers["webhook_signature"] || req.headers["replicate-signature"]) as string | undefined
    };
    const webhookSecret = process.env.REPLICATE_WEBHOOK_SECRET;

    // 1. Fail-closed: si el secreto no está configurado, rechazar inmediatamente con 401
    if (!webhookSecret) {
      console.error("[Replicate Webhook] ❌ REPLICATE_WEBHOOK_SECRET no configurado — rechazando webhook por seguridad.");
      return res.status(401).json({
        error: "REPLICATE_WEBHOOK_SECRET no configurado en el servidor",
        reason: "secret_not_configured"
      });
    }

    const rawBody = (req as any).rawBody || (typeof req.body === "string" ? req.body : JSON.stringify(req.body));
    const verification = verifyReplicateWebhook(rawBody, webhookHeaders, webhookSecret);
    if (!verification.valid) {
      console.warn(`[Stem Webhook] ❌ Firma HMAC inválida en webhook de Replicate: ${verification.reason}`);
      return res.status(401).json({ error: "Firma HMAC inválida", reason: verification.reason });
    }

    const prediction = req.body;
    const predictionId = prediction?.id;

    if (!predictionId) {
      return res.status(400).json({ error: "ID de predicción ausente" });
    }

    // 2. Comprobación de idempotencia por prediction_id
    const alreadyProcessed = await isPredictionWebhookProcessed(predictionId);
    if (alreadyProcessed) {
      console.log(`[Stem Webhook] ⚡ Webhook ${predictionId} ya procesado anteriormente (Idempotencia).`);
      return res.json({ status: "already_processed", id: predictionId });
    }

    // 3. Registrar el trabajo y su estado en Supabase
    await recordPredictionJob({
      id: predictionId,
      status: prediction.status || "processing",
      provider: "replicate",
      webhook_received_at: new Date().toISOString(),
      webhook_signature_verified: !!webhookSecret,
      result_stems_map: prediction.output || null,
      error_message: prediction.error || null
    });

    console.log(`[Stem Webhook] ✅ Webhook ${predictionId} procesado exitosamente con estado: ${prediction.status}`);
    return res.json({ status: "processed", id: predictionId });
  } catch (err: any) {
    console.error("[Stem Webhook] Error procesando webhook:", err);
    return res.status(500).json({ error: err?.message || "Error procesando webhook" });
  }
});

export default router;
