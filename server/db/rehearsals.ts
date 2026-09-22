import { getSupabase, cleanBandId } from "./core.js";
import { ensureRegisteredBandExists } from "./bands.js";

function parseSafeArray(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(x => typeof x === 'string' ? x : (x?.name || x?.nombre || String(x))).filter(Boolean);
  if (typeof val === 'string' && val.trim()) {
    const s = val.trim();
    if (s.startsWith('[') && s.endsWith(']')) {
      try {
        const p = JSON.parse(s);
        if (Array.isArray(p)) return p.map(x => typeof x === 'string' ? x : (x?.name || x?.nombre || String(x))).filter(Boolean);
      } catch {}
    }
    return s.split(',').map(x => x.trim()).filter(Boolean);
  }
  return [];
}

export async function dbGetRehearsals(bandId: string | string[]) {
  const sb = getSupabase();
  let query = sb.from("rehearsals").select("*");
  let allowedIds: string[] = [];

  if (Array.isArray(bandId)) {
    allowedIds = bandId.map(id => cleanBandId(id)).filter(id => id && id !== '__sin_banda__');
    if (allowedIds.length === 0) return [];
    if (allowedIds.length === 1) {
      query = query.eq("band_id", allowedIds[0]);
    } else {
      query = query.in("band_id", allowedIds);
    }
  } else {
    const cleanId = cleanBandId(bandId);
    if (!cleanId || cleanId === '__sin_banda__' || cleanId === 'all') return [];
    allowedIds = [cleanId];
    query = query.eq("band_id", cleanId);
  }
  const { data, error } = await query.order("fecha", { ascending: true });

  if (error) throw new Error(`Supabase Error (rehearsals): ${error.message}`);

  // Validation layer: filter out any records that do not belong to the allowed band IDs
  const allowedSet = new Set(allowedIds);
  const validatedData = (data || []).filter(r => r.band_id && allowedSet.has(cleanBandId(r.band_id)));

  return validatedData.map(r => ({
    ...r,
    tipo_evento: r.tipo_evento || r.tipoEvento || 'ensayo',
    asunto: r.asunto || '',
    enlace_reunion: r.enlace_reunion || r.enlaceReunion || '',
    horaFin: r.hora_fin || r.horaFin || undefined,
    asistentes: parseSafeArray(r.asistentes),
    convocados_ids: parseSafeArray(r.convocados_ids),
    convocados_nombres: parseSafeArray(r.convocados_nombres),
    agenda: r.agenda || [],
    objetivos: r.objetivos || [],
    duracionEstimadaMin: r.duracion_estimada_min ?? r.duracionEstimadaMin ?? undefined,
    duracionRealSeg: r.duracion_real_seg ?? r.duracionRealSeg ?? undefined,
    cronometroEstado: r.cronometro_estado || r.cronometroEstado || undefined,
    acta: r.acta || undefined,
    grabaciones: r.grabaciones || [],
    ratingGeneral: r.rating_general ?? r.ratingGeneral ?? undefined,
    temperaturaLocal: r.temperatura_local || r.temperaturaLocal || undefined
  }));
}

