import { describe, expect, it } from 'vitest';
import { pistasParaGuardar } from '../repertoire';

const stems = [
  { id: 'p1', nombre: 'Voz', audioUrl: 'v' },
  { id: 'p2', nombre: 'Bajo', audioUrl: 'b' },
];

describe('pistasParaGuardar', () => {
  it('espeja los stems de la idea de Iris', () => {
    expect(pistasParaGuardar([{ id: 'a', audioUrl: 'u', pistas: stems }], null)).toEqual(stems);
  });
  it('sin stems y sin columna en la fila (nueva o sin migrar) → no envía nada', () => {
    expect(pistasParaGuardar([{ id: 'a', audioUrl: 'u' }], null)).toBeUndefined();
    expect(pistasParaGuardar([], { id: 's1' })).toBeUndefined();
  });
  it('si la columna ya existe y la idea de Iris se borró, la vacía', () => {
    expect(pistasParaGuardar([], { id: 's1', pistas: stems })).toEqual([]);
  });
});
