import { describe, expect, it } from 'vitest';
import { planDePitches } from '../prepararEmailsCampana';

const ahora = new Date('2026-11-09T10:00:00Z');
const campana = { id: 'c1', name: 'BF', alcance: 'festivales' as const };
const fest = (o: Record<string, unknown>) => ({ id: 'l1', nombre_sala: 'Fumega Fest', tipo: 'festival', estado: 'nuevo', ciudad: 'Betanzos', genero: 'Rock', ...o });

describe('planDePitches', () => {
  it('escribe el pitch de los festivales nuevos de la campaña y no toca el resto', () => {
    const plan = planDePitches(
      [fest({}), fest({ id: 'l2', tipo: 'sala', nombre_sala: 'Sala X' }), fest({ id: 'l3', estado: 'pendiente_aprobacion', nombre_sala: 'Otro' }), fest({ id: 'l4', estado: 'no_interesado', nombre_sala: 'Archivado' })] as never[],
      campana as never,
      { banda: 'Los Ejemplos', ahora },
    );
    expect(plan.escribir.map((p) => p.id)).toEqual(['l1']);
    expect(plan.escribir[0].pitch).toContain('Asunto: Black Friday: Los Ejemplos al caché de 2026 para Fumega Fest');
    expect(plan.enCurso).toBe(1);
  });

  it('respeta un pitch escrito a mano pero actualiza uno que salió de la plantilla', () => {
    const plan = planDePitches(
      [fest({ id: 'a', pitch_generado: 'Texto de Jose' }), fest({ id: 'b', nombre_sala: 'B', pitch_generado: 'Asunto: Black Friday: viejo\n\nHola' }), fest({ id: 'c', nombre_sala: 'C', pitch_generado: '' })] as never[],
      campana as never,
      { banda: 'Los Ejemplos', ahora },
    );
    expect(plan.escribir.map((p) => p.id).sort()).toEqual(['b', 'c']);
    expect(plan.conPitchPropio).toBe(1);
  });

  it('con sobrescribir también sustituye el texto anterior de los leads nuevos, pero nunca los que están en curso', () => {
    const plan = planDePitches(
      [fest({ id: 'a', pitch_generado: 'Texto antiguo de la IA' }), fest({ id: 'b', nombre_sala: 'B', estado: 'pendiente_aprobacion', pitch_generado: 'En curso' })] as never[],
      campana as never,
      { banda: 'Los Ejemplos', ahora, sobrescribir: true },
    );
    expect(plan.escribir.map((p) => p.id)).toEqual(['a']);
    expect(plan).toMatchObject({ reemplazados: 1, conPitchPropio: 0, enCurso: 1 });
  });

  it('usa las plantillas guardadas en la campaña si las hay', () => {
    const plan = planDePitches([fest({})] as never[], { ...campana, customPitchTemplates: { festivales_email_es: 'Asunto: X {festival}\n\nHola {festival}' } } as never, { banda: 'Los Ejemplos', ahora });
    expect(plan.escribir[0].pitch).toBe('Asunto: X Fumega Fest\n\nHola Fumega Fest');
  });

  it('una campaña de salas no prepara nada', () => {
    expect(planDePitches([fest({})] as never[], { ...campana, alcance: 'salas' } as never, { banda: 'Los Ejemplos', ahora }).escribir).toEqual([]);
  });
});
