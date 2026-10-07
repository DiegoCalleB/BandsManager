import { describe, it, expect } from 'vitest';
import { isSongMarkedForMember, withSongMarkedForMember } from '../repertorioUtils';

describe('isSongMarkedForMember', () => {
  const song = {
    notasPorMiembro: [
      { userId: 'u1', memberName: 'Ana', nota: '', mostrarTono: true },
      { userId: 'u2', memberName: 'Luis', nota: 'x' },
    ],
  };

  it('reconoce la marca por id o por nombre', () => {
    expect(isSongMarkedForMember(song, 'u1', 'Ana')).toBe(true);
    expect(isSongMarkedForMember(song, undefined, 'ANA')).toBe(true);
  });

  it('no marca a quien no la activó ni a canciones sin notas', () => {
    expect(isSongMarkedForMember(song, 'u2', 'Luis')).toBe(false);
    expect(isSongMarkedForMember({}, 'u1', 'Ana')).toBe(false);
    expect(isSongMarkedForMember(undefined, 'u1', 'Ana')).toBe(false);
  });
});

describe('withSongMarkedForMember', () => {
  it('crea la marca sin mutar el original', () => {
    const song = { id: 's' } as any;
    const out = withSongMarkedForMember(song, 'u1', 'Ana', true);
    expect(isSongMarkedForMember(out, 'u1', 'Ana')).toBe(true);
    expect(song.notasPorMiembro).toBeUndefined();
  });

  it('al desmarcar conserva la nota del músico', () => {
    const song = { notasPorMiembro: [{ userId: 'u1', memberName: 'Ana', nota: 'hola', mostrarTono: true }] } as any;
    const out = withSongMarkedForMember(song, 'u1', 'Ana', false);
    expect(isSongMarkedForMember(out, 'u1', 'Ana')).toBe(false);
    expect(out.notasPorMiembro?.[0]?.nota).toBe('hola');
  });

  it('sin cambios devuelve el mismo objeto', () => {
    const song = { id: 's' } as any;
    expect(withSongMarkedForMember(song, 'u1', 'Ana', false)).toBe(song);
  });
});
