// Enlaces cortos (`short_links`) y sus clics (`short_link_clicks`). Toda lectura/escritura de una
// banda va acotada por el `bandId` que resuelve la ruta desde la sesión (AGENTS.md §2.1). Las dos
// únicas funciones sin banda (`dbGetEnlacePorCodigo`, `dbRegistrarClic`) son las de la redirección
// pública: parten de un código aleatorio y la banda sale de la fila del enlace, nunca de la petición.

import { getSupabase, cleanBandId } from './core.js';
import {
  claveEnlace,
  generarCodigo,
  MAX_ENLACES_POR_BANDA,
  type CanalEnlace,
  type DestinoEnlace,
} from '../utils/enlacesCortos.js';

export interface EnlaceFila {
  code: string;
  band_id: string;
  concert_id: string | null;
  destino: DestinoEnlace;
  canal: string;
  clave: string;
  created_at?: string;
}

const COLUMNAS_ENLACE = 'code, band_id, concert_id, destino, canal, clave, created_at';
const MAX_INTENTOS_CODIGO = 6;

/** Búsqueda por código (redirección pública). El código es aleatorio y no enumerable. */
export async function dbGetEnlacePorCodigo(code: string): Promise<EnlaceFila | null> {
  const { data, error } = await getSupabase().from('short_links').select(COLUMNAS_ENLACE).eq('code', code).maybeSingle();
  if (error) throw new Error(`Supabase Error (short_links): ${error.message}`);
  return (data as EnlaceFila | null) ?? null;
}

export async function dbListarEnlaces(bandId: string, concertId?: string): Promise<EnlaceFila[]> {
  let query = getSupabase().from('short_links').select(COLUMNAS_ENLACE).eq('band_id', cleanBandId(bandId));
  if (concertId) query = query.eq('concert_id', concertId);
  const { data, error } = await query.order('created_at', { ascending: true }).limit(MAX_ENLACES_POR_BANDA);
  if (error) throw new Error(`Supabase Error (short_links): ${error.message}`);
  return (data || []) as EnlaceFila[];
}

export async function dbContarEnlaces(bandId: string): Promise<number> {
  const { count, error } = await getSupabase()
    .from('short_links')
    .select('code', { count: 'exact', head: true })
    .eq('band_id', cleanBandId(bandId));
  if (error) throw new Error(`Supabase Error (short_links): ${error.message}`);
  return count || 0;
}

export type ResultadoAsegurar =
  | { ok: true; enlace: EnlaceFila; creado: boolean }
  | { ok: false; motivo: 'limite' };

/**
 * Devuelve el enlace de (concierto, destino, canal) de la banda, creándolo si no existe. Es
 * idempotente: pedir dos veces lo mismo devuelve el mismo código (no se reparten dos enlaces
 * distintos para el mismo canal y los clics no se dispersan).
 */
export async function dbAsegurarEnlace(
  bandId: string,
  datos: { concertId?: string | null; destino: DestinoEnlace; canal: CanalEnlace }
): Promise<ResultadoAsegurar> {
  const sb = getSupabase();
  const banda = cleanBandId(bandId);
  const concertId = datos.concertId || null;
  const clave = claveEnlace(concertId, datos.destino, datos.canal);

  const buscar = async (): Promise<EnlaceFila | null> => {
    const { data, error } = await sb
      .from('short_links')
      .select(COLUMNAS_ENLACE)
      .eq('band_id', banda)
      .eq('clave', clave)
      .maybeSingle();
    if (error) throw new Error(`Supabase Error (short_links): ${error.message}`);
    return (data as EnlaceFila | null) ?? null;
  };

  const existente = await buscar();
  if (existente) return { ok: true, enlace: existente, creado: false };

  if ((await dbContarEnlaces(banda)) >= MAX_ENLACES_POR_BANDA) return { ok: false, motivo: 'limite' };

  for (let intento = 0; intento < MAX_INTENTOS_CODIGO; intento++) {
    const fila = { code: generarCodigo(), band_id: banda, concert_id: concertId, destino: datos.destino, canal: datos.canal, clave };
    const { data, error } = await sb.from('short_links').insert(fila).select(COLUMNAS_ENLACE).single();
    if (!error) return { ok: true, enlace: data as EnlaceFila, creado: true };

    // 23505 = clave duplicada. Puede ser el CÓDIGO (colisión, rarísima: se reintenta con otro) o la
    // HUELLA (otra petición creó el mismo enlace a la vez: se devuelve ese).
    if ((error as { code?: string }).code === '23505') {
      const ganador = await buscar();
      if (ganador) return { ok: true, enlace: ganador, creado: false };
      continue;
    }
    throw new Error(`Supabase Error (short_links insert): ${error.message}`);
  }
  throw new Error('No se pudo generar un código de enlace único. Vuelve a intentarlo.');
}

export async function dbBorrarEnlace(code: string, bandId: string): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from('short_links')
    .delete()
    .eq('code', code)
    .eq('band_id', cleanBandId(bandId))
    .select('code');
  if (error) throw new Error(`Supabase Error (short_links delete): ${error.message}`);
  return (data || []).length > 0;
}

/** Registra un clic. `bandId` es el de la FILA del enlace (no de la petición). */
export async function dbRegistrarClic(clic: {
  code: string;
  bandId: string;
  visitante: string;
  dispositivo: string;
  origen: string | null;
}): Promise<void> {
  const { error } = await getSupabase().from('short_link_clicks').insert({
    code: clic.code,
    band_id: cleanBandId(clic.bandId),
    clicked_at: new Date().toISOString(),
    visitante: clic.visitante,
    dispositivo: clic.dispositivo,
    origen: clic.origen,
  });
  if (error) throw new Error(`Supabase Error (short_link_clicks insert): ${error.message}`);
}

/** Tope de filas leídas por consulta: el resumen se calcula en memoria y esto lo mantiene acotado. */
export const MAX_CLICS_LEIDOS = 20_000;

export async function dbClicsDeBanda(bandId: string, desdeIso: string): Promise<Array<{ code: string; clicked_at: string; visitante: string | null }>> {
  const { data, error } = await getSupabase()
    .from('short_link_clicks')
    .select('code, clicked_at, visitante')
    .eq('band_id', cleanBandId(bandId))
    .gte('clicked_at', desdeIso)
    .order('clicked_at', { ascending: false })
    .limit(MAX_CLICS_LEIDOS);
  if (error) throw new Error(`Supabase Error (short_link_clicks): ${error.message}`);
  return (data || []) as Array<{ code: string; clicked_at: string; visitante: string | null }>;
}
