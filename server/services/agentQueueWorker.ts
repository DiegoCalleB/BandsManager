// Worker Engine para la procesación distribuida de la cola de agentes de IA.
// Consume trabajos de agent_jobs_queue de manera asíncrona, desacoplando los agentes de la API web.

import {
  fetchNextPendingJob,
  completeAgentJob,
  failAgentJob,
  pruneOldJobs,
  onAgentJobEnqueued,
  AgentJob
} from "./agentQueueService.js";
import { runLectorAgent } from "./lectorAgent.js";
import { runEnviadorAgent, logAgentExecution } from "./agentEngine.js";
import { EmailAgentError } from "./emailAgentClient.js";
import { syncActiveCampaignsRadar } from "./campaignRadarScheduler.js";
import { reconcileStaleStemPredictions } from "./stemPredictionReconciler.js";
import { captureError } from "../utils/errorTracking.js";
import { bandHasEmailConfigured } from "./agentScheduler.js";

const WORKER_ID = `worker_${process.pid}_${Math.random().toString(36).substring(2, 6)}`;
// En reposo, duerme por defecto 24 horas (o configurable con AGENT_WORKER_POLL_MS).
// Cuando se encola un trabajo, onAgentJobEnqueued() despierta al worker inmediatamente.
const POLL_INTERVAL_MS = Number(process.env.AGENT_WORKER_POLL_MS) || (24 * 60 * 60 * 1000);
let isWorkerRunning = false;
let workerLoopTimeout: NodeJS.Timeout | null = null;

/**
 * Procesa un trabajo individual según su tipo de agente.
 */
async function processSingleJob(job: AgentJob): Promise<void> {
  const startTime = Date.now();
  console.log(`[AgentQueueWorker] [${WORKER_ID}] Iniciando trabajo ${job.id} (${job.agent_type}) para banda ${job.band_id}...`);

  try {
    let resultDetails: Record<string, any> = {};

    switch (job.agent_type) {
      case "lector_inbox_check": {
        const tieneEmail = await bandHasEmailConfigured(job.band_id);
        if (!tieneEmail) {
          resultDetails = { skipped: true, reason: "no_email_account_configured" };
          break;
        }

        const resultado = await runLectorAgent(job.band_id);
        resultDetails = resultado;

        // Auditoría estructurada si hubo novedades
        if (resultado.mensajesLeidos > 0 || resultado.borradoresEnviadosDetectados > 0 || resultado.borradorIaGenerados > 0) {
          await logAgentExecution({
            band_id: job.band_id,
            agente: "lector",
            motor: "worker_queue",
            disparado_por_tipo: "queue",
            estado: resultado.borradorIaFallidos > 0 ? "warning" : "success",
            mensaje: `Worker Lector: ${resultado.mensajesLeidos} mensaje(s) procesado(s), ${resultado.leadsActualizados.length} lead(s) actualizado(s).`,
            conteo_afectados: resultado.leadsActualizados.length,
            duracion_ms: Date.now() - startTime,
            detalles: resultado
          });
        }
        break;
      }

      case "redactor_pitch_dispatch": {
        const tieneEmail = await bandHasEmailConfigured(job.band_id);
        if (!tieneEmail) {
          resultDetails = { skipped: true, reason: "no_email_account_configured" };
          break;
        }

        await runEnviadorAgent({ bandId: job.band_id, triggerType: "scheduler" });
        resultDetails = { status: "dispatched" };
        break;
      }

      case "campaign_radar_sync": {
        await syncActiveCampaignsRadar();
        resultDetails = { status: "radar_synced" };
        break;
      }

      default: {
        console.log(`[AgentQueueWorker] Trabajo con tipo personalizado '${job.agent_type}' ejecutado.`);
        resultDetails = { payload: job.payload };
        break;
      }
    }

    const durationMs = Date.now() - startTime;
    await completeAgentJob(job.id, { ...resultDetails, duration_ms: durationMs });
    console.log(`[AgentQueueWorker] [${WORKER_ID}] Trabajo ${job.id} completado con éxito en ${durationMs}ms.`);

  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    const errorMsg = err?.message || String(err);

    console.error(`[AgentQueueWorker] [${WORKER_ID}] Error procesando trabajo ${job.id}:`, errorMsg);
    const isRateLimit = String(errorMsg).includes("429") || String(errorMsg).includes("RESOURCE_EXHAUSTED") || String(errorMsg).includes("Rate Limit");

    if (!isRateLimit) {
      captureError(err, { jobId: job.id, agentType: job.agent_type, bandId: job.band_id });
    }

    // Ignorar log de auditoría en fallos comunes por falta de credenciales email
    const sinCuenta = err instanceof EmailAgentError && err.code === "no_token";
    if (!sinCuenta) {
      await logAgentExecution({
        band_id: job.band_id,
        agente: (job.agent_type.split("_")[0] as any) || "sistema",
        motor: "worker_queue",
        disparado_por_tipo: "queue",
        estado: isRateLimit ? "warning" : "error",
        mensaje: isRateLimit
          ? `Worker Lector: Enfriamiento temporal activado por límite de peticiones de Google (429 RESOURCE_EXHAUSTED). Reanudará automáticamente.`
          : `Worker Queue fallo en trabajo ${job.id} (Intento ${job.attempts + 1}/${job.max_attempts}): ${errorMsg}`,
        duracion_ms: durationMs
      });
    }

    await failAgentJob(job.id, errorMsg, job.attempts, job.max_attempts);
  }
}

