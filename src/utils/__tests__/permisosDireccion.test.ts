import { describe, expect, it } from 'vitest';
import { puedeCrearConcierto } from '../permisosDireccion';

describe('puedeCrearConcierto', () => {
  it('solo dirección (líder o admin) crea conciertos y giras', () => {
    expect(puedeCrearConcierto('leader')).toBe(true);
    expect(puedeCrearConcierto('admin')).toBe(true);
    expect(puedeCrearConcierto('member')).toBe(false);
    expect(puedeCrearConcierto(undefined)).toBe(false);
  });
});
