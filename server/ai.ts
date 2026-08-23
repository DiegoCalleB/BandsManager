import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL = "gemini-3.7-flash";

// Ninguna llamada a un proveedor de IA tenía timeout, mientras el resto del repo sí usa el
// patrón (server/routes/bands.ts, server/routes/leads/enrichment.ts). Una petición colgada
// dejaba colgado el cron o la ruta que la hizo, sin límite.
export const TIMEOUT_IA_MS = 60_000;
/** Las llamadas multimodales con audio (concert_to_album) necesitan bastante más margen. */
export const TIMEOUT_IA_LARGO_MS = 300_000;

export const FALLBACK_MODELS = [
  "gemini-3.7-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite"
];

let cachedClient: { key: string; client: GoogleGenAI } | null = null;

export function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
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
  }
) {
  const modelsToTry = params.preferredModel 
    ? [params.preferredModel, ...FALLBACK_MODELS.filter(m => m !== params.preferredModel)]
    : FALLBACK_MODELS;

  let lastError: any = null;

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
        return response;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini API] Falló modelo '${modelName}': ${err.message || err}`);
    }
  }

  // Automatic Failover to DeepSeek if Gemini quota/spending cap is exhausted
  const promptText = extractTextFromContents(params.contents);
  if (promptText && getDeepSeekKey()) {
    try {
      console.log("[AI Engine] Activando failover automático a DeepSeek V3 por fallo/cuota en Gemini...");
      const text = await callDeepSeek({ prompt: promptText, temperature: params.config?.temperature, timeoutMs: params.timeoutMs });
      if (text) {
        return {
          text,
          candidates: [{ content: { parts: [{ text }] } }]
        };
      }
    } catch (dsErr: any) {
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

  throw lastError instanceof Error
    ? lastError
    : new Error("Ningún proveedor de IA disponible: se han agotado las claves configuradas o han fallado todas.");
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
    const base = process.env.APP_URL || "https://bands-manager.up.railway.app";
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
}): string {
  const text = `${params.systemPrompt || ""} ${params.prompt || ""}`;

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

  // Extract band name cleanly
  let bandName = "Bakandeya";
  const bandMatch = text.match(/(?:Banda|Nombre de la banda|Artista)\s*[:=]\s*([^\n,\.]+)/i);
  if (bandMatch && bandMatch[1]) {
    const rawBand = bandMatch[1].replace(/^-\s*Nombre:\s*/i, '').trim();
    if (rawBand && rawBand.length > 1) {
      bandName = rawBand;
    }
  }

  if (params.provider === "deepseek") {
    return `Hola, equipo de ${salaNombre}${ciudad ? ` (${ciudad})` : ""}:

Nos ponemos en contacto desde la oficina de ${bandName}. Hemos revisado vuestra línea artística y consideramos que nuestro directo encaja con el perfil de vuestra programación.

Estamos cerrando las fechas de nuestra próxima gira y nos gustaría presentaros nuestra disponibilidad para tocar en ${salaNombre}.${formatPitchLinksBlock(params.links, "Enlaces de audio y vídeo en directo:", { spotify: "Escuchar en Spotify", youtube: "Ver Directo en YouTube", epk: "Dossier de Prensa / EPK" })}

Condiciones y propuesta técnica:
• Formato: Concierto en sala${aforo ? ` (aforo ${aforo})` : ""}
• Caché / Taquilla: Abiertos a valorar taquilla con garantía o porcentaje según vuestro modelo habitual.

¿Tenéis disponibilidad en los próximos meses? Quedamos a vuestra disposición para concretar detalles.

Un cordial saludo,
Equipo de Booking & Management — ${bandName}
contacto@bakandeya.com`;
  }

  // Default Gemini / General template
  return `Hola, equipo de ${salaNombre}${ciudad ? ` (${ciudad})` : ""}:

Os escribimos desde ${bandName}. Hemos estado siguiendo vuestra programación de conciertos y creemos que nuestra propuesta encaja a la perfección con la línea y el público de vuestra sala.

Actualmente nos encontramos planificando las próximas fechas de gira y nos encantaría valorar opciones de calendario para presentar nuestro directo en ${salaNombre}.${formatPitchLinksBlock(params.links, "Aquí tenéis nuestros enlaces oficiales para escuchar el material y ver el directo:", { spotify: "Spotify / Streaming", youtube: "Directo en YouTube", epk: "Dossier y Rider Técnico" })}

Quedamos a vuestra entera disposición para comentar disponibilidad de fechas, condiciones de taquilla o caché y cualquier detalle técnico.

¡Muchas gracias por vuestro tiempo y por apostar siempre por la música en vivo!

Un saludo,
Equipo de Booking — ${bandName}
contacto@bakandeya.com`;
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
      links: params.links
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
          links: params.links
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

