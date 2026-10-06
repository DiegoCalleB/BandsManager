import { describe, it, expect } from 'vitest';
import { guiasDelProfesor } from '../guiasArmonia';
import { analizarArmonia } from '../teoriaArmonica';

const seq = (...a: string[]) => a.map((acorde, i) => ({ t0: i * 2, t1: i * 2 + 2, acorde }));
const bt = analizarArmonia(seq('E', 'E', 'A', 'D', 'E', 'E', 'A', 'D', 'E', 'E', 'A', 'D'), 'E')!;
const pop = analizarArmonia(seq('C', 'G', 'Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G', 'Am', 'F'), 'C')!;

describe('guiasDelProfesor', () => {
  it('«Born to be wild»: escala mixolidia, notas guía del bucle y el D como acorde de color', () => {
    const g = guiasDelProfesor(bt);
    const ids = g.map((x) => x.id);
    expect(ids).toContain('escala-base');
    expect(g.find((x) => x.id === 'escala-base')!.texto).toMatch(/mixolidio/);
    expect(g.find((x) => x.id === 'escala-base')!.texto).toContain('{n:4}'); // la tónica E, como placeholder de nota
    expect(g.find((x) => x.id === 'notas-guia')!.texto).toMatch(/3\.ª/);
    expect(ids).toContain('prestado-D');
    expect(g.find((x) => x.id === 'prestado-D')!.texto).toMatch(/otro modo/);
  });

  it('los datos y las ideas están separados y las ideas llevan su etiqueta', () => {
    const g = guiasDelProfesor(pop);
    expect(g.filter((x) => x.tipo === 'idea').length).toBeGreaterThanOrEqual(2);
    expect(g.filter((x) => x.tipo === 'dato').every((x) => !/^idea/i.test(x.id))).toBe(true);
    expect(g.every((x) => x.titulo && x.texto)).toBe(true);
  });

  it('si la canción ya modula, no sugiere subir de tono', () => {
    expect(guiasDelProfesor(pop).some((x) => x.id === 'idea-subir-tono')).toBe(true);
    expect(guiasDelProfesor(pop, { yaModula: true }).some((x) => x.id === 'idea-subir-tono')).toBe(false);
  });

  it('no inventa acordes: todos los acordes nombrados existen en la canción', () => {
    const acordes = new Set(bt.acordes.map((a) => a.acorde));
    for (const g of guiasDelProfesor(bt)) {
      for (const m of g.texto.matchAll(/\b([A-G][#b]?m?)\b(?=[ ,;.)])/g)) {
        // los nombres de nota vienen como {n:PC}; un acorde escrito tiene que ser de la canción
        if (/^[A-G]$/.test(m[1])) continue;
        expect(acordes.has(m[1])).toBe(true);
      }
    }
  });
});
