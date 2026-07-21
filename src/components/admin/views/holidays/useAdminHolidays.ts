import { useState, useEffect } from 'react';
import { AdminService, SettingsService, supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { COPY } from '@/config/copy';
import type { SchoolClosure, Session } from '@/types';

export function useAdminHolidays() {
  const [closures, setClosures] = useState<SchoolClosure[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [operatingDays, setOperatingDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [loading, setLoading] = useState(true);
  const [monthIndex, setMonthIndex] = useState(0);

  // Selection State
  const [selectionMode, setSelectionMode] = useState<'range' | 'multi'>('multi');
  const [rangeStart, setRangeStart] = useState<string>('');
  const [rangeEnd, setRangeEnd] = useState<string>('');
  const [isPickingRangeEnd, setIsPickingRangeEnd] = useState(false);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [multiDates, setMultiDates] = useState<string[]>([]);

  const [overrideStatus, setOverrideStatus] = useState<'open' | 'closed' | 'reset'>('closed');
  const [overrideReason, setOverrideReason] = useState('');

  // Save states
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingOverride, setSavingOverride] = useState(false);

  // Local operating days for editing before save
  const [tempOperatingDays, setTempOperatingDays] = useState<number[]>([]);

  useEffect(() => {
    fetchData();
  }, [monthIndex]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [closuresData, settingsData] = await Promise.all([
        AdminService.getSchoolClosures(),
        SettingsService.getAllSettings()
      ]);
      setClosures(closuresData);

      const ops = settingsData.operating_days || [0, 1, 2, 3, 4, 5, 6];
      setOperatingDays(ops);
      if (tempOperatingDays.length === 0) {
        setTempOperatingDays(ops);
      }

      // Fetch sessions for the current view month
      const currentViewDate = new Date();
      currentViewDate.setMonth(currentViewDate.getMonth() + monthIndex);
      const year = currentViewDate.getFullYear();
      const month = currentViewDate.getMonth();
      
      const yearStr = year;
      const monthStr = String(month + 1).padStart(2, '0');
      const monthStart = `${yearStr}-${monthStr}-01`;
      
      const lastDay = new Date(year, month + 1, 0).getDate();
      const monthEnd = `${yearStr}-${monthStr}-${String(lastDay).padStart(2, '0')}`;

      const allDates = [monthStart, monthEnd];
      if (rangeStart) allDates.push(rangeStart);
      if (rangeEnd) allDates.push(rangeEnd);
      if (multiDates && multiDates.length > 0) allDates.push(...multiDates);
      
      allDates.sort();
      const fetchStart = allDates[0];
      const fetchEnd = allDates[allDates.length - 1];

      const { data: sessionsData, error: sessionsErr } = await supabase
        .from('sessions')
        .select('id, session_date, time_label, is_active, total_capacity, booked_count, theme')
        .gte('session_date', fetchStart)
        .lte('session_date', fetchEnd);

      if (sessionsErr) throw sessionsErr;
      setSessions(sessionsData || []);

    } catch (err) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await SettingsService.updateAllSettings({ operating_days: tempOperatingDays });
      setOperatingDays(tempOperatingDays);
      toast.success('บันทึกวันทำการพื้นฐานเรียบร้อยแล้ว');
    } catch (err) {
      toast.error('ไม่สามารถบันทึกการตั้งค่าได้');
    } finally {
      setSavingSettings(false);
    }
  };

  const toggleTempDay = (day: number) => {
    if (tempOperatingDays.includes(day)) {
      setTempOperatingDays(tempOperatingDays.filter(d => d !== day));
    } else {
      setTempOperatingDays([...tempOperatingDays, day].sort());
    }
  };

  const handleDayClick = (dateStr: string, isCurrentlyOpen: boolean, existingClosure: SchoolClosure | undefined) => {
    if (selectionMode === 'range') {
      if (!isPickingRangeEnd || !rangeStart) {
        setRangeStart(dateStr);
        setRangeEnd(dateStr);
        setIsPickingRangeEnd(true);
      } else {
        if (dateStr >= rangeStart) {
          setRangeEnd(dateStr);
        } else {
          setRangeEnd(rangeStart);
          setRangeStart(dateStr);
        }
        setIsPickingRangeEnd(false);
        setHoverDate(null);
      }
    } else {
      if (multiDates.includes(dateStr)) {
        setMultiDates(multiDates.filter(d => d !== dateStr));
      } else {
        setMultiDates([...multiDates, dateStr].sort());
      }
    }

    if (existingClosure) {
      setOverrideStatus(existingClosure.is_force_open ? 'open' : 'closed');
      setOverrideReason(existingClosure.reason || '');
    } else {
      setOverrideStatus('closed');
      setOverrideReason('');
    }
  };

  const handleSaveOverride = async () => {
    setSavingOverride(true);

    try {
      if (overrideStatus === 'reset') {
        const datesToReset: string[] = [];
        if (selectionMode === 'range') {
          if (!rangeStart || !rangeEnd) { toast.error('กรุณาระบุช่วงวันที่'); setSavingOverride(false); return; }
          let curr = new Date(rangeStart);
          const end = new Date(rangeEnd);
          while (curr <= end) {
            datesToReset.push(curr.toISOString().split('T')[0]);
            curr.setDate(curr.getDate() + 1);
          }
        } else {
          datesToReset.push(...multiDates);
        }

        if (datesToReset.length === 0) { toast.error('กรุณาเลือกวัน'); setSavingOverride(false); return; }

        const closureIdsToDelete = new Set<string>();
        for (const date of datesToReset) {
          const overlappingClosures = closures.filter(c => date >= c.start_date && date <= c.end_date);
          overlappingClosures.forEach(c => closureIdsToDelete.add(c.id));
        }
        await Promise.all(Array.from(closureIdsToDelete).map(id => AdminService.deleteSchoolClosure(id)));
        await AdminService.bulkReopenSpecificDays(datesToReset);

        toast.success('ยกเลิกการตั้งค่าเรียบร้อยแล้ว');
      } else {
        if (selectionMode === 'range') {
          if (!rangeStart || !rangeEnd) { toast.error('กรุณาระบุช่วงวันที่'); setSavingOverride(false); return; }
          if (rangeStart > rangeEnd) { toast.error('วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด'); setSavingOverride(false); return; }

          await AdminService.setDateStatus(rangeStart, rangeEnd, overrideStatus === 'open', overrideReason);
        } else {
          if (multiDates.length === 0) { toast.error('กรุณาเลือกอย่างน้อย 1 วัน'); setSavingOverride(false); return; }

          await Promise.all(multiDates.map(date =>
            AdminService.setDateStatus(date, date, overrideStatus === 'open', overrideReason)
          ));
        }
        toast.success('บันทึกสำเร็จ');
      }

      setRangeStart(''); setRangeEnd(''); setIsPickingRangeEnd(false); setOverrideReason(''); setMultiDates([]);
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการบันทึก/ยกเลิก');
    } finally {
      setSavingOverride(false);
      fetchData();
    }
  };

  const handleDeleteClosure = async (targetId: string | string[]) => {
    try {
      if (Array.isArray(targetId)) {
        await Promise.all(targetId.map(id => AdminService.deleteSchoolClosure(id)));
      } else {
        await AdminService.deleteSchoolClosure(targetId);
      }
      toast.success('ยกเลิกรายการเรียบร้อยแล้ว');
      const firstId = Array.isArray(targetId) ? targetId[0] : targetId;
      const deleted = closures.find(c => c.id === firstId);
      if (deleted && deleted.start_date === rangeStart) {
        setRangeStart('');
        setRangeEnd('');
        setOverrideReason('');
      }
      await fetchData();
    } catch (err) {
      toast.error('ไม่สามารถยกเลิกได้');
    }
  };



  // Prepare calendar logic
  const currentViewDate = new Date();
  currentViewDate.setMonth(currentViewDate.getMonth() + monthIndex);
  
  const getDaysInMonth = () => {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const daysArray = [];

    for (let i = 0; i < firstDay; i++) {
      daysArray.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      daysArray.push({
        day: i,
        dateStr: `${d.getFullYear()}-${mm}-${dd}`,
      });
    }

    return daysArray;
  };

  return {
    // States
    closures,
    sessions,
    operatingDays,
    loading,
    monthIndex,
    selectionMode,
    rangeStart,
    rangeEnd,
    isPickingRangeEnd,
    hoverDate,
    multiDates,
    overrideStatus,
    overrideReason,
    savingSettings,
    savingOverride,
    tempOperatingDays,
    currentViewDate,
    
    // Setters
    setMonthIndex,
    setSelectionMode,
    setRangeStart,
    setRangeEnd,
    setIsPickingRangeEnd,
    setHoverDate,
    setMultiDates,
    setOverrideStatus,
    setOverrideReason,
    
    // Derived
    getDaysInMonth,
    
    // Handlers
    handleSaveSettings,
    toggleTempDay,
    handleDayClick,
    handleSaveOverride,
    handleDeleteClosure,
    fetchData,
  };
}
