import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

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
function cleanBandId(bandId?: string): string {
  if (!bandId) {
    throw new Error("band_id es requerido para esta operación");
  }
  return bandId;
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
        plan: "pro",
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
  return data || [];
}

export async function dbGetRegisteredBandById(bandId: string) {
  const sb = getSupabase();
  const { data, error } = await sb.from("registered_bands").select("*").eq("band_id", cleanBandId(bandId)).maybeSingle();
  if (error) throw new Error(`Supabase Error (registered_bands): ${error.message}`);
  return data;
}

export async function dbUpsertRegisteredBand(band: any) {
  const sb = getSupabase();
  const payload = {
    id: band.id || `reg-${band.band_id || Date.now()}`,
    band_id: band.band_id || band.bandId,
    user_id: band.user_id || band.userId || null,
    nombre_banda: band.nombre_banda || band.nombreBanda || band.bandName || "Banda",
    email: band.email || "",
    plan: band.plan || "pro",
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
export async function dbGetUsers(bandId?: string) {
  const sb = getSupabase();
  let query = sb.from("users").select("*");
  if (bandId) {
    query = query.eq("band_id", cleanBandId(bandId));
  }
  const { data, error } = await query.order("created_at", { ascending: true });
  if (error) throw new Error(`Supabase Error (users): ${error.message}`);
  
  return (data || []).map(u => ({
    ...u,
    bandName: u.band_name || u.bandName,
    avatarColor: u.avatar_color || u.avatarColor,
    passwordHash: u.password_hash || u.passwordHash,
    googleOauth: u.google_oauth || u.googleOauth || {}
  }));
}

export async function dbGetUserById(userId: string) {
  const sb = getSupabase();
  const { data, error } = await sb.from("users").select("*").eq("id", userId).maybeSingle();
  if (error) throw new Error(`Supabase Error (getUserById): ${error.message}`);
  if (!data) return null;
  return {
    ...data,
    bandName: data.band_name || data.bandName,
    avatarColor: data.avatar_color || data.avatarColor,
    passwordHash: data.password_hash || data.passwordHash,
    googleOauth: data.google_oauth || data.googleOauth || {}
  };
}

export async function dbUpsertUser(user: any) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(user.band_id || user.bandId);
  await ensureRegisteredBandExists(targetBandId, user.bandName || user.band_name);

  const payload = {
    id: user.id || `user-${Date.now()}`,
    username: user.username || user.email,
    name: user.name || user.username || "Usuario",
    role: user.role || "member",
    plan: user.plan || "emergente",
    band_name: user.bandName || user.band_name || "",
    band_id: targetBandId,
    email: user.email || user.username || "",
    instrument: user.instrument || "",
    avatar_color: user.avatarColor || user.avatar_color || "bg-amber-500",
    password_hash: user.passwordHash || user.password_hash || "",
    salt: user.salt || "",
    google_oauth: user.googleOauth || user.google_oauth || {}
  };

  const { data, error } = await sb.from("users").upsert(payload).select().single();
  if (error) throw new Error(`Supabase Error (upsert user): ${error.message}`);
  return {
    ...data,
    bandName: data.band_name,
    avatarColor: data.avatar_color,
    passwordHash: data.password_hash,
    googleOauth: data.google_oauth
  };
}

export async function dbDeleteUser(userId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("users").delete().eq("id", userId);
  if (error) throw new Error(`Supabase Error (delete user): ${error.message}`);
  return true;
}

export async function dbDeleteUserFromBand(user_id: string, band_id: string) {
  const sb = getSupabase();
  const cleanId = cleanBandId(band_id);

  // Delete matching user_bands for user_id and band_id
  const { error: ubErr } = await sb
    .from('user_bands')
    .delete()
    .eq('user_id', user_id)
    .or(`band_id.eq.${cleanId},band_id.eq.band-${cleanId},band_id.eq.reg-${cleanId}`);
  if (ubErr) console.warn('Supabase notice (delete user_band):', ubErr.message);

  // Unlink user on registered_bands if this user was registered owner/contact
  const { error: rbErr } = await sb
    .from('registered_bands')
    .update({ user_id: null, email: null })
    .or(`band_id.eq.${cleanId},band_id.eq.band-${cleanId},band_id.eq.reg-${cleanId}`)
    .eq('user_id', user_id);
  if (rbErr) console.warn('Supabase notice (unlink registered_band):', rbErr.message);

  return { success: true };
}

export async function dbGetUserBands(userId?: string, bandId?: string) {
  const sb = getSupabase();
  let query = sb.from("user_bands").select("*");
  if (userId) query = query.eq("user_id", userId);
  if (bandId) query = query.eq("band_id", cleanBandId(bandId));

  const { data, error } = await query;
  if (error) throw new Error(`Supabase Error (user_bands): ${error.message}`);
  return data || [];
}

export async function dbUpsertUserBand(userBand: any) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(userBand.band_id || userBand.bandId);
  await ensureRegisteredBandExists(targetBandId);

  const payload = {
    id: userBand.id || `ub-${userBand.user_id || userBand.userId}-${targetBandId}`,
    user_id: userBand.user_id || userBand.userId,
    band_id: targetBandId,
    role: userBand.role || "member"
  };

  const { data, error } = await sb.from("user_bands").upsert(payload).select().single();
  if (error) throw new Error(`Supabase Error (upsert user_band): ${error.message}`);
  return data;
}

export async function dbDeleteUserBand(id: string) {
  const sb = getSupabase();
  const { error } = await sb.from("user_bands").delete().eq("id", id);
  if (error) throw new Error(`Supabase Error (delete user_band): ${error.message}`);
  return true;
}

