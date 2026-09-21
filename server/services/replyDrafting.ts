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
import { detectPitchLanguage } from "../utils/leadLanguage.js";

// Palabras clave para detectar el tipo de respuesta entrante. Se comparten con lectorAgent.ts
// (PALABRAS_NEGOCIACION) las que son específicamente de precio, para que ambos clasificadores no
// diverjan con el tiempo - lectorAgent.ts añade además señales de fecha/logística que aquí caen
// bajo "follow_up", porque decide una cosa distinta (si el estado pasa a "negociando"), más
// amplia que "¿es esto una pregunta de precio?".
export const PRICE_KEYWORDS = [
  "precio", "cache", "caché", "presupuesto", "condiciones", "tarifa", "cuánto",
  "cuanto cobr", "cifra", "propuesta económica", "honorarios", "presupuestario"
];

interface ResponseKeywordSet {
  price: string[];
  confirmation: string[];
  rejection: string[];
  followUp: string[];
  // Palabras extra (fecha/disponibilidad/contrato/rider) que lectorAgent.ts añade a PRICE para
  // decidir si una respuesta "abre negociación" - viven aquí, junto al resto de keywords por
  // idioma, para no mantener una segunda lista traducida en otro archivo.
  negotiationExtra: string[];
}

// El pitch y la respuesta ya se generan en el idioma del lead (detectPitchLanguage en
// leadLanguage.ts, según su país) - pero hasta ahora detectResponseType() solo tenía keywords en
// español, así que una respuesta real de una sala italiana/francesa/etc. nunca coincidía con
// nada y siempre caía en "neutral", dejando sin efecto tanto la guía automática como las
// Estrategias de Respuesta configuradas a mano para cada tipo. No son traducciones exhaustivas,
// sino el vocabulario más común en cada idioma para cada categoría - suficiente para que el
// clasificador deje de ser mudo con leads no hispanohablantes.
const KEYWORDS_BY_LANGUAGE: Record<string, ResponseKeywordSet> = {
  es: {
    price: PRICE_KEYWORDS,
    confirmation: ["confirm", "listo", "perfecto", "ok", "genial", "excelente", "adelante", "sí",
      "vale", "de acuerdo", "acuerdo", "date confirmed", "fecha confirmada", "será genial",
      "nos encanta", "os parece bien"],
    rejection: ["no nos interesa", "no encaja", "no podemos", "no disponible", "rechaz",
      "disculpa", "lo siento", "no es posible", "desafortunadamente", "lamentablemente",
      "no tenemos disponibilidad", "no procede", "no aplica"],
    followUp: ["cuándo", "cuando", "fecha", "disponibilidad", "directo", "show",
      "más información", "preguntas", "detalles", "cómo"],
    negotiationExtra: ["fecha", "disponibilidad", "cuándo", "cuando podéis", "contrato", "rider"]
  },
  en: {
    price: ["price", "fee", "budget", "rate", "how much", "cost", "quote", "financial terms"],
    confirmation: ["confirm", "great", "perfect", "sounds good", "agreed", "yes", "awesome",
      "sounds great", "we'd love", "works for us"],
    rejection: ["not interested", "doesn't fit", "we can't", "not available", "decline",
      "unfortunately", "we're sorry", "not possible", "no longer"],
    followUp: ["when", "availability", "show", "more information", "questions", "details", "how"],
    negotiationExtra: ["date", "availability", "when can you", "contract", "rider"]
  },
  it: {
    price: ["prezzo", "cachet", "budget", "tariffa", "quanto", "condizioni economiche", "compenso", "preventivo"],
    confirmation: ["confermiamo", "perfetto", "ottimo", "d'accordo", "va bene", "sì", "grande", "ci piace"],
    rejection: ["non ci interessa", "non è possibile", "purtroppo", "siamo spiacenti",
      "non disponibile", "non possiamo", "non rientra"],
    followUp: ["quando", "disponibilità", "data", "maggiori informazioni", "domande", "dettagli", "come"],
    negotiationExtra: ["data", "disponibilità", "quando potete", "contratto", "rider"]
  },
  fr: {
    price: ["prix", "cachet", "budget", "tarif", "combien", "conditions financières", "devis", "honoraires"],
    confirmation: ["confirmons", "parfait", "génial", "d'accord", "avec plaisir", "oui", "excellent", "ça nous va"],
    rejection: ["ne nous intéresse pas", "malheureusement", "ce n'est pas possible", "pas disponible",
      "nous ne pouvons pas", "désolé", "ne correspond pas"],
    followUp: ["quand", "disponibilité", "date", "plus d'informations", "questions", "détails", "comment"],
    negotiationExtra: ["date", "disponibilité", "quand pouvez-vous", "contrat", "rider"]
  },
  pt: {
    price: ["preço", "cachê", "orçamento", "tarifa", "quanto", "condições financeiras", "honorários"],
    confirmation: ["confirmamos", "perfeito", "ótimo", "combinado", "sim", "excelente", "adoramos"],
    rejection: ["não nos interessa", "infelizmente", "não é possível", "não disponível",
      "não podemos", "lamentamos", "não se encaixa"],
    followUp: ["quando", "disponibilidade", "data", "mais informações", "perguntas", "detalhes", "como"],
    negotiationExtra: ["data", "disponibilidade", "quando podem", "contrato", "rider"]
  },
  de: {
    price: ["preis", "gage", "budget", "honorar", "wie viel", "konditionen", "kostenvoranschlag"],
    confirmation: ["bestätigen", "perfekt", "super", "einverstanden", "gerne", "ja", "ausgezeichnet", "passt für uns"],
    rejection: ["kein interesse", "leider", "nicht möglich", "nicht verfügbar", "können wir nicht",
      "tut uns leid", "passt nicht"],
    followUp: ["wann", "verfügbarkeit", "termin", "weitere informationen", "fragen", "details", "wie"],
    negotiationExtra: ["termin", "verfügbarkeit", "wann könnt ihr", "vertrag", "rider"]
  },
  nl: {
    price: ["prijs", "gage", "budget", "tarief", "hoeveel", "financiële voorwaarden", "offerte"],
    confirmation: ["bevestigen", "perfect", "geweldig", "akkoord", "ja", "uitstekend", "past ons goed"],
    rejection: ["geen interesse", "helaas", "niet mogelijk", "niet beschikbaar", "kunnen we niet",
      "sorry", "past niet"],
    followUp: ["wanneer", "beschikbaarheid", "datum", "meer informatie", "vragen", "details", "hoe"],
    negotiationExtra: ["datum", "beschikbaarheid", "wanneer kunnen jullie", "contract", "rider"]
  }
};

