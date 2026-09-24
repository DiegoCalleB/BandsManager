import { getSupabase, cleanBandId } from "./core.js";
import { ensureRegisteredBandExists } from "./bands.js";

export async function dbGetConcerts(bandId: string | string[]) {
  const sb = getSupabase();
  let query = sb.from("concerts").select("*");
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

  if (error) throw new Error(`Supabase Error (concerts): ${error.message}`);
  
  // Validation layer: filter out any records that do not belong to the allowed band IDs
  const allowedSet = new Set(allowedIds);
  const validatedData = (data || []).filter(c => c.band_id && allowedSet.has(cleanBandId(c.band_id)));

  return validatedData.map(c => ({
    ...c,
    setlist_id: c.setlist_id || c.setlistId || null,
    setlistId: c.setlist_id || c.setlistId || undefined,
    gastosDetalle: c.gastos_detalle || c.gastosDetalle || {},
    gastos_detalle: c.gastos_detalle || c.gastosDetalle || {},
    convocatoria_tipo: c.convocatoria_tipo || c.convocatoriaTipo || "completa",
    convocados_ids: c.convocados_ids || c.convocadosIds || [],
    convocados_nombres: c.convocados_nombres || c.convocadosNombres || [],
    giraId: c.gira_id || c.giraId || undefined,
    giraNombre: c.gira_nombre || c.giraNombre || undefined,
    idioma: c.idioma || undefined,
    customQrUrl: c.custom_qr_url || c.customQrUrl || undefined,
    entradasUrl: c.entradas_url || c.entradasUrl || undefined,
    entradasLugarFisico: c.entradas_lugar_fisico || c.entradasLugarFisico || undefined,
    asistencia_propia: Number(c.asistencia_propia ?? c.asistenciaPropia ?? 0),
    asistencia_otras_bandas: Number(c.asistencia_otras_bandas ?? c.asistenciaOtrasBandas ?? 0),
    bandas_compartidas: Array.isArray(c.bandas_compartidas || c.bandasCompartidas) ? (c.bandas_compartidas || c.bandasCompartidas) : [],
    post_show_review: String(c.post_show_review || c.postShowReview || ""),
    es_hito_destacado: Boolean(c.es_hito_destacado ?? c.esHitoDestacado ?? false),
    cartel_url: c.cartel_url || c.cartelUrl || undefined,
    cartelUrl: c.cartel_url || c.cartelUrl || undefined
  }));
}

