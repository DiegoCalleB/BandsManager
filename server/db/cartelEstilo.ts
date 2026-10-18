// ADN visual de la banda para sus carteles (`band_cartel_estilo`). El `bandId` llega YA resuelto por
// la ruta (getTargetBandId) y es el único origen de confianza (AGENTS.md §2.1). Quien llama pasa el
// validador de URLs de la banda: aquí solo se lee y se escribe lo que pasa la lista blanca.

import { getSupabase, cleanBandId } from './core.js';
import { ADN_INICIAL, sanearAdn, type AdnCartel } from '../../src/utils/cartel/adn.js';

/** ADN guardado de la banda (saneado), o el inicial si no hay nada. null solo si falla la BD. */
export async function dbGetAdnCartel(bandId: string, esUrlPermitida: (u: string) => boolean): Promise<AdnCartel | null> {
  const { data, error } = await getSupabase()
    .from('band_cartel_estilo')
    .select('estilo')
    .eq('band_id', cleanBandId(bandId))
    .maybeSingle();
  if (error) {
    console.error('[CartelEstilo DB] Error leyendo el ADN de %s:', bandId, error.message);
    return null;
  }
  return sanearAdn(data?.estilo, esUrlPermitida) ?? ADN_INICIAL;
}

export async function dbGuardarAdnCartel(bandId: string, adn: AdnCartel): Promise<boolean> {
  const sb = getSupabase();
  const banda = cleanBandId(bandId);
  const { data: existe, error: errLeer } = await sb.from('band_cartel_estilo').select('id').eq('band_id', banda).maybeSingle();
  if (errLeer) {
    console.error('[CartelEstilo DB] Error comprobando el ADN de %s:', banda, errLeer.message);
    return false;
  }
  const escritura = existe
    ? await sb.from('band_cartel_estilo').update({ estilo: adn, updated_at: new Date().toISOString() }).eq('band_id', banda)
    : await sb.from('band_cartel_estilo').insert({ band_id: banda, estilo: adn });
  if (escritura.error) {
    console.error('[CartelEstilo DB] Error guardando el ADN de %s:', banda, escritura.error.message);
    return false;
  }
  return true;
}
