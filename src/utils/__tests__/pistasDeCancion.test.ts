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
