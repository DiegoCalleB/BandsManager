import { describe, expect, it } from 'vitest';
import { mejorCancionParaArchivo } from '../emparejarAudiosDisco';
import type { Song } from '../../types';

const cancion = (id: string, titulo: string, ordenAlbum: number): Song => ({ id, titulo, ordenAlbum }) as Song;

const disco = [
  cancion('a', 'Git Push --force na Noite', 2),
  cancion('b', 'Centrar un Div (CSS Crisis)', 3),
  cancion('c', 'Stack Overflow Blues', 4),
];

describe('mejorCancionParaArchivo', () => {
  it('empareja por número de pista en el nombre', () => {
    expect(mejorCancionParaArchivo('03 - lo que sea.mp3', disco, new Set())).toBe('b');
    expect(mejorCancionParaArchivo('track 04.wav', disco, new Set())).toBe('c');
  });

  it('empareja por título contenido en el nombre', () => {
    expect(mejorCancionParaArchivo('Mi Banda - Stack Overflow Blues (master).mp3', disco, new Set())).toBe('c');
  });

  it('no repite una canción ya asignada', () => {
    expect(mejorCancionParaArchivo('Stack Overflow Blues.mp3', disco, new Set(['c']))).toBeNull();
  });

  it('un archivo sin coincidencia no se asigna a ninguna canción (antes pisaba la primera libre)', () => {
    expect(mejorCancionParaArchivo('Mi Banda - Tema nuevo sin pareja.mp3', disco, new Set())).toBeNull();
  });

  it('un título vacío no coincide con cualquier archivo', () => {
    expect(mejorCancionParaArchivo('algo.mp3', [cancion('x', '  ', 1)], new Set())).toBeNull();
  });
});
