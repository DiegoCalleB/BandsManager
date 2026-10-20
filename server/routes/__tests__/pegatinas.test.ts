// El regalo de pegatinas lo paga el proyecto: solo con plan de pago y cobro activo, una vez por banda,
// y siempre sobre la banda resuelta por la sesión (nunca una que mande el cliente).
import { beforeEach, describe, expect, it, vi } from 'vitest';

let estado: any;
let bandaDeLaSesion = 'band-a';
const crear = vi.fn();
const hay = vi.fn();
const avisar = vi.fn();

vi.mock('../../state.js', () => ({
  loadState: () => estado,
  requireAuth: (_q: any, _s: any, n: any) => n(),
}));
vi.mock('../../utils/bandAccess.js', () => ({ getTargetBandId: () => bandaDeLaSesion }));
vi.mock('../../middleware/rateLimiter.js', () => ({ apiAutenticadaRateLimiter: (_q: any, _s: any, n: any) => n() }));
vi.mock('../../db/pegatinas.js', () => ({
  dbCrearPedidoPegatinas: (...a: any[]) => crear(...a),
  dbHayPedidoPegatinas: (...a: any[]) => hay(...a),
}));
vi.mock('../../services/avisoAltas.js', () => ({ avisarAlta: (...a: any[]) => avisar(...a) }));

import router from '../pegatinas.js';

function handler(metodo: 'get' | 'post') {
  const capa: any = (router as any).stack.find((s: any) => s.route?.path === '/api/billing/pegatinas' && s.route.methods[metodo]);
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
const envio = { nombre: 'Ana', direccion: 'C/ Mayor 1', cp: '28001', ciudad: 'Madrid', consentimiento: true };
const pedir = async (cuerpo: any = envio) => {
  const r = res();
  await handler('post')({ body: cuerpo, user: { email: 'ana@x.com' } }, r);
  return r;
};

describe('regalo de pegatinas', () => {
  beforeEach(() => {
    crear.mockReset().mockResolvedValue(true);
    hay.mockReset().mockResolvedValue(false);
    avisar.mockReset();
    bandaDeLaSesion = 'band-a';
    estado = {
      registeredBands: [
        { band_id: 'band-a', plan: 'de_gira', estado_suscripcion: 'activo', ciclo_facturacion: 'annual' },
        { band_id: 'band-b', plan: 'local', estado_suscripcion: 'activo', ciclo_facturacion: 'annual' },
        { band_id: 'band-c', plan: 'ensayo', estado_suscripcion: 'activo', ciclo_facturacion: 'annual' },
        { band_id: 'band-m', plan: 'de_gira', estado_suscripcion: 'activo', ciclo_facturacion: 'monthly' },
      ],
    };
  });

  it('una banda con plan de pago activo recibe su pack y se avisa por email', async () => {
    const r = await pedir();
    expect(r.body).toEqual({ ok: true });
    expect(crear).toHaveBeenCalledWith('band-a', { plan: 'de_gira', cantidad: 150, expres: false }, expect.objectContaining({ nombre: 'Ana', pais: 'España' }));
    expect(avisar).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'pegatinas', nombre: 'Ana' }));
  });

  it.each(['band-b', 'band-c', 'band-m', 'band-fantasma'])('%s no tiene derecho (Local, gratuito, mensual o inexistente): 403 y nada se guarda', async (id) => {
    bandaDeLaSesion = id;
    const r = await pedir();
    expect(r.code).toBe(403);
    expect(crear).not.toHaveBeenCalled();
    expect(avisar).not.toHaveBeenCalled();
  });

  it('pedirlo dos veces da 409 y no vuelve a avisar', async () => {
    crear.mockResolvedValue(false);
    const r = await pedir();
    expect(r.code).toBe(409);
    expect(avisar).not.toHaveBeenCalled();
  });

  it('sin consentimiento o sin dirección: 400 y nada se guarda', async () => {
    expect((await pedir({ ...envio, consentimiento: false })).code).toBe(400);
    expect((await pedir({ ...envio, direccion: '' })).code).toBe(400);
    expect(crear).not.toHaveBeenCalled();
  });

  it('GET indica si es elegible y si ya lo pidió', async () => {
    hay.mockResolvedValue(true);
    const r = res();
    await handler('get')({}, r);
    expect(r.body).toEqual({ elegible: true, cantidad: 150, expres: false, yaPedido: true });
    bandaDeLaSesion = 'band-c';
    const r2 = res();
    await handler('get')({}, r2);
    expect(r2.body).toEqual({ elegible: false });
  });
});
