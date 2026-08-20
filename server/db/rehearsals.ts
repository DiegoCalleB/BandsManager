import { getSupabase, cleanBandId } from "./core.js";
import { ensureRegisteredBandExists } from "./bands.js";

export async function dbGetRehearsals(bandId: string | string[]) {
  const sb = getSupabase();
  let query = sb.from("rehearsals").select("*");
  if (Array.isArray(bandId)) {
    const cleanIds = bandId.map(id => cleanBandId(id)).filter(Boolean);
    if (cleanIds.length === 1) {
      query = query.eq("band_id", cleanIds[0]);
    } else if (cleanIds.length > 1) {
      query = query.in("band_id", cleanIds);
    }
  } else {
    query = query.eq("band_id", cleanBandId(bandId));
  }
  const { data, error } = await query.order("fecha", { ascending: true });

  if (error) throw new Error(`Supabase Error (rehearsals): ${error.message}`);
  return (data || []).map(r => ({
    ...r,
    asistentes: r.asistentes || [],
    convocados_ids: r.convocados_ids || [],
    convocados_nombres: r.convocados_nombres || []
  }));
}

export async function dbUpsertRehearsal(rehearsal: any, bandId: string) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(rehearsal.band_id || bandId);
  await ensureRegisteredBandExists(targetBandId);

  const payload = {
    id: rehearsal.id || `reh-${Date.now()}`,
    band_id: targetBandId,
    band_name: rehearsal.band_name || rehearsal.bandName || "",
    fecha: rehearsal.fecha,
    hora: rehearsal.hora || "20:00",
    lugar: rehearsal.lugar || "Local de Ensayo",
    asistentes: rehearsal.asistentes || [],
    notas: rehearsal.notas || "",
    estado: rehearsal.estado || "programado",
    setlist_id: rehearsal.setlist_id || rehearsal.setlistId || null,
    convocatoria_tipo: rehearsal.convocatoria_tipo || rehearsal.convocatoriaTipo || "completa",
    convocados_ids: rehearsal.convocados_ids || rehearsal.convocadosIds || [],
    convocados_nombres: rehearsal.convocados_nombres || rehearsal.convocadosNombres || []
  };

  const { data, error } = await sb.from("rehearsals").upsert(payload).select().single();
  if (error) throw new Error(`Supabase Error (upsert rehearsal): ${error.message}`);
  return data;
}

export async function dbDeleteRehearsal(id: string, bandId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("rehearsals").delete().eq("id", id).eq("band_id", cleanBandId(bandId));
  if (error) throw new Error(`Supabase Error (delete rehearsal): ${error.message}`);
  return true;
}

// --- CONCERTS ---
