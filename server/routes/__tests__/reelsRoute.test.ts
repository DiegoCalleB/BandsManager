import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import express from 'express';
import type { AddressInfo } from 'net';

/**
 * Prueba de integración de las rutas de Reels con la red simulada. Verifica el cableado que
 * los tests unitarios de reelsCore/bandProfile no cubren: que el perfil de la banda llega al
 * prompt, que la respuesta de la IA se sanea contra la duración real y que un modelo caído
 * degrada a cortes de respaldo en vez de devolver un 500.
 */

const respuestaIa = { texto: '' };
const aiDisponible = { valor: true };

vi.mock('../../state.js', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { id: 'user-1', role: 'leader', band_id: 'band-ruta-66', allowedBandIds: ['band-ruta-66'] };
    next();
  },
  loadState: () => ({
    users: [
      { name: 'Paco', instrument: 'Guitarra', band_id: 'band-ruta-66' },
      { name: 'Ana', instrument: 'Batería', band_id: 'band-ruta-66' },
      { name: 'Raúl', instrument: 'Violín', band_id: 'band-bakandeya' },
    ],
    bands: [],
  }),
}));

vi.mock('../../db.js', () => ({
  dbGetRegisteredBandById: async () => ({
    nombre_banda: 'Ruta 66',
    estilo_musical: 'Rock clásico',
    localizacion: 'Sevilla',
  }),
  dbGetEpkConfig: async () => ({ biografia: 'Banda de versiones de rock.' }),
}));

const promptsVistos: string[] = [];

vi.mock('../../ai.js', () => ({
  GEMINI_MODEL: 'test-model',
  getAiClient: () => (aiDisponible.valor ? {} : null),
  generateContentWithFallback: async (_client: any, params: any) => {
    promptsVistos.push(String(params.contents));
    if (!respuestaIa.texto) throw new Error('modelo caído');
    return { text: respuestaIa.texto };
  },
}));

vi.mock('@distube/ytdl-core', () => ({
  default: Object.assign(
    () => { throw new Error('no se descarga en los tests'); },
    { getBasicInfo: async () => ({ videoDetails: { title: 'Directo en la sala', lengthSeconds: '600', author: { name: 'Canal Ruta 66' }, description: '' } }) }
  ),
}));

vi.mock('youtube-transcript', () => ({
  YoutubeTranscript: {
    fetchTranscript: async () => [
      { offset: 1000, duration: 2000, text: 'buenas noches Sevilla' },
      { offset: 60000, duration: 2000, text: 'esta va por vosotros' },
    ],
  },
}));

vi.mock('fluent-ffmpeg', () => ({
  default: Object.assign(() => ({}), { setFfmpegPath: () => {} }),
}));
vi.mock('ffmpeg-static', () => ({ default: '/bin/false' }));

// Sin este mock cada petición lanzaba un `yt-dlp` de verdad y salía a la red: el fichero
// pasaba de 0,5 s a 17 s y en CI dependería de que el binario esté instalado.
const fuentes = {
  dataApi: true,
  ytDlpInstalado: false,
  capitulos: [] as Array<{ title: string; start: number; end: number }>,
};
const llamadas = { dataApi: 0, ytDlp: 0, descargas: 0 };

vi.mock('../../utils/youtubeSource.js', async (importOriginal) => {
  // fusionarMetadatos / metadatosVacios / normalizarCapitulos son puros: usamos los de verdad.
  const real = await importOriginal<typeof import('../../utils/youtubeSource.js')>();
  return {
    ...real,
    tieneClaveDataApi: () => fuentes.dataApi,
    metadatosDataApi: async () => {
      llamadas.dataApi++;
      if (!fuentes.dataApi) return null;
      return {
        title: 'Directo en la sala',
        description: '',
        author: 'Canal Ruta 66',
        duration: 600,
        thumbnail: 'https://i.ytimg.com/alta.jpg',
        chapters: [],
        fuente: 'data-api' as const,
      };
    },
    ytDlpDisponible: async () => fuentes.ytDlpInstalado,
    metadatosYtDlp: async () => {
      llamadas.ytDlp++;
      if (!fuentes.ytDlpInstalado) return null;
      return {
        title: 'Directo en la sala',
        description: '',
        author: 'Canal Ruta 66',
        duration: 600,
        thumbnail: '',
        chapters: fuentes.capitulos,
        fuente: 'yt-dlp' as const,
      };
    },
    descargarConYtDlp: async () => {
      llamadas.descargas++;
      return { ok: false, offset: 0 };
    },
    // Ojo: las llamadas internas del módulo no pasan por el mock, así que urlDeAudioDirecta
    // ejecutaría el ytDlpDisponible REAL y lanzaría un proceso por petición.
    urlDeAudioDirecta: async () => (fuentes.ytDlpInstalado ? 'https://audio.example/stream.webm' : null),
  };
});

