// Lógica compartida de redacción de respuestas (el "Contestador"), extraída de
// server/routes/leads/reply.ts para poder llamarla también desde el Agente Lector
// (server/services/lectorAgent.ts) cuando detecta una respuesta real de una sala - así el
// borrador queda listo para aprobar en cuanto el mánager abre la sala, en vez de tener que
// pedirlo a mano desde la UI cada vez.
import { loadState } from "../state.js";
import { generateUnifiedAI } from "../ai.js";
import { getBandDnaProfile, buildReplySystemPrompt, formatReplyFewShotForPrompt } from "../utils/bandDna.js";
import { dbGetReplyFewShotThreads } from "../db/pitchLearning.js";
import { mapLeadTipoToTemplateCategory } from "../promptsManager.js";

export interface DraftReplyResult {
  draftReply: string;
  isSimulated: boolean;
}

export async function generarBorradorRespuesta(
  bandId: string,
  lead: any,
  incomingMessage: string,
  threadSoFar: Array<{ remitente: "sala" | "banda"; mensaje: string }>,
  provider?: string
): Promise<DraftReplyResult> {
  const state = loadState();
  const bandDna = getBandDnaProfile(state, bandId, lead);
  const category = mapLeadTipoToTemplateCategory(lead.tipo);

  let replyFewShotSection = "";
  try {
    const threads = await dbGetReplyFewShotThreads(bandId, category, 2);
    replyFewShotSection = formatReplyFewShotForPrompt(threads);
  } catch (err) {
    console.warn("Notice cargando ejemplos de respuesta para el Contestador:", err);
  }

  const systemPrompt = buildReplySystemPrompt(bandDna, lead, incomingMessage, threadSoFar, replyFewShotSection);
  const prompt = `Redacta la respuesta al mensaje entrante indicado en las instrucciones del sistema. Devuelve ÚNICAMENTE el cuerpo del email, sin asunto.`;

  const pitchLinks = { spotify: bandDna.spotifyUrl, youtube: bandDna.youtubeUrl, epk: bandDna.epkUrl };

  let draftReply = "";
  let isSimulated = false;
  try {
    const unifiedRes = await generateUnifiedAI({
      prompt,
      systemPrompt,
      provider: provider || "gemini",
      permitirPitchLocal: true,
      links: pitchLinks,
      contactEmail: bandDna.contactoEmail
    });
    if (unifiedRes?.text) draftReply = unifiedRes.text.trim();
  } catch (aiErr: any) {
    console.warn("Fallo IA al generar respuesta:", aiErr?.message || aiErr);
  }

  if (!draftReply) {
    isSimulated = true;
    draftReply = `Hola ${lead.contacto_nombre ? lead.contacto_nombre.split(" ")[0] : "equipo de " + (lead.nombre_sala || "la sala")},\n\nMuchas gracias por vuestra respuesta. Nos encantaría seguir hablando para cuadrar los detalles.\n\n¿Cómo tenéis la agenda para coordinar una llamada o cerrar los últimos detalles?\n\n¡Un saludo!`;
  }

  return { draftReply, isSimulated };
}
