import { describe, expect, it } from 'vitest';
import { elegirCanalYoutube, periodoMensual } from '../metricasBanda.js';

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
