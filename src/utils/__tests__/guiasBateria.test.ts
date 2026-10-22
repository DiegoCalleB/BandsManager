import { describe, it, expect } from 'vitest';
import { guiasBateria } from '../guiasBateria';
import { analizarArmonia } from '../teoriaArmonica';

const seq = (...a: string[]) => a.map((acorde, i) => ({ t0: i * 2, t1: i * 2 + 2, acorde }));
const a = analizarArmonia(seq('E', 'E', 'A', 'D', 'E', 'E', 'A', 'D', 'E', 'E', 'A', 'D'), 'E')!;

describe('guiasBateria', () => {
  it('habla de pulso, golpes y fills, no de escalas ni de tonalidad', () => {
    const texto = guiasBateria(a, { bpm: 146 }).map((g) => `${g.titulo} ${g.texto}`).join(' ');
    expect(texto).toMatch(/146 BPM/);
    expect(texto).toMatch(/fill/i);
    expect(texto).not.toMatch(/mixolidi|pentat|escala|tonalidad/i);
  });

  it('el tempo cambia el consejo', () => {
    const t = (bpm: number) => guiasBateria(a, { bpm }).find((g) => g.id === 'bat-tempo')!.titulo;
    expect(t(70)).toBe('Tempo lento');
    expect(t(100)).toBe('Tempo medio');
    expect(t(120)).toBe('Tempo de rock');
    expect(t(170)).toBe('Tempo rápido');
  });

  it('sin BPM no inventa pulso ni cambios; el compás de 3 y los bloques solo salen si aplican', () => {
    const ids = guiasBateria(a).map((g) => g.id);
    expect(ids).not.toContain('bat-tempo');
    expect(ids).not.toContain('bat-cambios');
    expect(ids).not.toContain('bat-compas');
    expect(ids).not.toContain('bat-bloques');
    const con = guiasBateria(a, { bpm: 90, tiemposPorCompas: 3, bloques: 2 }).map((g) => g.id);
    expect(con).toEqual(expect.arrayContaining(['bat-compas', 'bat-bloques']));
  });

  it('los datos salen del análisis y las ideas van etiquetadas como tal', () => {
    const g = guiasBateria(a, { bpm: 146 });
    expect(g.find((x) => x.id === 'bat-bucle')?.tipo).toBe('dato');
    expect(g.filter((x) => x.tipo === 'idea').map((x) => x.id)).toEqual(['bat-dinamica', 'bat-fantasma', 'bat-aro', 'bat-fill']);
  });
});
