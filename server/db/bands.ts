import { getSupabase, cleanBandId, normalizePlan } from "./core.js";

export async function dbMigrateAllPlansToNewTiers() {
  try {
    const sb = getSupabase();
    // 1. Migrate registered_bands
    const { data: bands } = await sb.from("registered_bands").select("id, band_id, plan");
    if (bands && bands.length > 0) {
      for (const b of bands) {
        const norm = normalizePlan(b.plan);
        if (b.plan !== norm) {
          await sb.from("registered_bands").update({ plan: norm }).eq("id", b.id);
        }
      }
    }
    // 2. Migrate users
    const { data: users } = await sb.from("users").select("id, plan");
    if (users && users.length > 0) {
      for (const u of users) {
        const norm = normalizePlan(u.plan);
        if (u.plan !== norm) {
          await sb.from("users").update({ plan: norm }).eq("id", u.id);
        }
      }
    }
  } catch (err) {
    console.warn("Notice during dbMigrateAllPlansToNewTiers:", err);
  }
}

// --- REGISTERED BANDS ---
export async function ensureRegisteredBandExists(bandId: string, nombreBanda?: string) {
  const cleanId = cleanBandId(bandId);
  const sb = getSupabase();
  try {
    const { data } = await sb.from("registered_bands").select("*").eq("band_id", cleanId).maybeSingle();
    const resolvedName = (nombreBanda && nombreBanda.trim() && nombreBanda.trim() !== "Banda") 
      ? nombreBanda.trim() 
      : (cleanId === "band-bakandeya" ? "Bakandeya" : (data?.nombre_banda && data.nombre_banda !== "Banda" ? data.nombre_banda : cleanId.replace(/^band-/, "").split("-").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ")));

    if (!data) {
      const payload = {
        id: `reg-${cleanId}`,
        band_id: cleanId,
        nombre_banda: resolvedName,
        email: "contacto@banda.com",
        plan: "ensayo",
        contacto_nombre: "Contacto",
        estado_cuenta: "activo"
      };
      await sb.from("registered_bands").upsert(payload);
    } else if (nombreBanda && nombreBanda.trim() && nombreBanda.trim() !== "Banda" && (data.nombre_banda === "Banda" || !data.nombre_banda)) {
      await sb.from("registered_bands").update({ nombre_banda: nombreBanda.trim() }).eq("band_id", cleanId);
    }
  } catch (err) {
    console.error("Error in ensureRegisteredBandExists:", err);
  }
}

export async function dbGetRegisteredBands() {
  const sb = getSupabase();
  const { data, error } = await sb.from("registered_bands").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`Supabase Error (registered_bands): ${error.message}`);
  return (data || []).map((b: any) => ({ ...b, plan: normalizePlan(b.plan) }));
}

export async function dbGetRegisteredBandById(bandId: string) {
  const sb = getSupabase();
  const { data, error } = await sb.from("registered_bands").select("*").eq("band_id", cleanBandId(bandId)).maybeSingle();
  if (error) throw new Error(`Supabase Error (registered_bands): ${error.message}`);
  if (!data) return null;
  return { ...data, plan: normalizePlan(data.plan) };
}

export async function dbUpsertRegisteredBand(band: any) {
  const sb = getSupabase();
  const payload = {
    id: band.id || `reg-${band.band_id || Date.now()}`,
    band_id: band.band_id || band.bandId,
    user_id: band.user_id || band.userId || null,
    nombre_banda: band.nombre_banda || band.nombreBanda || band.bandName || "Banda",
    email: band.email || "",
    plan: normalizePlan(band.plan),
    contacto_nombre: band.contacto_nombre || band.contactoNombre || "",
    estilo_musical: band.estilo_musical || band.estiloMusical || "",
    localizacion: band.localizacion || "",
    telefono: band.telefono || "",
    instagram: band.instagram || "",
    spotify_youtube: band.spotify_youtube || band.spotifyYoutube || "",
    aforo_promedio: Number(band.aforo_promedio || band.aforoPromedio || 0),
    estado_cuenta: band.estado_cuenta || "activo",
    notas: band.notas || ""
  };

  const { data, error } = await sb.from("registered_bands").upsert(payload).select().single();
  if (error) throw new Error(`Supabase Error (upsert registered_bands): ${error.message}`);
  return data;
}

export async function dbDeleteRegisteredBand(bandId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("registered_bands").delete().eq("band_id", cleanBandId(bandId));
  if (error) throw new Error(`Supabase Error (delete registered_bands): ${error.message}`);
  return true;
}

// --- USERS ---
