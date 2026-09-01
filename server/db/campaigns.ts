import { getSupabase, cleanBandId } from "./core.js";
import { ensureRegisteredBandExists } from "./bands.js";

export interface DbCampaign {
  id: string;
  band_id: string;
  name: string;
  target_cities: string[];
  min_capacity: number;
  max_capacity: number;
  target_dates: string[];
  target_dates_text?: string;
  notes?: string;
  custom_pitch_templates?: Record<string, string>;
  min_cache_by_type?: {
    salas?: number;
    festivales?: number;
    discotecas?: number;
    ayuntamientos?: number;
    medios?: number;
    grupos?: number;
  };
  campaign_tone_rules?: {
    reglas_estilo_aprendidas?: string[];
    vocabulario_aprendido?: string[];
    terminos_a_evitar?: string[];
    actualizado?: string;
  };
  is_active: boolean;
  color?: string;
  created_at?: string;
}

export function normalizeCampaignFromDb(c: any) {
  let targetCities: string[] = [];
  if (Array.isArray(c.target_cities)) {
    targetCities = c.target_cities;
  } else if (typeof c.target_cities === "string") {
    try {
      const parsed = JSON.parse(c.target_cities);
      if (Array.isArray(parsed)) targetCities = parsed;
      else targetCities = c.target_cities.split(",").map((s: string) => s.trim()).filter(Boolean);
    } catch {
      targetCities = c.target_cities.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
  } else if (Array.isArray(c.targetCities)) {
    targetCities = c.targetCities;
  }

  let targetDates: string[] = [];
  if (Array.isArray(c.target_dates)) {
    targetDates = c.target_dates;
  } else if (typeof c.target_dates === "string") {
    try {
      const parsed = JSON.parse(c.target_dates);
      if (Array.isArray(parsed)) targetDates = parsed;
      else targetDates = c.target_dates.split(",").map((s: string) => s.trim()).filter(Boolean);
    } catch {
      targetDates = c.target_dates.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
  } else if (Array.isArray(c.targetDates)) {
    targetDates = c.targetDates;
  }

  let customPitchTemplates: Record<string, string> = {};
  const rawTemplates = c.custom_pitch_templates ?? c.customPitchTemplates;
  if (rawTemplates && typeof rawTemplates === "object" && !Array.isArray(rawTemplates)) {
    customPitchTemplates = rawTemplates;
  } else if (typeof rawTemplates === "string" && rawTemplates) {
    try {
      const parsed = JSON.parse(rawTemplates);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) customPitchTemplates = parsed;
    } catch {
      // Ignora JSON malformado y se queda con el mapa vacío por defecto.
    }
  }

  let campaignToneRules = undefined;
  const rawToneRules = c.campaign_tone_rules ?? c.campaignToneRules;
  if (rawToneRules && typeof rawToneRules === "object" && !Array.isArray(rawToneRules)) {
    campaignToneRules = rawToneRules;
  } else if (typeof rawToneRules === "string" && rawToneRules) {
    try {
      const parsed = JSON.parse(rawToneRules);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) campaignToneRules = parsed;
    } catch {
      // Ignora JSON malformado
    }
  }

  let minCacheByType: any = {};
  const rawMinCache = c.min_cache_by_type ?? c.minCacheByType;
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

  return {
    id: String(c.id),
    band_id: c.band_id || c.bandId,
    name: c.name || "Campaña de Booking",
    targetCities,
    minCapacity: Number(c.min_capacity ?? c.minCapacity ?? 0),
    maxCapacity: Number(c.max_capacity ?? c.maxCapacity ?? 0),
    targetDates,
    targetDatesText: c.target_dates_text || c.targetDatesText || "",
    notes: c.notes || "",
    customPitchTemplates,
    minCacheByType: Object.keys(minCacheByType).length > 0 ? minCacheByType : undefined,
    campaignToneRules,
    isActive: Boolean(c.is_active ?? c.isActive ?? false),
    color: c.color || "#8b5cf6",
    created_at: c.created_at || c.createdAt || new Date().toISOString()
  };
}

