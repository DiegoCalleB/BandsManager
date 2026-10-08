import { describe, expect, it } from 'vitest';
import { spotifyArtistEmbedUrl, spotifyArtistId, spotifyArtistUrl } from '../spotifyEmbed';

const ID = '4Z8W4fKeB5YxbusRsdQVPb';

describe('spotifyArtistId', () => {
  it('acepta URL de artista, con query y con prefijo de idioma', () => {
    expect(spotifyArtistId(`https://open.spotify.com/artist/${ID}`)).toBe(ID);
    expect(spotifyArtistId(`https://open.spotify.com/artist/${ID}?si=abc123`)).toBe(ID);
    expect(spotifyArtistId(`https://open.spotify.com/intl-es/artist/${ID}`)).toBe(ID);
    expect(spotifyArtistId(`open.spotify.com/artist/${ID}`)).toBe(ID);
  });

  it('acepta el URI spotify:artist:ID', () => {
    expect(spotifyArtistId(`spotify:artist:${ID}`)).toBe(ID);
  });

  it('rechaza IDs que no son reales (como los de la semilla)', () => {
    expect(spotifyArtistId('https://open.spotify.com/artist/lasenoratomasa')).toBeNull();
  });

  it('rechaza otros hosts, YouTube y webs', () => {
    expect(spotifyArtistId('https://youtube.com/tarracoska_official')).toBeNull();
    expect(spotifyArtistId(`https://evil.com/artist/${ID}`)).toBeNull();
    expect(spotifyArtistId(`https://open.spotify.com.evil.com/artist/${ID}`)).toBeNull();
    expect(spotifyArtistId('https://labanda.es')).toBeNull();
  });

  it('rechaza álbumes, canciones y entradas vacías o raras', () => {
    expect(spotifyArtistId(`https://open.spotify.com/album/${ID}`)).toBeNull();
    expect(spotifyArtistId(`https://open.spotify.com/track/${ID}`)).toBeNull();
    expect(spotifyArtistId('')).toBeNull();
    expect(spotifyArtistId(undefined)).toBeNull();
    expect(spotifyArtistId('javascript:alert(1)')).toBeNull();
    expect(spotifyArtistId(`https://open.spotify.com/artist/${ID}"onload="x`)).toBeNull();
  });
});

describe('spotifyArtistEmbedUrl', () => {
  it('construye la URL del embed solo con el ID validado', () => {
    expect(spotifyArtistEmbedUrl(`https://open.spotify.com/artist/${ID}?si=x`)).toBe(
      `https://open.spotify.com/embed/artist/${ID}`,
    );
    expect(spotifyArtistEmbedUrl('https://youtube.com/x')).toBeNull();
  });
});

describe('spotifyArtistUrl', () => {
  it('devuelve el perfil del artista normalizado o null', () => {
    expect(spotifyArtistUrl(`https://open.spotify.com/intl-es/artist/${ID}?si=x`)).toBe(
      `https://open.spotify.com/artist/${ID}`,
    );
    expect(spotifyArtistUrl('https://youtube.com/@bala')).toBeNull();
  });
});
