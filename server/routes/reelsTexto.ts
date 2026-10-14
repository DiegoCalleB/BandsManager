// Reels · texto: lo que trabaja sobre el copy y el gancho del reel, no sobre el vídeo.
// Se monta desde `routes/reels.ts`, así que comparte su prefijo (/api).

import express, { type Request, type Response } from "express";
import { requireAuth } from "../state.js";
import { iaRateLimiter } from "../middleware/rateLimiter.js";
import { getTargetBandId } from "../utils/bandAccess.js";
import { perfilDeLaPeticion } from "../services/perfilDeLaPeticion.js";
import { diagnosticarHook } from "../services/hookDoctor.js";
import { responderError } from "../utils/errorHttp.js";

const router = express.Router();

/**
 * POST /api/reels/ai-hook-doctor
 * Escanea el gancho visual y el copy para calcular el Cringe Score (0-100),
 * la retención estimada a los 3 segundos, una mejora automática con el Tone DNA
 * y el "Primer Comentario Fijado (Pinned Comment)" para disparar el debate en el algoritmo.
 */
router.post(["/reels/ai-hook-doctor", "/api/reels/ai-hook-doctor"], requireAuth, iaRateLimiter, async (req: Request, res: Response) => {
  try {
    const bandId = getTargetBandId(req); // exige banda activa en la sesión (falla con 500 si falta)
    const { generatedByAI, diagnosis } = await diagnosticarHook(await perfilDeLaPeticion(req), bandId, req.body || {});
    return res.json({ success: true, generatedByAI, diagnosis });
  } catch (err) {
    return responderError(res, err, "No se pudo completar el diagnóstico del gancho.");
  }
});

export default router;
