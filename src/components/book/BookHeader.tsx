import React from 'react';
import Image from 'next/image';
import { LogOut, Wallet } from 'lucide-react';
import { useDictionary } from '@/lib/i18n/dictionary-context';
import { LanguageSwitcherLight } from '@/components/ui/language-switcher';

interface BookHeaderProps {
  parentName: string;
  creditsRemaining: number;
  parentPhotoUrl?: string;
  onLogout: () => void;
  onTopUpClick: () => void;
}

export function BookHeader({ parentName, creditsRemaining, parentPhotoUrl, onLogout, onTopUpClick }: BookHeaderProps) {
  const { dict } = useDictionary();

  return (
    <>
      {/* Sticky Top Navbar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 shrink-0">
              <Image src="/main-logo-icsn.png" alt="ICSN Logo" width={48} height={48} className="w-full h-auto object-contain" priority />
            </div>
            <div>
              <h1 className="font-bold text-icsn-navy text-base leading-tight">
                {dict.common.brandName}
              </h1>
              <p className="text-xs text-icsn-teal font-bold tracking-wider">
                {dict.common.tagline}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <LanguageSwitcherLight />
            <button
              onClick={onLogout}
              className="w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-error hover:bg-error/10 rounded-xl transition active:scale-95"
              aria-label={dict.book.logout}
              title={dict.book.logout}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Profile Strip — flat row, no card, no shadow */}
      <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-border/40">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-muted">
            {parentPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={parentPhotoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${parentName || 'Parent'}&backgroundColor=e2e8f0`} alt="Profile" className="w-full h-full object-cover" />
            )}
          </div>

          {/* Name + Credits */}
          <div className="min-w-0">
            <p className="text-base font-bold text-icsn-navy truncate leading-tight">
              {parentName || dict.book.parentFallback}
            </p>
            <p className="text-sm text-muted-foreground leading-tight">
              {dict.book.creditsRemaining}{' '}
              <span className="font-black text-icsn-teal">{creditsRemaining}</span>
              {' '}{dict.common.creditsUnit}
            </p>
          </div>
        </div>

        {/* Top Up — 44px touch target for elderly */}
        <button
          onClick={onTopUpClick}
          className="flex items-center gap-1.5 px-4 h-11 bg-icsn-navy text-white text-sm font-bold rounded-xl hover:bg-icsn-navy/90 transition active:scale-95 shrink-0"
        >
          <Wallet className="w-4 h-4" />
          {dict.book.topUp}
        </button>
      </div>
    </>
  );
}
