import { getAiClient, generateContentWithFallback } from "../ai.js";
import { safeParseJson } from "../utils.js";
import type { TemplateFeedbackLog } from "../promptsManager.js";
import { dbGetCategoryTemplates, dbUpsertCategoryTemplate } from "../db/categoryTemplates.js";
import { getGlobalPitchFeedbackSummary, formatGlobalPitchFeedbackForPrompt } from "../routes/leads/feedback.js";

export const CATEGORY_LABELS: Record<string, string> = {
  salas: "Salas y Teatros de Conciertos",
  festivales: "Festivales de Música",
  discotecas: "Discotecas y Clubbing Nocturno",
  medios: "Medios de Comunicación, Radio y Prensa",
  grupos: "Grupos y Bandas para Intercambio de Fechas (Co-Booking / Date Swap)",
  managements: "Agencias de Booking y Management",
  ayuntamientos: "Ayuntamientos y Fiestas Patronales"
};

/** A partir de cuántas valoraciones sin optimizar desde la última vez, se auto-dispara la regeneración. */
export const AUTO_OPTIMIZE_FEEDBACK_THRESHOLD = 3;

/**
 * Nº de valoraciones del mánager ("manager_ui") acumuladas desde la última vez que esta
 * plantilla se optimizó (a mano o en automático, "ai_optimization"). Recorre el historial
 * desde el final hasta encontrar la última optimización, o hasta el principio si nunca se
 * ha optimizado.
 */
export function countUnoptimizedFeedback(feedbackLogs: TemplateFeedbackLog[] | undefined): number {
  if (!Array.isArray(feedbackLogs)) return 0;
  let count = 0;
  for (let i = feedbackLogs.length - 1; i >= 0; i--) {
    if (feedbackLogs[i].source === "ai_optimization") break;
    if (feedbackLogs[i].source === "manager_ui") count++;
  }
  return count;
}

export function resolveBandNameAndBio(state: any, bandId: string): { bandName: string; bandBio: string } {
  const cleanId = bandId.replace(/^(band|reg)-/, "");
  const bandConfig = state?.epkConfigsByBand?.[bandId] || state?.epkConfigsByBand?.[cleanId] || state?.epkConfig || {};
  const registeredBand = state?.registeredBands?.find((b: any) => b.band_id === bandId || b.band_id === cleanId);
  const bandName = registeredBand?.nombre_banda || registeredBand?.bandName || bandConfig?.contactoBooking?.nombre || bandConfig?.nombre_banda ||
    cleanId.charAt(0).toUpperCase() + cleanId.slice(1);
  const bandBio = bandConfig?.biografia || registeredBand?.biografia || registeredBand?.dossier_texto_extra || "";
  return { bandName, bandBio };
}

