import { describe, it, expect, vi, beforeEach } from 'vitest';

const reservar = vi.hoisted(() => vi.fn());
vi.mock('../../db/emailsCicloVida.js', () => ({ dbReservarEmail: reservar }));
vi.mock('../../utils/errorTracking.js', () => ({ captureError: vi.fn() }));

import router from '../emailsCicloVida.js';
import { urlBaja } from '../../utils/emailsCicloVida.js';

function pedir(query: Record<string, string>) {
  const capa = (router as any).stack.find((l: any) => l.route?.path === '/api/emails/baja');
  const pila = capa.route.stack;
  const res: any = {};
  res.status = (c: number) => ((res.code = c), res);
  res.type = () => res;
  res.send = (b: string) => ((res.body = b), res);
  return Promise.resolve(pila[pila.length - 1].handle({ query }, res)).then(() => res);
}
const firmada = (id: string) => {
  const u = new URL(urlBaja('http://x', id));
  return { u: u.searchParams.get('u')!, f: u.searchParams.get('f')! };
};

beforeEach(() => {
  vi.clearAllMocks();
  reservar.mockResolvedValue(true);
});

describe('GET /api/emails/baja', () => {
  it('con firma válida registra la baja', async () => {
    const r = await pedir(firmada('user-1'));
    expect(r.code ?? 200).toBe(200);
    expect(reservar).toHaveBeenCalledWith('user-1', 'baja');
  });
  it('con firma falsa o sin ella no toca la BD', async () => {
    expect((await pedir({ u: 'user-1', f: 'a'.repeat(32) })).code).toBe(400);
    expect((await pedir({ u: 'user-1' })).code).toBe(400);
    expect(reservar).not.toHaveBeenCalled();
  });
  it('si falla la BD responde 500 sin filtrar el motivo', async () => {
    reservar.mockRejectedValue(new Error('conexión a db.interno:5432 rechazada'));
    const r = await pedir(firmada('user-1'));
    expect(r.code).toBe(500);
    expect(r.body).not.toContain('5432');
  });
});
