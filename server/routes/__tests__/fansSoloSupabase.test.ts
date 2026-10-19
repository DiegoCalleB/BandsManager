/**
 * Fase 2B: los fans viven solo en Supabase. Ninguna ruta autenticada lee ni escribe state.fans
 * (datos de todas las bandas) y un fan de otra banda nunca se ve ni se modifica.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const estado: any = { fans: [{ id: 'f-b', band_id: 'band-b', nombre: 'Fan de B (semilla)' }] };
const loadState = vi.fn(() => estado);
const saveState = vi.fn();
const dbGetFans = vi.fn();
const dbUpsertFan = vi.fn();
const dbDeleteFan = vi.fn();

vi.mock('../../state.js', async (orig) => ({
  ...(await orig<any>()),
  loadState: () => loadState(),
  saveState: (...a: any[]) => saveState(...a),
  requireAuth: (_q: any, _s: any, n: any) => n(),
}));
vi.mock('../../db.js', async (orig) => ({
  ...(await orig<any>()),
  dbGetFans: (...a: any[]) => dbGetFans(...a),
  dbUpsertFan: (...a: any[]) => dbUpsertFan(...a),
  dbDeleteFan: (...a: any[]) => dbDeleteFan(...a),
}));

import epkFansRouter from '../epk_fans.js';
import { manejador } from './helpers/rutas.js';

const resFalso = () => {
  const r: any = {};
  r.status = (c: number) => ((r.code = c), r);
  r.json = (b: any) => ((r.body = b), r);
  return r;
};
const usuario = { id: 'u1', role: 'leader', band_id: 'band-a', plan: 'cabeza_de_cartel', allowedBandIds: ['band-a'] };
const llamar = async (ruta: string, metodo: any, req: any = {}) => {
  const res = resFalso();
  await manejador(epkFansRouter, ruta, metodo)({ headers: {}, query: {}, body: {}, params: {}, user: usuario, ...req }, res);
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
  estado.fans = [{ id: 'f-b', band_id: 'band-b', nombre: 'Fan de B (semilla)' }];
});

describe('rutas de fans: solo Supabase', () => {
  it('GET /fans devuelve los fans de Supabase y no toca el estado', async () => {
    dbGetFans.mockResolvedValue([{ id: 'f-a', band_id: 'band-a', nombre: 'Ana' }]);
    const r = await llamar('/fans', 'get');
    expect(r.body).toEqual([{ id: 'f-a', band_id: 'band-a', nombre: 'Ana' }]);
    expect(dbGetFans).toHaveBeenCalledWith('band-a');
    expect(loadState).not.toHaveBeenCalled();
    expect(saveState).not.toHaveBeenCalled();
  });

  it('GET /fans con Supabase caído responde 500, no una lista desactualizada', async () => {
    dbGetFans.mockRejectedValue(new Error('Supabase Error (fans): timeout'));
    const r = await llamar('/fans', 'get');
    expect(r.code).toBe(500);
  });

  it('POST /fans guarda en Supabase con la banda de la sesión y no toca el estado', async () => {
    dbGetFans.mockResolvedValue([]);
    dbUpsertFan.mockResolvedValue({ id: 'nuevo', band_id: 'band-a', nombre: 'Luis' });
    const r = await llamar('/fans', 'post', { body: { nombre: 'Luis', email: 'l@x.com', band_id: 'band-b' } });
    expect(dbUpsertFan).toHaveBeenCalledWith(expect.anything(), 'band-a');
    expect(r.body).toEqual({ success: true, fan: { id: 'nuevo', band_id: 'band-a', nombre: 'Luis' } });
    expect(saveState).not.toHaveBeenCalled();
    expect(estado.fans.map((f: any) => f.id)).toEqual(['f-b']);
  });

  it('PATCH /fans/:id modifica un fan de la propia banda aunque la caché esté fría', async () => {
    dbGetFans.mockResolvedValue([{ id: 'f-a', band_id: 'band-a', nombre: 'Ana', email: 'a@x.com' }]);
    dbUpsertFan.mockImplementation(async (f: any) => f);
    const r = await llamar('/fans/:id', 'patch', { params: { id: 'f-a' }, body: { nombre: 'Ana María', id: 'otro-id' } });
    expect(r.body.success).toBe(true);
    // El id de la URL manda: el cuerpo no puede reescribir el id de otro fan de la banda.
    expect(dbUpsertFan).toHaveBeenCalledWith(expect.objectContaining({ id: 'f-a', nombre: 'Ana María', email: 'a@x.com' }), 'band-a');
    expect(saveState).not.toHaveBeenCalled();
  });

  it('PATCH /fans/:id de un fan de otra banda no se guarda ni se revela', async () => {
    dbGetFans.mockResolvedValue([]); // el fan f-b no está entre los de band-a
    const r = await llamar('/fans/:id', 'patch', { params: { id: 'f-b' }, body: { nombre: 'Intruso' } });
    expect(r.code).toBe(404);
    expect(dbUpsertFan).not.toHaveBeenCalled();
    expect(estado.fans[0].nombre).toBe('Fan de B (semilla)');
  });

  it('DELETE /fans/:id borra en Supabase acotado a la banda y no toca el estado', async () => {
    dbDeleteFan.mockResolvedValue(true);
    const r = await llamar('/fans/:id', 'delete', { params: { id: 'f-b' } });
    expect(dbDeleteFan).toHaveBeenCalledWith('f-b', 'band-a');
    expect(r.body).toEqual({ success: true });
    expect(estado.fans.map((f: any) => f.id)).toEqual(['f-b']);
    expect(saveState).not.toHaveBeenCalled();
  });

  it('DELETE /fans/:id con Supabase caído responde error en vez de dejar la petición colgada', async () => {
    dbDeleteFan.mockRejectedValue(new Error('Supabase Error (delete fan): x'));
    const r = await llamar('/fans/:id', 'delete', { params: { id: 'f-a' } });
    expect(r.code).toBeGreaterThanOrEqual(500);
  });
});
