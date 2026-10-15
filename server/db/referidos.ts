// Referidos entre bandas sobre `registered_bands` (ref_code, referido_por, referido_en).
// Lo que ve una banda de las que ha invitado es SOLO un número: nombres, planes o fechas de otra
// banda no se enseñan a nadie (AGENTS.md §2.1).

import crypto from 'node:crypto';
import { getSupabase, cleanBandId } from './core.js';
import { generarCodigoReferido, normalizarCodigoReferido } from '../utils/referidos.js';

const MAX_INTENTOS = 6;

/** Fila de `registered_bands` con lo que leen las superficies públicas (el resto de columnas, sin tipar). */
export interface FilaBanda {
  band_id: string;
  nombre_banda?: string | null;
  plan?: string | null;
  ref_code?: string | null;
  logo_url?: string | null;
  imagen_url?: string | null;
  [columna: string]: unknown;
}

/** En `registered_bands` conviven `band-x`, `reg-x` y `x` (ver el EPK público). */
export function variantesBandId(bandId: string): string[] {
  const limpio = cleanBandId(bandId);
  const sinPrefijo = limpio.replace(/^(band|reg)-/, '');
  return Array.from(new Set([limpio, sinPrefijo, `band-${sinPrefijo}`, `reg-${sinPrefijo}`]));
}

/** Fila de la banda registrada (para el perfil público: nombre, logo, plan, código). */
export async function dbGetBandaRegistrada(bandId: string): Promise<FilaBanda | null> {
  const { data, error } = await getSupabase()
    .from('registered_bands')
    .select('*')
    .in('band_id', variantesBandId(bandId))
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Supabase Error (registered_bands): ${error.message}`);
  return (data as FilaBanda | null) ?? null;
}

/**
 * Código de invitación de la banda; si aún no tiene, se le crea. Lo normal es que ya lo tenga (la
 * migración se lo da a las existentes), esto cubre las altas nuevas.
 */
export async function dbAsegurarRefCode(bandId: string): Promise<string | null> {
  const sb = getSupabase();
  const fila = await dbGetBandaRegistrada(bandId);
  if (!fila) return null;
  const actual = normalizarCodigoReferido(fila.ref_code);
  if (actual) return actual;

  for (let intento = 0; intento < MAX_INTENTOS; intento++) {
    const codigo = generarCodigoReferido((n) => crypto.randomBytes(n));
    const { error } = await sb
      .from('registered_bands')
      .update({ ref_code: codigo })
      .eq('band_id', fila.band_id)
      .is('ref_code', null);
    if (!error) {
      // Otra petición pudo ganar la carrera: se devuelve lo que quedó guardado.
      const releida = await dbGetBandaRegistrada(bandId);
      return normalizarCodigoReferido(releida?.ref_code);
    }
    if ((error as { code?: string }).code === '23505') continue; // código ya usado por otra banda: se prueba otro
    throw new Error(`Supabase Error (ref_code): ${error.message}`);
  }
  return null;
}

/** band_id de la banda dueña de un código. Búsqueda sin sesión (alta nueva): solo devuelve el id. */
export async function dbBandaPorRefCode(codigo: string): Promise<string | null> {
  const limpio = normalizarCodigoReferido(codigo);
  if (!limpio) return null;
  const { data, error } = await getSupabase()
    .from('registered_bands')
    .select('band_id')
    .eq('ref_code', limpio)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Supabase Error (registered_bands ref_code): ${error.message}`);
  return data?.band_id ?? null;
}

/**
 * Atribuye una banda nueva a la que la invitó. `.is('referido_por', null)` hace que la PRIMERA
 * atribución sea la definitiva aunque lleguen dos peticiones a la vez. Devuelve si se escribió.
 */
export async function dbRegistrarReferido(bandaNueva: string, bandaReferente: string): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from('registered_bands')
    .update({ referido_por: cleanBandId(bandaReferente), referido_en: new Date().toISOString() })
    .in('band_id', variantesBandId(bandaNueva))
    .is('referido_por', null)
    .select('band_id');
  if (error) throw new Error(`Supabase Error (referido): ${error.message}`);
  return (data || []).length > 0;
}

/** Cuántas bandas ha invitado esta (solo el número). */
export async function dbContarReferidos(bandId: string): Promise<number> {
  const { count, error } = await getSupabase()
    .from('registered_bands')
    .select('band_id', { count: 'exact', head: true })
    .in('referido_por', variantesBandId(bandId));
  if (error) throw new Error(`Supabase Error (referidos): ${error.message}`);
  return count || 0;
}
