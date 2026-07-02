"use client";

import React, { useState, useEffect } from 'react';
import { CalendarCog, Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Settings, AlertTriangle, Save, RefreshCcw, CalendarX, Trash2, Plus, Clock, X } from 'lucide-react';
import { AdminService, SettingsService, supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { COPY } from '@/config/copy';
import { 
  AdminFieldLabel, 
  AdminPanel, 
  AdminPanelHeader,
  AdminPrimaryButton
} from '../admin-ui';
import { getThaiMonthName } from '@/utils/dateUtils';
import type { SchoolClosure, Session } from '@/types';

export function AdminHolidays() {
  const [closures, setClosures] = useState<SchoolClosure[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [operatingDays, setOperatingDays] = useState<number[]>([0,1,2,3,4,5,6]);
  const [loading, setLoading] = useState(true);
  const [monthIndex, setMonthIndex] = useState(0);

  // Selection State
  const [selectionMode, setSelectionMode] = useState<'single' | 'range' | 'multi'>('single');
  const [rangeStart, setRangeStart] = useState<string>('');
  const [rangeEnd, setRangeEnd] = useState<string>('');
  const [isPickingRangeEnd, setIsPickingRangeEnd] = useState(false);
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
      
      const ops = settingsData.operating_days || [0,1,2,3,4,5,6];
      setOperatingDays(ops);
      if (tempOperatingDays.length === 0) {
        setTempOperatingDays(ops);
      }

      // Fetch sessions for the current view month
      const currentViewDate = new Date();
      currentViewDate.setMonth(currentViewDate.getMonth() + monthIndex);
      const year = currentViewDate.getFullYear();
      const month = currentViewDate.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
      
      const { data: sessionsData, error: sessionsErr } = await supabase
        .from('sessions')
        .select('id, session_date, time_label, is_active, total_capacity, booked_count, theme')
        .gte('session_date', startDate)
        .lte('session_date', endDate);
      
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
    if (selectionMode === 'single') {
      setRangeStart(dateStr);
      setRangeEnd(dateStr);
      setMultiDates([]);
    } else if (selectionMode === 'range') {
      if (!isPickingRangeEnd || !rangeStart) {
        setRangeStart(dateStr);
        setRangeEnd(dateStr);
        setIsPickingRangeEnd(true);
      } else {
        if (dateStr >= rangeStart) {
          setRangeEnd(dateStr);
        } else {
          setRangeStart(dateStr);
          setRangeEnd(dateStr);
        }
        setIsPickingRangeEnd(false);
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
        if (selectionMode === 'range' || selectionMode === 'single') {
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

        for (const date of datesToReset) {
          const overlappingClosures = closures.filter(c => date >= c.start_date && date <= c.end_date);
          await Promise.all(overlappingClosures.map(c => AdminService.deleteSchoolClosure(c.id)));
          
          await supabase.from('sessions')
            .update({ is_active: true, theme: null })
            .eq('session_date', date);
        }
        
        toast.success('ยกเลิกการตั้งค่าเรียบร้อยแล้ว');
      } else {
        if (selectionMode === 'range' || selectionMode === 'single') {
          if (!rangeStart || !rangeEnd) { toast.error('กรุณาระบุช่วงวันที่'); setSavingOverride(false); return; }
          if (rangeStart > rangeEnd) { toast.error('วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด'); setSavingOverride(false); return; }
          if (overrideStatus === 'closed' && !overrideReason) { toast.error('กรุณาระบุสาเหตุ'); setSavingOverride(false); return; }
          
          await AdminService.setDateStatus(rangeStart, rangeEnd, overrideStatus === 'open', overrideReason);
        } else {
          if (multiDates.length === 0) { toast.error('กรุณาเลือกอย่างน้อย 1 วัน'); setSavingOverride(false); return; }
          if (overrideStatus === 'closed' && !overrideReason) { toast.error('กรุณาระบุสาเหตุ'); setSavingOverride(false); return; }
          
          await Promise.all(multiDates.map(date => 
            AdminService.setDateStatus(date, date, overrideStatus === 'open', overrideReason)
          ));
        }
        toast.success('บันทึกสำเร็จ');
      }

      setRangeStart(''); setRangeEnd(''); setIsPickingRangeEnd(false); setOverrideReason(''); setMultiDates([]);
      fetchData();
    } catch (err) { 
      toast.error('เกิดข้อผิดพลาดในการบันทึก/ยกเลิก'); 
    } finally { 
      setSavingOverride(false); 
    }
  };

  const handleDeleteClosure = async (id: string) => {
    if (!confirm('ยืนยันลบการตั้งค่าวันหยุด/เปิดพิเศษนี้?')) return;
    
    try {
      await AdminService.deleteSchoolClosure(id);
      toast.success('ยกเลิกรายการเรียบร้อยแล้ว');
      const deleted = closures.find(c => c.id === id);
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

  // Calendar logic
  const currentViewDate = new Date();
  currentViewDate.setMonth(currentViewDate.getMonth() + monthIndex);
  const monthName = getThaiMonthName(currentViewDate);
  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();

  const getDaysInMonth = () => {
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

  const daysList = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  const fullDaysList = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

  // Identify upcoming closures
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingClosures = closures
    .filter(c => c.end_date >= todayStr && !c.time_label)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

  function formatDisplayDateStr(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPanel className="no-print">
        <AdminPanelHeader 
          icon={CalendarCog} 
          title="จัดการวันเปิด-ปิด (Calendar & Holidays)" 
        />
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Calendar (lg:col-span-7) */}
            <div className="lg:col-span-7 lg:sticky lg:top-24 self-start relative">
              <div className="px-0 sm:px-4 py-4 space-y-4">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-icsn-navy flex items-center gap-1.5 text-base">
                    <CalendarIcon className="w-5 h-5 text-icsn-teal" />
                    <span>เลือกวันที่เพื่อตั้งค่า</span>
                  </h3>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setMonthIndex(m => m - 1)}
                      className="p-2 hover:bg-muted/80 rounded-xl transition text-icsn-navy"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h4 className="text-sm font-bold text-icsn-navy bg-muted px-2.5 py-1.5 rounded-xl">
                      {monthName}
                    </h4>
                    <button
                      onClick={() => setMonthIndex(m => m + 1)}
                      className="p-2 hover:bg-muted/80 rounded-xl transition text-icsn-navy"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Thai Week Names */}
                <div className="grid grid-cols-7 text-center text-sm font-bold text-muted-foreground/70">
                  {daysList.map((d, idx) => <div key={idx}>{d}</div>)}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1.5 text-center font-bold text-base">
                  {getDaysInMonth().map((dayObj, i) => {
                    if (!dayObj) return <div key={`empty-${i}`} className="py-2 text-transparent"></div>;

                    // Sync with User View Logic
                    const daySessions = sessions.filter(s => s.session_date === dayObj.dateStr);
                    const closureForDate = closures.find(c => dayObj.dateStr >= c.start_date && dayObj.dateStr <= c.end_date && !c.time_label);
                    const dayOfWeek = new Date(dayObj.dateStr).getDay();
                    const isBaseOperatingDay = operatingDays.includes(dayOfWeek);
                    
                    // Determine if the day is fundamentally open (ignoring sessions)
                    let isFundamentallyOpen = isBaseOperatingDay;
                    if (closureForDate) {
                      isFundamentallyOpen = !!closureForDate.is_force_open;
                    }

                    // Check if any active session is open for booking on this day
                    const hasOpenSession = daySessions.some(s => s.is_active && (s.total_capacity - (s.booked_count || 0)) > 0);
                    
                    // It is "Bookable" (open) if it's fundamentally open AND (no sessions OR has open sessions)
                    const isBookable = isFundamentallyOpen && (daySessions.length === 0 || hasOpenSession);

                    // A date is "selected" visually if it falls within the override range or multi array
                    const isSelected = (selectionMode === 'range' || selectionMode === 'single')
                      ? !!(rangeStart && rangeEnd && dayObj.dateStr >= rangeStart && dayObj.dateStr <= rangeEnd)
                      : multiDates.includes(dayObj.dateStr);
                    
                    const isBooked = false; // Admin view doesn't care about parent booking
                    const isFuture = new Date(dayObj.dateStr) >= new Date(new Date().setHours(0, 0, 0, 0));

                    // Exact same styling logic from CalendarWidget.tsx
                    let btnClass = "text-muted-foreground/70 bg-muted/50";
                    let dotClass = "bg-transparent";

                    if (isBookable) {
                      if (isSelected) {
                        btnClass = "bg-primary text-primary-foreground shadow-md font-black scale-[1.05]";
                        dotClass = "bg-white";
                      } else {
                        btnClass = "bg-background text-foreground border border-border hover:border-primary/30 hover:bg-primary/5";
                        dotClass = "bg-primary";
                      }
                    } else {
                      if (isSelected) {
                        btnClass = "bg-foreground text-background shadow-md font-black scale-[1.05]";
                        dotClass = "bg-background";
                      } else if (isFuture) {
                        const isExplicitlyClosed = (closureForDate && !closureForDate.is_force_open) || (!isBaseOperatingDay && closureForDate && !closureForDate.is_force_open);
                        const hasClosedSession = daySessions.some(s => !s.is_active && s.theme);

                        if (isExplicitlyClosed || (isBaseOperatingDay && hasClosedSession)) {
                          btnClass = "bg-destructive/10 text-destructive border border-destructive/20 cursor-not-allowed";
                          dotClass = "bg-destructive";
                        } else if (isBaseOperatingDay) {
                          btnClass = "bg-muted text-muted-foreground cursor-not-allowed";
                          dotClass = "bg-destructive";
                        } else {
                          btnClass = "bg-muted text-muted-foreground/60 cursor-not-allowed opacity-60";
                          dotClass = "bg-transparent";
                        }
                      } else {
                        btnClass = "bg-muted text-muted-foreground cursor-not-allowed opacity-60";
                        dotClass = "bg-transparent";
                      }
                    }
                    
                    // Highlight selected days even if they are unbookable
                    if (isSelected && !isBookable) {
                        btnClass = "bg-foreground text-background shadow-md font-black scale-[1.05]";
                        dotClass = "bg-background";
                    }

                    return (
                      <button
                        key={dayObj.dateStr}
                        onClick={() => handleDayClick(dayObj.dateStr, isBookable, closureForDate)}
                        className={`py-3 rounded-xl transition-all flex flex-col items-center justify-center relative cursor-pointer active:scale-95 ${btnClass}`}
                      >
                        <span>{dayObj.day}</span>
                        <span className={`w-1.5 h-1.5 rounded-full mt-1 ${dotClass}`}></span>
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="pt-2 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-muted border border-border rounded-full"></span>
                    ผ่านไปแล้ว / วันหยุด
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-primary rounded-full shadow-sm"></span>
                    เปิดรับจอง
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-destructive rounded-full shadow-sm"></span>
                    ปิดรับจอง
                  </span>
                </div>
              </div>
              
              {loading && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-2xl z-20">
                  <Loader2 className="w-8 h-8 animate-spin text-icsn-teal" />
                </div>
              )}
            </div>

            {/* Right Column: Unified Config Panel (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* 1. Weekly Default Config */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-icsn-navy" />
                    <h4 className="font-bold text-icsn-navy text-sm">วันทำการพื้นฐานรายสัปดาห์</h4>
                  </div>
                  <button 
                    onClick={handleSaveSettings}
                    disabled={savingSettings || JSON.stringify(operatingDays) === JSON.stringify(tempOperatingDays)}
                    className="px-3 py-1.5 bg-icsn-navy text-white hover:bg-icsn-navy/90 rounded-lg text-xs font-bold disabled:opacity-50 transition-colors"
                  >
                    {savingSettings ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                </div>
                <div className="flex gap-1 sm:gap-2 justify-between">
                  {fullDaysList.map((dayName, index) => {
                    const isSelected = tempOperatingDays.includes(index);
                    const shortName = daysList[index];
                    return (
                      <button
                        key={index}
                        onClick={() => toggleTempDay(index)}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                          isSelected ? 'bg-icsn-teal text-white shadow-sm ring-2 ring-offset-1 ring-icsn-teal' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-100'
                        }`}
                        title={dayName}
                      >
                        {shortName}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 2. Date Range Override Config */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
                <h4 className="font-bold text-icsn-navy mb-4 flex items-center gap-2">
                  <CalendarX className="w-5 h-5" />
                  ตั้งค่าว้นหยุดพิเศษ / เปิดพิเศษ (Macro)
                </h4>

                <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                  <button
                    onClick={() => { setSelectionMode('single'); setMultiDates([]); setRangeStart(''); setRangeEnd(''); setIsPickingRangeEnd(false); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${selectionMode === 'single' ? 'bg-white text-icsn-navy shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    เลือกวันเดียว (Single)
                  </button>
                  <button
                    onClick={() => { setSelectionMode('range'); setMultiDates([]); setRangeStart(''); setRangeEnd(''); setIsPickingRangeEnd(false); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${selectionMode === 'range' ? 'bg-white text-icsn-navy shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    เลือกแบบช่วง (Range)
                  </button>
                  <button
                    onClick={() => { setSelectionMode('multi'); setMultiDates([]); setRangeStart(''); setRangeEnd(''); setIsPickingRangeEnd(false); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${selectionMode === 'multi' ? 'bg-white text-icsn-navy shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    เลือกทีละวัน (Multi)
                  </button>
                </div>

                {selectionMode === 'single' ? (
                  <div className="mb-4">
                    <AdminFieldLabel>วันที่เลือก</AdminFieldLabel>
                    <div className="min-h-[42px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-sm font-bold text-icsn-navy">
                      {rangeStart ? formatDisplayDateStr(rangeStart) : <span className="text-slate-400 font-normal">คลิกที่ปฏิทินเพื่อเลือกวัน</span>}
                    </div>
                  </div>
                ) : selectionMode === 'range' ? (
                  <div className="mb-4">
                    {isPickingRangeEnd && (
                      <div className="text-xs text-icsn-teal font-bold mb-2 flex items-center justify-center bg-icsn-teal/10 py-1.5 rounded-lg animate-pulse">
                        👉 กรุณาคลิกเลือกวันที่สิ้นสุดบนปฏิทิน
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                    <div>
                      <AdminFieldLabel>วันที่เริ่มต้น</AdminFieldLabel>
                      <input 
                        type="date" 
                        value={rangeStart}
                        onChange={e => { 
                          setRangeStart(e.target.value); 
                          if(e.target.value > rangeEnd) setRangeEnd(e.target.value); 
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-icsn-teal focus:border-transparent transition-all text-sm"
                      />
                    </div>
                    <div>
                      <AdminFieldLabel>วันที่สิ้นสุด</AdminFieldLabel>
                      <input 
                        type="date" 
                        value={rangeEnd}
                        min={rangeStart}
                        onChange={e => setRangeEnd(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-icsn-teal focus:border-transparent transition-all text-sm"
                      />
                    </div>
                  </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <AdminFieldLabel>วันที่เลือก ({multiDates.length} วัน)</AdminFieldLabel>
                    <div className="min-h-[42px] p-2 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap gap-1">
                      {multiDates.length > 0 ? multiDates.map(d => (
                        <span key={d} className="bg-icsn-navy text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                          {formatDisplayDateStr(d)}
                          <button onClick={() => setMultiDates(multiDates.filter(md => md !== d))} className="hover:text-error">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )) : (
                        <span className="text-sm text-slate-400 p-1">คลิกที่ปฏิทินเพื่อเลือกวัน</span>
                      )}
                    </div>
                  </div>
                )}
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                      onClick={() => setOverrideStatus('closed')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                        overrideStatus === 'closed' 
                          ? 'bg-white text-error shadow-sm ring-1 ring-slate-200' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      ปิดรับจอง
                    </button>
                    <button
                      onClick={() => setOverrideStatus('open')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                        overrideStatus === 'open' 
                          ? 'bg-white text-success shadow-sm ring-1 ring-slate-200' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      บังคับเปิด
                    </button>
                    <button
                      onClick={() => { setOverrideStatus('reset'); setOverrideReason(''); }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                        overrideStatus === 'reset' 
                          ? 'bg-white text-slate-700 shadow-sm ring-1 ring-slate-200' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      ยกเลิกค่า (Reset)
                    </button>
                  </div>

                  {overrideStatus === 'closed' && (
                    <div className="animate-in fade-in">
                      <input
                        type="text"
                        value={overrideReason}
                        onChange={e => setOverrideReason(e.target.value)}
                        placeholder="สาเหตุการปิด (เช่น ปิดเทอมซัมเมอร์)"
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-icsn-teal outline-none"
                      />
                    </div>
                  )}

                  <div className="pt-2">
                    <AdminPrimaryButton 
                      onClick={handleSaveOverride} 
                      disabled={savingOverride || (selectionMode === 'multi' ? multiDates.length === 0 : (!rangeStart || !rangeEnd))}
                      className="w-full justify-center py-2 text-sm"
                    >
                      {savingOverride ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
                      {overrideStatus === 'reset' ? 'บันทึกการยกเลิก' : 'บันทึกตั้งค่าช่วงวันที่'}
                    </AdminPrimaryButton>
                  </div>
              </div>

              {/* 3. Daily Command Center: Time Slots */}
              {((selectionMode === 'single' && rangeStart) || 
                (selectionMode === 'range' && rangeStart && rangeEnd && rangeStart === rangeEnd) || 
                (selectionMode === 'multi' && multiDates.length === 1)) && (() => {
                  const targetDate = selectionMode === 'multi' ? multiDates[0] : rangeStart;
                  return (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-icsn-navy" />
                      <h4 className="font-bold text-icsn-navy text-sm">รอบเวลาเรียน (วันที่ {formatDisplayDateStr(targetDate)})</h4>
                    </div>
                  </div>
                  
                  {sessions.filter(s => s.session_date === targetDate).length === 0 ? (
                    <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-sm text-slate-500 mb-3">ยังไม่มีการสร้างรอบเวลาเรียนสำหรับวันนี้</p>
                      <button
                        onClick={async () => {
                          try {
                            const { SupabaseSessionAdapter } = await import('@/lib/domain/adapters/SupabaseSessionAdapter');
                            const adapter = new SupabaseSessionAdapter();
                            await adapter.getOrCreateSessionsForDate(targetDate);
                            toast.success('สร้างรอบเวลาเรียนเรียบร้อย');
                            await fetchData();
                          } catch (err: any) {
                            toast.error(err.message || 'Error generating sessions');
                          }
                        }}
                        className="px-4 py-2 bg-icsn-navy text-white text-xs font-bold rounded-lg hover:bg-icsn-navy/90 transition-colors"
                      >
                        สร้างรอบเวลาจาก Template
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sessions
                        .filter(s => s.session_date === targetDate)
                        .sort((a, b) => (a.time_label ?? '').localeCompare(b.time_label ?? ''))
                        .map(session => (
                        <div key={session.id} className={`p-3 border rounded-xl flex items-center justify-between transition-colors ${
                          session.is_active ? 'border-slate-200 bg-white' : 'border-error/20 bg-error/5'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-bold text-icsn-navy">
                              {session.time_label}
                            </div>
                            {!session.is_active && (
                              <span className="text-[10px] bg-error/10 text-error px-2 py-0.5 rounded-full font-bold">
                                ปิดรับจอง
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                              <span className="text-xs text-slate-500">รับ:</span>
                              <input 
                                type="number" 
                                defaultValue={session.total_capacity}
                                onBlur={async (e) => {
                                  const newCap = parseInt(e.target.value);
                                  if (newCap && newCap !== session.total_capacity) {
                                    try {
                                      await AdminService.updateSessionCapacity(session.id, newCap);
                                      toast.success('อัปเดตจำนวนรับเรียบร้อย');
                                      fetchData();
                                    } catch (err: any) {
                                      toast.error(err.message);
                                      e.target.value = session.total_capacity.toString();
                                    }
                                  }
                                }}
                                disabled={!session.is_active}
                                className="w-12 text-sm font-bold text-center bg-transparent outline-none disabled:opacity-50"
                              />
                              <span className="text-xs text-slate-500">คน</span>
                            </div>
                            
                            <button
                              onClick={async () => {
                                try {
                                  await AdminService.toggleSessionActive(session.id, !session.is_active);
                                  toast.success(session.is_active ? 'ปิดรับจองรอบเวลานี้แล้ว' : 'เปิดรับจองรอบเวลานี้แล้ว');
                                  fetchData();
                                } catch (err: any) {
                                  toast.error(err.message);
                                }
                              }}
                              className={`p-1.5 rounded-md transition-colors ${
                                session.is_active 
                                  ? 'text-slate-400 hover:text-error hover:bg-error/10' 
                                  : 'text-error hover:text-success hover:bg-success/10'
                              }`}
                              title={session.is_active ? "คลิกเพื่อปิดรับจอง" : "คลิกเพื่อเปิดรับจอง"}
                            >
                              {session.is_active ? <X className="w-4 h-4" /> : <RefreshCcw className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );})()}

              {/* 4. Upcoming Closures List */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[300px]">
                <div className="p-3 sm:p-4 border-b border-slate-200 bg-slate-50">
                  <h4 className="font-bold text-icsn-navy text-sm flex items-center justify-between">
                    รายการการตั้งค่าพิเศษที่กำลังจะมาถึง
                    <span className="bg-icsn-navy text-white text-[10px] px-2 py-0.5 rounded-full">
                      {upcomingClosures.length} รายการ
                    </span>
                  </h4>
                </div>
                <div className="overflow-y-auto flex-1 p-2">
                  {upcomingClosures.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                      <CalendarX className="w-8 h-8 mb-2 opacity-50" />
                      ไม่มีรายการตั้งค่าพิเศษ
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {upcomingClosures.map(c => (
                        <div key={c.id} className="p-3 border border-slate-100 bg-slate-50/50 rounded-lg flex items-center justify-between hover:bg-slate-50 hover:border-slate-200 transition-colors group">
                          <div>
                            <p className={`font-bold text-sm ${c.is_force_open ? 'text-success' : 'text-error'}`}>
                              {c.is_force_open ? 'เปิดพิเศษ' : (c.reason || 'วันหยุด')}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {c.start_date === c.end_date 
                                ? formatDisplayDateStr(c.start_date) 
                                : `${formatDisplayDateStr(c.start_date)} - ${formatDisplayDateStr(c.end_date)}`}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteClosure(c.id)}
                            className="p-1.5 text-slate-400 hover:text-error hover:bg-error/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            title="ลบรายการนี้"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </AdminPanel>
    </div>
  );
}
