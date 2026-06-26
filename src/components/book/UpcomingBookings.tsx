import React from 'react';
import { CalendarHeart } from 'lucide-react';
import type { Booking } from '@/types';

interface UpcomingBookingsProps {
  bookings: Booking[];
  selectedChildId: string;
  onCancelRequest: (bookingId: string) => void;
}

export function UpcomingBookings({ bookings, selectedChildId, onCancelRequest }: UpcomingBookingsProps) {
  const filtered = bookings.filter(b => !selectedChildId || b.child_id === selectedChildId);
  
  if (filtered.length === 0) return null;

  return (
    <div className="bg-white rounded-[20px] border border-gray-100 p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-4">
      <h3 className="font-bold text-[#211551] border-b border-gray-100 pb-3 flex items-center gap-1.5 text-base">
        <CalendarHeart className="w-5 h-5 text-[#00B0B9]" />
        <span>เธฃเธญเธเธ—เธตเนเธเธญเธเนเธงเน (Upcoming Classes)</span>
      </h3>
      
      <div className="space-y-3">
        {filtered.map(booking => {
          const bDate = new Date(booking.session_date);
          const isToday = bDate.toDateString() === new Date().toDateString();
          const isPast7AM = new Date().getHours() >= 7;
          const canCancel = !(isToday && isPast7AM);

          return (
            <div key={booking.id} className="bg-[#00B0B9]/5 border border-[#00B0B9]/20 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white shadow-sm border border-[#00B0B9]/20 text-[#00B0B9] rounded-[14px] flex flex-col items-center justify-center font-bold">
                    <span className="text-xs leading-none mb-0.5">{bDate.toLocaleDateString('th-TH', { month: 'short' })}</span>
                    <span className="text-lg leading-none">{bDate.getDate()}</span>
                  </div>
                  <div>
                    <p className="font-black text-[#211551] text-base">เธเนเธญเธ {booking.child?.nickname}</p>
                    <p className="text-sm font-bold text-[#00B0B9]">{booking.session?.time_label || 'เน€เธเนเธฒ (09:00 - 12:00)'}</p>
                  </div>
                </div>
                {canCancel ? (
                  <button 
                    onClick={() => onCancelRequest(booking.id)}
                    className="text-sm font-bold text-rose-500 bg-white shadow-sm px-3.5 py-2 rounded-[10px] border border-rose-100 hover:bg-rose-50 active:scale-95 transition"
                  >
                    เธขเธเน€เธฅเธดเธ
                  </button>
                ) : (
                  <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1.5 rounded-[10px]">เนเธกเนเธญเธเธธเธเธฒเธ•</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

