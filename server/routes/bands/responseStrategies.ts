// Endpoints para configurar estrategias de respuesta condicionales por banda
// Las bandas pueden definir cómo quieren que el Contestador responda automáticamente
// basado en el tipo de mensaje detectado (negociación, confirmación, rechazo, etc.)

import { Router } from "express";
import { requireAuth } from "../../state.js";
import { getTargetBandId } from "../../utils/bandAccess.js";
import { dbGetAutonomyConfig, dbUpsertAutonomyConfig } from "../../db/autonomy.js";

const router = Router();

// GET /api/bands/response-strategies
// Obtener las estrategias de respuesta configuradas de la banda
router.get("/response-strategies", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const config = await dbGetAutonomyConfig(bandId);

    if (!config) {
      return res.json({ responseStrategies: {} });
    }

    res.json({
      responseStrategies: config.responseStrategies || {}
    });
  } catch (err) {
    console.error("[ResponseStrategies] Error fetching:", err);
    res.status(500).json({ error: "Error fetching response strategies" });
  }
});

// POST /api/bands/response-strategies
// Guardar/actualizar estrategias de respuesta para la banda
interface ResponseStrategy {
  responseType: "price_negotiation" | "confirmation" | "rejection" | "follow_up";
  guidancePrompt?: string;
  tone?: "neutral" | "enthusiastic" | "cautious";
  mentionLinks?: boolean;
}

interface UpdateResponseStrategiesBody {
  strategies: Record<string, ResponseStrategy>;
}

router.post("/response-strategies", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const { strategies } = req.body as UpdateResponseStrategiesBody;

    if (!strategies || typeof strategies !== "object") {
      return res.status(400).json({ error: "Invalid strategies format" });
    }

    // Validar estructura de cada estrategia
    const validTypes = ["price_negotiation", "confirmation", "rejection", "follow_up"];
    const validTones = ["neutral", "enthusiastic", "cautious"];

    for (const [key, strategy] of Object.entries(strategies)) {
      if (!validTypes.includes(key)) {
        return res.status(400).json({ error: `Invalid response type: ${key}` });
      }

      if (strategy.tone && !validTones.includes(strategy.tone)) {
        return res.status(400).json({ error: `Invalid tone for ${key}: ${strategy.tone}` });
      }

      if (strategy.guidancePrompt && typeof strategy.guidancePrompt !== "string") {
        return res.status(400).json({ error: `guidancePrompt must be string for ${key}` });
      }

      if (strategy.mentionLinks !== undefined && typeof strategy.mentionLinks !== "boolean") {
        return res.status(400).json({ error: `mentionLinks must be boolean for ${key}` });
      }
    }

    // Obtener config actual y fusionar estrategias
    const currentConfig = await dbGetAutonomyConfig(bandId);
    const updatedStrategies = {
      ...(currentConfig?.responseStrategies || {}),
      ...strategies
    };

    // Guardar la configuración actualizada
    await dbUpsertAutonomyConfig(bandId, {
      ...currentConfig,
      responseStrategies: updatedStrategies
    });

    res.json({
      success: true,
      responseStrategies: updatedStrategies,
      message: "Response strategies updated successfully"
    });
  } catch (err) {
    console.error("[ResponseStrategies] Error updating:", err);
    res.status(500).json({ error: "Error updating response strategies" });
  }
});

// DELETE /api/bands/response-strategies/:responseType
// Eliminar una estrategia específica de respuesta
router.delete("/response-strategies/:responseType", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const { responseType } = req.params;

    const validTypes = ["price_negotiation", "confirmation", "rejection", "follow_up"];
    if (!validTypes.includes(responseType)) {
      return res.status(400).json({ error: `Invalid response type: ${responseType}` });
    }

    // Obtener config actual
    const currentConfig = await dbGetAutonomyConfig(bandId);
    if (!currentConfig?.responseStrategies) {
      return res.status(404).json({ error: "No strategies configured" });
    }

    // Eliminar la estrategia específica
    const updatedStrategies = { ...currentConfig.responseStrategies };
    delete updatedStrategies[responseType];

    // Guardar cambios
    await dbUpsertAutonomyConfig(bandId, {
      ...currentConfig,
      responseStrategies: updatedStrategies
    });

    res.json({
      success: true,
      responseStrategies: updatedStrategies,
      message: `Response strategy for ${responseType} deleted`
    });
  } catch (err) {
    console.error("[ResponseStrategies] Error deleting:", err);
    res.status(500).json({ error: "Error deleting response strategy" });
  }
});

export default router;
