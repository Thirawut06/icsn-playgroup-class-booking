import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminUserService } from '../admin-user.service';
import { supabase } from '../../supabase';

vi.mock('../../supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
      update: vi.fn()
    }))
  }
}));

describe('AdminUserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllUsersClassified', () => {
    it('should calculate total credits and classify correctly based on packages', async () => {
      const mockData = [
        {
          id: 'user1',
          name: 'John Doe',
          created_at: '2023-01-01T00:00:00Z',
          packages: [{ credits_remaining: 5, type: 'standard' }],
          children: [{ nickname: 'Johnny' }]
        },
        {
          id: 'user2',
          name: 'Jane Smith',
          created_at: '2023-02-01T00:00:00Z',
          packages: [{ credits_remaining: 1, type: 'trial' }],
          children: [{ nickname: 'Jenny' }]
        }
      ];

      const selectMock = vi.fn().mockResolvedValue({ data: mockData, error: null });
      vi.mocked(supabase.from).mockReturnValueOnce({ select: selectMock } as any);

      const result = await AdminUserService.getAllUsersClassified();

      expect(result).toHaveLength(2);
      expect(result.find(u => u.id === 'user1')?.category).toBe('payment');
      expect(result.find(u => u.id === 'user1')?.total_credits).toBe(5);
      expect(result.find(u => u.id === 'user2')?.category).toBe('trial');
      expect(result.find(u => u.id === 'user2')?.total_credits).toBe(1);
    });
  });
});
