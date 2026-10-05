import { describe, it, expect } from 'vitest';
import { defaultDonationCents } from '../donations';

// El resto de donations.ts son llamadas a Stripe/Supabase (igual que billing.ts,
// sin supertest en el repo). Lo único puro y con lógica de negocio real -el
// suelo/techo del importe sugerido- se prueba aislado.

describe('defaultDonationCents', () => {
  it('usa la deuda real cuando supera el mínimo de Stripe', () => {
    expect(defaultDonationCents(1234)).toBe(1234);
  });

  it('nunca baja del mínimo de 0,50€ que exige Stripe para EUR', () => {
    expect(defaultDonationCents(0)).toBe(50);
    expect(defaultDonationCents(10)).toBe(50);
  });

  it('nunca supera el techo de donación configurado', () => {
    expect(defaultDonationCents(999999)).toBe(50000);
  });

  it('redondea importes fraccionarios', () => {
    expect(defaultDonationCents(123.6)).toBe(124);
  });
});