export function buildTemplateOptimizationPrompt(params: {
  bandName: string;
  bandBio: string;
  category: string;
  currentSubject: string;
  currentBody: string;
  currentGuidelines: string;
  toneRating?: number;
  contentRating?: number;
  customInstruction?: string;
  globalMemory: string;
  feedbackCount: number;
}): string {
  const categoryLabel = CATEGORY_LABELS[params.category] || params.category || "General";

  return `Eres el Director Estratégico de Booking y Redacción de la banda "${params.bandName}" (${params.bandBio || "banda de música en directo"}).
Tu objetivo es REGENERAR Y PERFECCIONAR la plantilla de correo maestro (Blueprint) y sus pautas de IA para la categoría: "${categoryLabel}".

================================================================================
REGLAS MAESTRAS DE ORO PARA PLANTILLAS DE BOOKING (NIVEL ÉLITE):
================================================================================
1. DIFERENCIA CRUCIAL ENTRE "PLANTILLA" Y "PITCH FINAL":
   - Esta plantilla es un BLUEPRINT ESTRUCTURAL REUTILIZABLE para toda la categoría, NO un correo para una fecha cerrada puntual.
   - Debe contener variables dinámicas bien situadas: {{nombre_sala}}, {{ciudad}}, {{website}}, etc.
   - NUNCA incluyas fechas fijas cerradas (ej: "el 4 de diciembre" o "el puente"), usa conceptos de temporada o {{ventana_fechas}}.
   - NUNCA nombres una sala concreta fija (ej: "Nazca"), usa siempre {{nombre_sala}}.

2. ESTRUCTURA Y BREVEDAD ESCANEABLE (<130 PALABRAS TOTAL):
   - Párrafo 1 (Halago sincero y conocimiento): 1-2 líneas reconociendo el criterio cultural, cartelera o labor de la entidad en {{ciudad}}.
   - Párrafo 2 (Identidad sonora y formato escénico): 2 líneas describiendo la instrumentación real y energía de directo sin clichés comerciales.
   - Párrafo 3 (Llamada a la acción clara y abierta): Pregunta directa sobre calendario/disponibilidad para los próximos meses.
   - Cierre: 1 línea remitiendo al Dossier / EPK con directos y rider al pie.

3. ESPECIALIZACIÓN OBLIGATORIA POR CATEGORÍA:
   - SALAS/TEATROS: Respeto a la acústica, labor cultural, aforos medios. Prohibido hablar de copas o barras en espacios escénicos.
   - FESTIVALES: Ultra-breve (<90 palabras), cómo defiende el grupo un escenario grande, rapidez de rotación y solidez.
   - DISCOTECAS/CLUBBING: Formato Live Set / híbrido bailable, horario nocturno, integración con cabina DJ.
   - MEDIOS/RADIO/PRENSA: Gancho periodístico (single/gira/hito), enlace streaming/WAV (sin adjuntos pesados), disponibilidad de entrevista.
   - GRUPOS (CO-BOOKING): Tono de músico a músico, intercambio de ciudades (mi ciudad x tu ciudad), compartir sala y backline.
   - MANAGEMENTS/AGENCIAS: Profesionalidad, métricas/hitos, solvencia de producción y sinergias.
   - AYUNTAMIENTOS/FESTEJOS: Tratamiento formal de usted o formal cercano, fiestas patronales/ciclos, facturación oficial y alta en SS.

4. DON'Ts ESTRICTOS (ANTIPATRONES PROHIBIDOS):
   - PROHIBIDO hablar de caché, taquilla o alquiler en el primer contacto. El objetivo es solo abrir conversación y consultar fechas.
   - PROHIBIDO meter muletillas operativas ("montamos en 30 min", "recogemos en 5 min"). Los técnicos ya lo ven en el EPK.
   - PROHIBIDO el tono de spam publicitario corporativo.

PLANTILLA ACTUAL:
- Asunto: "${params.currentSubject || ""}"
- Cuerpo: "${params.currentBody || ""}"
- Pautas de IA: "${params.currentGuidelines || ""}"

VALORACIÓN DIRECTA DEL MÁNAGER:
- Tono y Estilo: ${params.toneRating ? `${params.toneRating}/5 estrellas` : "Sin calificar"}
- Contenido y Estructura: ${params.contentRating ? `${params.contentRating}/5 estrellas` : "Sin calificar"}

${params.customInstruction && params.customInstruction.trim() ? `INSTRUCCIÓN / COMENTARIO DIRECTO DEL MÁNAGER (MÁXIMA PRIORIDAD):
"${params.customInstruction.trim()}"` : ""}

MEMORIA HISTÓRICA DE VALORACIONES DEL MÁNAGER (${params.feedbackCount} entradas):
${params.globalMemory}

Devuelve un objeto JSON VÁLIDO exactamente con esta estructura (sin texto alrededor):
{
  "subject": "Asunto optimizado para ${categoryLabel}",
  "body": "Cuerpo completo de la plantilla optimizado...",
  "guidelines": "Pautas de IA refinadas para que el agente Redactor las aplique...",
  "explanation": "Explicación breve de las mejoras aplicadas según las Reglas Maestras y feedback."
}`;
}

export interface OptimizedTemplateResult {
  subject: string;
  body: string;
  guidelines: string;
  explanation: string;
  isSimulated: boolean;
}

