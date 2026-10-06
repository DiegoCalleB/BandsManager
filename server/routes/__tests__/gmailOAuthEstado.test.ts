// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { firmarEstadoOAuth, verificarEstadoOAuth } from '../gmailOAuth';

const CRON_ORIGINAL = process.env.CRON_SECRET;

beforeEach(() => {
  process.env.CRON_SECRET = 'secreto-de-prueba';
});

afterEach(() => {
  if (CRON_ORIGINAL === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = CRON_ORIGINAL;
  vi.useRealTimers();
});

describe('firmarEstadoOAuth / verificarEstadoOAuth', () => {
  it('un estado recién firmado se verifica y devuelve el band_id original', () => {
    const state = firmarEstadoOAuth('band-bakandeya');
    expect(verificarEstadoOAuth(state)).toBe('band-bakandeya');
  });

  it('un estado manipulado (band_id distinto) no verifica', () => {
    const state = firmarEstadoOAuth('band-bakandeya');
    const [, ts, firma] = state.split('.');
    const falsificado = `band-otra-banda.${ts}.${firma}`;
    expect(verificarEstadoOAuth(falsificado)).toBeNull();
  });

  it('un estado con firma alterada no verifica', () => {
    const state = firmarEstadoOAuth('band-bakandeya');
    expect(verificarEstadoOAuth(state.slice(0, -1) + (state.endsWith('a') ? 'b' : 'a'))).toBeNull();
  });

  it('un estado caducado (más de 10 minutos) no verifica', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const state = firmarEstadoOAuth('band-bakandeya');
    vi.setSystemTime(new Date('2026-01-01T00:11:00Z'));
    expect(verificarEstadoOAuth(state)).toBeNull();
  });

  it('valores que no son string, vacíos o mal formados no verifican', () => {
    expect(verificarEstadoOAuth(undefined)).toBeNull();
    expect(verificarEstadoOAuth('')).toBeNull();
    expect(verificarEstadoOAuth('sin-puntos')).toBeNull();
    expect(verificarEstadoOAuth(['array-no-string'])).toBeNull();
  });

  it('sin CRON_SECRET configurado, firmar lanza y verificar devuelve null', () => {
    delete process.env.CRON_SECRET;
    expect(() => firmarEstadoOAuth('band-bakandeya')).toThrow();
    expect(verificarEstadoOAuth('band-bakandeya.123.abc')).toBeNull();
  });
});
