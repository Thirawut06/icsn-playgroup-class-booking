"use client";

import React, { useCallback, useState } from 'react';
import { CalendarX, Search } from 'lucide-react';
import { BookingService, AdminService } from '@/lib/supabase';
import type { ConfirmedBookingRow } from '@/types';
import {
  AdminEmptyState,
  AdminFieldLabel,
  AdminPanel,
  AdminPanelHeader,
  AdminPrimaryButton,
} from './admin-ui';
import { formatThaiFullDate } from './admin-utils';

export function CancelTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [bookings, setBookings] = useState<ConfirmedBookingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Modal State
  const [cancellingBooking, setCancellingBooking] = useState<ConfirmedBookingRow | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchTerm.trim()) {
      alert('กรุณาระบุชื่อเล่น หรือเบอร์โทรศัพท์');
      return;
    }
    
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await BookingService.searchActiveBookings(searchTerm.trim());
      setBookings(data);
    } catch (err) {
      console.error(err);
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
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
      
      // Remove cancelled booking from list
      setBookings(curr => curr.filter(b => b.id !== cancellingBooking.id));
      
      alert('ยกเลิกสำเร็จ — คืนเครดิตให้ผู้ปกครองแล้ว');
      closeModal();
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  const openModal = (booking: ConfirmedBookingRow) => {
    setCancellingBooking(booking);
    setCancelReason(''); // reset
  };

  const closeModal = () => {
    setCancellingBooking(null);
    setCancelReason('');
  };

  return (
    <AdminPanel className="no-print">
      <AdminPanelHeader
        icon={CalendarX}
        title="ยกเลิกสิทธิ์เข้าเรียน (Override Cancel)"
      />

      <div className="space-y-6">
        <form onSubmit={handleSearch} className="bg-gray-50 p-6 border border-gray-200 rounded-2xl flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <AdminFieldLabel>ค้นหาจากชื่อเล่นน้อง หรือเบอร์โทรศัพท์ผู้ปกครอง:</AdminFieldLabel>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="เช่น 0812345678 หรือ น้องแพนด้า"
                className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm h-12 bg-white focus:ring-1 focus:ring-icsn-teal outline-none transition"
              />
            </div>
          </div>
          <AdminPrimaryButton type="submit" disabled={loading} className="h-12 px-6 shadow-sm">
            {loading ? 'กำลังค้นหา...' : 'ค้นหาประวัติ'}
          </AdminPrimaryButton>
        </form>

        <div className="space-y-4">
          <h4 className="text-base font-bold text-gray-600">
            รายการจองที่สามารถยกเลิกได้ (นับตั้งแต่วันนี้เป็นต้นไป):
          </h4>

          {loading ? (
            <p className="text-center text-gray-500 py-10 text-base font-medium">กำลังค้นหา...</p>
          ) : hasSearched && bookings.length === 0 ? (
            <AdminEmptyState message="ไม่พบประวัติการจองที่ยัง Active อยู่สำหรับคำค้นหานี้" />
          ) : !hasSearched ? (
             <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
               <p className="text-gray-500 text-base font-medium">พิมพ์ชื่อ หรือ เบอร์โทร เพื่อค้นหารายการจอง</p>
             </div>
          ) : (
            <div className="space-y-4">
              {bookings.map(bk => (
                <div
                  key={bk.id}
                  className="border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white gap-4 shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg uppercase">
                        Confirmed
                      </span>
                      <p className="font-bold text-gray-900 text-lg">น้อง{bk.child_nickname}</p>
                    </div>
                    <p className="text-icsn-teal font-bold text-base">
                      รอบเรียน: {formatThaiFullDate(bk.session_date)}
                    </p>
                    <p className="text-gray-500 text-sm mt-1.5">
                      ผู้ปกครอง: <span className="font-bold text-gray-700">{bk.parent_name}</span> ({bk.parent_phone})
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openModal(bk)}
                    className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold rounded-xl transition cursor-pointer text-sm shrink-0"
                  >
                    ยกเลิกการจอง
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-rose-600 mb-4">ยืนยันการยกเลิกสิทธิ์?</h3>
            
            <div className="bg-rose-50 text-rose-800 p-4 rounded-xl text-sm border border-rose-100 mb-5">
              <p>คุณกำลังจะยกเลิกการจองของ <strong>น้อง{cancellingBooking.child_nickname}</strong></p>
              <p className="mt-1">วันที่: <strong>{formatThaiFullDate(cancellingBooking.session_date)}</strong></p>
              <p className="mt-2 text-xs opacity-90">* ระบบจะทำการคืนเครดิต 1 ครั้งกลับไปยังบัญชีของผู้ปกครองโดยอัตโนมัติ</p>
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
                placeholder="เช่น ผู้ปกครองแจ้งขอยกเลิกทาง Line..."
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
                disabled={isProcessing}
                className="flex-[2] py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 shadow-md shadow-rose-500/20 transition disabled:opacity-50 flex items-center justify-center"
              >
                {isProcessing ? 'กำลังยกเลิก...' : 'ยืนยันยกเลิก และคืน 1 เครดิต'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPanel>
  );
}
