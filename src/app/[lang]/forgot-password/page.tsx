"use client";

import React, { Suspense } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ForgotPasswordForm } from '@/components/login/ForgotPasswordForm';
import { useDictionary } from '@/lib/i18n/dictionary-context';
import { ROUTES } from '@/config/routes';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

function ForgotPasswordContent() {
  const { dict, lang } = useDictionary();

  return (
    <div className="max-w-[480px] mx-auto bg-white min-h-screen shadow-[0_0_20px_rgba(0,0,0,0.05)] pb-10 flex flex-col relative overflow-hidden">
      {/* Top banner */}
      <div
        className="bg-icsn-navy w-full aspect-[3/1] text-white text-center relative overflow-hidden bg-cover bg-center flex flex-col items-center justify-center"
        style={{ backgroundImage: 'url("/playgroup-banner-icsn.png")' }}
      >
        <Link href={ROUTES.LOGIN(lang)} className="absolute top-4 left-4 text-white/80 hover:text-white transition-colors cursor-pointer z-20">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="absolute top-3 right-3 z-20">
          <LanguageSwitcher />
        </div>
      </div>

      {/* Form Container */}
      <div className="p-8 sm:p-10 flex-1">
        <div className="flex justify-center mb-6">
          <img src="/main-logo-icsn.png" alt="ICSN Logo" className="w-24 h-auto object-contain" />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-icsn-navy mb-2">{dict.auth.resetPasswordTitle}</h1>
        <p className="text-center text-muted-foreground mb-8 text-sm">{dict.auth.resetPasswordSub}</p>

        <ForgotPasswordForm />
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-icsn-teal" /></div>}>
      <ForgotPasswordContent />
    </Suspense>
  )
}
