import { describe, it, expect } from 'vitest';
import { columnasRellenando, claseColumnas } from '../rellenarFila';

describe('columnasRellenando', () => {
  it('estira el último widget de una fila que no suma 12', () => {
    expect(columnasRellenando([3, 4, 4])).toEqual([3, 4, 5]);
  });

  it('deja igual una fila que ya suma 12', () => {
    expect(columnasRellenando([6, 6])).toEqual([6, 6]);
    expect(columnasRellenando([4, 4, 4])).toEqual([4, 4, 4]);
  });

  it('cierra cada fila con su último widget', () => {
    // 3+4+4 = 11 | 6+4 = 10 | 3 solo
    expect(columnasRellenando([3, 4, 4, 6, 4, 3])).toEqual([3, 4, 5, 6, 6, 12]);
  });

  it('un widget que no cabe pasa a la fila siguiente y la anterior se rellena', () => {
    expect(columnasRellenando([8, 6])).toEqual([12, 12]);
  });

  it('un widget solo ocupa toda la fila y sin widgets no hay nada', () => {
    expect(columnasRellenando([4])).toEqual([12]);
    expect(columnasRellenando([])).toEqual([]);
  });

  it('la suma de cada fila es siempre 12', () => {
    const anchos = [3, 3, 3, 4, 8, 6, 3, 4, 12, 4, 6, 3];
    const filas = columnasRellenando(anchos);
    let suma = 0;
    for (const c of filas) {
      suma += c;
      expect(suma).toBeLessThanOrEqual(12);
      if (suma === 12) suma = 0;
    }
    expect(suma).toBe(0);
  });
});

describe('claseColumnas', () => {
  it('devuelve la clase literal y acota fuera de rango', () => {
    expect(claseColumnas(5)).toBe('md:col-span-5');
    expect(claseColumnas(0)).toBe('md:col-span-1');
    expect(claseColumnas(20)).toBe('md:col-span-12');
  });
});
