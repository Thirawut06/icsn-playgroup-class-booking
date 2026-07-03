import React from 'react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useDictionary } from '@/lib/i18n/dictionary-context';

interface CancelConfirmModalProps {
  isOpen: boolean;
  isCancelling: boolean;
  cancelError: string;
  cancelSuccess: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CancelConfirmModal({
  isOpen,
  isCancelling,
  cancelError,
  cancelSuccess,
  onClose,
  onConfirm
}: CancelConfirmModalProps) {
  const { dict } = useDictionary();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => !isCancelling && onClose()}></div>
      <div className="bg-white rounded-3xl w-[calc(100%-2rem)] max-w-[400px] mx-auto shadow-2xl relative z-10 overflow-hidden border border-border animate-in zoom-in-95 duration-200">
        
        {cancelSuccess ? (
          // Success State
          <div className="p-8 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-icsn-navy mb-2">{dict.book.cancelSuccess}</h3>
            <p className="text-muted-foreground text-[15px] leading-relaxed mb-8">
              {dict.book.cancelSuccessMsg}
            </p>
            <button
              onClick={onClose}
              className="w-full bg-icsn-navy hover:bg-icsn-navy/90 text-white font-bold py-3.5 px-6 rounded-xl transition-all"
            >
              {dict.common.close}
            </button>
          </div>
        ) : (
          // Confirm State
          <>
            <div className="p-6 pb-2 text-center">
              <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-icsn-navy mb-1">{dict.book.confirmCancelTitle}</h3>
            </div>

            <div className="p-6 pt-4 space-y-4">
              <div className="bg-error/5 border border-error/20 rounded-2xl p-5 text-center">
                <p className="text-[15px] text-error font-medium leading-relaxed">
                  {dict.book.cancelRefundNotice} <span className="font-bold">{dict.book.refundHighlight}</span>
                </p>
              </div>

              {cancelError && (
                <div className="bg-error/10 text-error p-3 rounded-xl text-sm border border-error/20 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="font-medium leading-relaxed">{cancelError}</p>
                </div>
              )}
            </div>

            <div className="p-4 pt-0 grid grid-cols-2 gap-3">
              <button
                onClick={onClose}
                disabled={isCancelling}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-muted-foreground bg-muted hover:bg-muted/80 hover:text-foreground transition-colors disabled:opacity-50"
              >
                {dict.common.back}
              </button>
              <button
                onClick={onConfirm}
                disabled={isCancelling}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-error hover:bg-error/90 shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {dict.book.processing}
                  </>
                ) : (
                  dict.book.confirmCancelBtn
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
