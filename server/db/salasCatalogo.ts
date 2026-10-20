// Catálogo compartido de salas (`catalogo_salas`): adaptador de Supabase del puerto de server/services/catalogoSalas.ts.
// Solo lo usa el servidor con la clave de servicio; ninguna ruta de usuario lee esta tabla directamente.

import { getSupabase } from './core.js';
import type { LeadParaCatalogo } from '../utils/salaCatalogo.js';
import type { FilaCoordenadas, PuertoCatalogo, PuertoCoordenadas, SalaAGuardar, SalaGuardada } from '../services/catalogoSalas.js';
import type { PuertoGeolocalizacion } from '../services/geolocalizarSalas.js';
import type { PuertoVerificacion } from '../services/verificarSalasEnMaps.js';
import type { PuertoEnriquecimientoWeb } from '../services/enriquecerSalasDesdeSuWeb.js';

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

export const puertoCatalogoSupabase: PuertoCatalogo & PuertoCoordenadas = {
  async leerLeads() {
    return (await leerTodo<FilaLeadCatalogo>('leads', COLUMNAS_LEAD)).map(leadParaCatalogo);
  },

  async leerAlias() {
    const { data, error } = await getSupabase().from('catalogo_sala_alias').select('alias_clave,clave,nombre');
    if (error) throw new Error(`No se pudo leer catalogo_sala_alias: ${error.message}`);
    return ((data ?? []) as Array<{ alias_clave: string; clave: string; nombre: string | null }>).map((a) => ({ aliasClave: a.alias_clave, clave: a.clave, nombre: a.nombre }));
  },

  async leerSalas() {
    return (await leerTodo<FilaSala>('catalogo_salas', '*')).map(salaDeFila);
  },

  async guardarSalas(salas: SalaAGuardar[]) {
    if (salas.length === 0) return;
    const ahora = new Date().toISOString();
    // `created_at` es de la base de datos. Una sala ya existente lo trae al leerla y una nueva no: en un mismo lote PostgREST
    // rellena con null la que no lo tiene, y eso viola el NOT NULL (la importación de OSM fallaba así al mezclar nuevas y ya existentes).
    // Lo mismo con las coordenadas: las escribe otro proceso, y una copia leída antes las pisaría con un valor viejo.
    const filas = salas.map(({ created_at: _creada, lat: _lat, lon: _lon, coordenadas_aprox: _aprox, geolocalizada_en: _geo, ...s }: SalaAGuardar & { created_at?: unknown; lat?: unknown; lon?: unknown; coordenadas_aprox?: unknown; geolocalizada_en?: unknown }) => ({ ...s, verificada_en: s.verificada_en?.toISOString() ?? null, updated_at: ahora }));
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

  async guardarCoordenadas(filas: FilaCoordenadas[]) {
    await escribirCoordenadas(filas, new Date());
  },
};

/** Una actualización por sala (no se puede hacer upsert parcial), en tandas para no abrir cientos de peticiones a la vez. */
async function escribirCoordenadas(filas: FilaCoordenadas[], en: Date): Promise<void> {
  for (let i = 0; i < filas.length; i += 25) {
    await Promise.all(
      filas.slice(i, i + 25).map(async (f) => {
        const { error } = await getSupabase().from('catalogo_salas').update({ lat: f.lat, lon: f.lon, coordenadas_aprox: f.aprox, geolocalizada_en: en.toISOString() }).eq('id', f.salaId);
        if (error) throw new Error(`No se pudieron guardar las coordenadas de la sala ${f.salaId}: ${error.message}`);
      }),
    );
  }
}

export const puertoGeolocalizacionSupabase: PuertoGeolocalizacion = {
  async salasSinCoordenadas(limite, antesDe) {
    const { data, error } = await getSupabase()
      .from('catalogo_salas')
      .select('*')
      .eq('no_contactar', false)
      .neq('estado_negocio', 'cerrado_permanente')
      .is('lat', null)
      .or(`geolocalizada_en.is.null,geolocalizada_en.lt.${antesDe.toISOString()}`)
      .order('geolocalizada_en', { ascending: true, nullsFirst: true })
      .limit(limite);
    if (error) throw new Error(`No se pudieron leer las salas por geolocalizar: ${error.message}`);
    return ((data ?? []) as FilaSala[]).map(salaDeFila);
  },

  async guardarPunto(salaId, punto, en) {
    if (punto) return escribirCoordenadas([{ salaId, lat: punto.lat, lon: punto.lon, aprox: punto.aprox }], en);
    // Ninguna fuente la supo situar: se anota el intento para no repetirlo cada día.
    const { error } = await getSupabase().from('catalogo_salas').update({ geolocalizada_en: en.toISOString() }).eq('id', salaId);
    if (error) throw new Error(`No se pudo anotar el intento de geolocalizar la sala ${salaId}: ${error.message}`);
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

export const puertoEnriquecimientoWebSupabase: PuertoEnriquecimientoWeb = {
  async salasPorEnriquecer(limite, antesDe) {
    // Con web, no «no contactar», no cerradas, y con algún dato por rellenar. Las revisadas hace poco esperan.
    // «Sin revisar o revisada hace tiempo» Y «con algún dato vacío», en un solo filtro: PostgREST no combina de forma fiable dos `or`.
    const sinRevisar = ['web_revisada_en.is.null', `web_revisada_en.lt.${antesDe.toISOString()}`];
    const conHueco = ['instagram', 'email_contacto', 'telefono', 'genero'].map((c) => `${c}.is.null`);
    const { data, error } = await getSupabase()
      .from('catalogo_salas')
      .select('*')
      .eq('no_contactar', false)
      .neq('estado_negocio', 'cerrado_permanente')
      .not('website', 'is', null)
      .or(sinRevisar.flatMap((r) => conHueco.map((h) => `and(${r},${h})`)).join(','))
      .order('web_revisada_en', { ascending: true, nullsFirst: true })
      .limit(limite);
    if (error) throw new Error(`No se pudieron leer las salas por enriquecer: ${error.message}`);
    return ((data ?? []) as FilaSala[]).map(salaDeFila);
  },

  async guardarEnriquecimiento(salaId, campos, en) {
    const { error } = await getSupabase().from('catalogo_salas').update({ ...campos, web_revisada_en: en.toISOString() }).eq('id', salaId);
    if (error) throw new Error(`No se pudo guardar el enriquecimiento de la sala ${salaId}: ${error.message}`);
  },
};
