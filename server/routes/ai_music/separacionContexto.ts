/**
 * Contexto de una petición de separación de stems (banda, tema, motor y credenciales resueltos) y
 * las respuestas que comparten sus distintos desenlaces: caché, trabajo en curso y error.
 */
import crypto from 'crypto';
import type express from 'express';
import type { StemsCacheRecord } from '../../db/stemsCache.js';
import { ACTIVE_FAL_KEY } from '../../services/audioSeparator/FalAiService.js';
import { getTargetBandId } from '../../utils/bandAccess.js';
import { parseFalError, parseReplicateError, type ServiceDiagnosticError } from './diagnosticos.js';
import { parseFfmpegError, parseGeminiError, parseSupabaseStorageError } from './diagnosticosInfra.js';
import { buildFormattedStems } from './formatoStems.js';

/** Cuerpo que envía el cliente (Iris / Song Studio). */
interface CuerpoSeparacion {
  songTitle?: string;
  sectionName?: string;
  audioUrl?: string;
  bpm?: number;
  key?: string;
  forceEngine?: string;
  engine?: string;
  forceNeural?: boolean;
  replicateToken?: string;
  falKey?: string;
  falApiKey?: string;
  preprocesarDirecto?: boolean;
  requestedStems?: string[];
  /** El usuario pide separar de nuevo: no se reutiliza la separación guardada. */
  forzar?: boolean;
}

/** Todo lo que necesita un motor de separación, ya resuelto y validado. */
export interface ContextoSeparacion {
  songTitle?: string;
  sectionName?: string;
  audioUrl: string;
  bpm?: number;
  key?: string;
  requestedStems?: string[];
  preprocesarDirecto: boolean;
  /** Motor pedido: 'auto', 'fal', 'mvsep-mdx23', 'demucs', 'replicate', 'dsp-server'… */
  selectedEngine: string;
  /** Separar de nuevo aunque haya una separación guardada. */
  forzar: boolean;
  /** El usuario eligió DSP a propósito: no es un resultado «degradado». */
  isUserExplicitDsp: boolean;
  bandId: string;
  songHash: string;
  cacheKey: string;
  effectiveFalKey: string;
  effectiveReplicateToken?: string;
  requestHost?: string;
}

/**
 * Resuelve el contexto de la petición. La banda sale siempre de la sesión (`getTargetBandId`,
 * que ignora una banda ajena pedida por cabecera o cuerpo): nunca se lee ni escribe caché de otra.
 */
