import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ParentService } from '../parent.service';
import { supabase } from '../../supabase';

vi.mock('../../supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    })),
  }
}));

describe('ParentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signUp', () => {
    it('blocks sign up if phone already exists', async () => {
      // Mock phone exists
      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: { id: 'existing-id' }, error: null });
      
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
      });

      await expect(
        ParentService.signUp('test@test.com', 'password123', 'John Doe', '0812345678')
      ).rejects.toThrow('เบอร์โทรศัพท์นี้ถูกใช้ลงทะเบียนแล้ว');

      // Ensure auth.signUp was NEVER called
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });

    it('proceeds with sign up if phone is unique', async () => {
      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null }); // Phone unique
      const mockInsert = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'user-123', phone: '0812345678', name: 'John Doe' }, error: null });
      
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
        insert: mockInsert,
        single: mockSingle,
      });

      (supabase.auth.signUp as any).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const parent = await ParentService.signUp('test@test.com', 'password123', 'John Doe', '0812345678');
      
      expect(parent.id).toBe('user-123');
      expect(supabase.auth.signUp).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password123' });
      expect(mockInsert).toHaveBeenCalledWith([{ id: 'user-123', email: 'test@test.com', phone: '0812345678', name: 'John Doe' }]);
    });
  });

  describe('signIn', () => {
    it('throws PROFILE_MISSING if user logs in but has no profile', async () => {
      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: { id: 'user-456' } },
        error: null,
      });

      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null }); // No profile found
      
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
      });

      await expect(
        ParentService.signIn('test@test.com', 'password123')
      ).rejects.toThrow('PROFILE_MISSING');
    });

    it('returns parent data if profile exists', async () => {
      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: { id: 'user-456' } },
        error: null,
      });

      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({ 
        data: { id: 'user-456', name: 'Existing User' }, 
        error: null 
      });
      
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
      });

      const parent = await ParentService.signIn('test@test.com', 'password123');
      expect(parent.name).toBe('Existing User');
    });
  });
});
