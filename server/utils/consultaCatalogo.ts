/**
 * Consulta del catálogo compartido de salas (fase 2): reglas puras, sin base de datos.
 *
 * Una banda ve de cada sala solo lo público y NUNCA su email ni su teléfono: esos datos se entregan al
 * añadirla a su agenda (`leadDesdeSala`), que es la acción consciente. Una sala marcada «no contactar» no
 * aparece ni se puede añadir.
 */
import { logoDeSala } from '../../src/utils/logoDeSala.js';
import { ocultaPorCierre, posiblementeCerrada } from './estadoNegocio.js';
import { claveSala, normalizarTexto, type NivelSala } from './salaCatalogo.js';
import type { SalaGuardada } from '../services/catalogoSalas.js';

export const LIMITE_POR_DEFECTO = 15;
export const LIMITE_MAXIMO = 50;

const PESO_NIVEL: Record<NivelSala, number> = { verificada: 2, probable: 1, sin_verificar: 0 };
const NIVELES = new Set<string>(['sin_verificar', 'probable', 'verificada']);

export interface FiltrosCatalogo {
  /** Texto libre: nombre, ciudad, región o género. */
  texto: string;
  /** Ciudad o región (parte del nombre). */
  lugar: string;
  tipo: string;
  aforoMin: number | null;
  aforoMax: number | null;
  /** Aforo orientativo: salas de la mitad a una vez y media ese valor. Es lo que usa la interfaz; mín y máx quedan para el chat. */
  aforoAprox: number | null;
  genero: string;
  /** Nivel mínimo de fiabilidad. */
  nivelMinimo: NivelSala;
  /** Solo salas con algún contacto (email o teléfono) para poder escribirles. */
  conContacto: boolean;
  limite: number;
}

/** Lo que ve una banda de una sala del catálogo. Sin email ni teléfono: solo si los tiene. */
export interface FichaCatalogo {
  id: string;
  nombre: string;
  ciudad: string | null;
  region: string | null;
  tipo: string;
  aforo: number | null;
  genero: string | null;
  website: string | null;
  instagram: string | null;
  nivel: NivelSala;
  puntuacion: number;
  /** Cuántas bandas la han contactado con entrega confirmada. Un número, nunca cuáles. */
  bandas_con_entrega: number;
  bandas_con_respuesta: number;
  tiene_email: boolean;
  tiene_telefono: boolean;
  /** Google la da por cerrada, pero respondió a alguna banda: se enseña con aviso en vez de ocultarla. */
  posiblemente_cerrada: boolean;
  ya_en_agenda: boolean;
  direccion: string | null;
  /** Dónde está. `coordenadas_aprox` = es el punto de su ciudad, no el del local. */
  lat: number | null;
  lon: number | null;
  coordenadas_aprox: boolean;
  /** Cuántos de los datos que importan a una banda tiene la ficha (0-100). Lo que falta se ve en la ficha. */
  completitud: number;
  /** De dónde sale la información (`osm` obliga a citar OpenStreetMap). */
  fuentes: string[];
}

export interface ResultadoCatalogo {
  total: number;
  mostradas: number;
  salas: FichaCatalogo[];
}

