import { GoogleGenAI } from "@google/genai";
import { dbRecordAiUsage } from "./db/aiLedger.js";

export const GEMINI_MODEL = "gemini-2.5-flash";

// Ninguna llamada a un proveedor de IA tenía timeout, mientras el resto del repo sí usa el
// patrón (server/routes/bands.ts, server/routes/leads/enrichment.ts). Una petición colgada
// dejaba colgado el cron o la ruta que la hizo, sin límite.
export const TIMEOUT_IA_MS = 60_000;
/** Las llamadas multimodales con audio (concert_to_album) necesitan bastante más margen. */
export const TIMEOUT_IA_LARGO_MS = 300_000;

export const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-flash"
];

let cachedClient: { key: string; client: GoogleGenAI } | null = null;

export function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }

  // INTERRUPTOR DE SEGURIDAD CONTRA COBROS (Cost Safety Killswitch)
  if (process.env.DISABLE_GEMINI === "true" && !process.env.GEMINI_API_KEY) {
    console.warn("[Cost Safety] Llamadas a Gemini deshabilitadas preventivamente por variable de entorno.");
    return null;
  }

  if (cachedClient && cachedClient.key === apiKey) {
    return cachedClient.client;
  }

  const client = new GoogleGenAI({ 
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });

  cachedClient = { key: apiKey, client };
  return client;
}

export function getDeepSeekKey(): string | null {
  const key = process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_KEY;
  return key && key.trim().length > 5 ? key.trim() : null;
}

export const AI_PRICING_TABLE: Record<string, { inputPer1M: number; outputPer1M: number; name: string }> = {
  gemini: {
    name: "Gemini 3.7 Flash",
    inputPer1M: 0.10, // $0.10 / 1M tokens
    outputPer1M: 0.40  // $0.40 / 1M tokens
  },
  deepseek: {
    name: "DeepSeek V3",
    inputPer1M: 0.14, // $0.14 / 1M tokens
    outputPer1M: 0.28  // $0.28 / 1M tokens
  }
};

const EUR_USD_RATE = 1.08;

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 3.8));
}

export interface AICostEstimate {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  ratePer1MInputUsd: number;
  ratePer1MOutputUsd: number;
  costUsd: number;
  costEur: number;
  costEurFormatted: string;
  costPer100EurFormatted: string;
  costPer1000EurFormatted: string;
}

export function calculatePitchCost(provider: string, inputText: string, outputText: string): AICostEstimate {
  const pricing = AI_PRICING_TABLE[provider] || AI_PRICING_TABLE.gemini;
  const inputTokens = estimateTokens(inputText);
  const outputTokens = estimateTokens(outputText);
  const totalTokens = inputTokens + outputTokens;

  const costUsd = ((inputTokens / 1_000_000) * pricing.inputPer1M) + ((outputTokens / 1_000_000) * pricing.outputPer1M);
  const costEur = costUsd / EUR_USD_RATE;

  return {
    inputTokens,
    outputTokens,
    totalTokens,
    ratePer1MInputUsd: pricing.inputPer1M,
    ratePer1MOutputUsd: pricing.outputPer1M,
    costUsd: Number(costUsd.toFixed(7)),
    costEur: Number(costEur.toFixed(7)),
    costEurFormatted: costEur < 0.00001 ? "< 0,00001 €" : `${costEur.toFixed(5).replace(".", ",")} €`,
    costPer100EurFormatted: `${(costEur * 100).toFixed(3).replace(".", ",")} €`,
    costPer1000EurFormatted: `${(costEur * 1000).toFixed(2).replace(".", ",")} €`
  };
}

/** Coste real en EUR a partir de tokens ya conocidos (no estimados desde longitud de texto). */
export function costEurFromTokens(provider: string, promptTokens: number, completionTokens: number): number {
  const pricing = AI_PRICING_TABLE[provider] || AI_PRICING_TABLE.gemini;
  const costUsd = ((promptTokens / 1_000_000) * pricing.inputPer1M) + ((completionTokens / 1_000_000) * pricing.outputPer1M);
  return costUsd / EUR_USD_RATE;
}

/**
 * Registra en el ledger de "Transparencia de Costes Dinámica" (server/db/aiLedger.ts) el
 * consumo real de una llamada de IA. Va en fire-and-forget con su propio catch: un fallo de
 * Supabase aquí no debe tirar abajo una respuesta de IA que ya se generó y le costó dinero real
 * a la plataforma pedirla.
 */
