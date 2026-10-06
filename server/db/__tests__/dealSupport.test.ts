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
  dbRecordDealSupportFromSession,
  dbRecordDealSupportRefund
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

  it('no vuelve a pedir apoyo a quien eligió 0 %; sí a quien eligió otro % o no eligió', async () => {
    fake.tablas.concert_deals.push(
      acuerdo('no-apoyar', { apoyo_porcentaje: 0 }),
      acuerdo('cinco', { apoyo_porcentaje: 5 }),
      acuerdo('sin-elegir', { apoyo_porcentaje: null }),
      acuerdo('antiguo') // acuerdo anterior a la columna: undefined
    );
    const ids = (await dbListSupportableDeals(banda)).map((d) => d.id).sort();
    expect(ids).toEqual(['antiguo', 'cinco', 'sin-elegir']);
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

  it('guarda el id del pago de Stripe (string u objeto expandido) junto al importe', async () => {
    await dbRecordDealSupportFromSession({
      id: 'cs_a', amount_total: 1800, payment_intent: 'pi_111', metadata: { kind: 'deal_support', bandId: banda, dealId: 'a' }
    });
    await dbRecordDealSupportFromSession({
      id: 'cs_b', amount_total: 500, payment_intent: { id: 'pi_222' }, metadata: { kind: 'deal_support', bandId: banda, dealId: 'b' }
    });
    const filas = fake.tablas.deal_support_contributions;
    expect(filas.find((f) => f.id === 'cs_a')).toMatchObject({ stripe_payment_intent_id: 'pi_111', amount_cents: 1800 });
    expect(filas.find((f) => f.id === 'cs_b')).toMatchObject({ stripe_payment_intent_id: 'pi_222' });
  });

  describe('reembolsos', () => {
    beforeEach(async () => {
      await dbRecordDealSupportFromSession({
        id: 'cs_a', amount_total: 1800, payment_intent: 'pi_111', metadata: { kind: 'deal_support', bandId: banda, dealId: 'a' }
      });
    });

    it('anota el reembolso (acumulado) en la aportación que corresponde', async () => {
      expect(await dbRecordDealSupportRefund('pi_111', 600)).toBe(1);
      expect(fake.tablas.deal_support_contributions[0].reembolsado_cents).toBe(600);
      // Stripe informa el ACUMULADO: un segundo evento con más devolución lo sustituye, no lo suma.
      expect(await dbRecordDealSupportRefund('pi_111', 1800)).toBe(1);
      expect(fake.tablas.deal_support_contributions[0].reembolsado_cents).toBe(1800);
    });

    it('reaplicar el mismo evento es inocuo', async () => {
      await dbRecordDealSupportRefund('pi_111', 600);
      await dbRecordDealSupportRefund('pi_111', 600);
      expect(fake.tablas.deal_support_contributions[0].reembolsado_cents).toBe(600);
    });

    it('un cobro que no es una aportación de bolo se ignora sin error (0 filas)', async () => {
      expect(await dbRecordDealSupportRefund('pi_de_una_suscripcion', 999)).toBe(0);
      expect(await dbRecordDealSupportRefund('', 999)).toBe(0);
      expect(fake.tablas.deal_support_contributions[0].reembolsado_cents).toBeUndefined();
    });

    it('si el webhook del pago se repite DESPUÉS de un reembolso, no se pierde el reembolso ni cambia paid_at', async () => {
      await dbRecordDealSupportRefund('pi_111', 600);
      const antes = { ...fake.tablas.deal_support_contributions[0] };
      await dbRecordDealSupportFromSession({
        id: 'cs_a', amount_total: 1800, payment_intent: 'pi_111', metadata: { kind: 'deal_support', bandId: banda, dealId: 'a' }
      });
      expect(fake.tablas.deal_support_contributions).toHaveLength(1);
      expect(fake.tablas.deal_support_contributions[0]).toEqual(antes);
    });

    it('si la BD falla, anotar un reembolso LANZA (para que el webhook responda 500 y Stripe reintente)', async () => {
      fake.estado.fallosPorTabla.deal_support_contributions = { code: '42P01', message: 'relation does not exist' };
      await expect(dbRecordDealSupportRefund('pi_111', 600)).rejects.toThrow(/No se pudo anotar el reembolso/);
    });
  });

  it('si la tabla de aportaciones no existe: no se ofrece nada, pero REGISTRAR un cobro lanza (que Stripe reintente)', async () => {
    fake.tablas.concert_deals.push(acuerdo('a'));
    fake.estado.fallosPorTabla.deal_support_contributions = { code: '42P01', message: 'relation does not exist' };
    expect(await dbListSupportableDeals(banda)).toEqual([]);
    expect(await dbDealHasSupport('a', banda)).toBe(false);
    await expect(dbRecordDealSupport({ sessionId: 'cs_1', dealId: 'a', bandId: banda, amountCents: 100 })).rejects.toThrow(/No se pudo registrar la aportación cs_1/);
  });
});
