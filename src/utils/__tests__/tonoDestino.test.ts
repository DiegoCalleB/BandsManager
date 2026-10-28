import { describe, it, expect } from 'vitest';
import { ajustarVelocidad, semitonosHasta } from '../tonoDestino';

describe('tono destino', () => {
  it('lleva una tónica a otra por el camino más corto', () => {
    expect(semitonosHasta(4, 7)).toBe(3); // E → G
    expect(semitonosHasta(4, 0)).toBe(-4); // E → C
    expect(semitonosHasta(0, 6)).toBe(6);
    expect(semitonosHasta(5, 5)).toBe(0);
    expect(semitonosHasta(11, 1)).toBe(2); // B → C#
  });

  it('la velocidad queda en pasos del 5 % dentro del rango', () => {
    expect(ajustarVelocidad(0.73)).toBe(0.75);
    expect(ajustarVelocidad(0.1)).toBe(0.5);
    expect(ajustarVelocidad(3)).toBe(1.25);
    expect(ajustarVelocidad(0.9)).toBe(0.9);
  });
});
