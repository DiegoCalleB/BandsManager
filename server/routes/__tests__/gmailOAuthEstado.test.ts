import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { firmarEstadoOAuth, verificarEstadoOAuth, validarYConsumirEstadoOAuth } from '../gmailOAuth';

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
    const state = firmarEstadoOAuth('band-ejemplo');
    expect(verificarEstadoOAuth(state)).toBe('band-ejemplo');
  });

  it('un estado manipulado (band_id distinto) no verifica', () => {
    const state = firmarEstadoOAuth('band-ejemplo');
    const [, ts, nonce, firma] = state.split('.');
    const falsificado = `band-otra-banda.${ts}.${nonce}.${firma}`;
    expect(verificarEstadoOAuth(falsificado)).toBeNull();
  });

  it('un estado con firma alterada no verifica', () => {
    const state = firmarEstadoOAuth('band-ejemplo');
    expect(verificarEstadoOAuth(state.slice(0, -1) + (state.endsWith('a') ? 'b' : 'a'))).toBeNull();
  });

  it('un estado caducado (más de 10 minutos) no verifica', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const state = firmarEstadoOAuth('band-ejemplo');
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
    expect(() => firmarEstadoOAuth('band-ejemplo')).toThrow();
    expect(verificarEstadoOAuth('band-ejemplo.123.n.abc')).toBeNull();
  });
});

describe('validarYConsumirEstadoOAuth (nonce + cookie + un solo uso)', () => {
  it('acepta el estado con la cookie del mismo navegador y devuelve la banda', () => {
    const state = firmarEstadoOAuth('band-a', 'nonce-aaa');
    expect(validarYConsumirEstadoOAuth(state, 'nonce-aaa')).toBe('band-a');
  });

  it('rechaza el segundo uso del mismo estado (reenvío)', () => {
    const state = firmarEstadoOAuth('band-a', 'nonce-bbb');
    expect(validarYConsumirEstadoOAuth(state, 'nonce-bbb')).toBe('band-a');
    expect(validarYConsumirEstadoOAuth(state, 'nonce-bbb')).toBeNull();
  });

  it('rechaza sin cookie o con la cookie de otro navegador', () => {
    const state = firmarEstadoOAuth('band-a', 'nonce-ccc');
    expect(validarYConsumirEstadoOAuth(state, '')).toBeNull();
    expect(validarYConsumirEstadoOAuth(state, 'nonce-otro')).toBeNull();
    // un intento fallido no quema el estado legítimo
    expect(validarYConsumirEstadoOAuth(state, 'nonce-ccc')).toBe('band-a');
  });

  it('rechaza el formato antiguo de tres partes (sin nonce)', () => {
    expect(validarYConsumirEstadoOAuth('band-a.123.abc', 'x')).toBeNull();
  });
});
