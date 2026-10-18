import { describe, expect, it } from 'vitest';
import {
  elegirArtistaSpotify,
  estadoSpotifyBanda,
  normalizarNombreArtista,
  planificarSpotifyBanda,
} from '../spotifyMatch.js';

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

describe('estadoSpotifyBanda', () => {
  it('distingue vacío, válido, roto y otro', () => {
    expect(estadoSpotifyBanda('')).toBe('vacio');
    expect(estadoSpotifyBanda(undefined)).toBe('vacio');
    expect(estadoSpotifyBanda(`https://open.spotify.com/artist/${ID_A}?si=x`)).toBe('valido');
    expect(estadoSpotifyBanda(`https://open.spotify.com/intl-es/artist/${ID_A}`)).toBe('valido');
    expect(estadoSpotifyBanda(`spotify:artist:${ID_A}`)).toBe('valido');
    expect(estadoSpotifyBanda('https://open.spotify.com/artist/lasenoratomasa')).toBe('invalido');
    expect(estadoSpotifyBanda('https://open.spotify.com/search/Bala')).toBe('invalido');
    expect(estadoSpotifyBanda(`https://open.spotify.com/artist/${ID_A}extra`)).toBe('invalido');
    expect(estadoSpotifyBanda('https://youtube.com/@bala')).toBe('otro');
    expect(estadoSpotifyBanda('https://labanda.es')).toBe('otro');
  });
});

describe('planificarSpotifyBanda', () => {
  const URL_OK = `https://open.spotify.com/artist/${ID_A}`;

  it('completa los vacíos y reemplaza los rotos cuando hay sustituto verificado', () => {
    expect(planificarSpotifyBanda('', URL_OK)).toEqual({ accion: 'completar', nuevo: URL_OK });
    expect(planificarSpotifyBanda('https://open.spotify.com/artist/inventado', URL_OK)).toEqual({
      accion: 'reemplazar',
      nuevo: URL_OK,
    });
  });

  it('nunca toca un enlace válido, un YouTube ni una web', () => {
    expect(planificarSpotifyBanda(URL_OK, `https://open.spotify.com/artist/${ID_B}`).accion).toBe('mantener');
    expect(planificarSpotifyBanda('https://youtube.com/@bala', URL_OK).accion).toBe('mantener');
    expect(planificarSpotifyBanda('https://labanda.es', URL_OK).accion).toBe('mantener');
  });

  it('no borra un enlace roto si no hay sustituto verificado', () => {
    expect(planificarSpotifyBanda('https://open.spotify.com/artist/inventado', '')).toEqual({ accion: 'sin_sustituto' });
    expect(planificarSpotifyBanda('', '')).toEqual({ accion: 'mantener' });
  });
  it('un enlace con ID válido pero inexistente (404) se sustituye si hay sustituto verificado', () => {
    const roto = 'https://open.spotify.com/artist/0OdUWJ0sBjDrqHygGUXeCF';
    expect(planificarSpotifyBanda(roto, 'https://open.spotify.com/artist/NUEVOID0000000000000A', true)).toEqual({
      accion: 'reemplazar',
      nuevo: 'https://open.spotify.com/artist/NUEVOID0000000000000A',
    });
    expect(planificarSpotifyBanda(roto, '', true)).toEqual({ accion: 'sin_sustituto' });
    expect(planificarSpotifyBanda(roto, 'https://open.spotify.com/artist/NUEVOID0000000000000A', false)).toEqual({ accion: 'mantener' });
  });
});
