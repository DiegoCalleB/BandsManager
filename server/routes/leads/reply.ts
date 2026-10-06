// Respuestas a salas: generar/regenerar réplica y analizar el sentimiento de un mensaje entrante. La
// réplica sigue necesitando aprobación humana (AGENTS.md §3).

import express from "express";
import { loadState, saveState, requireAuth } from "../../state.js";
import { dbGetLeadById, dbGetLeadMessages, dbUpsertLead } from "../../db.js";
import { getTargetBandId } from "../../utils/bandAccess.js";
import { generarBorradorRespuesta } from "../../services/replyDrafting.js";
import { analyzeIncomingMessageSentiment } from "../../services/sentimentAnalysis.js";
import { detectPitchLanguage } from "../../utils/leadLanguage.js";
import { dbRecordPitchHumanEdit } from "../../db/pitchLearning.js";

const router = express.Router();

// Genera (solo borrador, no envía nada) la respuesta a un mensaje real ya recibido de un lead.
// Human-in-the-loop: el mánager revisa/edita este borrador y decide si lo manda, igual que con
// el pitch inicial - este endpoint nunca llama a enviarEmail/crearBorrador por su cuenta.
router.post("/leads/:id/generate-reply", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const bandId = getTargetBandId(req);
    const { incomingMessage: incomingMessageOverride, provider } = req.body || {};

    const state = loadState();
    let lead = state.leads.find((l: any) => String(l.id) === String(id));
    if (!lead) {
      try {
        lead = await dbGetLeadById(id, bandId);
        if (lead) state.leads.push(lead);
      } catch (dbErr) {
        console.warn("Could not fetch lead by ID from Supabase:", dbErr);
      }
    }
    if (!lead) {
      return res.status(404).json({ success: false, error: "Sala no encontrada." });
    }

    // El hilo real: lo que el Enviador ya mandó + lo que el Lector ya haya detectado como
    // respuesta, todo en lead_messages (misma tabla para ambos, ver server/db/leadMessages.ts).
    const hilo = await dbGetLeadMessages(String(lead.id), bandId);
    const ultimoMensajeSala = [...hilo].reverse().find((m) => m.remitente === "sala");
    const incomingMessage = (incomingMessageOverride || ultimoMensajeSala?.mensaje || "").trim();

    if (!incomingMessage) {
      return res.status(400).json({
        success: false,
        error: "No hay ningún mensaje entrante al que responder (ni en el hilo del lead ni en el cuerpo de la petición)."
      });
    }

    // El hilo previo es todo lo anterior al mensaje al que se está respondiendo ahora.
    const threadSoFar = hilo
      .filter((m) => m !== ultimoMensajeSala || Boolean(incomingMessageOverride))
      .map((m) => ({ remitente: m.remitente, mensaje: m.mensaje }));

    const { draftReply, isSimulated, sentimentAnalysis } = await generarBorradorRespuesta(bandId, lead, incomingMessage, threadSoFar, provider);

    res.json({
      success: true,
      draftReply,
      isSimulated,
      sentimentAnalysis,
      incomingMessage,
      threadSoFar
    });
  } catch (error: any) {
    console.error("Error in POST /api/leads/:id/generate-reply:", error);
    res.status(500).json({ success: false, error: error?.message || "Error al generar la respuesta." });
  }
});

// Endpoint para analizar sentimiento e intención de un mensaje específico bajo demanda
router.post("/leads/:id/analyze-sentiment", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const bandId = getTargetBandId(req);
    const { messageText } = req.body || {};

    const state = loadState();
    let lead = state.leads.find((l: any) => String(l.id) === String(id));
    if (!lead) {
      try {
        lead = await dbGetLeadById(id, bandId);
        if (lead) state.leads.push(lead);
      } catch (dbErr) {
        console.warn("Could not fetch lead by ID from Supabase:", dbErr);
      }
    }
    if (!lead) {
      return res.status(404).json({ success: false, error: "Sala no encontrada." });
    }

    let targetText = (messageText || "").trim();
    if (!targetText) {
      const hilo = await dbGetLeadMessages(String(lead.id), bandId);
      const ultimoMensajeSala = [...hilo].reverse().find((m) => m.remitente === "sala");
      targetText = (ultimoMensajeSala?.mensaje || lead.ultimo_mensaje_recibido || "").trim();
    }

    if (!targetText) {
      return res.status(400).json({ success: false, error: "No hay texto que analizar." });
    }

    const leadLang = detectPitchLanguage(lead);
    const sentimentAnalysis = await analyzeIncomingMessageSentiment(targetText, leadLang.code, {
      name: lead.nombre_sala,
      city: lead.ciudad,
      tipo: lead.tipo
    });

    // Actualizamos el lead en base de datos para que quede enriquecido inmediatamente
    const updatedLead = {
      ...lead,
      ultimo_sentimiento: sentimentAnalysis.sentimiento,
      ultimo_sentimiento_score: sentimentAnalysis.sentimiento_score,
      ultimo_sentimiento_label: sentimentAnalysis.sentimiento_label,
      ultima_intencion: sentimentAnalysis.intencion,
      ultima_intencion_etiqueta: sentimentAnalysis.intencion_etiqueta,
      ultimas_objeciones: sentimentAnalysis.objeciones_detectadas,
      ultimo_analisis_resumen: sentimentAnalysis.resumen_ejecutivo,
      temperatura_lead: sentimentAnalysis.temperatura,
      fechas_propuestas_sala: sentimentAnalysis.fechas_propuestas,
      condiciones_economicas_detectadas: sentimentAnalysis.condiciones_economicas,
      requisitos_tecnicos_detectados: sentimentAnalysis.requisitos_tecnicos,
      accion_sugerida_ia: sentimentAnalysis.accion_sugerida,
      estrategia_playbook: sentimentAnalysis.estrategia_playbook
    };
    await dbUpsertLead(updatedLead, bandId);

    // Actualizamos en memoria
    const leadIdx = state.leads.findIndex((l: any) => String(l.id) === String(id));
    if (leadIdx >= 0) {
      state.leads[leadIdx] = updatedLead;
    }

    res.json({
      success: true,
      sentimentAnalysis,
      lead: updatedLead
    });
  } catch (error: any) {
    console.error("Error in POST /api/leads/:id/analyze-sentiment:", error);
    res.status(500).json({ success: false, error: error?.message || "Error al analizar el sentimiento." });
  }
});

