"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { Session } from '@/types';
import { BookHeader } from '@/components/book/BookHeader';
import { TopUpModal } from '@/components/book/TopUpModal';
import { ChildSelector } from '@/components/book/ChildSelector';
import { UpcomingBookings } from '@/components/book/UpcomingBookings';
import { CalendarWidget } from '@/components/book/CalendarWidget';
import { BookingSummary } from '@/components/book/BookingSummary';
import { CancelConfirmModal } from '@/components/book/CancelConfirmModal';
import { BookingConfirmModal } from '@/components/book/BookingConfirmModal';
import { ClosureNotificationBanner } from '@/components/book/ClosureNotificationBanner';

import { BookingProvider, useBookingContext } from '@/components/book/BookingContext';
import { useBookingActions } from '@/hooks/useBookingActions';
import { checkIsBookableDate } from '@/utils/dateUtils';
import { sessionModule } from '@/lib/domain';
import { supabase } from '@/lib/supabase';

export default function Book() {
  return (
    <BookingProvider>
      <BookPageContent />
    </BookingProvider>
  );
}

function BookPageContent() {
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
    blockoutDates,
    settings,
    loading,
    selectedChildId,
    refreshData,
    mergeSessionsForDate
  } = useBookingContext();

  const [monthIndex, setMonthIndex] = useState(0); 
  
  // Selection State
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedSessionsMap, setSelectedSessionsMap] = useState<Record<string, Session>>({});

  // Modals / Status State
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showBookingConfirm, setShowBookingConfirm] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);

  const clearSelection = () => {
    setSelectedDates([]);
    setSelectedSessionsMap({});
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
    cancelError,
    cancelSuccess,
    resetCancelState,
    confirmBookClass,
    executeCancel
  } = useBookingActions({
    parentId,
    selectedChildId,
    selectedDates,
    selectedSessionsMap,
    packages,
    onSuccess: handleBookingSuccess,
    clearSelection
  });

  // ─── Event Handlers ──────────────────────────────────────────

  const handleLogout = async () => {
    localStorage.clear();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleDateSelect = async (dayObj: any) => {
    setBookingSuccess(false);
    setBookingError('');
    const dateStr = dayObj.dateStr;

    if (selectedDates.includes(dateStr)) {
      // Toggle OFF
      setSelectedDates(prev => prev.filter(d => d !== dateStr));
      setSelectedSessionsMap(prev => {
        const next = { ...prev };
        delete next[dateStr];
        return next;
      });
      return;
    }

    // Toggle ON
    if (creditsRemaining <= 0) {
      toast.error("เครดิตของคุณหมดแล้ว กรุณาเติมแพ็คเกจ");
      return;
    }

    let updatedDates = [...selectedDates];
    let removedDate: string | null = null;

    if (updatedDates.length >= creditsRemaining) {
      removedDate = updatedDates.shift() || null;
    }
    
    updatedDates.push(dateStr);
    setSelectedDates(updatedDates);

    if (removedDate) {
      setSelectedSessionsMap(prev => {
        const next = { ...prev };
        if (removedDate) delete next[removedDate];
        return next;
      });
    }

    let currentSessions = dayObj.sessions || [];

    // Always fetch/create sessions for this date to ensure templates are synced
    try {
      const newSessions = await sessionModule.getOrCreateSessionsForDate(dateStr);
      if (newSessions.length > 0) {
        mergeSessionsForDate(dateStr, newSessions);
        currentSessions = newSessions;
      }
    } catch (err) {
      console.error("Failed to fetch sessions for date", err);
    }

    // Auto-select first available active session
    const firstActiveSession = currentSessions?.find((s: Session) => s.is_active) || null;
    if (firstActiveSession) {
      setSelectedSessionsMap(prev => ({ ...prev, [dateStr]: firstActiveSession }));
    }
  };

  const handleBookClass = () => {
    if (selectedDates.length === 0 || !selectedChildId || packages.length === 0) {
      setBookingError("กรุณาเลือกน้อง เลือกวันที่ และตรวจสอบเครดิตคงเหลือ");
      return;
    }
    setBookingError('');
    setShowBookingConfirm(true);
  };

  // ─── Derived State ───────────────────────────────────────────
  const selectedChildObj = children.find(c => c.id === selectedChildId);

  // ─── Render ──────────────────────────────────────────────────

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-icsn-teal font-bold">Loading...</div>;
  }

  return (
    <div className="bg-white flex flex-col min-h-screen pb-16">
      <ClosureNotificationBanner />
      <div className="max-w-[480px] mx-auto w-full bg-white min-h-screen shadow-[0_0_20px_rgba(0,0,0,0.05)] flex flex-col relative overflow-hidden">
        
        {(() => {
          const parentPhotoUrl = children.find(c => c.parent_photo_url)?.parent_photo_url || '';
          return (
            <BookHeader 
              parentName={parentName} 
              creditsRemaining={creditsRemaining} 
              parentPhotoUrl={parentPhotoUrl}
              onLogout={handleLogout} 
              onTopUpClick={() => setShowTopUpModal(true)} 
            />
          );
        })()}

        <main className="flex-1 px-4 pb-5 space-y-5 mt-2">
          {settings?.announcement_text && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm p-3 rounded-lg flex items-start gap-2 shadow-sm">
              <span className="text-xl">📢</span>
              <p className="font-medium whitespace-pre-wrap mt-0.5">{settings.announcement_text}</p>
            </div>
          )}

          <ChildSelector />

          <UpcomingBookings
            onCancelRequest={setBookingToCancel}
          />

          <CalendarWidget
            monthIndex={monthIndex}
            onMonthChange={setMonthIndex}
            selectedDates={selectedDates}
            onDateSelect={handleDateSelect}
          />

          <BookingSummary
            selectedDates={selectedDates}
            selectedChildObj={selectedChildObj}
            creditsRemaining={creditsRemaining}
            sessions={sessions}
            selectedSessionsMap={selectedSessionsMap}
            onSelectSessionMap={(dateStr, session) => setSelectedSessionsMap(prev => ({ ...prev, [dateStr]: session }))}
            isSubmitting={isSubmitting}
            bookingSuccess={bookingSuccess}
            bookingError={bookingError}
            onBookClass={handleBookClass}
            blockoutDates={blockoutDates}
            cutoffHour={settings?.cutoff_hour || 7}
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
          cancelError={cancelError}
          cancelSuccess={cancelSuccess}
          onClose={() => {
            setBookingToCancel(null);
            resetCancelState();
          }}
          onConfirm={() => bookingToCancel && executeCancel(bookingToCancel)}
        />

        <BookingConfirmModal
          isOpen={showBookingConfirm}
          isSubmitting={isSubmitting}
          childName={selectedChildObj?.nickname || ''}
          dateLabel={selectedDates.length === 1 ? new Date(selectedDates[0]).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' }) : `ทั้งหมด ${selectedDates.length} วัน`}
          timeLabel={selectedDates.length === 1 ? (selectedSessionsMap[selectedDates[0]]?.time_label || '') : 'ตามรอบที่เลือกไว้'}
          creditsToDeduct={selectedDates.length}
          onClose={() => setShowBookingConfirm(false)}
          onConfirm={confirmBookClass}
        />

      </div>
    </div>
  );
}
