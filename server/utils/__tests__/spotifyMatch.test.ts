import { describe, expect, it } from 'vitest';
import { elegirArtistaSpotify, normalizarNombreArtista } from '../spotifyMatch.js';

const ID_A = '4Z8W4fKeB5YxbusRsdQVPb';
const ID_B = '0TnOYISbd1XYRBk9myaseg';

describe('normalizarNombreArtista', () => {
  it('ignora mayúsculas, tildes, signos y el artículo inicial', () => {
    expect(normalizarNombreArtista('  La Señora Tomasa! ')).toBe('la senora tomasa');
    expect(normalizarNombreArtista('The Pants')).toBe('pants');
    expect(normalizarNombreArtista('Angelus Apatrida')).toBe('angelus apatrida');
    expect(normalizarNombreArtista('Mägo de Oz')).toBe('mago de oz');
  });
});

describe('elegirArtistaSpotify', () => {
  it('acepta un nombre idéntico tras normalizar', () => {
    const r = elegirArtistaSpotify('mago de oz', [{ id: ID_A, name: 'Mägo de Oz' }]);
    expect(r).toEqual({ id: ID_A, url: `https://open.spotify.com/artist/${ID_A}` });
  });

  it('rechaza nombres parecidos pero distintos (prefiere ninguno a uno equivocado)', () => {
    expect(elegirArtistaSpotify('Bala', [{ id: ID_A, name: 'Bala Tour' }])).toBeNull();
    expect(elegirArtistaSpotify('Crisix', [{ id: ID_A, name: 'Crisis' }])).toBeNull();
  });

  it('entre homónimos elige el más seguido', () => {
    const r = elegirArtistaSpotify('Bala', [
      { id: ID_A, name: 'Bala', followers: 120 },
      { id: ID_B, name: 'Bala', followers: 45000 },
    ]);
    expect(r?.id).toBe(ID_B);
  });

  it('descarta resultados de reserva sin ID real de Spotify', () => {
    expect(
      elegirArtistaSpotify('Bala', [
        { id: 'dz_123', name: 'Bala' },
        { id: 'it_456', name: 'Bala' },
        { id: 'search_Bala', name: 'Bala' },
      ]),
    ).toBeNull();
  });

  it('devuelve null con nombre vacío o sin candidatos', () => {
    expect(elegirArtistaSpotify('', [{ id: ID_A, name: 'Bala' }])).toBeNull();
    expect(elegirArtistaSpotify('Bala', [])).toBeNull();
  });
});
