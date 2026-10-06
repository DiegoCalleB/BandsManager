// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

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
    tipo_evento: r.tipo_evento || r.tipoEvento || 'ensayo',
    asunto: r.asunto || '',
    enlace_reunion: r.enlace_reunion || r.enlaceReunion || '',
    horaFin: r.hora_fin || r.horaFin || undefined,
    asistentes: r.asistentes || [],
    convocados_ids: r.convocados_ids || [],
    convocados_nombres: r.convocados_nombres || [],
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
  let finalRehearsalId = rehearsal.id;
  if (finalRehearsalId) {
    const { data: existing } = await sb.from("rehearsals").select("id, band_id").eq("id", finalRehearsalId).maybeSingle();
    if (existing && existing.band_id !== targetBandId) {
      finalRehearsalId = `reh-${Date.now()}`;
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
    asistentes: rehearsal.asistentes || [],
    notas: rehearsal.notas || "",
    estado: rehearsal.estado || "programado",
    setlist_id: rehearsal.setlist_id || rehearsal.setlistId || null,
    convocatoria_tipo: rehearsal.convocatoria_tipo || rehearsal.convocatoriaTipo || "completa",
    convocados_ids: rehearsal.convocados_ids || rehearsal.convocadosIds || [],
    convocados_nombres: rehearsal.convocados_nombres || rehearsal.convocadosNombres || [],
    agenda: rehearsal.agenda || [],
    objetivos: rehearsal.objetivos || [],
    duracion_estimada_min: rehearsal.duracion_estimada_min ?? rehearsal.duracionEstimadaMin ?? 0,
    duracion_real_seg: rehearsal.duracion_real_seg ?? rehearsal.duracionRealSeg ?? 0,
    cronometro_estado: rehearsal.cronometro_estado || rehearsal.cronometroEstado || {},
    acta: rehearsal.acta || {},
    grabaciones: rehearsal.grabaciones || [],
    rating_general: rehearsal.rating_general ?? rehearsal.ratingGeneral ?? null,
    temperatura_local: rehearsal.temperatura_local || rehearsal.temperaturaLocal || null
  };

  const currentPayload: Record<string, any> = { ...payload };
  let res = await sb.from("rehearsals").upsert(currentPayload).select().single();
  let data = res.data;
  let error = res.error;

  while (error && error.message && error.message.includes("Could not find the '") && error.message.includes("' column of 'rehearsals'")) {
    const match = error.message.match(/Could not find the '([^']+)' column of 'rehearsals'/);
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
