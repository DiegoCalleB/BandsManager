// CRUD de hilos de ejemplo que alimentan el tono del Redactor.

import express from "express";
import { requireAuth } from "../../state.js";
import { getTargetBandId } from "../../utils/bandAccess.js";
import { DEFAULT_CATEGORY_TEMPLATES } from "../../promptsManager.js";
import { dbGetExampleThreads, dbCreateExampleThread, dbUpdateExampleThread, dbDeleteExampleThread, type ExampleThreadMessage } from "../../db/exampleThreads.js";

const router = express.Router();

function limpiarMensajes(mensajes: any): ExampleThreadMessage[] {
  if (!Array.isArray(mensajes)) return [];
  return mensajes
    .map((m: any, idx: number): ExampleThreadMessage => ({
      rol: m.rol === "sala" ? "sala" : "banda",
      texto: String(m.texto || "").trim(),
      orden: Number.isFinite(m.orden) ? m.orden : idx
    }))
    .filter((m: ExampleThreadMessage) => m.texto);
}

// GET /api/example-threads?category=salas (category opcional: sin ella devuelve todas las de la banda)
router.get("/example-threads", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const threads = await dbGetExampleThreads(bandId, category);
    res.json({ success: true, threads });
  } catch (error: any) {
    console.error("Error in GET /api/example-threads:", error);
    res.status(500).json({ success: false, error: "Error al obtener los hilos de ejemplo." });
  }
});

router.post("/example-threads", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const { category, titulo, mensajes, resultado, notas } = req.body;

    if (!category || !DEFAULT_CATEGORY_TEMPLATES[category]) {
      return res.status(400).json({ success: false, error: "Categoría no válida." });
    }
    if (!Array.isArray(mensajes) || mensajes.length === 0) {
      return res.status(400).json({ success: false, error: "El hilo necesita al menos un mensaje." });
    }
    const mensajesLimpios = limpiarMensajes(mensajes);
    if (mensajesLimpios.length === 0) {
      return res.status(400).json({ success: false, error: "El hilo necesita al menos un mensaje con texto." });
    }

    const thread = await dbCreateExampleThread(bandId, {
      category,
      titulo,
      mensajes: mensajesLimpios,
      resultado: ["positiva", "negativa", "neutral"].includes(resultado) ? resultado : "positiva",
      notas
    });

    res.json({ success: true, thread });
  } catch (error: any) {
    console.error("Error in POST /api/example-threads:", error);
    res.status(500).json({ success: false, error: error?.message || "Error al guardar el hilo de ejemplo." });
  }
});

router.put("/example-threads/:id", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const { titulo, mensajes, resultado, notas } = req.body;

    const mensajesLimpios = limpiarMensajes(mensajes);
    if (mensajesLimpios.length === 0) {
      return res.status(400).json({ success: false, error: "El hilo necesita al menos un mensaje con texto." });
    }

    const thread = await dbUpdateExampleThread(req.params.id, bandId, {
      titulo,
      mensajes: mensajesLimpios,
      resultado: ["positiva", "negativa", "neutral"].includes(resultado) ? resultado : "positiva",
      notas
    });

    res.json({ success: true, thread });
  } catch (error: any) {
    console.error("Error in PUT /api/example-threads/:id:", error);
    res.status(500).json({ success: false, error: error?.message || "Error al actualizar el hilo de ejemplo." });
  }
});

router.delete("/example-threads/:id", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    await dbDeleteExampleThread(req.params.id, bandId);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error in DELETE /api/example-threads/:id:", error);
    res.status(500).json({ success: false, error: error?.message || "Error al borrar el hilo de ejemplo." });
  }
});

export default router;
