import { getSupabase, cleanBandId } from './core.js';
import { ensureRegisteredBandExists } from './bands.js';

export function sanitizeWebsiteUrl(val: unknown): string {
  if (!val || typeof val !== 'string') return '';
  const str = val.trim();
  if (!str) return '';
  const lower = str.toLowerCase();

  if (
    lower.startsWith('asunto:') ||
    lower.startsWith('re:') ||
    lower.startsWith('fw:') ||
    lower.startsWith('fwd:') ||
    lower.startsWith('¡buenas') ||
    lower.startsWith('hola') ||
    lower.startsWith('estimado') ||
    lower === '0' ||
    lower === 'null' ||
    lower === 'undefined'
  ) {
    return '';
  }

  if (
    str.includes('\n') ||
    str.includes('\r') ||
    (str.includes(' ') && !str.includes('http'))
  ) {
    return '';
  }

  if (str.includes('@') && !str.includes('/')) return '';
  return str;
}

export function sanitizeInstagramHandle(val: unknown): string {
  if (!val || typeof val !== 'string') return '';
  const str = val.trim();
  if (!str) return '';
  const lower = str.toLowerCase();

  if (
    lower.startsWith('asunto:') ||
    lower.startsWith('re:') ||
    lower.startsWith('fw:') ||
    lower.startsWith('fwd:') ||
    lower.startsWith('¡buenas') ||
    lower.startsWith('hola') ||
    lower.startsWith('estimado') ||
    lower === '0' ||
    lower === 'null' ||
    lower === 'undefined'
  ) {
    return '';
  }

  if (str.includes('\n') || str.includes('\r') || str.includes(' ')) {
    return '';
  }

  return str;
}

export function cleanVenueNameAndTipo(
  rawName: string,
  existingTipo?: string
): { name: string; tipo: string } {
  if (!rawName) return { name: '', tipo: existingTipo || 'sala' };

  let name = rawName.trim();
  let tipo =
    existingTipo && existingTipo !== 'otro'
      ? existingTipo.toLowerCase()
      : 'sala';

  // Strip Festival prefix
  if (/^festival\s+/i.test(name)) {
    name = name.replace(/^festival\s+/i, '').trim();
    tipo = 'festival';
  } else if (
    name.toLowerCase().includes('festival') ||
    name.toLowerCase().includes('fest')
  ) {
    tipo = 'festival';
  }

  // Strip Ayuntamiento prefix
  if (/^(ayuntamiento\s+de|ayuntamiento|ayto\.?\s+de|ayto\.?)\s+/i.test(name)) {
    name = name
      .replace(/^(ayuntamiento\s+de|ayuntamiento|ayto\.?\s+de|ayto\.?)\s+/i, '')
      .trim();
    tipo = 'ayuntamiento';
  }

  // Strip Sala prefix
  if (/^sala\s+/i.test(name) && name.length > 5) {
    name = name.replace(/^sala\s+/i, '').trim();
    if (!existingTipo || existingTipo === 'otro') tipo = 'sala';
  }

  if (name.length > 0) {
    name = name.charAt(0).toUpperCase() + name.slice(1);
  }

  return { name, tipo };
}

export async function dbCleanCorruptedLeadFields(): Promise<number> {
  try {
    const sb = getSupabase();
    const { data: leads, error } = await sb
      .from('leads')
      .select('id, website, instagram');

    if (error || !leads) return 0;

    let cleanedCount = 0;
    for (const lead of leads) {
      const cleanWeb = sanitizeWebsiteUrl(lead.website);
      const cleanIg = sanitizeInstagramHandle(lead.instagram);

      if (
        cleanWeb !== (lead.website || '') ||
        cleanIg !== (lead.instagram || '')
      ) {
        await sb
          .from('leads')
          .update({
            website: cleanWeb,
            instagram: cleanIg,
          })
          .eq('id', lead.id);
        cleanedCount++;
      }
    }
    if (cleanedCount > 0) {
      console.log(
        `[DB Cleanup] Saneadas ${cleanedCount} filas con metadatos basura en website/instagram.`
      );
    }
    return cleanedCount;
  } catch (err) {
    console.error('Error in dbCleanCorruptedLeadFields:', err);
    return 0;
  }
}

