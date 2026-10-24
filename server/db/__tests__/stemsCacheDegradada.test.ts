import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../core.js', () => ({ getSupabase: () => { throw new Error('sin Supabase en el test'); } }));
vi.mock('../bands.js', () => ({ ensureRegisteredBandExists: async () => {} }));

import { getStemsFromPersistentCache, stemsMemoryCache, type StemsCacheRecord } from '../stemsCache';

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
