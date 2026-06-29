import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminSlips } from './AdminSlips';
import { usePendingSlips } from '@/hooks/usePendingSlips';

// Mock the hook
vi.mock('@/hooks/usePendingSlips', () => ({
  usePendingSlips: vi.fn(),
}));

describe('AdminSlips Component', () => {
  const mockHandleApprove = vi.fn();
  const mockHandleReject = vi.fn();
  const mockSetPreviewSlip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (usePendingSlips as any).mockReturnValue({
      slips: [
        {
          id: 'slip-1',
          parent_name: 'John Doe',
          parent_phone: '0812345678',
          child_nickname: 'Johnny',
          credits_to_add: 10,
          file_url: 'http://example.com/slip.jpg',
        }
      ],
      loading: false,
      previewSlip: null,
      setPreviewSlip: mockSetPreviewSlip,
      isProcessing: false,
      handleApprove: mockHandleApprove,
      handleReject: mockHandleReject,
    });
  });

  it('renders pending slip details correctly', () => {
    render(<AdminSlips />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('0812345678')).toBeInTheDocument();
    expect(screen.getByText('น้องJohnny')).toBeInTheDocument();
  });

  it('renders the slip image with full visibility (uncropped constraint test)', () => {
    render(<AdminSlips />);
    
    // The image should be rendered
    const slipImg = screen.getByAltText('Slip');
    expect(slipImg).toBeInTheDocument();
    expect(slipImg).toHaveAttribute('src', 'http://example.com/slip.jpg');
    
    // According to TDD requirement: "preview ให้เห็นสลิปเต็มๆไปเลย ถ้าใช้พื้นที่เยอะให้ลดขนาดอย่างอื่นแทน"
    // We expect the image container to prioritize full display (e.g., object-contain)
    // We will verify this by checking if the class includes object-contain instead of object-cover.
    expect(slipImg.className).toContain('object-contain');
  });
});
