// Proveedor de las salas del directorio público: base de datos con caché. Si Supabase falla se sigue sirviendo la última lectura buena.
import { salasPublicasDeDb } from '../db/salasPublicas.js';
import { captureError } from '../utils/errorTracking.js';
import type { SalaPublica } from '../utils/seo/salas/tipos.js';

const TTL_MS = 10 * 60_000;
const TTL_FALLO_MS = 30_000;

export function crearProveedorSalas(cargar: () => Promise<SalaPublica[]>, ahora: () => number = Date.now, alFallar?: (e: unknown) => void): () => Promise<readonly SalaPublica[]> {
  let cache: { hasta: number; salas: readonly SalaPublica[] } = { hasta: 0, salas: [] };
  return async () => {
    if (cache.hasta > ahora()) return cache.salas;
    try {
      cache = { hasta: ahora() + TTL_MS, salas: await cargar() };
    } catch (e) {
      alFallar?.(e);
      cache = { hasta: ahora() + TTL_FALLO_MS, salas: cache.salas };
    }
    return cache.salas;
  };
}

export const obtenerSalasPublicas = crearProveedorSalas(salasPublicasDeDb, Date.now, (e) =>
  captureError(e instanceof Error ? e : new Error(String(e)), { servicio: 'salasPublicas' })
);
