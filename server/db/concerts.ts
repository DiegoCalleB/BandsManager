import { getSupabase, cleanBandId } from "./core.js";
import { ensureRegisteredBandExists } from "./bands.js";

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
    giraNombre: c.gira_nombre || c.giraNombre || undefined,
    idioma: c.idioma || undefined,
    customQrUrl: c.custom_qr_url || c.customQrUrl || undefined,
    entradasUrl: c.entradas_url || c.entradasUrl || undefined,
    entradasLugarFisico: c.entradas_lugar_fisico || c.entradasLugarFisico || undefined
  }));
}

export async function dbUpsertConcert(concert: any, bandId: string) {
  const sb = getSupabase();
  // 'bandId' es el único origen de confianza (lo resuelve la ruta desde la sesión); el
  // objeto de entrada puede traer su propio 'band_id' sin validar desde el cuerpo de la
  // petición y no debe primar (ver el mismo fallo corregido en server/db/campaigns.ts).
  const targetBandId = cleanBandId(bandId);
  await ensureRegisteredBandExists(targetBandId);

  // El upsert es por id (clave primaria): si `concert.id` coincidiera con el de un concierto de
  // OTRA banda, este upsert lo sobrescribiría y se lo reasignaría a la banda del llamador. Un id
  // que no pertenece a la banda del usuario no se reutiliza nunca.
  let finalConcertId = concert.id;
  if (finalConcertId) {
    const existing = await sb.from("concerts").select("band_id").eq("id", finalConcertId).maybeSingle();
    if (existing.data && existing.data.band_id && cleanBandId(existing.data.band_id) !== targetBandId) {
      console.warn(`[dbUpsertConcert] Conflicto de band_id en id ${finalConcertId}. Se generará un id nuevo.`);
      finalConcertId = `cnc-${Date.now()}`;
    }
  }

  const payload: any = {
    id: finalConcertId || `cnc-${Date.now()}`,
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
    gira_nombre: concert.gira_nombre || concert.giraNombre || null,
    idioma: concert.idioma || "",
    custom_qr_url: concert.custom_qr_url || concert.customQrUrl || null,
    entradas_url: concert.entradas_url || concert.entradasUrl || null,
    entradas_lugar_fisico: concert.entradas_lugar_fisico || concert.entradasLugarFisico || null
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
