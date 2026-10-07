import { describe, it, expect } from 'vitest';
import { notasParaDibujar, lineaDeBajo, contextoDeAcordes, ordenarPorTonica } from '../vistaAcordes';
import { parseTonalidad } from '../teoriaArmonica';

describe('vistaAcordes', () => {
  it('calcula las notas de cualquier acorde, en español o inglés, sin inventar séptimas', () => {
    expect(notasParaDibujar('Do')!.notas.sort((a, b) => a - b)).toEqual([0, 4, 7]);
    expect(notasParaDibujar('Lam')!.notas.sort((a, b) => a - b)).toEqual([0, 4, 9]);
    expect(notasParaDibujar('Sol#m')!.raiz).toBe(8);
    expect(notasParaDibujar('G7')!.notas).toContain(5);
    expect(notasParaDibujar('Instrumental')).toBeNull();
  });
  it('bajo: raíz, 3.ª, 5.ª y nota de paso a un semitono del acorde siguiente', () => {
    const l = lineaDeBajo('E', 'A')!;
    expect(l.map((n) => n.rol)).toEqual(['raiz', 'tercera', 'quinta', 'paso']);
    expect(l[0]).toMatchObject({ cuerda: 0, traste: 0 });
    const pasoPc = l[3].pitch % 12; // G# (8) o A# (10) → a un semitono de A (9)
    expect([8, 10]).toContain(pasoPc);
  });
  it('bajo sin siguiente: cierra con la octava; slash usa el bajo', () => {
    expect(lineaDeBajo('Am')!.map((n) => n.rol)).toEqual(['raiz', 'tercera', 'quinta', 'octava']);
    expect(lineaDeBajo('C/E')![0]).toMatchObject({ cuerda: 0, traste: 0 });
  });
  it('contexto: función por grado y acorde que más veces sigue', () => {
    const texto = '[E] [A] [E] [A] [E] [B]';
    const m = contextoDeAcordes(texto, ['E', 'A', 'B'], parseTonalidad('E'), 0);
    expect(m.get('E')!.siguiente).toBe('A');
    expect(m.get('E')!.info!.funcion).toBe('T');
    expect(m.get('B')!.info!.funcion).toBe('D');
  });
  it('tónica marcada y orden por distancia a ella (también transpuesta)', () => {
    const texto = '[B] [A] [E] [C#m] [E]';
    const m = contextoDeAcordes(texto, ['B', 'A', 'E', 'C#m'], parseTonalidad('E'), 0);
    expect(m.get('E')!.tonica).toBe(true);
    expect(m.get('B')!.tonica).toBe(false);
    expect(ordenarPorTonica(['B', 'A', 'E', 'C#m'], m)).toEqual(['E', 'A', 'B', 'C#m']);
    const t = contextoDeAcordes('[F] [Bb] [C]', ['F', 'Bb', 'C'], parseTonalidad('E'), 1);
    expect(t.get('F')!.tonica).toBe(true);
  });
});
