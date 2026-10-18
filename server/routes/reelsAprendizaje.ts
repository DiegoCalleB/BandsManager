// Reels · aprendizaje: lo que han medido los Reels publicados de la banda y qué formato toca.
// Se monta desde `routes/reels.ts`, así que comparte su prefijo (/api).

import express, { type Request, type Response } from "express";
import { requireAuth } from "../state.js";
import { getTargetBandId } from "../utils/bandAccess.js";
import { aprendizajeDeBanda, resumenSemanalDeBanda } from "../services/metricasReels.js";
import { responderError } from "../utils/errorHttp.js";

const router = express.Router();

/**
 * GET /api/reels/aprendizaje
 * Resumen de las métricas reales (rewatch, compartir, guardar) y el formato recomendado.
 */
router.get("/reels/aprendizaje", requireAuth, async (req: Request, res: Response) => {
  try {
    const aprendizaje = await aprendizajeDeBanda(getTargetBandId(req));
    return res.json({ success: true, ...aprendizaje });
  } catch (err) {
    return responderError(res, err, "No se pudo cargar lo aprendido de tus Reels.");
  }
});

/**
 * GET /api/reels/resumen-semanal
 * Los Reels que mejor han funcionado esta semana y qué formato probar después.
 */
router.get("/reels/resumen-semanal", requireAuth, async (req: Request, res: Response) => {
  try {
    return res.json({ success: true, ...(await resumenSemanalDeBanda(getTargetBandId(req))) });
  } catch (err) {
    return responderError(res, err, "No se pudo preparar el resumen de la semana.");
  }
});

export default router;
