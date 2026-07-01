import { useState } from 'react';
import { bookingModule } from '@/lib/domain';
import type { Session, Package } from '@/types';

interface UseBookingActionsProps {
  parentId: string;
  selectedChildId: string;
  selectedDates: string[];
  selectedSessionsMap: Record<string, Session>;
  packages: Package[];
  onSuccess: () => void;
  clearSelection: () => void;
}

export function useBookingActions({
  parentId,
  selectedChildId,
  selectedDates,
  selectedSessionsMap,
  packages,
  onSuccess,
  clearSelection
}: UseBookingActionsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const confirmBookClass = async () => {
    if (selectedDates.length === 0 || !selectedChildId || packages.length === 0) return;
    
    setIsSubmitting(true);
    setBookingError('');
    
    try {
      const sessionIds = selectedDates.map(date => {
        const s = selectedSessionsMap[date];
        if (!s) throw new Error(`กรุณาเลือกรอบเวลาสำหรับวันที่ ${date}`);
        return s.id;
      });

      // We don't manually check duplicates here anymore, we let the RPC handle the batch transaction
      // and fail entirely if there's an issue. It's atomic.
      await bookingModule.bookClassesBatch(parentId, selectedChildId, sessionIds);
      
      clearSelection();
      onSuccess();
    } catch (e: unknown) {
      setBookingError("ไม่สามารถจองได้: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const [cancelError, setCancelError] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const executeCancel = async (bookingId: string) => {
    setIsCancelling(true);
    setCancelError('');
    setCancelSuccess(false);
    try {
      await bookingModule.cancelBookingAsParent(bookingId, parentId);
      setCancelSuccess(true);
      onSuccess(); // Re-fetch data
    } catch (e: unknown) {
      setCancelError(e instanceof Error && e.message ? e.message : "ไม่สามารถยกเลิกการจองได้");
    } finally {
      setIsCancelling(false);
    }
  };

  const resetCancelState = () => {
    setCancelError('');
    setCancelSuccess(false);
  };

  return {
    isSubmitting,
    bookingError,
    setBookingError,
    isCancelling,
    cancelError,
    cancelSuccess,
    resetCancelState,
    confirmBookClass,
    executeCancel
  };
}