export interface GetLeadsOptions {
  page?: number;
  limit?: number;
  estado?: string;
  search?: string;
  ciudad?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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

export function enrichLeadWithTelemetry(l: any) {
  if (!l) return null;
  const historial = Array.isArray(l.historial_contacto) ? l.historial_contacto : [];
  const notas = String(l.notas || '');

  // 1. Detección de aperturas de correo
  const openEvents = historial.filter(
    (h: any) =>
      h.id?.startsWith('open-') ||
      h.id?.startsWith('resend-open-') ||
      h.notas?.toLowerCase().includes('abrió el correo') ||
      h.notas?.toLowerCase().includes('apertura') ||
      h.resultado?.toLowerCase().includes('abierto') ||
      h.resultado?.toLowerCase().includes('info recibida')
  );

  const hasOpenInNotas =
    notas.includes('Email Abierto') ||
    notas.includes('Apertura #') ||
    notas.includes('abierto');

  const email_abierto = Boolean(l.email_abierto || openEvents.length > 0 || hasOpenInNotas);
  const veces_abierto = Math.max(Number(l.veces_abierto) || 0, openEvents.length, hasOpenInNotas ? 1 : 0);
  const ultimo_abierto_at = l.ultimo_abierto_at || openEvents[0]?.fecha || (email_abierto ? l.updated_at || l.fecha_envio : undefined);
  const primer_abierto_at = l.primer_abierto_at || openEvents[openEvents.length - 1]?.fecha || ultimo_abierto_at;

  // 2. Detección de clics en EPK / Dossier
  const clickEvents = historial.filter(
    (h: any) =>
      h.id?.startsWith('click-') ||
      h.id?.startsWith('epk-') ||
      h.id?.startsWith('resend-click-') ||
      h.notas?.toLowerCase().includes('enlace') ||
      h.notas?.toLowerCase().includes('dossier') ||
      h.notas?.toLowerCase().includes('epk') ||
      h.resultado?.toLowerCase().includes('clic') ||
      h.resultado?.toLowerCase().includes('interesado')
  );

  const hasClickInNotas =
    notas.includes('Clic en Enlace') ||
    notas.includes('Dossier Web Abierto') ||
    notas.includes('Clic #') ||
    notas.includes('Clic EPK');

  const clics_epk = Math.max(Number(l.clics_epk) || 0, clickEvents.length, hasClickInNotas ? 1 : 0);
  const ultimo_clic_at = l.ultimo_clic_at || clickEvents[0]?.fecha || (clics_epk > 0 ? l.updated_at : undefined);

  return {
    ...l,
    email_abierto: email_abierto || clics_epk > 0,
    veces_abierto: Math.max(veces_abierto, clics_epk > 0 ? 1 : 0),
    primer_abierto_at,
    ultimo_abierto_at,
    clics_epk,
    ultimo_clic_at,
    fechas_libres_detectadas: Array.isArray(l.fechas_libres_detectadas)
      ? l.fechas_libres_detectadas
      : [],
    fechas_ocupadas: Array.isArray(l.fechas_ocupadas) ? l.fechas_ocupadas : [],
    roster: l.roster || '',
    historial_feedback_pitch: l.historial_feedback_pitch || [],
    historial_contacto: historial,
    hilo_emails: l.hilo_emails || [],
    fechas_propuestas_sala: Array.isArray(l.fechas_propuestas_sala)
      ? l.fechas_propuestas_sala
      : [],
    condiciones_economicas_detectadas:
      l.condiciones_economicas_detectadas || null,
    estrategia_playbook: l.estrategia_playbook || null,
    ultimo_mensaje_recibido: l.ultimo_mensaje_recibido || '',
  };
}

export async function dbGetLeads(bandId: string): Promise<any[]> {
  const sb = getSupabase();
  const cleanId = cleanBandId(bandId);
  const { data, error } = await sb
    .from('leads')
    .select('*')
    .eq('band_id', cleanId)
    .order('nombre_sala', { ascending: true });

  if (error) throw new Error(`Supabase Error (leads): ${error.message}`);
  // Validation layer: guarantee strict band_id isolation
  let validated = (data || []).filter(
    (l) => cleanBandId(l.band_id) === cleanId
  );

  for (const l of validated) {
    if (
      l.nombre_sala?.toLowerCase().includes('mon live') ||
      l.nombre_sala?.toLowerCase() === 'mon' ||
      l.email_contacto === 'info@salamonlive.com' ||
      l.id === 'lead-test-telemetry-diego'
    ) {
      l.email_contacto = 'diego.delacalleb@gmail.com';
      l.nombre_sala = 'Mon Live (Test Telemetría)';
      if (!l.pitch_generado || l.pitch_generado === 'Sin pitch generado.') {
        l.pitch_generado = `Hola Diego,\n\nNos ponemos en contacto desde la oficina de Bakandeya. Sabemos que Sala Mon es uno de los espacios con mejor acústica y ambiente de conciertos en directo en Madrid.\n\nEstamos preparando el tramo de otoño de nuestra gira y nos encantaría presentar el directo en vuestra sala. Tenéis el dossier oficial interactivo en el enlace adjunto.\n\n¿Tendríais alguna fecha disponible para valorar en noviembre?\n\nUn saludo cordial,\nBakandeya Booking`;
      }
      void sb
        .from('leads')
        .update({
          email_contacto: 'diego.delacalleb@gmail.com',
          nombre_sala: 'Mon Live (Test Telemetría)',
          pitch_generado: l.pitch_generado,
        })
        .eq('id', l.id);
    }
  }

  return validated.map((l) => enrichLeadWithTelemetry(l));
}

export async function dbGetLeadsPaginated(
  bandId: string,
  options: GetLeadsOptions
): Promise<PaginatedLeadsResult> {
  const sb = getSupabase();
  const cleanId = cleanBandId(bandId);

  let query = sb
    .from('leads')
    .select('*', { count: 'exact' })
    .eq('band_id', cleanId);

  if (options?.estado && options.estado !== 'todos') {
    query = query.eq('estado', options.estado);
  }

  if (options?.ciudad && options.ciudad.trim()) {
    query = query.ilike('ciudad', `%${options.ciudad.trim()}%`);
  }

  if (options?.search && options.search.trim()) {
    const term = `%${options.search.trim()}%`;
    query = query.or(
      `nombre_sala.ilike.${term},ciudad.ilike.${term},email_contacto.ilike.${term},genero.ilike.${term}`
    );
  }

  const sortCol = options?.sortBy || 'nombre_sala';
  const ascending = options?.sortOrder ? options.sortOrder === 'asc' : true;
  query = query.order(sortCol, { ascending });

  const page = options?.page || 1;
  const limit = options?.limit || 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error)
    throw new Error(`Supabase Error (leads paginated): ${error.message}`);

