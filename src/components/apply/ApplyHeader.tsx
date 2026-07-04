import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useDictionary } from '@/lib/i18n/dictionary-context';
import { ROUTES } from '@/config/routes';

interface ApplyHeaderProps {
  showSuccess: boolean;
  path: string | null;
  setPath: (path: 'trial' | 'payment' | null) => void;
}

export function ApplyHeader({ showSuccess, path, setPath }: ApplyHeaderProps) {
  const router = useRouter();
  const { dict, lang } = useDictionary();

  return (
    <>
      <div 
        className="w-full aspect-[2000/560] relative overflow-hidden bg-cover bg-center bg-[#00adb7]"
        style={{ backgroundImage: 'url("/playgroup-banner-icsn.png")' }}
      >
        <div className="absolute top-3 right-3 z-20">
          <LanguageSwitcher />
        </div>

        {(!showSuccess && path) ? (
          <button onClick={() => setPath(null)} className="absolute top-4 left-4 z-20 text-white bg-black/30 hover:bg-black/50 p-1.5 rounded-full cursor-pointer transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <button onClick={() => {
            if (typeof window !== 'undefined' && localStorage.getItem('icsn_parent_id')) {
              router.push(ROUTES.BOOK(lang));
            } else {
              router.push(ROUTES.HOME(lang));
            }
          }} className="absolute top-4 left-4 z-20 text-white bg-black/30 hover:bg-black/50 p-1.5 rounded-full cursor-pointer transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex flex-col items-center pt-6 pb-2 text-center px-4 border-b border-border">
        <div className="w-14 sm:w-16 h-auto mb-2">
          <img src="/main-logo-icsn.png" alt="ICSN Logo" className="w-full h-auto object-contain" />
        </div>
        <h1 className="text-lg sm:text-xl font-bold text-icsn-navy leading-tight">
          {dict.common.brandName}
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-muted-foreground mt-0.5">
          {dict.apply.headerSubtitle}
        </p>
      </div>
    </>
  );
}
