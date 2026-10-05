import { describe, it, expect } from 'vitest';
import {
  sugerenciaApoyoCents,
  normalizarApoyoPorcentaje,
  apoyoCentsDePorcentaje,
  apoyoPropuestoCents,
  APOYO_MIN_CENTS,
  APOYO_MAX_CENTS
} from '../dealSupport';

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

describe('porcentaje de apoyo elegido por la banda', () => {
  it('normalizarApoyoPorcentaje: null/basura = no eligió; acota a 0-20 en pasos de 0,5', () => {
    expect(normalizarApoyoPorcentaje(undefined)).toBeNull();
    expect(normalizarApoyoPorcentaje(null)).toBeNull();
    expect(normalizarApoyoPorcentaje('')).toBeNull();
    expect(normalizarApoyoPorcentaje('abc')).toBeNull();
    expect(normalizarApoyoPorcentaje(NaN)).toBeNull();
    expect(normalizarApoyoPorcentaje(0)).toBe(0);
    expect(normalizarApoyoPorcentaje('3')).toBe(3);
    expect(normalizarApoyoPorcentaje(2.74)).toBe(2.5);
    expect(normalizarApoyoPorcentaje(-5)).toBe(0);
    expect(normalizarApoyoPorcentaje(999)).toBe(20);
  });

  it('apoyoCentsDePorcentaje: % del caché al euro, dentro del rango del checkout', () => {
    expect(apoyoCentsDePorcentaje(600, 5)).toBe(3000);
    expect(apoyoCentsDePorcentaje(500, 3)).toBe(1500);
    expect(apoyoCentsDePorcentaje(100, 0.5)).toBe(APOYO_MIN_CENTS); // 0,5 € -> mínimo 1 €
    expect(apoyoCentsDePorcentaje(1_000_000, 20)).toBe(APOYO_MAX_CENTS);
  });

  it('0 % o caché sin valor = no se propone nada', () => {
    expect(apoyoCentsDePorcentaje(600, 0)).toBe(0);
    expect(apoyoCentsDePorcentaje(0, 5)).toBe(0);
    expect(apoyoCentsDePorcentaje(NaN, 5)).toBe(0);
  });

  it('apoyoPropuestoCents: sin elección usa la sugerencia por defecto; con elección, la de la banda', () => {
    expect(apoyoPropuestoCents(600, null)).toBe(sugerenciaApoyoCents(600));
    expect(apoyoPropuestoCents(600, undefined)).toBe(sugerenciaApoyoCents(600));
    expect(apoyoPropuestoCents(600, 5)).toBe(3000);
    expect(apoyoPropuestoCents(600, 0)).toBe(0);
  });
});
