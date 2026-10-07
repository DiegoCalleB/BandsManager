import { describe, it, expect } from 'vitest';
import { ajustesDeModoAtril } from '../modosAtril';

describe('ajustesDeModoAtril', () => {
  it('Estudiar: todo a la vista, diagramas solo en escritorio', () => {
    expect(ajustesDeModoAtril('Estudiar', 1280)).toEqual({ diagramas: true, oido: true, escucha: 'todo' });
    expect(ajustesDeModoAtril('Estudiar', 390).diagramas).toBe(false);
  });
  it('Ensayar: suena la banda sin mi pista', () => {
    expect(ajustesDeModoAtril('Ensayar', 1280).escucha).toBe('sin');
  });
  it('Tocar: hoja limpia', () => {
    expect(ajustesDeModoAtril('Tocar', 1280)).toEqual({ diagramas: false, oido: false, escucha: 'todo' });
  });
});
