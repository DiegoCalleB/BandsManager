import { describe, it, expect } from 'vitest';
import { pistasDeCancion } from '../irisTracks';
import type { Song } from '../../types';

const cancion = (audioIdeas: unknown[]) => ({ audioIdeas }) as unknown as Song;
const pista = (id: string) => ({ id, nombre: id, audioUrl: `u/${id}`, autor: 'x' });

describe('pistasDeCancion', () => {
  it('sin canción o sin ideas devuelve vacío', () => {
    expect(pistasDeCancion(null)).toEqual([]);
    expect(pistasDeCancion(cancion([]))).toEqual([]);
  });
  it('ignora ideas sin stems', () => {
    expect(pistasDeCancion(cancion([{ id: 'a', titulo: 'a', audioUrl: 'u' }]))).toEqual([]);
  });
  it('devuelve las pistas de la idea separada por Iris', () => {
    const pistas = [pista('voz'), pista('bajo')];
    expect(pistasDeCancion(cancion([{ id: 'a', audioUrl: 'u', pistas }]))).toEqual(pistas);
  });
});

describe('pistasDeCancion con songs.pistas', () => {
  const pistas = [
    { id: 'p1', nombre: 'Voz', audioUrl: 'v' },
    { id: 'p2', nombre: 'Bajo', audioUrl: 'b' },
  ];
  it('si la idea de Iris ya no está, valen las pistas guardadas en la canción', () => {
    expect(pistasDeCancion({ audioIdeas: [], pistas } as never)).toEqual(pistas);
  });
  it('si hay song.pistas, manda la canción (todas las escrituras la espejan vía cancionConIdeas)', () => {
    const nuevas = [...pistas, { id: 'p3', nombre: 'Batería', audioUrl: 'd' }];
    const song = { audioIdeas: [{ id: 'a', titulo: 'a', audioUrl: 'u', pistas: nuevas }], pistas } as never;
    expect(pistasDeCancion(song)).toEqual(pistas);
  });
});
