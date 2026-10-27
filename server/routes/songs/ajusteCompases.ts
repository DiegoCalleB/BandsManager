// Ajuste de la rejilla de compases: se guarda en el análisis de la canción para toda la banda.

import express from "express";
import { Song } from "../../../src/types.js";
import { requireAuth } from "../../state.js";
import { dbGetSongs, dbGuardarAnalisisAcordes } from "../../db.js";
import { getTargetBandId } from "../../utils/bandAccess.js";
import { validarAjusteCompases } from "../../../src/utils/ajusteCompases.js";
import { comoErrorCapturado } from "../../../src/utils/errorCapturado.js";
import { responderError } from "../../utils/errorHttp.js";

const router = express.Router();

// PATCH ajuste de la rejilla de compases (tempo, dónde cae el «1», 3 o 4 tiempos). Se guarda en el
// análisis de la canción, así lo ve toda la banda y sobrevive a recargar. Ajuste vacío = restablecer.
router.patch("/:id/ajuste-compases", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userBandId = getTargetBandId(req);
    const validacion = validarAjusteCompases(req.body?.ajuste);
    if ("error" in validacion) return res.status(400).json({ error: validacion.error });

    const songs: Song[] = await dbGetSongs(userBandId);
    const song = Array.isArray(songs) ? songs.find((s) => s.id === id) : null;
    if (!song) return res.status(404).json({ error: "Canción no encontrada." });
    if (!song.analisisAcordes) return res.status(409).json({ error: "Esta canción aún no tiene acordes analizados." });

    const { ajusteCompases: _previo, ...resto } = song.analisisAcordes;
    const analisis = Object.keys(validacion.ajuste).length ? { ...resto, ajusteCompases: validacion.ajuste } : resto;
    const guardada = await dbGuardarAnalisisAcordes(id, userBandId, analisis);
    res.json({ success: true, analisis, song: guardada });
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error("Error guardando el ajuste de compases:", err);
    responderError(res, err, "No se pudo guardar el ajuste.");
  }
});

export default router;
