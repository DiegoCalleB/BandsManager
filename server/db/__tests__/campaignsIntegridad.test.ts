import { beforeEach, describe, expect, it, vi } from 'vitest';
import { crearFakeDealsSupabase } from './helpers/fakeDealsSupabase';

const fake = crearFakeDealsSupabase();
vi.mock('../core.js', () => ({
  getSupabase: () => fake.client,
  cleanBandId: (b?: string) => (b || '').replace(/^(band|reg)-/, ''),
}));
vi.mock('../bands.js', () => ({ ensureRegisteredBandExists: vi.fn().mockResolvedValue(undefined) }));

import { dbDeleteCampaign, dbUpsertCampaign } from '../campaigns';

beforeEach(() => {
  fake.tablas.campaigns = [];
  fake.tablas.booking_campaigns = [];
  fake.estado.fallosPorTabla = {};
});

describe('campañas: integridad', () => {
  it('no se puede pisar la campaña de OTRA banda mandando su id', async () => {
    fake.tablas.campaigns.push({ id: '123', band_id: 'victima', name: 'Gira de la víctima' });
    const guardada = await dbUpsertCampaign({ id: '123', name: 'Mía' }, 'atacante');
    expect(fake.tablas.campaigns.find((c: any) => c.id === '123').name).toBe('Gira de la víctima');
    expect(guardada.id).not.toBe('123');
    expect(fake.tablas.campaigns.some((c: any) => c.band_id === 'atacante' && c.name === 'Mía')).toBe(true);
  });

  it('si fallan las dos tablas LANZA en vez de devolver la campaña como si estuviera guardada', async () => {
    fake.estado.fallosPorTabla.campaigns = { message: 'boom' };
    fake.estado.fallosPorTabla.booking_campaigns = { message: 'boom' };
    await expect(dbUpsertCampaign({ name: 'X' }, 'band-a')).rejects.toThrow(/upsert campaign/);
  });

  it('borrar una campaña que no se pudo borrar lanza (antes devolvía true y reaparecía)', async () => {
    fake.estado.fallosPorTabla.campaigns = { message: 'boom' };
    fake.estado.fallosPorTabla.booking_campaigns = { message: 'boom' };
    await expect(dbDeleteCampaign('1', 'band-a')).rejects.toThrow();
  });
});
