"use client";

import React from 'react';
import Link from 'next/link';
import { UserPlus, LogIn, ChevronRight, Lock } from 'lucide-react';
import Image from 'next/image';
import { ROUTES } from '@/config/routes';
import { useDictionary } from '@/lib/i18n/dictionary-context';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export default function HomePage() {
  const { dict, lang } = useDictionary();

  return (
    <div className="max-w-[480px] mx-auto bg-white min-h-screen shadow-[0_0_20px_rgba(0,0,0,0.05)] pb-10 flex flex-col relative overflow-hidden">
      {/* Top banner with nice branding */}
      <div
        className="w-full aspect-[2000/560] relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/playgroup-banner-icsn.png')" }}
      >
        {/* Language Switcher */}
        <div className="absolute top-3 right-3 z-20">
          <LanguageSwitcher />
        </div>
      </div>

      {/* Brand Header Section */}
      <div className="flex flex-col items-center pt-6 pb-2 text-center px-4">
        <div className="w-16 sm:w-20 h-auto mb-2 animate-fade-in">
          <Image
            src="/main-logo-icsn.png"
            alt="ICSN Logo"
            width={80}
            height={80}
            className="w-full h-auto object-contain"
            priority
          />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-icsn-navy">
          {dict.common.brandName}
        </h1>
      </div>

      {/* Navigation flow based on Parent State */}
      <div className="p-6 sm:p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-icsn-navy font-extrabold text-lg leading-tight">
            {dict.home.selectStatus}
          </h2>
        </div>

        <div className="space-y-4 px-1">
          {/* Option 1: New Parents */}
          <Link
            href={ROUTES.LOGIN(lang, 'signup')}
            className="group flex items-center justify-between w-full bg-white border border-border hover:border-icsn-teal hover:bg-icsn-teal/5 rounded-2xl p-4 sm:p-5 transition-all duration-300 shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-icsn-teal/10 text-icsn-teal rounded-full flex items-center justify-center shrink-0 border border-icsn-teal/20 group-hover:bg-icsn-teal group-hover:text-white transition-colors">
                <UserPlus className="w-5 h-5 ml-1" />
              </div>
              <div className="text-left space-y-0.5">
                <div className="flex items-center gap-2 -mt-0.5">
                  <span className="font-bold text-foreground text-lg">
                    {dict.home.newParent}
                  </span>
                  <span className="px-2 py-0.5 bg-icsn-pink/10 text-icsn-pink text-xs font-bold rounded-full uppercase tracking-widest mt-0.5">{dict.home.newBadge}</span>
                </div>
                <div className="font-semibold text-muted-foreground text-sm">
                  {dict.home.newParentSub}
                </div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-border">
              <ChevronRight className="w-4 h-4 text-muted-foreground/70 group-hover:text-icsn-teal transition-colors" />
            </div>
          </Link>

          {/* Option 2: Existing Parents */}
          <Link
            href={ROUTES.LOGIN(lang, 'login')}
            className="group flex items-center justify-between w-full bg-white border border-border hover:border-icsn-navy hover:bg-icsn-navy/5 rounded-2xl p-4 sm:p-5 transition-all duration-300 shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-icsn-navy/5 text-icsn-navy rounded-full flex items-center justify-center shrink-0 border border-icsn-navy/10 group-hover:bg-icsn-navy group-hover:text-white transition-colors">
                <LogIn className="w-5 h-5 ml-0.5" />
              </div>
              <div className="text-left space-y-0.5">
                <div className="font-bold text-foreground text-lg -mt-0.5">
                  {dict.home.signIn}
                </div>
                <div className="font-semibold text-muted-foreground text-sm">
                  {dict.home.signInSub}
                </div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-border">
              <ChevronRight className="w-4 h-4 text-muted-foreground/70 group-hover:text-icsn-navy transition-colors" />
            </div>
          </Link>
        </div>

        {/* Footer Admin section with a neat badge styling */}
        <div className="pt-6 border-t border-border flex items-center justify-between text-xs text-muted-foreground/70 px-1">
          <div>
            {dict.common.copyright}
          </div>
          <Link
            href={ROUTES.ADMIN}
            className="font-semibold text-muted-foreground/70 hover:text-icsn-pink transition-colors flex items-center gap-1 bg-muted hover:bg-muted/80 px-2.5 py-1 rounded-lg border border-border"
          >
            <Lock className="w-3 h-3" />
            {dict.common.admin}
          </Link>
        </div>
      </div>
    </div>
  );
}
