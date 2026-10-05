import { describe, it, expect, vi, beforeEach } from 'vitest';

function crearQueryBuilderMock(resultadoTerminal: any = { data: null, error: null }) {
  const builder: any = {
    select: vi.fn(() => builder),
    in: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    limit: vi.fn(() => builder),
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

import { dbUpsertEpkConfig } from '../epk';

describe('dbUpsertEpkConfig: campos del editor que antes no se escribían', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectResult = { data: null, error: null };
    fromMock.mockImplementation(() => {
      const qb = crearQueryBuilderMock(selectResult);
      qb.upsert = upsertMock.mockReturnValue(qb);
      return qb;
    });
  });

  it('escribe genero, riderConfig, bandasSimilares y mostrarBandasSimilares', async () => {
    await dbUpsertEpkConfig('band-test', {
      genero: 'Thrash Metal',
      riderConfig: { tipoMonitoreo: 'in_ear', canalesMinimos: 12 },
      bandasSimilares: ['Metallica', 'Slayer'],
      mostrarBandasSimilares: true
    });
    const payload = upsertMock.mock.calls[0][0];
    expect(payload.genero).toBe('Thrash Metal');
    expect(payload.rider_config).toEqual({ tipoMonitoreo: 'in_ear', canalesMinimos: 12 });
    expect(payload.bandas_similares).toEqual(['Metallica', 'Slayer']);
    expect(payload.mostrar_bandas_similares).toBe(true);
  });

  it('un guardado parcial conserva los valores existentes y un vacío intencional se respeta', async () => {
    selectResult = {
      data: { band_id: 'band-test', genero: 'Rock', bandas_similares: ['A'], rider_config: { canalesMinimos: 8 } },
      error: null
    };
    await dbUpsertEpkConfig('band-test', { biografia: 'solo bio' });
    let payload = upsertMock.mock.calls[0][0];
    expect(payload.genero).toBe('Rock');
    expect(payload.bandas_similares).toEqual(['A']);
    expect(payload.rider_config).toEqual({ canalesMinimos: 8 });

    await dbUpsertEpkConfig('band-test', { bandasSimilares: [] });
    payload = upsertMock.mock.calls[1][0];
    expect(payload.bandas_similares).toEqual([]);
  });
});
