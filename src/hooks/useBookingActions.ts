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
      let finalSessionId = selectedSession?.id;
      if (!finalSessionId) {
        const newSess = await BookingService.getOrCreateSession(selectedDate);
        finalSessionId = newSess.id;
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

  const executeCancel = async (bookingId: string) => {
    setIsCancelling(true);
    try {
      const latestPkg = await PackageService.getLatestPackage(parentId);
      if (!latestPkg) {
        alert("ไม่พบข้อมูลแพ็กเกจในระบบ ไม่สามารถคืนเครดิตได้ โปรดติดต่อแอดมิน");
        return;
      }
      
      await BookingService.cancelBooking(bookingId, latestPkg.id);
      alert("ยกเลิกการจองสำเร็จ คืนเครดิตเรียบร้อย");
      onSuccess();
    } catch (e: any) {
      alert("ไม่สามารถยกเลิกการจองได้: " + e.message);
    } finally {
      setIsCancelling(false);
    }
  };

  return {
    isSubmitting,
    bookingError,
    setBookingError,
    isCancelling,
    confirmBookClass,
    executeCancel
  };
}
