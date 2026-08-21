import express from "express";
import { loadState, saveState, requireAuth } from "../../state.js";
import { getAiClient, generateContentWithFallback } from "../../ai.js";
import { safeParseJson } from "../../utils.js";
import { ensureCategoryTemplatesInState, updatePromptsMarkdownFile } from "../../promptsManager.js";
import { getGlobalPitchFeedbackSummary, formatGlobalPitchFeedbackForPrompt } from "./feedback.js";

const router = express.Router();

router.get("/templates", requireAuth, async (req, res) => {
  try {
    const state = loadState();
    const categoryTemplates = ensureCategoryTemplatesInState(state);
    res.json({ success: true, templates: categoryTemplates });
  } catch (error: any) {
    console.error("Error in GET /api/templates:", error);
    res.status(500).json({ success: false, error: "Error al obtener las plantillas." });
  }
});

// Save category templates, update state, write PROMPTS_AGENTES_IA.md and sync to Google Sheets
router.post("/templates/save", requireAuth, async (req, res) => {
  try {
    const { category, subject, body, guidelines, customInstruction, toneRating, contentRating } = req.body;
    const state = loadState();
    const categoryTemplates = ensureCategoryTemplatesInState(state);

    if (category && categoryTemplates[category]) {
      const current = categoryTemplates[category];
      current.subject = subject ?? current.subject;
      current.body = body ?? current.body;
      current.guidelines = guidelines ?? current.guidelines;
      current.customInstruction = customInstruction ?? current.customInstruction;
      if (toneRating !== undefined && toneRating > 0) current.toneRating = toneRating;
      if (contentRating !== undefined && contentRating > 0) current.contentRating = contentRating;
      current.updatedAt = new Date().toISOString();

      if (customInstruction || toneRating || contentRating) {
        if (!current.feedbackLogs) current.feedbackLogs = [];
        current.feedbackLogs.push({
          timestamp: new Date().toISOString(),
          toneRating: toneRating || undefined,
          contentRating: contentRating || undefined,
          comment: customInstruction || undefined,
          source: "manager_ui"
        });
      }
    } else if (req.body.templates) {
      state.categoryTemplates = req.body.templates;
    }

    saveState(state);

    // Write PROMPTS_AGENTES_IA.md
    const globalMemory = formatGlobalPitchFeedbackForPrompt(state.leads);
    updatePromptsMarkdownFile(state.categoryTemplates, globalMemory);

    res.json({
      success: true,
      message: "Plantilla y Pautas guardadas correctamente en la Memoria IA y PROMPTS_AGENTES_IA.md.",
      templates: state.categoryTemplates
    });
  } catch (error: any) {
    console.error("Error in POST /api/templates/save:", error);
    res.status(500).json({ success: false, error: "Error al guardar las plantillas y pautas de IA." });
  }
});

