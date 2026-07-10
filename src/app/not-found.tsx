import React from 'react';
import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { LineSupportCard } from '@/components/ui/LineSupportCard';
import { ROUTES } from '@/config/routes';

export default function NotFound() {
  return (
    <div className="max-w-[480px] mx-auto bg-white min-h-screen shadow-[0_0_20px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
        <FileQuestion className="w-10 h-10 text-muted-foreground" />
      </div>
      
      <h1 className="text-2xl font-extrabold text-foreground mb-2">
        ไม่พบหน้าที่ต้องการ
      </h1>
      <p className="text-muted-foreground mb-8 text-sm">
        ดูเหมือนว่าลิงก์ที่คุณเข้ามาอาจไม่ถูกต้อง หรือหน้านี้ถูกลบไปแล้ว
      </p>

      <div className="w-full max-w-sm mb-6">
        <LineSupportCard />
      </div>

      <Link
        href={ROUTES.HOME('th')}
        className="flex items-center gap-2 px-6 py-3 bg-icsn-teal text-white rounded-xl font-bold shadow-sm hover:bg-icsn-teal/90 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        กลับหน้าหลัก
      </Link>
    </div>
  );
}
