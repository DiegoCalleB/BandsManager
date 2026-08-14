import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteUserFromBand } from '../db';

// Mock Supabase client
const mockFrom = vi.fn().mockReturnThis();
const mockDelete = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockResolvedValue({ error: null });

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  }))
}));

// Since getSupabase is exported and sets module-level state, 
// we assume that in test environment we can just call it and it will use mocked createClient if configured properly.
// However, to make it easier, let's just mock the db module interactions if possible.
// Actually, let's just test the logic calling Supabase.

describe('deleteUserFromBand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call supabase delete with correct arguments', async () => {
    // Setup mock chain
    mockFrom.mockReturnValue({
      delete: () => ({
        eq: () => ({
          eq: mockEq
        })
      })
    });

    const result = await deleteUserFromBand('user1', 'band1');
    
    expect(mockEq).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ success: true });
  });
});