export function contextoDesdePeticion(req: express.Request): ContextoSeparacion {
  const cuerpo = (req.body || {}) as CuerpoSeparacion;
  const rawFal = (cuerpo.falKey || cuerpo.falApiKey || process.env.FAL_KEY || process.env.FAL_API_KEY || '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^Key\s+/i, '')
    .replace(/^Bearer\s+/i, '')
    .trim();
  const selectedEngine = cuerpo.forceEngine || cuerpo.engine || (cuerpo.forceNeural ? 'replicate' : 'auto');

  let bandId: string;
  try {
    bandId = getTargetBandId(req);
  } catch {
    bandId = (req as express.Request & { user?: { band_id?: string } }).user?.band_id || 'sin-banda';
  }
  const songHash = crypto
    .createHash('md5')
    .update(String(cuerpo.songTitle || '') + String(cuerpo.audioUrl || ''))
    .digest('hex')
    .substring(0, 10);

  return {
    songTitle: cuerpo.songTitle,
    sectionName: cuerpo.sectionName,
    audioUrl: cuerpo.audioUrl as string,
    bpm: cuerpo.bpm,
    key: cuerpo.key,
    requestedStems: cuerpo.requestedStems,
    preprocesarDirecto: Boolean(cuerpo.preprocesarDirecto),
    selectedEngine,
    forzar: cuerpo.forzar === true,
    isUserExplicitDsp: selectedEngine === 'dsp-server' || selectedEngine === 'dsp',
    bandId,
    songHash,
    cacheKey: `${bandId}:${songHash}:${selectedEngine}`,
    effectiveFalKey: !rawFal || rawFal.startsWith('58e0800a') ? ACTIVE_FAL_KEY : rawFal,
    effectiveReplicateToken: cuerpo.replicateToken || process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY,
    requestHost: req.get('host'),
  };
}

/** Respuesta con los stems ya separados (caché persistente o reserva ya completada): coste 0. */
export function respuestaDesdeCache(registro: StemsCacheRecord, ctx: ContextoSeparacion, analysisSummary: string) {
  const engineUsed =
    registro.engineUsed || (registro.isNeural ? registro.engine : ctx.isUserExplicitDsp ? 'dsp-server' : 'dsp_fallback');
  const degraded = !registro.isNeural && !ctx.isUserExplicitDsp;
  return {
    success: true,
    audioUrl: ctx.audioUrl || '',
    separationEngine: registro.engine,
    engineUsed,
    degraded,
    degradedReason: degraded
      ? 'Sin credenciales activas o servicio de IA disponible; procesado con filtros básicos DSP'
      : undefined,
    isNeural: registro.isNeural,
    cached: true,
    executionTimeMs: 8,
    executionTimeSec: '0.0s',
    timingBreakdown: { ...registro.timingBreakdown, cached: true, duplicateCostSaved: true },
    replicateConfigured: !!(process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY),
    falConfigured: !!(process.env.FAL_KEY || process.env.FAL_API_KEY),
    songTitle: ctx.songTitle || 'Canción',
    sectionName: ctx.sectionName || 'General',
    detectedBpm: ctx.bpm || 120,
    detectedKey: ctx.key || 'Am',
    analysisSummary,
    stems: buildFormattedStems(registro.stemsMap),
  };
}

/** Respuesta 202: el trabajo sigue en segundo plano y el cliente consulta /ai-stem-separation/status. */
export function respuestaProcesando(ctx: ContextoSeparacion) {
  return {
    success: true,
    status: 'processing',
    bandId: ctx.bandId,
    songHash: ctx.songHash,
    engine: ctx.selectedEngine,
    songTitle: ctx.songTitle || 'Canción',
    sectionName: ctx.sectionName || 'General',
  };
}

/** Error con los campos que añaden los proveedores al lanzar. */
interface ErrorDeProveedor {
  message?: string;
  status?: number;
  rawDetail?: string;
  isLocked?: boolean;
}

/**
 * Clasifica un error inesperado de la separación según el servicio que lo provocó.
 * @param err Error capturado.
 * @param selectedEngine Motor pedido (un fallo con Fal elegido se diagnostica como de Fal).
 */
export function diagnosticarErrorDeSeparacion(err: unknown, selectedEngine: string): ServiceDiagnosticError {
  const e = (err ?? {}) as ErrorDeProveedor;
  const errMsg = String(e.message || err || '');
  if (
    selectedEngine === 'fal' ||
    errMsg.includes('Fal.ai') ||
    errMsg.includes('fal.ai') ||
    errMsg.includes('fal.run') ||
    errMsg.includes('TOP_UP') ||
    e.isLocked
  ) {
    return parseFalError(e.status || (errMsg.includes('TOP_UP') ? 403 : 500), e.rawDetail || errMsg);
  }
  if (errMsg.includes('supabase') || errMsg.includes('storage')) return parseSupabaseStorageError(err);
  if (errMsg.includes('ffmpeg') || errMsg.includes('fluent-ffmpeg')) return parseFfmpegError(err);
  if (errMsg.includes('gemini') || errMsg.includes('generative') || errMsg.includes('API_KEY')) return parseGeminiError(err);
  if (errMsg.includes('replicate') || errMsg.includes('r8_')) return parseReplicateError(e.status || 500, errMsg);
  return {
    provider: 'system',
    errorType: 'generic',
    errorTitle: 'Error Interno al Procesar Stems',
    message: errMsg || 'Error inesperado al procesar la separación de pistas.',
    actionAdvice: 'Puedes reintentar la operación o utilizar el Motor DSP local.',
    errorDetail: errMsg,
    httpStatus: 500,
  };
}
