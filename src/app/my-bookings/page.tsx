"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ParentService, PackageService, BookingService, supabase } from '@/lib/supabase';
import { bookingModule } from '@/lib/domain';
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
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setParentId(user.id);
      loadData(user.id);
    });
  }, [router]);

  const loadData = async (pId: string) => {
    setLoading(true);
    try {
      const parent = await ParentService.getParentDetails(pId);
      if (parent) {
        setParentName(parent.name);
        setPhone(parent.phone);
      }

      const pkgs = await PackageService.getPackages(pId);
      const totalCredits = pkgs.reduce((sum, pkg) => sum + pkg.credits_remaining, 0);
      setCreditsRemaining(totalCredits);

      const bks = await BookingService.getBookings(pId);
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

  const [cancelError, setCancelError] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const triggerCancel = (booking: any) => {
    setTargetBooking(booking);
    setCancelError('');
    setCancelSuccess(false);
    setShowCancelConfirm(true);
  };

  const processCancel = async () => {
    if (!targetBooking) return;
    setActionLoading(true);
    setCancelError('');
    setCancelSuccess(false);
    try {
      await bookingModule.cancelBookingAsParent(targetBooking.id, parentId);
      setCancelSuccess(true);
      loadData(parentId);
    } catch (error: any) {
      setCancelError(error.message || "เกิดข้อผิดพลาดในการยกเลิก");
    } finally {
      setActionLoading(false);
    }
  };

  const closeCancelModal = () => {
    setShowCancelConfirm(false);
    setTargetBooking(null);
    setCancelError('');
    setCancelSuccess(false);
  };

  return (
    <div className="bg-muted flex flex-col min-h-screen pb-16 font-sarabun">
      {/* Header Section */}
      <header className="bg-white border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-[480px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/book')} className="p-2 text-muted-foreground hover:text-icsn-teal rounded-xl hover:bg-icsn-teal/5 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <h1 className="font-bold text-foreground text-base leading-tight">Your Class History</h1>
              <div className="flex items-center gap-2 -mt-0.5">
                <span className="text-xs text-muted-foreground font-medium">ประวัติชั้นเรียนของคุณ</span>
                <span className="text-xs text-muted-foreground/70">|</span>
                <span className="text-[9px] text-muted-foreground/70 font-bold tracking-wider uppercase">ICSN PLAYGROUP</span>
              </div>
            </div>
          </div>
          <button onClick={() => router.push('/book')} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-icsn-teal hover:bg-icsn-teal/90 rounded-xl transition shadow-sm h-9">
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Book New Class / จองชั้นเรียนเพิ่ม</span>
            <span className="sm:hidden">Book</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[480px] w-full mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="bg-white border border-border rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground/70">ครอบครัวที่ลงทะเบียนเรียน</p>
            <h2 className="text-lg font-bold text-foreground">Parent/Guardian: {parentName}</h2>
            <p className="text-xs text-muted-foreground">Contact: {phone}</p>
          </div>
          <div className="flex gap-4">
            <div className="text-center bg-icsn-teal/5 border border-icsn-teal/20 rounded-2xl px-4 py-2.5">
              <span className="block text-[9px] text-icsn-teal font-bold uppercase tracking-wider">Credits</span>
              <span className="block text-xl font-bold text-icsn-teal mt-0.5">{creditsRemaining}</span>
            </div>
            <div className="text-center bg-muted border rounded-2xl px-4 py-2.5">
              <span className="block text-[9px] text-muted-foreground/70 font-bold uppercase tracking-wider">Booked</span>
              <span className="block text-xl font-bold text-foreground mt-0.5">{bookings.length}</span>
            </div>
          </div>
        </div>

        {/* Ledger */}
        <div className="bg-white rounded-3xl border border-border p-6 shadow-sm space-y-6">
          <h3 className="font-bold text-foreground text-base border-b pb-3.5 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-icsn-navy" />
            <span>รายการสำรองห้องเรียนทั้งหมด (Reservations)</span>
          </h3>

          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-icsn-teal border-t-transparent rounded-full animate-spin"></div></div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 bg-muted text-muted-foreground/70 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarCheck className="w-8 h-8" />
              </div>
              <p className="text-muted-foreground font-medium">ยังไม่มีรายการจองชั้นเรียน</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map(bk => {
                const sDate = bk.session.session_date;
                const past = isPastDate(sDate);
                const cantCancelToday = isTodayAndAfterSeven(sDate);
                const disabledCancel = past || cantCancelToday;

                return (
                  <div key={bk.id} className="border border-border rounded-2xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center hover:border-icsn-teal/40 transition-colors bg-muted/50">
                    <div className="flex gap-4 items-start w-full sm:w-auto">
                      <div className="w-12 h-12 bg-white rounded-xl border border-border flex flex-col items-center justify-center shrink-0 shadow-sm">
                        <span className="text-xs font-bold text-icsn-pink uppercase" suppressHydrationWarning>{new Date(sDate).toLocaleDateString('en-US', { month: 'short' })}</span>
                        <span className="text-lg font-extrabold text-foreground leading-none">{new Date(sDate).getDate()}</span>
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-foreground text-base">{formatThaiDate(sDate)}</h4>
                          {past && <span className="bg-muted text-muted-foreground text-[9px] px-2 py-0.5 rounded-full font-bold">Ended</span>}
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">น้อง{bk.child.nickname} ({bk.child.full_name})</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground/70 font-medium mt-1">
                          <span className="flex items-center gap-1"><Info className="w-3 h-3" /> 09:30 - 11:30</span>
                        </div>
                      </div>
                    </div>
                    {!past && (
                      <button
                        disabled={disabledCancel}
                        onClick={() => triggerCancel(bk)}
                        className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${disabledCancel ? 'bg-muted text-muted-foreground/70 cursor-not-allowed border border-border' : 'bg-white border border-error/30 text-error hover:bg-error/10 hover:border-error/30 shadow-sm'}`}
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
            {cancelSuccess ? (
              <>
                <div className="w-14 h-14 bg-teal-50 text-icsn-teal rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-100">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground text-center mb-2">ยกเลิกสำเร็จ</h3>
                <p className="text-sm text-muted-foreground text-center mb-6">ระบบได้ทำการคืนเครดิตให้คุณเรียบร้อยแล้ว</p>
                <button onClick={closeCancelModal} className="w-full bg-muted hover:bg-muted/80 text-foreground font-bold py-3 rounded-xl transition">
                  ปิด (Close)
                </button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4 border border-error/20">
                  <XCircle className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground text-center mb-2">ยืนยันการยกเลิกจอง?</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">คุณต้องการยกเลิกการจองของ น้อง{targetBooking.child.nickname} ในวันที่ {formatThaiDate(targetBooking.session.session_date)} ใช่หรือไม่?</p>
                
                {cancelError && (
                  <div className="w-full bg-error/10 border border-error/20 text-error text-sm font-medium p-3 rounded-xl mb-4 text-center">
                    {cancelError}
                  </div>
                )}
                
                <div className="flex gap-3">
                  <button onClick={closeCancelModal} disabled={actionLoading} className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-bold py-3 rounded-xl transition">
                    ปิด (Close)
                  </button>
                  <button onClick={processCancel} disabled={actionLoading} className="flex-1 bg-error hover:bg-error text-white font-bold py-3 rounded-xl transition shadow-sm">
                    {actionLoading ? 'กำลังยกเลิก...' : 'ยืนยัน (Confirm)'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}






