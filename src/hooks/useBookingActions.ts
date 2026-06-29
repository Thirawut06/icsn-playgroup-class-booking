import { useState } from 'react';
import { BookingService, PackageService } from '@/lib/supabase';
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
      
      const hasDuplicate = await BookingService.hasDuplicateBooking(selectedChildId, finalSessionId);
      if (hasDuplicate) {
        throw new Error("คุณได้จองสิทธิ์ให้น้องในรอบเวลานี้ไปแล้ว");
      }
      
      await BookingService.bookClass(parentId, selectedChildId, finalSessionId, pkgToUse.id);
      clearSelection();
      onSuccess();
    } catch (e: any) {
      setBookingError("ไม่สามารถจองได้: " + e.message);
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
      await BookingService.cancelBooking(bookingId, parentId);
      setCancelSuccess(true);
      onSuccess(); // Re-fetch data
    } catch (e: any) {
      setCancelError(e.message || "ไม่สามารถยกเลิกการจองได้");
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
