import express from "express";
import { loadState, saveState, requireAuth, getAutonomyConfigForBand } from "../../state.js";
import { dbGetLeadById, dbUpsertLead, dbGetCategoryTemplates, dbRecordCampaignPitchTraining } from "../../db.js";
import { generateUnifiedAI, generateMultiModelProposals, buildPitchLinksFromEpkConfig } from "../../ai.js";
import { formatGlobalPitchFeedbackForPrompt } from "./feedback.js";
import { detectPitchLanguage } from "../../utils/leadLanguage.js";
import { getBandDnaProfile, buildEnhancedPitchSystemPrompt, generateSmartDnaPitchFallback, isCampaignActive } from "../../utils/bandDna.js";
import { dbGetDynamicFewShotExamples, formatFewShotExamplesForPrompt, refineAllToneDnaCategoriesForBand, dbRecordPitchHumanEdit } from "../../db/pitchLearning.js";

const router = express.Router();

router.post("/leads/:id/generate-multi-pitch", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { comentario, tono_rating, contenido_rating, providers, activeCampaign } = req.body;

    const userBandId = (req as any).user?.band_id || (req as any).user?.bandId;
    if (!userBandId) {
      return res.status(401).json({ error: "Acceso no autorizado. Inicie sesión para continuar." });
    }
    const state = loadState();
    let lead = state.leads.find((l: any) => String(l.id) === String(id));
    if (!lead) {
      try {
        lead = await dbGetLeadById(id, userBandId);
        if (lead) state.leads.push(lead);
      } catch (dbErr) {
        console.warn("Could not fetch lead by ID from Supabase:", dbErr);
      }
    }
    if (!lead) {
      return res.status(404).json({ success: false, error: "Sala no encontrada." });
    }

    // Cargar plantillas de categoría desde DB para que getBandDnaProfile tenga acceso
    try {
      const categoryTemplates = await dbGetCategoryTemplates(userBandId);
      state.categoryTemplates = categoryTemplates;
    } catch (err) {
      console.warn("No se pudieron cargar las plantillas de categoría:", err);
    }

    const bandDna = getBandDnaProfile(state, userBandId, lead);
    const globalMemory = formatGlobalPitchFeedbackForPrompt(state.leads);
    const autonomyConfig = getAutonomyConfigForBand(state, userBandId);
    const bandMinCache = autonomyConfig?.minCacheByType;
    const negotiationStartCacheByType = autonomyConfig?.negotiationStartCacheByType;

    // Dynamic Few-Shot In-Context Learning: recuperar ejemplos reales aprobados
    try {
      const fewShotExamples = await dbGetDynamicFewShotExamples(userBandId, lead, 3);
      if (fewShotExamples.length > 0) {
        bandDna.fewShotSection = formatFewShotExamplesForPrompt(fewShotExamples);
      }
    } catch (err) {
      console.warn("Few-shot examples lookup notice:", err);
    }

    const feedbackDetails: string[] = [];
    if (tono_rating) feedbackDetails.push(`Puntuación de tono deseado: ${tono_rating}/5`);
    if (contenido_rating) feedbackDetails.push(`Puntuación de contenido: ${contenido_rating}/5`);
    if (comentario && comentario.trim()) feedbackDetails.push(`Instrucciones específicas del mánager: "${comentario.trim()}"`);

    const systemPrompt = buildEnhancedPitchSystemPrompt(bandDna, globalMemory, lead, activeCampaign, bandMinCache, negotiationStartCacheByType);

    const prompt = `Redacta una propuesta comercial y artística de concierto para "${lead.nombre_sala}" en ${lead.ciudad || 'España'} (Tipo: ${lead.tipo || 'sala'}, Aforo: ${lead.aforo || 'N/D'}).
${feedbackDetails.length > 0 ? `\nINSTRUCCIONES ADICIONALES DEL MÁNAGER:\n${feedbackDetails.join('\n')}` : ''}
${lead.pitch_generado ? `\n(Versión previa de referencia: "${lead.pitch_generado.substring(0, 150)}...")` : ''}`;

    const pitchLinks = {
      spotify: bandDna.spotifyUrl,
      youtube: bandDna.youtubeUrl,
      epk: bandDna.epkUrl
    };

    const proposals = await generateMultiModelProposals({
      prompt,
      systemPrompt,
      links: pitchLinks,
      providers: providers || ["gemini", "deepseek"],
      contactEmail: bandDna.contactoEmail
    });

    res.json({
      success: true,
      leadId: lead.id,
      leadName: lead.nombre_sala,
      proposals
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

    const userBandId = (req as any).user?.band_id || (req as any).user?.bandId;
    if (!userBandId) {
      return res.status(401).json({ error: "Acceso no autorizado. Inicie sesión para continuar." });
    }
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

    // Cargar plantillas de categoría desde DB para que getBandDnaProfile tenga acceso
    try {
      const categoryTemplates = await dbGetCategoryTemplates(userBandId);
      state.categoryTemplates = categoryTemplates;
    } catch (err) {
      console.warn("No se pudieron cargar las plantillas de categoría:", err);
    }

    const bandDna = getBandDnaProfile(state, userBandId, lead);
    const previousPitch = lead.pitch_generado || "";

    let newPitchText = "";
    let isSimulated = false;

    const feedbackDetails: string[] = [];
    if (isCampaignActive(activeCampaign)) {
      feedbackDetails.push(`CONTEXTO DE CAMPAÑA IMPORTANTE: Menciona que buscamos fecha específicamente para el ${activeCampaign.targetDatesText || 'rango objetivo'}, enfocando a un aforo de ${activeCampaign.minCapacity}-${activeCampaign.maxCapacity}.`);
    }
    if (tono_rating) feedbackDetails.push(`Puntuación de tono deseado: ${tono_rating}/5`);
    if (contenido_rating) feedbackDetails.push(`Puntuación de contenido: ${contenido_rating}/5`);
    if (comentario && comentario.trim()) feedbackDetails.push(`Instrucciones específicas de este pitch: "${comentario.trim()}"`);
    if (alcance === 'este_pitch') {
      feedbackDetails.push(`Nota de alcance: Aplicar este ajuste únicamente a esta sala en concreto.`);
    } else {
      feedbackDetails.push(`Nota de alcance: Ajuste de preferencia general aplicable también a futuros pitches.`);
    }

    const globalMemory = formatGlobalPitchFeedbackForPrompt(state.leads);
    const autonomyConfig = getAutonomyConfigForBand(state, userBandId);
    const bandMinCache = autonomyConfig?.minCacheByType;
    const negotiationStartCacheByType = autonomyConfig?.negotiationStartCacheByType;

    // Dynamic Few-Shot In-Context Learning: recuperar ejemplos reales aprobados
    try {
      const fewShotExamples = await dbGetDynamicFewShotExamples(userBandId, lead, 3);
      if (fewShotExamples.length > 0) {
        bandDna.fewShotSection = formatFewShotExamplesForPrompt(fewShotExamples);
      }
    } catch (err) {
      console.warn("Few-shot examples lookup notice:", err);
    }

    const systemPrompt = buildEnhancedPitchSystemPrompt(bandDna, globalMemory, lead, activeCampaign, bandMinCache, negotiationStartCacheByType);

    const prompt = `Reescribe y perfecciona el correo de pitch para "${lead.nombre_sala}" en ${lead.ciudad || "España"} (Tipo: ${lead.tipo || "sala"}, Aforo: ${lead.aforo || "N/D"}).

PITCH ANTERIOR:
"""
${previousPitch || "Sin pitch anterior."}
"""

FEEDBACK E INSTRUCCIONES ESPECÍFICAS DEL MÁNAGER:
${feedbackDetails.length > 0 ? feedbackDetails.join("\n") : "Reescribir con mayor fuerza, autenticidad y claridad."}

INSTRUCCIONES CLAVE:
1. Aplica e integra las instrucciones del mánager y el ADN completo de la banda.
2. Devuelve ÚNICAMENTE el texto final redactado del nuevo pitch, sin asuntos, encabezados ni metadatos extra.`;

    const pitchLinks = {
      spotify: bandDna.spotifyUrl,
      youtube: bandDna.youtubeUrl,
      epk: bandDna.epkUrl
    };

    try {
      const unifiedRes = await generateUnifiedAI({
        prompt,
        systemPrompt,
        provider: provider || "gemini",
        modelName: modelName,
        permitirPitchLocal: true,
        links: pitchLinks,
        contactEmail: bandDna.contactoEmail
      });
      if (unifiedRes && unifiedRes.text) {
        newPitchText = unifiedRes.text.trim();
      }
    } catch (aiErr: any) {
      console.warn(`Fallo ${provider || 'AI'} al regenerar pitch, utilizando motor local de ADN:`, aiErr.message);
    }

    if (!newPitchText) {
      isSimulated = true;
      newPitchText = generateSmartDnaPitchFallback({
        bandDna,
        lead,
        provider,
        customInstruction: comentario,
        feedbackDetails,
        activeCampaign
      });
    }

    // Record learning log in lead
    const finalAlcance = alcance === 'este_pitch' ? 'este_pitch' : 'global';
    const logEntry = {
      id: `fb-${Date.now()}`,
      fecha: new Date().toISOString(),
      pitch_previo: previousPitch,
      tono_rating: tono_rating || undefined,
      contenido_rating: contenido_rating || undefined,
      comentario: comentario || "",
      pitch_nuevo: newPitchText,
      alcance: finalAlcance
    };

    if (!lead.historial_feedback_pitch) {
      lead.historial_feedback_pitch = [];
    }
    lead.historial_feedback_pitch.unshift(logEntry);

    // Dynamic Few-Shot: registrar en el repositorio global de aprendizaje
    dbRecordPitchHumanEdit({
      band_id: userBandId,
      lead_id: lead.id,
      nombre_sala: lead.nombre_sala,
      tipo_entidad: lead.tipo,
      ciudad: lead.ciudad,
      borrador_ia: previousPitch,
      texto_aprobado: newPitchText,
      tipo_accion: "regenerado_con_feedback",
      resultado_respuesta: "pendiente"
    }).catch(err => console.warn("Notice dbRecordPitchHumanEdit on regenerate:", err));

    // Campaign-specific training: if there's an active campaign and feedback for it, record campaign training
    if (isCampaignActive(activeCampaign) && (tono_rating || contenido_rating || comentario)) {
      dbRecordCampaignPitchTraining({
        band_id: userBandId,
        campaign_id: activeCampaign.id,
        borrador_ia: previousPitch,
        texto_aprobado: newPitchText
      }).catch(err => console.warn("Notice dbRecordCampaignPitchTraining on regenerate:", err));
    }

    // Update lead's pitch
    lead.pitch_generado = newPitchText;
    lead.pitch_feedback_tono = undefined;
    lead.pitch_feedback_contenido = undefined;
    lead.pitch_feedback_comentario = "";

    saveState(state);

    const targetBandId = (req as any).user?.band_id || lead.band_id || userBandId;
    dbUpsertLead(lead, targetBandId).catch(err => {
      console.warn("Async Supabase update for regenerated pitch failed:", err);
    });

    res.json({
      success: true,
      simulated: isSimulated,
      lead,
      newPitchText,
      feedbackLog: logEntry
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

    const userBandId = (req as any).user?.band_id || (req as any).user?.bandId;
    if (!userBandId) {
      return res.status(401).json({ error: "Acceso no autorizado. Inicie sesión para continuar." });
    }
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

    const targetBandId = (req as any).user?.band_id || lead.band_id || userBandId;
    dbUpsertLead(lead, targetBandId).catch(err => {
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
    const userBandId = (req as any).user?.band_id || (req as any).user?.bandId;
    if (!userBandId) {
      return res.status(401).json({ error: "Acceso no autorizado." });
    }
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
