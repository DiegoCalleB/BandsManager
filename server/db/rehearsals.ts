import { getSupabase, cleanBandId } from './core.js';
import { ensureRegisteredBandExists } from './bands.js';
import { mergeWithExisting } from './mergeWithExisting.js';

function parseSafeArray(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val))
    return val
      .map((x) =>
        typeof x === 'string' ? x : x?.name || x?.nombre || String(x)
      )
      .filter(Boolean);
  if (typeof val === 'string' && val.trim()) {
    const s = val.trim();
    if (s.startsWith('[') && s.endsWith(']')) {
      try {
        const p = JSON.parse(s);
        if (Array.isArray(p))
          return p
            .map((x) =>
              typeof x === 'string' ? x : x?.name || x?.nombre || String(x)
            )
            .filter(Boolean);
      } catch {}
    }
    return s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
}

export async function dbGetRehearsals(bandId: string | string[]) {
  const sb = getSupabase();
  let query = sb.from('rehearsals').select('*');
  let allowedIds: string[] = [];

  if (Array.isArray(bandId)) {
    allowedIds = bandId
      .map((id) => cleanBandId(id))
      .filter((id) => id && id !== '__sin_banda__');
    if (allowedIds.length === 0) return [];
    if (allowedIds.length === 1) {
      query = query.eq('band_id', allowedIds[0]);
    } else {
      query = query.in('band_id', allowedIds);
    }
  } else {
    const cleanId = cleanBandId(bandId);
    if (!cleanId || cleanId === '__sin_banda__' || cleanId === 'all') return [];
    allowedIds = [cleanId];
    query = query.eq('band_id', cleanId);
  }
  const { data, error } = await query.order('fecha', { ascending: true });

  if (error) throw new Error(`Supabase Error (rehearsals): ${error.message}`);

  // Validation layer: filter out any records that do not belong to the allowed band IDs
  const allowedSet = new Set(allowedIds);
  const validatedData = (data || []).filter(
    (r) => r.band_id && allowedSet.has(cleanBandId(r.band_id))
  );

  return validatedData.map((r) => ({
    ...r,
    setlist_id: r.setlist_id || r.setlistId || null,
    setlistId: r.setlist_id || r.setlistId || undefined,
    tipo_evento: r.tipo_evento || r.tipoEvento || 'ensayo',
    asunto: r.asunto || '',
    enlace_reunion: r.enlace_reunion || r.enlaceReunion || '',
    horaFin: r.hora_fin || r.horaFin || undefined,
    asistentes: parseSafeArray(r.asistentes),
    convocados_ids: parseSafeArray(r.convocados_ids),
    convocados_nombres: parseSafeArray(r.convocados_nombres),
    agenda: r.agenda || [],
    objetivos: r.objetivos || [],
    duracionEstimadaMin:
      r.duracion_estimada_min ?? r.duracionEstimadaMin ?? undefined,
    duracionRealSeg: r.duracion_real_seg ?? r.duracionRealSeg ?? undefined,
    cronometroEstado: r.cronometro_estado || r.cronometroEstado || undefined,
    acta: r.acta || undefined,
    grabaciones: r.grabaciones || [],
    ratingGeneral: r.rating_general ?? r.ratingGeneral ?? undefined,
    temperaturaLocal: r.temperatura_local || r.temperaturaLocal || undefined,
  }));
}