// --- BAND CONTACTS / BANDAS COLABORADORAS ---
export async function dbGetBandContacts(bandId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("band_contacts")
    .select("*")
    .eq("band_id", cleanBandId(bandId))
    .order("nombre_banda", { ascending: true });

  if (error) throw new Error(`Supabase Error (band_contacts): ${error.message}`);
  return (data || []).map(b => ({
    ...b,
    dna_expresion: b.dna_expresion || {}
  }));
}

export async function dbUpsertBandContact(band: any, bandId: string) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(band.band_id || bandId);
  const name = (band.nombre_banda || band.nombreBanda || band.bandName || "").trim();
  await ensureRegisteredBandExists(targetBandId, name);

  let existingRecord: any = null;
  if (band.id) {
    const { data } = await sb.from("band_contacts").select("*").eq("id", band.id).maybeSingle();
    existingRecord = data;
  }
  if (!existingRecord && name) {
    const { data } = await sb
      .from("band_contacts")
      .select("*")
      .eq("band_id", targetBandId)
      .ilike("nombre_banda", name)
      .maybeSingle();
    existingRecord = data;
  }

  const finalId = existingRecord?.id || band.id || `band-${Date.now()}`;

  const payload = {
    id: finalId,
    band_id: targetBandId,
    nombre_banda: name || existingRecord?.nombre_banda || "Banda",
    estilo_musical: band.estilo_musical || band.estiloMusical || existingRecord?.estilo_musical || "",
    localizacion: band.localizacion || existingRecord?.localizacion || "",
    estado_relacion: band.estado_relacion || band.estadoRelacion || existingRecord?.estado_relacion || "sin_contactar",
    ultimo_contacto: band.ultimo_contacto || band.ultimoContacto || existingRecord?.ultimo_contacto || "",
    contacto_nombre: band.contacto_nombre || band.contactoNombre || existingRecord?.contacto_nombre || "",
    email: band.email || existingRecord?.email || "",
    telefono: band.telefono || existingRecord?.telefono || "",
    instagram: band.instagram || existingRecord?.instagram || "",
    spotify_youtube: band.spotify_youtube || band.spotifyYoutube || existingRecord?.spotify_youtube || "",
    aforo_promedio: Number(band.aforo_promedio || band.aforoPromedio || existingRecord?.aforo_promedio || 0),
    notas_colaboracion: band.notas_colaboracion || band.notasColaboracion || existingRecord?.notas_colaboracion || "",
    ciudad_origen_swap: band.ciudad_origen_swap || band.ciudadOrigenSwap || existingRecord?.ciudad_origen_swap || "",
    icono: band.icono || existingRecord?.icono || "🎸",
    imagen_url: band.imagen_url || band.imagenUrl || existingRecord?.imagen_url || "",
    es_favorito: Boolean(band.es_favorito ?? band.esFavorito ?? existingRecord?.es_favorito),
    es_verificado: Boolean(band.es_verificado ?? band.esVerificado ?? existingRecord?.es_verificado),
    fiabilidad_score: band.fiabilidad_score ?? band.fiabilidadScore ?? existingRecord?.fiabilidad_score ?? null,
    estilo_comunicacion: band.estilo_comunicacion || band.estiloComunicacion || existingRecord?.estilo_comunicacion || "",
    dna_expresion: band.dna_expresion || band.dnaExpresion || existingRecord?.dna_expresion || {}
  };

  const { data, error } = await sb.from("band_contacts").upsert(payload).select().single();
  if (error) throw new Error(`Supabase Error (upsert band_contacts): ${error.message}`);
  return data;
}

