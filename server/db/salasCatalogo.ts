// Catálogo compartido de salas (`catalogo_salas`): adaptador de Supabase del puerto de server/services/catalogoSalas.ts.
// Solo lo usa el servidor con la clave de servicio; ninguna ruta de usuario lee esta tabla directamente.

import { getSupabase } from './core.js';
import type { LeadParaCatalogo } from '../utils/salaCatalogo.js';
import type { PuertoCatalogo, SalaAGuardar, SalaGuardada } from '../services/catalogoSalas.js';
import type { PuertoVerificacion } from '../services/verificarSalasEnMaps.js';

const PAGINA = 1000;

/** El Lector deja esta marca en las notas del lead cuando el correo a la sala rebota (lectorAgent.ts). */
export const MARCA_REBOTE = '[Email Rechazado]';

/** Fila de `leads` con las columnas que se piden. `notas` se lee solo para detectar la marca de rebote. */
export interface FilaLeadCatalogo extends Omit<LeadParaCatalogo, 'rebotado'> {
  notas?: string | null;
}

/** De fila de Supabase a lead para el catálogo. El texto de las notas se queda aquí: solo sale si hubo rebote. */
export function leadParaCatalogo({ notas, ...resto }: FilaLeadCatalogo): LeadParaCatalogo {
  return { ...resto, rebotado: typeof notas === 'string' && notas.includes(MARCA_REBOTE) };
}

type FilaSala = Omit<SalaGuardada, 'verificada_en' | 'estado_negocio_en'> & { verificada_en: string | null; estado_negocio_en?: string | null };

export const salaDeFila = (fila: FilaSala): SalaGuardada => ({
  ...fila,
  verificada_en: fila.verificada_en ? new Date(fila.verificada_en) : null,
  estado_negocio_en: fila.estado_negocio_en ? new Date(fila.estado_negocio_en) : null,
});

const COLUMNAS_LEAD = 'id,band_id,nombre_sala,ciudad,region,direccion,tipo,aforo,genero,website,instagram,email_contacto,telefono,telefono_fijo,place_id,es_verificado,estado,fecha_envio,notas,sala_id';

/** Lee una tabla entera por páginas: PostgREST corta en 1000 filas por petición. */
async function leerTodo<T>(tabla: string, columnas: string): Promise<T[]> {
  const filas: T[] = [];
  for (let desde = 0; ; desde += PAGINA) {
    const { data, error } = await getSupabase().from(tabla).select(columnas).order('id').range(desde, desde + PAGINA - 1);
    if (error) throw new Error(`No se pudo leer ${tabla}: ${error.message}`);
    filas.push(...((data ?? []) as T[]));
    if ((data?.length ?? 0) < PAGINA) return filas;
  }
}

/** Lo mínimo de los leads de UNA banda para saber qué salas del catálogo ya tiene. Siempre filtrado por su `bandId`. */
export async function leadsDeAgendaDeBanda(bandId: string) {
  const { data, error } = await getSupabase().from('leads').select('id,sala_id,nombre_sala,ciudad,place_id').eq('band_id', bandId);
  if (error) throw new Error(`No se pudo leer la agenda de la banda: ${error.message}`);
  return (data ?? []) as Array<{ id: string; sala_id: string | null; nombre_sala: string | null; ciudad: string | null; place_id: string | null }>;
}

export const puertoCatalogoSupabase: PuertoCatalogo = {
  async leerLeads() {
    return (await leerTodo<FilaLeadCatalogo>('leads', COLUMNAS_LEAD)).map(leadParaCatalogo);
  },

  async leerSalas() {
    return (await leerTodo<FilaSala>('catalogo_salas', '*')).map(salaDeFila);
  },

  async guardarSalas(salas: SalaAGuardar[]) {
    if (salas.length === 0) return;
    const ahora = new Date().toISOString();
    // `created_at` es de la base de datos. Una sala ya existente lo trae al leerla y una nueva no: en un mismo lote PostgREST
    // rellena con null la que no lo tiene, y eso viola el NOT NULL (la importación de OSM fallaba así al mezclar nuevas y ya existentes).
    const filas = salas.map(({ created_at: _creada, ...s }: SalaAGuardar & { created_at?: unknown }) => ({ ...s, verificada_en: s.verificada_en?.toISOString() ?? null, updated_at: ahora }));
    const { error } = await getSupabase().from('catalogo_salas').upsert(filas, { onConflict: 'id' });
    if (error) throw new Error(`No se pudo guardar el catálogo de salas: ${error.message}`);
  },

  async enlazarLeads(enlaces) {
    // Una petición por sala (no por lead): los leads de una misma sala se actualizan juntos.
    const porSala = new Map<string, string[]>();
    for (const { leadId, salaId } of enlaces) porSala.set(salaId, [...(porSala.get(salaId) ?? []), leadId]);
    for (const [salaId, ids] of porSala) {
      const { error } = await getSupabase().from('leads').update({ sala_id: salaId }).in('id', ids);
      if (error) throw new Error(`No se pudo enlazar leads con la sala ${salaId}: ${error.message}`);
    }
  },
};

export const puertoVerificacionSupabase: PuertoVerificacion = {
  async salasPendientes(limite, antesDe) {
    const { data, error } = await getSupabase()
      .from('catalogo_salas')
      .select('*')
      .eq('no_contactar', false)
      .or(`estado_negocio_en.is.null,estado_negocio_en.lt.${antesDe.toISOString()}`)
      .order('estado_negocio_en', { ascending: true, nullsFirst: true })
      .limit(limite);
    if (error) throw new Error(`No se pudieron leer las salas por verificar: ${error.message}`);
    return ((data ?? []) as FilaSala[]).map(salaDeFila);
  },

  async guardarEstado(salaId, estado, en) {
    const { error } = await getSupabase().from('catalogo_salas').update({ estado_negocio: estado, estado_negocio_en: en.toISOString() }).eq('id', salaId);
    if (error) throw new Error(`No se pudo guardar el estado de la sala ${salaId}: ${error.message}`);
  },
};
