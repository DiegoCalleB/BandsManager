/**
 * Fase 2B: los pagos (finanzas de la banda) viven solo en Supabase. Ninguna ruta lee ni escribe
 * state.payments (datos de todas las bandas); la semilla solo se sirve en el arranque local sin Supabase.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const estado: any = { payments: [] };
const loadState = vi.fn(() => estado);
const saveState = vi.fn();
const dbGetPayments = vi.fn();
const dbUpsertPayment = vi.fn();

vi.mock('../../state.js', async (orig) => ({
  ...(await orig<any>()),
  loadState: () => loadState(),
  saveState: (...a: any[]) => saveState(...a),
  requireAuth: (_q: any, _s: any, n: any) => n(),
  requireLeader: (_q: any, _s: any, n: any) => n(),
}));
vi.mock('../../db.js', async (orig) => ({
  ...(await orig<any>()),
  dbGetPayments: (...a: any[]) => dbGetPayments(...a),
  dbUpsertPayment: (...a: any[]) => dbUpsertPayment(...a),
}));

import concertsRouter from '../concerts.js';
import { manejador } from './helpers/rutas.js';

const resFalso = () => {
  const r: any = {};
  r.status = (c: number) => ((r.code = c), r);
  r.json = (b: any) => ((r.body = b), r);
  return r;
};
const usuario = { id: 'u1', role: 'leader', band_id: 'band-a', allowedBandIds: ['band-a'] };
const llamar = async (ruta: string, metodo: any, req: any = {}) => {
  const res = resFalso();
  await manejador(concertsRouter, ruta, metodo)({ headers: {}, query: {}, body: {}, params: {}, user: usuario, ...req }, res);
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
  estado.payments = [
    { id: 'pay-a', band_id: 'band-a', concepto: 'Local A (semilla)', importe: 10 },
    { id: 'pay-b', band_id: 'band-b', concepto: 'Local B (semilla)', importe: 20 },
  ];
});

describe('rutas de pagos: solo Supabase', () => {
  it('GET /payments devuelve lo de Supabase y no toca el estado', async () => {
    dbGetPayments.mockResolvedValue([{ id: 'pay-a', band_id: 'band-a', importe: 99 }]);
    const r = await llamar('/payments', 'get');
    expect(r.body).toEqual([{ id: 'pay-a', band_id: 'band-a', importe: 99 }]);
    expect(dbGetPayments).toHaveBeenCalledWith('band-a');
    expect(loadState).not.toHaveBeenCalled();
  });

  it('GET /payments con Supabase configurado que falla responde 500, no cifras de semilla', async () => {
    dbGetPayments.mockRejectedValue(new Error('Supabase Error (payments): timeout'));
    const r = await llamar('/payments', 'get');
    expect(r.code).toBe(500);
  });

  it('GET /payments sin Supabase (arranque local) cae a la semilla, solo de la banda activa', async () => {
    dbGetPayments.mockRejectedValue(new Error('Supabase URL or Key is missing in environment variables.'));
    const r = await llamar('/payments', 'get');
    expect(r.body).toEqual([{ id: 'pay-a', band_id: 'band-a', concepto: 'Local A (semilla)', importe: 10 }]);
  });

  it('POST /payments guarda en Supabase con la banda de la sesión y no toca el estado', async () => {
    dbUpsertPayment.mockResolvedValue({ id: 'nuevo', band_id: 'band-a', importe: 5 });
    const r = await llamar('/payments', 'post', { body: { concepto: 'x', importe: 5, band_id: 'band-b' } });
    expect(dbUpsertPayment).toHaveBeenCalledWith(expect.anything(), 'band-a');
    expect(r.body).toEqual({ success: true, payment: { id: 'nuevo', band_id: 'band-a', importe: 5 } });
    expect(saveState).not.toHaveBeenCalled();
    expect(estado.payments.map((p: any) => p.id)).toEqual(['pay-a', 'pay-b']);
  });

  it('POST /payments con Supabase caído responde error en vez de dejar la petición colgada', async () => {
    dbUpsertPayment.mockRejectedValue(new Error('Supabase Error (upsert payment): x'));
    const r = await llamar('/payments', 'post', { body: { concepto: 'x' } });
    expect(r.code).toBeGreaterThanOrEqual(500);
  });

  it('PUT /payments/:id con el id de un pago de otra banda no sustituye el de la otra banda en memoria', async () => {
    dbUpsertPayment.mockResolvedValue({ id: 'pay-nuevo', band_id: 'band-a', concepto: 'Intruso', importe: 1 });
    await llamar('/payments/:id', 'put', { params: { id: 'pay-b' }, body: { concepto: 'Intruso' } });
    expect(estado.payments.find((p: any) => p.id === 'pay-b')?.concepto).toBe('Local B (semilla)');
    expect(saveState).not.toHaveBeenCalled();
  });

  it('PUT /payments/:id guarda con el id de la URL y la banda de la sesión', async () => {
    dbUpsertPayment.mockImplementation(async (p: any) => p);
    const r = await llamar('/payments/:id', 'put', { params: { id: 'pay-a' }, body: { estado: 'pagado', id: 'otro' } });
    expect(dbUpsertPayment).toHaveBeenCalledWith(expect.objectContaining({ id: 'pay-a', estado: 'pagado' }), 'band-a');
    expect(r.body.success).toBe(true);
  });

  it('PUT /payments/:id con Supabase caído responde error', async () => {
    dbUpsertPayment.mockRejectedValue(new Error('Supabase Error (upsert payment): x'));
    const r = await llamar('/payments/:id', 'put', { params: { id: 'pay-a' }, body: { estado: 'pagado' } });
    expect(r.code).toBeGreaterThanOrEqual(500);
  });

  it('POST /payments/sync devuelve los pagos de Supabase sin tocar el estado (Finanzas lo usa)', async () => {
    dbGetPayments.mockResolvedValue([{ id: 'pay-a', band_id: 'band-a' }]);
    const r = await llamar('/payments/sync', 'post');
    expect(r.body.success).toBe(true);
    expect(r.body.payments).toEqual([{ id: 'pay-a', band_id: 'band-a' }]);
    expect(saveState).not.toHaveBeenCalled();
    expect(estado.payments.map((p: any) => p.id)).toEqual(['pay-a', 'pay-b']);
  });
});