/** Llama a la IA (o cae al motor local determinista) y devuelve la plantilla regenerada. No persiste nada. */
export async function generateOptimizedCategoryTemplate(params: {
  bandName: string;
  bandBio: string;
  category: string;
  currentSubject: string;
  currentBody: string;
  currentGuidelines: string;
  toneRating?: number;
  contentRating?: number;
  customInstruction?: string;
  globalMemory: string;
  feedbackCount: number;
}): Promise<OptimizedTemplateResult> {
  const prompt = buildTemplateOptimizationPrompt(params);
  const ai = getAiClient();
  let resultJson: any = null;

  if (ai) {
    try {
      const response = await generateContentWithFallback(ai, {
        contents: prompt,
        config: { temperature: 0.4, responseMimeType: "application/json" }
      });
      resultJson = safeParseJson(response?.text || "");
    } catch (err) {
      console.warn("AI generation failed for template optimization, falling back to rule-based:", err);
    }
  }

  if (resultJson && resultJson.subject && resultJson.body && resultJson.guidelines) {
    return { ...resultJson, isSimulated: false };
  }

  const categoryLabel = CATEGORY_LABELS[params.category] || params.category || "General";
  const instructionApplied = params.customInstruction ? `Aplicada la instrucción del mánager: "${params.customInstruction.trim()}". ` : "";
  const feedbackNotes = params.feedbackCount > 0
    ? `Se han integrado las ${params.feedbackCount} valoraciones previas del mánager sobre tono y estilo.`
    : "Sin feedback previo guardado, se ha refrescado con tono directo y bailable sin vientos.";

  return {
    subject: params.currentSubject || `Propuesta de concierto: ${params.bandName}`,
    body: params.currentBody || `Hola equipo de {{nombre_sala}},\n\nSomos ${params.bandName}...`,
    guidelines: params.currentGuidelines
      ? `${params.currentGuidelines}. ${params.customInstruction ? `Instrucción reciente: ${params.customInstruction}.` : ""}`
      : `Tono directo adaptado a ${categoryLabel}.`,
    explanation: `Plantilla regenerada con IA. ${instructionApplied}${feedbackNotes}`,
    isSimulated: true
  };
}

export interface CampaignContextData {
  name?: string;
  targetCities?: string[];
  targetDates?: string[];
  minCapacity?: number;
  maxCapacity?: number;
  notes?: string;
}

