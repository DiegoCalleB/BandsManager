import { describe, expect, it } from 'vitest';
import { crecimientoNeto, diagnosticarPieza, estadoClicsEnlace } from '../diagnosticoMetricas';

describe('diagnosticarPieza', () => {
  it('distingue problema de valor y de descubrimiento', () => {
    expect(diagnosticarPieza({ alcance: 1000, guardados: 40, alcanceNoSeguidores: 500 }).veredicto).toBe('funciona');
    expect(diagnosticarPieza({ alcance: 1000, guardados: 5, alcanceNoSeguidores: 500 }).veredicto).toBe('falla_valor');
    expect(diagnosticarPieza({ alcance: 1000, guardados: 40, alcanceNoSeguidores: 100 }).veredicto).toBe('falla_descubrimiento');
    expect(diagnosticarPieza({ alcance: 1000, guardados: 5, alcanceNoSeguidores: 100 }).veredicto).toBe('falla_todo');
  });

  it('sin dato de no seguidores solo juzga el valor', () => {
    expect(diagnosticarPieza({ alcance: 1000, guardados: 40 }).veredicto).toBe('funciona');
    expect(diagnosticarPieza({ alcance: 1000, guardados: 5 }).veredicto).toBe('falla_valor');
  });

  it('con poco alcance no presume de saber nada', () => {
    expect(diagnosticarPieza({ alcance: 50, guardados: 10 }).veredicto).toBe('sin_datos');
    expect(diagnosticarPieza({ alcance: Number.NaN, guardados: 10 }).veredicto).toBe('sin_datos');
  });
});

describe('estadoClicsEnlace', () => {
  it('compara con la horquilla 0,5-2 % semanal', () => {
    expect(estadoClicsEnlace(2, 1000)).toBe('bajo');
    expect(estadoClicsEnlace(10, 1000)).toBe('sano');
    expect(estadoClicsEnlace(30, 1000)).toBe('alto');
    expect(estadoClicsEnlace(10, 0)).toBe('sin_datos');
  });
});

describe('crecimientoNeto', () => {
  it('resta las bajas', () => {
    expect(crecimientoNeto(1000, 50, 30)).toBeCloseTo(0.02);
    expect(crecimientoNeto(0, 5, 0)).toBeNull();
  });
});
