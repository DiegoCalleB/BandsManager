// Directorio de festivales: lectura de las tres tablas (`catalogo_festivales`, `catalogo_festival_ediciones`, `catalogo_festival_convocatorias`) y escritura de la carga.
// Solo lo usa el servidor con la clave de servicio; ninguna ruta de usuario toca estas tablas directamente.

import { getSupabase } from './core.js';
import { festivalesDeFilas, type ContactosDisponibles, type FilaConvocatoria, type FilaEdicion, type FilaFestival } from '../utils/seo/festivales/mapeo.js';
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
    leerTodo<FilaFestival>('catalogo_festivales'),
    leerTodo<FilaEdicion & { id: string }>('catalogo_festival_ediciones'),
    leerTodo<FilaConvocatoria & { id: string }>('catalogo_festival_convocatorias'),
  ]);
  return festivalesDeFilas(festivales, ediciones, convocatorias, hoy, await contactosDisponibles(festivales));
}

/**
 * Qué contacto tiene el catálogo de salas de cada festival enlazado. Lee email y teléfono SOLO para convertirlos en
 * booleanos aquí mismo: el dato no sale de esta función. Si falla, las fichas se publican sin el aviso.
 */
async function contactosDisponibles(festivales: FilaFestival[]): Promise<ContactosDisponibles> {
  const ids = [...new Set(festivales.map((f) => f.sala_id).filter((id): id is string => !!id))];
  const mapa: ContactosDisponibles = new Map();
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await getSupabase().from('catalogo_salas').select('id,email_contacto,telefono,instagram').in('id', ids.slice(i, i + 200));
    if (error) return mapa;
    for (const s of (data ?? []) as Array<{ id: string; email_contacto: string | null; telefono: string | null; instagram: string | null }>) {
      mapa.set(s.id, { email: !!s.email_contacto?.trim(), telefono: !!s.telefono?.trim(), instagram: !!s.instagram?.trim() });
    }
  }
  return mapa;
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
