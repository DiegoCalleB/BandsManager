// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client
// dbDeleteUserFromBand usa ahora .in() (array de candidatos) en vez de interpolar el band_id
// dentro del DSL de texto de .or(), que era inyectable (ver server/db/users.ts).
// user_bands: .delete().eq('user_id', ...).in('band_id', ...)
const mockDeleteIn = vi.fn().mockResolvedValue({ error: null });
const mockDeleteEq = vi.fn().mockReturnValue({ in: mockDeleteIn });
const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq });
// registered_bands: .update({...}).in('band_id', ...).eq('user_id', ...)
const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
const mockUpdateIn = vi.fn().mockReturnValue({ eq: mockUpdateEq });
const mockUpdate = vi.fn().mockReturnValue({ in: mockUpdateIn });
const mockFrom = vi.fn().mockImplementation((table: string) => {
  if (table === 'user_bands') {
    return { delete: mockDelete };
  }
  if (table === 'registered_bands') {
    return { update: mockUpdate };
  }
  return {};
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom
  }))
}));

import { dbDeleteUserFromBand } from '../db';

describe('dbDeleteUserFromBand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // getSupabase() exige URL+key no vacíos antes de llamar a createClient
    // (que ya está mockeado arriba) - sin esto el test falla en CI/local sin
    // un .env real, aunque createClient nunca use estos valores de verdad.
    vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'eyJtest');
  });

  it('should call supabase delete on user_bands and update registered_bands', async () => {
    const result = await dbDeleteUserFromBand('user1', 'band1');

    expect(mockFrom).toHaveBeenCalledWith('user_bands');
    expect(mockFrom).toHaveBeenCalledWith('registered_bands');
    expect(result).toEqual({ success: true });
  });
});



