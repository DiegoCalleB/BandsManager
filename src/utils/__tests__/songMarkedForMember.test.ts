import { describe, it, expect } from 'vitest';
import { isSongMarkedForMember } from '../repertorioUtils';

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
