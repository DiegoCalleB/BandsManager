// Lógica compartida de redacción de respuestas (el "Contestador"), extraída de
// server/routes/leads/reply.ts para poder llamarla también desde el Agente Lector
// (server/services/lectorAgent.ts) cuando detecta una respuesta real de una sala - así el
// borrador queda listo para aprobar en cuanto el mánager abre la sala, en vez de tener que
// pedirlo a mano desde la UI cada vez.
import { loadState } from "../state.js";
import { generateUnifiedAI } from "../ai.js";
import { getBandDnaProfile, buildReplySystemPrompt, formatReplyFewShotForPrompt } from "../utils/bandDna.js";
import { dbGetReplyFewShotThreads } from "../db/pitchLearning.js";
import { dbGetAutonomyConfig } from "../db/autonomy.js";
import { mapLeadTipoToTemplateCategory } from "../promptsManager.js";

// Palabras clave para detectar el tipo de respuesta entrante. Se comparten con lectorAgent.ts
// (PALABRAS_NEGOCIACION) las que son específicamente de precio, para que ambos clasificadores no
// diverjan con el tiempo - lectorAgent.ts añade además señales de fecha/logística que aquí caen
// bajo "follow_up", porque decide una cosa distinta (si el estado pasa a "negociando"), más
// amplia que "¿es esto una pregunta de precio?".
export const PRICE_KEYWORDS = [
  "precio", "cache", "caché", "presupuesto", "condiciones", "tarifa", "cuánto",
  "cuanto cobr", "cifra", "propuesta económica", "honorarios", "presupuestario"
];

const PRICE_NEGOTIATION_KEYWORDS = PRICE_KEYWORDS;

const CONFIRMATION_KEYWORDS = [
  "confirm", "listo", "perfecto", "ok", "genial", "excelente",
  "adelante", "sí", "vale", "de acuerdo", "acuerdo", "date confirmed",
  "fecha confirmada", "será genial", "nos encanta", "os parece bien"
];

const REJECTION_KEYWORDS = [
  "no nos interesa", "no encaja", "no podemos", "no disponible", "rechaz",
  "disculpa", "lo siento", "no es posible", "desafortunadamente", "lamentablemente",
  "no tenemos disponibilidad", "no procede", "no aplica"
];

// Palabras cortas y de uso corriente cuyo `includes()` como substring genera falsos positivos
// reales: "sí" está contenido en "así" (muy común: "así que...", "así lo vemos..."), y "ok" está
// contenido en "booking" (un email de una sala que menciona su propio "departamento de booking"
// se clasificaría como "confirmation" sin que nadie haya confirmado nada). Para estas se exige
// que aparezcan como palabra suelta (no como substring de otra palabra); el resto de keywords
// (stems deliberados como "rechaz", o frases largas) siguen comprobándose como substring normal,
// que es justo el comportamiento que necesitan (para pillar "rechazamos", "rechazando", etc.).
const WHOLE_WORD_ONLY = new Set(["sí", "ok"]);

function matchesKeyword(text: string, keyword: string): boolean {
  if (WHOLE_WORD_ONLY.has(keyword)) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, "u").test(text);
  }
  return text.includes(keyword);
}

export type ResponseType = "price_negotiation" | "confirmation" | "rejection" | "follow_up" | "neutral";

export function detectResponseType(incomingMessage: string): ResponseType {
  const text = (incomingMessage || "").toLowerCase();

  // Orden deliberado: precio ANTES que confirmación. Un mensaje real y frecuente en español
  // abre con una afirmación positiva antes de la pregunta de verdad ("Sí, nos encaja, ¿cuál
  // sería el caché?") - si confirmación se comprobara primero, ese "sí" ganaría y la guía
  // resultante ("sé entusiasta, no menciones cifras") contradice justo lo que preguntan.
  // La pregunta de precio es la señal más específica y accionable, así que manda.
  if (REJECTION_KEYWORDS.some(k => matchesKeyword(text, k))) return "rejection";
  if (PRICE_NEGOTIATION_KEYWORDS.some(k => matchesKeyword(text, k))) return "price_negotiation";
  if (CONFIRMATION_KEYWORDS.some(k => matchesKeyword(text, k))) return "confirmation";

  // Si pregunta algo relacionado con el directo, fechas, etc.
  const followUpKeywords = ["cuándo", "cuando", "fecha", "disponibilidad", "directo", "show",
                            "más información", "preguntas", "detalles", "cómo"];
  if (followUpKeywords.some(k => matchesKeyword(text, k))) return "follow_up";

  return "neutral";
}

