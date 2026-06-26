"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppDB } from '@/lib/supabase';
import type { Child, Package, Session, PackageOption, Booking } from '@/types';
import { BookHeader } from '@/components/book/BookHeader';
import { TopUpModal } from '@/components/book/TopUpModal';
import { ChildSelector } from '@/components/book/ChildSelector';
import { UpcomingBookings } from '@/components/book/UpcomingBookings';
import { CalendarWidget } from '@/components/book/CalendarWidget';
import { BookingSummary } from '@/components/book/BookingSummary';
import { CancelConfirmModal } from '@/components/book/CancelConfirmModal';

export default function Book() {
  const router = useRouter();
  const [parentId, setParentId] = useState('');
  const [parentName, setParentName] = useState('');
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [children, setChildren] = useState<Child[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [paymentPackages, setPaymentPackages] = useState<PackageOption[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [monthIndex, setMonthIndex] = useState(0); // 0 = current, 1 = next
  
  // Selection
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [bookedCount, setBookedCount] = useState(0);

  // Modals / Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // ─── Data Loading ────────────────────────────────────────────

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
        setChildren(parent.children || []);
        if (parent.children?.length > 0) {
          setSelectedChildId(parent.children[0].id);
        }
      }

      const pkgs = await AppDB.getPackages(pId);
      setPackages(pkgs);
      const totalCredits = pkgs.reduce((sum, pkg) => sum + pkg.credits_remaining, 0);
      setCreditsRemaining(totalCredits);

      const pkgOptions = await AppDB.getPackageOptions();
      setPaymentPackages(pkgOptions);

      // Load sessions for current month and next month
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0];
      const loadedSessions = await AppDB.getSessions(startDate, endDate);
      setSessions(loadedSessions);

      const bookings = await AppDB.getBookings(pId);
      setMyBookings(bookings);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ─── Event Handlers ──────────────────────────────────────────

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const handleDateSelect = async (dayObj: any) => {
    setBookingSuccess(false);
    setBookingError('');
    setSelectedDate(dayObj.dateStr);
    setSelectedSession(dayObj.session || null);
    
    if (dayObj.session) {
      try {
        const count = await AppDB.getBookedCountForSession(dayObj.session.id);
        setBookedCount(count);
      } catch (e) {
        setBookedCount(0);
      }
    } else {
      setBookedCount(0);
    }
  };

  const handleBookClass = async () => {
    if (!selectedDate || !selectedChildId || packages.length === 0) {
      setBookingError("กรุณาเลือกน้อง และตรวจสอบเครดิตคงเหลือ");
      return;
    }
    const pkgToUse = packages[0];
    setIsSubmitting(true);
    setBookingError('');
    try {
      let finalSessionId = selectedSession?.id;
      if (!finalSessionId) {
         const newSess = await AppDB.getOrCreateSession(selectedDate);
         finalSessionId = newSess.id;
      }
      
      const hasDuplicate = await AppDB.hasDuplicateBooking(selectedChildId, finalSessionId);
      if (hasDuplicate) {
        throw new Error("คุณได้จองสิทธิ์ให้น้องในรอบเวลานี้ไปแล้ว");
      }
      
      await AppDB.bookClass(parentId, selectedChildId, finalSessionId, pkgToUse.id);
      setBookingSuccess(true);
      loadData(parentId);
      setTimeout(() => {
        setSelectedDate(null);
        setBookingSuccess(false);
      }, 3000);
    } catch (e: any) {
      setBookingError("ไม่สามารถจองได้: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeCancel = async (bookingId: string) => {
    setIsCancelling(true);
    try {
      const latestPkg = await AppDB.getLatestPackage(parentId);
      if (!latestPkg) {
        alert("ไม่พบข้อมูลแพ็กเกจในระบบ ไม่สามารถคืนเครดิตได้ โปรดติดต่อแอดมิน");
        return;
      }
      
      await AppDB.cancelBooking(bookingId, latestPkg.id);
      alert("ยกเลิกการจองสำเร็จ คืนเครดิตเรียบร้อย");
      setBookingToCancel(null);
      loadData(parentId);
    } catch (e: any) {
      alert("ไม่สามารถยกเลิกการจองได้: " + e.message);
    } finally {
      setIsCancelling(false);
    }
  };

  // ─── Derived State ───────────────────────────────────────────

  const capacity = selectedSession ? selectedSession.total_capacity : 15;
  const isSameDayPast7AM = selectedDate ? (new Date(selectedDate).toDateString() === new Date().toDateString() && new Date().getHours() >= 7) : false;
  const selectedDateAvailable = selectedDate ? (capacity - bookedCount > 0 && !isSameDayPast7AM) : false;
  const selectedSessionStatus = selectedDateAvailable ? 'เปิดรับจอง' : 'เต็มแล้ว / ปิดรับจอง';
  const selectedChildObj = children.find(c => c.id === selectedChildId);

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div className="bg-white flex flex-col min-h-screen pb-16">
      <div className="max-w-[480px] mx-auto w-full bg-white min-h-screen shadow-[0_0_20px_rgba(0,0,0,0.05)] flex flex-col relative overflow-hidden">
        
        <BookHeader 
          parentName={parentName} 
          creditsRemaining={creditsRemaining} 
          onLogout={handleLogout} 
          onTopUpClick={() => setShowTopUpModal(true)} 
        />

        <main className="flex-1 px-4 pb-5 space-y-5">
          <ChildSelector
            children={children}
            selectedChildId={selectedChildId}
            onSelectChild={setSelectedChildId}
          />

          <UpcomingBookings
            bookings={myBookings}
            selectedChildId={selectedChildId}
            onCancelRequest={setBookingToCancel}
          />

          <CalendarWidget
            monthIndex={monthIndex}
            onMonthChange={setMonthIndex}
            sessions={sessions}
            myBookings={myBookings}
            selectedDate={selectedDate}
            selectedChildId={selectedChildId}
            onDateSelect={handleDateSelect}
          />

          <BookingSummary
            selectedDate={selectedDate}
            selectedDateAvailable={selectedDateAvailable}
            selectedSessionStatus={selectedSessionStatus}
            selectedChildObj={selectedChildObj}
            creditsRemaining={creditsRemaining}
            selectedChildId={selectedChildId}
            isSubmitting={isSubmitting}
            bookingSuccess={bookingSuccess}
            bookingError={bookingError}
            onBookClass={handleBookClass}
          />
        </main>

        <TopUpModal 
          isOpen={showTopUpModal} 
          onClose={() => setShowTopUpModal(false)} 
          parentId={parentId} 
          paymentPackages={paymentPackages} 
        />

        <CancelConfirmModal
          isOpen={!!bookingToCancel}
          isCancelling={isCancelling}
          onClose={() => setBookingToCancel(null)}
          onConfirm={() => bookingToCancel && executeCancel(bookingToCancel)}
        />

      </div>
    </div>
  );
}
