// Reels · programación: el próximo hueco que respeta la cadencia de la banda.
// Se monta desde `routes/reels.ts`, así que comparte su prefijo (/api).

import express, { type Request, type Response } from "express";
import { requireAuth } from "../state.js";
import { getTargetBandId } from "../utils/bandAccess.js";
import { dbGetSocialPosts } from "../db/social.js";
import { dbGetBandSchedule } from "../db/schedule.js";
import { dbOrigenesDeClips } from "../db/reelClips.js";
import { proponerHueco } from "../utils/cadenciaReels.js";
import { canonicalYouTubeUrl, getYouTubeId } from "../services/youtubeMeta.js";
import { responderError } from "../utils/errorHttp.js";

const router = express.Router();
const PLATAFORMAS = ["Instagram", "TikTok", "YouTube", "Facebook"] as const;

/**
 * GET /api/reels/proximo-hueco?plataforma=Instagram&videoOrigen=<url del vídeo fuente>
 * Un Reel por día y plataforma, 48 h entre clips del mismo vídeo y la mejor hora conocida.
 */
router.get("/reels/proximo-hueco", requireAuth, async (req: Request, res: Response) => {
  try {
    const bandId = getTargetBandId(req);
    const plataforma = PLATAFORMAS.find((p) => p === req.query.plataforma) ?? "Instagram";
    const crudo = typeof req.query.videoOrigen === "string" ? req.query.videoOrigen.slice(0, 500) : "";
    // Los clips guardan la URL canónica de YouTube como origen: se compara igual.
    const idYoutube = crudo ? getYouTubeId(crudo) : null;
    const videoOrigen = idYoutube ? canonicalYouTubeUrl(idYoutube) : crudo || undefined;
    const [posts, horario] = await Promise.all([dbGetSocialPosts(bandId), dbGetBandSchedule(bandId).catch(() => null)]);
    const urls = posts.map((p) => p.video_url).filter((u): u is string => Boolean(u));
    const origenPorClip = videoOrigen ? await dbOrigenesDeClips(bandId, urls) : {};
    const hueco = proponerHueco({ posts, ahora: new Date(), zona: horario?.timezone, plataforma, videoOrigen, origenPorClip });
    return res.json({ success: true, ...hueco });
  } catch (err) {
    return responderError(res, err, "No se pudo calcular el próximo hueco de publicación.");
  }
});

export default router;
