import { describe, it, expect } from 'vitest';
import { hostnameDe, hostEnDominio, dominioDeEmail, emailEnDominio } from '../urlHost';

describe('hostnameDe', () => {
  it('extrae el host de URLs con y sin esquema', () => {
    expect(hostnameDe('https://WWW.Instagram.com/sala')).toBe('www.instagram.com');
    expect(hostnameDe('instagram.com/sala')).toBe('instagram.com');
    expect(hostnameDe('http://[::1]:8080/x')).toBe('::1');
  });

  it('devuelve vacío si no hay host utilizable', () => {
    expect(hostnameDe('')).toBe('');
    expect(hostnameDe(undefined)).toBe('');
    expect(hostnameDe('/uploads/logo.png')).toBe('');
    expect(hostnameDe('a'.repeat(5000))).toBe('');
  });
});

describe('hostEnDominio', () => {
  it('acepta el dominio y sus subdominios', () => {
    expect(hostEnDominio('https://clearbit.com/logo', 'clearbit.com')).toBe(true);
    expect(hostEnDominio('https://logo.clearbit.com/x.png', 'clearbit.com')).toBe(true);
    expect(hostEnDominio('https://places.googleapis.com/v1/x', 'places.googleapis.com')).toBe(true);
  });

  it('rechaza el dominio escondido en la ruta, el usuario o un host ajeno', () => {
    expect(hostEnDominio('https://evil.com/instagram.com', 'instagram.com')).toBe(false);
    expect(hostEnDominio('https://instagram.com.evil.com/', 'instagram.com')).toBe(false);
    expect(hostEnDominio('https://evil.com/?u=clearbit.com', 'clearbit.com')).toBe(false);
    expect(hostEnDominio('https://clearbit.com@evil.com/', 'clearbit.com')).toBe(false);
    expect(hostEnDominio('https://notclearbit.com/', 'clearbit.com')).toBe(false);
    expect(hostEnDominio('https://evil.com#ui-avatars.com', 'ui-avatars.com')).toBe(false);
  });

  it('no coincide con texto que no es una URL', () => {
    expect(hostEnDominio('', 'clearbit.com')).toBe(false);
    expect(hostEnDominio(null, 'clearbit.com')).toBe(false);
  });
});

describe('emailEnDominio', () => {
  it('compara el dominio del correo, no una subcadena', () => {
    expect(dominioDeEmail('Info@Example.com')).toBe('example.com');
    expect(emailEnDominio('a@example.com', 'example.com')).toBe(true);
    expect(emailEnDominio('a@mail.sentry.io', 'sentry.io')).toBe(true);
    expect(emailEnDominio('example.com@real-sala.es', 'example.com')).toBe(false);
    expect(emailEnDominio('a@notexample.com', 'example.com')).toBe(false);
    expect(emailEnDominio('sin-arroba', 'example.com')).toBe(false);
  });
});