export async function generateAllCategoryTemplatesFromBase(params: {
  bandName: string;
  bandBio: string;
  baseProposal: string;
  globalMemory?: string;
  feedbackCount?: number;
  campaignContext?: CampaignContextData;
}): Promise<Record<string, OptimizedTemplateResult>> {
  const categories = Object.keys(CATEGORY_LABELS);
  const ai = getAiClient();

  const campaignBlock = params.campaignContext ? `
================================================================================
OBJETIVO ESPECÍFICO DE ESTA CAMPAÑA DE BOOKING:
================================================================================
- Nombre de la campaña: "${params.campaignContext.name || "Campaña de Booking"}"
- Ciudades objetivo prioritarias: ${params.campaignContext.targetCities?.length ? params.campaignContext.targetCities.join(", ") : "Varias ciudades"}
- Fechas objetivo en búsqueda: ${params.campaignContext.targetDates?.length ? params.campaignContext.targetDates.join(", ") : "Próximos meses"}
- Rango de aforo deseado: ${params.campaignContext.minCapacity || 100} a ${params.campaignContext.maxCapacity || 500} personas
- Notas estratégicas de la campaña: "${params.campaignContext.notes || ""}"

INSTRUCCIÓN ESPECIAL PARA CAMPAÑA:
Adapta cada una de las 7 plantillas para que sirvan de marco táctico para esta campaña concreta (mencionando las ciudades o el marco temporal de la gira de forma elegante y persuasiva), manteniendo las variables dinámicas {{nombre_sala}}, {{ciudad}} y la brevedad radical (<130 palabras).
` : "";

  const prompt = `Eres el Director Estratégico de Booking de la banda "${params.bandName}".
BIOGRAFÍA/ADN DE LA BANDA: "${params.bandBio || "Propuesta musical en directo"}"

INFORMACIÓN / PROPUESTA BASE APORTADA POR EL MÁNAGER:
"""
${params.baseProposal.trim()}
"""
${campaignBlock}
${params.globalMemory ? `MEMORIA HISTÓRICA DE VALORACIONES:
${params.globalMemory}
` : ""}

TU TAREA:
Genera simultáneamente las 7 PLANTILLAS MAESTRAS (Blueprints) y sus 7 PAUTAS DE IA (guidelines) adaptando la propuesta base de la banda a cada uno de los 7 tipos de destinatarios:
1. "salas" (Salas y Teatros de Conciertos)
2. "festivales" (Festivales de Música)
3. "discotecas" (Discotecas y Clubbing Nocturno)
4. "medios" (Medios de Comunicación, Radio y Prensa)
5. "grupos" (Grupos y Bandas para Intercambio de Fechas / Co-Booking)
6. "managements" (Agencias de Booking y Management)
7. "ayuntamientos" (Ayuntamientos, Festejos y Fiestas Patronales)

================================================================================
REGLAS MAESTRAS DE ORO (NIVEL ÉLITE PARA TODAS LAS PLANTILLAS):
================================================================================
1. SON PLANTILLAS REUTILIZABLES (BLUEPRINTS), NO EMAILS PARA UNA FECHA O SALA CERRADA:
   - Usa variables dinámicas: {{nombre_sala}}, {{ciudad}}, {{website}}, etc.
   - NUNCA incluyas fechas fijas de un solo día (ej: "el 4 de diciembre" o "el puente"), usa conceptos de temporada o {{ventana_fechas}}.
   - NUNCA nombres una sala concreta fija en el texto de la plantilla.
2. BREVEDAD (<130 palabras total, en festivales <90 palabras). 3 párrafos concisos:
   - Párrafo 1: Reconocimiento sincero al criterio/espacio en {{ciudad}}.
   - Párrafo 2: Sonido diferenciador, instrumentación real y potencia de directo sin clichés.
   - Párrafo 3: Pregunta directa sobre disponibilidad de calendario/temporada.
   - Cierre: 1 línea remitiendo al Dossier / EPK al pie.
3. ADAPTACIÓN DE SECTOR:
   - Salas/Teatros: Acústica, mimo de programación, aforos medios. Prohibido hablar de copas o barras en espacios escénicos.
   - Festivales: Escenario grande, ultra-conciso, cambio ágil de backline.
   - Discotecas: Live set bailable, horario nocturno, conexión con DJ.
   - Medios: Gancho de actualidad/single/gira, enlace streaming/WAV (sin adjuntos pesados) y entrevistas.
   - Grupos: Tono de colega músico, intercambio de ciudades y backline.
   - Managements: Solvencia técnica, tracción y sinergias.
   - Ayuntamientos: Registro formal (usted o formal cercano), fiestas patronales, factura y alta en SS.
4. DON'Ts:
   - Prohibido hablar de condiciones económicas (taquilla/caché) en el primer contacto.
   - Prohibido meter muletillas de montaje innecesarias ("montamos en 30 min y recogemos en 5 min").

Devuelve un único JSON VÁLIDO con esta estructura exacta (sin texto antes ni después):
{
  "salas": {
    "subject": "Asunto...",
    "body": "Cuerpo con {{nombre_sala}} y {{ciudad}}...",
    "guidelines": "Pautas de IA...",
    "explanation": "Adaptado para salas y teatros."
  },
  "festivales": { ... },
  "discotecas": { ... },
  "medios": { ... },
  "grupos": { ... },
  "managements": { ... },
  "ayuntamientos": { ... }
}`;

  let resultJson: any = null;
  if (ai) {
    try {
      const response = await generateContentWithFallback(ai, {
        contents: prompt,
        config: { temperature: 0.35, responseMimeType: "application/json" }
      });
      resultJson = safeParseJson(response?.text || "");
    } catch (err) {
      console.warn("AI multi-template generation failed, using fallback:", err);
    }
  }

  const results: Record<string, OptimizedTemplateResult> = {};

  for (const cat of categories) {
    if (resultJson && resultJson[cat] && resultJson[cat].subject && resultJson[cat].body) {
      results[cat] = {
        subject: resultJson[cat].subject,
        body: resultJson[cat].body,
        guidelines: resultJson[cat].guidelines || `Pautas adaptadas para ${CATEGORY_LABELS[cat]}`,
        explanation: resultJson[cat].explanation || `Generada y adaptada para ${CATEGORY_LABELS[cat]} a partir de la propuesta base.`,
        isSimulated: false
      };
    } else {
      // Fallback
      results[cat] = {
        subject: `Propuesta de directo: ${params.bandName} en {{nombre_sala}}`,
        body: `Hola, equipo de {{nombre_sala}}:\n\nSomos ${params.bandName}. ${params.baseProposal.slice(0, 150)}...\n\n¿Cómo tenéis el calendario para los próximos meses?\n\n¡Un saludo!\n${params.bandName}`,
        guidelines: `Pautas adaptadas a ${CATEGORY_LABELS[cat]}.`,
        explanation: `Plantilla base adaptada para ${CATEGORY_LABELS[cat]}.`,
        isSimulated: true
      };
    }
  }

  return results;
}

