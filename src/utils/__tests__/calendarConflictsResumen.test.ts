import { describe, it, expect } from 'vitest';
import { construirEventos, detectarChoques, redactarChoque } from '../calendarConflicts';
import { resumenChoque } from '../calendarConflictsResumen';
import type { Concert } from '../../types';

const bolo = (id: string, band: string, sala: string, ciudad: string, llegada: string, show: string, fecha = '2026-11-07'): Concert => ({
  id,
  band_id: band,
  bandName: `Banda ${band}`,
  fecha,
  ciudad,
  sala,
  cache: 0,
  aforo_vendido: 0,
  aforo_total: 0,
  contrato_firmado: true,
  estado_pago: 'pendiente',
  notas: '',
  tipo: 'sala',
  logisticaTecnica: { horaLlegada: llegada, horaShow: show },
});

const choquesDe = (conciertos: Concert[], miembrosDe: (b: string) => string[] = () => ['u1']) =>
  detectarChoques(
    conciertos.flatMap((c) => construirEventos([c], [], c.band_id!)),
    { miembrosDe },
  );

describe('resumenChoque', () => {
  it('un solape trae el tiempo en común, las dos filas y el tramo para dibujarlo', () => {
    const [c] = choquesDe([
      bolo('c1', 'A', 'Apolo', 'Barcelona', '18:00', '21:00'),
      bolo('c2', 'A', 'Caracol', 'Barcelona', '20:00', '22:30'),
    ]);
    const r = resumenChoque(c);
    expect(r.titular).toBe('Se solapan 2 h 30 min');
    expect(r.filas.map((f) => f.titulo)).toEqual(['Apolo', 'Caracol']);
    expect(r.filas[0].lugar).toBe('Barcelona');
    expect(r.filas[0].horas).toBe('18:00–22:30');
    expect(r.tramo?.solape).toEqual([20 * 60, 22 * 60 + 30]);
  });

  it('no repite la ciudad si ya está en el título ni la banda si es la misma', () => {
    const [c] = choquesDe([
      bolo('c1', 'A', 'Sala Apolo Barcelona', 'Barcelona', '18:00', '21:00'),
      bolo('c2', 'A', 'Caracol', 'Barcelona', '20:00', '22:30'),
    ]);
    const r = resumenChoque(c);
    expect(r.filas[0].lugar).toBeUndefined();
    expect(r.filas[1].lugar).toBe('Barcelona');
  });

  it('un viaje inviable lo dice con el viaje y el margen, sin solape en el tramo', () => {
    const [c] = choquesDe([
      bolo('c1', 'A', 'Apolo', 'Barcelona', '15:00', '17:00'),
      bolo('c2', 'A', 'But', 'Madrid', '20:00', '22:00'),
    ]);
    expect(c.motivo).toBe('viaje_inviable');
    const r = resumenChoque(c);
    expect(r.titular).toMatch(/^No da tiempo: .* de viaje y hay /);
    expect(r.tramo?.solape).toBeUndefined();
  });

  it('marca como «este evento» solo la fila de la ficha abierta', () => {
    const [c] = choquesDe([
      bolo('c1', 'A', 'Apolo', 'Barcelona', '18:00', '21:00'),
      bolo('c2', 'A', 'Caracol', 'Barcelona', '20:00', '22:30'),
    ]);
    const r = resumenChoque(c, { yo: { tipo: 'concierto', id: 'c2' } });
    expect(r.filas.map((f) => f.esteEvento)).toEqual([false, true]);
  });

  it('con otra banda de por medio no revela sala, ciudad, horas ni tramo', () => {
    const miembros = (b: string) => (b === 'A' ? ['lider', 'u3'] : ['u3']);
    const [bruto] = choquesDe(
      [bolo('c1', 'A', 'Sala Pública', 'Madrid', '18:00', '21:00'), bolo('c2', 'B', 'Sala Secreta', 'Madrid', '20:00', '22:30')],
      miembros,
    );
    const visto = redactarChoque(bruto, new Set(['A']));
    const r = resumenChoque(visto, { bandasVisibles: new Set(['A']) });
    const texto = JSON.stringify(r);
    expect(texto).not.toContain('Secreta');
    expect(r.filas[1].oculto).toBe(true);
    expect(r.filas[1].horas).toBeUndefined();
    expect(r.tramo).toBeUndefined();
  });
});
