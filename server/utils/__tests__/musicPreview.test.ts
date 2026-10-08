import { describe, expect, it } from 'vitest';
import { elegirArtistaDeezer, elegirPreview } from '../musicPreview.js';

describe('elegirArtistaDeezer', () => {
  it('exige nombre exacto tras normalizar y prefiere el de más fans', () => {
    const r = elegirArtistaDeezer('Mägo de Oz', [
      { id: 1, name: 'Mago de Oz tributo', nb_fan: 9000 },
      { id: 2, name: 'Mago de Oz', nb_fan: 100 },
      { id: 3, name: 'Mago de Oz', nb_fan: 5000 },
    ]);
    expect(r?.id).toBe(3);
  });

  it('devuelve null si no hay coincidencia exacta', () => {
    expect(elegirArtistaDeezer('Bala', [{ id: 1, name: 'Bala Tour', nb_fan: 10 }])).toBeNull();
    expect(elegirArtistaDeezer('', [{ id: 1, name: 'Bala' }])).toBeNull();
  });
});

describe('elegirPreview', () => {
  it('toma el primer tema con preview https', () => {
    expect(
      elegirPreview([
        { title: 'Sin preview' },
        { title: 'Http', preview: 'http://cdn.example/x.mp3' },
        { title: 'Bueno', preview: 'https://cdn.example/y.mp3' },
      ])?.title,
    ).toBe('Bueno');
  });

  it('devuelve null si ningún tema tiene preview', () => {
    expect(elegirPreview([{ title: 'a' }])).toBeNull();
    expect(elegirPreview([])).toBeNull();
  });
});
