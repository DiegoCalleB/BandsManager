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
import { generateUnifiedAI } from "../../ai.js";
import { getBandDnaProfile, buildEnhancedPitchSystemPrompt } from "../../utils/bandDna.js";

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

// Preview how AI will write using current template settings (without saving)
// Used for the "Probar Prompt" button to show a real-time sample before committing
router.post("/templates/preview", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const { category, subject, body, guidelines } = req.body;

    if (!category || !DEFAULT_CATEGORY_TEMPLATES[category]) {
      return res.status(400).json({ success: false, error: "Categoría de plantilla no válida." });
    }

    const state = loadState();
    const { bandName, bandBio } = resolveBandNameAndBio(state, bandId);

    // Create a synthetic lead representative of this category
    const categoryToType: Record<string, string> = {
      salas: 'sala',
      festivales: 'festival',
      discotecas: 'discoteca',
      medios: 'medio',
      grupos: 'grupo',
      managements: 'management',
      ayuntamientos: 'ayuntamiento'
    };

    const syntheticLead = {
      id: 'preview-synth',
      nombre_sala: category.charAt(0).toUpperCase() + category.slice(1) + ' Ejemplo',
      ciudad: 'Madrid',
      tipo: categoryToType[category] || category,
      aforo: 500,
      band_id: bandId
    };

    // Build band DNA with the current template settings (not saved)
    const bandDna = getBandDnaProfile(state, bandId, syntheticLead as any);
    // Override with the current unsaved template values
    bandDna.categoryTemplateGuidelines = guidelines;
    bandDna.categoryTemplateBody = body;
    bandDna.categoryTemplateSubject = subject;
    bandDna.categoryTemplateTitle = DEFAULT_CATEGORY_TEMPLATES[category].title;

    const globalMemory = formatGlobalPitchFeedbackForPrompt(state.leads);

    const systemPrompt = buildEnhancedPitchSystemPrompt(bandDna, globalMemory, syntheticLead as any);

    const prompt = `Redacta una propuesta comercial y artística de concierto para "${syntheticLead.nombre_sala}" en ${syntheticLead.ciudad} (Tipo: ${syntheticLead.tipo}, Aforo: ${syntheticLead.aforo}).

INSTRUCCIONES CLAVE:
1. Aplica el ADN completo de la banda y las pautas de esta categoría.
2. Devuelve ÚNICAMENTE el texto final redactado del nuevo pitch, sin asuntos, encabezados ni metadatos extra.`;

    const pitchLinks = {
      spotify: bandDna.spotifyUrl,
      youtube: bandDna.youtubeUrl,
      epk: bandDna.epkUrl
    };

    const previewResult = await generateUnifiedAI({
      prompt,
      systemPrompt,
      provider: 'gemini',
      permitirPitchLocal: true,
      links: pitchLinks,
      contactEmail: bandDna.contactoEmail
    });

    const previewSubject = subject || DEFAULT_CATEGORY_TEMPLATES[category].subject || `Propuesta de concierto para ${syntheticLead.nombre_sala}`;
    const previewBody = previewResult?.text?.trim() || '';

    res.json({
      success: true,
      category,
      subject: previewSubject,
      body: previewBody
    });
  } catch (error: any) {
    console.error("Error in POST /api/templates/preview:", error);
    res.status(500).json({ success: false, error: error?.message || "Error al generar vista previa del pitch." });
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
