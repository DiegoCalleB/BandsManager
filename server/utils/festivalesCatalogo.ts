/**
 * Los festivales del directorio público vistos desde el catálogo de la banda: consulta y alta en su agenda.
 *
 * El directorio no guarda ningún email ni teléfono (solo web y convocatoria), así que no hay nada privado que proteger:
 * al añadir un festival, el lead lleva su web y, si la hay, el enlace de la convocatoria en las notas.
 */
import { logoDeSala } from '../../src/utils/logoDeSala.js';
import { claveSala, normalizarTexto } from './salaCatalogo.js';
import type { Festival } from './seo/festivales/tipos.js';

export interface FichaFestival {
  slug: string;
  nombre: string;
  ciudad: string;
  provincia: string;
  estilos: string[];
  web: string | null;
  descripcion: string;
  /** Próxima edición confirmada. */
  edicion: { inicio: string; fin: string } | null;
  /** Convocatoria abierta para bandas, si la hay. */
  convocatoria: { url: string; cierre: string | null; resumen: string } | null;
  ya_en_agenda: boolean;
}

export interface FiltrosFestivales {
  texto: string;
  lugar: string;
  estilo: string;
  soloConConvocatoria: boolean;
}

const texto = (v: unknown, max = 80): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export function parsearFiltrosFestivales(e: Record<string, unknown> = {}): FiltrosFestivales {
  return {
    texto: normalizarTexto(texto(e.texto)),
    lugar: normalizarTexto(texto(e.lugar)),
    estilo: texto(e.estilo, 30).toLowerCase(),
    soloConConvocatoria: e.soloConConvocatoria === true || e.soloConConvocatoria === 'true',
  };
}

export const claveDeFestival = (f: Pick<Festival, 'nombre' | 'ciudad'>): string => claveSala({ nombre: f.nombre, ciudad: f.ciudad }) ?? '';

/** Festivales que encajan con los filtros, por nombre. `claves` son las de lo que la banda ya tiene (ver `salasEnAgenda`). */
export function consultarFestivales(festivales: readonly Festival[], filtros: FiltrosFestivales, claves: Set<string>): FichaFestival[] {
  return festivales
    .filter(
      (f) =>
        (!filtros.texto || normalizarTexto(f.nombre).includes(filtros.texto)) &&
        (!filtros.lugar || normalizarTexto(f.ciudad).includes(filtros.lugar) || normalizarTexto(f.provincia).includes(filtros.lugar)) &&
        (!filtros.estilo || (f.estilos as string[]).includes(filtros.estilo)) &&
        (!filtros.soloConConvocatoria || !!f.convocatoria),
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    .map((f) => ({
      slug: f.slug,
      nombre: f.nombre,
      ciudad: f.ciudad,
      provincia: f.provincia,
      estilos: [...f.estilos],
      web: f.web ?? null,
      descripcion: f.descripcion.es,
      edicion: f.edicion ?? null,
      convocatoria: f.convocatoria ? { url: f.convocatoria.url, cierre: f.convocatoria.cierre ?? null, resumen: f.convocatoria.resumen.es } : null,
      ya_en_agenda: claves.has(claveDeFestival(f)),
    }));
}

/** Lead nuevo de la banda a partir de un festival del directorio. */
export function leadDesdeFestival(f: Festival, idLead: string, bandId: string): Record<string, unknown> {
  return {
    id: idLead,
    band_id: bandId,
    nombre_sala: f.nombre,
    ciudad: f.ciudad,
    region: f.provincia,
    tipo: 'festival',
    aforo: 0,
    genero: f.estilos.join(', '),
    website: f.web ?? undefined,
    imagen_url: logoDeSala(f.web ?? null) ?? undefined,
    email_contacto: '',
    estado: 'nuevo',
    fuente: 'Directorio de festivales',
    notas: f.convocatoria ? `Convocatoria para bandas: ${f.convocatoria.url}${f.convocatoria.cierre ? ` (cierra el ${f.convocatoria.cierre})` : ''}` : undefined,
  };
}
