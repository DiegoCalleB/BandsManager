// Pedidos del regalo de pegatinas (`pegatinas_pedidos`): una fila por banda.
import { getSupabase, cleanBandId } from './core.js';
import type { EnvioPegatinas } from '../utils/pegatinas.js';

export async function dbHayPedidoPegatinas(bandId: string): Promise<boolean> {
  const { data, error } = await getSupabase().from('pegatinas_pedidos').select('band_id').eq('band_id', cleanBandId(bandId)).maybeSingle();
  if (error) throw new Error(`Supabase Error (pegatinas_pedidos): ${error.message}`);
  return !!data;
}

/** Crea el pedido. Devuelve false si la banda ya lo había pedido (clave primaria = band_id). */
export async function dbCrearPedidoPegatinas(
  bandId: string,
  pack: { plan: string; cantidad: number; expres: boolean },
  envio: EnvioPegatinas,
): Promise<boolean> {
  const { error } = await getSupabase()
    .from('pegatinas_pedidos')
    .insert({ band_id: cleanBandId(bandId), ...pack, ...envio });
  if (!error) return true;
  if (error.code === '23505') return false;
  throw new Error(`Supabase Error (pegatinas_pedidos): ${error.message}`);
}
