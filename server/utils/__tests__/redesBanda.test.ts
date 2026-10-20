import { describe, expect, it } from 'vitest';
import { canalYoutubeDeEnlace, enlacesParaMetricas, handleInstagram } from '../redesBanda.js';

describe('canalYoutubeDeEnlace', () => {
  it('reconoce canal por id, handle y usuario clásico', () => {
    expect(canalYoutubeDeEnlace('https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv')).toEqual({ tipo: 'id', valor: 'UCabcdefghijklmnopqrstuv' });
    expect(canalYoutubeDeEnlace('https://youtube.com/@LaVallekanaSound?si=x')).toEqual({ tipo: 'handle', valor: 'LaVallekanaSound' });
    expect(canalYoutubeDeEnlace('youtube.com/user/skakeitan')).toEqual({ tipo: 'usuario', valor: 'skakeitan' });
  });

  it('no inventa un canal cuando el enlace no lo identifica', () => {
    for (const malo of ['', null, undefined, 'https://www.youtube.com/c/Algo', 'https://www.youtube.com/watch?v=abc', 'https://youtube.com/channel/corto', 'https://youtube.com.malo.com/@abc', 'https://open.spotify.com/artist/x', 'no es una url']) {
      expect(canalYoutubeDeEnlace(malo)).toBeNull();
    }
  });
});

describe('handleInstagram', () => {
  it('saca el usuario de URL, con parámetros, o de @usuario, en minúsculas', () => {
    expect(handleInstagram('https://www.instagram.com/Ladilla.Rusa/')).toBe('ladilla.rusa');
    expect(handleInstagram('instagram.com/bala_oficial?igsh=abc')).toBe('bala_oficial');
    expect(handleInstagram('@Eskorzo')).toBe('eskorzo');
    expect(handleInstagram('eskorzo')).toBe('eskorzo');
  });

  it('descarta publicaciones, otros dominios y valores que no son un usuario', () => {
    for (const malo of ['', null, undefined, 'https://instagram.com/p/Cabc123/', 'https://instagram.com/reel/xyz', 'https://instagram.com/', 'https://instagram.com.falso.com/bala', 'https://tiktok.com/@bala', 'dos palabras', 'a'.repeat(31)]) {
      expect(handleInstagram(malo)).toBeNull();
    }
  });
});

describe('enlacesParaMetricas', () => {
  it('reparte las URLs por plataforma y tolera que falten', () => {
    expect(enlacesParaMetricas({ spotify: { url: 'S', verificado: true }, instagram: { url: 'I', verificado: false } })).toEqual({ spotify: 'S', youtube: undefined, instagram: 'I' });
    expect(enlacesParaMetricas(undefined)).toEqual({ spotify: undefined, youtube: undefined, instagram: undefined });
  });
});
