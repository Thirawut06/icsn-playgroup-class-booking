import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { COPY } from '@/config/copy';

interface SuccessScreenProps {
  path: string | null;
}

export function SuccessScreen({ path }: SuccessScreenProps) {
  const router = useRouter();

  return (
    <div className="px-5 py-10 relative z-10 flex-1 flex flex-col justify-center items-center text-center">
      <div className="w-20 h-20 bg-icsn-teal/10 text-icsn-teal rounded-full flex items-center justify-center mb-6">
        <Check className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-bold text-icsn-navy mb-2">{COPY.APPLY_FLOW.SUCCESS_TITLE}</h2>
      
      {path === 'trial' && (
        <p className="text-muted-foreground text-lg leading-relaxed mb-8">
          ระบบได้บันทึกข้อมูลของท่านเรียบร้อยแล้ว<br/>
          สามารถเลือกวันเรียนทดลองได้ที่ปฏิทินจองคลาส
        </p>
      )}
      {path === 'payment' && (
        <p className="text-muted-foreground text-lg leading-relaxed mb-8">
          สลิปของท่านจะได้รับการตรวจสอบภายใน 24 ชม.<br/>
          เมื่ออนุมัติแล้วท่านจะสามารถจองคลาสได้ทันที
        </p>
      )}

      <Button
        onClick={() => router.push('/book')}
        className="w-full bg-icsn-teal text-white font-bold py-3.5 px-6 rounded-xl flex flex-col items-center justify-center hover:bg-icsn-teal/90 h-auto"
      >
        <span className="text-lg">{COPY.APPLY_FLOW.GO_TO_CALENDAR_BTN}</span>
      </Button>
    </div>
  );
}

