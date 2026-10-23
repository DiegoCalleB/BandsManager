/**
 * Si Supabase falla al iniciar sesión (clave inválida, caída), el login no debe decir «contraseña
 * incorrecta»: quien no está en memoria recibe 503, y quien sí está sigue pudiendo entrar.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

let estado: any;
let errorBd: Error | null;
vi.mock('../../state.js', async (orig) => ({ ...(await orig<any>()), loadState: () => estado, saveState: () => {} }));
vi.mock('../../db/users.js', async (orig) => ({
  ...(await orig<any>()),
  dbGetUsers: async () => {
    if (errorBd) throw errorBd;
    return [];
  },
}));

import usersRouter from '../users.js';
import { hashPassword } from '../../auth';
import { manejador } from './helpers/rutas.js';

const SIN_SUPABASE = 'Supabase URL or Key is missing in environment variables.';

const resFalso = () => {
  const r: any = {};
  r.status = (c: number) => ((r.code = c), r);
  r.json = (b: any) => ((r.body = b), r);
  r.cookie = () => r;
  return r;
};

const login = async (username: string, password: string) => {
  const res = resFalso();
  await manejador(usersRouter, '/auth/login', 'post')({ body: { username, password }, headers: {}, query: {}, ip: '9.9.9.9' }, res, () => {});
  return res;
};

beforeEach(() => {
  errorBd = null;
  const { hash, salt } = hashPassword('clave-de-ana');
  estado = {
    users: [{ id: 'u-ana', username: 'ana', email: 'ana@x.com', role: 'leader', band_id: 'band-ana', passwordHash: hash, salt }],
    userBands: [],
    registeredBands: [{ id: 'reg-ana', band_id: 'band-ana', plan: 'ensayo', user_id: 'u-ana' }],
    sessions: {},
  };
});

describe('login con la base de datos caída', () => {
  it('un usuario que no está en memoria recibe 503, no «contraseña incorrecta»', async () => {
    errorBd = new Error('Supabase Error (users): Invalid API key');
    const res = await login('jose', 'lo-que-sea');
    expect(res.code).toBe(503);
    expect(res.body.error).toMatch(/base de datos/i);
  });

  it('un usuario que sí está en memoria entra aunque la BD falle', async () => {
    errorBd = new Error('Supabase Error (users): Invalid API key');
    const res = await login('ana', 'clave-de-ana');
    expect(res.code).toBeUndefined();
    expect(res.body.token).toBeTruthy();
  });

  it('con la BD caída, una contraseña mala sigue siendo 401', async () => {
    errorBd = new Error('Supabase Error (users): timeout');
    const res = await login('ana', 'mala');
    expect(res.code).toBe(401);
  });

  it('sin Supabase configurado (arranque local) un usuario desconocido sigue siendo 401', async () => {
    errorBd = new Error(SIN_SUPABASE);
    const res = await login('jose', 'lo-que-sea');
    expect(res.code).toBe(401);
  });

  it('con la BD bien, un usuario inexistente sigue siendo 401', async () => {
    const res = await login('jose', 'lo-que-sea');
    expect(res.code).toBe(401);
    expect(res.body.error).toBe('Usuario o contraseña incorrectos');
  });
});
