import { describe, it, expect } from 'vitest';
import {
  findCorridorForCity,
  areCitiesLogisticallyCompatible,
  findTourRoutingOpportunities,
  calculateLeadScore
} from '../tourRouting';
import { Concert, Lead } from '../../types';

describe('tourRouting utility', () => {
  it('correctly maps cities to logistic tour corridors in Spain', () => {
    const valencia = findCorridorForCity('Valencia');
    expect(valencia).not.toBeNull();
    expect(valencia?.info.corridor).toBe('Eje Mediterráneo');

    const zaragoza = findCorridorForCity('Zaragoza');
    expect(zaragoza).not.toBeNull();
    expect(zaragoza?.info.corridor).toBe('Eje del Ebro & Norte');

    const sevilla = findCorridorForCity('Sevilla');
    expect(sevilla).not.toBeNull();
    expect(sevilla?.info.corridor).toBe('Eje Sur & Andalucía');
  });

  it('identifies logistically compatible cities in the same corridor or neighbor corridor', () => {
    // Valencia and Barcelona (same Mediterranean corridor)
    expect(areCitiesLogisticallyCompatible('Valencia', 'Barcelona')).toBe(true);

    // Zaragoza and Logroño (same Ebro corridor)
    expect(areCitiesLogisticallyCompatible('Zaragoza', 'Logroño')).toBe(true);

    // Completely unrelated / non-neighboring without direct corridor
    expect(areCitiesLogisticallyCompatible('A Coruña', 'Almería')).toBe(false);
  });

  it('detects tour routing opportunities from upcoming confirmed concerts', () => {
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 20);

    const mockConcerts: Concert[] = [
      {
        id: 'c1',
        fecha: nextMonth.toISOString().split('T')[0],
        ciudad: 'Zaragoza',
        sala: 'Sala López',
        cache: 800,
        aforo_vendido: 0,
        aforo_total: 250,
        contrato_firmado: true,
        estado_pago: 'pendiente',
        notas: '',
        tipo: 'sala'
      }
    ];

    const mockLeads: Lead[] = [
      {
        id: 'l1',
        nombre_sala: 'Biribay Jazz Club',
        ciudad: 'Logroño',
        region: 'La Rioja',
        aforo: 150,
        genero: 'indie rock',
        email_contacto: 'contacto@biribay.com',
        telefono: '600000000',
        instagram: '@biribay',
        fuente: 'scout',
        estado: 'esperando_respuesta',
        pitch_generado: '',
        notas: ''
      },
      {
        id: 'l2',
        nombre_sala: 'Sala Sevilla',
        ciudad: 'Sevilla',
        region: 'Andalucía',
        aforo: 200,
        genero: 'flamenco',
        email_contacto: 'info@sevilla.com',
        telefono: '',
        instagram: '',
        fuente: 'manual',
        estado: 'nuevo',
        pitch_generado: '',
        notas: ''
      }
    ];

    const opps = findTourRoutingOpportunities(mockConcerts, mockLeads);
    expect(opps.length).toBe(1);
    expect(opps[0].concertCity).toBe('Zaragoza');
    expect(opps[0].candidateLeads.some(l => l.nombre_sala === 'Biribay Jazz Club')).toBe(true);
    expect(opps[0].candidateLeads.some(l => l.nombre_sala === 'Sala Sevilla')).toBe(false);
  });

  it('calculates a robust LeadScore breakdown', () => {
    const mockLead: Lead = {
      id: 'lead-vip',
      nombre_sala: 'Razzmatazz 3',
      ciudad: 'Barcelona',
      region: 'Cataluña',
      aforo: 250,
      genero: 'indie balkan ska',
      email_contacto: 'booking@salarazzmatazz.com',
      contacto_nombre: 'Marc Rovira',
      telefono: '611223344',
      instagram: '@razzmatazzclubs',
      fuente: 'scout',
      estado: 'negociando',
      pitch_generado: '',
      notas: ''
    };

    const score = calculateLeadScore(mockLead, {
      bandGenre: 'ska indie mestizaje',
      upcomingConcerts: [
        {
          id: 'c2',
          fecha: '2026-11-20',
          ciudad: 'Tarragona',
          sala: 'Zero',
          cache: 600,
          aforo_vendido: 0,
          aforo_total: 200,
          contrato_firmado: true,
          estado_pago: 'pendiente',
          notas: '',
          tipo: 'sala'
        }
      ]
    });

    expect(score.total).toBeGreaterThanOrEqual(75);
    expect(score.tier).toMatch(/VIP|Alta Prioridad/);
    expect(score.reasons.length).toBeGreaterThan(0);
  });
});
