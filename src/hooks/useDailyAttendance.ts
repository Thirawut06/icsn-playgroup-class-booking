import { useState, useCallback, useEffect, FormEvent } from 'react';
import { AdminService, BookingService } from '@/lib/supabase';
import type { DailyAttendanceRow, Session } from '@/types';
import { CLASS_CONFIG } from '@/config/constants';
import toast from 'react-hot-toast';
import { COPY } from '@/config/copy';
import { getErrorMessage } from '@/lib/utils';
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
  const [togglingSession, setTogglingSession] = useState(false);

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
    // eslint-disable-next-line
    loadData();
  }, [loadData]);

  const handleWalkin = async (e: FormEvent) => {
    e.preventDefault();
    if (!walkinPhone || !walkinName) return;
    setWalkinLoading(true);
    try {
      const sessions = await BookingService.getOrCreateSessionsForDate(dailyDate);
      if (!sessions || sessions.length === 0) throw new Error("ไม่พบรอบเรียนสำหรับวันนี้");
      const sess = sessions[0]; // TODO: Allow selecting specific session for walk-ins
      const { child_id } = await AdminService.adminAddWalkin(walkinPhone, walkinName);
      await AdminService.adminBookClass(child_id, sess.id, true);
      setWalkinPhone('');
      setWalkinName('');
      await loadData();
      onRefresh?.();
      toast.success(COPY.ALERTS.WALKIN_SUCCESS);
    } catch (err) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(getErrorMessage(err)));
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
      toast.error(COPY.ALERTS.ERROR_GENERIC(getErrorMessage(err)));
    }
  };

  const handleSaveCapacity = async () => {
    if (!session) {
      toast.error(COPY.ALERTS.NO_SESSION_YET);
      return;
    }
    const cap = parseInt(capacityEdit, 10);
    if (!cap || cap < 1) {
      toast.error(COPY.ALERTS.INVALID_CAPACITY);
      return;
    }
    setSavingCapacity(true);
    try {
      const updated = await AdminService.updateSessionCapacity(session.id, cap);
      setSession(updated);
      toast.success(COPY.ALERTS.UPDATE_CAPACITY_SUCCESS);
    } catch (err) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(getErrorMessage(err)));
    } finally {
      setSavingCapacity(false);
    }
  };

  const handleToggleSession = async () => {
    if (!session) {
      toast.error(COPY.ALERTS.NO_SESSION_FOUND);
      return;
    }
    const newState = !session.is_active;
    const msg = newState
      ? 'เปิดรับจองวันนี้อีกครั้ง?'
      : 'ปิดรับจองวันนี้ (ผู้ปกครองจะไม่สามารถจองวันนี้ได้)?';
    if (!confirm(msg)) return;
    setTogglingSession(true);
    try {
      await AdminService.toggleSessionActive(session.id, newState);
      setSession({ ...session, is_active: newState });
    } catch (err) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(getErrorMessage(err)));
    } finally {
      setTogglingSession(false);
    }
  };

  const bookedCount = session?.booked_count ?? attendance.length;
  const totalCapacity = session?.total_capacity ?? (parseInt(capacityEdit, 10) || CLASS_CONFIG.DEFAULT_CAPACITY);
  const sessionIsActive = session?.is_active !== false;

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
    sessionIsActive,
    togglingSession,
    handleWalkin,
    handleCancel,
    handleSaveCapacity,
    handleToggleSession,
    refreshData: loadData,
  };
}
