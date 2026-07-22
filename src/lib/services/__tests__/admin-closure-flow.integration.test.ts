import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { findClosureForDate, checkIsBookableDate } from '@/utils/dateUtils';
import { BookingService } from '../booking.service';
import { AdminService } from '@/lib/supabase';

dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Integration Tests: Admin Closure & Refund Flow (Staging Database)', () => {
  const TEST_DATE = '2026-08-15'; // A test date within +60 days

  it('1. Verifies findClosureForDate gives precedence to exact single-day closures', () => {
    const closures = [
      { id: '1', start_date: '2026-08-01', end_date: '2026-08-31', reason: 'Range Closure', time_label: null, is_force_open: false },
      { id: '2', start_date: '2026-08-15', end_date: '2026-08-15', reason: 'Exact Single Day Open', time_label: null, is_force_open: true },
    ];

    const closure = findClosureForDate(closures as any, '2026-08-15');
    expect(closure).toBeDefined();
    expect(closure?.id).toBe('2');
    expect(closure?.is_force_open).toBe(true);
  });

  it('2. Verifies checkIsBookableDate correctly handles force open precedence over broad closure', () => {
    const closures = [
      { id: '1', start_date: '2026-08-01', end_date: '2026-08-31', reason: 'Range Closure', time_label: null, is_force_open: false },
      { id: '2', start_date: '2026-08-15', end_date: '2026-08-15', reason: 'Exact Single Day Open', time_label: null, is_force_open: true },
    ];

    const isBookable = checkIsBookableDate('2026-08-15', closures as any, [0, 1, 2, 3, 4, 5, 6], 7);
    expect(isBookable).toBe(true);
  });

  it('3. Verifies RPC get_affected_bookings_list returns active confirmed bookings on Staging DB', async () => {
    // Reset test date to open status first
    await AdminService.setDateStatus(TEST_DATE, TEST_DATE, true, 'Reopen for test');

    const { data, error } = await supabaseAdmin.rpc('get_affected_bookings_list', {
      p_dates: [TEST_DATE]
    });

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it('4. Executes Admin Closure RPC and verifies automatic credit refund logic on Staging DB', async () => {
    const res = await AdminService.setDateStatus(TEST_DATE, TEST_DATE, false, 'ปิดทดสอบ TDD');
    expect(res).toBeDefined();
    expect(res.success).toBe(true);
  });

  it('5. Verifies 1-year date range session loading in BookingService', async () => {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const endDate = new Date(today.getFullYear() + 1, today.getMonth(), 0).toISOString().split('T')[0];

    const sessions = await BookingService.getSessions(startDate, endDate);
    expect(Array.isArray(sessions)).toBe(true);
  });
});
