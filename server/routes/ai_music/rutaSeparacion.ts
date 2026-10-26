/**
 * POST /ai-stem-separation: separa un tema en stems (voz, batería, bajo…) con el motor pedido.
 *
 * Orden de comprobaciones, todas por banda (la de la sesión, nunca la del cuerpo):
 * 1. caché persistente (L1 memoria + L2 Supabase): coste 0;
 * 2. reserva distribuida en Supabase: otra instancia ya lo está haciendo o ya lo hizo;
 * 3. deduplicación en esta instancia.
 * Si hay que separar, responde 202 al instante y el trabajo sigue en segundo plano; el cliente
 * consulta GET /ai-stem-separation/status (el proxy de Railway corta a ~5 min).
 */
import express from 'express';
import { acquireStemsSeparationLock, getStemsFromPersistentCache, saveStemsToPersistentCache } from '../../db/stemsCache.js';
import { iaRateLimiter } from '../../middleware/rateLimiter.js';
import { requireAuth } from '../../state.js';
import { inFlightSeparations, type ResultadoSeparacionEnVuelo } from './cacheStems.js';
import { detalleTecnico } from './detalleTecnico.js';
import { failStemsJob } from './formatoStems.js';
import {
  contextoDesdePeticion,
  diagnosticarErrorDeSeparacion,
  respuestaDesdeCache,
  respuestaProcesando,
  type ContextoSeparacion,
} from './separacionContexto.js';
import { ejecutarMotor } from './separacionMotores.js';

const router = express.Router();

/**
 * Separa en segundo plano y deja el resultado (o el fallo) en la caché persistente para el polling.
 * Las peticiones duplicadas de esta instancia esperan la misma promesa.
 */
async function separarEnSegundoPlano(ctx: ContextoSeparacion, inicio: number): Promise<void> {
  let resolver!: (r: ResultadoSeparacionEnVuelo) => void;
  inFlightSeparations.set(ctx.cacheKey, new Promise<ResultadoSeparacionEnVuelo>((r) => (resolver = r)));
  const terminar = (r: ResultadoSeparacionEnVuelo) => {
    inFlightSeparations.delete(ctx.cacheKey);
    resolver(r);
  };

  let resultado;
  try {
    resultado = await ejecutarMotor(ctx);
    if (!resultado.ok) {
      terminar({ stemsMap: null, engine: resultado.engine, isNeural: false, errorInfo: resultado.errorInfo });
      await failStemsJob(ctx.bandId, ctx.songHash, ctx.selectedEngine, resultado.fallo);
      return;
    }

    const { stemsMap, separationEngine, isNeural, timingBreakdown } = resultado;
    const engineUsed = isNeural
      ? ctx.selectedEngine === 'auto'
        ? separationEngine.includes('MVSEP')
          ? 'mvsep-mdx23'
          : 'demucs'
        : ctx.selectedEngine
      : ctx.isUserExplicitDsp
        ? 'dsp-server'
        : 'dsp_fallback';
    const isDegraded = !isNeural && !ctx.isUserExplicitDsp;
    const degradedReason = isDegraded
      ? 'Sin credenciales activas o servicio de IA disponible; procesado con filtros básicos DSP de frecuencia'
      : undefined;
    if (isDegraded) {
      console.warn(
        "[STEM_SEPARATION_DEGRADED_FALLBACK] ⚠️ Alerta: Fallback a DSP activado para banda \"%s\", tema \"%s\". Motor solicitado: %s. Razón: IA no disponible.", ctx.bandId, ctx.songTitle || 'sin-titulo', ctx.selectedEngine,
      );
    }

    const hayStems = Object.keys(stemsMap).length > 0;
    if (hayStems) {
      await saveStemsToPersistentCache({
        bandId: ctx.bandId,
        songHash: ctx.songHash,
        engine: ctx.selectedEngine,
        engineUsed,
        isNeural,
        degraded: isDegraded,
        degradedReason,
        stemsMap,
        timingBreakdown,
        audioUrl: ctx.audioUrl || undefined,
        songTitle: ctx.songTitle || undefined,
      });
    } else {
      // Ningún motor devolvió stems ni lanzó excepción: sin esto el lock se quedaba en 'pending'
      // y el cliente hacía polling hasta 20 min antes de rendirse.
      await failStemsJob(ctx.bandId, ctx.songHash, ctx.selectedEngine, {
        provider: 'system',
        error: 'Sin resultado',
        message: 'Ningún motor de separación devolvió pistas para esta canción.',
        errorType: 'empty_result',
        errorTitle: 'La separación no produjo pistas',
        actionAdvice: 'Reintenta, prueba otro motor de Iris o usa el motor DSP local.',
        details: 'finalStemsMap vacío tras recorrer todos los motores disponibles',
        httpStatus: 502,
        engine: ctx.selectedEngine,
      });
    }

    terminar({ stemsMap, timingBreakdown, engine: separationEngine, engineUsed, degraded: isDegraded, degradedReason, isNeural, cached: false });
  } catch (procErr) {
    terminar({
      stemsMap: null,
      engine: ctx.selectedEngine,
      engineUsed: ctx.isUserExplicitDsp ? 'dsp-server' : 'dsp_fallback',
      degraded: !ctx.isUserExplicitDsp,
      isNeural: false,
      errorInfo: { stemsMap: null, error: procErr instanceof Error ? procErr.message : String(procErr), httpStatus: 500 },
    });
    throw procErr;
  }

  const totalSec = `${((Date.now() - inicio) / 1000).toFixed(1)}s`;
  console.log(
    "[Stem Separator] ✅ Job en segundo plano completado para %s en %s (motor: %s, degradado: %s).", ctx.cacheKey, totalSec, resultado.separationEngine, !resultado.isNeural && !ctx.isUserExplicitDsp,
  );
}

