import { describe, expect, it } from 'vitest';
import { describirClaveSupabase } from '../core';

const jwtConRol = (rol: string) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role: rol })).toString('base64url')}.firma`;

describe('describirClaveSupabase', () => {
  it('distingue el formato nuevo, el JWT legacy y la ausencia de clave', () => {
    expect(describirClaveSupabase(undefined)).toBe('ausente');
    expect(describirClaveSupabase('')).toBe('ausente');
    expect(describirClaveSupabase('sb_secret_abc123')).toBe('sb_secret');
    expect(describirClaveSupabase(jwtConRol('service_role'))).toBe('jwt:service_role');
    expect(describirClaveSupabase(jwtConRol('anon'))).toBe('jwt:anon');
    expect(describirClaveSupabase('otra-cosa')).toBe('formato desconocido');
  });

  it('avisa de que una publishable no vale para el backend', () => {
    expect(describirClaveSupabase('sb_publishable_abc')).toContain('no vale para el backend');
  });

  it('avisa de espacios o saltos de línea pegados por error', () => {
    expect(describirClaveSupabase('sb_secret_abc\n')).toContain('CONTIENE ESPACIOS');
    expect(describirClaveSupabase(' sb_secret_abc')).toContain('CONTIENE ESPACIOS');
    expect(describirClaveSupabase('sb_secret_abc')).not.toContain('CONTIENE');
  });

  it('nunca incluye la clave en lo que devuelve', () => {
    for (const clave of ['sb_secret_SECRETO123', `${jwtConRol('service_role')}`, 'raro-SECRETO123']) {
      const texto = describirClaveSupabase(clave);
      expect(texto).not.toContain('SECRETO123');
      expect(texto).not.toContain('firma');
    }
  });
});
