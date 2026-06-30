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

  describe('bookClass', () => {
    it('should call rpc to book class and return data', async () => {
      const mockChild = { nickname: 'Kiddo' };
      const mockParent = { phone: '1234567890' };
      const mockRpcResult = { success: true, booking_id: 'b1' };

      vi.mocked(supabase.from)
        .mockReturnValueOnce({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: mockChild }) } as any)
        .mockReturnValueOnce({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: mockParent }) } as any);

      vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: mockRpcResult, error: null } as never);

      const result = await BookingService.bookClass('p1', 'c1', 's1');

      expect(result).toEqual(mockRpcResult);
      expect(supabase.rpc).toHaveBeenCalledWith('book_class_transactionally', expect.any(Object));
    });
  });
});
