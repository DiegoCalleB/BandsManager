import { describe, it, expect } from 'vitest';
import { indiceSegmentoEn, siguienteAcordeReal, rangoBucle, saltoDeBucle, corregirAcorde, partirTramo, moverFrontera, unirConAnterior, desplazarSegmentos, validarSegmentos } from '../lineaTiempoAcordes';
import type { SegmentoAcordeAnalizado } from '../../types';

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
    expect(nuevo[1]).toEqual({ t0: 2, t1: 4, acorde: 'Am', confianza: 1, editado: true, detectado: 'N' });
    expect(nuevo[0]).toEqual(segs[0]);
    expect(segs[1].acorde).toBe('N');
  });
});

import { normalizarAcorde } from '../lineaTiempoAcordes';

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

describe('edición de fronteras y desfase', () => {
  const base = (): SegmentoAcordeAnalizado[] => [
    { t0: 0, t1: 4, acorde: 'A', confianza: 1 },
    { t0: 4, t1: 8, acorde: 'E', confianza: 0.8 },
    { t0: 8, t1: 12, acorde: 'A', confianza: 1 },
  ];

  it('partirTramo mete un cambio que el detector no vio y recuerda lo detectado', () => {
    const r = partirTramo(base(), 6);
    expect(r).toHaveLength(4);
    expect(r[1]).toMatchObject({ t0: 4, t1: 6, acorde: 'E', editado: true, detectado: 'E' });
    expect(r[2]).toMatchObject({ t0: 6, t1: 8, acorde: 'E', editado: true, detectado: 'E' });
  });

  it('partirTramo ignora cortes pegados a los bordes o fuera del audio', () => {
    expect(partirTramo(base(), 4.1)).toHaveLength(3);
    expect(partirTramo(base(), 99)).toHaveLength(3);
  });

  it('moverFrontera desplaza el cambio y respeta el tramo mínimo', () => {
    const r = moverFrontera(base(), 1, 5.5);
    expect(r[0].t1).toBe(5.5);
    expect(r[1].t0).toBe(5.5);
    expect(moverFrontera(base(), 1, 11.9)[1].t0).toBe(7.8); // el tramo siguiente conserva ≥ 0,2 s
    expect(moverFrontera(base(), 0, 1)).toEqual(base());
  });

  it('unirConAnterior elimina el cambio inventado y deja los tiempos contiguos', () => {
    const r = unirConAnterior(base(), 1);
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({ t0: 0, t1: 8, acorde: 'A', editado: true });
    expect(r[1].t0).toBe(8);
  });

  it('corregirAcorde guarda el acorde detectado una sola vez', () => {
    const una = corregirAcorde(base(), 1, 'D');
    expect(una[1]).toMatchObject({ acorde: 'D', detectado: 'E', editado: true });
    expect(corregirAcorde(una, 1, 'G')[1]).toMatchObject({ acorde: 'G', detectado: 'E' });
  });

  it('desplazarSegmentos mueve todo y no deja huecos al principio', () => {
    const tarde = desplazarSegmentos(base(), 0.5);
    expect(tarde[0]).toMatchObject({ t0: 0, t1: 4.5 });
    expect(tarde[2]).toMatchObject({ t0: 8.5, t1: 12.5 });
    const pronto = desplazarSegmentos(base(), -4.1);
    expect(pronto[0]).toMatchObject({ acorde: 'E', t0: 0 });
    expect(pronto).toHaveLength(2);
  });

  it('validarSegmentos conserva el acorde detectado', () => {
    const r = validarSegmentos([{ t0: 0, t1: 2, acorde: 'Am', confianza: 1, editado: true, detectado: 'C' }]);
    expect(r.ok && r.segmentos[0].detectado).toBe('C');
  });
});