function getKeywordSet(languageCode?: string): ResponseKeywordSet {
  return KEYWORDS_BY_LANGUAGE[languageCode || "es"] || KEYWORDS_BY_LANGUAGE.es;
}

// Palabras cortas y de uso corriente cuyo `includes()` como substring genera falsos positivos
// reales: "sí" está contenido en "así" (muy común: "así que...", "así lo vemos..."), y "ok" está
// contenido en "booking" (un email de una sala que menciona su propio "departamento de booking"
// se clasificaría como "confirmation" sin que nadie haya confirmado nada). Para estas se exige
// que aparezcan como palabra suelta (no como substring de otra palabra); el resto de keywords
// (stems deliberados como "rechaz", o frases largas) siguen comprobándose como substring normal,
// que es justo el comportamiento que necesitan (para pillar "rechazamos", "rechazando", etc.).
function matchesKeyword(text: string, keyword: string): boolean {
  // Palabras cortas (<=3 caracteres) cuyo `includes()` como substring genera falsos positivos
  // reales en cualquier idioma: "sí"/"ok" en español ("así", "booking"), "ja" en alemán/
  // neerlandés ("januari"), "oui" en francés, etc. Para estas se exige que aparezcan como palabra
  // suelta; el resto de keywords (stems deliberados como "rechaz", o frases largas) siguen
  // comprobándose como substring normal, que es justo el comportamiento que necesitan (para
  // pillar "rechazamos", "rechazando", etc.).
  if (keyword.length <= 3) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, "u").test(text);
  }
  return text.includes(keyword);
}

