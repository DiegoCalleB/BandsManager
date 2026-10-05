import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | undefined;

export function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  // Antes, si faltaba SUPABASE_URL en el entorno, se caía en silencio en el proyecto de Supabase
  // personal del fundador del proyecto. Cualquier despliegue nuevo que se olvidara de configurar
  // la variable de entorno acababa leyendo/escribiendo en esa base de datos real sin avisar.
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
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
export function normalizePlan(rawPlan?: string): 'promo' | 'promo_plus' | 'ensayo' | 'local' | 'de_gira' | 'cabeza_de_cartel' {
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
  if (clean === 'promo_plus' || clean === 'promo+' || clean === 'promoplus' || clean === 'promo plus' || clean === 'festival_plus' || clean === 'festival+' || clean === 'promo_music' || clean === 'promomusic' || clean === 'promo music') {
    return 'promo_plus';
  }
  if (clean === 'promo' || clean === 'buskers' || clean === 'festival') {
    return 'promo';
  }
  if (clean === 'ensayo' || clean === 'emergente' || clean === 'gratis' || clean === 'free' || clean === 'basico') {
    return 'ensayo';
  }
  return 'ensayo';
}

// Filtro de tenant para TODAS las queries de Supabase en server/db/*.ts. Antes, si a esta
// función llegaba un bandId vacío, devolvía "band-bakandeya" en silencio: un bug o una ruta
// nueva que se olvidara de pasar el bandId no fallaba, leía o escribía en los datos de la banda
// insignia sin que nadie se enterase. Mejor fallar alto: los llamadores de este módulo ya reciben
// el bandId del usuario autenticado (nunca vacío tras el fix de auth.ts), así que un bandId vacío
// aquí es siempre un bug del llamador, no un caso a tolerar.
export function cleanBandId(bandId?: string): string {
  if (!bandId || typeof bandId !== "string" || !bandId.trim()) {
    throw new Error("cleanBandId: se requiere un band_id válido; no hay banda por defecto.");
  }
  return bandId.trim();
}

