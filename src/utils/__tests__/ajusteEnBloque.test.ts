import { describe, it, expect } from 'vitest';
import { cambiosHermanos, moverHermanos, movimientoHecho } from '../ajusteEnBloque';
import { moverFrontera } from '../lineaTiempoAcordes';

const seg = (t0: number, t1: number, acorde: string) => ({ t0, t1, acorde, confianza: 1 });
// C | G | C | G | Am: el cambio C→G se repite en 2 y 6 s.
const base = [seg(0, 2, 'C'), seg(2, 4, 'G'), seg(4, 6, 'C'), seg(6, 8, 'G'), seg(8, 10, 'Am')];

describe('ajuste en bloque', () => {
  it('reconoce qué cambio se movió y cuánto', () => {
    const despues = moverFrontera(base, 1, 2.5);
    expect(movimientoHecho(base, despues)).toEqual({ acorde: 'G', previo: 'C', delta: 0.5, t0: 2.5 });
    expect(movimientoHecho(base, base)).toBeNull();
  });

  it('encuentra los mismos cambios del rango y no el movido ni otros', () => {
    const mov = { acorde: 'G', previo: 'C', delta: 0.5, t0: 2.5 };
    expect(cambiosHermanos(base, mov, { desde: 0, hasta: 10 }, 2)).toEqual([3]);
    expect(cambiosHermanos(base, mov, { desde: 0, hasta: 5 }, 2)).toEqual([]);
  });

  it('desplaza los hermanos lo mismo y los marca como editados', () => {
    const { segmentos, movidos } = moverHermanos(base, { acorde: 'G', previo: 'C', delta: -0.5, t0: 1.5 }, { desde: 0, hasta: 10 }, 99);
    expect(movidos).toBe(2);
    expect(segmentos[1].t0).toBe(1.5);
    expect(segmentos[3].t0).toBe(5.5);
    expect(segmentos[3].editado).toBe(true);
    expect(segmentos[2].t1).toBe(5.5);
  });

  it('respeta los cambios que ya corregiste a mano', () => {
    const manual = base.map((s, i) => (i === 3 ? { ...s, editado: true } : s));
    const mov = { acorde: 'G', previo: 'C', delta: 0.5, t0: 2.5 };
    expect(cambiosHermanos(manual, mov, { desde: 0, hasta: 10 }, 2)).toEqual([]);
  });
});
