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
  it('vale lo que llega en song.pistas, y un [] explícito los borra', () => {
    expect(pistasParaGuardar([], { id: 's1', pistas: [] }, stems)).toEqual(stems);
    expect(pistasParaGuardar([], { id: 's1', pistas: stems }, [])).toEqual([]);
  });
  it('manda song.pistas aunque la idea (sin limpiar) traiga otros stems', () => {
    const viejos = [{ id: 'p9', nombre: 'Batería', audioUrl: 'd' }];
    expect(pistasParaGuardar([{ id: 'a', audioUrl: 'u', pistas: viejos }], { id: 's1', pistas: viejos }, stems)).toEqual(stems);
  });
  it('si la canción no trae pistas, el espejo de la idea cubre lo no migrado', () => {
    expect(pistasParaGuardar([{ id: 'a', audioUrl: 'u', pistas: stems }], { id: 's1', pistas: [] })).toEqual(stems);
  });
});