router.post('/ai-stem-separation', requireAuth, iaRateLimiter, async (req, res) => {
  const inicio = Date.now();
  let ctx: ContextoSeparacion | null = null;
  try {
    ctx = contextoDesdePeticion(req);

    // 1. Caché persistente (salvo que el usuario pida separar de nuevo).
    const persistentEntry = ctx.forzar ? null : await getStemsFromPersistentCache(ctx.bandId, ctx.songHash, ctx.selectedEngine);
    if (persistentEntry && persistentEntry.stemsMap && Object.keys(persistentEntry.stemsMap).length > 0) {
      console.log(
        "[Stem Separator] ⚡ Cache HIT persistente (L1/L2 Supabase) para %s. 0 llamadas GPU / Replicate. Coste: $0.00.", ctx.cacheKey,
      );
      return res.json(
        respuestaDesdeCache(
          persistentEntry,
          ctx,
          `Stems cargados desde la base de datos persistente para el motor ${persistentEntry.engine}. Coste: 0,00 € (sin consumo de créditos).`,
        ),
      );
    }

    // 2. Reserva distribuida (multi-instancia).
    const lockResult = await acquireStemsSeparationLock(ctx.bandId, ctx.songHash, ctx.selectedEngine, undefined, ctx.forzar);
    if (lockResult.acquired === false) {
      if (lockResult.reason === 'already_completed') {
        return res.json(
          respuestaDesdeCache(lockResult.record, ctx, `Stems cargados desde reserva concurrente para ${lockResult.record.engine}. Coste: 0,00 €.`),
        );
      }
      if (lockResult.reason === 'in_progress_by_other_instance') {
        console.log(
          "[Stem Separator] ⏳ Trabajo ya en progreso (otra instancia o petición previa) para %s. El cliente hará polling de estado.", ctx.cacheKey,
        );
        return res.status(202).json(respuestaProcesando(ctx));
      }
      if (lockResult.reason === 'distributed_lock_failed') {
        // Fail-safe estricto: sin reserva distribuida no se lanza la inferencia en GPU, para no
        // pagar dos veces ni dejar carreras descontroladas.
        return res.status(503).json({
          provider: 'supabase',
          error: 'Servicio de procesamiento distribuido no disponible temporalmente',
          message:
            'No se pudo asegurar el bloqueo de inferencia distribuido en la base de datos. Por seguridad anti-duplicados, la petición no ha consumido cómputo GPU.',
          errorType: 'distributed_lock_unavailable',
          errorTitle: 'Bloqueo Distribuido no Disponible',
          actionAdvice: 'Puedes reintentar o usar el Motor DSP local gratuito.',
          details: detalleTecnico(req, lockResult.error),
          engine: ctx.selectedEngine,
        });
      }
    }

    // 3. Deduplicación en esta instancia.
    if (inFlightSeparations.has(ctx.cacheKey)) {
      console.log(
        "[Stem Separator] ⏳ Deduplicación activa: Petición en curso para %s. El cliente consultará el estado mediante polling.", ctx.cacheKey,
      );
      return res.status(202).json(respuestaProcesando(ctx));
    }

    res.status(202).json(respuestaProcesando(ctx));
    console.log(
      "[AI Stem Separation] Invocando separación de stems (Modo: %s). URL: %s... Host: %s. Replicate Token?: %s Fal Key?: %s", ctx.selectedEngine, ctx.audioUrl?.substring(0, 50), ctx.requestHost, !!ctx.effectiveReplicateToken, !!(process.env.FAL_KEY || process.env.FAL_API_KEY),
    );
    await separarEnSegundoPlano(ctx, inicio);
  } catch (err) {
    const bandId = ctx?.bandId ?? 'sin-banda';
    const songHash = ctx?.songHash ?? '';
    const selectedEngine = ctx?.selectedEngine ?? 'auto';
    const diag = diagnosticarErrorDeSeparacion(err, selectedEngine);

    if (res.headersSent) {
      console.error("[Stem Separator] ❌ Job en segundo plano falló para banda \"%s\":", bandId, err);
      await failStemsJob(bandId, songHash, selectedEngine, {
        provider: diag.provider,
        error: diag.errorTitle,
        message: diag.message,
        errorType: diag.errorType,
        errorTitle: diag.errorTitle,
        actionAdvice: diag.actionAdvice,
        httpStatus: diag.httpStatus,
        engine: selectedEngine,
      });
      return;
    }
    console.error('Error en separación de stems con IA:', err);
    return res.status(diag.httpStatus).json({
      provider: diag.provider,
      error: diag.errorTitle,
      message: diag.message,
      errorType: diag.errorType,
      errorTitle: diag.errorTitle,
      actionAdvice: diag.actionAdvice,
      details: detalleTecnico(req, diag.errorDetail),
    });
  }
});

export default router;
