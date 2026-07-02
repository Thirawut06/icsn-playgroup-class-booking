import React from 'react';
import { ReceiptText, Hand, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

import type { Child, Session } from '@/types';

interface BookingSummaryProps {
  selectedDates: string[];
  selectedChildObj?: Child;
  creditsRemaining: number;
  sessions: Session[];
  selectedSessionsMap: Record<string, Session>;
  onSelectSessionMap: (dateStr: string, session: Session) => void;
  isSubmitting: boolean;
  bookingSuccess: boolean;
  bookingError: string;
  onBookClass: () => void;
  closures: import('@/types').SchoolClosure[];
  operatingDays?: number[];
  cutoffHour: number;
}

import { getThaiMonthMin, checkIsBookableDate } from '@/utils/dateUtils';
import { COPY } from '@/config/copy';

export function BookingSummary({
  selectedDates,
  selectedChildObj,
  creditsRemaining,
  sessions = [],
  selectedSessionsMap,
  onSelectSessionMap,
  isSubmitting,
  bookingSuccess,
  bookingError,
  onBookClass,
  closures,
  operatingDays = [0, 1, 2, 3, 4, 5, 6],
  cutoffHour
}: BookingSummaryProps) {
  
  // Sort selected dates chronologically
  const sortedDates = [...selectedDates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  // Check if ALL selected dates have a valid session selected
  const isAllSessionsSelected = sortedDates.length > 0 && sortedDates.every(date => !!selectedSessionsMap[date]);

  return (
    <div className="pb-6">
      {/* Section label */}
      <div className="px-4 pt-4 pb-3">
        <h3 className="font-bold text-icsn-navy flex items-center gap-1.5 text-base">
          <ReceiptText className="w-5 h-5 text-icsn-teal" />
          <span>{COPY.BOOKING_FLOW.STEP_3}</span>
        </h3>
      </div>

      {sortedDates.length === 0 ? (
        <div className="px-4 py-10 text-center space-y-2">
          <div className="inline-flex p-4 text-icsn-teal/20">
            <Hand className="w-10 h-10" />
          </div>
          <p className="text-base font-bold text-muted-foreground">{COPY.BOOKING_FLOW.SELECT_DATE_HINT}</p>
          <p className="text-sm text-muted-foreground/70">{COPY.BOOKING_FLOW.ADVANCE_NOTICE}</p>
        </div>
      ) : (
        <div>
          {/* Date rows — flat, no card wrapper */}
          {sortedDates.map((dateStr, index) => {
            const d = new Date(dateStr);
            const dayNum = String(d.getDate());
            const monthName = getThaiMonthMin(d);
            
            const dateAvailable = checkIsBookableDate(dateStr, closures, operatingDays, cutoffHour);
            const availableSessions = sessions
              .filter(s => s.session_date === dateStr)
              .sort((a, b) => {
                const m1 = (a.time_label || '').match(/(\d{1,2})[.:]/);
                const m2 = (b.time_label || '').match(/(\d{1,2})[.:]/);
                return (m1 ? parseInt(m1[1], 10) : 0) - (m2 ? parseInt(m2[1], 10) : 0);
              });

            const selectedSession = selectedSessionsMap[dateStr];

            return (
              <div key={dateStr} className="px-4 py-4 border-b border-border/40 last:border-0 space-y-3">
                {/* Metadata row */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                  <span className="font-bold text-icsn-navy text-base">{dayNum} {monthName}</span>
                  <span>&middot;</span>
                  {dateAvailable ? (
                    <span className="font-medium">คลาสที่ {index + 1}</span>
                  ) : (
                    <span className="font-bold text-error">ปิดรับจอง</span>
                  )}
                  {selectedChildObj && (
                    <>
                      <span>&middot;</span>
                      <span className="font-medium truncate min-w-0">น้อง {selectedChildObj.nickname}</span>
                    </>
                  )}
                </div>

                {/* Time Slots */}
                {dateAvailable && (
                  <div>
                    {availableSessions.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {availableSessions.map((session) => {
                          const availableSeats = Math.max(0, session.total_capacity - (session.booked_count || 0));
                          const isFull = availableSeats <= 0;
                          const isDisabled = !session.is_active || isFull;
                          const isSelected = selectedSession?.id === session.id;
                          
                          return (
                          <button
                            key={session.id}
                            onClick={() => !isDisabled && onSelectSessionMap(dateStr, session)}
                            disabled={isDisabled}
                            className={`w-full text-left px-4 py-2.5 rounded-lg font-bold text-sm transition-all flex justify-between items-center cursor-pointer ${
                              isDisabled
                                ? 'bg-muted/40 text-muted-foreground/40 cursor-not-allowed border border-transparent'
                                : isSelected
                                  ? 'bg-icsn-teal text-white shadow-sm border border-icsn-teal active:scale-[0.99]'
                                  : 'bg-background border border-border/80 text-icsn-navy hover:border-icsn-teal/40 hover:bg-muted/20 active:scale-[0.99]'
                              }`}
                          >
                            <span>{session.time_label || COPY.BOOKING_FLOW.SESSION_MORNING}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-md ${
                              isDisabled
                                ? 'bg-transparent text-muted-foreground/40'
                                : isSelected
                                  ? 'bg-white/20 text-white font-medium'
                                  : 'text-icsn-teal font-medium bg-icsn-teal/5 border border-icsn-teal/10'
                              }`}>
                              {!session.is_active ? (session.theme || 'ปิด') : isFull ? 'เต็มแล้ว' : `ว่าง ${availableSeats}`}
                            </span>
                          </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 py-2 text-muted-foreground text-sm">
                        <Loader2 className="w-4 h-4 animate-spin text-icsn-teal/50" />
                        <span>กำลังโหลด...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Error */}
          {bookingError && (
            <div className="mx-4 mt-2 bg-rose-50 text-rose-700 border border-rose-100 p-3 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-bold">{bookingError}</span>
            </div>
          )}

          {/* Summary Total */}
          {sortedDates.length > 0 && (
            <div className="mx-4 mt-6 flex items-center justify-between">
               <span className="text-sm font-bold text-muted-foreground">รวมทั้งหมด</span>
               <div className="text-right">
                 <span className="text-lg font-black text-icsn-navy">{sortedDates.length} วัน</span>
                 <p className="text-xs font-bold text-icsn-teal mt-0.5">ใช้ {sortedDates.length} เครดิต</p>
               </div>
            </div>
          )}

          {/* Action Button */}
          <div className="px-4 pt-3 pb-2">
            <button
              onClick={onBookClass}
              disabled={isSubmitting || bookingSuccess || sortedDates.length === 0 || creditsRemaining < sortedDates.length || !isAllSessionsSelected}
              className="w-full bg-icsn-teal hover:bg-icsn-teal/90 text-white py-4 rounded-2xl font-bold shadow-md transition-all flex items-center justify-center gap-2 text-base disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
            >
              {!isSubmitting ? (
                <span>ยืนยันการจองสิทธิ์ {sortedDates.length > 0 ? `(หัก ${sortedDates.length} เครดิต)` : ''}</span>
              ) : (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin h-5 w-5" />
                  กำลังทำรายการ...
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Warning rule — demoted to fine print so it doesn't compete with dynamic notices */}
      {sortedDates.length > 0 && (
        <div className="mx-4 mb-2 mt-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-warning" />
          <p className="text-xs font-medium text-muted-foreground leading-relaxed">
            {COPY.RULES.NO_CANCEL_AFTER_XAM(cutoffHour)}
          </p>
        </div>
      )}
    </div>
  );
}