const texto = (v: unknown, max = 80): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function numeroPositivo(v: unknown): number | null {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

/** Entrada sin fiar (query string o argumentos del modelo) a filtros acotados. Lo desconocido se ignora. */
export function parsearFiltros(entrada: Record<string, unknown> | undefined): FiltrosCatalogo {
  const e = entrada ?? {};
  const nivel = texto(e.nivelMinimo ?? e.nivel_minimo, 20);
  const limite = numeroPositivo(e.limite) ?? LIMITE_POR_DEFECTO;
  return {
    texto: normalizarTexto(texto(e.texto)),
    lugar: normalizarTexto(texto(e.lugar ?? e.ciudad ?? e.region)),
    tipo: texto(e.tipo, 20).toLowerCase(),
    aforoMin: numeroPositivo(e.aforoMin ?? e.aforo_min),
    aforoMax: numeroPositivo(e.aforoMax ?? e.aforo_max),
    aforoAprox: numeroPositivo(e.aforoAprox ?? e.aforo_aprox),
    genero: normalizarTexto(texto(e.genero)),
    nivelMinimo: NIVELES.has(nivel) ? (nivel as NivelSala) : 'sin_verificar',
    conContacto: e.conContacto === true || e.conContacto === 'true' || e.con_contacto === true || e.con_contacto === 'true',
    limite: Math.min(limite, LIMITE_MAXIMO),
  };
}

/** Claves de las salas que la banda ya tiene (por enlace o, si el lead es nuevo y aún no se enlazó, por nombre y ciudad). */
export function salasEnAgenda(leads: Array<{ sala_id?: string | null; nombre_sala?: string | null; ciudad?: string | null; place_id?: string | null }>): {
  ids: Set<string>;
  claves: Set<string>;
} {
  const ids = new Set<string>();
  const claves = new Set<string>();
  for (const l of leads) {
    if (l.sala_id) ids.add(l.sala_id);
    const clave = claveSala({ placeId: l.place_id, nombre: l.nombre_sala, ciudad: l.ciudad });
    if (clave) claves.add(clave);
  }
  return { ids, claves };
}

const contiene = (campo: string | null | undefined, buscado: string): boolean => normalizarTexto(campo ?? '').includes(buscado);

/** Datos que una banda necesita para decidir y escribir a una sala. Cada uno pesa igual: una ficha con cinco de diez está al 50 %. */
const DATOS_DE_FICHA: Array<(s: SalaGuardada) => boolean> = [
  (s) => !!s.ciudad,
  (s) => !!s.direccion,
  (s) => !!s.website,
  (s) => !!s.instagram,
  (s) => !!s.email_contacto,
  (s) => !!s.telefono,
  (s) => s.aforo !== null,
  (s) => !!s.genero,
  (s) => s.lat != null && s.lon != null && !s.coordenadas_aprox,
  (s) => s.nivel !== 'sin_verificar',
];

export const completitudDeSala = (s: SalaGuardada): number => Math.round((DATOS_DE_FICHA.filter((tiene) => tiene(s)).length / DATOS_DE_FICHA.length) * 100);

export function fichaDeSala(s: SalaGuardada, yaEnAgenda: boolean): FichaCatalogo {
  return {
    id: s.id,
    nombre: s.nombre,
    ciudad: s.ciudad,
    region: s.region,
    tipo: s.tipo,
    aforo: s.aforo,
    genero: s.genero,
    website: s.website,
    instagram: s.instagram,
    nivel: s.nivel,
    puntuacion: s.puntuacion,
    bandas_con_entrega: s.bandas_con_entrega,
    bandas_con_respuesta: s.bandas_con_respuesta,
    tiene_email: !!s.email_contacto,
    tiene_telefono: !!s.telefono,
    posiblemente_cerrada: posiblementeCerrada(s),
    ya_en_agenda: yaEnAgenda,
    direccion: s.direccion,
    lat: s.lat ?? null,
    lon: s.lon ?? null,
    coordenadas_aprox: !!s.coordenadas_aprox,
    completitud: completitudDeSala(s),
    fuentes: s.fuentes ?? [],
  };
}

/** Las salas que encajan con los filtros, las más fiables primero. Las que la banda ya tiene salen marcadas, no ocultas. */
function filtrarYOrdenar(salas: SalaGuardada[], filtros: FiltrosCatalogo): SalaGuardada[] {
  const pesoMinimo = PESO_NIVEL[filtros.nivelMinimo];
  const encontradas = salas.filter(
    (s) =>
      !s.no_contactar &&
      !ocultaPorCierre(s) &&
      PESO_NIVEL[s.nivel] >= pesoMinimo &&
      (!filtros.tipo || s.tipo.toLowerCase() === filtros.tipo) &&
      (!filtros.lugar || contiene(s.ciudad, filtros.lugar) || contiene(s.region, filtros.lugar)) &&
      (!filtros.genero || contiene(s.genero, filtros.genero)) &&
      (filtros.aforoMin === null || (s.aforo !== null && s.aforo >= filtros.aforoMin)) &&
      (filtros.aforoMax === null || (s.aforo !== null && s.aforo <= filtros.aforoMax)) &&
      (filtros.aforoAprox === null || (s.aforo !== null && s.aforo >= filtros.aforoAprox * 0.5 && s.aforo <= filtros.aforoAprox * 1.5)) &&
      (!filtros.conContacto || !!s.email_contacto || !!s.telefono) &&
      (!filtros.texto || [s.nombre, s.ciudad, s.region, s.genero].some((c) => contiene(c, filtros.texto))),
  );
  return encontradas.sort((a, b) => PESO_NIVEL[b.nivel] - PESO_NIVEL[a.nivel] || b.puntuacion - a.puntuacion || a.nombre.localeCompare(b.nombre, 'es'));
}

export function consultarSalas(
  salas: SalaGuardada[],
  filtros: FiltrosCatalogo,
  agenda: { ids: Set<string>; claves: Set<string> },
): ResultadoCatalogo {
  const encontradas = filtrarYOrdenar(salas, filtros);
  const mostradas = encontradas.slice(0, filtros.limite);
  return {
    total: encontradas.length,
    mostradas: mostradas.length,
    salas: mostradas.map((s) => fichaDeSala(s, agenda.ids.has(s.id) || agenda.claves.has(s.clave))),
  };
}

/** Lo mínimo de una sala para pintarla en el mapa: el resto se pide al abrir su ficha. */
export interface PuntoDelMapa {
  id: string;
  nombre: string;
  ciudad: string | null;
  tipo: string;
  nivel: NivelSala;
  lat: number;
  lon: number;
  coordenadas_aprox: boolean;
  ya_en_agenda: boolean;
}

export interface ResultadoMapa {
  /** Salas que encajan con los filtros, estén o no situadas. */
  total: number;
  puntos: PuntoDelMapa[];
}

/** Máximo de puntos que viajan en una respuesta: el catálogo entero cabe, pero la petición queda acotada. */
export const MAX_PUNTOS_MAPA = 3000;

/** Las salas que encajan y están situadas en el mapa (con sus mismos filtros que la lista). */
export function puntosDelMapa(salas: SalaGuardada[], filtros: FiltrosCatalogo, agenda: { ids: Set<string>; claves: Set<string> }): ResultadoMapa {
  const encontradas = filtrarYOrdenar(salas, filtros);
  const puntos: PuntoDelMapa[] = [];
  for (const s of encontradas) {
    if (s.lat == null || s.lon == null) continue;
    puntos.push({ id: s.id, nombre: s.nombre, ciudad: s.ciudad, tipo: s.tipo, nivel: s.nivel, lat: s.lat, lon: s.lon, coordenadas_aprox: !!s.coordenadas_aprox, ya_en_agenda: agenda.ids.has(s.id) || agenda.claves.has(s.clave) });
    if (puntos.length >= MAX_PUNTOS_MAPA) break;
  }
  return { total: encontradas.length, puntos };
}

/** Lead nuevo de la banda a partir de una sala del catálogo: aquí sí viajan el email y el teléfono. */
export function leadDesdeSala(s: SalaGuardada, idLead: string, bandId: string): Record<string, unknown> {
  return {
    id: idLead,
    band_id: bandId,
    nombre_sala: s.nombre,
    ciudad: s.ciudad ?? '',
    region: s.region ?? '',
    direccion: s.direccion ?? undefined,
    tipo: s.tipo,
    aforo: s.aforo ?? 0,
    genero: s.genero ?? '',
    website: s.website ?? undefined,
    imagen_url: logoDeSala(s.website) ?? undefined,
    instagram: s.instagram ?? undefined,
    email_contacto: s.email_contacto ?? '',
    telefono: s.telefono ?? undefined,
    place_id: s.place_id ?? undefined,
    estado: 'nuevo',
    fuente: 'Catálogo de salas',
  };
}
