import { getSupabase, cleanBandId } from "./core.js";
import { ensureRegisteredBandExists } from "./bands.js";

export interface ResponseStrategy {
  responseType: "price_negotiation" | "confirmation" | "rejection" | "follow_up" | "conditional";
  guidancePrompt?: string;
  autoRespond?: boolean;
  mentionLinks?: boolean;
  tone?: "neutral" | "enthusiastic" | "cautious";
}

export interface AutonomyConfig {
  dispatchLevel: string;
  negotiationDepth: string;
  minCacheThreshold: number;
  maxCacheThreshold: number;
  autoDeclineUnderMinCache: boolean;
  notifyOnEveryProposal: boolean;
  requireHumanForFinalSignOff: boolean;
  dispatchMode: string;
  responseStrategies?: Record<string, ResponseStrategy>;
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
  return {
    dispatchLevel: data.dispatch_level,
    negotiationDepth: data.negotiation_depth,
    minCacheThreshold: data.min_cache_threshold,
    maxCacheThreshold: data.max_cache_threshold,
    autoDeclineUnderMinCache: data.auto_decline_under_min_cache,
    notifyOnEveryProposal: data.notify_on_every_proposal,
    requireHumanForFinalSignOff: data.require_human_for_final_sign_off,
    dispatchMode: data.dispatch_mode,
    responseStrategies: data.response_strategies || {}
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
    min_cache_threshold: Number(config.minCacheThreshold ?? config.min_cache_threshold ?? 300),
    max_cache_threshold: Number(config.maxCacheThreshold ?? config.max_cache_threshold ?? 800),
    auto_decline_under_min_cache: Boolean(config.autoDeclineUnderMinCache ?? config.auto_decline_under_min_cache),
    notify_on_every_proposal: Boolean(config.notifyOnEveryProposal ?? config.notify_on_every_proposal ?? true),
    require_human_for_final_sign_off: Boolean(config.requireHumanForFinalSignOff ?? config.require_human_for_final_sign_off ?? true),
    // Qué hace el Enviador justo tras la aprobación humana del lead (paso 1, siempre
    // obligatorio, sin relación con esto): dejar borrador en Gmail o despachar directamente.
    // Ver AGENTS.md sección 3 y el comentario junto a ENVIO_REAL_HABILITADO_GLOBALMENTE en
    // server/services/agentEngine.ts.
    dispatch_mode: (config.dispatchMode || config.dispatch_mode) === "direct_send" ? "direct_send" : "draft_gmail",
    response_strategies: config.responseStrategies || config.response_strategies || {}
  };

  const { data, error } = await sb.from("autonomy_configs").upsert(payload).select().single();
  if (error) throw new Error(`Supabase Error (upsert autonomy_configs): ${error.message}`);
  return data;
}

// --- FANS ---
