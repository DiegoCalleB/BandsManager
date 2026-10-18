/** El barrido global del radar de campañas solo trabaja para bandas con el booking encendido. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  dbGetRegisteredBands: vi.fn(),
  dbGetCampaigns: vi.fn(),
  dbGetLeads: vi.fn(),
  dbUpsertLead: vi.fn(),
  detect: vi.fn(),
}));
vi.mock('../../db.js', () => ({
  dbGetRegisteredBands: mocks.dbGetRegisteredBands,
  dbGetCampaigns: mocks.dbGetCampaigns,
  dbGetLeads: mocks.dbGetLeads,
  dbUpsertLead: mocks.dbUpsertLead,
}));
vi.mock('../venueEventsRadarService.js', () => ({ detectVenueEventsAndFreeDates: mocks.detect }));
vi.mock('../../utils/errorTracking.js', () => ({ captureError: vi.fn() }));

import { syncActiveCampaignsRadar } from '../campaignRadarScheduler.js';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.dbGetRegisteredBands.mockResolvedValue([
    { band_id: 'con', suscripcion_habilitada: true },
    { band_id: 'sin', suscripcion_habilitada: false },
    { band_id: 'nada' },
  ]);
  mocks.dbGetCampaigns.mockResolvedValue([]);
  mocks.dbGetLeads.mockImplementation(async (id: string) => [{ id: `lead-${id}`, nombre_sala: `Sala ${id}`, ciudad: 'X' }]);
  mocks.detect.mockResolvedValue({ success: true, fechas_libres_detectadas: ['2026-12-01'], fechas_ocupadas: [] });
});

describe('syncActiveCampaignsRadar', () => {
  it('el barrido global solo recorre las bandas habilitadas', async () => {
    const r = await syncActiveCampaignsRadar();
    expect(r.scannedBands).toBe(1);
    expect(mocks.dbGetLeads).toHaveBeenCalledTimes(1);
    expect(mocks.dbGetLeads).toHaveBeenCalledWith('con');
    expect(mocks.detect).toHaveBeenCalledTimes(1);
  });

  it('con una banda concreta (ruta de campañas, ya tras el guardia) trabaja esa banda', async () => {
    const r = await syncActiveCampaignsRadar('sin');
    expect(r.scannedBands).toBe(1);
    expect(mocks.dbGetLeads).toHaveBeenCalledWith('sin');
  });
});
