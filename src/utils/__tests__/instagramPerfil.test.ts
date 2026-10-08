import { describe, expect, it } from 'vitest';
import { instagramPerfil } from '../instagramPerfil';

const OK = { handle: 'labanda', url: 'https://instagram.com/labanda' };

describe('instagramPerfil', () => {
  it('acepta @usuario, usuario y variantes de URL', () => {
    expect(instagramPerfil('@labanda')).toEqual(OK);
    expect(instagramPerfil('labanda')).toEqual(OK);
    expect(instagramPerfil('instagram.com/labanda')).toEqual(OK);
    expect(instagramPerfil('https://www.instagram.com/labanda/')).toEqual(OK);
    expect(instagramPerfil('https://instagram.com/labanda/?igsh=abc123')).toEqual(OK);
  });

  it('respeta puntos y guiones bajos del usuario', () => {
    expect(instagramPerfil('@la_banda.oficial')?.handle).toBe('la_banda.oficial');
  });

  it('rechaza otros dominios y rutas que no son un perfil', () => {
    expect(instagramPerfil('https://evil.com/labanda')).toBeNull();
    expect(instagramPerfil('https://instagram.com.evil.com/labanda')).toBeNull();
    expect(instagramPerfil('https://instagram.com/p/Cxyz123/')).toBeNull();
    expect(instagramPerfil('https://instagram.com/reel/Cxyz123/')).toBeNull();
  });

  it('rechaza vacíos y texto que no es un usuario', () => {
    expect(instagramPerfil('')).toBeNull();
    expect(instagramPerfil(undefined)).toBeNull();
    expect(instagramPerfil('no tiene instagram')).toBeNull();
    expect(instagramPerfil('lab"onload="x')).toBeNull();
  });
});
