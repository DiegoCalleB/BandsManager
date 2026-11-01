// Asesor de Marketing: trae de Instagram los números de una pieza publicada a mano. Con el token
// de la propia banda (credencialesInstagram), nunca uno global. Solo LEE: lo que devuelve rellena
// el formulario de resultados y la banda lo revisa antes de guardar.
// PENDIENTE: validar los nombres de las métricas con una cuenta real (como instagramInsights.ts).

import { dbAccionesDesde } from '../db/asesorMarketing.js';
import { credencialesInstagram } from './credencialesInstagram.js';
import { hostGraphPara, type CredencialesInstagram } from './publicadores/instagramReels.js';
import { hoyIso } from '../utils/paginaConcierto.js';
import { sumarDias } from '../../src/utils/campanaConcierto.js';
import { DIAS_APRENDIZAJE } from '../../src/utils/asesor/opciones.js';
import { candidatos, esIdMedio, sanearMedios, type MedioInstagram } from '../../src/utils/asesor/instagramMedios.js';
import type { Medidas } from '../../src/utils/asesor/resumen.js';

const VERSION_GRAPH = 'v21.0';
const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;
/** Las publicaciones recientes bastan: se miden a las 48 h y como mucho a los 14 días. */
const MEDIOS_A_PEDIR = 50;

export type Peticion = (url: string) => Promise<{ ok: boolean; cuerpo: unknown }>;
export const peticionReal: Peticion = async (url) => {
  const res = await fetch(url);
  return { ok: res.ok, cuerpo: await res.json().catch(() => ({})) };
};

const mensajeDe = (cuerpo: unknown) => String((cuerpo as { error?: { message?: unknown } })?.error?.message || 'error desconocido').slice(0, 200);

async function listarMedios(cred: CredencialesInstagram, pedir: Peticion): Promise<MedioInstagram[]> {
  const campos = 'id,caption,media_product_type,media_type,permalink,timestamp';
  const url = `${hostGraphPara(cred.token)}/${VERSION_GRAPH}/${encodeURIComponent(cred.igUserId)}/media?fields=${campos}&limit=${MEDIOS_A_PEDIR}&access_token=${encodeURIComponent(cred.token)}`;
  const r = await pedir(url);
  if (!r.ok || (r.cuerpo as { error?: unknown })?.error) throw new Error(`Instagram no devolvió las publicaciones: ${mensajeDe(r.cuerpo)}`);
  return sanearMedios(r.cuerpo);
}

export type ResultadoMedios = { estado: 'ok'; medios: MedioInstagram[] } | { estado: 'sin_instagram' } | { estado: 'no_existe' } | { estado: 'error'; motivo: string };

/** Las publicaciones de la cuenta que pueden ser la pieza que la banda marcó como hecha ese día. */
export async function mediosDeLaPieza(bandId: string, fecha: unknown, tarjetaId: unknown, ahora = new Date(), pedir: Peticion = peticionReal): Promise<ResultadoMedios> {
  if (typeof fecha !== 'string' || !FECHA_ISO.test(fecha) || typeof tarjetaId !== 'string') return { estado: 'no_existe' };
  const acciones = await dbAccionesDesde(bandId, sumarDias(hoyIso(ahora), -DIAS_APRENDIZAJE));
  const hecha = acciones.find((a) => a.accion === 'hecho' && a.fecha === fecha && a.tarjetaId === tarjetaId);
  if (!hecha) return { estado: 'no_existe' };
  const cred = await credencialesInstagram(bandId);
  if (!cred) return { estado: 'sin_instagram' };
  try {
    return { estado: 'ok', medios: candidatos({ fecha, formato: hecha.formato }, await listarMedios(cred, pedir)) };
  } catch (e) {
    return { estado: 'error', motivo: (e as Error).message };
  }
}

/** Pura: de la respuesta de insights a los números. Lo que no venga queda en null, nunca en 0. */
export function medidasDeInsights(principal: unknown, porSeguidor: unknown): { alcance: number | null; guardados: number | null; alcanceNoSeguidores: number | null } {
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v) : null);
  interface Metrica {
    name?: string;
    values?: Array<{ value?: unknown }>;
    total_value?: { value?: unknown; breakdowns?: Array<{ results?: Array<{ dimension_values?: unknown[]; value?: unknown }> }> };
  }
  const data = (r: unknown) => (r as { data?: Metrica[] })?.data ?? [];
  const valor = (nombre: string) => {
    const m = data(principal).find((d) => d.name === nombre);
    return num(m?.values?.[0]?.value ?? m?.total_value?.value);
  };
  const resultados = data(porSeguidor).find((d) => d.name === 'reach')?.total_value?.breakdowns?.[0]?.results;
  const noSeguidores = Array.isArray(resultados) ? resultados.find((x) => x?.dimension_values?.[0] === 'NON_FOLLOWER') : undefined;
  return { alcance: valor('reach'), guardados: valor('saved'), alcanceNoSeguidores: num(noSeguidores?.value) };
}

export type ResultadoMedidas = { estado: 'ok'; medidas: Partial<Medidas> & { alcance: number } } | { estado: 'sin_instagram' } | { estado: 'no_existe' } | { estado: 'error'; motivo: string };

/**
 * Los números de UNA publicación. Solo se lee si está entre las recientes de la propia cuenta:
 * el cliente no puede pedir insights de un id cualquiera. «No seguidores» es opcional y, si Meta
 * no lo da para ese tipo de publicación, se deja vacío en vez de fallar.
 */
export async function medidasDeMedio(bandId: string, medioId: unknown, pedir: Peticion = peticionReal): Promise<ResultadoMedidas> {
  if (!esIdMedio(medioId)) return { estado: 'no_existe' };
  const cred = await credencialesInstagram(bandId);
  if (!cred) return { estado: 'sin_instagram' };
  try {
    if (!(await listarMedios(cred, pedir)).some((m) => m.id === medioId)) return { estado: 'no_existe' };
    const base = `${hostGraphPara(cred.token)}/${VERSION_GRAPH}/${encodeURIComponent(medioId)}/insights`;
    const acceso = `access_token=${encodeURIComponent(cred.token)}`;
    const principal = await pedir(`${base}?metric=reach,saved&${acceso}`);
    if (!principal.ok || (principal.cuerpo as { error?: unknown })?.error) throw new Error(`Instagram no devolvió las métricas: ${mensajeDe(principal.cuerpo)}`);
    const seguidores = await pedir(`${base}?metric=reach&breakdown=follow_type&metric_type=total_value&${acceso}`).catch(() => ({ ok: false, cuerpo: {} }));
    const m = medidasDeInsights(principal.cuerpo, seguidores.ok ? seguidores.cuerpo : {});
    if (m.alcance === null) throw new Error('Instagram no ha dado todavía el alcance de esta publicación.');
    return { estado: 'ok', medidas: { alcance: m.alcance, ...(m.guardados !== null && { guardados: m.guardados }), ...(m.alcanceNoSeguidores !== null && { alcanceNoSeguidores: m.alcanceNoSeguidores }) } };
  } catch (e) {
    return { estado: 'error', motivo: (e as Error).message };
  }
}
