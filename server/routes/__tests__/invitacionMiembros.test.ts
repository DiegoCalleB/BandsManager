/**
 * Regresión de la auditoría: /auth/activate-member valía con solo saber el correo del invitado.
 * Ahora exige el token de un solo uso que viaja en el correo de invitación.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

let estado: any;
const correos: any[] = [];
vi.mock('../../state.js', async (orig) => ({ ...(await orig<any>()), loadState: () => estado, saveState: () => {} }));
vi.mock('../../db/users.js', async (orig) => ({
  ...(await orig<any>()),
  dbUpsertUser: async () => ({}),
  dbUpsertUserBand: async () => ({}),
}));
vi.mock('../../db/bands.js', async (orig) => ({ ...(await orig<any>()), dbUpsertRegisteredBand: async () => ({}) }));
vi.mock('../../services/transactionalEmail.js', async (orig) => ({
  ...(await orig<any>()),
  sendMemberInvitationEmail: async (o: any) => {
    correos.push(o);
    return { success: true };
  },
}));

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
const llamar = async (ruta: string, body: any, user?: any) => {
  const res = resFalso();
  await manejador(ruta)({ body, user, headers: {}, query: {}, ip: '1.1.1.1' }, res, () => {});
  return res;
};

const director = { id: 'u-dir', username: 'dir', role: 'leader', band_id: 'band-a', allowedBandIds: ['band-a', 'a'] };

beforeEach(() => {
  correos.length = 0;
  estado = {
    users: [{ id: 'u-dir', username: 'dir', email: 'dir@x.com', role: 'leader', band_id: 'band-a', passwordHash: 'h', salt: 's' }],
    userBands: [],
    registeredBands: [{ id: 'reg-a', band_id: 'band-a', nombre_banda: 'Banda A', user_id: 'u-dir' }],
    sessions: {},
  };
});

async function invitar() {
  const r = await llamar('/users', { username: 'nuevo', name: 'Nuevo', password: 'provisional1', email: 'nuevo@x.com' }, director);
  expect(r.code).toBe(201);
  expect(correos).toHaveLength(1);
  return correos[0].activationToken as string;
}

describe('activación de miembros invitados', () => {
  it('el correo de invitación lleva un token, y la respuesta al director no lo filtra', async () => {
    const r = await llamar('/users', { username: 'nuevo', name: 'Nuevo', password: 'provisional1', email: 'nuevo@x.com' }, director);
    expect(correos[0].activationToken).toMatch(/^[a-f0-9]{32,}$/);
    expect(JSON.stringify(r.body)).not.toContain(correos[0].activationToken);
    expect(JSON.stringify(r.body)).not.toContain('_invitacion');
  });

  it('sin token (solo el correo) NO se puede ver ni activar la invitación', async () => {
    await invitar();
    const check = await llamar('/auth/check-invitation', { email: 'nuevo@x.com' });
    expect(check.code).toBe(404);
    const act = await llamar('/auth/activate-member', { email: 'nuevo@x.com', username: 'nuevo', name: 'Atacante', password: 'clave-del-atacante' });
    expect(act.code).toBe(403);
    expect(estado.users.find((u: any) => u.id !== 'u-dir').passwordHash).not.toBe(undefined);
    expect(Object.keys(estado.sessions)).toHaveLength(0);
  });

  it('con un token equivocado tampoco', async () => {
    await invitar();
    const act = await llamar('/auth/activate-member', { email: 'nuevo@x.com', username: 'nuevo', name: 'X', password: 'abc12345', token: 'a'.repeat(48) });
    expect(act.code).toBe(403);
  });

  it('con el token del correo se activa, se abre sesión y el token deja de valer', async () => {
    const token = await invitar();
    const check = await llamar('/auth/check-invitation', { email: 'nuevo@x.com', token });
    expect(check.body.success).toBe(true);

    const act = await llamar('/auth/activate-member', { email: 'nuevo@x.com', username: 'nuevo', name: 'Nuevo', password: 'mi-clave-real', token });
    expect(act.code).toBeUndefined();
    expect(act.body.token).toBeTruthy();

    const otra = await llamar('/auth/activate-member', { email: 'nuevo@x.com', username: 'nuevo', name: 'X', password: 'otra-clave-123', token });
    expect(otra.code).toBe(409);
  });

  it('reenviar la invitación genera un token nuevo e invalida el anterior', async () => {
    const viejo = await invitar();
    const r = await llamar('/users', { username: 'nuevo', name: 'Nuevo', password: 'x', email: 'nuevo@x.com' }, director);
    expect(r.code).toBe(200);
    expect(r.body.reinvitado).toBe(true);
    const nuevo = correos[1].activationToken;
    expect(nuevo).not.toBe(viejo);

    const conViejo = await llamar('/auth/activate-member', { email: 'nuevo@x.com', username: 'nuevo', name: 'X', password: 'abc12345', token: viejo });
    expect(conViejo.code).toBe(403);
    const conNuevo = await llamar('/auth/activate-member', { email: 'nuevo@x.com', username: 'nuevo', name: 'Nuevo', password: 'abc12345', token: nuevo });
    expect(conNuevo.body.token).toBeTruthy();
  });
});
