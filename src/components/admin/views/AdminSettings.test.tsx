import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AdminSettings } from './AdminSettings';
import React from 'react';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock('@/lib/supabase', () => ({
  SettingsService: {
    getAllSettings: vi.fn().mockResolvedValue({
      cutoff_hour: 7,
      default_capacity: 15,
      announcement_text: 'Test Announcement'
    }),
  }
}));

describe('AdminSettings Component', () => {
  it('renders settings tab with content correctly', async () => {
    render(<AdminSettings />);
    
    expect(screen.getByText(/การตั้งค่าทั่วไป/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText(/กฎการจอง/i)).toBeInTheDocument();
    });
    
  });
});
