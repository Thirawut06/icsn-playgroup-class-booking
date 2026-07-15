"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import { LineSupportCard } from '@/components/ui/LineSupportCard';
import { ROUTES } from '@/config/routes';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <div className="max-w-[480px] mx-auto bg-white min-h-[100dvh] shadow-[0_0_20px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mb-6">
        <AlertOctagon className="w-10 h-10 text-error" />
      </div>
      
      <h1 className="text-2xl font-extrabold text-foreground mb-2">
        เกิดข้อผิดพลาดในระบบ
      </h1>
      <p className="text-muted-foreground mb-8 text-sm px-4">
        ขออภัยในความไม่สะดวก ทางเราบันทึกข้อผิดพลาดนี้ไว้แล้ว หากคุณต้องการทำรายการต่อด่วน โปรดติดต่อแอดมิน
      </p>

      <div className="w-full max-w-sm mb-6">
        <LineSupportCard />
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 px-6 py-3 bg-muted text-foreground rounded-xl font-bold shadow-sm hover:bg-muted/80 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          ลองอีกครั้ง
        </button>
        <Link
          href={ROUTES.HOME('th')}
          className="flex items-center gap-2 px-6 py-3 bg-icsn-teal text-white rounded-xl font-bold shadow-sm hover:bg-icsn-teal/90 transition-colors"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
