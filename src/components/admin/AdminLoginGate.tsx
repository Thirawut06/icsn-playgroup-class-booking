"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface AdminLoginGateProps {
  onSuccess: () => void;
}

export function AdminLoginGate({ onSuccess }: AdminLoginGateProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const verifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('admin-actions', {
        body: { action: 'verify-password', password, payload: {} },
      });
      if (fnError) throw fnError;
      if (data?.success) {
        sessionStorage.setItem('icsn_admin_verified', 'true');
        sessionStorage.setItem('icsn_admin_pwd', password);
        onSuccess();
      } else {
        throw new Error(data?.error || 'รหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'รหัสผ่านไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-icsn-navy flex items-center justify-center p-4 z-[100]">
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl space-y-6 relative border border-gray-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center mx-auto w-24 h-auto mb-4">
            <Image
              src="/main-logo-icsn.png"
              alt="ICSN Admin"
              width={96}
              height={96}
              className="w-full h-auto object-contain drop-shadow-sm"
              priority
            />
          </div>
          <h2 className="text-xl font-bold text-icsn-navy mb-1 font-outfit">
            Class Admin Panel
            <br />
            <span className="text-sm font-normal text-gray-600 block mt-0.5 font-sarabun">
              ผู้ดูแลระบบคลาสเรียน
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-2">
            Please enter password to unlock adult admin panel
            <br />
            กรุณากรอกรหัสผ่านเพื่อปลดล็อกแผงผู้ดูแลระบบ
          </p>
        </div>

        <form onSubmit={verifyPassword} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Admin Password / รหัสผ่านแอดมิน
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-icsn-teal text-black text-center font-mono placeholder-gray-300 text-lg"
            />
          </div>

          {error ? (
            <div className="bg-red-50 text-red-700 border border-red-100 p-3 rounded-lg text-xs leading-snug">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-icsn-teal hover:bg-icsn-teal/90 text-white py-3 px-4 rounded-xl font-bold shadow-sm transition h-14 flex flex-col items-center justify-center gap-0.5 cursor-pointer disabled:opacity-50"
          >
            {!loading ? (
              <>
                <span className="text-sm font-outfit">Unlock Admin Board</span>
                <span className="text-xs font-normal text-white/80 font-sarabun">ปลดล็อกแผงแอดมิน</span>
              </>
            ) : (
              <span className="text-sm">Verifying... / กำลังตรวจสอบ...</span>
            )}
          </button>
        </form>

        <p className="text-xs text-center text-gray-400 font-medium font-outfit">
          Closed Server Security System
        </p>
      </div>
    </div>
  );
}

