import { afterEach, describe, expect, it } from 'vitest';
import { esCuentaDeBrais } from '../cuentaBrais';

afterEach(() => {
  delete process.env.BRAIS_EMAILS;
});

describe('esCuentaDeBrais', () => {
  it('reconoce la cuenta sembrada y el email exacto', () => {
    expect(esCuentaDeBrais({ id: 'user-mouredev' })).toBe(true);
    expect(esCuentaDeBrais({ email: 'mouredev@gmail.com' })).toBe(true);
    expect(esCuentaDeBrais({ email: ' MoureDev@Gmail.com ' })).toBe(true);
  });

  it('NO se deja engañar por emails que solo contienen la palabra (el hueco de la auditoría)', () => {
    for (const email of ['brais@loquesea.com', 'xmouredevx@x.com', 'mouredev@evil.com', 'brais.moure@gmail.com']) {
      expect(esCuentaDeBrais({ email })).toBe(false);
    }
  });

  it('acepta emails extra por configuración y rechaza vacíos', () => {
    process.env.BRAIS_EMAILS = 'brais@moure.dev, otro@x.com';
    expect(esCuentaDeBrais({ email: 'brais@moure.dev' })).toBe(true);
    expect(esCuentaDeBrais({ email: '' })).toBe(false);
    expect(esCuentaDeBrais(null)).toBe(false);
  });
});
