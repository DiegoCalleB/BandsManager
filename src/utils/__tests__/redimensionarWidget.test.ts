import { describe, it, expect } from 'vitest';
import { anchoDesdePixeles, altoDesdeDelta, pasoAncho, pasoAlto, PASO_ALTO_PX } from '../redimensionarWidget';

describe('anchoDesdePixeles', () => {
  it('ajusta al ancho de la rejilla más cercano', () => {
    expect(anchoDesdePixeles(1200, 1200)).toBe(12);
    expect(anchoDesdePixeles(600, 1200)).toBe(6);
    expect(anchoDesdePixeles(400, 1200)).toBe(4);
    expect(anchoDesdePixeles(310, 1200)).toBe(3);
    expect(anchoDesdePixeles(800, 1200)).toBe(8);
  });
  it('pasado de la rejilla o por debajo se queda en el extremo', () => {
    expect(anchoDesdePixeles(5000, 1200)).toBe(12);
    expect(anchoDesdePixeles(-50, 1200)).toBe(3);
  });
  it('sin rejilla medible no inventa: ancho completo', () => {
    expect(anchoDesdePixeles(500, 0)).toBe(12);
    expect(anchoDesdePixeles(500, NaN)).toBe(12);
  });
});

describe('altoDesdeDelta', () => {
  it('cada paso de arrastre cambia un nivel, con tope en los extremos', () => {
    expect(altoDesdeDelta('normal', 0)).toBe('normal');
    expect(altoDesdeDelta('normal', PASO_ALTO_PX)).toBe('tall');
    expect(altoDesdeDelta('normal', -PASO_ALTO_PX)).toBe('compact');
    expect(altoDesdeDelta('compact', 3 * PASO_ALTO_PX)).toBe('tall');
    expect(altoDesdeDelta('tall', -9 * PASO_ALTO_PX)).toBe('compact');
  });
  it('un arrastre pequeño no cambia nada', () => {
    expect(altoDesdeDelta('normal', PASO_ALTO_PX * 0.3)).toBe('normal');
  });
});

describe('pasos de teclado', () => {
  it('el ancho recorre la lista y se queda en los extremos', () => {
    expect(pasoAncho(6, 1)).toBe(8);
    expect(pasoAncho(6, -1)).toBe(4);
    expect(pasoAncho(12, 1)).toBe(12);
    expect(pasoAncho(3, -1)).toBe(3);
  });
  it('un ancho guardado raro parte del siguiente por arriba', () => {
    expect(pasoAncho(5, 1)).toBe(8);
    expect(pasoAncho(5, -1)).toBe(4);
  });
  it('el alto sin valor cuenta como normal', () => {
    expect(pasoAlto(undefined, 1)).toBe('tall');
    expect(pasoAlto('compact', -1)).toBe('compact');
    expect(pasoAlto('tall', 1)).toBe('tall');
  });
});
