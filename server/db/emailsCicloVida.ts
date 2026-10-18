// Acceso a datos de los emails de ciclo de vida (onboarding). Ver server/utils/emailsCicloVida.ts.
import { getSupabase } from './core.js';

export interface UsuarioReciente {
  id: string;
  name: string | null;
  email: string | null;
  band_id: string | null;
  band_name: string | null;
  ui_preferences: unknown;
  created_at: string;
}

export async function dbUsuariosRecientes(desdeIso: string): Promise<UsuarioReciente[]> {
  const { data, error } = await getSupabase()
    .from('users')
    .select('id,name,email,band_id,band_name,ui_preferences,created_at')
    .gte('created_at', desdeIso)
    .not('email', 'is', null);
  if (error) throw new Error(`Supabase Error (usuarios recientes): ${error.message}`);
  return (data ?? []) as UsuarioReciente[];
}

/** Tipos ya enviados (y bajas) por usuario. */
export async function dbEmailsEnviados(userIds: string[]): Promise<Map<string, Set<string>>> {
  const mapa = new Map<string, Set<string>>();
  if (userIds.length === 0) return mapa;
  const { data, error } = await getSupabase().from('emails_ciclo_vida').select('user_id,tipo').in('user_id', userIds);
  if (error) throw new Error(`Supabase Error (emails_ciclo_vida): ${error.message}`);
  for (const f of data ?? []) {
    if (!mapa.has(f.user_id)) mapa.set(f.user_id, new Set());
    mapa.get(f.user_id)!.add(f.tipo);
  }
  return mapa;
}

export async function dbBandasConConcierto(bandIds: string[]): Promise<Set<string>> {
  if (bandIds.length === 0) return new Set();
  const { data, error } = await getSupabase().from('concerts').select('band_id').in('band_id', bandIds);
  if (error) throw new Error(`Supabase Error (concerts): ${error.message}`);
  return new Set((data ?? []).map((f) => String(f.band_id)));
}

/** Un EPK "hecho" es uno con biografía escrita: la fila sola puede existir con valores por defecto. */
export async function dbBandasConEpk(bandIds: string[]): Promise<Set<string>> {
  if (bandIds.length === 0) return new Set();
  const { data, error } = await getSupabase().from('epk_configs').select('band_id,biografia').in('band_id', bandIds);
  if (error) throw new Error(`Supabase Error (epk_configs): ${error.message}`);
  return new Set((data ?? []).filter((f) => String(f.biografia ?? '').trim() !== '').map((f) => String(f.band_id)));
}

/** Reserva (user, tipo). Devuelve false si ya existía: así dos instancias no envían el mismo email. */
export async function dbReservarEmail(userId: string, tipo: string): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from('emails_ciclo_vida')
    .upsert({ user_id: userId, tipo }, { onConflict: 'user_id,tipo', ignoreDuplicates: true })
    .select('user_id');
  if (error) throw new Error(`Supabase Error (reservar email): ${error.message}`);
  return (data ?? []).length > 0;
}

export async function dbLiberarEmail(userId: string, tipo: string): Promise<void> {
  await getSupabase().from('emails_ciclo_vida').delete().eq('user_id', userId).eq('tipo', tipo);
}
