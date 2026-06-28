"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Session } from '@/types';
import { BookHeader } from '@/components/book/BookHeader';
import { TopUpModal } from '@/components/book/TopUpModal';
import { ChildSelector } from '@/components/book/ChildSelector';
import { UpcomingBookings } from '@/components/book/UpcomingBookings';
import { CalendarWidget } from '@/components/book/CalendarWidget';
import { BookingSummary } from '@/components/book/BookingSummary';
import { CancelConfirmModal } from '@/components/book/CancelConfirmModal';
import { BookingConfirmModal } from '@/components/book/BookingConfirmModal';

import { useBookingData } from '@/hooks/useBookingData';
import { useBookingActions } from '@/hooks/useBookingActions';
import { checkIsBookableDate } from '@/utils/dateUtils';

export default function Book() {
  const router = useRouter();
  
  // ─── Data & State via Custom Hooks ───────────────────────────
  const {
    parentId,
    parentName,
    creditsRemaining,
    children,
    packages,
    paymentPackages,
    sessions,
    myBookings,
    loading,
    selectedChildId,
    setSelectedChildId,
    refreshData
  } = useBookingData();

  const [monthIndex, setMonthIndex] = useState(0); // 0 = current, 1 = next
  
  // Selection State
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  // Modals / Status State
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showBookingConfirm, setShowBookingConfirm] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);

  const clearSelection = () => {
    setSelectedDate(null);
    setSelectedSession(null);
  };

  const handleBookingSuccess = () => {
    setShowBookingConfirm(false);
    setBookingSuccess(false);
    refreshData();
  };

  const {
    isSubmitting,
    bookingError,
    setBookingError,
    isCancelling,
    confirmBookClass,
    executeCancel
  } = useBookingActions({
    parentId,
    selectedChildId,
    selectedDate,
    selectedSession,
    packages,
    onSuccess: handleBookingSuccess,
    clearSelection
  });

  // ─── Event Handlers ──────────────────────────────────────────

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const handleDateSelect = async (dayObj: any) => {
    setBookingSuccess(false);
    setBookingError('');
    setSelectedDate(dayObj.dateStr);

    // Auto-select first available session
    const firstSession = dayObj.sessions?.[0] || null;
    setSelectedSession(firstSession);
  };

  const handleBookClass = () => {
    if (!selectedDate || !selectedChildId || packages.length === 0) {
      setBookingError("กรุณาเลือกน้อง และตรวจสอบเครดิตคงเหลือ");
      return;
    }
    setBookingError('');
    setShowBookingConfirm(true);
  };

  // ─── Derived State ───────────────────────────────────────────

  const capacity = selectedSession ? selectedSession.total_capacity : 15;
  const currentBookedCount = selectedSession ? (selectedSession.booked_count || 0) : 0;
  
  // Clean code: Use extracted utility for date validation
  const selectedDateAvailable = selectedDate ? (capacity - currentBookedCount > 0 && checkIsBookableDate(selectedDate)) : false;
  const selectedSessionStatus = selectedDateAvailable ? 'เปิดรับจอง' : 'เต็มแล้ว / ปิดรับจอง';
  const selectedChildObj = children.find(c => c.id === selectedChildId);

  // ─── Render ──────────────────────────────────────────────────

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-icsn-teal font-bold">Loading...</div>;
  }

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
            availableSessions={sessions.filter(s => s.session_date === selectedDate)}
            selectedSession={selectedSession}
            onSelectSession={setSelectedSession}
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

        <BookingConfirmModal
          isOpen={showBookingConfirm}
          isSubmitting={isSubmitting}
          childName={selectedChildObj?.nickname || ''}
          dateLabel={selectedDate ? new Date(selectedDate).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : ''}
          timeLabel={selectedSession?.time_label || 'เช้า (09:00 - 12:00)'}
          onClose={() => setShowBookingConfirm(false)}
          onConfirm={confirmBookClass}
        />

      </div>
    </div>
  );
}