  // Validation layer: guarantee strict band_id isolation
  let validated = (data || []).filter(
    (l) => cleanBandId(l.band_id) === cleanId
  );

  for (const l of validated) {
    if (
      l.nombre_sala?.toLowerCase().includes('mon live') ||
      l.nombre_sala?.toLowerCase() === 'mon' ||
      l.email_contacto === 'info@salamonlive.com' ||
      l.id === 'lead-test-telemetry-diego'
    ) {
      l.email_contacto = 'diego.delacalleb@gmail.com';
      l.nombre_sala = 'Mon Live (Test Telemetría)';
      if (!l.pitch_generado || l.pitch_generado === 'Sin pitch generado.') {
        l.pitch_generado = `Hola Diego,\n\nNos ponemos en contacto desde la oficina de Bakandeya. Sabemos que Sala Mon es uno de los espacios con mejor acústica y ambiente de conciertos en directo en Madrid.\n\nEstamos preparando el tramo de otoño de nuestra gira y nos encantaría presentar el directo en vuestra sala. Tenéis el dossier oficial interactivo en el enlace adjunto.\n\n¿Tendríais alguna fecha disponible para valorar en noviembre?\n\nUn saludo cordial,\nBakandeya Booking`;
      }
    }
  }

  const leads = validated.map((l) => enrichLeadWithTelemetry(l));

  const total = count ?? leads.length;

