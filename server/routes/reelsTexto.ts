// Reels · texto: lo que trabaja sobre el copy y el gancho del reel, no sobre el vídeo.
// Se monta desde `routes/reels.ts`, así que comparte su prefijo (/api).

import express, { type Request, type Response } from "express";
import { requireAuth } from "../state.js";
import { iaRateLimiter } from "../middleware/rateLimiter.js";
import { getTargetBandId } from "../utils/bandAccess.js";
import { perfilDeLaPeticion } from "../services/perfilDeLaPeticion.js";
import { diagnosticarHook } from "../services/hookDoctor.js";
import { perfeccionarCopy } from "../services/copyPerfecto.js";
import { displayBandName } from "../utils/bandProfile.js";
import { esTipoContenido } from "../utils/viralSignals.js";
import type { CopyReel } from "../utils/auditoriaCopyReel.js";
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

/** Texto acotado: lo que no sea string se trata como vacío; lo largo se corta. */
const texto = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

/** Copy actual del corte a partir del cuerpo. null si no trae ni rótulo ni pie: no hay nada que mejorar. */
export function copyDesdeCuerpo(cuerpo: Record<string, unknown>): CopyReel | null {
  const copy: CopyReel = {
    hookText: texto(cuerpo.hookText, 200),
    recommendedCopy: texto(cuerpo.recommendedCopy, 3000),
    copyTikTok: texto(cuerpo.copyTikTok, 1000),
    copyYouTube: texto(cuerpo.copyYouTube, 200),
    copyFacebook: texto(cuerpo.copyFacebook, 3000),
    hashtags: Array.isArray(cuerpo.hashtags) ? cuerpo.hashtags.filter((h): h is string => typeof h === "string").slice(0, 30).map((h) => h.slice(0, 60)) : []
  };
  return copy.hookText.trim() || copy.recommendedCopy.trim() ? copy : null;
}

/**
 * POST /api/reels/copy-perfecto
 * Genera candidatos de copy para un corte, descarta los que rompen reglas (auditoría
 * determinista) y un juez con rúbrica elige el mejor y dos alternativas. Ver services/copyPerfecto.
 */
router.post("/reels/copy-perfecto", requireAuth, iaRateLimiter, async (req: Request, res: Response) => {
  try {
    const bandId = getTargetBandId(req);
    const cuerpo = (req.body || {}) as Record<string, unknown>;
    const actual = copyDesdeCuerpo(cuerpo);
    if (!actual) return res.status(400).json({ success: false, error: "Falta el texto del corte (rótulo o pie) que mejorar." });

    const perfil = await perfilDeLaPeticion(req);
    const resultado = await perfeccionarCopy({
      actual,
      perfil,
      nombreBanda: displayBandName(perfil),
      tipoContenido: esTipoContenido(cuerpo.contentType) ? cuerpo.contentType : "concierto",
      tituloTramo: texto(cuerpo.title, 300),
      motivoTramo: texto(cuerpo.reason, 600) || undefined,
      bandId
    });
    return res.json({ success: true, ...resultado });
  } catch (err) {
    return responderError(res, err, "No se pudo mejorar el copy del corte.");
  }
});

export default router;
