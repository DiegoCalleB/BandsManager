/**
 * Regresiones de la auditoría: toma de cuentas por un líder y plan de pago gratis.
 *   1. Un líder añade a una víctima a SU banda (POST /users) y le cambia la contraseña (PUT).
 *   2. Un líder se pone un plan de pago escribiendo `plan` en PUT /users/:id.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

let estado: any;
vi.mock('../../state.js', async (orig) => ({ ...(await orig<any>()), loadState: () => estado, saveState: () => {} }));
vi.mock('../../db/users.js', async (orig) => ({
  ...(await orig<any>()),
  dbUpsertUser: async () => ({}),
  dbUpsertUserBand: async () => ({}),
}));
vi.mock('../../db/bands.js', async (orig) => ({ ...(await orig<any>()), dbUpsertRegisteredBand: async () => ({}) }));
vi.mock('../../services/transactionalEmail.js', async (orig) => ({
  ...(await orig<any>()),
  sendMemberInvitationEmail: async () => ({ success: true }),
}));

import usersRouter from '../users.js';
import { verifyPassword } from '../../auth';

function manejador(ruta: string, metodo: 'post' | 'put') {
  const capa: any = (usersRouter as any).stack.find((s: any) => s.route && s.route.path === ruta && s.route.methods[metodo]);
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

const atacante = { id: 'u-atacante', username: 'mala', role: 'leader', band_id: 'band-mala', allowedBandIds: ['band-mala', 'mala'] };

beforeEach(() => {
  estado = {
    users: [
      { id: 'u-atacante', username: 'mala', email: 'mala@x.com', role: 'leader', band_id: 'band-mala', passwordHash: 'h', salt: 's' },
      { id: 'u-victima', username: 'victima', email: 'v@x.com', role: 'leader', band_id: 'band-victima', passwordHash: 'hv', salt: 'sv' },
      { id: 'u-admin', username: 'admin', email: 'admin@bandmanager.ai', role: 'admin', band_id: 'band-bakandeya', passwordHash: 'ha', salt: 'sa' },
      { id: 'u-miembro', username: 'miembro', email: 'm@x.com', role: 'member', band_id: 'band-mala', activacion_pendiente: true, passwordHash: 'hm', salt: 'sm' },
    ],
    userBands: [{ id: 'ub-1', user_id: 'u-miembro', band_id: 'band-mala', role: 'member' }],
    registeredBands: [
      { id: 'reg-mala', band_id: 'band-mala', plan: 'ensayo', user_id: 'u-atacante' },
      { id: 'reg-victima', band_id: 'band-victima', plan: 'de_gira', user_id: 'u-victima' },
    ],
  };
});

const put = (id: string, body: any, user = atacante) => {
  const res = resFalso();
  return manejador('/users/:id', 'put')({ params: { id }, body, user, headers: {}, query: {} }, res, () => {}).then(() => res);
};

describe('toma de cuentas por un líder', () => {
  it('vincular a una víctima a mi banda ya no me deja cambiarle la contraseña', async () => {
    // Paso 1: la vincula a su banda (sigue siendo posible, pero solo como miembro)
    const resPost = resFalso();
    await manejador('/users', 'post')({ body: { username: 'victima', name: 'x', password: 'abc123', role: 'leader' }, user: atacante, headers: {}, query: {} }, resPost, () => {});
    expect(resPost.code).toBe(201);
    expect(resPost.body.role).toBe('member');
    expect(resPost.body.email).toBeUndefined(); // no se filtra la ficha ajena
    expect(estado.userBands.find((u: any) => u.user_id === 'u-victima' && u.band_id === 'band-mala').role).toBe('member');

    // Paso 2: ahora comparten banda, pero la víctima tiene SU banda: la contraseña no se toca
    const resPut = await put('u-victima', { newPassword: 'nueva-clave-del-atacante' });
    expect(resPut.code).toBe(403);
    expect(estado.users.find((u: any) => u.id === 'u-victima').passwordHash).toBe('hv');
  });

  it('un admin de la plataforma no se puede editar ni añadir desde una banda', async () => {
    const r1 = await put('u-admin', { newPassword: 'x'.repeat(12) });
    expect(r1.code).toBe(403);
    const res = resFalso();
    await manejador('/users', 'post')({ body: { username: 'admin', name: 'x', password: 'abc123' }, user: atacante, headers: {}, query: {} }, res, () => {});
    expect(res.code).toBe(403);
    expect(estado.users.find((u: any) => u.id === 'u-admin').passwordHash).toBe('ha');
  });

  it('lo legítimo sigue funcionando: el líder resetea a un miembro que es solo de su banda', async () => {
    const r = await put('u-miembro', { newPassword: 'clave-nueva-miembro' });
    expect(r.code).toBeUndefined(); // res.json sin status = 200
    const m = estado.users.find((u: any) => u.id === 'u-miembro');
    expect(verifyPassword('clave-nueva-miembro', m.passwordHash, m.salt)).toBe(true);
  });

  it('y cada cual puede cambiar su propia contraseña', async () => {
    const r = await put('u-atacante', { newPassword: 'mi-propia-clave-1' });
    expect(r.code).toBeUndefined();
  });
});

describe('plan de pago gratis', () => {
  it('un líder no puede ponerse un plan de pago con PUT /users/:id', async () => {
    const r = await put('u-atacante', { plan: 'cabeza_de_cartel', band_id: 'band-mala' });
    expect(r.code).toBe(403);
    expect(estado.registeredBands.find((b: any) => b.band_id === 'band-mala').plan).toBe('ensayo');
  });

  it('el admin de la plataforma sí puede (soporte, sobre sí mismo)', async () => {
    const admin = { id: 'u-admin', username: 'admin', role: 'admin', band_id: 'band-bakandeya', allowedBandIds: [] };
    const r = await put('u-admin', { plan: 'de_gira', band_id: 'band-mala' }, admin);
    expect(r.code).toBeUndefined();
    expect(estado.registeredBands.find((b: any) => b.band_id === 'band-mala').plan).toBe('de_gira');
  });
});

describe('login con band_id ajeno', () => {
  it('ignora un band_id que no es del usuario: inicia sesión en SU banda', async () => {
    const { hashPassword } = await import('../../auth');
    const { hash, salt } = hashPassword('clave-de-la-atacante');
    estado.users.find((u: any) => u.id === 'u-atacante').passwordHash = hash;
    estado.users.find((u: any) => u.id === 'u-atacante').salt = salt;
    estado.sessions = {};

    const res = resFalso();
    await manejador('/auth/login', 'post')(
      { body: { username: 'mala', password: 'clave-de-la-atacante', band_id: 'band-victima' }, headers: {}, query: {}, ip: '9.9.9.9' },
      res,
      () => {}
    );
    expect(res.code).toBeUndefined();
    expect(res.body.token).toBeTruthy();
    const banda = res.body.user?.band_id ?? res.body.band_id;
    expect(String(banda)).toBe('band-mala');
  });
});
