import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { BookingService } from '@/lib/supabase';
import { AdminBookingService } from '@/lib/services/admin-booking.service';
import type { Session } from '@/types';

interface UseAdminManageCreditsProps {
  isOpen: boolean;
  initialMode: 'credits' | 'book';
  parentId: string;
  parentPhone: string;
  childrenList: any[];
  totalCredits: number;
  onSuccess: () => void;
  onClose: () => void;
}

export function useAdminManageCredits({
  isOpen,
  initialMode,
  parentId,
  parentPhone,
  childrenList,
  totalCredits,
  onSuccess,
  onClose
}: UseAdminManageCreditsProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Tab 1: Adjust Credits
  const [creditAmount, setCreditAmount] = useState<number | string>(0);
  const [creditReason, setCreditReason] = useState('');

  // Tab 2: Book Class
  const [selectedChildId, setSelectedChildId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [paymentType, setPaymentType] = useState<'deduct' | 'paid' | 'trial'>('deduct');
  const [availableSessions, setAvailableSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  const fetchUpcomingSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 60);
      const startStr = startDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 60);
      const endStr = endDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
      
      const sessions = await BookingService.getSessions(startStr, endStr);
      const activeSessions = sessions.filter(s => s.is_active);
      setAvailableSessions(activeSessions);
    } catch (err: any) {
      toast.error('โหลดรอบเรียนไม่สำเร็จ');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCreditAmount(0);
      setCreditReason('');
      
      if (childrenList.length === 1) {
        setSelectedChildId(childrenList[0].id);
      } else {
        setSelectedChildId('');
      }
      
      setSelectedSessionId('');
      
      if (totalCredits > 0) {
        setPaymentType('deduct');
      } else {
        setPaymentType('paid');
      }

      if (initialMode === 'book') {
        fetchUpcomingSessions();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialMode, childrenList, totalCredits]);

  const handleAdjustCredits = async () => {
    const amount = typeof creditAmount === 'string' ? parseInt(creditAmount) : creditAmount;
    if (!amount || isNaN(amount) || amount === 0) {
      toast.error('กรุณาระบุจำนวนเครดิตให้ถูกต้อง (ห้ามเป็น 0)');
      return;
    }

    if (amount < 0 && Math.abs(amount) > totalCredits) {
      toast.error('ไม่สามารถลดเครดิตได้มากกว่าจำนวนเครดิตที่มีอยู่');
      return;
    }

    setIsSaving(true);
    try {
      const finalReason = creditReason.trim() || (amount > 0 ? 'Admin เพิ่มเครดิต (Manual)' : 'Admin ลดเครดิต (Manual)');
      await AdminBookingService.adjustCredits(parentId, amount, finalReason);
      toast.success('ปรับปรุงเครดิตเรียบร้อยแล้ว');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBookClass = async () => {
    if (!selectedChildId) {
      toast.error('กรุณาเลือกเด็ก');
      return;
    }
    if (!selectedSessionId) {
      toast.error('กรุณาเลือกรอบเรียน');
      return;
    }
    if (paymentType === 'deduct' && totalCredits <= 0) {
      toast.error('สิทธิ์คงเหลือไม่พอสำหรับหักเครดิต');
      return;
    }

    const child = childrenList.find(c => c.id === selectedChildId);
    if (!child) return;
    const childName = child.nickname || child.full_name;

    setIsSaving(true);
    try {
      await AdminBookingService.adminProcessWalkin({
        phone: parentPhone,
        childId: selectedChildId,
        childName,
        sessionId: selectedSessionId,
        paymentType
      });
      toast.success('จองคลาสเรียบร้อยแล้ว');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('จองไม่สำเร็จ: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    creditAmount,
    setCreditAmount,
    creditReason,
    setCreditReason,
    selectedChildId,
    setSelectedChildId,
    selectedSessionId,
    setSelectedSessionId,
    paymentType,
    setPaymentType,
    availableSessions,
    isLoadingSessions,
    handleAdjustCredits,
    handleBookClass,
  };
}
