import { describe, it, expect } from 'vitest';
import { analizarArte } from '../papel';
import { contraste, luminancia } from '../contraste';

type RGB = [number, number, number];
const hexARgb = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

/** Ilustración sintética: `papel` de fondo y un motivo `tinta` en el centro (opcionalmente hasta el borde). */
function arte(ancho: number, alto: number, papel: RGB, motivo: RGB | null, aBorde = false) {
  const d = new Uint8ClampedArray(ancho * alto * 4);
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      // `aBorde`: además del motivo central, una franja que cruza el cartel y llega al borde de abajo.
      const dentro = (aBorde && y > alto * 0.85) || (x > ancho * 0.25 && x < ancho * 0.75 && y > alto * 0.25 && y < alto * 0.75);
      d.set([...(motivo && dentro ? motivo : papel), 255], (y * ancho + x) * 4);
    }
  }
  return d;
}
const CREMA: RGB = [238, 230, 211];
const GRANATE: RGB = [160, 52, 48];
const AZUL_PETROLEO: RGB = [34, 96, 108];

describe('analizarArte', () => {
  it('un motivo sobre un papel liso: el papel es el del borde y se puede fundir', () => {
    const r = analizarArte(arte(80, 60, CREMA, GRANATE), 80, 60);
    expect(r.limpio).toBe(true);
    expect(hexARgb(r.papel)).toEqual(CREMA);
  });

  it('la tinta sale del motivo, con color y con contraste ≥ 7:1 sobre el papel', () => {
    const r = analizarArte(arte(80, 60, CREMA, GRANATE), 80, 60);
    expect(r.tinta).not.toBeNull();
    const [tr, tg, tb] = hexARgb(r.tinta!);
    expect(tr).toBeGreaterThan(tb); // sigue siendo un rojo, no un negro
    expect(contraste(luminancia(tr, tg, tb), luminancia(...CREMA))).toBeGreaterThanOrEqual(7);
  });

  it('un motivo que llega al borde no se puede fundir: se enmarca', () => {
    expect(analizarArte(arte(80, 60, CREMA, GRANATE, true), 80, 60).limpio).toBe(false);
  });

  it('un papel oscuro también vale, y la tinta se aclara hasta contrastar', () => {
    const NEGRO: RGB = [22, 22, 26];
    const AZUL: RGB = [40, 60, 150];
    const r = analizarArte(arte(80, 60, NEGRO, AZUL), 80, 60);
    expect(r.limpio).toBe(true);
    if (r.tinta) {
      const [a, b, c] = hexARgb(r.tinta);
      expect(contraste(luminancia(a, b, c), luminancia(...NEGRO))).toBeGreaterThanOrEqual(7);
    }
  });

  it('sin color (solo papel, o un motivo gris) no hay tinta: se usa la de siempre', () => {
    expect(analizarArte(arte(80, 60, CREMA, null), 80, 60).tinta).toBeNull();
    expect(analizarArte(arte(80, 60, CREMA, [90, 90, 90]), 80, 60).tinta).toBeNull();
  });

  it('un motivo demasiado claro para leerse sobre el papel no da tinta', () => {
    expect(analizarArte(arte(80, 60, CREMA, [250, 215, 120]), 80, 60).tinta).toBeNull();
  });

  it('imágenes diminutas o vacías no rompen nada: se enmarcan', () => {
    expect(analizarArte(new Uint8ClampedArray(0), 0, 0).limpio).toBe(false);
    expect(analizarArte(arte(4, 4, CREMA, GRANATE), 4, 4).limpio).toBe(false);
  });

  it('un papel con grano (ruido) sigue siendo papel limpio', () => {
    const d = arte(80, 60, CREMA, GRANATE);
    let s = 7;
    for (let i = 0; i < d.length; i += 4) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const n = (s % 17) - 8;
      d[i] = Math.max(0, Math.min(255, d[i] + n));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
    }
    expect(analizarArte(d, 80, 60).limpio).toBe(true);
  });

  it('con dos tintas distintas en el arte, la segunda sale de otro tono y se ve sobre el papel', () => {
    const d = arte(120, 80, CREMA, GRANATE);
    // Un segundo motivo en otro tono (azul petróleo), con presencia propia.
    for (let y = 30; y < 50; y++) for (let x = 78; x < 100; x++) d.set([...AZUL_PETROLEO, 255], (y * 120 + x) * 4);
    const r = analizarArte(d, 120, 80);
    expect(r.tinta2).not.toBeNull();
    expect(r.tinta2).not.toBe(r.tinta);
    const [a, b, c] = hexARgb(r.tinta2!);
    expect(b + c).toBeGreaterThan(a * 2 * 0.8); // sigue siendo el azul, no el rojo
    expect(contraste(luminancia(a, b, c), luminancia(...CREMA))).toBeGreaterThanOrEqual(2.2);
  });

  it('con una sola tinta no hay segunda', () => {
    expect(analizarArte(arte(80, 60, CREMA, GRANATE), 80, 60).tinta2).toBeNull();
  });

  it('dos tonos casi iguales no cuentan como dos tintas', () => {
    const d = arte(120, 80, CREMA, GRANATE);
    for (let y = 30; y < 50; y++) for (let x = 78; x < 100; x++) d.set([172, 60, 40, 255], (y * 120 + x) * 4);
    expect(analizarArte(d, 120, 80).tinta2).toBeNull();
  });
});
