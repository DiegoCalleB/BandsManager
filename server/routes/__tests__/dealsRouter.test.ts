import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { crearFakeDealsSupabase } from '../../db/__tests__/helpers/fakeDealsSupabase';

const fake = crearFakeDealsSupabase();

vi.mock('../../db/core.js', () => ({
  getSupabase: () => fake.client,
  cleanBandId: (b?: string) => (b || '').trim()
}));
vi.mock('../../db/bands.js', () => ({
  ensureRegisteredBandExists: async (b: string) => b,
  dbGetRegisteredBandById: async () => null
}));
vi.mock('../../db/concerts.js', () => ({ dbUpsertConcert: async (c: any) => c }));
vi.mock('../../db/leads.js', () => ({
  dbUpsertLead: async (l: any) => l,
  dbGetLeadById: async () => null
}));
vi.mock('../../db/users.js', () => ({ dbGetUsers: async () => [] }));
vi.mock('../../db/sync.js', () => ({ invalidateBandStateCache: () => {} }));
vi.mock('../../state.js', () => ({
  requireAuth: (_q: any, _s: any, n: any) => n(),
  loadState: () => ({ concerts: [] }),
  saveState: () => {}
}));
vi.mock('../../utils/bandAccess.js', () => ({ getTargetBandId: () => 'band-route-test-1' }));
vi.mock('../../services/transactionalEmail.js', () => ({
  sendDealSignedToVenueEmail: async () => ({ success: true }),
  sendDealSignedToBandEmail: async () => ({ success: true })
}));

import { dealsRouter, ipFirmante } from '../deals.js';
import { dbUpsertDeal } from '../../db/deals.js';

function manejador(ruta: string, metodo: 'get' | 'post') {
  const capa: any = (dealsRouter as any).stack.find(
    (s: any) => s.route && s.route.path === ruta && s.route.methods[metodo]
  );
  expect(capa).toBeDefined();
  // El último handler de la ruta es el nuestro (delante pueden ir middlewares como requireAuth).
  const pila = capa.route.stack;
  return pila[pila.length - 1].handle;
}

function resFalso() {
  const r: any = { code: undefined as number | undefined, body: undefined as any };
  r.status = (c: number) => ((r.code = c), r);
  r.json = (b: any) => ((r.body = b), r);
  return r;
}

describe('dealsRouter', () => {
  const banda = 'band-route-test-1';
  let token = '';

  beforeAll(async () => {
    fake.filas.length = 0;
    const deal = await dbUpsertDeal(
      { band_id: banda, lugar_sala: 'Sala El Sol', ciudad: 'Madrid', fecha_evento: '2026-11-15', cache_base: 600, total_acordado: 600 },
      banda
    );
    token = deal.token!;
  });

  beforeEach(() => {
    fake.estado.fallo = null;
  });

  it('GET público: 404 si no existe; 200 con proyección mínima (sin band_id ni comisión)', async () => {
    const get = manejador('/public/deals/:token', 'get');

    const r404 = resFalso();
    await get({ params: { token: 'dl_inexistente' } }, r404);
    expect(r404.code).toBe(404);

    const r200 = resFalso();
    await get({ params: { token } }, r200);
    expect(r200.code).toBe(200);
    expect(r200.body.deal.lugar_sala).toBe('Sala El Sol');
    expect(r200.body.deal.band_id).toBeUndefined();
    expect(r200.body.deal.comision_importe).toBeUndefined();
    expect(r200.body.deal.neto_banda).toBeUndefined();
    expect(r200.body.deal.firma_ip).toBeUndefined();
    expect(r200.body.deal.firma_imagen).toBeUndefined();
  });

  const cuerpoFirma = (extra: any = {}) => ({
    nombre_firmante: 'Javier Programador',
    cargo_firmante: 'Dirección',
    firma_imagen: 'data:image/png;base64,iVBORw0...',
    rider_validado_por_sala: true,
    ...extra
  });
  const reqFirma = (body: any, headers: any = {}) => ({
    params: { token },
    body,
    headers,
    socket: { remoteAddress: '10.0.0.9' }
  });

  it('firma: rechaza (400) si no se aceptan las condiciones técnicas', async () => {
    const post = manejador('/public/deals/:token/sign', 'post');
    const r = resFalso();
    await post(reqFirma(cuerpoFirma({ rider_validado_por_sala: false })), r);
    expect(r.code).toBe(400);
    expect(r.body.error).toContain('condiciones técnicas');
  });

  it('firma: guarda la IP real (última entrada de X-Forwarded-For), no la que falsifica el cliente', async () => {
    const post = manejador('/public/deals/:token/sign', 'post');
    const r = resFalso();
    await post(reqFirma(cuerpoFirma(), { 'x-forwarded-for': '6.6.6.6, 83.45.12.90' }), r);
    expect(r.code).toBe(200);
    expect(fake.filas.find((f) => f.token === token)?.firma_ip).toBe('83.45.12.90');
  });

  it('firma: una segunda firma devuelve 409 y no cambia al firmante', async () => {
    const post = manejador('/public/deals/:token/sign', 'post');
    const r = resFalso();
    await post(reqFirma(cuerpoFirma({ nombre_firmante: 'Impostor' })), r);
    expect(r.code).toBe(409);
    expect(fake.filas.find((f) => f.token === token)?.nombre_firmante).toBe('Javier Programador');
  });

  it('POST /deals sobre un acuerdo firmado devuelve 409', async () => {
    const post = manejador('/deals', 'post');
    const id = fake.filas.find((f) => f.token === token)!.id;
    const r = resFalso();
    const req: any = {
      body: { id, lugar_sala: 'Sala El Sol', fecha_evento: '2026-11-15', cache_base: 1, comision_porcentaje: 0 },
      headers: { 'x-band-id': banda },
      user: { band_id: banda }
    };
    await post(req, r);
    expect(r.code).toBe(409);
    expect(r.body.error).toContain('ya está firmado');
    expect(fake.filas.find((f) => f.id === id)?.cache_base).toBe(600);
  });

  describe('ipFirmante', () => {
    it('toma la última entrada de X-Forwarded-For (la que añade el proxy)', () => {
      expect(ipFirmante({ headers: { 'x-forwarded-for': '1.1.1.1, 2.2.2.2, 3.3.3.3' }, socket: {} } as any)).toBe('3.3.3.3');
    });
    it('sin cabecera usa la IP del socket', () => {
      expect(ipFirmante({ headers: {}, socket: { remoteAddress: '9.9.9.9' } } as any)).toBe('9.9.9.9');
    });
  });
});
