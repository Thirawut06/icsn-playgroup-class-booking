import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { supabase } from '@/lib/supabase';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: vi.fn()
    }
  }
}));

vi.mock('@/lib/i18n/dictionary-context', () => ({
  useDictionary: () => ({
    lang: 'th',
    dict: {
      auth: {
        emailLabel: 'อีเมล',
        emailPlaceholder: 'กรอกอีเมล',
        sendResetLink: 'ส่งลิงก์',
        sendingResetLink: 'กำลังส่ง...',
        resetLinkSent: 'ส่งลิงก์สำเร็จ',
        genericError: 'เกิดข้อผิดพลาด'
      }
    }
  })
}));

// Mock ResizeObserver for Recharts / Radix UI if used indirectly
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial state correctly', () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByText(/อีเมล/i)).toBeInTheDocument();
    
    const submitBtn = screen.getByRole('button', { name: /ส่งลิงก์/i });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();
  });

  it('enables submit button when email is entered', async () => {
    render(<ForgotPasswordForm />);
    const emailInput = screen.getByPlaceholderText(/กรอกอีเมล/i);
    const submitBtn = screen.getByRole('button', { name: /ส่งลิงก์/i });

    await userEvent.type(emailInput, 'test@example.com');
    expect(submitBtn).not.toBeDisabled();
  });

  it('calls supabase API correctly and shows success message', async () => {
    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({
      data: {},
      error: null
    } as any);

    render(<ForgotPasswordForm />);
    
    await userEvent.type(screen.getByPlaceholderText(/กรอกอีเมล/i), 'test@example.com');
    fireEvent.click(screen.getByRole('button', { name: /ส่งลิงก์/i }));

    await waitFor(() => {
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('/th/auth/callback')
        })
      );
    });

    // Check success state
    expect(await screen.findByText(/ส่งลิงก์สำเร็จ/i)).toBeInTheDocument();
    // Form should disappear
    expect(screen.queryByPlaceholderText(/กรอกอีเมล/i)).not.toBeInTheDocument();
  });

  it('shows error message when API fails', async () => {
    const mockError = new Error('User not found');
    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: mockError as any
    });

    render(<ForgotPasswordForm />);
    
    await userEvent.type(screen.getByPlaceholderText(/กรอกอีเมล/i), 'test@example.com');
    fireEvent.click(screen.getByRole('button', { name: /ส่งลิงก์/i }));

    expect(await screen.findByText(/User not found/i)).toBeInTheDocument();
    // Form should still be visible
    expect(screen.getByPlaceholderText(/กรอกอีเมล/i)).toBeInTheDocument();
  });
});
