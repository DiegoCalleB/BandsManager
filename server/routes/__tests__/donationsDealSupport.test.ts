import { describe, it, expect, vi, beforeEach } from 'vitest';

const preciosCreate = vi.fn(async () => ({ id: 'price_1' }));
const sesionesCreate = vi.fn(async () => ({ url: 'https://checkout.stripe.test/s1' }));
const getDeal = vi.fn();
const hasSupport = vi.fn();
const listSupportable = vi.fn();

vi.mock('stripe', () => ({
  default: class {
    prices = { create: (...a: any[]) => (preciosCreate as any)(...a) };
    checkout = { sessions: { create: (...a: any[]) => (sesionesCreate as any)(...a) } };
  }
}));
vi.mock('../../db.js', () => ({ dbGetAiDebtCents: async () => 0 }));
vi.mock('../../state.js', () => ({ requireAuth: (_q: any, _s: any, n: any) => n() }));
vi.mock('../../middleware/rateLimiter.js', () => ({ donationRateLimiter: (_q: any, _s: any, n: any) => n() }));
vi.mock('../billing.js', () => ({ getOriginHost: () => 'https://bandmanager.test' }));
vi.mock('../../utils/bandAccess.js', () => ({
  bandaFacturableDelUsuario: (req: any) => (req.sinBanda ? null : { bandId: 'band-t', email: 'banda@test.es' })
}));
vi.mock('../../db/deals.js', () => ({ dbGetDealById: (...a: any[]) => getDeal(...a) }));
vi.mock('../../db/dealSupport.js', () => ({
  dbListSupportableDeals: (...a: any[]) => listSupportable(...a),
  dbDealHasSupport: (...a: any[]) => hasSupport(...a)
}));

process.env.STRIPE_SECRET_KEY = 'sk_test_x';
import router from '../donations.js';

function handler(ruta: string, metodo: 'get' | 'post') {
  const capa: any = (router as any).stack.find((s: any) => s.route?.path === ruta && s.route.methods[metodo]);
  expect(capa).toBeDefined();
  const pila = capa.route.stack;
  return pila[pila.length - 1].handle;
}
function res() {
  const r: any = {};
  r.status = (c: number) => ((r.code = c), r);
  r.json = (b: any) => ((r.body = b), r);
  return r;
}

describe('aportación voluntaria al cerrar un bolo', () => {
  beforeEach(() => {
    preciosCreate.mockClear();
    sesionesCreate.mockClear();
    getDeal.mockReset();
    hasSupport.mockReset().mockResolvedValue(false);
    listSupportable.mockReset();
  });

  describe('GET /donations/deal-support', () => {
    it('devuelve los bolos con el importe sugerido calculado por el servidor', async () => {
      listSupportable.mockResolvedValue([
        { id: 'd1', lugar_sala: 'Sala Capitol', ciudad: 'Santiago', fecha_evento: '2026-12-01', total_acordado: 600 }
      ]);
      const r = res();
      await handler('/donations/deal-support', 'get')({}, r);
      expect(r.body.deals).toEqual([
        { deal_id: 'd1', lugar_sala: 'Sala Capitol', ciudad: 'Santiago', fecha_evento: '2026-12-01', total_acordado: 600, suggested_cents: 1800 }
      ]);
      expect(r.body.min_cents).toBe(100);
    });

    it('403 sin banda; y ante un fallo interno no rompe la app (lista vacía)', async () => {
      const r403 = res();
      await handler('/donations/deal-support', 'get')({ sinBanda: true }, r403);
      expect(r403.code).toBe(403);

      listSupportable.mockRejectedValue(new Error('boom'));
      const r = res();
      await handler('/donations/deal-support', 'get')({}, r);
      expect(r.body).toMatchObject({ success: true, deals: [] });
    });
  });

  describe('POST /donations/deal-support/create-checkout-session', () => {
    const post = () => handler('/donations/deal-support/create-checkout-session', 'post');

    it('crea el checkout con importe sugerido del servidor y metadata kind=deal_support', async () => {
      getDeal.mockResolvedValue({ id: 'd1', estado: 'confirmado', lugar_sala: 'Sala Capitol', total_acordado: 600 });
      const r = res();
      await post()({ body: { dealId: 'd1' } }, r);
      expect(r.body).toEqual({ success: true, url: 'https://checkout.stripe.test/s1' });
      expect(preciosCreate.mock.calls[0][0].custom_unit_amount).toMatchObject({ enabled: true, minimum: 100, maximum: 50000, preset: 1800 });
      const sesion: any = sesionesCreate.mock.calls[0][0];
      expect(sesion.metadata).toEqual({ kind: 'deal_support', bandId: 'band-t', dealId: 'd1' });
      expect(getDeal).toHaveBeenCalledWith('d1', 'band-t'); // acotado a la banda de la sesión
    });

    it('ignora cualquier importe o banda que mande el cliente', async () => {
      getDeal.mockResolvedValue({ id: 'd1', estado: 'confirmado', lugar_sala: 'S', total_acordado: 600 });
      await post()({ body: { dealId: 'd1', amount: 1, bandId: 'band-ajena', preset: 1 } }, res());
      expect(preciosCreate.mock.calls[0][0].custom_unit_amount.preset).toBe(1800);
      expect((sesionesCreate.mock.calls[0][0] as any).metadata.bandId).toBe('band-t');
    });

    it('400 sin dealId; 404 si el bolo no existe o no está firmado; 409 si ya apoyó; 403 sin banda', async () => {
      let r = res();
      await post()({ body: {} }, r);
      expect(r.code).toBe(400);

      getDeal.mockResolvedValue(null);
      r = res();
      await post()({ body: { dealId: 'x' } }, r);
      expect(r.code).toBe(404);

      getDeal.mockResolvedValue({ id: 'd1', estado: 'pendiente', lugar_sala: 'S', total_acordado: 600 });
      r = res();
      await post()({ body: { dealId: 'd1' } }, r);
      expect(r.code).toBe(404);

      getDeal.mockResolvedValue({ id: 'd1', estado: 'confirmado', lugar_sala: 'S', total_acordado: 600 });
      hasSupport.mockResolvedValue(true);
      r = res();
      await post()({ body: { dealId: 'd1' } }, r);
      expect(r.code).toBe(409);

      r = res();
      await post()({ sinBanda: true, body: { dealId: 'd1' } }, r);
      expect(r.code).toBe(403);
      expect(sesionesCreate).not.toHaveBeenCalled();
    });
  });
});
