import { describe, it, expect } from 'vitest';
import { SANGRADO_A4, lienzoConSangrado, marcasDeCorte, mmAPx } from '../sangrado';

describe('sangrado y marcas de corte', () => {
  const W = 2480;
  const H = 3508;
  const { ancho, alto, corteX, corteY } = lienzoConSangrado(W, H);

  it('3 mm de sangre a 300 ppp son 35 px', () => {
    expect(mmAPx(3)).toBe(35);
    expect(SANGRADO_A4.sangre).toBe(35);
  });

  it('el lienzo crece por los cuatro lados y el corte queda centrado', () => {
    expect(ancho - W).toBe(2 * corteX);
    expect(alto - H).toBe(2 * corteY);
    expect(corteX).toBe(SANGRADO_A4.margen + SANGRADO_A4.sangre);
  });

  it('hay ocho marcas, dos por esquina, y todas caben en el lienzo', () => {
    const marcas = marcasDeCorte(W, H);
    expect(marcas).toHaveLength(8);
    for (const [x0, y0, x1, y1] of marcas) {
      for (const [x, y] of [[x0, y0], [x1, y1]]) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(ancho);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(alto);
      }
    }
  });

  it('ninguna marca entra en el arte ni en el sangrado: empiezan fuera de él', () => {
    const { sangre } = SANGRADO_A4;
    const arteX = [corteX - sangre, corteX + W + sangre];
    const arteY = [corteY - sangre, corteY + H + sangre];
    for (const [x0, y0, x1, y1] of marcasDeCorte(W, H)) {
      const dentroX = (x: number) => x > arteX[0] && x < arteX[1];
      const dentroY = (y: number) => y > arteY[0] && y < arteY[1];
      // Una marca horizontal está a la altura del corte pero fuera del ancho del sangrado, y al revés.
      if (y0 === y1) expect(dentroX(x0) || dentroX(x1)).toBe(false);
      else expect(dentroY(y0) || dentroY(y1)).toBe(false);
    }
  });

  it('las marcas apuntan a las líneas de corte reales', () => {
    const horizontales = marcasDeCorte(W, H).filter(([, y0, , y1]) => y0 === y1).map(([, y]) => y);
    expect([...new Set(horizontales)].sort((a, b) => a - b)).toEqual([corteY, corteY + H]);
    const verticales = marcasDeCorte(W, H).filter(([x0, , x1]) => x0 === x1).map(([x]) => x);
    expect([...new Set(verticales)].sort((a, b) => a - b)).toEqual([corteX, corteX + W]);
  });
});