export async function dbUpsertRehearsal(rehearsal: any, bandId: string) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(bandId);
  await ensureRegisteredBandExists(targetBandId);

  let finalRehearsalId = rehearsal.id;
  let existingRehearsal: any = null;
  if (finalRehearsalId) {
    // Ver nota equivalente en dbUpsertConcert: un id que no pertenece a la banda del usuario no se
    // reutiliza nunca (evita sobrescribir/robar el ensayo de otra banda por coincidencia de id).
    // El SELECT trae la fila entera para que un guardado parcial no resetee a []/{} en silencio
    // los campos que no manda (agenda, objetivos, grabaciones, cronómetro, acta).
    const { data: existing } = await sb
      .from('rehearsals')
      .select('*')
      .eq('id', finalRehearsalId)
      .maybeSingle();
    if (existing) {
      if (existing.band_id && cleanBandId(existing.band_id) !== targetBandId) {
        finalRehearsalId = `reh-${Date.now()}`;
      } else {
        existingRehearsal = existing;
      }
    }
  }

  const merged = mergeWithExisting(existingRehearsal, rehearsal);

  const payload = {
    id: finalRehearsalId || `reh-${Date.now()}`,
    band_id: targetBandId,
    band_name: merged.band_name || merged.bandName || '',
    fecha: merged.fecha || new Date().toISOString().split('T')[0],
    hora: merged.hora || '20:00',
    hora_fin: merged.hora_fin || merged.horaFin || null,
    lugar: merged.lugar || 'Local de Ensayo',
    tipo_evento: merged.tipo_evento || merged.tipoEvento || 'ensayo',
    asunto: merged.asunto || '',
    enlace_reunion: merged.enlace_reunion || merged.enlaceReunion || '',
    asistentes: parseSafeArray(merged.asistentes),
    notas: merged.notas || '',
    estado: merged.estado || 'programado',
    setlist_id: merged.setlist_id || merged.setlistId || null,
    convocatoria_tipo:
      merged.convocatoria_tipo || merged.convocatoriaTipo || 'completa',
    convocados_ids: parseSafeArray(
      merged.convocados_ids || merged.convocadosIds
    ),
    convocados_nombres: parseSafeArray(
      merged.convocados_nombres || merged.convocadosNombres
    ),
    agenda: merged.agenda || [],
    objetivos: merged.objetivos || [],
    duracion_estimada_min:
      merged.duracion_estimada_min ?? merged.duracionEstimadaMin ?? 0,
    duracion_real_seg: merged.duracion_real_seg ?? merged.duracionRealSeg ?? 0,
    cronometro_estado:
      merged.cronometro_estado || merged.cronometroEstado || {},
    acta: merged.acta || {},
    grabaciones: merged.grabaciones || [],
    rating_general: merged.rating_general ?? merged.ratingGeneral ?? null,
    temperatura_local:
      merged.temperatura_local || merged.temperaturaLocal || null,
  };

  const currentPayload: Record<string, any> = { ...payload };
  let res = await sb
    .from('rehearsals')
    .upsert(currentPayload)
    .select()
    .single();
  let data = res.data;
  let error = res.error;

  while (
    error &&
    error.message &&
    error.message.includes("Could not find the '") &&
    error.message.includes("' column of 'rehearsals'")
  ) {
    const match = error.message.match(
      /Could not find the '([^']+)'column of 'rehearsals'/
    );
    if (match && match[1] && currentPayload[match[1]] !== undefined) {
      const missingCol = match[1];
      console.warn(
        `[Rehearsals] Columna '${missingCol}' no encontrada en Supabase rehearsals. Reintentando sin ella. Ejecuta la migración SQL.`
      );
      delete currentPayload[missingCol];
      const retryRes = await sb
        .from('rehearsals')
        .upsert(currentPayload)
        .select()
        .single();
      data = retryRes.data;
      error = retryRes.error;
    } else {
      break;
    }
  }

  if (error)
    throw new Error(`Supabase Error (upsert rehearsal): ${error.message}`);
  return data;
}

export async function dbDeleteRehearsal(id: string, bandId: string) {
  const sb = getSupabase();
  const cleanId = cleanBandId(bandId);
  const possibleBandIds = Array.from(
    new Set([bandId, cleanId, `band-${cleanId}`, `reg-${cleanId}`])
  ).filter(Boolean);
  const { error } = await sb
    .from('rehearsals')
    .delete()
    .eq('id', id)
    .in('band_id', possibleBandIds);
  if (error)
    throw new Error(`Supabase Error (delete rehearsal): ${error.message}`);
  return true;
}

// --- CONCERTS ---
