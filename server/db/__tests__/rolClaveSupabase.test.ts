import { describe, expect, it } from 'vitest';
import { rolDeClaveSupabase } from '../core';

const jwt = (payload: object) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.firma`;

describe('rolDeClaveSupabase', () => {
  it('lee el rol del payload', () => {
    expect(rolDeClaveSupabase(jwt({ role: 'service_role' }))).toBe('service_role');
    expect(rolDeClaveSupabase(jwt({ role: 'anon' }))).toBe('anon');
  });
  it('devuelve null con claves que no son JWT', () => {
    expect(rolDeClaveSupabase('sb_secret_abc')).toBeNull();
    expect(rolDeClaveSupabase('')).toBeNull();
  });
});