const energia = { ventanas: [] as Array<{ start: number; end: number; db: number; score: number }> };

vi.mock('../../utils/audioEnergy.js', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../utils/audioEnergy.js')>();
  return {
    ...real,
    // Lo puro (ventanasConMasEnergia, resumirEnergiaParaPrompt) se usa de verdad; solo se
    // sustituye la parte que llamaría a ffmpeg contra una URL remota.
    analizarEnergiaAudio: async () =>
      energia.ventanas.flatMap((v) => {
        const puntos = [];
        for (let t = v.start; t < v.end; t++) puntos.push({ t, db: v.db });
        return puntos;
      }),
  };
});

// Guardamos el fetch real ANTES de sustituirlo: las pruebas necesitan llamar al servidor
// local, y el stub solo debe cubrir la llamada a oEmbed que hace la ruta.
const realFetch = globalThis.fetch.bind(globalThis);

vi.stubGlobal('fetch', async () => ({
  ok: true,
  json: async () => ({ title: 'Directo en la sala', author_name: 'Canal Ruta 66' }),
}));

const { default: reelsRouter } = await import('../reels.js');

const app = express();
app.use(express.json());
app.use('/api', reelsRouter);
const server = app.listen(0);
const puerto = (server.address() as AddressInfo).port;

async function post(ruta: string, cuerpo: any) {
  const res = await realFetch(`http://127.0.0.1:${puerto}${ruta}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
  return { status: res.status, body: await res.json() };
}

async function get(ruta: string) {
  const res = await realFetch(`http://127.0.0.1:${puerto}${ruta}`);
  return { status: res.status, body: await res.json() };
}

afterAll(() => {
  server.close();
});

beforeEach(() => {
  promptsVistos.length = 0;
  respuestaIa.texto = '';
  aiDisponible.valor = true;
  fuentes.dataApi = true;
  fuentes.ytDlpInstalado = false;
  fuentes.capitulos = [];
  llamadas.dataApi = 0;
  llamadas.ytDlp = 0;
  llamadas.descargas = 0;
  energia.ventanas = [];
});

describe('POST /api/analyze-video-highlights', () => {
  it('mete la ficha real de la banda en el prompt, no otra banda', async () => {
    respuestaIa.texto = JSON.stringify({
      highlights: [{ id: 'hl-1', title: 'Arranque', startSec: 10, endSec: 40, confidence: 95 }],
    });

    const { status, body } = await post('/api/analyze-video-highlights', {
      youtubeUrl: 'https://youtu.be/8Jdw41lYdak',
      targetDuration: 30,
    });

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.generatedByAI).toBe(true);

    const prompt = promptsVistos[0];
    expect(prompt).toContain('Ruta 66');
    expect(prompt).toContain('Rock clásico');
    expect(prompt).toContain('Guitarra, Batería');
    // El violinista es de otra banda: no puede aparecer en el contexto de esta.
    expect(prompt).not.toContain('Violín');
    expect(prompt).not.toContain('Bakandeya');
  });

  it('usa la duración real del vídeo, no la duración deseada del clip', async () => {
    respuestaIa.texto = JSON.stringify({ highlights: [{ title: 'A', startSec: 500, endSec: 530 }] });

    const { body } = await post('/api/analyze-video-highlights', {
      youtubeUrl: 'https://youtu.be/8Jdw41lYdak',
      targetDuration: 30,
    });

    // El vídeo dura 600 s: un corte en el 500 es válido y debe sobrevivir.
    expect(body.videoMeta.duration).toBe(600);
    expect(body.videoMeta.durationKnown).toBe(true);
    expect(body.highlights[0].startSec).toBe(500);
  });

  it('recorta los rangos que la IA se inventa fuera del vídeo', async () => {
    respuestaIa.texto = JSON.stringify({ highlights: [{ title: 'A', startSec: 5000, endSec: 5030 }] });
    const { body } = await post('/api/analyze-video-highlights', {
      youtubeUrl: 'https://youtu.be/8Jdw41lYdak',
      targetDuration: 30,
    });
    expect(body.highlights[0].endSec).toBeLessThanOrEqual(600);
  });

  it('aguanta que el modelo envuelva el JSON en markdown y texto', async () => {
    respuestaIa.texto = 'Claro:\n```json\n{"highlights":[{"title":"Con vallas","startSec":0,"endSec":30}]}\n```\n¡Suerte!';
    const { body } = await post('/api/analyze-video-highlights', {
      youtubeUrl: 'https://youtu.be/8Jdw41lYdak',
      targetDuration: 30,
    });
    expect(body.generatedByAI).toBe(true);
    expect(body.highlights[0].title).toBe('Con vallas');
  });

  it('con la IA caída devuelve cortes de respaldo y lo dice, sin 500', async () => {
    respuestaIa.texto = '';
    const { status, body } = await post('/api/analyze-video-highlights', {
      youtubeUrl: 'https://youtu.be/8Jdw41lYdak',
      targetDuration: 30,
    });

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.generatedByAI).toBe(false);
    expect(body.notice).toBeTruthy();
    expect(body.highlights.length).toBeGreaterThan(0);
    for (const clip of body.highlights) {
      expect(clip.endSec).toBeLessThanOrEqual(600);
    }
  });

  it('pasa a la IA los tramos con más energía medida en el audio', async () => {
    fuentes.ytDlpInstalado = true;
    // Silencio al principio, caña entre el 100 y el 160.
    energia.ventanas = [
      { start: 0, end: 100, db: -50, score: 0 },
      { start: 100, end: 160, db: -12, score: 100 },
      { start: 160, end: 600, db: -45, score: 0 },
    ];
    respuestaIa.texto = JSON.stringify({ highlights: [{ title: 'A', startSec: 100, endSec: 130 }] });

    await post('/api/analyze-video-highlights', {
      youtubeUrl: 'https://youtu.be/8Jdw41lYdak',
      targetDuration: 30,
    });

    const prompt = promptsVistos[0];
    expect(prompt).toContain('ENERGÍA SONORA MEDIDA EN EL AUDIO REAL');
    expect(prompt).toMatch(/1:4[0-9]|2:0[0-9]/); // la ventana fuerte cae sobre el minuto 1-2
  });

  it('pasa a la IA los capítulos que marcó quien subió el vídeo', async () => {
    fuentes.ytDlpInstalado = true;
    fuentes.capitulos = [{ title: 'Solo de guitarra', start: 120, end: 180 }];
    respuestaIa.texto = JSON.stringify({ highlights: [{ title: 'A', startSec: 120, endSec: 150 }] });

    await post('/api/analyze-video-highlights', {
      youtubeUrl: 'https://youtu.be/8Jdw41lYdak',
      targetDuration: 30,
    });
    expect(promptsVistos[0]).toContain('Solo de guitarra');
    expect(promptsVistos[0]).toContain('CAPÍTULOS');
  });

  it('sin IA, los cortes de respaldo caen en los picos de energía, no en posiciones fijas', async () => {
    aiDisponible.valor = false;
    fuentes.ytDlpInstalado = true;
    energia.ventanas = [
      { start: 0, end: 200, db: -50, score: 0 },
      { start: 200, end: 260, db: -10, score: 100 },
      { start: 260, end: 600, db: -48, score: 0 },
    ];

    const { body } = await post('/api/analyze-video-highlights', {
      youtubeUrl: 'https://youtu.be/8Jdw41lYdak',
      targetDuration: 30,
    });

    expect(body.generatedByAI).toBe(false);
    expect(body.audioAnalyzed).toBe(true);
    // El corte con más confianza debe estar dentro del tramo fuerte (200-260), no en el 0.
    const mejor = body.highlights[0];
    expect(mejor.startSec).toBeGreaterThanOrEqual(195);
    expect(mejor.startSec).toBeLessThan(260);
  });

  it('si no se puede medir el audio, el análisis sigue igual', async () => {
    fuentes.ytDlpInstalado = false; // sin yt-dlp no hay URL de audio
    respuestaIa.texto = JSON.stringify({ highlights: [{ title: 'A', startSec: 10, endSec: 40 }] });

    const { status, body } = await post('/api/analyze-video-highlights', {
      youtubeUrl: 'https://youtu.be/8Jdw41lYdak',
      targetDuration: 30,
    });
    expect(status).toBe(200);
    expect(body.audioAnalyzed).toBe(false);
    expect(body.highlights).toHaveLength(1);
  });

  it('sin clave de IA también responde con cortes utilizables', async () => {
    aiDisponible.valor = false;
    const { body } = await post('/api/analyze-video-highlights', {
      youtubeUrl: 'https://youtu.be/8Jdw41lYdak',
      targetDuration: 15,
    });
    expect(body.success).toBe(true);
    expect(body.generatedByAI).toBe(false);
    expect(body.highlights.length).toBeGreaterThan(0);
  });
});

