/**
 * POST /ui-preferences: valida la forma del panel de widgets y dice la verdad sobre si llegó a la
 * base de datos (`persistido`). Antes aceptaba cualquier JSON y respondía «guardado» aunque
 * Supabase hubiera fallado.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const estado = vi.hoisted(() => ({ users: [{ id: 'u1', email: 'a@x.com', ui_preferences: {} }] as any[] }));
const dbUpsertUser = vi.hoisted(() => vi.fn());
vi.mock('../../state.js', () => ({
  loadState: () => estado,
  saveState: () => {},
  requireAuth: (_req: any, _res: any, next: any) => next(),
}));
vi.mock('../../db.js', () => ({ dbUpsertUser, normalizePlan: (p: any) => p }));

import router from '../users/rutasPreferencias';

const ok = { id: 'w1', type: 'calendar', wSpan: 12, hSpan: 'normal', visible: true, order: 0 };

async function guardar(body: unknown) {
  const capa = (router as any).stack.find((l: any) => l.route?.path?.includes?.('/ui-preferences') && l.route.methods.post);
  const pila = capa.route.stack;
  const res: any = {};
  res.status = (c: number) => ((res.code = c), res);
  res.json = (b: any) => ((res.body = b), res);
  await pila[pila.length - 1].handle({ user: { id: 'u1' }, body }, res);
  return res;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  estado.users[0].ui_preferences = {};
  dbUpsertUser.mockResolvedValue(undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('POST /ui-preferences', () => {
  it('guarda un panel válido y lo confirma como persistido', async () => {
    const r = await guardar({ dashboard_widgets: [ok] });
    expect(r.code).toBeUndefined();
    expect(r.body.persistido).toBe(true);
    expect(estado.users[0].ui_preferences.dashboard_widgets).toEqual([ok]);
  });

  it('rechaza un panel mal formado sin tocar nada', async () => {
    const r = await guardar({ dashboard_widgets: [{ ...ok, wSpan: 5 }] });
    expect(r.code).toBe(400);
    expect(estado.users[0].ui_preferences.dashboard_widgets).toBeUndefined();
    expect(dbUpsertUser).not.toHaveBeenCalled();
  });

  it('si Supabase falla y está configurado, dice persistido:false', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co');
    dbUpsertUser.mockRejectedValue(new Error('caído'));
    const r = await guardar({ dashboard_widgets: [ok] });
    expect(r.body.success).toBe(true);
    expect(r.body.persistido).toBe(false);
  });

  it('sin Supabase configurado (desarrollo) no es un fallo', async () => {
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_URL', '');
    dbUpsertUser.mockRejectedValue(new Error('sin BD'));
    expect((await guardar({ dashboard_widgets: [ok] })).body.persistido).toBe(true);
  });
});
