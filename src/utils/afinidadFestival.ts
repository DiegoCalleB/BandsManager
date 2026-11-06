import type { Lead } from '../types';

/** Familias de género: lo que la banda toca (exacto) y sus afines (menos puntos). */
const FAMILIAS: Array<{ etiqueta: string; claves: string[]; afines: string[] }> = [
  { etiqueta: 'Reggae', claves: ['reggae', 'roots', 'dancehall'], afines: ['dub', 'world', 'fusion', 'mestizaje'] },
  { etiqueta: 'Ska', claves: ['ska', 'rocksteady'], afines: ['ska-punk', 'punk', 'dub', 'fusion', 'mestizaje'] },
  { etiqueta: 'Balkan', claves: ['balkan', 'balcan', 'gypsy', 'gitano', 'brass'], afines: ['world', 'folk', 'fusion', 'mestizaje'] },
  { etiqueta: 'Electro', claves: ['electro', 'electronic', 'dance', 'techno', 'house'], afines: ['dub', 'fusion', 'indie'] },
];
const GENERICOS = ['multigenero', 'multi-genero', 'eclectico', 'variado', 'pop', 'rock', 'indie', 'musica'];

const plano = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export interface Afinidad {
  puntos: number;
  /** Una línea: los géneros del festival que encajan, p. ej. «Reggae/Ska». */
  motivo: string;
}

/** Cuánto encaja un festival con el género de la banda. Se calcula con el género del perfil, sin valores fijos. */
export function afinidadDeGenero(lead: Lead, generosBanda: string[]): Afinidad {
  const genero = plano(lead.genero || '');
  if (!genero.trim()) return { puntos: 0, motivo: '' };
  const banda = plano(generosBanda.join(' '));
  const exactos: string[] = [];
  let afines = 0;
  for (const f of FAMILIAS) {
    const laBandaLaToca = f.claves.some((c) => banda.includes(c));
    if (!laBandaLaToca) continue;
    if (f.claves.some((c) => genero.includes(c))) exactos.push(f.etiqueta);
    else if (f.afines.some((a) => genero.includes(a))) afines++;
  }
  if (exactos.length) return { puntos: 10 * exactos.length, motivo: exactos.join('/') };
  if (afines) return { puntos: 4, motivo: 'Afín' };
  if (GENERICOS.some((g) => genero.includes(g))) return { puntos: 1, motivo: 'Multigénero' };
  return { puntos: 0, motivo: '' };
}

/** Ordena de más a menos afinidad; los empates mantienen el orden original. */
export function ordenarPorAfinidad<T extends Lead>(leads: T[], generosBanda: string[]): T[] {
  return leads
    .map((l, i) => ({ l, i, p: afinidadDeGenero(l, generosBanda).puntos }))
    .sort((a, b) => b.p - a.p || a.i - b.i)
    .map((x) => x.l);
}
