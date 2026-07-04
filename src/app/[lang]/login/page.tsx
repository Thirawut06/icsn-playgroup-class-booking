"use client";

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { LoginForm } from '@/components/login/LoginForm';
import { SignupForm } from '@/components/login/SignupForm';
import { useDictionary } from '@/lib/i18n/dictionary-context';
import { ROUTES } from '@/config/routes';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

function LoginFormContent() {
  const searchParams = useSearchParams();
  const { dict, lang } = useDictionary();

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
        className="bg-icsn-navy w-full aspect-[2000/560] text-white text-center relative overflow-hidden bg-cover bg-center flex flex-col items-center justify-center"
        style={{ backgroundImage: 'url("/playgroup-banner-icsn.png")' }}
      >
        <Link href={ROUTES.HOME(lang)} className="absolute top-4 left-4 text-white/80 hover:text-white transition-colors cursor-pointer z-20">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="absolute top-3 right-3 z-20">
          <LanguageSwitcher />
        </div>
        <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>
        <div className="inline-flex items-center justify-center mx-auto w-28 sm:w-32 h-auto mb-2 relative z-10 animate-fade-in">
          <Image src="/white-main-logo-icsn.png" alt="ICSN Logo" width={128} height={128} className="w-full h-auto object-contain drop-shadow-md" priority />
        </div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight relative z-10 text-white drop-shadow-md">
          {dict.common.brandName}
        </h1>
      </div>

      {/* Form Container */}
      <div className="p-8 sm:p-10 flex-1">
        {/* Tab Selector Switch */}
        <div className="grid grid-cols-2 p-1.5 bg-muted rounded-2xl mb-8">
          <button
            type="button"
            onClick={() => handleTabSwitch('login')}
            className={`py-2.5 text-base font-bold rounded-xl transition-all cursor-pointer ${tab === 'login' ? 'bg-white text-icsn-teal shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {dict.auth.signInTab}
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('signup')}
            className={`py-2.5 text-base font-bold rounded-xl transition-all cursor-pointer ${tab === 'signup' ? 'bg-white text-icsn-teal shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {dict.auth.signUpTab}
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-icsn-teal" /></div>}>
      <LoginFormContent />
    </Suspense>
  )
}