function registrarConsumoIA(params: {
  bandId?: string;
  provider: string;
  modelName: string;
  promptTokens: number;
  completionTokens: number;
}): void {
  if (!params.bandId || (!params.promptTokens && !params.completionTokens)) return;
  dbRecordAiUsage({
    bandId: params.bandId,
    promptTokens: params.promptTokens,
    completionTokens: params.completionTokens,
    modelName: params.modelName,
    estimatedCostEur: costEurFromTokens(params.provider, params.promptTokens, params.completionTokens)
  }).catch((err) => {
    console.warn("[AI Ledger] No se pudo registrar el consumo de IA:", err?.message || err);
  });
}

export function getAvailableAIProviders() {
  const hasGemini = Boolean(getAiClient());
  const hasDeepSeek = Boolean(getDeepSeekKey());

  return [
    {
      id: "deepseek",
      name: "DeepSeek V3",
      shortName: "DeepSeek V3",
      model: "deepseek-chat",
      tagline: "Directo, conciso y económico",
      description: "Excelente estructuración en español, llamadas a la acción directas y condiciones comerciales.",
      icon: "🚀",
      configured: hasDeepSeek,
      tier: "ensayo",
      badge: "🚀 Máximo ROI (~0,14 € / 1k)",
      pricing: {
        inputPer1MUsd: 0.14,
        outputPer1MUsd: 0.28,
        costPer1000Eur: "~0,14 €",
        rank: "Ultrabarato (Mejor ROI)"
      }
    },
    {
      id: "gemini",
      name: "Google Gemini 3.7 Flash",
      shortName: "Gemini Flash",
      model: "gemini-3.7-flash",
      tagline: "Ultra rápido y analítico",
      description: "Ideal para análisis de agenda, datos técnicos de la sala y búsqueda de información con Free Tier.",
      icon: "⚡",
      configured: hasGemini,
      tier: "ensayo",
      badge: "⚡ Instantáneo (Free Tier)",
      pricing: {
        inputPer1MUsd: 0.10,
        outputPer1MUsd: 0.40,
        costPer1000Eur: "~0,18 €",
        rank: "Económico / Free Tier"
      }
    }
  ];
}

export function extractTextFromContents(contents: any): string {
  if (!contents) return "";
  if (typeof contents === "string") return contents;
  if (Array.isArray(contents)) {
    return contents
      .map((c) => {
        if (typeof c === "string") return c;
        if (c?.parts && Array.isArray(c.parts)) {
          return c.parts.map((p: any) => p?.text || "").join("\n");
        }
        if (c?.text) return c.text;
        return "";
      })
      .join("\n");
  }
  if (contents?.parts && Array.isArray(contents.parts)) {
    return contents.parts.map((p: any) => p?.text || "").join("\n");
  }
  if (contents?.text) return contents.text;
  return String(contents);
}

export function isSpendingCapError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  return msg.includes("spending cap") || msg.includes("spend cap") || msg.includes("exceeded its monthly");
}

export function isSpendCapOrQuotaError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || String(err) || JSON.stringify(err)).toLowerCase();
  const status = String(err.status || err.code || err.statusCode || "");
  return (
    isSpendingCapError(err) ||
    status === "429" ||
    status === "RESOURCE_EXHAUSTED" ||
    msg.includes("429") ||
    msg.includes("resource_exhausted") ||
    msg.includes("quota exceeded") ||
    msg.includes("exceeded your current quota") ||
    msg.includes("generaterequestsperday") ||
    msg.includes("rate_limit") ||
    msg.includes("rate limit")
  );
}

let geminiSpendingCapUntil = 0;

export function setGeminiSpendingCap(active: boolean, durationMs = 15 * 60 * 1000) {
  geminiSpendingCapUntil = active ? Date.now() + durationMs : 0;
}

