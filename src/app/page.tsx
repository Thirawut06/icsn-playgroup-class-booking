"use client";

import React from 'react';
import Link from 'next/link';
import { UserPlus, LogIn, ChevronRight, Lock } from 'lucide-react';
import Image from 'next/image';
import { ROUTES } from '@/config/routes';

export default function HomePage() {
  return (
    <div className="max-w-[480px] mx-auto bg-white min-h-screen shadow-[0_0_20px_rgba(0,0,0,0.05)] pb-10 flex flex-col relative overflow-hidden">
      {/* Top banner with nice branding */}
      <div
        className="bg-icsn-navy w-full aspect-[2000/560] text-white text-center relative overflow-hidden bg-cover bg-center flex flex-col items-center justify-center"
        style={{ backgroundImage: "url('/playgroup-banner-icsn.png')" }}
      >
        {/* Dark overlay for high contrast readability */}
        <div className="absolute inset-0 bg-black/45 pointer-events-none"></div>

        <div className="inline-flex items-center justify-center mx-auto w-14 sm:w-16 h-auto mb-1 relative z-10 animate-fade-in">
          <Image
            src="/white-main-logo-icsn.png"
            alt="ICSN Logo"
            width={64}
            height={64}
            className="w-full h-auto object-contain drop-shadow-md"
            style={{ width: 'auto', height: 'auto' }}
            priority
          />
        </div>
        <h1 className="text-lg sm:text-xl font-bold tracking-tight relative z-10 text-white drop-shadow-md">
          ICSN Panda Playgroup
        </h1>
      </div>

      {/* Navigation flow based on Parent State */}
      <div className="p-6 sm:p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-icsn-navy font-extrabold text-lg leading-tight">
            Please select your status to continue<br />
            <span className="text-sm text-muted-foreground font-normal block mt-1">กรุณาเลือกสถานะเพื่อดำเนินการต่อ</span>
          </h2>
        </div>

        <div className="space-y-4 px-1">
          {/* Option 1: New Parents */}
          <Link
            href={ROUTES.LOGIN('signup')}
            className="group flex items-center justify-between w-full bg-white border border-border hover:border-icsn-teal hover:bg-icsn-teal/5 rounded-2xl p-4 sm:p-5 transition-all duration-300 shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-icsn-teal/10 text-icsn-teal rounded-full flex items-center justify-center shrink-0 border border-icsn-teal/20 group-hover:bg-icsn-teal group-hover:text-white transition-colors">
                <UserPlus className="w-5 h-5 ml-1" />
              </div>
              <div className="text-left space-y-0.5">
                <div className="flex items-center gap-2 -mt-0.5">
                  <span className="font-bold text-foreground text-lg">
                    New Parent
                  </span>
                  <span className="px-2 py-0.5 bg-icsn-pink/10 text-icsn-pink text-xs font-bold rounded-full uppercase tracking-widest mt-0.5">New</span>
                </div>
                <div className="font-semibold text-muted-foreground text-sm">
                  สมัครสมาชิกใหม่
                </div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-border">
              <ChevronRight className="w-4 h-4 text-muted-foreground/70 group-hover:text-icsn-teal transition-colors" />
            </div>
          </Link>

          {/* Option 2: Existing Parents */}
          <Link
            href={ROUTES.LOGIN('login')}
            className="group flex items-center justify-between w-full bg-white border border-border hover:border-icsn-navy hover:bg-icsn-navy/5 rounded-2xl p-4 sm:p-5 transition-all duration-300 shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-icsn-navy/5 text-icsn-navy rounded-full flex items-center justify-center shrink-0 border border-icsn-navy/10 group-hover:bg-icsn-navy group-hover:text-white transition-colors">
                <LogIn className="w-5 h-5 ml-0.5" />
              </div>
              <div className="text-left space-y-0.5">
                <div className="font-bold text-foreground text-lg -mt-0.5">
                  Sign In
                </div>
                <div className="font-semibold text-muted-foreground text-sm">
                  เข้าสู่ระบบเดิม
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
            © ICSN Panda Playgroup
          </div>
          <Link
            href={ROUTES.ADMIN}
            className="font-semibold text-muted-foreground/70 hover:text-icsn-pink transition-colors flex items-center gap-1 bg-muted hover:bg-muted/80 px-2.5 py-1 rounded-lg border border-border"
          >
            <Lock className="w-3 h-3" />
            Admin (สำหรับเจ้าหน้าที่)
          </Link>
        </div>
      </div>
    </div>
  );
}

