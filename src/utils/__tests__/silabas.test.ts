import { describe, it, expect } from 'vitest';
import { silabas } from '../silabas';

describe('silabas', () => {
  it.each([
    ['máquina', ['má', 'qui', 'na']],
    ['funcionó', ['fun', 'cio', 'nó']],
    ['imaginación', ['i', 'ma', 'gi', 'na', 'ción']],
    ['padres', ['pa', 'dres']],
    ['tarjetas', ['tar', 'je', 'tas']],
    ['metralleta', ['me', 'tra', 'lle', 'ta']],
    ['revolotean', ['re', 'vo', 'lo', 'te', 'an']],
    ['casa', ['ca', 'sa']],
    ['wild', ['wild']],
    ['veneno', ['ve', 'ne', 'no']],
    ['día', ['dí', 'a']],
  ])('%s', (palabra, esperado) => {
    expect(silabas(palabra)).toEqual(esperado);
  });

  it('nunca pierde ni añade letras', () => {
    for (const w of ['bajarinos', 'envuelta', 'deudas', 'rojos', 'Hijos', 'trabajo', 'coche']) expect(silabas(w).join('')).toBe(w);
  });
});
