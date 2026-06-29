import React from 'react';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

interface CancelConfirmModalProps {
  isOpen: boolean;
  isCancelling: boolean;
  cancelError?: string;
  cancelSuccess?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CancelConfirmModal({ isOpen, isCancelling, cancelError, cancelSuccess, onClose, onConfirm }: CancelConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        
        {cancelSuccess ? (
          <>
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4 text-icsn-teal">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-icsn-navy mb-2">ยกเลิกสำเร็จ</h3>
            <p className="text-gray-500 text-base leading-relaxed mb-6 font-medium">
              ระบบได้ทำการคืนเครดิตให้คุณเรียบร้อยแล้ว
            </p>
            <button 
              onClick={onClose} 
              className="w-full py-3.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition"
            >
              ปิด
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4 text-rose-500">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-icsn-navy mb-2">ยืนยันการยกเลิก?</h3>
            <p className="text-gray-500 text-base leading-relaxed mb-4 font-medium">
              ระบบจะทำการยกเลิกสิทธิ์และ <br/><span className="text-icsn-teal font-bold">คืนเครดิตให้ 1 ครั้ง</span>
            </p>
            
            {cancelError && (
              <div className="w-full bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium p-3 rounded-xl mb-4">
                {cancelError}
              </div>
            )}
            
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
          </>
        )}
      </div>
    </div>
  );
}

