import { useState, useCallback, useEffect, FormEvent } from 'react';
import { AdminService, BookingService } from '@/lib/supabase';
import type { DailyAttendanceRow, Session } from '@/types';
import { CLASS_CONFIG } from '@/config/constants';

interface UseDailyAttendanceOptions {
  onRefresh?: () => void;
}

export function useDailyAttendance({ onRefresh }: UseDailyAttendanceOptions = {}) {
  const [dailyDate, setDailyDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<DailyAttendanceRow[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Walk-in form state
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinName, setWalkinName] = useState('');
  const [walkinFree, setWalkinFree] = useState(false);
  const [walkinLoading, setWalkinLoading] = useState(false);
  
  // Capacity form state
  const [capacityEdit, setCapacityEdit] = useState('');
  const [savingCapacity, setSavingCapacity] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, sess] = await Promise.all([
        AdminService.getDailyAttendance(dailyDate),
        AdminService.getSessionForDate(dailyDate),
      ]);
      setAttendance(rows);
      setSession(sess);
      setCapacityEdit(sess ? String(sess.total_capacity) : String(CLASS_CONFIG.DEFAULT_CAPACITY));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [dailyDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleWalkin = async (e: FormEvent) => {
    e.preventDefault();
    if (!walkinPhone || !walkinName) return;
    setWalkinLoading(true);
    try {
      const sess = await BookingService.getOrCreateSession(dailyDate);
      const { child_id } = await AdminService.adminAddWalkin(walkinPhone, walkinName);
      await AdminService.adminBookClass(child_id, sess.id, walkinFree);
      setWalkinPhone('');
      setWalkinName('');
      await loadData();
      onRefresh?.();
      alert('บันทึก Walk-in สำเร็จ!');
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setWalkinLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    const reason = prompt('เหตุผลในการยกเลิก (จำเป็น):', 'Admin cancelled from daily tab');
    if (!reason?.trim()) return;
    if (!confirm('แน่ใจหรือไม่ว่าต้องการยกเลิกการจองนี้? (ระบบจะคืนเครดิตให้อัตโนมัติ)')) return;
    try {
      await AdminService.invokeAdminAction('cancel-booking', { bookingId, cancelReason: reason.trim() });
      await loadData();
      onRefresh?.();
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleSaveCapacity = async () => {
    if (!session) {
      alert('ยังไม่มี session สำหรับวันนี้ — สร้างเมื่อมีการจองหรือ walk-in');
      return;
    }
    const cap = parseInt(capacityEdit, 10);
    if (!cap || cap < 1) {
      alert('กรุณาระบุจำนวนที่นั่งที่ถูกต้อง');
      return;
    }
    setSavingCapacity(true);
    try {
      const updated = await AdminService.updateSessionCapacity(session.id, cap);
      setSession(updated);
      alert('อัปเดตจำนวนที่นั่งสำเร็จ');
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSavingCapacity(false);
    }
  };

  const bookedCount = session?.booked_count ?? attendance.length;
  const totalCapacity = session?.total_capacity ?? (parseInt(capacityEdit, 10) || CLASS_CONFIG.DEFAULT_CAPACITY);

  return {
    dailyDate,
    setDailyDate,
    attendance,
    session,
    loading,
    walkinPhone,
    setWalkinPhone,
    walkinName,
    setWalkinName,
    walkinFree,
    setWalkinFree,
    walkinLoading,
    capacityEdit,
    setCapacityEdit,
    savingCapacity,
    bookedCount,
    totalCapacity,
    handleWalkin,
    handleCancel,
    handleSaveCapacity,
    refreshData: loadData,
  };
}
