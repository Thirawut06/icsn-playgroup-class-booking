import React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface BookingConfirmModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  childName: string;
  dateLabel: string;
  timeLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function BookingConfirmModal({
  isOpen,
  isSubmitting,
  childName,
  dateLabel,
  timeLabel,
  onClose,
  onConfirm,
}: BookingConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-[24px] p-6 w-full max-w-[320px] shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-[#00B0B9]/10 rounded-full flex items-center justify-center mb-4 text-[#00B0B9]">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-[18px] font-black text-[#211551] mb-2">ยืนยันการจองสิทธิ์?</h3>
        
        <div className="w-full bg-gray-50 rounded-2xl p-4 mb-5 space-y-2 text-left">
          <div className="flex justify-between text-[14px]">
            <span className="text-gray-500 font-medium">นักเรียน:</span>
            <span className="font-bold text-[#211551]">{childName}</span>
          </div>
          <div className="flex justify-between text-[14px]">
            <span className="text-gray-500 font-medium">วันที่:</span>
            <span className="font-bold text-[#00B0B9]">{dateLabel}</span>
          </div>
          <div className="flex justify-between text-[14px]">
            <span className="text-gray-500 font-medium">รอบเวลา:</span>
            <span className="font-bold text-[#211551]">{timeLabel}</span>
          </div>
        </div>

        <p className="text-gray-400 text-[12px] mb-5 font-medium">
          ระบบจะหักสิทธิ์ <span className="text-[#00B0B9] font-bold">1 Credit</span> จากแพ็กเกจของคุณ
        </p>

        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-[14px] hover:bg-gray-200 transition disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 py-3.5 bg-[#00B0B9] text-white font-bold rounded-[14px] hover:bg-[#00969e] shadow-lg shadow-[#00B0B9]/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ยืนยันจอง'}
          </button>
        </div>
      </div>
    </div>
  );
}
