import { getSupabase, cleanBandId } from "./core.js";

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

export async function dbGetLeadById(id: string, bandId?: string) {
  const sb = getSupabase();
  let query = sb.from("leads").select("*").eq("id", id);
  if (bandId && bandId.trim()) {
    query = query.eq("band_id", cleanBandId(bandId));
  }
  const { data, error } = await query.maybeSingle();

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
