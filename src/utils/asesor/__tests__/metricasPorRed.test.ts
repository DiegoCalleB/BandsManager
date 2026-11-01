import { describe, expect, it } from 'vitest';
import {
  CAMPOS, lecturaRelativa, otrasRedesPorMedir, previasDe, redesExtra, redPrincipal, sanearMetricasRed, type MetricasRed, type ResultadoRed,
} from '../metricasPorRed';
import type { AccionRegistrada } from '../tipos';

const HOY = '2026-10-28';
const m = (visualizaciones: number, resto: MetricasRed = {}): MetricasRed => ({ visualizaciones, ...resto });
const res = (fecha: string, tarjetaId: string, red: ResultadoRed['red'], visualizaciones: number): ResultadoRed =>
  ({ fecha, tarjetaId, red, formato: 'reel', titulo: `Idea ${tarjetaId}`, metricas: m(visualizaciones) });
const hecha = (fecha: string, tarjetaId: string, formato: AccionRegistrada['formato'] = 'reel'): AccionRegistrada => ({ fecha, tarjetaId, formato, accion: 'hecho', titulo: `Idea ${tarjetaId}` });

describe('sanearMetricasRed', () => {
  it('TikTok: acepta números como texto y deja a null lo opcional que no se anota', () => {
    expect(sanearMetricasRed('tiktok', { visualizaciones: '12000', guardados: 300 })).toEqual({ visualizaciones: 12000, guardados: 300, compartidos: null, pctCompleto: null });
    expect(sanearMetricasRed('tiktok', { visualizaciones: 5000, pctCompleto: '42,5' })).toMatchObject({ pctCompleto: 42.5, guardados: null });
  });

  it('YouTube: sin guardados; mide cuántos se quedan y cuánto ven', () => {
    expect(CAMPOS.youtube.map((c) => c.id)).not.toContain('guardados');
    expect(sanearMetricasRed('youtube', { visualizaciones: 800, pctQuedaron: 71.26, pctMedioVisto: 55, suscriptores: 4 }))
      .toEqual({ visualizaciones: 800, pctQuedaron: 71.3, pctMedioVisto: 55, suscriptores: 4 });
  });

  it('solo se guardan los campos de esa red: lo demás se ignora', () => {
    const r = sanearMetricasRed('youtube', { visualizaciones: 100, guardados: 50, __proto__: { x: 1 }, extra: 'x' }) as MetricasRed;
    expect(Object.keys(r).sort()).toEqual(['pctMedioVisto', 'pctQuedaron', 'suscriptores', 'visualizaciones']);
  });

  it('explica con una frase lo que no vale', () => {
    for (const [red, malo] of [
      ['tiktok', {}], ['tiktok', { visualizaciones: 0 }], ['tiktok', { visualizaciones: -3 }], ['tiktok', { visualizaciones: 1.5 }], ['tiktok', { visualizaciones: 'mucho' }],
      ['tiktok', { visualizaciones: 100, guardados: 101 }], ['tiktok', { visualizaciones: 100, compartidos: 500 }], ['tiktok', { visualizaciones: 100, pctCompleto: 120 }],
      ['youtube', { visualizaciones: 100, pctQuedaron: -1 }], ['youtube', { visualizaciones: 100, suscriptores: 2.5 }], ['youtube', { visualizaciones: 2e9 }], ['youtube', null],
    ] as const) {
      expect(typeof sanearMetricasRed(red, malo)).toBe('string');
    }
  });
});

describe('lecturaRelativa', () => {
  const habituales = [m(1000), m(2000), m(3000)]; // mediana 2000

  it('sin tres piezas con qué comparar no dice si fue buena', () => {
    expect(lecturaRelativa('tiktok', m(5000), [m(1000), m(2000)])).toMatchObject({ estado: 'sin_comparar', veces: null });
    expect(lecturaRelativa('tiktok', m(5000), [])).toMatchObject({ estado: 'sin_comparar' });
  });

  it('con menos de 100 visualizaciones, ningún número dice nada', () => {
    expect(lecturaRelativa('youtube', m(60), habituales)).toMatchObject({ estado: 'sin_comparar' });
    expect(lecturaRelativa('youtube', m(60), habituales).mensaje).toContain('100');
  });

  it('las previas con muy pocas visualizaciones no cuentan como «lo habitual»', () => {
    expect(lecturaRelativa('tiktok', m(5000), [m(10), m(20), m(30), m(1000), m(2000)])).toMatchObject({ estado: 'sin_comparar' });
  });

  it('por encima, en su línea y por debajo de la mediana de la propia banda', () => {
    expect(lecturaRelativa('tiktok', m(4000), habituales)).toMatchObject({ estado: 'por_encima', veces: 2 });
    expect(lecturaRelativa('tiktok', m(2200), habituales)).toMatchObject({ estado: 'en_su_linea' });
    expect(lecturaRelativa('tiktok', m(1000), habituales)).toMatchObject({ estado: 'por_debajo', veces: 0.5 });
  });

  it('cuando se queda corta, el consejo es el de la lección de cada red', () => {
    expect(lecturaRelativa('tiktok', m(1000), habituales).mensaje).toContain('3 primeros segundos');
    expect(lecturaRelativa('youtube', m(1000), habituales).mensaje).toContain('portada y el título');
    expect(lecturaRelativa('tiktok', m(4000), habituales).mensaje).toBe('Llegó más lejos de lo habitual: 2,0× vuestra mediana en TikTok. Repetid lo que hicisteis.');
  });
});

