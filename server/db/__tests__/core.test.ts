import { describe, it, expect } from 'vitest';
import { cleanBandId, normalizePlan } from '../core';

describe('cleanBandId: filtro de tenant de la capa de datos', () => {
  it('devuelve el bandId recortado cuando es válido', () => {
    expect(cleanBandId('band-la-vanda')).toBe('band-la-vanda');
    expect(cleanBandId('  band-la-vanda  ')).toBe('band-la-vanda');
  });

  it('lanza en vez de caer en band-bakandeya cuando falta el bandId', () => {
    // Antes: un bandId vacío devolvía "band-bakandeya" en silencio, así que un bug o una ruta
    // nueva que se olvidara de pasarlo acababa leyendo o escribiendo en la banda insignia.
    expect(() => cleanBandId(undefined)).toThrow();
    expect(() => cleanBandId('')).toThrow();
    expect(() => cleanBandId('   ')).toThrow();
  });

  it('lanza con un tipo que no es string', () => {
    expect(() => cleanBandId(null as any)).toThrow();
    expect(() => cleanBandId(123 as any)).toThrow();
  });
});

describe('normalizePlan', () => {
  it('normaliza variantes conocidas', () => {
    expect(normalizePlan('pro')).toBe('de_gira');
    expect(normalizePlan('elite')).toBe('cabeza_de_cartel');
    expect(normalizePlan('local')).toBe('local');
  });

  it('cae a ensayo con valores desconocidos o vacíos', () => {
    expect(normalizePlan(undefined)).toBe('ensayo');
    expect(normalizePlan('algo-raro')).toBe('ensayo');
  });
});
