import { describe, it, expect, vi, beforeEach } from 'vitest';

const upsertMock = vi.fn();
const fromMock = vi.fn();

vi.mock('../core.js', () => ({
  getSupabase: () => ({ from: fromMock }),
  cleanBandId: (bandId?: string) => (bandId || '').replace(/^(band|reg)-/, '')
}));

vi.mock('../bands.js', () => ({
  ensureRegisteredBandExists: vi.fn().mockResolvedValue(undefined)
}));

import { dbUpsertSocialContentItem } from '../social';

describe('dbUpsertSocialContentItem: vistas de los vídeos scrapeados', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockImplementation(() => {
      const qb: any = {
        select: vi.fn(() => qb),
        eq: vi.fn(() => qb),
        maybeSingle: vi.fn(async () => ({ data: null, error: null })),
        single: vi.fn(async () => ({ data: null, error: null }))
      };
      qb.upsert = upsertMock.mockImplementation(() => qb);
      return qb;
    });
  });

  // Bug real: /api/metrics/scrape mandaba `views_count` y la capa de datos solo leía `views`,
  // así que todos los vídeos de YouTube se guardaban con 0 vistas.
  it('acepta views_count como alias de views', async () => {
    await dbUpsertSocialContentItem(
      { platform: 'youtube', external_id: 'abc', title: 'Directo', views_count: 1234 },
      'band-x'
    );
    expect(upsertMock.mock.calls[0][0].views).toBe(1234);
  });

  it('views sigue mandando sobre el alias', async () => {
    await dbUpsertSocialContentItem(
      { platform: 'youtube', external_id: 'abc', title: 'Directo', views: 10, views_count: 99 },
      'band-x'
    );
    expect(upsertMock.mock.calls[0][0].views).toBe(10);
  });
});
