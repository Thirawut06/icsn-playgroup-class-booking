import React from 'react';
import { CalendarDays } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';

interface BookingsSectionProps {
  bookings: any[];
}

export function BookingsSection({ bookings }: BookingsSectionProps) {
  return (
    <div className="border-b border-border pb-8">
      <h3 className="text-base font-bold text-foreground mb-6 flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-icsn-navy" /> 
        ประวัติการจองคลาส
      </h3>
      {bookings && bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.sort((a:any, b:any) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime()).map((booking: any) => (
            <div key={booking.id} className="flex items-center justify-between border-l-4 border-muted pl-4 py-1">
              <div>
                <p className="font-medium text-foreground text-base">
                  {formatDateShort(booking.session_date)}
                  <span className="text-muted-foreground font-normal mx-2">&middot;</span>
                  <span className="text-sm text-muted-foreground font-normal">
                    {booking.sessions?.time_label || '09:30 - 11:30'}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  booking.status === 'confirmed' ? 'bg-success/10 text-success' : 
                  booking.status === 'cancelled' ? 'bg-error/10 text-error' : 'bg-muted text-foreground'
                }`}>
                  {booking.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-base text-muted-foreground">ไม่พบประวัติการจอง</p>
      )}
    </div>
  );
}
