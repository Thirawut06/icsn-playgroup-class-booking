import React, { useState } from 'react';
import Image from 'next/image';
import { LogOut, Wallet, Pencil } from 'lucide-react';
import { useDictionary } from '@/lib/i18n/dictionary-context';
import { LanguageSwitcherLight } from '@/components/ui/language-switcher';
import { EditProfileModal } from './EditProfileModal';

interface BookHeaderProps {
  parentName: string;
  creditsRemaining: number;
  parentPhotoUrl?: string;
  onLogout: () => void;
  onTopUpClick: () => void;
}

export function BookHeader({ parentName, creditsRemaining, parentPhotoUrl, onLogout, onTopUpClick }: BookHeaderProps) {
  const { dict } = useDictionary();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      <header className="bg-white/95 backdrop-blur-md border-b border-border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between lg:px-4">
          
          {/* Top Navbar Row (Mobile) / Left Side (Desktop) */}
          <div className="px-4 lg:px-0 py-3 flex items-center justify-between w-full lg:w-auto border-b border-border/40 lg:border-none">
            <div className="flex items-center gap-2.5 lg:gap-3">
              <div className="w-9 h-9 lg:w-11 lg:h-11 shrink-0 flex items-center justify-center">
                <Image src="/main-logo-icsn.png" alt="ICSN Logo" width={48} height={48} className="w-full h-auto object-contain" priority />
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="font-bold text-icsn-navy text-base leading-tight">
                  {dict.common.brandName}
                </h1>
                <p className="text-xs text-icsn-navy font-medium mt-0.5 opacity-80">
                  {dict.common.tagline}
                </p>
              </div>
            </div>

            {/* Mobile-only Lang & Logout */}
            <div className="flex lg:hidden items-center gap-1">
              <LanguageSwitcherLight />
              <button
                onClick={onLogout}
                className="w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-error hover:bg-error/10 rounded-xl transition active:scale-95"
                aria-label={dict.book.logout}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Profile Strip Row (Mobile) / Right Side (Desktop) */}
          <div className="px-4 lg:px-0 py-3 flex items-center justify-between gap-3 w-full lg:w-auto">
            
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-muted">
                {parentPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={parentPhotoUrl} alt="Profile" loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${parentName || 'Parent'}&backgroundColor=e2e8f0`} alt="Profile" loading="lazy" className="w-full h-full object-cover" />
                )}
              </div>

              {/* Name + Credits */}
              <div className="min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-base font-bold text-icsn-navy truncate leading-none">
                    {parentName || dict.book.parentFallback}
                  </p>
                  <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="text-muted-foreground hover:text-icsn-teal transition-colors p-1 rounded-md hover:bg-icsn-teal/10 -ml-1"
                    aria-label="Edit Profile"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground leading-none mt-1">
                  {dict.book.creditsRemaining}{' '}
                  <span className="font-black text-icsn-teal">{creditsRemaining}</span>
                  {' '}{dict.common.creditsUnit}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-3 shrink-0">
              {/* Top Up Button */}
              <button
                onClick={onTopUpClick}
                className="flex items-center gap-1.5 px-4 h-10 lg:h-11 bg-icsn-navy text-white text-sm font-bold rounded-xl hover:bg-icsn-navy/90 transition active:scale-95"
              >
                <Wallet className="w-4 h-4" />
                {dict.book.topUp}
              </button>

              {/* Desktop-only Lang & Logout */}
              <div className="hidden lg:flex items-center gap-1 border-l border-border pl-2 ml-1">
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

          </div>
        </div>
      </header>

      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
      />
    </>
  );
}
