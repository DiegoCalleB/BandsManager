import { describe, it, expect } from 'vitest';
import { sugerenciaApoyoCents, APOYO_MIN_CENTS, APOYO_MAX_CENTS } from '../dealSupport';

describe('sugerenciaApoyoCents', () => {
  it('sugiere un 3% del caché redondeado al euro', () => {
    expect(sugerenciaApoyoCents(600)).toBe(1800); // 18 €
    expect(sugerenciaApoyoCents(1000)).toBe(3000);
    expect(sugerenciaApoyoCents(250)).toBe(800); // 7,5 → 8 €
  });

  it('nunca baja de 2 € ni sube de 100 €', () => {
    expect(sugerenciaApoyoCents(50)).toBe(200);
    expect(sugerenciaApoyoCents(0)).toBe(200);
    expect(sugerenciaApoyoCents(100000)).toBe(10000);
  });

  it('es robusta ante basura (NaN, negativos, texto)', () => {
    expect(sugerenciaApoyoCents(NaN)).toBe(200);
    expect(sugerenciaApoyoCents(-500)).toBe(200);
    expect(sugerenciaApoyoCents('abc' as any)).toBe(200);
  });

  it('la sugerencia siempre cabe en el rango del checkout y es un número de euros enteros', () => {
    for (const t of [0, 10, 99, 500, 1234.56, 99999]) {
      const c = sugerenciaApoyoCents(t);
      expect(c).toBeGreaterThanOrEqual(APOYO_MIN_CENTS);
      expect(c).toBeLessThanOrEqual(APOYO_MAX_CENTS);
      expect(c % 100).toBe(0);
    }
  });
});
