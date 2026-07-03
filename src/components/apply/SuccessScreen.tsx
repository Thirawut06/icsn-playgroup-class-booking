import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useDictionary } from '@/lib/i18n/dictionary-context';
import { ROUTES } from '@/config/routes';

interface SuccessScreenProps {
  path: string | null;
}

export function SuccessScreen({ path }: SuccessScreenProps) {
  const router = useRouter();
  const { dict, lang } = useDictionary();

  return (
    <div className="px-5 py-10 relative z-10 flex-1 flex flex-col justify-center items-center text-center">
      <div className="w-20 h-20 bg-icsn-teal/10 text-icsn-teal rounded-full flex items-center justify-center mb-6">
        <Check className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-bold text-icsn-navy mb-2">{dict.apply.successTitle}</h2>
      
      {path === 'trial' && (
        <p className="text-muted-foreground text-[15px] leading-relaxed mb-8 whitespace-pre-wrap">
          {dict.apply.trialSuccessMsg}
        </p>
      )}
      {path === 'payment' && (
        <p className="text-muted-foreground text-[15px] leading-relaxed mb-8 whitespace-pre-wrap">
          {dict.apply.paymentSuccessMsg}
        </p>
      )}

      <Button
        onClick={() => router.push(ROUTES.BOOK(lang))}
        className="w-full bg-icsn-teal text-white font-bold py-3.5 px-6 rounded-xl flex flex-col items-center justify-center hover:bg-icsn-teal/90 h-auto"
      >
        <span className="text-lg">{dict.apply.goToCalendar}</span>
      </Button>
    </div>
  );
}
