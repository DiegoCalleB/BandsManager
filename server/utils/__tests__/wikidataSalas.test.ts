import { describe, it, expect } from 'vitest';
import { consultaWikidata, fichasDeWikidata, puntoDeWkt, type FilaWikidata } from '../wikidataSalas.js';

const v = (value: string) => ({ value });
const fila = (o: Partial<Record<keyof FilaWikidata, string>>): FilaWikidata =>
  Object.fromEntries(Object.entries({ item: 'http://www.wikidata.org/entity/Q1', itemLabel: 'Sala Moby', ciudadLabel: 'Madrid', ...o }).map(([k, x]) => [k, v(x as string)])) as FilaWikidata;

describe('fichasDeWikidata', () => {
  it('convierte una fila en ficha con ciudad, comunidad, web, aforo y punto', () => {
    const [f] = fichasDeWikidata([fila({ ccaaLabel: 'Comunidad de Madrid', web: 'https://moby.es', aforo: '300', coord: 'Point(-3.7 40.42)' })], 'sala');
    expect(f.campos).toMatchObject({ nombre: 'Sala Moby', ciudad: 'Madrid', region: 'Comunidad de Madrid', tipo: 'sala', aforo: 300, website: 'https://moby.es/', email_contacto: null, telefono: null });
    expect(f.punto).toEqual({ lat: 40.42, lon: -3.7 });
  });

  it('los festivales entran como tipo festival, aunque tengan mucho aforo', () => {
    const [f] = fichasDeWikidata([fila({ itemLabel: 'Resurrection Fest', ciudadLabel: 'Viveiro', aforo: '35000' })], 'festival');
    expect(f.campos).toMatchObject({ tipo: 'festival', aforo: 35000 });
  });

  it('una sala de estadio o pabellón no entra', () => {
    expect(fichasDeWikidata([fila({ itemLabel: 'Pabellón Grande', aforo: '15000' })], 'sala')).toEqual([]);
  });

  it('sin nombre legible (solo el código Q) o sin ciudad no entra', () => {
    expect(fichasDeWikidata([fila({ itemLabel: 'Q123456' }), fila({ item: 'http://www.wikidata.org/entity/Q2', ciudadLabel: '' })], 'sala')).toEqual([]);
    expect(fichasDeWikidata([fila({ ciudadLabel: 'Q99' })], 'sala')).toEqual([]);
  });

  it('un elemento repetido en varias filas da una sola ficha, con los datos que falten completados', () => {
    const r = fichasDeWikidata([fila({}), fila({ web: 'https://moby.es' })], 'sala');
    expect(r).toHaveLength(1);
    expect(r[0].campos.website).toBe('https://moby.es/');
  });

  it('descarta una web que no es http(s)', () => {
    expect(fichasDeWikidata([fila({ web: 'javascript:alert(1)' })], 'sala')[0].campos.website).toBeNull();
  });
});

describe('puntoDeWkt', () => {
  it('lee Point(lon lat) y descarta puntos fuera de España o mal formados', () => {
    expect(puntoDeWkt('Point(2.17 41.38)')).toEqual({ lat: 41.38, lon: 2.17 });
    expect(puntoDeWkt('Point(-15.4 28.1)')).toEqual({ lat: 28.1, lon: -15.4 });
    expect(puntoDeWkt('Point(2.35 48.85)')).toBeNull();
    expect(puntoDeWkt('nada')).toBeNull();
    expect(puntoDeWkt(undefined)).toBeNull();
  });
});

describe('consultaWikidata', () => {
  it('pide festivales o salas de España y excluye los cerrados o terminados', () => {
    const f = consultaWikidata('festival');
    expect(f).toContain('wd:Q868557');
    expect(f).toContain('wdt:P17 wd:Q29');
    for (const p of ['P576', 'P3999', 'P582']) expect(f).toContain(`FILTER NOT EXISTS { ?item wdt:${p} [] }`);
    expect(consultaWikidata('sala')).toContain('wd:Q8719053');
    expect(consultaWikidata('sala')).not.toContain('wd:Q868557');
  });
});
