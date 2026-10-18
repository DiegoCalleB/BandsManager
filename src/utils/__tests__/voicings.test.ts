import { describe, it, expect } from 'vitest';
import { CUERDAS_GUITARRA, etiquetaIntervalo, inversionesGuitarra, notaDePasoHacia, pasoEnGuitarra, powerChord } from '../voicings';

const pcsDe = (trastes: number[]) =>
  trastes.map((t, i) => (t < 0 ? null : (CUERDAS_GUITARRA[i] + t) % 12)).filter((p): p is number => p !== null);

describe('powerChord', () => {
  it('E se toca desde la 6.ª cuerda al aire', () => {
    expect(powerChord('E')?.trastes).toEqual([0, 2, 2, -1, -1, -1]);
  });
  it('A se toca desde la 5.ª cuerda', () => {
    expect(powerChord('A')?.trastes).toEqual([-1, 0, 2, 2, -1, -1]);
  });
  it('G usa la 6.ª (traste 3) y B la 5.ª (traste 2)', () => {
    expect(powerChord('G')?.trastes).toEqual([3, 5, 5, -1, -1, -1]);
    expect(powerChord('B')?.trastes).toEqual([-1, 2, 4, 4, -1, -1]);
  });
  it('solo contiene raíz y quinta (la 3.ª no existe)', () => {
    const f = powerChord('Am')!;
    expect(f.notas.map((n) => n.intervalo)).toEqual(['1', '5', '1']);
  });
  it('devuelve null con un acorde ilegible', () => {
    expect(powerChord('???')).toBeNull();
  });
});

describe('inversionesGuitarra', () => {
  it('C mayor tiene tres inversiones con 1.ª, 3.ª y 5.ª en el bajo', () => {
    const formas = inversionesGuitarra('C');
    expect(formas.map((f) => f.inversion)).toEqual([0, 1, 2]);
    expect(formas.map((f) => f.nombre)).toEqual(['Fundamental', '1.ª inversión', '2.ª inversión']);
    formas.forEach((f, i) => {
      expect(f.notas[0].intervalo).toBe(['1', '3', '5'][i]);
      expect(new Set(pcsDe(f.trastes))).toEqual(new Set([0, 4, 7]));
    });
  });
  it('un acorde con 7.ª tiene cuatro inversiones', () => {
    const formas = inversionesGuitarra('G7');
    expect(formas).toHaveLength(4);
    expect(formas[3].notas[0].intervalo).toBe('♭7');
  });
  it('cada forma cabe en 4 trastes', () => {
    for (const f of inversionesGuitarra('Dm7')) {
      const pisadas = f.trastes.filter((t) => t > 0);
      expect(Math.max(...pisadas) - Math.min(...pisadas)).toBeLessThanOrEqual(3);
    }
  });
});

describe('nota de paso', () => {
  it('de C a F la nota de paso es E (semitono bajo F)', () => {
    expect(notaDePasoHacia('C', 'F')?.pc).toBe(4);
  });
  it('sin siguiente o con la misma raíz no hay nota de paso', () => {
    expect(notaDePasoHacia('C', null)).toBeNull();
    expect(notaDePasoHacia('C', 'Cmaj7')).toBeNull();
  });
  it('se coloca cerca de la mano y suena la nota pedida', () => {
    for (const a of ['C', 'Am', 'G7']) {
      const forma = inversionesGuitarra(a)[0];
      const paso = pasoEnGuitarra(forma, 4)!;
      expect((CUERDAS_GUITARRA[paso.cuerda] + paso.traste) % 12).toBe(4);
      expect(Math.abs(paso.traste - forma.base)).toBeLessThanOrEqual(5);
    }
  });
});

describe('etiquetaIntervalo', () => {
  it('nombra los intervalos como un músico', () => {
    expect([0, 3, 4, 7, 10, 11].map((s) => etiquetaIntervalo(s, 0))).toEqual(['1', '♭3', '3', '5', '♭7', '7']);
  });
});
