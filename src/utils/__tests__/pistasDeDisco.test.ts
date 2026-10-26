import { describe, expect, it } from 'vitest';
import type { Song } from '../../types';
import { siguientePista } from '../pistasDeDisco';

const cancion = (ordenAlbum?: number) => ({ id: `s${ordenAlbum}`, titulo: 't', ordenAlbum } as Song);

describe('siguientePista', () => {
  it('es la siguiente a la mayor del disco', () => {
    expect(siguientePista([cancion(1), cancion(2), cancion(8)])).toBe(9);
  });
  it('cuenta las canciones si no tienen número de pista', () => {
    expect(siguientePista([cancion(), cancion(), cancion()])).toBe(4);
  });
  it('tiene en cuenta las que se acaban de crear en la misma subida', () => {
    expect(siguientePista([cancion(1), cancion(2)], [cancion(3)])).toBe(4);
  });
  it('un disco vacío empieza en 1', () => {
    expect(siguientePista([])).toBe(1);
  });
});
