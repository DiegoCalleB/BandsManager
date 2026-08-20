import { getSupabase, cleanBandId } from "./core.js";

export async function dbGetConcerts(bandId: string | string[]) {
  const sb = getSupabase();
  let query = sb.from("concerts").select("*");
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

  if (error) throw new Error(`Supabase Error (concerts): ${error.message}`);
  return (data || []).map(c => ({
    ...c,
    gastosDetalle: c.gastos_detalle || c.gastosDetalle || {},
    gastos_detalle: c.gastos_detalle || c.gastosDetalle || {},
    convocatoria_tipo: c.convocatoria_tipo || c.convocatoriaTipo || "completa",
    convocados_ids: c.convocados_ids || c.convocadosIds || [],
    convocados_nombres: c.convocados_nombres || c.convocadosNombres || [],
    giraId: c.gira_id || c.giraId || undefined,
    giraNombre: c.gira_nombre || c.giraNombre || undefined
  }));
}

export async function dbUpsertConcert(concert: any, bandId: string) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(concert.band_id || bandId);
  await ensureRegisteredBandExists(targetBandId);

  const payload: any = {
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
    convocados_nombres: concert.convocados_nombres || concert.convocadosNombres || [],
    gira_id: concert.gira_id || concert.giraId || null,
    gira_nombre: concert.gira_nombre || concert.giraNombre || null
  };

  let { data, error } = await sb.from("concerts").upsert(payload).select().single();
  if (error && (error.message.includes("gira_id") || error.message.includes("gira_nombre"))) {
    const fallback = { ...payload };
    delete fallback.gira_id;
    delete fallback.gira_nombre;
    const retry = await sb.from("concerts").upsert(fallback).select().single();
    if (retry.error) throw new Error(`Supabase Error (upsert concert): ${retry.error.message}`);
    data = retry.data;
    error = null;
  } else if (error) {
    throw new Error(`Supabase Error (upsert concert): ${error.message}`);
  }
  return {
    ...data,
    giraId: concert.giraId || concert.gira_id,
    giraNombre: concert.giraNombre || concert.gira_nombre
  };
}

export async function dbDeleteConcert(id: string, bandId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("concerts").delete().eq("id", id).eq("band_id", cleanBandId(bandId));
  if (error) throw new Error(`Supabase Error (delete concert): ${error.message}`);
  return true;
}

// --- SONGS ---
