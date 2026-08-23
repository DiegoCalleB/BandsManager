import { describe, it, expect, beforeEach } from 'vitest';
import { ACTIVE_SESSIONS, getUserFromRequest } from '../auth';

// Estado mínimo con la forma que lee getUserFromRequest.
const estado = (extra: any = {}) => ({
  users: [],
  userBands: [],
  registeredBands: [],
  sessions: {},
  ...extra,
});

const peticion = (token: string, extra: any = {}) => ({
  headers: { authorization: `Bearer ${token}`, ...(extra.headers || {}) },
  query: extra.query || {},
  body: extra.body || {},
}) as any;

const TOKEN = 'token-de-prueba';

beforeEach(() => {
  for (const k of Object.keys(ACTIVE_SESSIONS)) delete ACTIVE_SESSIONS[k];
  ACTIVE_SESSIONS[TOKEN] = { userId: 'user-ana', createdAt: Date.now() };
});

describe('getUserFromRequest: a qué banda entra cada quien', () => {
  it('un usuario sin ninguna banda asociada NO tiene sesión válida', () => {
    // Antes se le daba 'band-bakandeya' por defecto, así que una cuenta a la que le faltara su
    // vínculo acababa dentro de la banda insignia viendo sus leads y sus finanzas.
    const state = estado({ users: [{ id: 'user-ana', username: 'ana' }] });
    expect(getUserFromRequest(peticion(TOKEN), () => state)).toBeNull();
  });

  it('entra en su banda cuando la tiene', () => {
    const state = estado({ users: [{ id: 'user-ana', username: 'ana', band_id: 'band-la-vanda' }] });
    const user = getUserFromRequest(peticion(TOKEN), () => state);
    expect(user?.band_id).toBe('band-la-vanda');
    expect(user?.allowedBandIds).toContain('band-la-vanda');
    expect(user?.allowedBandIds).not.toContain('band-bakandeya');
  });

  it('no acepta la cabecera x-band-id de una banda ajena', () => {
    const state = estado({ users: [{ id: 'user-ana', username: 'ana', band_id: 'band-la-vanda' }] });
    const req = peticion(TOKEN, { headers: { 'x-band-id': 'band-bakandeya' } });
    expect(getUserFromRequest(req, () => state)?.band_id).toBe('band-la-vanda');
  });
});

describe('getUserFromRequest: el rol es por banda', () => {
  it('el rol de leader de su banda NO viaja a otra donde solo es miembro', () => {
    // El escape: `userBand?.role || foundUser.role`. Con rol global 'leader', al cambiar a una
    // banda sin fila en userBands se seguía siendo leader, y con eso finanzas y requireLeader.
    const state = estado({
      users: [{ id: 'user-ana', username: 'ana', band_id: 'band-la-vanda', role: 'leader' }],
      registeredBands: [{ id: 'reg-otra', band_id: 'band-otra', user_id: 'user-ana', nombre_banda: 'Otra' }],
    });
    const req = peticion(TOKEN, { headers: { 'x-band-id': 'band-otra' } });
    const user = getUserFromRequest(req, () => state);
    expect(user?.band_id).toBe('band-otra');
    expect(user?.role).toBe('member');
  });

  it('sigue siendo leader en su propia banda', () => {
    const state = estado({
      users: [{ id: 'user-ana', username: 'ana', band_id: 'band-la-vanda', role: 'leader' }],
    });
    expect(getUserFromRequest(peticion(TOKEN), () => state)?.role).toBe('leader');
  });

  it('manda el rol que diga userBands para esa banda', () => {
    const state = estado({
      users: [{ id: 'user-ana', username: 'ana', band_id: 'band-la-vanda', role: 'member' }],
      userBands: [{ user_id: 'user-ana', band_id: 'band-otra', role: 'leader' }],
    });
    const req = peticion(TOKEN, { headers: { 'x-band-id': 'band-otra' } });
    expect(getUserFromRequest(req, () => state)?.role).toBe('leader');
  });
});
