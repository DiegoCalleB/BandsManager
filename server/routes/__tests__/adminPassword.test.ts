/**
 * La contraseña del admin sale de ADMIN_PASSWORD y ya no se reimpone en cada arranque.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../state.js', async (orig) => ({ ...(await orig<any>()), saveState: () => {} }));
vi.mock('../../db/users.js', async (orig) => ({ ...(await orig<any>()), dbUpsertUser: async () => ({}) }));
vi.mock('../../db/core.js', async (orig) => ({
  ...(await orig<any>()),
  getSupabase: () => ({ from: () => ({ select: () => ({ or: () => ({ maybeSingle: async () => ({ data: null }) }) }) }) }),
}));

import { ensureAdminUserExists } from '../users';
import { hashPassword, verifyPassword } from '../../auth';

const CLAVE = 'una-clave-larga-segura-1';
const estadoSinAdmin = () => ({ users: [{ id: 'u1', username: 'ana', email: 'ana@x.com' }] });

afterEach(() => {
  delete process.env.ADMIN_PASSWORD;
});

describe('ensureAdminUserExists', () => {
  it('sin ADMIN_PASSWORD no crea ningún admin', async () => {
    const estado: any = estadoSinAdmin();
    const r = await ensureAdminUserExists(estado);
    expect(r).toBeNull();
    expect(estado.users).toHaveLength(1);
  });

  it('con ADMIN_PASSWORD crea el admin con esa contraseña', async () => {
    process.env.ADMIN_PASSWORD = CLAVE;
    const estado: any = estadoSinAdmin();
    const admin = await ensureAdminUserExists(estado);
    expect(admin.role).toBe('admin');
    expect(verifyPassword(CLAVE, admin.passwordHash, admin.salt)).toBe(true);
  });

  it('sin ADMIN_PASSWORD no pisa la contraseña de un admin existente', async () => {
    const { hash, salt } = hashPassword('la-que-puso-diego-123');
    const estado: any = { users: [{ id: 'a', username: 'Admin', email: 'admin@bandmanager.ai', role: 'admin', passwordHash: hash, salt }] };
    await ensureAdminUserExists(estado);
    expect(verifyPassword('la-que-puso-diego-123', estado.users[0].passwordHash, estado.users[0].salt)).toBe(true);
  });

  it('cambiar ADMIN_PASSWORD rota la contraseña; repetir el arranque no la reescribe', async () => {
    const { hash, salt } = hashPassword('antigua-clave-publica');
    const estado: any = { users: [{ id: 'a', username: 'Admin', email: 'admin@bandmanager.ai', role: 'admin', passwordHash: hash, salt }] };
    process.env.ADMIN_PASSWORD = CLAVE;
    await ensureAdminUserExists(estado);
    expect(verifyPassword(CLAVE, estado.users[0].passwordHash, estado.users[0].salt)).toBe(true);
    expect(verifyPassword('antigua-clave-publica', estado.users[0].passwordHash, estado.users[0].salt)).toBe(false);
    const hashAntes = estado.users[0].passwordHash;
    await ensureAdminUserExists(estado);
    expect(estado.users[0].passwordHash).toBe(hashAntes); // sin cambios: no se vuelve a hashear
  });

  it('una ADMIN_PASSWORD demasiado corta se ignora', async () => {
    process.env.ADMIN_PASSWORD = 'corta';
    const estado: any = estadoSinAdmin();
    expect(await ensureAdminUserExists(estado)).toBeNull();
  });
});
