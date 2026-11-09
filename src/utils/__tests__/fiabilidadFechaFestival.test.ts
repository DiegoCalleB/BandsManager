import { describe, expect, it } from 'vitest';
import { fiabilidadFechaFestival } from '../fiabilidadFechaFestival';

const hoy = new Date('2026-11-09T10:00:00Z');

describe('fiabilidadFechaFestival', () => {
  it('sin fechas no hay nada que fiar', () => {
    expect(fiabilidadFechaFestival({}, hoy).nivel).toBe('sin_fecha');
  });

  it('una fecha ya pasada es una estimación de esa edición y hay que revisarla', () => {
    const f = fiabilidadFechaFestival({ festival_start_date: '2026-07-03', festival_end_date: '2026-07-04' }, hoy);
    expect(f).toMatchObject({ nivel: 'estimada', edicion: 2026 });
    expect(f.motivo).toContain('2026');
  });

  it('una fecha futura es la de la próxima edición, con su año', () => {
    const f = fiabilidadFechaFestival({ festival_start_date: '2027-07-16', festival_end_date: '2027-07-18' }, hoy);
    expect(f).toMatchObject({ nivel: 'proxima', edicion: 2027 });
  });

  it('sin fin, usa el inicio para decidir si ya pasó', () => {
    expect(fiabilidadFechaFestival({ festival_start_date: '2026-01-01' }, hoy).nivel).toBe('estimada');
    expect(fiabilidadFechaFestival({ festival_start_date: '2026-12-19' }, hoy).nivel).toBe('proxima');
  });

  it('un festival que dura hoy todavía no ha pasado', () => {
    expect(fiabilidadFechaFestival({ festival_start_date: '2026-11-08', festival_end_date: '2026-11-10' }, hoy).nivel).toBe('proxima');
  });
});
