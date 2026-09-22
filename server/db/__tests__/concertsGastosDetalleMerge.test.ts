import { describe, it, expect, vi, beforeEach } from 'vitest';

function crearQueryBuilderMock(resultadoTerminal: any = { data: null, error: null }) {
  const builder: any = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => resultadoTerminal),
    single: vi.fn(async () => resultadoTerminal)
  };
  return builder;
}

const upsertMock = vi.fn();
const fromMock = vi.fn();
let selectResult: any = { data: null, error: null };

vi.mock('../core.js', () => ({
  getSupabase: () => ({ from: fromMock }),
  cleanBandId: (bandId?: string) => (bandId || '').replace(/^(band|reg)-/, '')
}));

vi.mock('../bands.js', () => ({
  ensureRegisteredBandExists: vi.fn().mockResolvedValue(undefined)
}));

import { dbUpsertConcert } from '../concerts';

describe('dbUpsertConcert: gastos_detalle no se resetea en un guardado parcial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockImplementation(() => {
      const qb = crearQueryBuilderMock(selectResult);
      qb.upsert = upsertMock.mockReturnValue(qb);
      return qb;
    });
  });

  it('preserva gastos_detalle existente cuando el payload no lo trae', async () => {
    selectResult = {
      data: { band_id: 'band-test', gastos_detalle: { transporte: 150, catering: 80 } },
      error: null
    };

    await dbUpsertConcert({ id: 'cnc-1', fecha: '2026-10-01', ciudad: 'Madrid' }, 'band-test');

    const payload = upsertMock.mock.calls[0][0];
    expect(payload.gastos_detalle).toEqual({ transporte: 150, catering: 80 });
  });

  it('sí actualiza gastos_detalle cuando el payload lo trae explícitamente', async () => {
    selectResult = {
      data: { band_id: 'band-test', gastos_detalle: { transporte: 150 } },
      error: null
    };

    await dbUpsertConcert(
      { id: 'cnc-1', fecha: '2026-10-01', gastos_detalle: { transporte: 200 } },
      'band-test'
    );

    const payload = upsertMock.mock.calls[0][0];
    expect(payload.gastos_detalle).toEqual({ transporte: 200 });
  });
});