  return {
    leads,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function dbGetLeadById(id: string, bandId?: string) {
  const sb = getSupabase();
  let query = sb.from('leads').select('*').eq('id', id);
  if (bandId && bandId.trim()) {
    query = query.eq('band_id', cleanBandId(bandId));
  }
  const { data, error } = await query.maybeSingle();

  if (error) throw new Error(`Supabase Error (getLeadById): ${error.message}`);
  if (!data) return null;
  if (
    bandId &&
    bandId.trim() &&
    cleanBandId(data.band_id) !== cleanBandId(bandId)
  ) {
    return null;
  }
  if (data.nombre_sala?.toLowerCase().includes('mon live') || data.nombre_sala?.toLowerCase() === 'mon' || data.email_contacto === 'info@salamonlive.com' || data.id === 'lead-test-telemetry-diego') {
    data.email_contacto = 'diego.delacalleb@gmail.com';
    data.nombre_sala = 'Mon Live (Test Telemetría)';
  }
  return enrichLeadWithTelemetry(data);
}

export async function dbUpsertLead(lead: any, bandId: string) {
  const sb = getSupabase();
  // 'bandId' es el único origen de confianza: lo resuelve la ruta a partir de la sesión
  // (req.user.band_id). 'lead.band_id' viene del cuerpo de la petición sin validar, y
  // server/routes/leads/crud.ts solo lo rellena si falta ('if (!newLead.band_id)') — si el
  // cliente ya lo manda, antes se colaba tal cual. Priorizarlo permitía a cualquier usuario
  // autenticado escribir un lead en la banda de otro con solo incluir "band_id" en el body
  // (mismo fallo ya corregido en server/db/campaigns.ts).
  const targetBandId = cleanBandId(bandId);
  await ensureRegisteredBandExists(targetBandId);

  const name = (lead.nombre_sala || lead.nombreSala || '').trim();

  // Antes se buscaba el id sin filtrar por banda: si `lead.id` coincidía con el de un lead de
  // OTRA banda, ese registro pasaba a considerarse "el existente", el upsert (por id, clave
  // primaria) lo sobrescribía reasignándolo a la banda atacante, y los campos no enviados se
  // rellenaban con los valores reales del lead ajeno (email, teléfono, notas...). Un id que no
  // pertenece a la banda del usuario no se reutiliza nunca: se trata como un lead nuevo.
  let existingRecord: any = null;
  let idBelongsToOtherBand = false;
  if (lead.id) {
    const { data } = await sb
      .from('leads')
      .select('*')
      .eq('id', lead.id)
      .maybeSingle();
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
      .from('leads')
      .select('*')
      .eq('band_id', targetBandId)
      .ilike('nombre_sala', name)
      .maybeSingle();
    existingRecord = data;
  }

  const finalId =
    existingRecord?.id ||
    (idBelongsToOtherBand ? `lead-${Date.now()}` : lead.id) ||
    `lead-${Date.now()}`;

  const rawName = name || existingRecord?.nombre_sala || 'Sala';
  const rawTipo = lead.tipo || existingRecord?.tipo || 'sala';
  const { name: finalCleanName, tipo: finalCleanTipo } = cleanVenueNameAndTipo(
    rawName,
    rawTipo
  );

  const payload = {
    id: finalId,
    band_id: targetBandId,
    nombre_sala: finalCleanName || 'Espacio',
    ciudad: lead.ciudad || existingRecord?.ciudad || '',
    region: lead.region || existingRecord?.region || '',
    direccion: lead.direccion || existingRecord?.direccion || '',
    aforo: Number(lead.aforo || existingRecord?.aforo || 0),
    genero: lead.genero || existingRecord?.genero || '',
    tipo: finalCleanTipo,
    email_contacto:
      lead.email_contacto ||
      lead.emailContacto ||
      existingRecord?.email_contacto ||
      '',
    email_secundario:
      lead.email_secundario ||
      lead.emailSecundario ||
      existingRecord?.email_secundario ||
      '',
    telefono:
      lead.telefono ||
      lead.telefono_movil ||
      lead.telefono_fijo ||
      existingRecord?.telefono ||
      '',
    telefono_movil:
      lead.telefono_movil ||
      lead.telefonoMovil ||
      existingRecord?.telefono_movil ||
      '',
    telefono_fijo:
      lead.telefono_fijo ||
      lead.telefonoFijo ||
      existingRecord?.telefono_fijo ||
      '',
    website: sanitizeWebsiteUrl(lead.website || existingRecord?.website || ''),
    instagram: sanitizeInstagramHandle(
      lead.instagram || existingRecord?.instagram || ''
    ),
    contacto_nombre:
      lead.contacto_nombre ||
      lead.contactoNombre ||
      existingRecord?.contacto_nombre ||
      '',
    fuente: lead.fuente || existingRecord?.fuente || 'manual',
    estado: lead.estado || existingRecord?.estado || 'nuevo',
    pitch_generado:
      lead.pitch_generado ||
      lead.pitchGenerado ||
      existingRecord?.pitch_generado ||
      '',
    fecha_envio:
      lead.fecha_envio || lead.fechaEnvio || existingRecord?.fecha_envio || '',
    fecha_ultima_respuesta:
      lead.fecha_ultima_respuesta ||
      lead.fechaUltimaRespuesta ||
      existingRecord?.fecha_ultima_respuesta ||
      '',
    contexto_extra:
      lead.contexto_extra ||
      lead.contextoExtra ||
      existingRecord?.contexto_extra ||
      '',
    notas: lead.notas || existingRecord?.notas || '',
    icono: lead.icono || existingRecord?.icono || '🏛️',
    imagen_url:
      lead.imagen_url || lead.imagenUrl || existingRecord?.imagen_url || '',
    es_favorito: Boolean(
      lead.es_favorito ?? lead.esFavorito ?? existingRecord?.es_favorito
    ),
    es_verificado: Boolean(
      lead.es_verificado ?? lead.esVerificado ?? existingRecord?.es_verificado
    ),
    fiabilidad_score:
      lead.fiabilidad_score ??
      lead.fiabilidadScore ??
      existingRecord?.fiabilidad_score ??
      null,
    pitch_feedback_tono:
      lead.pitch_feedback_tono ??
      lead.pitchFeedbackTono ??
      existingRecord?.pitch_feedback_tono ??
      null,
    pitch_feedback_contenido:
      lead.pitch_feedback_contenido ??
      lead.pitchFeedbackContenido ??
      existingRecord?.pitch_feedback_contenido ??
      null,
    pitch_feedback_comentario:
      lead.pitch_feedback_comentario ||
      lead.pitchFeedbackComentario ||
      existingRecord?.pitch_feedback_comentario ||
      '',
    historial_feedback_pitch:
      lead.historial_feedback_pitch ||
      lead.historialFeedbackPitch ||
      existingRecord?.historial_feedback_pitch ||
      [],
    historial_contacto:
      lead.historial_contacto ||
      lead.historialContacto ||
      existingRecord?.historial_contacto ||
      [],
    hilo_emails: lead.hilo_emails || existingRecord?.hilo_emails || [],
    roster: lead.roster || existingRecord?.roster || '',
    festival_start_date:
      lead.festival_start_date ||
      lead.festivalStartDate ||
      existingRecord?.festival_start_date ||
      null,
    festival_end_date:
      lead.festival_end_date ||
      lead.festivalEndDate ||
      existingRecord?.festival_end_date ||
      null,
    fechas_ocupadas:
      lead.fechas_ocupadas ||
      lead.fechasOcupadas ||
      existingRecord?.fechas_ocupadas ||
      [],
    fechas_libres_detectadas:
      lead.fechas_libres_detectadas ||
      lead.fechasLibresDetectadas ||
      existingRecord?.fechas_libres_detectadas ||
      [],
    ultimo_sentimiento:
      lead.ultimo_sentimiento || existingRecord?.ultimo_sentimiento || null,
    ultimo_sentimiento_score:
      lead.ultimo_sentimiento_score ??
      existingRecord?.ultimo_sentimiento_score ??
      null,
    ultimo_sentimiento_label:
      lead.ultimo_sentimiento_label ||
      existingRecord?.ultimo_sentimiento_label ||
      null,
    ultima_intencion:
      lead.ultima_intencion || existingRecord?.ultima_intencion || null,
    ultima_intencion_etiqueta:
      lead.ultima_intencion_etiqueta ||
      existingRecord?.ultima_intencion_etiqueta ||
      null,
    ultimas_objeciones:
      lead.ultimas_objeciones || existingRecord?.ultimas_objeciones || [],
    ultimo_analisis_resumen:
      lead.ultimo_analisis_resumen ||
      existingRecord?.ultimo_analisis_resumen ||
      '',
    temperatura_lead:
      lead.temperatura_lead ||
      lead.temperatura ||
      existingRecord?.temperatura_lead ||
      null,
    fechas_propuestas_sala:
      lead.fechas_propuestas_sala ||
      existingRecord?.fechas_propuestas_sala ||
      [],
    condiciones_economicas_detectadas:
      lead.condiciones_economicas_detectadas ||
      existingRecord?.condiciones_economicas_detectadas ||
      null,
    estrategia_playbook:
      lead.estrategia_playbook || existingRecord?.estrategia_playbook || null,
    ultimo_mensaje_recibido:
      lead.ultimo_mensaje_recibido ||
      existingRecord?.ultimo_mensaje_recibido ||
      '',
  };

  const { data, error } = await sb
    .from('leads')
    .upsert(payload)
    .select()
    .maybeSingle();
  if (error) {
    console.warn(
      'Primary Supabase upsert failed, retrying with smart column fallback:',
      error.message
    );

    // Dynamic column fallback: if error mentions a missing column, strip it and retry preserving all other fields
    let fallbackPayload: any = { ...payload };
    const missingColMatches = [
      ...error.message.matchAll(/column "([^"]+)"/gi),
      ...error.message.matchAll(/column '([^']+)'/gi),
      ...error.message.matchAll(/could not find column '([^']+)'/gi),
      ...error.message.matchAll(/find the '([^']+)' column/gi),
      ...error.message.matchAll(/'([^']+)' column/gi),
      ...error.message.matchAll(/column ([a-zA-Z0-0_]+)/gi),
    ];

    if (missingColMatches.length > 0) {
      for (const match of missingColMatches) {
        const missingCol = match[1];
        if (missingCol && missingCol in fallbackPayload) {
          console.warn(
            `Stripping missing column '${missingCol}' and retrying...`
          );
          delete fallbackPayload[missingCol];
        }
      }
      const { data: retryData, error: retryError } = await sb
        .from('leads')
        .upsert(fallbackPayload)
        .select()
        .maybeSingle();
      if (!retryError && retryData) return retryData;
    }

    // Core fallback if dynamic stripping fails
    const corePayload = {
      id: finalId,
      band_id: targetBandId,
      nombre_sala: payload.nombre_sala,
      ciudad: payload.ciudad,
      region: payload.region,
      direccion: payload.direccion,
      aforo: payload.aforo,
      genero: payload.genero,
      tipo: payload.tipo,
      email_contacto: payload.email_contacto,
      email_secundario: payload.email_secundario,
      contacto_nombre: payload.contacto_nombre,
      telefono: payload.telefono,
      telefono_movil: payload.telefono_movil,
      telefono_fijo: payload.telefono_fijo,
      website: payload.website,
      instagram: payload.instagram,
      fuente: payload.fuente,
      estado: payload.estado,
      pitch_generado: payload.pitch_generado,
      notas: payload.notas,
      icono: payload.icono,
      imagen_url: payload.imagen_url,
    };
    const { data: retryData, error: retryError } = await sb
      .from('leads')
      .upsert(corePayload)
      .select()
      .single();
    if (retryError) {
      if (
        retryError.message.includes('email_secundario') ||
        retryError.message.includes('telefono_movil') ||
        retryError.message.includes('telefono_fijo')
      ) {
        const legacyPayload: any = { ...corePayload };
        if (retryError.message.includes('email_secundario'))
          delete legacyPayload.email_secundario;
        if (retryError.message.includes('telefono_movil'))
          delete legacyPayload.telefono_movil;
        if (retryError.message.includes('telefono_fijo'))
          delete legacyPayload.telefono_fijo;
        const { data: legacyData, error: legacyError } = await sb
          .from('leads')
          .upsert(legacyPayload)
          .select()
          .single();
        if (legacyError)
          throw new Error(
            `Supabase Error (upsert lead): ${legacyError.message}`
          );
        return legacyData;
      }
      throw new Error(`Supabase Error (upsert lead): ${retryError.message}`);
    }
    return retryData;
  }
  return data;
}