/**
 * Bucle principal de ejecución del worker.
 */
async function workerLoop(): Promise<void> {
  if (!isWorkerRunning) return;

  try {
    const job = await fetchNextPendingJob(WORKER_ID);

    if (job) {
      await processSingleJob(job);
      // Re-ejecutar inmediatamente para consumir trabajos pendientes en ráfaga
      setImmediate(() => workerLoop());
      return;
    }
  } catch (err) {
    console.warn(`[AgentQueueWorker] Error en el loop del worker:`, err);
  }

  // Si no hay trabajos o hubo un error transitorio, esperar al siguiente intervalo (24h en reposo)
  if (isWorkerRunning) {
    workerLoopTimeout = setTimeout(workerLoop, POLL_INTERVAL_MS);
  }
}

/**
 * Despierta inmediatamente al worker si estaba en reposo para procesar un nuevo trabajo recibido.
 */
export function wakeWorker(): void {
  if (!isWorkerRunning) return;
  if (workerLoopTimeout) {
    clearTimeout(workerLoopTimeout);
    workerLoopTimeout = null;
  }
  setImmediate(() => {
    workerLoop().catch((err) => {
      console.warn("[AgentQueueWorker] Error tras despertar worker:", err);
    });
  });
}

/**
 * Inicia el proceso worker en segundo plano.
 */
export function startAgentQueueWorker(): void {
  if (isWorkerRunning) return;
  isWorkerRunning = true;
  console.log(`[AgentQueueWorker] Iniciado worker ${WORKER_ID} - cola reactiva basada en eventos (sondeo reposo: ${Math.round(POLL_INTERVAL_MS / (60 * 60 * 1000))}h).`);

  // Conectar con el publicador: despertar al worker en cuanto entre cualquier trabajo
  onAgentJobEnqueued(() => {
    wakeWorker();
  });

  // Tarea secundaria periódica para reconciliar estados antiguos (stems/predicciones) cada 24 horas
  setInterval(() => {
    reconcileStaleStemPredictions(5).catch((e) => {
      console.warn("[AgentQueueWorker] Error en reconciliación periódica de stems:", e);
    });
  }, 24 * 60 * 60 * 1000);

  // Tarea de mantenimiento: Poda automática de tareas antiguas (Auto-Vacuum / Retention) cada 24 horas
  setInterval(() => {
    pruneOldJobs(7, 30).catch((e) => {
      console.warn("[AgentQueueWorker] Error en poda automática periódica:", e);
    });
  }, 24 * 60 * 60 * 1000);

  // Ejecución inicial diferida de poda ligera al arrancar
  setTimeout(() => {
    pruneOldJobs(7, 30).catch(() => {});
  }, 30000);

  workerLoop();
}

/**
 * Detiene el worker limpiamente.
 */
export function stopAgentQueueWorker(): void {
  isWorkerRunning = false;
  if (workerLoopTimeout) {
    clearTimeout(workerLoopTimeout);
    workerLoopTimeout = null;
  }
  console.log(`[AgentQueueWorker] Worker ${WORKER_ID} detenido.`);
}