export interface DraftReplyResult {
  draftReply: string;
  isSimulated: boolean;
}

export async function generarBorradorRespuesta(
  bandId: string,
  lead: any,
  incomingMessage: string,
  threadSoFar: Array<{ remitente: "sala" | "banda"; mensaje: string }>,
  provider?: string,
  feedbackDetails?: string[]
): Promise<DraftReplyResult> {
  const state = loadState();
  // Modo 'reply': lee reglas de estilo aprendidas del cubo de RESPUESTAS, no del de pitches
  // (ver getBandDnaProfile en bandDna.ts) - corregir cómo se responde a una negociación no debe
  // enseñarle al sistema a redactar mal el primer contacto, y viceversa.
  const bandDna = getBandDnaProfile(state, bandId, lead, 'reply');
  const category = mapLeadTipoToTemplateCategory(lead.tipo);

  // Detectar tipo de respuesta entrante (guía automática de código, ver buildReplySystemPrompt)
  const responseType = detectResponseType(incomingMessage);
  console.log(`[Contestador] Tipo de respuesta detectado: ${responseType}`);

  // Guía condicional configurada a mano por la banda para este tipo de respuesta (opcional -
  // ver AgentAutonomySettingsModal.tsx > "Estrategias de Respuesta"). Si no hay ninguna, cae a
  // la guía automática fija de código dentro de buildReplySystemPrompt.
  let responseStrategy = null;
  try {
    const autonomyConfig = await dbGetAutonomyConfig(bandId);
    if (autonomyConfig?.responseStrategies?.[responseType]) {
      responseStrategy = autonomyConfig.responseStrategies[responseType];
      console.log(`[Contestador] Usando estrategia configurada para: ${responseType}`);
    }
  } catch (err) {
    console.warn(`[Contestador] No se pudo cargar estrategia de respuesta: ${err}`);
  }

  let replyFewShotSection = "";
  try {
    const threads = await dbGetReplyFewShotThreads(bandId, category, 2);
    replyFewShotSection = formatReplyFewShotForPrompt(threads);
  } catch (err) {
    console.warn("Notice cargando ejemplos de respuesta para el Contestador:", err);
  }

  const systemPrompt = buildReplySystemPrompt(bandDna, lead, incomingMessage, threadSoFar, replyFewShotSection, responseType, responseStrategy, feedbackDetails);
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
    draftReply = generateFallbackReply(lead, incomingMessage, responseType);
  }

  return { draftReply, isSimulated };
}

function generateFallbackReply(lead: any, incomingMessage: string, responseType: ResponseType): string {
  const name = lead.contacto_nombre ? lead.contacto_nombre.split(" ")[0] : "equipo";
  const sala = lead.nombre_sala || "la sala";

  switch (responseType) {
    case "confirmation":
      return `Hola ${name},\n\nMuchas gracias por confirmarlo. Estamos muy emocionados de poder compartir escenario en ${sala}.\n\nQuedamos a vuestra disposición para cuadrar los últimos detalles técnicos y de producción.\n\n¡Un saludo!`;

    case "price_negotiation":
      return `Hola ${name},\n\nGracias por vuestro interés. Disponemos de amplia flexibilidad en condiciones: taquilla compartida, caché fijo, o cualquier modelo que funcione mejor para ${sala}.\n\nOs envío en un mensaje posterior nuestra propuesta económica detallada.\n\n¡Un saludo!`;

    case "rejection":
      return `Hola ${name},\n\nAgradecemos sinceramente vuestro tiempo y consideración. Esperamos poder colaborar en futuros proyectos.\n\n¡Mucho ánimo con la programación de ${sala}!\n\nUn saludo cordial,`;

    case "follow_up":
      return `Hola ${name},\n\nEncantados de aclarar cualquier duda. Disponemos de toda la información en nuestro Dossier Oficial (enlace en la firma), pero con gusto respondemos a lo que necesitéis.\n\n¿Cuál es la mejor forma de ponernos en contacto para resolver esto?\n\n¡Un saludo!`;

    default:
      return `Hola ${name},\n\nMuchas gracias por vuestra respuesta. Nos encantaría seguir hablando para cuadrar los detalles.\n\n¿Cómo tenéis la agenda para coordinar una llamada o cerrar los últimos detalles?\n\n¡Un saludo!`;
  }
}
