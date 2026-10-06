// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { describe, it, expect, vi, beforeEach } from 'vitest';

function crearQueryBuilderMock(resultadoTerminal: any = { data: null, error: null }) {
  const builder: any = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    ilike: vi.fn(() => builder),
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

import { dbUpsertBandContact } from '../contacts';

describe('dbUpsertBandContact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockImplementation(() => {
      const qb = crearQueryBuilderMock({ data: null, error: null });
      qb.upsert = upsertMock.mockReturnValue(qb);
      return qb;
    });
    upsertMock.mockClear();
  });

  // Mismo fallo que en dbUpsertLead/dbUpsertFan/dbUpsertCampaign: priorizar el band_id del
  // cuerpo permitía a cualquier usuario autenticado escribir un contacto de intercambio de
  // bandas en la banda de otro con solo incluir "band_id" en el body.
  it('usa SIEMPRE la banda de la sesión, nunca el band_id que venga en el cuerpo', async () => {
    await dbUpsertBandContact(
      { nombre_banda: 'Banda Ajena', band_id: 'banda-ajena' },
      'la-banda-real'
    );

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ band_id: 'la-banda-real' })
    );
  });

  it('funciona igual cuando el cuerpo no trae band_id en absoluto', async () => {
    await dbUpsertBandContact({ nombre_banda: 'Banda Nueva' }, 'la-banda-real');

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ band_id: 'la-banda-real' })
    );
  });
});
