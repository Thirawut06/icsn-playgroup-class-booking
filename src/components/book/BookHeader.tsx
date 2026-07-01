import React from 'react';
import Image from 'next/image';
import { LogOut, Wallet } from 'lucide-react';

interface BookHeaderProps {
  parentName: string;
  creditsRemaining: number;
  parentPhotoUrl?: string;
  onLogout: () => void;
  onTopUpClick: () => void;
}

export function BookHeader({ parentName, creditsRemaining, parentPhotoUrl, onLogout, onTopUpClick }: BookHeaderProps) {
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
                ICSN Panda Playgroup
              </h1>
              <p className="text-xs text-icsn-teal font-bold tracking-wider">
                PLAY &amp; LEARN
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-error hover:bg-error/10 rounded-xl transition active:scale-95"
            aria-label="ออกจากระบบ"
            title="ออกจากระบบ"
          >
            <LogOut className="w-5 h-5" />
          </button>
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
              {parentName || 'คุณพ่อ/คุณแม่'}
            </p>
            <p className="text-sm text-muted-foreground leading-tight">
              สิทธิ์เหลือ{' '}
              <span className="font-black text-icsn-teal">{creditsRemaining}</span>
              {' '}ครั้ง
            </p>
          </div>
        </div>

        {/* Top Up — 44px touch target for elderly */}
        <button
          onClick={onTopUpClick}
          className="flex items-center gap-1.5 px-4 h-11 bg-icsn-navy text-white text-sm font-bold rounded-xl hover:bg-icsn-navy/90 transition active:scale-95 shrink-0"
        >
          <Wallet className="w-4 h-4" />
          เติมสิทธิ์
        </button>
      </div>
    </>
  );
}

