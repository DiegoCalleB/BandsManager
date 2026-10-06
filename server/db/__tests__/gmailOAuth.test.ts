// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { describe, it, expect } from 'vitest';
import { toSafeGmailOAuthResponse } from '../gmailOAuth';

describe('toSafeGmailOAuthResponse', () => {
  it('nunca incluye refresh_token en la respuesta cuando hay una cuenta conectada', () => {
    const result = toSafeGmailOAuthResponse({
      band_id: 'band-test',
      gmail_email: 'banda@gmail.com',
      refresh_token: 'super-secreto-no-debe-salir',
      scope: 'https://www.googleapis.com/auth/gmail.compose'
    });

    expect(result.connected).toBe(true);
    expect(result.gmail_email).toBe('banda@gmail.com');
    expect(result).not.toHaveProperty('refresh_token');
    expect(JSON.stringify(result)).not.toContain('super-secreto-no-debe-salir');
  });

  it('devuelve connected: false sin ninguna otra propiedad cuando no hay cuenta', () => {
    const result = toSafeGmailOAuthResponse(null);
    expect(result).toEqual({ connected: false });
  });
});
