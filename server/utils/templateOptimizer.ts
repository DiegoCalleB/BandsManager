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
  const isBakandeya = cleanId === "bakandeya";
  const bandName = registeredBand?.nombre_banda || registeredBand?.bandName || bandConfig?.contactoBooking?.nombre || bandConfig?.nombre_banda ||
    (isBakandeya ? "Bakandeya" : cleanId.charAt(0).toUpperCase() + cleanId.slice(1));
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

  return `Eres el Especialista Director de Redacción de la banda "${params.bandName}" (${params.bandBio || "banda de música en directo"}).
Tu tarea es REGENERAR Y OPTIMIZAR la plantilla de correo por defecto y sus pautas de IA para la categoría: "${categoryLabel}".

PLANTILLA ACTUAL:
- Asunto: "${params.currentSubject || ""}"
- Cuerpo: "${params.currentBody || ""}"
- Pautas de IA: "${params.currentGuidelines || ""}"

VALORACIÓN DIRECTA DEL MÁNAGER SOBRE ESTA PLANTILLA ACTUAL:
- Tono y Estilo: ${params.toneRating ? `${params.toneRating}/5 estrellas` : "Sin calificar"}
- Contenido y Estructura: ${params.contentRating ? `${params.contentRating}/5 estrellas` : "Sin calificar"}

${params.customInstruction && params.customInstruction.trim() ? `INSTRUCCIÓN / COMENTARIO DIRECTO DEL MÁNAGER PARA ESTA PLANTILLA (CUMPLIR OBLIGATORIAMENTE):
"${params.customInstruction.trim()}"` : ""}

MEMORIA COMPLETA Y APRENDIZAJES ACUMULADOS DE VALORACIONES Y CORRECCIONES PREVIAS DEL MÁNAGER EN OTROS CORREOS (${params.feedbackCount} entradas de feedback):
${params.globalMemory}

INSTRUCCIONES DE OPTIMIZACIÓN CON APRENDIZAJE AUTOMÁTICO:
1. Si el mánager ha dado una puntuación baja en Tono/Estilo (1-3/5), ajusta radicalmente la voz, el ritmo y la cercanía/respeto del mensaje. Si ha dado puntuación baja en Contenido/Estructura (1-3/5), reorganiza los bloques de información, acorta o aclara los puntos clave.
2. Si el mánager ha introducido un comentario o instrucción específica arriba, cúplela como máxima prioridad.
3. Analiza cuidadosamente todo el feedback acumulado del mánager en correos anteriores. Si ha pedido acortar correos, cambiar el tono, destacar el violín o evitar clichés, aplica esos aprendizajes para perfeccionar esta plantilla.
4. Preserva las variables dinámicas de plantilla en el cuerpo si son útiles: {{nombre_sala}}, {{ciudad}}, {{website}}, etc.
5. Asegúrate de mantener la firma y personalidad de ${params.bandName}.
6. Devuelve un objeto JSON VÁLIDO exactamente con esta estructura (sin texto alrededor):
{
  "subject": "Asunto optimizado para ${categoryLabel}",
  "body": "Cuerpo completo de la plantilla optimizado...",
  "guidelines": "Nuevas pautas de IA refinadas para que el agente Redactor las aplique...",
  "explanation": "Explicación breve (1-2 frases) de qué aprendizajes, estrellas e instrucciones del mánager se han aplicado en esta regeneración."
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
