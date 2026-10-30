import { describe, it, expect } from 'vitest';
import { TINTAS_SERIGRAFIA, serigrafiar } from '../serigrafia';

/** Degradado de dos colores con un acento: algo parecido a una ilustración continua. */
function ilustracion(ancho: number, alto: number) {
  const d = new Uint8ClampedArray(ancho * alto * 4);
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const t = x / ancho;
      const acento = x > ancho * 0.6 && y > alto * 0.5;
      const c = acento ? [220, 110, 30] : [Math.round(20 + 90 * t), Math.round(30 + 60 * t), Math.round(60 + 80 * (1 - t))];
      d.set([...c, 255], (y * ancho + x) * 4);
    }
  }
  return d;
}
const colores = (d: Uint8ClampedArray) => new Set(Array.from({ length: d.length / 4 }, (_, i) => `${d[i * 4]},${d[i * 4 + 1]},${d[i * 4 + 2]}`));

describe('serigrafiar', () => {
  it('reduce la ilustración a unas pocas tintas planas (más el papel a la vista en el desregistro)', () => {
    const d = ilustracion(120, 160);
    const antes = colores(d).size;
    const tintas = serigrafiar(d, 120, 160, { semilla: 1, escala: 1 });
    expect(tintas.length).toBeLessThanOrEqual(TINTAS_SERIGRAFIA);
    expect(antes).toBeGreaterThan(60);
    // Cada tinta, su versión impresa sobre papel y la franja de desregistro: muy pocos colores.
    expect(colores(d).size).toBeLessThanOrEqual(TINTAS_SERIGRAFIA * 2);
  });

  it('es determinista: la misma semilla da el mismo cartel y otra semilla, otras tintas', () => {
    const a = ilustracion(80, 100);
    const b = ilustracion(80, 100);
    const c = ilustracion(80, 100);
    serigrafiar(a, 80, 100, { semilla: 7, escala: 1 });
    serigrafiar(b, 80, 100, { semilla: 7, escala: 1 });
    serigrafiar(c, 80, 100, { semilla: 8, escala: 1 });
    expect(Array.from(a)).toEqual(Array.from(b));
    expect(Array.from(a)).not.toEqual(Array.from(c));
  });

  it('deja todo opaco y respeta el tamaño', () => {
    const d = ilustracion(60, 60);
    serigrafiar(d, 60, 60, { semilla: 3, escala: 0.5 });
    expect(d).toHaveLength(60 * 60 * 4);
    for (let i = 3; i < d.length; i += 4) expect(d[i]).toBe(255);
  });

  it('las tintas salen de la más oscura a la más clara y el acento naranja no se pierde', () => {
    const tintas = serigrafiar(ilustracion(120, 160), 120, 160, { semilla: 2, escala: 1 });
    for (let i = 1; i < tintas.length; i++) {
      expect(0.299 * tintas[i][0] + 0.587 * tintas[i][1] + 0.114 * tintas[i][2]).toBeGreaterThanOrEqual(0.299 * tintas[i - 1][0] + 0.587 * tintas[i - 1][1] + 0.114 * tintas[i - 1][2]);
    }
    expect(tintas.some((t) => t[0] - t[2] > 80)).toBe(true);
  });

  it('una imagen lisa o vacía no rompe nada', () => {
    const lisa = new Uint8ClampedArray(20 * 20 * 4).fill(255);
    expect(() => serigrafiar(lisa, 20, 20, { semilla: 1, escala: 1 })).not.toThrow();
    expect(serigrafiar(new Uint8ClampedArray(0), 0, 0, { semilla: 1, escala: 1 })).toEqual([]);
    expect(serigrafiar(new Uint8ClampedArray(10), 20, 20, { semilla: 1, escala: 1 })).toEqual([]);
  });
});
