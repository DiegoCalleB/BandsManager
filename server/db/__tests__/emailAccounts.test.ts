import { describe, it, expect } from 'vitest';
import { toSafeEmailAccountResponse } from '../emailAccounts';

describe('toSafeEmailAccountResponse', () => {
  it('nunca incluye app_password en la respuesta cuando hay una cuenta conectada', () => {
    const result = toSafeEmailAccountResponse({
      band_id: 'band-test',
      provider: 'gmail',
      email: 'banda@gmail.com',
      app_password: 'super-secreta-no-debe-salir',
      smtp_host: 'smtp.gmail.com',
      smtp_port: 465,
      smtp_secure: true,
      imap_host: 'imap.gmail.com',
      imap_port: 993
    });

    expect(result.connected).toBe(true);
    expect(result.email).toBe('banda@gmail.com');
    expect(result).not.toHaveProperty('app_password');
    expect(JSON.stringify(result)).not.toContain('super-secreta-no-debe-salir');
  });

  it('devuelve connected: false sin ninguna otra propiedad cuando no hay cuenta', () => {
    const result = toSafeEmailAccountResponse(null);
    expect(result).toEqual({ connected: false });
  });
});
