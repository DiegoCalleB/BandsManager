import { describe, expect, it } from 'vitest';
import { elegirCanalYoutube, periodoMensual, validarSeguidores } from '../metricasBanda.js';

describe('periodoMensual', () => {
  it('devuelve YYYY-MM en UTC con mes de dos cifras', () => {
    expect(periodoMensual(new Date('2026-10-08T12:00:00Z'))).toBe('2026-10');
    expect(periodoMensual(new Date('2026-03-01T00:30:00Z'))).toBe('2026-03');
  });
});

describe('elegirCanalYoutube', () => {
  it('exige el nombre exacto y no se queda con un canal parecido', () => {
    const canales = [
      { channelId: 'UC1', channelTitle: 'Bala Tour Official' },
      { channelId: 'UC2', channelTitle: 'Bala' },
    ];
    expect(elegirCanalYoutube('Bala', canales)?.channelId).toBe('UC2');
    expect(elegirCanalYoutube('Crisix', canales)).toBeNull();
    expect(elegirCanalYoutube('', canales)).toBeNull();
  });
});

describe('validarSeguidores', () => {
  it('acepta enteros no negativos, también como texto de dígitos', () => {
    expect(validarSeguidores(0)).toBe(0);
    expect(validarSeguidores(1234)).toBe(1234);
    expect(validarSeguidores(' 850 ')).toBe(850);
  });

  it('rechaza decimales, negativos, texto, vacíos y cifras absurdas', () => {
    for (const malo of [1.5, -3, 'abc', '12.5', '', null, undefined, NaN, Infinity, 2_000_000_000, {}, []]) {
      expect(validarSeguidores(malo)).toBeNull();
    }
  });
});
