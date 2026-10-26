// Directorio público de salas: lee del catálogo solo las columnas públicas (nunca `email_contacto` ni `telefono`).
// Solo lo usa el servidor con la clave de servicio.

import { getSupabase } from './core.js';
import { salasPublicas } from '../utils/seo/salas/publicas.js';
import type { FilaSalaPublica, SalaPublica } from '../utils/seo/salas/tipos.js';

const COLUMNAS = 'id,nombre,ciudad,region,direccion,tipo,aforo,genero,website,instagram,nivel,no_contactar,estado_negocio,fuentes,updated_at';
const PAGINA = 1000;

export async function salasPublicasDeDb(): Promise<SalaPublica[]> {
  const filas: FilaSalaPublica[] = [];
  for (let desde = 0; ; desde += PAGINA) {
    const { data, error } = await getSupabase()
      .from('catalogo_salas')
      .select(COLUMNAS)
      .eq('tipo', 'sala')
      .eq('no_contactar', false)
      .order('id')
      .range(desde, desde + PAGINA - 1);
    if (error) throw new Error(`No se pudo leer el catálogo de salas: ${error.message}`);
    filas.push(...((data ?? []) as FilaSalaPublica[]));
    if ((data?.length ?? 0) < PAGINA) break;
  }
  return salasPublicas(filas);
}
