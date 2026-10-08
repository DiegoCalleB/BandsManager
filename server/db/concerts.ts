// Conciertos (`concerts`): lectura, upsert y borrado acotados por `bandId`.

import { escrituraTolerante } from './tolerantWrite.js';
import { getSupabase, cleanBandId } from './core.js';
import { ensureRegisteredBandExists } from './bands.js';
import { mergeWithExisting } from './mergeWithExisting.js';
import { urlHttpSegura } from '../utils/enlacesCortos.js';

// Filas de `concerts` tal como vienen de PostgREST o del cuerpo de una petición: sin tipo estático
// (el contrato columna a columna lo vigila server/audit/__tests__/schemaContract.test.ts).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FilaConcierto = Record<string, any>;

export async function dbGetConcerts(bandId: string | string[]) {
  const sb = getSupabase();
  let query = sb.from('concerts').select('*');
  let allowedIds: string[];

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

  if (error) throw new Error(`Supabase Error (concerts): ${error.message}`);

  // Validation layer: filter out any records that do not belong to the allowed band IDs
  const allowedSet = new Set(allowedIds);
  const validatedData = (data || []).filter(
    (c) => c.band_id && allowedSet.has(cleanBandId(c.band_id))
  );

  return validatedData.map((c) => ({
    ...c,
    setlist_id: c.setlist_id || c.setlistId || null,
    setlistId: c.setlist_id || c.setlistId || undefined,
    gastosDetalle: c.gastos_detalle || c.gastosDetalle || {},
    gastos_detalle: c.gastos_detalle || c.gastosDetalle || {},
    convocatoria_tipo: c.convocatoria_tipo || c.convocatoriaTipo || 'completa',
    convocados_ids: c.convocados_ids || c.convocadosIds || [],
    convocados_nombres: c.convocados_nombres || c.convocadosNombres || [],
    giraId: c.gira_id || c.giraId || undefined,
    giraNombre: c.gira_nombre || c.giraNombre || undefined,
    idioma: c.idioma || undefined,
    customQrUrl: c.custom_qr_url || c.customQrUrl || undefined,
    entradasUrl: c.entradas_url || c.entradasUrl || undefined,
    entradasLugarFisico:
      c.entradas_lugar_fisico || c.entradasLugarFisico || undefined,
    asistencia_propia: Number(c.asistencia_propia ?? c.asistenciaPropia ?? 0),
    asistencia_otras_bandas: Number(
      c.asistencia_otras_bandas ?? c.asistenciaOtrasBandas ?? 0
    ),
    bandas_compartidas: Array.isArray(
      c.bandas_compartidas || c.bandasCompartidas
    )
      ? c.bandas_compartidas || c.bandasCompartidas
      : [],
    post_show_review: String(c.post_show_review || c.postShowReview || ''),
    es_hito_destacado: Boolean(
      c.es_hito_destacado ?? c.esHitoDestacado ?? false
    ),
    cartel_url: c.cartel_url || c.cartelUrl || undefined,
    cartelUrl: c.cartel_url || c.cartelUrl || undefined,
  }));
}

