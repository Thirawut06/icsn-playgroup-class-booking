"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { isAdminUser } from '@/lib/auth/roles';

interface AdminLoginGateProps {
  onSuccess: () => void;
}

export function AdminLoginGate({ onSuccess }: AdminLoginGateProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const verifyAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (!isAdminUser(data.user)) {
         await supabase.auth.signOut();
         throw new Error('บัญชีนี้ไม่มีสิทธิ์การเข้าถึงระดับ Admin (Unauthorized)');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-icsn-navy flex items-center justify-center p-4 z-[100]">
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl space-y-6 relative border border-border">
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
            <span className="text-sm font-normal text-muted-foreground block mt-0.5 font-sarabun">
              ผู้ดูแลระบบคลาสเรียน
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mt-2">
            Please enter password to unlock adult admin panel
            <br />
            กรุณากรอกรหัสผ่านเพื่อปลดล็อกแผงผู้ดูแลระบบ
          </p>
        </div>

        <form onSubmit={verifyAdmin} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Admin Email / อีเมลแอดมิน
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="admin@example.com"
              className="block w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-icsn-teal text-black text-center font-mono placeholder-gray-300 text-lg mb-4"
            />
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Admin Password / รหัสผ่านแอดมิน
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="block w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-icsn-teal text-black text-center font-mono placeholder-gray-300 text-lg"
            />
          </div>

          {error ? (
            <div className="bg-error/10 text-error border border-error/20 p-3 rounded-lg text-xs leading-snug">
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

        <p className="text-xs text-center text-muted-foreground/70 font-medium font-outfit">
          Closed Server Security System
        </p>
      </div>
    </div>
  );
}

