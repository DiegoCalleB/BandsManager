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
  isActive: true,
};

const baseLead = (overrides: Partial<Lead> = {}): Lead =>
  ({
    id: 'lead-1',
    nombre_sala: 'Sala Test',
    ciudad: 'Madrid',
    estado: 'nuevo',
    ...overrides,
  }) as Lead;

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
      festival_end_date: '06/06/2027',
    });
    expect(leadMatchesCampaignDates(festival, baseCampaign)).toBe(false);
  });

  it('acepta un festival cuyas fechas en diciembre coinciden con el rango de la campaña', () => {
    const festival = baseLead({
      nombre_sala: 'Festival de Invierno',
      tipo: 'festival' as any,
      festival_start_date: '05/12/2026',
      festival_end_date: '06/12/2026',
    });
    expect(leadMatchesCampaignDates(festival, baseCampaign)).toBe(true);
  });
});

describe('campaña de festivales con ventana de fechas (festivales de verano)', () => {
  const ahora = new Date('2026-11-09T10:00:00Z');
  const verano = { id: 'c', name: 'Verano 2027', alcance: 'festivales', campaignStartDate: '2027-06-01', campaignEndDate: '2027-09-30', isActive: true } as BookingCampaign;
  const fest = (ini: string, fin: string) => baseLead({ tipo: 'festival' as any, festival_start_date: ini, festival_end_date: fin });

  it('una edición pasada de julio sigue entrando: los festivales se repiten por las mismas fechas cada año', () => {
    expect(leadMatchesCampaignDates(fest('2026-07-03', '2026-07-04'), verano, ahora)).toBe(true);
  });

  it('una edición pasada de noviembre o diciembre queda fuera de una campaña de verano', () => {
    expect(leadMatchesCampaignDates(fest('2026-11-07', '2026-11-07'), verano, ahora)).toBe(false);
    expect(leadMatchesCampaignDates(fest('2026-12-19', '2026-12-19'), verano, ahora)).toBe(false);
  });

  it('un festival sin fecha conocida entra siempre', () => {
    expect(leadMatchesCampaignDates(baseLead({ tipo: 'festival' as any }), verano, ahora)).toBe(true);
  });

  it('una fecha ya publicada de otro mes no se proyecta: se compara tal cual', () => {
    expect(leadMatchesCampaignDates(fest('2027-12-10', '2027-12-12'), verano, ahora)).toBe(false);
    expect(leadMatchesCampaignDates(fest('2027-07-15', '2027-07-19'), verano, ahora)).toBe(true);
  });

  it('un festival que cruza el fin de año se compara bien contra una campaña de enero', () => {
    const invierno = { ...verano, campaignStartDate: '2028-01-01', campaignEndDate: '2028-01-10' } as BookingCampaign;
    expect(leadMatchesCampaignDates(fest('2025-12-28', '2026-01-02'), invierno, ahora)).toBe(true);
  });

  it('un festival largo (todo el verano) solapa con cualquier ventana de esa época', () => {
    expect(leadMatchesCampaignDates(fest('2026-06-12', '2026-09-12'), verano, ahora)).toBe(true);
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

describe('campaña de festivales (sin ciudad ni aforo)', () => {
  const festivales: BookingCampaign = {
    id: 'bf-1',
    name: 'Black Friday festivales',
    alcance: 'festivales',
    targetCities: ['Madrid'],
    minCapacity: 300,
    maxCapacity: 500,
    targetDates: [],
    isActive: true,
  };

  it('acepta un festival de cualquier ciudad y aforo, aunque la campaña traiga ciudad y aforo heredados', () => {
    expect(leadMatchesCampaign(baseLead({ tipo: 'festival', ciudad: 'Berlín', aforo: 20000 }), festivales)).toBe(true);
  });

  it('descarta lo que no es festival', () => {
    expect(leadMatchesCampaign(baseLead({ tipo: 'sala', ciudad: 'Madrid', aforo: 400 }), festivales)).toBe(false);
  });

  it('las campañas de salas siguen filtrando por ciudad y aforo', () => {
    expect(leadMatchesCampaign(baseLead({ tipo: 'festival', ciudad: 'Berlín', aforo: 20000 }), baseCampaign)).toBe(false);
  });
});

describe('matchers sueltos con campaña de festivales (los que usa el listado de Booking)', () => {
  const bf: BookingCampaign = { id: 'bf', name: 'BF', alcance: 'festivales', targetCities: ['Madrid'], minCapacity: 300, maxCapacity: 500, targetDates: [], isActive: true };
  it('ciudad y aforo no filtran', () => {
    expect(leadMatchesCampaignCity(baseLead({ ciudad: 'Berlín' }), bf)).toBe(true);
    expect(leadMatchesCampaignCapacity(baseLead({ aforo: 20000 }), bf)).toBe(true);
  });
  it('leadMatchesCampaignScope deja pasar solo festivales', async () => {
    const { leadMatchesCampaignScope } = await import('../campaignMatch');
    expect(leadMatchesCampaignScope(baseLead({ tipo: 'festival' }), bf)).toBe(true);
    expect(leadMatchesCampaignScope(baseLead({ tipo: 'sala' }), bf)).toBe(false);
    expect(leadMatchesCampaignScope(baseLead({ tipo: 'sala' }), baseCampaign)).toBe(true);
  });
});
