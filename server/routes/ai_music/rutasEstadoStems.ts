/**
 * Estado de una separación de stems en segundo plano (polling) y diagnóstico de la conexión con Fal.ai.
 */
import express from 'express';
import { requireAuth } from '../../state.js';
import { getTargetBandId } from '../../utils/bandAccess.js';
import { getStemsJobStatus } from '../../db/stemsCache.js';
import { ACTIVE_FAL_KEY } from '../../services/audioSeparator/FalAiService.js';
import { buildFormattedStems } from './formatoStems.js';
import { comoErrorCapturado } from '../../../src/utils/errorCapturado.js';

const router = express.Router();

/**
 * Polling ligero de estado para separaciones de stems lanzadas en segundo plano por
 * POST /ai-stem-separation (que responde 202 al instante para no chocar con el límite de
 * ~5 minutos del proxy de Railway). El cliente llama a este endpoint cada pocos segundos.
 */
router.get('/ai-stem-separation/status', requireAuth, async (req, res) => {
  try {
    const songHash = String(req.query.songHash || '');
    const engine = String(req.query.engine || 'auto');
    if (!songHash) {
      return res.status(400).json({ error: 'Falta songHash' });
    }

    let bandId = 'sin-banda';
    try {
      bandId = getTargetBandId(req);
    } catch {
      bandId = req.user?.band_id || 'sin-banda';
    }

    const jobStatus = await getStemsJobStatus(bandId, songHash, engine);

    if (jobStatus.state === 'completed') {
      const record = jobStatus.record;
      const isUserExplicitDsp = engine === 'dsp-server' || engine === 'dsp';
      const engineUsed =
        record.engineUsed ||
        (record.isNeural
          ? record.engine
          : isUserExplicitDsp
            ? 'dsp-server'
            : 'dsp_fallback');
      const degraded = !record.isNeural && !isUserExplicitDsp;
      return res.json({
        success: true,
        status: 'completed',
        audioUrl: record.audioUrl || '',
        separationEngine: record.engine,
        engineUsed,
        degraded,
        degradedReason: degraded
          ? 'Sin credenciales activas o servicio de IA disponible; procesado con filtros básicos DSP'
          : undefined,
        isNeural: record.isNeural,
        cached: true,
        timingBreakdown: record.timingBreakdown,
        replicateConfigured: !!(
          process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY
        ),
        falConfigured: !!(process.env.FAL_KEY || process.env.FAL_API_KEY),
        songTitle: record.songTitle || 'Canción',
        analysisSummary: record.isNeural
          ? `Separación neuronal completada con ${record.engine}.`
          : degraded
            ? `⚠️ Separación en modo degradado (DSP básico).`
            : `Análisis espectral procesado con motor DSP.`,
        stems: buildFormattedStems(record.stemsMap),
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
          httpStatus: 500,
        };
      }
      return res.status(errorPayload.httpStatus || 502).json({
        status: 'failed',
        ...errorPayload,
      });
    }

    if (jobStatus.state === 'pending') {
      return res.json({ success: true, status: 'processing' });
    }

    return res.json({ success: true, status: 'not_found' });
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error('Error consultando estado de separación de stems:', err);
    return res
      .status(500)
      .json({ error: err?.message || 'Error consultando estado' });
  }
});

/**
 * Endpoint de Diagnóstico en Vivo para Fal.ai
 * Permite verificar qué clave está leyendo el backend y si responde 200 OK con Fal.ai Demucs.
 */
router.get('/ai-stem-separation/fal-diagnostic', requireAuth, async (req, res) => {
  // Cada llamada lanza una petición de pago a fal.ai: solo el admin de la plataforma.
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado.' });
  }
  try {
    let rawKey = (process.env.FAL_KEY || process.env.FAL_API_KEY || '').trim();
    rawKey = rawKey
      .replace(/^["']|["']$/g, '')
      .replace(/^Key\s+/i, '')
      .replace(/^Bearer\s+/i, '')
      .trim();

    const cleanKey =
      !rawKey || rawKey.startsWith('58e0800a') ? ACTIVE_FAL_KEY : rawKey;

    if (!cleanKey) {
      return res.json({
        configured: false,
        message: 'No hay variable FAL_KEY en process.env',
        envVarsFound: {
          FAL_KEY: !!process.env.FAL_KEY,
          FAL_API_KEY: !!process.env.FAL_API_KEY,
        },
      });
    }

    const authHeader = `Key ${cleanKey}`;

    const t0 = Date.now();
    const testAudioUrl =
      'https://raw.githubusercontent.com/mdn/webaudio-examples/main/audio-analyser/viper.mp3';

    let falStatus = 0;
    let falStatusText = '';
    let falBody: any = null;

    try {
      const falRes = await fetch('https://fal.run/fal-ai/demucs', {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio_url: testAudioUrl }),
        signal: AbortSignal.timeout(45000),
      });
      falStatus = falRes.status;
      falStatusText = falRes.statusText;
      falBody = await falRes.json().catch(async () => await falRes.text());
    } catch (netErrCapturado) {
      const netErr = comoErrorCapturado(netErrCapturado);
      falStatusText = `Error de red: ${netErr.message}`;
    }

    const elapsedMs = Date.now() - t0;

    res.json({
      configured: true,
      keyLength: cleanKey.length,
      hasSecret: cleanKey.includes(':'),
      falHttpStatus: falStatus,
      falHttpStatusText: falStatusText,
      elapsedMs,
      isOk: falStatus === 200,
      falResponseSnippet: falBody,
    });
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    res.status(500).json({ error: err.message });
  }
});

export default router;
