import { describe, it, expect } from 'vitest';
import { decidirTinta, luminancia, contraste, medirLuz } from '../contraste';

const L_CLARA = 0.89;
const L_OSCURA = 0.011;
/** Contraste que queda en el peor píxel tras aplicar la decisión. */
function peorContraste(p10: number, p90: number) {
  const t = decidirTinta({ p10, p90 });
  if (t.tinta === 'clara') return contraste(L_CLARA, p90 * (1 - t.velo) + 0.005 * t.velo);
  return contraste(L_OSCURA, p10 * (1 - t.velo) + 0.88 * t.velo);
}

describe('contraste del cartel', () => {
  it('luminancia WCAG de los extremos', () => {
    expect(luminancia(255, 255, 255)).toBeCloseTo(1, 5);
    expect(luminancia(0, 0, 0)).toBe(0);
    expect(contraste(1, 0)).toBeCloseTo(21, 5);
  });

  it('fondo claro y liso: tinta oscura sin velo', () => {
    expect(decidirTinta({ p10: 0.85, p90: 0.9 })).toEqual({ tinta: 'oscura', velo: 0 });
  });

  it('fondo oscuro y liso: tinta clara sin velo', () => {
    expect(decidirTinta({ p10: 0.01, p90: 0.03 })).toEqual({ tinta: 'clara', velo: 0 });
  });

  it('foto con manchas claras y oscuras: siempre lleva velo', () => {
    expect(decidirTinta({ p10: 0.02, p90: 0.6 }).velo).toBeGreaterThan(0.2);
  });

  it('con poca diferencia prefiere oscurecer (tinta clara) a lechar', () => {
    expect(decidirTinta({ p10: 0.17, p90: 0.19 }).tinta).toBe('clara');
  });

  // La garantía: en cualquier fondo, el peor píxel queda a 4,5:1 o más (salvo el tope de velo).
  it('el peor píxel siempre queda legible', () => {
    for (let p10 = 0; p10 <= 1; p10 += 0.1) {
      for (let p90 = p10; p90 <= 1; p90 += 0.1) {
        expect(peorContraste(p10, p90), `p10=${p10.toFixed(1)} p90=${p90.toFixed(1)}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('el velo nunca tapa del todo el fondo', () => {
    expect(decidirTinta({ p10: 0, p90: 1 }).velo).toBeLessThanOrEqual(0.78);
  });

  it('mide percentiles de un trozo de imagen', () => {
    const px = new Uint8ClampedArray(4 * 100);
    for (let i = 0; i < 100; i++) px.fill(i < 50 ? 0 : 255, i * 4, i * 4 + 4);
    const l = medirLuz(px, 1);
    expect(l.p10).toBeLessThan(0.05);
    expect(l.p90).toBeGreaterThan(0.95);
    expect(medirLuz(new Uint8ClampedArray(0))).toEqual({ p10: 0, p90: 0 });
  });
});
