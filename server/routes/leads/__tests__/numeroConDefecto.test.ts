import { describe, expect, it } from 'vitest';
import { numeroConDefecto } from '../enrichment.js';

describe('numeroConDefecto (simulador de punto de equilibrio)', () => {
  it('aplica el valor por defecto si el campo falta (antes llegaba NaN al cálculo)', () => {
    expect(numeroConDefecto(undefined, 250)).toBe(250);
    expect(numeroConDefecto(null, 15)).toBe(15);
    expect(numeroConDefecto('', 150)).toBe(150);
  });

  it('respeta el 0: una sala sin alquiler es un caso válido', () => {
    expect(numeroConDefecto(0, 250)).toBe(0);
    expect(numeroConDefecto('0', 250)).toBe(0);
  });

  it('convierte texto numérico y descarta lo que no es un número', () => {
    expect(numeroConDefecto('320', 250)).toBe(320);
    expect(numeroConDefecto('mucho', 250)).toBe(250);
  });
});