export async function dbUpsertConcert(concert: any, bandId: string) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(bandId);
  await ensureRegisteredBandExists(targetBandId);

  let finalConcertId = concert.id;
  let existingConcert: any = null;
  if (finalConcertId) {
    const existing = await sb.from("concerts").select("*").eq("id", finalConcertId).maybeSingle();
    if (existing.data) {
      if (existing.data.band_id && cleanBandId(existing.data.band_id) !== targetBandId) {
        console.warn(`[dbUpsertConcert] Conflicto de band_id en id ${finalConcertId}. Se generará un id nuevo.`);
        finalConcertId = `cnc-${Date.now()}`;
      } else {
        existingConcert = existing.data;
      }
    }
  }

  const merged = { ...(existingConcert || {}), ...concert };

  const payload: any = {
    id: finalConcertId || `cnc-${Date.now()}`,
    band_id: targetBandId,
    band_name: merged.band_name || merged.bandName || "",
    fecha: merged.fecha || new Date().toISOString().split("T")[0],
    ciudad: merged.ciudad || "",
    sala: merged.sala || "Sala",
    direccion: merged.direccion || "",
    cache: Number(merged.cache || 0),
    aforo_vendido: Number(merged.aforo_vendido || merged.aforoVendido || 0),
    aforo_total: Number(merged.aforo_total || merged.aforoTotal || 0),
    contrato_firmado: Boolean(merged.contrato_firmado ?? merged.contratoFirmado),
    estado_pago: merged.estado_pago || merged.estadoPago || "pendiente",
    notas: merged.notas || "",
    tipo: merged.tipo || "sala",
    setlist_id: merged.setlist_id || merged.setlistId || null,
    gastos_detalle: merged.gastos_detalle || merged.gastosDetalle || {},
    gastos_estimados_tipicos: Number(merged.gastos_estimados_tipicos || merged.gastosEstimadosTipicos || 0),
    convocatoria_tipo: merged.convocatoria_tipo || merged.convocatoriaTipo || "completa",
    convocados_ids: merged.convocados_ids || merged.convocadosIds || [],
    convocados_nombres: merged.convocados_nombres || merged.convocadosNombres || [],
    gira_id: merged.gira_id || merged.giraId || null,
    gira_nombre: merged.gira_nombre || merged.giraNombre || null,
    idioma: merged.idioma || "",
    is_posible: Boolean(merged.is_posible ?? merged.isPosible),
    custom_qr_url: merged.custom_qr_url || merged.customQrUrl || null,
    entradas_url: merged.entradas_url || merged.entradasUrl || null,
    entradas_lugar_fisico: merged.entradas_lugar_fisico || merged.entradasLugarFisico || null,
    asistencia_propia: Number(merged.asistencia_propia ?? merged.asistenciaPropia ?? 0),
    asistencia_otras_bandas: Number(merged.asistencia_otras_bandas ?? merged.asistenciaOtrasBandas ?? 0),
    bandas_compartidas: Array.isArray(merged.bandas_compartidas || merged.bandasCompartidas) ? (merged.bandas_compartidas || merged.bandasCompartidas) : [],
    post_show_review: merged.post_show_review || merged.postShowReview || "",
    es_hito_destacado: Boolean(merged.es_hito_destacado ?? merged.esHitoDestacado),
    cartel_url: merged.cartel_url || merged.cartelUrl || null
  };

  let data: any = null;
  let error: any = null;

  const currentPayload: Record<string, any> = { ...payload };
  const res = await sb.from("concerts").upsert(currentPayload).select().single();
  data = res.data;
  error = res.error;

  // Antes esto borraba gira_id, gira_nombre E idioma juntos ante CUALQUIER error que mencionara
  // a alguno de los tres, aunque solo faltara uno: si a Supabase le faltaba la columna gira_id,
  // idioma se descartaba también con ella y esa banda se quedaba sin poder guardar nunca su
  // idioma, aunque su columna sí existiera. Ahora se quita solo la columna exacta que Supabase
  // dice que no encuentra, y se reintenta; así un campo con columna real nunca paga por otro que
  // aún no la tiene.
  while (error && error.message && error.message.includes("Could not find the '") && error.message.includes("' column of 'concerts'")) {
    const match = error.message.match(/Could not find the '([^']+)' column of 'concerts'/);
    if (match && match[1] && currentPayload[match[1]] !== undefined) {
      const missingCol = match[1];
      console.warn(`[Concerts] Columna '${missingCol}' no encontrada en Supabase concerts. Reintentando sin ella. Ejecuta la migración SQL.`);
      delete currentPayload[missingCol];
      const retryRes = await sb.from("concerts").upsert(currentPayload).select().single();
      data = retryRes.data;
      error = retryRes.error;
    } else {
      break;
    }
  }

  if (error) throw new Error(`Supabase Error (upsert concert): ${error.message}`);
  return {
    ...data,
    giraId: concert.giraId || concert.gira_id,
    giraNombre: concert.giraNombre || concert.gira_nombre,
    idioma: data?.idioma || concert.idioma,
    is_posible: data?.is_posible ?? concert.is_posible ?? concert.isPosible ?? false,
    entradasUrl: data?.entradas_url || concert.entradasUrl,
    entradasLugarFisico: data?.entradas_lugar_fisico || concert.entradasLugarFisico
  };
}

export async function dbDeleteConcert(id: string, bandId: string) {
  const sb = getSupabase();
  const cleanId = cleanBandId(bandId);
  const possibleBandIds = Array.from(new Set([bandId, cleanId, `band-${cleanId}`, `reg-${cleanId}`])).filter(Boolean);
  const { error } = await sb.from("concerts").delete().eq("id", id).in("band_id", possibleBandIds);
  if (error) throw new Error(`Supabase Error (delete concert): ${error.message}`);
  return true;
}

// --- SONGS ---
