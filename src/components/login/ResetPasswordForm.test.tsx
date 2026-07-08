import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResetPasswordForm } from './ResetPasswordForm';
import { supabase } from '@/lib/supabase';

// Mock dependencies
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      updateUser: vi.fn()
    }
  }
}));

vi.mock('@/lib/i18n/dictionary-context', () => ({
  useDictionary: () => ({
    lang: 'th',
    dict: {
      auth: {
        newPassword: 'รหัสผ่านใหม่',
        confirmNewPassword: 'ยืนยันรหัสผ่านใหม่',
        passwordPlaceholder: 'กรอกรหัสผ่าน',
        updatePassword: 'เปลี่ยนรหัสผ่าน',
        updatingPassword: 'กำลังเปลี่ยน...',
        passwordUpdated: 'เปลี่ยนรหัสผ่านสำเร็จ',
        passwordsDoNotMatch: 'รหัสผ่านไม่ตรงกัน',
        passwordTooShort: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
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

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial state correctly', () => {
    render(<ResetPasswordForm />);
    expect(screen.getByText(/^รหัสผ่านใหม่$/i)).toBeInTheDocument();
    expect(screen.getByText(/ยืนยันรหัสผ่านใหม่/i)).toBeInTheDocument();
    
    const submitBtn = screen.getByRole('button', { name: /เปลี่ยนรหัสผ่าน/i });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();
  });

  it('shows error if passwords do not match', async () => {
    render(<ResetPasswordForm />);
    const inputs = screen.getAllByPlaceholderText(/กรอกรหัสผ่าน/i);
    const passInput = inputs[0];
    const confirmInput = inputs[1];
    const submitBtn = screen.getByRole('button', { name: /เปลี่ยนรหัสผ่าน/i });

    await userEvent.type(passInput, 'password123');
    await userEvent.type(confirmInput, 'password456');
    
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/รหัสผ่านไม่ตรงกัน/i)).toBeInTheDocument();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it('shows error if password is too short', async () => {
    render(<ResetPasswordForm />);
    const inputs = screen.getAllByPlaceholderText(/กรอกรหัสผ่าน/i);
    const passInput = inputs[0];
    const confirmInput = inputs[1];
    const submitBtn = screen.getByRole('button', { name: /เปลี่ยนรหัสผ่าน/i });

    await userEvent.type(passInput, '12345');
    await userEvent.type(confirmInput, '12345');
    
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร/i)).toBeInTheDocument();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it('calls API and shows success on valid input', async () => {
    vi.mocked(supabase.auth.updateUser).mockResolvedValueOnce({
      data: { user: {} },
      error: null
    } as any);

    render(<ResetPasswordForm />);
    
    const inputs = screen.getAllByPlaceholderText(/กรอกรหัสผ่าน/i);
    await userEvent.type(inputs[0], 'validPass123');
    await userEvent.type(inputs[1], 'validPass123');
    
    fireEvent.click(screen.getByRole('button', { name: /เปลี่ยนรหัสผ่าน/i }));

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'validPass123'
      });
    });

    expect(await screen.findByText(/เปลี่ยนรหัสผ่านสำเร็จ/i)).toBeInTheDocument();
  });

  it('shows error message when API fails', async () => {
    const mockError = new Error('Token expired');
    vi.mocked(supabase.auth.updateUser).mockResolvedValueOnce({
      data: { user: null },
      error: mockError as any
    });

    render(<ResetPasswordForm />);
    
    const inputs = screen.getAllByPlaceholderText(/กรอกรหัสผ่าน/i);
    await userEvent.type(inputs[0], 'validPass123');
    await userEvent.type(inputs[1], 'validPass123');
    
    fireEvent.click(screen.getByRole('button', { name: /เปลี่ยนรหัสผ่าน/i }));

    expect(await screen.findByText(/Token expired/i)).toBeInTheDocument();
  });
});
