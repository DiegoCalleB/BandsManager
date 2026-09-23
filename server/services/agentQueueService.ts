// Servicio de Cola de Tareas Distribuidas y Resilientes para Agentes de IA.
// Gestiona el ciclo de vida de los trabajos agénticos (Scout, Lector, Redactor) con
// estado persistido en Supabase (agent_jobs_queue), reintentos con Exponential Backoff,
// concurrencia controlada, retención automática y cero bloqueo del Event Loop de Express.

import { getSupabase } from "../db/core.js";

export type AgentJobType = 
  | "scout_enrichment" 
  | "lector_inbox_check" 
  | "redactor_pitch_dispatch" 
  | "campaign_radar_sync"
  | "custom";

export type AgentJobStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

export interface AgentJob {
  id: string;
  band_id: string;
  agent_type: AgentJobType;
  status: AgentJobStatus;
  payload: Record<string, any>;
  attempts: number;
  max_attempts: number;
  error_message?: string;
  scheduled_at: string;
  started_at?: string;
  completed_at?: string;
  locked_by?: string;
  locked_until?: string;
  created_at: string;
  updated_at: string;
}

// Fallback en memoria si Supabase no está disponible o para entorno offline
const memoryQueue: Map<string, AgentJob> = new Map();

/**
 * Encola un nuevo trabajo de agente.
 * Previene duplicados idénticos en estado 'pending' o 'processing' creados recientemente.
 */
