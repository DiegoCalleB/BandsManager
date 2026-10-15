/**
 * Superficie de seguridad de los routers de usuarios y de IA musical.
 *
 * Escrito ANTES de partir users.ts y ai_music.ts en sub-routers (ADR 0042): fija qué rutas
 * existen, cuáles exigen sesión o liderazgo y que el cambio de banda y el estado de una separación
 * de stems no crucen bandas. Si una ruta se pierde, aparece de más o sale sin `requireAuth` al
 * mover código entre ficheros, este test lo dice antes que un usuario.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

let estado: Record<string, unknown>;
const getStemsJobStatus = vi.fn(async () => ({ state: 'not_found' }));

vi.mock('../../state.js', async (orig) => ({ ...(await orig<Record<string, unknown>>()), loadState: () => estado, saveState: () => {} }));
vi.mock('../../db.js', async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  dbGetRegisteredBands: async () => [],
  dbMigrateAllPlansToNewTiers: async () => undefined,
  dbCleanCorruptedLeadFields: async () => undefined,
}));
vi.mock('../../db/stemsCache.js', async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  getStemsJobStatus: (...a: unknown[]) => (getStemsJobStatus as (...x: unknown[]) => unknown)(...a),
}));

import usersRouter from '../users.js';
import aiMusicRouter from '../ai_music.js';
import { requireAuth, requireLeader } from '../../state.js';
import { ACTIVE_SESSIONS } from '../../auth.js';
import { capasConRuta, inventario, manejador } from './helpers/rutas.js';

const RUTAS_USERS = [
  'POST /auth/register',
  'GET /registered-bands',
  'GET /users/registered-bands',
  'POST /auth/check-invitation',
  'POST /auth/activate-member',
  'POST /auth/google',
  'POST /auth/login',
  'POST /auth/reset-password/request',
  'POST /auth/reset-password/confirm',
  'POST /auth/test-email',
  'GET /auth/me',
  'POST /auth/switch-band',
  'POST /auth/logout',
  'POST /set-main-band',
  'POST /users/set-main-band',
  'POST /set-band-order',
  'POST /users/set-band-order',
  'POST /ui-preferences',
  'POST /users/ui-preferences',
  'GET /ui-preferences',
  'GET /users/ui-preferences',
  'POST /upload-logo',
  'POST /users/upload-logo',
  'POST /bands/upload-logo',
  'POST /bands/logo',
  'POST /create-band',
  'POST /users/create-band',
  'DELETE /leave-band/:bandId',
  'DELETE /users/leave-band/:bandId',
  'POST /users/associate',
  'GET /users',
  'POST /users',
  'PUT /users/:id',
  'DELETE /users/:id',
];

const RUTAS_AI_MUSIC = [
  'POST /generate',
  'POST /generate-music',
  'POST /ai-stem-separation',
  'GET /ai-stem-separation/status',
  'GET /ai-stem-separation/fal-diagnostic',
  'POST /ai-generate-instrument-track',
  'POST /webhooks/replicate-stems',
  'POST /api/webhooks/replicate-stems',
];

// Rutas sin requireAuth y por qué es correcto.
const PUBLICAS = new Set([
  // Alta, login y recuperación: aún no hay sesión. Llevan limitador de ritmo.
  '/auth/register',
  '/auth/check-invitation',
  '/auth/activate-member',
  '/auth/google',
  '/auth/login',
  '/auth/reset-password/request',
  '/auth/reset-password/confirm',
  // Validan el token de sesión dentro del handler (responden 401 sin él).
  '/auth/me',
  '/auth/switch-band',
  '/auth/logout',
  // Webhook de Replicate: se autentica por firma HMAC, no por sesión.
  '/webhooks/replicate-stems',
  '/api/webhooks/replicate-stems',
]);

const SOLO_LIDER = ['POST /users/associate', 'POST /users', 'DELETE /users/:id'];

function pilasPorRuta(router: unknown) {
  return capasConRuta(router).flatMap((c) => {
    const paths = Array.isArray(c.route.path) ? c.route.path : [c.route.path];
    const metodos = Object.keys(c.route.methods).filter((m) => c.route.methods[m]);
    return metodos.flatMap((m) => paths.map((p) => ({ clave: `${m.toUpperCase()} ${p}`, path: p, pila: c.route.stack })));
  });
}

const resFalso = () => {
  const r: { code?: number; body?: Record<string, unknown>; status: (c: number) => typeof r; json: (b: Record<string, unknown>) => typeof r; cookie: () => typeof r } = {
    status: (c) => ((r.code = c), r),
    json: (b) => ((r.body = b), r),
    cookie: () => r,
  };
  return r;
};

describe('superficie de users y ai_music', () => {
  it('users expone exactamente sus rutas, en el mismo orden y sin duplicadas', () => {
    expect(inventario(usersRouter)).toEqual(RUTAS_USERS);
    expect(new Set(RUTAS_USERS).size).toBe(RUTAS_USERS.length);
  });

  // En ai_music todas las rutas son literales distintos: el orden de montaje de sus sub-routers no
  // cambia qué handler atiende cada petición. En users se compara también el orden, y que ninguna
  // ruta esté declarada dos veces (Express atendería solo la primera y la otra sería código muerto).
  it('ai_music expone exactamente sus rutas', () => {
    expect([...inventario(aiMusicRouter)].sort()).toEqual([...RUTAS_AI_MUSIC].sort());
    expect(new Set(RUTAS_AI_MUSIC).size).toBe(RUTAS_AI_MUSIC.length);
  });

  it.each([
    ['users', usersRouter],
    ['ai_music', aiMusicRouter],
  ])('%s: toda ruta no pública exige sesión', (_n, router) => {
    const sinSesion = pilasPorRuta(router)
      .filter(({ path, pila }) => !PUBLICAS.has(path) && !pila.some((l) => l.handle === requireAuth))
      .map(({ clave }) => clave);
    expect(sinSesion).toEqual([]);
  });

  it('las rutas de gestión de miembros exigen ser líder de la banda', () => {
    const pilas = pilasPorRuta(usersRouter);
    for (const clave of SOLO_LIDER) {
      const ruta = pilas.find((p) => p.clave === clave);
      expect(ruta?.pila.some((l) => l.handle === requireLeader), clave).toBe(true);
    }
  });

  it('las rutas de IA de pago llevan limitador de ritmo', () => {
    const pilas = pilasPorRuta(aiMusicRouter);
    for (const clave of ['POST /generate', 'POST /ai-stem-separation', 'POST /ai-generate-instrument-track']) {
      const ruta = pilas.find((p) => p.clave === clave);
      expect(ruta?.pila.some((l) => l.name === 'rateLimiter'), clave).toBe(true);
    }
  });
});

describe('aislamiento entre bandas', () => {
  beforeEach(() => {
    getStemsJobStatus.mockClear();
    for (const k of Object.keys(ACTIVE_SESSIONS)) delete ACTIVE_SESSIONS[k];
    estado = {
      users: [{ id: 'u1', username: 'ana', email: 'ana@x.com', role: 'leader', band_id: 'band-a' }],
      userBands: [{ user_id: 'u1', band_id: 'band-a' }],
      registeredBands: [],
      sessions: {},
    };
  });

  it('cambiar de banda sin sesión responde 401', async () => {
    const res = resFalso();
    await manejador(usersRouter, '/auth/switch-band', 'post')({ headers: {}, body: { band_id: 'band-a' } }, res);
    expect(res.code).toBe(401);
  });

  it('cambiar a una banda de la que no eres miembro responde 404 y no da acceso', async () => {
    ACTIVE_SESSIONS['tok-ana'] = { userId: 'u1', createdAt: Date.now() };
    const res = resFalso();
    await manejador(usersRouter, '/auth/switch-band', 'post')({ headers: { authorization: 'Bearer tok-ana' }, body: { band_id: 'band-ajena' } }, res);
    expect(res.code).toBe(404);
    expect(res.body?.token).toBeUndefined();
  });

  it('subir el logo de una banda ajena responde 403', async () => {
    const res = resFalso();
    const req = {
      headers: { 'x-band-id': 'band-ajena' },
      query: {},
      body: { bandId: 'band-ajena', logoUrl: 'https://x.example/logo.png' },
      user: { id: 'u1', role: 'leader', band_id: 'band-a', allowedBandIds: ['band-a'] },
    };
    await manejador(usersRouter, '/users/upload-logo', 'post')(req, res);
    expect(res.code).toBe(403);
  });

  it('el estado de una separación de stems nunca lee la caché de otra banda', async () => {
    const res = resFalso();
    const req = {
      headers: { 'x-band-id': 'band-ajena' },
      query: { songHash: 'h1', engine: 'auto' },
      body: {},
      user: { id: 'u1', role: 'leader', band_id: 'band-a', allowedBandIds: ['band-a'] },
    };
    await manejador(aiMusicRouter, '/ai-stem-separation/status', 'get')(req, res);
    expect(getStemsJobStatus).toHaveBeenCalledWith('band-a', 'h1', 'auto');
  });
});
