import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AdminUsers } from './AdminUsers';
import React from 'react';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  AdminService: {
    getAllUsersClassified: vi.fn().mockResolvedValue([]),
  }
}));

describe('AdminUsers Component', () => {
  it('renders the users datatable and filter controls', async () => {
    render(<AdminUsers />);
    
    // Expect to see the header
    expect(screen.getByText(/จัดการผู้ใช้งาน/i)).toBeInTheDocument();
    
    // Tabs (segmented control) should be present
    const allTabBtn = screen.getByText(/ทั้งหมด/i);
    const paymentTabBtn = screen.getByText(/สมาชิกปกติ \(Payment\)/i);
    const trialTabBtn = screen.getByText(/ทดลองเรียน \(Trial\)/i);
    const walkinTabBtn = screen.getByText(/Walk-in \(ลูกค้าหน้างาน\)/i);
    
    expect(allTabBtn).toBeInTheDocument();
    expect(paymentTabBtn).toBeInTheDocument();
    expect(trialTabBtn).toBeInTheDocument();
    expect(walkinTabBtn).toBeInTheDocument();
    
    // Switch to trial tab
    fireEvent.click(trialTabBtn);
    
    // Ensure we see the search input
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ค้นหาชื่อ, เบอร์, ชื่อเล่นลูก.../i)).toBeInTheDocument();
    });
  });
});

