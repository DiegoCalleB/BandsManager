import { describe, it, expect } from 'vitest';
import { palabrasDeGenero, regionNormalizada, sugerirSalas, SUGERENCIAS_MAXIMO } from '../sugerenciasCatalogo.js';
import type { SalaGuardada } from '../../services/catalogoSalas.js';

const sala = (o: Partial<SalaGuardada> & { id: string; nombre: string }): SalaGuardada => ({
  clave: `nc:${o.nombre.toLowerCase()}|${(o.ciudad ?? 'Madrid').toLowerCase()}`,
  place_id: null,
  ciudad: 'Madrid',
  region: 'Comunidad de Madrid',
  direccion: null,
  tipo: 'sala',
  aforo: 300,
  genero: 'Rock',
  website: null,
  instagram: null,
  email_contacto: 'booking@ejemplo.es',
  telefono: null,
  nivel: 'sin_verificar',
  puntuacion: 10,
  verificada_en: null,
  bandas_con_respuesta: 0,
  bandas_con_entrega: 0,
  rebotes: 0,
  no_contactar: false,
  ...o,
});
const NADA = { ids: new Set<string>(), claves: new Set<string>() };
const ids = (r: Array<{ id: string }>) => r.map((s) => s.id);

describe('regionNormalizada', () => {
  it('trata «Comunidad de Madrid», «Madrid» y «Galicia (Lugo)» como lo que son', () => {
    expect(regionNormalizada('Comunidad de Madrid')).toBe('madrid');
    expect(regionNormalizada('Madrid')).toBe('madrid');
    expect(regionNormalizada('Galicia (Lugo)')).toBe('galicia');
    expect(regionNormalizada('Galicia (A Coruña)')).toBe('galicia');
    expect(regionNormalizada(null)).toBe('');
  });
});

describe('palabrasDeGenero', () => {
  it('se queda con las palabras que dicen algo', () => {
    expect([...palabrasDeGenero('Rock / Ska y Música en Directo')].sort()).toEqual(['rock', 'ska']);
  });
});

describe('sugerirSalas', () => {
  const salas = [
    sala({ id: 'madrid-rock', nombre: 'A', genero: 'Rock / Punk' }),
    sala({ id: 'madrid-jazz', nombre: 'B', genero: 'Jazz' }),
    sala({ id: 'vigo-rock', nombre: 'C', ciudad: 'Vigo', region: 'Galicia (Pontevedra)', genero: 'Rock' }),
    sala({ id: 'galicia-otra', nombre: 'D', ciudad: 'Lugo', region: 'Galicia (Lugo)', genero: 'Folk' }),
    sala({ id: 'bilbao-pop', nombre: 'E', ciudad: 'Bilbao', region: 'País Vasco', genero: 'Pop' }),
    sala({ id: 'nc', nombre: 'F', no_contactar: true, genero: 'Rock', nivel: 'verificada', puntuacion: 99 }),
  ];

  it('prioriza la ciudad y luego el género; sin cercanía ni afinidad no sugiere nada', () => {
    const r = sugerirSalas(salas, { ciudad: 'Madrid, España', genero: 'Rock' }, NADA);
    expect(ids(r)).toEqual(['madrid-rock', 'madrid-jazz', 'vigo-rock']);
    expect(ids(r)).not.toContain('bilbao-pop');
  });

  it('usa la región de la ciudad de la banda, sacada del propio catálogo', () => {
    const r = sugerirSalas(salas, { ciudad: 'Vigo', genero: 'Folk' }, NADA);
    expect(ids(r)[0]).toBe('vigo-rock');
    expect(ids(r)).toContain('galicia-otra');
    expect(r.find((s) => s.id === 'galicia-otra')?.motivos).toEqual(expect.arrayContaining(['En tu zona', 'Programa tu género']));
  });

  it('explica el porqué en palabras llanas', () => {
    const [primera] = sugerirSalas(salas, { ciudad: 'Madrid', genero: 'Rock' }, NADA);
    expect(primera.motivos).toEqual(['En tu ciudad', 'Programa tu género']);
  });

  it('con solo el género (sin ciudad) sigue sugiriendo por afinidad', () => {
    expect(ids(sugerirSalas(salas, { ciudad: '', genero: 'Pop' }, NADA))).toEqual(['bilbao-pop']);
  });

  it('nunca sugiere una sala que la banda ya tiene ni una marcada «no contactar»', () => {
    const r = sugerirSalas(salas, { ciudad: 'Madrid', genero: 'Rock' }, { ids: new Set(['madrid-rock']), claves: new Set([salas[2].clave]) });
    expect(ids(r)).not.toContain('madrid-rock');
    expect(ids(r)).not.toContain('vigo-rock');
    expect(ids(r)).not.toContain('nc');
  });

  it('a igual cercanía, gana la más fiable', () => {
    const dos = [sala({ id: 'floja', nombre: 'Z', genero: 'Rock' }), sala({ id: 'buena', nombre: 'Y', genero: 'Rock', nivel: 'probable', puntuacion: 60, bandas_con_respuesta: 2 })];
    const r = sugerirSalas(dos, { ciudad: 'Madrid', genero: 'Rock' }, NADA);
    expect(ids(r)).toEqual(['buena', 'floja']);
    expect(r[0].motivos).toContain('Otras bandas ya recibieron respuesta');
  });

  it('acota el número de sugerencias', () => {
    const muchas = Array.from({ length: 40 }, (_, i) => sala({ id: `s${i}`, nombre: `S${i}` }));
    expect(sugerirSalas(muchas, { ciudad: 'Madrid', genero: '' }, NADA, 5)).toHaveLength(5);
    expect(sugerirSalas(muchas, { ciudad: 'Madrid', genero: '' }, NADA, 999)).toHaveLength(SUGERENCIAS_MAXIMO);
  });

  it('la sugerencia no lleva email ni teléfono', () => {
    const volcado = JSON.stringify(sugerirSalas([sala({ id: 'a', nombre: 'A', telefono: '910000000' })], { ciudad: 'Madrid', genero: '' }, NADA));
    expect(volcado).not.toContain('booking@ejemplo.es');
    expect(volcado).not.toContain('910000000');
  });
});
