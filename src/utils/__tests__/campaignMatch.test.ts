import { describe, it, expect } from 'vitest';
import { leadMatchesCampaignCapacity, leadMatchesCampaignCity, leadMatchesCampaign } from '../campaignMatch';
import { BookingCampaign, Lead } from '../../types';

const baseCampaign: BookingCampaign = {
  id: 'camp-1',
  name: 'Campaña Diciembre 2026 (Madrid & Centro)',
  targetCities: ['Madrid'],
  minCapacity: 300,
  maxCapacity: 500,
  targetDates: [],
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
    // 250 is >= 300*0.7 (210), which the old GlobalCampaignBar formula would have accepted -
    // this is exactly the mismatch that made the "Salas (N)" counter disagree with the actual list.
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

describe('leadMatchesCampaign', () => {
  it('excludes media/press leads even if city and capacity match', () => {
    const medio = baseLead({ tipo: 'medio' as any, ciudad: 'Madrid', aforo: 400 });
    expect(leadMatchesCampaign(medio, baseCampaign)).toBe(false);
  });

  it('matches a venue that fits city and capacity', () => {
    expect(leadMatchesCampaign(baseLead({ ciudad: 'Madrid', aforo: 350 }), baseCampaign)).toBe(true);
  });
});
