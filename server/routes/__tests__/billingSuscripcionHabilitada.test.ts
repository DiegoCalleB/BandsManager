// La suscripción de pago está apagada por defecto y se enciende por banda (`suscripcion_habilitada`).
// Estos tests fijan la puerta del checkout: sin el interruptor, Stripe no se llama nunca.
import { describe, it, expect, vi, beforeEach } from 'vitest';

let estado: any;
const sesionesCreate = vi.fn(async () => ({ id: 'cs_1', url: 'https://checkout.stripe.test/s1' }));
const clientesList = vi.fn(async () => ({ data: [] }));
const clientesCreate = vi.fn(async () => ({ id: 'cus_1' }));

vi.mock('stripe', () => ({
  default: class {
    customers = { list: (...a: any[]) => (clientesList as any)(...a), create: (...a: any[]) => (clientesCreate as any)(...a) };
    checkout = { sessions: { create: (...a: any[]) => (sesionesCreate as any)(...a) } };
  },
}));
vi.mock('../../state.js', () => ({
  loadState: () => estado,
  saveState: (s: any) => { estado = s; },
  requireAuth: (_q: any, _s: any, n: any) => n(),
}));
vi.mock('../../db.js', () => ({
  normalizePlan: (p: string) => p,
  getSupabase: vi.fn(),
  dbUpsertRegisteredBand: vi.fn().mockResolvedValue(undefined),
  dbIsWebhookEventProcessed: vi.fn().mockResolvedValue(false),
  dbRecordWebhookEvent: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../utils/bandAccess.js', async (orig) => ({
  ...(await orig<any>()),
  bandaFacturableDelUsuario: (req: any) => ({ bandId: req.bandId ?? 'band-uno', email: 'banda@test.es' }),
}));

process.env.STRIPE_SECRET_KEY = 'sk_test_x';
import router from '../billing.js';

function handler(ruta: string) {
  const capa: any = (router as any).stack.find((s: any) => s.route?.path?.includes?.(ruta) && s.route.methods.post);
  expect(capa).toBeDefined();
  const pila = capa.route.stack;
  return pila[pila.length - 1].handle;
}
const res = () => {
  const r: any = {};
  r.status = (c: number) => ((r.code = c), r);
  r.json = (b: any) => ((r.body = b), r);
  return r;
};
const pedir = async (cuerpo: any, extra: any = {}) => {
  const r = res();
  await handler('/billing/create-checkout-session')({ body: cuerpo, headers: { host: 'bandmanager.test' }, query: {}, protocol: 'https', get: () => 'bandmanager.test', ...extra }, r);
  return r;
};

describe('POST /billing/create-checkout-session: interruptor por banda', () => {
  beforeEach(() => {
    sesionesCreate.mockClear();
    estado = {
      registeredBands: [
        { band_id: 'band-uno', suscripcion_habilitada: true },
        { band_id: 'band-dos' },
      ],
      users: [],
    };
  });

  it('una banda sin el interruptor recibe 403 y Stripe no se llama', async () => {
    const r = await pedir({ planId: 'local' }, { bandId: 'band-dos' });
    expect(r.code).toBe(403);
    expect(r.body.code).toBe('suscripcion_no_habilitada');
    expect(sesionesCreate).not.toHaveBeenCalled();
  });

  it('una banda que no existe en la lista tampoco puede contratar', async () => {
    const r = await pedir({ planId: 'de_gira' }, { bandId: 'band-fantasma' });
    expect(r.code).toBe(403);
    expect(sesionesCreate).not.toHaveBeenCalled();
  });

  it('una banda con el interruptor sí llega a Stripe', async () => {
    const r = await pedir({ planId: 'local' }, { bandId: 'band-uno' });
    expect(r.code).toBeUndefined();
    expect(sesionesCreate).toHaveBeenCalledTimes(1);
  });
});
