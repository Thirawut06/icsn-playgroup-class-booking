"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppDB } from '@/lib/supabase';
import { ArrowLeft, PlusCircle, CalendarCheck, Info, MapPin, XCircle, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import type { Booking } from '@/types';

export default function MyBookings() {
  const router = useRouter();
  const [parentId, setParentId] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Cancellation Modal
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [targetBooking, setTargetBooking] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const pId = localStorage.getItem('icsn_parent_id');
    if (!pId) {
      router.push('/login');
      return;
    }
    setParentId(pId);
    loadData(pId);
  }, [router]);

  const loadData = async (pId: string) => {
    setLoading(true);
    try {
      const parent = await AppDB.getParentDetails(pId);
      if (parent) {
        setParentName(parent.name);
        setPhone(parent.phone);
      }

      const pkgs = await AppDB.getPackages(pId);
      const totalCredits = pkgs.reduce((sum, pkg) => sum + pkg.credits_remaining, 0);
      setCreditsRemaining(totalCredits);

      const bks = await AppDB.getBookings(pId);
      setBookings(bks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isTodayAndAfterSeven = (sessionDateStr: string) => {
    const now = new Date();
    const bkkDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(now);
    const bkkHour = parseInt(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', hour: 'numeric', hour12: false }).format(now));
    return sessionDateStr === bkkDate && bkkHour >= 7;
  };

  const isPastDate = (sessionDateStr: string) => {
    const bkkDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
    return sessionDateStr < bkkDate;
  };

  const formatThaiDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    const yearBE = parseInt(parts[0]) + 543;
    const monthIdx = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    const thaiFullMonths = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", 
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    return `${day} ${thaiFullMonths[monthIdx]} ${yearBE}`;
  };

  const triggerCancel = (booking: any) => {
    setTargetBooking(booking);
    setShowCancelConfirm(true);
  };

  const processCancel = async () => {
    if (!targetBooking) return;
    setActionLoading(true);
    try {
      // Find the first valid package to refund to
      const pkgs = await AppDB.getPackages(parentId);
      if (pkgs.length === 0) {
        throw new Error("No valid package found to process cancellation");
      }
      const pkgId = pkgs[0].id; 
      
      await AppDB.cancelBooking(targetBooking.id, pkgId);
      setShowCancelConfirm(false);
      setTargetBooking(null);
      loadData(parentId);
      alert("ยกเลิกสำเร็จ");
    } catch (error: any) {
      alert(error.message || "เกิดข้อผิดพลาดในการยกเลิก");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 flex flex-col min-h-screen pb-16 font-sarabun">
      {/* Header Section */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/book')} className="p-2 text-gray-500 hover:text-[#00B0B9] rounded-xl hover:bg-[#00B0B9]/5 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <h1 className="font-bold text-gray-800 text-base leading-tight">Your Class History</h1>
              <div className="flex items-center gap-2 -mt-0.5">
                <span className="text-[10px] text-gray-500 font-medium">ประวัติชั้นเรียนของคุณ</span>
                <span className="text-[10px] text-gray-300">|</span>
                <span className="text-[9px] text-gray-400 font-bold tracking-wider uppercase">ICSN PLAYGROUP</span>
              </div>
            </div>
          </div>
          <button onClick={() => router.push('/book')} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#00B0B9] hover:bg-[#00969e] rounded-xl transition shadow-sm h-9">
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Book New Class / จองชั้นเรียนเพิ่ม</span>
            <span className="sm:hidden">Book</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <p className="text-xs text-gray-400">ครอบครัวที่ลงทะเบียนเรียน</p>
            <h2 className="text-lg font-bold text-gray-800">Parent/Guardian: {parentName}</h2>
            <p className="text-[10px] text-gray-500">Contact: {phone}</p>
          </div>
          <div className="flex gap-4">
            <div className="text-center bg-[#00B0B9]/5 border border-[#00B0B9]/20 rounded-2xl px-4 py-2.5">
              <span className="block text-[9px] text-[#00B0B9] font-bold uppercase tracking-wider">Credits</span>
              <span className="block text-xl font-bold text-[#00B0B9] mt-0.5">{creditsRemaining}</span>
            </div>
            <div className="text-center bg-gray-50 border rounded-2xl px-4 py-2.5">
              <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider">Booked</span>
              <span className="block text-xl font-bold text-gray-700 mt-0.5">{bookings.length}</span>
            </div>
          </div>
        </div>

        {/* Ledger */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
          <h3 className="font-bold text-gray-800 text-base border-b pb-3.5 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[#211551]" />
            <span>รายการสำรองห้องเรียนทั้งหมด (Reservations)</span>
          </h3>

          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#00B0B9] border-t-transparent rounded-full animate-spin"></div></div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarCheck className="w-8 h-8" />
              </div>
              <p className="text-gray-500 font-medium">ยังไม่มีรายการจองชั้นเรียนค่ะ</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map(bk => {
                const sDate = bk.session.session_date;
                const past = isPastDate(sDate);
                const cantCancelToday = isTodayAndAfterSeven(sDate);
                const disabledCancel = past || cantCancelToday;

                return (
                  <div key={bk.id} className="border border-gray-100 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center hover:border-gray-200 transition-colors bg-gray-50/50">
                    <div className="flex gap-4 items-start w-full sm:w-auto">
                      <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 flex flex-col items-center justify-center shrink-0 shadow-sm">
                        <span className="text-[10px] font-bold text-[#CC3366] uppercase">{new Date(sDate).toLocaleDateString('en-US', { month: 'short' })}</span>
                        <span className="text-[16px] font-extrabold text-gray-800 leading-none">{new Date(sDate).getDate()}</span>
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-800 text-[15px]">{formatThaiDate(sDate)}</h4>
                          {past && <span className="bg-gray-100 text-gray-500 text-[9px] px-2 py-0.5 rounded-full font-bold">Ended</span>}
                        </div>
                        <p className="text-xs text-gray-600 font-medium">น้อง{bk.child.nickname} ({bk.child.full_name})</p>
                        <div className="flex items-center gap-3 text-[11px] text-gray-400 font-medium mt-1">
                          <span className="flex items-center gap-1"><Info className="w-3 h-3" /> 09:30 - 11:30</span>
                        </div>
                      </div>
                    </div>
                    {!past && (
                      <button
                        disabled={disabledCancel}
                        onClick={() => triggerCancel(bk)}
                        className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${disabledCancel ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' : 'bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 shadow-sm'}`}
                      >
                        <XCircle className="w-4 h-4" /> Cancel Booking
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      
      {/* Cancel Confirm Modal */}
      {showCancelConfirm && targetBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-xl relative animate-fade-in">
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
              <XCircle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 text-center mb-2">ยืนยันการยกเลิกจอง?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">คุณต้องการยกเลิกการจองของ น้อง{targetBooking.child.nickname} ในวันที่ {formatThaiDate(targetBooking.session.session_date)} ใช่หรือไม่?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelConfirm(false)} disabled={actionLoading} className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-3 rounded-xl transition">
                ปิด (Close)
              </button>
              <button onClick={processCancel} disabled={actionLoading} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition shadow-sm">
                {actionLoading ? 'กำลังยกเลิก...' : 'ยืนยัน (Confirm)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





