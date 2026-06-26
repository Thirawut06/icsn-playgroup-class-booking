"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppDB } from '@/lib/supabase';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { LoginForm } from '@/components/login/LoginForm';
import { SignupForm } from '@/components/login/SignupForm';

function LoginFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [tab, setTab] = useState<'login' | 'signup'>(
    searchParams.get('tab') === 'signup' ? 'signup' : 'login'
  );

  const handleTabSwitch = (newTab: 'login' | 'signup') => {
    if (tab !== newTab) {
      setTab(newTab);
    }
  };

  return (
    <div className="max-w-[480px] mx-auto bg-white min-h-screen shadow-[0_0_20px_rgba(0,0,0,0.05)] pb-10 flex flex-col relative overflow-hidden">
      {/* Top banner */}
      <div
        className="bg-[#211551] px-6 py-10 text-white text-center relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: 'url("/playgroup-banner-icsn.png")' }}
      >
        <Link href="/" className="absolute top-4 left-4 text-white/80 hover:text-white transition-colors cursor-pointer z-20">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>
        <div className="inline-flex items-center justify-center w-28 h-auto mb-4 relative z-10">
          <Image src="/white-main-logo-icsn.png" alt="ICSN Logo" width={112} height={112} className="w-full h-auto object-contain drop-shadow-sm" style={{ width: 'auto', height: 'auto' }} priority />
        </div>
        <h1 className="text-2xl font-bold tracking-tight relative z-10 text-white drop-shadow-md">
          ICSN Panda Playgroup
        </h1>
      </div>

      {/* Form Container */}
      <div className="p-8 sm:p-10 flex-1">
        {/* Tab Selector Switch */}
        <div className="grid grid-cols-2 p-1.5 bg-gray-100 rounded-2xl mb-8">
          <button
            type="button"
            onClick={() => handleTabSwitch('login')}
            className={`py-2.5 text-[14px] font-bold rounded-xl transition-all cursor-pointer ${tab === 'login' ? 'bg-white text-[#00B0B9] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            Sign In (เข้าสู่ระบบ)
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('signup')}
            className={`py-2.5 text-[14px] font-bold rounded-xl transition-all cursor-pointer ${tab === 'signup' ? 'bg-white text-[#00B0B9] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            Sign Up (สมัครสมาชิก)
          </button>
        </div>

        {/* SIGN IN FORM */}
        {tab === 'login' && <LoginForm />}

        {/* SIGN UP FORM */}
        {tab === 'signup' && <SignupForm />}
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#00B0B9]" /></div>}>
      <LoginFormContent />
    </Suspense>
  )
}
