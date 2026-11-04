import { describe, it, expect } from 'vitest';
import { INITIAL_USERS } from '../../src/db_seed';

/**
 * Las cuentas de personas reales viven SOLO en Supabase. La semilla (src/db_seed.ts) la recrea el
 * servidor al arrancar si falta ese usuario y le pone email de ejemplo y contraseña conocida:
 * el mánager real "jose" no puede estar ahí (sus bandas y vínculos están en Supabase).
 */
describe('la semilla no contiene cuentas reales', () => {
  it('no hay usuario semilla "user-jose" ni username "jose"', () => {
    expect(INITIAL_USERS.map(u => u.id)).not.toContain('user-jose');
    expect(INITIAL_USERS.map(u => u.username.toLowerCase())).not.toContain('jose');
  });
});
