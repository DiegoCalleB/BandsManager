import { describe, it, expect } from 'vitest';
import { indiceSegmentoEn, siguienteAcordeReal, rangoBucle, saltoDeBucle, corregirAcorde } from '../lineaTiempoAcordes';

const segs = [
  { t0: 0, t1: 2, acorde: 'Em', confianza: 0.8 },
  { t0: 2, t1: 4, acorde: 'N', confianza: 0 },
  { t0: 4, t1: 6, acorde: 'C', confianza: 0.7 },
  { t0: 6, t1: 9, acorde: 'G', confianza: 0.6 },
];

describe('indiceSegmentoEn', () => {
  it.each([[0, 0], [1.99, 0], [2, 1], [5.5, 2], [8.99, 3]])('t=%s → %s', (t, esperado) => {
    expect(indiceSegmentoEn(segs, t)).toBe(esperado);
  });
  it('fuera de rango o sin segmentos → -1', () => {
    expect(indiceSegmentoEn(segs, -1)).toBe(-1);
    expect(indiceSegmentoEn(segs, 9)).toBe(-1);
    expect(indiceSegmentoEn([], 1)).toBe(-1);
  });
});

describe('siguienteAcordeReal', () => {
  it('salta los tramos sin acorde claro', () => {
    expect(siguienteAcordeReal(segs, 0)).toBe(2);
    expect(siguienteAcordeReal(segs, 2)).toBe(3);
    expect(siguienteAcordeReal(segs, 3)).toBe(-1);
  });
});

describe('bucle', () => {
  it('cubre de un segmento a otro, en cualquier orden', () => {
    expect(rangoBucle(segs, 2, 3)).toEqual({ desde: 4, hasta: 9 });
    expect(rangoBucle(segs, 3, 2)).toEqual({ desde: 4, hasta: 9 });
    expect(rangoBucle(segs, 1, 1)).toEqual({ desde: 2, hasta: 4 });
  });
  it('índices inválidos → null', () => {
    expect(rangoBucle(segs, 0, 9)).toBeNull();
  });
  it('vuelve al inicio al llegar al final y no antes', () => {
    const b = { desde: 4, hasta: 9 };
    expect(saltoDeBucle(b, 8.5)).toBeNull();
    expect(saltoDeBucle(b, 8.99)).toBe(4);
    expect(saltoDeBucle(b, 9.3)).toBe(4);
    expect(saltoDeBucle(null, 100)).toBeNull();
  });
});

describe('corregirAcorde', () => {
  it('cambia solo ese segmento, lo marca editado y no muta el original', () => {
    const nuevo = corregirAcorde(segs, 1, 'Am');
    expect(nuevo[1]).toEqual({ t0: 2, t1: 4, acorde: 'Am', confianza: 1, editado: true });
    expect(nuevo[0]).toEqual(segs[0]);
    expect(segs[1].acorde).toBe('N');
  });
});

import { normalizarAcorde, validarSegmentos } from '../lineaTiempoAcordes';

describe('normalizarAcorde', () => {
  it.each([
    ['Am', 'Am'], ['Lam', 'Am'], ['Do', 'C'], ['Do#m7', 'C#m7'], ['Sib', 'A#'], ['Bb', 'A#'], ['Bbm', 'A#m'],
    ['Mim', 'Em'], ['Sol7', 'G7'], ['F/A', 'F/A'], ['Fadd9', 'Fadd9'], ['Dsus4', 'Dsus4'], ['Dom', 'Cm'],
    ['Cmaj7', 'Cmaj7'], ['Amin', 'Am'], ['Fa#m', 'F#m'], ['Reb', 'C#'], ['G/Bb', 'G/A#'],
  ])('%s → %s', (entrada, esperado) => {
    expect(normalizarAcorde(entrada)).toBe(esperado);
  });

  it.each(['n', 'N', '—', 'sin acorde'])('«%s» es sin acorde', (e) => {
    expect(normalizarAcorde(e)).toBe('N');
  });

  it.each(['', '  ', 'H', 'Xm', 'Hola', 'C#x9', 'Amm', '123'])('rechaza «%s»', (e) => {
    expect(normalizarAcorde(e)).toBeNull();
  });
});

describe('validarSegmentos', () => {
  const ok = [{ t0: 0, t1: 2, acorde: 'Lam', confianza: 0.8, editado: true }, { t0: 2, t1: 4, acorde: 'C', confianza: 2 }];

  it('normaliza acordes, acota la confianza y conserva «editado»', () => {
    const r = validarSegmentos(ok);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.segmentos[0]).toEqual({ t0: 0, t1: 2, acorde: 'Am', confianza: 0.8, editado: true });
      expect(r.segmentos[1]).toEqual({ t0: 2, t1: 4, acorde: 'C', confianza: 1 });
    }
  });

  it('descarta campos desconocidos', () => {
    const r = validarSegmentos([{ t0: 0, t1: 1, acorde: 'C', confianza: 1, malicioso: '<script>' }]);
    expect(r.ok && Object.keys(r.segmentos[0])).toEqual(['t0', 't1', 'acorde', 'confianza']);
  });

  it.each([
    [[], 'vacío'],
    ['texto', 'no es array'],
    [[{ t0: 2, t1: 1, acorde: 'C' }], 't1 <= t0'],
    [[{ t0: -1, t1: 1, acorde: 'C' }], 'tiempo negativo'],
    [[{ t0: 0, t1: NaN, acorde: 'C' }], 'NaN'],
    [[{ t0: 0, t1: 2, acorde: 'C' }, { t0: 1, t1: 3, acorde: 'G' }], 'solapados'],
    [[{ t0: 0, t1: 2, acorde: 'Hola' }], 'acorde inválido'],
    [[null], 'nulo'],
  ])('rechaza %j (%s)', (entrada) => {
    expect(validarSegmentos(entrada).ok).toBe(false);
  });

  it('rechaza listas desmesuradas', () => {
    const muchos = Array.from({ length: 2001 }, (_, i) => ({ t0: i, t1: i + 1, acorde: 'C' }));
    expect(validarSegmentos(muchos).ok).toBe(false);
  });
});
