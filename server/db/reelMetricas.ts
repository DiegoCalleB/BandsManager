// Métricas reales de los Reels publicados (una fila por post y medición).

import { getSupabase, cleanBandId } from "./core.js";
import type { SocialPost } from "../../src/types.js";
import type { HorasMedicion } from "../utils/aprendizajeReels.js";

export interface FilaMetricaReel {
  post_id: string;
  horas: HorasMedicion;
  band_id: string;
  published_id: string;
  duracion_seg: number | null;
  loop_perfecto: boolean | null;
  views: number | null;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  avg_watch_ms: number | null;
  total_watch_ms: number | null;
  /** Lo pone la base al guardar; no se envía al escribir. */
  medido_en?: string;
}

/** Idempotente por (post, medición): si se repite la pasada, actualiza la misma fila. */
export async function dbGuardarMetricaReel(m: Omit<FilaMetricaReel, "band_id">, bandId: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from("reel_metricas")
    .upsert({ ...m, band_id: cleanBandId(bandId), medido_en: new Date().toISOString() }, { onConflict: "post_id,horas" });
  if (error) throw new Error(`Supabase Error (reel_metricas): ${error.message}`);
}

/** Mediciones ya tomadas por post (para saber cuál toca). */
export async function dbMedicionesTomadas(postIds: string[]): Promise<Map<string, number[]>> {
  const mapa = new Map<string, number[]>();
  if (!postIds.length) return mapa;
  const sb = getSupabase();
  const { data, error } = await sb.from("reel_metricas").select("post_id, horas").in("post_id", postIds);
  if (error) throw new Error(`Supabase Error (reel_metricas): ${error.message}`);
  for (const f of data || []) mapa.set(f.post_id, [...(mapa.get(f.post_id) || []), Number(f.horas)]);
  return mapa;
}

/** La medición más madura de cada Reel de la banda: es la que cuenta para aprender. */
export async function dbUltimasMetricasDeBanda(bandId: string): Promise<FilaMetricaReel[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("reel_metricas")
    .select("*")
    .eq("band_id", cleanBandId(bandId))
    .order("horas", { ascending: false })
    .limit(2000);
  if (error) throw new Error(`Supabase Error (reel_metricas): ${error.message}`);
  const porPost = new Map<string, FilaMetricaReel>();
  for (const f of (data || []) as FilaMetricaReel[]) if (!porPost.has(f.post_id)) porPost.set(f.post_id, f);
  return [...porPost.values()];
}

/** Reels publicados de verdad en Instagram en los últimos 8 días (todas las bandas). Solo para el worker. */
export async function dbPostsPublicadosRecientes(): Promise<SocialPost[]> {
  const sb = getSupabase();
  const desde = new Date(Date.now() - 8 * 24 * 3_600_000).toISOString();
  const { data, error } = await sb
    .from("social_posts")
    .select("*")
    .eq("estado", "publicado")
    .eq("plataforma", "Instagram")
    .not("published_id", "is", null)
    .gte("published_at", desde);
  if (error) throw new Error(`Supabase Error (social_posts publicados): ${error.message}`);
  return (data || []) as SocialPost[];
}

/** Texto (copy) de cada post, para poner nombre a los Reels en el resumen. Solo de esta banda. */
export async function dbTextosDePosts(bandId: string, postIds: string[]): Promise<Map<string, string>> {
  const mapa = new Map<string, string>();
  if (!postIds.length) return mapa;
  const sb = getSupabase();
  const { data, error } = await sb.from("social_posts").select("id, contenido").eq("band_id", cleanBandId(bandId)).in("id", postIds);
  if (error) throw new Error(`Supabase Error (social_posts textos): ${error.message}`);
  for (const f of data || []) mapa.set(f.id, String(f.contenido || ""));
  return mapa;
}
