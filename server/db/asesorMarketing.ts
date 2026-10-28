// Datos del Asesor de Marketing: la estrategia de la banda (`band_estrategia_marketing`) y la fecha
// de su última publicación. El `bandId` llega YA resuelto por la ruta (getTargetBandId) y es el
// único origen de confianza (AGENTS.md §2.1).

import { getSupabase, cleanBandId } from './core.js';
import { sanearEstrategia, type EstrategiaMarketing } from '../../src/utils/asesor/estrategia.js';

/** La estrategia guardada (saneada), null si la banda aún no tiene, o undefined si falla la BD. */
export async function dbGetEstrategiaMarketing(bandId: string): Promise<EstrategiaMarketing | null | undefined> {
  const { data, error } = await getSupabase()
    .from('band_estrategia_marketing')
    .select('estrategia')
    .eq('band_id', cleanBandId(bandId))
    .maybeSingle();
  if (error) {
    console.error('[Asesor DB] Error leyendo la estrategia de %s:', bandId, error.message);
    return undefined;
  }
  return data ? sanearEstrategia(data.estrategia) : null;
}

export async function dbGuardarEstrategiaMarketing(bandId: string, estrategia: EstrategiaMarketing): Promise<boolean> {
  const sb = getSupabase();
  const banda = cleanBandId(bandId);
  const { data: existe, error: errLeer } = await sb.from('band_estrategia_marketing').select('id').eq('band_id', banda).maybeSingle();
  if (errLeer) {
    console.error('[Asesor DB] Error comprobando la estrategia de %s:', banda, errLeer.message);
    return false;
  }
  const escritura = existe
    ? await sb.from('band_estrategia_marketing').update({ estrategia, updated_at: new Date().toISOString() }).eq('band_id', banda)
    : await sb.from('band_estrategia_marketing').insert({ band_id: banda, estrategia });
  if (escritura.error) {
    console.error('[Asesor DB] Error guardando la estrategia de %s:', banda, escritura.error.message);
    return false;
  }
  return true;
}

/** Fecha (AAAA-MM-DD) de la última publicación hecha desde BandManager, o null si no hay ninguna. */
export async function dbUltimaPublicacion(bandId: string): Promise<string | null> {
  const { data, error } = await getSupabase()
    .from('social_posts')
    .select('fecha')
    .eq('band_id', cleanBandId(bandId))
    .eq('estado', 'publicado')
    .order('fecha', { ascending: false })
    .limit(1);
  if (error) {
    console.warn('[Asesor DB] Sin última publicación de %s:', bandId, error.message);
    return null;
  }
  const fecha = data?.[0]?.fecha;
  return typeof fecha === 'string' ? fecha.slice(0, 10) : null;
}
