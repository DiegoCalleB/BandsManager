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
  });

  it('should call supabase delete on user_bands and update registered_bands', async () => {
    const result = await dbDeleteUserFromBand('user1', 'band1');

    expect(mockFrom).toHaveBeenCalledWith('user_bands');
    expect(mockFrom).toHaveBeenCalledWith('registered_bands');
    expect(result).toEqual({ success: true });
  });
});