export async function dbDeleteBandContact(id: string, bandId: string) {
  const sb = getSupabase();
  const cleanId = cleanBandId(bandId);
  const { data: bandData } = await sb.from("band_contacts").select("*").eq("id", id).maybeSingle();
  if (bandData) {
    try {
      await sb.from("deleted_bands").upsert({
        id: `del-band-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        band_id: cleanId,
        nombre_banda: bandData.nombre_banda,
        motivo: 'Eliminado por el usuario para evitar ruido'
      });
    } catch (e) {
      console.warn("Notice recording deleted band in blacklist:", e);
    }
  }
  const { error } = await sb.from("band_contacts").delete().eq("id", id).eq("band_id", cleanId);
  if (error) throw new Error(`Supabase Error (delete band_contacts): ${error.message}`);
  return true;
}

// --- LEADS / SALAS / MEDIOS ---
export async function dbGetLeads(bandId: string) {
  const sb = getSupabase();
  const cleanId = cleanBandId(bandId);
  const { data, error } = await sb
    .from("leads")
    .select("*")
    .eq("band_id", cleanId)
    .order("nombre_sala", { ascending: true });

  if (error) throw new Error(`Supabase Error (leads): ${error.message}`);
  let leads = (data || []).map(l => ({
    ...l,
    historial_feedback_pitch: l.historial_feedback_pitch || [],
    historial_contacto: l.historial_contacto || []
  }));

  if (leads.length === 0 && (cleanId === 'band-bakandeya' || cleanId === 'bakandeya')) {
    try {
      const { INITIAL_LEADS } = await import("../src/db_seed.js");
      const seededLeads = INITIAL_LEADS.map(l => ({
        ...l,
        id: `${cleanId}-${l.id}`,
        band_id: cleanId,
        pitch_generado: cleanId === 'band-bakandeya' ? l.pitch_generado : '',
        historial_feedback_pitch: [],
        historial_contacto: []
      }));
      await sb.from("leads").upsert(seededLeads);
      leads = seededLeads;
    } catch (err) {
      console.error("Error seeding initial leads for band:", err);
    }
  }

  // Guarantee Sala Siroco is always present and maintained for band-bakandeya
  if (cleanId === 'band-bakandeya' && !leads.some(l => (l.nombre_sala || '').toLowerCase().includes('siroco'))) {
    const sirocoLead = {
      id: 'lead-siroco',
      band_id: 'band-bakandeya',
      nombre_sala: 'Sala Siroco',
      ciudad: 'Madrid',
      region: 'Madrid',
      direccion: 'Calle de San Dimas, 3, Centro, 28015 Madrid, España',
      aforo: 250,
      genero: 'Indie / Rock / Club / Electronica',
      tipo: 'sala',
      email_contacto: 'booking@salasiroco.es',
      telefono: '+34 915 933 070',
      website: 'https://salasiroco.es/',
      instagram: 'https://www.instagram.com/salasiroco/',
      fuente: 'Directorio Oficial',
      estado: 'nuevo',
      pitch_generado: `Hola equipo de programación de Sala Siroco,

Os contactamos desde Bakandeya para presentar nuestra propuesta de directo en vuestra emblemática sala de Malasaña. Combinamos bases electrónicas analógicas, violín eléctrico y percusiones con una energía arrolladora ideal para el público de Siroco.

Dossier y música: https://bands-manager.up.railway.app/epk

¿Tendríais fecha disponible para programar un showcase o concierto este trimestre?

Saludos cordiales,
Bakandeya Agent Manager IA`,
      notas: 'Sala mítica de conciertos y clubbing en Malasaña, Madrid.',
      icono: '🏛️',
      es_favorito: true,
      es_verificado: true,
      fiabilidad_score: 95,
      historial_feedback_pitch: [],
      historial_contacto: []
    };
    try {
      await sb.from("leads").upsert(sirocoLead);
      leads.push(sirocoLead);
    } catch (e) {
      console.error("Error auto-inserting Sala Siroco:", e);
    }
  }

  return leads;
}

export async function dbGetLeadById(id: string, bandId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("leads")
    .select("*")
    .eq("id", id)
    .eq("band_id", cleanBandId(bandId))
    .maybeSingle();

  if (error) throw new Error(`Supabase Error (getLeadById): ${error.message}`);
  if (!data) return null;
  return {
    ...data,
    historial_feedback_pitch: data.historial_feedback_pitch || [],
    historial_contacto: data.historial_contacto || []
  };
}

export async function dbUpsertLead(lead: any, bandId: string) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(lead.band_id || bandId);
  await ensureRegisteredBandExists(targetBandId);

  const name = (lead.nombre_sala || lead.nombreSala || "").trim();

  let existingRecord: any = null;
  if (lead.id) {
    const { data } = await sb.from("leads").select("*").eq("id", lead.id).maybeSingle();
    existingRecord = data;
  }
  if (!existingRecord && name) {
    const { data } = await sb
      .from("leads")
      .select("*")
      .eq("band_id", targetBandId)
      .ilike("nombre_sala", name)
      .maybeSingle();
    existingRecord = data;
  }

  const finalId = existingRecord?.id || lead.id || `lead-${Date.now()}`;

  const payload = {
    id: finalId,
    band_id: targetBandId,
    nombre_sala: name || existingRecord?.nombre_sala || "Sala",
    ciudad: lead.ciudad || existingRecord?.ciudad || "",
    region: lead.region || existingRecord?.region || "",
    direccion: lead.direccion || existingRecord?.direccion || "",
    aforo: Number(lead.aforo || existingRecord?.aforo || 0),
    genero: lead.genero || existingRecord?.genero || "",
    tipo: lead.tipo || existingRecord?.tipo || "sala",
    email_contacto: lead.email_contacto || lead.emailContacto || existingRecord?.email_contacto || "",
    telefono: lead.telefono || existingRecord?.telefono || "",
    website: lead.website || existingRecord?.website || "",
    instagram: lead.instagram || existingRecord?.instagram || "",
    contacto_nombre: lead.contacto_nombre || lead.contactoNombre || existingRecord?.contacto_nombre || "",
    fuente: lead.fuente || existingRecord?.fuente || "manual",
    estado: lead.estado || existingRecord?.estado || "nuevo",
    pitch_generado: lead.pitch_generado || lead.pitchGenerado || existingRecord?.pitch_generado || "",
    fecha_envio: lead.fecha_envio || lead.fechaEnvio || existingRecord?.fecha_envio || "",
    fecha_ultima_respuesta: lead.fecha_ultima_respuesta || lead.fechaUltimaRespuesta || existingRecord?.fecha_ultima_respuesta || "",
    contexto_extra: lead.contexto_extra || lead.contextoExtra || existingRecord?.contexto_extra || "",
    notas: lead.notas || existingRecord?.notas || "",
    icono: lead.icono || existingRecord?.icono || "🏛️",
    imagen_url: lead.imagen_url || lead.imagenUrl || existingRecord?.imagen_url || "",
    es_favorito: Boolean(lead.es_favorito ?? lead.esFavorito ?? existingRecord?.es_favorito),
    es_verificado: Boolean(lead.es_verificado ?? lead.esVerificado ?? existingRecord?.es_verificado),
    fiabilidad_score: lead.fiabilidad_score ?? lead.fiabilidadScore ?? existingRecord?.fiabilidad_score ?? null,
    pitch_feedback_tono: lead.pitch_feedback_tono ?? lead.pitchFeedbackTono ?? existingRecord?.pitch_feedback_tono ?? null,
    pitch_feedback_contenido: lead.pitch_feedback_contenido ?? lead.pitchFeedbackContenido ?? existingRecord?.pitch_feedback_contenido ?? null,
    pitch_feedback_comentario: lead.pitch_feedback_comentario || lead.pitchFeedbackComentario || existingRecord?.pitch_feedback_comentario || "",
    historial_feedback_pitch: lead.historial_feedback_pitch || lead.historialFeedbackPitch || existingRecord?.historial_feedback_pitch || [],
    historial_contacto: lead.historial_contacto || lead.historialContacto || existingRecord?.historial_contacto || []
  };

  const { data, error } = await sb.from("leads").upsert(payload).select().single();
  if (error) throw new Error(`Supabase Error (upsert lead): ${error.message}`);
  return data;
}

export async function dbDeleteLead(id: string, bandId: string) {
  const sb = getSupabase();
  const cleanId = cleanBandId(bandId);
  const { data: leadData } = await sb.from("leads").select("*").eq("id", id).maybeSingle();
  if (leadData) {
    try {
      await sb.from("deleted_leads").upsert({
        id: `del-lead-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        band_id: cleanId,
        nombre_sala: leadData.nombre_sala,
        ciudad: leadData.ciudad || '',
        motivo: 'Eliminado por el usuario para evitar ruido'
      });
    } catch (e) {
      console.warn("Notice recording deleted lead in blacklist:", e);
    }
  }
  const { error } = await sb.from("leads").delete().eq("id", id).eq("band_id", cleanId);
  if (error) throw new Error(`Supabase Error (delete lead): ${error.message}`);
  return true;
}