describe('previasDe', () => {
  it('solo la misma red, otras piezas y el último mes', () => {
    const todas = [res('2026-10-20', 'a', 'tiktok', 1000), res('2026-10-21', 'b', 'youtube', 5000), res('2026-10-22', 'c', 'tiktok', 3000), res('2026-08-01', 'vieja', 'tiktok', 9000)];
    const actual = { fecha: '2026-10-25', tarjetaId: 'z', red: 'tiktok' as const };
    expect(previasDe(todas, actual, HOY).map((x) => x.visualizaciones)).toEqual([1000, 3000]);
    expect(previasDe(todas, { fecha: '2026-10-20', tarjetaId: 'a', red: 'tiktok' }, HOY).map((x) => x.visualizaciones)).toEqual([3000]);
  });
});

describe('redes principal y extra', () => {
  it('Instagram manda si está; si no, la primera red de la banda', () => {
    expect(redPrincipal(['instagram', 'tiktok', 'youtube'])).toBe('instagram');
    expect(redPrincipal(['tiktok', 'youtube'])).toBe('tiktok');
    expect(redPrincipal(['youtube'])).toBe('youtube');
    expect(redPrincipal([])).toBe('instagram');
  });

  it('solo los reels van a más de una red, y las extra nunca incluyen la principal', () => {
    expect(redesExtra('reel', ['instagram', 'tiktok', 'youtube'])).toEqual(['tiktok', 'youtube']);
    expect(redesExtra('reel', ['tiktok', 'youtube'])).toEqual(['youtube']);
    expect(redesExtra('reel', ['youtube'])).toEqual([]);
    expect(redesExtra('carrusel', ['instagram', 'tiktok'])).toEqual([]);
    expect(redesExtra('stories', ['instagram', 'tiktok', 'youtube'])).toEqual([]);
  });
});

describe('otrasRedesPorMedir', () => {
  const redes = ['instagram', 'tiktok', 'youtube'] as const;
  const medidas = [{ fecha: '2026-10-24', tarjetaId: 'a' }, { fecha: '2026-10-25', tarjetaId: 'b' }, { fecha: '2026-10-22', tarjetaId: 'c' }];

  it('ofrece las otras redes de un reel ya medido en la principal, y solo las que faltan', () => {
    const acciones = [hecha('2026-10-24', 'a'), hecha('2026-10-25', 'b'), hecha('2026-10-22', 'c', 'carrusel')];
    const r = otrasRedesPorMedir(acciones, medidas, [res('2026-10-24', 'a', 'tiktok', 1000)], HOY, redes);
    expect(r.map((p) => [p.tarjetaId, p.redes])).toEqual([['b', ['tiktok', 'youtube']], ['a', ['youtube']]]); // el carrusel no sale en otras redes
  });

  it('no ofrece nada si la principal aún no está medida, si es demasiado pronto o tarde, o si no hay más redes', () => {
    expect(otrasRedesPorMedir([hecha('2026-10-24', 'a')], [], [], HOY, redes)).toEqual([]);
    expect(otrasRedesPorMedir([hecha('2026-10-27', 'n')], [{ fecha: '2026-10-27', tarjetaId: 'n' }], [], HOY, redes)).toEqual([]);
    expect(otrasRedesPorMedir([hecha('2026-10-01', 'v')], [{ fecha: '2026-10-01', tarjetaId: 'v' }], [], HOY, redes)).toEqual([]);
    expect(otrasRedesPorMedir([hecha('2026-10-24', 'a')], medidas, [], HOY, ['instagram'])).toEqual([]);
  });
});
