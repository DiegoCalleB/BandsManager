// Enlaces de bandas amigas (`enlaces_bandas_amigas`): lectura por lotes, escritura y borrado.
// Todo se acota por `band_id` de la sesión; los ids de contacto llegan ya validados por el llamador.

import { getSupabase } from "./core.js";
import {
  CambioEnlace,
  EnlacesPorPlataforma,
  PlataformaEnlace,
  planificarSincronizacion,
} from "../utils/enlacesBandas.js";

const TABLA = "enlaces_bandas_amigas";
const TAM_LOTE = 100;

/** band_contact_id → enlaces de esa banda, por plataforma. */
export type EnlacesPorContacto = Map<string, EnlacesPorPlataforma>;

/** Carga los enlaces de varios contactos en lotes (evita URLs e `in` demasiado largos). */
export async function cargarEnlacesDeContactos(contactIds: string[]): Promise<EnlacesPorContacto> {
  const mapa: EnlacesPorContacto = new Map();
  const ids = [...new Set(contactIds.filter(Boolean))];
  const sb = getSupabase();
  for (let i = 0; i < ids.length; i += TAM_LOTE) {
    const { data, error } = await sb
      .from(TABLA)
      .select("band_contact_id, plataforma, url, verificado")
      .in("band_contact_id", ids.slice(i, i + TAM_LOTE));
    if (error) throw new Error(`Supabase Error (${TABLA}): ${error.message}`);
    for (const fila of data || []) {
      const porPlataforma = mapa.get(fila.band_contact_id) || {};
      porPlataforma[fila.plataforma as PlataformaEnlace] = { url: fila.url, verificado: fila.verificado };
      mapa.set(fila.band_contact_id, porPlataforma);
    }
  }
  return mapa;
}

/** Escribe (upsert) o borra (url null) el enlace de una plataforma de una banda. */
export async function guardarEnlace(
  bandContactId: string,
  bandId: string,
  plataforma: PlataformaEnlace,
  url: string | null,
  verificado = false,
): Promise<void> {
  const sb = getSupabase();
  if (!url) {
    const { error } = await sb
      .from(TABLA)
      .delete()
      .eq("band_contact_id", bandContactId)
      .eq("band_id", bandId)
      .eq("plataforma", plataforma);
    if (error) throw new Error(`Supabase Error (delete ${TABLA}): ${error.message}`);
    return;
  }
  const { error } = await sb.from(TABLA).upsert(
    {
      band_contact_id: bandContactId,
      band_id: bandId,
      plataforma,
      url,
      verificado,
      actualizado_at: new Date().toISOString(),
    },
    { onConflict: "band_contact_id,plataforma" },
  );
  if (error) throw new Error(`Supabase Error (upsert ${TABLA}): ${error.message}`);
}

/** Aplica al contacto los campos que el formulario ha enviado (los `undefined` no se tocan). */
export async function sincronizarEnlacesDeContacto(
  bandContactId: string,
  bandId: string,
  valorSpotifyYoutube: string | undefined,
  instagram: string | undefined,
): Promise<void> {
  if (valorSpotifyYoutube === undefined && instagram === undefined) return;
  const actuales = (await cargarEnlacesDeContactos([bandContactId])).get(bandContactId) || {};
  const cambios: CambioEnlace[] = planificarSincronizacion(actuales, valorSpotifyYoutube, instagram);
  for (const c of cambios) {
    await guardarEnlace(bandContactId, bandId, c.plataforma, c.url, c.verificado);
  }
}
