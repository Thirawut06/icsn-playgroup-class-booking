import { useState, useCallback, useEffect, FormEvent } from 'react';
import { AdminService } from '@/lib/supabase';
import { bookingModule, sessionModule, signatureModule } from '@/lib/domain';
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
  
  // Sessions State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  
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

  // 1. Fetch sessions when date changes
  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedSessions = await sessionModule.getOrCreateSessionsForDate(dailyDate);
      setSessions(fetchedSessions || []);
      
      if (fetchedSessions && fetchedSessions.length > 0) {
        // Only override if no session is selected OR selected session doesn't exist in new date
        if (!selectedSessionId || !fetchedSessions.find(s => s.id === selectedSessionId)) {
          setSelectedSessionId(fetchedSessions[0].id);
        }
      } else {
        setSelectedSessionId('');
        setAttendance([]);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [dailyDate, selectedSessionId]);

  useEffect(() => {
    Promise.resolve().then(() => loadSessions());
    // eslint-disable-next-line
  }, [dailyDate]);

  // 2. Fetch attendance when selected session changes
  const loadAttendance = useCallback(async () => {
    if (!selectedSessionId) return;
    
    setLoading(true);
    try {
      const rows = await AdminService.getDailyAttendance(selectedSessionId);
      setAttendance(rows);
      
      const activeSess = sessions.find(s => s.id === selectedSessionId);
      if (activeSess) {
        setCapacityEdit(String(activeSess.total_capacity));
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedSessionId, sessions]);

  useEffect(() => {
    Promise.resolve().then(() => loadAttendance());
    // eslint-disable-next-line
  }, [selectedSessionId]);

  const activeSession = sessions.find(s => s.id === selectedSessionId) || null;

  const handleWalkin = async (e: FormEvent) => {
    e.preventDefault();
    if (!walkinPhone || !walkinName || !selectedSessionId) return;
    setWalkinLoading(true);
    try {
      const { child_id } = await AdminService.adminAddWalkin(walkinPhone, walkinName);
      await bookingModule.adminBookClass(child_id, selectedSessionId, walkinFree);
      setWalkinPhone('');
      setWalkinName('');
      setWalkinFree(false);
      await loadAttendance();
      onRefresh?.();
      toast.success(COPY.ALERTS.WALKIN_SUCCESS);
    } catch (err) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(getErrorMessage(err)));
    } finally {
      setWalkinLoading(false);
    }
  };

  // ── Check-in with e-signature ─────────────────────────────────────────────
  const handleCheckin = async (bookingId: string, signatureBlob: Blob) => {
    // 1. Upload to Supabase Storage and save to booking row
    const signatureUrl = await signatureModule.uploadSignature(bookingId, signatureBlob);
    await signatureModule.saveCheckinSignature(bookingId, signatureUrl);

    // 2. Trigger Google Drive sync in the background (fire-and-forget)
    const row = attendance.find(r => r.id === bookingId);
    if (row && activeSession) {
      fetch('/api/trigger-drive-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          signatureUrl,
          parentName: row.parent_name,
          parentPhone: row.parent_phone,
          childName: row.nickname,
          sessionDate: dailyDate,
          sessionLabel: activeSession.time_label,
        }),
      }).catch(err => console.error('[drive-sync] background sync failed:', err));
    }

    // 3. Refresh the table to show ✅ badge
    await loadAttendance();
    toast.success(`เช็คอินสำเร็จ! ${row?.nickname ?? ''} ลงชื่อแล้ว`);
  };

  const handleCancel = async (bookingId: string) => {
    const reason = prompt('เหตุผลในการยกเลิก (จำเป็น):', 'Admin cancelled from daily tab');
    if (!reason?.trim()) return;
    if (!confirm('แน่ใจหรือไม่ว่าต้องการยกเลิกการจองนี้? (ระบบจะคืนเครดิตให้อัตโนมัติ)')) return;
    try {
      await bookingModule.cancelBookingAsAdmin(bookingId, reason.trim());
      await loadAttendance();
      await loadSessions(); // update booked_count
      onRefresh?.();
    } catch (err) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(getErrorMessage(err)));
    }
  };

  const handleSaveCapacity = async () => {
    if (!selectedSessionId) return;
    const cap = parseInt(capacityEdit, 10);
    if (!cap || cap < 1) {
      toast.error(COPY.ALERTS.INVALID_CAPACITY);
      return;
    }
    setSavingCapacity(true);
    try {
      const updated = await sessionModule.updateSessionCapacity(selectedSessionId, cap);
      // Update local sessions array
      setSessions(prev => prev.map(s => s.id === selectedSessionId ? updated : s));
      toast.success(COPY.ALERTS.UPDATE_CAPACITY_SUCCESS);
    } catch (err) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(getErrorMessage(err)));
    } finally {
      setSavingCapacity(false);
    }
  };

  const handleToggleSession = async () => {
    if (!activeSession) return;
    const newState = !activeSession.is_active;
    let reason = '';
    if (!newState) {
      const input = prompt('ยืนยันการปิดรับจองรอบนี้? ระบบจะยกเลิกการจองและคืนเครดิตอัตโนมัติ (สำหรับ Walk-in ต้องโอนเงินคืนเอง)\\n\\nกรุณากรอกเหตุผล (เช่น ครูลาป่วย, เต็มแล้ว):');
      if (input === null) return; // User cancelled
      reason = input.trim() || 'ปิดรับจอง (ไม่มีเหตุผล)';
    } else {
      if (!confirm('เปิดรับจองรอบนี้อีกครั้ง?')) return;
    }
    
    setTogglingSession(true);
    try {
      if (!newState) {
        // Closing session with reason
        await sessionModule.adminCloseSession(selectedSessionId, reason);
        toast.success("ปิดรับจองเรียบร้อย คืนเครดิตให้ลูกค้าที่มีแพ็กเกจแล้ว");
      } else {
        // Re-opening session
        await sessionModule.toggleSessionActive(selectedSessionId, true);
        toast.success("เปิดรับจองรอบนี้อีกครั้ง");
      }
      const updatedSess = await AdminService.getSessionForDate(dailyDate, activeSession.time_label as string);
      if (updatedSess) {
        setSessions(prev => prev.map(s => s.id === selectedSessionId ? updatedSess : s));
      }
    } catch (err) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(getErrorMessage(err)));
    } finally {
      setTogglingSession(false);
    }
  };

  const bookedCount = activeSession?.booked_count ?? attendance.length;
  const totalCapacity = activeSession?.total_capacity ?? (parseInt(capacityEdit, 10) || CLASS_CONFIG.DEFAULT_CAPACITY);
  const sessionIsActive = activeSession?.is_active !== false;

  return {
    dailyDate,
    setDailyDate,
    sessions,
    selectedSessionId,
    setSelectedSessionId,
    attendance,
    session: activeSession,
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
    handleCheckin,
    handleSaveCapacity,
    handleToggleSession,
    refreshData: loadAttendance,
  };
}
