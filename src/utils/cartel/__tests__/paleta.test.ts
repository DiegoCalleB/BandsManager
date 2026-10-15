import { describe, it, expect } from 'vitest';
import { paletaDePixeles, deHex, aHex, luzDeHex } from '../paleta';
import { contraste } from '../contraste';

/** Imagen sintética: bloques de color con transparente alrededor, como un logo. */
function imagen(bloques: Array<{ rgb: [number, number, number]; n: number }>, transparentes = 500, alfa = 255) {
  const total = bloques.reduce((a, b) => a + b.n, 0) + transparentes;
  const d = new Uint8ClampedArray(total * 4);
  let i = 0;
  for (let k = 0; k < transparentes; k++, i += 4) d.set([255, 255, 255, 0], i);
  for (const b of bloques) for (let k = 0; k < b.n; k++, i += 4) d.set([...b.rgb, alfa], i);
  return d;
}

describe('paletaDePixeles', () => {
  it('un logo rojo sobre transparente da un fondo rojizo oscuro y un acento claro de otro tono', () => {
    const p = paletaDePixeles(imagen([{ rgb: [220, 40, 40], n: 800 }]), 1)!;
    expect(p).not.toBeNull();
    const [r, g, b] = deHex(p.fondo);
    expect(r).toBeGreaterThan(g);
    expect(r).toBeGreaterThan(b);
    expect(luzDeHex(p.fondo)).toBeLessThan(0.3);
    expect(p.acento).not.toBe(p.fondo);
  });

  it('con dos colores usa el segundo como acento', () => {
    const p = paletaDePixeles(imagen([{ rgb: [30, 90, 220], n: 800 }, { rgb: [240, 200, 30], n: 300 }]), 1)!;
    const [r, , b] = deHex(p.fondo);
    expect(b).toBeGreaterThan(r); // fondo azul
    const [ar, ag, ab] = deHex(p.acento);
    expect(ar + ag).toBeGreaterThan(ab * 2); // acento amarillento
  });

  it('el texto claro y el oscuro leen sobre el fondo resultante (≥ 4,5:1 con alguna tinta)', () => {
    for (const rgb of [[220, 40, 40], [250, 220, 20], [20, 180, 90], [120, 60, 200], [240, 140, 20]] as Array<[number, number, number]>) {
      const p = paletaDePixeles(imagen([{ rgb, n: 800 }]), 1)!;
      const l = luzDeHex(p.fondo);
      expect(Math.max(contraste(0.89, l), contraste(0.011, l)), `${rgb}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('un logo en blanco y negro o gris no da paleta (no hay carácter que extraer)', () => {
    expect(paletaDePixeles(imagen([{ rgb: [0, 0, 0], n: 500 }, { rgb: [255, 255, 255], n: 500 }, { rgb: [128, 128, 128], n: 500 }]), 1)).toBeNull();
  });

  it('una imagen transparente o minúscula no da paleta', () => {
    expect(paletaDePixeles(imagen([], 1000), 1)).toBeNull();
    expect(paletaDePixeles(imagen([{ rgb: [200, 30, 30], n: 5 }], 0), 1)).toBeNull();
    expect(paletaDePixeles(new Uint8ClampedArray(0))).toBeNull();
  });

  it('los píxeles semitransparentes (bordes suavizados) no cuentan', () => {
    expect(paletaDePixeles(imagen([{ rgb: [200, 30, 30], n: 800 }], 0, 100), 1)).toBeNull();
  });

  it('el rojo que cruza 0° se agrupa como un solo color', () => {
    const p = paletaDePixeles(imagen([{ rgb: [230, 30, 60], n: 400 }, { rgb: [230, 40, 20], n: 400 }]), 1)!;
    const [r, g, b] = deHex(p.fondo);
    expect(r).toBeGreaterThan(g);
    expect(r).toBeGreaterThan(b);
  });

  it('aHex y deHex son inversas y recortan fuera de rango', () => {
    expect(aHex([255, 0, 128])).toBe('#ff0080');
    expect(aHex([300, -5, 0])).toBe('#ff0000');
    expect(deHex('#0a141e')).toEqual([10, 20, 30]);
  });
});
