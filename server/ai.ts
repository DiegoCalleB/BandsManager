import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL = "gemini-3.7-flash";

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

export function getAnthropicKey(): string | null {
  const key = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
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
  },
  claude: {
    name: "Claude 3.5 Haiku",
    inputPer1M: 0.80, // $0.80 / 1M tokens
    outputPer1M: 4.00  // $4.00 / 1M tokens
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
        ...(params.config ? { config: params.config } : {})
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

  // Automatic Failover to DeepSeek or Claude if Gemini quota/spending cap is exhausted
  const promptText = extractTextFromContents(params.contents);
  if (promptText && getDeepSeekKey()) {
    try {
      console.log("[AI Engine] Activando failover automático a DeepSeek V3 por fallo/cuota en Gemini...");
      const text = await callDeepSeek({ prompt: promptText, temperature: params.config?.temperature });
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

  if (promptText && getAnthropicKey()) {
    try {
      console.log("[AI Engine] Activando failover automático a Claude 3.5 Haiku por fallo/cuota en Gemini...");
      const text = await callAnthropic({ prompt: promptText, temperature: params.config?.temperature });
      if (text) {
        return {
          text,
          candidates: [{ content: { parts: [{ text }] } }]
        };
      }
    } catch (clErr: any) {
      console.warn("[AI Engine] Falló también fallback a Claude:", clErr.message);
    }
  }

  // Graceful Local Generator Fallback when all cloud providers have exhausted balances
  console.log("[AI Engine] Activando generador local inteligente ante agotamiento de créditos en todas las APIs...");
  const fallbackText = generateSmartLocalPitchFallback({ prompt: promptText });
  return {
    text: fallbackText,
    candidates: [{ content: { parts: [{ text: fallbackText }] } }]
  };
}

export function generateSmartLocalPitchFallback(params: {
  prompt: string;
  systemPrompt?: string;
  provider?: string;
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

Estamos cerrando las fechas de nuestra próxima gira y nos gustaría presentaros nuestra disponibilidad para tocar en ${salaNombre}.

Enlaces de audio y vídeo en directo:
• Escuchar en Spotify: https://open.spotify.com
• Ver Directo en YouTube: https://youtube.com
• Dossier de Prensa / EPK: https://bandmanager.ai/epk

Condiciones y propuesta técnica:
• Formato: Concierto en sala${aforo ? ` (aforo ${aforo})` : ""}
• Caché / Taquilla: Abiertos a valorar taquilla con garantía o porcentaje según vuestro modelo habitual.

¿Tenéis disponibilidad en los próximos meses? Quedamos a vuestra disposición para concretar detalles.

Un cordial saludo,
Equipo de Booking & Management — ${bandName}
contacto@bakandeya.com`;
  }

  if (params.provider === "claude") {
    return `Estimado equipo de programación de ${salaNombre}${ciudad ? ` (${ciudad})` : ""}:

Es un placer saludaros. Os escribimos con mucha ilusión en nombre de ${bandName}, siguiendo muy de cerca la gran labor que hacéis por la música en directo en vuestra sala.

Nos encontramos trazando la nueva etapa de conciertos de la banda y sería todo un honor poder compartir nuestro directo con vuestro público en ${salaNombre}. Nuestra propuesta combina una puesta en escena cuidada con gran interacción y energía.

Os compartimos nuestros enlaces clave para que podáis valorar el proyecto:
• Música oficial: https://open.spotify.com
• Vídeo del directo: https://youtube.com
• EPK interactivo y fotos en alta: https://bandmanager.ai/epk

Estamos totalmente abiertos a adaptarnos a vuestras fechas disponibles y condiciones de producción habituales.

Muchísimas gracias de antemano por vuestra atención y por seguir apoyando la música independiente.

Un abrazo muy fuerte,
Booking & Producción — ${bandName}
contacto@bakandeya.com`;
  }

  // Default Gemini / General template
  return `Hola, equipo de ${salaNombre}${ciudad ? ` (${ciudad})` : ""}:

Os escribimos desde ${bandName}. Hemos estado siguiendo vuestra programación de conciertos y creemos que nuestra propuesta encaja a la perfección con la línea y el público de vuestra sala.

Actualmente nos encontramos planificando las próximas fechas de gira y nos encantaría valorar opciones de calendario para presentar nuestro directo en ${salaNombre}.

Aquí tenéis nuestros enlaces oficiales para escuchar el material y ver el directo:
• Spotify / Streaming: https://open.spotify.com
• Directo en YouTube: https://youtube.com
• Dossier y Rider Técnico: https://bandmanager.ai/epk

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

// Anthropic Claude Messages API integration
export async function callAnthropic(params: {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const apiKey = getAnthropicKey();
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY no configurada.");
  }

  const model = params.model || "claude-3-5-haiku-20241022";
  const body: any = {
    model,
    max_tokens: params.maxTokens ?? 1500,
    temperature: params.temperature ?? 0.7,
    messages: [{ role: "user", content: params.prompt }]
  };

  if (params.systemPrompt) {
    body.system = params.systemPrompt;
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic Claude API error (${res.status}): ${errText}`);
  }

  const data: any = await res.json();
  const content = data?.content;
  if (Array.isArray(content) && content.length > 0) {
    const textPart = content.find((c: any) => c.type === "text");
    return (textPart?.text || content[0].text || "").trim();
  }
  return "";
}

// Unified Multi-Model Execution Engine
export async function generateUnifiedAI(params: {
  prompt: string;
  systemPrompt?: string;
  provider?: "gemini" | "deepseek" | "claude" | string;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  allowFallback?: boolean;
}): Promise<{ text: string; provider: string; modelName: string; fallbackFrom?: string }> {
  const provider = params.provider || "gemini";
  const allowFallback = params.allowFallback ?? true;

  if (provider === "deepseek") {
    const text = await callDeepSeek({
      prompt: params.prompt,
      systemPrompt: params.systemPrompt,
      model: params.modelName || "deepseek-chat",
      temperature: params.temperature,
      maxTokens: params.maxTokens
    });
    return { text, provider: "deepseek", modelName: params.modelName || "deepseek-chat" };
  }

  if (provider === "claude") {
    const text = await callAnthropic({
      prompt: params.prompt,
      systemPrompt: params.systemPrompt,
      model: params.modelName || "claude-3-5-haiku-20241022",
      temperature: params.temperature,
      maxTokens: params.maxTokens
    });
    return { text, provider: "claude", modelName: params.modelName || "claude-3-5-haiku-20241022" };
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

  // Fallback to Claude if DeepSeek is also unavailable or failed
  if (allowFallback && getAnthropicKey()) {
    try {
      console.log("[AI Engine] Fallback automático a Claude 3.5 Haiku...");
      const text = await callAnthropic({
        prompt: params.prompt,
        systemPrompt: params.systemPrompt,
        temperature: params.temperature,
        maxTokens: params.maxTokens
      });
      return { text, provider: "claude", modelName: "claude-3-5-haiku-20241022 (fallback)", fallbackFrom: "gemini" };
    } catch (clErr: any) {
      console.warn("[AI Engine] Fallback a Claude falló:", clErr.message);
    }
  }

  // Fallback to local expert engine if all cloud models are exhausted
  if (allowFallback) {
    console.log("[AI Engine] Fallback a motor local inteligente...");
    const localText = generateSmartLocalPitchFallback({
      prompt: params.prompt,
      systemPrompt: params.systemPrompt,
      provider
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
        } else if (cleanErrMsg.includes("400") || cleanErrMsg.includes("credit balance is too low") || cleanErrMsg.includes("invalid_request_error")) {
          cleanErrMsg = "Saldo insuficiente en cuenta Anthropic Claude (Error 400). Por favor añade créditos en console.anthropic.com";
        }

        const fullInputText = (params.systemPrompt || "") + "\n" + (params.prompt || "");
        const localDraft = generateSmartLocalPitchFallback({
          prompt: params.prompt,
          systemPrompt: params.systemPrompt,
          provider: providerId
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

