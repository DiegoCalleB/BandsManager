import { describe, it, expect } from 'vitest';
import { motasDeTinta } from '../tintaImpresa';

describe('motasDeTinta', () => {
  it('es determinista por semilla', () => {
    expect(motasDeTinta(600, 300, 1, 5)).toEqual(motasDeTinta(600, 300, 1, 5));
    expect(motasDeTinta(600, 300, 1, 5)).not.toEqual(motasDeTinta(600, 300, 1, 6));
  });

  it('quita poca tinta: las motas cubren como mucho unos pocos puntos por ciento del título', () => {
    const w = 800;
    const h = 300;
    const cubierto = motasDeTinta(w, h, 1, 9).reduce((s, m) => s + Math.PI * m.r * m.r * m.a, 0);
    expect(cubierto / (w * h)).toBeLessThan(0.06);
    expect(cubierto).toBeGreaterThan(0);
  });

  it('con el lienzo más grande hay más motas pero la misma proporción (se ve igual en el A4)', () => {
    const peq = motasDeTinta(600, 300, 1, 3);
    const grande = motasDeTinta(2400, 1200, 4, 3);
    const prop = (ms: typeof peq, w: number, h: number) => ms.reduce((s, m) => s + Math.PI * m.r * m.r * m.a, 0) / (w * h);
    expect(Math.abs(prop(peq, 600, 300) - prop(grande, 2400, 1200))).toBeLessThan(0.02);
  });

  it('todas las motas caen dentro de la capa', () => {
    for (const m of motasDeTinta(300, 120, 1, 2)) {
      expect(m.x).toBeGreaterThanOrEqual(0);
      expect(m.x).toBeLessThanOrEqual(300);
      expect(m.y).toBeLessThanOrEqual(120);
    }
  });
});