export async function dbGetCampaigns(bandId: string) {
  const sb = getSupabase();
  const cleanId = cleanBandId(bandId);
  try {
    // 1. Try 'campaigns' table first (created by user SQL)
    const { data, error } = await sb
      .from("campaigns")
      .select("*")
      .eq("band_id", cleanId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      return data.map(normalizeCampaignFromDb);
    }

    // 2. Fallback to 'booking_campaigns' if 'campaigns' was not found
    const { data: fallbackData, error: fallbackError } = await sb
      .from("booking_campaigns")
      .select("*")
      .eq("band_id", cleanId)
      .order("created_at", { ascending: false });

    if (fallbackError) {
      console.warn("Supabase campaigns query warning:", error?.message || fallbackError.message);
      return [];
    }
    return (fallbackData || []).map(normalizeCampaignFromDb);
  } catch (err: any) {
    console.warn("Could not query campaigns from Supabase:", err?.message || err);
    return [];
  }
}

export async function dbUpsertCampaign(campaign: any, bandId: string) {
  const sb = getSupabase();
  // 'bandId' es el único origen de confianza: lo resuelve la ruta a partir de la sesión
  // (req.user.band_id). 'campaign.band_id' viene del cuerpo de la petición sin validar — de
  // priorizarlo, cualquier usuario autenticado podría escribir una campaña en la banda de otro
  // con solo mandar {"band_id": "banda-ajena"} en el POST/PUT.
  const targetBandId = cleanBandId(bandId);
  await ensureRegisteredBandExists(targetBandId);

  const payload: any = {
    id: String(campaign.id || Date.now().toString()),
    band_id: targetBandId,
    name: campaign.name || "Nueva Campaña",
    target_cities: Array.isArray(campaign.targetCities) ? campaign.targetCities : [],
    min_capacity: Number(campaign.minCapacity || 0),
    max_capacity: Number(campaign.maxCapacity || 0),
    target_dates: Array.isArray(campaign.targetDates) ? campaign.targetDates : [],
    target_dates_text: campaign.targetDatesText || "",
    notes: campaign.notes || "",
    custom_pitch_templates: (campaign.customPitchTemplates && typeof campaign.customPitchTemplates === "object")
      ? campaign.customPitchTemplates
      : {},
    min_cache_by_type: (campaign.minCacheByType && typeof campaign.minCacheByType === "object")
      ? campaign.minCacheByType
      : undefined,
    campaign_tone_rules: (campaign.campaignToneRules && typeof campaign.campaignToneRules === "object")
      ? campaign.campaignToneRules
      : undefined,
    is_active: Boolean(campaign.isActive),
    color: campaign.color || "#8b5cf6"
  };


  try {
    // Try inserting into 'campaigns' table first
    const { data, error } = await sb
      .from("campaigns")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();

    if (!error && data) {
      return normalizeCampaignFromDb(data);
    }

    // Fallback to 'booking_campaigns'
    const { data: fbData, error: fbError } = await sb
      .from("booking_campaigns")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();

    if (fbError) {
      console.warn("Supabase upsert campaigns warning:", error?.message || fbError.message);
      return normalizeCampaignFromDb(payload);
    }
    return normalizeCampaignFromDb(fbData || payload);
  } catch (err: any) {
    console.warn("Failed to persist campaign to Supabase:", err?.message || err);
    return normalizeCampaignFromDb(payload);
  }
}

export async function dbDeleteCampaign(id: string, bandId: string) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(bandId);
  try {
    await sb
      .from("campaigns")
      .delete()
      .eq("id", String(id))
      .eq("band_id", targetBandId);

    await sb
      .from("booking_campaigns")
      .delete()
      .eq("id", String(id))
      .eq("band_id", targetBandId);

    return true;
  } catch (err: any) {
    console.warn("Failed to delete campaign from Supabase:", err?.message || err);
    return true;
  }
}

export async function dbSetActiveCampaign(id: string | null, bandId: string) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(bandId);
  try {
    // 1. Deactivate all for band in both tables
    await sb
      .from("campaigns")
      .update({ is_active: false })
      .eq("band_id", targetBandId);

    await sb
      .from("booking_campaigns")
      .update({ is_active: false })
      .eq("band_id", targetBandId);

    // 2. Activate specified
    if (id) {
      const { error } = await sb
        .from("campaigns")
        .update({ is_active: true })
        .eq("id", String(id))
        .eq("band_id", targetBandId);

      if (error) {
        await sb
          .from("booking_campaigns")
          .update({ is_active: true })
          .eq("id", String(id))
          .eq("band_id", targetBandId);
      }
    }
    return true;
  } catch (err: any) {
    console.warn("Failed to set active campaign in Supabase:", err?.message || err);
    return false;
  }
}

export async function dbGetActiveCampaign(bandId: string) {
  const campaigns = await dbGetCampaigns(bandId);
  return campaigns.find(c => c.isActive) || null;
}

