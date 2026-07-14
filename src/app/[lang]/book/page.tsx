"use client";
import React, { useState, useEffect } from 'react';
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
import { MissingPhotoBlocker } from '@/components/book/MissingPhotoBlocker';

import { BookingProvider, useBookingContext } from '@/components/book/BookingContext';
import { useBookingActions } from '@/hooks/useBookingActions';
import { checkIsBookableDate } from '@/utils/dateUtils';
import { sessionModule } from '@/lib/domain';
import { supabase } from '@/lib/supabase';
import { useDictionary } from '@/lib/i18n/dictionary-context';
import { ROUTES } from '@/config/routes';
import { LineSupportCard } from '@/components/ui/LineSupportCard';

export default function Book() {
  return (
    <BookingProvider>
      <BookPageContent />
    </BookingProvider>
  );
}

const bookCache: Record<string, any> = {};

function useCachedState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    if (key in bookCache) {
      return bookCache[key];
    }
    return defaultValue;
  });

  useEffect(() => {
    bookCache[key] = state;
  }, [key, state]);

  return [state, setState];
}

function BookPageContent() {
  const router = useRouter();
  const { dict, lang } = useDictionary();

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
    closures,
    settings,
    loading,
    selectedChildId,
    refreshData,
    mergeSessionsForDate,
    hasPendingSlip
  } = useBookingContext();

  const [monthIndex, setMonthIndex] = useCachedState('monthIndex', 0);

  // Selection State
  const [selectedDates, setSelectedDates] = useCachedState<string[]>('selectedDates', []);
  const [selectedSessionsMap, setSelectedSessionsMap] = useCachedState<Record<string, Session>>('selectedSessionsMap', {});

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
    router.push(ROUTES.LOGIN(lang));
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
      toast.error(dict.book.outOfCredits);
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

    // Auto-select first available active session that has capacity
    const activePackage = packages
      .filter(p => p.credits_remaining > 0)
      .sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime())[0];
    const isTrialUser = activePackage?.type === 'trial';

    const firstActiveSession = currentSessions?.find((s: Session) => {
      if (!s.is_active) return false;
      const booked = s.booked_count || 0;
      if (booked >= s.total_capacity) return false;
      if (isTrialUser) {
        const trialBooked = s.trial_booked_count || 0;
        const trialCap = s.trial_capacity || 0;
        if (trialBooked >= trialCap) return false;
      }
      return true;
    }) || null;

    if (firstActiveSession) {
      setSelectedSessionsMap(prev => ({ ...prev, [dateStr]: firstActiveSession }));
    }
  };

  const handleBookClass = () => {
    if (selectedDates.length === 0 || !selectedChildId || packages.length === 0) {
      setBookingError(dict.book.selectChildDateCredits);
      return;
    }
    setBookingError('');
    setShowBookingConfirm(true);
  };

  // ─── Derived State ───────────────────────────────────────────
  const selectedChildObj = children.find(c => c.id === selectedChildId);

  // ─── Render ──────────────────────────────────────────────────

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-icsn-teal font-bold">{dict.common.loading}</div>;
  }

  const childrenMissingPhotos = children.filter(c => !c.photo_url || !c.parent_photo_url);

  // Build locale-aware date label for confirm modal
  const dateLocale = lang === 'th' ? 'th-TH' : 'en-US';
  const dateLabel = selectedDates.length === 1
    ? new Date(selectedDates[0]).toLocaleDateString(dateLocale, { weekday: 'short', day: 'numeric', month: 'short' })
    : `${dict.book.allDays} ${selectedDates.length} ${dict.book.daysUnit}`;
  const timeLabel = selectedDates.length === 1
    ? (selectedSessionsMap[selectedDates[0]]?.time_label || '')
    : dict.book.asSelected;

  return (
    <div className="bg-white flex flex-col min-h-screen pb-16">
      <div className="max-w-[480px] mx-auto w-full bg-white min-h-screen shadow-[0_0_20px_rgba(0,0,0,0.05)] flex flex-col relative overflow-hidden">

        {childrenMissingPhotos.length > 0 && (
          <MissingPhotoBlocker 
            childrenMissingPhotos={childrenMissingPhotos} 
            parentId={parentId} 
            onUploadSuccess={async () => {
              await refreshData();
            }} 
          />
        )}

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

        <main className="flex-1 flex flex-col">
          {settings?.announcement_text && (
            <div className="mx-4 my-3">
              <div className="bg-info/10 border border-info/30 text-info p-3 rounded-xl flex items-start gap-3">
                <span className="text-xl leading-none mt-0.5">📢</span>
                <div>
                  <p className="text-xs font-bold text-info/70 uppercase tracking-wider mb-0.5">
                    {dict.book.announcementLabel}
                  </p>
                  <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">{settings.announcement_text}</p>
                </div>
              </div>
            </div>
          )}

          {hasPendingSlip && (
            <div className="mx-4 my-2">
              <div className="bg-warning/10 border border-warning/30 text-warning p-3 rounded-xl flex items-start gap-3">
                <span className="text-xl leading-none mt-0.5">⏳</span>
                <div>
                  <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">
                    {dict.book.pendingSlipNotice || "กำลังรอแอดมินอนุมัติการชำระเงิน ระบบจะอัปเดตเครดิตเมื่อตรวจสอบเสร็จสิ้น"}
                  </p>
                </div>
              </div>
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
            closures={closures}
            operatingDays={settings?.operating_days}
            cutoffHour={settings?.cutoff_hour || 7}
          />

          <ClosureNotificationBanner />
          
          <div className="py-4 mt-auto">
            <LineSupportCard />
          </div>
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
          dateLabel={dateLabel}
          timeLabel={timeLabel}
          creditsToDeduct={selectedDates.length}
          onClose={() => setShowBookingConfirm(false)}
          onConfirm={confirmBookClass}
        />

      </div>
    </div>
  );
}
