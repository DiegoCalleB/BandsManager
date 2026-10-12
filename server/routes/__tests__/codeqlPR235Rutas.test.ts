/**
 * Regresión de las alertas de CodeQL del PR #235 en rutas: type confusion en el feed .ics,
 * texto de excepción como HTML en el webhook de Stripe y límite de ritmo en el OAuth de Gmail.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

let constructEvent: () => unknown;
vi.mock('stripe', () => ({
  default: class {
    webhooks = { constructEvent: () => constructEvent() };
  },
}));
vi.mock('../../state.js', () => ({
  loadState: () => ({}),
  saveState: () => {},
  requireAuth: (_q: unknown, _s: unknown, n: () => void) => n(),
  requireLeader: (_q: unknown, _s: unknown, n: () => void) => n(),
}));
vi.mock('../../db.js', () => ({
  normalizePlan: (p: string) => p,
  getSupabase: vi.fn(),
  dbUpsertRegisteredBand: vi.fn(),
  dbIsWebhookEventProcessed: vi.fn().mockResolvedValue(false),
  dbRecordWebhookEvent: vi.fn().mockResolvedValue(undefined),
  dbSettleAiDonation: vi.fn(),
}));
vi.mock('../../db/dealSupport.js', () => ({ dbRecordDealSupportFromSession: vi.fn(), dbRecordDealSupportRefund: vi.fn() }));

process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
process.env.STRIPE_SECRET_KEY = 'sk_test_x';

import billingRouter from '../billing.js';
import gmailRouter from '../gmailOAuth.js';

interface CapaRuta {
  route?: { path: string; methods: Record<string, boolean>; stack: Array<{ handle: (...a: unknown[]) => unknown; name: string }> };
}
const capaDe = (router: unknown, ruta: string, metodo: string) => {
  const pila = (router as { stack: CapaRuta[] }).stack;
  const capa = pila.find((s) => s.route?.path === ruta && s.route.methods[metodo]);
  expect(capa?.route).toBeDefined();
  return capa!.route!;
};

describe('webhook de Stripe: firma inválida', () => {
  beforeEach(() => vi.clearAllMocks());

  it('responde text/plain: el texto de la excepción no se interpreta como HTML', async () => {
    constructEvent = () => {
      throw new Error('<script>alert(1)</script>');
    };
    const ruta = capaDe(billingRouter, '/billing/webhook', 'post');
    const res: { code?: number; tipo?: string; cuerpo?: unknown; status: (c: number) => unknown; type: (t: string) => unknown; send: (b: unknown) => unknown } = {
      status(c) { this.code = c; return this; },
      type(t) { this.tipo = t; return this; },
      send(b) { this.cuerpo = b; return this; },
    };
    await ruta.stack[ruta.stack.length - 1].handle({ headers: { 'stripe-signature': 'x' }, body: {}, rawBody: Buffer.from('{}') }, res);
    expect(res.code).toBe(400);
    expect(res.tipo).toBe('text/plain');
  });
});

describe('OAuth de Gmail: límite de ritmo', () => {
  it.each([
    ['/authorize-url', 'get'],
    ['/callback', 'get'],
    ['/status', 'get'],
    ['/disconnect', 'post'],
  ])('%s lleva el limitador de ritmo', (ruta, metodo) => {
    const nombres = capaDe(gmailRouter, ruta, metodo).stack.map((h) => h.name);
    expect(nombres).toContain('rateLimiter');
  });
});

describe('feed .ics: parámetros de consulta', () => {
  it('band_id solo se acepta como cadena (typeof) y no se castea con as string', () => {
    const codigo = fs.readFileSync(path.join(__dirname, '..', 'concerts.ts'), 'utf-8');
    expect(codigo).toContain('typeof v === "string"');
    expect(codigo).not.toContain('(req.query.band_id as string)');
  });
});
