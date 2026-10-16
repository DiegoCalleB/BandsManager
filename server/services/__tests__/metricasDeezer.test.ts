import { afterEach, describe, expect, it, vi } from 'vitest';
import { capturarMetricasBanda } from '../metricasBandaService.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

// Sin enlace de Spotify ni clave de YouTube, solo la llamada a Deezer sale de la red.
const conDeezer = (datos: unknown, status = 200) =>
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(datos), { status })));

describe('capturarMetricasBanda · Deezer', () => {
  it('guarda los fans del artista con nombre exacto como fuente deezer', async () => {
    vi.stubEnv('YOUTUBE_API_KEY', '');
    vi.stubEnv('YT_API_KEY', '');
    conDeezer({
      data: [
        { id: 1, name: 'Bala Tour', nb_fan: 999 },
        { id: 2, name: 'Bala', nb_fan: 1234 },
      ],
    });
    const { filas, motivos } = await capturarMetricasBanda('Bala', '');
    expect(filas).toEqual([{ fuente: 'deezer', seguidores: 1234 }]);
    expect(motivos.map((m) => m.fuente)).toEqual(['spotify', 'youtube']);
  });

  it('informa del motivo cuando no hay artista con ese nombre', async () => {
    conDeezer({ data: [{ id: 3, name: 'Otra banda', nb_fan: 5 }] });
    const { filas, motivos } = await capturarMetricasBanda('Bala', '');
    expect(filas).toEqual([]);
    expect(motivos).toContainEqual({ fuente: 'deezer', motivo: 'Deezer no tiene un artista con ese nombre exacto' });
  });

  it('informa del estado HTTP cuando Deezer falla', async () => {
    conDeezer({}, 503);
    const { motivos } = await capturarMetricasBanda('Bala', '');
    expect(motivos).toContainEqual({ fuente: 'deezer', motivo: 'Deezer respondió 503' });
  });
});
