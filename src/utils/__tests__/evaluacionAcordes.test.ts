import { describe, it, expect } from 'vitest';
import { reducirAcorde, evaluarAcordes, leerTramos, instantesDeCambio } from '../evaluacionAcordes';

describe('reducirAcorde', () => {
  it.each([
    ['C', 0, 'maj'], ['Am', 9, 'min'], ['F#m7', 6, 'min'], ['Bb', 10, 'maj'], ['G7', 7, 'maj'], ['Cmaj7', 0, 'maj'],
    ['Sim', 11, 'min'], ['Fa#m', 6, 'min'], ['Mi', 4, 'maj'], ['A:min', 9, 'min'], ['C:maj7', 0, 'maj'], ['D:7', 2, 'maj'],
    ['E/G#', 4, 'maj'], ['Bdim', 11, 'min'], ['Eb:min7', 3, 'min'],
  ])('%s → %i %s', (a, raiz, modo) => {
    expect(reducirAcorde(a)).toEqual({ raiz, modo });
  });
  it('sin acorde', () => {
    expect(reducirAcorde('N')).toBeNull();
    expect(reducirAcorde('')).toBeNull();
    expect(reducirAcorde('Intro')).toBeNull();
  });
});

describe('evaluarAcordes', () => {
  const ref = [
    { t0: 0, t1: 4, acorde: 'Am' },
    { t0: 4, t1: 8, acorde: 'F' },
    { t0: 8, t1: 12, acorde: 'C' },
    { t0: 12, t1: 16, acorde: 'G' },
  ];

  it('una predicción perfecta da 100 % en todo', () => {
    const r = evaluarAcordes(ref, ref)!;
    expect(r.mayorMenor).toBe(1);
    expect(r.cambios.encontrados03).toBe(1);
    expect(r.cambios.sobrantes).toBe(0);
  });

  it('un acorde equivocado y un cambio tardío restan lo que deben', () => {
    const pred = [
      { t0: 0, t1: 4.5, acorde: 'Am' }, // el cambio a F llega 0,5 s tarde
      { t0: 4.5, t1: 8, acorde: 'F' },
      { t0: 8, t1: 12, acorde: 'Am' }, // debía ser C
      { t0: 12, t1: 16, acorde: 'G7' }, // G7 cuenta como G en mayor/menor
    ];
    const r = evaluarAcordes(ref, pred)!;
    // 0,5 s de 4-4,5 + 4 s de 8-12 fallan en 16 s → 71,9 %
    expect(r.mayorMenor).toBeCloseTo(11.5 / 16, 2);
    expect(r.exacto).toBeLessThan(r.mayorMenor);
    expect(r.cambios.encontrados03).toBeCloseTo(2 / 3, 2); // el de 4 s llega tarde; los de 8 y 12 a tiempo
    expect(r.cambios.encontrados1).toBe(1);
  });

  it('solo evalúa el rango pedido (lo que la banda ha revisado)', () => {
    const pred = [{ t0: 0, t1: 16, acorde: 'Am' }];
    expect(evaluarAcordes(ref, pred, { hasta: 4 })!.mayorMenor).toBe(1);
  });

  it('cuenta los cambios que sobran', () => {
    const pred = [...ref.slice(0, 2), { t0: 8, t1: 10, acorde: 'C' }, { t0: 10, t1: 10.5, acorde: 'E' }, { t0: 10.5, t1: 12, acorde: 'C' }, ref[3]];
    expect(evaluarAcordes(ref, pred)!.cambios.sobrantes).toBe(2);
  });
});

describe('leerTramos', () => {
  it('lee .lab de MIREX y JSON', () => {
    expect(leerTramos('0.000 2.500 A:min\n2.500 5.0 N\n')).toEqual([{ t0: 0, t1: 2.5, acorde: 'A:min' }, { t0: 2.5, t1: 5, acorde: 'N' }]);
    expect(leerTramos('[{"t0":0,"t1":1,"acorde":"C"}]')).toEqual([{ t0: 0, t1: 1, acorde: 'C' }]);
    expect(leerTramos('{"segmentos":[{"start":0,"end":1,"chord":"G"}]}')).toEqual([{ t0: 0, t1: 1, acorde: 'G' }]);
  });

  it('los cambios ignoran «N» y repeticiones del mismo acorde', () => {
    expect(instantesDeCambio([{ t0: 0, t1: 1, acorde: 'C' }, { t0: 1, t1: 2, acorde: 'N' }, { t0: 2, t1: 3, acorde: 'C:maj' }, { t0: 3, t1: 4, acorde: 'G' }])).toEqual([3]);
  });
});