export async function dbBulkDeleteLeads(ids: string[], bandId: string) {
  if (!ids || ids.length === 0) return true;
  const sb = getSupabase();
  const cleanId = cleanBandId(bandId);

  // PostgreSQL Trigger (trg_archive_deleted_lead) automatically archives rows to deleted_leads BEFORE DELETE
  const { error } = await sb
    .from('leads')
    .delete()
    .in('id', ids)
    .eq('band_id', cleanId);
  if (error)
    throw new Error(`Supabase Error (bulk delete leads): ${error.message}`);
  return true;
}

export async function dbDeleteLead(id: string, bandId: string) {
  const sb = getSupabase();
  const cleanId = cleanBandId(bandId);
  // PostgreSQL Trigger (trg_archive_deleted_lead) handles blacklist archival atomically
  const { error } = await sb
    .from('leads')
    .delete()
    .eq('id', id)
    .eq('band_id', cleanId);
  if (error) throw new Error(`Supabase Error (delete lead): ${error.message}`);
  return true;
}

export async function dbCheckDeletedLead(nombreSala: string, bandId: string) {
  const sb = getSupabase();
  const cleanId = cleanBandId(bandId);
  try {
    const { data } = await sb
      .from('deleted_leads')
      .select('*')
      .eq('band_id', cleanId)
      .ilike('nombre_sala', `%${nombreSala.trim()}%`)
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
      .from('deleted_bands')
      .select('*')
      .eq('band_id', cleanId)
      .ilike('nombre_banda', `%${nombreBanda.trim()}%`)
      .limit(1);
    return data && data.length > 0 ? data[0] : null;
  } catch (e) {
    return null;
  }
}

// --- REHEARSALS ---
