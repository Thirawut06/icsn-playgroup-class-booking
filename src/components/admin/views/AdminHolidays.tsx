"use client";

import React, { useState, useEffect } from 'react';
import { CalendarCog, Plus, Trash2, Loader2, CalendarX, Info, AlertTriangle } from 'lucide-react';
import { AdminService, supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { COPY } from '@/config/copy';
import { AdminFieldLabel, AdminPanel, AdminPanelHeader } from '../admin-ui';

interface SchoolClosure {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
}

export function AdminHolidays() {
  const [closures, setClosures] = useState<SchoolClosure[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchClosures();
  }, []);

  const fetchClosures = async () => {
    setLoading(true);
    try {
      const data = await AdminService.getSchoolClosures();
      setClosures(data);
    } catch (err) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!startDate || !endDate || !reason) {
      toast.error("กรุณากรอกวันที่เริ่มต้น สิ้นสุด และเหตุผลให้ครบถ้วน");
      return;
    }
    
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น");
      return;
    }

    if (!confirm(`ยืนยันการตั้งค่าวันหยุดยาวตั้งแต่วันที่ ${startDate} ถึง ${endDate} ?\n\nคำเตือน: ระบบจะทำการยกเลิกคลาสที่ถูกจองไว้ในช่วงเวลานี้ และคืนเครดิตให้ผู้ปกครองโดยอัตโนมัติ (สำหรับลูกค้าโอนเงินสด แอดมินต้องทำการโอนคืนเอง)`)) {
      return;
    }

    setAdding(true);
    try {
      await AdminService.bulkCloseDays(startDate, endDate, reason);
      toast.success("ตั้งค่าวันหยุดยาวเรียบร้อย ระบบได้ยกเลิกและคืนเครดิตให้ลูกค้าที่มีแพ็กเกจแล้ว");
      setStartDate('');
      setEndDate('');
      setReason('');
      await fetchClosures();
    } catch (err) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(err instanceof Error ? err.message : String(err)));
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    const closure = closures.find(c => c.id === id);
    if (!closure) return;

    if (!confirm('ยืนยันลบรายการวันหยุดยาวนี้? (การลบจะไม่ดึงคลาสที่ถูกยกเลิกไปแล้วกลับมา)')) return;
    try {
      // 1. ลบจาก school_closures
      const { error } = await supabase.from('school_closures').delete().eq('id', id);
      if (error) throw error;

      // 2. ปลดล็อค session กลับเป็นปกติ (is_active = true, theme = null) 
      // โดยข้ามเสาร์-อาทิตย์ เพื่อให้สามารถเปิดจองได้ใหม่
      try {
        await AdminService.bulkReopenDays(closure.start_date, closure.end_date);
        toast.success("ลบรายการสำเร็จ และเปิดคลาสในช่วงเวลานี้ให้จองได้ตามปกติ");
      } catch (updateError) {
        console.error("Failed to reactivate sessions:", updateError);
        toast.error("ลบวันหยุดแล้ว แต่ไม่สามารถเปิดคลาสกลับมาได้อัตโนมัติ");
      }

      setClosures(curr => curr.filter(d => d.id !== id));
    } catch (err) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(err instanceof Error ? err.message : String(err)));
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const today = new Date().toISOString().split('T')[0];
  const upcomingClosures = closures.filter(c => c.end_date >= today);
  const pastClosures = closures.filter(c => c.end_date < today);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPanel className="no-print">
        <AdminPanelHeader icon={CalendarCog} title="ตั้งค่าวันหยุด (Holidays & Closures)" />
        <div className="p-0 sm:p-6 space-y-8">
        
        {/* Add Closure Form */}
        <section className="bg-white p-6 sm:p-8 border border-border rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <AdminFieldLabel>วันที่เริ่มต้น (Start Date)</AdminFieldLabel>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => {
                    setStartDate(e.target.value);
                    if (!endDate || e.target.value > endDate) setEndDate(e.target.value);
                  }}
                  className="w-full px-4 py-2.5 mt-2 bg-white border border-border rounded-xl focus:ring-2 focus:ring-icsn-teal/30 focus:border-icsn-teal/50 outline-none transition-all text-icsn-navy font-medium"
                />
              </div>
              <div>
                <AdminFieldLabel>ถึงวันที่ (End Date)</AdminFieldLabel>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 mt-2 bg-white border border-border rounded-xl focus:ring-2 focus:ring-icsn-teal/30 focus:border-icsn-teal/50 outline-none transition-all text-icsn-navy font-medium"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">💡 หากต้องการหยุดเพียงวันเดียว ให้เลือกวันที่เริ่มต้นและสิ้นสุดเป็นวันเดียวกัน</p>
            <div>
              <AdminFieldLabel>สาเหตุ / ชื่อวันหยุด (Reason)</AdminFieldLabel>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="เช่น ปิดเทอมซัมเมอร์, วันหยุดสงกรานต์..."
                className="w-full px-4 py-2.5 mt-2 bg-white border border-border rounded-xl focus:ring-2 focus:ring-icsn-teal/30 focus:border-icsn-teal/50 outline-none transition-all text-icsn-navy"
              />
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center gap-2 text-warning font-semibold text-xs bg-warning/10 px-3 py-2 rounded-lg border border-warning/20">
                <AlertTriangle className="w-4 h-4" />
                <span>คำเตือน: การสั่งปิดจะส่งผลทันที และระบบจะคืนเครดิตอัตโนมัติ</span>
              </div>
              <button
                onClick={handleAdd}
                disabled={adding || !startDate || !endDate || !reason}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-error hover:bg-error/90 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 h-[46px] hover:-translate-y-0.5 active:translate-y-0"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {adding ? 'กำลังดำเนินการ...' : 'บันทึกวันหยุด (ปิดคลาส)'}
              </button>
            </div>
          </div>
        </section>

        {/* Upcoming Closures */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-bold text-icsn-navy">
              กำหนดการวันหยุดยาวล่วงหน้า
            </h3>
            <span className="bg-icsn-teal/10 text-icsn-teal px-2.5 py-0.5 rounded-full text-xs font-bold">
              {upcomingClosures.length} รายการ
            </span>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center items-center">
              <Loader2 className="w-8 h-8 animate-spin text-icsn-teal/50" />
            </div>
          ) : upcomingClosures.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-border bg-muted/30 rounded-2xl">
              <CalendarCog className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm font-medium">ยังไม่มีกำหนดการวันหยุดยาวล่วงหน้า</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {upcomingClosures.map(c => (
                <div key={c.id} className="bg-white border border-border rounded-xl p-4 flex items-center justify-between group hover:shadow-md transition-all hover:border-error/30 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-error rounded-l-xl"></div>
                  <div className="flex items-center gap-4 pl-3">
                    <div className="bg-error/5 w-16 h-16 rounded-lg flex flex-col items-center justify-center text-error border border-error/10 shrink-0">
                      <CalendarX className="w-6 h-6 mb-1 opacity-70" />
                      <span className="text-xs font-bold uppercase text-center leading-tight">Closed</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-icsn-navy text-base">{c.reason}</h4>
                      <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5 font-medium">
                        <CalendarCog className="w-4 h-4 text-icsn-teal" />
                        {c.start_date === c.end_date 
                          ? formatDisplayDate(c.start_date)
                          : `${formatDisplayDate(c.start_date)} - ${formatDisplayDate(c.end_date)}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(c.id)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-error hover:text-white transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    title="ลบรายการนี้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Past Closures */}
        {pastClosures.length > 0 && (
          <section className="pt-6 border-t border-border">
            <details className="group">
              <summary className="cursor-pointer flex items-center gap-2 text-muted-foreground font-medium hover:text-icsn-navy transition-colors list-none">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center group-open:bg-icsn-navy group-open:text-white transition-colors">
                  <svg className="w-3 h-3 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <span>ประวัติวันหยุดที่ผ่านมา ({pastClosures.length} รายการ)</span>
              </summary>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pl-8">
                {pastClosures.map(c => (
                  <div key={c.id} className="bg-muted/30 border border-border/50 rounded-lg p-3 opacity-60 grayscale">
                    <p className="text-xs font-bold text-icsn-navy truncate">{c.reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.start_date === c.end_date 
                          ? formatDisplayDate(c.start_date)
                          : `${formatDisplayDate(c.start_date)} - ${formatDisplayDate(c.end_date)}`}
                    </p>
                  </div>
                ))}
              </div>
            </details>
          </section>
        )}
        </div>
      </AdminPanel>
    </div>
  );
}
