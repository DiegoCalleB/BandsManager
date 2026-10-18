import path from 'path';
import { describe, expect, it } from 'vitest';
import { resolverDentroDe } from '../rutaContenida';

const BASE = path.join(path.sep, 'srv', 'app', 'public');

describe('resolverDentroDe', () => {
  it('resuelve rutas legítimas bajo la base, incluidas las que empiezan por /', () => {
    expect(resolverDentroDe(BASE, 'uploads', 'cancion.mp3')).toBe(path.join(BASE, 'uploads', 'cancion.mp3'));
    expect(resolverDentroDe(BASE, '/uploads/stems/a.wav')).toBe(path.join(BASE, 'uploads', 'stems', 'a.wav'));
  });

  it('rechaza el recorrido de directorios con ..', () => {
    expect(resolverDentroDe(BASE, '../../../etc/passwd')).toBeNull();
    expect(resolverDentroDe(BASE, '/uploads/../../secreto.env')).toBeNull();
    expect(resolverDentroDe(BASE, 'uploads', '..')).toBeNull();
    expect(resolverDentroDe(BASE, '..')).toBeNull();
  });

  it('rechaza una ruta absoluta incrustada y la propia base', () => {
    expect(resolverDentroDe(BASE, '/../../etc/shadow')).toBeNull();
    expect(resolverDentroDe(BASE, '')).toBeNull();
    expect(resolverDentroDe(BASE, '/')).toBeNull();
  });

  it('rechaza un hermano con el mismo prefijo (public-secreto)', () => {
    expect(resolverDentroDe(BASE, '../public-secreto/x.mp3')).toBeNull();
  });
});
