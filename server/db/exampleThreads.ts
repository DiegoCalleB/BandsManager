import { getSupabase, cleanBandId } from "./core.js";
import { ensureRegisteredBandExists } from "./bands.js";

export interface ExampleThreadMessage {
  rol: "banda" | "sala";
  texto: string;
  orden: number;
}

export interface ExampleThread {
  id: string;
  band_id: string;
  category: string;
  titulo: string;
  mensajes: ExampleThreadMessage[];
  resultado: "positiva" | "negativa" | "neutral";
  notas: string;
  created_at: string;
}

function normalizeFromDb(row: any): ExampleThread {
  return {
    id: String(row.id),
    band_id: row.band_id,
    category: row.category,
    titulo: row.titulo || "",
    mensajes: Array.isArray(row.mensajes) ? row.mensajes : [],
    resultado: row.resultado || "positiva",
    notas: row.notas || "",
    created_at: row.created_at || new Date().toISOString()
  };
}

export async function dbGetExampleThreads(bandId: string, category?: string): Promise<ExampleThread[]> {
  const cleanId = cleanBandId(bandId);
  try {
    const sb = getSupabase();
    let query = sb.from("pitch_example_threads").select("*").eq("band_id", cleanId);
    if (category) query = query.eq("category", category);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
      console.warn("Supabase pitch_example_threads query warning:", error.message);
      return [];
    }
    return (data || []).map(normalizeFromDb);
  } catch (err: any) {
    console.warn("Could not query pitch_example_threads from Supabase:", err?.message || err);
    return [];
  }
}

export async function dbCreateExampleThread(bandId: string, thread: {
  category: string;
  titulo?: string;
  mensajes: ExampleThreadMessage[];
  resultado?: "positiva" | "negativa" | "neutral";
  notas?: string;
}): Promise<ExampleThread> {
  const cleanId = cleanBandId(bandId);
  await ensureRegisteredBandExists(cleanId);

  const payload = {
    id: `thread-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    band_id: cleanId,
    category: thread.category,
    titulo: thread.titulo || "",
    mensajes: thread.mensajes || [],
    resultado: thread.resultado || "positiva",
    notas: thread.notas || ""
  };

  const sb = getSupabase();
  const { data, error } = await sb.from("pitch_example_threads").insert(payload).select().single();
  if (error) throw new Error(`Supabase Error (create example thread): ${error.message}`);
  return normalizeFromDb(data);
}

export async function dbUpdateExampleThread(id: string, bandId: string, thread: {
  titulo?: string;
  mensajes: ExampleThreadMessage[];
  resultado?: "positiva" | "negativa" | "neutral";
  notas?: string;
}): Promise<ExampleThread> {
  const cleanId = cleanBandId(bandId);

  const payload = {
    titulo: thread.titulo || "",
    mensajes: thread.mensajes || [],
    resultado: thread.resultado || "positiva",
    notas: thread.notas || ""
  };

  const sb = getSupabase();
  const { data, error } = await sb
    .from("pitch_example_threads")
    .update(payload)
    .eq("id", id)
    .eq("band_id", cleanId)
    .select()
    .single();
  if (error) throw new Error(`Supabase Error (update example thread): ${error.message}`);
  return normalizeFromDb(data);
}

export async function dbDeleteExampleThread(id: string, bandId: string): Promise<boolean> {
  const cleanId = cleanBandId(bandId);
  const sb = getSupabase();
  const { error } = await sb.from("pitch_example_threads").delete().eq("id", id).eq("band_id", cleanId);
  if (error) throw new Error(`Supabase Error (delete example thread): ${error.message}`);
  return true;
}
