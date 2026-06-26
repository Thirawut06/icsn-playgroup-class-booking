import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface SuccessScreenProps {
  path: string | null;
}

export function SuccessScreen({ path }: SuccessScreenProps) {
  const router = useRouter();

  return (
    <div className="px-5 py-10 relative z-10 flex-1 flex flex-col justify-center items-center text-center">
      <div className="w-20 h-20 bg-[#00B0B9]/10 text-[#00B0B9] rounded-full flex items-center justify-center mb-6">
        <Check className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-bold text-[#211551] mb-2">ลงทะเบียนสำเร็จ!</h2>
      
      {path === 'trial' && (
        <p className="text-gray-600 text-[16px] leading-relaxed mb-8">
          ระบบได้บันทึกข้อมูลของท่านเรียบร้อยแล้ว<br/>
          สามารถเลือกวันเรียนทดลองได้ที่ปฏิทินจองคลาส
        </p>
      )}
      {path === 'payment' && (
        <p className="text-gray-600 text-[16px] leading-relaxed mb-8">
          สลิปของท่านจะได้รับการตรวจสอบภายใน 24 ชม.<br/>
          เมื่ออนุมัติแล้วท่านจะสามารถจองคลาสได้ทันที
        </p>
      )}

      <Button
        onClick={() => router.push('/book')}
        className="w-full bg-[#00B0B9] text-white font-bold py-3.5 px-6 rounded-xl flex flex-col items-center justify-center hover:bg-[#00969e] h-auto"
      >
        <span className="text-[16px]">ไปที่ปฏิทินจองคลาส</span>
      </Button>
    </div>
  );
}
