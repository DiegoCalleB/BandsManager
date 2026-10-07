import { describe, it, expect } from 'vitest';
import { notasParaDibujar, posicionesDeBajo } from '../vistaAcordes';

describe('vistaAcordes', () => {
  it('calcula las notas de cualquier acorde, en español o inglés', () => {
    expect(notasParaDibujar('Do')!.notas.sort((a, b) => a - b)).toEqual([0, 4, 7]);
    expect(notasParaDibujar('Lam')!.notas.sort((a, b) => a - b)).toEqual([0, 4, 9]);
    expect(notasParaDibujar('Sol#m')!.raiz).toBe(8);
    expect(notasParaDibujar('G7')!.notas).toContain(5);
    expect(notasParaDibujar('Instrumental')).toBeNull();
  });
  it('bajo: raíz en la cuerda grave si cabe, quinta y octava encima', () => {
    expect(posicionesDeBajo('E')).toEqual([
      { cuerda: 0, traste: 0, rol: 'raiz' }, { cuerda: 1, traste: 2, rol: 'quinta' }, { cuerda: 2, traste: 2, rol: 'octava' },
    ]);
    expect(posicionesDeBajo('Do')![0]).toEqual({ cuerda: 1, traste: 3, rol: 'raiz' });
  });
  it('slash: el bajo toca la nota del bajo', () => {
    expect(posicionesDeBajo('C/E')![0]).toMatchObject({ cuerda: 0, traste: 0 });
  });
});
