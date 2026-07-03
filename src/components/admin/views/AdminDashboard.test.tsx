import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AdminDashboard } from './AdminDashboard';
import React from 'react';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
  AdminService: {
    getPendingSlips: vi.fn().mockResolvedValue([]),
    getAllChildren: vi.fn().mockResolvedValue([]),
    getAllParentsWithCredits: vi.fn().mockResolvedValue([]),
    getDailyAttendance: vi.fn().mockResolvedValue([]),
    getSessionForDate: vi.fn().mockResolvedValue(null),
    getRecentBookings: vi.fn().mockResolvedValue([]),
  },
  BookingService: {
    getSessions: vi.fn().mockResolvedValue([]),
  },
  SettingsService: {
    getAllSettings: vi.fn().mockResolvedValue({ default_capacity: 12 }),
  }
}));

describe('AdminDashboard Component', () => {
  it('renders the current dashboard summary and quick actions', async () => {
    render(<AdminDashboard />);
    
    expect(await screen.findByText('0 / 12 คน')).toBeInTheDocument();
    expect(screen.getByText(/Quick Actions/i)).toBeInTheDocument();
  });

  it('renders the recent bookings section', async () => {
    render(<AdminDashboard />);
    
    expect(await screen.findByText('การจองล่าสุด')).toBeInTheDocument();
    expect(screen.getByText('ยังไม่มีการจองในระบบ')).toBeInTheDocument();
  });
});
