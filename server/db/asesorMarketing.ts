// Datos del Asesor de Marketing: la estrategia de la banda (`band_estrategia_marketing`), la fecha
// de su última publicación y lo que hace con cada idea (`asesor_acciones`). El `bandId` llega YA
// resuelto por la ruta (getTargetBandId) y es el único origen de confianza (AGENTS.md §2.1).

import { getSupabase, cleanBandId } from './core.js';
import { escrituraTolerante } from './tolerantWrite.js';
import { sanearEstrategia, type EstrategiaMarketing } from '../../src/utils/asesor/estrategia.js';
import type { Accion, AccionRegistrada } from '../../src/utils/asesor/tipos.js';
import type { Formato } from '../../src/utils/asesor/reglasFormato.js';
import type { ResultadoPieza } from '../../src/utils/asesor/resumen.js';
import { REDES_EXTRA, sanearMetricasRed, type RedExtra, type ResultadoRed } from '../../src/utils/asesor/metricasPorRed.js';

const FORMATOS: unknown[] = ['reel', 'carrusel', 'stories', 'post'];

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

/* ----------------------------------------------------------------- hecho / saltado */

const ACCIONES = 'asesor_acciones';

/** Acciones de la banda desde `desde` (AAAA-MM-DD). [] si falla: aprender es un extra, no bloquea el plan. */
export async function dbAccionesDesde(bandId: string, desde: string): Promise<AccionRegistrada[]> {
  const leer = (columnas: string) => getSupabase().from(ACCIONES).select(columnas).eq('band_id', cleanBandId(bandId)).gte('fecha', desde);
  let { data, error } = await leer('fecha, tarjeta_id, formato, accion, titulo');
  // Sin la migración del título (20261124) se lee igual, solo sin título: aprender no se rompe por eso.
  if (error && /titulo/.test(error.message)) ({ data, error } = await leer('fecha, tarjeta_id, formato, accion'));
  if (error) {
    console.warn('[Asesor DB] Sin historial de %s:', bandId, error.message);
    return [];
  }
  return ((data || []) as unknown as Array<Record<string, unknown>>).flatMap((f) =>
    FORMATOS.includes(f.formato) && (f.accion === 'hecho' || f.accion === 'saltado')
      ? [{ fecha: String(f.fecha).slice(0, 10), tarjetaId: String(f.tarjeta_id), formato: f.formato as Formato, accion: f.accion as Accion, titulo: typeof f.titulo === 'string' ? f.titulo : '' }]
      : []
  );
}

/** Guarda (o cambia) lo que la banda hizo hoy con una idea. `null` la deja pendiente otra vez. */
export async function dbGuardarAccion(bandId: string, fecha: string, tarjetaId: string, formato: Formato, accion: Accion | null, titulo = ''): Promise<boolean> {
  const sb = getSupabase();
  const banda = cleanBandId(bandId);
  const borrado = await sb.from(ACCIONES).delete().eq('band_id', banda).eq('fecha', fecha).eq('tarjeta_id', tarjetaId);
  if (borrado.error) {
    console.error('[Asesor DB] Error limpiando la acción de %s:', banda, borrado.error.message);
    return false;
  }
  if (!accion) return true;
  // `titulo` es una columna nueva: sin su migración se guarda igual, sin título (y queda en el log).
  const { error } = await escrituraTolerante(ACCIONES, { band_id: banda, fecha, tarjeta_id: tarjetaId, formato, accion, titulo }, (p) => sb.from(ACCIONES).insert(p));
  if (error) {
    console.error('[Asesor DB] Error guardando la acción de %s:', banda, error.message);
    return false;
  }
  return true;
}

/* ----------------------------------------------------------------- cómo le fue a cada pieza */

const RESULTADOS = 'asesor_resultados';

