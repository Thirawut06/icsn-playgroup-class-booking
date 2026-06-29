import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AdminUsers } from './AdminUsers';
import React from 'react';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  AdminService: {
    getAllParentsWithCredits: vi.fn().mockResolvedValue([]),
    getAllChildren: vi.fn().mockResolvedValue([]),
  }
}));

describe('AdminUsers Component', () => {
  it('renders both Parents and Children tabs and allows switching', async () => {
    render(<AdminUsers />);
    
    // Expect to see the header
    expect(screen.getByText(/จัดการผู้ใช้งาน/i)).toBeInTheDocument();
    
    // Both tabs should be present
    const parentsTabBtn = screen.getByText(/ผู้ปกครองและเครดิต/i);
    const childrenTabBtn = screen.getByText(/ข้อมูลนักเรียน/i);
    expect(parentsTabBtn).toBeInTheDocument();
    expect(childrenTabBtn).toBeInTheDocument();
    
    // Switch to Children tab
    fireEvent.click(childrenTabBtn);
    
    // Ensure we see the student search input
    await waitFor(() => {
      expect(screen.getByText(/ค้นหาข้อมูลนักเรียน/i)).toBeInTheDocument();
    });
  });
});
