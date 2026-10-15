import { describe, it, expect } from 'vitest';
import { pistaDelUsuario, pistasParaModo } from '../mezclaStems';
import type { AudioTrack } from '../../types';

const pistas: AudioTrack[] = [
  { id: 'v', nombre: 'Voz', audioUrl: 'v.mp3' },
  { id: 'b', nombre: 'Bajo', audioUrl: 'b.mp3' },
  { id: 'd', nombre: 'Stem 3', instrumento: 'Batería', audioUrl: 'd.mp3' },
];

describe('mezclaStems', () => {
  it('encuentra mi pista por nombre o por instrumento', () => {
    expect(pistaDelUsuario(pistas, 'bajo')?.id).toBe('b');
    expect(pistaDelUsuario(pistas, 'bateria')?.id).toBe('d');
    expect(pistaDelUsuario(pistas, 'guitarra')).toBeNull();
    expect(pistaDelUsuario(pistas, null)).toBeNull();
  });
  it('solo = mi pista; sin = todas menos la mía; todo = audio original', () => {
    expect(pistasParaModo(pistas, 'b', 'solo').map((p) => p.id)).toEqual(['b']);
    expect(pistasParaModo(pistas, 'b', 'sin').map((p) => p.id)).toEqual(['v', 'd']);
    expect(pistasParaModo(pistas, 'b', 'todo')).toEqual([]);
  });
  it('sin pista elegida (o inexistente) no filtra nada', () => {
    expect(pistasParaModo(pistas, null, 'sin')).toEqual([]);
    expect(pistasParaModo(pistas, 'zzz', 'solo')).toEqual([]);
  });
});
