import express from "express";
import { loadState, saveState, requireAuth } from "../../state.js";
import { dbGetLeadById, dbUpsertLead } from "../../db.js";
import { generateUnifiedAI, generateMultiModelProposals } from "../../ai.js";
import { formatGlobalPitchFeedbackForPrompt } from "./feedback.js";
import { detectPitchLanguage } from "../../utils/leadLanguage.js";

const router = express.Router();

router.post("/leads/:id/generate-multi-pitch", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { comentario, tono_rating, contenido_rating, providers } = req.body;

    const userBandId = (req as any).user?.band_id || (req as any).user?.bandId || 'band-bakandeya';
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

    const bandConfig = state.epkConfigsByBand?.[userBandId] || state.epkConfigsByBand?.[userBandId.replace(/^(band|reg)-/, '')] || state.epkConfig || {};
    const registeredBand = state.registeredBands?.find((b: any) => b.band_id === userBandId || b.band_id === userBandId.replace(/^(band|reg)-/, ''));
    const cleanId = (userBandId || 'bakandeya').replace(/^(band|reg)-/, '');
    const isBakandeya = cleanId === 'bakandeya';
    const bandName = registeredBand?.nombre_banda || registeredBand?.bandName || bandConfig?.contactoBooking?.nombre || bandConfig?.nombre_banda || (isBakandeya ? 'Bakandeya' : cleanId.charAt(0).toUpperCase() + cleanId.slice(1));
    const bandBio = bandConfig?.biografia || registeredBand?.biografia || registeredBand?.dossier_texto_extra || '';
    const website = bandConfig?.website || registeredBand?.spotify_youtube || '';

    const globalMemory = formatGlobalPitchFeedbackForPrompt(state.leads);
    const feedbackDetails: string[] = [];
    if (tono_rating) feedbackDetails.push(`Puntuación de tono deseado: ${tono_rating}/5`);
    if (contenido_rating) feedbackDetails.push(`Puntuación de contenido: ${contenido_rating}/5`);
    if (comentario && comentario.trim()) feedbackDetails.push(`Instrucciones específicas del mánager: "${comentario.trim()}"`);

    const languageHint = detectPitchLanguage(lead);
    const systemPrompt = `Eres el Agente Redactor y Director de Comunicación IA de la banda "${bandName}".
INFORMACIÓN Y ADN DE LA BANDA:
- Nombre: ${bandName}
- Propuesta artística y directo: ${bandBio || "Banda independiente de música en directo muy bailable y enérgica"}
- Enlaces y material promocional: ${website || "Dossier y música oficial"}

ENTRENAMIENTO PREVIO Y HISTORIAL DE PREFERENCIAS DEL MÁNAGER:
${globalMemory}

REGLAS ESTRICTAS DE REDACCIÓN:
1. ${languageHint.instruction}
2. Adapta el mensaje al tipo de recinto ("${lead.nombre_sala}", Ciudad: ${lead.ciudad || 'España'}, Aforo: ${lead.aforo || 'N/D'}).
3. Cero fórmulas clichés artificiales de IA. Destaca la energía del directo y la facilidad logística.
4. Devuelve ÚNICAMENTE el cuerpo del correo redactado listo para enviar (sin asuntos ni metadatos extra).`;

    const prompt = `Redacta una propuesta de concierto para la sala "${lead.nombre_sala}" en ${lead.ciudad || 'España'} (Tipo: ${lead.tipo || 'sala'}).
${feedbackDetails.length > 0 ? `\nINSTRUCCIONES ADICIONALES DEL MÁNAGER:\n${feedbackDetails.join('\n')}` : ''}
${lead.pitch_generado ? `\n(Versión previa de referencia si aplica: "${lead.pitch_generado.substring(0, 150)}...")` : ''}`;

    const proposals = await generateMultiModelProposals({
      prompt,
      systemPrompt,
      providers: providers || ["gemini", "deepseek", "claude"]
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
    const { tono_rating, contenido_rating, comentario, alcance, provider, modelName } = req.body;

    const userBandId = (req as any).user?.band_id || (req as any).user?.bandId || 'band-bakandeya';
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
    const bandConfig = state.epkConfigsByBand?.[userBandId] || state.epkConfigsByBand?.[userBandId.replace(/^(band|reg)-/, '')] || state.epkConfig || {};
    const registeredBand = state.registeredBands?.find((b: any) => b.band_id === userBandId || b.band_id === userBandId.replace(/^(band|reg)-/, ''));
    const cleanId = (userBandId || 'bakandeya').replace(/^(band|reg)-/, '');
    const isBakandeya = cleanId === 'bakandeya';
    const bandName = registeredBand?.nombre_banda || registeredBand?.bandName || bandConfig?.contactoBooking?.nombre || bandConfig?.nombre_banda || (isBakandeya ? 'Bakandeya' : cleanId.charAt(0).toUpperCase() + cleanId.slice(1));
    const bandBio = bandConfig?.biografia || registeredBand?.biografia || registeredBand?.dossier_texto_extra || '';

    const previousPitch = lead.pitch_generado || "";

    let newPitchText = "";
    let isSimulated = false;

    const feedbackDetails: string[] = [];
    if (tono_rating) feedbackDetails.push(`Puntuación de tono deseado: ${tono_rating}/5`);
    if (contenido_rating) feedbackDetails.push(`Puntuación de contenido: ${contenido_rating}/5`);
    if (comentario && comentario.trim()) feedbackDetails.push(`Instrucciones específicas de este pitch: "${comentario.trim()}"`);
    if (alcance === 'este_pitch') {
      feedbackDetails.push(`Nota de alcance: Aplicar este ajuste únicamente a esta sala en concreto.`);
    } else {
      feedbackDetails.push(`Nota de alcance: Ajuste de preferencia general aplicable también a futuros pitches.`);
    }

    const globalMemory = formatGlobalPitchFeedbackForPrompt(state.leads);
    const languageHint = detectPitchLanguage(lead);

    const prompt = `Eres el Agente Redactor e Inteligencia Artificial de Booking de la banda "${bandName}" (${bandBio ? bandBio : 'banda de música en directo'}).
Estás reescribiendo y perfeccionando el correo de pitch para la sala/organizador/medio "${lead.nombre_sala}" en ${lead.ciudad || "España"} (Tipo: ${lead.tipo || "sala"}, Aforo: ${lead.aforo || "N/D"}, Género habitual: ${lead.genero || "N/D"}).

PITCH ANTERIOR PARA ESTA SALA/MEDIO:
"""
${previousPitch || "Sin pitch anterior."}
"""

FEEDBACK E INSTRUCCIONES ESPECÍFICAS DEL MÁNAGER PARA ESTA SALA/MEDIO:
${feedbackDetails.length > 0 ? feedbackDetails.join("\n") : "Reescribir con mayor fuerza, frescura y claridad."}

MEMORIA GLOBAL DE APRENDIZAJES Y ESTILO EN OTROS PITCHES (ENTRENAMIENTO PREVIO DEL MÁNAGER):
${globalMemory}

REGLAS DE REESCRITURA Y APRENDIZAJE GLOBAL:
1. Aplica e integra las instrucciones específicas indicadas para esta sala o medio, así como las preferencias generales del historial global.
2. Si el mánager pide acortar, acorta. Si pide cambiar el tono (más formal, más cañero, más directo), cámbialo. Si pide mencionar detalles clave, inclúyelos.
3. Destaca el directo bailable y la propuesta artística de ${bandName} (${bandBio}).
4. ${languageHint.instruction}
5. No suenes a plantilla robótica ni a spam.
6. Devuelve ÚNICAMENTE el texto final redactado del nuevo pitch, sin asuntos, encabezados ni metadatos.`;

    try {
      const unifiedRes = await generateUnifiedAI({
        prompt,
        provider: provider || "gemini",
        modelName: modelName
      });
      if (unifiedRes && unifiedRes.text) {
        newPitchText = unifiedRes.text.trim();
      }
    } catch (aiErr: any) {
      console.warn(`Fallo ${provider || 'AI'} al regenerar pitch, utilizando fallback:`, aiErr.message);
    }

    if (!newPitchText) {
      if (bandBio) {
        isSimulated = true;
        const cleanComment = comentario ? comentario.trim() : "";
        const commentIntro = cleanComment ? `\n[Nota de ajuste aplicada: "${cleanComment}"]\n\n` : "";
        
        newPitchText = `¡Buenas desde el equipo de ${bandName}!${commentIntro}Queríamos proponeros un concierto en ${lead.nombre_sala} (${lead.ciudad || "España"}).\n\nNuestra propuesta es ${bandBio} muy bailable y enérgico, ideal para recintos como el vuestro.\n\n${cleanComment ? `Atendiendo a tu nota ("${cleanComment}"), nos adaptamos a vuestro formato habitual de taquilla o caché y podemos coordinar la fecha con bandas locales.` : `Nos adaptamos a vuestras condiciones de taquilla o caché garantizado y podemos colaborar con bandas locales para asegurar asistencia.`}\n\n¿Cómo tenéis la agenda para los próximos meses?\n\n¡Un saludo!\n${bandName} Agent Manager`;
      } else {
        newPitchText = previousPitch || "";
      }
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

    const userBandId = (req as any).user?.band_id || (req as any).user?.bandId || 'band-bakandeya';
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

// Helper to extract domain from website URL

export default router;
