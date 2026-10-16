// Interesados de la landing oficial en la lista de espera (`musicians_waitlist`): alta con doble
// confirmación y baja. Es una tabla de la plataforma, sin `band_id`: no hay datos de ninguna banda.
// Las filas de la lista de espera de músicos anteriores no tienen `confirmado_at`, así que nunca se les escribe.

import crypto from 'node:crypto';
import { getSupabase } from './core.js';

export interface Interesado {
  id: string;
  email: string;
  idioma: string;
  confirmado_at: string | null;
  baja_at: string | null;
}

/**
 * Registra (o recupera) al interesado por email. Pedir el alta dos veces no duplica la fila ni pisa
 * una confirmación o una baja ya hechas.
 */
export async function dbAltaInteresado(email: string, idioma: string, origen: string): Promise<Interesado & { nuevo: boolean }> {
  const sb = getSupabase();
  const { data: existente, error: errLeer } = await sb
    .from('musicians_waitlist')
    .select('id, email, idioma, confirmado_at, baja_at')
    .eq('email', email)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (errLeer) throw new Error(`Supabase Error (musicians_waitlist): ${errLeer.message}`);
  if (existente) return { ...(existente as Interesado), nuevo: false };

  const fila = { id: `interesado-${crypto.randomUUID()}`, email, idioma, origen, consentimiento_at: new Date().toISOString() };
  const { data, error } = await sb
    .from('musicians_waitlist')
    .insert(fila)
    .select('id, email, idioma, confirmado_at, baja_at')
    .single();
  if (error) throw new Error(`Supabase Error (musicians_waitlist): ${error.message}`);
  return { ...(data as Interesado), nuevo: true };
}

export async function dbGetInteresado(id: string): Promise<Interesado | null> {
  const { data, error } = await getSupabase()
    .from('musicians_waitlist')
    .select('id, email, idioma, confirmado_at, baja_at')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`Supabase Error (musicians_waitlist): ${error.message}`);
  return (data as Interesado | null) ?? null;
}

/** Marca la confirmación (solo la primera vez) y devuelve si acaba de confirmarse ahora. */
export async function dbConfirmarInteresado(id: string): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from('musicians_waitlist')
    .update({ confirmado_at: new Date().toISOString(), baja_at: null })
    .eq('id', id)
    .is('confirmado_at', null)
    .select('id');
  if (error) throw new Error(`Supabase Error (musicians_waitlist): ${error.message}`);
  return (data?.length ?? 0) > 0;
}

export async function dbBajaInteresado(id: string): Promise<void> {
  const { error } = await getSupabase()
    .from('musicians_waitlist')
    .update({ baja_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(`Supabase Error (musicians_waitlist): ${error.message}`);
}

export interface FilaContactoEmpresa {
  empresa: string;
  email: string;
  tipo: string;
  mensaje: string;
  idioma: string;
}

/**
 * Guarda una consulta de empresa (planes B2B) en la lista de espera con `origen = 'b2b'`. Es un contacto
 * que nos escribe a nosotros: no se marca como confirmado, así que no entra en la lista de novedades.
 */
export async function dbAltaContactoEmpresa(c: FilaContactoEmpresa): Promise<void> {
  const { error } = await getSupabase().from('musicians_waitlist').insert({
    id: `b2b-${crypto.randomUUID()}`,
    nombre_banda: c.empresa,
    email: c.email,
    interes_principal: c.tipo,
    notas: c.mensaje,
    idioma: c.idioma,
    origen: 'b2b',
    consentimiento_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Supabase Error (musicians_waitlist b2b): ${error.message}`);
}