export type ResponseType = "price_negotiation" | "confirmation" | "rejection" | "follow_up" | "neutral";

// languageCode: el idioma del lead (detectPitchLanguage(lead).code) - el mismo que ya decide en
// qué idioma se REDACTA el pitch/la respuesta, para que idioma de generación e idioma de
// detección nunca diverjan. Por defecto español si no se indica.
export function detectResponseType(incomingMessage: string, languageCode?: string): ResponseType {
  const text = (incomingMessage || "").toLowerCase();
  const keywords = getKeywordSet(languageCode);

  // Orden deliberado: precio ANTES que confirmación. Un mensaje real y frecuente abre con una
  // afirmación positiva antes de la pregunta de verdad ("Sí, nos encaja, ¿cuál sería el caché?")
  // - si confirmación se comprobara primero, ese "sí" ganaría y la guía resultante ("sé
  // entusiasta, no menciones cifras") contradice justo lo que preguntan. La pregunta de precio es
  // la señal más específica y accionable, así que manda.
  if (keywords.rejection.some(k => matchesKeyword(text, k))) return "rejection";
  if (keywords.price.some(k => matchesKeyword(text, k))) return "price_negotiation";
  if (keywords.confirmation.some(k => matchesKeyword(text, k))) return "confirmation";
  if (keywords.followUp.some(k => matchesKeyword(text, k))) return "follow_up";

  return "neutral";
}

// Usado por lectorAgent.ts (detectarEstadoTrasRespuesta) para decidir si una respuesta "abre
// negociación", en el idioma del lead - antes esa comprobación era 100% en español
// (PALABRAS_NEGOCIACION), así que una sala francesa preguntando "Quel est votre budget?" nunca
// hacía que el lead pasara a "negociando".
export function getNegotiationKeywords(languageCode?: string): string[] {
  const keywords = getKeywordSet(languageCode);
  return [...keywords.price, ...keywords.negotiationExtra];
}

export { matchesKeyword };

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

  // Detectar tipo de respuesta entrante (guía automática de código, ver buildReplySystemPrompt).
  // Se usa el mismo idioma que ya decide en qué idioma se redacta el pitch/la respuesta
  // (detectPitchLanguage, según el país del lead), para que un lead italiano/francés/etc. no
  // caiga siempre en "neutral" solo porque las keywords fueran únicamente en español.
  const leadLanguage = detectPitchLanguage(lead);
  const responseType = detectResponseType(incomingMessage, leadLanguage.code);
  console.log(`[Contestador] Tipo de respuesta detectado: ${responseType} (idioma: ${leadLanguage.code})`);

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
      return `Hola ${name},

Muchas gracias por la propuesta, nos hace mucha ilusión la fecha en ${sala}.

Para dejarla asegurada mientras cuadramos la logística de viaje y disponibilidad de los músicos, ¿os parece bien dejar la fecha en Pre-reserva (Hold) durante 48 horas? En cuanto lo tengamos coordinado os confirmo de inmediato para formalizar contrato y rider.

Un abrazo,`;

    case "price_negotiation":
      return `Hola ${name},

Gracias por la respuesta. Tenemos total flexibilidad en formato (taquilla compartida, fecha doble con banda local o acuerdo de caché) para adaptar el modelo a lo que mejor funcione en ${sala}.

Si os parece, comentamos por aquí o en una breve llamada para ajustar la cifra según la fecha que tengáis libre.

Un saludo,`;

    case "rejection":
      return `Hola ${name},

Muchas gracias por responder y por valorar la propuesta. Una lástima que no encaje esta vez, pero dejamos la puerta abierta para próximas giras.

¡Mucha suerte con la programación de ${sala}!

Un saludo,`;

    case "follow_up":
      return `Hola ${name},

Encantados de comentar cualquier detalle. Tenemos el rider y dossier listos, y nos adaptamos a lo que mejor os venga.

¿Cómo lo veis para hablarlo esta semana?

Un saludo,`;

    default:
      return `Hola ${name},

Muchas gracias por la respuesta. Seguimos a vuestra disposición para lo que necesitéis.

¿Cómo os viene mejor que lo coordinemos?

Un saludo,`;
  }
}
