"use client";

import React, { useState, useEffect } from 'react';
import { CalendarCog, Plus, Trash2, Loader2, CalendarX, Info } from 'lucide-react';
import { AdminService } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { COPY } from '@/config/copy';
import { AdminFieldLabel } from './admin-ui';

interface BlockoutDate {
  id: string;
  block_date: string;
  reason: string | null;
}

export function CalendarSettingsTab() {
  const [blockoutDates, setBlockoutDates] = useState<BlockoutDate[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form state
  const [newDate, setNewDate] = useState('');
  const [newReason, setNewReason] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchBlockoutDates();
  }, []);

  const fetchBlockoutDates = async () => {
    setLoading(true);
    try {
      const data = await AdminService.getBlockoutDates();
      setBlockoutDates(data);
    } catch (err) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newDate) {
      toast.error(COPY.ALERTS.SELECT_DATE_REQUIRED);
      return;
    }
    setAdding(true);
    try {
      await AdminService.addBlockoutDate(newDate, newReason || undefined);
      setNewDate('');
      setNewReason('');
      await fetchBlockoutDates();
    } catch (err) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(err instanceof Error ? err.message : String(err)));
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('ยืนยันลบวันหยุดนี้ออก?')) return;
    try {
      await AdminService.removeBlockoutDate(id);
      setBlockoutDates(curr => curr.filter(d => d.id !== id));
    } catch (err) {
      toast.error(COPY.ALERTS.ERROR_GENERIC(err instanceof Error ? err.message : String(err)));
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Split into upcoming vs past
  const today = new Date().toISOString().split('T')[0];
  const upcomingDates = blockoutDates.filter(d => d.block_date >= today);
  const pastDates = blockoutDates.filter(d => d.block_date < today);

  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="space-y-8 mt-4">
        
        {/* Add Blockout Date Form */}
        <section className="bg-white p-6 sm:p-8 border border-border rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-error/10 p-2.5 rounded-xl text-error">
              <CalendarX className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-icsn-navy">เพิ่มวันหยุด / ปิดรับจอง</h3>
              <p className="text-sm text-muted-foreground mt-0.5">ระบบจะปิดรับจองในวันที่ถูกเลือกโดยอัตโนมัติ</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-end bg-muted/20 p-5 rounded-xl border border-border/50">
            <div className="flex-1 w-full">
              <AdminFieldLabel>วันที่ต้องการปิดรับจอง</AdminFieldLabel>
              <input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="w-full px-4 py-2.5 mt-2 bg-white border border-border rounded-xl focus:ring-2 focus:ring-icsn-teal/30 focus:border-icsn-teal/50 outline-none transition-all text-icsn-navy font-medium"
              />
            </div>
            <div className="flex-[2] w-full">
              <AdminFieldLabel>สาเหตุ / ชื่อวันหยุด (แสดงให้ผู้ปกครองเห็น)</AdminFieldLabel>
              <input
                type="text"
                value={newReason}
                onChange={e => setNewReason(e.target.value)}
                placeholder="เช่น วันหยุดสงกรานต์, ครูลากิจ..."
                className="w-full px-4 py-2.5 mt-2 bg-white border border-border rounded-xl focus:ring-2 focus:ring-icsn-teal/30 focus:border-icsn-teal/50 outline-none transition-all text-icsn-navy"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={adding || !newDate}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-icsn-navy hover:bg-icsn-navy/90 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 h-[46px] hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {adding ? 'กำลังเพิ่ม...' : 'เพิ่มวันหยุด'}
            </button>
          </div>
        </section>

        {/* Upcoming Blockout Dates */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-bold text-icsn-navy">
              วันหยุดที่กำลังจะมาถึง
            </h3>
            <span className="bg-icsn-teal/10 text-icsn-teal px-2.5 py-0.5 rounded-full text-xs font-bold">
              {upcomingDates.length} วัน
            </span>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center items-center">
              <Loader2 className="w-8 h-8 animate-spin text-icsn-teal/50" />
            </div>
          ) : upcomingDates.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-border bg-muted/30 rounded-2xl">
              <CalendarCog className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm font-medium">ยังไม่มีวันหยุดที่ตั้งไว้ในอนาคต</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingDates.map(d => (
                <div key={d.id} className="bg-white border border-border rounded-xl p-4 flex items-center justify-between group hover:shadow-md transition-all hover:border-icsn-teal/30">
                  <div className="flex items-center gap-4">
                    <div className="bg-error/5 w-12 h-12 rounded-lg flex flex-col items-center justify-center text-error border border-error/10 shrink-0">
                      <span className="text-xs font-bold uppercase">{new Date(d.block_date).toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-lg font-black leading-none">{new Date(d.block_date).getDate()}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-icsn-navy">{formatDisplayDate(d.block_date)}</h4>
                      <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" />
                        {d.reason || 'ไม่ระบุสาเหตุ'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(d.id)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-error hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                    title="ลบวันหยุดนี้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Past Blockout Dates */}
        {pastDates.length > 0 && (
          <section className="pt-6 border-t border-border">
            <details className="group">
              <summary className="cursor-pointer flex items-center gap-2 text-muted-foreground font-medium hover:text-icsn-navy transition-colors list-none">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center group-open:bg-icsn-navy group-open:text-white transition-colors">
                  <svg className="w-3 h-3 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <span>ประวัติวันหยุดที่ผ่านมาแล้ว ({pastDates.length} วัน)</span>
              </summary>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pl-8">
                {pastDates.map(d => (
                  <div key={d.id} className="bg-muted/30 border border-border/50 rounded-lg p-3 opacity-60 grayscale">
                    <p className="text-xs font-bold text-icsn-navy">{formatDisplayDate(d.block_date)}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{d.reason || '-'}</p>
                  </div>
                ))}
              </div>
            </details>
          </section>
        )}
      </div>
    </div>
  );
}
