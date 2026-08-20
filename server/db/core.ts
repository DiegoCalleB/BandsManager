import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | undefined;

export function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://brynltixytuyjdfdupjx.supabase.co";
  const keys = [
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_ANON_KEY,
    process.env.SUPABASE_KEY,
    process.env.VITE_SUPABASE_ANON_KEY
  ].filter(Boolean) as string[];

  const jwtKey = keys.find(k => k.startsWith("eyJ")) || keys[0] || "";

  if (!url || !jwtKey) {
    throw new Error("Supabase URL or Key is missing in environment variables.");
  }

  supabaseInstance = createClient(url, jwtKey, {
    auth: { persistSession: false }
  });

  return supabaseInstance;
}

// Helper normalization & transformation utilities
export function normalizePlan(rawPlan?: string): 'ensayo' | 'local' | 'de_gira' | 'cabeza_de_cartel' {
  if (!rawPlan) return 'ensayo';
  const clean = String(rawPlan).toLowerCase().trim();
  if (clean === 'cabeza_de_cartel' || clean === 'cabeza de cartel' || clean === 'elite' || clean === 'manager360' || clean === 'pro_plus' || clean === '360' || clean === 'manager 360' || clean === 'elite 360') {
    return 'cabeza_de_cartel';
  }
  if (clean === 'de_gira' || clean === 'de gira' || clean === 'profesional' || clean === 'pro' || clean === 'consolidada' || clean === 'gira profesional' || clean === 'gira') {
    return 'de_gira';
  }
  if (clean === 'local') {
    return 'local';
  }
  if (clean === 'ensayo' || clean === 'emergente' || clean === 'gratis' || clean === 'free' || clean === 'basico') {
    return 'ensayo';
  }
  return 'ensayo';
}

export function cleanBandId(bandId?: string): string {
  if (!bandId || typeof bandId !== "string" || !bandId.trim()) {
    return "band-bakandeya";
  }
  return bandId.trim();
}

