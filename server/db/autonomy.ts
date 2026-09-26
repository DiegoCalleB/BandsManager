import { getSupabase, cleanBandId } from "./core.js";
import { ensureRegisteredBandExists } from "./bands.js";

// Los tipos válidos de respuesta y tono son responsabilidad de
// server/routes/bands/responseStrategies.ts (VALID_RESPONSE_TYPES/VALID_TONES) - esta interfaz
// solo describe la forma que devuelve/acepta la capa de datos, no valida nada por su cuenta.
// Antes tenía un "conditional" en responseType que la validación real del endpoint nunca aceptó.
export interface ResponseStrategy {
  responseType: "price_negotiation" | "confirmation" | "rejection" | "follow_up";
  guidancePrompt?: string;
  autoRespond?: boolean;
  mentionLinks?: boolean;
  tone?: "neutral" | "enthusiastic" | "cautious";
}

export interface AutonomyConfig {
  dispatchLevel: string;
  negotiationDepth: string;
  autoDeclineUnderMinCache: boolean;
  notifyOnEveryProposal: boolean;
  requireHumanForFinalSignOff: boolean;
  dispatchMode: string;
  agentSenderEmail?: string;
  agentSenderName?: string;
  agentReplyToEmail?: string;
  markAsReadInInbox?: boolean;
  responseStrategies?: Record<string, ResponseStrategy>;
  minCacheByType?: {
    salas?: number;
    festivales?: number;
    discotecas?: number;
    ayuntamientos?: number;
    medios?: number;
    grupos?: number;
  };
  // Caché de inicio de negociación por tipo de recinto, separado del mínimo real
  // (minCacheByType). Si la sala pregunta directamente por el caché, el Redactor
  // responde con esta cifra en vez del mínimo, dejando margen para negociar a la
  // baja sin bajar nunca del mínimo real. Ver server/utils/bandDna.ts.
  negotiationStartCacheByType?: {
    salas?: number;
    festivales?: number;
    discotecas?: number;
    ayuntamientos?: number;
    medios?: number;
    grupos?: number;
  };
}

export async function dbGetAutonomyConfig(bandId: string): Promise<AutonomyConfig | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("autonomy_configs")
    .select("*")
    .eq("band_id", cleanBandId(bandId))
    .maybeSingle();

  if (error) throw new Error(`Supabase Error (autonomy_configs): ${error.message}`);
  if (!data) return null;

  let minCacheByType: any = {};
  const rawMinCache = data.min_cache_by_type;
  if (rawMinCache && typeof rawMinCache === "object" && !Array.isArray(rawMinCache)) {
    minCacheByType = rawMinCache;
  } else if (typeof rawMinCache === "string" && rawMinCache) {
    try {
      const parsed = JSON.parse(rawMinCache);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) minCacheByType = parsed;
    } catch {
      // Ignora JSON malformado
    }
  }

  let negotiationStartCacheByType: any = {};
  const rawNegotiationStartCache = data.negotiation_start_cache_by_type;
  if (rawNegotiationStartCache && typeof rawNegotiationStartCache === "object" && !Array.isArray(rawNegotiationStartCache)) {
    negotiationStartCacheByType = rawNegotiationStartCache;
  } else if (typeof rawNegotiationStartCache === "string" && rawNegotiationStartCache) {
    try {
      const parsed = JSON.parse(rawNegotiationStartCache);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) negotiationStartCacheByType = parsed;
    } catch {
      // Ignora JSON malformado
    }
  }

  return {
    dispatchLevel: data.dispatch_level,
    negotiationDepth: data.negotiation_depth,
    autoDeclineUnderMinCache: data.auto_decline_under_min_cache,
    notifyOnEveryProposal: data.notify_on_every_proposal,
    requireHumanForFinalSignOff: data.require_human_for_final_sign_off,
    dispatchMode: data.dispatch_mode,
    agentSenderEmail: data.agent_sender_email || undefined,
    agentSenderName: data.agent_sender_name || undefined,
    agentReplyToEmail: data.agent_reply_to_email || undefined,
    markAsReadInInbox: Boolean(data.mark_as_read_in_inbox ?? false),
    responseStrategies: data.response_strategies || {},
    minCacheByType: Object.keys(minCacheByType).length > 0 ? minCacheByType : undefined,
    negotiationStartCacheByType: Object.keys(negotiationStartCacheByType).length > 0 ? negotiationStartCacheByType : undefined
  };
}

export async function dbUpsertAutonomyConfig(bandId: string, config: any) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(bandId);
  await ensureRegisteredBandExists(targetBandId);

  const payload: any = {
    band_id: targetBandId,
    dispatch_level: config.dispatchLevel || config.dispatch_level || "draft_only",
    negotiation_depth: config.negotiationDepth || config.negotiation_depth || "filter_conditions",
    auto_decline_under_min_cache: Boolean(config.autoDeclineUnderMinCache ?? config.auto_decline_under_min_cache),
    notify_on_every_proposal: Boolean(config.notifyOnEveryProposal ?? config.notify_on_every_proposal ?? true),
    require_human_for_final_sign_off: Boolean(config.requireHumanForFinalSignOff ?? config.require_human_for_final_sign_off ?? true),
    dispatch_mode: (config.dispatchMode || config.dispatch_mode) === "direct_send" ? "direct_send" : "draft_gmail",
    mark_as_read_in_inbox: Boolean(config.markAsReadInInbox ?? config.mark_as_read_in_inbox ?? false),
    response_strategies: config.responseStrategies || config.response_strategies || {},
    min_cache_by_type: (config.minCacheByType && typeof config.minCacheByType === "object")
      ? config.minCacheByType
      : undefined,
    negotiation_start_cache_by_type: (config.negotiationStartCacheByType && typeof config.negotiationStartCacheByType === "object")
      ? config.negotiationStartCacheByType
      : undefined,
    agent_sender_email: config.agentSenderEmail || config.agent_sender_email || undefined,
    agent_sender_name: config.agentSenderName || config.agent_sender_name || undefined,
    agent_reply_to_email: config.agentReplyToEmail || config.agent_reply_to_email || undefined
  };

  try {
    const { data, error } = await sb.from("autonomy_configs").upsert(payload).select().single();
    if (error) {
      // Si la tabla en Supabase no tiene aún las nuevas columnas de sender email, reintentar sin ellas
      if (error.message?.includes("agent_sender_") || error.code === "PGRST204" || error.message?.includes("column")) {
        delete payload.agent_sender_email;
        delete payload.agent_sender_name;
        delete payload.agent_reply_to_email;
        const { data: retryData, error: retryErr } = await sb.from("autonomy_configs").upsert(payload).select().single();
        if (retryErr) throw new Error(`Supabase Error (upsert autonomy_configs): ${retryErr.message}`);
        return retryData;
      }
      throw new Error(`Supabase Error (upsert autonomy_configs): ${error.message}`);
    }
    return data;
  } catch (err: any) {
    if (err.message?.includes("agent_sender_")) {
      delete payload.agent_sender_email;
      delete payload.agent_sender_name;
      delete payload.agent_reply_to_email;
      const { data: retryData } = await sb.from("autonomy_configs").upsert(payload).select().single();
      return retryData;
    }
    throw err;
  }
}

// --- FANS ---
