import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { capturarMetricasBanda } from '../metricasBandaService.js';

const SIN_INSTAGRAM = { motivo: 'Instagram sin conectar (falta el token de Meta)' };

beforeEach(() => {
  vi.stubEnv('YOUTUBE_API_KEY', '');
  vi.stubEnv('YT_API_KEY', '');
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

// Sin enlace de Spotify, sin clave de YouTube y sin Instagram, solo la llamada a Deezer sale de la red.
const conDeezer = (datos: unknown, status = 200) =>
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(datos), { status })));

describe('capturarMetricasBanda · Deezer', () => {
  it('guarda los fans del artista con nombre exacto como fuente deezer', async () => {
    conDeezer({
      data: [
        { id: 1, name: 'Bala Tour', nb_fan: 999 },
        { id: 2, name: 'Bala', nb_fan: 1234 },
      ],
    });
    const { filas, motivos } = await capturarMetricasBanda('Bala', {}, SIN_INSTAGRAM);
    expect(filas).toEqual([{ fuente: 'deezer', seguidores: 1234 }]);
    expect(motivos.map((m) => m.fuente)).toEqual(['spotify', 'instagram', 'youtube']);
  });

  it('informa del motivo cuando no hay artista con ese nombre', async () => {
    conDeezer({ data: [{ id: 3, name: 'Otra banda', nb_fan: 5 }] });
    const { filas, motivos } = await capturarMetricasBanda('Bala', {}, SIN_INSTAGRAM);
    expect(filas).toEqual([]);
    expect(motivos).toContainEqual({ fuente: 'deezer', motivo: 'Deezer no tiene un artista con ese nombre exacto' });
  });

  it('informa del estado HTTP cuando Deezer falla', async () => {
    conDeezer({}, 503);
    const { motivos } = await capturarMetricasBanda('Bala', {}, SIN_INSTAGRAM);
    expect(motivos).toContainEqual({ fuente: 'deezer', motivo: 'Deezer respondió 503' });
  });
});

describe('capturarMetricasBanda · Instagram y YouTube por enlace', () => {
  it('saca los seguidores de Instagram con las credenciales y el enlace de la banda', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) =>
      String(url).includes('graph.facebook.com')
        ? new Response(JSON.stringify({ business_discovery: { followers_count: 777 } }), { status: 200 })
        : new Response(JSON.stringify({ data: [] }), { status: 200 })));
    const { filas } = await capturarMetricasBanda('Bala', { instagram: 'https://instagram.com/bala' }, { token: 'EAA', cuentaId: '1' });
    expect(filas).toContainEqual({ fuente: 'instagram', seguidores: 777 });
  });

  it('lee el canal de YouTube del enlace guardado sin gastar una búsqueda', async () => {
    vi.stubEnv('YOUTUBE_API_KEY', 'clave');
    const fetchMock = vi.fn(async (url: string) =>
      String(url).includes('googleapis.com/youtube/v3/channels')
        ? new Response(JSON.stringify({ items: [{ statistics: { subscriberCount: '4200', viewCount: '90000' } }] }), { status: 200 })
        : new Response(JSON.stringify({ data: [] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const { filas } = await capturarMetricasBanda('Bala', { youtube: 'https://youtube.com/@BalaOficial' }, SIN_INSTAGRAM);
    expect(filas).toContainEqual({ fuente: 'youtube', suscriptores: 4200, visualizaciones: 90000 });
    const urls = fetchMock.mock.calls.map((c) => String((c as unknown[])[0]));
    expect(urls.some((u) => u.includes('/v3/search'))).toBe(false);
    expect(urls.some((u) => u.includes('forHandle=BalaOficial'))).toBe(true);
  });

  it('si el enlace de YouTube no resuelve, busca por nombre como antes', async () => {
    vi.stubEnv('YOUTUBE_API_KEY', 'clave');
    const fetchMock = vi.fn(async (url: string) => {
      const u = String(url);
      if (u.includes('forHandle=')) return new Response(JSON.stringify({ items: [] }), { status: 200 });
      if (u.includes('/v3/search')) return new Response(JSON.stringify({ items: [{ id: { channelId: 'UCx' }, snippet: { channelTitle: 'Bala' } }] }), { status: 200 });
      if (u.includes('id=UCx')) return new Response(JSON.stringify({ items: [{ statistics: { subscriberCount: '10', viewCount: '20' } }] }), { status: 200 });
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);
    const { filas } = await capturarMetricasBanda('Bala', { youtube: 'https://youtube.com/@Roto' }, SIN_INSTAGRAM);
    expect(filas).toContainEqual({ fuente: 'youtube', suscriptores: 10, visualizaciones: 20 });
  });
});
