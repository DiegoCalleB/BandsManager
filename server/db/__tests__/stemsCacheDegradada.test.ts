import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../core.js', () => ({ getSupabase: () => { throw new Error('sin Supabase en el test'); } }));
vi.mock('../bands.js', () => ({ ensureRegisteredBandExists: async () => {} }));

import { acquireStemsSeparationLock, getStemsFromPersistentCache, stemsMemoryCache, type StemsCacheRecord } from '../stemsCache';

const registro = (degraded: boolean): StemsCacheRecord => ({
  bandId: 'b1',
  songHash: 'h1',
  engine: 'fal',
  engineUsed: 'dsp_fallback',
  status: 'completed',
  isNeural: false,
  degraded,
  stemsMap: { voz: { url: 'u', formato: 'mp3', tamano: '1 MB' } },
});

describe('getStemsFromPersistentCache con resultado degradado', () => {
  beforeEach(() => stemsMemoryCache.clear());

  it('devuelve los stems neuronales guardados', async () => {
    stemsMemoryCache.set('b1:h1:fal', { ...registro(false), isNeural: true });
    expect(await getStemsFromPersistentCache('b1', 'h1', 'fal')).not.toBeNull();
  });

  it('no sirve como acierto de caché lo que salió del DSP de respaldo: se reintenta la IA', async () => {
    stemsMemoryCache.set('b1:h1:fal', registro(true));
    expect(await getStemsFromPersistentCache('b1', 'h1', 'fal')).toBeNull();
  });
});

describe('acquireStemsSeparationLock con forzar', () => {
  beforeEach(() => stemsMemoryCache.clear());

  it('sin forzar, una separación completa se reutiliza', async () => {
    stemsMemoryCache.set('b1:h1:fal', { ...registro(false), isNeural: true });
    expect(await acquireStemsSeparationLock('b1', 'h1', 'fal')).toMatchObject({ acquired: false, reason: 'already_completed' });
  });

  it('con forzar no la reutiliza: va a por una separación nueva', async () => {
    stemsMemoryCache.set('b1:h1:fal', { ...registro(false), isNeural: true });
    // El mock de Supabase lanza: llegar a él prueba que se saltó la caché en memoria.
    expect(await acquireStemsSeparationLock('b1', 'h1', 'fal', 'i1', true)).toMatchObject({ reason: 'distributed_lock_failed' });
  });
});
