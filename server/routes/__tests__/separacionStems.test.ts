/**
 * Comportamiento de POST /ai-stem-separation de punta a punta, con solo lo externo sustituido
 * (caché/reservas en Supabase y proveedores de IA). Escrito para la partición de ai_music.ts
 * (ADR 0042) y verificado contra el fichero original y contra el partido: mismas respuestas,
 * mismo resultado guardado y mismos fallos registrados, siempre en la banda de la sesión.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const cache = vi.hoisted(() => ({
  getStemsFromPersistentCache: vi.fn(),
  acquireStemsSeparationLock: vi.fn(),
  saveStemsToPersistentCache: vi.fn(async () => undefined),
  markStemsSeparationFailed: vi.fn(async () => undefined),
}));
const servicios = vi.hoisted(() => ({ fal: vi.fn(), 'dsp-server': vi.fn() }));

vi.mock('../../db/stemsCache.js', async (orig) => ({ ...(await orig<Record<string, unknown>>()), ...cache }));
vi.mock('../../services/audioSeparator/index.js', async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  AudioSeparatorFactory: { getService: (n: keyof typeof servicios) => ({ processAudio: servicios[n] }) },
}));
vi.mock('../../ai.js', async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  generateContentWithFallback: async () => ({ text: '' }),
}));

import aiMusicRouter from '../ai_music.js';
import { manejador } from './helpers/rutas.js';

const usuario = { id: 'u1', role: 'leader', band_id: 'band-a', allowedBandIds: ['band-a'] };
const STEMS = { Voz: { url: 'https://x.supabase.co/v.mp3', formato: 'MP3', tamano: '1 MB' } };

function resFalso() {
  const r: { code: number; body?: Record<string, unknown>; headersSent: boolean; status: (c: number) => typeof r; json: (b: Record<string, unknown>) => typeof r } = {
    code: 200,
    headersSent: false,
    status: (c) => ((r.code = c), r),
    json: (b) => ((r.body = b), (r.headersSent = true), r),
  };
  return r;
}

async function separar(body: Record<string, unknown>, headers: Record<string, string> = {}, user: typeof usuario = usuario) {
  const res = resFalso();
  await manejador(aiMusicRouter, '/ai-stem-separation', 'post')(
    { body: { songTitle: 'Tema', audioUrl: 'https://cdn.example.com/a.mp3', ...body }, headers, query: {}, user, get: () => 'localhost' },
    res,
  );
  return res;
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.REPLICATE_API_TOKEN;
  delete process.env.REPLICATE_API_KEY;
  cache.getStemsFromPersistentCache.mockResolvedValue(null);
  cache.acquireStemsSeparationLock.mockResolvedValue({ acquired: true });
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('POST /ai-stem-separation', () => {
  it('con caché devuelve los stems sin reservar ni separar', async () => {
    cache.getStemsFromPersistentCache.mockResolvedValue({ engine: 'fal', engineUsed: 'fal', isNeural: true, stemsMap: STEMS, timingBreakdown: { totalSec: '9s' } });
    const res = await separar({ engine: 'fal' });
    expect(res.code).toBe(200);
    expect(res.body).toMatchObject({ success: true, cached: true, isNeural: true, degraded: false, separationEngine: 'fal' });
    expect(res.body?.stems).toHaveLength(1);
    expect(cache.acquireStemsSeparationLock).not.toHaveBeenCalled();
    expect(servicios.fal).not.toHaveBeenCalled();
  });

  it('busca y reserva siempre en la banda de la sesión, aunque se pida otra', async () => {
    cache.acquireStemsSeparationLock.mockResolvedValue({ acquired: false, reason: 'in_progress_by_other_instance' });
    const res = await separar({ engine: 'fal', bandId: 'band-ajena' }, { 'x-band-id': 'band-ajena' });
    expect(cache.getStemsFromPersistentCache.mock.calls[0][0]).toBe('band-a');
    expect(cache.acquireStemsSeparationLock.mock.calls[0][0]).toBe('band-a');
    expect(res.code).toBe(202);
    expect(res.body).toMatchObject({ status: 'processing', bandId: 'band-a', engine: 'fal' });
  });

  it('si la reserva distribuida falla no gasta GPU: 503', async () => {
    cache.acquireStemsSeparationLock.mockResolvedValue({ acquired: false, reason: 'distributed_lock_failed', error: 'sin red' });
    const res = await separar({ engine: 'fal' });
    expect(res.code).toBe(503);
    expect(res.body).toMatchObject({ errorType: 'distributed_lock_unavailable', engine: 'fal' });
    expect(servicios.fal).not.toHaveBeenCalled();
  });

  it('el detalle técnico de la reserva fallida no llega a quien no es admin', async () => {
    cache.acquireStemsSeparationLock.mockResolvedValue({ acquired: false, reason: 'distributed_lock_failed', error: 'password authentication failed for user "postgres"' });
    const res = await separar({ engine: 'fal' });
    expect(JSON.stringify(res.body)).not.toContain('password authentication');
    expect(res.body?.details).toBeUndefined();
  });

  it('un admin sí ve el detalle técnico', async () => {
    cache.acquireStemsSeparationLock.mockResolvedValue({ acquired: false, reason: 'distributed_lock_failed', error: 'sin red' });
    const res = await separar({ engine: 'fal' }, {}, { ...usuario, role: 'admin' });
    expect(res.body?.details).toBe('sin red');
  });

  it('una reserva ya completada devuelve sus stems', async () => {
    cache.acquireStemsSeparationLock.mockResolvedValue({
      acquired: false,
      reason: 'already_completed',
      record: { engine: 'dsp-server', engineUsed: 'dsp-server', isNeural: false, stemsMap: STEMS },
    });
    const res = await separar({ engine: 'dsp-server' });
    expect(res.body).toMatchObject({ cached: true, degraded: false, engineUsed: 'dsp-server' });
  });

  it('separa en segundo plano: responde 202 y guarda el resultado de Fal.ai', async () => {
    servicios.fal.mockResolvedValue({ success: true, stemsMap: STEMS, timingBreakdown: { totalSec: '12s' } });
    const res = await separar({ engine: 'fal' });
    expect(res.code).toBe(202);
    expect(res.body).toMatchObject({ status: 'processing', bandId: 'band-a' });
    expect(cache.saveStemsToPersistentCache).toHaveBeenCalledWith(
      expect.objectContaining({ bandId: 'band-a', engine: 'fal', engineUsed: 'fal', isNeural: true, degraded: false, stemsMap: STEMS }),
    );
    expect(cache.markStemsSeparationFailed).not.toHaveBeenCalled();
  });

  it('si Fal.ai falla y no hay Replicate, cae al DSP local y lo marca como degradado', async () => {
    servicios.fal.mockResolvedValue({ success: false, stemsMap: {}, errorTitle: 'Sin saldo' });
    servicios['dsp-server'].mockResolvedValue({ success: true, stemsMap: STEMS });
    await separar({ engine: 'fal' });
    expect(cache.saveStemsToPersistentCache).toHaveBeenCalledWith(
      expect.objectContaining({ engine: 'fal', engineUsed: 'dsp_fallback', isNeural: false, degraded: true }),
    );
  });

  it('si fallan Fal.ai y el DSP, registra el fallo de Fal.ai para el polling', async () => {
    servicios.fal.mockResolvedValue({ success: false, stemsMap: {}, errorTitle: 'Sin saldo', error: 'TOP_UP', httpStatus: 403 });
    servicios['dsp-server'].mockResolvedValue({ success: false, stemsMap: {} });
    await separar({ engine: 'fal' });
    expect(cache.saveStemsToPersistentCache).not.toHaveBeenCalled();
    const [banda, , motor, payload] = cache.markStemsSeparationFailed.mock.calls[0] as unknown as [string, string, string, string];
    expect([banda, motor]).toEqual(['band-a', 'fal']);
    expect(JSON.parse(payload)).toMatchObject({ errorType: 'fal_error', errorTitle: 'Sin saldo', httpStatus: 403, engine: 'fal' });
  });

  it('Demucs sin token de Replicate falla con token_missing sin llamar a nadie', async () => {
    await separar({ engine: 'demucs' });
    const payload = JSON.parse((cache.markStemsSeparationFailed.mock.calls[0] as unknown as string[])[3]);
    expect(payload).toMatchObject({ errorType: 'token_missing', httpStatus: 400, engine: 'demucs' });
  });

  it('sin audio en modo auto registra «empty_result» en vez de dejar el trabajo colgado', async () => {
    await separar({ engine: 'auto', audioUrl: '' });
    const payload = JSON.parse((cache.markStemsSeparationFailed.mock.calls[0] as unknown as string[])[3]);
    expect(payload).toMatchObject({ errorType: 'empty_result', engine: 'auto' });
  });
});