export async function dbCheckDeletedLead(nombreSala: string, bandId: string) {
  const sb = getSupabase();
  const cleanId = cleanBandId(bandId);
  try {
    const { data } = await sb
      .from("deleted_leads")
      .select("*")
      .eq("band_id", cleanId)
      .ilike("nombre_sala", `%${nombreSala.trim()}%`)
      .limit(1);
    return data && data.length > 0 ? data[0] : null;
  } catch (e) {
    return null;
  }
}

export async function dbCheckDeletedBand(nombreBanda: string, bandId: string) {
  const sb = getSupabase();
  const cleanId = cleanBandId(bandId);
  try {
    const { data } = await sb
      .from("deleted_bands")
      .select("*")
      .eq("band_id", cleanId)
      .ilike("nombre_banda", `%${nombreBanda.trim()}%`)
      .limit(1);
    return data && data.length > 0 ? data[0] : null;
  } catch (e) {
    return null;
  }
}

// --- REHEARSALS ---
export async function dbGetRehearsals(bandId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("rehearsals")
    .select("*")
    .eq("band_id", cleanBandId(bandId))
    .order("fecha", { ascending: true });

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
export async function dbGetConcerts(bandId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("concerts")
    .select("*")
    .eq("band_id", cleanBandId(bandId))
    .order("fecha", { ascending: true });

  if (error) throw new Error(`Supabase Error (concerts): ${error.message}`);
  return (data || []).map(c => ({
    ...c,
    gastos_detalle: c.gastos_detalle || {},
    convocados_ids: c.convocados_ids || [],
    convocados_nombres: c.convocados_nombres || []
  }));
}

export async function dbUpsertConcert(concert: any, bandId: string) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(concert.band_id || bandId);
  await ensureRegisteredBandExists(targetBandId);

  const payload = {
    id: concert.id || `cnc-${Date.now()}`,
    band_id: targetBandId,
    band_name: concert.band_name || concert.bandName || "",
    fecha: concert.fecha,
    ciudad: concert.ciudad || "",
    sala: concert.sala || "Sala",
    direccion: concert.direccion || "",
    cache: Number(concert.cache || 0),
    aforo_vendido: Number(concert.aforo_vendido || concert.aforoVendido || 0),
    aforo_total: Number(concert.aforo_total || concert.aforoTotal || 0),
    contrato_firmado: Boolean(concert.contrato_firmado ?? concert.contratoFirmado),
    estado_pago: concert.estado_pago || concert.estadoPago || "pendiente",
    notas: concert.notas || "",
    tipo: concert.tipo || "sala",
    setlist_id: concert.setlist_id || concert.setlistId || null,
    gastos_detalle: concert.gastos_detalle || concert.gastosDetalle || {},
    gastos_estimados_tipicos: Number(concert.gastos_estimados_tipicos || concert.gastosEstimadosTipicos || 0),
    convocatoria_tipo: concert.convocatoria_tipo || concert.convocatoriaTipo || "completa",
    convocados_ids: concert.convocados_ids || concert.convocadosIds || [],
    convocados_nombres: concert.convocados_nombres || concert.convocadosNombres || []
  };

  const { data, error } = await sb.from("concerts").upsert(payload).select().single();
  if (error) throw new Error(`Supabase Error (upsert concert): ${error.message}`);
  return data;
}

export async function dbDeleteConcert(id: string, bandId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("concerts").delete().eq("id", id).eq("band_id", cleanBandId(bandId));
  if (error) throw new Error(`Supabase Error (delete concert): ${error.message}`);
  return true;
}

// --- SONGS ---
export async function dbGetSongs(bandId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("songs")
    .select("*")
    .eq("band_id", cleanBandId(bandId))
    .order("titulo", { ascending: true });

  if (error) throw new Error(`Supabase Error (songs): ${error.message}`);
  return (data || []).map(s => ({
    ...s,
    audio_ideas: s.audio_ideas || [],
    guia_sustituto: s.guia_sustituto || {}
  }));
}

