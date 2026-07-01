import React from 'react';

import type { Booking } from '@/types';

import { useBookingContext } from './BookingContext';
import { COPY } from '@/config/copy';

interface UpcomingBookingsProps {
  onCancelRequest: (bookingId: string) => void;
}

export function UpcomingBookings({ onCancelRequest }: UpcomingBookingsProps) {
  const { myBookings, selectedChildId } = useBookingContext();
  const filtered = myBookings.filter(b => !selectedChildId || b.child_id === selectedChildId);
  
  if (filtered.length === 0) return null;

  return (
    <div className="px-4 py-3 border-b border-border/40">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
        {COPY.BOOKING_FLOW.UPCOMING_CLASSES}
      </p>
      
      <div className="space-y-2">
        {filtered.map(booking => {
          const sDate = booking.session_date;
          
          const now = new Date();
          const bkkDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(now);
          const bkkHour = parseInt(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', hour: 'numeric', hour12: false }).format(now));
          
          const isPastDate = sDate < bkkDate;
          const isCantCancelToday = sDate === bkkDate && bkkHour >= 7;
          const canCancel = !isPastDate && !isCantCancelToday;
          
          const bDate = new Date(booking.session_date);
          return (
            <div key={booking.id} className="flex items-center justify-between gap-3 py-1">
              <div className="flex items-center gap-3 min-w-0">
                {/* Date chip */}
                <div className="w-11 h-11 bg-icsn-teal/10 text-icsn-teal rounded-xl flex flex-col items-center justify-center font-bold shrink-0">
                  <span className="text-xs leading-none mb-0.5" suppressHydrationWarning>{bDate.toLocaleDateString('th-TH', { month: 'short' })}</span>
                  <span className="text-base leading-none">{bDate.getDate()}</span>
                </div>
                {/* Text */}
                <div className="min-w-0">
                  <p className="font-bold text-icsn-navy text-sm leading-tight">น้อง {booking.child?.nickname}</p>
                  <p className="text-sm text-icsn-teal font-medium">{booking.session?.time_label || COPY.BOOKING_FLOW.SESSION_MORNING}</p>
                </div>
              </div>
              {/* Cancel */}
              {canCancel ? (
                <button 
                  onClick={() => onCancelRequest(booking.id)}
                  className="text-sm font-bold text-error px-4 h-10 rounded-xl border border-error/30 hover:bg-error/10 active:scale-95 transition shrink-0"
                >
                  ยกเลิก
                </button>
              ) : (
                <span className="text-xs text-muted-foreground/60 shrink-0">{COPY.BOOKING_FLOW.NOT_ALLOWED}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

