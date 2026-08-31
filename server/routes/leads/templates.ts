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
import { getBandDnaProfile, buildEnhancedPitchSystemPrompt } from "../../utils/bandDna.js";
import { generateUnifiedAI } from "../../ai.js";
import { isValidEmailSyntax, isValidEmailCached } from "../../utils/emailValidator.js";

const router = express.Router();

// Lead sintético representativo de cada categoría, usado solo para la simulación de "Probar
// Prompt": no se guarda ni se envía nada, es únicamente para dar contexto realista al prompt.
const CATEGORY_PREVIEW_LEAD: Record<string, { tipo: string; nombre_sala: string }> = {
  salas: { tipo: "sala", nombre_sala: "Sala Ejemplo" },
  festivales: { tipo: "festival", nombre_sala: "Festival Ejemplo" },
  discotecas: { tipo: "discoteca", nombre_sala: "Discoteca Ejemplo" },
  medios: { tipo: "medio", nombre_sala: "Medio Ejemplo" },
  grupos: { tipo: "grupo", nombre_sala: "Banda Ejemplo" },
  managements: { tipo: "management", nombre_sala: "Agencia Ejemplo" },
  ayuntamientos: { tipo: "ayuntamiento", nombre_sala: "Ayuntamiento Ejemplo" }
};

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

// Genera una simulación REAL (no texto fijo) de cómo redactaría el Redactor un primer contacto
// para esta categoría, usando las guidelines que hay en pantalla en ese momento (sin necesidad
// de guardarlas antes). Usa el mismo ADN de banda y el mismo prompt que la generación real de
// pitches (server/routes/leads/pitch.ts), solo que con un lead sintético de la categoría en vez
// de uno real, para que el mánager pueda previsualizar el efecto de sus pautas antes de guardar.
router.post("/templates/preview", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const { category, subject, body, guidelines } = req.body;

    const previewLeadBase = CATEGORY_PREVIEW_LEAD[category];
    if (!previewLeadBase) {
      return res.status(400).json({ success: false, error: "Categoría de plantilla no válida." });
    }

    const state = loadState();
    const previewLead = { ...previewLeadBase, ciudad: "Madrid", aforo: 300 };
    const bandDna = getBandDnaProfile(state, bandId, previewLead);

    const current = (await dbGetCategoryTemplates(bandId))[category];
    bandDna.categoryTemplateTitle = current?.title;
    bandDna.categoryTemplateGuidelines = guidelines ?? current?.guidelines;

    const globalMemory = formatGlobalPitchFeedbackForPrompt(state.leads);
    const systemPrompt = buildEnhancedPitchSystemPrompt(bandDna, globalMemory, previewLead);

    const prompt = `Redacta una propuesta comercial y artística de concierto para "${previewLead.nombre_sala}" en ${previewLead.ciudad} (Tipo: ${previewLead.tipo}, Aforo: ${previewLead.aforo}).
${body ? `\nPlantilla de referencia actual (adáptala, no la copies literal):\n"${body}"` : ""}`;

    const result = await generateUnifiedAI({ prompt, systemPrompt, provider: "gemini" });

    res.json({
      success: true,
      subject: subject || `Propuesta de concierto: ${bandDna.bandName}`,
      body: result.text.trim()
    });
  } catch (error: any) {
    console.error("Error in POST /api/templates/preview:", error);
    res.status(500).json({ success: false, error: error?.message || "Error al simular la plantilla con IA." });
  }
});

