import { describe, expect, it } from 'vitest';
import { slugZona, zonaDeSala } from '../geoEspana.js';

describe('zonaDeSala', () => {
  it.each([
    // Textos reales del catálogo: regiones escritas a mano en los leads.
    ['Comunidad de Madrid', 'Madrid', { comunidad: 'Comunidad de Madrid', provincia: 'Madrid' }],
    ['Madrid', 'Madrid', { comunidad: 'Comunidad de Madrid', provincia: 'Madrid' }],
    ['Galicia (A Coruña)', 'Santiago de Compostela', { comunidad: 'Galicia', provincia: 'A Coruña' }],
    ['Galicia (Pontevedra)', 'Vigo', { comunidad: 'Galicia', provincia: 'Pontevedra' }],
    ['Galicia (Ourense)', 'Ourense', { comunidad: 'Galicia', provincia: 'Ourense' }],
    ['Huelva', 'Huelva', { comunidad: 'Andalucía', provincia: 'Huelva' }],
    ['Cádiz', 'Jerez de la Frontera', { comunidad: 'Andalucía', provincia: 'Cádiz' }],
    ['Cáceres', 'Cáceres', { comunidad: 'Extremadura', provincia: 'Cáceres' }],
    ['León', 'León', { comunidad: 'Castilla y León', provincia: 'León' }],
    ['Bilbao', 'Bilbao', { comunidad: 'País Vasco', provincia: 'Bizkaia' }],
    ['País Vasco', 'Donostia', { comunidad: 'País Vasco', provincia: 'Gipuzkoa' }],
    ['País Vasco', 'Barakaldo', { comunidad: 'País Vasco', provincia: null }],
    ['Andalucía', 'Sevilla', { comunidad: 'Andalucía', provincia: 'Sevilla' }],
    ['Andalucía', 'Úbeda', { comunidad: 'Andalucía', provincia: null }],
    ['Aragón', 'Zaragoza', { comunidad: 'Aragón', provincia: 'Zaragoza' }],
    ['Cataluña', 'Sabadell', { comunidad: 'Cataluña', provincia: null }],
    ['Comunidad Valenciana', 'Castelló', { comunidad: 'Comunidad Valenciana', provincia: 'Castellón' }],
    ['Islas Baleares', 'Palma', { comunidad: 'Islas Baleares', provincia: 'Baleares' }],
    ['Región de Murcia', 'Cartagena', { comunidad: 'Región de Murcia', provincia: 'Murcia' }],
  ] as const)('%s / %s', (region, ciudad, esperado) => {
    expect(zonaDeSala(region, ciudad)).toEqual(esperado);
  });

  it('lo que no es España o no se entiende devuelve null, sin colocarlo a ojo', () => {
    expect(zonaDeSala('Lisboa', 'Lisboa')).toBeNull();
    expect(zonaDeSala(null, null)).toBeNull();
    expect(zonaDeSala('', '')).toBeNull();
    expect(zonaDeSala('Texas', 'Austin')).toBeNull();
  });

  it('una ciudad que contiene el nombre de otra no se confunde con ella', () => {
    // San Sebastián de los Reyes es de Madrid, no de Gipuzkoa.
    expect(zonaDeSala('Comunidad de Madrid', 'San Sebastián de los Reyes')).toEqual({ comunidad: 'Comunidad de Madrid', provincia: 'Madrid' });
    expect(zonaDeSala(null, 'San Sebastián de los Reyes')).toBeNull();
  });

  it('es insensible a tildes y mayúsculas', () => {
    expect(zonaDeSala('ANDALUCIA', null)).toEqual({ comunidad: 'Andalucía', provincia: null });
    expect(zonaDeSala(null, 'córdoba')).toEqual({ comunidad: 'Andalucía', provincia: 'Córdoba' });
  });
});

describe('slugZona', () => {
  it('da fragmentos de URL seguros', () => {
    expect(slugZona('Comunidad de Madrid')).toBe('comunidad-de-madrid');
    expect(slugZona('A Coruña')).toBe('a-coruna');
    expect(slugZona('Santa Cruz de Tenerife')).toBe('santa-cruz-de-tenerife');
    expect(slugZona("L'Hospitalet de Llobregat")).toMatch(/^[a-z0-9-]+$/);
  });
});
