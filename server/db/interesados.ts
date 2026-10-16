// Interesados de la landing oficial (`landing_interesados`): alta con doble confirmación y baja.
// Es una tabla de la plataforma, sin `band_id`: no hay datos de ninguna banda.

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
export async function dbAltaInteresado(email: string, idioma: string, origen: string): Promise<Interesado> {
  const sb = getSupabase();
  const { data: existente, error: errLeer } = await sb
    .from('landing_interesados')
    .select('id, email, idioma, confirmado_at, baja_at')
    .eq('email', email)
    .maybeSingle();
  if (errLeer) throw new Error(`Supabase Error (landing_interesados): ${errLeer.message}`);
  if (existente) return existente as Interesado;

  const fila = { id: crypto.randomUUID(), email, idioma, origen };
  const { data, error } = await sb
    .from('landing_interesados')
    .insert(fila)
    .select('id, email, idioma, confirmado_at, baja_at')
    .single();
  if (error) throw new Error(`Supabase Error (landing_interesados): ${error.message}`);
  return data as Interesado;
}

export async function dbGetInteresado(id: string): Promise<Interesado | null> {
  const { data, error } = await getSupabase()
    .from('landing_interesados')
    .select('id, email, idioma, confirmado_at, baja_at')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`Supabase Error (landing_interesados): ${error.message}`);
  return (data as Interesado | null) ?? null;
}

/** Marca la confirmación (solo la primera vez) y devuelve si acaba de confirmarse ahora. */
export async function dbConfirmarInteresado(id: string): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from('landing_interesados')
    .update({ confirmado_at: new Date().toISOString(), baja_at: null })
    .eq('id', id)
    .is('confirmado_at', null)
    .select('id');
  if (error) throw new Error(`Supabase Error (landing_interesados): ${error.message}`);
  return (data?.length ?? 0) > 0;
}

export async function dbBajaInteresado(id: string): Promise<void> {
  const { error } = await getSupabase()
    .from('landing_interesados')
    .update({ baja_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(`Supabase Error (landing_interesados): ${error.message}`);
}
