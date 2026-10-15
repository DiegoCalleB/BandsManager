// Procedencia de los clips renderizados: de qué vídeo sale cada uno y si sus derechos son de la banda.

import { getSupabase, cleanBandId } from "./core.js";
import type { InformeCalidad } from "../utils/controlCalidadClip.js";

export type DerechosClip = "canal_de_la_banda" | "declarado_por_la_banda";

export interface ReelClip {
  id: string;
  band_id: string;
  clip_url: string;
  source_url: string;
  source_author: string;
  source_author_url: string;
  derechos: DerechosClip | null;
  loop_perfecto: boolean;
  hook_text: string;
  /** null = no se pudo medir; el publicador no lo autopublica. */
  control_calidad: InformeCalidad | null;
  /** Duración real del MP4 final (tras el loop). La usa el KPI de rewatch. */
  duracion_seg: number | null;
}

export async function dbRegistrarReelClip(clip: Omit<ReelClip, "id" | "band_id">, bandId: string): Promise<void> {
  const sb = getSupabase();
  const band_id = cleanBandId(bandId);
  const { error } = await sb.from("reel_clips").insert({
    id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    band_id,
    clip_url: clip.clip_url,
    source_url: clip.source_url,
    source_author: clip.source_author,
    source_author_url: clip.source_author_url,
    derechos: clip.derechos,
    loop_perfecto: clip.loop_perfecto,
    hook_text: clip.hook_text,
    control_calidad: clip.control_calidad,
    duracion_seg: clip.duracion_seg
  });
  if (error) throw new Error(`Supabase Error (reel_clips): ${error.message}`);
}

export async function dbBuscarReelClip(bandId: string, clipUrl: string): Promise<ReelClip | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("reel_clips")
    .select("*")
    .eq("band_id", cleanBandId(bandId))
    .eq("clip_url", clipUrl)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Supabase Error (reel_clips): ${error.message}`);
  return (data as ReelClip | null) || null;
}

/** Vídeo de origen (`source_url`) de cada clip pedido, por `clip_url`. Una sola consulta, no una por post. */
export async function dbOrigenesDeClips(bandId: string, clipUrls: string[]): Promise<Record<string, string>> {
  if (clipUrls.length === 0) return {};
  const sb = getSupabase();
  const { data, error } = await sb.from("reel_clips").select("clip_url, source_url").eq("band_id", cleanBandId(bandId)).in("clip_url", clipUrls);
  if (error) throw new Error(`Supabase Error (reel_clips): ${error.message}`);
  return Object.fromEntries((data || []).map((c: { clip_url: string; source_url: string }) => [c.clip_url, c.source_url]));
}