// Regenera el borrador de RESPUESTA aplicando feedback puntual del mánager (estrellas de
// tono/contenido + comentario libre) - equivalente a POST /leads/:id/regenerate-pitch pero para
// contestaciones: usa el prompt del Contestador (con el mensaje entrante real y el hilo), no el
// del pitch inicial, y registra el aprendizaje en el cubo de "respuestas" (ver
// server/db/pitchLearning.ts), separado del cubo de pitches para no mezclar ambos estilos.
router.post("/leads/:id/regenerate-reply", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const bandId = getTargetBandId(req);
    const { tono_rating, contenido_rating, comentario, alcance, provider } = req.body || {};

    const state = loadState();
    let lead = state.leads.find((l: any) => String(l.id) === String(id));
    if (!lead) {
      try {
        lead = await dbGetLeadById(id, bandId);
        if (lead) state.leads.push(lead);
      } catch (dbErr) {
        console.warn("Could not fetch lead by ID from Supabase:", dbErr);
      }
    }
    if (!lead) {
      return res.status(404).json({ success: false, error: "Sala no encontrada." });
    }

    const hilo = await dbGetLeadMessages(String(lead.id), bandId);
    const ultimoMensajeSala = [...hilo].reverse().find((m) => m.remitente === "sala");
    const incomingMessage = (ultimoMensajeSala?.mensaje || "").trim();

    if (!incomingMessage) {
      return res.status(400).json({
        success: false,
        error: "No hay ningún mensaje entrante en el hilo al que responder."
      });
    }

    const threadSoFar = hilo
      .filter((m) => m !== ultimoMensajeSala)
      .map((m) => ({ remitente: m.remitente, mensaje: m.mensaje }));

    const previousReply = lead.pitch_generado || "";

    const feedbackDetails: string[] = [];
    if (tono_rating) feedbackDetails.push(`Puntuación de tono deseado: ${tono_rating}/5`);
    if (contenido_rating) feedbackDetails.push(`Puntuación de contenido: ${contenido_rating}/5`);
    if (comentario && comentario.trim()) feedbackDetails.push(`Instrucciones específicas de esta respuesta: "${comentario.trim()}"`);
    feedbackDetails.push(alcance === 'este_pitch'
      ? `Nota de alcance: Aplicar este ajuste únicamente a esta sala en concreto.`
      : `Nota de alcance: Ajuste de preferencia general aplicable también a futuras respuestas.`);

    const { draftReply: newPitchText, isSimulated } = await generarBorradorRespuesta(
      bandId, lead, incomingMessage, threadSoFar, provider, feedbackDetails
    );

    const finalAlcance = alcance === 'este_pitch' ? 'este_pitch' : 'global';
    const logEntry = {
      id: `fb-${Date.now()}`,
      fecha: new Date().toISOString(),
      pitch_previo: previousReply,
      tono_rating: tono_rating || undefined,
      contenido_rating: contenido_rating || undefined,
      comentario: comentario || "",
      pitch_nuevo: newPitchText,
      alcance: finalAlcance
    };

    if (!lead.historial_feedback_pitch) lead.historial_feedback_pitch = [];
    lead.historial_feedback_pitch.unshift(logEntry);
    lead.pitch_generado = newPitchText;

    saveState(state);

    dbUpsertLead(lead, bandId).catch((err: any) => {
      console.warn("Async Supabase update for regenerated reply failed:", err);
    });

    // Solo se registra como entrenamiento (y por tanto solo alimenta el aprendizaje futuro) si
    // el mánager pidió realmente aplicarlo a futuras respuestas - un ajuste "solo esta sala" es
    // deliberadamente puntual y no debe contaminar el ADN de tono de respuestas de la banda.
    if (finalAlcance === 'global') {
      dbRecordPitchHumanEdit({
        band_id: bandId,
        lead_id: lead.id,
        nombre_sala: lead.nombre_sala,
        tipo_entidad: lead.tipo,
        ciudad: lead.ciudad,
        borrador_ia: previousReply,
        texto_aprobado: newPitchText,
        tipo_accion: "regenerado_respuesta_con_feedback",
        resultado_respuesta: "pendiente"
      }).catch((err: any) => console.warn("Notice dbRecordPitchHumanEdit (respuesta):", err));
    }

    res.json({
      success: true,
      simulated: isSimulated,
      lead,
      newPitchText,
      feedbackLog: logEntry
    });
  } catch (error: any) {
    console.error("Error in POST /api/leads/:id/regenerate-reply:", error);
    res.status(500).json({ success: false, error: error?.message || "Error al regenerar la respuesta." });
  }
});

export default router;
