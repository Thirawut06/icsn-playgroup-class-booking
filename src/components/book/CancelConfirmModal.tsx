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
            <p className="text-muted-foreground text-base leading-relaxed mb-6 font-medium">
              ระบบได้ทำการคืนเครดิตให้คุณเรียบร้อยแล้ว
            </p>
            <button 
              onClick={onClose} 
              className="w-full py-3.5 bg-muted text-muted-foreground font-bold rounded-xl hover:bg-muted/80 transition"
            >
              ปิด
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-4 text-error">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-icsn-navy mb-2">ยืนยันการยกเลิก?</h3>
            <p className="text-muted-foreground text-base leading-relaxed mb-4 font-medium">
              ระบบจะทำการยกเลิกสิทธิ์และ <br/><span className="text-icsn-teal font-bold">คืนเครดิตให้ 1 ครั้ง</span>
            </p>
            
            {cancelError && (
              <div className="w-full bg-error/10 border border-error/20 text-error text-sm font-medium p-3 rounded-xl mb-4">
                {cancelError}
              </div>
            )}
            
            <div className="flex gap-3 w-full">
              <button 
                onClick={onClose} 
                disabled={isCancelling}
                className="flex-1 py-3.5 bg-muted text-muted-foreground font-bold rounded-xl hover:bg-muted/80 transition disabled:opacity-50"
              >
                ปิด
              </button>
              <button 
                onClick={onConfirm} 
                disabled={isCancelling}
                className="flex-1 py-3.5 bg-error text-white font-bold rounded-xl hover:bg-error shadow-lg shadow-error/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
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

