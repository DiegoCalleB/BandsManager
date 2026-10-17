import { describe, it, expect, vi, beforeEach } from 'vitest';

const estado: { tours: Array<{ id: string; band_id: string; nombre?: string }> } = { tours: [] };

vi.mock('../../state.js', () => ({
  loadState: () => estado,
  saveState: vi.fn(),
}));

const dbGetTours = vi.fn();
const dbUpsertTour = vi.fn();
const dbDeleteTour = vi.fn();
vi.mock('../../db.js', () => ({
  dbGetTours: (...a: unknown[]) => dbGetTours(...a),
  dbUpsertTour: (...a: unknown[]) => dbUpsertTour(...a),
  dbDeleteTour: (...a: unknown[]) => dbDeleteTour(...a),
}));

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
    { id: 't-a', band_id: 'band-a', nombre: 'Gira A' },
    { id: 't-b', band_id: 'band-b', nombre: 'Gira B' },
  ];
});

describe('toursController: el estado en memoria es de todas las bandas', () => {
  it('getTours de A no borra las giras de B', async () => {
    dbGetTours.mockResolvedValue([{ id: 't-a', band_id: 'band-a', nombre: 'Gira A' }]);
    await toursController.getTours(peticion('band-a'), respuesta());
    expect(estado.tours.map((t) => t.id).sort()).toEqual(['t-a', 't-b']);
  });

  it('deleteTour de A con el id de una gira de B no la quita de memoria', async () => {
    dbDeleteTour.mockResolvedValue(undefined);
    await toursController.deleteTour(peticion('band-a', { params: { id: 't-b' } }), respuesta());
    expect(estado.tours.map((t) => t.id)).toContain('t-b');
  });

  it('updateTour de A con el id de una gira de B no la sustituye en memoria', async () => {
    dbUpsertTour.mockResolvedValue({ id: 'tour-nuevo', band_id: 'band-a', nombre: 'Intruso' });
    await toursController.updateTour(peticion('band-a', { params: { id: 't-b' }, body: { nombre: 'Intruso' } }), respuesta());
    const b = estado.tours.find((t) => t.id === 't-b');
    expect(b?.nombre).toBe('Gira B');
  });

  it('deleteTour de la propia banda sí la quita', async () => {
    dbDeleteTour.mockResolvedValue(undefined);
    await toursController.deleteTour(peticion('band-a', { params: { id: 't-a' } }), respuesta());
    expect(estado.tours.map((t) => t.id)).toEqual(['t-b']);
  });
});
