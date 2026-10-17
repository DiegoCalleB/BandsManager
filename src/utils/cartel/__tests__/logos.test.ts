import { describe, it, expect } from 'vitest';
import { conDesgasteDeTinta, mascaraDeLogo, rgbDeHex, semillaDeLogo } from '../logos';

/** Imagen sintética de `ancho`×`alto`: `pintar(x, y)` devuelve [r, g, b, a]. */
function imagen(ancho: number, alto: number, pintar: (x: number, y: number) => [number, number, number, number]) {
  const d = new Uint8ClampedArray(ancho * alto * 4);
  for (let y = 0; y < alto; y++) for (let x = 0; x < ancho; x++) d.set(pintar(x, y), (y * ancho + x) * 4);
  return d;
}
const dentro = (x: number, y: number) => x >= 8 && x < 22 && y >= 8 && y < 22;
const en = (m: Uint8ClampedArray, ancho: number, x: number, y: number) => m[y * ancho + x];

describe('mascaraDeLogo', () => {
  it('un logo con transparencia usa su alfa: la forma es lo opaco, sea del color que sea', () => {
    const d = imagen(30, 30, (x, y) => (dentro(x, y) ? [200, 30, 30, 255] : [0, 0, 0, 0]));
    const m = mascaraDeLogo(d, 30, 30);
    expect(en(m, 30, 15, 15)).toBe(255);
    expect(en(m, 30, 2, 2)).toBe(0);
  });

  it('un logo oscuro sobre fondo blanco (JPEG) saca la forma del contraste', () => {
    const d = imagen(30, 30, (x, y) => (dentro(x, y) ? [20, 20, 20, 255] : [255, 255, 255, 255]));
    const m = mascaraDeLogo(d, 30, 30);
    expect(en(m, 30, 15, 15)).toBeGreaterThan(240);
    expect(en(m, 30, 2, 2)).toBe(0);
  });

  it('un logo claro sobre fondo negro también: se invierte solo', () => {
    const d = imagen(30, 30, (x, y) => (dentro(x, y) ? [240, 240, 240, 255] : [10, 10, 10, 255]));
    const m = mascaraDeLogo(d, 30, 30);
    expect(en(m, 30, 15, 15)).toBeGreaterThan(240);
    expect(en(m, 30, 2, 2)).toBe(0);
  });

  it('un logo gris sobre blanco no sale pálido: el contraste se normaliza', () => {
    const d = imagen(30, 30, (x, y) => (dentro(x, y) ? [128, 128, 128, 255] : [255, 255, 255, 255]));
    expect(en(mascaraDeLogo(d, 30, 30), 30, 15, 15)).toBeGreaterThan(150);
  });

  it('una imagen de un solo color no deja tinta en ninguna parte', () => {
    const m = mascaraDeLogo(imagen(10, 10, () => [255, 255, 255, 255]), 10, 10);
    expect(Array.from(m).every((v) => v === 0)).toBe(true);
  });

  it('una imagen vacía da una máscara vacía y las del tamaño justo, sin salirse', () => {
    expect(mascaraDeLogo(new Uint8ClampedArray(0), 0, 0)).toHaveLength(0);
    expect(mascaraDeLogo(imagen(7, 5, () => [0, 0, 0, 255]), 7, 5)).toHaveLength(35);
  });
});

describe('conDesgasteDeTinta', () => {
  const base = new Uint8ClampedArray(1000).fill(255);

  it('es determinista: la misma semilla da el mismo desgaste', () => {
    expect(Array.from(conDesgasteDeTinta(base, 7))).toEqual(Array.from(conDesgasteDeTinta(base, 7)));
    expect(Array.from(conDesgasteDeTinta(base, 7))).not.toEqual(Array.from(conDesgasteDeTinta(base, 8)));
  });

  it('nunca borra la forma: deja al menos el 80 % de la tinta y no inventa tinta donde no la hay', () => {
    const r = conDesgasteDeTinta(base, 3);
    expect(Math.min(...r)).toBeGreaterThanOrEqual(204);
    expect(Math.max(...r)).toBeLessThanOrEqual(255);
    expect(Array.from(conDesgasteDeTinta(new Uint8ClampedArray(50), 3)).every((v) => v === 0)).toBe(true);
  });
});

describe('utilidades', () => {
  it('rgbDeHex lee #RRGGBB', () => {
    expect(rgbDeHex('#17181C')).toEqual([0x17, 0x18, 0x1c]);
    expect(rgbDeHex('#F4F1EA')).toEqual([244, 241, 234]);
  });

  it('el desgaste de un logo es el mismo con o sin la versión de la URL', () => {
    expect(semillaDeLogo('https://x/a.png?v=1')).toBe(semillaDeLogo('https://x/a.png?v=999'));
    expect(semillaDeLogo('https://x/a.png')).not.toBe(semillaDeLogo('https://x/b.png'));
  });
});
