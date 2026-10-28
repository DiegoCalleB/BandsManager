import { describe, expect, it } from 'vitest';
import { diagnosticar, type EntradaDiagnostico } from '../diagnostico';

const HOY = '2026-10-28';
const base: EntradaDiagnostico = { hoy: HOY, conciertos: [], lanzamiento: null, ultimaPublicacion: null };
const bolo = (id: string, fecha: string) => ({ id, fecha, sala: 'Sala El Sol', ciudad: 'Madrid' });

describe('diagnosticar', () => {
  it('modo concierto con el bolo más cercano dentro de 21 días', () => {
    const d = diagnosticar({ ...base, conciertos: [bolo('lejos', '2026-11-15'), bolo('cerca', '2026-11-06'), bolo('pasado', '2026-10-01')] });
    expect(d.modo).toBe('concierto');
    expect(d.concierto?.id).toBe('cerca');
    expect(d.porque).toContain('en 9 días');
  });

  it('un bolo a más de 21 días no cuenta', () => {
    expect(diagnosticar({ ...base, conciertos: [bolo('a', '2026-12-31')] }).modo).toBe('fondo');
  });

  it('el bolo manda sobre el lanzamiento', () => {
    const d = diagnosticar({ ...base, conciertos: [bolo('a', '2026-11-01')], lanzamiento: { titulo: 'Furgo', fecha: '2026-11-02' } });
    expect(d.modo).toBe('concierto');
  });

  it('modo lanzamiento antes y después del estreno', () => {
    expect(diagnosticar({ ...base, lanzamiento: { titulo: 'Furgo', fecha: '2026-11-20' } }).porque).toContain('sale en 23 días');
    expect(diagnosticar({ ...base, lanzamiento: { titulo: 'Furgo', fecha: '2026-10-20' } }).porque).toContain('salió hace 8 días');
    expect(diagnosticar({ ...base, lanzamiento: { titulo: 'Furgo', fecha: '2026-09-01' } }).modo).toBe('fondo');
  });

  it('reactivar solo si sabemos que llevan más de 10 días sin publicar', () => {
    expect(diagnosticar({ ...base, ultimaPublicacion: '2026-10-10' }).modo).toBe('reactivar');
    expect(diagnosticar({ ...base, ultimaPublicacion: '2026-10-25' }).modo).toBe('fondo');
    expect(diagnosticar(base).modo).toBe('fondo');
  });

  it('ignora fechas rotas', () => {
    expect(diagnosticar({ ...base, conciertos: [bolo('x', 'no-fecha')] }).modo).toBe('fondo');
  });
});
