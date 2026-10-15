import { describe, it, expect } from 'vitest';
import { puedeQuitarMarcaCartel } from '../../planPermissions';
import { esPlanGratuito } from '../../../../server/utils/referidos';

describe('marca BandManager en el cartel', () => {
  it('solo los planes de pago pueden quitarla, con la misma lista que la insignia del servidor', () => {
    for (const plan of ['promo', 'promo_plus', 'ensayo', 'local', 'de_gira', 'cabeza_de_cartel'] as const) {
      expect(puedeQuitarMarcaCartel(plan), plan).toBe(!esPlanGratuito(plan));
    }
  });

  it('sin plan conocido, la marca no se puede quitar', () => {
    expect(puedeQuitarMarcaCartel(undefined)).toBe(false);
    expect(puedeQuitarMarcaCartel('inventado')).toBe(false);
  });
});
