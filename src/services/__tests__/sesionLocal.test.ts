// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cabeceraDeAutorizacion, hayUsuarioGuardado, leerBandaActiva, leerTokenDeSesion, leerUsuarioDeSesion } from '../sesionLocal';

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('sesionLocal', () => {
  it('sin sesión todo sale vacío', () => {
    expect(leerTokenDeSesion()).toBe('');
    expect(leerUsuarioDeSesion()).toBeNull();
    expect(leerBandaActiva()).toBe('');
    expect(hayUsuarioGuardado()).toBe(false);
    expect(cabeceraDeAutorizacion()).toEqual({});
  });

  it('lee el token actual y, si falta, el de la clave antigua', () => {
    localStorage.setItem('token', 'viejo');
    expect(leerTokenDeSesion()).toBe('viejo');
    localStorage.setItem('bandmanager_token', 'nuevo');
    expect(leerTokenDeSesion()).toBe('nuevo');
    expect(cabeceraDeAutorizacion()).toEqual({ Authorization: 'Bearer nuevo' });
  });

  it('lee el usuario y su banda activa', () => {
    localStorage.setItem('bandmanager_user', JSON.stringify({ id: 'u1', band_id: 'band-a' }));
    expect(leerUsuarioDeSesion()).toMatchObject({ id: 'u1' });
    expect(leerBandaActiva()).toBe('band-a');
    expect(hayUsuarioGuardado()).toBe(true);
  });

  it('un usuario guardado corrupto se trata como sesión sin usuario', () => {
    localStorage.setItem('bandmanager_user', '{roto');
    expect(leerUsuarioDeSesion()).toBeNull();
    expect(leerBandaActiva()).toBe('');
  });

  it('si el navegador bloquea el almacenamiento no revienta', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(leerTokenDeSesion()).toBe('');
    expect(leerUsuarioDeSesion()).toBeNull();
  });
});
