"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ResetPasswordForm } from '@/components/login/ResetPasswordForm';
import { useDictionary } from '@/lib/i18n/dictionary-context';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/config/routes';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

function ResetPasswordContent() {
  const router = useRouter();
  const { dict, lang } = useDictionary();
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Supabase will automatically parse the #access_token from the URL hash 
    // and set the session. We just need to check if we have a valid session.
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setHasSession(true);
        } else {
          // Listen for a moment in case it takes time to process the hash
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY' || session) {
              setHasSession(true);
              setCheckingSession(false);
            }
          });
          
          // Wait 1 second before giving up (hash processing usually fast)
          setTimeout(() => {
            setCheckingSession(false);
            subscription.unsubscribe();
          }, 1500);
          return;
        }
      } catch (e) {
        console.error("Session check error", e);
      }
      setCheckingSession(false);
    };
    
    checkSession();
  }, []);

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-icsn-teal" />
      </div>
    );
  }

  if (!hasSession) {
    // If no session after checking, the link is invalid or expired
    return (
      <div className="min-h-screen flex items-center justify-center bg-white flex-col gap-4 p-4 text-center">
        <h1 className="text-2xl font-bold text-icsn-navy">Invalid or Expired Link</h1>
        <p className="text-muted-foreground">Please request a new password reset link.</p>
        <button 
          onClick={() => router.push(ROUTES.FORGOT_PASSWORD(lang))}
          className="mt-4 px-6 py-2 bg-icsn-navy text-white rounded-xl font-bold"
        >
          {dict.auth.backToLogin}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[480px] mx-auto bg-white min-h-[100dvh] shadow-[0_0_20px_rgba(0,0,0,0.05)] pb-10 flex flex-col relative overflow-x-hidden">
      {/* Top banner */}
      <div
        className="bg-icsn-navy w-full aspect-[3/1] text-white text-center relative overflow-hidden bg-cover bg-center flex flex-col items-center justify-center"
        style={{ backgroundImage: 'url("/playgroup-banner-icsn.png")' }}
      >
        <div className="absolute top-3 right-3 z-20">
          <LanguageSwitcher />
        </div>
      </div>

      {/* Form Container */}
      <div className="p-8 sm:p-10 flex-1">
        <div className="flex justify-center mb-6">
          <Image src="/main-logo-icsn.png" alt="ICSN Logo" width={96} height={96} priority className="w-24 h-auto object-contain" />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-icsn-navy mb-2">{dict.auth.updatePasswordTitle}</h1>
        <p className="text-center text-muted-foreground mb-8 text-sm">{dict.auth.updatePasswordSub}</p>

        <ResetPasswordForm />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-icsn-teal" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
