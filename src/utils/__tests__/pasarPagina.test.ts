import { describe, expect, it } from 'vitest';
import { accionDeTecla, direccionDeSwipe } from '../pasarPagina';

describe('accionDeTecla (pedales bluetooth y teclado)', () => {
  it('flechas y RePág/AvPág pasan página; espacio es aparte', () => {
    expect(accionDeTecla('ArrowLeft')).toBe('atras');
    expect(accionDeTecla('PageUp')).toBe('atras');
    expect(accionDeTecla('ArrowRight')).toBe('adelante');
    expect(accionDeTecla('PageDown')).toBe('adelante');
    expect(accionDeTecla(' ')).toBe('espacio');
  });
  it('cualquier otra tecla no hace nada', () => {
    expect(accionDeTecla('a')).toBeNull();
    expect(accionDeTecla('Escape')).toBeNull();
  });
});

describe('direccionDeSwipe', () => {
  it('izquierda = siguiente, derecha = anterior', () => {
    expect(direccionDeSwipe(-80, 0, 60)).toBe('siguiente');
    expect(direccionDeSwipe(80, 0, 60)).toBe('anterior');
  });
  it('por debajo del umbral no cuenta', () => {
    expect(direccionDeSwipe(-59, 0, 60)).toBeNull();
    expect(direccionDeSwipe(34, 0, 35)).toBeNull();
  });
  it('un gesto más vertical que horizontal es scroll, no pasar página', () => {
    expect(direccionDeSwipe(-50, 60, 35)).toBeNull();
    expect(direccionDeSwipe(-50, 10, 35)).toBe('siguiente');
  });
  it('con dy = 0 no se comprueba la vertical', () => {
    expect(direccionDeSwipe(-61, 0, 60)).toBe('siguiente');
  });
});
