import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BookingService } from '../booking.service';
import { supabase } from '../../supabase';
import { AppError } from '../../utils';

vi.mock('../../supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn()
    })),
    functions: {
      invoke: vi.fn()
    }
  }
}));

describe('BookingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSessions', () => {
    it('should fetch and return sessions within date range', async () => {
      const mockSessions = [{ id: 's1', session_date: '2023-12-01' }];
      
      const selectMock = vi.fn().mockReturnThis();
      const gteMock = vi.fn().mockReturnThis();
      const lteMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockResolvedValue({ data: mockSessions, error: null });
      
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: selectMock,
        gte: gteMock,
        lte: lteMock,
        order: orderMock
      } as any);

      const result = await BookingService.getSessions('2023-12-01', '2023-12-31');

      expect(result).toEqual(mockSessions);
      expect(supabase.from).toHaveBeenCalledWith('sessions');
    });

    it('should throw AppError on database error', async () => {
      const mockError = { message: 'Database failure', code: '500' };
      
      const orderMock = vi.fn().mockResolvedValue({ data: null, error: mockError });
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: orderMock
      } as any);

      await expect(BookingService.getSessions('2023-12-01', '2023-12-31'))
        .rejects
        .toThrow(AppError);
    });
  });


});
