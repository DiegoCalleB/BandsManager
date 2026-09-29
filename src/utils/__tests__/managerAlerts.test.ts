import { describe, it, expect } from 'vitest';
import { generateManagerAlerts } from '../managerAlerts';
import { Concert, Lead } from '../../types';

describe('generateManagerAlerts', () => {
  it('generates tour_cluster alert when a confirmed show has nearby leads', () => {
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 15);

    const concerts: Concert[] = [
      {
        id: 'c-valencia',
        fecha: nextMonth.toISOString().split('T')[0],
        ciudad: 'Valencia',
        sala: '16 Toneladas',
        cache: 900,
        aforo_vendido: 0,
        aforo_total: 200,
        contrato_firmado: true,
        estado_pago: 'pagado',
        notas: '',
        tipo: 'sala',
      },
    ];

    const leads: Lead[] = [
      {
        id: 'l-castellon',
        nombre_sala: 'Salatal Club',
        ciudad: 'Castellón',
        region: 'Comunidad Valenciana',
        aforo: 300,
        genero: 'indie rock',
        email_contacto: 'info@salatal.com',
        telefono: '600000000',
        instagram: '',
        fuente: 'scout',
        estado: 'esperando_respuesta',
        pitch_generado: '',
        notas: '',
      },
    ];

    const alerts = generateManagerAlerts(leads, concerts, [], null, 'de_gira');
    const clusterAlert = alerts.find((a) => a.type === 'tour_cluster');
    expect(clusterAlert).toBeDefined();
    expect(clusterAlert?.title).toContain('Valencia');
  });

  it('generates cold_negotiation alert when lead in negociando has no activity for > 5 days', () => {
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

    const leads: Lead[] = [
      {
        id: 'l-cold',
        nombre_sala: 'Sala Apolo',
        ciudad: 'Barcelona',
        region: 'Cataluña',
        aforo: 800,
        genero: 'indie',
        email_contacto: 'apolo@barcelona.cat',
        telefono: '600000000',
        instagram: '',
        fuente: 'scout',
        estado: 'negociando',
        pitch_generado: 'Hola Apolo',
        fecha_ultima_respuesta: eightDaysAgo.toISOString(),
        notas: '',
      },
    ];

    const alerts = generateManagerAlerts(leads, [], [], null, 'de_gira');
    const coldAlert = alerts.find((a) => a.type === 'cold_negotiation');
    expect(coldAlert).toBeDefined();
    expect(coldAlert?.category).toBe('Seguimiento CRM');
  });

  it('generates advance_pending alert for upcoming concerts (<21 days) with pending payment/contract', () => {
    const tenDaysAhead = new Date();
    tenDaysAhead.setDate(tenDaysAhead.getDate() + 10);

    const concerts: Concert[] = [
      {
        id: 'c-advance',
        fecha: tenDaysAhead.toISOString().split('T')[0],
        ciudad: 'Madrid',
        sala: 'Sala Sol',
        cache: 1200,
        aforo_vendido: 0,
        aforo_total: 300,
        contrato_firmado: false,
        estado_pago: 'pendiente',
        notas: '',
        tipo: 'sala',
      },
    ];

    const alerts = generateManagerAlerts([], concerts, [], null, 'cabeza_de_cartel');
    const advanceAlert = alerts.find((a) => a.type === 'advance_pending');
    expect(advanceAlert).toBeDefined();
    expect(advanceAlert?.title).toContain('Sala Sol');
  });
});
