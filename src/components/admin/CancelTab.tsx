"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { CalendarX, Search, Loader2 } from 'lucide-react';
import { BookingService, AdminService } from '@/lib/supabase';
import {
  AdminPanel,
  AdminPanelHeader,
  AdminFieldLabel,
} from './admin-ui';
import { formatThaiFullDate } from './admin-utils';

interface ActiveBookingRow {
  id: string;
  session_date: string;
  parent_name: string;
  parent_phone: string;
  child_nickname: string;
}

export function CancelTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [bookings, setBookings] = useState<ActiveBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Quick Action Modal State
  const [cancellingBooking, setCancellingBooking] = useState<ActiveBookingRow | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await BookingService.getAllActiveBookings();
      setBookings(data);
    } catch (err) {
      alert('Error fetching bookings: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = useMemo(() => {
    if (!searchTerm.trim()) return bookings;
    const lower = searchTerm.toLowerCase();
    return bookings.filter(b => 
      b.child_nickname.toLowerCase().includes(lower) || 
      b.parent_name.toLowerCase().includes(lower) || 
      b.parent_phone.includes(lower) ||
      b.session_date.includes(lower) // can filter by YYYY-MM-DD
    );
  }, [bookings, searchTerm]);

  const openModal = (booking: ActiveBookingRow) => {
    setCancellingBooking(booking);
    setCancelReason('');
  };

  const closeModal = () => {
    setCancellingBooking(null);
    setCancelReason('');
  };

  const processAdminCancel = async () => {
    if (!cancellingBooking) return;
    if (!cancelReason.trim()) {
      alert('กรุณาระบุสาเหตุยกเลิก');
      return;
    }

    setIsProcessing(true);
    try {
      await AdminService.invokeAdminAction('cancel-booking', {
        bookingId: cancellingBooking.id,
        cancelReason: cancelReason.trim(),
      });
      
      // Remove cancelled booking from local state instantly
      setBookings(curr => curr.filter(b => b.id !== cancellingBooking.id));
      
      alert('ยกเลิกสำเร็จ — คืน 1 เครดิตให้ผู้ปกครองแล้ว');
      closeModal();
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AdminPanel className="no-print">
      <AdminPanelHeader
        icon={CalendarX}
        title="ยกเลิกสิทธิ์เข้าเรียน (Override Cancel)"
      />

      <div className="space-y-6">
        {/* Search Bar */}
        <div className="bg-white p-4 border border-gray-200 rounded shadow-sm flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <AdminFieldLabel>ค้นหารายการจอง (ชื่อ, เบอร์โทร, วันที่ YYYY-MM-DD):</AdminFieldLabel>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="พิมพ์ค้นหาแบบ Real-time..."
                className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm h-12 bg-white focus:ring-1 focus:ring-icsn-teal outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-gray-700">
            รายการจองที่สามารถยกเลิกได้ (Upcoming Bookings):
          </h4>

          {loading ? (
             <div className="py-12 text-center border border-gray-300 bg-white shadow-sm">
               <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-3" />
               <p className="text-gray-500 text-sm font-medium">กำลังโหลดรายการจอง...</p>
             </div>
          ) : filteredBookings.length === 0 ? (
             <div className="py-12 text-center border-2 border-dashed border-gray-300 bg-gray-50/50">
               <p className="text-gray-500 text-sm font-medium">ไม่พบรายการจองที่ตรงกับเงื่อนไข</p>
             </div>
          ) : (
            <div className="overflow-x-auto border border-gray-300 shadow-sm">
              <table className="w-full text-left text-xs sm:text-sm border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300">
                    <th className="border border-gray-300 px-3 py-2 w-24 text-center">Status</th>
                    <th className="border border-gray-300 px-3 py-2">Child (ชื่อเล่น)</th>
                    <th className="border border-gray-300 px-3 py-2">Session Date (รอบเรียน)</th>
                    <th className="border border-gray-300 px-3 py-2">Parent / Contact</th>
                    <th className="border border-gray-300 px-3 py-2 text-center w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map(bk => (
                    <tr key={bk.id} className="hover:bg-blue-50/50 transition">
                      <td className="border border-gray-300 px-3 py-1.5 text-center">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] sm:text-xs font-bold rounded uppercase tracking-wide border border-emerald-200">
                          Confirmed
                        </span>
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5 font-bold text-gray-900">
                        น้อง{bk.child_nickname}
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5 text-icsn-teal font-bold">
                        {formatThaiFullDate(bk.session_date)}
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800">{bk.parent_name}</span>
                          <span className="text-gray-500 font-mono text-[11px] sm:text-xs">({bk.parent_phone})</span>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => openModal(bk)}
                          className="px-3 py-1 bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-600 border border-rose-200 font-bold rounded text-xs transition cursor-pointer shadow-sm w-full"
                        >
                          ยกเลิก
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-rose-600 mb-4">ยืนยันการยกเลิกสิทธิ์?</h3>
            
            <div className="bg-rose-50 text-rose-800 p-4 rounded-xl text-sm border border-rose-100 mb-5 space-y-1">
              <p>ยกเลิกการจองของ <strong>น้อง{cancellingBooking.child_nickname}</strong></p>
              <p>วันที่: <strong>{formatThaiFullDate(cancellingBooking.session_date)}</strong></p>
              <p className="pt-2 text-[11px] opacity-90 font-medium">* ระบบจะทำการคืน 1 เครดิต กลับไปยังบัญชีผู้ปกครองโดยอัตโนมัติ</p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                สาเหตุการยกเลิก (จำเป็น) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                autoFocus
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="เช่น ป่วยกระทันหัน, ผู้ปกครองแจ้งทาง Line..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-rose-400 focus:ring-1 focus:ring-rose-400 outline-none transition h-12 text-sm"
              />
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={closeModal}
                disabled={isProcessing}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
              >
                กลับ
              </button>
              <button
                onClick={processAdminCancel}
                disabled={isProcessing || !cancelReason.trim()}
                className="flex-[2] py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 shadow-md shadow-rose-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ยืนยันยกเลิก และคืน 1 เครดิต'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPanel>
  );
}
