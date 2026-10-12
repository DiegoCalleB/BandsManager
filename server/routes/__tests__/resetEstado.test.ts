/**
 * POST /reset (restaurar datos de ejemplo): solo el administrador global, sin borrar usuarios ni
 * bandas y sin devolver el estado (llevaba hashes de contraseña).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

let estado: Record<string, unknown>;
const saveState = vi.fn();
vi.mock('../../state.js', async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  loadState: () => estado,
  saveState: (s: unknown) => saveState(s),
}));

import agentRouter from '../agent.js';
import { manejador } from './helpers/rutas.js';

const resFalso = () => {
  const r: { code?: number; body?: Record<string, unknown>; status: (c: number) => typeof r; json: (b: Record<string, unknown>) => typeof r } = {
    status: (c) => ((r.code = c), r),
    json: (b) => ((r.body = b), r),
  };
  return r;
};

beforeEach(() => {
  saveState.mockClear();
  estado = { users: [{ id: 'u1', passwordHash: 'h', salt: 's' }], registeredBands: [{ band_id: 'band-a' }], leads: [{ id: 'l-real' }] };
});

describe('POST /reset', () => {
  it('un líder de banda no puede restaurar el estado de todas las bandas', async () => {
    const res = resFalso();
    await manejador(agentRouter, '/reset', 'post')({ user: { id: 'u1', role: 'leader', band_id: 'band-a' }, body: { confirmReset: true } }, res);
    expect(res.code).toBe(403);
    expect(saveState).not.toHaveBeenCalled();
  });

  it('el admin restaura los ejemplos sin borrar usuarios ni bandas y sin devolver el estado', async () => {
    const res = resFalso();
    await manejador(agentRouter, '/reset', 'post')({ user: { id: 'u0', role: 'admin' }, body: { confirmReset: true } }, res);
    expect(res.body).toEqual({ success: true });
    const guardado = saveState.mock.calls[0][0] as Record<string, unknown>;
    expect(guardado.users).toEqual(estado.users);
    expect(guardado.registeredBands).toEqual(estado.registeredBands);
    expect(guardado.leads).not.toEqual([{ id: 'l-real' }]);
  });
});
