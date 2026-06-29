"use client";

import React, { useState, useEffect } from 'react';
import { CalendarCog, Plus, Trash2, Loader2 } from 'lucide-react';
import { AdminService } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { COPY } from '@/config/copy';
import { AdminFieldLabel } from './admin-ui';
import { TimeSlotManagerModal } from './TimeSlotManagerModal';
import { Clock } from 'lucide-react';

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

  // Time Slot Modal State
  const [isTimeSlotModalOpen, setIsTimeSlotModalOpen] = useState(false);

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
      weekday: 'short',
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
    <div className="w-full">
      <div className="space-y-6">
        
        {/* Manage Session Templates Button */}
        <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100">
          <div>
            <h3 className="font-bold text-blue-900 text-sm">รอบเวลาพื้นฐาน (Session Templates)</h3>
            <p className="text-xs text-blue-700/70 mt-0.5">จัดการรอบเวลาที่จะถูกใช้เป็นค่าเริ่มต้นเมื่อสร้างคลาสในวันใหม่</p>
          </div>
          <button 
            onClick={() => setIsTimeSlotModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm"
          >
            <Clock className="w-4 h-4" />
            จัดการรอบเวลา
          </button>
        </div>

        {/* Add Blockout Date Form */}
        <div className="bg-white p-4 border border-gray-200 rounded shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-3">เพิ่มวันหยุด / ปิดรับจองล่วงหน้า</h3>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 min-w-[160px]">
              <AdminFieldLabel>วันที่</AdminFieldLabel>
              <input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm h-10 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex-[2] min-w-[200px]">
              <AdminFieldLabel>สาเหตุ (ไม่จำเป็น)</AdminFieldLabel>
              <input
                type="text"
                value={newReason}
                onChange={e => setNewReason(e.target.value)}
                placeholder="เช่น วันหยุดสงกรานต์, ครูลา..."
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm h-10 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={adding || !newDate}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-sm h-10 shadow-sm transition disabled:opacity-50"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              เพิ่มวันหยุด
            </button>
          </div>
        </div>

        {/* Upcoming Blockout Dates */}
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-2">
            วันหยุดที่กำลังจะมาถึง ({upcomingDates.length} วัน)
          </h3>
          {loading ? (
            <div className="py-8 text-center text-gray-500 text-sm">{COPY.LOADING.SHORT}</div>
          ) : upcomingDates.length === 0 ? (
            <div className="py-8 text-center border-2 border-dashed border-gray-300 bg-gray-50/50 rounded text-gray-500 text-sm">
              ยังไม่มีวันหยุดที่ตั้งไว้
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-300 shadow-sm">
              <table className="w-full text-left text-xs sm:text-sm border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300">
                    <th className="border border-gray-300 px-3 py-2">วันที่</th>
                    <th className="border border-gray-300 px-3 py-2">สาเหตุ</th>
                    <th className="border border-gray-300 px-3 py-2 text-center w-20">ลบ</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingDates.map(d => (
                    <tr key={d.id} className="hover:bg-blue-50/50 transition">
                      <td className="border border-gray-300 px-3 py-1.5 font-bold text-gray-900">
                        {formatDisplayDate(d.block_date)}
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5 text-gray-600">
                        {d.reason || '-'}
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5 text-center">
                        <button
                          onClick={() => handleRemove(d.id)}
                          className="text-rose-500 hover:text-white hover:bg-rose-500 p-1.5 rounded transition"
                          title="ลบวันหยุดนี้"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Past Blockout Dates (collapsed) */}
        {pastDates.length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-500 font-medium hover:text-gray-700">
              วันหยุดที่ผ่านมาแล้ว ({pastDates.length} วัน)
            </summary>
            <div className="mt-2 overflow-x-auto border border-gray-200 rounded">
              <table className="w-full text-left text-xs border-collapse bg-white">
                <tbody>
                  {pastDates.map(d => (
                    <tr key={d.id} className="border-b border-gray-100 text-gray-400">
                      <td className="px-3 py-1.5">{formatDisplayDate(d.block_date)}</td>
                      <td className="px-3 py-1.5">{d.reason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </div>

      <TimeSlotManagerModal 
        isOpen={isTimeSlotModalOpen} 
        onClose={() => setIsTimeSlotModalOpen(false)} 
      />
    </div>
  );
}
