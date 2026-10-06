/**
 * Regresiones de la auditoría B (seguridad restante): IDOR del horario y del buzón de otra banda,
 * lista de espera de músicos, relé de test-email, caché de enriquecimiento y reseteo de contraseña.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

let estado: any;
const dbGetBandSchedule = vi.fn(async () => ({ horas_lector: [9] }));
const dbUpsertBandSchedule = vi.fn(async (x: any) => x);
const dbGetBandEmailAccount = vi.fn(async () => ({ email: 'a@x.com', smtp_host: 'smtp.x.com' }));
const dbGetLeadById = vi.fn(async () => null);
const autoEnrichLead = vi.fn(async (l: any) => l);

vi.mock('../../state.js', async (orig) => ({
  ...(await orig<any>()),
  loadState: () => estado,
  saveState: () => {},
  requireAuth: (_q: any, _s: any, n: any) => n(),
}));
vi.mock('../../db.js', async (orig) => ({
  ...(await orig<any>()),
  dbGetBandSchedule: (...a: any[]) => (dbGetBandSchedule as any)(...a),
  dbUpsertBandSchedule: (...a: any[]) => (dbUpsertBandSchedule as any)(...a),
  dbGetBandEmailAccount: (...a: any[]) => (dbGetBandEmailAccount as any)(...a),
  dbGetLeadById: (...a: any[]) => (dbGetLeadById as any)(...a),
  dbGetUsers: async () => [],
  dbUpsertUser: async () => ({}),
}));
vi.mock('../../db/users.js', async (orig) => ({ ...(await orig<any>()), dbGetUsers: async () => [], dbUpsertUser: async () => ({}) }));
vi.mock('../../auto_enrichment.js', async (orig) => ({ ...(await orig<any>()), autoEnrichLead: (...a: any[]) => (autoEnrichLead as any)(...a) }));
const sendTransactionalEmail = vi.fn(async () => ({ success: true, id: 'x' }));
vi.mock('../../services/transactionalEmail.js', async (orig) => ({
  ...(await orig<any>()),
  sendTransactionalEmail: (...a: any[]) => (sendTransactionalEmail as any)(...a),
}));

import bandsRouter from '../bands.js';
import usersRouter from '../users.js';
import epkFansRouter from '../epk_fans.js';
import leadsEnrichmentRouter from '../leads/enrichment.js';
import { hashPassword } from '../../auth';

function manejador(router: any, ruta: string, metodo: 'get' | 'post' | 'put') {
  const capa: any = router.stack.find((s: any) => s.route && s.route.path === ruta && s.route.methods[metodo]);
  expect(capa, `${metodo} ${ruta}`).toBeDefined();
  const pila = capa.route.stack;
  return pila[pila.length - 1].handle;
}
const resFalso = () => {
  const r: any = {};
  r.status = (c: number) => ((r.code = c), r);
  r.json = (b: any) => ((r.body = b), r);
  return r;
};
const usuario = { id: 'u1', role: 'leader', band_id: 'band-a', email: 'a@x.com', allowedBandIds: ['band-a'] };
const admin = { id: 'u0', role: 'admin', band_id: 'band-x', email: 'admin@x.com', allowedBandIds: [] };
const llamar = async (router: any, ruta: string, metodo: any, req: any) => {
  const res = resFalso();
  await manejador(router, ruta, metodo)({ headers: {}, query: {}, body: {}, params: {}, ...req }, res);
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
  estado = { users: [], leads: [], registeredBands: [] };
});

describe('IDOR del horario y del buzón de otra banda', () => {
  it('no se lee ni se cambia el horario de otra banda', async () => {
    const r1 = await llamar(bandsRouter, '/bands/schedules/:bandId', 'get', { user: usuario, params: { bandId: 'band-b' } });
    expect(r1.code).toBe(403);
    const r2 = await llamar(bandsRouter, '/bands/schedules', 'post', { user: usuario, body: { band_id: 'band-b', horas_lector: [3] } });
    expect(r2.code).toBe(403);
    expect(dbUpsertBandSchedule).not.toHaveBeenCalled();
  });

  it('el horario de la propia banda sigue funcionando', async () => {
    const r1 = await llamar(bandsRouter, '/bands/schedules/:bandId', 'get', { user: usuario, params: { bandId: 'band-a' } });
    expect(r1.code).toBeUndefined();
    const r2 = await llamar(bandsRouter, '/bands/schedules', 'post', { user: usuario, body: { band_id: 'band-a', horas_lector: [3] } });
    expect(r2.body.success).toBe(true);
  });

  it('no se lee la cuenta de email de otra banda', async () => {
    const r = await llamar(bandsRouter, '/bands/email-account/:bandId', 'get', { user: usuario, params: { bandId: 'band-b' } });
    expect(r.code).toBe(403);
    expect(dbGetBandEmailAccount).not.toHaveBeenCalled();
  });
});

describe('lista de espera de músicos', () => {
  it('un usuario normal no la ve; el admin sí', async () => {
    const r1 = await llamar(epkFansRouter, '/musicians-waitlist', 'get', { user: usuario });
    expect(r1.code).toBe(403);
    const r2 = await llamar(epkFansRouter, '/musicians-waitlist', 'get', { user: admin });
    expect(r2.code).not.toBe(403);
  });
});

describe('test-email', () => {
  it('no sirve de relé: solo al propio correo (el admin, a cualquiera)', async () => {
    const r1 = await llamar(usersRouter, '/auth/test-email', 'post', { user: usuario, body: { to: 'victima@x.com' } });
    expect(r1.code).toBe(403);
    expect(sendTransactionalEmail).not.toHaveBeenCalled();
    await llamar(usersRouter, '/auth/test-email', 'post', { user: usuario, body: { to: 'A@x.com' } });
    expect(sendTransactionalEmail).toHaveBeenCalledTimes(1);
    await llamar(usersRouter, '/auth/test-email', 'post', { user: admin, body: { to: 'otro@x.com' } });
    expect(sendTransactionalEmail).toHaveBeenCalledTimes(2);
  });
});

describe('enriquecer lead', () => {
  it('no enriquece ni devuelve un lead de otra banda que esté en la caché global', async () => {
    estado.leads = [{ id: 'lead-ajeno', band_id: 'band-b', nombre_sala: 'Sala Ajena', email_contacto: 'secreto@x.com' }];
    const r = await llamar(leadsEnrichmentRouter, '/leads/enrich-lead', 'post', { user: usuario, body: { leadId: 'lead-ajeno' } });
    expect(r.code).toBe(404);
    expect(autoEnrichLead).not.toHaveBeenCalled();
    const r2 = await llamar(leadsEnrichmentRouter, '/leads/enrich-lead', 'post', { user: usuario, body: { name: 'Sala Ajena' } });
    expect(r2.code).toBe(404);
  });
});

describe('reseteo de contraseña', () => {
  const confirmar = async (body: any) => {
    const r = resFalso();
    await manejador(usersRouter, '/auth/reset-password/confirm', 'post')({ body, headers: {}, query: {}, ip: '1.1.1.1' }, r);
    return r;
  };
  beforeEach(() => {
    const { hash, salt } = hashPassword('clave-vieja-1');
    estado = {
      users: [{ id: 'u1', username: 'ana', email: 'ana@x.com', passwordHash: hash, salt, resetCode: '123456', resetCodeExpires: Date.now() + 60_000 }],
      registeredBands: [],
    };
  });

  it('ya no vale adivinar solo el código: hay que dar la cuenta', async () => {
    const r = await confirmar({ emailOrUsername: 'otra-persona', code: '123456', newPassword: 'nueva-clave-1' });
    expect(r.code).toBe(400);
    expect(estado.users[0].resetCode).toBe('123456'); // sin tocar
  });

  it('tras 5 códigos incorrectos el código se invalida, aunque luego se acierte', async () => {
    let ultimo: any;
    for (let i = 0; i < 5; i++) ultimo = await confirmar({ emailOrUsername: 'ana', code: String(100000 + i), newPassword: 'nueva-clave-1' });
    expect(ultimo.code).toBe(429);
    expect(estado.users[0].resetCode).toBeUndefined();
    const acierto = await confirmar({ emailOrUsername: 'ana', code: '123456', newPassword: 'nueva-clave-1' });
    expect(acierto.code).toBe(400);
  });

  it('con el código correcto cambia la contraseña y consume el código', async () => {
    const r = await confirmar({ emailOrUsername: 'ana', code: '123456', newPassword: 'nueva-clave-1' });
    expect(r.code).toBeUndefined();
    expect(estado.users[0].resetCode).toBeUndefined();
  });
});