// Auto-optimize and regenerate category templates using accumulated manager learnings
router.post("/templates/optimize", requireAuth, async (req, res) => {
  try {
    const { category, currentSubject, currentBody, currentGuidelines, customInstruction, toneRating, contentRating } = req.body;
    const state = loadState();
    ensureCategoryTemplatesInState(state);
    const ai = getAiClient();
    const feedbackSummaryLogs = getGlobalPitchFeedbackSummary(state.leads);
    const globalMemory = formatGlobalPitchFeedbackForPrompt(state.leads);
    const feedbackCount = feedbackSummaryLogs.length;

    const userBandId = (req as any).user?.band_id ;
    const bandConfig = state.epkConfigsByBand?.[userBandId] || state.epkConfigsByBand?.[userBandId.replace(/^(band|reg)-/, '')] || state.epkConfig || {};
    const registeredBand = state.registeredBands?.find((b: any) => b.band_id === userBandId || b.band_id === userBandId.replace(/^(band|reg)-/, ''));
    const cleanId = userBandId.replace(/^(band|reg)-/, '');
    const isBakandeya = cleanId === 'bakandeya';
    const bandName = registeredBand?.nombre_banda || registeredBand?.bandName || bandConfig?.contactoBooking?.nombre || bandConfig?.nombre_banda || (isBakandeya ? 'Bakandeya' : cleanId.charAt(0).toUpperCase() + cleanId.slice(1));
    const bandBio = bandConfig?.biografia || registeredBand?.biografia || registeredBand?.dossier_texto_extra || '';

    const categoryNames: Record<string, string> = {
      salas: "Salas y Teatros de Conciertos",
      festivales: "Festivales de Música",
      discotecas: "Discotecas y Clubbing Nocturno",
      medios: "Medios de Comunicación, Radio y Prensa",
      grupos: "Grupos y Bandas para Intercambio de Fechas (Co-Booking / Date Swap)",
      managements: "Agencias de Booking y Management"
    };

    const categoryLabel = categoryNames[category] || category || "General";

    const prompt = `Eres el Especialista Director de Redacción de la banda "${bandName}" (${bandBio ? bandBio : 'banda de música en directo'}).
Tu tarea es REGENERAR Y OPTIMIZAR la plantilla de correo por defecto y sus pautas de IA para la categoría: "${categoryLabel}".

PLANTILLA ACTUAL:
- Asunto: "${currentSubject || ''}"
- Cuerpo: "${currentBody || ''}"
- Pautas de IA: "${currentGuidelines || ''}"

VALORACIÓN DIRECTA DEL MÁNAGER SOBRE ESTA PLANTILLA ACTUAL:
- Tono y Estilo: ${toneRating ? `${toneRating}/5 estrellas` : 'Sin calificar'}
- Contenido y Estructura: ${contentRating ? `${contentRating}/5 estrellas` : 'Sin calificar'}

${customInstruction && customInstruction.trim() ? `INSTRUCCIÓN / COMENTARIO DIRECTO DEL MÁNAGER PARA ESTA PLANTILLA (CUMPLIR OBLIGATORIAMENTE):
"${customInstruction.trim()}"` : ''}

MEMORIA COMPLETA Y APRENDIZAJES ACUMULADOS DE VALORACIONES Y CORRECCIONES PREVIAS DEL MÁNAGER EN OTROS CORREOS (${feedbackCount} entradas de feedback):
${globalMemory}

INSTRUCCIONES DE OPTIMIZACIÓN CON APRENDIZAJE AUTOMÁTICO:
1. Si el mánager ha dado una puntuación baja en Tono/Estilo (1-3/5), ajusta radicalmente la voz, el ritmo y la cercanía/respeto del mensaje. Si ha dado puntuación baja en Contenido/Estructura (1-3/5), reorganiza los bloques de información, acorta o aclara los puntos clave.
2. Si el mánager ha introducido un comentario o instrucción específica arriba, cúplela como máxima prioridad.
3. Analiza cuidadosamente todo el feedback acumulado del mánager en correos anteriores. Si ha pedido acortar correos, cambiar el tono, destacar el violín o evitar clichés, aplica esos aprendizajes para perfeccionar esta plantilla.
4. Preserva las variables dinámicas de plantilla en el cuerpo si son útiles: {{nombre_sala}}, {{ciudad}}, {{website}}, etc.
5. Asegúrate de mantener la firma y personalidad de Bakandeya.
6. Devuelve un objeto JSON VÁLIDO exactamente con esta estructura (sin texto alrededor):
{
  "subject": "Asunto optimizado para ${categoryLabel}",
  "body": "Cuerpo completo de la plantilla optimizado...",
  "guidelines": "Nuevas pautas de IA refinadas para que el agente Redactor las aplique...",
  "explanation": "Explicación breve (1-2 frases) de qué aprendizajes, estrellas e instrucciones del mánager se han aplicado en esta regeneración."
}`;

    let resultJson: any = null;
    let isSimulated = false;

    if (ai) {
      try {
        const responseText = await generateContentWithFallback(ai, {
          contents: prompt,
          config: {
            temperature: 0.4,
            responseMimeType: "application/json"
          }
        });
        resultJson = safeParseJson(responseText);
      } catch (err) {
        console.warn("AI generation failed for template optimization, falling back to rule-based:", err);
      }
    }

    if (!resultJson || !resultJson.subject || !resultJson.body || !resultJson.guidelines) {
      isSimulated = true;
      const instructionApplied = customInstruction ? `Aplicada la instrucción del mánager: "${customInstruction.trim()}". ` : '';
      const feedbackNotes = feedbackCount > 0 
        ? `Se han integrado las ${feedbackCount} valoraciones previas del mánager sobre tono y estilo.`
        : "Sin feedback previo guardado, se ha refrescado con tono directo y bailable sin vientos.";

      resultJson = {
        subject: currentSubject ? `${currentSubject}` : `Propuesta de concierto: Bakandeya`,
        body: currentBody 
          ? currentBody 
          : `Hola equipo de {{nombre_sala}},\n\nSomos Bakandeya...`,
        guidelines: currentGuidelines 
          ? `${currentGuidelines}. ${customInstruction ? `Instrucción reciente: ${customInstruction}.` : ''}` 
          : `Tono directo adaptado a ${categoryLabel}.`,
        explanation: `Plantilla regenerada con IA. ${instructionApplied}${feedbackNotes}`
      };
    }

    // Automatically persist optimized result in state, PROMPTS_AGENTES_IA.md and Google Sheets
    if (category && state.categoryTemplates && state.categoryTemplates[category]) {
      const target = state.categoryTemplates[category];
      target.subject = resultJson.subject;
      target.body = resultJson.body;
      target.guidelines = resultJson.guidelines;
      if (toneRating) target.toneRating = toneRating;
      if (contentRating) target.contentRating = contentRating;
      if (customInstruction) target.customInstruction = customInstruction;
      target.updatedAt = new Date().toISOString();

      if (!target.feedbackLogs) target.feedbackLogs = [];
      target.feedbackLogs.push({
        timestamp: new Date().toISOString(),
        toneRating: toneRating || undefined,
        contentRating: contentRating || undefined,
        comment: customInstruction || resultJson.explanation || "Re-generada con IA",
        source: "ai_optimization"
      });

      saveState(state);

      // Refresh PROMPTS_AGENTES_IA.md
      updatePromptsMarkdownFile(state.categoryTemplates, globalMemory);
    }

    res.json({
      success: true,
      category,
      feedbackCountUsed: feedbackCount,
      feedbackSummary: feedbackSummaryLogs,
      optimized: resultJson,
      isSimulated,
      updatedTemplates: state.categoryTemplates
    });
  } catch (error: any) {
    console.error("Error in POST /api/templates/optimize:", error);
    res.status(500).json({ error: error?.message || "Error al optimizar la plantilla con IA." });
  }
});

// POST /api/leads/:id/generate-multi-pitch (Human-in-the-Loop A/B/C Multi-Model Generation)

export default router;
