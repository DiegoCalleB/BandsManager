/**
 * Motores de separación de stems: cada uno recibe el contexto de la petición y devuelve los stems o
 * el fallo con su diagnóstico. El modo «auto» los encadena (Replicate → Fal.ai → DSP local).
 */
import { AudioSeparatorFactory } from '../../services/audioSeparator/index.js';
import type { ProcessNeuralStemsResult, ResultadoSeparacionEnVuelo } from './cacheStems.js';
import { parseFfmpegError } from './diagnosticosInfra.js';
import { processDemucsStems } from './motorDemucs.js';
import { processServerStemsFfmpeg } from './motorFfmpeg.js';
import { processMdx23Stems } from './motorMdx23.js';
import { processNeuralStemsFal, processNeuralStemsReplicate } from './motoresNeuronales.js';
import type { ContextoSeparacion } from './separacionContexto.js';

export type StemsMap = Record<string, { url: string; formato: string; tamano: string }>;

/** Lo que se guarda como fallo del trabajo para que el polling lo enseñe. */
export interface FalloStems {
  provider: string;
  error: string;
  message: string;
  errorType: string;
  errorTitle: string;
  actionAdvice: string;
  details?: string;
  httpStatus: number;
  engine: string;
}

export type ResultadoMotor =
  | { ok: true; stemsMap: StemsMap; timingBreakdown?: unknown; separationEngine: string; isNeural: boolean }
  | { ok: false; engine: string; errorInfo: ResultadoSeparacionEnVuelo['errorInfo']; fallo: FalloStems };

const conStems = (m: StemsMap | null | undefined): m is StemsMap => !!m && Object.keys(m).length > 0;

const SIN_STEMS: ResultadoMotor = { ok: true, stemsMap: {}, separationEngine: 'dsp-server', isNeural: false };

function falloDeReplicate(
  res: ProcessNeuralStemsResult | null,
  engine: string,
  tituloPorDefecto: string,
  mensajePorDefecto: string,
): ResultadoMotor {
  const errorTitle = res?.errorTitle || tituloPorDefecto;
  return {
    ok: false,
    engine,
    errorInfo: res,
    fallo: {
      provider: res?.provider || 'replicate',
      error: errorTitle,
      message: res?.error || mensajePorDefecto,
      errorType: res?.errorType || 'generic',
      errorTitle,
      actionAdvice: res?.actionAdvice || 'Puedes intentar de nuevo o utilizar el Motor DSP local.',
      details: res?.errorDetail || res?.error,
      httpStatus: res?.httpStatus || 502,
      engine,
    },
  };
}

function sinTokenDeReplicate(engine: string): ResultadoMotor {
  return {
    ok: false,
    engine,
    errorInfo: null,
    fallo: {
      provider: 'replicate',
      error: 'Token de Replicate no configurado',
      message:
        'No se encontró la clave de Replicate (REPLICATE_API_TOKEN o REPLICATE_API_KEY) en las variables de entorno del servidor ni en la petición. Asegúrate de configurar REPLICATE_API_TOKEN en Settings.',
      errorType: 'token_missing',
      errorTitle: 'Token de Replicate No Configurado',
      actionAdvice:
        "Obtén un API token en https://replicate.com/account/api-tokens (comienza por 'r8_') y configúralo en Settings.",
      details: 'Missing environment variable REPLICATE_API_TOKEN',
      httpStatus: 400,
      engine,
    },
  };
}

const opcionesDeServicio = (ctx: ContextoSeparacion) => ({
  bandId: ctx.bandId,
  songHash: ctx.songHash,
  songTitle: ctx.songTitle,
  sectionName: ctx.sectionName,
  bpm: ctx.bpm,
  key: ctx.key,
  requestHost: ctx.requestHost,
  requestedStems: ctx.requestedStems,
});

