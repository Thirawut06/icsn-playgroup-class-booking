import React from 'react';
import { ReceiptText, Hand, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { Child } from '@/types';

interface BookingSummaryProps {
  selectedDate: string | null;
  selectedDateAvailable: boolean;
  selectedSessionStatus: string;
  selectedChildObj?: Child;
  creditsRemaining: number;
  selectedChildId: string;
  isSubmitting: boolean;
  bookingSuccess: boolean;
  bookingError: string;
  onBookClass: () => void;
}

export function BookingSummary({
  selectedDate,
  selectedDateAvailable,
  selectedSessionStatus,
  selectedChildObj,
  creditsRemaining,
  selectedChildId,
  isSubmitting,
  bookingSuccess,
  bookingError,
  onBookClass,
}: BookingSummaryProps) {
  let selectedThaiMonthMin = '';
  let selectedDayNum = '';
  let selectedThaiFullDate = '';

  if (selectedDate) {
    const d = new Date(selectedDate);
    const thaiMonthsMin = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    selectedThaiMonthMin = thaiMonthsMin[d.getMonth()];
    selectedDayNum = String(d.getDate());
    selectedThaiFullDate = d.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  return (
    <div className="pb-10">
      <div className="bg-white rounded-[20px] border border-gray-100 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-5">
        <h3 className="font-bold text-[#211551] border-b border-gray-100 pb-3 flex items-center gap-1.5 text-[15px]">
          <ReceiptText className="w-5 h-5 text-[#00B0B9]" />
          <span>3. สรุปการจองสิทธิ์</span>
        </h3>

        {!selectedDate ? (
          <div className="text-center py-8 text-gray-400 space-y-2">
            <div className="inline-flex p-4 bg-gray-50 text-[#00B0B9]/40 rounded-full mb-1">
              <Hand className="w-8 h-8" />
            </div>
            <p className="text-[13px] font-bold text-gray-500">กรุณาแตะเลือกวันที่ในปฏิทิน</p>
            <p className="text-[11px]">* ระบบแสดงรอบเรียนล่วงหน้า 2 เดือน</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Date Card summary */}
            <div className="bg-[#00B0B9]/5 border border-[#00B0B9]/20 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-[#00B0B9] text-white rounded-[14px] flex flex-col items-center justify-center shrink-0 shadow-sm">
                <span className="text-[10px] font-bold leading-none">{selectedThaiMonthMin}</span>
                <span className="text-xl font-black leading-none mt-0.5">{selectedDayNum}</span>
              </div>
              <div>
                <h4 className="font-bold text-[#211551] text-[14px]">
                  เวลา 09:30 - 11:30 น.
                </h4>
                <p className="text-[12px] text-[#00B0B9] font-bold mt-0.5">
                  {selectedThaiFullDate}
                </p>
              </div>
            </div>

            {/* Selected Child Details */}
            {selectedChildObj && (
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <span className="text-[13px] font-bold text-[#211551]/70">ชื่อนักเรียน:</span>
                <span className="text-[15px] font-black text-[#211551]">
                  {selectedChildObj.nickname}
                </span>
              </div>
            )}

            {/* Simple Status */}
            <div className="flex items-center justify-between bg-[#211551]/5 p-4 rounded-2xl border border-[#211551]/10">
              <span className="text-[13px] font-bold text-[#211551]/70">สถานะคลาสเรียน:</span>
              <span className={`text-[15px] font-black inline-flex items-center gap-1.5 ${selectedDateAvailable ? 'text-[#00B0B9]' : 'text-rose-500'}`}>
                <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${selectedDateAvailable ? 'bg-[#00B0B9]' : 'bg-rose-500'}`}></span>
                <span>{selectedSessionStatus}</span>
              </span>
            </div>

            {/* Error */}
            {bookingError && (
              <div className="bg-rose-50 text-rose-700 border border-rose-100 p-4 rounded-2xl text-[13px] flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="font-bold">{bookingError}</span>
              </div>
            )}

            {/* Success */}
            {bookingSuccess && (
              <div className="bg-[#00B0B9]/10 text-[#00B0B9] border border-[#00B0B9]/20 p-4 rounded-2xl text-[13px] flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#00B0B9] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">สำรองที่เรียนสำเร็จแล้ว!</h4>
                  <p className="text-[#00B0B9]/80 mt-1 font-medium">
                    ระบบได้ลดสิทธิ์ 1 ครั้งและลงคิวเรียนในระบบเรียบร้อย
                  </p>
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="pt-2">
              <button
                onClick={onBookClass}
                disabled={isSubmitting || bookingSuccess || !selectedDateAvailable || creditsRemaining <= 0 || !selectedChildId}
                className="w-full bg-[#00B0B9] hover:bg-[#00969e] text-white py-4 rounded-[14px] font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-[15px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none hover:-translate-y-0.5 active:translate-y-0"
              >
                {!isSubmitting ? (
                  <span>ยืนยันการจองสิทธิ์ (หัก 1 Credit)</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                    กำลังทำรายการ...
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
