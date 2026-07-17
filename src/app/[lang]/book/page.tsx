"use client";
import React from 'react';
import { BookHeader } from '@/components/book/BookHeader';
import dynamic from 'next/dynamic';
import { ChildSelector } from '@/components/book/ChildSelector';
import { UpcomingBookings } from '@/components/book/UpcomingBookings';
import { CalendarWidget } from '@/components/book/CalendarWidget';
import { BookingSummary } from '@/components/book/BookingSummary';

const TopUpModal = dynamic(() => import('@/components/book/TopUpModal').then(mod => mod.TopUpModal));
const CancelConfirmModal = dynamic(() => import('@/components/book/CancelConfirmModal').then(mod => mod.CancelConfirmModal));
const BookingConfirmModal = dynamic(() => import('@/components/book/BookingConfirmModal').then(mod => mod.BookingConfirmModal));
import { ClosureNotificationBanner } from '@/components/book/ClosureNotificationBanner';
import { MissingPhotoBlocker } from '@/components/book/MissingPhotoBlocker';

import { BookingProvider } from '@/components/book/BookingContext';
import { LineSupportCard } from '@/components/ui/LineSupportCard';
import { useBookPage } from './useBookPage';

export default function Book() {
  return (
    <BookingProvider>
      <BookPageContent />
    </BookingProvider>
  );
}

function BookPageContent() {
  const page = useBookPage();

  if (page.loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-icsn-teal font-bold">{page.dict.common.loading}</div>;
  }

  return (
    <div className="bg-white flex flex-col min-h-[100dvh] pb-16 lg:pb-0 w-full lg:h-[100dvh] lg:overflow-hidden">
      <div className="max-w-[480px] lg:max-w-6xl xl:max-w-7xl mx-auto w-full bg-white flex flex-col relative overflow-x-hidden h-full shadow-[0_0_20px_rgba(0,0,0,0.05)] lg:shadow-none">

        {page.childrenMissingPhotos.length > 0 && (
          <MissingPhotoBlocker 
            childrenMissingPhotos={page.childrenMissingPhotos} 
            parentId={page.parentId} 
            onUploadSuccess={async () => {
              await page.refreshData();
            }} 
          />
        )}

        {(() => {
          const parentPhotoUrl = page.children.find(c => c.parent_photo_url)?.parent_photo_url || '';
          return (
            <BookHeader
              parentName={page.parentName}
              creditsRemaining={page.creditsRemaining}
              parentPhotoUrl={parentPhotoUrl}
              onLogout={page.handleLogout}
              onTopUpClick={() => page.setShowTopUpModal(true)}
            />
          );
        })()}

        <main className="flex-1 flex flex-col lg:grid lg:grid-cols-12 lg:gap-8 lg:p-8 lg:items-start">
          <div className="lg:col-span-7 flex flex-col w-full lg:sticky lg:top-4">
            {page.settings?.announcement_text && (
              <div className="mx-4 lg:mx-0 my-3">
                <div className="bg-info/10 border border-info/30 text-info p-3 rounded-xl flex items-start gap-3">
                  <span className="text-xl leading-none mt-0.5">📢</span>
                  <div>
                    <p className="text-xs font-bold text-info/70 uppercase tracking-wider mb-0.5">
                      {page.dict.book.announcementLabel}
                    </p>
                    <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">{page.settings.announcement_text}</p>
                  </div>
                </div>
              </div>
            )}

            {page.hasPendingSlip && (
              <div className="mx-4 lg:mx-0 my-2">
                <div className="bg-warning/10 border border-warning/30 text-warning p-3 rounded-xl flex items-start gap-3">
                  <span className="text-xl leading-none mt-0.5">⏳</span>
                  <div>
                    <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">
                      {page.dict.book.pendingSlipNotice || "กำลังรอแอดมินอนุมัติการชำระเงิน ระบบจะอัปเดตเครดิตเมื่อตรวจสอบเสร็จสิ้น"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <ChildSelector />

            <div className="block lg:hidden">
              <UpcomingBookings
                onCancelRequest={page.setBookingToCancel}
              />
            </div>

            <CalendarWidget
              monthIndex={page.monthIndex}
              onMonthChange={page.setMonthIndex}
              selectedDates={page.selectedDates}
              onDateSelect={page.handleDateSelect}
            />
          </div>

          <div className="lg:col-span-5 flex flex-col w-full gap-4 lg:gap-6 lg:pb-8">
            <BookingSummary
              selectedDates={page.selectedDates}
              selectedChildObj={page.selectedChildObj}
              creditsRemaining={page.creditsRemaining}
              sessions={page.sessions}
              selectedSessionsMap={page.selectedSessionsMap}
              onSelectSessionMap={(dateStr, session) => page.setSelectedSessionsMap(prev => ({ ...prev, [dateStr]: session }))}
              isSubmitting={page.isSubmitting}
              bookingSuccess={page.bookingSuccess}
              bookingError={page.bookingError}
              onBookClass={page.handleBookClass}
              closures={page.closures}
              operatingDays={page.settings?.operating_days}
              cutoffHour={page.settings?.cutoff_hour || 7}
            />

            <div className="hidden lg:block">
              <UpcomingBookings
                onCancelRequest={page.setBookingToCancel}
              />
            </div>

            <ClosureNotificationBanner />
            
            <div className="py-4 mt-auto lg:mt-0 lg:py-0 px-4 lg:px-0">
              <LineSupportCard />
            </div>
          </div>
        </main>

        <TopUpModal
          isOpen={page.showTopUpModal}
          onClose={() => page.setShowTopUpModal(false)}
          parentId={page.parentId}
          paymentPackages={page.paymentPackages}
        />

        <CancelConfirmModal
          isOpen={!!page.bookingToCancel}
          isCancelling={page.isCancelling}
          cancelError={page.cancelError}
          cancelSuccess={page.cancelSuccess}
          onClose={() => {
            page.setBookingToCancel(null);
            page.resetCancelState();
          }}
          onConfirm={() => page.bookingToCancel && page.executeCancel(page.bookingToCancel)}
        />

        <BookingConfirmModal
          isOpen={page.showBookingConfirm}
          isSubmitting={page.isSubmitting}
          childName={page.selectedChildObj?.nickname || ''}
          dateLabel={page.dateLabel}
          timeLabel={page.timeLabel}
          creditsToDeduct={page.selectedDates.length}
          onClose={() => page.setShowBookingConfirm(false)}
          onConfirm={page.confirmBookClass}
        />

      </div>
    </div>
  );
}