/** Fal.ai (Demucs en GPU A100, ~10-15 s) con caída a Replicate Demucs y, si no, a DSP local. */
async function motorFal(ctx: ContextoSeparacion): Promise<ResultadoMotor> {
  const falRes = await AudioSeparatorFactory.getService('fal').processAudio(ctx.audioUrl, {
    ...opcionesDeServicio(ctx),
    falKey: ctx.effectiveFalKey,
  });
  if (falRes.success && conStems(falRes.stemsMap)) {
    return { ok: true, stemsMap: falRes.stemsMap, timingBreakdown: falRes.timingBreakdown, separationEngine: 'Fal.ai Demucs (GPU A100)', isNeural: true };
  }
  console.warn(
    `[Fal.ai Failover] ⚠️ Inferencia en Fal.ai no disponible (${falRes.errorTitle || falRes.error}). Intentando failover inteligente a motor secundario...`,
  );

  if (ctx.effectiveReplicateToken) {
    console.log(`[Fal.ai Failover] 🔄 Conmutando a Replicate HT-Demucs v4...`);
    const demucsRes = await processDemucsStems(ctx.audioUrl, ctx.bandId, ctx.songHash, ctx.requestHost, ctx.effectiveReplicateToken);
    if (demucsRes && conStems(demucsRes.stemsMap)) {
      return { ok: true, stemsMap: demucsRes.stemsMap, timingBreakdown: demucsRes.timingBreakdown, separationEngine: 'HT-Demucs v4 (Replicate Failover)', isNeural: true };
    }
  }

  console.log(`[Fal.ai Failover] 🔄 Conmutando a Motor DSP Local FFmpeg...`);
  const dspRes = await AudioSeparatorFactory.getService('dsp-server').processAudio(ctx.audioUrl, opcionesDeServicio(ctx));
  if (dspRes.success && conStems(dspRes.stemsMap)) {
    return { ok: true, stemsMap: dspRes.stemsMap, timingBreakdown: dspRes.timingBreakdown, separationEngine: 'Motor DSP Local (Failover por Fal.ai)', isNeural: false };
  }
  return {
    ok: false,
    engine: 'fal',
    errorInfo: falRes,
    fallo: {
      provider: falRes.provider || 'fal',
      error: falRes.errorTitle || 'Fallo en Fal.ai API',
      message: falRes.error || 'La inferencia con Fal.ai no devolvió resultados.',
      errorType: 'fal_error',
      errorTitle: falRes.errorTitle || 'Error en Fal.ai API',
      actionAdvice: falRes.actionAdvice || 'Prueba con Replicate o Motor DSP local.',
      details: falRes.errorDetail || falRes.error,
      httpStatus: falRes.httpStatus || 502,
      engine: 'fal',
    },
  };
}

/** MVSEP-MDX23 (MDX-Net + Demucs4) en Replicate. */
async function motorMdx23(ctx: ContextoSeparacion): Promise<ResultadoMotor> {
  const res = await processMdx23Stems(ctx.audioUrl, ctx.bandId, ctx.songHash, ctx.requestHost, ctx.effectiveReplicateToken);
  if (res && conStems(res.stemsMap)) {
    return { ok: true, stemsMap: res.stemsMap, timingBreakdown: res.timingBreakdown, separationEngine: 'MVSEP-MDX23 (MDX-Net + Demucs4 Neural)', isNeural: true };
  }
  return falloDeReplicate(res, 'mvsep-mdx23', 'Fallo en la inferencia de MVSEP-MDX23', 'La inferencia con MVSEP-MDX23 no devolvió resultados.');
}

/** HT-Demucs v4 multicanal en Replicate. */
async function motorDemucs(ctx: ContextoSeparacion): Promise<ResultadoMotor> {
  if (!ctx.effectiveReplicateToken) return sinTokenDeReplicate('demucs');
  const res = await processDemucsStems(ctx.audioUrl, ctx.bandId, ctx.songHash, ctx.requestHost, ctx.effectiveReplicateToken);
  if (res && conStems(res.stemsMap)) {
    return { ok: true, stemsMap: res.stemsMap, timingBreakdown: res.timingBreakdown, separationEngine: 'demucs-neural-v4 (HT-Demucs Replicate)', isNeural: true };
  }
  return falloDeReplicate(res, 'demucs', 'Fallo en la inferencia de Demucs v4', 'La inferencia en la GPU de Replicate no devolvió resultados.');
}

/** Replicate: MDX23 como principal con caída automática a Demucs v4. */
async function motorReplicate(ctx: ContextoSeparacion): Promise<ResultadoMotor> {
  if (!ctx.effectiveReplicateToken) return sinTokenDeReplicate('replicate');
  const res = await processNeuralStemsReplicate(ctx.audioUrl, ctx.bandId, ctx.songHash, ctx.requestHost, ctx.effectiveReplicateToken);
  if (res && conStems(res.stemsMap)) {
    const separationEngine = res.engine === 'mvsep-mdx23' ? 'MVSEP-MDX23 (MDX-Net + Demucs4 Neural)' : 'demucs-neural-v4 (HT-Demucs Replicate)';
    return { ok: true, stemsMap: res.stemsMap, timingBreakdown: res.timingBreakdown, separationEngine, isNeural: true };
  }
  return falloDeReplicate(res, 'replicate', 'Fallo en la inferencia de Replicate', 'La inferencia en la GPU de Replicate no devolvió resultados.');
}

