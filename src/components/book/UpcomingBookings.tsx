import React from 'react';
import { CalendarHeart } from 'lucide-react';
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
    <div className="bg-white rounded-2xl border border-border p-4 shadow-icsn-card space-y-4">
      <h3 className="font-bold text-icsn-navy border-b border-border pb-3 flex items-center gap-1.5 text-base">
        <CalendarHeart className="w-5 h-5 text-icsn-teal" />
        <span>{COPY.BOOKING_FLOW.UPCOMING_CLASSES}</span>
      </h3>
      
      <div className="space-y-3">
        {filtered.map(booking => {
          const sDate = booking.session_date;
          
          // Timezone safe check for Bangkok Time
          const now = new Date();
          const bkkDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(now);
          const bkkHour = parseInt(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', hour: 'numeric', hour12: false }).format(now));
          
          const isPastDate = sDate < bkkDate;
          const isCantCancelToday = sDate === bkkDate && bkkHour >= 7;
          const canCancel = !isPastDate && !isCantCancelToday;
          
          const bDate = new Date(booking.session_date); // For rendering UI only
          return (
            <div key={booking.id} className="bg-icsn-teal/5 border border-icsn-teal/20 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white shadow-sm border border-icsn-teal/20 text-icsn-teal rounded-xl flex flex-col items-center justify-center font-bold">
                    <span className="text-xs leading-none mb-0.5" suppressHydrationWarning>{bDate.toLocaleDateString('th-TH', { month: 'short' })}</span>
                    <span className="text-lg leading-none">{bDate.getDate()}</span>
                  </div>
                  <div>
                    <p className="font-black text-icsn-navy text-base">น้อง {booking.child?.nickname}</p>
                    <p className="text-sm font-bold text-icsn-teal">{booking.session?.time_label || COPY.BOOKING_FLOW.SESSION_MORNING}</p>
                  </div>
                </div>
                {canCancel ? (
                  <button 
                    onClick={() => onCancelRequest(booking.id)}
                    className="text-sm font-bold text-error bg-white shadow-sm px-3.5 py-2 rounded-xl border border-error/20 hover:bg-error/10 active:scale-95 transition"
                  >
                    ยกเลิก
                  </button>
                ) : (
                  <span className="text-xs font-bold text-muted-foreground/70 bg-muted px-2.5 py-1.5 rounded-xl">{COPY.BOOKING_FLOW.NOT_ALLOWED}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

