import { describe, expect, it } from 'vitest';
import { HISTORIAL_VACIO, MAX_HISTORIAL, anotar, deshacer, rehacer, type Historial } from '../historial';

describe('historial del cartel', () => {
  it('deshace y rehace en orden', () => {
    let h: Historial<number> = HISTORIAL_VACIO;
    h = anotar(h, 1); // 1 → 2
    h = anotar(h, 2); // 2 → 3
    const d1 = deshacer(h, 3)!;
    expect(d1.estado).toBe(2);
    const d2 = deshacer(d1.historial, 2)!;
    expect(d2.estado).toBe(1);
    expect(deshacer(d2.historial, 1)).toBeNull();
    const r1 = rehacer(d2.historial, 1)!;
    expect(r1.estado).toBe(2);
    expect(rehacer(rehacer(r1.historial, 2)!.historial, 3)).toBeNull();
  });

  it('un cambio nuevo borra lo rehacible', () => {
    const d = deshacer(anotar(HISTORIAL_VACIO, 1), 2)!;
    expect(d.historial.futuro).toEqual([2]);
    expect(anotar(d.historial, 1).futuro).toEqual([]);
  });

  it('acota la memoria', () => {
    let h: Historial<number> = HISTORIAL_VACIO;
    for (let i = 0; i < MAX_HISTORIAL + 10; i++) h = anotar(h, i);
    expect(h.pasado).toHaveLength(MAX_HISTORIAL);
    expect(h.pasado[0]).toBe(10);
  });

  it('sin historial no hay nada que deshacer ni rehacer', () => {
    expect(deshacer(HISTORIAL_VACIO, 1)).toBeNull();
    expect(rehacer(HISTORIAL_VACIO, 1)).toBeNull();
  });
});
