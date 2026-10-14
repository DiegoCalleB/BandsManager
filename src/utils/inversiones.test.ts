import { describe, it, expect } from 'vitest';
import { inversionRecomendada, inversionesDe, vozTeclado } from './inversiones';

describe('inversiones', () => {
  it('apila la voz hacia arriba empezando por el bajo', () => {
    expect(vozTeclado([0, 4, 7], 0)).toEqual([0, 4, 7]);
    expect(vozTeclado([0, 4, 7], 1)).toEqual([4, 7, 12]);
    expect(vozTeclado([0, 4, 7], 2)).toEqual([7, 12, 16]);
    expect(vozTeclado([7, 11, 2, 5], 3)).toEqual([5, 7, 11, 14]);
  });
  it('tríada = 3 inversiones, con 7.ª = 4, y un «C/E» fija la suya', () => {
    expect(inversionesDe('C')).toEqual({ total: 3, fija: null });
    expect(inversionesDe('G7')).toEqual({ total: 4, fija: null });
    expect(inversionesDe('C/E')).toEqual({ total: 3, fija: 1 });
    expect(inversionesDe('???').total).toBe(0);
  });
  it('recomienda la que menos mueve la mano desde el acorde anterior', () => {
    expect(inversionRecomendada('G')).toBe(0);
    // Do → Sol: la 2.ª inversión de Sol (re–sol–si) casi no mueve la mano; la fundamental salta.
    expect(inversionRecomendada('G', 'C')).not.toBe(0);
    expect(inversionRecomendada('C/E', 'G')).toBe(1);
  });
});
