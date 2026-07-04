import React from 'react';
import { Loader2 } from 'lucide-react';
import { useDictionary } from '@/lib/i18n/dictionary-context';

interface BookingConfirmModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  childName: string;
  dateLabel: string;
  timeLabel: string;
  creditsToDeduct: number;
  onClose: () => void;
  onConfirm: () => void;
}

export function BookingConfirmModal({
  isOpen,
  isSubmitting,
  childName,
  dateLabel,
  timeLabel,
  creditsToDeduct,
  onClose,
  onConfirm
}: BookingConfirmModalProps) {
  const { dict } = useDictionary();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => !isSubmitting && onClose()}></div>
      <div className="bg-white rounded-3xl w-[calc(100%-2rem)] max-w-[400px] mx-auto shadow-2xl relative z-10 overflow-hidden border border-border animate-in zoom-in-95 duration-200">
        
        <div className="p-6 pb-2 text-center">
          <div className="w-16 h-16 bg-icsn-teal/10 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
            <span className="text-3xl leading-none">🎫</span>
          </div>
          <h3 className="text-xl font-black text-icsn-navy mb-1">{dict.book.confirmBookingTitle}</h3>
        </div>

        <div className="p-6 pt-4">
          <div className="bg-muted/50 rounded-2xl p-4 border border-border/50 space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-border/60 gap-4">
              <span className="text-sm font-bold text-muted-foreground shrink-0">{dict.book.studentLabel}</span>
              <span className="text-base font-bold text-icsn-navy text-right break-words">{childName}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-border/60 gap-4">
              <span className="text-sm font-bold text-muted-foreground shrink-0">{dict.book.dateLabel}</span>
              <span className="text-base font-bold text-icsn-navy text-right break-words">{dateLabel}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-border/60 gap-4">
              <span className="text-sm font-bold text-muted-foreground shrink-0">{dict.book.sessionLabel}</span>
              <span className="text-base font-bold text-icsn-navy text-right break-words">{timeLabel}</span>
            </div>
            <div className="flex justify-between items-center gap-4 pt-1">
              <span className="text-sm font-bold text-muted-foreground shrink-0">{dict.book.totalSummary}</span>
              <span className="text-lg font-black text-icsn-teal text-right break-words">{creditsToDeduct} {dict.book.credits}</span>
            </div>
          </div>
        </div>

        <div className="p-4 pt-0 grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-muted-foreground bg-muted hover:bg-muted/80 hover:text-foreground transition-colors disabled:opacity-50"
          >
            {dict.common.cancel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-icsn-teal hover:bg-icsn-teal/90 shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {dict.book.processing}
              </>
            ) : (
              dict.book.confirmBtn
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
