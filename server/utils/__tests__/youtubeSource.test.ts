import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  parseIso8601Duration,
  normalizarCapitulos,
  fusionarMetadatos,
  metadatosVacios,
  tieneClaveDataApi,
  metadatosDataApi,
  banderasAntiBot,
  rutaYtDlp,
  tramoDeDescarga,
} from '../youtubeSource';

const CLAVE_ORIGINAL = process.env.YOUTUBE_API_KEY;

afterEach(() => {
  if (CLAVE_ORIGINAL === undefined) delete process.env.YOUTUBE_API_KEY;
  else process.env.YOUTUBE_API_KEY = CLAVE_ORIGINAL;
  vi.unstubAllGlobals();
});

describe('parseIso8601Duration', () => {
  it('lee los formatos que devuelve la Data API', () => {
    expect(parseIso8601Duration('PT30S')).toBe(30);
    expect(parseIso8601Duration('PT4M13S')).toBe(253);
    expect(parseIso8601Duration('PT1H2M3S')).toBe(3723);
    expect(parseIso8601Duration('PT2H')).toBe(7200);
    expect(parseIso8601Duration('P1DT2H')).toBe(93600);
  });

  it('trunca los segundos decimales en vez de devolver NaN', () => {
    expect(parseIso8601Duration('PT1M30.5S')).toBe(90);
  });

  it('devuelve 0 ante basura, nunca NaN', () => {
    for (const v of ['', 'abc', 'P', null, undefined, '30' as any]) {
      const r = parseIso8601Duration(v as any);
      expect(Number.isFinite(r)).toBe(true);
      expect(r).toBe(0);
    }
  });
});

describe('normalizarCapitulos', () => {
  it('convierte los capítulos de yt-dlp', () => {
    const caps = normalizarCapitulos(
      [
        { title: 'Intro', start_time: 0, end_time: 45 },
        { title: 'Tema 1', start_time: 45, end_time: 230 },
      ],
      600
    );
    expect(caps).toEqual([
      { title: 'Intro', start: 0, end: 45 },
      { title: 'Tema 1', start: 45, end: 230 },
    ]);
  });

  it('cierra el último capítulo con la duración del vídeo si no trae fin', () => {
    const [cap] = normalizarCapitulos([{ title: 'Bis', start_time: 500 }], 600);
    expect(cap.end).toBe(600);
  });

  it('descarta capítulos sin título o sin inicio válido', () => {
    expect(normalizarCapitulos([{ start_time: 0 }, { title: 'x', start_time: -5 }, { title: '  ' }], 100)).toEqual([]);
  });

  it('aguanta que no haya capítulos', () => {
    expect(normalizarCapitulos(undefined)).toEqual([]);
    expect(normalizarCapitulos(null)).toEqual([]);
    expect(normalizarCapitulos('no es una lista')).toEqual([]);
  });
});

describe('fusionarMetadatos', () => {
  it('rellena solo los huecos, sin pisar lo que ya había', () => {
    const base = { ...metadatosVacios(), title: 'De la API', fuente: 'data-api' as const };
    const fusion = fusionarMetadatos(base, {
      ...metadatosVacios(),
      title: 'De yt-dlp',
      duration: 600,
      chapters: [{ title: 'Intro', start: 0, end: 30 }],
      fuente: 'yt-dlp',
    });

    expect(fusion.title).toBe('De la API');
    expect(fusion.duration).toBe(600);
    expect(fusion.chapters).toHaveLength(1);
    expect(fusion.fuente).toBe('data-api');
  });

  it('no se rompe si la segunda fuente falló', () => {
    const base = { ...metadatosVacios(), title: 'Solo esto' };
    expect(fusionarMetadatos(base, null)).toBe(base);
  });

  it('una duración de 0 se considera hueco y se rellena', () => {
    const base = { ...metadatosVacios(), duration: 0 };
    expect(fusionarMetadatos(base, { ...metadatosVacios(), duration: 120 }).duration).toBe(120);
  });
});

describe('tieneClaveDataApi', () => {
  it('detecta una clave utilizable', () => {
    process.env.YOUTUBE_API_KEY = 'AIzaSyA-clave-larga-de-prueba';
    expect(tieneClaveDataApi()).toBe(true);
  });

  it('no cuenta una clave vacía ni un placeholder corto', () => {
    process.env.YOUTUBE_API_KEY = '';
    expect(tieneClaveDataApi()).toBe(false);
    process.env.YOUTUBE_API_KEY = 'xxx';
    expect(tieneClaveDataApi()).toBe(false);
  });
});