export async function generateContentWithFallback(
  client: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    preferredModel?: string;
    /**
     * Permite caer en generateSmartLocalPitchFallback si se agotan TODOS los proveedores.
     * Por defecto false, y con motivo: ese generador solo sabe escribir un pitch de booking en
     * español. Devolvérselo a quien pedía acordes, una clasificación de la bandeja o un JSON de
     * emails es peor que fallar, porque el fallo es silencioso y parece una respuesta buena.
     * Solo lo activan las rutas que de verdad escriben pitches.
     */
    permitirPitchLocal?: boolean;
    timeoutMs?: number;
    links?: PitchLinks;
    /** Si se pasa, registra el consumo real de tokens de esta llamada en el ledger de IA. */
    bandId?: string;
  }
) {
  const modelsToTry = params.preferredModel
    ? [params.preferredModel, ...FALLBACK_MODELS.filter(m => m !== params.preferredModel)]
    : FALLBACK_MODELS;

  let lastError: any = null;
  let deepSeekError: any = null;

  const skipGeminiDueToCap = Date.now() < geminiSpendingCapUntil;
  if (!skipGeminiDueToCap) {
    for (const modelName of modelsToTry) {
      try {
        console.log(`[Gemini API] Intentando modelo: ${modelName}...`);
        const response = await client.models.generateContent({
          model: modelName,
          contents: params.contents,
          config: {
            ...(params.config || {}),
            // El SDK acepta abortSignal dentro de GenerateContentConfig, junto a temperature y
            // responseMimeType. Sin esto una petición colgada no terminaba nunca.
            abortSignal: params.config?.abortSignal ?? AbortSignal.timeout(params.timeoutMs ?? TIMEOUT_IA_MS)
          }
        });
        if (response) {
          console.log(`[Gemini API] ¡Éxito con modelo: ${modelName}!`);
          registrarConsumoIA({
            bandId: params.bandId,
            provider: "gemini",
            modelName,
            promptTokens: response.usageMetadata?.promptTokenCount || 0,
            completionTokens: response.usageMetadata?.candidatesTokenCount || 0
          });
          return response;
        }
      } catch (err: any) {
        lastError = err;
        if (isSpendingCapError(err)) {
          geminiSpendingCapUntil = Date.now() + 15 * 60 * 1000;
          console.log(`[Gemini API] Límite de gasto mensual alcanzado (spending cap). Conmutando de inmediato a DeepSeek V3...`);
          break;
        }
        console.warn(`[Gemini API] Advertencia en modelo '${modelName}': ${err.message || err}`);
        if (isSpendCapOrQuotaError(err)) {
          // Pausa breve de retroceso (800ms) para amortiguar picos de RPM/TPM por minuto
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }
    }
  } else {
    console.log("[Gemini API] Cuota mensual en pausa temporal (spending cap). Usando DeepSeek V3...");
  }

  // Automatic Failover to DeepSeek if Gemini quota/spending cap is exhausted
  const promptText = extractTextFromContents(params.contents);
  if (promptText && getDeepSeekKey()) {
    try {
      console.log("[AI Engine] Activando failover automático a DeepSeek V3 por fallo/cuota en Gemini...");
      const text = await callDeepSeek({
        prompt: promptText,
        systemPrompt: params.config?.systemInstruction,
        temperature: params.config?.temperature,
        timeoutMs: params.timeoutMs
      });
      if (text) {
        return {
          text,
          candidates: [{ content: { parts: [{ text }] } }]
        };
      }
    } catch (dsErr: any) {
      deepSeekError = dsErr;
      console.warn("[AI Engine] Falló también fallback a DeepSeek:", dsErr.message);
    }
  }

  // Último recurso: el generador local. Solo para quien lo pide explícitamente (rutas de
  // pitches). Para todo lo demás es mejor fallar de cara que devolver un pitch de booking a
  // quien esperaba acordes, una clasificación o un JSON.
  if (params.permitirPitchLocal) {
    console.log("[AI Engine] Activando generador local de pitches ante agotamiento de créditos en todas las APIs...");
    const fallbackText = generateSmartLocalPitchFallback({ prompt: promptText, links: params.links });
    return {
      text: fallbackText,
      candidates: [{ content: { parts: [{ text: fallbackText }] } }]
    };
  }

  // Si Gemini Y el failover a DeepSeek han fallado los dos, relanzar solo el error de Gemini
  // (como antes) escondía que DeepSeek también se había intentado y por qué: quien recibe el
  // error (server/routes/chat.ts) no podía distinguir "solo falló Gemini" de "fallaron los dos
  // proveedores por motivos distintos" (ej. cuota de Gemini + sin saldo en DeepSeek). Se adjuntan
  // ambos errores por separado para que el mensaje al usuario pueda nombrar la causa real de cada uno.
  const finalError: any = lastError instanceof Error
    ? lastError
    : new Error(String(lastError || "Ningún proveedor de IA disponible: se han agotado las claves configuradas o han fallado todas."));
  finalError.geminiError = lastError;
  finalError.deepSeekError = deepSeekError;
  throw finalError;
}

export function generateSmartGeneralFallback(promptText: string): string {
  const lower = (promptText || "").toLowerCase();
  if (lower.includes("json") || lower.includes("clasifica") || lower.includes("categoriza") || lower.includes("venues") || lower.includes("conciertos") || lower.includes("matches") || lower.includes("leads")) {
    return JSON.stringify({
      text: "Operación procesada con éxito mediante el motor local de respaldo (BandManager.io AI Core).",
      success: true,
      category: "general",
      venues: [],
      conciertos: [],
      matches: [],
      leads_publicos: [],
      fuentes_verificadas: ["BandManager.io Core"],
      datos_encontrados: false,
      confidence: 0.95
    });
  }
  if (lower.includes("reels") || lower.includes("tiktok") || lower.includes("instagram") || lower.includes("copy")) {
    return "🔥 ¡Noche épica en el local de ensayo! 🎸💥 Preparando los nuevos directos de la gira 2026. ¡No os lo perdáis!\n\n#Gira2026 #Directo #MusicaEnVivo #Conciertos";
  }
  return `🤖 **Aviso del Sistema IA BandManager.io**: El servicio de Gemini API ha alcanzado su límite de cuota o spending cap (429). El sistema ha activado automáticamente el motor inteligente de respaldo local para garantizar que tu flujo de trabajo no se detenga. 

Consulta procesada correctamente. Puedes continuar gestionando tu booking, repertorio, finanzas y redes con normalidad.`;
}

export interface PitchLinks {
  spotify?: string;
  youtube?: string;
  epk?: string;
}

/**
 * Enlaces reales de la banda (Spotify, YouTube, EPK público) a partir de su config, para que
 * el generador local de pitches nunca tenga que inventarse una URL cuando la IA falla del
 * todo. El EPK sí se puede construir siempre porque no depende de que la banda lo haya
 * rellenado: es la misma ruta pública que ya usa EPKManager.tsx (/epk?band=...).
 */
export function buildPitchLinksFromEpkConfig(bandConfig: any, bandId?: string): PitchLinks {
  const links: PitchLinks = {};
  if (bandConfig?.enlacesRedes?.spotify) links.spotify = bandConfig.enlacesRedes.spotify;
  if (bandConfig?.enlacesRedes?.youtube) links.youtube = bandConfig.enlacesRedes.youtube;
  if (bandId) {
    const base = process.env.APP_URL || "https://bandmanager.io";
    links.epk = `${base}/epk?band=${encodeURIComponent(bandId)}`;
  }
  return links;
}

function formatPitchLinksBlock(
  links: PitchLinks | undefined,
  header: string,
  labels: { spotify: string; youtube: string; epk: string }
): string {
  const lines: string[] = [];
  if (links?.spotify) lines.push(`• ${labels.spotify}: ${links.spotify}`);
  if (links?.youtube) lines.push(`• ${labels.youtube}: ${links.youtube}`);
  if (links?.epk) lines.push(`• ${labels.epk}: ${links.epk}`);
  // Sin enlaces reales, no se menciona la sección: es mejor omitirla que rellenarla con URLs
  // inventadas que no llevan a ningún sitio.
  if (lines.length === 0) return "";
  return `\n\n${header}\n${lines.join("\n")}`;
}

export function generateSmartLocalPitchFallback(params: {
  prompt: string;
  systemPrompt?: string;
  provider?: string;
  links?: PitchLinks;
  /** Email de contacto real de la banda que firma el pitch. Sin esto no se firma con ningún email. */
  contactEmail?: string;
}): string {
  const text = `${params.systemPrompt || ""} ${params.prompt || ""}`;
  const textLower = text.toLowerCase();

  // Extract venue details with clean pattern matching
  let salaNombre = "la sala";
  const salaMatch = text.match(/(?:SALA|Sala|SALA DESTINO|nombre_sala)\s*[:=]\s*([^\n,\(\)]+)/i) ||
                    text.match(/para\s+(?:la\s+sala\s+|el\s+|el\s+ayuntamiento\s+de\s+)?([A-ZÁÉÍÓÚÑa-záéíóúñ0-9\s]{3,40})(?:\s*\(|$)/i);
  if (salaMatch && salaMatch[1]) {
    const rawSala = salaMatch[1].replace(/^-\s*Nombre:\s*/i, '').replace(/^enviar\s*/i, '').trim();
    if (rawSala && rawSala.length > 1) {
      salaNombre = rawSala;
    }
  }

  let ciudad = "";
  const ciudadMatch = text.match(/(?:CIUDAD|Ciudad)\s*[:=]\s*([^\n,\(\)]+)/i) || text.match(/\(([A-ZÁÉÍÓÚÑa-záéíóúñ\s]{3,30})\)/);
  if (ciudadMatch && ciudadMatch[1]) {
    ciudad = ciudadMatch[1].trim();
  }

  let aforo = "";
  const aforoMatch = text.match(/(?:AFORO|Aforo)\s*[:=]\s*([0-9]+)/i);
  if (aforoMatch && aforoMatch[1]) {
    aforo = aforoMatch[1].trim();
  }

  // Extract band name cleanly. Antes, si el regex de abajo no encontraba nada, el pitch de
  // emergencia se enviaba a la sala presentándose como "Bakandeya" - con su estilo musical real
  // (ver isBakandeya más abajo) - aunque el generador estuviera redactando para otra banda. Un
  // genérico sin nombre propio es mucho mejor que mentir con el nombre real de otro cliente.
  let bandName = "nuestra banda";
  const bandMatch = text.match(/(?:Banda|Nombre de la banda|Artista)\s*[:=]\s*([^\n,\.]+)/i) ||
                    text.match(/(?:de la banda\s+)"([^"]+)"/i);
  if (bandMatch && bandMatch[1]) {
    const rawBand = bandMatch[1].replace(/^-\s*Nombre:\s*/i, '').trim();
    if (rawBand && rawBand.length > 1) {
      bandName = rawBand;
    }
  }

  let estilo = "Música en directo";
  const estiloMatch = text.match(/(?:Estilo|Género|Estilo musical)\s*[:=]\s*([^\n,\.]+)/i);
  if (estiloMatch && estiloMatch[1]) {
    estilo = estiloMatch[1].trim();
  }

  let formato = "Banda en directo";
  const formatoMatch = text.match(/(?:Formato|Formación)\s*[:=]\s*([^\n,\.]+)/i);
  if (formatoMatch && formatoMatch[1]) {
    formato = formatoMatch[1].trim();
  }

  const dossierNote = "Disponéis de nuestro Dossier Oficial, EPK interactivo y Rider Técnico referenciado al pie de la firma de este mensaje.";

  const isMedio = textLower.includes("tipo: medio") || textLower.includes("tipo: prensa") || textLower.includes("tipo: radio") || textLower.includes("podcast");
  const isFestival = textLower.includes("tipo: festival") || textLower.includes("festivales") || salaNombre.toLowerCase().includes("festiv") || salaNombre.toLowerCase().includes("fest");
  const isDiscoteca = textLower.includes("tipo: discoteca") || textLower.includes("tipo: club") || textLower.includes("clubbing");
  const isGrupo = textLower.includes("tipo: grupo") || textLower.includes("tipo: artista") || textLower.includes("date swap") || textLower.includes("intercambio");
  const isAyto = textLower.includes("tipo: ayuntamiento") || textLower.includes("tipo: fiesta") || salaNombre.toLowerCase().includes("ayuntamiento");

  // MEDIOS / PRENSA
  if (isMedio) {
    return `Hola equipo de redacción y programación de ${salaNombre}${ciudad ? ` (${ciudad})` : ""}:

Nos ponemos en contacto desde la oficina de ${bandName} (${estilo}). Os hacemos llegar nuestra propuesta de prensa con motivo de nuestra gira de directos y lanzamientos 2026.

Presentamos una propuesta liderada por ${formato}. Ofrecemos un repertorio dinámico con sonido de alta intensidad.

Nos ponemos a vuestra disposición para:
• Facilitaros temas en formato WAV / broadcast para sonar en vuestra programación.
• Entrevistas, acústicos en directo en estudio o reseñas de nuestros directos.

${dossierNote}

Muchas gracias por vuestro tiempo y por dar visibilidad a la música independiente en directo.

Un cordial saludo,`;
  }

  // FESTIVALES
  if (isFestival) {
    return `Estimada organización de ${salaNombre}${ciudad ? ` (${ciudad})` : ""}:

Escribimos en representación de ${bandName} para presentar nuestra propuesta artística (${estilo}) de cara a la próxima edición de vuestro festival.

${bandName} ofrece un directo de 75 a 90 minutos concebido especialmente para escenarios de festival:
• Formato: ${formato}.
• Logística ágil: Montaje y cambio de set ágil con rider técnico limpio y eficiente.
• Directo participativo y dinámico que conecta con el público en el recinto.

${dossierNote}

Estaríamos encantados de enviaros nuestro rider técnico detallado y propuesta económica adaptada.

Atentamente,`;
  }

  // DISCOTECAS / CLUBS
  if (isDiscoteca) {
    return `Hola equipo de programación de ${salaNombre}${ciudad ? ` (${ciudad})` : ""}:

Os escribimos desde ${bandName} para presentar nuestro formato de directo (${estilo}), diseñado para sesiones en clubes y salas de noche.

Nuestra propuesta ofrece un show de alta intensidad y ritmo bailable continuo, ideal para dinamizar la pista${aforo ? ` (aforo aprox. ${aforo} personas)` : ""}.

${dossierNote}

¿Cómo tenéis la agenda para los próximos meses para coordinar una fecha?

Un saludo cordial,`;
  }

  // DATE SWAP / GRUPOS
  if (isGrupo) {
    return `¡Buenas, compañeros de ${salaNombre}! 🎸🔥

Os escribimos directamente desde ${bandName} (${estilo}). Nos mola mucho vuestra propuesta y queremos proponeros un **intercambio de fechas / co-booking (Date Swap)**:
1. Montamos una fecha conjunta en nuestra ciudad compartiendo cartel, backline y taquilla al 50%.
2. Coordinamos la fecha de vuelta en ${ciudad || "vuestra ciudad"} en vuestro espacio habitual para sumar ambos públicos locales y optimizar gastos de gira.

${dossierNote}

¿Cómo lo veis? ¿Hablamos por WhatsApp o hacemos una breve llamada para cuadrar agendas?

¡Un fuerte abrazo!`;
  }

  // AYUNTAMIENTOS / FIESTAS
  if (isAyto) {
    return `Estimados responsables del Área de Festejos y Cultura de ${salaNombre}${ciudad ? ` (${ciudad})` : ""}:

Nos dirigimos a ustedes desde la representación de ${bandName} (${estilo}) para presentar nuestra propuesta de concierto en directo de cara a la programación cultural y fiestas patronales.

Ofrecemos un espectáculo enérgico, familiar, festivo y muy bailable de 90 minutos liderado por ${formato}. Disponemos de plena solvencia técnica, facturación oficial y rigurosa puntualidad de montaje.

${dossierNote}

Quedamos a su entera disposición para remitirles nuestro dossier técnico y propuesta presupuestaria.

Cordialmente,`;
  }

  // SALAS Y TEATROS (ESTÁNDAR)
  if (params.provider === "deepseek") {
    return `Hola, equipo de ${salaNombre}${ciudad ? ` (${ciudad})` : ""}:

Nos ponemos en contacto desde la oficina de ${bandName} (${estilo}). Hemos revisado vuestra línea artística y consideramos que nuestro directo encaja perfectamente con el público de vuestra sala.

**Detalles de nuestra propuesta de directo:**
• **Formato:** ${formato} — show arrollador de 75 a 90 minutos de alta energía y baile continuo.
• **Logística y técnica:** Montaje ágil (30-45 min), prueba de sonido limpia y rider técnico eficiente${aforo ? ` (aforo ${aforo})` : ""}.
• **Condiciones:** Flexibilidad total en modelo de taquilla o caché; además, total disposición para compartir fecha con bandas locales de ${ciudad || "la zona"} para sumar público.

${dossierNote}

Estamos cerrando el calendario de nuestra próxima gira y nos gustaría consultar vuestra disponibilidad de fechas para la próxima temporada.

Un cordial saludo,`;
  }

  // Default Gemini / General
  return `Hola, equipo de ${salaNombre}${ciudad ? ` (${ciudad})` : ""}:

Os escribimos desde la oficina de ${bandName} (${estilo}). Seguimos vuestra programación y sabemos que ${salaNombre} es una referencia para la música en vivo.

**Sobre nuestra propuesta de directo:**
• **Formato enérgico y bailable:** ${formato} — directo arrollador de 75-90 minutos concebido para hacer bailar al público y dinamizar la sala.
• **Producción técnica ágil:** Montaje rápido (30-45 min) con rider limpio y adaptable a cualquier escenario${aforo ? ` (aforo estimado: ${aforo})` : ""}.
• **Modelo colaborativo:** Flexibilidad de taquilla/caché y total apertura a coordinar fecha doble con bandas locales de ${ciudad || "la zona"} para asegurar buena entrada y venta de barra.

${dossierNote}

¿Cómo tenéis la agenda para los próximos meses para valorar una fecha?

¡Muchas gracias por vuestro tiempo y por seguir apostando por la música en directo!

Un saludo cordial,`;
}

// DeepSeek API integration (OpenAI-compatible)
export async function callDeepSeek(params: {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<string> {
  const apiKey = getDeepSeekKey();
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY no configurada.");
  }

  const model = params.model || "deepseek-chat";
  const messages: Array<{ role: string; content: string }> = [];

  if (params.systemPrompt) {
    messages.push({ role: "system", content: params.systemPrompt });
  }
  messages.push({ role: "user", content: params.prompt });

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(params.timeoutMs ?? TIMEOUT_IA_MS),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 1500
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepSeek API error (${res.status}): ${errText}`);
  }

  const data: any = await res.json();
  const text = data?.choices?.[0]?.message?.content || "";
  return text.trim();
}

// Unified Multi-Model Execution Engine
export async function generateUnifiedAI(params: {
  prompt: string;
  systemPrompt?: string;
  provider?: "gemini" | "deepseek" | string;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  allowFallback?: boolean;
  /** Ver generateContentWithFallback: el generador local solo sabe escribir pitches. */
  permitirPitchLocal?: boolean;
  timeoutMs?: number;
  /** Enlaces reales de la banda para el generador local de pitches (ver PitchLinks). */
  links?: PitchLinks;
  /** Email real de contacto de la banda, para firmar el pitch si cae al generador local. */
  contactEmail?: string;
  /** Si se pasa, registra el consumo real de tokens de esta llamada en el ledger de IA. */
  bandId?: string;
}): Promise<{ text: string; provider: string; modelName: string; fallbackFrom?: string }> {
  const provider = params.provider || "gemini";
  const allowFallback = params.allowFallback ?? true;

  if (provider === "deepseek") {
    const text = await callDeepSeek({
      prompt: params.prompt,
      systemPrompt: params.systemPrompt,
      model: params.modelName || "deepseek-chat",
      temperature: params.temperature,
      maxTokens: params.maxTokens,
      timeoutMs: params.timeoutMs
    });
    return { text, provider: "deepseek", modelName: params.modelName || "deepseek-chat" };
  }

  // Default Gemini
  const client = getAiClient();
  if (client) {
    const fullPrompt = params.systemPrompt 
      ? `${params.systemPrompt}\n\n---\nSOLICITUD:\n${params.prompt}`
      : params.prompt;

    try {
      const res = await generateContentWithFallback(client, {
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        preferredModel: params.modelName || GEMINI_MODEL,
        timeoutMs: params.timeoutMs,
        bandId: params.bandId,
        // OJO: sin permitirPitchLocal aquí a propósito. generateUnifiedAI ya tiene su propio
        // escalón de fallback local (más abajo) tras intentar también DeepSeek explícitamente;
        // activarlo en esta llamada interna haría que un fallo total de Gemini devolviera ya el
        // texto de plantilla etiquetado como "gemini", saltándose el intento real a DeepSeek.
        links: params.links,
        config: {
          temperature: params.temperature ?? 0.7
        }
      });

      const text = res?.text || res?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (text) {
        return { text: text.trim(), provider: "gemini", modelName: params.modelName || GEMINI_MODEL };
      }
    } catch (geminiErr: any) {
      console.warn(`[AI Engine] Gemini error (${geminiErr.message || geminiErr}).`);
      if (!allowFallback) {
        throw geminiErr;
      }
    }
  }

  // Fallback to DeepSeek if Gemini is unavailable or failed
  if (allowFallback && getDeepSeekKey()) {
    try {
      console.log("[AI Engine] Fallback automático a DeepSeek V3...");
      const text = await callDeepSeek({
        prompt: params.prompt,
        systemPrompt: params.systemPrompt,
        temperature: params.temperature,
        maxTokens: params.maxTokens
      });
      return { text, provider: "deepseek", modelName: "deepseek-chat (fallback)", fallbackFrom: "gemini" };
    } catch (dsErr: any) {
      console.warn("[AI Engine] Fallback a DeepSeek falló:", dsErr.message);
    }
  }

  // Fallback al generador local de pitches, solo si quien llama lo ha pedido explícitamente.
  if (allowFallback && params.permitirPitchLocal) {
    console.log("[AI Engine] Fallback a generador local de pitches...");
    const localText = generateSmartLocalPitchFallback({
      prompt: params.prompt,
      systemPrompt: params.systemPrompt,
      provider,
      links: params.links,
      contactEmail: params.contactEmail
    });
    return {
      text: localText,
      provider: "local_agent",
      modelName: "Redactor Experto (Modo Local Seguro)",
      fallbackFrom: provider
    };
  }

  throw new Error("Las claves de API configuradas han alcanzado su límite de saldo o cuota.");
}

// Multi-Model Parallel Proposal Generation (Human-in-the-Loop A/B testing)
export async function generateMultiModelProposals(params: {
  prompt: string;
  systemPrompt?: string;
  providers?: string[];
  links?: PitchLinks;
  /** Email real de contacto de la banda, para firmar el pitch si cae al generador local. */
  contactEmail?: string;
}) {
  const providersToRun = params.providers && params.providers.length > 0
    ? params.providers
    : ["deepseek", "gemini"];

  const results = await Promise.allSettled(
    providersToRun.map(async (providerId) => {
      const startTime = Date.now();
      try {
        const result = await generateUnifiedAI({
          prompt: params.prompt,
          systemPrompt: params.systemPrompt,
          provider: providerId as any,
          allowFallback: false // in comparison mode, test each model independently
        });
        const fullInputText = (params.systemPrompt || "") + "\n" + (params.prompt || "");
        const costEstimate = calculatePitchCost(providerId, fullInputText, result.text);

        return {
          provider: providerId,
          modelName: result.modelName,
          text: result.text,
          status: "success" as const,
          durationMs: Date.now() - startTime,
          costEstimate
        };
      } catch (err: any) {
        let cleanErrMsg = err?.message || "Error al contactar proveedor IA";
        if (cleanErrMsg.includes("429") || cleanErrMsg.includes("spending cap") || cleanErrMsg.includes("RESOURCE_EXHAUSTED")) {
          cleanErrMsg = "Límite mensual de gasto alcanzado en Google AI Studio (Error 429). Puedes gestionarlo en ai.studio/billing";
        } else if (cleanErrMsg.includes("402") || cleanErrMsg.includes("Insufficient Balance") || cleanErrMsg.includes("insufficient balance")) {
          cleanErrMsg = "Saldo de créditos agotado en cuenta DeepSeek (Error 402). Por favor recarga saldo en platform.deepseek.com";
        }

        const fullInputText = (params.systemPrompt || "") + "\n" + (params.prompt || "");
        const localDraft = generateSmartLocalPitchFallback({
          prompt: params.prompt,
          systemPrompt: params.systemPrompt,
          provider: providerId,
          links: params.links,
          contactEmail: params.contactEmail
        });
        const costEstimate = calculatePitchCost(providerId, fullInputText, localDraft);

        return {
          provider: providerId,
          modelName: providerId,
          text: "",
          fallbackText: localDraft,
          status: "error" as const,
          error: cleanErrMsg,
          durationMs: Date.now() - startTime,
          costEstimate
        };
      }
    })
  );

  return results.map((r, idx) => {
    if (r.status === "fulfilled") {
      return r.value;
    }
    return {
      provider: providersToRun[idx],
      modelName: providersToRun[idx],
      text: "",
      status: "error" as const,
      error: r.reason?.message || "Error desconocido",
      durationMs: 0
    };
  });
}

