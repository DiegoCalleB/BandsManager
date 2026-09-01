import express from "express";
import { loadState, requireAuth } from "../../state.js";
import { dbGetLeadById, dbGetLeadMessages } from "../../db.js";
import { getTargetBandId } from "../../utils/bandAccess.js";
import { generarBorradorRespuesta } from "../../services/replyDrafting.js";

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

    const { draftReply, isSimulated } = await generarBorradorRespuesta(bandId, lead, incomingMessage, threadSoFar, provider);

    res.json({
      success: true,
      draftReply,
      isSimulated,
      incomingMessage,
      threadSoFar
    });
  } catch (error: any) {
    console.error("Error in POST /api/leads/:id/generate-reply:", error);
    res.status(500).json({ success: false, error: error?.message || "Error al generar la respuesta." });
  }
});

export default router;
