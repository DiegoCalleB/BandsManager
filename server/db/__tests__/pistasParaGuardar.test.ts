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
  it('si la idea de Iris se borró, la canción conserva sus stems', () => {
    expect(pistasParaGuardar([], { id: 's1', pistas: stems })).toEqual(stems);
  });
  it('sin idea de Iris vale lo que llega en song.pistas, y un [] explícito los borra', () => {
    expect(pistasParaGuardar([], { id: 's1', pistas: [] }, stems)).toEqual(stems);
    expect(pistasParaGuardar([], { id: 's1', pistas: stems }, [])).toEqual([]);
  });
  it('si la idea trae stems manda el espejo de la idea', () => {
    const nuevos = [{ id: 'p9', nombre: 'Batería', audioUrl: 'd' }, ...stems];
    expect(pistasParaGuardar([{ id: 'a', audioUrl: 'u', pistas: nuevos }], { id: 's1', pistas: stems }, stems)).toEqual(nuevos);
  });
});
