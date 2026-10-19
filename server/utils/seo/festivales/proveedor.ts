/**
 * De dónde salen las fichas públicas: la base de datos y, si no responde o aún está vacía, las fichas fijas de `datos.ts`.
 * Así desplegar antes de cargar la tabla (o una caída de Supabase) no deja las páginas vacías.
 */
import type { Festival } from './tipos.js';

export interface OpcionesProveedor {
  ttlMs?: number;
  ahora?: () => number;
  /** Se llama cuando la base falla (no cuando simplemente está vacía). */
  alFallar?: (e: unknown) => void;
}

export function crearProveedorFestivales(cargar: () => Promise<Festival[]>, respaldo: readonly Festival[], o: OpcionesProveedor = {}): () => Promise<readonly Festival[]> {
  const ttl = o.ttlMs ?? 10 * 60_000;
  const ahora = o.ahora ?? Date.now;
  let cache: { hasta: number; fichas: readonly Festival[] } | null = null;
  return async () => {
    if (cache && cache.hasta > ahora()) return cache.fichas;
    let fichas: readonly Festival[] = respaldo;
    let fallo = false;
    try {
      const deDb = await cargar();
      if (deDb.length) fichas = deDb;
    } catch (e) {
      fallo = true;
      o.alFallar?.(e);
    }
    // Un fallo se reintenta pronto; un resultado bueno se guarda el TTL completo.
    cache = { hasta: ahora() + (fallo ? Math.min(ttl, 30_000) : ttl), fichas };
    return fichas;
  };
}
