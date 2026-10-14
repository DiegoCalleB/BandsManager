import { describe, it, expect } from 'vitest';
import { esNombreFotoPlacesValido, urlFotoPlaces, urlMediaPlaces, destinoFotoPlacesSeguro } from '../placesPhoto';

const nombre = 'places/ChIJ2eUgeAK6j4ARbn5u_wAGqWA/photos/AUc7tXX-abc_123';

describe('placesPhoto', () => {
  it('acepta solo nombres de recurso de foto de Places', () => {
    expect(esNombreFotoPlacesValido(nombre)).toBe(true);
    for (const malo of ['', 'places/x', 'https://evil.com/x', 'places/a/photos/b/../../c', 'places/a/photos/b?key=1', 42, null]) {
      expect(esNombreFotoPlacesValido(malo)).toBe(false);
    }
  });

  it('la URL que se guarda no contiene la API key', () => {
    const url = urlFotoPlaces(nombre);
    expect(url.startsWith('/api/places/photo?name=')).toBe(true);
    expect(url).not.toMatch(/key=/);
  });

  it('la URL de media pide el photoUri en JSON y no lleva la clave en la query', () => {
    expect(urlMediaPlaces(nombre)).toContain('skipHttpRedirect=true');
    expect(urlMediaPlaces(nombre)).not.toMatch(/key=/);
  });
});

describe('destinoFotoPlacesSeguro (la redirección solo va a hosts de imágenes de Google)', () => {
  it('acepta las URLs de imagen de Google', () => {
    expect(destinoFotoPlacesSeguro('https://lh3.googleusercontent.com/places/AAA=s1600')).toBe('https://lh3.googleusercontent.com/places/AAA=s1600');
    expect(destinoFotoPlacesSeguro('https://googleusercontent.com/x')).toBe('https://googleusercontent.com/x');
  });

  it.each([
    'http://lh3.googleusercontent.com/x',
    'https://evil.com/x',
    'https://googleusercontent.com.evil.com/x',
    'https://evil.com/?https://lh3.googleusercontent.com/x',
    'https://user:pass@lh3.googleusercontent.com/x',
    'https://lh3.googleusercontent.com@evil.com/x',
    'javascript:alert(1)',
    '//evil.com/x',
    'no es una url',
    '',
  ])('rechaza %s', (url) => {
    expect(destinoFotoPlacesSeguro(url)).toBeNull();
  });

  it('rechaza lo que no es texto', () => {
    expect(destinoFotoPlacesSeguro(undefined)).toBeNull();
    expect(destinoFotoPlacesSeguro(42)).toBeNull();
  });
});
