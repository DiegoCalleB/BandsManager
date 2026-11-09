import { describe, it, expect, vi, beforeEach } from 'vitest';

const fromMock = vi.fn();
vi.mock('../core.js', () => ({
  getSupabase: () => ({ from: fromMock }),
  cleanBandId: (bandId?: string) => (bandId || '').replace(/^(band|reg)-/, ''),
}));
vi.mock('../bands.js', () => ({ ensureRegisteredBandExists: vi.fn().mockResolvedValue(undefined) }));

import { dbGetLeads } from '../leads';

/** Supabase devuelve como mucho 1000 filas por petición: sin `.range` una banda grande se corta en silencio. */
function bandaConLeads(total: number) {
  const filas = Array.from({ length: total }, (_, i) => ({ id: `l${i}`, band_id: 'x', nombre_sala: `Sala ${i}` }));
  let desde = 0;
  let hasta = 999;
  const qb: Record<string, unknown> = {};
  qb.select = () => qb;
  qb.eq = () => qb;
  qb.order = () => qb;
  qb.range = (a: number, b: number) => { desde = a; hasta = b; return qb; };
  qb.then = (ok: (r: unknown) => unknown) => ok({ data: filas.slice(desde, Math.min(hasta, desde + 999) + 1), error: null });
  return qb;
}

describe('dbGetLeads con muchas filas', () => {
  beforeEach(() => vi.clearAllMocks());
  it('devuelve todos los leads aunque superen las 1000 filas de una petición', async () => {
    fromMock.mockImplementation(() => bandaConLeads(2500));
    const leads = await dbGetLeads('band-x');
    expect(leads).toHaveLength(2500);
  });
});
