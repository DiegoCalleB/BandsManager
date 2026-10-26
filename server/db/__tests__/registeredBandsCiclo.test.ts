import { beforeEach, describe, expect, it, vi } from 'vitest';

const upsert = vi.fn();
vi.mock('../core.js', async (orig) => ({
  ...(await orig<any>()),
  getSupabase: () => ({
    from: () => ({ upsert: (p: any) => { upsert(p); return { select: () => ({ single: async () => ({ data: p, error: null }) }) }; } }),
  }),
}));

import { dbUpsertRegisteredBand } from '../bands.js';

describe('dbUpsertRegisteredBand y el ciclo de facturación', () => {
  beforeEach(() => upsert.mockClear());

  it('guarda ciclo_facturacion cuando viene', async () => {
    await dbUpsertRegisteredBand({ band_id: 'band-uno', nombre_banda: 'Uno', plan: 'de_gira', ciclo_facturacion: 'annual' } as any);
    expect(upsert.mock.calls[0][0]).toMatchObject({ ciclo_facturacion: 'annual' });
  });

  it('si no viene, no lo manda (así un guardado cualquiera no borra el ciclo)', async () => {
    await dbUpsertRegisteredBand({ band_id: 'band-uno', nombre_banda: 'Uno', plan: 'de_gira' } as any);
    expect(upsert.mock.calls[0][0]).not.toHaveProperty('ciclo_facturacion');
  });
});
