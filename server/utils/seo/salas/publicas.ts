/** Reglas de publicación del directorio de salas y su agrupación por zona. Puro y probado. */
import { slugZona, zonaDeSala } from '../../geoEspana.js';
import type { FilaSalaPublica, SalaPublica } from './tipos.js';

/** Páginas por debajo de estos mínimos se sirven con `noindex`: una lista de dos salas es una página fina. */
export const MIN_SALAS_INDEX = 30;
export const MIN_SALAS_COMUNIDAD = 8;
export const MIN_SALAS_CIUDAD = 5;

const esHttps = (u: string | null): u is string => !!u && /^https:\/\/[^\s]+$/i.test(u.trim());

/**
 * Una sala sale en el directorio solo si es un recinto abierto, se puede colocar en España y tiene web oficial a la que
 * enlazar. Nunca una marcada «no contactar» ni una cerrada. El resto del catálogo sigue disponible dentro de la app.
 */
export function salaPublica(f: FilaSalaPublica): SalaPublica | null {
  if (f.tipo !== 'sala' || f.no_contactar || f.estado_negocio === 'cerrado_permanente') return null;
  // Lo que viene de otro directorio se usa dentro de la app, pero no se republica en páginas públicas.
  if (f.fuentes?.includes('bandflow')) return null;
  const nombre = f.nombre?.trim();
  const ciudad = f.ciudad?.trim();
  if (!nombre || !ciudad || !esHttps(f.website)) return null;
  const zona = zonaDeSala(f.region, ciudad);
  const ciudadSlug = slugZona(ciudad);
  if (!zona || !ciudadSlug) return null;
  return {
    id: f.id,
    slug: `${slugZona(nombre) || 'sala'}-${f.id.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(-6)}`,
    nombre,
    ciudad,
    ciudadSlug,
    comunidad: zona.comunidad,
    comunidadSlug: slugZona(zona.comunidad),
    provincia: zona.provincia,
    direccion: f.direccion?.trim() || null,
    aforo: f.nivel !== 'sin_verificar' && f.aforo && f.aforo > 0 ? f.aforo : null,
    genero: f.genero?.trim() || null,
    web: f.website.trim(),
    instagram: f.instagram?.trim() || null,
    nivel: f.nivel,
    deOsm: !!f.fuentes?.includes('osm'),
    actualizadoEn: /^\d{4}-\d{2}-\d{2}/.test(f.updated_at ?? '') ? f.updated_at!.slice(0, 10) : null,
  };
}

export const salasPublicas = (filas: readonly FilaSalaPublica[]): SalaPublica[] =>
  filas.flatMap((f) => salaPublica(f) ?? []).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

export interface GrupoZona {
  nombre: string;
  slug: string;
  salas: SalaPublica[];
}

function agrupar(salas: readonly SalaPublica[], nombre: (s: SalaPublica) => string, slug: (s: SalaPublica) => string): GrupoZona[] {
  const m = new Map<string, GrupoZona>();
  for (const s of salas) {
    const k = slug(s);
    m.set(k, { nombre: nombre(s), slug: k, salas: [...(m.get(k)?.salas ?? []), s] });
  }
  return [...m.values()].sort((a, b) => b.salas.length - a.salas.length || a.nombre.localeCompare(b.nombre, 'es'));
}

export const comunidadesDe = (salas: readonly SalaPublica[]): GrupoZona[] => agrupar(salas, (s) => s.comunidad, (s) => s.comunidadSlug);

export const ciudadesDe = (salas: readonly SalaPublica[], comunidadSlug: string): GrupoZona[] =>
  agrupar(salas.filter((s) => s.comunidadSlug === comunidadSlug), (s) => s.ciudad, (s) => s.ciudadSlug);

export const indexableIndice = (salas: readonly SalaPublica[]): boolean => salas.length >= MIN_SALAS_INDEX;
export const indexableComunidad = (salas: readonly SalaPublica[], comunidadSlug: string): boolean =>
  salas.filter((s) => s.comunidadSlug === comunidadSlug).length >= MIN_SALAS_COMUNIDAD;
export const indexableCiudad = (salas: readonly SalaPublica[], comunidadSlug: string, ciudadSlug: string): boolean =>
  salas.filter((s) => s.comunidadSlug === comunidadSlug && s.ciudadSlug === ciudadSlug).length >= MIN_SALAS_CIUDAD;

/** Fecha más reciente (YYYY-MM-DD) entre las salas dadas, o null si ninguna la tiene. */
export const ultimaActualizacion = (salas: readonly SalaPublica[]): string | null =>
  salas.reduce<string | null>((max, s) => (s.actualizadoEn && (!max || s.actualizadoEn > max) ? s.actualizadoEn : max), null);
