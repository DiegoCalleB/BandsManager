/**
 * Importa la lista de trabajo (`docs/master/marketing/FESTIVALES_PENDIENTES.md`) como festivales *candidatos*: solo
 * nombre, comunidad, mes típico y estilos de la lista de partida. Una candidata no se publica nunca; sirve de punto
 * de partida para enriquecerla (ADR 0045). Puro: no lee ficheros ni escribe en ninguna base.
 */
import { slugify } from '../../slug.js';
import type { EstiloFestival } from './tipos.js';

export interface ItemLista {
  nombre: string;
  comunidad: string | null;
  mes: number | null;
  estilos: EstiloFestival[];
  /** Ya tiene ficha en `datos.ts` y no se vuelve a crear. */
  yaPublicado: boolean;
}

export interface FilaCandidata {
  id: string;
  nombre: string;
  comunidad: string | null;
  mes_tipico: number | null;
  generos: EstiloFestival[];
  estado_revision: 'candidata';
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** Las etiquetas de la lista de partida a las claves de `EstiloFestival`. */
const ESTILO_DE_ETIQUETA: Record<string, EstiloFestival> = {
  indie: 'indie', rock: 'rock', metal: 'metal', punk: 'punk', electrónica: 'electronica', urbano: 'urbano',
  'reggaeton/latino': 'reggaeton', jazz: 'jazz', blues: 'blues', flamenco: 'flamenco', 'reggae/ska': 'reggae',
  folk: 'folk', mundo: 'mundo', clásica: 'clasica', 'música antigua': 'antigua', experimental: 'experimental',
};

/** Nombre sin los paréntesis explicativos: «Pirata Beach Festival (varias sedes…)» → «Pirata Beach Festival». */
export const nombreLimpio = (n: string): string => n.replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+/g, ' ').trim();

export function parsearLista(md: string): ItemLista[] {
  const items: ItemLista[] = [];
  for (const linea of md.split('\n')) {
    if (!linea.startsWith('| ') || linea.startsWith('| Festival |') || linea.startsWith('|---')) continue;
    const c = linea.slice(1, linea.lastIndexOf('|')).split(' | ').map((x) => x.trim());
    if (c.length < 5 || !c[0]) continue;
    const [nombre, comunidad, mes, estilos, estado] = c;
    const m = MESES.indexOf(mes.toLowerCase());
    items.push({
      nombre: nombreLimpio(nombre),
      comunidad: /^sin comunidad/i.test(comunidad) ? null : comunidad.split(',')[0].replace(/\s*\(.*$/, '').trim() || null,
      mes: m >= 0 ? m + 1 : null,
      estilos: estilos.split(',').map((e) => ESTILO_DE_ETIQUETA[e.trim().toLowerCase()]).filter((e): e is EstiloFestival => !!e),
      yaPublicado: estado.startsWith('ficha mínima'),
    });
  }
  return items;
}

/** Filas candidatas, con un slug único por festival (si dos nombres dan el mismo, el segundo lleva `-2`). */
export function filasCandidatas(items: ItemLista[], idsOcupados: Iterable<string> = []): FilaCandidata[] {
  const usados = new Set<string>(idsOcupados);
  const filas: FilaCandidata[] = [];
  for (const it of items) {
    if (it.yaPublicado) continue;
    const base = slugify(it.nombre);
    if (!base) continue;
    let id = base;
    for (let n = 2; usados.has(id); n++) id = `${base}-${n}`;
    usados.add(id);
    filas.push({ id, nombre: it.nombre, comunidad: it.comunidad, mes_tipico: it.mes, generos: it.estilos, estado_revision: 'candidata' });
  }
  return filas;
}