export async function dbUpsertRehearsal(rehearsal: any, bandId: string) {
  const sb = getSupabase();
  // 'bandId' es el único origen de confianza (lo resuelve la ruta desde la sesión); el
  // objeto de entrada puede traer su propio 'band_id' sin validar desde el cuerpo de la
  // petición y no debe primar (ver el mismo fallo corregido en server/db/campaigns.ts).
  const targetBandId = cleanBandId(bandId);
  await ensureRegisteredBandExists(targetBandId);

  // Ver nota equivalente en dbUpsertConcert: un id que no pertenece a la banda del usuario no se
  // reutiliza nunca (evita sobrescribir/robar el ensayo de otra banda por coincidencia de id).
  // El SELECT trae también los campos JSONB/array que un caller parcial podría no mandar
  // (agenda, objetivos, grabaciones, cronómetro, acta) — sin esto no hay forma de preservarlos
  // si el payload entrante no los incluye; antes se reseteaban a []/{} en silencio en cualquier
  // guardado que no los trajera, igual que le pasó a `miembros` en epk.ts.
  let finalRehearsalId = rehearsal.id;
  let existing: any = null;
  if (finalRehearsalId) {
    const { data } = await sb.from("rehearsals").select("id, band_id, agenda, objetivos, grabaciones, cronometro_estado, acta").eq("id", finalRehearsalId).maybeSingle();
    existing = data;
    if (existing && existing.band_id !== targetBandId) {
      finalRehearsalId = `reh-${Date.now()}`;
      existing = null;
    }
  }

  const payload = {
    id: finalRehearsalId || `reh-${Date.now()}`,
    band_id: targetBandId,
    band_name: rehearsal.band_name || rehearsal.bandName || "",
    fecha: rehearsal.fecha,
    hora: rehearsal.hora || "20:00",
    hora_fin: rehearsal.hora_fin || rehearsal.horaFin || null,
    lugar: rehearsal.lugar || "Local de Ensayo",
    tipo_evento: rehearsal.tipo_evento || rehearsal.tipoEvento || 'ensayo',
    asunto: rehearsal.asunto || '',
    enlace_reunion: rehearsal.enlace_reunion || rehearsal.enlaceReunion || '',
    asistentes: parseSafeArray(rehearsal.asistentes),
    notas: rehearsal.notas || "",
    estado: rehearsal.estado || "programado",
    setlist_id: rehearsal.setlist_id || rehearsal.setlistId || null,
    convocatoria_tipo: rehearsal.convocatoria_tipo || rehearsal.convocatoriaTipo || "completa",
    convocados_ids: parseSafeArray(rehearsal.convocados_ids || rehearsal.convocadosIds),
    convocados_nombres: parseSafeArray(rehearsal.convocados_nombres || rehearsal.convocadosNombres),
    agenda: rehearsal.agenda !== undefined ? rehearsal.agenda : (existing?.agenda ?? []),
    objetivos: rehearsal.objetivos !== undefined ? rehearsal.objetivos : (existing?.objetivos ?? []),
    duracion_estimada_min: rehearsal.duracion_estimada_min ?? rehearsal.duracionEstimadaMin ?? 0,
    duracion_real_seg: rehearsal.duracion_real_seg ?? rehearsal.duracionRealSeg ?? 0,
    cronometro_estado: (rehearsal.cronometro_estado ?? rehearsal.cronometroEstado) !== undefined
      ? (rehearsal.cronometro_estado || rehearsal.cronometroEstado)
      : (existing?.cronometro_estado ?? {}),
    acta: rehearsal.acta !== undefined ? rehearsal.acta : (existing?.acta ?? {}),
    grabaciones: rehearsal.grabaciones !== undefined ? rehearsal.grabaciones : (existing?.grabaciones ?? []),
    rating_general: rehearsal.rating_general ?? rehearsal.ratingGeneral ?? null,
    temperatura_local: rehearsal.temperatura_local || rehearsal.temperaturaLocal || null
  };

  const currentPayload: Record<string, any> = { ...payload };
  let res = await sb.from("rehearsals").upsert(currentPayload).select().single();
  let data = res.data;
  let error = res.error;

  while (error && error.message && error.message.includes("Could not find the '") && error.message.includes("' column of 'rehearsals'")) {
    const match = error.message.match(/Could not find the '([^']+)'column of 'rehearsals'/);
    if (match && match[1] && currentPayload[match[1]] !== undefined) {
      const missingCol = match[1];
      console.warn(`[Rehearsals] Columna '${missingCol}' no encontrada en Supabase rehearsals. Reintentando sin ella. Ejecuta la migración SQL.`);
      delete currentPayload[missingCol];
      const retryRes = await sb.from("rehearsals").upsert(currentPayload).select().single();
      data = retryRes.data;
      error = retryRes.error;
    } else {
      break;
    }
  }

  if (error) throw new Error(`Supabase Error (upsert rehearsal): ${error.message}`);
  return data;
}

export async function dbDeleteRehearsal(id: string, bandId: string) {
  const sb = getSupabase();
  const cleanId = cleanBandId(bandId);
  const possibleBandIds = Array.from(new Set([bandId, cleanId, `band-${cleanId}`, `reg-${cleanId}`])).filter(Boolean);
  const { error } = await sb.from("rehearsals").delete().eq("id", id).in("band_id", possibleBandIds);
  if (error) throw new Error(`Supabase Error (delete rehearsal): ${error.message}`);
  return true;
}

// --- CONCERTS ---
