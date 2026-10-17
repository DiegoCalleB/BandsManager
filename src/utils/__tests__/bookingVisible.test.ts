import { describe, expect, it } from 'vitest';
import { moduloDeBookingOculto, MODULOS_BOOKING } from '../bookingVisible';

describe('moduloDeBookingOculto', () => {
  it.each(MODULOS_BOOKING)('oculta %s a una banda sin acceso', (id) => {
    expect(moduloDeBookingOculto(id, false)).toBe(true);
  });

  it.each(MODULOS_BOOKING)('lo deja ver (%s) a una banda con acceso', (id) => {
    expect(moduloDeBookingOculto(id, true)).toBe(false);
  });

  it.each(['resumen', 'calendario', 'epk', 'chat', 'finanzas', 'planes'])('nunca oculta %s', (id) => {
    expect(moduloDeBookingOculto(id, false)).toBe(false);
  });
});
