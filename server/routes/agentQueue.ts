import express from "express";
import { requireAuth } from "../state.js";
import { getTargetBandId } from "../utils/bandAccess.js";
import {
  enqueueAgentJob,
  getQueueStats,
  getDetailedQueueMetrics,
  pruneOldJobs
} from "../services/agentQueueService.js";

const router = express.Router();

/**
 * GET /api/agent-queue/stats
 * Devuelve métricas en tiempo real de la cola de trabajos de agentes (pending, processing, completed, failed)
 */
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const stats = await getQueueStats(bandId);
    return res.json({ success: true, stats });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || "Error al obtener estadísticas de la cola." });
  }
});

/**
 * GET /api/agent-queue/metrics
 * Telemetría completa: estadísticas, estado del worker y últimos 10 trabajos ejecutados
 */
router.get("/metrics", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const data = await getDetailedQueueMetrics(bandId);
    return res.json({ success: true, ...data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || "Error al obtener métricas de telemetría." });
  }
});

/**
 * POST /api/agent-queue/prune
 * Ejecuta la poda manual de trabajos antiguos (Auto-Vacuum)
 */
router.post("/prune", requireAuth, async (req, res) => {
  try {
    const { completedDays = 7, failedDays = 30 } = req.body;
    const deletedCount = await pruneOldJobs(Number(completedDays), Number(failedDays));
    return res.json({ success: true, deletedCount, message: `Poda completada: ${deletedCount} trabajo(s) eliminados.` });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || "Error al podar la cola." });
  }
});

/**
 * POST /api/agent-queue/enqueue
 * Permite encolar un trabajo de agente bajo demanda con reintentos
 */
router.post("/enqueue", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const { agentType, payload } = req.body;

    if (!agentType) {
      return res.status(400).json({ success: false, error: "Se requiere 'agentType'." });
    }

    const jobId = await enqueueAgentJob({
      bandId,
      agentType,
      payload
    });

    return res.json({ success: true, jobId, message: `Trabajo ${jobId} encolado para el agente '${agentType}'.` });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || "Error al encolar el trabajo." });
  }
});

export default router;
