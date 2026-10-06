// Generación y auditoría de pitches: multi-propuesta, regenerar, revertir y entrenar Tone DNA.
// Directrices de redacción: AGENTS.md §3.

import express from "express";
import { loadState, saveState, requireAuth, getAutonomyConfigForBand } from "../../state.js";
import { dbGetLeadById, dbUpsertLead, dbGetCategoryTemplates, dbRecordCampaignPitchTraining } from "../../db.js";
import { generateUnifiedAI, generateMultiModelProposals, buildPitchLinksFromEpkConfig } from "../../ai.js";
import { formatGlobalPitchFeedbackForPrompt } from "./feedback.js";
import { detectPitchLanguage } from "../../utils/leadLanguage.js";
import { getBandDnaProfile, buildEnhancedPitchSystemPrompt, generateSmartDnaPitchFallback, isCampaignActive } from "../../utils/bandDna.js";
import { dbGetDynamicFewShotExamples, formatFewShotExamplesForPrompt, refineAllToneDnaCategoriesForBand, dbRecordPitchHumanEdit } from "../../db/pitchLearning.js";
import { sanitizeExternalText } from "../../utils/promptSafety.js";
import { findCorridorForCity } from "../../../src/utils/tourRouting.js";
import { PitchEngine } from "../../services/pitchEngine.js";
import { getTargetBandId } from "../../utils/bandAccess.js";

const router = express.Router();

// Auditoría heurística de calidad y scoring anti-IA en tiempo real
router.post("/leads/audit-pitch", requireAuth, (req, res) => {
  try {
    const { text, category } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "El campo 'text' es obligatorio." });
    }
    const audit = PitchEngine.auditPitch(text, category);
    const sanitized = PitchEngine.sanitizePitch(text);
    return res.json({
      success: true,
      audit,
      sanitized
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || "Error al auditar el pitch." });
  }
});

router.post("/leads/:id/generate-multi-pitch", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { comentario, tono_rating, contenido_rating, providers, activeCampaign } = req.body;

    const userBandId = getTargetBandId(req);

    const result = await PitchEngine.generateMultiPitch({
      leadId: id,
      userBandId,
      comentario,
      tono_rating,
      contenido_rating,
      providers,
      activeCampaign
    });

    res.json({
      success: true,
      leadId: result.leadId,
      leadName: result.leadName,
      proposals: result.proposals
    });
  } catch (error: any) {
    console.error("Error in POST /api/leads/:id/generate-multi-pitch:", error);
    res.status(500).json({ success: false, error: error?.message || "Error al generar propuestas multi-IA." });
  }
});

// Regenerate pitch taking user feedback and comments into account to train AI
router.post("/leads/:id/regenerate-pitch", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { tono_rating, contenido_rating, comentario, alcance, provider, modelName, activeCampaign } = req.body;

    const userBandId = getTargetBandId(req);

    const result = await PitchEngine.regeneratePitch({
      leadId: id,
      userBandId,
      tono_rating,
      contenido_rating,
      comentario,
      alcance,
      provider,
      modelName,
      activeCampaign
    });

    res.json({
      success: true,
      simulated: result.simulated,
      lead: result.lead,
      newPitchText: result.newPitchText,
      audit: result.audit,
      feedbackLog: result.feedbackLog
    });
  } catch (error: any) {
    console.error("Error in POST /api/leads/:id/regenerate-pitch:", error);
    res.status(500).json({ success: false, error: error?.message || "Error al regenerar el pitch." });
  }
});

// Revert pitch to previous version and mark training log as undone
router.post("/leads/:id/revert-pitch", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { logId } = req.body;

    const userBandId = getTargetBandId(req);
    const state = loadState();
    let lead = state.leads.find((l: any) => String(l.id) === String(id));
    if (!lead) {
      try {
        lead = await dbGetLeadById(id, userBandId);
        if (lead) {
          state.leads.push(lead);
        }
      } catch (dbErr) {
        console.warn("Could not fetch lead by ID from Supabase:", dbErr);
      }
    }
    if (!lead) {
      return res.status(404).json({ success: false, error: "Sala no encontrada." });
    }

    const history = lead.historial_feedback_pitch || [];
    if (history.length === 0) {
      return res.status(400).json({ success: false, error: "No hay historial de entrenamiento previo para deshacer." });
    }

    let targetLog = logId ? history.find((h: any) => h.id === logId) : history[0];
    if (!targetLog) {
      targetLog = history[0];
    }

    const restoredPitch = targetLog.pitch_previo || "";
    
    // Mark targetLog as deshecho
    targetLog.deshecho = true;

    // Update lead pitch
    lead.pitch_generado = restoredPitch;

    saveState(state);

    dbUpsertLead(lead, userBandId).catch(err => {
      console.warn("Async Supabase update for reverted pitch failed:", err);
    });

    res.json({
      success: true,
      restoredPitch,
      revertedLogId: targetLog.id,
      lead
    });
  } catch (error: any) {
    console.error("Error in POST /api/leads/:id/revert-pitch:", error);
    res.status(500).json({ success: false, error: error?.message || "Error al deshacer el entrenamiento del pitch." });
  }
});

// Endpoint para disparar o forzar el auto-refinamiento de ADN de Tono (Self-Refining Tone DNA),
// para todas las categorías de lead que tengan ya suficiente señal acumulada.
router.post("/leads/train-tone-dna", requireAuth, async (req, res) => {
  try {
    const userBandId = getTargetBandId(req);
    const refinedCategories = await refineAllToneDnaCategoriesForBand(userBandId);
    res.json({
      success: true,
      refinedCategories,
      message: refinedCategories.length > 0
        ? `Auto-refinamiento ejecutado para: ${refinedCategories.join(", ")}.`
        : "Todavía no hay suficientes correcciones (mínimo 2 por categoría) para refinar el ADN de tono."
    });
  } catch (err: any) {
    console.error("Error in POST /api/leads/train-tone-dna:", err);
    res.status(500).json({ success: false, error: err?.message || "Error al refinar el ADN de tono." });
  }
});

// Helper to extract domain from website URL

export default router;
