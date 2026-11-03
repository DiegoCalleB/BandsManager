import { describe, it, expect } from 'vitest';
import { normalizarTonalidad, formatearTonalidad, formatearAcorde, convertirTextoAcordes, normalizarTextoAcordes } from '../notacionAcordes';

describe('normalizarTonalidad (canónica = americana)', () => {
  it.each([
    ['Mim', 'Em'], ['Mi', 'E'], ['Fa#m', 'F#m'], ['Lam', 'Am'], ['Sol', 'G'], ['Sib', 'Bb'], ['Sim', 'Bm'],
    ['La Mayor', 'A'], ['Sol Mayor', 'G'], ['La menor', 'Am'], ['Do Mayor', 'C'], ['C Major', 'C'], ['G Major', 'G'],
    ['Mim / Em', 'Em'], ['Sol / G', 'G'], ['Em', 'Em'], ['E', 'E'], ['F#m', 'F#m'], ['Bb', 'Bb'], ['Do M', 'C'],
  ])('%s → %s', (entrada, esperado) => expect(normalizarTonalidad(entrada)).toBe(esperado));

  it('no toca lo que no es una tonalidad', () => {
    expect(normalizarTonalidad('N/A')).toBe('N/A');
    expect(normalizarTonalidad('Atonal')).toBe('Atonal');
    expect(normalizarTonalidad('')).toBe('');
    expect(normalizarTonalidad(null)).toBe('');
  });

  it('es idempotente', () => {
    for (const t of ['Mim', 'La Mayor', 'F#m', 'Bb', 'N/A']) expect(normalizarTonalidad(normalizarTonalidad(t))).toBe(normalizarTonalidad(t));
  });
});

describe('formatearTonalidad (lo que ve cada persona)', () => {
  it('americana: sin cambios; española: Do Re Mi con «m»', () => {
    expect(formatearTonalidad('Em', 'EN')).toBe('Em');
    expect(formatearTonalidad('E', 'ES')).toBe('Mi');
    expect(formatearTonalidad('Em', 'ES')).toBe('Mim');
    expect(formatearTonalidad('F#m', 'ES')).toBe('Fa#m');
    expect(formatearTonalidad('Bb', 'ES')).toBe('Sib');
  });
  it('ida y vuelta sin pérdidas', () => {
    for (const t of ['E', 'Em', 'F#m', 'Bb', 'C', 'Am', 'G', 'Dm']) expect(normalizarTonalidad(formatearTonalidad(t, 'ES'))).toBe(t);
  });
});

describe('acordes y cifrados', () => {
  it('acorde suelto y con bajo, conservando la ortografía', () => {
    expect(formatearAcorde('Mim7', 'EN')).toBe('Em7');
    expect(formatearAcorde('Bb', 'EN')).toBe('Bb'); // antes se reescribía como A#
    expect(formatearAcorde('Sol/Si', 'EN')).toBe('G/B');
    expect(formatearAcorde('Am7', 'ES')).toBe('Lam7');
  });
  it('cifrado: normaliza a americana sin tocar la letra', () => {
    const texto = '[Intro]\nMim  Do  Sol  Re\n[Mim]En la noche que caía [Do]sobre la ciudad';
    const fuera = normalizarTextoAcordes(texto);
    expect(fuera).toContain('Em  C  G  D');
    expect(fuera).toContain('[Em]En la noche que caía [C]sobre la ciudad');
    expect(convertirTextoAcordes(fuera, 'ES')).toContain('Mim  Do  Sol  Re');
  });
});
