import express from "express";
import { requireAuth, loadState } from "../../state.js";
import { getTargetBandId } from "../../utils/bandAccess.js";
import { DEFAULT_CATEGORY_TEMPLATES } from "../../promptsManager.js";
import { getGlobalPitchFeedbackSummary, formatGlobalPitchFeedbackForPrompt } from "./feedback.js";
import { dbGetCategoryTemplates, dbUpsertCategoryTemplate } from "../../db/categoryTemplates.js";
import {
  generateOptimizedCategoryTemplate,
  autoOptimizeCategoryTemplateIfDue,
  resolveBandNameAndBio
} from "../../utils/templateOptimizer.js";

const router = express.Router();

router.get("/templates", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const templates = await dbGetCategoryTemplates(bandId);
    res.json({ success: true, templates });
  } catch (error: any) {
    console.error("Error in GET /api/templates:", error);
    res.status(500).json({ success: false, error: "Error al obtener las plantillas." });
  }
});

// Save a single category's template + guidelines, persistido por banda en Supabase. Si tras
// este guardado se han acumulado suficientes valoraciones sin optimizar, dispara en segundo
// plano una auto-optimización con IA (ver AUTO_OPTIMIZE_FEEDBACK_THRESHOLD).
router.post("/templates/save", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const { category, subject, body, guidelines, customInstruction, toneRating, contentRating } = req.body;

    if (!category || !DEFAULT_CATEGORY_TEMPLATES[category]) {
      return res.status(400).json({ success: false, error: "Categoría de plantilla no válida." });
    }

    const existing = await dbGetCategoryTemplates(bandId);
    const current = existing[category];

    const feedbackLogs = current.feedbackLogs || [];
    if (customInstruction || toneRating || contentRating) {
      feedbackLogs.push({
        timestamp: new Date().toISOString(),
        toneRating: toneRating || undefined,
        contentRating: contentRating || undefined,
        comment: customInstruction || undefined,
        source: "manager_ui"
      });
    }

    const saved = await dbUpsertCategoryTemplate(bandId, category, {
      title: current.title,
      subject: subject ?? current.subject,
      body: body ?? current.body,
      guidelines: guidelines ?? current.guidelines,
      customInstruction: customInstruction ?? current.customInstruction,
      toneRating: toneRating && toneRating > 0 ? toneRating : current.toneRating,
      contentRating: contentRating && contentRating > 0 ? contentRating : current.contentRating,
      feedbackLogs
    });

    const templates = { ...existing, [category]: saved };
    res.json({
      success: true,
      message: "Plantilla y pautas guardadas correctamente.",
      templates
    });

    // En segundo plano, después de responder: si ya hay bastante feedback sin aplicar, se
    // auto-optimiza sola. No bloquea el guardado ni el mensaje de éxito al mánager.
    autoOptimizeCategoryTemplateIfDue(bandId, category, loadState()).catch((err) => {
      console.warn("Notice en auto-optimización de plantilla:", err);
    });
  } catch (error: any) {
    console.error("Error in POST /api/templates/save:", error);
    res.status(500).json({ success: false, error: "Error al guardar las plantillas y pautas de IA." });
  }
});

// Auto-optimize and regenerate a category template using accumulated manager learnings
// (disparo manual: el mánager pulsa "optimizar con IA" en el editor, usando lo que hay en
// pantalla en ese momento aunque no lo haya guardado todavía).
router.post("/templates/optimize", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const { category, currentSubject, currentBody, currentGuidelines, customInstruction, toneRating, contentRating } = req.body;

    if (!category || !DEFAULT_CATEGORY_TEMPLATES[category]) {
      return res.status(400).json({ success: false, error: "Categoría de plantilla no válida." });
    }

    const state = loadState();
    const feedbackSummaryLogs = getGlobalPitchFeedbackSummary(state.leads);
    const globalMemory = formatGlobalPitchFeedbackForPrompt(state.leads);
    const feedbackCount = feedbackSummaryLogs.length;
    const { bandName, bandBio } = resolveBandNameAndBio(state, bandId);

    const result = await generateOptimizedCategoryTemplate({
      bandName,
      bandBio,
      category,
      currentSubject,
      currentBody,
      currentGuidelines,
      toneRating,
      contentRating,
      customInstruction,
      globalMemory,
      feedbackCount
    });

    const existing = await dbGetCategoryTemplates(bandId);
    const current = existing[category];
    const feedbackLogs = current.feedbackLogs || [];
    feedbackLogs.push({
      timestamp: new Date().toISOString(),
      toneRating: toneRating || undefined,
      contentRating: contentRating || undefined,
      comment: customInstruction || result.explanation || "Re-generada con IA",
      source: "ai_optimization"
    });

    const saved = await dbUpsertCategoryTemplate(bandId, category, {
      title: current.title,
      subject: result.subject,
      body: result.body,
      guidelines: result.guidelines,
      customInstruction: customInstruction || current.customInstruction,
      toneRating: toneRating || current.toneRating,
      contentRating: contentRating || current.contentRating,
      feedbackLogs
    });

    const updatedTemplates = { ...existing, [category]: saved };

    res.json({
      success: true,
      category,
      feedbackCountUsed: feedbackCount,
      feedbackSummary: feedbackSummaryLogs,
      optimized: result,
      isSimulated: result.isSimulated,
      updatedTemplates
    });
  } catch (error: any) {
    console.error("Error in POST /api/templates/optimize:", error);
    res.status(500).json({ error: error?.message || "Error al optimizar la plantilla con IA." });
  }
});

export default router;
