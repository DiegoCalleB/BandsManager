/**
 * Páginas públicas de SEO (guías y directorios): las rutas van en inglés en los dos idiomas y las anteriores
 * (en español) redirigen con 301 para no perder enlaces compartidos ni posicionamiento.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../db/core.js', async (orig) => ({ ...(await orig<any>()), getSupabase: () => { throw new Error('sin base de datos en este test'); } }));
vi.mock('../../state.js', async (orig) => ({ ...(await orig<any>()), loadState: () => ({}), saveState: () => {} }));

import router from '../paginasSeo';
import principal from '../paginaConcierto';

process.env.APP_URL = 'https://bandmanager.io';

const manejador = (r: any, ruta: string) => {
  const capa = r.stack.find((s: any) => s.route?.path === ruta && s.route.methods.get);
  expect(capa, ruta).toBeDefined();
  return capa.route.stack[capa.route.stack.length - 1].handle;
};

const resFalso = () => {
  const r: any = { cabeceras: {}, headersSent: false };
  r.setHeader = (k: string, v: any) => (r.cabeceras[k] = v);
  r.status = (c: number) => ((r.code = c), r);
  r.send = (b: any) => ((r.body = b), r);
  r.redirect = (c: number, u: string) => ((r.code = c), (r.destino = u));
  return r;
};

describe('rutas en inglés y redirecciones 301', () => {
  const redirecciones: Array<[any, string, Record<string, string>, string]> = [
    [router, '/guias', {}, '/guides'],
    [router, '/guias/:slug', { slug: 'como-hacer-un-epk' }, '/guides/como-hacer-un-epk'],
    [router, '/festivales', {}, '/directories/festivals'],
    [router, '/festivales/:slug', { slug: 'vina-rock' }, '/directories/festivals/vina-rock'],
    [router, '/listados', {}, '/directories'],
    [router, '/listados/festivales', {}, '/directories/festivals'],
    [router, '/listados/festivales/:slug', { slug: 'sonar' }, '/directories/festivals/sonar'],
    [router, '/en/festivals', {}, '/en/directories/festivals'],
    [router, '/en/festivals/:slug', { slug: 'sonar' }, '/en/directories/festivals/sonar'],
    [principal, '/plantilla-rider-tecnico', {}, '/technical-rider-template'],
  ];
  it.each(redirecciones)('%#: %s redirige a su ruta en inglés', (r, ruta, params, destino) => {
    const res = resFalso();
    manejador(r, ruta)({ params }, res);
    expect(res.code).toBe(301);
    expect(res.destino).toBe(destino);
  });

  it.each(['/guides', '/guides/:slug', '/en/guides', '/en/guides/:slug', '/directories', '/en/directories', '/directories/festivals', '/directories/festivals/:slug', '/en/directories/festivals', '/en/directories/festivals/:slug', '/directories/venues', '/directories/venues/:comunidad', '/directories/venues/:comunidad/:ciudad', '/directories/venues/:comunidad/:ciudad/:slug', '/en/directories/venues', '/en/directories/venues/:comunidad', '/en/directories/venues/:comunidad/:ciudad', '/en/directories/venues/:comunidad/:ciudad/:slug'])('existe la ruta %s', (ruta) => {
    expect(manejador(router, ruta)).toBeTypeOf('function');
  });

  it('una guía en español sirve en /guides con su canonical en inglés', () => {
    const res = resFalso();
    manejador(router, '/guides/:slug')({ params: { slug: 'como-hacer-un-epk' } }, res);
    expect(res.code ?? 200).toBe(200);
    expect(res.body).toContain('rel="canonical" href="https://bandmanager.io/guides/como-hacer-un-epk"');
  });

  it('si no hay salas publicadas (o la base falla), las páginas de salas dan 404 y el índice sale vacío con noindex', async () => {
    const pedir = (ruta: string, params: Record<string, string> = {}) =>
      new Promise<any>((ok) => { const res = resFalso(); res.send = (b: any) => { res.body = b; ok(res); return res; }; manejador(router, ruta)({ params }, res, ok); });
    const indice = await pedir('/directories/venues');
    expect(indice.code ?? 200).toBe(200);
    expect(indice.body).toContain('noindex,follow');
    const zona = await pedir('/directories/venues/:comunidad', { comunidad: 'comunidad-de-madrid' });
    expect(zona.code).toBe(404);
    const sala = await pedir('/en/directories/venues/:comunidad/:ciudad/:slug', { comunidad: 'a', ciudad: 'b', slug: 'c' });
    expect(sala.code).toBe(404);
    expect(sala.body).toContain('noindex');
  });

  it('el directorio responde con las fichas fijas si la base de datos falla', async () => {
    const res = resFalso();
    await new Promise<void>((ok) => { res.send = (b: any) => { res.body = b; ok(); return res; }; manejador(router, '/directories/festivals')({}, res, ok); });
    expect(res.body).toContain('FiM Vila-seca');
  });
});
