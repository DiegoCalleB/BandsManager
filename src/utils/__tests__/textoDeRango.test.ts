import { describe, expect, it } from 'vitest';
import { textoDeRango } from '../textoDeRango';

describe('textoDeRango', () => {
  it('da el rango en texto corto', () => {
    expect(textoDeRango('2027-06-01', '2027-09-30')).toBe('1 jun 2027 – 30 sep 2027');
  });
  it('sin las dos fechas no hay rango', () => {
    expect(textoDeRango('2027-06-01', '')).toBe('');
    expect(textoDeRango(undefined, undefined)).toBe('');
  });
});
