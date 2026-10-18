/** El booking es reservado: solo bandas con `suscripcion_habilitada` (y el admin) lo usan. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import leadsRouter from '../../routes/leads.js';
import agentRouter from '../../routes/agent.js';
import campaignsRouter from '../../routes/campaigns.js';

let usuario: { role?: string; band_id?: string } | null = null;
const bandas = [
  { band_id: 'reg-mouredev', suscripcion_habilitada: true },
  { band_id: 'reg-otra', suscripcion_habilitada: false },
];
vi.mock('../../auth.js', async (orig) => ({ ...(await orig<Record<string, unknown>>()), getUserFromRequest: () => usuario }));
vi.mock('../../state.js', async (orig) => ({ ...(await orig<Record<string, unknown>>()), loadState: () => ({ registeredBands: bandas }) }));

import { BOOKING_NO_HABILITADO, guardiaBooking, puedeVerBooking, sinBooking } from '../bookingHabilitado.js';

function pasar(path: string) {
  let code: number | undefined;
  let body: unknown;
  let siguiente = false;
  const res = { status: (c: number) => ((code = c), res), json: (b: unknown) => ((body = b), res) };
  guardiaBooking({ path } as never, res as never, () => { siguiente = true; });
  return { code, body, siguiente };
}

const RUTAS_DE_BOOKING = [
  '/leads', '/leads/l1', '/leads/l1/generate-reply', '/places-search', '/campaign-mass-search', '/extract-emails',
  '/import-places', '/multi-source-venues', '/similar-artists-venues', '/public-cultural-radar', '/import-excel',
  '/example-threads/x', '/validate-emails', '/scrape-contact', '/generate-simulated-email', '/templates/save',
  '/trigger-agent', '/agent-runs', '/agent-runs/r1/jobs', '/agent-logs', '/agents/test-intel', '/agent-queue/stats',
  '/campaigns', '/campaigns/active', '/l1/enrich-jina', '/l1/detect-dates',
];
const RUTAS_ABIERTAS = [
  '/concerts', '/rehearsals', '/songs', '/chat', '/state', '/deals', '/gmail-oauth/status', '/billing/checkout',
  '/me', '/bands', '/tours', '/leadership', '/lead',
];

beforeEach(() => {
  usuario = { role: 'leader', band_id: 'reg-otra' };
});

describe('guardiaBooking', () => {
  it.each(RUTAS_DE_BOOKING)('corta %s a una banda sin el interruptor', (ruta) => {
    expect(pasar(ruta)).toEqual({ code: 403, body: BOOKING_NO_HABILITADO, siguiente: false });
  });

  it.each(RUTAS_DE_BOOKING)('deja pasar %s a una banda habilitada', (ruta) => {
    usuario = { role: 'member', band_id: 'reg-mouredev' };
    expect(pasar(ruta).siguiente).toBe(true);
  });

  it.each(RUTAS_ABIERTAS)('no toca %s', (ruta) => {
    expect(pasar(ruta).siguiente).toBe(true);
  });

  it('el admin de la plataforma entra siempre', () => {
    usuario = { role: 'admin', band_id: 'reg-otra' };
    expect(pasar('/leads').siguiente).toBe(true);
  });

  it('sin sesión no decide: la ruta responde 401 o deja pasar al cron', () => {
    usuario = null;
    expect(pasar('/trigger-agent').siguiente).toBe(true);
  });

  it('una banda desconocida o sin id queda fuera', () => {
    usuario = { role: 'leader', band_id: 'reg-desconocida' };
    expect(pasar('/leads').code).toBe(403);
    usuario = { role: 'leader' };
    expect(pasar('/leads').code).toBe(403);
  });
});

describe('puedeVerBooking / sinBooking', () => {
  it('lo decide la banda activa, no el nombre', () => {
    expect(puedeVerBooking({ role: 'leader', band_id: 'reg-mouredev' })).toBe(true);
    expect(puedeVerBooking({ role: 'leader', band_id: 'reg-otra' })).toBe(false);
    expect(puedeVerBooking(null)).toBe(false);
  });

  it('sinBooking vacía lo de booking sin tocar el original ni lo demás', () => {
    const estado = { leads: [{ id: 1 }], messages: [{ id: 2 }], campaigns: [{ id: 3 }], concerts: [{ id: 4 }] };
    const salida = sinBooking(estado);
    expect(salida).toEqual({ leads: [], messages: [], campaigns: [], concerts: [{ id: 4 }] });
    expect(estado.leads).toHaveLength(1);
  });
});

// Red de seguridad: si alguien añade una ruta de leads, agentes o campañas y no entra en el
// guardia, este test falla en vez de dejar un hueco por el que se vea el booking.
describe('el guardia cubre todas las rutas de booking', () => {
  type Capa = { route?: { path: string | string[] }; name?: string; handle?: { stack?: Capa[] } };
  const rutas = (router: unknown): string[] =>
    ((router as { stack?: Capa[] }).stack ?? []).flatMap((c) =>
      c.route ? ([] as string[]).concat(c.route.path) : c.name === 'router' && c.handle?.stack ? rutas(c.handle) : [],
    );
  // Rutas de esos routers que NO son booking: genéricas, de administración o internas.
  const NO_BOOKING = new Set(['/ai/providers', '/reset', '/internal/agents/responder-hilo', '/admin/agent-funnel', '/places/photo']);

  it.each([['leads', leadsRouter], ['agent', agentRouter], ['campaigns', campaignsRouter]] as const)(
    'todas las rutas de %s',
    (_nombre, router) => {
      const sinCubrir = rutas(router)
        .filter((r) => !NO_BOOKING.has(r))
        .filter((r) => pasar(r.replace(/:[a-zA-Z]+/g, 'x')).siguiente);
      expect(sinCubrir).toEqual([]);
    },
  );
});
