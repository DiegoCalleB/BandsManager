// Endpoints para configurar estrategias de respuesta condicionales por banda
// Las bandas pueden definir cómo quieren que el Contestador responda automáticamente
// basado en el tipo de mensaje detectado (negociación, confirmación, rechazo, etc.)

import { Router } from "express";
import { requireAuth } from "../../state.js";
import { getTargetBandId } from "../../utils/bandAccess.js";
import { dbGetAutonomyConfig, dbUpsertAutonomyConfig } from "../../db/autonomy.js";

const router = Router();

// Única fuente de verdad para los tipos/tonos válidos - antes vivía repetida inline en el POST
// y en el DELETE de este mismo archivo (y desincronizada del todo con el tipo ResponseStrategy
// de server/db/autonomy.ts, que incluía un "conditional" que esta validación real nunca aceptó).
// Exportadas para que el test de este archivo pueda comprobar el comportamiento real del router
// en vez de mantener su propia copia aparte de estas listas.
export const VALID_RESPONSE_TYPES = ["price_negotiation", "confirmation", "rejection", "follow_up"] as const;
export const VALID_TONES = ["neutral", "enthusiastic", "cautious"] as const;

export interface ResponseStrategy {
  responseType?: typeof VALID_RESPONSE_TYPES[number];
  guidancePrompt?: string;
  tone?: typeof VALID_TONES[number];
  mentionLinks?: boolean;
}

export function validateResponseStrategies(strategies: unknown): { ok: boolean; error?: string } {
  if (!strategies || typeof strategies !== "object") {
    return { ok: false, error: "Invalid strategies format" };
  }
  for (const [key, strategy] of Object.entries(strategies as Record<string, ResponseStrategy>)) {
    if (!(VALID_RESPONSE_TYPES as readonly string[]).includes(key)) {
      return { ok: false, error: `Invalid response type: ${key}` };
    }
    if (strategy.tone && !(VALID_TONES as readonly string[]).includes(strategy.tone)) {
      return { ok: false, error: `Invalid tone for ${key}: ${strategy.tone}` };
    }
    if (strategy.guidancePrompt !== undefined && typeof strategy.guidancePrompt !== "string") {
      return { ok: false, error: `guidancePrompt must be string for ${key}` };
    }
    if (strategy.mentionLinks !== undefined && typeof strategy.mentionLinks !== "boolean") {
      return { ok: false, error: `mentionLinks must be boolean for ${key}` };
    }
  }
  return { ok: true };
}

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
interface UpdateResponseStrategiesBody {
  strategies: Record<string, ResponseStrategy>;
}

router.post("/response-strategies", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const { strategies } = req.body as UpdateResponseStrategiesBody;

    const validation = validateResponseStrategies(strategies);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
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

    if (!(VALID_RESPONSE_TYPES as readonly string[]).includes(responseType)) {
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