describe('GET /api/youtube-meta', () => {
  it('devuelve la ficha real del vídeo', async () => {
    const { status, body } = await get('/api/youtube-meta?url=https://youtu.be/8Jdw41lYdak');
    expect(status).toBe(200);
    expect(body.meta.duration).toBe(600);
    expect(body.meta.durationKnown).toBe(true);
    expect(body.meta.hasTranscript).toBe(true);
    expect(body.meta.title).toBe('Directo en la sala');
  });

  it('rechaza una URL que no es de YouTube', async () => {
    const { status, body } = await get('/api/youtube-meta?url=https://example.com/x');
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('con la Data API y sin yt-dlp, no gasta tiempo en yt-dlp', async () => {
    fuentes.dataApi = true;
    fuentes.ytDlpInstalado = false;
    const { body } = await get('/api/youtube-meta?url=https://youtu.be/8Jdw41lYdak');
    expect(body.meta.duration).toBe(600);
    expect(llamadas.dataApi).toBe(1);
    expect(llamadas.ytDlp).toBe(0);
  });

  it('sin clave de Data API cae a yt-dlp', async () => {
    fuentes.dataApi = false;
    fuentes.ytDlpInstalado = true;
    const { body } = await get('/api/youtube-meta?url=https://youtu.be/8Jdw41lYdak');
    expect(llamadas.ytDlp).toBe(1);
    expect(body.meta.duration).toBe(600);
  });

  it('con Data API y yt-dlp instalado, consulta yt-dlp por los capítulos', async () => {
    // Los capítulos solo los da yt-dlp, y son la mejor pista para elegir cortes:
    // merece la pena la llamada extra aunque la ficha ya esté completa.
    fuentes.dataApi = true;
    fuentes.ytDlpInstalado = true;
    fuentes.capitulos = [{ title: 'Solo de guitarra', start: 120, end: 180 }];
    await get('/api/youtube-meta?url=https://youtu.be/8Jdw41lYdak');
    expect(llamadas.dataApi).toBe(1);
    expect(llamadas.ytDlp).toBe(1);
  });
});

describe('POST /api/reanalyze-clip', () => {
  it('prioriza las notas del usuario en el prompt', async () => {
    respuestaIa.texto = JSON.stringify({ title: 'Solo de bajo', reason: 'x', confidence: 98 });
    const { body } = await post('/api/reanalyze-clip', {
      youtubeUrl: 'https://youtu.be/8Jdw41lYdak',
      start: 60,
      duration: 30,
      userNotes: 'aquí solo tocan bajo y batería',
    });

    expect(body.success).toBe(true);
    expect(body.analysis.title).toBe('Solo de bajo');
    expect(promptsVistos[0]).toContain('aquí solo tocan bajo y batería');
    expect(promptsVistos[0]).toContain('Ruta 66');
  });

  it('con la IA caída devuelve una plantilla marcada como tal', async () => {
    respuestaIa.texto = '';
    const { status, body } = await post('/api/reanalyze-clip', { start: 0, duration: 30 });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.generatedByAI).toBe(false);
    expect(body.analysis.title).toContain('Ruta 66');
  });
});

describe('POST /api/cut-video-clip', () => {
  it('rechaza una petición sin URL', async () => {
    const { status, body } = await post('/api/cut-video-clip', {});
    expect(status).toBe(400);
    expect(body.error).toContain('youtubeUrl');
  });

  it('rechaza una URL que no es de YouTube', async () => {
    const { status } = await post('/api/cut-video-clip', { youtubeUrl: 'https://example.com/v.mp4' });
    expect(status).toBe(400);
  });
});
