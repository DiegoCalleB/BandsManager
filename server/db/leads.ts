import { getSupabase, cleanBandId } from "./core.js";
import { ensureRegisteredBandExists } from "./bands.js";

export interface GetLeadsOptions {
  page?: number;
  limit?: number;
  estado?: string;
  search?: string;
  ciudad?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedLeadsResult {
  leads: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function dbGetLeads(bandId: string): Promise<any[]> {
  const sb = getSupabase();
  const cleanId = cleanBandId(bandId);
  const { data, error } = await sb
    .from("leads")
    .select("*")
    .eq("band_id", cleanId)
    .order("nombre_sala", { ascending: true });

  if (error) throw new Error(`Supabase Error (leads): ${error.message}`);
  return (data || []).map(l => ({
    ...l,
    historial_feedback_pitch: l.historial_feedback_pitch || [],
    historial_contacto: l.historial_contacto || []
  }));
}

export async function dbGetLeadsPaginated(bandId: string, options: GetLeadsOptions): Promise<PaginatedLeadsResult> {
  const sb = getSupabase();
  const cleanId = cleanBandId(bandId);

  let query = sb
    .from("leads")
    .select("*", { count: "exact" })
    .eq("band_id", cleanId);

  if (options?.estado && options.estado !== "todos") {
    query = query.eq("estado", options.estado);
  }

  if (options?.ciudad && options.ciudad.trim()) {
    query = query.ilike("ciudad", `%${options.ciudad.trim()}%`);
  }

  if (options?.search && options.search.trim()) {
    const term = `%${options.search.trim()}%`;
    query = query.or(`nombre_sala.ilike.${term},ciudad.ilike.${term},email_contacto.ilike.${term},genero.ilike.${term}`);
  }

  const sortCol = options?.sortBy || "nombre_sala";
  const ascending = options?.sortOrder ? options.sortOrder === "asc" : true;
  query = query.order(sortCol, { ascending });

  const page = options?.page || 1;
  const limit = options?.limit || 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) throw new Error(`Supabase Error (leads paginated): ${error.message}`);
  
  const leads = (data || []).map(l => ({
    ...l,
    historial_feedback_pitch: l.historial_feedback_pitch || [],
    historial_contacto: l.historial_contacto || []
  }));

  const total = count ?? leads.length;

  return {
    leads,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
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

  // Antes se buscaba el id sin filtrar por banda: si `lead.id` coincidía con el de un lead de
  // OTRA banda, ese registro pasaba a considerarse "el existente", el upsert (por id, clave
  // primaria) lo sobrescribía reasignándolo a la banda atacante, y los campos no enviados se
  // rellenaban con los valores reales del lead ajeno (email, teléfono, notas...). Un id que no
  // pertenece a la banda del usuario no se reutiliza nunca: se trata como un lead nuevo.
  let existingRecord: any = null;
  let idBelongsToOtherBand = false;
  if (lead.id) {
    const { data } = await sb.from("leads").select("*").eq("id", lead.id).maybeSingle();
    if (data) {
      if (data.band_id === targetBandId) {
        existingRecord = data;
      } else {
        idBelongsToOtherBand = true;
      }
    }
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

  const finalId = existingRecord?.id || (idBelongsToOtherBand ? `lead-${Date.now()}` : lead.id) || `lead-${Date.now()}`;

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

export async function dbBulkDeleteLeads(ids: string[], bandId: string) {
  if (!ids || ids.length === 0) return true;
  const sb = getSupabase();
  const cleanId = cleanBandId(bandId);

  // PostgreSQL Trigger (trg_archive_deleted_lead) automatically archives rows to deleted_leads BEFORE DELETE
  const { error } = await sb.from("leads").delete().in("id", ids).eq("band_id", cleanId);
  if (error) throw new Error(`Supabase Error (bulk delete leads): ${error.message}`);
  return true;
}

export async function dbDeleteLead(id: string, bandId: string) {
  const sb = getSupabase();
  const cleanId = cleanBandId(bandId);
  // PostgreSQL Trigger (trg_archive_deleted_lead) handles blacklist archival atomically
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
