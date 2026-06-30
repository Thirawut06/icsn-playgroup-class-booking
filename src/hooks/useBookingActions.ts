import { useState } from 'react';
import { bookingModule } from '@/lib/domain';
import type { Session, Package } from '@/types';

interface UseBookingActionsProps {
  parentId: string;
  selectedChildId: string;
  selectedDate: string | null;
  selectedSession: Session | null;
  packages: Package[];
  onSuccess: () => void;
  clearSelection: () => void;
}

export function useBookingActions({
  parentId,
  selectedChildId,
  selectedDate,
  selectedSession,
  packages,
  onSuccess,
  clearSelection
}: UseBookingActionsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const confirmBookClass = async () => {
    if (!selectedDate || !selectedChildId || packages.length === 0) return;
    const pkgToUse = packages[0];
    
    setIsSubmitting(true);
    setBookingError('');
    
    try {
      const finalSessionId = selectedSession?.id;
      if (!finalSessionId) {
        throw new Error("กรุณาเลือกรอบเวลาที่ต้องการจอง");
      }
      
      const hasDuplicate = await bookingModule.hasDuplicateBooking(selectedChildId, finalSessionId);
      if (hasDuplicate) {
        throw new Error("คุณได้จองสิทธิ์ให้น้องในรอบเวลานี้ไปแล้ว");
      }
      
      await bookingModule.bookClass(parentId, selectedChildId, finalSessionId);
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

