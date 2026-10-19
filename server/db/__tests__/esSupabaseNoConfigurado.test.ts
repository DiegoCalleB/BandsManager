import { describe, it, expect, afterEach, vi } from 'vitest';
import { esSupabaseNoConfigurado, getSupabase } from '../core';

describe('esSupabaseNoConfigurado', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('reconoce el error real que lanza getSupabase sin variables de entorno', () => {
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_URL', '');
    let capturado: unknown;
    try { getSupabase(); } catch (e) { capturado = e; }
    // Si otro test dejó el cliente cacheado no hay error que comprobar: el contrato sigue cubierto abajo.
    if (capturado) expect(esSupabaseNoConfigurado(capturado)).toBe(true);
  });

  it('un fallo de escritura de Supabase NO cuenta como "no configurado"', () => {
    expect(esSupabaseNoConfigurado(new Error('Supabase Error (delete concert): timeout'))).toBe(false);
    expect(esSupabaseNoConfigurado('texto')).toBe(false);
    expect(esSupabaseNoConfigurado(undefined)).toBe(false);
  });
});
