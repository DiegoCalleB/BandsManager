import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client
const mockEqChain = vi.fn().mockResolvedValue({ error: null });
const mockOr = vi.fn().mockReturnValue({ eq: mockEqChain });
const mockEq = vi.fn().mockReturnValue({ or: mockOr });
const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
const mockUpdate = vi.fn().mockReturnValue({ or: mockOr });
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



