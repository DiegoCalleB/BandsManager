/**
 * Fiabilidad del webhook de Stripe: un fallo al procesar responde 500 (Stripe reintenta) y el
 * reintento NO se descarta como duplicado. Regresión de la auditoría B (billing).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

let eventoActual: any;
vi.mock('stripe', () => ({
  default: class {
    webhooks = { constructEvent: () => eventoActual };
  },
}));
vi.mock('../../state.js', () => ({ loadState: () => ({}), saveState: () => {}, requireAuth: (_q: any, _s: any, n: any) => n() }));
vi.mock('../../db.js', () => ({
  normalizePlan: (p: string) => p,
  getSupabase: vi.fn(),
  dbUpsertRegisteredBand: vi.fn(),
  dbIsWebhookEventProcessed: vi.fn().mockResolvedValue(false),
  dbRecordWebhookEvent: vi.fn().mockResolvedValue(undefined),
  dbSettleAiDonation: vi.fn(),
}));

const registrarAportacion = vi.fn();
const anotarReembolso = vi.fn();
vi.mock('../../db/dealSupport.js', () => ({
  dbRecordDealSupportFromSession: (...a: any[]) => registrarAportacion(...a),
  dbRecordDealSupportRefund: (...a: any[]) => anotarReembolso(...a),
}));

process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
process.env.STRIPE_SECRET_KEY = 'sk_test_x';

import router from '../billing.js';
import { dbRecordWebhookEvent } from '../../db.js';

function manejador() {
  const capa: any = (router as any).stack.find((s: any) => s.route && s.route.path === '/billing/webhook' && s.route.methods.post);
  expect(capa).toBeDefined();
  const pila = capa.route.stack;
  return pila[pila.length - 1].handle;
}
const resFalso = () => {
  const r: any = {};
  r.status = (c: number) => ((r.code = c), r);
  r.json = (b: any) => ((r.body = b), r);
  r.send = (b: any) => ((r.body = b), r);
  return r;
};
const llamar = async () => {
  const res = resFalso();
  await manejador()({ headers: { 'stripe-signature': 'x' }, body: {}, rawBody: Buffer.from('{}') }, res);
  return res;
};
const eventoAportacion = (id: string) => ({
  id,
  type: 'checkout.session.completed',
  data: { object: { id: 'cs_1', amount_total: 500, metadata: { kind: 'deal_support', bandId: 'band-a', dealId: 'd1' } } },
});

beforeEach(() => {
  vi.clearAllMocks();
  registrarAportacion.mockResolvedValue(true);
});

describe('webhook de Stripe', () => {
  it('si registrar el cobro falla responde 500 (Stripe reintentará) y no lo da por procesado', async () => {
    eventoActual = eventoAportacion('evt_fallo');
    registrarAportacion.mockRejectedValueOnce(new Error('BD caída'));
    const r1 = await llamar();
    expect(r1.code).toBe(500);
    expect(dbRecordWebhookEvent).not.toHaveBeenCalled();

    // El reintento de Stripe NO se descarta como duplicado: se procesa de verdad.
    const r2 = await llamar();
    expect(r2.code).toBeUndefined();
    expect(r2.body).toEqual({ received: true });
    expect(registrarAportacion).toHaveBeenCalledTimes(2);
    expect(dbRecordWebhookEvent).toHaveBeenCalledTimes(1);
  });

  it('un evento ya procesado con éxito se ignora como duplicado', async () => {
    eventoActual = eventoAportacion('evt_ok');
    await llamar();
    const r2 = await llamar();
    expect(r2.body).toEqual({ received: true, idempotent: true });
    expect(registrarAportacion).toHaveBeenCalledTimes(1);
  });

  it('dos entregas simultáneas del mismo evento procesan una sola vez', async () => {
    eventoActual = eventoAportacion('evt_simultaneo');
    registrarAportacion.mockImplementation(() => new Promise((r) => setTimeout(() => r(true), 20)));
    const [a, b] = await Promise.all([llamar(), llamar()]);
    expect(registrarAportacion).toHaveBeenCalledTimes(1);
    expect([a.body.idempotent, b.body.idempotent].filter(Boolean)).toHaveLength(1);
  });

  it('un fallo al anotar un reembolso también responde 500', async () => {
    eventoActual = { id: 'evt_ref', type: 'charge.refunded', data: { object: { payment_intent: 'pi_1', amount_refunded: 500 } } };
    anotarReembolso.mockRejectedValueOnce(new Error('BD caída'));
    const r = await llamar();
    expect(r.code).toBe(500);
  });
});