export async function dbUpsertSong(song: any, bandId: string) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(song.band_id || bandId);
  await ensureRegisteredBandExists(targetBandId);

  const payload = {
    id: song.id || `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    band_id: targetBandId,
    titulo: song.titulo || "Nueva Canción",
    duracion: song.duracion || "03:30",
    duracion_segundos: Number(song.duracion_segundos || song.duracionSegundos || 210),
    duracion_minutos: Number(song.duracion_minutos || song.duracionMinutos || 3),
    tonalidad: song.tonalidad || "Mim",
    bpm: Number(song.bpm || 120),
    afinacion: song.afinacion || "Estándar E",
    album_disco: song.album_disco || song.albumDisco || "",
    orden_album: song.orden_album || song.ordenAlbum || null,
    album: song.album || "",
    genero: song.genero || "Mestizaje",
    tipo: song.tipo || "original",
    estado: song.estado || "ensayando",
    energia: Number(song.energia || 5),
    portada_url: song.portada_url || song.portadaUrl || "",
    favorito_general: Boolean(song.favorito_general ?? song.favoritoGeneral),
    estado_tema: song.estado_tema || song.estadoTema || "ensayando",
    es_version_covers: Boolean(song.es_version_covers ?? song.esVersionCovers),
    enlace_acordes: song.enlace_acordes || song.enlaceAcordes || "",
    notas_internas: song.notas_internas || song.notasInternas || "",
    audio_principal_url: song.audio_principal_url || song.audioPrincipalUrl || "",
    audio_ideas: song.audio_ideas || song.audioIdeas || [],
    cifrado_texto: song.cifrado_texto || song.cifradoTexto || "",
    guia_sustituto: song.guia_sustituto || song.guiaSustituto || {}
  };

  const { data, error } = await sb.from("songs").upsert(payload).select().single();
  if (error) throw new Error(`Supabase Error (upsert song): ${error.message}`);
  return data;
}

export async function dbDeleteSong(id: string, bandId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("songs").delete().eq("id", id).eq("band_id", cleanBandId(bandId));
  if (error) throw new Error(`Supabase Error (delete song): ${error.message}`);
  return true;
}

// --- SETLISTS ---
export async function dbGetSetlists(bandId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("setlists")
    .select("*")
    .eq("band_id", cleanBandId(bandId))
    .order("fecha_ultima_edicion", { ascending: false });

  if (error) throw new Error(`Supabase Error (setlists): ${error.message}`);
  return (data || []).map(sl => ({
    ...sl,
    items: sl.items || []
  }));
}

export async function dbUpsertSetlist(setlist: any, bandId: string) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(setlist.band_id || bandId);
  await ensureRegisteredBandExists(targetBandId);

  const payload = {
    id: setlist.id || `setlist-${Date.now()}`,
    band_id: targetBandId,
    nombre: setlist.nombre || "Repertorio",
    descripcion: setlist.descripcion || "",
    tipo_formato: setlist.tipo_formato || setlist.tipoFormato || "festival",
    duracion_total_estimada_minutos: Number(setlist.duracion_total_estimada_minutos || setlist.duracionTotalEstimadaMinutos || 0),
    items: setlist.items || []
  };

  const { data, error } = await sb.from("setlists").upsert(payload).select().single();
  if (error) throw new Error(`Supabase Error (upsert setlist): ${error.message}`);
  return data;
}

export async function dbDeleteSetlist(id: string, bandId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("setlists").delete().eq("id", id).eq("band_id", cleanBandId(bandId));
  if (error) throw new Error(`Supabase Error (delete setlist): ${error.message}`);
  return true;
}

// --- EPK CONFIGS ---
export async function dbGetEpkConfig(bandId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("epk_configs")
    .select("*")
    .eq("band_id", cleanBandId(bandId))
    .maybeSingle();

  if (error) throw new Error(`Supabase Error (epk_configs): ${error.message}`);
  if (!data) return null;
  return {
    ...data,
    logoUrl: data.logo_url,
    dossierPdfUrl: data.dossier_pdf_url,
    dossierPdfName: data.dossier_pdf_name,
    dossierDocumentUrl: data.dossier_document_url,
    dossierDocumentName: data.dossier_document_name,
    dossierTextoExtra: data.dossier_texto_extra,
    bandPhotos: data.band_photos || [],
    riderTecnico: data.rider_tecnico,
    riderPdfUrl: data.rider_pdf_url,
    riderPdfName: data.rider_pdf_name,
    enlacesRedes: data.enlaces_redes || {},
    contactoBooking: data.contacto_booking || {},
    temasDestacadosIds: data.temas_destacados_ids || [],
    incentivoFans: data.incentivo_fans || {},
    ciudadesConfig: data.ciudades_config || [],
    firmaEmail: data.firma_email || {}
  };
}

export async function dbUpsertEpkConfig(bandId: string, config: any) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(bandId);
  await ensureRegisteredBandExists(targetBandId);

  const payload = {
    band_id: targetBandId,
    biografia: config.biografia || "",
    logo_url: config.logoUrl || config.logo_url || "",
    dossier_pdf_url: config.dossierPdfUrl || config.dossier_pdf_url || "",
    dossier_pdf_name: config.dossierPdfName || config.dossier_pdf_name || "",
    dossier_document_url: config.dossierDocumentUrl || config.dossier_document_url || "",
    dossier_document_name: config.dossierDocumentName || config.dossier_document_name || "",
    dossier_texto_extra: config.dossierTextoExtra || config.dossier_texto_extra || "",
    band_photos: config.bandPhotos || config.band_photos || [],
    rider_tecnico: config.riderTecnico || config.rider_tecnico || "",
    rider_pdf_url: config.riderPdfUrl || config.rider_pdf_url || "",
    rider_pdf_name: config.riderPdfName || config.rider_pdf_name || "",
    enlaces_redes: config.enlacesRedes || config.enlaces_redes || {},
    contacto_booking: config.contactoBooking || config.contacto_booking || {},
    temas_destacados_ids: config.temasDestacadosIds || config.temas_destacados_ids || [],
    incentivo_fans: config.incentivoFans || config.incentivo_fans || {},
    ciudades_config: config.ciudadesConfig || config.ciudades_config || [],
    firma_email: config.firmaEmail || config.firma_email || {}
  };

  const { data, error } = await sb.from("epk_configs").upsert(payload).select().single();
  if (error) throw new Error(`Supabase Error (upsert epk_configs): ${error.message}`);
  return data;
}

// --- AUTONOMY CONFIGS ---
export async function dbGetAutonomyConfig(bandId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("autonomy_configs")
    .select("*")
    .eq("band_id", cleanBandId(bandId))
    .maybeSingle();

  if (error) throw new Error(`Supabase Error (autonomy_configs): ${error.message}`);
  if (!data) return null;
  return {
    dispatchLevel: data.dispatch_level,
    negotiationDepth: data.negotiation_depth,
    minCacheThreshold: data.min_cache_threshold,
    maxCacheThreshold: data.max_cache_threshold,
    autoDeclineUnderMinCache: data.auto_decline_under_min_cache,
    notifyOnEveryProposal: data.notify_on_every_proposal,
    requireHumanForFinalSignOff: data.require_human_for_final_sign_off
  };
}

export async function dbUpsertAutonomyConfig(bandId: string, config: any) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(bandId);
  await ensureRegisteredBandExists(targetBandId);

  const payload = {
    band_id: targetBandId,
    dispatch_level: config.dispatchLevel || config.dispatch_level || "draft_only",
    negotiation_depth: config.negotiationDepth || config.negotiation_depth || "filter_conditions",
    min_cache_threshold: Number(config.minCacheThreshold ?? config.min_cache_threshold ?? 300),
    max_cache_threshold: Number(config.maxCacheThreshold ?? config.max_cache_threshold ?? 800),
    auto_decline_under_min_cache: Boolean(config.autoDeclineUnderMinCache ?? config.auto_decline_under_min_cache),
    notify_on_every_proposal: Boolean(config.notifyOnEveryProposal ?? config.notify_on_every_proposal ?? true),
    require_human_for_final_sign_off: Boolean(config.requireHumanForFinalSignOff ?? config.require_human_for_final_sign_off ?? true)
  };

  const { data, error } = await sb.from("autonomy_configs").upsert(payload).select().single();
  if (error) throw new Error(`Supabase Error (upsert autonomy_configs): ${error.message}`);
  return data;
}

// --- FANS ---
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
export async function dbGetSocialPosts(bandId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("social_posts")
    .select("*")
    .eq("band_id", cleanBandId(bandId))
    .order("fecha", { ascending: false });

  if (error) throw new Error(`Supabase Error (social_posts): ${error.message}`);
  return data || [];
}

export async function dbUpsertSocialPost(post: any, bandId: string) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(post.band_id || bandId);
  await ensureRegisteredBandExists(targetBandId);

  const payload = {
    id: post.id || `post-${Date.now()}`,
    band_id: targetBandId,
    fecha: post.fecha || new Date().toISOString().split("T")[0],
    plataforma: post.plataforma || "instagram",
    contenido: post.contenido || "",
    estado: post.estado || "borrador",
    responsable: post.responsable || ""
  };

  const { data, error } = await sb.from("social_posts").upsert(payload).select().single();
  if (error) throw new Error(`Supabase Error (upsert social_posts): ${error.message}`);
  return data;
}

export async function dbDeleteSocialPost(id: string, bandId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("social_posts").delete().eq("id", id).eq("band_id", cleanBandId(bandId));
  if (error) throw new Error(`Supabase Error (delete social_posts): ${error.message}`);
  return true;
}

// --- PAYMENTS ---
export async function dbGetPayments(bandId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("payments")
    .select("*")
    .eq("band_id", cleanBandId(bandId))
    .order("fecha", { ascending: false });

  if (error) throw new Error(`Supabase Error (payments): ${error.message}`);
  return data || [];
}

export async function dbUpsertPayment(payment: any, bandId: string) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(payment.band_id || bandId);
  await ensureRegisteredBandExists(targetBandId);

  const payload = {
    id: payment.id || `pay-${Date.now()}`,
    band_id: targetBandId,
    tipo: payment.tipo || "gasto",
    categoria: payment.categoria || "Logística",
    concepto: payment.concepto || "Concepto",
    importe: Number(payment.importe || 0),
    fecha: payment.fecha || new Date().toISOString().split("T")[0],
    estado: payment.estado || "pendiente"
  };

  const { data, error } = await sb.from("payments").upsert(payload).select().single();
  if (error) throw new Error(`Supabase Error (upsert payment): ${error.message}`);
  return data;
}

export async function dbDeletePayment(id: string, bandId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("payments").delete().eq("id", id).eq("band_id", cleanBandId(bandId));
  if (error) throw new Error(`Supabase Error (delete payment): ${error.message}`);
  return true;
}

// --- SOCIAL METRICS ---
export async function dbGetSocialMetrics(bandId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("social_metrics")
    .select("*")
    .eq("band_id", cleanBandId(bandId))
    .order("fecha", { ascending: false });

  if (error) throw new Error(`Supabase Error (social_metrics): ${error.message}`);
  return data || [];
}

export async function dbUpsertSocialMetric(metric: any, bandId: string) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(metric.band_id || bandId);
  await ensureRegisteredBandExists(targetBandId);

  const payload = {
    id: metric.id || `met-${Date.now()}`,
    band_id: targetBandId,
    fecha: metric.fecha || new Date().toISOString().split("T")[0],
    instagram: Number(metric.instagram || 0),
    tiktok: Number(metric.tiktok || 0),
    youtube: Number(metric.youtube || 0),
    spotify: Number(metric.spotify || 0),
    notas: metric.notas || ""
  };

  const { data, error } = await sb.from("social_metrics").upsert(payload).select().single();
  if (error) throw new Error(`Supabase Error (upsert social_metrics): ${error.message}`);
  return data;
}

export async function dbDeleteSocialMetric(id: string, bandId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("social_metrics").delete().eq("id", id).eq("band_id", cleanBandId(bandId));
  if (error) throw new Error(`Supabase Error (delete social_metrics): ${error.message}`);
  return true;
}

// --- TOURS ---
export async function dbGetTours(bandId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("tours")
    .select("*")
    .eq("band_id", cleanBandId(bandId))
    .order("fecha_inicio", { ascending: true });

  if (error) throw new Error(`Supabase Error (tours): ${error.message}`);
  return (data || []).map(t => {
    const vehiculos = Array.isArray(t.vehiculos) && t.vehiculos.length > 0
      ? t.vehiculos
      : t.vehiculo
        ? [{
            id: 'veh-1',
            nombre: t.vehiculo,
            consumoL100km: Number(t.consumo_l100km || 9.5),
            precioCarburanteEUR: Number(t.precio_carburante_eur || 1.55),
            tipoCombustible: t.tipo_combustible || 'diesel'
          }]
        : [];

    return {
      ...t,
      fechaInicio: t.fecha_inicio || t.fechaInicio || "",
      fechaFin: t.fecha_fin || t.fechaFin || "",
      consumoL100km: t.consumo_l100km ?? t.consumoL100km,
      precioCarburanteEUR: t.precio_carburante_eur ?? t.precioCarburanteEUR,
      tipoCombustible: t.tipo_combustible || t.tipoCombustible || "diesel",
      presupuestoLogistica: t.presupuesto_logistica ?? t.presupuestoLogistica ?? 0,
      vehiculos,
      stops: t.stops || []
    };
  });
}

export async function dbUpsertTour(tour: any, bandId: string) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(tour.band_id || bandId);
  await ensureRegisteredBandExists(targetBandId);

  const vehiculos = Array.isArray(tour.vehiculos) && tour.vehiculos.length > 0
    ? tour.vehiculos
    : tour.vehiculo
      ? [{
          id: 'veh-1',
          nombre: tour.vehiculo,
          consumoL100km: Number(tour.consumoL100km || tour.consumo_l100km || 9.5),
          precioCarburanteEUR: Number(tour.precioCarburanteEUR || tour.precio_carburante_eur || 1.55),
          tipoCombustible: tour.tipoCombustible || tour.tipo_combustible || "diesel"
        }]
      : [];

  const mainVehiculo = vehiculos.length > 0
    ? vehiculos.map((v: any) => v.nombre).filter(Boolean).join(", ")
    : (tour.vehiculo || "");

  const payload: any = {
    id: tour.id || `tour-${Date.now()}`,
    band_id: targetBandId,
    nombre: tour.nombre || "Gira",
    fecha_inicio: tour.fecha_inicio || tour.fechaInicio || "",
    fecha_fin: tour.fecha_fin || tour.fechaFin || "",
    vehiculo: mainVehiculo,
    consumo_l100km: Number(tour.consumo_l100km || tour.consumoL100km || (vehiculos[0]?.consumoL100km ?? 0)),
    precio_carburante_eur: Number(tour.precio_carburante_eur || tour.precioCarburanteEUR || (vehiculos[0]?.precioCarburanteEUR ?? 0)),
    tipo_combustible: tour.tipo_combustible || tour.tipoCombustible || (vehiculos[0]?.tipoCombustible ?? "diesel"),
    presupuesto_logistica: Number(tour.presupuesto_logistica || tour.presupuestoLogistica || 0),
    vehiculos: vehiculos,
    stops: tour.stops || [],
    estado: tour.estado || "planificacion"
  };

  const { data, error } = await sb.from("tours").upsert(payload).select().single();
  if (error) throw new Error(`Supabase Error (upsert tour): ${error.message}`);
  return data;
}

export async function dbDeleteTour(id: string, bandId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("tours").delete().eq("id", id).eq("band_id", cleanBandId(bandId));
  if (error) throw new Error(`Supabase Error (delete tour): ${error.message}`);
  return true;
}

// --- RUN OF SHOW ---
export async function dbGetRunOfShow(bandId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("run_of_show")
    .select("*")
    .eq("band_id", cleanBandId(bandId))
    .order("fecha", { ascending: true })
    .order("time", { ascending: true });

  if (error) throw new Error(`Supabase Error (run_of_show): ${error.message}`);
  
  // Group by fecha as Record<string, any[]>
  const result: Record<string, any[]> = {};
  (data || []).forEach(item => {
    if (!result[item.fecha]) result[item.fecha] = [];
    result[item.fecha].push(item);
  });
  return result;
}

export async function dbSyncRunOfShowForDate(dateKey: string, items: any[], bandId: string) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(bandId);
  await ensureRegisteredBandExists(targetBandId);

  // Delete previous items for this date & band
  await sb.from("run_of_show").delete().eq("fecha", dateKey).eq("band_id", targetBandId);

  if (!items || items.length === 0) return true;

  const rows = items.map((it, idx) => ({
    id: it.id || `ros-${dateKey}-${idx}`,
    band_id: targetBandId,
    fecha: dateKey,
    time: it.time || "12:00",
    activity: it.activity || "",
    done: Boolean(it.done)
  }));

  const { error } = await sb.from("run_of_show").insert(rows);
  if (error) throw new Error(`Supabase Error (sync run_of_show): ${error.message}`);
  return true;
}

// --- GEAR CHECKLISTS ---
export async function dbGetGearChecklists(bandId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("gear_checklists")
    .select("*")
    .eq("band_id", cleanBandId(bandId))
    .order("fecha", { ascending: true });

  if (error) throw new Error(`Supabase Error (gear_checklists): ${error.message}`);

  const result: Record<string, any[]> = {};
  (data || []).forEach(item => {
    if (!result[item.fecha]) result[item.fecha] = [];
    result[item.fecha].push(item);
  });
  return result;
}

export async function dbSyncGearChecklistForDate(dateKey: string, items: any[], bandId: string) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(bandId);
  await ensureRegisteredBandExists(targetBandId);

  await sb.from("gear_checklists").delete().eq("fecha", dateKey).eq("band_id", targetBandId);

  if (!items || items.length === 0) return true;

  const rows = items.map((it, idx) => ({
    id: it.id || `gear-${dateKey}-${idx}`,
    band_id: targetBandId,
    fecha: dateKey,
    label: it.label || "",
    checked: Boolean(it.checked)
  }));

  const { error } = await sb.from("gear_checklists").insert(rows);
  if (error) throw new Error(`Supabase Error (sync gear_checklists): ${error.message}`);
  return true;
}

// --- PURE SUPABASE STATE LOADER (NO FALLBACK TO memory/json) ---
export async function loadStateFromSupabase(bandId: string, user?: any) {
  const cleanId = cleanBandId(bandId || "band-bakandeya");
  await ensureRegisteredBandExists(cleanId, user?.bandName || user?.band_name);

  const [
    leads,
    rehearsals,
    concerts,
    songs,
    setlists,
    epkConfig,
    autonomyConfig,
    fans,
    posts,
    payments,
    metrics,
    tours,
    runOfShow,
    gearChecklists,
    registeredBands,
    users,
    bands
  ] = await Promise.all([
    dbGetLeads(cleanId).catch(() => []),
    dbGetRehearsals(cleanId).catch(() => []),
    dbGetConcerts(cleanId).catch(() => []),
    dbGetSongs(cleanId).catch(() => []),
    dbGetSetlists(cleanId).catch(() => []),
    dbGetEpkConfig(cleanId).catch(() => null),
    dbGetAutonomyConfig(cleanId).catch(() => null),
    dbGetFans(cleanId).catch(() => []),
    dbGetSocialPosts(cleanId).catch(() => []),
    dbGetPayments(cleanId).catch(() => []),
    dbGetSocialMetrics(cleanId).catch(() => []),
    dbGetTours(cleanId).catch(() => []),
    dbGetRunOfShow(cleanId).catch(() => ({})),
    dbGetGearChecklists(cleanId).catch(() => ({})),
    dbGetRegisteredBands().catch(() => []),
    dbGetUsers(cleanId).catch(() => []),
    dbGetBandContacts(cleanId).catch(() => [])
  ]);

  return {
    leads,
    rehearsals,
    concerts,
    posts,
    payments,
    metrics,
    songs,
    setlists,
    bands,
    tours,
    fans,
    messages: [],
    runOfShow,
    gearChecklists,
    epkConfig: epkConfig || {
      biografia: "",
      logoUrl: cleanId === 'bakandeya' ? "/logo_bakandeya.jpg" : "",
      bandPhotos: cleanId === 'bakandeya' ? ["/logo_bakandeya.jpg"] : [],
      riderTecnico: "",
      enlacesRedes: {},
      contactoBooking: {},
      temasDestacadosIds: [],
      incentivoFans: {},
      ciudadesConfig: []
    },
    autonomyConfig: autonomyConfig || {
      dispatchLevel: "draft_only",
      negotiationDepth: "filter_conditions",
      minCacheThreshold: 300,
      maxCacheThreshold: 800,
      autoDeclineUnderMinCache: false,
      notifyOnEveryProposal: true,
      requireHumanForFinalSignOff: true
    },
    registeredBands,
    users,
    categoryTemplates: []
  };
}

// ----------------------------------------------------
// BAND SCHEDULES (Smart Gate - Python agent triggers)
// ----------------------------------------------------
const inMemorySchedules: Record<string, { band_id: string; timezone: string; horas_lector: number[]; horas_enviador: number[] }> = {};

function getMemoryFallbackSchedule(cleanId: string) {
  if (inMemorySchedules[cleanId]) {
    return inMemorySchedules[cleanId];
  }
  return {
    band_id: cleanId,
    timezone: 'Europe/Madrid',
    horas_lector: [],
    horas_enviador: []
  };
}

export async function dbGetBandSchedule(bandId: string) {
  const cleanId = bandId ? bandId.trim() : 'bakandeya';
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('band_schedules')
      .select('*')
      .eq('band_id', cleanId)
      .maybeSingle();

    if (error) {
      console.warn('Notice fetching band schedule from Supabase:', error.message || error);
      return getMemoryFallbackSchedule(cleanId);
    }

    if (!data) {
      return getMemoryFallbackSchedule(cleanId);
    }

    const schedule = {
      band_id: data.band_id,
      timezone: data.timezone || 'Europe/Madrid',
      horas_lector: Array.isArray(data.horas_lector) ? data.horas_lector.map((n: any) => Number(n)) : [],
      horas_enviador: Array.isArray(data.horas_enviador) ? data.horas_enviador.map((n: any) => Number(n)) : []
    };
    inMemorySchedules[cleanId] = schedule;
    return schedule;
  } catch (err) {
    console.warn('Fallback reading band schedule:', err);
    return getMemoryFallbackSchedule(cleanId);
  }
}

export async function dbUpsertBandSchedule(schedule: {
  band_id: string;
  timezone: string;
  horas_lector: number[];
  horas_enviador: number[];
}) {
  const cleanId = schedule.band_id ? schedule.band_id.trim() : 'bakandeya';
  
  // Ensure integer arrays
  const horasLectorClean = (schedule.horas_lector || []).map((h) => Math.floor(Number(h))).filter((h) => !isNaN(h) && h >= 0 && h <= 23);
  const horasEnviadorClean = (schedule.horas_enviador || []).map((h) => Math.floor(Number(h))).filter((h) => !isNaN(h) && h >= 0 && h <= 23);

  const payload = {
    band_id: cleanId,
    timezone: schedule.timezone || 'Europe/Madrid',
    horas_lector: horasLectorClean,
    horas_enviador: horasEnviadorClean
  };

  inMemorySchedules[cleanId] = payload;

  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('band_schedules')
      .upsert(payload, { onConflict: 'band_id' })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Warning upserting band schedule to Supabase (saved in memory fallback):', error.message || error);
      return payload;
    }

    return data || payload;
  } catch (err) {
    console.warn('Fallback upserting band schedule:', err);
    return payload;
  }
}

