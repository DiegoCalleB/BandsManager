/**
 * Consulta del catálogo compartido de salas (fase 2): reglas puras, sin base de datos.
 *
 * Una banda ve de cada sala solo lo público y NUNCA su email ni su teléfono: esos datos se entregan al
 * añadirla a su agenda (`leadDesdeSala`), que es la acción consciente. Una sala marcada «no contactar» no
 * aparece ni se puede añadir.
 */
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
  ya_en_agenda: boolean;
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
    ya_en_agenda: yaEnAgenda,
  };
}

/** Filtra, ordena (más fiables primero) y acota. Las que la banda ya tiene salen marcadas, no ocultas. */
export function consultarSalas(
  salas: SalaGuardada[],
  filtros: FiltrosCatalogo,
  agenda: { ids: Set<string>; claves: Set<string> },
): ResultadoCatalogo {
  const pesoMinimo = PESO_NIVEL[filtros.nivelMinimo];
  const encontradas = salas.filter(
    (s) =>
      !s.no_contactar &&
      s.estado_negocio !== 'cerrado_permanente' &&
      PESO_NIVEL[s.nivel] >= pesoMinimo &&
      (!filtros.tipo || s.tipo.toLowerCase() === filtros.tipo) &&
      (!filtros.lugar || contiene(s.ciudad, filtros.lugar) || contiene(s.region, filtros.lugar)) &&
      (!filtros.genero || contiene(s.genero, filtros.genero)) &&
      (filtros.aforoMin === null || (s.aforo !== null && s.aforo >= filtros.aforoMin)) &&
      (filtros.aforoMax === null || (s.aforo !== null && s.aforo <= filtros.aforoMax)) &&
      (!filtros.conContacto || !!s.email_contacto || !!s.telefono) &&
      (!filtros.texto || [s.nombre, s.ciudad, s.region, s.genero].some((c) => contiene(c, filtros.texto))),
  );
  encontradas.sort((a, b) => PESO_NIVEL[b.nivel] - PESO_NIVEL[a.nivel] || b.puntuacion - a.puntuacion || a.nombre.localeCompare(b.nombre, 'es'));
  const mostradas = encontradas.slice(0, filtros.limite);
  return {
    total: encontradas.length,
    mostradas: mostradas.length,
    salas: mostradas.map((s) => fichaDeSala(s, agenda.ids.has(s.id) || agenda.claves.has(s.clave))),
  };
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
    instagram: s.instagram ?? undefined,
    email_contacto: s.email_contacto ?? '',
    telefono: s.telefono ?? undefined,
    place_id: s.place_id ?? undefined,
    estado: 'nuevo',
    fuente: 'Catálogo de salas',
  };
}
