import React from 'react';
import { Calendar, Trash2 } from 'lucide-react';
import { useBookingContext } from './BookingContext';
import { useDictionary } from '@/lib/i18n/dictionary-context';
import type { Booking } from '@/types';

interface UpcomingBookingsProps {
  onCancelRequest: (bookingId: string) => void;
}

export function UpcomingBookings({ onCancelRequest }: UpcomingBookingsProps) {
  const { myBookings, selectedChildId, children, settings } = useBookingContext();
  const { dict, lang } = useDictionary();
  
  if (!selectedChildId) return null;

  const childBookings = myBookings
    .filter(b => b.child_id === selectedChildId && b.status === 'confirmed')
    .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());

  if (childBookings.length === 0) return null;

  const isCancelAllowed = (dateStr: string) => {
    const today = new Date();
    const targetDate = new Date(dateStr);
    const cutoffHour = settings?.cutoff_hour ?? 7;

    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    if (dateStr < todayStr) return false;
    if (dateStr === todayStr && today.getHours() >= cutoffHour) return false;
    return true;
  };

  const selectedChild = children.find(c => c.id === selectedChildId);

  // Helper to format date based on locale
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const locale = lang === 'th' ? 'th-TH' : 'en-US';
    return date.toLocaleDateString(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="px-4 py-3 border-b border-border/40 bg-icsn-pink/5">
      <h3 className="font-bold text-icsn-navy mb-2 flex items-center gap-1.5 text-[15px]">
        <Calendar className="w-4 h-4 text-icsn-pink" />
        <span>{dict.book.upcomingClasses}</span>
      </h3>
      
      <div className="flex flex-col gap-2">
        {childBookings.map((b, i) => {
          const allowed = isCancelAllowed(b.session_date);
          const timeLabel = b.session?.time_label || dict.book.sessionMorning;
          const displayDate = formatDate(b.session_date);
          
          return (
            <div key={b.id} className="flex items-center justify-between bg-white rounded-xl p-2.5 shadow-sm border border-border/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-icsn-pink/10 text-icsn-pink flex items-center justify-center font-black text-xs shrink-0">
                  {i + 1}
                </div>
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-medium text-muted-foreground truncate leading-tight mb-0.5">
                    {dict.book.childPrefix} {selectedChild?.nickname} · {timeLabel}
                  </p>
                  <p className="text-[15px] font-bold text-icsn-navy leading-none">
                    {displayDate}
                  </p>
                </div>
              </div>
              <button
                onClick={() => allowed && onCancelRequest(b.id)}
                disabled={!allowed}
                className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  allowed 
                    ? 'text-error hover:bg-error/10 active:scale-95 border border-error/20' 
                    : 'text-muted-foreground/50 bg-muted cursor-not-allowed border border-transparent'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {allowed ? dict.book.cancelBtn : dict.book.notAllowed}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
