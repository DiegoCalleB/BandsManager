import { describe, it, expect, vi, beforeEach } from 'vitest';

// Contrato (fase 2B): las giras viven solo en Supabase. Ninguna operación lee ni escribe
// state.tours, que contiene los datos de todas las bandas.
const estado: { tours: Array<{ id: string; band_id: string; nombre?: string }> } = { tours: [] };
const loadState = vi.fn(() => estado);
const saveState = vi.fn();
vi.mock('../../state.js', () => ({ loadState: () => loadState(), saveState: (...a: unknown[]) => saveState(...a) }));

const dbGetTours = vi.fn();
const dbUpsertTour = vi.fn();
const dbDeleteTour = vi.fn();
vi.mock('../../db.js', async () => {
  const real = await vi.importActual<typeof import('../../db/core.js')>('../../db/core.js');
  return {
    esSupabaseNoConfigurado: real.esSupabaseNoConfigurado,
    dbGetTours: (...a: unknown[]) => dbGetTours(...a),
    dbUpsertTour: (...a: unknown[]) => dbUpsertTour(...a),
    dbDeleteTour: (...a: unknown[]) => dbDeleteTour(...a),
  };
});

import { toursController } from '../tours.controller';

const respuesta = () => {
  const res: any = { statusCode: 200, body: undefined };
  res.status = (c: number) => { res.statusCode = c; return res; };
  res.json = (b: unknown) => { res.body = b; return res; };
  return res;
};
const peticion = (bandId: string, extra: Record<string, unknown> = {}) =>
  ({ user: { band_id: bandId }, params: {}, body: {}, ...extra }) as any;

beforeEach(() => {
  vi.clearAllMocks();
  estado.tours = [
    { id: 't-a', band_id: 'band-a', nombre: 'Gira A (semilla)' },
    { id: 't-b', band_id: 'band-b', nombre: 'Gira B (semilla)' },
  ];
});

describe('toursController: solo Supabase', () => {
  it('getTours devuelve lo de Supabase y no toca el estado en memoria', async () => {
    dbGetTours.mockResolvedValue([{ id: 't-a', band_id: 'band-a', nombre: 'Gira A' }]);
    const res = respuesta();
    await toursController.getTours(peticion('band-a'), res);
    expect(res.body).toEqual({ tours: [{ id: 't-a', band_id: 'band-a', nombre: 'Gira A' }] });
    expect(loadState).not.toHaveBeenCalled();
    expect(saveState).not.toHaveBeenCalled();
  });

  it('getTours con Supabase configurado que falla responde 500, no datos de semilla desactualizados', async () => {
    dbGetTours.mockRejectedValue(new Error('Supabase Error (tours): timeout'));
    const res = respuesta();
    await toursController.getTours(peticion('band-a'), res);
    expect(res.statusCode).toBe(500);
    expect(res.body).not.toHaveProperty('tours');
  });

  it('getTours sin Supabase (arranque local) cae a la semilla, solo de la banda activa', async () => {
    dbGetTours.mockRejectedValue(new Error('Supabase URL or Key is missing in environment variables.'));
    const res = respuesta();
    await toursController.getTours(peticion('band-a'), res);
    expect(res.body).toEqual({ tours: [{ id: 't-a', band_id: 'band-a', nombre: 'Gira A (semilla)' }] });
  });

  it('createTour guarda en Supabase con la banda de la sesión y no toca el estado', async () => {
    dbUpsertTour.mockResolvedValue({ id: 'nueva', band_id: 'band-a' });
    const res = respuesta();
    await toursController.createTour(peticion('band-a', { body: { nombre: 'X', band_id: 'band-b' } }), res);
    expect(dbUpsertTour).toHaveBeenCalledWith(expect.anything(), 'band-a');
    expect(res.body).toEqual({ id: 'nueva', band_id: 'band-a' });
    expect(saveState).not.toHaveBeenCalled();
    expect(estado.tours.map((t) => t.id)).toEqual(['t-a', 't-b']);
  });

  it('updateTour con el id de una gira de otra banda no altera la de la otra banda en memoria', async () => {
    dbUpsertTour.mockResolvedValue({ id: 'tour-nuevo', band_id: 'band-a', nombre: 'Intruso' });
    await toursController.updateTour(peticion('band-a', { params: { id: 't-b' }, body: { nombre: 'Intruso' } }), respuesta());
    expect(estado.tours.find((t) => t.id === 't-b')?.nombre).toBe('Gira B (semilla)');
    expect(saveState).not.toHaveBeenCalled();
  });

  it('deleteTour borra en Supabase (acotado a la banda) y no toca el estado', async () => {
    dbDeleteTour.mockResolvedValue(undefined);
    const res = respuesta();
    await toursController.deleteTour(peticion('band-a', { params: { id: 't-b' } }), res);
    expect(dbDeleteTour).toHaveBeenCalledWith('t-b', 'band-a');
    expect(estado.tours.map((t) => t.id)).toEqual(['t-a', 't-b']);
    expect(saveState).not.toHaveBeenCalled();
  });

  it('deleteTour devuelve error si Supabase falla', async () => {
    dbDeleteTour.mockRejectedValue(new Error('Supabase Error (delete tour): x'));
    const res = respuesta();
    await toursController.deleteTour(peticion('band-a', { params: { id: 't-a' } }), res);
    expect(res.statusCode).toBeGreaterThanOrEqual(500);
  });
});