/** DSP local con FFmpeg, elegido por el usuario (gratis, sin GPU). */
async function motorDsp(ctx: ContextoSeparacion): Promise<ResultadoMotor> {
  console.log('[Stem Separator] Motor DSP FFmpeg seleccionado por el usuario.');
  try {
    const stemsMap = await processServerStemsFfmpeg(ctx.audioUrl, ctx.bandId, ctx.songHash, ctx.preprocesarDirecto, ctx.requestedStems);
    return { ok: true, stemsMap, separationEngine: 'dsp-server (FFmpeg)', isNeural: false };
  } catch (stErr) {
    console.warn('Fallo procesando FFmpeg stems en el servidor:', stErr);
    const diag = parseFfmpegError(stErr);
    return {
      ok: false,
      engine: 'dsp-server',
      errorInfo: null,
      fallo: {
        provider: diag.provider,
        error: diag.errorTitle,
        message: diag.message,
        errorType: diag.errorType,
        errorTitle: diag.errorTitle,
        actionAdvice: diag.actionAdvice,
        details: diag.errorDetail,
        httpStatus: diag.httpStatus,
        engine: 'dsp-server',
      },
    };
  }
}

/** Modo «auto»: Replicate → Fal.ai → DSP local (este último avisa de resultado degradado). */
async function motorAuto(ctx: ContextoSeparacion): Promise<ResultadoMotor> {
  if (ctx.effectiveReplicateToken) {
    try {
      const res = await processNeuralStemsReplicate(ctx.audioUrl, ctx.bandId, ctx.songHash, ctx.requestHost, ctx.effectiveReplicateToken);
      if (res && conStems(res.stemsMap)) {
        const separationEngine = res.engine === 'mvsep-mdx23' ? 'MVSEP-MDX23 (Replicate)' : 'demucs-neural-v4 (Replicate)';
        return { ok: true, stemsMap: res.stemsMap, timingBreakdown: res.timingBreakdown, separationEngine, isNeural: true };
      }
    } catch (neuralErr) {
      console.warn('Fallo motor neuronal Replicate (MDX23/Demucs), buscando alternativas:', neuralErr);
    }
  }

  if (process.env.FAL_KEY || process.env.FAL_API_KEY) {
    try {
      const falMap = await processNeuralStemsFal(ctx.audioUrl, ctx.bandId, ctx.songHash, ctx.requestHost);
      if (conStems(falMap)) return { ok: true, stemsMap: falMap, separationEngine: 'demucs-neural (Fal.ai)', isNeural: true };
    } catch (falErr) {
      console.warn('Fallo motor neuronal Fal.ai:', falErr);
    }
  }

  console.warn(
    `[STEM_SEPARATION_DEGRADED_FALLBACK] ⚠️ Alerta: Fallback a DSP activado para banda "${ctx.bandId}", tema "${ctx.songTitle || 'sin-titulo'}". Motor solicitado: auto/IA. Razón: No hay tokens de IA neuronal configurados o fallaron los proveedores externos.`,
  );
  try {
    const stemsMap = await processServerStemsFfmpeg(ctx.audioUrl, ctx.bandId, ctx.songHash, ctx.preprocesarDirecto, ctx.requestedStems);
    return { ok: true, stemsMap, separationEngine: 'dsp-server (FFmpeg)', isNeural: false };
  } catch (stErr) {
    console.warn('Fallo procesando FFmpeg stems en el servidor:', stErr);
    return SIN_STEMS;
  }
}

/**
 * Ejecuta el motor pedido. Un resultado `ok` puede venir sin stems (todos los proveedores de «auto»
 * fallaron, o no hay audio): quien llama lo registra como fallo «empty_result».
 */
export function ejecutarMotor(ctx: ContextoSeparacion): Promise<ResultadoMotor> {
  switch (ctx.selectedEngine) {
    case 'fal':
    case 'fal-ai':
      return motorFal(ctx);
    case 'mvsep-mdx23':
      return motorMdx23(ctx);
    case 'demucs':
      return motorDemucs(ctx);
    case 'replicate':
      return motorReplicate(ctx);
    case 'dsp-server':
    case 'dsp':
      return motorDsp(ctx);
    default:
      return ctx.audioUrl ? motorAuto(ctx) : Promise.resolve(SIN_STEMS);
  }
}
