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
