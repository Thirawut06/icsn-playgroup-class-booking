"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDictionary } from '@/lib/i18n/dictionary-context';
import type { Locale } from '@/app/[lang]/dictionaries';

const FLAGS: Record<Locale, string> = {
  th: 'https://flagcdn.com/w40/th.png',
  en: 'https://flagcdn.com/w40/us.png',
};

const LABELS: Record<Locale, string> = {
  th: 'TH',
  en: 'EN',
};

export function LanguageSwitcher() {
  const { lang } = useDictionary();
  const pathname = usePathname();
  const router = useRouter();

  const otherLang: Locale = lang === 'th' ? 'en' : 'th';

  const handleSwitch = () => {
    // Replace the current lang segment in the path
    const segments = pathname.split('/');
    if (segments.length >= 2 && (segments[1] === 'th' || segments[1] === 'en')) {
      segments[1] = otherLang;
    } else if (segments.length >= 2) {
      // Just in case it's missing
      segments.splice(1, 0, otherLang);
    }
    const newPath = segments.join('/') || `/${otherLang}`;
    
    // Preserve query parameters without causing Next.js useSearchParams() static de-opt
    const query = typeof window !== 'undefined' ? window.location.search : '';
    router.push(`${newPath}${query}`);
  };

  return (
    <button
      onClick={handleSwitch}
      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/15 backdrop-blur-md text-white text-xs font-bold rounded-lg hover:bg-white/25 transition-all active:scale-95 border border-white/20"
      aria-label={`Switch to ${LABELS[otherLang]}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={FLAGS[otherLang]} alt={otherLang} className="w-4 h-auto rounded-[2px] object-cover" />
      <span>{LABELS[otherLang]}</span>
    </button>
  );
}

/**
 * Variant for non-banner areas (light background)
 */
export function LanguageSwitcherLight() {
  const { lang } = useDictionary();
  const pathname = usePathname();
  const router = useRouter();

  const otherLang: Locale = lang === 'th' ? 'en' : 'th';

  const handleSwitch = () => {
    const segments = pathname.split('/');
    if (segments.length >= 2 && (segments[1] === 'th' || segments[1] === 'en')) {
      segments[1] = otherLang;
    } else if (segments.length >= 2) {
      segments.splice(1, 0, otherLang);
    }
    const newPath = segments.join('/') || `/${otherLang}`;
    
    const query = typeof window !== 'undefined' ? window.location.search : '';
    router.push(`${newPath}${query}`);
  };

  return (
    <button
      onClick={handleSwitch}
      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted text-muted-foreground text-xs font-bold rounded-lg hover:bg-muted/80 transition-all active:scale-95 border border-border"
      aria-label={`Switch to ${LABELS[otherLang]}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={FLAGS[otherLang]} alt={otherLang} className="w-4 h-auto rounded-[2px] object-cover shadow-[0_0_2px_rgba(0,0,0,0.1)]" />
      <span>{LABELS[otherLang]}</span>
    </button>
  );
}
