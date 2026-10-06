import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Mock encadenable mínimo de un query builder de Supabase: cualquier método intermedio
 * (select/eq/ilike/order...) devuelve el propio mock para poder seguir encadenando, y los
 * métodos terminales (maybeSingle/single) resuelven con lo que se les indique.
 */
function crearQueryBuilderMock(resultadoTerminal: any = { data: null, error: null }) {
  const builder: any = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    ilike: vi.fn(() => builder),
    order: vi.fn(() => builder),
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

import { dbUpsertLead } from '../leads';

describe('dbUpsertLead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Sin lead existente que devolver: cada select().eq()...maybeSingle() de dentro de
    // dbUpsertLead resuelve a "no encontrado", así que el payload final es siempre nuevo.
    fromMock.mockImplementation(() => {
      const qb = crearQueryBuilderMock({ data: null, error: null });
      qb.upsert = upsertMock.mockReturnValue(qb);
      return qb;
    });
    upsertMock.mockClear();
  });

  // server/routes/leads/crud.ts solo rellena band_id si el lead entrante no lo trae
  // ('if (!newLead.band_id)'): si el cliente ya lo manda, llegaba tal cual hasta aquí. Sin este
  // fix, priorizar 'lead.band_id' sobre la banda de sesión permitía a cualquier usuario
  // autenticado escribir un lead en la banda de otro con solo incluir "band_id" en el body.
  it('usa SIEMPRE la banda de la sesión, nunca el band_id que venga en el cuerpo', async () => {
    await dbUpsertLead(
      { nombre_sala: 'Sala Ajena', band_id: 'banda-ajena' },
      'la-banda-real'
    );

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ band_id: 'la-banda-real' })
    );
  });

  it('funciona igual cuando el cuerpo no trae band_id en absoluto', async () => {
    await dbUpsertLead({ nombre_sala: 'Sala Nueva' }, 'la-banda-real');

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ band_id: 'la-banda-real' })
    );
  });
});
