/**
 * /auth/google: el email del cuerpo ya no abre sesión por sí solo.
 * Regresión del hallazgo crítico de la auditoría: POST {"email":"<cuenta ajena>"} devolvía un token.
 */
import { describe, expect, it, vi } from 'vitest';

const loadState = vi.fn(() => ({ users: [{ id: 'u-admin', email: 'admin@bandmanager.ai', role: 'admin' }], registeredBands: [] }));
vi.mock('../../state.js', async (orig) => ({ ...(await orig<any>()), loadState: (...a: any[]) => (loadState as any)(...a), saveState: () => {} }));

import usersRouter from '../users.js';

function manejador(ruta: string) {
  const capa: any = (usersRouter as any).stack.find((s: any) => s.route && s.route.path === ruta && s.route.methods.post);
  expect(capa).toBeDefined();
  const pila = capa.route.stack;
  return pila[pila.length - 1].handle;
}
const resFalso = () => {
  const r: any = {};
  r.status = (c: number) => ((r.code = c), r);
  r.json = (b: any) => ((r.body = b), r);
  r.cookie = () => r;
  return r;
};

describe('POST /auth/google', () => {
  it('con solo el email de otra cuenta responde 401 y no abre sesión', async () => {
    const res = resFalso();
    await manejador('/auth/google')({ body: { email: 'admin@bandmanager.ai' }, headers: {}, ip: '1.1.1.1' }, res, () => {});
    expect(res.code).toBe(401);
    expect(res.body.token).toBeUndefined();
    expect(loadState).not.toHaveBeenCalled(); // ni siquiera toca el estado de usuarios
  });

  it('con un accessToken inventado también responde 401', async () => {
    const res = resFalso();
    const fetchOriginal = globalThis.fetch;
    globalThis.fetch = (async () => new Response('{"error":"invalid_token"}', { status: 400 })) as any;
    try {
      await manejador('/auth/google')({ body: { email: 'admin@bandmanager.ai', uid: '1', accessToken: 'ya29.' + 'x'.repeat(40) }, headers: {}, ip: '1.1.1.1' }, res, () => {});
    } finally {
      globalThis.fetch = fetchOriginal;
    }
    expect(res.code).toBe(401);
    expect(res.body.token).toBeUndefined();
  });
});
