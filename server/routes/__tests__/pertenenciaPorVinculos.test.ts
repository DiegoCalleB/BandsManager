/**
 * La pertenencia de un usuario a una banda la dan sus vínculos (`user_bands`, el dueño registrado o la
 * banda activa), NUNCA el email: el email de contacto de una banda es un dato de contacto, y que
 * coincida con el de un usuario no le da ni le quita la banda. Antes el selector, el cambio de banda
 * y los vínculos que fabricaba `ensureSeedBands` en memoria fusionaban por email.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

let estado: any;
vi.mock('../../state.js', async (orig) => ({ ...(await orig<any>()), loadState: () => estado, saveState: () => {} }));
vi.mock('../../db.js', async (orig) => ({
  ...(await orig<any>()),
  dbGetUsers: async () => [],
  dbGetRegisteredBands: async () => [],
  dbUpsertUser: async (u: any) => u,
  dbGetUserBands: async (userId?: string) => estado.vinculosBd.filter((v: any) => !userId || v.user_id === userId),
}));

import usersRouter from '../users.js';
import { ACTIVE_SESSIONS } from '../../auth';
import { ensureSeedBands } from '../../state.js';
import { buildAvailableBandsForUser } from '../users/bandasDisponibles.js';
import { manejador } from './helpers/rutas.js';

const EMAIL = 'jose@correo-real.test';
const resFalso = () => {
  const r: any = {};
  r.status = (c: number) => ((r.code = c), r);
  r.json = (b: any) => ((r.body = b), r);
  r.cookie = () => r;
  return r;
};
const ids = (lista: any[]) => lista.map((b) => b.band_id).sort();

beforeEach(() => {
  estado = {
    vinculosBd: [{ id: 'ub-1', user_id: 'user-jose', band_id: 'band-uno', role: 'leader' }],
    users: [
      { id: 'user-jose', username: 'jose', email: EMAIL, role: 'leader', band_id: 'band-uno', main_band_id: 'band-uno', passwordHash: 'x', salt: 'y' },
      // Otra cuenta con el MISMO email y otra banda: no debe fusionarse.
      { id: 'user-jose-2', username: 'jose2', email: EMAIL, role: 'leader', band_id: 'band-cuatro', passwordHash: 'x', salt: 'y' },
    ],
    userBands: [{ id: 'ub-1', user_id: 'user-jose', band_id: 'band-uno', role: 'leader' }],
    registeredBands: [
      { id: 'band-uno', band_id: 'band-uno', nombre_banda: 'Banda Uno', plan: 'de_gira', email: 'otra@correo.test' },
      // Registrada con el email de Jose, sin vínculo y sin dueño: no es de Jose.
      { id: 'band-dos', band_id: 'band-dos', nombre_banda: 'Banda Dos', plan: 'ensayo', email: EMAIL },
      // Con Jose como dueño registrado: sí.
      { id: 'band-tres', band_id: 'band-tres', nombre_banda: 'Banda Tres', plan: 'ensayo', email: 'x@correo.test', user_id: 'user-jose' },
      { id: 'band-cuatro', band_id: 'band-cuatro', nombre_banda: 'Banda Cuatro', plan: 'ensayo', email: 'y@correo.test' },
    ],
    sessions: {},
  };
});

describe('el selector de bandas no fusiona por email', () => {
  it('lista user_bands, el dueño registrado y la banda activa; no la banda registrada con su email ni la de otra cuenta con su email', async () => {
    const lista = await buildAvailableBandsForUser(estado, estado.users[0]);
    expect(ids(lista)).toEqual(['band-tres', 'band-uno']);
  });

  it('la banda activa sin vínculo se sigue mostrando (cuenta antigua sin fila en user_bands)', async () => {
    estado.userBands = [];
    const lista = await buildAvailableBandsForUser(estado, estado.users[0]);
    expect(ids(lista)).toContain('band-uno');
  });

  it('un administrador sigue viendo todas las bandas registradas', async () => {
    const admin = { id: 'user-admin', username: 'admin', email: 'a@correo.test', role: 'admin', band_id: 'band-uno', passwordHash: 'x', salt: 'y' };
    const lista = await buildAvailableBandsForUser(estado, admin as any);
    expect(ids(lista)).toEqual(['band-cuatro', 'band-dos', 'band-tres', 'band-uno']);
  });
});

describe('ensureSeedBands no fabrica vínculos por email', () => {
  it('una banda registrada con el email de un usuario no crea un vínculo en memoria; con su user_id, sí', () => {
    const state: any = { users: estado.users, registeredBands: estado.registeredBands, userBands: [] };
    ensureSeedBands(state);
    const bandasDeJose = state.userBands.filter((ub: any) => ub.user_id === 'user-jose').map((ub: any) => ub.band_id);
    expect(bandasDeJose).not.toContain('band-dos');
    expect(bandasDeJose).toContain('band-tres');
  });
});

describe('ensureSeedBands no cambia la banda activa de nadie por su email', () => {
  it('una banda activa válida se conserva aunque otra banda esté registrada con el email del usuario y los vínculos en memoria estén vacíos', () => {
    // Instancia recién arrancada: sin vínculos en memoria. Antes, la activa pasaba a la banda registrada con su email.
    const state: any = { users: [{ ...estado.users[0], band_id: 'band-uno' }], registeredBands: estado.registeredBands, userBands: [] };
    ensureSeedBands(state);
    expect(state.users[0].band_id).toBe('band-uno');
  });

  it('un band_id roto (formato user-…) sí se repara con la banda de la que es dueño registrado', () => {
    const state: any = { users: [{ ...estado.users[0], band_id: 'user-jose' }], registeredBands: estado.registeredBands, userBands: [] };
    ensureSeedBands(state);
    expect(state.users[0].band_id).toBe('band-tres');
  });
});

describe('el cambio de banda no da acceso por email', () => {
  const cambiar = async (band_id: string) => {
    ACTIVE_SESSIONS['tok-pertenencia'] = { userId: 'user-jose', createdAt: Date.now() };
    const res = resFalso();
    await manejador(usersRouter, '/auth/switch-band', 'post')({ body: { band_id }, headers: { authorization: 'Bearer tok-pertenencia' }, query: {} }, res, () => {});
    return res;
  };

  it('una banda registrada con su email pero sin vínculo se rechaza', async () => {
    expect((await cambiar('band-dos')).code).toBe(404);
  });

  it('la banda de otra cuenta con su mismo email se rechaza', async () => {
    expect((await cambiar('band-cuatro')).code).toBe(404);
  });

  it('una banda de user_bands se acepta aunque su email registrado sea de otra persona', async () => {
    estado.vinculosBd.push({ id: 'ub-5', user_id: 'user-jose', band_id: 'band-cinco', role: 'leader' });
    estado.registeredBands.push({ id: 'band-cinco', band_id: 'band-cinco', nombre_banda: 'Banda Cinco', plan: 'ensayo', email: 'z@correo.test' });
    const res = await cambiar('band-cinco');
    expect(res.code).toBeUndefined();
    expect(res.body.user.band_id).toBe('band-cinco');
  });
});
