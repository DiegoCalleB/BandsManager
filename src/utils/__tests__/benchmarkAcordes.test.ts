import { describe, expect, it } from 'vitest';
import { ejecutarBenchmark, regresiones } from '../benchmarkAcordes';

const ref = [{ t0: 0, t1: 4, acorde: 'E:maj' }, { t0: 4, t1: 8, acorde: 'A:maj' }];

describe('benchmarkAcordes', () => {
  it('acierto perfecto → 100 %', () => {
    const r = ejecutarBenchmark(new Map([['a', ref]]), new Map([['a', ref]]));
    expect(r.total.mayorMenor).toBe(1);
    expect(r.total.errorMedio).toBe(0);
  });

  it('canción sin predicción no cuenta en el total', () => {
    const r = ejecutarBenchmark(new Map([['a', ref], ['b', ref]]), new Map([['a', ref]]));
    expect(r.canciones.find((c) => c.cancion === 'b')?.resultado).toBeNull();
    expect(r.total.mayorMenor).toBe(1);
  });

  it('detecta regresión y tolera ruido', () => {
    const base = ejecutarBenchmark(new Map([['a', ref]]), new Map([['a', ref]])).total;
    const peor = ejecutarBenchmark(new Map([['a', ref]]), new Map([['a', [{ t0: 0, t1: 8, acorde: 'E:maj' }]]])).total;
    expect(regresiones(base, base)).toEqual([]);
    expect(regresiones(peor, base).length).toBeGreaterThan(0);
  });
});
