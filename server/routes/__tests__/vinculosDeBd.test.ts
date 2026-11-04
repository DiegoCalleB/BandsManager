/**
 * Las bandas de un usuario viven en la tabla `user_bands` de Supabase. El servidor solo miraba los
 * vínculos que tenía en memoria (que se rehacen a partir de `users.band_id` y de las bandas
 * registradas con su email): una banda vinculada solo en la tabla desaparecía del selector en cuanto
 * la banda activa era otra, y cambiarse a ella daba «No tienes acceso a esta banda».
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

let estado: any;
let vinculosBd: any[];
let falloBd: Error | null;
vi.mock('../../state.js', async (orig) => ({ ...(await orig<any>()), loadState: () => estado, saveState: () => {} }));
vi.mock('../../db.js', async (orig) => ({
  ...(await orig<any>()),
  dbGetUsers: async () => [],
  dbGetRegisteredBands: async () => [],
  dbUpsertUser: async (u: any) => u,
  dbGetUserBands: async (userId?: string) => {
    if (falloBd) throw falloBd;
    return vinculosBd.filter((v) => !userId || v.user_id === userId);
  },
}));

import usersRouter from '../users.js';
import { ACTIVE_SESSIONS, hashPassword } from '../../auth';
import { manejador } from './helpers/rutas.js';
import { hidratarVinculosDeBd } from '../users/vinculosDeBd.js';

const resFalso = () => {
  const r: any = {};
  r.status = (c: number) => ((r.code = c), r);
  r.json = (b: any) => ((r.body = b), r);
  r.cookie = () => r;
  return r;
};
const ids = (res: any) => res.body.availableBands.map((b: any) => b.band_id).sort();

beforeEach(() => {
  falloBd = null;
  const { hash, salt } = hashPassword('clave-de-jose');
  // Jose tiene tres bandas en user_bands, pero la banda activa es la dos y la uno no está registrada a su email.
  vinculosBd = [
    { id: 'ub-1', user_id: 'user-jose', band_id: 'band-uno', role: 'leader' },
    { id: 'ub-2', user_id: 'user-jose', band_id: 'band-dos', role: 'leader' },
    { id: 'ub-3', user_id: 'user-jose', band_id: 'band-tres', role: 'leader' },
    { id: 'ub-9', user_id: 'user-otro', band_id: 'band-ajena', role: 'leader' },
  ];
  estado = {
    users: [{ id: 'user-jose', username: 'jose', email: 'jose@correo-real.test', role: 'leader', band_id: 'band-dos', main_band_id: 'band-uno', passwordHash: hash, salt }],
    userBands: [{ id: 'ub-2', user_id: 'user-jose', band_id: 'band-dos', role: 'leader' }],
    registeredBands: [
      { id: 'band-uno', band_id: 'band-uno', nombre_banda: 'Banda Uno', plan: 'de_gira', email: 'otra@correo.test' },
      { id: 'band-dos', band_id: 'band-dos', nombre_banda: 'Banda Dos', plan: 'cabeza_de_cartel', email: 'jose@correo-real.test' },
      { id: 'band-tres', band_id: 'band-tres', nombre_banda: 'Banda Tres', plan: 'cabeza_de_cartel', email: 'jose@correo-real.test' },
      { id: 'band-ajena', band_id: 'band-ajena', nombre_banda: 'Banda Ajena', plan: 'ensayo', email: 'x@y.test' },
    ],
    sessions: {},
  };
});

describe('hidratarVinculosDeBd', () => {
  it('añade los vínculos de la tabla que faltan en memoria, solo los del usuario y sin duplicar', async () => {
    await hidratarVinculosDeBd(estado, 'user-jose');
    await hidratarVinculosDeBd(estado, 'user-jose');
    expect(estado.userBands.map((v: any) => v.band_id).sort()).toEqual(['band-dos', 'band-tres', 'band-uno']);
  });

  it('si Supabase falla, no rompe y deja los vínculos en memoria como estaban', async () => {
    falloBd = new Error('Supabase caído');
    await expect(hidratarVinculosDeBd(estado, 'user-jose')).resolves.toBeUndefined();
    expect(estado.userBands).toHaveLength(1);
  });
});

describe('las bandas de user_bands salen en el selector aunque la activa sea otra', () => {
  it('POST /auth/login incluye la banda que solo está en user_bands', async () => {
    const res = resFalso();
    await manejador(usersRouter, '/auth/login', 'post')({ body: { username: 'jose', password: 'clave-de-jose' }, headers: {}, query: {}, ip: '9.9.9.9' }, res, () => {});
    expect(ids(res)).toEqual(['band-dos', 'band-tres', 'band-uno']);
  });

  it('GET /auth/me incluye la banda que solo está en user_bands', async () => {
    ACTIVE_SESSIONS['tok-vinculos'] = { userId: 'user-jose', createdAt: Date.now() };
    const res = resFalso();
    await manejador(usersRouter, '/auth/me', 'get')({ headers: { authorization: 'Bearer tok-vinculos' }, query: {} }, res, () => {});
    expect(ids(res)).toEqual(['band-dos', 'band-tres', 'band-uno']);
  });

  it('POST /auth/switch-band permite cambiarse a esa banda y no pierde las demás', async () => {
    ACTIVE_SESSIONS['tok-cambio'] = { userId: 'user-jose', createdAt: Date.now() };
    const res = resFalso();
    await manejador(usersRouter, '/auth/switch-band', 'post')({ body: { band_id: 'band-uno' }, headers: { authorization: 'Bearer tok-cambio' }, query: {} }, res, () => {});
    expect(res.code).toBeUndefined();
    expect(res.body.user.band_id).toBe('band-uno');
    expect(ids(res)).toEqual(['band-dos', 'band-tres', 'band-uno']);
  });

  it('una banda de otro usuario no se cuela en la lista ni se puede elegir', async () => {
    ACTIVE_SESSIONS['tok-ajena'] = { userId: 'user-jose', createdAt: Date.now() };
    const res = resFalso();
    await manejador(usersRouter, '/auth/switch-band', 'post')({ body: { band_id: 'band-ajena' }, headers: { authorization: 'Bearer tok-ajena' }, query: {} }, res, () => {});
    expect(res.code).toBe(404);
  });
});
