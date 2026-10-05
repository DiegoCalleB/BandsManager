import { describe, it, expect, vi, beforeEach } from 'vitest';
import { crearFakeDealsSupabase } from './helpers/fakeDealsSupabase';

const fake = crearFakeDealsSupabase();
vi.mock('../core.js', () => ({
  getSupabase: () => fake.client,
  cleanBandId: (b?: string) => (b || '').trim()
}));

import {
  dbListSupportableDeals,
  dbDealHasSupport,
  dbRecordDealSupport,
  dbRecordDealSupportFromSession
} from '../dealSupport.js';

const banda = 'band-apoyo';
const hace = (dias: number) => new Date(Date.now() - dias * 86400000).toISOString();
const acuerdo = (id: string, extra: any = {}) => ({
  id,
  band_id: banda,
  estado: 'confirmado',
  firma_timestamp: hace(1),
  lugar_sala: 'Sala X',
  fecha_evento: '2026-12-01',
  total_acordado: 600,
  ...extra
});

describe('aportaciones voluntarias (capa de datos)', () => {
  beforeEach(() => {
    fake.tablas.concert_deals.length = 0;
    fake.tablas.deal_support_contributions.length = 0;
    fake.estado.fallo = null;
    fake.estado.fallosPorTabla = {};
  });

  it('lista solo bolos FIRMADOS, RECIENTES y de ESTA banda', async () => {
    fake.tablas.concert_deals.push(
      acuerdo('ok'),
      acuerdo('pendiente', { estado: 'pendiente' }),
      acuerdo('viejo', { firma_timestamp: hace(120) }),
      acuerdo('ajeno', { band_id: 'band-otra' })
    );
    const r = await dbListSupportableDeals(banda);
    expect(r.map((d) => d.id)).toEqual(['ok']);
  });

  it('no ofrece de nuevo un bolo que ya tiene aportación', async () => {
    fake.tablas.concert_deals.push(acuerdo('a'), acuerdo('b'));
    await dbRecordDealSupport({ sessionId: 'cs_1', dealId: 'a', bandId: banda, amountCents: 1800 });
    expect((await dbListSupportableDeals(banda)).map((d) => d.id)).toEqual(['b']);
    expect(await dbDealHasSupport('a', banda)).toBe(true);
    expect(await dbDealHasSupport('b', banda)).toBe(false);
  });

  it('el registro es idempotente por sesión de Stripe (un webhook repetido no duplica)', async () => {
    await dbRecordDealSupport({ sessionId: 'cs_1', dealId: 'a', bandId: banda, amountCents: 1800 });
    await dbRecordDealSupport({ sessionId: 'cs_1', dealId: 'a', bandId: banda, amountCents: 1800 });
    expect(fake.tablas.deal_support_contributions).toHaveLength(1);
    expect(fake.tablas.deal_support_contributions[0].amount_cents).toBe(1800);
  });

  it('desde una sesión de Stripe: registra con su metadata; sin bandId/dealId se ignora', async () => {
    expect(
      await dbRecordDealSupportFromSession({ id: 'cs_9', amount_total: 500, metadata: { kind: 'deal_support', bandId: banda, dealId: 'z' } })
    ).toBe(true);
    expect(fake.tablas.deal_support_contributions[0]).toMatchObject({ id: 'cs_9', deal_id: 'z', amount_cents: 500 });
    expect(await dbRecordDealSupportFromSession({ id: 'cs_10', metadata: { kind: 'deal_support' } })).toBe(false);
  });

  it('si la tabla de aportaciones no existe todavía NO rompe nada: no se ofrece y registrar solo avisa', async () => {
    fake.tablas.concert_deals.push(acuerdo('a'));
    fake.estado.fallosPorTabla.deal_support_contributions = { code: '42P01', message: 'relation does not exist' };
    expect(await dbListSupportableDeals(banda)).toEqual([]);
    expect(await dbDealHasSupport('a', banda)).toBe(false);
    expect(await dbRecordDealSupport({ sessionId: 'cs_1', dealId: 'a', bandId: banda, amountCents: 100 })).toBe(false);
  });
});
