// El enlace del correo no debe confirmar solo: los escáneres de enlaces abren las URLs y se saltarían la
// doble confirmación. GET enseña una página con un botón; solo el POST confirma.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const confirmar = vi.fn();
const baja = vi.fn();
const obtener = vi.fn();
const enviar = vi.fn();

vi.mock('../../middleware/rateLimiter.js', () => ({
  createRateLimiter: () => (_q: any, _s: any, n: any) => n(),
  publicoRateLimiter: (_q: any, _s: any, n: any) => n(),
}));
vi.mock('../../db/interesados.js', () => ({
  dbAltaInteresado: vi.fn(),
  dbConfirmarInteresado: (...a: any[]) => confirmar(...a),
  dbBajaInteresado: (...a: any[]) => baja(...a),
  dbGetInteresado: (...a: any[]) => obtener(...a),
}));
vi.mock('../../services/transactionalEmail.js', () => ({
  getProductionAppUrl: () => 'https://bandmanager.test',
  sendTransactionalEmail: (...a: any[]) => enviar(...a),
}));
vi.mock('../../services/avisoAltas.js', () => ({ avisarAlta: vi.fn() }));

import router from '../interesados.js';
import { urlInteresado } from '../../utils/interesados.js';

function handler(ruta: string, metodo: 'get' | 'post') {
  const capa: any = (router as any).stack.find((s: any) => s.route?.path === ruta && s.route.methods[metodo]);
  expect(capa, `${metodo} ${ruta}`).toBeDefined();
  const pila = capa.route.stack;
  return pila[pila.length - 1].handle;
}
const res = () => {
  const r: any = { headers: {} };
  r.status = (c: number) => ((r.code = c), r);
  r.type = () => r;
  r.send = (b: string) => ((r.html = b), r);
  r.json = (b: any) => ((r.body = b), r);
  return r;
};
const enlace = (accion: 'confirmar' | 'baja') => {
  const u = new URL(urlInteresado('https://x.test', accion, 'interesado-1'));
  return { i: u.searchParams.get('i'), f: u.searchParams.get('f') };
};
const RUTA = '/api/public/interesados/confirmar';

describe('confirmar el email de la lista de novedades', () => {
  beforeEach(() => {
    confirmar.mockReset().mockResolvedValue(true);
    obtener.mockReset().mockResolvedValue({ id: 'interesado-1', email: 'ana@x.com', idioma: 'es', confirmado_at: null, baja_at: null });
    enviar.mockReset().mockResolvedValue({ success: true });
  });

  it('GET con enlace válido solo enseña un botón y NO confirma', async () => {
    const r = res();
    await handler(RUTA, 'get')({ query: enlace('confirmar') }, r);
    expect(r.html).toContain('<form method="POST"');
    expect(confirmar).not.toHaveBeenCalled();
    expect(enviar).not.toHaveBeenCalled();
  });

  it('POST con enlace válido confirma y manda la bienvenida', async () => {
    const r = res();
    await handler(RUTA, 'post')({ query: enlace('confirmar'), body: {} }, r);
    expect(confirmar).toHaveBeenCalledWith('interesado-1');
    expect(enviar).toHaveBeenCalledTimes(1);
  });

  it('el enlace puede llegar también en el cuerpo del formulario', async () => {
    const r = res();
    await handler(RUTA, 'post')({ query: {}, body: enlace('confirmar') }, r);
    expect(confirmar).toHaveBeenCalledWith('interesado-1');
  });

  it('con una firma falsa o de otra acción, ni GET ni POST hacen nada', async () => {
    for (const q of [{ i: 'interesado-1', f: 'a'.repeat(32) }, enlace('baja')]) {
      const g = res();
      await handler(RUTA, 'get')({ query: q }, g);
      const p = res();
      await handler(RUTA, 'post')({ query: q, body: {} }, p);
      expect(g.code).toBe(400);
      expect(p.code).toBe(400);
    }
    expect(confirmar).not.toHaveBeenCalled();
  });

  it('confirmar dos veces no repite la bienvenida', async () => {
    confirmar.mockResolvedValue(false);
    await handler(RUTA, 'post')({ query: enlace('confirmar'), body: {} }, res());
    expect(enviar).not.toHaveBeenCalled();
  });

  it('la baja sigue siendo de un solo clic (GET)', async () => {
    await handler('/api/public/interesados/baja', 'get')({ query: enlace('baja') }, res());
    expect(baja).toHaveBeenCalledWith('interesado-1');
  });
});