// Estadísticas de éxito: cuántos leads usaron cada template y cuántos respondieron
// NOTA: Excluye leads con email inválido para que las métricas sean justas
router.get("/templates/stats", requireAuth, async (req, res) => {
  try {
    const state = await loadState();
    const bandId = getTargetBandId(req);
    const leads = state.leads?.filter((l: any) => l.band_id === bandId) || [];

    const stats: Record<string, {
      totalUses: number;
      positiveResponses: number;
      responseRate: number;
      invalidEmails: number;
      bouncedEmails: number;
    }> = {
      salas: { totalUses: 0, positiveResponses: 0, responseRate: 0, invalidEmails: 0, bouncedEmails: 0 },
      festivales: { totalUses: 0, positiveResponses: 0, responseRate: 0, invalidEmails: 0, bouncedEmails: 0 },
      discotecas: { totalUses: 0, positiveResponses: 0, responseRate: 0, invalidEmails: 0, bouncedEmails: 0 },
      medios: { totalUses: 0, positiveResponses: 0, responseRate: 0, invalidEmails: 0, bouncedEmails: 0 },
      grupos: { totalUses: 0, positiveResponses: 0, responseRate: 0, invalidEmails: 0, bouncedEmails: 0 },
      managements: { totalUses: 0, positiveResponses: 0, responseRate: 0, invalidEmails: 0, bouncedEmails: 0 },
      ayuntamientos: { totalUses: 0, positiveResponses: 0, responseRate: 0, invalidEmails: 0, bouncedEmails: 0 }
    };

    // Validar emails en paralelo (con caché para performance)
    const emailValidities = await Promise.all(
      leads.map(async (lead: any) => ({
        leadId: lead.id,
        email: lead.email || lead.email_contacto,
        isValid: isValidEmailSyntax(lead.email || lead.email_contacto)
          ? await isValidEmailCached(lead.email || lead.email_contacto)
          : false
      }))
    );

    const validLeadIds = new Set(
      emailValidities.filter(ev => ev.isValid).map(ev => ev.leadId)
    );

    for (const lead of leads) {
      const cat = lead.template_category || 'salas';
      if (!stats[cat]) continue;

      const email = lead.email || lead.email_contacto;
      const isEmailValid = validLeadIds.has(lead.id);
      const hasBouncedEmail = lead.notas?.includes('[Email Rechazado]');

      // Si email rebotó o fue rechazado, excluir del cálculo pero contar
      if (hasBouncedEmail) {
        stats[cat].bouncedEmails++;
        continue;
      }

      // Si email es inválido, excluir del cálculo pero contar
      if (!isEmailValid) {
        if (isValidEmailSyntax(email)) {
          // Sintaxis válida pero dominio no existe
          stats[cat].invalidEmails++;
        }
        continue;
      }

      // Contar uso solo si tiene pitch generado (y email válido)
      if (lead.ultimo_pitch_generado) {
        stats[cat].totalUses++;

        // Contar respuesta positiva (respondido, negociando, confirmado)
        const isPositive = ['respondido', 'negociando', 'confirmado', 'concierto_programado'].includes(lead.estado);
        if (isPositive) stats[cat].positiveResponses++;
      }
    }

    // Calcular tasas
    for (const cat of Object.keys(stats)) {
      if (stats[cat].totalUses > 0) {
        stats[cat].responseRate = Math.round((stats[cat].positiveResponses / stats[cat].totalUses) * 100);
      }
    }

    res.json({ success: true, stats });
  } catch (error: any) {
    console.error("Error in GET /api/templates/stats:", error);
    res.status(500).json({ success: false, error: error?.message || "Error al obtener estadísticas." });
  }
});

// Reset template a valores por defecto
router.post("/templates/reset", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const { category } = req.body;

    if (!category || !DEFAULT_CATEGORY_TEMPLATES[category]) {
      return res.status(400).json({ success: false, error: "Categoría no válida." });
    }

    const defaultTemplate = DEFAULT_CATEGORY_TEMPLATES[category];

    await dbUpsertCategoryTemplate(
      bandId,
      category,
      {
        subject: defaultTemplate.subject,
        body: defaultTemplate.body,
        guidelines: defaultTemplate.guidelines,
        customInstruction: "",
        toneRating: 5,
        contentRating: 5
      }
    );

    res.json({
      success: true,
      message: `Plantilla de ${category} restaurada a valores por defecto.`,
      template: defaultTemplate
    });
  } catch (error: any) {
    console.error("Error in POST /api/templates/reset:", error);
    res.status(500).json({ success: false, error: error?.message || "Error al resetear plantilla." });
  }
});

export default router;