/** Resultados anotados desde `desde`. [] si falla (o aún no existe la tabla): el plan sigue sin ellos. */
export async function dbResultadosDesde(bandId: string, desde: string): Promise<ResultadoPieza[]> {
  const { data, error } = await getSupabase()
    .from(RESULTADOS)
    .select('fecha, tarjeta_id, formato, titulo, alcance, guardados, alcance_no_seguidores')
    .eq('band_id', cleanBandId(bandId))
    .gte('fecha', desde);
  if (error) {
    console.warn('[Asesor DB] Sin resultados de %s:', bandId, error.message);
    return [];
  }
  return ((data || []) as unknown as Array<Record<string, unknown>>).flatMap((f) =>
    FORMATOS.includes(f.formato) && Number.isFinite(Number(f.alcance)) && Number.isFinite(Number(f.guardados))
      ? [{
          fecha: String(f.fecha).slice(0, 10), tarjetaId: String(f.tarjeta_id), formato: f.formato as Formato, titulo: String(f.titulo ?? ''),
          alcance: Number(f.alcance), guardados: Number(f.guardados),
          alcanceNoSeguidores: f.alcance_no_seguidores === null || f.alcance_no_seguidores === undefined ? null : Number(f.alcance_no_seguidores),
        }]
      : []
  );
}

/** Guarda (o corrige) los números de una pieza. */
export async function dbGuardarResultado(bandId: string, r: ResultadoPieza): Promise<boolean> {
  const sb = getSupabase();
  const banda = cleanBandId(bandId);
  const borrado = await sb.from(RESULTADOS).delete().eq('band_id', banda).eq('fecha', r.fecha).eq('tarjeta_id', r.tarjetaId);
  if (borrado.error) {
    console.error('[Asesor DB] Error limpiando el resultado de %s:', banda, borrado.error.message);
    return false;
  }
  const { error } = await sb.from(RESULTADOS).insert({
    band_id: banda, fecha: r.fecha, tarjeta_id: r.tarjetaId, formato: r.formato, titulo: r.titulo,
    alcance: r.alcance, guardados: r.guardados, alcance_no_seguidores: r.alcanceNoSeguidores,
  });
  if (error) {
    console.error('[Asesor DB] Error guardando el resultado de %s:', banda, error.message);
    return false;
  }
  return true;
}

/* ----------------------------------------------------------------- resultados en TikTok y YouTube */

const RESULTADOS_RED = 'asesor_resultados_red';

/** Resultados de TikTok y YouTube desde `desde`. [] si falla (o aún no existe la tabla): el plan sigue sin ellos. */
export async function dbResultadosRedDesde(bandId: string, desde: string): Promise<ResultadoRed[]> {
  const { data, error } = await getSupabase()
    .from(RESULTADOS_RED)
    .select('fecha, tarjeta_id, red, formato, titulo, metricas')
    .eq('band_id', cleanBandId(bandId))
    .gte('fecha', desde);
  if (error) {
    console.warn('[Asesor DB] Sin resultados por red de %s:', bandId, error.message);
    return [];
  }
  return ((data || []) as unknown as Array<Record<string, unknown>>).flatMap((f) => {
    // Lo que sale de la BD se vuelve a validar: una fila rara se descarta, no tumba el plan.
    if (!FORMATOS.includes(f.formato) || !REDES_EXTRA.includes(f.red as RedExtra)) return [];
    const metricas = sanearMetricasRed(f.red as RedExtra, f.metricas);
    if (typeof metricas === 'string') return [];
    return [{ fecha: String(f.fecha).slice(0, 10), tarjetaId: String(f.tarjeta_id), red: f.red as RedExtra, formato: f.formato as Formato, titulo: String(f.titulo ?? ''), metricas }];
  });
}

/** Guarda (o corrige) los números de una pieza en una red. */
export async function dbGuardarResultadoRed(bandId: string, r: ResultadoRed): Promise<boolean> {
  const sb = getSupabase();
  const banda = cleanBandId(bandId);
  const borrado = await sb.from(RESULTADOS_RED).delete().eq('band_id', banda).eq('fecha', r.fecha).eq('tarjeta_id', r.tarjetaId).eq('red', r.red);
  if (borrado.error) {
    console.error('[Asesor DB] Error limpiando el resultado por red de %s:', banda, borrado.error.message);
    return false;
  }
  const { error } = await sb.from(RESULTADOS_RED).insert({
    band_id: banda, fecha: r.fecha, tarjeta_id: r.tarjetaId, red: r.red, formato: r.formato, titulo: r.titulo, metricas: r.metricas,
  });
  if (error) {
    console.error('[Asesor DB] Error guardando el resultado por red de %s:', banda, error.message);
    return false;
  }
  return true;
}

