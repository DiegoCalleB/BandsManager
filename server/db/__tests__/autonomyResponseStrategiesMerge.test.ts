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

vi.mock('../core.js', () => ({
  getSupabase: () => ({ from: fromMock }),
  cleanBandId: (bandId?: string) => (bandId || '').replace(/^(band|reg)-/, '')
}));

vi.mock('../bands.js', () => ({
  ensureRegisteredBandExists: vi.fn().mockResolvedValue(undefined)
}));

import { dbUpsertAutonomyConfig } from '../autonomy';

describe('dbUpsertAutonomyConfig: response_strategies no se resetea en un guardado general', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockImplementation(() => {
      const qb = crearQueryBuilderMock({ data: null, error: null });
      qb.upsert = upsertMock.mockReturnValue(qb);
      return qb;
    });
  });

  // Bug real: el botón general "Guardar" del panel de Autonomía de Agentes nunca incluye
  // responseStrategies en su payload (vive en su propio estado, se guarda por un botón aparte).
  // dbUpsertAutonomyConfig caía a {} cuando el campo no venía, borrando en silencio TODAS las
  // estrategias de respuesta condicionales configuradas desde la otra pestaña.
  it('no toca response_strategies cuando el payload no lo incluye (Supabase preserva la columna)', async () => {
    await dbUpsertAutonomyConfig('band-test', {
      dispatchLevel: 'auto_propose',
      dispatchMode: 'direct_send'
      // sin responseStrategies
    });

    const payload = upsertMock.mock.calls[0][0];
    expect(payload.response_strategies).toBeUndefined();
  });

  it('sí actualiza response_strategies cuando el payload lo trae explícitamente', async () => {
    const nuevasEstrategias = {
      price_negotiation: { responseType: 'price_negotiation', autoRespond: true }
    };

    await dbUpsertAutonomyConfig('band-test', {
      responseStrategies: nuevasEstrategias
    });

    const payload = upsertMock.mock.calls[0][0];
    expect(payload.response_strategies).toEqual(nuevasEstrategias);
  });
});
