import { describe, it, expect } from 'vitest';
import { leadMatchesCampaignCapacity, leadMatchesCampaignCity, leadMatchesCampaignDates, leadMatchesCampaign } from '../campaignMatch';
import { BookingCampaign, Lead } from '../../types';

const baseCampaign: BookingCampaign = {
  id: 'camp-1',
  name: 'Campaña Diciembre 2026 (Madrid & Centro)',
  targetCities: ['Madrid'],
  minCapacity: 300,
  maxCapacity: 500,
  targetDates: ['2026-12-04', '2026-12-05', '2026-12-11', '2026-12-12'],
  isActive: true
};

const baseLead = (overrides: Partial<Lead> = {}): Lead => ({
  id: 'lead-1',
  nombre_sala: 'Sala Test',
  ciudad: 'Madrid',
  estado: 'nuevo',
  ...overrides
} as Lead);

describe('leadMatchesCampaignCapacity', () => {
  it('matches a venue inside the exact range', () => {
    expect(leadMatchesCampaignCapacity(baseLead({ aforo: 400 }), baseCampaign)).toBe(true);
  });

  it('rejects a venue below the minimum, even within a ±30% margin', () => {
    expect(leadMatchesCampaignCapacity(baseLead({ aforo: 250 }), baseCampaign)).toBe(false);
  });

  it('rejects a venue above the maximum', () => {
    expect(leadMatchesCampaignCapacity(baseLead({ aforo: 600 }), baseCampaign)).toBe(false);
  });

  it('does not exclude a venue with unknown capacity', () => {
    expect(leadMatchesCampaignCapacity(baseLead({ aforo: 0 }), baseCampaign)).toBe(true);
    expect(leadMatchesCampaignCapacity(baseLead({ aforo: undefined }), baseCampaign)).toBe(true);
  });
});

describe('leadMatchesCampaignCity', () => {
  it('matches a lead in a target city', () => {
    expect(leadMatchesCampaignCity(baseLead({ ciudad: 'Madrid' }), baseCampaign)).toBe(true);
  });

  it('rejects a lead outside every target city', () => {
    expect(leadMatchesCampaignCity(baseLead({ ciudad: 'Barcelona', region: '' }), baseCampaign)).toBe(false);
  });

  it('matches everything when the campaign has no location filter', () => {
    const noCityCampaign = { ...baseCampaign, targetCities: [] };
    expect(leadMatchesCampaignCity(baseLead({ ciudad: 'Barcelona' }), noCityCampaign)).toBe(true);
  });
});

describe('leadMatchesCampaignDates', () => {
  it('descarta un festival en junio de 2027 cuando la campaña es para diciembre de 2026', () => {
    const festival = baseLead({
      nombre_sala: 'ReggaeMad Fest',
      tipo: 'festival' as any,
      festival_start_date: '05/06/2027',
      festival_end_date: '06/06/2027'
    });
    expect(leadMatchesCampaignDates(festival, baseCampaign)).toBe(false);
  });

  it('acepta un festival cuyas fechas en diciembre coinciden con el rango de la campaña', () => {
    const festival = baseLead({
      nombre_sala: 'Festival de Invierno',
      tipo: 'festival' as any,
      festival_start_date: '05/12/2026',
      festival_end_date: '06/12/2026'
    });
    expect(leadMatchesCampaignDates(festival, baseCampaign)).toBe(true);
  });
});

describe('leadMatchesCampaign', () => {
  it('excludes media/press leads even if city and capacity match', () => {
    const medio = baseLead({ tipo: 'medio' as any, ciudad: 'Madrid', aforo: 400 });
    expect(leadMatchesCampaign(medio, baseCampaign)).toBe(false);
  });

  it('matches a venue that fits city and capacity', () => {
    expect(leadMatchesCampaign(baseLead({ ciudad: 'Madrid', aforo: 350 }), baseCampaign)).toBe(true);
  });

  it('excludes co-booking groups/agencies/managers/labels/production companies, matching the exclusion Booking CRM applies to its "Salas" tab', () => {
    for (const tipo of ['grupo', 'agencia', 'manager', 'sello', 'productora']) {
      const lead = baseLead({ tipo: tipo as any, ciudad: 'Madrid', aforo: 400 });
      expect(leadMatchesCampaign(lead, baseCampaign)).toBe(false);
    }
  });
});

