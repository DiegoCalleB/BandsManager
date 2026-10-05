import { getSupabase, cleanBandId } from "./core.js";
import { ensureRegisteredBandExists } from "./bands.js";

export async function dbGetFans(bandId: string) {
  const sb = getSupabase();
  const cleanId = cleanBandId(bandId);
  const { data, error } = await sb
    .from("fans")
    .select("*")
    .eq("band_id", cleanId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Supabase Error (fans): ${error.message}`);
  const validated = (data || []).filter(f => cleanBandId(f.band_id) === cleanId);
  return validated.map(f => ({
    ...f,
    comoConocio: f.como_conocio,
    conciertoOrigenId: f.concierto_origen_id,
    conciertoOrigenNombre: f.concierto_origen_nombre,
    fechaCaptura: f.fecha_captura,
    consentimientoRGPD: f.consentimiento_rgpd,
    mensaje: f.mensaje,
    cancionFavorita: f.cancion_favorita,
    instagram: f.instagram
  }));
}

export async function dbUpsertFan(fan: any, bandId: string) {
  const sb = getSupabase();
  // 'bandId' es el único origen de confianza. En las rutas con sesión es req.user.band_id; en el
  // alta pública por QR (/api/public/fans) la propia ruta ya resuelve targetBandId desde la URL
  // antes de llamar aquí, así que 'fan.band_id' del cuerpo nunca hace falta y no debe primar —
  // si no, un usuario autenticado podría registrar un fan en la banda de otro con solo mandar
  // {"band_id": "banda-ajena"} (mismo fallo ya corregido en server/db/campaigns.ts).
  const targetBandId = cleanBandId(bandId);
  await ensureRegisteredBandExists(targetBandId);

  // El upsert es por id (clave primaria): sin esta comprobación, un id que coincidiera con el de
  // un fan de OTRA banda (dato RGPD: nombre, email) se sobrescribiría y reasignaría a la banda del
  // llamador. Esta función también se alcanza desde el formulario público sin autenticar, así
  // que el id que llega del cliente nunca es de fiar por sí solo.
  let finalFanId = fan.id;
  if (finalFanId) {
    const { data: existing } = await sb.from("fans").select("id, band_id").eq("id", finalFanId).maybeSingle();
    if (existing && existing.band_id !== targetBandId) {
      finalFanId = `fan-${Date.now()}`;
    }
  }

  const payload: any = {
    id: finalFanId || `fan-${Date.now()}`,
    band_id: targetBandId,
    nombre: fan.nombre || "",
    email: fan.email || "",
    ciudad: fan.ciudad || "",
    como_conocio: fan.comoConocio || fan.como_conocio || "",
    concierto_origen_id: fan.conciertoOrigenId || fan.concierto_origen_id || null,
    concierto_origen_nombre: fan.conciertoOrigenNombre || fan.concierto_origen_nombre || "",
    fecha_captura: fan.fechaCaptura || fan.fecha_captura || new Date().toISOString().split("T")[0],
    consentimiento_rgpd: Boolean(fan.consentimientoRGPD ?? fan.consentimiento_rgpd ?? true),
    mensaje: fan.mensaje || "",
    cancion_favorita: fan.cancionFavorita || fan.cancion_favorita || "",
    instagram: fan.instagram || ""
  };

  let { data, error } = await sb.from("fans").upsert(payload).select().single();

  // Reintenta sin las columnas nuevas si el esquema remoto de Supabase aún
  // no tiene la migración aplicada (ver supabase_migration_only_new.sql).
  if (error && error.message && (
    error.message.toLowerCase().includes("mensaje") ||
    error.message.toLowerCase().includes("cancion_favorita") ||
    error.message.toLowerCase().includes("instagram")
  )) {
    console.warn("Reintentando upsert de fan sin campos no presentes en el esquema remoto (mensaje/cancion_favorita/instagram)...");
    const fallbackPayload = { ...payload };
    delete fallbackPayload.mensaje;
    delete fallbackPayload.cancion_favorita;
    delete fallbackPayload.instagram;
    const retry = await sb.from("fans").upsert(fallbackPayload).select().single();
    if (retry.error) throw new Error(`Supabase Error (upsert fan fallback): ${retry.error.message}`);
    data = retry.data;
    error = null;
  } else if (error) {
    throw new Error(`Supabase Error (upsert fan): ${error.message}`);
  }

  return {
    ...data,
    mensaje: data?.mensaje ?? fan.mensaje,
    cancionFavorita: data?.cancion_favorita ?? fan.cancionFavorita,
    instagram: data?.instagram ?? fan.instagram
  };
}

export async function dbDeleteFan(id: string, bandId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("fans").delete().eq("id", id).eq("band_id", cleanBandId(bandId));
  if (error) throw new Error(`Supabase Error (delete fan): ${error.message}`);
  return true;
}

// --- MUSICIANS WAITLIST ---

export async function dbUpsertMusicianWaitlist(item: any) {
  const sb = getSupabase();
  const payload = {
    id: item.id || `musician-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    nombre_banda: item.nombreBanda || item.nombre_banda || "",
    nombre_contacto: item.nombreContacto || item.nombre_contacto || "",
    email: item.email || "",
    instagram: item.instagram || "",
    telefono: item.telefono || "",
    ciudad: item.ciudad || "",
    genero: item.genero || "",
    enlace_musica: item.enlaceMusica || item.enlace_musica || "",
    interes_principal: item.interesPrincipal || item.interes_principal || "",
    notas: item.notas || "",
    idioma: item.idioma || "es",
    banda_origen: item.bandaOrigen || item.banda_origen || "",
    concierto_origen: item.conciertoOrigen || item.concierto_origen || "",
    created_at: item.created_at || new Date().toISOString()
  };

  try {
    const { data, error } = await sb.from("musicians_waitlist").upsert(payload).select().single();
    if (!error && data) {
      return data;
    }
  } catch (err) {
    // Si la tabla musicians_waitlist no existe en Supabase todavía, guardamos como lead especial
  }

  try {
    const leadPayload = {
      id: payload.id,
      band_id: payload.banda_origen || "platform",
      nombre: payload.nombre_banda || payload.nombre_contacto,
      contacto: payload.nombre_contacto,
      email: payload.email,
      telefono: payload.telefono,
      ciudad: payload.ciudad,
      tipo: "musico_waitlist",
      estado: "nuevo",
      notas: `[Waitlist Músicos BandManager.io] Instagram: ${payload.instagram} | Género: ${payload.genero} | Enlace: ${payload.enlace_musica} | Interés: ${payload.interes_principal} | Idioma: ${payload.idioma} | Origen: ${payload.banda_origen} ${payload.concierto_origen} | Notas: ${payload.notas}`
    };
    await sb.from("leads").upsert(leadPayload);
  } catch (leadErr) {
    console.warn("Could not save musician to leads table:", leadErr);
  }

  return payload;
}

export async function dbGetMusiciansWaitlist() {
  const sb = getSupabase();
  try {
    const { data, error } = await sb.from("musicians_waitlist").select("*").order("created_at", { ascending: false });
    if (!error && data) return data;
  } catch (e) {}

  try {
    const { data, error } = await sb.from("leads").select("*").eq("tipo", "musico_waitlist").order("created_at", { ascending: false });
    if (!error && data) return data;
  } catch (e) {}

  return [];
}