export async function enqueueAgentJob(params: {
  bandId: string;
  agentType: AgentJobType;
  payload?: Record<string, any>;
  scheduledAt?: Date;
  maxAttempts?: number;
}): Promise<string> {
  const { bandId, agentType, payload = {}, scheduledAt = new Date(), maxAttempts = 3 } = params;
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const scheduledIso = scheduledAt.toISOString();

  try {
    const sb = getSupabase();
    if (sb) {
      // Deduplicación preventiva: evitar encolar otro job idéntico si ya hay uno 'pending' para la misma banda/tipo
      const { data: existing } = await sb
        .from("agent_jobs_queue")
        .select("id")
        .eq("band_id", bandId)
        .eq("agent_type", agentType)
        .in("status", ["pending", "processing"])
        .limit(1);

      if (existing && existing.length > 0) {
        return existing[0].id;
      }

      const newJob: Partial<AgentJob> = {
        id: jobId,
        band_id: bandId,
        agent_type: agentType,
        status: "pending",
        payload,
        attempts: 0,
        max_attempts: maxAttempts,
        scheduled_at: scheduledIso,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await sb.from("agent_jobs_queue").insert(newJob);
      if (!error) {
        return jobId;
      }
      console.warn("[AgentQueueService] Error insertando en Supabase, utilizando fallback en memoria:", error.message);
    }
  } catch (err) {
    console.warn("[AgentQueueService] Excepción al contactar Supabase para enqueue, usando fallback:", err);
  }

  // Fallback en memoria
  const memJob: AgentJob = {
    id: jobId,
    band_id: bandId,
    agent_type: agentType,
    status: "pending",
    payload,
    attempts: 0,
    max_attempts: maxAttempts,
    scheduled_at: scheduledIso,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  memoryQueue.set(jobId, memJob);
  return jobId;
}

/**
 * Obtiene y bloquea atómicamente el siguiente trabajo pendiente cuya fecha scheduled_at sea <= NOW().
 */
export async function fetchNextPendingJob(workerId: string): Promise<AgentJob | null> {
  const nowIso = new Date().toISOString();
  const lockUntilIso = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // Bloqueo por 5 min

  try {
    const sb = getSupabase();
    if (sb) {
      // 1. Buscar trabajo pendiente disponible
      const { data: jobs, error } = await sb
        .from("agent_jobs_queue")
        .select("*")
        .eq("status", "pending")
        .lte("scheduled_at", nowIso)
        .order("scheduled_at", { ascending: true })
        .limit(1);

      if (!error && jobs && jobs.length > 0) {
        const candidate = jobs[0] as AgentJob;

        // 2. Intentar bloqueo atómico
        const { data: updated, error: updateErr } = await sb
          .from("agent_jobs_queue")
          .update({
            status: "processing",
            started_at: nowIso,
            locked_by: workerId,
            locked_until: lockUntilIso,
            updated_at: nowIso
          })
          .eq("id", candidate.id)
          .eq("status", "pending") // Garantiza concurrencia segura sin race conditions
          .select()
          .single();

        if (!updateErr && updated) {
          return updated as AgentJob;
        }
      }
    }
  } catch (err) {
    console.warn("[AgentQueueService] Excepción obteniendo trabajo de Supabase:", err);
  }

  // Fallback en memoria
  for (const job of memoryQueue.values()) {
    if (job.status === "pending" && new Date(job.scheduled_at) <= new Date()) {
      job.status = "processing";
      job.started_at = nowIso;
      job.locked_by = workerId;
      job.locked_until = lockUntilIso;
      job.updated_at = nowIso;
      return job;
    }
  }

  return null;
}

/**
 * Marca un trabajo como completado con éxito.
 */
export async function completeAgentJob(jobId: string, resultDetails?: Record<string, any>): Promise<void> {
  const nowIso = new Date().toISOString();

  try {
    const sb = getSupabase();
    if (sb) {
      await sb
        .from("agent_jobs_queue")
        .update({
          status: "completed",
          completed_at: nowIso,
          locked_by: null,
          locked_until: null,
          updated_at: nowIso,
          payload: resultDetails ? { result: resultDetails } : undefined
        })
        .eq("id", jobId);
    }
  } catch (err) {
    console.warn(`[AgentQueueService] Error completando trabajo ${jobId} en Supabase:`, err);
  }

  const memJob = memoryQueue.get(jobId);
  if (memJob) {
    memJob.status = "completed";
    memJob.completed_at = nowIso;
    memJob.updated_at = nowIso;
  }
}

/**
 * Registra un fallo en la ejecución del trabajo. Si le quedan reintentos,
 * programa la re-ejecución con Exponential Backoff (2m, 8m, 32m...).
 */
export async function failAgentJob(
  jobId: string,
  errorMsg: string,
  currentAttempts: number,
  maxAttempts: number
): Promise<void> {
  const nowIso = new Date().toISOString();
  const newAttempts = currentAttempts + 1;
  const isFinalFailure = newAttempts >= maxAttempts;

  // Exponential Backoff: 2 * (4 ^ (intentos - 1)) minutos -> 2 min, 8 min, 32 min...
  const backoffMinutes = Math.pow(4, newAttempts - 1) * 2;
  const nextScheduleIso = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString();

  const nextStatus: AgentJobStatus = isFinalFailure ? "failed" : "pending";

  try {
    const sb = getSupabase();
    if (sb) {
      await sb
        .from("agent_jobs_queue")
        .update({
          status: nextStatus,
          attempts: newAttempts,
          error_message: errorMsg,
          scheduled_at: isFinalFailure ? nowIso : nextScheduleIso,
          completed_at: isFinalFailure ? nowIso : null,
          locked_by: null,
          locked_until: null,
          updated_at: nowIso
        })
        .eq("id", jobId);
    }
  } catch (err) {
    console.warn(`[AgentQueueService] Error marcando fallo en trabajo ${jobId} en Supabase:`, err);
  }

  const memJob = memoryQueue.get(jobId);
  if (memJob) {
    memJob.status = nextStatus;
    memJob.attempts = newAttempts;
    memJob.error_message = errorMsg;
    memJob.scheduled_at = isFinalFailure ? nowIso : nextScheduleIso;
    memJob.updated_at = nowIso;
  }
}

/**
 * Poda y retención automática de trabajos antiguos en la cola (Auto-Vacuum).
 * - Trabajos 'completed': más de 7 días.
 * - Trabajos 'failed' / 'cancelled': más de 30 días.
 */
export async function pruneOldJobs(completedDays = 7, failedDays = 30): Promise<number> {
  let deletedCount = 0;
  const now = Date.now();
  const completedCutoff = new Date(now - completedDays * 24 * 60 * 60 * 1000).toISOString();
  const failedCutoff = new Date(now - failedDays * 24 * 60 * 60 * 1000).toISOString();

  try {
    const sb = getSupabase();
    if (sb) {
      // 1. Eliminar completados antiguos
      const { data: delComp } = await sb
        .from("agent_jobs_queue")
        .delete()
        .eq("status", "completed")
        .lt("completed_at", completedCutoff)
        .select("id");
      
      // 2. Eliminar fallidos antiguos
      const { data: delFail } = await sb
        .from("agent_jobs_queue")
        .delete()
        .in("status", ["failed", "cancelled"])
        .lt("updated_at", failedCutoff)
        .select("id");

      deletedCount = (delComp?.length || 0) + (delFail?.length || 0);
      if (deletedCount > 0) {
        console.log(`[AgentQueueService] Auto-Prune: ${deletedCount} trabajo(s) antiguos podados de Supabase.`);
      }
      return deletedCount;
    }
  } catch (err) {
    console.warn("[AgentQueueService] Error en poda de Supabase, podando memoria:", err);
  }

  // Poda en memoria
  for (const [id, job] of memoryQueue.entries()) {
    if (job.status === "completed" && job.completed_at && job.completed_at < completedCutoff) {
      memoryQueue.delete(id);
      deletedCount++;
    } else if ((job.status === "failed" || job.status === "cancelled") && job.updated_at < failedCutoff) {
      memoryQueue.delete(id);
      deletedCount++;
    }
  }
  return deletedCount;
}

/**
 * Métrica y estadísticas en tiempo real de la cola para el panel de control o Supabase.
 */
export async function getQueueStats(bandId?: string): Promise<{
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}> {
  try {
    const sb = getSupabase();
    if (sb) {
      let query = sb.from("agent_jobs_queue").select("status");
      if (bandId) {
        query = query.eq("band_id", bandId);
      }
      const { data } = await query;
      if (data) {
        const stats = { pending: 0, processing: 0, completed: 0, failed: 0, total: data.length };
        for (const item of data) {
          const s = item.status as keyof typeof stats;
          if (stats[s] !== undefined) stats[s]++;
        }
        return stats;
      }
    }
  } catch (err) {
    console.warn("[AgentQueueService] Error consultando stats de cola en Supabase:", err);
  }

  // Fallback en memoria
  const stats = { pending: 0, processing: 0, completed: 0, failed: 0, total: memoryQueue.size };
  for (const job of memoryQueue.values()) {
    if (!bandId || job.band_id === bandId) {
      const s = job.status as keyof typeof stats;
      if (stats[s] !== undefined) stats[s]++;
    }
  }
  return stats;
}

/**
 * Métricas detalladas de telemetría y lista de trabajos recientes para el Monitor de UI.
 */
export async function getDetailedQueueMetrics(bandId?: string): Promise<{
  stats: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  };
  recentJobs: Array<{
    id: string;
    agent_type: string;
    status: string;
    attempts: number;
    error_message?: string;
    scheduled_at: string;
    completed_at?: string;
    created_at: string;
    duration_ms?: number;
  }>;
  workerOnline: boolean;
}> {
  const stats = await getQueueStats(bandId);
  let recentJobs: any[] = [];

  try {
    const sb = getSupabase();
    if (sb) {
      let query = sb
        .from("agent_jobs_queue")
        .select("id, agent_type, status, attempts, error_message, scheduled_at, completed_at, created_at, payload")
        .order("created_at", { ascending: false })
        .limit(10);

      if (bandId) {
        query = query.eq("band_id", bandId);
      }

      const { data } = await query;
      if (data) {
        recentJobs = data.map((j: any) => ({
          id: j.id,
          agent_type: j.agent_type,
          status: j.status,
          attempts: j.attempts,
          error_message: j.error_message,
          scheduled_at: j.scheduled_at,
          completed_at: j.completed_at,
          created_at: j.created_at,
          duration_ms: j.payload?.result?.duration_ms
        }));
      }
    }
  } catch (err) {
    console.warn("[AgentQueueService] Error obteniendo trabajos recientes de Supabase:", err);
  }

  if (recentJobs.length === 0) {
    // Fallback en memoria
    const memList = Array.from(memoryQueue.values())
      .filter(j => !bandId || j.band_id === bandId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    recentJobs = memList.map(j => ({
      id: j.id,
      agent_type: j.agent_type,
      status: j.status,
      attempts: j.attempts,
      error_message: j.error_message,
      scheduled_at: j.scheduled_at,
      completed_at: j.completed_at,
      created_at: j.created_at,
      duration_ms: j.payload?.result?.duration_ms
    }));
  }

  return {
    stats,
    recentJobs,
    workerOnline: true
  };
}
