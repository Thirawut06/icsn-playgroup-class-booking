import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

interface CancelConfirmModalProps {
  isOpen: boolean;
  isCancelling: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CancelConfirmModal({ isOpen, isCancelling, onClose, onConfirm }: CancelConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-[24px] p-6 w-full max-w-[320px] shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4 text-rose-500">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-icsn-navy mb-2">ยืนยันการยกเลิก?</h3>
        <p className="text-gray-500 text-base leading-relaxed mb-6 font-medium">
          ระบบจะทำการยกเลิกสิทธิ์และ <br/><span className="text-icsn-teal font-bold">คืนเครดิตให้ 1 ครั้ง</span>
        </p>
        
        <div className="flex gap-3 w-full">
          <button 
            onClick={onClose} 
            disabled={isCancelling}
            className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
          >
            ปิด
          </button>
          <button 
            onClick={onConfirm} 
            disabled={isCancelling}
            className="flex-1 py-3.5 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 shadow-lg shadow-rose-500/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isCancelling ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ยืนยันยกเลิก'}
          </button>
        </div>
      </div>
    </div>
  );
}

