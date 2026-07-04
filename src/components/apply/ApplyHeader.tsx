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
    <div 
      className="bg-icsn-navy w-full aspect-[2000/560] text-white text-center relative overflow-hidden bg-cover bg-center flex flex-col items-center justify-center"
      style={{ backgroundImage: 'url("/playgroup-banner-icsn.png")' }}
    >
      <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>

      <div className="absolute top-3 right-3 z-20">
        <LanguageSwitcher />
      </div>

      {(!showSuccess && path) ? (
        <button onClick={() => setPath(null)} className="absolute top-4 left-4 z-20 text-white hover:text-muted-foreground cursor-pointer">
          <ArrowLeft className="w-6 h-6" />
        </button>
      ) : (
        <button onClick={() => {
          if (typeof window !== 'undefined' && localStorage.getItem('icsn_parent_id')) {
            router.push(ROUTES.BOOK(lang));
          } else {
            router.push(ROUTES.HOME(lang));
          }
        }} className="absolute top-4 left-4 z-20 text-white hover:text-muted-foreground cursor-pointer">
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}

      <div className="inline-flex items-center justify-center mx-auto w-28 sm:w-32 h-auto mb-2 relative z-10 animate-fade-in">
        <img src="/white-main-logo-icsn.png" alt="ICSN Logo" className="w-full h-auto object-contain drop-shadow-md" />
      </div>
      <h1 className="text-xl sm:text-2xl font-black tracking-tight relative z-10 text-white drop-shadow-md">
        {dict.common.brandName}
      </h1>
      <p className="text-sm sm:text-base font-semibold text-white/95 mt-1 relative z-10 drop-shadow-md">
        {dict.apply.headerSubtitle}
      </p>
    </div>
  );
}
