/**
 * Una instancia nueva de Railway arranca con los usuarios semilla en memoria. El login y /auth/me
 * los mezclan con la fila real de Supabase, pero solo copiaban plan, rol y bandas: el email y el
 * nombre reales nunca llegaban, y el cambio de banda (dbUpsertUser) reescribía la fila con el email
 * de ejemplo. La base de datos manda.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

let estado: any;
let usuariosBd: any[];
vi.mock('../../state.js', async (orig) => ({ ...(await orig<any>()), loadState: () => estado, saveState: () => {} }));
vi.mock('../../db.js', async (orig) => ({
  ...(await orig<any>()),
  dbGetUsers: async () => usuariosBd,
  dbGetRegisteredBands: async () => [],
}));

import usersRouter from '../users.js';
import { ACTIVE_SESSIONS, hashPassword } from '../../auth';
import { manejador } from './helpers/rutas.js';
import { copiarCamposDeBd } from '../users/mezclaUsuarioBd.js';

const resFalso = () => {
  const r: any = {};
  r.status = (c: number) => ((r.code = c), r);
  r.json = (b: any) => ((r.body = b), r);
  r.cookie = () => r;
  return r;
};

const joseSemilla = () => ({
  id: 'user-jose', username: 'jose', name: 'Jose Semilla', email: 'jose@banda-demo.example', role: 'leader',
  instrument: 'Instrumento de ejemplo', avatarColor: 'azul', band_id: 'band-demo', main_band_id: 'band-demo', bandName: 'Banda Demo',
});
const joseReal = (extra: object = {}) => ({
  id: 'user-jose', username: 'jose', name: 'Jose', email: 'josefilgue85@gmail.com', role: 'leader', plan: 'cabeza_de_cartel',
  instrument: 'Percusión', avatarColor: 'var(--ok)', band_id: 'band-bakandeya', main_band_id: 'band-bakandeya', bandName: 'Bakandeya',
  band_order: ['band-bakandeya', 'band-majo-leiva'], ...extra,
});

beforeEach(() => {
  const { hash, salt } = hashPassword('clave-de-jose');
  usuariosBd = [{ ...joseReal(), passwordHash: hash, salt }];
  estado = {
    users: [{ ...joseSemilla(), passwordHash: hash, salt }],
    userBands: [{ id: 'ub-1', user_id: 'user-jose', band_id: 'band-bakandeya', role: 'leader' }],
    registeredBands: [{ id: 'band-bakandeya', band_id: 'band-bakandeya', nombre_banda: 'Bakandeya', plan: 'de_gira', user_id: 'user-jose' }],
    sessions: {},
  };
});

describe('copiarCamposDeBd', () => {
  it('copia identidad y bandas de la fila real sobre la de memoria', () => {
    const memoria: any = joseSemilla();
    copiarCamposDeBd(memoria, joseReal() as any);
    expect(memoria).toMatchObject({
      email: 'josefilgue85@gmail.com', name: 'Jose', instrument: 'Percusión', avatarColor: 'var(--ok)',
      band_id: 'band-bakandeya', main_band_id: 'band-bakandeya', bandName: 'Bakandeya', plan: 'cabeza_de_cartel',
      band_order: ['band-bakandeya', 'band-majo-leiva'],
    });
  });

  it('un email vacío o sin @ en la BD no pisa el de memoria', () => {
    const memoria: any = joseSemilla();
    copiarCamposDeBd(memoria, joseReal({ email: '' }) as any);
    expect(memoria.email).toBe('jose@banda-demo.example');
    copiarCamposDeBd(memoria, joseReal({ email: 'jose' }) as any);
    expect(memoria.email).toBe('jose@banda-demo.example');
  });
});

describe('el usuario que ve el cliente sale de Supabase, no de la semilla', () => {
  it('POST /auth/login devuelve el email real y la banda principal real', async () => {
    const res = resFalso();
    await manejador(usersRouter, '/auth/login', 'post')({ body: { username: 'jose', password: 'clave-de-jose' }, headers: {}, query: {}, ip: '9.9.9.9' }, res, () => {});
    expect(res.body.user.email).toBe('josefilgue85@gmail.com');
    expect(res.body.user.name).toBe('Jose');
    expect(res.body.availableBands.map((b: any) => b.band_id)).not.toContain('band-demo');
  });

  it('GET /auth/me devuelve el email real', async () => {
    ACTIVE_SESSIONS['tok-jose'] = { userId: 'user-jose', createdAt: Date.now() };
    const res = resFalso();
    await manejador(usersRouter, '/auth/me', 'get')({ headers: { authorization: 'Bearer tok-jose' }, query: {} }, res, () => {});
    expect(res.body.user.email).toBe('josefilgue85@gmail.com');
  });
});
