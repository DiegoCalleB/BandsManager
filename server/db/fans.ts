import { getSupabase, cleanBandId } from "./core.js";
import { ensureRegisteredBandExists } from "./bands.js";

export async function dbGetFans(bandId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("fans")
    .select("*")
    .eq("band_id", cleanBandId(bandId))
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Supabase Error (fans): ${error.message}`);
  return (data || []).map(f => ({
    ...f,
    comoConocio: f.como_conocio,
    conciertoOrigenId: f.concierto_origen_id,
    conciertoOrigenNombre: f.concierto_origen_nombre,
    fechaCaptura: f.fecha_captura,
    consentimientoRGPD: f.consentimiento_rgpd
  }));
}

export async function dbUpsertFan(fan: any, bandId: string) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(fan.band_id || bandId);
  await ensureRegisteredBandExists(targetBandId);

  const payload = {
    id: fan.id || `fan-${Date.now()}`,
    band_id: targetBandId,
    nombre: fan.nombre || "",
    email: fan.email || "",
    ciudad: fan.ciudad || "",
    como_conocio: fan.comoConocio || fan.como_conocio || "",
    concierto_origen_id: fan.conciertoOrigenId || fan.concierto_origen_id || null,
    concierto_origen_nombre: fan.conciertoOrigenNombre || fan.concierto_origen_nombre || "",
    fecha_captura: fan.fechaCaptura || fan.fecha_captura || new Date().toISOString().split("T")[0],
    consentimiento_rgpd: Boolean(fan.consentimientoRGPD ?? fan.consentimiento_rgpd ?? true)
  };

  const { data, error } = await sb.from("fans").upsert(payload).select().single();
  if (error) throw new Error(`Supabase Error (upsert fan): ${error.message}`);
  return data;
}

export async function dbDeleteFan(id: string, bandId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("fans").delete().eq("id", id).eq("band_id", cleanBandId(bandId));
  if (error) throw new Error(`Supabase Error (delete fan): ${error.message}`);
  return true;
}

// --- SOCIAL POSTS ---