describe('metadatosDataApi', () => {
  beforeEach(() => {
    process.env.YOUTUBE_API_KEY = 'AIzaSyA-clave-larga-de-prueba';
  });

  it('mapea la respuesta oficial a nuestra ficha', async () => {
    vi.stubGlobal('fetch', async () => ({
      ok: true,
      json: async () => ({
        items: [
          {
            snippet: {
              title: 'Directo en la sala',
              description: 'Bolo entero',
              channelTitle: 'Canal Ruta 66',
              thumbnails: { high: { url: 'https://i.ytimg.com/alta.jpg' } },
            },
            contentDetails: { duration: 'PT10M' },
          },
        ],
      }),
    }));

    const meta = await metadatosDataApi('8Jdw41lYdak');
    expect(meta).not.toBeNull();
    expect(meta!.title).toBe('Directo en la sala');
    expect(meta!.duration).toBe(600);
    expect(meta!.author).toBe('Canal Ruta 66');
    expect(meta!.thumbnail).toBe('https://i.ytimg.com/alta.jpg');
    expect(meta!.fuente).toBe('data-api');
  });

  it('devuelve null si el vídeo no existe, para que se pruebe otra fuente', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: true, json: async () => ({ items: [] }) }));
    expect(await metadatosDataApi('noexiste123')).toBeNull();
  });

  it('devuelve null si la API responde con error (cuota agotada, clave mala)', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 403, json: async () => ({}) }));
    expect(await metadatosDataApi('8Jdw41lYdak')).toBeNull();
  });

  it('un fallo de red no lanza: devuelve null y se sigue', async () => {
    vi.stubGlobal('fetch', async () => { throw new Error('ECONNRESET'); });
    expect(await metadatosDataApi('8Jdw41lYdak')).toBeNull();
  });

  it('sin clave configurada ni siquiera llama a la red', async () => {
    delete process.env.YOUTUBE_API_KEY;
    let llamadas = 0;
    vi.stubGlobal('fetch', async () => { llamadas++; return { ok: true, json: async () => ({}) }; });
    expect(await metadatosDataApi('8Jdw41lYdak')).toBeNull();
    expect(llamadas).toBe(0);
  });
});

describe('tramoDeDescarga', () => {
  it('deja margen por delante y devuelve ese margen como desplazamiento', () => {
    // Es la pieza de la que depende que el corte salga del sitio correcto: lo que se recorta
    // luego con ffmpeg va referido al fichero descargado, no al vídeo original.
    expect(tramoDeDescarga(720, 30)).toEqual({ desde: 718, hasta: 752, offset: 718 });
  });

  it('el desplazamiento y el inicio del tramo son SIEMPRE el mismo número', () => {
    // Si se separan, el corte sale desplazado justo por esa diferencia.
    for (const [inicio, dur] of [[0, 30], [1, 15], [5, 60], [3600, 30]] as const) {
      const t = tramoDeDescarga(inicio, dur);
      expect(t.offset).toBe(t.desde);
    }
  });

  it('no se va por debajo de cero al principio del vídeo', () => {
    expect(tramoDeDescarga(0, 30).desde).toBe(0);
    expect(tramoDeDescarga(0, 30).offset).toBe(0);
    expect(tramoDeDescarga(1, 30).desde).toBe(0);
  });

  it('el tramo cubre de sobra el corte pedido', () => {
    const t = tramoDeDescarga(100, 30);
    expect(t.desde).toBeLessThanOrEqual(100);
    expect(t.hasta).toBeGreaterThanOrEqual(130);
  });

  it('aguanta valores basura sin devolver NaN', () => {
    for (const t of [tramoDeDescarga(NaN as any, NaN as any), tramoDeDescarga(-50, 0)]) {
      expect(Number.isFinite(t.desde)).toBe(true);
      expect(Number.isFinite(t.hasta)).toBe(true);
      expect(t.desde).toBeGreaterThanOrEqual(0);
      expect(t.hasta).toBeGreaterThan(t.desde);
    }
  });
});

describe('banderasAntiBot', () => {
  it('incluye los clientes alternativos y un user-agent de navegador', () => {
    const flags = banderasAntiBot();
    expect(flags).toContain('--extractor-args');
    expect(flags.join( ' ')).toContain('youtube:player_client=android');
    expect(flags).toContain('--user-agent');
  });
});

describe('rutaYtDlp', () => {
  it('cae al binario del PATH cuando no hay uno propio en bin/', () => {
    // En este repo bin/ está en .gitignore, así que lo normal es no tener binario propio.
    expect(typeof rutaYtDlp()).toBe('string');
    expect(rutaYtDlp().length).toBeGreaterThan(0);
  });
});