/**
 * Si esta categoría acumula AUTO_OPTIMIZE_FEEDBACK_THRESHOLD valoraciones o más desde la

 * última optimización, la regenera y persiste sola, sin esperar a que el mánager pulse
 * "optimizar con IA". Pensada para llamarse en segundo plano tras cada guardado
 * (POST /api/templates/save), igual que triggerSelfRefiningToneDnaBackground para pitches.
 */
export async function autoOptimizeCategoryTemplateIfDue(bandId: string, category: string, state: any): Promise<void> {
  try {
    const existing = await dbGetCategoryTemplates(bandId);
    const current = existing[category];
    if (!current) return;

    const pending = countUnoptimizedFeedback(current.feedbackLogs);
    if (pending < AUTO_OPTIMIZE_FEEDBACK_THRESHOLD) return;

    const { bandName, bandBio } = resolveBandNameAndBio(state, bandId);
    const feedbackSummaryLogs = getGlobalPitchFeedbackSummary(state.leads);
    const globalMemory = formatGlobalPitchFeedbackForPrompt(state.leads);

    const recentPending = (current.feedbackLogs || []).slice(-pending);
    const combinedInstruction = recentPending.map((l) => l.comment).filter(Boolean).join(" | ");
    const lastRatings = recentPending[recentPending.length - 1];

    const result = await generateOptimizedCategoryTemplate({
      bandName,
      bandBio,
      category,
      currentSubject: current.subject,
      currentBody: current.body,
      currentGuidelines: current.guidelines,
      toneRating: lastRatings?.toneRating,
      contentRating: lastRatings?.contentRating,
      customInstruction: combinedInstruction || current.customInstruction,
      globalMemory,
      feedbackCount: feedbackSummaryLogs.length
    });

    const feedbackLogs = [...(current.feedbackLogs || []), {
      timestamp: new Date().toISOString(),
      comment: `Auto-optimizada tras ${pending} valoraciones acumuladas sin revisar. ${result.explanation}`,
      source: "ai_optimization"
    }];

    await dbUpsertCategoryTemplate(bandId, category, {
      title: current.title,
      subject: result.subject,
      body: result.body,
      guidelines: result.guidelines,
      customInstruction: current.customInstruction,
      toneRating: current.toneRating,
      contentRating: current.contentRating,
      feedbackLogs
    });

    console.log(`[Auto-optimize plantilla] "${category}" de ${bandId} regenerada tras ${pending} valoraciones acumuladas.`);
  } catch (err: any) {
    console.warn("Notice during autoOptimizeCategoryTemplateIfDue:", err?.message || err);
  }
}
