// Directorio de festivales: lectura de las tres tablas (`festivales`, `festival_ediciones`, `festival_convocatorias`) y escritura de la carga.
// Solo lo usa el servidor con la clave de servicio; ninguna ruta de usuario toca estas tablas directamente.

import { getSupabase } from './core.js';
import { festivalesDeFilas, type FilaConvocatoria, type FilaEdicion, type FilaFestival } from '../utils/seo/festivales/mapeo.js';
import type { Festival } from '../utils/seo/festivales/tipos.js';

const PAGINA = 1000;

async function leerTodo<T>(tabla: string): Promise<T[]> {
  const filas: T[] = [];
  for (let desde = 0; ; desde += PAGINA) {
    const { data, error } = await getSupabase().from(tabla).select('*').order('id').range(desde, desde + PAGINA - 1);
    if (error) throw new Error(`No se pudo leer ${tabla}: ${error.message}`);
    filas.push(...((data ?? []) as T[]));
    if ((data?.length ?? 0) < PAGINA) return filas;
  }
}

/** Fichas publicables (revisadas, con fuente y fecha) tal como las muestran las páginas públicas. */
export async function festivalesPublicosDeDb(hoy: string = new Date().toISOString().slice(0, 10)): Promise<Festival[]> {
  const [festivales, ediciones, convocatorias] = await Promise.all([
    leerTodo<FilaFestival>('festivales'),
    leerTodo<FilaEdicion & { id: string }>('festival_ediciones'),
    leerTodo<FilaConvocatoria & { id: string }>('festival_convocatorias'),
  ]);
  return festivalesDeFilas(festivales, ediciones, convocatorias, hoy);
}

export interface ResumenCarga {
  festivales: number;
  ediciones: number;
  convocatorias: number;
}

/**
 * Inserta sin pisar: una fila que ya existe (revisada a mano, por ejemplo) no se toca nunca.
 * Devuelve cuántas filas nuevas hubo, no cuántas se enviaron.
 */
export async function insertarSinPisar(tabla: string, filas: Array<Record<string, unknown>>): Promise<number> {
  let nuevas = 0;
  for (let i = 0; i < filas.length; i += 200) {
    const { data, error } = await getSupabase().from(tabla).upsert(filas.slice(i, i + 200), { onConflict: 'id', ignoreDuplicates: true }).select('id');
    if (error) throw new Error(`No se pudo escribir ${tabla}: ${error.message}`);
    nuevas += data?.length ?? 0;
  }
  return nuevas;
}
