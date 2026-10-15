import { describe, it, expect } from 'vitest';
import { planificarAvisos, construirEmail } from '../calendarConflictService';
import { construirEventos, detectarChoques } from '../../../src/utils/calendarConflicts';
import type { MiembroBanda } from '../../db/calendarConflicts';
import type { Concert } from '../../../src/types';

const miembro = (id: string, esLider = false, email = `${id}@x.es`): MiembroBanda => ({
  id,
  nombre: id,
  email,
  esLider,
});

// A: lider1, u3 (compartido), u2 · B: lider2, u3
const miembrosPorBanda = new Map<string, MiembroBanda[]>([
  ['A', [miembro('lider1', true), miembro('u2'), miembro('u3')]],
  ['B', [miembro('lider2', true), miembro('u3')]],
]);

const bolo = (id: string, band: string, sala: string): Concert => ({
  id,
  band_id: band,
  bandName: `Banda ${band}`,
  fecha: '2026-11-07',
  ciudad: 'Madrid',
  sala,
  cache: 0,
  aforo_vendido: 0,
  aforo_total: 0,
  contrato_firmado: true,
  estado_pago: 'pendiente',
  notas: '',
  tipo: 'sala',
});

function choquesCruzados() {
  const eventos = [
    ...construirEventos([bolo('c1', 'A', 'Sala Pública')], [], 'A'),
    ...construirEventos([bolo('c2', 'B', 'Sala Secreta')], [], 'B'),
  ];
  return detectarChoques(eventos, {
    miembrosDe: (b) => (miembrosPorBanda.get(b) ?? []).map((m) => m.id),
  });
}

describe('planificarAvisos', () => {
  it('avisa al músico atrapado y a los líderes de las dos bandas, nadie más', () => {
    const avisos = planificarAvisos({ choques: choquesCruzados(), miembrosPorBanda, yaAvisados: new Set() });
    expect(avisos.map((a) => a.destinatario.id).sort()).toEqual(['lider1', 'lider2', 'u3']);
  });

  it('el líder de una banda NO ve dónde toca la otra; el músico compartido sí', () => {
    const avisos = planificarAvisos({ choques: choquesCruzados(), miembrosPorBanda, yaAvisados: new Set() });
    const html = (id: string) => construirEmail(avisos.find((a) => a.destinatario.id === id)!, 'https://app.test').html;

    expect(html('lider1')).toContain('Sala Pública');
    expect(html('lider1')).not.toContain('Sala Secreta');
    expect(html('lider2')).toContain('Sala Secreta');
    expect(html('lider2')).not.toContain('Sala Pública');
    expect(html('u3')).toContain('Sala Pública');
    expect(html('u3')).toContain('Sala Secreta');
  });

  it('no repite un aviso ya mandado a esa persona', () => {
    const choques = choquesCruzados();
    const h = choques[0].huella;
    const avisos = planificarAvisos({
      choques,
      miembrosPorBanda,
      yaAvisados: new Set([`u3|${h}`]),
    });
    expect(avisos.map((a) => a.destinatario.id).sort()).toEqual(['lider1', 'lider2']);
  });

  it('los avisos blandos nunca generan email', () => {
    const eventos = [
      ...construirEventos([bolo('c1', 'A', 'S1')], [], 'A'),
      ...construirEventos([{ ...bolo('c2', 'A', 'S2'), is_posible: true }], [], 'A'),
    ];
    const choques = detectarChoques(eventos, { miembrosDe: () => ['u2'] });
    expect(choques[0].severidad).toBe('aviso');
    expect(planificarAvisos({ choques, miembrosPorBanda, yaAvisados: new Set() })).toEqual([]);
  });

  it('sin email no se avisa', () => {
    const sinEmail = new Map(miembrosPorBanda);
    sinEmail.set('B', [miembro('lider2', true, ''), miembro('u3', false, '')]);
    sinEmail.set('A', [miembro('lider1', true, ''), miembro('u2'), miembro('u3', false, '')]);
    expect(planificarAvisos({ choques: choquesCruzados(), miembrosPorBanda: sinEmail, yaAvisados: new Set() })).toEqual([]);
  });
});

describe('construirEmail', () => {
  it('escapa el HTML de nombres y salas escritos por usuarios', () => {
    const eventos = construirEventos(
      [bolo('c1', 'A', '<img src=x onerror=alert(1)>'), bolo('c2', 'A', 'Otra')],
      [],
      'A',
    );
    const choques = detectarChoques(eventos, { miembrosDe: () => ['u2'] });
    const aviso = {
      destinatario: { ...miembro('u2'), nombre: '<b>Eve</b>' },
      bandasVisibles: new Set(['A']),
      choques,
    };
    const { html, subject } = construirEmail(aviso, 'https://app.test');
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<b>Eve</b>');
    expect(subject).toBe('Tienes un choque en el calendario');
  });
});
