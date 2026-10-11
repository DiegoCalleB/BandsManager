import { describe, expect, it } from 'vitest';
import { DEFAULT_BAND_MEMBERS, resolveBandMembers } from '../repertorioUtils';

describe('resolveBandMembers', () => {
  it('usa los miembros reales de la banda cuando los hay', () => {
    const r = resolveBandMembers([{ id: 'u1', name: 'Ana', instrument: 'Voz' }]);
    expect(r).toEqual([expect.objectContaining({ id: 'u1', name: 'Ana', instrument: 'Voz' })]);
  });

  it('cae en los puestos genéricos si la banda no tiene miembros cargados', () => {
    expect(resolveBandMembers([])).toBe(DEFAULT_BAND_MEMBERS);
    expect(resolveBandMembers(undefined)).toBe(DEFAULT_BAND_MEMBERS);
  });

  it('añade los miembros que solo aparecen en las notas de una canción', () => {
    const r = resolveBandMembers([], { invitado: 'toca el solo' });
    expect(r.map((m) => m.name)).toEqual(['Invitado']);
  });
});