export async function dbUpsertConcert(concert: FilaConcierto, bandId: string) {
  const sb = getSupabase();
  const targetBandId = cleanBandId(bandId);
  await ensureRegisteredBandExists(targetBandId);

  let finalConcertId = concert.id;
  let existingConcert: FilaConcierto | null = null;
  if (finalConcertId) {
    // La fila entera viene en este SELECT: sin fetch previo no hay forma de preservar lo que un
    // guardado parcial no incluye (gastos_detalle, setlist, etc.) — antes se reseteaba en silencio.
    const existing = await sb
      .from('concerts')
      .select('*')
      .eq('id', finalConcertId)
      .maybeSingle();
    if (existing.data) {
      if (
        existing.data.band_id &&
        cleanBandId(existing.data.band_id) !== targetBandId
      ) {
        console.warn(
          `[dbUpsertConcert] Conflicto de band_id en id ${finalConcertId}. Se generará un id nuevo.`
        );
        finalConcertId = `cnc-${Date.now()}`;
      } else {
        existingConcert = existing.data;
      }
    }
  }

  const merged = mergeWithExisting(existingConcert, concert);

  const payload: FilaConcierto = {
    id: finalConcertId || `cnc-${Date.now()}`,
    band_id: targetBandId,
    band_name: merged.band_name || merged.bandName || '',
    fecha: merged.fecha || new Date().toISOString().split('T')[0],
    ciudad: merged.ciudad || '',
    sala: merged.sala || 'Sala',
    direccion: merged.direccion || '',
    cache: Number(merged.cache || 0),
    aforo_vendido: Number(merged.aforo_vendido || merged.aforoVendido || 0),
    aforo_total: Number(merged.aforo_total || merged.aforoTotal || 0),
    contrato_firmado: Boolean(
      merged.contrato_firmado ?? merged.contratoFirmado
    ),
    estado_pago: merged.estado_pago || merged.estadoPago || 'pendiente',
    notas: merged.notas || '',
    tipo: merged.tipo || 'sala',
    setlist_id: merged.setlist_id || merged.setlistId || null,
    gastos_detalle: merged.gastos_detalle || merged.gastosDetalle || {},
    gastos_estimados_tipicos: Number(
      merged.gastos_estimados_tipicos || merged.gastosEstimadosTipicos || 0
    ),
    convocatoria_tipo:
      merged.convocatoria_tipo || merged.convocatoriaTipo || 'completa',
    convocados_ids: merged.convocados_ids || merged.convocadosIds || [],
    convocados_nombres:
      merged.convocados_nombres || merged.convocadosNombres || [],
    gira_id: merged.gira_id || merged.giraId || null,
    gira_nombre: merged.gira_nombre || merged.giraNombre || null,
    idioma: merged.idioma || '',
    is_posible: Boolean(merged.is_posible ?? merged.isPosible),
    custom_qr_url: merged.custom_qr_url || merged.customQrUrl || null,
    // Se pinta como href en páginas públicas: solo http(s); «javascript:...» se guarda como null.
    entradas_url: urlHttpSegura(merged.entradas_url || merged.entradasUrl),
    entradas_lugar_fisico:
      merged.entradas_lugar_fisico || merged.entradasLugarFisico || null,
    asistencia_propia: Number(
      merged.asistencia_propia ?? merged.asistenciaPropia ?? 0
    ),
    asistencia_otras_bandas: Number(
      merged.asistencia_otras_bandas ?? merged.asistenciaOtrasBandas ?? 0
    ),
    bandas_compartidas: Array.isArray(
      merged.bandas_compartidas || merged.bandasCompartidas
    )
      ? merged.bandas_compartidas || merged.bandasCompartidas
      : [],
    post_show_review: merged.post_show_review || merged.postShowReview || '',
    es_hito_destacado: Boolean(
      merged.es_hito_destacado ?? merged.esHitoDestacado
    ),
    cartel_url: merged.cartel_url || merged.cartelUrl || null,
  };

  const currentPayload: FilaConcierto = { ...payload };
  // Solo se quita la columna exacta que la BD dice no tener (antes caían gira_id, gira_nombre e
  // idioma juntos) y el aviso de guardado parcial deja constancia (ver server/db/tolerantWrite.ts).
  const res = await escrituraTolerante('concerts', currentPayload, (p) =>
    sb.from('concerts').upsert(p).select().single()
  );
  const { data, error } = res;

  if (error)
    throw new Error(`Supabase Error (upsert concert): ${error.message}`);
  return {
    ...data,
    giraId: concert.giraId || concert.gira_id,
    giraNombre: concert.giraNombre || concert.gira_nombre,
    idioma: data?.idioma || concert.idioma,
    is_posible:
      data?.is_posible ?? concert.is_posible ?? concert.isPosible ?? false,
    entradasUrl: data?.entradas_url || concert.entradasUrl,
    entradasLugarFisico:
      data?.entradas_lugar_fisico || concert.entradasLugarFisico,
  };
}

export async function dbDeleteConcert(id: string, bandId: string) {
  const sb = getSupabase();
  const cleanId = cleanBandId(bandId);
  const possibleBandIds = Array.from(
    new Set([bandId, cleanId, `band-${cleanId}`, `reg-${cleanId}`])
  ).filter(Boolean);
  const { error } = await sb
    .from('concerts')
    .delete()
    .eq('id', id)
    .in('band_id', possibleBandIds);
  if (error)
    throw new Error(`Supabase Error (delete concert): ${error.message}`);
  return true;
}

// --- SONGS ---

/**
 * Un concierto de UNA banda por id (para validar que pertenece a la banda de la sesión o a la del
 * enlace). El filtro por `band_id` va en la propia consulta: un id ajeno devuelve null.
 */
export async function dbGetConcertDeBanda(id: string, bandId: string): Promise<FilaConcierto | null> {
  const { data, error } = await getSupabase()
    .from('concerts')
    .select('*')
    .eq('id', id)
    .eq('band_id', cleanBandId(bandId))
    .maybeSingle();
  if (error) throw new Error(`Supabase Error (concert): ${error.message}`);
  return data ?? null;
}

/**
 * Concierto por id SIN banda: solo para las páginas públicas (/e/...), que parten de una URL y
 * sacan la banda de la propia fila. Quien llama debe filtrar los campos que expone
 * (`esConciertoPublicable` + lista blanca): la fila trae caché, notas y datos de contrato.
 */
export async function dbGetConcertPublicoPorId(id: string): Promise<FilaConcierto | null> {
  const { data, error } = await getSupabase().from('concerts').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Supabase Error (concert): ${error.message}`);
  return data ?? null;
}

/** Próximos conciertos de todas las bandas, para el sitemap (con tope de filas). */
export async function dbGetConciertosFuturosParaSitemap(desdeFecha: string, limite = 5000): Promise<FilaConcierto[]> {
  const { data, error } = await getSupabase()
    .from('concerts')
    .select('*') // incluye is_posible, que ningún SQL del repo declara todavía (ver esConciertoPublicable)
    .gte('fecha', desdeFecha)
    .order('fecha', { ascending: true })
    .limit(limite);
  if (error) throw new Error(`Supabase Error (concerts sitemap): ${error.message}`);
  return data || [];
}
