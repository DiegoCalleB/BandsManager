// Worker Engine para la procesación distribuida de la cola de agentes de IA.
// Consume trabajos de agent_jobs_queue de manera asíncrona, desacoplando los agentes de la API web.

import {
  fetchNextPendingJob,
  completeAgentJob,
  failAgentJob,
  pruneOldJobs,
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
const POLL_INTERVAL_MS = 3000; // Sondeo cada 3 segundos cuando no hay trabajos
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

  // Si no hay trabajos o hubo un error transitorio, esperar al siguiente intervalo
  if (isWorkerRunning) {
    workerLoopTimeout = setTimeout(workerLoop, POLL_INTERVAL_MS);
  }
}

/**
 * Inicia el proceso worker en segundo plano.
 */
export function startAgentQueueWorker(): void {
  if (isWorkerRunning) return;
  isWorkerRunning = true;
  console.log(`[AgentQueueWorker] Iniciado worker ${WORKER_ID} - monitoreando cola agent_jobs_queue...`);

  // Tarea secundaria periódica para reconciliar estados antiguos (stems/predicciones)
  setInterval(() => {
    reconcileStaleStemPredictions(5).catch((e) => {
      console.warn("[AgentQueueWorker] Error en reconciliación periódica de stems:", e);
    });
  }, 10 * 60 * 1000);

  // Tarea de mantenimiento: Poda automática de tareas antiguas (Auto-Vacuum / Retention) cada 6 horas
  setInterval(() => {
    pruneOldJobs(7, 30).catch((e) => {
      console.warn("[AgentQueueWorker] Error en poda automática periódica:", e);
    });
  }, 6 * 60 * 60 * 1000);

  // Ejecución inicial de poda ligera al arrancar
  setTimeout(() => {
    pruneOldJobs(7, 30).catch(() => {});
  }, 15000);

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
