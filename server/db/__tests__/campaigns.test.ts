// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const upsertMock = vi.fn();
const singleMock = vi.fn();
const selectMock = vi.fn();
const fromMock = vi.fn();

vi.mock('../core.js', () => ({
  getSupabase: () => ({ from: fromMock }),
  cleanBandId: (bandId?: string) => (bandId || '').replace(/^(band|reg)-/, '')
}));

vi.mock('../bands.js', () => ({
  ensureRegisteredBandExists: vi.fn().mockResolvedValue(undefined)
}));

import { dbUpsertCampaign } from '../campaigns';

describe('dbUpsertCampaign', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectMock.mockReturnValue({ single: singleMock });
    upsertMock.mockReturnValue({ select: selectMock });
    fromMock.mockReturnValue({ upsert: upsertMock });
    singleMock.mockResolvedValue({ data: { id: '1', band_id: 'la-banda-real' }, error: null });
  });

  // La ruta (server/routes/campaigns.ts) resuelve 'bandId' a partir de la sesión autenticada
  // (req.user.band_id); 'campaign.band_id' llega tal cual del cuerpo de la petición, sin
  // validar. Si esta función priorizara el segundo sobre el primero, cualquier usuario
  // autenticado podría escribir una campaña en la banda de otro con solo mandar
  // {"band_id": "banda-ajena"} en el POST/PUT — exactamente el fallo que tenía este archivo.
  it('usa SIEMPRE la banda de la sesión, nunca el band_id que venga en el cuerpo', async () => {
    await dbUpsertCampaign(
      { name: 'Gira de otoño', band_id: 'banda-ajena' },
      'la-banda-real'
    );

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ band_id: 'la-banda-real' }),
      { onConflict: 'id' }
    );
  });

  it('también ignora la variante camelCase (bandId) del cuerpo', async () => {
    await dbUpsertCampaign(
      { name: 'Gira de otoño', bandId: 'banda-ajena' } as any,
      'la-banda-real'
    );

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ band_id: 'la-banda-real' }),
      { onConflict: 'id' }
    );
  });

  it('funciona igual cuando el cuerpo no trae band_id en absoluto', async () => {
    await dbUpsertCampaign({ name: 'Gira de otoño' }, 'la-banda-real');

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ band_id: 'la-banda-real' }),
      { onConflict: 'id' }
    );
  });
});
