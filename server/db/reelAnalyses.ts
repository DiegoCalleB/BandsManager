// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { getSupabase, cleanBandId } from "./core.js";
import { ensureRegisteredBandExists } from "./bands.js";

/**
 * Persistencia del análisis de highlights del generador de Reels.
 *
 * Antes de esto, el análisis (los clips sugeridos, el mapa de energía del audio, los copies ya
 * escritos) vivía solo en el estado de React: recargar la página o volver más tarde al mismo
 * vídeo lo borraba entero, y recuperarlo significaba pagar otra llamada a Gemini. Una fila por
 * banda+vídeo: volver a analizar el mismo vídeo actualiza la fila en vez de acumular copias.
 *
 * Todo aquí es best-effort. Guardar el análisis es una comodidad, no el resultado en sí: si
 * Supabase falla, el análisis que ya se le ha devuelto al usuario sigue siendo válido y no debe
 * perderse por un fallo de la capa de caché.
 */

export interface ReelAnalysisRecord {
  bandId: string;
  videoKey: string;
  sourceType: "youtube" | "file";
  sourceUrl?: string;
  videoTitle?: string;
  videoDuration?: number;
  targetDuration?: number;
  highlights: any[];
  optimalTime?: any;
  energyWindows?: any[];
  videoMeta?: any;
  generatedByAI?: boolean;
  notice?: string;
}

function idDeAnalisis(bandId: string, videoKey: string): string {
  // Determinista a propósito: así upsertar el mismo vídeo dos veces cae en la misma fila sin
  // tener que leerla primero para averiguar su id.
  const limpio = videoKey.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 120);
  return `reelan-${bandId}-${limpio}`;
}

export async function dbGetReelAnalysis(bandId: string, videoKey: string): Promise<any | null> {
  if (!videoKey) return null;
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("reel_analyses")
      .select("*")
      .eq("band_id", cleanBandId(bandId))
      .eq("video_key", videoKey)
      .maybeSingle();

    if (error) {
      console.warn(`Supabase warning (reel_analyses): ${error.message}`);
      return null;
    }
    return data || null;
  } catch (err: any) {
    // getSupabase() lanza de forma SÍNCRONA si faltan las variables de entorno (por diseño,
    // ver server/db/core.ts). Sin este try/catch, un servidor sin Supabase configurado
    // reventaba con un 500 en vez de simplemente responder "no hay nada guardado".
    console.warn("[reel_analyses] No se pudo leer el análisis guardado:", err?.message || err);
    return null;
  }
}

export async function dbUpsertReelAnalysis(registro: ReelAnalysisRecord): Promise<any | null> {
  const targetBandId = cleanBandId(registro.bandId);
  if (!registro.videoKey) return null;

  try {
    await ensureRegisteredBandExists(targetBandId);

    const sb = getSupabase();
    const payload = {
      id: idDeAnalisis(targetBandId, registro.videoKey),
      band_id: targetBandId,
      video_key: registro.videoKey,
      source_type: registro.sourceType,
      source_url: registro.sourceUrl || "",
      video_title: registro.videoTitle || "",
      video_duration: Math.floor(Number(registro.videoDuration) || 0),
      target_duration: Math.floor(Number(registro.targetDuration) || 30),
      highlights: registro.highlights || [],
      optimal_time: registro.optimalTime || {},
      energy_windows: registro.energyWindows || [],
      video_meta: registro.videoMeta || {},
      generated_by_ai: Boolean(registro.generatedByAI),
      notice: registro.notice || "",
      updated_at: new Date().toISOString()
    };

    const { data, error } = await sb
      .from("reel_analyses")
      .upsert(payload, { onConflict: "band_id,video_key" })
      .select()
      .single();

    if (error) {
      console.warn(`Supabase warning (upsert reel_analyses): ${error.message}`);
      return null;
    }
    return data;
  } catch (err: any) {
    console.warn("[reel_analyses] No se pudo guardar el análisis:", err?.message || err);
    return null;
  }
}

/**
 * Actualiza UN highlight dentro del análisis ya guardado (lo que hace /api/reanalyze-clip).
 * Si todavía no hay ningún análisis guardado para este vídeo no se crea uno a medias: sin la
 * lista completa de highlights, una fila con un único clip sería peor que no tener fila.
 */
export async function dbUpdateReelAnalysisHighlight(
  bandId: string,
  videoKey: string,
  highlightId: string,
  patch: Record<string, any>
): Promise<boolean> {
  try {
    const existente = await dbGetReelAnalysis(bandId, videoKey);
    if (!existente) return false;

    const highlights = Array.isArray(existente.highlights) ? existente.highlights : [];
    const actualizados = highlights.map((h: any) =>
      h && h.id === highlightId ? { ...h, ...patch } : h
    );

    const sb = getSupabase();
    const { error } = await sb
      .from("reel_analyses")
      .update({ highlights: actualizados, updated_at: new Date().toISOString() })
      .eq("id", existente.id);

    if (error) {
      console.warn(`Supabase warning (update highlight en reel_analyses): ${error.message}`);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn("[reel_analyses] No se pudo actualizar el highlight guardado:", err?.message || err);
    return false;
  }
}
