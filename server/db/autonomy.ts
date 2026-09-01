import { getSupabase, cleanBandId } from "./core.js";
import { ensureRegisteredBandExists } from "./bands.js";

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
  responseStrategies?: Record<string, ResponseStrategy>;
  minCacheByType?: {
    salas?: number;
    festivales?: number;
    discotecas?: number;
    ayuntamientos?: number;
    medios?: number;
    grupos?: number;
  };
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
    responseStrategies: data.response_strategies || {},
    minCacheByType: Object.keys(minCacheByType).length > 0 ? minCacheByType : undefined,
    negotiationStartCacheByType: Object.keys(negotiationStartCacheByType).length > 0 ? negotiationStartCacheByType : undefined
  };
}

export async function dbUpsertAutonomyConfig(bandId: string, config: any) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(bandId);
  await ensureRegisteredBandExists(targetBandId);

  const payload = {
    band_id: targetBandId,
    dispatch_level: config.dispatchLevel || config.dispatch_level || "draft_only",
    negotiation_depth: config.negotiationDepth || config.negotiation_depth || "filter_conditions",
    auto_decline_under_min_cache: Boolean(config.autoDeclineUnderMinCache ?? config.auto_decline_under_min_cache),
    notify_on_every_proposal: Boolean(config.notifyOnEveryProposal ?? config.notify_on_every_proposal ?? true),
    require_human_for_final_sign_off: Boolean(config.requireHumanForFinalSignOff ?? config.require_human_for_final_sign_off ?? true),
    // Qué hace el Enviador justo tras la aprobación humana del lead (paso 1, siempre
    // obligatorio, sin relación con esto): dejar borrador en Gmail o despachar directamente.
    // Ver AGENTS.md sección 3 y el comentario junto a ENVIO_REAL_HABILITADO_GLOBALMENTE en
    // server/services/agentEngine.ts.
    dispatch_mode: (config.dispatchMode || config.dispatch_mode) === "direct_send" ? "direct_send" : "draft_gmail",
    response_strategies: config.responseStrategies || config.response_strategies || {},
    min_cache_by_type: (config.minCacheByType && typeof config.minCacheByType === "object")
      ? config.minCacheByType
      : undefined,
    negotiation_start_cache_by_type: (config.negotiationStartCacheByType && typeof config.negotiationStartCacheByType === "object")
      ? config.negotiationStartCacheByType
      : undefined
  };

  const { data, error } = await sb.from("autonomy_configs").upsert(payload).select().single();
  if (error) throw new Error(`Supabase Error (upsert autonomy_configs): ${error.message}`);
  return data;
}

// --- FANS ---
